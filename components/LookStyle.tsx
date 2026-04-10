
import React, { useState } from 'react';
import { LookStyle as LookStyleType } from '../types';
import { 
  Shirt, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Camera, 
  Image as ImageIcon,
  Palette,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';

interface LookStyleProps {
  styles: LookStyleType[];
  setStyles: React.Dispatch<React.SetStateAction<LookStyleType[]>>;
  isAdmin: boolean;
  onSync: () => void;
  isSyncing: boolean;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const LookStyle: React.FC<LookStyleProps> = ({ styles = [], setStyles, isAdmin, onSync, isSyncing }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [title, setTitle] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [date, setDate] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImageUrl(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const addColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors([...colors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setColors([]);
    setDescription('');
    setImageUrl(undefined);
    setDate('');
    setShowModal(true);
  };

  const openEditModal = (style: LookStyleType) => {
    setEditingId(style.id);
    setTitle(style.title);
    setColors(style.colors || []);
    setDescription(style.description || '');
    setImageUrl(style.imageUrl);
    setDate(style.date || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const saveStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Por favor, insira um título.");
      return;
    }

    const styleData: LookStyleType = {
      id: editingId || generateShortId(),
      title: title.trim(),
      colors,
      description: description.trim(),
      imageUrl,
      date
    };

    if (editingId) {
      setStyles(prev => prev.map(s => s.id === editingId ? styleData : s));
    } else {
      setStyles(prev => [styleData, ...prev]);
    }

    closeModal();
  };

  const removeStyle = (id: string) => {
    if (confirm('Deseja excluir este look permanentemente?')) {
      setStyles(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredStyles = styles.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.colors.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Look & Style</h2>
          <p className="text-slate-500 font-medium">Definição visual para as escalas.</p>
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
              <Plus size={18} />
              Novo Look
            </button>
          )}
        </div>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por título, cor ou descrição..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-16 pr-8 py-4 rounded-2xl bg-white border border-slate-100 focus:border-emerald-500 shadow-sm outline-none transition-all font-medium text-lg" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStyles.map((style) => (
          <div key={style.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
            <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
              {style.imageUrl ? (
                <img src={style.imageUrl} alt={style.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Shirt size={48} />
                </div>
              )}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(style)} className="p-2 bg-white/90 backdrop-blur-sm text-slate-600 rounded-xl shadow-lg hover:text-emerald-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => removeStyle(style.id)} className="p-2 bg-white/90 backdrop-blur-sm text-slate-600 rounded-xl shadow-lg hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-xl text-slate-800 leading-tight">{style.title}</h4>
                  {style.date && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                      <Calendar size={10} /> {new Date(style.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {style.colors && style.colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {style.colors.map((color, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-[10px] font-black uppercase text-emerald-700 rounded-lg flex items-center gap-1.5">
                      <Palette size={10} /> {color}
                    </span>
                  ))}
                </div>
              )}

              {style.description && (
                <p className="text-sm text-slate-500 font-medium line-clamp-3 italic">
                  "{style.description}"
                </p>
              )}
            </div>
          </div>
        ))}

        {filteredStyles.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-slate-100">
            <div className="flex flex-col items-center gap-3 text-slate-200">
              <Shirt size={64} />
              <p className="font-bold uppercase tracking-widest text-xs">Nenhum look cadastrado</p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Palette className="text-emerald-600" size={24} />
                {editingId ? 'Editar Look' : 'Novo Look'}
              </h3>
              <button onClick={closeModal} className="p-2 text-slate-300 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={saveStyle} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group w-full aspect-video">
                  <div className="w-full h-full rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center transition-all group-hover:border-emerald-500">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="text-slate-300" size={48} />
                    )}
                  </div>
                  <label className="absolute bottom-4 right-4 bg-emerald-600 text-white p-3 rounded-xl shadow-lg cursor-pointer hover:bg-emerald-700 transition-all">
                    <ImageIcon size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imagem de Referência</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Look</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-lg transition-all" 
                  placeholder="Ex: Culto de Celebração - Tons Pastéis" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Prevista (Opcional)</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-lg transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cores</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={colorInput} 
                    onChange={(e) => setColorInput(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    className="flex-1 px-6 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-sm transition-all" 
                    placeholder="Adicionar cor..." 
                  />
                  <button type="button" onClick={addColor} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((color, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                      {color}
                      <button type="button" onClick={() => removeColor(color)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição / Detalhes</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-sm transition-all min-h-[100px] resize-none" 
                  placeholder="Ex: Camisa branca, calça jeans escura..." 
                />
              </div>

              <div className="flex flex-col gap-2 pt-6 border-t">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs"
                >
                  {editingId ? 'Atualizar Look' : 'Salvar Look'}
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
    </div>
  );
};
