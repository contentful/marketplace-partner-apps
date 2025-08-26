import crypto from 'crypto';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const VENDOR_MISC_MIN_SIZE = 50 * 1024; // 50 KB

function hashId(id: string) {
  return crypto.createHash('md5').update(id).digest('hex').slice(0, 8);
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  base: '',
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id, { getModuleInfo }) {
          if (!id.includes('node_modules')) return;

          // Special handling: group all @contentful/* into one chunk
          if (id.includes('node_modules/@contentful/')) {
            return 'vendor-contentful';
          }

          // Special handling: group all @orangelogic-private/design-system/* into one chunk
          if (id.includes('node_modules/@orangelogic-private/design-system/')) {
            return 'vendor-design-system';
          }

          // Group all other node_modules into vendor, but small ones into vendor-misc
          const moduleInfo = getModuleInfo(id);
          if (moduleInfo?.code && moduleInfo.code.length < VENDOR_MISC_MIN_SIZE) {
            return 'vendor-misc';
          }

          // Hash the id for chunk name
          const modulePath = id.split('node_modules/')[1];
          return 'vendor-' + hashId(modulePath);
        },
      },
    }
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
});
