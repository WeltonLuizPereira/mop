import { defineConfig } from '@playwright/test';

const PORTA = 3100;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  // `fullyParallel: false` só serializa dentro do arquivo; os arquivos ainda
  // subiriam em paralelo contra o mesmo servidor de desenvolvimento, e aí o
  // primeiro `goto` de cada um estoura o tempo enquanto o Vite compila.
  workers: 1,
  use: { baseURL: `http://localhost:${PORTA}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npx vite --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
