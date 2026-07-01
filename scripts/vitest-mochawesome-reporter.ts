import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Reporter } from 'vitest/reporters';

const require = createRequire(import.meta.url);
const marge = require('mochawesome-report-generator') as {
  create(data: MochawesomeReport, options: Record<string, unknown>): Promise<unknown>;
};

type VitestMochawesomeReporterOptions = {
  jsonFile?: string;
  reportDir?: string;
  reportFilename?: string;
  reportTitle?: string;
  reportPageTitle?: string;
  inline?: boolean;
};

type VitestTestCase = any;
type VitestTestModule = any;
type VitestTestSuite = any;

type MochawesomeTest = {
  title: string;
  fullTitle: string;
  timedOut: boolean;
  duration: number;
  state: 'passed' | 'failed' | 'pending' | 'skipped';
  speed: 'fast' | 'medium' | 'slow';
  pass: boolean;
  fail: boolean;
  pending: boolean;
  context: string | null;
  code: string;
  err: { message?: string; estack?: string; stack?: string; diff?: string };
  uuid: string;
  parentUUID: string;
  isHook: false;
  skipped: boolean;
};

type MochawesomeSuite = {
  uuid: string;
  title: string;
  fullFile: string;
  file: string;
  beforeHooks: unknown[];
  afterHooks: unknown[];
  tests: MochawesomeTest[];
  suites: MochawesomeSuite[];
  passes: string[];
  failures: string[];
  pending: string[];
  skipped: string[];
  duration: number;
  root: boolean;
  rootEmpty: boolean;
  _timeout: number;
};

type MochawesomeReport = {
  stats: {
    suites: number;
    tests: number;
    passes: number;
    pending: number;
    failures: number;
    start: string;
    end: string;
    duration: number;
    testsRegistered: number;
    passPercent: number;
    pendingPercent: number;
    other: number;
    hasOther: boolean;
    skipped: number;
    hasSkipped: boolean;
  };
  results: MochawesomeSuite[];
  meta: Record<string, unknown>;
};

type Counters = {
  suites: number;
  tests: number;
  passes: number;
  pending: number;
  failures: number;
  skipped: number;
};

function uuid(input: string) {
  return createHash('sha1').update(input).digest('hex');
}

function toRelativeFile(moduleId: string) {
  return path.relative(process.cwd(), moduleId).replace(/\\/g, '/');
}

function readSnippet(file: string, line?: number) {
  if (!line || !existsSync(file)) return '';

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const start = Math.max(0, line - 3);
  const end = Math.min(lines.length, line + 2);
  return lines.slice(start, end).join('\n');
}

function suiteDuration(suite: VitestTestSuite | VitestTestModule) {
  if (suite.type === 'module') return suite.diagnostic().duration || 0;

  let duration = 0;
  for (const test of suite.children.allTests()) {
    duration += test.diagnostic()?.duration || 0;
  }
  return duration;
}

function serializeError(error: unknown) {
  const err = error as { message?: string; stack?: string; name?: string; diff?: string } | undefined;
  if (!err) return {};

  const message = err.message || String(error);
  const stack = err.stack || message;
  return {
    message,
    estack: stack,
    stack,
    diff: err.diff,
  };
}

function serializeTest(test: VitestTestCase, parentUUID: string, counters: Counters): MochawesomeTest {
  const result = test.result();
  const diagnostic = test.diagnostic();
  const duration = diagnostic?.duration || 0;
  const isFailed = result.state === 'failed';
  const isPassed = result.state === 'passed';
  const isSkipped = result.state === 'skipped';
  const state = isSkipped ? 'skipped' : result.state === 'pending' ? 'pending' : result.state;

  counters.tests += 1;
  if (isPassed) counters.passes += 1;
  if (isFailed) counters.failures += 1;
  if (state === 'pending') counters.pending += 1;
  if (isSkipped) counters.skipped += 1;

  return {
    title: test.name,
    fullTitle: test.fullName,
    timedOut: false,
    duration,
    state,
    speed: diagnostic?.slow ? 'slow' : duration > 75 ? 'medium' : 'fast',
    pass: isPassed,
    fail: isFailed,
    pending: state === 'pending',
    context: null,
    code: readSnippet(test.module.moduleId, test.location?.line),
    err: isFailed ? serializeError(result.errors?.[0]) : {},
    uuid: uuid(test.id),
    parentUUID,
    isHook: false,
    skipped: isSkipped,
  };
}

function createSuite(
  suite: VitestTestSuite | VitestTestModule,
  module: VitestTestModule,
  parentUUID: string | undefined,
  counters: Counters,
): MochawesomeSuite {
  const suiteUUID = uuid(suite.id);
  const file = toRelativeFile(module.moduleId);
  const title = suite.type === 'module' ? '' : suite.name;
  const output: MochawesomeSuite = {
    uuid: suiteUUID,
    title,
    fullFile: module.moduleId,
    file,
    beforeHooks: [],
    afterHooks: [],
    tests: [],
    suites: [],
    passes: [],
    failures: [],
    pending: [],
    skipped: [],
    duration: suiteDuration(suite),
    root: suite.type === 'module',
    rootEmpty: false,
    _timeout: 0,
  };

  if (parentUUID) {
    // mochawesome accepts extra properties; parentUUID keeps the report tree link explicit.
    (output as MochawesomeSuite & { parentUUID: string }).parentUUID = parentUUID;
  }

  counters.suites += 1;

  for (const child of suite.children) {
    if (child.type === 'test') {
      const serialized = serializeTest(child, suiteUUID, counters);
      output.tests.push(serialized);
      if (serialized.pass) output.passes.push(serialized.uuid);
      if (serialized.fail) output.failures.push(serialized.uuid);
      if (serialized.pending) output.pending.push(serialized.uuid);
      if (serialized.skipped) output.skipped.push(serialized.uuid);
    } else {
      output.suites.push(createSuite(child, module, suiteUUID, counters));
    }
  }

  output.rootEmpty = output.tests.length === 0 && output.suites.length === 0;
  return output;
}

export default function mochawesomeReporter(options: VitestMochawesomeReporterOptions = {}): Reporter {
  const jsonFile = options.jsonFile ?? 'reports/unit/mochawesome.json';
  const reportDir = options.reportDir ?? path.dirname(jsonFile);
  const reportFilename = options.reportFilename ?? path.basename(jsonFile, path.extname(jsonFile));
  const start = new Date();

  return {
    async onTestRunEnd(testModules, unhandledErrors) {
      const end = new Date();
      const counters: Counters = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0, skipped: 0 };
      const results = testModules.map((testModule) => createSuite(testModule, testModule, undefined, counters));

      counters.failures += unhandledErrors.length;

      const report: MochawesomeReport = {
        stats: {
          suites: counters.suites,
          tests: counters.tests,
          passes: counters.passes,
          pending: counters.pending,
          failures: counters.failures,
          start: start.toISOString(),
          end: end.toISOString(),
          duration: end.getTime() - start.getTime(),
          testsRegistered: counters.tests,
          passPercent: counters.tests ? (counters.passes / counters.tests) * 100 : 0,
          pendingPercent: counters.tests ? (counters.pending / counters.tests) * 100 : 0,
          other: 0,
          hasOther: false,
          skipped: counters.skipped,
          hasSkipped: counters.skipped > 0,
        },
        results,
        meta: {
          mocha: { version: 'vitest' },
          mochawesome: {
            version: '6.3.2',
            options: { reportDir, reportFilename },
          },
          vitest: true,
        },
      };

      await mkdir(path.dirname(jsonFile), { recursive: true });
      await writeFile(jsonFile, JSON.stringify(report, null, 2));
      await marge.create(report, {
        reportDir,
        reportFilename,
        reportTitle: options.reportTitle ?? 'Unit Test Report',
        reportPageTitle: options.reportPageTitle ?? 'Unit Test Report',
        inline: options.inline ?? true,
        overwrite: true,
        saveHtml: true,
        saveJson: false,
      });
    },
  };
}
