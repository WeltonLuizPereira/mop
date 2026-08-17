import React, { useState } from 'react';
import type { Client } from '../../types';

/**
 * A logo do cliente é a âncora visual da linha. Fundo neutro para que logo
 * colorida não brigue com o canvas em nenhum dos dois temas; monograma quando
 * o cliente não tem `logo` cadastrada ou a imagem falha.
 */
export const ClientLogo = ({ client }: { client?: Client }) => {
  const [falhou, setFalhou] = useState(false);
  const nome = client?.nome ?? 'Sem cliente';
  const mostrarImagem = Boolean(client?.logo) && !falhou;

  return (
    <div
      className="w-7 h-7 rounded-xs bg-canvas-sunk grid place-items-center overflow-hidden shrink-0"
      role="img"
      aria-label={nome}
      title={nome}
    >
      {mostrarImagem
        ? <img src={client!.logo} alt="" className="max-w-6 max-h-6 object-contain block"
               onError={() => setFalhou(true)} />
        : <span className="font-display font-bold text-xs text-ink-2 tracking-tight">
            {nome.charAt(0).toUpperCase()}
          </span>}
    </div>
  );
};
