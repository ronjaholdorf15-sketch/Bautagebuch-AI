import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Safe load of env vars
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: './',
    define: {
      // Only define the specific API KEY. 
      // We rely on index.html polyfill for the general 'process' object to avoid build conflicts.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || '')
    }
  };
});