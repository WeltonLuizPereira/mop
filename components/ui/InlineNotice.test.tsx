import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InlineNotice } from './InlineNotice';

describe('InlineNotice', () => {
  it('interrompe a leitura para comunicar um erro', () => {
    render(<InlineNotice tone="error">Não foi possível carregar.</InlineNotice>);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');
  });

  it('comunica informações sem interromper a leitura', () => {
    render(<InlineNotice tone="info" title="Referência">Dados de agosto.</InlineNotice>);
    expect(screen.getByRole('status')).toHaveTextContent('Referência');
    expect(screen.getByRole('status')).toHaveTextContent('Dados de agosto.');
  });
});
