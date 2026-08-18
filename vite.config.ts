/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    const now = new Date();
    const versionStr = `1.1.${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(versionStr),
        '__UPDATE_DATE__': JSON.stringify(dateStr)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx'],
        // `.worktrees` guarda cópias de outros branches com node_modules
        // próprio: sem excluí-las, `npm test` roda o código de outro branch
        exclude: ['node_modules/**', 'e2e/**', 'dist/**', '.worktrees/**'],
      },
    };
});
