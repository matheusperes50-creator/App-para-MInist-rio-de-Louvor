import React, { useState } from 'react';
import { Song } from '../types';
import { Music, Search, Trash2, Hash, Library } from 'lucide-react';

interface SongsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

export const Songs: React.FC<SongsProps> = ({ songs = [], setSongs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const removeSong = (id: string) => {
    if (confirm('Excluir música do repertório? Isso não afetará as escalas já criadas, mas a música sumirá das estatísticas.')) {
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredSongs = (songs || []).filter(s => {
    const term = searchTerm.toLowerCase();
    const title = (s.title || "").toLowerCase();
    const artist = (s.artist || "").toLowerCase();
    return title.includes(term) || artist.includes(term);
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Repertório</h2>
        <p className="text-slate-500">Músicas cadastradas automaticamente através das escalas.</p>
      </header>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Filtrar repertório local..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white border border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-lg"
        />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-6 text-slate-400">
          <Library size={20} />
          <h3 className="font-black uppercase tracking-widest text-sm">Biblioteca de Músicas ({(songs || []).length})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs.map((song) => (
            <div key={song.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
                  <Music size={24} />
                </div>
                <button 
                  onClick={() => removeSong(song.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-xl line-clamp-1">{song.title}</h4>
                <p className="text-slate-500 font-medium">{song.artist || 'Artista não informado'}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {song.key && (
                  <span className="text-[10px] uppercase font-black bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                    TOM: {song.key}
                  </span>
                )}
                {song.bpm && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">
                    <Hash size={12} /> {song.bpm} BPM
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredSongs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nenhuma música encontrada no repertório.</p>
              <p className="text-xs text-slate-300 mt-1">As músicas aparecem aqui assim que você as insere em uma nova escala.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};