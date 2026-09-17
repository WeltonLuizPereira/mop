import { expect, test } from '@playwright/test';
import { stubSupabase } from '../test/supabaseFixtures';

test.beforeEach(async ({ page }) => { await stubSupabase(page); });

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Ilhas em operação' })).toBeVisible();
}

test('o corpo nunca rola na horizontal, do desktop ao celular', async ({ page }) => {
  await entrar(page);
  for (const w of [1440, 1024, 768, 390, 360, 320]) {
    await page.setViewportSize({ width: w, height: 900 });
    const estoura = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(estoura, `rolagem horizontal em ${w}px`).toBe(false);
  }
});

test('a grade usa quatro, duas e uma coluna conforme a largura', async ({ page }) => {
  await page.route('**/rest/v1/mop_ilhas*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'i1', nome: 'Ilha 01 — SAC', client_id: 'c1', operation_id: 'o1', coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO' },
      { id: 'i2', nome: 'Ilha 07 — Cobrança', client_id: 'c2', operation_id: 'o2', coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO' },
      { id: 'i3', nome: 'Ilha 11 — Retenção', client_id: 'c1', operation_id: 'o1', coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO' },
      { id: 'i4', nome: 'Ilha 12 — Vendas', client_id: 'c2', operation_id: 'o2', coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO' },
    ]),
  }));
  await entrar(page);
  const grade = page.locator('section[aria-labelledby="ilhas-title"] > div').last();
  const itens = grade.locator(':scope > article');
  await expect(itens).toHaveCount(5);

  const colunas = async (largura: number, quantosItens: number) => {
    await page.setViewportSize({ width: largura, height: 1000 });
    const caixas = await Promise.all(
      Array.from({ length: quantosItens }, async (_, indice) => (await itens.nth(indice).boundingBox())!),
    );
    return new Set(caixas.map(caixa => Math.round(caixa.x))).size;
  };

  // Os quatro primeiros são Geral + três ilhas: medir só botões de ilha deixa
  // uma grade de três colunas passar por engano.
  expect(await colunas(1440, 4)).toBe(4);
  expect(await colunas(1024, 4)).toBe(2);
  expect(await colunas(390, 2)).toBe(1);
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

test('os controles de toque do shell e dos detalhes medem ao menos 44px', async ({ page }) => {
  await entrar(page);
  await page.setViewportSize({ width: 390, height: 900 });

  const mede = async (controle: import('@playwright/test').Locator, nome: string) => {
    await expect(controle, nome).toBeVisible();
    const caixa = await controle.boundingBox();
    expect(caixa, `${nome} precisa ter uma caixa`).not.toBeNull();
    expect(caixa!.width, `${nome} precisa ter 44px de largura`).toBeGreaterThanOrEqual(44);
    expect(caixa!.height, `${nome} precisa ter 44px de altura`).toBeGreaterThanOrEqual(44);
  };

  await mede(page.getByRole('button', { name: 'Abrir menu' }), 'abrir menu');
  await mede(page.getByRole('button', { name: 'Usar tema escuro' }), 'trocar tema');
  await mede(page.getByRole('button', { name: 'Notificações' }), 'notificações');

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await mede(page.getByRole('button', { name: 'Fechar menu de navegação' }), 'fechar menu');
  await mede(page.getByRole('button', { name: 'Visão geral', exact: true }), 'item de navegação');
  await mede(page.getByRole('button', { name: 'Sair' }), 'sair');
  await page.getByRole('button', { name: 'Fechar menu de navegação' }).click();

  await mede(page.getByRole('button', { name: 'Ver detalhes consolidados' }), 'detalhes consolidados');
  await mede(page.getByRole('button', { name: 'Ver detalhes de Ilha 01 — SAC' }), 'detalhes da ilha');
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

test('o atalho foca o conteúdo e o Tab alcança a navegação e o detalhe da ilha', async ({ page }) => {
  await entrar(page);

  const atalho = page.getByRole('link', { name: 'Pular para o conteúdo' });
  const conteudo = page.getByRole('main');
  const abrirIlha = page.getByRole('button', { name: 'Abrir Ilha 01 — SAC' });
  await atalho.focus();
  await page.keyboard.press('Enter');
  await expect(conteudo).toBeFocused();

  for (let tentativa = 0; tentativa < 8 && !await abrirIlha.evaluate(el => document.activeElement === el); tentativa++) {
    await page.keyboard.press('Tab');
  }
  await expect(abrirIlha).toBeFocused();

  const temContorno = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && getComputedStyle(el).outlineStyle !== 'none';
  });
  expect(temContorno).toBe(true);

  await page.keyboard.press('Tab');
  const detalhes = page.getByRole('button', { name: 'Ocultar detalhes de Ilha 01 — SAC' });
  await expect(detalhes).toBeFocused();
  await expect(detalhes).toHaveAttribute('aria-expanded', 'true');
});

test('a gaveta móvel contém o Tab e o devolve ao início e ao fim', async ({ page }) => {
  await entrar(page);
  await page.setViewportSize({ width: 390, height: 900 });

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu principal' });
  const close = page.getByRole('button', { name: 'Fechar menu de navegação' });
  const sair = page.getByRole('button', { name: 'Sair' });
  await expect(close).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Visão geral', exact: true })).toBeFocused();
  for (let tentativa = 0; tentativa < 32 && !await sair.evaluate(el => document.activeElement === el); tentativa++) {
    await page.keyboard.press('Tab');
  }
  await expect(sair).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expect(dialog).toContainText('MOP');

  await page.keyboard.press('Shift+Tab');
  await expect(sair).toBeFocused();
});

test('o foco expande uma ilha e Enter abre sua lista filtrada', async ({ page }) => {
  await entrar(page);

  const abrirIlha = page.getByRole('button', { name: 'Abrir Ilha 07 — Cobrança' });
  await abrirIlha.focus();

  const detalhe = page.getByRole('button', { name: 'Ocultar detalhes de Ilha 07 — Cobrança' });
  await expect(detalhe).toHaveAttribute('aria-expanded', 'true');
  const regiao = page.getByRole('region', { name: 'Detalhes de Ilha 07 — Cobrança' });
  await expect(regiao).toContainText('PA contratada');
  await expect(regiao).toContainText(/férias/i);

  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveText('Colaboradores');
  await expect(page.getByText('Camila Souza Rocha')).toBeVisible();
  await expect(page.getByText('Adriana Lopes Ferreira')).toBeHidden();
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
