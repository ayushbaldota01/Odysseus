import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Build - API Key check:', env.VITE_API_KEY ? 'VITE_API_KEY found' : 'VITE_API_KEY missing');
  console.log('Build - Legacy Key check:', env.GEMINI_API_KEY ? 'GEMINI_API_KEY found' : 'GEMINI_API_KEY missing');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    envPrefix: ['VITE_', 'GEMINI_'],
    plugins: [react()],
    define: {
      // Polyfill for code expecting process.env
      'process.env': {
        VITE_API_KEY: env.VITE_API_KEY || '',
        GEMINI_API_KEY: env.GEMINI_API_KEY || '',
        API_KEY: env.VITE_API_KEY || env.GEMINI_API_KEY || ''
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
