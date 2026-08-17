import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { User, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { Logo } from '../components/brand/Logo';
import { Input, Button } from '../components/ui';

declare const __APP_VERSION__: string;

export const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
    const [matricula, setMatricula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        const users = await db.getUsers();
        const user = users.find(u => u.matricula === matricula && u.password === password);
        if (user) {
            if (user.status !== EntityStatus.ACTIVE) {
                setError('Este acesso está inativo. Fale com o RH para reativar.');
            } else {
                onLogin(user);
            }
        } else {
            setError('Matrícula ou senha incorreta.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-canvas">
          {/* Palco escuro nos dois temas: o logo foi desenhado para fundo
              escuro — a linha "Contact Center" é branca no arquivo. */}
          <div className="hidden lg:grid place-items-center p-12" style={{ background: '#121110', color: '#F5F1EF' }}>
            <Logo variant="lockup" className="w-[min(430px,84%)]" />
          </div>

          <div className="grid place-items-center p-8 md:p-12">
            <div className="w-full max-w-[330px]">
              <span className="t-eyebrow text-ink-faint block mb-3">Mapa Operacional</span>
              <h1 className="t-display-xl text-ink">Entrar</h1>
              <p className="text-ink-mute text-sm mt-2.5 mb-7">
                Use a matrícula e a senha que o RH cadastrou para você.
              </p>

              {error && (
                <div className="text-[13px] px-3 py-2.5 mb-4 rounded-sm text-danger bg-danger/10 border border-danger/25" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Input label="Matrícula" inputMode="numeric" className="t-data"
                       value={matricula} onChange={(e: any) => setMatricula(e.target.value)} />
                <Input label="Senha" type="password"
                       value={password} onChange={(e: any) => setPassword(e.target.value)} />
                <Button type="submit" block disabled={loading} className="mt-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                </Button>
              </form>

              <p className="mt-6 text-xs text-ink-faint">
                Quality Contact Center · MOP v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0'}
              </p>
            </div>
          </div>
        </div>
    );
};
