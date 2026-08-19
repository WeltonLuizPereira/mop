import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './Table';

const montar = (extra?: React.ReactNode) => render(
  <Table label="Clientes">
    <Table.Head><Table.Th>Nome</Table.Th>{extra}</Table.Head>
    <tbody><tr><Table.Td>Vivo</Table.Td></tr></tbody>
  </Table>,
);

describe('Table', () => {
  it('expõe o scroller como região nomeada e tabulável', () => {
    montar();
    const regiao = screen.getByRole('region', { name: 'Clientes' });
    expect(regiao).toHaveAttribute('tabindex', '0');
  });

  it('marca todo cabeçalho como cabeçalho de coluna, ordenável ou não', () => {
    montar(
      <Table.Th campo="ilha" ordenacao={{ campo: 'nome', direcao: 'asc' }} onOrdenar={vi.fn()}>
        Ilha
      </Table.Th>,
    );
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('scope', 'col');
    expect(screen.getByRole('columnheader', { name: 'Ilha' })).toHaveAttribute('scope', 'col');
  });

  it('ordena pelo cabeçalho e anuncia a coluna ativa e o sentido', async () => {
    const aoOrdenar = vi.fn();
    montar(
      <Table.Th campo="ilha" ordenacao={{ campo: 'ilha', direcao: 'desc' }} onOrdenar={aoOrdenar}>
        Ilha
      </Table.Th>,
    );

    const ilha = screen.getByRole('columnheader', { name: 'Ilha' });
    expect(ilha).toHaveAttribute('aria-sort', 'descending');
    // a coluna que não ordena não pode se anunciar como ordenável
    expect(screen.getByRole('columnheader', { name: 'Nome' })).not.toHaveAttribute('aria-sort');

    await userEvent.click(screen.getByRole('button', { name: 'Ilha' }));
    expect(aoOrdenar).toHaveBeenCalledWith('ilha');
  });
});
