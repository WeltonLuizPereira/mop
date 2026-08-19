/**
 * A versão que a interface mostra, derivada do `version` do package.json.
 *
 * O semver do npm tem sempre três casas, mas quem lê o rodapé quer "2.0", não
 * "2.0.0". A correção de bug, essa sim, aparece: some só o `.0` do fim, então
 * 2.1.0 vira "2.1" e 2.0.1 continua "2.0.1".
 */
export function versaoExibida(semver: string): string {
  const casas = semver.trim().split('.');
  if (casas.length !== 3 || casas.some(c => !/^\d+$/.test(c))) return semver.trim();
  return casas[2] === '0' ? `${casas[0]}.${casas[1]}` : semver.trim();
}
