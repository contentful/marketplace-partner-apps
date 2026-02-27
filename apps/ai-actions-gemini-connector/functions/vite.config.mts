import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
})
