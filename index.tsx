
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by RootErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('louvor_members');
      localStorage.removeItem('louvor_songs');
      localStorage.removeItem('louvor_schedules');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black">
              ♪
            </div>
            <h1 className="text-xl font-black text-slate-100">Minist. de Louvor PIBJE</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              O aplicativo encontrou uma instabilidade temporária ao carregar a interface. Clique abaixo para reiniciar.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] bg-slate-950/60 p-3 rounded-xl text-red-300 font-mono text-left break-words overflow-auto max-h-24">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                Restaurar Cache e Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
