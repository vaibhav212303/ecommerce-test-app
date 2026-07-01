import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DEFAULT_OUTPUT = 'reports/unit/mochawesome.json';

export default class MochawesomeReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || process.env.MOCHAWESOME_JSON || DEFAULT_OUTPUT;
    this.start = new Date();
  }

  onTestRunStart() {
    this.start = new Date();
  }

  onTestRunEnd(testModules, unhandledErrors = []) {
    const end = new Date();
    const results = testModules.map((testModule) => this.#buildModuleSuite(testModule));
    const allTests = testModules.flatMap((testModule) => [...testModule.children.allTests()]);
    const failures = allTests.filter((test) => test.result().state === 'failed').length + unhandledErrors.length;
    const passes = allTests.filter((test) => test.result().state === 'passed').length;
    const pending = allTests.filter((test) => test.result().state === 'skipped').length;
    const tests = allTests.length + unhandledErrors.length;
    const duration = Math.max(0, end.getTime() - this.start.getTime());

    const report = {
      stats: {
        suites: results.reduce((count, suite) => count + countSuites(suite), 0),
        tests,
        passes,
        pending,
        failures,
        start: this.start.toISOString(),
        end: end.toISOString(),
        duration,
        testsRegistered: tests,
        passPercent: tests ? (passes / tests) * 100 : 0,
        pendingPercent: tests ? (pending / tests) * 100 : 0,
        other: 0,
        hasOther: false,
        skipped: pending,
        hasSkipped: pending > 0,
      },
      results: appendUnhandledErrors(results, unhandledErrors),
      meta: {
        mocha: { version: 'vitest' },
        mochawesome: {
          version: 'custom-vitest-reporter',
          options: {
            reportDir: path.dirname(this.outputFile),
            reportFilename: path.basename(this.outputFile, '.json'),
          },
        },
        marge: {},
      },
    };

    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, `${JSON.stringify(report, null, 2)}\n`);
  }

  #buildModuleSuite(testModule) {
    const uuid = randomUUID();
    const file = normalizePath(testModule.relativeModuleId || testModule.moduleId || '');
    const suite = this.#buildSuite(testModule, {
      uuid,
      title: '',
      file,
      fullFile: normalizePath(testModule.moduleId || file),
      root: true,
    });
    suite.duration = testModule.diagnostic?.().duration || suite.duration;
    return suite;
  }

  #buildSuite(entity, overrides = {}) {
    const uuid = overrides.uuid || randomUUID();
    const file = overrides.file || normalizePath(entity.module?.relativeModuleId || entity.relativeModuleId || '');
    const fullFile = overrides.fullFile || normalizePath(entity.module?.moduleId || entity.moduleId || file);
    const children = [...entity.children];
    const tests = children.filter((child) => child.type === 'test').map((test) => this.#buildTest(test, uuid, file));
    const suites = children.filter((child) => child.type === 'suite').map((suite) => this.#buildSuite(suite, { file, fullFile }));
    const duration = tests.reduce((sum, test) => sum + (test.duration || 0), 0) + suites.reduce((sum, suite) => sum + (suite.duration || 0), 0);

    return {
      uuid,
      title: overrides.title ?? entity.name,
      fullFile,
      file,
      beforeHooks: [],
      afterHooks: [],
      tests,
      suites,
      passes: tests.filter((test) => test.pass).map((test) => test.uuid),
      failures: tests.filter((test) => test.fail).map((test) => test.uuid),
      pending: tests.filter((test) => test.pending).map((test) => test.uuid),
      skipped: tests.filter((test) => test.skipped).map((test) => test.uuid),
      duration,
      root: Boolean(overrides.root),
      rootEmpty: tests.length === 0 && suites.length === 0,
      _timeout: 0,
    };
  }

  #buildTest(test, parentUUID, file) {
    const result = test.result();
    const diagnostic = test.diagnostic?.();
    const state = result.state === 'skipped' ? 'pending' : result.state;
    const err = result.state === 'failed' ? serializeError(result.errors?.[0]) : {};

    return {
      title: test.name,
      fullTitle: test.fullName,
      timedOut: false,
      duration: diagnostic?.duration || 0,
      state,
      speed: getSpeed(diagnostic?.duration || 0),
      pass: result.state === 'passed',
      fail: result.state === 'failed',
      pending: result.state === 'skipped',
      context: null,
      code: '',
      err,
      uuid: randomUUID(),
      parentUUID,
      isHook: false,
      skipped: result.state === 'skipped',
      file,
    };
  }
}

function appendUnhandledErrors(results, unhandledErrors) {
  if (!unhandledErrors.length) return results;

  const uuid = randomUUID();
  return [
    ...results,
    {
      uuid,
      title: 'Unhandled Vitest errors',
      fullFile: '',
      file: '',
      beforeHooks: [],
      afterHooks: [],
      tests: unhandledErrors.map((error) => ({
        title: error.message || 'Unhandled error',
        fullTitle: error.message || 'Unhandled error',
        timedOut: false,
        duration: 0,
        state: 'failed',
        speed: 'fast',
        pass: false,
        fail: true,
        pending: false,
        context: null,
        code: '',
        err: serializeError(error),
        uuid: randomUUID(),
        parentUUID: uuid,
        isHook: false,
        skipped: false,
        file: '',
      })),
      suites: [],
      passes: [],
      failures: [],
      pending: [],
      skipped: [],
      duration: 0,
      root: true,
      rootEmpty: false,
      _timeout: 0,
    },
  ];
}

function serializeError(error = {}) {
  return {
    message: error.message || String(error),
    estack: error.stack || error.message || String(error),
    diff: error.diff || null,
    actual: error.actual,
    expected: error.expected,
  };
}

function countSuites(suite) {
  return (suite.root ? 0 : 1) + suite.suites.reduce((count, child) => count + countSuites(child), 0);
}

function getSpeed(duration) {
  if (duration > 75) return 'slow';
  if (duration > 40) return 'medium';
  return 'fast';
}

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/');
}
