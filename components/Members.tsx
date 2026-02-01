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
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
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
    if (!newName.trim() || selectedRoles.length === 0) {
      alert("Preencha o nome e selecione ao menos uma função.");
      return;
    }

    if (editingMemberId) {
      setMembers(prev => prev.map(m => 
        m.id === editingMemberId ? { ...m, name: newName.trim(), roles: selectedRoles } : m
      ));
    } else {
      const newMember: Member = {
        id: generateShortId(),
        name: newName.trim(),
        roles: selectedRoles,
        isActive: true,
      };
      setMembers(prev => [...prev, newMember]);
    }

    resetForm();
  };

  const toggleStatus = (id: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  const removeMember = (id: string) => {
    if (confirm('Deseja excluir este membro permanentemente?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const filteredMembers = (members || []).filter(m => 
    m?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Membros</h2>
          <p className="text-slate-500 font-medium">Equipe cadastrada: {members.length}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest"
          >
            {isAdding ? <X size={18} /> : <UserPlus size={18} />}
            {isAdding ? 'Cancelar' : 'Novo Membro'}
          </button>
        </div>
      </header>

      {(isAdding || editingMemberId) && (
        <form onSubmit={saveMember} className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            {editingMemberId ? <Edit2 size={18} /> : <UserPlus size={18} />}
            {editingMemberId ? 'Editar Cadastro' : 'Novo Integrante'}
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-lg" 
                placeholder="Nome do integrante" 
                required 
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Funções</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Role).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRoleSelection(role)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${selectedRoles.includes(role) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {role.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button type="button" onClick={resetForm} className="font-bold text-slate-400 uppercase text-xs">Cancelar</button>
            <button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all text-xs uppercase tracking-widest">Salvar</button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Buscar integrante..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white border border-slate-100 focus:border-emerald-500 shadow-sm outline-none transition-all font-medium" 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-10 py-6">Membro</th>
              <th className="px-10 py-6">Habilidades</th>
              <th className="px-10 py-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-2 ${m.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-black text-lg ${m.isActive ? 'text-slate-800' : 'text-slate-300 line-through'}`}>{m.name}</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID: {m.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-wrap gap-1.5">
                    {(m.roles || []).map((r, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 border text-[9px] font-black uppercase text-slate-500 rounded-lg">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleEditClick(m)} className="p-2 text-slate-300 hover:text-blue-500 transition-all"><Edit2 size={18} /></button>
                    <button onClick={() => toggleStatus(m.id)} className={`p-2 transition-all ${m.isActive ? 'text-slate-300 hover:text-orange-500' : 'text-emerald-500'}`}><Power size={18} /></button>
                    <button onClick={() => removeMember(m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && !isSyncing && (
              <tr>
                <td colSpan={3} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Nenhum membro encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};