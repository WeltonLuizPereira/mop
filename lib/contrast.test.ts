import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from './contrast';

const indexCss = readFileSync(resolve(process.cwd(), 'index.css'), 'utf8');

function tokensIn(selector: ':root' | '.dark') {
  const escapedSelector = selector.replace('.', '\\.');
  const block = indexCss.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
  if (!block) throw new Error(`Bloco ${selector} ausente em index.css`);

  return Object.fromEntries(
    [...block.matchAll(/(--[a-z-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  ) as Record<string, string>;
}

function token(tokens: Record<string, string>, name: string) {
  const value = tokens[name];
  if (!value) throw new Error(`Token ${name} ausente em index.css`);
  const normalized = value.trim();
  return /^#[\da-f]{3}$/i.test(normalized)
    ? `#${[...normalized.slice(1)].map(channel => channel.repeat(2)).join('')}`
    : normalized;
}

const claro = tokensIn(':root');
const escuro = tokensIn('.dark');
const T = {
  brandClaro: token(claro, '--brand'), onBrandClaro: token(claro, '--on-brand'),
  brandTextClaro: token(claro, '--brand-text'), canvasClaro: token(claro, '--canvas'),
  inkClaro: token(claro, '--ink'), inkMuteClaro: token(claro, '--ink-mute'),
  brandEscuro: token(escuro, '--brand'), onBrandEscuro: token(escuro, '--on-brand'),
  brandTextEscuro: token(escuro, '--brand-text'), canvasEscuro: token(escuro, '--canvas'),
  inkEscuro: token(escuro, '--ink'), inkMuteEscuro: token(escuro, '--ink-mute'),
};

describe('contrastRatio', () => {
  it('dá 21 para preto sobre branco', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('dá 1 para cores iguais', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 2);
  });
});

describe('tokens da marca', () => {
  it('texto quase-preto sobre o preenchimento claro passa AA', () => {
    expect(contrastRatio(T.onBrandClaro, T.brandClaro)).toBeGreaterThanOrEqual(4.5);
  });
  it('texto azul-marinho sobre o preenchimento escuro passa AA', () => {
    expect(contrastRatio(T.onBrandEscuro, T.brandEscuro)).toBeGreaterThanOrEqual(4.5);
  });
  it('texto branco sobre o preenchimento claro REPROVA', () => {
    expect(contrastRatio('#FFFFFF', T.brandClaro)).toBeLessThan(4.5);
  });
  it.each([
    ['claro', T.brandTextClaro, T.canvasClaro],
    ['escuro', T.brandTextEscuro, T.canvasEscuro],
    ['escuro', T.brandEscuro, T.canvasEscuro],
  ])('a marca do modo %s passa AA sobre seu canvas', (_modo, marca, canvas) => {
    expect(contrastRatio(marca, canvas)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('tinta sobre canvas', () => {
  it.each([
    ['claro',  T.inkClaro,      T.canvasClaro],
    ['claro',  T.inkMuteClaro,  T.canvasClaro],
    ['escuro', T.inkEscuro,     T.canvasEscuro],
    ['escuro', T.inkMuteEscuro, T.canvasEscuro],
  ])('passa AA no modo %s', (_modo, tinta, canvas) => {
    expect(contrastRatio(tinta, canvas)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('pontos de status', () => {
  const status = [
    '--st-ativo', '--st-ferias', '--st-afastado', '--st-maternidade',
    '--st-aviso', '--st-realocado', '--st-desligado',
  ];

  it.each(status.map(name => token(claro, name)))('%s alcança 3:1 sobre o canvas claro', c => {
    expect(contrastRatio(c, T.canvasClaro)).toBeGreaterThanOrEqual(3);
  });
  it.each(status.map(name => token(escuro, name)))('%s alcança 3:1 sobre o canvas escuro', c => {
    expect(contrastRatio(c, T.canvasEscuro)).toBeGreaterThanOrEqual(3);
  });

  // Aviso prévio e desligado contam a mesma história em estágios diferentes:
  // mesmo vermelho, o encerrado mais fundo. Se os dois se aproximarem demais,
  // o ponto deixa de separar quem está saindo de quem já saiu.
  // `--danger` não é só ponto: ele vira texto e vira fundo com texto claro em
  // cima. Se alguém o clarear até o vermelho dos pontos, "Excluir" e as
  // mensagens de erro caem abaixo do piso de leitura — este teste é o freio.
  it.each([
    ['sobre o canvas claro', token(claro, '--danger'), T.canvasClaro],
    ['com texto claro em cima', '#FFFFFF', token(claro, '--danger')],
  ])('o vermelho de ação passa AA %s', (_o, a, b) => {
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['claro', token(claro, '--st-aviso'), token(claro, '--st-desligado')],
    ['escuro', token(escuro, '--st-aviso'), token(escuro, '--st-desligado')],
  ])('no modo %s, aviso e desligado ficam distinguíveis entre si', (_m, aviso, desligado) => {
    expect(contrastRatio(aviso, desligado)).toBeGreaterThanOrEqual(1.6);
  });
});
