import React from 'react';
import { Mail } from 'lucide-react';
import { Card } from '../components/ui';
import { Logo } from '../components/brand/Logo';

declare const __APP_VERSION__: string;
declare const __UPDATE_DATE__: string;

const HELP_EMAIL = 'welton.pereira@qualitycontactcenter.com.br';

/**
 * Tela de referência silenciosa: versão, datas, créditos. É o único lugar
 * onde a marca completa aparece em repouso — sem estética promocional, sem
 * altura travada (o conteúdo respeita o scroll do shell).
 *
 * Usa `<h2>` de propósito: o `<h1>` da página é o Topbar do shell.
 */
export const AboutPage = () => {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1';
  const updatedAt = typeof __UPDATE_DATE__ !== 'undefined' ? __UPDATE_DATE__ : 'N/A';

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-6 text-center">
      <Logo variant="lockup" className="h-20 w-auto text-ink" />

      <div className="space-y-1">
        <h2 className="t-display-lg text-ink">MOP — Mapa Operacional</h2>
        <p className="text-sm text-ink-2">Desenvolvido para simplificar o seu dia a dia.</p>
      </div>

      <Card className="w-full text-left">
        <dl className="divide-y divide-hairline">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0">
            <dt className="text-sm font-medium text-ink-2">Versão</dt>
            <dd className="t-data text-sm text-ink">{version}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
            <dt className="text-sm font-medium text-ink-2">Última atualização</dt>
            <dd className="t-data text-sm text-ink">{updatedAt}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 last:pb-0">
            <dt className="text-sm font-medium text-ink-2">Desenvolvedor</dt>
            <dd className="text-sm font-semibold text-ink">Welton Luiz Pereira</dd>
          </div>
        </dl>
      </Card>

      <a
        href={`mailto:${HELP_EMAIL}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text hover:underline"
      >
        <Mail size={16} aria-hidden="true" />
        {HELP_EMAIL}
      </a>

      <p className="text-xs text-ink-faint">© {new Date().getFullYear()} Todos os direitos reservados.</p>
    </div>
  );
};
