import React, { useState } from 'react';
import { Member, Role } from '../types';
import { UserPlus, Search, Trash2, Edit2, Check, X, Power } from 'lucide-react';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Members: React.FC<MembersProps> = ({ members = [], setMembers }) => {
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
    setNewName(member.name);
    // Garantir que roles seja um array
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
      // Atualizar membro existente
      setMembers(prev => (prev || []).map(m => 
        m.id === editingMemberId 
          ? { ...m, name: newName, roles: selectedRoles } 
          : m
      ));
    } else {
      // Criar novo membro
      const newMember: Member = {
        id: generateShortId(),
        name: newName,
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

  const filteredMembers = (members || []).filter(m => 
    m && m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Membros</h2>
          <p className="text-slate-500">Gerencie todos os integrantes e suas habilidades.</p>
        </div>
        <button 
          onClick={() => {
            if (editingMemberId) resetForm();
            setIsAdding(!isAdding);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          {isAdding || editingMemberId ? <X size={18} /> : <UserPlus size={18} />}
          {isAdding || editingMemberId ? 'Cancelar' : 'Novo Membro'}
        </button>
      </header>

      {(isAdding || editingMemberId) && (
        <form onSubmit={saveMember} className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            {editingMemberId ? <Edit2 className="text-emerald-500" size={20} /> : <UserPlus className="text-emerald-500" size={20} />}
            {editingMemberId ? 'Editar Cadastro' : 'Novo Cadastro de Membro'}
          </h3>
          
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Nome Completo</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 text-lg"
                placeholder="Ex: João da Silva"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Funções (Selecione uma ou mais)</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Role).map(role => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => toggleRoleSelection(role)}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border-2
                        ${isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-105' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/30'}
                      `}
                    >
                      {isSelected && <Check size={16} />}
                      {role}
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
              className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-10 py-3 bg-emerald-600 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              {editingMemberId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      )}

      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all shadow-sm text-lg"
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-black">
              <tr>
                <th className="px-8 py-5">Membro</th>
                <th className="px-8 py-5">Funções</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const safeRoles = Array.isArray(member.roles) 
                  ? member.roles 
                  : (typeof member.roles === 'string' ? [member.roles as unknown as Role] : []);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {member.name ? member.name.charAt(0) : '?'}
                        </div>
                        <div>
                          <span className={`font-bold text-lg block ${member.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                            {member.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-300 font-bold uppercase">{member.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5">
                        {safeRoles.map((role, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${member.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            {role}
                          </span>
                        ))}
                        {safeRoles.length === 0 && (
                          <span className="text-slate-300 text-[10px] italic">Sem função</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center">
                        {member.isActive ? (
                          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Ativo
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                            Inativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEditClick(member)}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Alterar Cadastro"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(member.id)}
                          className={`p-2.5 rounded-xl transition-all ${member.isActive ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={member.isActive ? "Desativar Membro" : "Reativar Membro"}
                        >
                          <Power size={18} />
                        </button>
                        <button 
                          onClick={() => removeMember(member.id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir Definitivamente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    Nenhum membro encontrado na busca.
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