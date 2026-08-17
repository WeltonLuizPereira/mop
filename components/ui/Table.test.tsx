import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './Table';

describe('Table', () => {
  it('expõe o scroller rotulado e ativa linhas pelo teclado', async () => {
    const user = userEvent.setup();
    const activate = vi.fn();

    render(
      <Table label="Clientes">
        <Table.Head><Table.Th>Nome</Table.Th></Table.Head>
        <Table.Body>
          <Table.Row onActivate={activate} activationLabel="Abrir Vivo" selected><Table.Td>Vivo</Table.Td></Table.Row>
        </Table.Body>
      </Table>,
    );

    const region = screen.getByRole('region', { name: 'Clientes' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('scope', 'col');

    const row = screen.getByRole('row', { name: 'Abrir Vivo' });
    expect(row).toHaveAttribute('aria-selected', 'true');
    row.focus();
    await user.keyboard('{Enter} ');
    expect(activate).toHaveBeenCalledTimes(2);
  });
});
