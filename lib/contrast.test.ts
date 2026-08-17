import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const T = {
  brand: '#F27405', onBrand: '#191310', brandText: '#D04200',
  canvasClaro: '#FFFFFF', inkClaro: '#191310', inkMuteClaro: '#6B615C',
  canvasEscuro: '#121110', inkEscuro: '#F5F1EF', inkMuteEscuro: '#948B86',
};

describe('control tokens', () => {
  it.each([
    ['light focus ring', '#D04200', '#FFFFFF'],
    ['dark focus ring', '#F27405', '#121110'],
    ['light control border', '#9A918C', '#FFFFFF'],
    ['dark control border', '#6E6560', '#121110'],
  ])('%s maintains at least 3:1 contrast', (_token, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
  });
});

describe('contrastRatio', () => {
  it('dá 21 para preto sobre branco', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('dá 1 para cores iguais', () => {
    expect(contrastRatio('#F27405', '#F27405')).toBeCloseTo(1, 2);
  });
});

describe('tokens da marca', () => {
  it('texto quase-preto sobre o laranja passa AA', () => {
    expect(contrastRatio(T.onBrand, T.brand)).toBeGreaterThanOrEqual(4.5);
  });
  it('texto branco sobre o laranja REPROVA — é por isso que on-brand é escuro', () => {
    expect(contrastRatio('#FFFFFF', T.brand)).toBeLessThan(4.5);
  });
  it('o laranja de texto do modo claro passa AA sobre branco', () => {
    expect(contrastRatio(T.brandText, T.canvasClaro)).toBeGreaterThanOrEqual(4.5);
  });
  it('o laranja de preenchimento passa AA sobre o canvas escuro', () => {
    expect(contrastRatio(T.brand, T.canvasEscuro)).toBeGreaterThanOrEqual(4.5);
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
  const claro = ['#12794F','#1264A3','#6544C0','#B4008C','#C4183C','#00786F','#6B615C'];
  const escuro = ['#3FBE84','#5AA9E6','#9B8CFF','#E86FD8','#FF4D6D','#38B5A8','#948B86'];

  it.each(claro)('%s alcança 3:1 sobre o canvas claro', c => {
    expect(contrastRatio(c, T.canvasClaro)).toBeGreaterThanOrEqual(3);
  });
  it.each(escuro)('%s alcança 3:1 sobre o canvas escuro', c => {
    expect(contrastRatio(c, T.canvasEscuro)).toBeGreaterThanOrEqual(3);
  });
});
