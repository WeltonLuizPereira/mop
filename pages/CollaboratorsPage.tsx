import React, { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, FileText, Plus, Eye } from 'lucide-react';
import { Collaborator, User, UserRole, Coordinator, Supervisor, Ilha, Operation, Client, CollaboratorStatus } from '../types';
import { db } from '../services/mockDb';
import { getCollaboratorCalculations, formatDate, formatDateString } from '../utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Badge, Button, ChipSelect, MultiSelect, Table, type Ordenacao } from '../components/ui';

/** As cinco colunas por onde a lista pode ser ordenada. */
type Campo = 'cliente' | 'nome' | 'status' | 'supervisor' | 'ilha';
import { ClientLogo } from '../components/collaborators/ClientLogo';
import { resolveClient } from '../lib/clientLogo';
import { CollaboratorFormModal } from '../components/collaborators/CollaboratorFormModal';

export const CollaboratorsPage: React.FC<{ currentUser: User, onViewDetails: (c: Collaborator) => void, onRefresh: () => void }> = ({ currentUser, onViewDetails, onRefresh }) => {
    // ... same as original ...
    const [collabs, setCollabs] = useState<Collaborator[]>([]);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [falhouCarga, setFalhouCarga] = useState(false);
    const [ordenacao, setOrdenacao] = useState<Ordenacao<Campo>>({ campo: 'nome', direcao: 'asc' });

    // clicar na coluna ativa inverte o sentido; em outra coluna, recomeça em A → Z
    const ordenavel = {
        ordenacao,
        onOrdenar: (campo: string) => setOrdenacao(o =>
            o.campo === campo
                ? { campo: o.campo, direcao: o.direcao === 'asc' ? 'desc' as const : 'asc' as const }
                : { campo: campo as Campo, direcao: 'asc' as const }),
    };
    
    // Filtros
    const [filterCoord, setFilterCoord] = useState<string[]>([]);
    const [filterSup, setFilterSup] = useState<string[]>([]);
    const [filterIlha, setFilterIlha] = useState<string[]>([]);
    const [filterOp, setFilterOp] = useState<string[]>([]);
    const [filterClient, setFilterClient] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);

    // Date Filters
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11

    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [ilhas, setIlhas] = useState<Ilha[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const isAdmin = currentUser.role === UserRole.ADMIN;
    
    const load = useCallback(async () => {
        const porNome = <T extends { nome?: string }>(a: T, b: T) =>
            (a.nome || '').localeCompare(b.nome || '');
        try {
            setFalhouCarga(false);
            const [colabs, coords, supers, ilhasList, ops, cli] = await Promise.all([
                db.getCollaborators(), db.getCoordinators(), db.getSupervisors(),
                db.getIlhas(), db.getOperations(), db.getClients(),
            ]);
            setCollabs(colabs);
            setCoordinators([...coords].sort(porNome));
            setSupervisors([...supers].sort(porNome));
            setIlhas([...ilhasList].sort(porNome));
            setOperations([...ops].sort(porNome));
            setClients([...cli].sort(porNome));
        } catch {
            // sem isso a tela ficava para sempre vazia, indistinguivel de
            // "nenhum colaborador cadastrado"
            setFalhouCarga(true);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = collabs.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.matricula.includes(search);
        
        const matchesCoord = filterCoord.length === 0 || filterCoord.includes(c.coordinatorId);
        const matchesSup = filterSup.length === 0 || filterSup.includes(c.supervisorId);
        const matchesIlha = filterIlha.length === 0 || filterIlha.includes(c.ilhaId);
        const matchesOp = filterOp.length === 0 || filterOp.includes(c.operationId);
        const matchesClient = filterClient.length === 0 || filterClient.includes(c.clientId);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(c.status);

        const startOfMonth = selectedMonth === -1 ? new Date(selectedYear, 0, 1) : new Date(selectedYear, selectedMonth, 1);
        startOfMonth.setHours(0,0,0,0);
        const endOfMonth = selectedMonth === -1 ? new Date(selectedYear, 12, 0) : new Date(selectedYear, selectedMonth + 1, 0);
        endOfMonth.setHours(23,59,59,999);

        const safeDate = (dateStr: string | undefined) => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                 return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            }
            return null;
        };

        const entryDate = safeDate(c.dtEntradaProduto);
        const exitDate = c.dataFim ? safeDate(c.dataFim) : null;
        // Sem data de entrada não dá para afirmar que a pessoa entrou depois do
        // período — e sumir com ela esconderia justamente o cadastro incompleto
        // que alguém precisa achar para corrigir.
        const enteredBeforeEnd = !entryDate || entryDate <= endOfMonth;
        const stillActiveAfterStart = !exitDate || exitDate >= startOfMonth;
        // Ano "todos" desliga o recorte de período: é como se alcança quem
        // entrou ou saiu fora dos seis anos que o seletor oferece.
        const isWithinDateRange = selectedYear === -1
            ? true
            : enteredBeforeEnd && stillActiveAfterStart;

        return matchesSearch && matchesCoord && matchesSup && matchesIlha && matchesOp && matchesClient && matchesStatus && isWithinDateRange;
    }).sort((a, b) => {
        const chave = (c: Collaborator) => {
            switch (ordenacao.campo) {
                case 'cliente': return resolveClient(c, ilhas, clients)?.nome ?? '';
                case 'status': return c.status;
                case 'supervisor': return supervisors.find(s => s.id === c.supervisorId)?.nome ?? '';
                case 'ilha': return ilhas.find(i => i.id === c.ilhaId)?.nome ?? '';
                default: return c.nome;
            }
        };
        const diff = chave(a).localeCompare(chave(b), 'pt-BR');
        // empate volta para o nome: duas pessoas da mesma ilha não podem
        // trocar de lugar a cada renderização
        const resolvido = diff !== 0 ? diff : a.nome.localeCompare(b.nome, 'pt-BR');
        return ordenacao.direcao === 'asc' ? resolvido : -resolvido;
    });

    const handleSave = async (data: Collaborator) => {
        await db.saveCollaborator(data);
        if (data.feriasInicio && data.feriasFim) {
            await db.addVacationHistory(data.matricula, data.feriasInicio, data.feriasFim);
        }
        await db.addHistory({
            action: 'Novo Colaborador',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'create',
            details: `Registro criado com matrícula ${data.matricula}`
        });
        setIsCreateOpen(false);
        setCollabs(await db.getCollaborators());
        onRefresh(); 
    };

    const handleScheduleCreate = async (data: Collaborator, date: string) => {
        if (!data.matricula || !data.nome) {
            alert("Preencha Matrícula e Nome para agendar.");
            return;
        }

        await db.scheduleTask(data.matricula, data, date, currentUser.nome);
        await db.addHistory({
            action: 'Agendamento de Cadastro',
            target: data.nome,
            user: currentUser.nome,
            date: new Date().toLocaleString('pt-BR'),
            type: 'create',
            details: `Cadastro agendado para ${formatDateString(date)}`
        });
        setIsCreateOpen(false);
        alert(`Cadastro de ${data.nome} agendado para ${formatDateString(date)} com sucesso!`);
    };

    const clearFilters = () => {
        setFilterCoord([]); setFilterSup([]); setFilterIlha([]);
        setFilterOp([]); setFilterClient([]); setFilterStatus([]);
        setSearch('');
    };

    const prepareExportData = (isExcel = false) => {
        const referencia = selectedYear === -1
            ? 'Todos os anos'
            : selectedMonth === -1
                ? `Ano ${selectedYear}`
                : `01/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
        return filtered.map(c => {
            const calc = getCollaboratorCalculations(c.dtEntradaProduto);
            const sup = supervisors.find(s => s.id === c.supervisorId)?.nome || '-';
            const ilha = ilhas.find(i => i.id === c.ilhaId)?.nome || '-';
            const coord = coordinators.find(co => co.id === c.coordinatorId)?.nome || '-';
            const op = operations.find(o => o.id === c.operationId)?.nome || '-';
            const cli = clients.find(cl => cl.id === c.clientId)?.nome || '-';

            const toExcelDate = (dateStr: string | undefined) => {
                if (!dateStr || dateStr === '-') return null;
                let day, month, year;
                if (dateStr.includes('/')) {
                   const parts = dateStr.split('/');
                   if(parts.length !== 3) return null;
                   day = Number(parts[0]);
                   month = Number(parts[1]) - 1;
                   year = Number(parts[2]);
                } else {
                   const parts = dateStr.split('-');
                   if(parts.length !== 3) return null;
                   year = Number(parts[0]);
                   month = Number(parts[1]) - 1;
                   day = Number(parts[2]);
                }
                return new Date(year, month, day, 12, 0, 0);
            };

            const formatTimeForExport = (t: string | undefined) => {
                if(!t) return isExcel ? null : '00:00:00';
                if (isExcel) {
                    const parts = t.split(':');
                    if (parts.length >= 2) {
                        const h = parseInt(parts[0], 10) || 0;
                        const m = parseInt(parts[1], 10) || 0;
                        const s = parts.length >= 3 ? parseInt(parts[2], 10) || 0 : 0;
                        return (h * 3600 + m * 60 + s) / 86400;
                    }
                    return null;
                }
                if(t.length === 5) return `${t}:00`;
                return t;
            }

            return {
                'MATRICULA': parseInt(c.matricula) || c.matricula,
                'EMAIL': c.email,
                'NOME': c.nome,
                'SUPERVISOR': sup,
                'ILHA': ilha,
                'STATUS': c.status,
                'DT ENTRADA PRODUTO': toExcelDate(c.dtEntradaProduto),
                'DATA FIM': toExcelDate(c.dataFim),
                'HORÁRIO DE ENTRADA': formatTimeForExport(c.horarioEntrada),
                'HORÁRIO DE SÁIDA': formatTimeForExport(c.horarioSaida),
                'EXPERIENCIA': calc.experiencia,
                'TEMPO DE CASA': calc.tempoDeCasa,
                'VENCE': calc.vence !== '-' ? toExcelDate(calc.vence) : '-',
                'DT_NASC': toExcelDate(c.dtNasc),
                'REFERENCIA': referencia,
                'COORDENADOR': coord,
                'OPERAÇÃO': op,
                'CLIENTE': cli,
                'EMAIL VR': c.email_vr || '',
                'SENHA': c.senha || ''
            };
        });
    };

    const handleExportExcel = () => {
        const dataToExport = prepareExportData(true);
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        let entradaCol = -1;
        let saidaCol = -1;
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            const cell = ws[cellAddress];
            if (cell && cell.v === 'HORÁRIO DE ENTRADA') entradaCol = C;
            if (cell && cell.v === 'HORÁRIO DE SÁIDA') saidaCol = C;
        }

        for (let R = 1; R <= range.e.r; ++R) {
            if (entradaCol !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: entradaCol });
                const cell = ws[cellAddress];
                if (cell && cell.t === 'n') {
                    cell.z = 'hh:mm:ss';
                }
            }
            if (saidaCol !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: saidaCol });
                const cell = ws[cellAddress];
                if (cell && cell.t === 'n') {
                    cell.z = 'hh:mm:ss';
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MOP");
        XLSX.writeFile(wb, "MOP_Colaboradores.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const dataToExport = prepareExportData();
        if (dataToExport.length === 0) { alert("Sem dados para exportar."); return; }
        const columns = Object.keys(dataToExport[0]);
        const rows = dataToExport.map(obj => Object.values(obj).map(val => { if (val instanceof Date) return formatDate(val); return val; }));
        autoTable(doc, { head: [columns], body: rows, styles: { fontSize: 6, cellPadding: 1 }, theme: 'grid' });
        doc.save('MOP_Colaboradores.pdf');
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    const clientOptions = clients.map(c => ({value: c.id, label: c.nome}));
    const opOptions = operations.filter(o => filterClient.length === 0 || filterClient.includes(o.clientId)).map(o => ({value: o.id, label: o.nome}));
    const ilhaOptions = ilhas.filter(i => (filterClient.length === 0 || filterClient.includes(i.clientId)) && (filterOp.length === 0 || filterOp.includes(i.operationId))).map(i => ({value: i.id, label: i.nome}));
    const coordOptions = coordinators.map(c => ({value: c.id, label: c.nome}));
    const supOptions = supervisors.filter(s => filterCoord.length === 0 || s.coordinatorIds?.some(id => filterCoord.includes(id))).map(s => ({value: s.id, label: s.nome}));
    const statusOptions = Object.values(CollaboratorStatus).map(s => ({value: s, label: s}));
    const filtrosAtivos = filterCoord.length + filterSup.length + filterIlha.length
        + filterOp.length + filterClient.length + filterStatus.length;

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = Array.from({length: 6}, (_, i) => (today.getFullYear() + 1) - i);

    // Sem altura fixa aqui: quem rola é o container do AppShell. Prender a
    // página em `100vh - 120px` (a medida do cabeçalho antigo, de 64px)
    // encolhia o cartão da tabela e, como ele tem `overflow-hidden`, as linhas
    // além do corte ficavam inalcançáveis — a lista simplesmente terminava.
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
             <Table.Card>
                <Table.Toolbar
                    busca={{ valor: search, aoMudar: setSearch, placeholder: 'Buscar nome ou matrícula' }}
                    contagem={{ n: filtered.length, um: 'resultado', varios: 'resultados' }}
                    filtrosAtivos={filtrosAtivos}
                    aoLimparFiltros={clearFilters}
                    chips={<>
                        <ChipSelect rotulo="Mês" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                            <option value={-1}>todos</option>
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </ChipSelect>
                        <ChipSelect rotulo="Ano" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                            <option value={-1}>todos</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </ChipSelect>
                    </>}
                    acoes={<>
                        <Button variant="ghost" onClick={handleExportExcel}><FileSpreadsheet size={15}/> Excel</Button>
                        <Button variant="ghost" onClick={handleExportPDF}><FileText size={15}/> PDF</Button>
                        {(isAdmin || currentUser.role === UserRole.SUPPORT) && (
                            <Button onClick={() => setIsCreateOpen(true)}><Plus size={15}/> Novo colaborador</Button>
                        )}
                    </>}
                    filtros={<>
                        <MultiSelect label="Cliente" options={clientOptions} value={filterClient} onChange={setFilterClient} />
                        <MultiSelect label="Operação" options={opOptions} value={filterOp} onChange={setFilterOp} />
                        <MultiSelect label="Ilha" options={ilhaOptions} value={filterIlha} onChange={setFilterIlha} />
                        <MultiSelect label="Coordenador" options={coordOptions} value={filterCoord} onChange={setFilterCoord} />
                        <MultiSelect label="Supervisor" options={supOptions} value={filterSup} onChange={setFilterSup} />
                        <MultiSelect label="Status" options={statusOptions} value={filterStatus} onChange={setFilterStatus} />
                    </>}
                />
                {falhouCarga ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-ink-2">Não foi possível carregar os colaboradores.</p>
                        <Button variant="secondary" className="mt-3" onClick={() => load()}>Tentar de novo</Button>
                    </div>
                ) : collabs.length === 0 ? (
                    <p className="p-10 text-center text-sm text-ink-mute">
                        Nenhum colaborador cadastrado. Importe uma planilha ou cadastre o primeiro.
                    </p>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-ink-mute">Nenhum colaborador encontrado para esses filtros.</p>
                        <Button variant="secondary" className="mt-3" onClick={clearFilters}>Limpar filtros</Button>
                    </div>
                ) : (
                    <Table>
                      <Table.Head>
                        <Table.Th className="w-px pr-0" campo="cliente" {...ordenavel}>Cliente</Table.Th>
                        <Table.Th campo="nome" {...ordenavel}>Nome</Table.Th>
                        <Table.Th campo="status" {...ordenavel}>Status</Table.Th>
                        <Table.Th campo="supervisor" {...ordenavel}>Supervisor</Table.Th>
                        <Table.Th campo="ilha" {...ordenavel}>Ilha</Table.Th>
                      </Table.Head>
                      <tbody>
                        {filtered.map(c => {
                          const cliente = resolveClient(c, ilhas, clients);
                          const ilha = ilhas.find(i => i.id === c.ilhaId);
                          const supervisor = supervisors.find(s => s.id === c.supervisorId);
                          return (
                            <tr
                              key={c.matricula}
                              tabIndex={0}
                              onClick={() => onViewDetails(c)}
                              onKeyDown={e => { if (e.key === 'Enter') onViewDetails(c); }}
                              className="cursor-pointer hover:bg-canvas-soft"
                            >
                              {/* a logo encosta na direita da coluna para
                                  formar um bloco só com o nome ao lado */}
                              <Table.Td className="w-px pr-0">
                                <div className="flex justify-end"><ClientLogo client={cliente} /></div>
                              </Table.Td>
                              {/* nome e matrícula formam o bloco de identidade:
                                  é por ele que o olho encontra a linha, e a
                                  matrícula é o que a busca e o RH usam */}
                              <Table.Td>
                                <span className="block font-medium text-ink leading-tight">{c.nome}</span>
                                <span className="block t-data text-[11px] text-ink-faint mt-px">{c.matricula}</span>
                              </Table.Td>
                              <Table.Td><Badge status={c.status} /></Table.Td>
                              <Table.Td className="text-ink-mute">{supervisor?.nome ?? '—'}</Table.Td>
                              <Table.Td>
                                {/* a ilha aparece na face de display, como no
                                    tile do mapa: é a mesma entidade nas duas telas */}
                                <span className="font-display text-xs tracking-[-.01em] text-ink-2">
                                  {ilha?.nome ?? '—'}
                                </span>
                              </Table.Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                )}
             </Table.Card>

             {isCreateOpen && (
                 <CollaboratorFormModal onClose={() => setIsCreateOpen(false)} onSave={handleSave} onSchedule={handleScheduleCreate} />
             )}
        </div>
    );
};
