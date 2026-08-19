import { CollaboratorStatus, type Collaborator } from '../types';
import { normalizarStatus } from './status';

/** Uma pessoa da safra, já com o desfecho resolvido. */
export interface PessoaDaSafra {
  colaborador: Collaborator;
  /** `false` quando o status é DESLIGADO. */
  ficou: boolean;
  /** Dias entre a entrada e a saída. `null` para quem ficou, e para quem
   *  saiu sem data — não dá para medir o que não foi registrado. */
  diasAteSair: number | null;
}

/** Todo mundo que entrou na mesma data. */
export interface Turma {
  /** A data de entrada, no formato do banco (AAAA-MM-DD). */
  data: string;
  pessoas: PessoaDaSafra[];
  ficaram: number;
  sairam: number;
}

export interface Safra {
  /** 0 = janeiro. */
  mes: number;
  ano: number;
  /** "Janeiro de 2026". */
  rotulo: string;
  turmas: Turma[];
  entraram: number;
  ficaram: number;
  sairam: number;
  /** `ficaram` ÷ `entraram`, de 0 a 1. */
  retencao: number;
  /** Média de dias até a saída, ou `null` se ninguém saiu com data. */
  diasMedios: number | null;
  /** Sobre quantas saídas a média foi feita. */
  baseMedia: number;
  /** Saídas sem data registrada — contam como perdidas, mas não na média. */
  semData: number;
  /** Meses completos entre a entrada e hoje. */
  idadeMeses: number;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Abaixo disso a safra ainda não teve tempo de perder ninguém, e comparar a
 *  retenção dela com a de uma safra antiga leva à conclusão errada. */
export const IDADE_JOVEM = 3;

/** Lê AAAA-MM-DD como data local. `new Date('2026-01-05')` seria UTC e viraria
 *  04/01 no fuso do Brasil — o suficiente para jogar a pessoa para o mês
 *  anterior e trocá-la de safra. */
export function lerData(valor?: string | null): Date | null {
  if (!valor) return null;
  const limpo = valor.includes('T') ? valor.split('T')[0] : valor;
  const partes = limpo.split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  return Number.isNaN(data.getTime()) ? null : data;
}

const DIA = 1000 * 60 * 60 * 24;

/** Meses completos de `de` até `ate`, nunca negativo. */
function mesesEntre(de: Date, ate: Date): number {
  const meses = (ate.getFullYear() - de.getFullYear()) * 12 + (ate.getMonth() - de.getMonth());
  return Math.max(0, meses);
}

/**
 * Agrupa quem entrou em cada mês do ano e conta o que aconteceu com essa gente.
 *
 * Retido é todo mundo que não foi desligado — a mesma regra que o mapa de
 * ilhas e a distribuição usam. Se esta tela contasse um quadro diferente, ela
 * discordaria das outras sobre a mesma pessoa.
 *
 * Mês sem ninguém entrando não vira safra: uma linha de zeros não conta
 * história nenhuma e só afasta as safras que importam.
 */
export function computeSafras(
  colabs: Collaborator[],
  ano: number,
  hoje: Date = new Date(),
): Safra[] {
  const porMes = new Map<number, Map<string, PessoaDaSafra[]>>();

  colabs.forEach(colaborador => {
    const entrada = lerData(colaborador.dtEntradaProduto);
    if (!entrada || entrada.getFullYear() !== ano) return;

    const ficou = normalizarStatus(colaborador.status) !== CollaboratorStatus.DESLIGADO;
    const saida = ficou ? null : lerData(colaborador.dataFim);
    const diasAteSair = saida ? Math.round((saida.getTime() - entrada.getTime()) / DIA) : null;

    const mes = entrada.getMonth();
    if (!porMes.has(mes)) porMes.set(mes, new Map());
    const turmas = porMes.get(mes)!;

    const chave = colaborador.dtEntradaProduto;
    if (!turmas.has(chave)) turmas.set(chave, []);
    turmas.get(chave)!.push({ colaborador, ficou, diasAteSair });
  });

  return [...porMes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([mes, mapaTurmas]) => {
      const turmas: Turma[] = [...mapaTurmas.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([data, pessoas]) => ({
          data,
          pessoas: [...pessoas].sort((a, b) =>
            a.colaborador.nome.localeCompare(b.colaborador.nome, 'pt-BR')),
          ficaram: pessoas.filter(p => p.ficou).length,
          sairam: pessoas.filter(p => !p.ficou).length,
        }));

      const todas = turmas.flatMap(t => t.pessoas);
      const saidas = todas.filter(p => !p.ficou);
      const comData = saidas.filter(p => p.diasAteSair !== null);
      const entraram = todas.length;
      const ficaram = todas.length - saidas.length;

      return {
        mes,
        ano,
        rotulo: `${MESES[mes]} de ${ano}`,
        turmas,
        entraram,
        ficaram,
        sairam: saidas.length,
        retencao: entraram === 0 ? 0 : ficaram / entraram,
        diasMedios: comData.length === 0
          ? null
          : Math.round(comData.reduce((s, p) => s + p.diasAteSair!, 0) / comData.length),
        baseMedia: comData.length,
        semData: saidas.length - comData.length,
        idadeMeses: mesesEntre(new Date(ano, mes, 1), hoje),
      };
    });
}

/** Um mês da vida da safra, com o que entrou, o que saiu e o que restou. */
export interface PontoMensal {
  /** "2026-01", para servir de chave estável na lista. */
  chave: string;
  ano: number;
  /** 0 = janeiro. */
  mes: number;
  /** "jan", ou "jan/27" quando a série atravessa o ano. */
  rotulo: string;
  /** "Março de 2026" — o que o tooltip diz, sem abreviar. */
  rotuloLongo: string;
  entraram: number;
  sairam: number;
  /** Quantos ainda estavam na casa ao fim do mês. */
  naCasa: number;
  /** `naCasa` ÷ total da série, de 0 a 1. */
  retencao: number;
  mesesDesdeEntrada: number;
}

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Saídas que ninguém datou — contam como perdidas, mas não têm mês. */
export function saidasSemData(pessoas: PessoaDaSafra[]): number {
  return pessoas.filter(p => !p.ficou && p.diasAteSair === null).length;
}

/**
 * A vida da safra mês a mês, do mês de entrada até hoje.
 *
 * O eixo acompanha a safra, não o calendário: quem entrou em janeiro de 2026 e
 * saiu em fevereiro de 2027 continua aparecendo. Preso ao ano, esse desligamento
 * sumiria do gráfico e a conta da tela discordaria da conta do desenho.
 *
 * Só saída com data entra aqui. Uma saída sem data não tem mês onde ser posta, e
 * escolher um seria inventar — por isso a linha pode terminar acima da retenção
 * real, e a tela diz isso em texto em vez de esconder.
 */
export function serieMensal(
  pessoas: PessoaDaSafra[],
  hoje: Date = new Date(),
): PontoMensal[] {
  if (pessoas.length === 0) return [];

  const absoluto = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const entradas = new Map<number, number>();
  const saidas = new Map<number, number>();

  pessoas.forEach(p => {
    const entrada = lerData(p.colaborador.dtEntradaProduto);
    if (entrada) entradas.set(absoluto(entrada), (entradas.get(absoluto(entrada)) ?? 0) + 1);

    if (p.ficou || p.diasAteSair === null) return;
    const saida = lerData(p.colaborador.dataFim);
    if (saida) saidas.set(absoluto(saida), (saidas.get(absoluto(saida)) ?? 0) + 1);
  });

  if (entradas.size === 0) return [];

  const inicio = Math.min(...entradas.keys());
  const fim = Math.max(inicio, absoluto(hoje), ...saidas.keys());
  const total = pessoas.length;
  const anoInicial = Math.floor(inicio / 12);

  const pontos: PontoMensal[] = [];
  let naCasa = total;

  for (let m = inicio; m <= fim; m++) {
    const ano = Math.floor(m / 12);
    const mes = m % 12;
    const sairam = saidas.get(m) ?? 0;
    naCasa -= sairam;
    pontos.push({
      chave: `${ano}-${String(mes + 1).padStart(2, '0')}`,
      ano,
      mes,
      // o ano só aparece quando a série atravessa a virada, senão "jan" repetiria
      rotulo: ano === anoInicial ? MES_CURTO[mes] : `${MES_CURTO[mes]}/${String(ano).slice(2)}`,
      rotuloLongo: `${MESES[mes]} de ${ano}`,
      entraram: entradas.get(m) ?? 0,
      sairam,
      naCasa,
      retencao: naCasa / total,
      mesesDesdeEntrada: m - inicio,
    });
  }

  return pontos;
}
