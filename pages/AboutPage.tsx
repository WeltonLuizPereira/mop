import React from 'react';
import { Mail } from 'lucide-react';
import { versaoExibida } from '../lib/versao';
import { Logo } from '../components/brand/Logo';

declare const __APP_VERSION__: string;
declare const __UPDATE_DATE__: string;

const VERSAO = versaoExibida(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0');
const ATUALIZACAO = typeof __UPDATE_DATE__ !== 'undefined' ? __UPDATE_DATE__ : 'N/A';

/** Termo e valor da ficha: é uma lista de definição, e não uma tabela de duas
 *  colunas fingida com espaçamento. */
const Linha = ({ termo, children }: { termo: string; children: React.ReactNode }) => (
  <div className="flex justify-between items-center gap-4 border-b border-hairline pb-4">
    <dt className="text-ink-mute font-medium">{termo}</dt>
    <dd className="font-bold text-ink text-right">{children}</dd>
  </div>
);

export const AboutPage = () => (
    // sem altura travada: em tela baixa a ficha precisa rolar, e era a altura
    // fixa que escondia o rodapé
    <div className="flex flex-col items-center text-center animate-in fade-in duration-500 py-8">
      <Logo variant="lockup" className="h-16 mb-6" />
      <h2 className="t-display-xl text-ink mb-2">MOP — Mapa Operacional</h2>
      <p className="text-base text-ink-mute mb-8">Desenvolvido para simplificar o seu dia a dia.</p>

      <div className="bg-canvas p-8 rounded-xl shadow-1 border border-hairline max-w-lg w-full">
        <dl className="space-y-6">
          <Linha termo="Versão">
            <span className="bg-canvas-sunk px-3 py-1 rounded-full text-sm">{VERSAO}</span>
          </Linha>
          <Linha termo="Última atualização">
            <span className="bg-canvas-sunk px-3 py-1 rounded-full text-sm">{ATUALIZACAO}</span>
          </Linha>
          <Linha termo="Desenvolvedor">Welton Luiz Pereira</Linha>
        </dl>

        <div className="flex flex-col gap-2 pt-6">
           <span className="text-ink-mute font-medium text-left">Precisa de ajuda?</span>
           <a href="mailto:welton.pereira@qualitycontactcenter.com.br" className="text-brand font-bold hover:underline flex items-center justify-center gap-2 p-3 bg-brand-wash rounded-lg transition-colors">
              <Mail size={18} /> welton.pereira@qualitycontactcenter.com.br
           </a>
        </div>
      </div>

      <p className="mt-12 text-sm text-ink-faint">© 2026 Todos os direitos reservados.</p>
    </div>
);
