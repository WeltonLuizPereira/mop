import { expect, test, type Page } from '@playwright/test';
import { stubSupabase } from '../test/supabaseFixtures';

/** Todo item de navegação visível para ADMIN, com um texto que prova a tela. */
const ROTAS: Array<[string, string]> = [
  ['Visão geral', 'Visão geral'],
  ['Dashboard', 'Dashboard'],
  ['Colaboradores', 'Colaboradores'],
  ['Organograma', 'Organograma'],
  ['Turnover', 'Turnover'],
  ['Aniversariantes', 'Aniversariantes'],
  ['Desligados', 'Desligados'],
  ['Vencimento de contratos', 'Vencimento de contratos'],
  ['Férias', 'Férias'],
  ['Aviso prévio', 'Aviso prévio'],
  ['Afastados e licenças', 'Afastados e licenças'],
  ['Clientes', 'Clientes'],
  ['Operações', 'Operações'],
  ['Ilhas', 'Ilhas'],
  ['Coordenadores', 'Coordenadores'],
  ['Supervisores', 'Supervisores'],
  ['Usuários', 'Usuários'],
  ['Tarefas agendadas', 'Tarefas agendadas'],
  ['Importar dados', 'Importar dados'],
  ['Update em massa', 'Update em massa'],
  ['Histórico', 'Histórico'],
  ['Resetar dados', 'Resetar dados'],
  ['Sobre', 'Sobre'],
];

async function entrar(page: Page) {
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Visão geral').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await stubSupabase(page);
});

test('entra no sistema com matrícula e senha', async ({ page }) => {
  await entrar(page);
});

test('todas as 23 telas abrem sem erro de console', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(String(e)));

  await entrar(page);

  for (const [item] of ROTAS) {
    // Rótulo do menu e título da página vêm da mesma fonte (lib/navigation.ts),
    // então os dois textos são idênticos agora. Por isso a prova de navegação
    // é o <h1> do Header — o título da tela — e não o próprio item da barra
    // lateral, que já está visível antes do clique.
    await page.getByRole('button', { name: item, exact: true }).click();
    await expect(page.locator('h1')).toHaveText(item);
  }

  expect(erros, `erros de console:\n${erros.join('\n')}`).toEqual([]);
});

test('o rodape do login mostra a versao do package.json', async ({ page }) => {
  await page.goto('/');
  // `npm version minor` sobe o numero; `lib/versao.ts` some com o patch zerado
  await expect(page.getByText(/MOP v/)).toHaveText(/MOP v\d+\.\d+/);
});

test('o tile do mapa abre a lista recortada pela ilha clicada', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: /Ilha 07 — Cobranca|Ilha 07 — Cobrança/ }).click();

  await expect(page.locator('h1')).toHaveText('Colaboradores');
  await expect(page.getByText('Camila Souza Rocha')).toBeVisible();
  await expect(page.getByText('Adriana Lopes Ferreira')).toBeHidden();
});

test('voltar a Colaboradores pelo menu devolve a lista inteira', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: /Ilha 07 — Cobranca|Ilha 07 — Cobrança/ }).click();
  await expect(page.getByText('Adriana Lopes Ferreira')).toBeHidden();

  // pedir Colaboradores pelo menu e pedir a lista toda, nao o recorte anterior
  await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
  await page.getByRole('button', { name: 'Colaboradores', exact: true }).click();

  await expect(page.getByText('Adriana Lopes Ferreira')).toBeVisible();
  await expect(page.getByText('Camila Souza Rocha')).toBeVisible();
});
