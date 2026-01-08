export const generateId = () => Math.random().toString(36).substr(2, 9);

export const calculateDaysDiff = (dateStr: string): number => {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const now = new Date();
  
  // Zerar horas para cálculo correto de dias
  start.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  
  const diffTime = now.getTime() - start.getTime();
  // Math.floor para dias completos passados
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

export const formatDateString = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  // Expects YYYY-MM-DD from input[type="date"]
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
  // Remove segundos se existirem para ficar mais limpo na tabela
  return val.substring(0, 5);
};

// Excel Logic Implementation based on Screenshot Formulas
export const getCollaboratorCalculations = (entryDate: string) => {
  if (!entryDate) {
      return { tempoDeCasa: 0, experiencia: '-', vence: '-' };
  }

  // Fórmula: HOJE() - G2 (Data Entrada)
  const days = calculateDaysDiff(entryDate);
  
  // Fórmula: SE(Tempo <= 90; "SIM"; "NÃO")
  const experience = days <= 90 ? "SIM" : "NÃO";
  
  // Fórmula: SE(Dias<=45; Data+45; SE(Dias<=90; Data+90; "-"))
  let vence = "-";
  if (days <= 45) {
    vence = addDays(entryDate, 45); // 1º Período
  } else if (days <= 90) {
    vence = addDays(entryDate, 90); // 2º Período
  }

  return {
    tempoDeCasa: days,
    experiencia: experience,
    vence: vence
  };
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
    if (strVal.includes(':')) {
        return strVal.substring(0, 5);
    }
    return '00:00';
};

export const parseExcelDate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  const strVal = String(val).trim();
  // Tenta converter DD/MM/YYYY para YYYY-MM-DD
  if (strVal.includes('/')) {
     const parts = strVal.split('/');
     if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return strVal; // Assume que já está ISO ou retorna erro depois
};