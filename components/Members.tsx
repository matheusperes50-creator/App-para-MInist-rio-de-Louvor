import React, { useState } from 'react';
import { Member, Role } from '../types';
import { UserPlus, Search, Trash2, Edit2, Check, X, Power, RefreshCw, UserCheck } from 'lucide-react';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onSync: () => void;
  isSyncing: boolean;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Members: React.FC<MembersProps> = ({ members = [], setMembers, onSync, isSyncing }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newName, setNewName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  const toggleRoleSelection = (role: Role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const resetForm = () => {
    setNewName('');
    setSelectedRoles([]);
    setIsAdding(false);
    setEditingMemberId(null);
  };

  const handleEditClick = (member: Member) => {
    setEditingMemberId(member.id);
    setNewName(member.name || '');
    setSelectedRoles(Array.isArray(member.roles) ? member.roles : []);
    setIsAdding(false);
  };

  const saveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || selectedRoles.length === 0) {
      alert("Por favor, preencha o nome e selecione pelo menos uma função.");
      return;
    }

    if (editingMemberId) {
      setMembers(prev => (prev || []).map(m => 
        m.id === editingMemberId 
          ? { ...m, name: newName.trim(), roles: selectedRoles } 
          : m
      ));
    } else {
      const newMember: Member = {
        id: generateShortId(),
        name: newName.trim(),
        roles: selectedRoles,
        isActive: true,
      };
      setMembers(prev => [...(prev || []), newMember]);
    }

    resetForm();
  };

  const toggleStatus = (id: string) => {
    setMembers(prev => (prev || []).map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  const removeMember = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      setMembers(prev => (prev || []).filter(m => m.id !== id));
    }
  };

  const filteredMembers = (members || []).filter(m => {
    if (!m || !m.name) return false;
    return m.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Membros</h2>
          <p className="text-slate-500 font-medium">Equipe do Ministério (Total: {members.length})</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className={`p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs border ${isSyncing ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
            title="Atualizar dados da nuvem"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Atualizar'}
          </button>
          <button 
            onClick={() => {
              if (editingMemberId) resetForm();
              setIsAdding(!isAdding);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 uppercase tracking-wider text-xs"
          >
            {isAdding || editingMemberId ? <X size={18} /> : <UserPlus size={18} />}
            {isAdding || editingMemberId ? 'Cancelar' : 'Novo Membro'}
          </button>
        </div>
      </header>

      {(isAdding || editingMemberId) && (
        <form onSubmit={saveMember} className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              {editingMemberId ? <Edit2 size={20} /> : <UserPlus size={20} />}
            </div>
            {editingMemberId ? 'Editar Membro' : 'Cadastrar Novo Integrante'}
          </h3>
          
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] ml-2">NOME COMPLETO</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all text-lg font-bold"
                placeholder="Ex: João da Silva"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] ml-2">FUNÇÕES NO MINISTÉRIO</label>
              <div className="flex flex-wrap gap-2 p-1">
                {Object.values(Role).map(role => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRoleSelection(role)}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all border-2
                        ${isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-500'}
                      `}
                    >
                      {isSelected && <Check size={14} />}
                      {role.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-50">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 py-3 text-slate-400 font-black text-xs uppercase"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-10 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
            >
              {editingMemberId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </button>
          </div>
        </form>
      )}

      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
          <Search size={22} />
        </div>
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white border border-slate-100 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all shadow-sm text-lg font-medium placeholder:text-slate-300"
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-10 py-6">Integrante</th>
                <th className="px-10 py-6">Funções</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.map((member) => {
                if (!member) return null;
                const safeRoles = Array.isArray(member.roles) 
                  ? member.roles 
                  : (typeof member.roles === 'string' ? [member.roles as unknown as Role] : []);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border-2 ${member.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                          {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <span className={`font-black text-lg block leading-none ${member.isActive ? 'text-slate-800' : 'text-slate-300 line-through'}`}>
                            {member.name}
                          </span>
                          <span className="font-mono text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-1 block">ID: {member.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {safeRoles.map((role, idx) => (
                          <span key={idx} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${member.isActive ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => toggleStatus(member.id)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${member.isActive ? 'bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                        >
                          {member.isActive ? 'Ativo' : 'Inativo'}
                        </button>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(member)}
                          className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar Cadastro"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => removeMember(member.id)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir Definitivamente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {members.length === 0 && !isSyncing && (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-40">
                      <UserCheck size={64} className="text-slate-200" />
                      <div className="space-y-1">
                        <p className="text-slate-800 font-black text-xl uppercase tracking-widest">Nenhum Membro</p>
                        <p className="text-slate-400 font-medium">Cadastre os integrantes ou clique em atualizar.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};