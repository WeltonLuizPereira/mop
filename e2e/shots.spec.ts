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

/**
 * Safras de 2026, em turmas de datas distintas, para a tela de Safra ter o que
 * mostrar. Ficam à parte dos 24 de cima para não mexer nas outras capturas:
 * mudar a data de entrada daquele grupo deslocaria Vencimento e Turnover.
 */
const SAFRAS: Array<[string, number, number, number]> = [
  // [data de entrada, quantas pessoas, quantas saíram, dias médios até sair]
  ['2026-01-05', 10, 2, 48],
  ['2026-01-19', 10, 4, 58],
  ['2026-02-09', 12, 3, 44],
  ['2026-03-02',  9, 2, 71],
  ['2026-03-16', 16, 3, 65],
  ['2026-04-13',  8, 1, 29],
  ['2026-05-11', 18, 5, 38],
  ['2026-06-08', 15, 2, 33],
  ['2026-07-06', 22, 1, 18],
  ['2026-08-03', 10, 0,  0],
];

const SOBRENOMES = ['Alves','Barbosa','Cardoso','Duarte','Esteves','Faria','Gomes','Henrique',
  'Iglesias','Justino','Klein','Lacerda','Moreira','Nunes','Oliveira','Pires','Quintana',
  'Ramos','Salles','Teixeira','Vidal','Werneck','Xavier','Zambrano'];

const DA_SAFRA = SAFRAS.flatMap(([entrada, quantos, sairam, dias], t) =>
  Array.from({ length: quantos }, (_, i) => {
    const saiu = i < sairam;
    const [ilhaId, , clientId, operationId] = ILHAS[(t + i) % ILHAS.length];
    const saida = new Date(new Date(entrada).getTime() + (dias + i * 7) * 864e5);
    return {
      matricula: String(7000 + t * 50 + i),
      nome: `${NOMES[(t * 3 + i) % NOMES.length].split(' ')[0]} ${SOBRENOMES[(t + i) % SOBRENOMES.length]}`,
      email: `s${t}${i}@q.com`,
      ilha_id: ilhaId, supervisor_id: 's1', coordinator_id: 'k1',
      operation_id: operationId, client_id: clientId,
      status: saiu ? 'DESLIGADO' : (i % 7 === 3 ? 'FÉRIAS' : 'ATIVO'),
      dt_entrada_produto: entrada,
      // uma saída fica sem data de propósito: é o caso que a tela avisa
      data_fim: saiu && !(t === 1 && i === 0) ? saida.toISOString().slice(0, 10) : '',
      horario_entrada: '06:00', horario_saida: '14:20',
      dt_nasc: '1995-03-11',
    };
  }));

const DADOS: Record<string, unknown[]> = {
  ...FIXTURES,
  mop_ilhas: ILHAS.map(([id, nome, clientId, operationId]) => ({
    id, nome, client_id: clientId, operation_id: operationId,
    coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO',
  })),
  mop_collaborators: [...COLABS, ...DA_SAFRA],
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

/**
 * Quem rola no MOP é um container dentro do shell, não o documento — então
 * `fullPage` capturava só a altura da janela e a metade de baixo de toda tela
 * ficava invisível na revisão. Soltar a altura do shell antes do clique faz o
 * documento crescer e o `fullPage` pegar a página inteira.
 */
async function soltarAltura(page: Page) {
  await page.addStyleTag({
    content: `
      main .overflow-y-auto { overflow: visible !important; }
      .h-screen { height: auto !important; min-height: 100vh; }
    `,
  });
}

const TELAS = [
  'Visão geral', 'Dashboard', 'Colaboradores', 'Organograma', 'Turnover', 'Safra', 'Aniversariantes',
  'Desligados', 'Vencimento de contratos', 'Férias', 'Aviso prévio',
  'Afastados e licenças', 'Clientes', 'Ilhas', 'Usuários', 'Importar dados',
  'Update em massa', 'Histórico', 'Sobre',
];

test('diálogos', async ({ page }) => {
  await stub(page);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.locator('h1').waitFor();

  await page.getByRole('button', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Novo' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/dialogo-cadastro.png` });
  await page.keyboard.press('Escape');

  await page.getByRole('row', { name: /Vivo/ }).getByRole('button').last().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/dialogo-exclusao.png` });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Colaboradores', exact: true }).click();
  await page.getByRole('button', { name: 'Novo colaborador' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/dialogo-colaborador.png` });
});

test('safra — detalhe de uma coorte', async ({ page }) => {
  await stub(page);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.getByLabel('Matrícula').fill('3924');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.locator('h1').waitFor();

  await page.getByRole('button', { name: 'Safra', exact: true }).click();
  await page.getByRole('row', { name: /Janeiro/ }).getByRole('button', { name: 'Ver turmas' }).click();
  await page.getByText('da safra continua na casa').waitFor();
  await soltarAltura(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/safra-detalhe.png`, fullPage: true });

  // o tooltip é o pedido principal: precisa aparecer na captura
  const painel = page.locator('.recharts-wrapper').first();
  const caixa = (await painel.boundingBox())!;
  await page.mouse.move(caixa.x + caixa.width * 0.32, caixa.y + caixa.height * 0.6);
  await page.waitForTimeout(500);
  await page.locator('section', { hasText: 'Quando a safra perdeu gente' }).first()
    .screenshot({ path: `${DIR}/safra-tooltip.png` });
});

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
      await soltarAltura(page);
      await page.waitForTimeout(500);
      const slug = tela.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await page.screenshot({
        path: `${DIR}/${tema}-${String(i + 1).padStart(2, '0')}-${slug}.png`,
        fullPage: true,
      });
    }
  });
}
