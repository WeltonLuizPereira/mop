import { test, type Page } from '@playwright/test';
import { FIXTURES } from '../test/supabaseFixtures';

const DIR = process.env.SHOT_DIR ?? 'test-results/shots';

/** Densidade suficiente para julgar o desenho: 9 ilhas e 24 pessoas. Os nomes
 *  imitam os reais — caixa alta e compridos, o caso difícil para o tile. */
const ILHAS = [
  ['i1', 'VR SDR', 'c1', 'o1'],
  ['i2', 'OUTBOUND-VIDEO', 'c2', 'o2'],
  ['i3', 'IMPLANTACAO_CANAIS', 'c1', 'o1'],
  ['i4', 'CAIXA PRE PAGO', 'c1', 'o1'],
  ['i5', 'OUTBOUND', 'c2', 'o2'],
  ['i6', 'CROSS SELLING VENDAS MAILING', 'c2', 'o2'],
  ['i7', 'IMPLANTAÇÃO TELEVENDAS', 'c2', 'o2'],
  ['i8', 'INBOUND', 'c1', 'o1'],
  ['i9', 'ATIVO RETENÇÃO CARTEIRA', 'c1', 'o1'],
];

const NOMES = [
  'Adriana Lopes Ferreira', 'Bruno Cardoso Alves', 'Camila Souza Rocha',
  'Diego Nunes Barbosa', 'Eduarda Martins Pinto', 'Fábio Henrique Costa',
  'Gabriela Nascimento Reis', 'Henrique Dias Moreira', 'Isabela Ramos Teixeira',
  'João Vitor Almeida', 'Karina Freitas Lopes', 'Lucas Andrade Pires',
  'Mariana Coelho Braga', 'Nathan Oliveira Cruz', 'Otávio Prado Salles',
  'Patrícia Gomes Vidal', 'Rafael Monteiro Lins', 'Sabrina Duarte Faria',
  'Thiago Bastos Ferraz', 'Vanessa Ribeiro Lacerda', 'William Tavares Sá',
  'Yasmin Correia Mendes', 'Alexandre Pinho Vaz', 'Beatriz Sanches Rocha',
];

const STATUS = [
  'ATIVO', 'ATIVO', 'FÉRIAS', 'AVISO PRÉVIO', 'ATIVO', 'AFASTADO',
  'LICENÇA MATERNIDADE', 'REALOCADO', 'DESLIGADO', 'ATIVO', 'ATIVO', 'FÉRIAS',
  'ATIVO', 'ATIVO', 'AFASTADO', 'ATIVO', 'ATIVO', 'AVISO PRÉVIO',
  'ATIVO', 'ATIVO', 'FÉRIAS', 'ATIVO', 'ATIVO', 'ATIVO',
];

const COLABS = NOMES.map((nome, i) => {
  const [ilhaId, , clientId, operationId] = ILHAS[i % ILHAS.length];
  const status = STATUS[i];
  // a REST devolve snake_case; o mockDb é quem traduz para camelCase
  return {
    matricula: String(4000 + i), nome, email: `p${i}@q.com`,
    ilha_id: ilhaId, supervisor_id: 's1', coordinator_id: 'k1',
    operation_id: operationId, client_id: clientId,
    status,
    dt_entrada_produto: `2025-0${(i % 8) + 1}-1${(i % 9) + 1}`,
    data_fim: status === 'AVISO PRÉVIO' ? '2026-08-31' : '',
    ferias_inicio: status === 'FÉRIAS' ? '2026-08-03' : '',
    ferias_fim: status === 'FÉRIAS' ? '2026-08-22' : '',
    data_afastamento: status === 'AFASTADO' ? '2026-07-14' : '',
    horario_entrada: '06:00', horario_saida: '14:20',
    dt_nasc: `199${i % 9}-0${(i % 9) + 1}-1${(i % 9) + 1}`,
  };
});

const DADOS: Record<string, unknown[]> = {
  ...FIXTURES,
  mop_ilhas: ILHAS.map(([id, nome, clientId, operationId]) => ({
    id, nome, client_id: clientId, operation_id: operationId,
    coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO',
  })),
  mop_collaborators: COLABS,
};

async function stub(page: Page) {
  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1]?.split('?')[0] ?? '';
    if (route.request().method() !== 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(DADOS[table] ?? []),
    });
  });
}

const TELAS = [
  'Visão geral', 'Colaboradores', 'Organograma', 'Turnover', 'Aniversariantes',
  'Desligados', 'Vencimento de contratos', 'Férias', 'Aviso prévio',
  'Afastados e licenças', 'Clientes', 'Ilhas', 'Usuários', 'Importar dados',
  'Update em massa', 'Histórico', 'Sobre',
];

for (const tema of ['claro', 'escuro'] as const) {
  test(`telas — tema ${tema}`, async ({ page }) => {
    test.setTimeout(240_000);
    await stub(page);
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(t => {
      localStorage.setItem('mop-theme', t === 'escuro' ? 'dark' : 'light');
    }, tema);

    await page.goto('/');
    await page.screenshot({ path: `${DIR}/${tema}-00-entrar.png`, fullPage: true });

    await page.getByLabel('Matrícula').fill('3924');
    await page.getByLabel('Senha').fill('senha-de-teste');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.locator('h1').waitFor();

    for (const [i, tela] of TELAS.entries()) {
      await page.getByRole('button', { name: tela, exact: true }).click();
      await page.locator('h1').filter({ hasText: tela }).waitFor();
      await page.waitForTimeout(500);
      const slug = tela.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await page.screenshot({
        path: `${DIR}/${tema}-${String(i + 1).padStart(2, '0')}-${slug}.png`,
        fullPage: true,
      });
    }
  });
}
