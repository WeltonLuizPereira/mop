export enum UserRole {
  ADMIN = 'ADMIN',
  VIEWER = 'VISUALIZADOR'
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
  REALOCADO = 'REALOCADO'
}

export interface User {
  matricula: string;
  nome: string;
  email: string;
  role: UserRole;
  password?: string; // Only for auth check
}

export interface Coordinator {
  id: string;
  nome: string;
  status: EntityStatus;
}

export interface Supervisor {
  id: string;
  nome: string;
  coordinatorId: string;
  status: EntityStatus;
}

export interface Client {
  id: string;
  nome: string;
  status: EntityStatus;
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
  coordinatorId: string;
  supervisorId: string;
  status: EntityStatus;
}

export interface Collaborator {
  matricula: string; // Primary Key e Visual
  email: string;
  nome: string;
  
  // Relacionamentos (IDs para banco, mas nomes para exportação)
  ilhaId: string;
  supervisorId: string;   // Pode ser derivado da ilha ou override
  coordinatorId: string;  // Derivado
  operationId: string;    // Derivado
  clientId: string;       // Derivado
  
  status: CollaboratorStatus;
  
  // Datas e Horários
  dtEntradaProduto: string; // "Data da Entrada no Produto"
  dataFim?: string;         // "Data de Desligamento"
  horarioEntrada: string;
  horarioSaida: string;
  dtNasc: string;
  
  // Controle de Férias (Interno)
  feriasInicio?: string;
  feriasFim?: string;
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