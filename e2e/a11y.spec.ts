import { expect, test } from '@playwright/test';
import { stubSupabase } from '../test/supabaseFixtures';

test.beforeEach(async ({ page }) => { await stubSupabase(page); });

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Ilhas em operação')).toBeVisible();
}

test('o corpo nunca rola na horizontal, do desktop ao celular', async ({ page }) => {
  await entrar(page);
  for (const w of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width: w, height: 900 });
    const estoura = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(estoura, `rolagem horizontal em ${w}px`).toBe(false);
  }
});

test('abaixo do desktop a navegação continua alcançável', async ({ page }) => {
  await entrar(page);
  await page.setViewportSize({ width: 390, height: 900 });

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Colaboradores', exact: true }).click();

  await expect(page.locator('h1')).toHaveText('Colaboradores');
  // a gaveta se fecha ao navegar — senão cobre a tela que a pessoa pediu
  await expect(page.getByRole('button', { name: 'Colaboradores', exact: true })).toBeHidden();
});

test('a lista de colaboradores rola até o último nome', async ({ page }) => {
  // 60 pessoas: o suficiente para passar da altura da janela em qualquer tela
  const muitos = Array.from({ length: 60 }, (_, i) => ({
    matricula: String(1000 + i),
    nome: `Colaborador ${String(i).padStart(2, '0')}`,
    status: 'ATIVO',
    dt_entrada_produto: '2025-01-10',
  }));
  await page.route('**/rest/v1/mop_collaborators*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(muitos) }));

  await entrar(page);
  await page.getByRole('button', { name: 'Colaboradores', exact: true }).click();
  await expect(page.getByText('Colaborador 00')).toBeVisible();

  // rola como gente rola: roda do mouse sobre a lista. `scrollIntoView` nao
  // serve aqui — ele alcanca conteudo mesmo dentro de `overflow: hidden`, que
  // e justamente o que prende a lista, e o teste passaria com o bug em pe.
  await page.getByText('Colaborador 00').hover();
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 800);

  await expect(page.getByText('Colaborador 59')).toBeInViewport();
});

test('a navegação por teclado chega aos tiles com foco visível', async ({ page }) => {
  await entrar(page);
  await page.keyboard.press('Tab');
  const temContorno = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    return getComputedStyle(el).outlineStyle !== 'none';
  });
  expect(temContorno).toBe(true);
});

test('o tema alterna e persiste entre recargas', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Usar tema escuro' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('nenhum status é comunicado só por cor', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Colaboradores' }).click();
  const linha = page.locator('tbody tr').first();
  await expect(linha).toContainText(/ativo|férias|afastado|aviso|realocado|desligado|licença/i);
});
