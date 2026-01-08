import { 
  User, Coordinator, Supervisor, Client, Operation, Ilha, Collaborator, 
  UserRole, EntityStatus, CollaboratorStatus, HistoryLog 
} from '../types';
import { generateId } from '../utils';

const STORAGE_KEYS = {
  USERS: 'qcc_users',
  COORDINATORS: 'qcc_coordinators',
  SUPERVISORS: 'qcc_supervisors',
  CLIENTS: 'qcc_clients',
  OPERATIONS: 'qcc_operations',
  ILHAS: 'qcc_ilhas',
  COLLABORATORS: 'qcc_collaborators',
  HISTORY: 'qcc_history',
  INIT: 'qcc_init'
};

// Seed Data
const INITIAL_ADMIN: User = {
  nome: 'Welton Luiz de Jesus Pereira',
  email: 'welton.pereira@qualitycontactcenter.com.br',
  matricula: '3924',
  role: UserRole.ADMIN,
  password: 'Wljp.102002'
};

class MockDbService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.INIT)) {
      // Seed Admin only
      this.save(STORAGE_KEYS.USERS, [INITIAL_ADMIN]);
      
      // Initialize other lists as empty to avoid null issues
      this.save(STORAGE_KEYS.COORDINATORS, []);
      this.save(STORAGE_KEYS.SUPERVISORS, []);
      this.save(STORAGE_KEYS.CLIENTS, []);
      this.save(STORAGE_KEYS.OPERATIONS, []);
      this.save(STORAGE_KEYS.ILHAS, []);
      this.save(STORAGE_KEYS.COLLABORATORS, []);
      this.save(STORAGE_KEYS.HISTORY, []);

      localStorage.setItem(STORAGE_KEYS.INIT, 'true');
    }
  }

  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Users ---
  getUsers(): User[] { return this.get<User>(STORAGE_KEYS.USERS); }
  
  addUser(user: User) { 
    const users = this.getUsers();
    if (users.find(u => u.matricula === user.matricula)) throw new Error("Matrícula já existe");
    this.save(STORAGE_KEYS.USERS, [...users, user]);
  }

  updateUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.matricula === user.matricula);
    if (idx >= 0) {
        users[idx] = user;
        this.save(STORAGE_KEYS.USERS, users);
    }
  }

  deleteUser(matricula: string) {
    const users = this.getUsers().filter(u => u.matricula !== matricula);
    this.save(STORAGE_KEYS.USERS, users);
  }

  // --- History ---
  getHistory(): HistoryLog[] { return this.get<HistoryLog>(STORAGE_KEYS.HISTORY); }
  
  addHistory(log: Omit<HistoryLog, 'id'>) {
    const list = this.getHistory();
    const newLog: HistoryLog = { ...log, id: generateId() };
    list.unshift(newLog); // Add to top
    this.save(STORAGE_KEYS.HISTORY, list);
  }

  // --- Coordinators ---
  getCoordinators() { return this.get<Coordinator>(STORAGE_KEYS.COORDINATORS); }
  saveCoordinator(data: Coordinator) {
    const list = this.getCoordinators();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx >= 0) list[idx] = data; else list.push(data);
    this.save(STORAGE_KEYS.COORDINATORS, list);
  }
  
  findOrCreateCoordinator(name: string): Coordinator {
    const list = this.getCoordinators();
    const existing = list.find(i => i.nome.trim().toUpperCase() === name.trim().toUpperCase());
    if (existing) return existing;
    const newCoord: Coordinator = { id: generateId(), nome: name, status: EntityStatus.ACTIVE };
    this.saveCoordinator(newCoord);
    return newCoord;
  }
  
  deleteCoordinator(id: string) {
    const list = this.getCoordinators().filter(i => i.id !== id);
    this.save(STORAGE_KEYS.COORDINATORS, list);
  }

  // --- Supervisors ---
  getSupervisors() { return this.get<Supervisor>(STORAGE_KEYS.SUPERVISORS); }
  saveSupervisor(data: Supervisor) {
    const list = this.getSupervisors();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx >= 0) list[idx] = data; else list.push(data);
    this.save(STORAGE_KEYS.SUPERVISORS, list);
  }

  findOrCreateSupervisor(name: string, coordinatorId: string): Supervisor {
    const list = this.getSupervisors();
    const existing = list.find(i => i.nome.trim().toUpperCase() === name.trim().toUpperCase());
    if (existing) return existing;
    const newSup: Supervisor = { id: generateId(), nome: name, coordinatorId, status: EntityStatus.ACTIVE };
    this.saveSupervisor(newSup);
    return newSup;
  }

  deleteSupervisor(id: string) {
    const list = this.getSupervisors().filter(i => i.id !== id);
    this.save(STORAGE_KEYS.SUPERVISORS, list);
  }

  // --- Clients ---
  getClients() { return this.get<Client>(STORAGE_KEYS.CLIENTS); }
  saveClient(data: Client) {
    const list = this.getClients();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx >= 0) list[idx] = data; else list.push(data);
    this.save(STORAGE_KEYS.CLIENTS, list);
  }

  findOrCreateClient(name: string): Client {
    const list = this.getClients();
    const existing = list.find(i => i.nome.trim().toUpperCase() === name.trim().toUpperCase());
    if (existing) return existing;
    const newItem: Client = { id: generateId(), nome: name, status: EntityStatus.ACTIVE };
    this.saveClient(newItem);
    return newItem;
  }

  deleteClient(id: string) {
    const list = this.getClients().filter(i => i.id !== id);
    this.save(STORAGE_KEYS.CLIENTS, list);
  }

  // --- Operations ---
  getOperations() { return this.get<Operation>(STORAGE_KEYS.OPERATIONS); }
  saveOperation(data: Operation) {
    const list = this.getOperations();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx >= 0) list[idx] = data; else list.push(data);
    this.save(STORAGE_KEYS.OPERATIONS, list);
  }

  findOrCreateOperation(name: string, clientId: string): Operation {
    const list = this.getOperations();
    const existing = list.find(i => i.nome.trim().toUpperCase() === name.trim().toUpperCase());
    if (existing) return existing;
    const newItem: Operation = { id: generateId(), nome: name, clientId, status: EntityStatus.ACTIVE };
    this.saveOperation(newItem);
    return newItem;
  }

  deleteOperation(id: string) {
    const list = this.getOperations().filter(i => i.id !== id);
    this.save(STORAGE_KEYS.OPERATIONS, list);
  }

  // --- Ilhas ---
  getIlhas() { return this.get<Ilha>(STORAGE_KEYS.ILHAS); }
  saveIlha(data: Ilha) {
    const list = this.getIlhas();
    const idx = list.findIndex(i => i.id === data.id);
    if (idx >= 0) list[idx] = data; else list.push(data);
    this.save(STORAGE_KEYS.ILHAS, list);
  }

  findOrCreateIlha(name: string, clientId: string, opId: string, coordId: string, supId: string): Ilha {
    const list = this.getIlhas();
    const existing = list.find(i => i.nome.trim().toUpperCase() === name.trim().toUpperCase());
    if (existing) return existing;
    const newItem: Ilha = { 
      id: generateId(), 
      nome: name, 
      clientId, 
      operationId: opId,
      coordinatorId: coordId,
      supervisorId: supId,
      status: EntityStatus.ACTIVE 
    };
    this.saveIlha(newItem);
    return newItem;
  }

  deleteIlha(id: string) {
    const list = this.getIlhas().filter(i => i.id !== id);
    this.save(STORAGE_KEYS.ILHAS, list);
  }

  // --- Collaborators ---
  getCollaborators() { return this.get<Collaborator>(STORAGE_KEYS.COLLABORATORS); }
  
  saveCollaborator(data: Collaborator) {
    const list = this.getCollaborators();
    const idx = list.findIndex(i => i.matricula === data.matricula);
    if (idx >= 0) list[idx] = data; else list.push(data);
    this.save(STORAGE_KEYS.COLLABORATORS, list);
  }
  
  deleteCollaborator(matricula: string) {
    const list = this.getCollaborators().filter(c => c.matricula !== matricula);
    this.save(STORAGE_KEYS.COLLABORATORS, list);
  }
  
  bulkCreateCollaborators(collabs: Collaborator[]) {
    const current = this.getCollaborators();
    // Create a map for faster lookup/merge
    const map = new Map(current.map(c => [c.matricula, c]));
    
    collabs.forEach(c => {
      map.set(c.matricula, c);
    });

    this.save(STORAGE_KEYS.COLLABORATORS, Array.from(map.values()));
  }
}

export const db = new MockDbService();