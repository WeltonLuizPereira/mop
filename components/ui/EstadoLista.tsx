import React from 'react';
import { Button } from './Button';

/**
 * Os três estados que toda lista tem antes de ter linhas. Ficam juntos porque
 * a confusão entre eles é o erro caro: uma falha de rede desenhada como lista
 * vazia faz a pessoa concluir que não há ninguém cadastrado.
 */

/** Enquanto a consulta não volta. `role="status"` para o leitor de tela
 *  anunciar sem roubar o foco. */
export const Carregando = ({ o_que }: { o_que: string }) => (
  <div role="status" aria-busy="true" className="p-10 text-center text-[13px] text-ink-mute">
    Carregando {o_que}…
  </div>
);

/** Quando a consulta falha. `role="alert"` porque a pessoa precisa saber
 *  agora, e um caminho de volta: tentar de novo. */
export const FalhaAoCarregar = ({ mensagem, aoTentar, rotuloAcao = 'Tentar de novo' }: {
  mensagem: string;
  aoTentar: () => void;
  rotuloAcao?: string;
}) => (
  <div role="alert" className="p-10 text-center">
    <p className="text-sm text-ink-2">{mensagem}</p>
    <Button variant="secondary" className="mt-3" onClick={aoTentar}>{rotuloAcao}</Button>
  </div>
);

/** Quando a consulta volta sem nada. Região nomeada pela própria frase, para
 *  quem navega por marcos saber o que encontrou. */
export const ListaVazia = ({ titulo, children }: { titulo: string; children?: React.ReactNode }) => (
  <div role="region" aria-label={titulo} className="p-10 text-center">
    <p className="text-[13px] text-ink-mute">{titulo}</p>
    {children && <p className="text-xs text-ink-faint mt-1">{children}</p>}
  </div>
);
