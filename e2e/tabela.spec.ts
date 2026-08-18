import { expect, test, type Page } from '@playwright/test';
import { stubSupabase } from '../test/supabaseFixtures';

test.beforeEach(async ({ page }) => { await stubSupabase(page); });

async function abrirColaboradores(page: Page) {
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: 'Colaboradores', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Colaboradores');
}

test('a linha sob o cursor recebe a régua da cor de ação', async ({ page }) => {
  await abrirColaboradores(page);
  const primeira = page.locator('tbody tr').first();
  const celula = primeira.locator('td').first();

  await primeira.hover();
  const sombra = await celula.evaluate(el => getComputedStyle(el).boxShadow);

  // --brand no tema claro é #F27405
  expect(sombra).toContain('rgb(242, 116, 5)');
  expect(sombra).toContain('inset');
});

test('os recortes ficam embutidos atrás do chip, em toda tela que os tem', async ({ page }) => {
  await abrirColaboradores(page);

  const painel = page.getByText('Recortar a lista');
  await expect(painel, 'o painel abre fechado').toBeHidden();

  const chip = page.getByRole('button', { name: /Filtros/ });
  await expect(chip).toHaveAttribute('aria-expanded', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-expanded', 'true');
  await expect(painel).toBeVisible();
  await expect(page.getByRole('button', { name: 'Coordenador', exact: true })).toBeVisible();

  await chip.click();
  await expect(painel).toBeHidden();

  // e a tela de Desligados usa exatamente a mesma barra
  await page.getByRole('button', { name: 'Desligados', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Desligados');
  await expect(page.getByText('Recortar a lista')).toBeHidden();
  await page.getByRole('button', { name: /Filtros/ }).click();
  await expect(page.getByText('Recortar a lista')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Coordenador', exact: true })).toBeVisible();
});

test('o cabeçalho ordena a lista e anuncia o sentido', async ({ page }) => {
  await abrirColaboradores(page);
  const nomes = () => page.locator('tbody tr td:nth-child(2) span:first-child').allTextContents();

  // o menu lateral também tem "Ilhas": a ordenação é a do cabeçalho
  const ilha = page.getByRole('columnheader', { name: 'Ilha' }).getByRole('button');
  await ilha.click();
  await expect(page.getByRole('columnheader', { name: 'Ilha' })).toHaveAttribute('aria-sort', 'ascending');
  const crescente = await nomes();

  await ilha.click();
  await expect(page.getByRole('columnheader', { name: 'Ilha' })).toHaveAttribute('aria-sort', 'descending');
  const decrescente = await nomes();

  expect(decrescente).toEqual([...crescente].reverse());
});
