import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { User, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { ArchipelagoIllustration } from '../components/ArchipelagoIllustration';
import { Input, Button } from '../components/ui';

declare const __APP_VERSION__: string;

export const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
    // ... same as original ...
    const [matricula, setMatricula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        const users = await db.getUsers();
        const user = users.find(u => u.matricula === matricula && u.password === password);
        if (user) { if (user.status !== EntityStatus.ACTIVE) setError('Acesso bloqueado: Usuário inativo.'); else onLogin(user); } 
        else setError('Credenciais inválidas');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-surface rounded-2xl shadow-3 overflow-hidden">
            <div className="hidden md:flex flex-col items-center justify-center gap-6 bg-primary-tonal p-10 mop-fade-up">
              <ArchipelagoIllustration variant="hero" />
              <div className="text-center">
                <h2 className="text-3xl font-black text-primary tracking-tight">Mapa Operacional</h2>
                <p className="text-fg-muted text-sm mt-1">Visão completa das suas ilhas de operação.</p>
              </div>
            </div>

            <div className="p-8 md:p-10 flex flex-col justify-center mop-fade-up" style={{ animationDelay: '120ms' }}>
              <div className="text-center md:text-left mb-8">
                 <h1 className="text-2xl font-bold text-fg">Bem-vindo</h1>
                 <p className="text-fg-muted text-sm">Entre com suas credenciais para acessar.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Matrícula" value={matricula} onChange={(e: any) => setMatricula(e.target.value)} placeholder="Ex: 3924" />
                <Input label="Senha" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••" />
                {error && <div className="text-error text-sm text-center bg-error/10 p-2 rounded-lg">{error}</div>}
                <Button className="w-full justify-center py-3" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Entrar na Plataforma'}</Button>
              </form>
              <p className="mt-6 text-center md:text-left text-xs text-fg-subtle">© 2026 MOP System v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</p>
            </div>
          </div>
        </div>
    );
};
