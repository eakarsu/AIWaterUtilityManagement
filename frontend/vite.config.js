import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const configured = loadEnv(mode, new URL('..', import.meta.url).pathname, '');
  const demoEmail = configured.VITE_DEMO_EMAIL || configured.DEMO_EMAIL || '';
  const demoPassword = configured.VITE_DEMO_PASSWORD || configured.DEMO_PASSWORD || '';
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(demoEmail),
      'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(demoPassword),
    },
    server: {
      port: Number(process.env.FRONTEND_PORT) || 5173,
      proxy: {
        '/api': `http://localhost:${process.env.BACKEND_PORT || 3001}`
      }
    }
  };
});
