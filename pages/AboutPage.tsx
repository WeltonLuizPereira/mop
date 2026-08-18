import React from 'react';
import { Info, Mail } from 'lucide-react';

declare const __APP_VERSION__: string;
declare const __UPDATE_DATE__: string;

export const AboutPage = () => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-brand-wash text-brand rounded-xl flex items-center justify-center mb-6 shadow-1">
        <Info size={48} />
      </div>
      <h2 className="t-display-xl text-ink mb-2">MOP — Mapa Operacional</h2>
      <p className="text-base text-ink-mute mb-8">Desenvolvido para simplificar o seu dia a dia.</p>

      <div className="bg-canvas p-8 rounded-xl shadow-1 border border-hairline max-w-lg w-full space-y-6">
        <div className="flex justify-between items-center border-b border-hairline pb-4">
          <span className="text-ink-mute font-medium">Versão</span>
          <span className="font-bold text-ink bg-canvas-sunk px-3 py-1 rounded-full text-sm">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-hairline pb-4">
          <span className="text-ink-mute font-medium">Última atualização</span>
          <span className="font-bold text-ink bg-canvas-sunk px-3 py-1 rounded-full text-sm">{typeof __UPDATE_DATE__ !== 'undefined' ? __UPDATE_DATE__ : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-hairline pb-4">
           <span className="text-ink-mute font-medium">Desenvolvedor</span>
           <span className="font-bold text-ink">Welton Luiz Pereira</span>
        </div>
        <div className="flex flex-col gap-2 pt-2">
           <span className="text-ink-mute font-medium text-left">Precisa de ajuda?</span>
           <a href="mailto:welton.pereira@qualitycontactcenter.com.br" className="text-brand font-bold hover:underline flex items-center justify-center gap-2 p-3 bg-brand-wash rounded-lg transition-colors">
              <Mail size={18} /> welton.pereira@qualitycontactcenter.com.br
           </a>
        </div>
      </div>

      <p className="mt-12 text-sm text-ink-faint">© 2026 Todos os direitos reservados.</p>
    </div>
);
