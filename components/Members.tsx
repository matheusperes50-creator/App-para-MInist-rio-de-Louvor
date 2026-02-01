import React, { useState } from 'react';
import { Member, Role } from '../types';
import { UserPlus, Search, Trash2, Edit2, Check } from 'lucide-react';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Members: React.FC<MembersProps> = ({ members, setMembers }) => {
  const [isAdding, setIsAdding] = useState(false);
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

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || selectedRoles.length === 0) {
      alert("Por favor, preencha o nome e selecione pelo menos uma função.");
      return;
    }

    const newMember: Member = {
      id: generateShortId(),
      name: newName,
      roles: selectedRoles,
      isActive: true,
    };

    setMembers(prev => [...prev, newMember]);
    setNewName('');
    setSelectedRoles([]);
    setIsAdding(false);
  };

  const toggleStatus = (id: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  const removeMember = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Membros</h2>
          <p className="text-slate-500">Gerencie todos os integrantes e suas habilidades.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          <UserPlus size={18} />
          {isAdding ? 'Fechar' : 'Novo Membro'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={addMember} className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl animate-in zoom-in-95 duration-200">
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
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-10 py-3 bg-emerald-600 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              Salvar Membro
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
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-black">
            <tr>
              <th className="px-8 py-5">Membro</th>
              <th className="px-8 py-5">ID</th>
              <th className="px-8 py-5">Funções</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-inner">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{member.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="font-mono text-xs text-slate-400 font-bold">{member.id}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-1.5">
                    {member.roles.map((role, idx) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-emerald-100">
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-6">
                  {member.isActive ? (
                    <span className="text-green-600 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> Ativo
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div> Inativo
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 text-right space-x-2">
                  <button 
                    onClick={() => toggleStatus(member.id)}
                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => removeMember(member.id)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};