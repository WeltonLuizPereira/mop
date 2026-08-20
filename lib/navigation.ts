import {
  AlertCircle, AlertTriangle, Briefcase, Building2, Cake, Calendar, Globe,
  History, Info, LayoutDashboard, ListChecks, MapPin, Network, PieChart,
  ShieldCheck, Sprout, Stethoscope, Sun, Target, TrendingUp, Upload, UserCog, UserMinus,
  UserX, Users,
} from 'lucide-react';
import { UserRole } from '../types';

export interface NavItemDef {
  key: string;
  label: string;
  icon: typeof Users;
  roles: readonly UserRole[];
}
export interface NavGroup {
  group: string;
  items: NavItemDef[];
}

const TODOS = Object.values(UserRole);
const SEM_VISUALIZADOR = TODOS.filter(r => r !== UserRole.VIEWER);
const SO_ADMIN = [UserRole.ADMIN] as const;

export const NAV_GROUPS: NavGroup[] = [
  { group: 'Principal', items: [
    { key: 'dashboard', label: 'Visão geral', icon: LayoutDashboard, roles: TODOS },
    { key: 'distribuicao', label: 'Dashboard', icon: PieChart, roles: TODOS },
  ]},
  { group: 'Gestão', items: [
    { key: 'collaborators', label: 'Colaboradores', icon: Users, roles: TODOS },
    { key: 'organogram', label: 'Organograma', icon: Network, roles: TODOS },
    { key: 'turnover', label: 'Turnover', icon: TrendingUp, roles: SEM_VISUALIZADOR },
    { key: 'safra', label: 'Safra', icon: Sprout, roles: SEM_VISUALIZADOR },
  ]},
  { group: 'RH', items: [
    { key: 'birthdays', label: 'Aniversariantes', icon: Cake, roles: TODOS },
    { key: 'desligados', label: 'Desligados', icon: UserX, roles: TODOS },
    { key: 'expiring', label: 'Vencimento de contratos', icon: AlertCircle, roles: SEM_VISUALIZADOR },
    { key: 'vacation', label: 'Férias', icon: Sun, roles: SEM_VISUALIZADOR },
    { key: 'aviso_previo', label: 'Aviso prévio', icon: UserMinus, roles: SEM_VISUALIZADOR },
    { key: 'afastados', label: 'Afastados e licenças', icon: Stethoscope, roles: SEM_VISUALIZADOR },
  ]},
  { group: 'Cadastros', items: [
    { key: 'clients', label: 'Clientes', icon: Building2, roles: SO_ADMIN },
    { key: 'operations', label: 'Operações', icon: Globe, roles: SO_ADMIN },
    { key: 'ilhas', label: 'Ilhas', icon: MapPin, roles: SO_ADMIN },
    { key: 'provimento', label: 'Provimento', icon: Target, roles: SO_ADMIN },
    { key: 'coordinators', label: 'Coordenadores', icon: Briefcase, roles: SO_ADMIN },
    { key: 'supervisors', label: 'Supervisores', icon: UserCog, roles: SO_ADMIN },
  ]},
  { group: 'Administração', items: [
    { key: 'users', label: 'Usuários', icon: ShieldCheck, roles: SO_ADMIN },
  ]},
  { group: 'Sistema', items: [
    { key: 'scheduled_tasks', label: 'Tarefas agendadas', icon: Calendar, roles: SO_ADMIN },
    { key: 'import', label: 'Importar dados', icon: Upload, roles: SO_ADMIN },
    { key: 'bulk_update', label: 'Update em massa', icon: ListChecks, roles: SO_ADMIN },
    { key: 'history', label: 'Histórico', icon: History, roles: SO_ADMIN },
    { key: 'reset', label: 'Resetar dados', icon: AlertTriangle, roles: SO_ADMIN },
  ]},
  { group: 'Ajuda', items: [
    { key: 'about', label: 'Sobre', icon: Info, roles: TODOS },
  ]},
];

/** Grupos com pelo menos um item visível para o perfil. */
export function visibleGroups(role: UserRole): NavGroup[] {
  return NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(role)) }))
    .filter(g => g.items.length > 0);
}

const TITULOS = new Map(
  NAV_GROUPS.flatMap(g => g.items.map(i => [i.key, i.label] as const)),
);

export function pageTitle(key: string): string {
  return TITULOS.get(key) ?? 'MOP';
}
