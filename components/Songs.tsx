
import React, { useState } from 'react';
import { Song } from '../types';
import { Music, Plus, Search, Trash2, Hash } from 'lucide-react';

interface SongsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

export const Songs: React.FC<SongsProps> = ({ songs, setSongs }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');

  const addSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist) return;

    const newSong: Song = {
      id: crypto.randomUUID(),
      title,
      artist,
      key: key || undefined,
      bpm: bpm ? parseInt(bpm) : undefined,
    };

    setSongs(prev => [...prev, newSong]);
    setTitle('');
    setArtist('');
    setKey('');
    setBpm('');
    setIsAdding(false);
  };

  const removeSong = (id: string) => {
    if (confirm('Excluir música do repertório?')) {
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Repertório</h2>
          <p className="text-slate-500">Músicas prontas para as escalas de louvor.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus size={18} />
          {isAdding ? 'Fechar' : 'Nova Música'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={addSong} className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-200">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Título da Música</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="Ex: Hosana"
              required
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Artista / Ministério</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="Ex: Hillsong United"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Tom</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="Ex: G#m"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">BPM (Ritmo)</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="Ex: 72"
            />
          </div>
          <div className="col-span-full mt-2 flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
            <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-indigo-700 shadow-md">Salvar</button>
          </div>
        </form>
      )}

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Buscar no repertório..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSongs.map((song) => (
          <div key={song.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-indigo-50 p-4 rounded-[1.25rem] text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Music size={24} />
              </div>
              <div className="flex gap-2">
                {song.key && (
                  <span className="text-[10px] uppercase font-black bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl">
                    {song.key}
                  </span>
                )}
                <button 
                  onClick={() => removeSong(song.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-xl line-clamp-1">{song.title}</h4>
              <p className="text-slate-500 font-medium">{song.artist}</p>
            </div>
            {song.bpm && (
              <div className="mt-6 flex items-center gap-1.5 text-slate-400 text-xs font-black uppercase tracking-widest bg-slate-50 w-fit px-3 py-1 rounded-lg">
                <Hash size={12} /> {song.bpm} BPM
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
