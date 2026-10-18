import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '../types';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Music, 
  Clock, 
  RotateCcw, 
  Plus, 
  Minus, 
  Headphones, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Disc,
  Activity,
  Sliders
} from 'lucide-react';
import { getYoutubeThumbnail } from './Songs';

interface StudioProps {
  songs?: Song[];
}

type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4';
type ClickSoundType = 'digital' | 'woodblock' | 'beep';

export const Studio: React.FC<StudioProps> = ({ songs = [] }) => {
  // Metronome state
  const [bpm, setBpm] = useState<number>(72);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [soundType, setSoundType] = useState<ClickSoundType>('woodblock');

  // Tap tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapFeedback, setTapFeedback] = useState<string>('Toque no ritmo');
  const [isTapActive, setIsTapActive] = useState<boolean>(false);
  const lastTapTimeoutRef = useRef<any>(null);

  // Selected song for rehearsal
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [songSearch, setSongSearch] = useState<string>('');

  // Rehearsal timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Reference Pitch / Tuner
  const [pitchKey, setPitchKey] = useState<string>('A (440Hz)');
  const [isPitchPlaying, setIsPitchPlaying] = useState<boolean>(false);
  const pitchOscillatorRef = useRef<OscillatorNode | null>(null);
  const pitchGainRef = useRef<GainNode | null>(null);

  // Audio Context and scheduling references
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(bpm);
  const timeSignatureRef = useRef<TimeSignature>(timeSignature);
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);
  const soundTypeRef = useRef<ClickSoundType>(soundType);
  const timerIntervalRef = useRef<any>(null);

  // Keep refs in sync with state for real-time audio thread
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    timeSignatureRef.current = timeSignature;
  }, [timeSignature]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    soundTypeRef.current = soundType;
  }, [soundType]);

  // Determine beats per measure
  const getBeatsPerMeasure = useCallback((sig: TimeSignature): number => {
    switch (sig) {
      case '3/4': return 3;
      case '6/8': return 6;
      case '2/4': return 2;
      case '4/4':
      default: return 4;
    }
  }, []);

  // Initialize or resume AudioContext
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

  // Play a single click sound at specific time
  const playClickSound = useCallback((time: number, isAccent: boolean) => {
    if (isMutedRef.current) return;
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const type = soundTypeRef.current;
    const masterVol = volumeRef.current;

    if (type === 'woodblock') {
      // Warm percussive woodblock
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
      osc.frequency.exponentialRampToValueAtTime(isAccent ? 600 : 400, time + 0.04);

      gain.gain.setValueAtTime(masterVol * (isAccent ? 1 : 0.65), time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

      osc.start(time);
      osc.stop(time + 0.05);
    } else if (type === 'beep') {
      // High electronic beep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1760 : 880, time); // A6 and A5

      gain.gain.setValueAtTime(masterVol * (isAccent ? 0.9 : 0.6), time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      osc.start(time);
      osc.stop(time + 0.065);
    } else {
      // Digital sharp click
      osc.type = 'square';
      osc.frequency.setValueAtTime(isAccent ? 1400 : 900, time);

      gain.gain.setValueAtTime(masterVol * (isAccent ? 0.8 : 0.5), time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      osc.start(time);
      osc.stop(time + 0.035);
    }
  }, [getAudioContext]);

  // Precision lookahead metronome scheduler
  const scheduleLoop = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ctx = getAudioContext();
    const beatsPerMeasure = getBeatsPerMeasure(timeSignatureRef.current);
    const secondsPerBeat = 60.0 / bpmRef.current;

    // Schedule any notes falling into the 100ms lookahead window
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const beat = currentBeatRef.current;
      const isAccent = beat === 0;

      playClickSound(nextNoteTimeRef.current, isAccent);

      // Schedule visual update in UI close to audio time
      const delayMs = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
      setTimeout(() => {
        if (isPlayingRef.current) {
          setCurrentBeat(beat);
        }
      }, delayMs);

      // Advance
      nextNoteTimeRef.current += secondsPerBeat;
      currentBeatRef.current = (beat + 1) % beatsPerMeasure;
    }

    timerIntervalRef.current = setTimeout(scheduleLoop, 25);
  }, [getAudioContext, getBeatsPerMeasure, playClickSound]);

  // Start metronome
  const startMetronome = useCallback(() => {
    const ctx = getAudioContext();
    isPlayingRef.current = true;
    setIsPlaying(true);
    currentBeatRef.current = 0;
    setCurrentBeat(0);
    nextNoteTimeRef.current = ctx.currentTime + 0.05;

    scheduleLoop();
  }, [getAudioContext, scheduleLoop]);

  // Stop metronome
  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timerIntervalRef.current) {
      clearTimeout(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCurrentBeat(0);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timerIntervalRef.current) {
        clearTimeout(timerIntervalRef.current);
      }
      if (pitchOscillatorRef.current) {
        try {
          pitchOscillatorRef.current.stop();
          pitchOscillatorRef.current.disconnect();
        } catch {}
      }
    };
  }, []);

  // Tap Tempo calculation
  const handleTap = () => {
    const now = performance.now();
    setIsTapActive(true);
    setTimeout(() => setIsTapActive(false), 120);

    // If last tap was more than 2.5s ago, start fresh
    let newTaps = [...tapTimes, now];
    if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2500) {
      newTaps = [now];
    }

    // Keep up to 6 recent taps for smooth rolling average
    if (newTaps.length > 6) {
      newTaps = newTaps.slice(newTaps.length - 6);
    }
    setTapTimes(newTaps);

    if (newTaps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);

      if (calculatedBpm >= 30 && calculatedBpm <= 260) {
        setBpm(calculatedBpm);
        setTapFeedback(`${calculatedBpm} BPM (${newTaps.length} toques)`);
      }
    } else {
      setTapFeedback('Continue tocando no tempo...');
    }

    if (lastTapTimeoutRef.current) clearTimeout(lastTapTimeoutRef.current);
    lastTapTimeoutRef.current = setTimeout(() => {
      setTapTimes([]);
      setTapFeedback('Toque no ritmo');
    }, 2800);
  };

  // BPM adjustments
  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(260, Math.max(30, prev + delta)));
  };

  const handleBpmInputChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      setBpm(Math.min(280, Math.max(20, val)));
    } else if (valStr === '') {
      setBpm(0);
    }
  };

  // Rehearsal Stopwatch Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reference Pitch Generator (A440 etc.)
  const PITCH_FREQUENCIES: Record<string, number> = {
    'C (Dó)': 261.63,
    'D (Ré)': 293.66,
    'E (Mi)': 329.63,
    'F (Fá)': 349.23,
    'G (Sol)': 392.00,
    'A (440Hz)': 440.00,
    'B (Si)': 493.88
  };

  const togglePitchTone = () => {
    const ctx = getAudioContext();
    if (isPitchPlaying) {
      if (pitchOscillatorRef.current) {
        try {
          pitchOscillatorRef.current.stop();
          pitchOscillatorRef.current.disconnect();
        } catch {}
        pitchOscillatorRef.current = null;
      }
      setIsPitchPlaying(false);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(PITCH_FREQUENCIES[pitchKey] || 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      pitchOscillatorRef.current = osc;
      pitchGainRef.current = gain;
      setIsPitchPlaying(true);
    }
  };

  // Quick song loader
  const selectedSong = songs.find(s => s.id === selectedSongId);
  const handleSelectSong = (song: Song) => {
    setSelectedSongId(song.id);
    if (song.bpm) {
      setBpm(song.bpm);
    }
  };

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

  // Filter songs for rehearsal quick picker
  const filteredSongs = (songs || []).filter(s => {
    if (!songSearch.trim()) return true;
    const term = songSearch.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.artist.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Headphones size={24} />
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Estúdio & Click</h2>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Metrônomo com áudio de alta precisão, tap tempo e treinamento para ensaios ministeriais.
          </p>
        </div>

        {/* Rehearsal Session Timer Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm">
          <Clock size={16} className="text-emerald-500" />
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Tempo de Ensaio</p>
            <p className="text-sm font-black font-mono text-slate-800 dark:text-white">{formatTimer(timerSeconds)}</p>
          </div>
          <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isTimerRunning ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
            >
              {isTimerRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Zerar Cronômetro"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Metronome & Click Engine Column */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden transition-colors">
          {/* Top Bar: Time Signature, Sound Style & Volume */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            {/* Time Signature */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compasso:</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['4/4', '3/4', '6/8', '2/4'] as TimeSignature[]).map((sig) => (
                  <button
                    key={sig}
                    onClick={() => {
                      setTimeSignature(sig);
                      if (isPlaying) {
                        currentBeatRef.current = 0;
                        setCurrentBeat(0);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      timeSignature === sig
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sig}
                  </button>
                ))}
              </div>
            </div>

            {/* Click Sound Type */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timbre:</span>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as ClickSoundType)}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer"
              >
                <option value="woodblock">Bloco de Madeira (Clássico)</option>
                <option value="digital">Click Digital (Seco)</option>
                <option value="beep">Beep Eletrônico</option>
              </select>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                title={isMuted ? 'Desmutar' : 'Mutar som'}
              >
                {isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-20 accent-emerald-500 cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>
          </div>

          {/* Centerpiece: Big Dynamic BPM Display and Beat Lights */}
          <div className="flex flex-col items-center justify-center my-4 py-4 relative">
            {/* Beat lights bar */}
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-6">
              {Array.from({ length: beatsPerMeasure }).map((_, index) => {
                const isActive = isPlaying && currentBeat === index;
                const isAccentBeat = index === 0;

                return (
                  <div
                    key={index}
                    className={`flex flex-col items-center gap-1 transition-all duration-75`}
                  >
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl transition-all duration-75 shadow-md ${
                        isActive
                          ? isAccentBeat
                            ? 'bg-amber-400 text-slate-950 scale-110 shadow-amber-400/50 ring-4 ring-amber-300/40'
                            : 'bg-emerald-500 text-white scale-105 shadow-emerald-500/40 ring-4 ring-emerald-400/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {isAccentBeat ? 'Forte' : 'Fraco'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Big Digitável BPM Input with Decrement / Increment */}
            <div className="flex items-center justify-center gap-3 md:gap-5 my-2">
              <button
                onClick={() => adjustBpm(-5)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="-5 BPM"
              >
                -5
              </button>
              <button
                onClick={() => adjustBpm(-1)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="-1 BPM"
              >
                <Minus size={18} />
              </button>

              {/* Digitável input */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={bpm === 0 ? '' : bpm}
                    onChange={(e) => handleBpmInputChange(e.target.value)}
                    className="w-36 md:w-44 text-5xl md:text-7xl font-black text-center text-slate-900 dark:text-white bg-transparent outline-none focus:text-emerald-600 dark:focus:text-emerald-400 transition-colors tracking-tight font-mono"
                  />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 -mt-1">
                  BPM (Batidas por Minuto)
                </span>
              </div>

              <button
                onClick={() => adjustBpm(1)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="+1 BPM"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => adjustBpm(5)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="+5 BPM"
              >
                +5
              </button>
            </div>

            {/* Slider bar for quick tempo changes */}
            <div className="w-full max-w-md px-4 mt-3">
              <input
                type="range"
                min="30"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mt-1">
                <span>30 Lento</span>
                <span>72 Worship</span>
                <span>120 Médio</span>
                <span>240 Rápido</span>
              </div>
            </div>
          </div>

          {/* Quick Praise Tempo Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 my-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Presets:</span>
            {[
              { label: 'Adoração Lenta (68)', val: 68 },
              { label: 'Worship Médio (74)', val: 74 },
              { label: 'Jubiloso (118)', val: 118 },
              { label: 'Celebração (132)', val: 132 },
            ].map(preset => (
              <button
                key={preset.val}
                onClick={() => setBpm(preset.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  bpm === preset.val
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Bottom Primary Controls: Large PLAY/STOP & TAP TEMPO Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Play/Stop Button */}
            <button
              onClick={togglePlay}
              className={`py-5 px-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 ring-4 ring-red-400/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square size={20} className="fill-white" />
                  <span>PARAR CLICK</span>
                </>
              ) : (
                <>
                  <Play size={20} className="fill-white" />
                  <span>INICIAR CLICK</span>
                </>
              )}
            </button>

            {/* Tap Tempo Button (Acionado ao Toque) */}
            <button
              onClick={handleTap}
              className={`py-5 px-6 rounded-3xl font-black text-sm uppercase tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer border-2 select-none active:scale-95 ${
                isTapActive
                  ? 'bg-amber-400 border-amber-500 text-slate-950 scale-95 shadow-lg shadow-amber-400/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
              }`}
            >
              <span className="flex items-center gap-2 text-base font-black">
                <Activity size={18} className={isTapActive ? 'animate-bounce' : ''} />
                TAP TEMPO
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-normal mt-0.5">
                {tapFeedback}
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Rehearsal Companion & Tools */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Song Selector from Ministry Repertoire */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Music size={18} className="text-emerald-500" /> Carregar do Repertório
              </h3>
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {songs.length} Músicas
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Selecione uma canção para ajustar automaticamente o BPM e acompanhar a tonalidade base durante o ensaio.
            </p>

            {/* Search song */}
            <input
              type="text"
              placeholder="Buscar música ou artista..."
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
            />

            {/* List of songs */}
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredSongs.length > 0 ? (
                filteredSongs.slice(0, 20).map((song) => {
                  const isSelected = selectedSongId === song.id;
                  return (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="overflow-hidden flex-1">
                        <p className="font-black text-xs truncate">{song.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {song.key && (
                          <span className="text-[9px] font-black uppercase bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                            Tom: {song.key}
                          </span>
                        )}
                        {song.bpm ? (
                          <span className="text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                            {song.bpm} BPM
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">sem bpm</span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-center py-6 text-xs text-slate-400 font-bold italic">Nenhuma música encontrada.</p>
              )}
            </div>

            {/* Active song card banner */}
            {selectedSong && (
              <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg space-y-2 animate-in fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Em Ensaio</span>
                    <h4 className="font-black text-base leading-tight">{selectedSong.title}</h4>
                    <p className="text-xs text-emerald-100 font-medium">{selectedSong.artist}</p>
                  </div>
                  {selectedSong.key && (
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-emerald-200">Tom Base</span>
                      <p className="text-xl font-black">{selectedSong.key}</p>
                    </div>
                  )}
                </div>

                {selectedSong.youtubeUrl && (
                  <a
                    href={selectedSong.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors mt-1"
                  >
                    <ExternalLink size={12} /> Abrir vídeo de referência no YouTube
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Reference Tone / Pitch Pipe (Tom de Referência para Vozes e Instrumentos) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Radio size={18} className="text-emerald-500" /> Tom de Referência
              </h3>
              <span className="text-[9px] font-black uppercase text-slate-400">Afinação & Voz</span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Emita um tom contínuo para conferir afinação ou passar a nota inicial aos cantores.
            </p>

            <div className="flex items-center gap-3">
              <select
                value={pitchKey}
                onChange={(e) => {
                  setPitchKey(e.target.value);
                  if (isPitchPlaying && pitchOscillatorRef.current) {
                    const ctx = getAudioContext();
                    pitchOscillatorRef.current.frequency.setValueAtTime(PITCH_FREQUENCIES[e.target.value] || 440, ctx.currentTime);
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-white px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
              >
                {Object.keys(PITCH_FREQUENCIES).map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>

              <button
                onClick={togglePitchTone}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
                  isPitchPlaying
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
              >
                {isPitchPlaying ? 'Silenciar' : 'Tocar Tom'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
