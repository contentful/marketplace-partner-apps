import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  build: {
    outDir: process.env['BUILD_PATH'] || './build',
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8' as const,
      reporter: ['text-summary', 'text', 'lcov'],
      include: ['functions/**/*.ts', 'src/**/*.{ts,tsx}'],
      reportsDirectory: './coverage',
      thresholds: {
        'functions/**/*.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
}))
