import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import mochawesomeReporter from './scripts/vitest-mochawesome-reporter';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/playwright/**'],
    reporters: [
      'default',
      mochawesomeReporter({
        jsonFile: 'reports/unit/mochawesome.json',
        reportDir: 'reports/unit',
        reportFilename: 'mochawesome',
      }),
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
