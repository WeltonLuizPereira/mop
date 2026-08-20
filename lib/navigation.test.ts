import { describe, expect, it } from 'vitest';
import { UserRole } from '../types';
import { NAV_GROUPS, pageTitle, visibleGroups } from './navigation';

const chaves = (role: UserRole) =>
  visibleGroups(role).flatMap(g => g.items.map(i => i.key));

describe('visibleGroups', () => {
  it('mostra as 25 telas para o administrador', () => {
    expect(chaves(UserRole.ADMIN)).toHaveLength(25);
  });

  it('esconde cadastros, administração e sistema do visualizador', () => {
    const k = chaves(UserRole.VIEWER);
    expect(k).toContain('dashboard');
    expect(k).toContain('collaborators');
    expect(k).toContain('organogram');
    expect(k).not.toContain('turnover');
    expect(k).not.toContain('users');
    expect(k).not.toContain('import');
    expect(k).not.toContain('vacation');
  });

  it('esconde provimento de quem não é admin', () => {
    expect(chaves(UserRole.VIEWER)).not.toContain('provimento');
    expect(chaves(UserRole.RH)).not.toContain('provimento');
  });

  it('dá turnover e as telas de RH ao RH, mas não os cadastros', () => {
    const k = chaves(UserRole.RH);
    expect(k).toContain('turnover');
    expect(k).toContain('vacation');
    expect(k).toContain('aviso_previo');
    expect(k).not.toContain('clients');
    expect(k).not.toContain('reset');
  });

  it('nunca devolve grupo sem item visível', () => {
    for (const role of Object.values(UserRole)) {
      for (const g of visibleGroups(role)) {
        expect(g.items.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('pageTitle', () => {
  it('traduz a chave da rota', () => {
    expect(pageTitle('dashboard')).toBe('Visão geral');
    expect(pageTitle('distribuicao')).toBe('Dashboard');
    expect(pageTitle('aviso_previo')).toBe('Aviso prévio');
  });

  it('cai num rótulo genérico para chave desconhecida', () => {
    expect(pageTitle('inexistente')).toBe('MOP');
  });
});
