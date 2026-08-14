import { expect, test, type Page } from '@playwright/test';
import { stubSupabase } from '../test/supabaseFixtures';

/** Todo item de navegação visível para ADMIN, com um texto que prova a tela. */
const ROTAS: Array<[string, string]> = [
  ['Visão Geral', 'Visão Geral'],
  ['Colaboradores', 'Gestão de Colaboradores'],
  ['Organograma', 'Organograma Operacional'],
  ['Turnover', 'Turnover'],
  ['Aniversariantes', 'Aniversariantes'],
  ['Desligados', 'Colaboradores Desligados'],
  ['Vencimento Contratos', 'Contratos Vencendo'],
  ['Férias', 'Gestão de Férias'],
  ['Aviso Prévio', 'Aviso Prévio'],
  ['Afastados / Licenças', 'Afastados / Licenças'],
  ['Clientes', 'Clientes'],
  ['Operações', 'Operações'],
  ['Ilhas', 'Ilhas'],
  ['Coordenadores', 'Coordenadores'],
  ['Supervisores', 'Supervisores'],
  ['Usuários', 'Usuários do Sistema'],
  ['Tarefas Agendadas', 'Tarefas Agendadas'],
  ['Importar Dados', 'Importar Dados'],
  ['Update em Massa', 'Update em Massa'],
  ['Histórico', 'Histórico de Atividades'],
  ['Resetar Dados', 'Resetar Dados'],
  ['Sobre', 'Sobre o Sistema'],
];

async function entrar(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder(/3924/i).fill('3924');
  await page.locator('input[type="password"]').fill('senha-de-teste');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByText('Visão Geral').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await stubSupabase(page);
});

test('entra no sistema com matrícula e senha', async ({ page }) => {
  await entrar(page);
});

test('todas as 22 telas abrem sem erro de console', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(String(e)));

  await entrar(page);

  for (const [item, prova] of ROTAS) {
    await page.getByRole('button', { name: item, exact: false })
      .or(page.getByText(item, { exact: true })).first().click();
    // Escopado a <main> e com exact:true. Dois motivos:
    // 1) Vários rótulos de menu coincidem com o título da própria página
    //    (ex.: "Turnover", "Clientes", "Ilhas"), e esse botão já está
    //    visível na barra lateral antes do clique — sem escopo, a asserção
    //    passaria mesmo que a navegação não trocasse o conteúdo.
    // 2) getByText por padrão é case-insensitive e por substring: a própria
    //    tela de Dashboard mostra "-1% turnover mensal" no card de
    //    Desligados, que bateria com a prova "Turnover" sem exact:true.
    // O <main> é onde o Header renderiza getPageTitle(currentPage) em um
    // <h1> cujo texto é exatamente a prova, então exact:true é seguro.
    await expect(page.locator('main').getByText(prova, { exact: true }).first())
      .toBeVisible({ timeout: 10_000 });
  }

  expect(erros, `erros de console:\n${erros.join('\n')}`).toEqual([]);
});
