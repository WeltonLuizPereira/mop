
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'GERENTE',
  VIEWER = 'VISUALIZADOR',
  COORDINATOR = 'COORDENADOR',
  SUPERVISOR = 'SUPERVISOR',
  RH = 'RH',
  SUPPORT = 'SUPORTE'
}

export enum EntityStatus {
  ACTIVE = 'ATIVO',
  INACTIVE = 'INATIVO'
}

export enum CollaboratorStatus {
  ATIVO = 'ATIVO',
  DESLIGADO = 'DESLIGADO',
  FERIAS = 'FÉRIAS',
  LICENCA_MATERNIDADE = 'LICENÇA MATERNIDADE',
  REALOCADO = 'REALOCADO',
  AVISO_PREVIO = 'AVISO PRÉVIO',
  AFASTADO = 'AFASTADO'
}

export interface User {
  id: string; // Required for CrudPage compatibility
  matricula: string;
  nome: string;
  email: string;
  role: UserRole;
  password?: string; // Only for auth check
  status: EntityStatus; // Required for CrudPage compatibility
}

export interface Coordinator {
  id: string;
  nome: string;
  status: EntityStatus;
}

export interface Supervisor {
  id: string;
  nome: string;
  coordinatorIds: string[];
  status: EntityStatus;
}

export interface Client {
  id: string;
  nome: string;
  status: EntityStatus;
  logo?: string;
}

export interface Operation {
  id: string;
  nome: string;
  clientId: string;
  status: EntityStatus;
}

export interface Ilha {
  id: string;
  nome: string;
  clientId: string;
  operationId: string;
  coordinatorIds: string[];
  supervisorIds: string[];
  status: EntityStatus;
}

export interface Collaborator {
  matricula: string; // Primary Key e Visual
  email: string;
  nome: string;
  
  // Novos Campos VR
  email_vr?: string;
  senha?: string;

  // Relacionamentos (IDs para banco, mas nomes para exportação)
  ilhaId: string;
  supervisorId: string;   // Pode ser derivado da ilha ou override
  coordinatorId: string;  // Derivado
  operationId: string;    // Derivado
  clientId: string;       // Derivado
  
  status: CollaboratorStatus;
  
  // Datas e Horários
  dtEntradaProduto: string; // "Data da Entrada no Produto"
  dataFim?: string;         // "Data de Desligamento" ou "Fim do Aviso"
  horarioEntrada: string;
  horarioSaida: string;
  dtNasc: string;
  
  // Controle de Férias (Interno)
  feriasInicio?: string;
  feriasFim?: string;

  // Controle de Afastamento
  dataAfastamento?: string;

  // Controle de Contrato
  efetivacao?: 'SIM' | 'NÃO';
}

export interface VacationHistory {
  id: string;
  collaborator_matricula: string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface HistoryLog {
  id: string;
  action: string;
  target: string;
  user: string;
  date: string;
  type: 'create' | 'update' | 'delete' | 'import';
  details?: string;
}

export interface Provimento {
  id: string;
  ilhaId: string;
  /** Sempre o dia 1 do mês, "YYYY-MM-01". */
  referencia: string;
  paContratada: number;
}

export interface ScheduledTask {
  id: string;
  matricula: string;
  changes: Partial<Collaborator>;
  scheduled_date: string; // YYYY-MM-DD
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
}
