import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA from home screen, hide the button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Chromium / Android / Desktop flow */}
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-black text-white shadow-md transition-all cursor-pointer active:scale-95"
          title="Instalar na tela de início"
        >
          <Download size={15} />
          <span>Instalar App</span>
        </button>
      )}

      {/* iOS Safari flow (beforeinstallprompt is not supported by WebKit) */}
      {!isInstallable && isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-600/50 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          title="Como instalar no iPhone (Tela de Início)"
        >
          <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>Instalar no iPhone</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-7 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    Instalar no iPhone / iPad
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Atalho na Tela de Início
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                  <Share size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">1. Botão Compartilhar</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    No Safari do seu iPhone, toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima no rodapé).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                  <PlusSquare size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">2. Adicionar à Tela de Início</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Role as opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">3. Concluir</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                    Toque em <strong>"Adicionar"</strong> no topo direito. O ícone aparecerá no seu celular e abrirá em tela cheia como um aplicativo!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
