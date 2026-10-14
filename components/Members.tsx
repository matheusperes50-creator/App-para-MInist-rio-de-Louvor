import React, { useState, useRef, useEffect } from 'react';
import { Member, Role } from '../types';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Power, 
  RefreshCw, 
  Users, 
  Camera, 
  Image as ImageIcon,
  Cake,
  LayoutGrid,
  List,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Crop
} from 'lucide-react';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onSync: () => void;
  isSyncing: boolean;
  isAdmin: boolean;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

interface PhotoCropperProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
}

const PhotoCropperModal: React.FC<PhotoCropperProps> = ({ imageSrc, onSave, onClose }) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const PREVIEW_SIZE = 256;

  // Handle pointer drag (touch + mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleStepPan = (dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleConfirmCrop = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Base aspect ratio calculation to emulate CSS object-cover
      const aspect = img.width / img.height;
      let baseWidth = PREVIEW_SIZE;
      let baseHeight = PREVIEW_SIZE;

      if (aspect >= 1) {
        baseHeight = PREVIEW_SIZE;
        baseWidth = PREVIEW_SIZE * aspect;
      } else {
        baseWidth = PREVIEW_SIZE;
        baseHeight = PREVIEW_SIZE / aspect;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

      ctx.save();
      // Center transform at canvas middle
      ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2);
      ctx.translate(pan.x, pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
      ctx.restore();

      // Export compressed JPEG under 20KB for Google Sheets
      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.72);
      onSave(finalDataUrl);
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Crop size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">Ajustar Enquadramento</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arraste e ajuste o zoom</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Viewport frame with drag handler */}
        <div className="relative my-2 select-none">
          <div 
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 border-emerald-500 shadow-2xl relative cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="Ajuste"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: 'center center'
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-75"
              draggable={false}
            />

            {/* Circular guide to help align face */}
            <div className="absolute inset-0 border-2 border-white/30 rounded-full pointer-events-none shadow-inner" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/15 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/15 pointer-events-none" />
          </div>
          <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
            <Move size={12} /> Toque e arraste para posicionar a foto
          </p>
        </div>

        {/* Precision controls: Zoom & Directional buttons */}
        <div className="w-full space-y-4 mt-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {/* Zoom slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom</span>
              <span className="text-emerald-700 font-bold">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setScale(s => Math.max(0.8, +(s - 0.1).toFixed(2)))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                title="Diminuir Zoom"
              >
                <ZoomOut size={16} />
              </button>
              <input 
                type="range" 
                min="0.8" 
                max="3.0" 
                step="0.05" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button 
                onClick={() => setScale(s => Math.min(3.0, +(s + 0.1).toFixed(2)))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                title="Aumentar Zoom"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Precision pan buttons & rotate */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleStepPan(-15, 0)} 
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600"
                title="Mover para esquerda"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => handleStepPan(0, -15)} 
                  className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600"
                  title="Mover para cima"
                >
                  <ArrowUp size={14} />
                </button>
                <button 
                  onClick={() => handleStepPan(0, 15)} 
                  className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600"
                  title="Mover para baixo"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <button 
                onClick={() => handleStepPan(15, 0)} 
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600"
                title="Mover para direita"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 text-xs font-bold transition-colors"
                title="Girar 90 graus"
              >
                <RotateCw size={14} /> Girar
              </button>
              <button 
                onClick={handleReset}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                title="Redefinir ajustes"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCrop}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Salvar Foto
          </button>
        </div>
      </div>
    </div>
  );
};

export const Members: React.FC<MembersProps> = ({ members = [], setMembers, onSync, isSyncing, isAdmin }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'birthdays'>('list');
  
  const [newName, setNewName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<string>('');

  // Photo cropper modal state
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropTargetMemberId, setCropTargetMemberId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawSrc = reader.result as string;
        setCropperImageSrc(rawSrc);
      };
      reader.readAsDataURL(file);
    }
    // Clear input so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleOpenCropperForExistingPhoto = (src?: string, memberId?: string) => {
    if (src) {
      setCropperImageSrc(src);
      setCropTargetMemberId(memberId || null);
    } else {
      setCropTargetMemberId(memberId || null);
      fileInputRef.current?.click();
    }
  };

  const handleCropperSave = (newCroppedUrl: string) => {
    if (cropTargetMemberId) {
      // Direct adjustment on an existing member from the list/grid
      setMembers(prev => prev.map(m => m.id === cropTargetMemberId ? { ...m, photoUrl: newCroppedUrl } : m));
      setCropTargetMemberId(null);
    } else {
      // Adjustment inside the edit/add modal
      setPhotoUrl(newCroppedUrl);
    }
    setCropperImageSrc(null);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
  };

  const toggleRoleSelection = (role: Role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const openAddModal = () => {
    setEditingMemberId(null);
    setNewName('');
    setSelectedRoles([]);
    setPhotoUrl(undefined);
    setBirthDate('');
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMemberId(member.id);
    setNewName(member.name || '');
    setSelectedRoles(Array.isArray(member.roles) ? member.roles : []);
    setPhotoUrl(member.photoUrl);
    setBirthDate(member.birthDate || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMemberId(null);
    setNewName('');
    setSelectedRoles([]);
    setPhotoUrl(undefined);
    setBirthDate('');
  };

  const saveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || selectedRoles.length === 0) {
      alert("Preencha o nome e selecione ao menos uma função.");
      return;
    }

    if (editingMemberId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== editingMemberId) return m;
        
        if (isAdmin) {
          return { ...m, name: newName.trim(), roles: selectedRoles, photoUrl, birthDate };
        } else {
          // Non-admins can update photo and birth date
          return { ...m, photoUrl, birthDate };
        }
      }));
    } else if (isAdmin) {
      const newMember: Member = {
        id: generateShortId(),
        name: newName.trim(),
        roles: selectedRoles,
        isActive: true,
        photoUrl,
        birthDate
      };
      setMembers(prev => [...prev, newMember]);
    }

    closeModal();
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
      {/* Hidden file input for quick photo uploads */}
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={handlePhotoFileSelected} 
      />

      {/* Interactive Photo Cropper / Adjuster Modal */}
      {cropperImageSrc && (
        <PhotoCropperModal 
          imageSrc={cropperImageSrc}
          onSave={handleCropperSave}
          onClose={() => {
            setCropperImageSrc(null);
            setCropTargetMemberId(null);
          }}
        />
      )}

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
            title="Sincronizar dados"
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button 
              onClick={openAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest"
            >
              <UserPlus size={18} />
              Novo Membro
            </button>
          )}
        </div>
      </header>

      {/* Modal for Add/Edit Member */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                {editingMemberId ? <Edit2 className="text-emerald-600" size={24} /> : <UserPlus className="text-emerald-600" size={24} />}
                {editingMemberId ? 'Editar Cadastro' : 'Novo Integrante'}
              </h3>
              <button onClick={closeModal} className="p-2 text-slate-300 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={saveMember} className="space-y-6">
              {/* Photo Upload & Adjust Section */}
              <div className="flex flex-col items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] bg-white border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-md">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="text-slate-300" size={36} />
                    )}
                  </div>
                  <label 
                    onClick={() => {
                      setCropTargetMemberId(null);
                    }}
                    className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg cursor-pointer hover:bg-emerald-700 transition-all"
                    title="Escolher Foto"
                  >
                    <ImageIcon size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoFileSelected} />
                  </label>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExistingPhoto(photoUrl)}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Sliders size={12} /> Ajustar Enquadramento
                    </button>
                  )}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                      Remover Foto
                    </button>
                  )}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Foto do Integrante • Clique em Ajustar para dar zoom ou centralizar
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    disabled={!isAdmin}
                    className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-base transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    placeholder="Ex: João da Silva" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)} 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-base transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Habilidades e Funções</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(Role).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => isAdmin && toggleRoleSelection(role)}
                        disabled={!isAdmin}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-tight ${selectedRoles.includes(role) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-200'} ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        {role === Role.MINISTER ? `🎤 ${role}` : role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs"
                >
                  {editingMemberId ? 'Atualizar Dados' : 'Cadastrar Membro'}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 hover:text-red-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={14} /> Lista
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={14} /> Grid
          </button>
          <button 
            onClick={() => setViewMode('birthdays')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'birthdays' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Cake size={14} /> Aniversariantes
          </button>
        </div>

        <div className="relative group flex-1 w-full max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar integrante por nome..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-16 pr-8 py-4 rounded-2xl bg-white border border-slate-100 focus:border-emerald-500 shadow-sm outline-none transition-all font-medium text-lg" 
          />
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 sm:px-10 py-6">Membro</th>
                  <th className="px-6 sm:px-10 py-6">Habilidades</th>
                  <th className="px-6 sm:px-10 py-6 text-center">Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 sm:px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => isAdmin && handleOpenCropperForExistingPhoto(m.photoUrl, m.id)}
                          title={isAdmin ? "Clique para ajustar ou alterar a foto" : undefined}
                          className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all overflow-hidden shrink-0 relative ${isAdmin ? 'cursor-pointer hover:border-emerald-500' : ''} ${m.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                          style={{ width: '3.25rem', height: '3.25rem' }}
                        >
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            m.name.charAt(0).toUpperCase()
                          )}
                          {isAdmin && (
                            <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Crop size={14} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-black text-base sm:text-lg ${m.isActive ? 'text-slate-800' : 'text-slate-300 line-through'}`}>{m.name}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID: {m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 sm:px-10 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {(m.roles || []).map((r, i) => (
                          <span 
                            key={i} 
                            className={`px-2 py-1 border text-[9px] font-black uppercase rounded-lg inline-flex items-center gap-1 ${
                              r === Role.MINISTER 
                                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs' 
                                : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}
                          >
                            {r === Role.MINISTER && '🎤'} {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 sm:px-10 py-5">
                      <div className="flex justify-center gap-2">
                        {isAdmin && (
                          <button 
                            onClick={() => handleOpenCropperForExistingPhoto(m.photoUrl, m.id)}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Ajustar Enquadramento da Foto"
                          >
                            <Crop size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(m)} 
                          className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Editar Cadastro"
                        >
                          <Edit2 size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => toggleStatus(m.id)} 
                              className={`p-2.5 transition-all rounded-xl ${m.isActive ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50' : 'text-emerald-500 bg-emerald-50'}`}
                              title={m.isActive ? "Desativar Membro" : "Ativar Membro"}
                            >
                              <Power size={18} />
                            </button>
                            <button 
                              onClick={() => removeMember(m.id)} 
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Excluir Permanentemente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && !isSyncing && (
                  <tr>
                    <td colSpan={3} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-200">
                        <Users size={48} />
                        <p className="font-bold uppercase tracking-widest text-xs">Nenhum membro encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((m) => (
            <div key={m.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => isAdmin && handleOpenCropperForExistingPhoto(m.photoUrl, m.id)}
                    title={isAdmin ? "Clique para ajustar o enquadramento" : undefined}
                    className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl border-2 transition-all overflow-hidden shrink-0 relative ${isAdmin ? 'cursor-pointer hover:border-emerald-500' : ''} ${m.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                  >
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      m.name.charAt(0).toUpperCase()
                    )}
                    {isAdmin && (
                      <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Crop size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-black text-xl leading-tight ${m.isActive ? 'text-slate-800' : 'text-slate-300 line-through'}`}>{m.name}</h4>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {m.id}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {isAdmin && (
                    <button 
                      onClick={() => handleOpenCropperForExistingPhoto(m.photoUrl, m.id)} 
                      className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                      title="Ajustar Enquadramento da Foto"
                    >
                      <Crop size={16} />
                    </button>
                  )}
                  <button onClick={() => openEditModal(m)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors" title="Editar"><Edit2 size={16} /></button>
                  {isAdmin && <button onClick={() => removeMember(m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={16} /></button>}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-6">
                {(m.roles || []).map((r, i) => (
                  <span 
                    key={i} 
                    className={`px-2.5 py-1 border text-[9px] font-black uppercase rounded-lg inline-flex items-center gap-1 ${
                      r === Role.MINISTER 
                        ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs' 
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}
                  >
                    {r === Role.MINISTER && '🎤'} {r}
                  </span>
                ))}
              </div>

              {isAdmin && (
                <button 
                  onClick={() => toggleStatus(m.id)}
                  className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${m.isActive ? 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  <Power size={14} /> {m.isActive ? 'Desativar' : 'Ativar'}
                </button>
              )}
            </div>
          ))}
          {filteredMembers.length === 0 && !isSyncing && (
            <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-slate-100">
              <div className="flex flex-col items-center gap-3 text-slate-200">
                <Users size={48} />
                <p className="font-bold uppercase tracking-widest text-xs">Nenhum membro encontrado</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Birthdays View */}
      {viewMode === 'birthdays' && (
        <div className="space-y-4">
          {(() => {
            const getDaysUntilBirthday = (dateStr?: string) => {
              if (!dateStr) return Infinity;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const [y, m, d] = dateStr.split('-').map(Number);
              const bday = new Date(today.getFullYear(), m - 1, d);
              if (bday < today) bday.setFullYear(today.getFullYear() + 1);
              return Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            };

            const sorted = [...members]
              .filter(m => m.birthDate)
              .sort((a, b) => getDaysUntilBirthday(a.birthDate) - getDaysUntilBirthday(b.birthDate));

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sorted.map(m => {
                  const days = getDaysUntilBirthday(m.birthDate);
                  const [y, month, day] = (m.birthDate || '').split('-');
                  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                  
                  const calculateAge = (dateStr?: string) => {
                    if (!dateStr) return null;
                    const birthDate = new Date(dateStr);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  };
                  const age = calculateAge(m.birthDate);
                  
                  return (
                    <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => isAdmin && handleOpenCropperForExistingPhoto(m.photoUrl, m.id)}
                          className={`w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl overflow-hidden shrink-0 ${isAdmin ? 'cursor-pointer hover:border-emerald-500' : ''}`}
                        >
                          {m.photoUrl ? <img src={m.photoUrl} alt="" className="w-full h-full object-cover" /> : m.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{m.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Calendar size={10} /> {day}/{months[Number(month)-1]}
                            </p>
                            {age !== null && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                {age} anos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {days === 0 ? (
                          <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest animate-bounce flex items-center gap-1">
                            <Cake size={12} /> É HOJE!
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Em {days} {days === 1 ? 'dia' : 'dias'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sorted.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-slate-100">
                    <div className="flex flex-col items-center gap-3 text-slate-200">
                      <Cake size={48} />
                      <p className="font-bold uppercase tracking-widest text-xs">Nenhuma data de nascimento cadastrada</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
