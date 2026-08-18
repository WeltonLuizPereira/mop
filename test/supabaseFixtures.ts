/**
 * O que a REST do Supabase devolve — portanto em snake_case, como no banco.
 * É o `mockDb` que traduz para camelCase; fixture em camelCase chega com
 * `ilha_id` indefinido e desliga cada pessoa da sua ilha em silêncio.
 */
export const FIXTURES: Record<string, unknown[]> = {
  mop_users: [
    { id: '3924', matricula: '3924', nome: 'Welton Pereira',
      email: 'welton@qualitycontactcenter.com.br', role: 'ADMIN',
      password: 'senha-de-teste', status: 'ATIVO' },
  ],
  mop_clients: [
    { id: 'c1', nome: 'Vivo', status: 'ATIVO', logo: '' },
    { id: 'c2', nome: 'Enel', status: 'ATIVO', logo: '' },
  ],
  mop_operations: [
    { id: 'o1', nome: 'Móvel', client_id: 'c1', status: 'ATIVO' },
    { id: 'o2', nome: 'Residencial', client_id: 'c2', status: 'ATIVO' },
  ],
  mop_coordinators: [{ id: 'k1', nome: 'Marcos Vinícius', status: 'ATIVO' }],
  mop_supervisors: [
    { id: 's1', nome: 'Juliana Prado', coordinator_ids: ['k1'], status: 'ATIVO' },
  ],
  mop_ilhas: [
    { id: 'i1', nome: 'Ilha 01 — SAC', client_id: 'c1', operation_id: 'o1',
      coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO' },
    { id: 'i2', nome: 'Ilha 07 — Cobrança', client_id: 'c2', operation_id: 'o2',
      coordinator_ids: ['k1'], supervisor_ids: ['s1'], status: 'ATIVO' },
  ],
  mop_collaborators: [
    { matricula: '4127', nome: 'Adriana Lopes Ferreira', email: 'a@q.com',
      ilha_id: 'i1', supervisor_id: 's1', coordinator_id: 'k1',
      operation_id: 'o1', client_id: 'c1', status: 'ATIVO',
      dt_entrada_produto: '2025-03-12', horario_entrada: '06:00',
      horario_saida: '14:20', dt_nasc: '1995-04-02' },
    { matricula: '3942', nome: 'Camila Souza Rocha', email: 'c@q.com',
      ilha_id: 'i2', supervisor_id: 's1', coordinator_id: 'k1',
      operation_id: 'o2', client_id: 'c2', status: 'FÉRIAS',
      dt_entrada_produto: '2024-11-22', horario_entrada: '06:00',
      horario_saida: '14:20', dt_nasc: '1990-08-15' },
  ],
  mop_history: [],
  mop_scheduled_tasks: [],
  mop_vacation_history: [],
};

/** Intercepta a REST do Supabase numa página do Playwright. */
export async function stubSupabase(page: import('@playwright/test').Page) {
  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/rest/v1/')[1]?.split('?')[0] ?? '';
    const method = route.request().method();

    if (method !== 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURES[table] ?? []),
    });
  });
}
