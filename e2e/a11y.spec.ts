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
