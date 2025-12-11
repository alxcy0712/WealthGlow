import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' means load ALL env vars, not just those with VITE_ prefix.
  // This is crucial for Vercel's "API_KEY" variable to be visible.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This replaces process.env.API_KEY in your code with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});