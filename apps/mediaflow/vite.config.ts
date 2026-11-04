/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Build targets: development, staging, app2, production (see .env.<mode>).
// Production builds to build/, every other mode to build-<mode>/.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  if (command === 'build' && mode !== 'test') {
    const backendUrl = env.VITE_BACKEND_URL;
    if (!backendUrl || !backendUrl.endsWith('/')) {
      throw new Error(`VITE_BACKEND_URL must be set and end with "/" in .env.${mode} (got: ${backendUrl})`);
    }
    console.log(`Building "${mode}" with BACKEND_URL ${backendUrl}`);
  }

  return {
    plugins: [react()],
    base: '',
    build: {
      outDir: mode === 'production' ? 'build' : `build-${mode}`,
    },
    server: {
      host: 'localhost',
      port: 3000,
    },
    test: {
      // Only the frontend tests. backend/ has its own tests, run with node:test (`npm test` in backend/).
      include: ['test/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        reporter: ['text', 'html'],
      },
    },
  };
});
