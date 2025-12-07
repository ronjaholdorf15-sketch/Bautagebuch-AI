import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Safe load of env vars
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    // Ensure base path is relative for simpler deployments
    base: './',
    define: {
      // Safely pass the API Key. Checks VITE_API_KEY first (standard), then API_KEY (fallback)
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
      // define process.env to empty object to prevent "process is not defined" crashes in 3rd party libs
      'process.env': {}
    }
  };
});