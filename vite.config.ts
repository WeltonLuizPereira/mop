/// <reference types="vitest/config" />
import { readFileSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function absImportTriggerPlugin() {
  let isRunning = false;
  return {
    name: 'abs-import-trigger',
    configureServer(server: any) {
      server.middlewares.use('/api/trigger-abs-import', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }
        if (isRunning) {
          res.statusCode = 409;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, status: 'already_running', message: 'A sincronização da BASE_ABS já está em andamento.' }));
        }

        isRunning = true;
        const vbsPath = path.resolve(__dirname, 'agent_abs', 'run_silent.vbs');
        const child = spawn('wscript.exe', [vbsPath], {
          cwd: __dirname,
          windowsHide: true,
          stdio: 'ignore'
        });

        child.on('close', (code: number) => {
          isRunning = false;
          res.statusCode = code === 0 ? 200 : 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: code === 0,
            status: code === 0 ? 'completed' : 'error',
            message: code === 0 ? 'Sincronização concluída com sucesso.' : `Falha ao sincronizar (código ${code}).`
          }));
        });

        child.on('error', (err: any) => {
          isRunning = false;
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, status: 'error', message: err.message }));
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // A versao e a do package.json, e nao um carimbo da hora do build: e um
    // numero que alguem escolhe subir. Bump com `npm version minor` (2.0 -> 2.1)
    // ou `npm version patch` (2.0 -> 2.0.1); `lib/versao.ts` decide como ela
    // aparece na tela. A data continua sendo a do build, que e o que "ultima
    // atualizacao" quer mesmo dizer.
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
    const dateStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), absImportTriggerPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(pkg.version),
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
