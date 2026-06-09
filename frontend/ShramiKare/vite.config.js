import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env': env,
    },
    server: {
      port: 5173,
      proxy: {
        // Proxy /api requests to FastAPI backend
        // FastAPI backend routes: /users/, /facilities/ etc. at port 8000
        // Frontend calls: /api/users/, /api/facilities/ etc.
        // Rewrite: strip /api prefix before forwarding to backend
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
