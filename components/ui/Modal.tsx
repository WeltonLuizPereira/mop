import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Nome do diálogo. Vira o título quando há cabeçalho, e o rótulo acessível sempre. */
  title: string;
  /** `sm` para confirmação e recado; `md` para formulário. */
  tamanho?: 'sm' | 'md';
  /** Diálogos que desenham o próprio topo (ícone centralizado) dispensam a barra. */
  semCabecalho?: boolean;
  /** Fica preso ao pé do painel: o botão de salvar não rola junto com o formulário. */
  rodape?: React.ReactNode;
  /** Onde o foco pousa ao abrir. Sem ele o foco fica no painel, e quem usa
   *  teclado precisa tabular até o primeiro campo. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

const LARGURA = { sm: 'max-w-sm', md: 'max-w-2xl' };

/** Quantos diálogos estão abertos — o fundo só volta a rolar quando o último fecha. */
let abertos = 0;

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = ({
  open, onClose, title, tamanho = 'md', semCabecalho = false, rodape,
  initialFocusRef, children,
}: ModalProps) => {
  const painel = useRef<HTMLDivElement>(null);
  const anterior = useRef<HTMLElement | null>(null);

  // `onClose` quase sempre chega como arrow inline, ou seja, com identidade
  // nova a cada renderização. Se ele entrasse nas dependências, o efeito se
  // desfaria e refaria a cada tecla — e a limpeza devolve o foco ao gatilho,
  // engolindo tudo o que fosse digitado depois da primeira letra.
  const fechar = useRef(onClose);
  fechar.current = onClose;

  useEffect(() => {
    if (!open) return;
    anterior.current = document.activeElement as HTMLElement;
    (initialFocusRef?.current ?? painel.current)?.focus();

    abertos += 1;
    const rolagemOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { fechar.current(); return; }
      if (e.key !== 'Tab' || !painel.current) return;

      // sem prender o Tab, a tabulação escapa para a página atrás do fundo
      const alvos = [...painel.current.querySelectorAll<HTMLElement>(FOCAVEIS)];
      if (alvos.length === 0) return;
      const primeiro = alvos[0];
      const ultimo = alvos[alvos.length - 1];
      const atual = document.activeElement;

      if (e.shiftKey && (atual === primeiro || atual === painel.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && atual === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      abertos -= 1;
      if (abertos === 0) document.body.style.overflow = rolagemOriginal;
      anterior.current?.focus();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  // O diálogo sai para o `body`. Dentro da página ele herdaria qualquer
  // `transform` de ancestral — e um `transform`, mesmo identidade, faz o
  // elemento virar bloco de contenção de `position: fixed`, jogando o
  // diálogo para dentro da caixa de conteúdo em vez da janela.
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full ${LARGURA[tamanho]} max-h-[90vh] flex flex-col
                    bg-canvas border border-hairline rounded-lg shadow-3`}
      >
        {!semCabecalho && (
          <div className="flex items-center gap-4 px-6 py-4 border-b border-hairline shrink-0">
            <h2 className="t-display-md text-ink flex-1">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="w-8 h-8 grid place-items-center rounded-sm text-ink-2 hover:bg-canvas-soft"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>

        {rodape && (
          <div className="px-6 py-4 border-t border-hairline flex justify-end gap-3 shrink-0">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
