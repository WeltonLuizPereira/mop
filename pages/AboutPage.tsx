import React from 'react';
import { Info, Mail } from 'lucide-react';

declare const __APP_VERSION__: string;
declare const __UPDATE_DATE__: string;

export const AboutPage = () => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <Info size={48} />
      </div>
      <h2 className="text-4xl font-bold text-gray-900 mb-2">MOP - Mapa Operacional</h2>
      <p className="text-xl text-gray-500 mb-8">Desenvolvido para simplificar o seu dia a dia.</p>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full space-y-6">
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <span className="text-gray-500 font-medium">Versão</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <span className="text-gray-500 font-medium">Última Atualização</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">{typeof __UPDATE_DATE__ !== 'undefined' ? __UPDATE_DATE__ : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
           <span className="text-gray-500 font-medium">Desenvolvedor</span>
           <span className="font-bold text-gray-900">Welton Luiz Pereira</span>
        </div>
        <div className="flex flex-col gap-2 pt-2">
           <span className="text-gray-500 font-medium text-left">Precisa de ajuda?</span>
           <a href="mailto:welton.pereira@qualitycontactcenter.com.br" className="text-brand-600 font-bold hover:underline flex items-center justify-center gap-2 p-3 bg-brand-50 rounded-xl transition-colors">
              <Mail size={18} /> welton.pereira@qualitycontactcenter.com.br
           </a>
        </div>
      </div>

      <p className="mt-12 text-sm text-gray-400">© 2026 Todos os direitos reservados.</p>
    </div>
);
