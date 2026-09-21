
import React, { useState, useEffect } from 'react';
import { User, Collaborator } from './types';
import { db } from './services/mockDb';
import { AppShell } from './components/shell/AppShell';
import { LoginPage } from './pages/LoginPage';
import { CollaboratorsPage, type FiltroInicial } from './pages/CollaboratorsPage';
import { CollaboratorDetailsPage } from './pages/CollaboratorDetailsPage';
import { CrudPage } from './pages/CrudPage';
import { ScheduledTasksPage } from './pages/ScheduledTasksPage';
import { HistoryPage } from './pages/HistoryPage';
import { UsersPage } from './pages/UsersPage';
import { ResetDataPage } from './pages/ResetDataPage';
import { AboutPage } from './pages/AboutPage';
import { TurnoverPage } from './pages/TurnoverPage';
import { SafraPage } from './pages/SafraPage';
import { OrganogramPage } from './pages/OrganogramPage';
import { DashboardPage } from './pages/DashboardPage';
import { DistribuicaoPage } from './pages/DistribuicaoPage';
import { ImportPage } from './pages/ImportPage';
import { BulkUpdatePage } from './pages/BulkUpdatePage';
import { ExpiringContractsPage } from './pages/ExpiringContractsPage';
import { BirthdaysPage } from './pages/BirthdaysPage';
import { AvisoPrevioPage } from './pages/AvisoPrevioPage';
import { VacationManagementPage } from './pages/VacationManagementPage';
import { AfastadosPage } from './pages/AfastadosPage';
import { DesligadosPage } from './pages/DesligadosPage';
import { ProvimentoPage } from './pages/ProvimentoPage';
import { useAppData, useResource } from './contexts/DataContext';
import type { ResourceName } from './data/appData';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  // Recorte que o Dashboard entrega junto com a navegação. Vive aqui porque
  // quem o produz e quem o consome são duas telas irmãs.
  const [filtroLista, setFiltroLista] = useState<FiltroInicial | null>(null);
  const store = useAppData();
  const refreshData = (resources: ResourceName[]) => Promise.all(resources.map(name => store[name].invalidate()));
  const coordinators = useResource('coordinators').data ?? [];
  const supervisors = useResource('supervisors').data ?? [];
  const clients = useResource('clients').data ?? [];
  const operations = useResource('operations').data ?? [];
  const dropdownOptions = {
      coordinators: coordinators.map(x => ({value: x.id, label: x.nome, status: x.status})),
      supervisors: supervisors.map(x => ({value: x.id, label: x.nome, status: x.status})),
      clients: clients.map(x => ({value: x.id, label: x.nome, status: x.status})),
      operations: operations.map(x => ({value: x.id, label: x.nome, clientId: x.clientId, status: x.status})),
  };

  useEffect(() => {
      const runChecks = async () => {
          await db.processDueTasks();
          await db.ensureProvimentoMesAtual();
          await db.checkVacationReturns();
          await db.checkAvisoPrevioEnds();
      };
      runChecks();
      const interval = window.setInterval(runChecks, 60_000);
      return () => window.clearInterval(interval);
  }, []);

  const handleLogin = (u: User) => {
    setCurrentUser(u);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  /** Leva para a lista de colaboradores ja recortada por um item. E por aqui
   *  que o tile do mapa e a fatia do Dashboard entregam o que prometem. */
  const abrirLista = (campo: FiltroInicial['campo'], id: string) => {
    setFiltroLista({ campo, id });
    setCurrentPage('collaborators');
  };

  const renderContent = () => {
    const commonProps = { onRefresh: () => refreshData(['collaborators']), currentUser: currentUser! };

    switch (currentPage) {
      case 'dashboard': return <DashboardPage currentUser={currentUser!} onAbrirIlha={id => abrirLista('ilha', id)} />;
      case 'distribuicao': return <DistribuicaoPage onAbrirLista={abrirLista} />;
      case 'turnover': return <TurnoverPage />;
      case 'safra': return <SafraPage />;
      case 'organogram': return <OrganogramPage />;
      case 'collaborators':
        if (selectedCollab) return <CollaboratorDetailsPage collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <CollaboratorsPage onViewDetails={setSelectedCollab} filtroInicial={filtroLista} {...commonProps} />;
      case 'coordinators': return <CrudPage title="Coordenadores" singular="coordenador" data={coordinators} onSave={db.saveCoordinator.bind(db)} onDelete={db.deleteCoordinator.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}]} currentUser={currentUser!} onRefresh={() => refreshData(['coordinators'])} />;
      case 'supervisors': return <CrudPage title="Supervisores" singular="supervisor" data={supervisors} onSave={db.saveSupervisor.bind(db)} onDelete={db.deleteSupervisor.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'coordinatorIds', label:'Coordenadores', type:'multiselect', options: dropdownOptions.coordinators }]} currentUser={currentUser!} onRefresh={() => refreshData(['supervisors'])} />;
      case 'clients': return <CrudPage title="Clientes" singular="cliente" data={clients} onSave={db.saveClient.bind(db)} onDelete={db.deleteClient.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'logo', label:'URL da logo', type:'text'}]} currentUser={currentUser!} onRefresh={() => refreshData(['clients'])} />;
      case 'operations': return <CrudPage title="Operações" singular="operação" data={operations} onSave={db.saveOperation.bind(db)} onDelete={db.deleteOperation.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'clientId', label:'Cliente', type:'select', options: dropdownOptions.clients }]} currentUser={currentUser!} onRefresh={() => refreshData(['operations'])} />;
      case 'ilhas': return <CrudPage title="Ilhas" singular="ilha" data={db.getIlhas()} onSave={db.saveIlha.bind(db)} onDelete={db.deleteIlha.bind(db)} schema={[
        {key:'nome', label:'Nome', type:'text'},
        {key:'clientId', label:'Cliente', type:'select', options: dropdownOptions.clients },
        {key:'operationId', label:'Operação', type:'select', options: (currentItem: any) => currentItem.clientId ? dropdownOptions.operations.filter(o => o.clientId === currentItem.clientId) : dropdownOptions.operations },
        {key:'coordinatorIds', label:'Coordenadores', type:'multiselect', options: dropdownOptions.coordinators },
        {key:'supervisorIds', label:'Supervisores', type:'multiselect', options: dropdownOptions.supervisors }
      ]} currentUser={currentUser!} onRefresh={() => refreshData(['ilhas'])} />;
      case 'provimento': return <ProvimentoPage currentUser={currentUser!} />;
      case 'users': return <UsersPage {...commonProps} />;
      case 'history': return <HistoryPage />;
      case 'birthdays': return <BirthdaysPage onBack={() => setCurrentPage('dashboard')} />;
      case 'desligados':
        if (selectedCollab) return <CollaboratorDetailsPage collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <DesligadosPage onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'expiring': return <ExpiringContractsPage onBack={() => setCurrentPage('dashboard')} currentUser={currentUser!} />;
      case 'aviso_previo':
        if (selectedCollab) return <CollaboratorDetailsPage collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <AvisoPrevioPage onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'vacation':
        if (selectedCollab) return <CollaboratorDetailsPage collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <VacationManagementPage currentUser={currentUser!} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'afastados':
        if (selectedCollab) return <CollaboratorDetailsPage collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <AfastadosPage onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'scheduled_tasks': return <ScheduledTasksPage />;
      case 'import': return <ImportPage {...commonProps} />;
      case 'bulk_update': return <BulkUpdatePage {...commonProps} />;
      case 'reset': return <ResetDataPage />;
      case 'about': return <AboutPage />;
      default: return <DashboardPage currentUser={currentUser!} onAbrirIlha={id => abrirLista('ilha', id)} />;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <AppShell
      currentUser={currentUser}
      currentPage={currentPage}
      // Ir a Colaboradores pelo menu é pedir a lista inteira. Sem zerar o
      // recorte aqui, o filtro de um clique antigo no Dashboard voltaria
      // sozinho e a lista pareceria ter perdido gente.
      onNavigate={p => { setCurrentPage(p); setSelectedCollab(null); setFiltroLista(null); }}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppShell>
  );
};

export default App;
