import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Only expose explicitly public configuration, never server/CI credentials.
  const publicEnv = loadEnv(mode, process.cwd(), 'REACT_APP_');
  return {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify({
        ...publicEnv, NODE_ENV: mode === 'production' ? 'production' : 'development',
      }),
    },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: { outDir: 'build', assetsDir: 'static', sourcemap: false },
    server: { proxy: { '/api': 'http://localhost:8000' } },
  };
});
