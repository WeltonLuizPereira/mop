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
    { id: 'o1', nome: 'Móvel', clientId: 'c1', status: 'ATIVO' },
    { id: 'o2', nome: 'Residencial', clientId: 'c2', status: 'ATIVO' },
  ],
  mop_coordinators: [{ id: 'k1', nome: 'Marcos Vinícius', status: 'ATIVO' }],
  mop_supervisors: [
    { id: 's1', nome: 'Juliana Prado', coordinatorIds: ['k1'], status: 'ATIVO' },
  ],
  mop_ilhas: [
    { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
      coordinatorIds: ['k1'], supervisorIds: ['s1'], status: 'ATIVO' },
    { id: 'i2', nome: 'Ilha 07 — Cobrança', clientId: 'c2', operationId: 'o2',
      coordinatorIds: ['k1'], supervisorIds: ['s1'], status: 'ATIVO' },
  ],
  mop_collaborators: [
    { matricula: '4127', nome: 'Adriana Lopes Ferreira', email: 'a@q.com',
      ilhaId: 'i1', supervisorId: 's1', coordinatorId: 'k1',
      operationId: 'o1', clientId: 'c1', status: 'ATIVO',
      dtEntradaProduto: '2025-03-12', horarioEntrada: '06:00',
      horarioSaida: '14:20', dtNasc: '1995-04-02' },
    { matricula: '3942', nome: 'Camila Souza Rocha', email: 'c@q.com',
      ilhaId: 'i2', supervisorId: 's1', coordinatorId: 'k1',
      operationId: 'o2', clientId: 'c2', status: 'FÉRIAS',
      dtEntradaProduto: '2024-11-22', horarioEntrada: '06:00',
      horarioSaida: '14:20', dtNasc: '1990-08-15' },
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
