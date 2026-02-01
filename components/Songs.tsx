import React, { useState } from 'react';
import { Song } from '../types';
import { Music, Search, Trash2, Hash, Sparkles, Loader2, Plus, Globe, Library } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface SongsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Songs: React.FC<SongsProps> = ({ songs, setSongs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<Partial<Song>[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchSongsOnline = async () => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    setIsSearchingOnline(true);
    setHasSearched(true);
    setOnlineResults([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Encontre músicas de louvor cristãs (nacionais ou internacionais) que correspondam a: "${searchTerm}". Retorne uma lista de até 6 músicas com título, artista, tom sugerido (key) e bpm aproximado.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                key: { type: Type.STRING },
                bpm: { type: Type.NUMBER }
              },
              required: ["title", "artist"]
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        setOnlineResults(data);
      }
    } catch (error) {
      console.error("Erro na busca global:", error);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const includeSong = (sug: Partial<Song>) => {
    const newSong: Song = {
      id: generateShortId(),
      title: sug.title || 'Sem título',
      artist: sug.artist || 'Artista desconhecido',
      key: sug.key,
      bpm: sug.bpm,
    };

    setSongs(prev => [newSong, ...prev]);
    // Limpar resultados após incluir para focar no repertório
    setOnlineResults([]);
    setHasSearched(false);
    setSearchTerm('');
  };

  const removeSong = (id: string) => {
    if (confirm('Excluir música do seu repertório local?')) {
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const localFilteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Repertório</h2>
        <p className="text-slate-500">Pesquise e inclua músicas diretamente da internet.</p>
      </header>

      {/* Barra de Busca Estilo Holyrics */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Digite o nome da música ou artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchSongsOnline()}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-lg"
          />
        </div>
        <button 
          onClick={searchSongsOnline}
          disabled={isSearchingOnline || searchTerm.length < 2}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 min-w-[200px]"
        >
          {isSearchingOnline ? <Loader2 size={20} className="animate-spin" /> : <Globe size={20} />}
          Buscar Online
        </button>
      </div>

      {/* Resultados da Internet */}
      {hasSearched && (onlineResults.length > 0 || isSearchingOnline) && (
        <section className="bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-6 text-emerald-800">
            <Sparkles size={20} />
            <h3 className="font-black uppercase tracking-widest text-sm">Resultados na Internet</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSearchingOnline ? (
              // Skeleton Loading
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white/50 h-24 rounded-2xl animate-pulse border border-emerald-50"></div>
              ))
            ) : (
              onlineResults.map((res, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-emerald-100 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <Music size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">{res.title}</h4>
                      <p className="text-xs text-slate-500">{res.artist}</p>
                      <div className="flex gap-2 mt-1">
                        {res.key && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{res.key}</span>}
                        {res.bpm && <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">{res.bpm} BPM</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => includeSong(res)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <Plus size={14} /> Incluir
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Repertório Local */}
      <section>
        <div className="flex items-center gap-2 mb-6 text-slate-400">
          <Library size={20} />
          <h3 className="font-black uppercase tracking-widest text-sm">Meu Repertório Local</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localFilteredSongs.map((song) => (
            <div key={song.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-emerald-50 p-4 rounded-[1.25rem] text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Music size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono text-[10px] text-slate-300 font-bold">{song.id}</span>
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
              <div className="mt-6 flex flex-wrap gap-2">
                {song.key && (
                  <span className="text-[10px] uppercase font-black bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                    TOM: {song.key}
                  </span>
                )}
                {song.bpm && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Hash size={12} /> {song.bpm} BPM
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {localFilteredSongs.length === 0 && !isSearchingOnline && (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">Nenhuma música no seu repertório local.</p>
              <p className="text-xs text-slate-300 mt-1">Use a busca acima para encontrar e incluir músicas.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};