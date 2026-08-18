import React from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/mockDb';
import { CrudPage } from './CrudPage';

export const UsersPage = ({ currentUser, onRefresh }: any) => {
    return <CrudPage
        title="Usuários"
        singular="usuário"
        data={db.getUsers()}
        onSave={(u: User) => {
             db.getUsers().then(users => {
                 if(users.find(x => x.id === u.id)) db.updateUser(u);
                 else db.addUser(u);
             });
        }}
        onDelete={(id: string) => db.deleteUser(id)}
        schema={[
            {key: 'matricula', label: 'Matrícula', type: 'text'},
            {key: 'nome', label: 'Nome', type: 'text'},
            {key: 'email', label: 'Email', type: 'text'},
            {key: 'password', label: 'Senha', type: 'text'},
            {key: 'role', label: 'Função', type: 'select', options: [
                {value: UserRole.ADMIN, label: 'Admin'},
                {value: UserRole.MANAGER, label: 'Gerente'},
                {value: UserRole.COORDINATOR, label: 'Coordenador'},
                {value: UserRole.SUPERVISOR, label: 'Supervisor'},
                {value: UserRole.RH, label: 'RH'},
                {value: UserRole.VIEWER, label: 'Visualizador'},
                {value: UserRole.SUPPORT, label: 'Suporte'}
            ]}
        ]}
        currentUser={currentUser}
        onRefresh={onRefresh}
    />;
};
