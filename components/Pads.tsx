import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Music, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Plus, 
  Check, 
  X,
  Radio,
  FileAudio,
  Activity,
  Disc
} from 'lucide-react';
import { StoredPad, savePadToDb, getAllPadsFromDb, deletePadFromDb, clearAllPadsFromDb } from '../services/padsDb';

interface ActiveAudioItem {
  id: string;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  startTime: number;
}

export const Pads: React.FC = () => {
  const [pads, setPads] = useState<StoredPad[]>([]);
  const [activePadIds, setActivePadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [fadeDuration, setFadeDuration] = useState<number>(2.5); // seconds
  const [loopEnabled, setLoopEnabled] = useState<boolean>(true);
  const [playMode, setPlayMode] = useState<'solo' | 'multi'>('solo'); // Solo crossfades previous pad; Multi allows layers

  // Rename modal
  const [editingPad, setEditingPad] = useState<{ id: string; name: string } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Web Audio Context & AudioBuffers cache
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const activeSourcesRef = useRef<Map<string, ActiveAudioItem>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Load pads from IndexedDB on mount
  useEffect(() => {
    const loadPads = async () => {
      try {
        const stored = await getAllPadsFromDb();
        // Sort by creation time
        stored.sort((a, b) => a.createdAt - b.createdAt);
        setPads(stored);
      } catch (err) {
        console.warn('Erro ao carregar pads:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPads();

    return () => {
      // Stop all sounds on component unmount
      activeSourcesRef.current.forEach((item) => {
        try {
          if (item.sourceNode) {
            item.sourceNode.stop();
            item.sourceNode.disconnect();
          }
        } catch {}
      });
      activeSourcesRef.current.clear();
    };
  }, []);

  // Decode audio from persistent ArrayBuffer or Blob into Web Audio AudioBuffer
  const getOrDecodeAudioBuffer = async (pad: StoredPad): Promise<AudioBuffer | null> => {
    if (audioBuffersCacheRef.current.has(pad.id)) {
      return audioBuffersCacheRef.current.get(pad.id)!;
    }
    try {
      const ctx = getAudioContext();
      let arrayBuffer: ArrayBuffer | undefined = pad.arrayBuffer;

      if (!arrayBuffer && pad.blob) {
        arrayBuffer = await pad.blob.arrayBuffer();
      }

      if (!arrayBuffer) return null;

      // Slice arrayBuffer because decodeAudioData detaches the input buffer
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      audioBuffersCacheRef.current.set(pad.id, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn(`Erro ao decodificar áudio do pad ${pad.name}:`, err);
      return null;
    }
  };

  // Stop a specific pad with smooth fade-out
  const stopPad = useCallback((padId: string, immediate = false) => {
    const item = activeSourcesRef.current.get(padId);
    if (!item) return;

    const ctx = getAudioContext();
    const fadeOutTime = immediate ? 0.05 : fadeDuration;
    const now = ctx.currentTime;

    try {
      item.gainNode.gain.cancelScheduledValues(now);
      item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, now);
      item.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeOutTime);

      setTimeout(() => {
        try {
          if (item.sourceNode) {
            item.sourceNode.stop();
            item.sourceNode.disconnect();
          }
          item.gainNode.disconnect();
        } catch {}
        activeSourcesRef.current.delete(padId);
        setActivePadIds(prev => {
          const next = new Set(prev);
          next.delete(padId);
          return next;
        });
      }, fadeOutTime * 1000 + 50);
    } catch {
      activeSourcesRef.current.delete(padId);
      setActivePadIds(prev => {
        const next = new Set(prev);
        next.delete(padId);
        return next;
      });
    }
  }, [fadeDuration, getAudioContext]);

  // Stop all active pads
  const stopAllPads = useCallback((immediate = false) => {
    activeSourcesRef.current.forEach((_, id) => {
      stopPad(id, immediate);
    });
  }, [stopPad]);

  // Play a specific pad with smooth fade-in
  const playPad = async (pad: StoredPad) => {
    const ctx = getAudioContext();

    // If solo mode, crossfade out any currently active pads
    if (playMode === 'solo') {
      activeSourcesRef.current.forEach((_, id) => {
        if (id !== pad.id) {
          stopPad(id, false);
        }
      });
    }

    // If already playing this pad, clicking toggles it off with smooth fade
    if (activeSourcesRef.current.has(pad.id)) {
      stopPad(pad.id, false);
      return;
    }

    const buffer = await getOrDecodeAudioBuffer(pad);
    if (!buffer) {
      setFeedbackMsg({
        type: 'info',
        text: `Não foi possível reproduzir "${pad.name}". Verifique o formato do arquivo.`
      });
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loopEnabled;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const targetVolume = isMuted ? 0 : masterVolume;

    // Smooth Fade In
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.onended = () => {
      if (!source.loop) {
        activeSourcesRef.current.delete(pad.id);
        setActivePadIds(prev => {
          const next = new Set(prev);
          next.delete(pad.id);
          return next;
        });
      }
    };

    source.start(now);

    activeSourcesRef.current.set(pad.id, {
      id: pad.id,
      sourceNode: source,
      gainNode: gain,
      startTime: now
    });

    setActivePadIds(prev => new Set(prev).add(pad.id));
  };

  // Update master volume on playing nodes
  useEffect(() => {
    const ctx = getAudioContext();
    const effectiveVol = isMuted ? 0 : masterVolume;
    activeSourcesRef.current.forEach((item) => {
      try {
        item.gainNode.gain.cancelScheduledValues(ctx.currentTime);
        item.gainNode.gain.setValueAtTime(effectiveVol, ctx.currentTime);
      } catch {}
    });
  }, [masterVolume, isMuted, getAudioContext]);

  // Process uploaded files and generate exact quantity of pad buttons
  const processFiles = async (files: FileList | File[]) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma', '.aif', '.aiff', '.weba'];
    const addedPads: StoredPad[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();
      const hasAudioExtension = validExtensions.some(ext => lowerName.endsWith(ext));
      const hasAudioType = file.type ? file.type.startsWith('audio/') : false;

      // Accept if audio type or extension, or if name contains .mp3 or .wav
      if (hasAudioExtension || hasAudioType || lowerName.includes('.mp3') || lowerName.includes('.wav')) {
        let cleanName = file.name
          .replace(/\.[^/.]+$/, '') // remove extension
          .replace(/[-_]/g, ' ')
          .replace(/^\d+[\s.-]+/, '') // remove leading track numbers
          .trim();

        if (!cleanName) cleanName = `Pad ${pads.length + addedPads.length + 1}`;

        // Read raw ArrayBuffer to store binary permanently in IndexedDB
        const arrayBuffer = await file.arrayBuffer();

        const newPad: StoredPad = {
          id: `pad_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          name: cleanName,
          fileName: file.name,
          fileType: file.type || 'audio/mpeg',
          fileSize: file.size,
          arrayBuffer,
          blob: file,
          createdAt: Date.now() + i
        };

        await savePadToDb(newPad);
        addedPads.push(newPad);
      }
    }

    if (addedPads.length > 0) {
      setPads(prev => [...prev, ...addedPads]);
      setFeedbackMsg({
        type: 'success',
        text: `✓ ${addedPads.length} ${addedPads.length === 1 ? 'botão criado com sucesso para o arquivo inserido' : 'botões criados com sucesso para os arquivos inseridos'}!`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({
        type: 'info',
        text: 'Nenhum arquivo de áudio (.mp3 ou .wav) válido identificado. Selecione seus áudios novamente.'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Delete pad
  const handleDeletePad = async (e: React.MouseEvent, padId: string) => {
    e.stopPropagation();
    stopPad(padId, true);
    await deletePadFromDb(padId);
    audioBuffersCacheRef.current.delete(padId);
    setPads(prev => prev.filter(p => p.id !== padId));
  };

  // Clear all pads immediately from screen and persistent storage
  const handleClearAll = async () => {
    stopAllPads(true);
    setActivePadIds(new Set());
    audioBuffersCacheRef.current.clear();
    setPads([]);
    try {
      await clearAllPadsFromDb();
    } catch (err) {
      console.warn('Erro ao limpar pads:', err);
    }
    setFeedbackMsg({
      type: 'info',
      text: 'Todos os botões de pads foram apagados da tela com sucesso.'
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Save renamed pad
  const handleSaveRename = async () => {
    if (!editingPad || !editingPad.name.trim()) return;
    const target = pads.find(p => p.id === editingPad.id);
    if (target) {
      const updated: StoredPad = { ...target, name: editingPad.name.trim() };
      await savePadToDb(updated);
      setPads(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    setEditingPad(null);
  };

  // Generator: Create synthetic ambient worship pads (C, D, E, F, G, A, B)
  const handleLoadSynthesizedWorshipPads = async () => {
    const NOTES: Record<string, number> = {
      'C (Dó)': 130.81,
      'D (Ré)': 146.83,
      'E (Mi)': 164.81,
      'F (Fá)': 174.61,
      'G (Sol)': 196.00,
      'A (Lá)': 220.00,
      'B (Si)': 246.94
    };

    setIsLoading(true);
    const sampleRate = 44100;
    const duration = 12; // 12 seconds warm continuous loop
    const numSamples = sampleRate * duration;

    const newSynthPads: StoredPad[] = [];

    for (const [keyName, rootFreq] of Object.entries(NOTES)) {
      // Synthesize ambient lush chord (Root + 5th + Octave with subtle chorus)
      const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

      // Frequencies for Root, 5th, Octave
      const freqs = [rootFreq, rootFreq * 1.5, rootFreq * 2, rootFreq * 0.5];

      freqs.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, 0);

        // Gentle tremolo
        gain.gain.setValueAtTime(0.25 / freqs.length, 0);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start();
        osc.stop(duration);
      });

      const renderedBuffer = await offlineCtx.startRendering();

      // Convert rendered buffer to WAV Blob
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      const synthPad: StoredPad = {
        id: `synth_${keyName.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`,
        name: `Pad Worship ${keyName}`,
        fileName: `Pad_${keyName}.wav`,
        fileType: 'audio/wav',
        fileSize: wavBlob.size,
        blob: wavBlob,
        createdAt: Date.now() + Object.keys(NOTES).indexOf(keyName)
      };

      await savePadToDb(synthPad);
      newSynthPads.push(synthPad);
    }

    setPads(prev => [...prev, ...newSynthPads]);
    setIsLoading(false);
    setFeedbackMsg({
      type: 'success',
      text: '✓ 7 Pads de Louvor Essenciais (C a B) gerados e prontos para uso!'
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Convert AudioBuffer to standard WAV Blob
  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const length = buffer.length * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Interleave channels
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Disc size={24} />
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pads de Ambiência</h2>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Arraste ou envie arquivos MP3 e WAV do seu dispositivo. O app separa em botões e inicia a reprodução ao toque.
          </p>
        </div>

        {/* Global Action Bar: Stop All, Loop & Volume */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {activePadIds.size > 0 && (
            <button
              onClick={() => stopAllPads(false)}
              className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Square size={16} className="fill-white" />
              <span>PARAR PADS ({activePadIds.size})</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>ADICIONAR ÁUDIOS</span>
          </button>
        </div>
      </header>

      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Control Console (Fade, Mode, Loop, Master Volume) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transição:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setPlayMode('solo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  playMode === 'solo'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Crossfade suave: tocar um pad transiciona suavemente o anterior"
              >
                Solo (Crossfade)
              </button>
              <button
                onClick={() => setPlayMode('multi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  playMode === 'multi'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Multi-Pad: permite tocar vários pads ou camadas juntos"
              >
                Multi-Camadas
              </button>
            </div>
          </div>

          {/* Loop toggle */}
          <button
            onClick={() => setLoopEnabled(!loopEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center gap-1.5 ${
              loopEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            <RefreshCw size={12} className={loopEnabled ? 'animate-spin' : ''} />
            <span>Loop Infinito: {loopEnabled ? 'LIGADO' : 'DESLIGADO'}</span>
          </button>

          {/* Fade duration slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fade:</span>
            <select
              value={fadeDuration}
              onChange={(e) => setFadeDuration(parseFloat(e.target.value))}
              className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border-none outline-none cursor-pointer"
            >
              <option value="1">1.0s (Rápido)</option>
              <option value="2.5">2.5s (Padrão)</option>
              <option value="4">4.0s (Suave)</option>
              <option value="6">6.0s (Longo)</option>
            </select>
          </div>
        </div>

        {/* Master Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
            title={isMuted ? 'Desmutar' : 'Mutar volume'}
          >
            {isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={(e) => {
              setMasterVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-24 md:w-32 accent-emerald-500 cursor-pointer"
            title={`Volume Master: ${Math.round(masterVolume * 100)}%`}
          />
          <span className="text-xs font-mono font-bold text-slate-400 w-8 text-right">
            {isMuted ? '0%' : `${Math.round(masterVolume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
            : 'bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
        }`}>
          {feedbackMsg.type === 'success' ? <Check size={16} className="text-emerald-500" /> : <Sparkles size={16} className="text-blue-500" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 md:p-10 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01] shadow-2xl'
            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-md">
          <Upload size={28} className={isDragging ? 'animate-bounce' : ''} />
        </div>
        <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
          Arraste e solte seus arquivos de áudio (.mp3 ou .wav) aqui
        </h3>
        <p className="text-xs text-slate-400 font-medium max-w-md mt-1">
          Ou toque aqui para selecionar do celular ou computador. Seus arquivos serão automaticamente separados em botões prontos para tocar.
        </p>
      </div>

      {/* Separated Pad Buttons Grid - Exactly 1 button per inserted pad */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Botões de Pads ({pads.length})
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <Check size={13} className="text-emerald-500" />
              <span>{pads.length === 0 ? 'Nenhum botão gerado ainda' : `${pads.length} ${pads.length === 1 ? 'botão gerado para 1 arquivo' : 'botões gerados para os ' + pads.length + ' arquivos inseridos'}`}</span>
            </span>
          </div>

          {pads.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs"
              >
                <Plus size={14} /> Inserir Mais Pads
              </button>
              <button
                onClick={handleClearAll}
                className="text-[11px] font-black uppercase text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-800 flex items-center gap-1.5"
                title="Apagar todos os botões de pads da tela"
              >
                <Trash2 size={13} />
                Limpar Tudo
              </button>
            </div>
          )}
        </div>

        {/* If no pads loaded, show prompt & synthesized pads quick starter */}
        {pads.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <FileAudio size={32} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white">Nenhum botão criado ainda</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-medium">
                Arraste ou envie seus arquivos MP3 ou WAV. O aplicativo criará exatamente a quantidade de botões correspondente ao número de áudios que você inserir.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <Upload size={16} />
                <span>Inserir Arquivos MP3 / WAV</span>
              </button>
              <button
                onClick={handleLoadSynthesizedWorshipPads}
                className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Sparkles size={15} className="text-emerald-500" />
                <span>Gerar 7 Botões de Louvor (C a B)</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Buttons Grid - 1:1 with inserted pads */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {pads.map((pad, index) => {
            const isPlaying = activePadIds.has(pad.id);

            return (
              <div
                key={pad.id}
                onClick={() => playPad(pad)}
                className={`group relative p-5 md:p-6 rounded-3xl border-2 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between min-h-[155px] active:scale-95 ${
                  isPlaying
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-600/35 ring-4 ring-emerald-500/30 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 text-slate-800 dark:text-white shadow-sm hover:shadow-md'
                }`}
              >
                {/* Top: Button Number Badge & Actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-lg ${
                      isPlaying 
                        ? 'bg-white/25 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${
                      isPlaying 
                        ? 'bg-white/20 text-white animate-pulse' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500'
                    }`}>
                      {isPlaying ? <Play size={12} className="fill-white" /> : <Disc size={14} />}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPad({ id: pad.id, name: pad.name });
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isPlaying ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600'
                      }`}
                      title="Renomear Pad"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeletePad(e, pad.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isPlaying ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500'
                      }`}
                      title="Excluir Pad"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Center / Bottom: Title and Status */}
                <div className="mt-2">
                  <p className={`font-black text-sm md:text-base leading-tight uppercase tracking-tight line-clamp-2 ${
                    isPlaying ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}>
                    {pad.name}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/15 dark:border-slate-800/60">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      isPlaying ? 'text-emerald-200' : 'text-slate-400'
                    }`}>
                      {isPlaying ? 'TOCANDO' : 'TOCAR PAD'}
                    </span>
                    {isPlaying && (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-white rounded-full animate-bounce"></span>
                        <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></span>
                        <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Slot Card to add more pads into the grid */}
          {pads.length > 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 md:p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[155px] text-center group active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 flex items-center justify-center mb-2 transition-colors">
                <Plus size={20} />
              </div>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                + Novo Botão
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                Inserir áudio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rename Pad Modal */}
      {editingPad && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              Renomear Pad
            </h3>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Defina o nome do botão (ex: "Tom G", "Pad Céu", "Ambiência Oração").
            </p>

            <input
              type="text"
              autoFocus
              value={editingPad.name}
              onChange={(e) => setEditingPad({ ...editingPad, name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 mb-4"
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveRename}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                SALVAR NOME
              </button>
              <button
                onClick={() => setEditingPad(null)}
                className="w-full py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
