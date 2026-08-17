import type { Client, Collaborator, Ilha } from '../types';

/** colaborador → ilha → cliente, com o clientId do registro como reserva. */
export function resolveClient(
  collab: Collaborator, ilhas: Ilha[], clients: Client[],
): Client | undefined {
  const ilha = ilhas.find(i => i.id === collab.ilhaId);
  const id = ilha?.clientId ?? collab.clientId;
  return clients.find(c => c.id === id);
}
