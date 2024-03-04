import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
    https: true,
  },
  plugins: [react(), mkcert()],
}));
