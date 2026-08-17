
import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import {
  User, Collaborator
} from './types';
import { db } from './services/mockDb';
import { visibleGroups, pageTitle } from './lib/navigation';
import { NavItem } from './components/shell/NavItem';
import { NotificationCenter } from './components/shell/NotificationCenter';
import { Header } from './components/shell/Header';
import { LoginPage } from './pages/LoginPage';
import { CollaboratorsPage } from './pages/CollaboratorsPage';
import { CollaboratorDetailsPage } from './pages/CollaboratorDetailsPage';
import { CrudPage } from './pages/CrudPage';
import { ScheduledTasksPage } from './pages/ScheduledTasksPage';
import { HistoryPage } from './pages/HistoryPage';
import { UsersPage } from './pages/UsersPage';
import { ResetDataPage } from './pages/ResetDataPage';
import { AboutPage } from './pages/AboutPage';
import { TurnoverPage } from './pages/TurnoverPage';
import { OrganogramPage } from './pages/OrganogramPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { BulkUpdatePage } from './pages/BulkUpdatePage';
import { ExpiringContractsPage } from './pages/ExpiringContractsPage';
import { BirthdaysPage } from './pages/BirthdaysPage';
import { AvisoPrevioPage } from './pages/AvisoPrevioPage';
import { VacationManagementPage } from './pages/VacationManagementPage';
import { AfastadosPage } from './pages/AfastadosPage';
import { DesligadosPage } from './pages/DesligadosPage';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = () => setDataVersion(v => v + 1);

  const [dropdownOptions, setDropdownOptions] = useState({
      coordinators: [] as {value: string, label: string}[],
      supervisors: [] as {value: string, label: string}[],
      clients: [] as {value: string, label: string}[],
      operations: [] as {value: string, label: string, clientId?: string}[]
  });

  useEffect(() => {
      const runChecks = async () => {
          await db.processDueTasks();
          await db.checkVacationReturns();
          await db.checkAvisoPrevioEnds();
      };
      runChecks();
  }, []);

  useEffect(() => {
      const load = async () => {
          const [c, s, cli, op] = await Promise.all([
              db.getCoordinators(),
              db.getSupervisors(),
              db.getClients(),
              db.getOperations()
          ]);
          setDropdownOptions({
              coordinators: c.map(x => ({value: x.id, label: x.nome})),
              supervisors: s.map(x => ({value: x.id, label: x.nome})),
              clients: cli.map(x => ({value: x.id, label: x.nome})),
              operations: op.map(x => ({value: x.id, label: x.nome, clientId: x.clientId}))
          });
      };
      load();
  }, [dataVersion]);

  const handleLogin = (u: User) => {
    setCurrentUser(u);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const renderContent = () => {
    const commonProps = { onRefresh: refreshData, currentUser: currentUser! };

    switch (currentPage) {
      case 'dashboard': return <DashboardPage currentUser={currentUser!} onNavigate={setCurrentPage} key={dataVersion} />;
      case 'turnover': return <TurnoverPage key={dataVersion} />;
      case 'organogram': return <OrganogramPage key={dataVersion} />;
      case 'collaborators':
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <CollaboratorsPage key={dataVersion} onViewDetails={setSelectedCollab} {...commonProps} />;
      case 'coordinators': return <CrudPage key={dataVersion} title="Coordenadores" data={db.getCoordinators()} onSave={db.saveCoordinator.bind(db)} onDelete={db.deleteCoordinator.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}]} {...commonProps} />;
      case 'supervisors': return <CrudPage key={dataVersion} title="Supervisores" data={db.getSupervisors()} onSave={db.saveSupervisor.bind(db)} onDelete={db.deleteSupervisor.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'coordinatorIds', label:'Coordenadores', type:'multiselect', options: dropdownOptions.coordinators }]} {...commonProps} />;
      case 'clients': return <CrudPage key={dataVersion} title="Clientes" data={db.getClients()} onSave={db.saveClient.bind(db)} onDelete={db.deleteClient.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'logo', label:'URL da Logo', type:'text'}]} {...commonProps} />;
      case 'operations': return <CrudPage key={dataVersion} title="Operações" data={db.getOperations()} onSave={db.saveOperation.bind(db)} onDelete={db.deleteOperation.bind(db)} schema={[{key:'nome', label:'Nome', type:'text'}, {key:'clientId', label:'Cliente', type:'select', options: dropdownOptions.clients }]} {...commonProps} />;
      case 'ilhas': return <CrudPage key={dataVersion} title="Ilhas" data={db.getIlhas()} onSave={db.saveIlha.bind(db)} onDelete={db.deleteIlha.bind(db)} schema={[
        {key:'nome', label:'Nome', type:'text'},
        {key:'clientId', label:'Cliente', type:'select', options: dropdownOptions.clients },
        {key:'operationId', label:'Operação', type:'select', options: (currentItem: any) => currentItem.clientId ? dropdownOptions.operations.filter(o => o.clientId === currentItem.clientId) : dropdownOptions.operations },
        {key:'coordinatorIds', label:'Coordenadores', type:'multiselect', options: dropdownOptions.coordinators },
        {key:'supervisorIds', label:'Supervisores', type:'multiselect', options: dropdownOptions.supervisors }
      ]} {...commonProps} />;
      case 'users': return <UsersPage key={dataVersion} {...commonProps} />;
      case 'history': return <HistoryPage key={dataVersion} />;
      case 'birthdays': return <BirthdaysPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} />;
      case 'desligados':
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <DesligadosPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'expiring': return <ExpiringContractsPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} currentUser={currentUser!} />;
      case 'aviso_previo':
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <AvisoPrevioPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'vacation':
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <VacationManagementPage currentUser={currentUser!} key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'afastados':
        if (selectedCollab) return <CollaboratorDetailsPage key={dataVersion} collab={selectedCollab} onBack={() => setSelectedCollab(null)} {...commonProps} />;
        return <AfastadosPage key={dataVersion} onBack={() => setCurrentPage('dashboard')} onViewDetails={setSelectedCollab} />;
      case 'scheduled_tasks': return <ScheduledTasksPage key={dataVersion} />;
      case 'import': return <ImportPage key={dataVersion} {...commonProps} />;
      case 'bulk_update': return <BulkUpdatePage key={dataVersion} {...commonProps} />;
      case 'reset': return <ResetDataPage key={dataVersion} />;
      case 'about': return <AboutPage key={dataVersion} />;
      default: return <DashboardPage currentUser={currentUser!} onNavigate={setCurrentPage} key={dataVersion} />;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-bg text-fg font-sans">
       <aside className="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-10">
          <div className="h-16 flex items-center px-6 border-b border-border">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold mr-3">M</div>
             <span className="font-bold text-lg tracking-tight text-fg">MOP System</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <nav className="space-y-1">
                {visibleGroups(currentUser.role).map((group, idx) => (
                   <div key={group.group} className={idx === 0 ? 'pb-2' : 'pt-2 pb-2'}>
                      <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">{group.group}</p>
                      {group.items.map(item => (
                         <NavItem
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            active={currentPage === item.key}
                            onClick={() => {
                               setCurrentPage(item.key);
                               if (item.key === 'collaborators') setSelectedCollab(null);
                            }}
                         />
                      ))}
                   </div>
                ))}
             </nav>
          </div>
          <div className="p-4 border-t border-border bg-surface-alt">
             <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-1">
                     {currentUser.nome.charAt(0)}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-xs font-bold text-fg truncate">{currentUser.nome}</p>
                     <p className="text-[10px] text-fg-muted truncate">{currentUser.email}</p>
                 </div>
             </div>
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error">
                 <LogOut size={14} /> Sair
             </button>
          </div>
       </aside>

       <main className="flex-1 ml-64 overflow-y-auto h-full bg-bg flex flex-col relative custom-scrollbar">
          <Header title={pageTitle(currentPage)} user={currentUser}>
              <NotificationCenter />
          </Header>
          <div className="p-6 md:p-8 max-w-[1600px] w-full mx-auto flex-1">
              {renderContent()}
          </div>
       </main>
    </div>
  );
};

export default App;
