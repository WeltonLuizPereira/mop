import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('mostra a marca completa da Quality em repouso', () => {
    render(<AboutPage />);
    expect(screen.getByRole('img', { name: 'Quality Contact Center' })).toBeVisible();
  });

  it('lista versão e atualização em uma lista de definição real', () => {
    render(<AboutPage />);
    const termo = screen.getByText('Versão');
    const dl = termo.closest('dl');
    expect(dl).toBeInTheDocument();
    expect(dl).toHaveTextContent('Última atualização');
    expect(dl).toHaveTextContent('Welton Luiz Pereira');
  });

  it('oferece contato por e-mail via mailto', () => {
    render(<AboutPage />);
    const link = screen.getByRole('link', { name: /welton\.pereira@qualitycontactcenter\.com\.br/ });
    expect(link).toHaveAttribute('href', 'mailto:welton.pereira@qualitycontactcenter.com.br');
  });

  it('não trava a altura como uma tela de abertura promocional', () => {
    const { container } = render(<AboutPage />);
    expect(container.innerHTML).not.toMatch(/h-\[calc/);
    expect(container.querySelector('[class*="h-screen"]')).not.toBeInTheDocument();
  });
});
