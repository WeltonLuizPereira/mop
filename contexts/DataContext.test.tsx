import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataProvider, useResource } from './DataContext';
import { createAppData } from '../data/appData';
import { EntityStatus } from '../types';

function Consumer() {
  const { data = [] } = useResource('clients');
  return <>{data.map(client => <span key={client.id}>{client.nome}</span>)}</>;
}

describe('DataProvider', () => {
  it('entrega o cache carregado a dois consumidores com uma consulta', async () => {
    const getClients = vi.fn().mockResolvedValue([
      { id: '1', nome: 'Vivo', status: EntityStatus.ACTIVE },
    ]);
    const store = createAppData({
      getClients,
      getCollaborators: vi.fn().mockResolvedValue([]),
      getOperations: vi.fn().mockResolvedValue([]),
      getIlhas: vi.fn().mockResolvedValue([]),
      getCoordinators: vi.fn().mockResolvedValue([]),
      getSupervisors: vi.fn().mockResolvedValue([]),
    });

    render(<DataProvider store={store}><Consumer /><Consumer /></DataProvider>);

    expect(await screen.findAllByText('Vivo')).toHaveLength(2);
    expect(getClients).toHaveBeenCalledTimes(1);
  });
});
