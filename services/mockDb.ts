
import {
  User, Coordinator, Supervisor, Client, Operation, Ilha, Collaborator, Provimento,
  UserRole, EntityStatus, HistoryLog, ScheduledTask
} from '../types';
import { generateId } from '../utils';
import { provimentoParaAutoCadastro, referenciaDoMes } from '../lib/provimentoStats';
import { supabase } from './supabase';

/**
 * Teto de linhas por requisição do PostgREST, a camada que o Supabase expõe.
 */
const PAGINA = 1000;

/**
 * Lê uma tabela inteira, página por página.
 *
 * O PostgREST devolve no máximo `PAGINA` linhas por requisição e **não
 * sinaliza o corte**: a resposta chega 200, com a lista truncada e nenhum
 * aviso. Quem lê sem paginar acredita ter lido tudo. Foi assim que a tela de
 * Colaboradores parou de mostrar o fim do alfabeto ao passar de mil pessoas —
 * a consulta ordenava por nome e o corte comia a cauda.
 */
async function buscarTudo<T>(
  pagina: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error?: any }>,
): Promise<{ data: T[]; error: any }> {
  const tudo: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await pagina(de, de + PAGINA - 1);
    if (error) return { data: tudo, error };
    if (!data || data.length === 0) break;
    tudo.push(...data);
    // página incompleta significa fim da tabela — evita uma requisição a mais
    if (data.length < PAGINA) break;
  }
  return { data: tudo, error: null };
}

// Seed Data para fallback
const INITIAL_ADMIN: User = {
  id: '3924',
  nome: 'Welton Luiz de Jesus Pereira',
  email: 'welton.pereira@qualitycontactcenter.com.br',
  matricula: '3924',
  role: UserRole.ADMIN,
  password: 'Wljp.102002',
  status: EntityStatus.ACTIVE
};

class SupabaseService {
  
  // --- Reset Functionality ---
  async resetDatabase() {
    // Apagar dados em ordem de dependência (Foreign Keys)
    const steps: [string, () => PromiseLike<{ error: any }>][] = [
        ['mop_scheduled_tasks', () => supabase.from('mop_scheduled_tasks').delete().neq('id', '0')],
        ['mop_history', () => supabase.from('mop_history').delete().neq('id', '0')],
        ['mop_collaborators', () => supabase.from('mop_collaborators').delete().neq('matricula', '0')],
        ['mop_ilhas', () => supabase.from('mop_ilhas').delete().neq('id', '0')],
        ['mop_supervisors', () => supabase.from('mop_supervisors').delete().neq('id', '0')],
        ['mop_coordinators', () => supabase.from('mop_coordinators').delete().neq('id', '0')],
        ['mop_operations', () => supabase.from('mop_operations').delete().neq('id', '0')],
        ['mop_clients', () => supabase.from('mop_clients').delete().neq('id', '0')],
    ];
    for (const [table, run] of steps) {
        const { error } = await run();
        if (error) throw new Error(`Falha ao limpar ${table}: ${error.message}`);
    }
    
    // Manter admin padrão se não houver usuários
    const { data: users } = await supabase.from('mop_users').select('*');
    if (!users || users.length === 0) {
       await this.addUser(INITIAL_ADMIN);
    }

    await this.addHistory({
      action: 'RESET DO SISTEMA',
      target: 'Todos os Dados',
      user: 'Sistema',
      date: new Date().toLocaleString('pt-BR'),
      type: 'delete',
      details: 'Limpeza geral realizada via Banco de Dados.'
    });
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const { data, error } = await buscarTudo<any>((de, ate) =>
        supabase.from('mop_users').select('*').range(de, ate));
    if (error) console.error('Erro ao buscar usuários:', error);
    // Fallback se não houver usuários (primeiro acesso)
    if (!data || data.length === 0) return [INITIAL_ADMIN];
    return data || [];
  }
  
  async addUser(user: User) { 
    // Validação básica de unicidade de matrícula via backend seria melhor, mas mantendo simples
    const newUser = { ...user, id: user.id || generateId(), status: user.status || EntityStatus.ACTIVE };
    const { error } = await supabase.from('mop_users').insert(newUser);
    if (error) throw error;
  }

  async updateUser(user: User) {
    const { error } = await supabase.from('mop_users').update(user).eq('id', user.id);
    if (error) throw error;
  }

  async deleteUser(id: string) {
    const { error } = await supabase.from('mop_users').delete().eq('id', id);
    if (error) throw error;
  }

  // --- History ---
  async getHistory(): Promise<HistoryLog[]> { 
    // Buscamos sem ordenação do banco pois o campo date é string DD/MM/YYYY e a ordenação SQL seria alfabética incorreta
    const { data, error } = await buscarTudo<any>((de, ate) =>
        supabase.from('mop_history').select('*').range(de, ate));
    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
    
    // Ordenação Client-Side para corrigir formato de data PT-BR
    const sorted = (data || []).sort((a, b) => {
        const getTimestamp = (dt: string) => {
            if(!dt) return 0;
            // Tenta formato ISO
            if(dt.includes('T') && dt.includes('-')) return new Date(dt).getTime();
            
            // Tenta formato PT-BR (DD/MM/YYYY HH:MM:SS)
            // Remove vírgula se houver (ex: toLocaleString em alguns browsers)
            const clean = dt.replace(',', '');
            const [datePart, timePart] = clean.split(' ');
            
            if (!datePart) return 0;
            const dParts = datePart.split('/');
            
            if (dParts.length !== 3) return 0; // Formato desconhecido
            
            const tParts = timePart ? timePart.split(':') : [0,0,0];
            
            // year, monthIndex, day, hours, minutes, seconds
            return new Date(
                Number(dParts[2]), 
                Number(dParts[1]) - 1, 
                Number(dParts[0]),
                Number(tParts[0]||0),
                Number(tParts[1]||0),
                Number(tParts[2]||0)
            ).getTime();
        };

        return getTimestamp(b.date) - getTimestamp(a.date);
    });

    return sorted; 
  }
  
  async getVacationHistory(matricula?: string): Promise<any[]> {
    const { data, error } = await buscarTudo<any>((de, ate) => {
        let query = supabase.from('mop_vacation_history').select('*');
        if (matricula) {
            query = query.eq('collaborator_matricula', matricula);
        }
        return query.order('start_date', { ascending: false }).range(de, ate);
    });
    if (error) {
      console.error('Erro ao buscar histórico de férias:', error);
      return [];
    }
    return data || [];
  }

  async addVacationHistory(matricula: string, startDate: string, endDate: string) {
    const { error } = await supabase.from('mop_vacation_history').insert({
        collaborator_matricula: matricula,
        start_date: startDate,
        end_date: endDate
    });
    if (error) {
        console.error('Erro ao adicionar histórico de férias:', error);
    }
  }

  async addHistory(log: Omit<HistoryLog, 'id'>) {
    // Garante formato consistente se não fornecido
    if (!log.date) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        log.date = `${d}/${m}/${y} ${h}:${min}:${s}`;
    }

    const newLog = { ...log, id: generateId() };
    const { error } = await supabase.from('mop_history').insert(newLog);
    if (error) {
      console.error('Erro CRÍTICO ao salvar histórico:', error);
      // Log adicional para debug se necessário
      console.log('Tentativa de log falha:', newLog);
    }
  }

  // --- Helpers Genéricos de CRUD ---
  private async getAll<T>(table: string): Promise<T[]> {
    const { data } = await buscarTudo<T>((de, ate) => {
      let query = supabase.from(table).select('*');
      if (table !== 'mop_users') query = query.order('nome');
      return query.range(de, ate);
    });
    return data;
  }

  private async saveItem<T extends { id: string }>(table: string, item: T) {
    const { data } = await supabase.from(table).select('id').eq('id', item.id).single();
    if (data) {
      await supabase.from(table).update(item).eq('id', item.id);
    } else {
      await supabase.from(table).insert(item);
    }
  }

  private async deleteItem(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  // --- Coordinators ---
  async getCoordinators() { return this.getAll<Coordinator>('mop_coordinators'); }
  async saveCoordinator(data: Coordinator) { await this.saveItem('mop_coordinators', data); }
  async deleteCoordinator(id: string) { await this.deleteItem('mop_coordinators', id); }
  
  async findOrCreateCoordinator(name: string): Promise<Coordinator> {
    const { data } = await supabase.from('mop_coordinators').select('*').ilike('nome', name).single();
    if (data) return data;
    const newItem: Coordinator = { id: generateId(), nome: name, status: EntityStatus.ACTIVE };
    await this.saveCoordinator(newItem);
    return newItem;
  }

  // --- Supervisors ---
  // Mapping camelCase to snake_case for DB columns manually where names differ
  async getSupervisors() { 
    const { data } = await supabase.from('mop_supervisors').select('*').order('nome');
    return data?.map(s => ({
        ...s,
        coordinatorIds: s.coordinator_ids || []
    })) || []; 
  }

  async saveSupervisor(data: Supervisor) {
    const payload = {
        id: data.id,
        nome: data.nome,
        status: data.status,
        coordinator_ids: data.coordinatorIds || []
    };
    const { data: existing } = await supabase.from('mop_supervisors').select('id').eq('id', data.id).single();
    if(existing) await supabase.from('mop_supervisors').update(payload).eq('id', data.id);
    else await supabase.from('mop_supervisors').insert(payload);
  }

  async deleteSupervisor(id: string) { await this.deleteItem('mop_supervisors', id); }

  async findOrCreateSupervisor(name: string, coordinatorIds: string[]): Promise<Supervisor> {
    const { data } = await supabase.from('mop_supervisors').select('*').ilike('nome', name).single();
    if (data) return { ...data, coordinatorIds: data.coordinator_ids || [] };
    const newItem: Supervisor = { id: generateId(), nome: name, coordinatorIds, status: EntityStatus.ACTIVE };
    await this.saveSupervisor(newItem);
    return newItem;
  }

  // --- Clients ---
  async getClients() { return this.getAll<Client>('mop_clients'); }
  async saveClient(data: Client) { await this.saveItem('mop_clients', data); }
  async deleteClient(id: string) { await this.deleteItem('mop_clients', id); }

  async findOrCreateClient(name: string): Promise<Client> {
    const { data } = await supabase.from('mop_clients').select('*').ilike('nome', name).single();
    if (data) return data;
    const newItem: Client = { id: generateId(), nome: name, status: EntityStatus.ACTIVE };
    await this.saveClient(newItem);
    return newItem;
  }

  // --- Operations ---
  async getOperations() { 
    const { data } = await supabase.from('mop_operations').select('*').order('nome');
    return data?.map(o => ({ ...o, clientId: o.client_id })) || [];
  }
  async saveOperation(data: Operation) { 
    const payload = { id: data.id, nome: data.nome, status: data.status, client_id: data.clientId || null };
    const { data: existing } = await supabase.from('mop_operations').select('id').eq('id', data.id).single();
    if(existing) await supabase.from('mop_operations').update(payload).eq('id', data.id);
    else await supabase.from('mop_operations').insert(payload);
  }
  async deleteOperation(id: string) { await this.deleteItem('mop_operations', id); }

  async findOrCreateOperation(name: string, clientId: string): Promise<Operation> {
    const { data } = await supabase.from('mop_operations').select('*').ilike('nome', name).single();
    if (data) return { ...data, clientId: data.client_id };
    const newItem: Operation = { id: generateId(), nome: name, clientId, status: EntityStatus.ACTIVE };
    await this.saveOperation(newItem);
    return newItem;
  }

  // --- Ilhas ---
  async getIlhas() { 
    const { data } = await supabase.from('mop_ilhas').select('*').order('nome');
    return data?.map(i => ({
        ...i,
        clientId: i.client_id,
        operationId: i.operation_id,
        coordinatorIds: i.coordinator_ids || [],
        supervisorIds: i.supervisor_ids || []
    })) || [];
  }
  async saveIlha(data: Ilha) { 
    const payload = {
        id: data.id,
        nome: data.nome,
        status: data.status,
        client_id: data.clientId || null,
        operation_id: data.operationId || null,
        coordinator_ids: data.coordinatorIds || [],
        supervisor_ids: data.supervisorIds || []
    };
    const { data: existing } = await supabase.from('mop_ilhas').select('id').eq('id', data.id).single();
    if(existing) {
        const { error } = await supabase.from('mop_ilhas').update(payload).eq('id', data.id);
        if (error) console.error("Error updating Ilha:", error);
    } else {
        const { error } = await supabase.from('mop_ilhas').insert(payload);
        if (error) console.error("Error inserting Ilha:", error);
    }
  }
  async deleteIlha(id: string) { await this.deleteItem('mop_ilhas', id); }

  async findOrCreateIlha(name: string, clientId: string, opId: string, coordIds: string[], supIds: string[]): Promise<Ilha> {
    const { data } = await supabase.from('mop_ilhas').select('*').ilike('nome', name).single();
    if (data) return { ...data, clientId: data.client_id, operationId: data.operation_id, coordinatorIds: data.coordinator_ids || [], supervisorIds: data.supervisor_ids || [] };
    const newItem: Ilha = {
      id: generateId(),
      nome: name,
      clientId,
      operationId: opId,
      coordinatorIds: coordIds,
      supervisorIds: supIds,
      status: EntityStatus.ACTIVE
    };
    await this.saveIlha(newItem);
    return newItem;
  }

  // --- Provimento (PA Contratada) ---
  async getProvimento(referencia: string): Promise<Provimento[]> {
    const { data } = await supabase.from('mop_provimento').select('*').eq('referencia', referencia);
    return (data ?? []).map((p: any) => ({
      id: p.id, ilhaId: p.ilha_id, referencia: p.referencia, paContratada: p.pa_contratada,
    }));
  }

  private async getProvimentoHistorico(): Promise<Provimento[]> {
    const { data } = await buscarTudo<any>((de, ate) =>
      supabase.from('mop_provimento').select('*').range(de, ate));
    return data.map(p => ({
      id: p.id, ilhaId: p.ilha_id, referencia: p.referencia, paContratada: p.pa_contratada,
    }));
  }

  async saveProvimento(item: Provimento) {
    const payload = {
      id: item.id, ilha_id: item.ilhaId, referencia: item.referencia, pa_contratada: item.paContratada,
    };
    const { data: existing } = await supabase.from('mop_provimento').select('id')
      .eq('ilha_id', item.ilhaId).eq('referencia', item.referencia).single();
    if (existing) {
      const { error } = await supabase.from('mop_provimento').update(payload).eq('id', existing.id);
      if (error) console.error("Error updating Provimento:", error);
    } else {
      const { error } = await supabase.from('mop_provimento').insert(payload);
      if (error) console.error("Error inserting Provimento:", error);
    }
  }

  async ensureProvimentoMesAtual(): Promise<void> {
    const referenciaAtual = referenciaDoMes(new Date());
    const [ilhas, historico] = await Promise.all([this.getIlhas(), this.getProvimentoHistorico()]);
    const ilhasAtivas = ilhas.filter(i => i.status === EntityStatus.ACTIVE);
    const faltantes = provimentoParaAutoCadastro(ilhasAtivas, historico, referenciaAtual);
    for (const item of faltantes) {
      const { error } = await supabase.from('mop_provimento').insert({
        id: generateId(), ilha_id: item.ilhaId, referencia: referenciaAtual, pa_contratada: item.paContratada,
      });
      if (error) console.error("Error auto-cadastrando Provimento:", error);
    }
  }

  // --- Collaborators ---
  async getCollaborators(): Promise<Collaborator[]> {
    const { data } = await buscarTudo<any>((de, ate) =>
        supabase.from('mop_collaborators').select('*').order('nome').range(de, ate));
    return data?.map(c => ({
        ...c,
        ilhaId: c.ilha_id,
        supervisorId: c.supervisor_id,
        coordinatorId: c.coordinator_id,
        operationId: c.operation_id,
        clientId: c.client_id,
        dtEntradaProduto: c.dt_entrada_produto,
        dataFim: c.data_fim,
        horarioEntrada: c.horario_entrada,
        horarioSaida: c.horario_saida,
        dtNasc: c.dt_nasc,
        feriasInicio: c.ferias_inicio,
        feriasFim: c.ferias_fim,
        dataAfastamento: c.data_afastamento,
        efetivacao: c.efetivacao,
        // Novos Campos
        email_vr: c.email_vr,
        senha: c.senha
    })) || [];
  }
  
  async saveCollaborator(data: Collaborator) {
    const payload = {
        matricula: data.matricula,
        nome: data.nome,
        email: data.email,
        status: data.status,
        ilha_id: data.ilhaId || null,
        supervisor_id: data.supervisorId || null,
        coordinator_id: data.coordinatorId || null,
        operation_id: data.operationId || null,
        client_id: data.clientId || null,
        dt_entrada_produto: data.dtEntradaProduto,
        data_fim: data.dataFim,
        horario_entrada: data.horarioEntrada,
        horario_saida: data.horarioSaida,
        dt_nasc: data.dtNasc,
        ferias_inicio: data.feriasInicio,
        ferias_fim: data.feriasFim,
        data_afastamento: data.dataAfastamento,
        efetivacao: data.efetivacao,
        // Novos Campos
        email_vr: data.email_vr,
        senha: data.senha
    };
    
    // Check if exists to determine update vs insert (or upsert)
    const { error } = await supabase.from('mop_collaborators').upsert(payload, { onConflict: 'matricula' });
    if(error) console.error("Error saving collaborator", error);
  }
  
  async deleteCollaborator(matricula: string) {
    const { error } = await supabase.from('mop_collaborators').delete().eq('matricula', matricula);
    if (error) throw error;
  }

  async updateCollaboratorEfetivacao(matricula: string, value: string) {
    const { error } = await supabase.from('mop_collaborators').update({ efetivacao: value }).eq('matricula', matricula);
    if(error) throw error;
  }

  async bulkUpdateCollaborators(matriculas: string[], field: string, value: string) {
    // Chama a Procedure (RPC) no Supabase para garantir a lógica de cascata no servidor
    const { error } = await supabase.rpc('bulk_update_collaborators', {
        p_matriculas: matriculas,
        p_field: field,
        p_value: value
    });

    if (error) {
        console.error("Bulk update error (RPC)", error);
        throw new Error(error.message);
    }
  }
  
  async bulkCreateCollaborators(collabs: Collaborator[]) {
    // Map to DB columns
    const payload = collabs.map(data => ({
        matricula: data.matricula,
        nome: data.nome,
        email: data.email,
        status: data.status,
        ilha_id: data.ilhaId,
        supervisor_id: data.supervisorId,
        coordinator_id: data.coordinatorId,
        operation_id: data.operationId,
        client_id: data.clientId,
        dt_entrada_produto: data.dtEntradaProduto,
        data_fim: data.dataFim,
        horario_entrada: data.horarioEntrada,
        horario_saida: data.horarioSaida,
        dt_nasc: data.dtNasc,
        ferias_inicio: data.feriasInicio,
        ferias_fim: data.feriasFim,
        data_afastamento: data.dataAfastamento,
        efetivacao: data.efetivacao,
        email_vr: data.email_vr,
        senha: data.senha
    }));

    // Chunking to avoid payload too large errors
    const chunkSize = 100;
    for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from('mop_collaborators').upsert(chunk, { onConflict: 'matricula' });
        if(error) {
            console.error("Bulk upload error in chunk " + i, error);
            throw new Error("Erro no upload em massa: " + error.message);
        }
    }
  }

  // --- Scheduled Tasks ---

  async scheduleTask(matricula: string, changes: Partial<Collaborator>, date: string, user: string) {
    const task: Omit<ScheduledTask, 'id' | 'created_at'> = {
        matricula,
        changes,
        scheduled_date: date,
        status: 'PENDING',
        created_by: user
    };
    const { error } = await supabase.from('mop_scheduled_tasks').insert({
        ...task,
        id: generateId()
    });
    if (error) throw error;
  }

  async getPendingTasks(): Promise<ScheduledTask[]> {
    const { data, error } = await supabase.from('mop_scheduled_tasks')
        .select('*')
        .eq('status', 'PENDING')
        .order('scheduled_date', { ascending: true });
    
    if (error) {
        console.error("Error fetching scheduled tasks", error);
        return [];
    }
    return data as ScheduledTask[];
  }

  async updateTask(id: string, changes: Partial<Collaborator>, date: string) {
     const { error } = await supabase.from('mop_scheduled_tasks')
        .update({ 
            changes: changes,
            scheduled_date: date
        })
        .eq('id', id);
     if (error) throw error;
  }

  async cancelAllTasks() {
     const { data, error: fetchError } = await supabase.from('mop_scheduled_tasks').select('id').eq('status', 'PENDING');
     if (fetchError) throw fetchError;
     if (!data || data.length === 0) return;
     
     const failures: string[] = [];
     for (const task of data) {
         const { error } = await supabase.from('mop_scheduled_tasks').update({ status: 'CANCELLED' }).eq('id', task.id);
         if (error) {
             console.error("Failed to cancel task", task.id, error);
             failures.push(task.id);
         }
     }
     if (failures.length > 0) {
         throw new Error(`Falha ao cancelar ${failures.length} de ${data.length} tarefa(s).`);
     }
  }

  async cancelTask(id: string) {
     const { error } = await supabase.from('mop_scheduled_tasks')
        .update({ status: 'CANCELLED' })
        .eq('id', id);
     if (error) throw error;
  }

  async processDueTasks() {
      // 1. Get Pending Tasks due today or earlier
      const today = new Date().toISOString().split('T')[0];
      const { data: dueTasks, error } = await supabase.from('mop_scheduled_tasks')
          .select('*')
          .eq('status', 'PENDING')
          .lte('scheduled_date', today);

      if (error || !dueTasks || dueTasks.length === 0) return;

      console.log(`Processing ${dueTasks.length} due tasks...`);

      // 2. Process each task
      for (const task of dueTasks) {
          try {
              // A. Get current collaborator to merge (and ensure existence)
              const { data: collabArray } = await supabase.from('mop_collaborators').select('*').eq('matricula', task.matricula);
              
              if (collabArray && collabArray.length > 0) {
                  // --- UPDATE EXISTING ---
                  const current = collabArray[0];
                  
                  // Convert existing DB row to TS object
                  const currentTS: Collaborator = {
                      ...current,
                      ilhaId: current.ilha_id,
                      supervisorId: current.supervisor_id,
                      coordinatorId: current.coordinator_id,
                      operationId: current.operation_id,
                      clientId: current.client_id,
                      dtEntradaProduto: current.dt_entrada_produto,
                      dataFim: current.data_fim,
                      horarioEntrada: current.horario_entrada,
                      horarioSaida: current.horario_saida,
                      dtNasc: current.dt_nasc,
                      feriasInicio: current.ferias_inicio,
                      feriasFim: current.ferias_fim,
                      dataAfastamento: current.data_afastamento,
                      efetivacao: current.efetivacao,
                      email_vr: current.email_vr,
                      senha: current.senha
                  };

                  const updatedTS = { ...currentTS, ...task.changes };

                  // Save Update
                  await this.saveCollaborator(updatedTS);

                  // Log History
                  await this.addHistory({
                      action: 'Execução Automática',
                      target: updatedTS.nome,
                      user: 'Sistema (Agendado)',
                      date: new Date().toLocaleString('pt-BR'),
                      type: 'update',
                      details: `Tarefa agendada executada. Alterações aplicadas automaticamente.`
                  });
              
              } else {
                  // --- CREATE NEW (Insert) ---
                  // Assuming task.changes contains the full collaborator data for creation
                  const newCollab = task.changes as Collaborator;
                  
                  if (newCollab.matricula && newCollab.nome) {
                       await this.saveCollaborator(newCollab);
                       
                       // Log History for Creation
                       await this.addHistory({
                          action: 'Criação Automática',
                          target: newCollab.nome,
                          user: 'Sistema (Agendado)',
                          date: new Date().toLocaleString('pt-BR'),
                          type: 'create',
                          details: `Tarefa agendada de inclusão executada com sucesso.`
                      });
                  } else {
                      console.warn(`Insufficient data to create collaborator ${task.matricula}`);
                  }
              }
              
              // Mark Task Completed (common for both paths)
              await supabase.from('mop_scheduled_tasks').update({ status: 'COMPLETED' }).eq('id', task.id);

          } catch (e) {
              console.error(`Failed to process task ${task.id}`, e);
          }
      }
  }

  // --- Automatic Status Checks ---
  async checkVacationReturns() {
    // Busca colaboradores em férias
    const { data: vacationers } = await supabase
        .from('mop_collaborators')
        .select('*')
        .eq('status', 'FÉRIAS');
    
    if (!vacationers) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    for (const c of vacationers) {
        if (!c.ferias_fim) continue;
        
        // Parse date safely to local date
        const parts = c.ferias_fim.split('-');
        const endDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        
        // Se hoje for maior que a data fim das férias, o colaborador já deveria ter retornado.
        if (today > endDate) {
            await supabase
                .from('mop_collaborators')
                .update({ 
                    status: 'ATIVO',
                    ferias_inicio: null, 
                    ferias_fim: null 
                })
                .eq('matricula', c.matricula);

            await this.addHistory({
                action: 'Retorno Automático',
                target: c.nome,
                user: 'Sistema',
                date: new Date().toLocaleString('pt-BR'),
                type: 'update',
                details: 'Status alterado para ATIVO após término das férias.'
            });
        }
    }
  }

  async checkAvisoPrevioEnds() {
    const { data: avisos } = await supabase
        .from('mop_collaborators')
        .select('*')
        .eq('status', 'AVISO PRÉVIO');
    
    if (!avisos) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    for (const c of avisos) {
        if (!c.data_fim) continue;
        
        const parts = c.data_fim.split('-');
        const endDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        
        if (today > endDate) {
            await supabase
                .from('mop_collaborators')
                .update({ 
                    status: 'DESLIGADO'
                })
                .eq('matricula', c.matricula);

            await this.addHistory({
                action: 'Desligamento Automático (Fim de Aviso Prévio)',
                target: c.nome,
                user: 'Sistema',
                date: new Date().toLocaleString('pt-BR'),
                type: 'update',
                details: `Status alterado para Desligado. Data de desligamento: ${c.data_fim.split('-').reverse().join('/')}`
            });
        }
    }
  }
}

export const db = new SupabaseService();
