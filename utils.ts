
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Nome amigável, em português, para cada tabela que pode aparecer como
// "on table X" no erro de chave estrangeira do Postgres.
const NOME_AMIGAVEL_TABELA: Record<string, string> = {
  mop_collaborators: 'colaboradores',
  mop_provimento: 'registros de provimento',
  mop_ilhas: 'ilhas',
  mop_supervisors: 'supervisores',
  mop_coordinators: 'coordenadores',
  mop_operations: 'operações',
  mop_clients: 'clientes',
  mop_scheduled_tasks: 'tarefas agendadas',
  mop_vacation_history: 'histórico de férias',
  mop_history: 'histórico',
  mop_users: 'usuários',
};

/**
 * Traduz o erro cru do Postgres/Supabase ao excluir um registro em uma
 * mensagem que faz sentido pra quem está usando o sistema. Violação de
 * chave estrangeira (código 23503) vira "ainda há X vinculados, resolva
 * isso antes"; qualquer outro erro cai na mensagem original do banco.
 */
export const mensagemErroExclusao = (singular: string, err: any): string => {
  const msg: string = err?.message || String(err);
  const isForeignKeyViolation = err?.code === '23503' || /violates foreign key constraint/i.test(msg);

  if (isForeignKeyViolation) {
    const tabelas = [...msg.matchAll(/on table "([^"]+)"/g)].map(m => m[1]);
    const tabelaVinculada = tabelas[tabelas.length - 1];
    const nomeAmigavel = (tabelaVinculada && NOME_AMIGAVEL_TABELA[tabelaVinculada]) || 'outros registros';
    return `Não é possível excluir este ${singular}: ainda há ${nomeAmigavel} vinculados a ele. Remova ou reatribua esses vínculos antes de excluir.`;
  }

  return `Erro ao excluir ${singular}: ${msg}`;
};

export const calculateDaysDiff = (dateStr: string): number => {
  if (!dateStr) return 0;
  // Ajuste para garantir que a string YYYY-MM-DD seja interpretada corretamente no fuso local
  const parts = dateStr.split('-');
  const start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const now = new Date();
  
  start.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  
  const diffTime = now.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

export const formatDateString = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('pt-BR');
};

export const formatTime = (val: string | undefined): string => {
  if (!val) return '00:00';
  return val.substring(0, 5);
};

export const getCollaboratorCalculations = (entryDate: string) => {
  if (!entryDate) {
      return { tempoDeCasa: 0, experiencia: '-', vence: '-', vence45: '-', vence90: '-', contractMilestone: '-' };
  }

  const days = calculateDaysDiff(entryDate);
  const experience = days <= 90 ? "SIM" : "NÃO";
  
  let vence = "-";
  let contractMilestone = "-";
  
  if (days <= 45) {
    vence = addDays(entryDate, 44);
    contractMilestone = "45";
  } else if (days <= 90) {
    vence = addDays(entryDate, 89);
    contractMilestone = "90";
  }

  const vence45 = addDays(entryDate, 44);
  const vence90 = addDays(entryDate, 89);

  return {
    tempoDeCasa: days,
    experiencia: experience,
    vence: vence,
    vence45: vence45,
    vence90: vence90,
    contractMilestone: contractMilestone
  };
};

export const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// --- Parsers para Importação ---

export const parseExcelTime = (val: any): string => {
    if (!val) return '00:00';
    
    if (typeof val === 'number') {
        const totalSeconds = Math.round(val * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    const strVal = String(val).trim();

    if (strVal.includes('T') && strVal.includes(':')) {
        const dateObj = new Date(strVal);
        if (!isNaN(dateObj.getTime())) {
            return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        }
    }
    
    if (strVal.includes(':')) {
        const parts = strVal.split(':');
        const h = parts[0].padStart(2, '0');
        const m = parts[1] ? parts[1].padStart(2, '0') : '00';
        return `${h}:${m}`;
    }
    
    return '00:00';
};

export const parseExcelDate = (val: any): string => {
  if (!val) return '';
  
  // Se for objeto Date nativo JS
  if (val instanceof Date) {
      return val.toISOString().split('T')[0];
  }

  // Se for número serial do Excel
  if (typeof val === 'number') {
    // Ajuste de fuso: Adiciona 12 horas para evitar problemas de arredondamento para o dia anterior
    // O Excel conta dias desde 1900. JS conta ms desde 1970.
    // 25569 é a diferença de dias entre 01/01/1900 e 01/01/1970
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400; 
    const dateInfo = new Date(utcValue * 1000);

    // Ajuste manual para pegar data UTC correta, ignorando timezone do navegador
    const year = dateInfo.getUTCFullYear();
    const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateInfo.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  const strVal = String(val).trim();
  
  // Converter DD/MM/YYYY para YYYY-MM-DD
  if (strVal.includes('/')) {
     const parts = strVal.split('/');
     // DD/MM/YYYY -> YYYY-MM-DD
     if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Se já vier YYYY-MM-DD ou ISO
  if (strVal.includes('-')) {
      return strVal.split('T')[0];
  }

  return strVal;
};
