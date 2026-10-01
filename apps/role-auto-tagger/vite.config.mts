import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Contentful serves an uploaded bundle from a signed URL. Absolute asset paths resolve against the
  // CDN root, drop the signature and 403, which renders a blank app frame.
  base: './',
  test: {
    // The engine logs its decisions through an injected `log`, which is noise in a test run.
    silent: true,
    coverage: {
      provider: 'v8',
      // The engine is what the tests exercise. The config screen would need a DOM harness, and
      // reporting it as 0% would make the number meaningless rather than honest.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/__tests__/**'],
    },
  },
  plugins: [react()],
  server: {
    // Its own port, so it cannot collide with the other apps in a workspace, and strict so that Vite
    // fails rather than drifting to another port the app definition's `src` does not name.
    port: 3002,
    strictPort: true,
  },
  build: {
    outDir: 'build',
  },
});
