import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertTriangle, Gift, TrendingUp, TrendingDown, User as UserIcon, Sun, UserMinus } from 'lucide-react';
import { User, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { getCollaboratorCalculations } from '../utils';

export const DashboardPage: React.FC<{ currentUser: User, onNavigate: (page: string) => void }> = ({ currentUser, onNavigate }) => {
    // ... same as original ...
  const [stats, setStats] = useState({
     total: 0,
     active: 0,
     vacation: 0,
     inactive: 0
  });
  
  const [operationsStats, setOperationsStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [ilhaStats, setIlhaStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [supervisorStats, setSupervisorStats] = useState<{name: string, count: number, percent: number}[]>([]);
  const [expiringCount, setExpiringCount] = useState(0);
  const [avisoPrevioCount, setAvisoPrevioCount] = useState(0);
  const [birthdaysCount, setBirthdaysCount] = useState(0);

  useEffect(() => {
     const load = async () => {
         const collabs = await db.getCollaborators();
         const ops = await db.getOperations();
         const ilhas = await db.getIlhas();
         const supervisors = await db.getSupervisors();
         
         const total = collabs.length;
         const active = collabs.filter(c => c.status === CollaboratorStatus.ATIVO);
         const vacation = collabs.filter(c => c.status === CollaboratorStatus.FERIAS).length;
         const inactive = collabs.filter(c => c.status === CollaboratorStatus.DESLIGADO).length;
         
         setStats({ total, active: active.length, vacation, inactive });
         setAvisoPrevioCount(collabs.filter(c => c.status === CollaboratorStatus.AVISO_PREVIO).length);

         const opStats = ops.map(op => {
             const count = active.filter(c => c.operationId === op.id).length;
             return {
                 name: op.nome,
                 count: count,
                 percent: active.length > 0 ? Math.round((count / active.length) * 100) : 0
             };
         }).sort((a, b) => b.count - a.count);
         setOperationsStats(opStats);

         const ilStats = ilhas.map(il => {
            const count = active.filter(c => c.ilhaId === il.id).length;
            return {
                name: il.nome,
                count: count,
                percent: active.length > 0 ? Math.round((count / active.length) * 100) : 0
            };
         }).sort((a, b) => b.count - a.count);
         setIlhaStats(ilStats);

         const supStats = supervisors.map(sup => {
            const count = active.filter(c => c.supervisorId === sup.id).length;
            return {
                name: sup.nome,
                count: count,
                percent: active.length > 0 ? Math.round((count / active.length) * 100) : 0
            };
         }).sort((a, b) => b.count - a.count);
         setSupervisorStats(supStats);

         const expiring = active.filter(c => {
            const calc = getCollaboratorCalculations(c.dtEntradaProduto);
            if (calc.vence === '-') return false;
            const parts = calc.vence.split('/');
            const vDate = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
            const now = new Date();
            now.setHours(0,0,0,0);
            const diffTime = vDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 15;
         });
         setExpiringCount(expiring.length);

         // Birthdays Logic
         const currentMonth = new Date().getMonth();
         const bdays = collabs.filter(c => {
            if(!c.dtNasc) return false;
            const m = parseInt(c.dtNasc.split('-')[1]) - 1;
            return m === currentMonth;
        }).length;
        setBirthdaysCount(bdays);
     }
     load();
  }, []);

  const Card = ({ title, value, subtext, trend, trendValue, icon: Icon, colorClass }: any) => (
      <div className="bg-surface p-5 rounded-2xl shadow-1 border border-border flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-fg-muted text-xs font-bold uppercase tracking-wide">{title}</p>
                  <h3 className="text-3xl font-bold text-fg mt-1">{value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-surface-alt ${colorClass}`}>
                  <Icon size={20} />
              </div>
          </div>
          <div className="mt-2">
              <div className="flex items-center gap-1 text-xs font-medium">
                  {trend === 'up' ? <TrendingUp size={14} className="text-success"/> : <TrendingDown size={14} className="text-error"/>}
                  <span className="text-success">{trendValue}</span>
                  <span className="text-fg-subtle ml-1">{subtext}</span>
              </div>
          </div>
      </div>
  );

  const DistributionList = ({ title, data }: { title: string, data: any[] }) => (
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-1 h-full">
          <h3 className="font-bold text-fg mb-6">{title}</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {data.map(item => (
                  <div key={item.name}>
                      <div className="flex justify-between text-xs font-bold text-fg-muted mb-1">
                          <span className="truncate max-w-[70%]">{item.name.toUpperCase()}</span>
                          <span>{item.percent}% ({item.count})</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${item.percent}%` }}></div>
                      </div>
                  </div>
              ))}
              {data.length === 0 && <p className="text-fg-subtle text-sm">Sem dados registrados.</p>}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 mop-fade-up pb-10">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-fg">Visão Geral</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card
               title="Total Colaboradores"
               value={stats.total}
               subtext="vs mês anterior"
               trend="up"
               trendValue="+4%"
               icon={Users}
               colorClass="text-primary"
           />
           <Card
               title="Em Operação / Ativos"
               value={stats.active}
               subtext="de quadro total"
               trend="up"
               trendValue={`${stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}%`}
               icon={CheckCircle}
               colorClass="text-success"
           />
           <Card
               title="Em Férias"
               value={stats.vacation}
               subtext="Próximo retorno: 26/02"
               trend="down"
               trendValue=""
               icon={Sun}
               colorClass="text-fg"
           />
           <Card
               title="Desligados / Licença"
               value={stats.inactive}
               subtext="turnover mensal"
               trend="down"
               trendValue="-1%"
               icon={UserIcon}
               colorClass="text-error"
           />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <DistributionList title="Distribuição por Operação" data={operationsStats} />
           </div>

           <div className="bg-surface p-6 rounded-2xl border border-border shadow-1 space-y-4 h-full">
               <h3 className="font-bold text-fg mb-2">Avisos Recentes</h3>
               <div
                   onClick={() => onNavigate('expiring')}
                   className="p-3 bg-error/10 border border-error/20 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-error/15 transition-colors"
               >
                   <div className="text-error mt-0.5"><AlertTriangle size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Fim de Contrato Próximo</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                         {expiringCount > 0
                             ? `${expiringCount} colaboradores vencem contrato nos próximos 15 dias. Clique para ver.`
                             : `Nenhum contrato vencendo nos próximos 15 dias.`}
                       </p>
                   </div>
               </div>

               <div
                   onClick={() => onNavigate('aviso_previo')}
                   className="p-3 bg-warning/15 border border-warning/30 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-warning/25 transition-colors"
               >
                   <div className="text-fg mt-0.5"><UserMinus size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Colaboradores em Aviso Prévio</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                         {avisoPrevioCount > 0
                             ? `${avisoPrevioCount} colaboradores atualmente em aviso. Clique para gerenciar.`
                             : `Nenhum colaborador em aviso prévio.`}
                       </p>
                   </div>
               </div>

                <div
                   onClick={() => onNavigate('vacation')}
                   className="p-3 bg-primary-tonal border border-primary/20 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-primary/15 transition-colors"
               >
                   <div className="text-primary mt-0.5"><Sun size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Colaboradores em Férias</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                           {stats.vacation > 0
                               ? `${stats.vacation} colaboradores em gozo de férias. Clique para gerenciar.`
                               : `Nenhum colaborador em férias no momento.`}
                       </p>
                   </div>
               </div>

               <div
                   onClick={() => onNavigate('birthdays')}
                   className="p-3 bg-success/10 border border-success/20 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-success/15 transition-colors"
               >
                   <div className="text-success mt-0.5"><Gift size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Aniversariantes do Mês</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                           {birthdaysCount > 0
                               ? `${birthdaysCount} colaboradores celebram ano este mês.`
                               : 'Nenhum aniversariante este mês.'}
                       </p>
                   </div>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <DistributionList title="Distribuição por Ilha" data={ilhaStats} />
           <DistributionList title="Distribuição por Supervisor" data={supervisorStats} />
       </div>
    </div>
  );
};
