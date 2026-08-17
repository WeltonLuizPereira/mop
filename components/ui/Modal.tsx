import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const focusableSelector = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Modal = ({ open, onClose, title, description, children, footer, initialFocusRef }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const siblingState = Array.from(document.body.children)
      .filter(element => element !== overlayRef.current)
      .map(element => ({ element, inert: element.hasAttribute('inert') }));
    siblingState.forEach(({ element }) => element.setAttribute('inert', ''));

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
    (initialFocusRef?.current ?? firstFocusable ?? panelRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      siblingState.forEach(({ element, inert }) => { if (!inert) element.removeAttribute('inert'); });
      previousFocusRef.current?.focus();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;
  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-canvas border border-hairline rounded-xl shadow-3">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-hairline">
          <div className="flex-1">
            <h2 id={titleId} className="t-display-md text-ink">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-ink-2">{description}</p>}
          </div>
          <IconButton label="Fechar" icon={<X size={16} />} variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-hairline">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};
