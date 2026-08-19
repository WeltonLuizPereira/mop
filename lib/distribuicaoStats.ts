import {
  CollaboratorStatus, EntityStatus, type Collaborator,
} from '../types';
import { normalizarStatus } from './status';

export interface Fatia {
  /** Id do item no cadastro. Vazio na linha de quem está sem vínculo. */
  id: string;
  nome: string;
  /** Pessoas do quadro nesse item. */
  total: number;
  /** `total` ÷ quadro geral, de 0 a 1. 0 quando não há ninguém no quadro. */
  fatia: number;
}

/** O mínimo que a distribuição precisa de um cadastro para nomear os itens. */
interface Cadastrado {
  id: string;
  nome: string;
  status: EntityStatus;
}

/**
 * Quem saiu não é quadro: o desligado fica fora do numerador e do denominador,
 * a mesma regra que o mapa de ilhas aplica em `computeIlhaStats`. Se as duas
 * telas contassem quadros diferentes, elas discordariam sobre a mesma pessoa.
 */
export function doQuadro(colabs: Collaborator[]): Collaborator[] {
  return colabs.filter(c => normalizarStatus(c.status) !== CollaboratorStatus.DESLIGADO);
}

/**
 * Reparte o quadro entre os itens de um cadastro — operações, ilhas ou
 * supervisores.
 *
 * O denominador é sempre o quadro inteiro, então as fatias somam 100%. Por
 * isso existe a linha `rotuloSemVinculo`: quem está sem o vínculo preenchido,
 * ou apontando para um item inativo, precisa aparecer em algum lugar. Sem ela
 * essas pessoas sumiriam da tela e os percentuais fechariam abaixo de 100 sem
 * explicar por quê.
 */
export function distribuir(
  colabs: Collaborator[],
  obterId: (c: Collaborator) => string | undefined,
  cadastro: Cadastrado[],
  rotuloSemVinculo: string,
): Fatia[] {
  const quadro = doQuadro(colabs);

  // Item inativo saiu de operação: não abre linha própria. Quem ainda estiver
  // apontado para ele cai na linha de sem vínculo, que é o que de fato é.
  const emUso = cadastro.filter(x => x.status === EntityStatus.ACTIVE);
  const nomes = new Map(emUso.map(x => [x.id, x.nome]));

  // Cadastrado sem ninguém começa em zero e aparece na lista: supervisor sem
  // equipe é justamente o que alguém precisa enxergar.
  const contagem = new Map<string, number>(emUso.map(x => [x.id, 0]));
  let semVinculo = 0;

  for (const c of quadro) {
    const id = obterId(c);
    if (id && contagem.has(id)) contagem.set(id, (contagem.get(id) ?? 0) + 1);
    else semVinculo += 1;
  }

  const base = quadro.length;
  const fatiaDe = (n: number) => (base === 0 ? 0 : n / base);

  const linhas: Fatia[] = [...contagem].map(([id, total]) => ({
    id,
    nome: nomes.get(id) ?? '—',
    total,
    fatia: fatiaDe(total),
  }));

  if (semVinculo > 0) {
    linhas.push({ id: '', nome: rotuloSemVinculo, total: semVinculo, fatia: fatiaDe(semVinculo) });
  }

  // Maior primeiro — a tela existe para mostrar onde a gente está concentrada.
  // Empate volta para o nome: dois itens com a mesma contagem não podem trocar
  // de lugar a cada renderização.
  return linhas.sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));
}
