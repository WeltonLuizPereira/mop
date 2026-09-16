import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const T = {
  brandClaro: '#F27405', onBrandClaro: '#191310', brandTextClaro: '#D04200',
  canvasClaro: '#FFFFFF', inkClaro: '#191310', inkMuteClaro: '#6B615C',
  brandEscuro: '#FF5B35', onBrandEscuro: '#061625', brandTextEscuro: '#FF8A70',
  canvasEscuro: '#061625', inkEscuro: '#EAF2F7', inkMuteEscuro: '#91A5B5',
};

describe('contrastRatio', () => {
  it('dá 21 para preto sobre branco', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('dá 1 para cores iguais', () => {
    expect(contrastRatio('#F27405', '#F27405')).toBeCloseTo(1, 2);
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
  const claro = ['#12794F','#1264A3','#6544C0','#B4008C','#FF4D6D','#00786F','#C2304C'];
  const escuro = ['#3FBE84','#5AA9E6','#9B8CFF','#E86FD8','#FF4D6D','#38B5A8','#C2304C'];

  it.each(claro)('%s alcança 3:1 sobre o canvas claro', c => {
    expect(contrastRatio(c, T.canvasClaro)).toBeGreaterThanOrEqual(3);
  });
  it.each(escuro)('%s alcança 3:1 sobre o canvas escuro', c => {
    expect(contrastRatio(c, T.canvasEscuro)).toBeGreaterThanOrEqual(3);
  });

  // Aviso prévio e desligado contam a mesma história em estágios diferentes:
  // mesmo vermelho, o encerrado mais fundo. Se os dois se aproximarem demais,
  // o ponto deixa de separar quem está saindo de quem já saiu.
  // `--danger` não é só ponto: ele vira texto e vira fundo com texto claro em
  // cima. Se alguém o clarear até o vermelho dos pontos, "Excluir" e as
  // mensagens de erro caem abaixo do piso de leitura — este teste é o freio.
  it.each([
    ['sobre o canvas claro', '#DE2E50', '#FFFFFF'],
    ['com texto claro em cima', '#FFFFFF', '#DE2E50'],
  ])('o vermelho de ação passa AA %s', (_o, a, b) => {
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['claro',  '#FF4D6D', '#C2304C'],
    ['escuro', '#FF4D6D', '#C2304C'],
  ])('no modo %s, aviso e desligado ficam distinguíveis entre si', (_m, aviso, desligado) => {
    expect(contrastRatio(aviso, desligado)).toBeGreaterThanOrEqual(1.6);
  });
});
