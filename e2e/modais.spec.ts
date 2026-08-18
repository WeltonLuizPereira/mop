import { expect, test, type Page } from '@playwright/test';
import { stubSupabase } from '../test/supabaseFixtures';

test.beforeEach(async ({ page }) => { await stubSupabase(page); });

async function entrar(page: Page) {
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.locator('h1').waitFor();
}

async function irPara(page: Page, tela: string) {
  await page.getByRole('button', { name: tela, exact: true }).click();
  await expect(page.locator('h1')).toHaveText(tela);
}

/**
 * Um diálogo tem de cobrir a janela inteira. Quando algum ancestral tem
 * `transform`, ele vira bloco de contenção do `position: fixed` e o diálogo
 * passa a se medir pela caixa de conteúdo da página — foi o que jogava os
 * modais de cadastro para fora da área visível.
 */
async function conferirCobreAJanela(page: Page) {
  const medida = await page.evaluate(() => {
    const dialogo = document.querySelector('[role="dialog"]');
    const fundo = dialogo?.parentElement;
    if (!fundo) return null;
    const r = fundo.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, jw: innerWidth, jh: innerHeight };
  });

  expect(medida, 'nenhum diálogo aberto').not.toBeNull();
  expect(medida!.x).toBe(0);
  expect(medida!.y).toBe(0);
  expect(medida!.w).toBe(medida!.jw);
  expect(medida!.h).toBe(medida!.jh);
}

test('o cadastro de CADASTROS abre sobre a janela inteira', async ({ page }) => {
  await entrar(page);
  await irPara(page, 'Clientes');
  await page.getByRole('button', { name: 'Novo' }).click();

  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', 'Novo cliente');
  await conferirCobreAJanela(page);
});

test('a confirmação de exclusão também abre sobre a janela inteira', async ({ page }) => {
  await entrar(page);
  await irPara(page, 'Clientes');
  await page.getByRole('row', { name: /Vivo/ }).getByRole('button').last().click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await conferirCobreAJanela(page);
});

test('o cadastro de colaborador abre sobre a janela inteira', async ({ page }) => {
  await entrar(page);
  await irPara(page, 'Colaboradores');
  await page.getByRole('button', { name: 'Novo colaborador' }).click();

  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', 'Novo colaborador');
  await conferirCobreAJanela(page);
});

test('o diálogo fecha no Esc e devolve o foco a quem o abriu', async ({ page }) => {
  await entrar(page);
  await irPara(page, 'Clientes');
  const novo = page.getByRole('button', { name: 'Novo' });
  await novo.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(novo).toBeFocused();
});

test('o fundo não rola enquanto o diálogo está aberto', async ({ page }) => {
  await entrar(page);
  await irPara(page, 'Clientes');
  await page.getByRole('button', { name: 'Novo' }).click();

  const travado = await page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(travado).toBe('hidden');

  await page.keyboard.press('Escape');
  const solto = await page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(solto).not.toBe('hidden');
});
