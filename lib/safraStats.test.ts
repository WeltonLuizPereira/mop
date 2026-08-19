import { describe, expect, it } from 'vitest';
import { CollaboratorStatus } from '../types';
import { computeSafras, lerData, saidasSemData, serieMensal } from './safraStats';

const HOJE = new Date(2026, 7, 20); // 20/08/2026

const colab = (
  matricula: string, entrada: string,
  status: CollaboratorStatus = CollaboratorStatus.ATIVO, saida = '',
) => ({ matricula, nome: `Pessoa ${matricula}`, dtEntradaProduto: entrada, status, dataFim: saida } as any);

describe('lerData', () => {
  it('lê AAAA-MM-DD no fuso local, sem recuar um dia', () => {
    const d = lerData('2026-01-05')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });

  it('devolve null para o que não é data', () => {
    expect(lerData('')).toBeNull();
    expect(lerData(undefined)).toBeNull();
    expect(lerData('quinta-feira')).toBeNull();
  });
});

describe('computeSafras', () => {
  it('agrupa por mês de entrada e reparte em turmas por data', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-01-05'),
      colab('3', '2026-01-19'),
    ], 2026, HOJE);

    expect(janeiro.rotulo).toBe('Janeiro de 2026');
    expect(janeiro.entraram).toBe(3);
    expect(janeiro.turmas.map(t => [t.data, t.pessoas.length]))
      .toEqual([['2026-01-05', 2], ['2026-01-19', 1]]);
  });

  it('conta como perdido só quem está desligado', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-01-05', CollaboratorStatus.FERIAS),
      colab('3', '2026-01-05', CollaboratorStatus.AVISO_PREVIO),
      colab('4', '2026-01-05', CollaboratorStatus.DESLIGADO, '2026-03-06'),
    ], 2026, HOJE);

    expect(janeiro.ficaram).toBe(3);
    expect(janeiro.sairam).toBe(1);
    expect(janeiro.retencao).toBeCloseTo(0.75);
  });

  it('reconhece o desligado escrito fora do padrão', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-01-05', 'Desligado' as CollaboratorStatus, '2026-02-04'),
    ], 2026, HOJE);

    expect(janeiro.sairam).toBe(1);
  });

  it('tira a média só sobre quem saiu com data, e diz sobre quantos', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-01', CollaboratorStatus.DESLIGADO, '2026-01-31'), // 30 dias
      colab('2', '2026-01-01', CollaboratorStatus.DESLIGADO, '2026-03-11'), // 69 dias
      colab('3', '2026-01-01'),
    ], 2026, HOJE);

    expect(janeiro.diasMedios).toBe(50);
    expect(janeiro.baseMedia).toBe(2);
  });

  it('quem saiu sem data conta como perdido, mas fica fora da média', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-01', CollaboratorStatus.DESLIGADO, '2026-01-31'),
      colab('2', '2026-01-01', CollaboratorStatus.DESLIGADO), // sem dataFim
    ], 2026, HOJE);

    expect(janeiro.sairam).toBe(2);
    expect(janeiro.semData).toBe(1);
    expect(janeiro.baseMedia).toBe(1);
    expect(janeiro.diasMedios).toBe(30);
  });

  it('não inventa média quando ninguém saiu', () => {
    const [janeiro] = computeSafras([colab('1', '2026-01-05')], 2026, HOJE);
    expect(janeiro.diasMedios).toBeNull();
    expect(janeiro.baseMedia).toBe(0);
  });

  it('mede a idade da safra em meses completos desde a entrada', () => {
    const safras = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-08-03'),
    ], 2026, HOJE);

    expect(safras.map(s => [s.mes, s.idadeMeses])).toEqual([[0, 7], [7, 0]]);
  });

  it('deixa de fora o mês em que ninguém entrou', () => {
    const safras = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-03-05'),
    ], 2026, HOJE);

    expect(safras.map(s => s.mes)).toEqual([0, 2]);
  });

  it('ignora quem entrou em outro ano', () => {
    const safras = computeSafras([
      colab('1', '2025-01-05'),
      colab('2', '2026-01-05'),
    ], 2026, HOJE);

    expect(safras).toHaveLength(1);
    expect(safras[0].entraram).toBe(1);
  });

  it('ignora quem está sem data de entrada — não dá para saber a safra', () => {
    expect(computeSafras([colab('1', '')], 2026, HOJE)).toEqual([]);
  });

  it('ordena as pessoas da turma pelo nome', () => {
    const [janeiro] = computeSafras([
      { matricula: '1', nome: 'Zeca', dtEntradaProduto: '2026-01-05', status: CollaboratorStatus.ATIVO } as any,
      { matricula: '2', nome: 'Ana', dtEntradaProduto: '2026-01-05', status: CollaboratorStatus.ATIVO } as any,
    ], 2026, HOJE);

    expect(janeiro.turmas[0].pessoas.map(p => p.colaborador.nome)).toEqual(['Ana', 'Zeca']);
  });
});

describe('serieMensal', () => {

  it('vai do mês de entrada até hoje, mesmo sem movimento no meio', () => {
    const [janeiro] = computeSafras([colab('1', '2026-01-05')], 2026, HOJE);
    const serie = serieMensal(janeiro.turmas[0].pessoas, HOJE);

    expect(serie.map(p => p.rotulo)).toEqual(['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago']);
    expect(serie[0].entraram).toBe(1);
    expect(serie.every(p => p.naCasa === 1)).toBe(true);
  });

  it('põe a entrada e a saída cada uma no seu mês', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-01-05', CollaboratorStatus.DESLIGADO, '2026-03-20'),
    ], 2026, HOJE);
    const serie = serieMensal(janeiro.turmas[0].pessoas, HOJE);

    expect(serie[0].entraram).toBe(2);
    expect(serie[2].rotulo).toBe('mar');
    expect(serie[2].sairam).toBe(1);
    expect(serie[2].naCasa).toBe(1);
    expect(serie[2].retencao).toBeCloseTo(0.5);
  });

  it('a retenção só cai, e fica parada onde ninguém saiu', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-01-05'),
      colab('3', '2026-01-05', CollaboratorStatus.DESLIGADO, '2026-02-10'),
    ], 2026, HOJE);
    const serie = serieMensal(janeiro.turmas[0].pessoas, HOJE);

    expect(serie.map(p => p.naCasa)).toEqual([3, 2, 2, 2, 2, 2, 2, 2]);
  });

  it('acompanha a safra na virada do ano, em vez de parar em dezembro', () => {
    const [novembro] = computeSafras([
      colab('1', '2025-11-10'),
      colab('2', '2025-11-10', CollaboratorStatus.DESLIGADO, '2026-02-14'),
    ], 2025, new Date(2026, 2, 5));
    const serie = serieMensal(novembro.turmas[0].pessoas, new Date(2026, 2, 5));

    // sem o ano no rótulo, "nov" e "fev" de anos diferentes se confundiriam
    expect(serie.map(p => p.rotulo)).toEqual(['nov', 'dez', 'jan/26', 'fev/26', 'mar/26']);
    expect(serie[3].sairam).toBe(1);
  });

  it('a saída sem data não entra em mês nenhum', () => {
    const [janeiro] = computeSafras([
      colab('1', '2026-01-05'),
      colab('2', '2026-01-05', CollaboratorStatus.DESLIGADO),
    ], 2026, HOJE);
    const serie = serieMensal(janeiro.turmas[0].pessoas, HOJE);

    expect(serie.every(p => p.sairam === 0)).toBe(true);
    // a linha termina em 100% enquanto a safra real está em 50% — é por isso
    // que a tela precisa dizer a diferença em texto
    expect(serie.at(-1)!.retencao).toBe(1);
    expect(saidasSemData(janeiro.turmas[0].pessoas)).toBe(1);
  });

  it('não devolve série para turma vazia', () => {
    expect(serieMensal([], HOJE)).toEqual([]);
  });
});
