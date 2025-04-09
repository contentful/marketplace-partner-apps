import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { defineConfig as defineVitest } from 'vitest/config';
export default defineConfig(() => ({
base: '', // relative paths
server: {
    port: 3000,
},
plugins: [react()],
test: {
    environment: 'jsdom',
    globals: true
}
}));
