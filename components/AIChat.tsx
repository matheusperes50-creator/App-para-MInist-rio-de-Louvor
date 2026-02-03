import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Copy, Bot, User, Check, RefreshCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Inicializa o cliente GenAI logo antes da chamada para garantir o uso da chave atualizada
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Cria a instância de chat conforme as diretrizes para multi-turn
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'Você é um assistente especializado para um Ministério de Louvor cristão. Ajude com sugestões de músicas, planejamento de setlists, escrita de devocionais para a equipe e conselhos ministeriais. Seja encorajador, bíblico e prático. Use português brasileiro.',
          thinkingConfig: { thinkingBudget: 0 } // Desabilita thinking para menor latência em chat simples
        },
        // Opcional: injetar histórico se necessário, mas para streaming direto usamos a mensagem atual
      });

      // Se for a primeira mensagem, o histórico está vazio. Se não, idealmente passaríamos o histórico.
      // Para simplificar e seguir o padrão de sendMessageStream:
      const streamResponse = await chat.sendMessageStream({ message: textToSend });

      let assistantContent = '';
      // Adiciona a bolha de resposta vazia que será preenchida pelo stream
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          assistantContent += text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantContent;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Erro na IA:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, tive um problema ao processar sua solicitação no servidor. Verifique se a API_KEY está configurada corretamente no Vercel.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyConversation = () => {
    if (messages.length === 0) return;
    const conversationText = messages.map(m => `${m.role === 'user' ? 'VOCÊ' : 'IA'}: ${m.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(conversationText);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const clearChat = () => {
    if (confirm('Deseja limpar toda a conversa atual?')) {
      setMessages([]);
    }
  };

  const suggestions = [
    "Sugira 4 músicas para o tema Gratidão",
    "Escreva um devocional curto para o ensaio",
    "Dicas para melhorar o entrosamento do vocal",
    "Como montar um setlist equilibrado?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="bg-emerald-900 p-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2.5 rounded-xl">
            <Sparkles size={24} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-tight uppercase leading-none">Assistente IA</h2>
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mt-1">Ministério & Repertório</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyConversation}
            disabled={messages.length === 0}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-20"
            title="Copiar Conversa"
          >
            {copying ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button 
            onClick={clearChat}
            disabled={messages.length === 0}
            className="p-2.5 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-200 rounded-xl transition-all disabled:opacity-20"
            title="Limpar Chat"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-8 py-10">
            <div className="relative">
              <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 animate-pulse">
                <Bot size={48} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 text-emerald-400 animate-bounce" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Como posso ajudar hoje?</h3>
              <p className="text-slate-500 text-sm font-medium">Estou pronto para sugerir músicas, escrever textos e auxiliar na gestão do seu ministério.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="text-left px-5 py-3 bg-white border border-slate-100 hover:border-emerald-500 rounded-2xl text-xs font-bold text-slate-600 hover:text-emerald-700 transition-all shadow-sm flex items-center gap-3 group"
                >
                  <RefreshCcw size={14} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-4 animate-in ${m.role === 'user' ? 'flex-row-reverse slide-in-from-right-4' : 'slide-in-from-left-4'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${m.role === 'user' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-slate-100 text-emerald-600'}`}>
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[80%] p-5 rounded-[1.8rem] shadow-sm text-sm font-medium leading-relaxed ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{m.content || (isLoading && idx === messages.length - 1 ? 'Digitando...' : '')}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-50">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="relative flex items-center"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo ao assistente..."
            disabled={isLoading}
            className="w-full pl-6 pr-16 py-5 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-[2rem] outline-none font-bold text-slate-700 placeholder:text-slate-400 transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-20 text-white rounded-[1.6rem] shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
          >
            {isLoading ? <RefreshCcw className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4">
          IA pode cometer erros. Revise as sugestões antes de aplicar no ministério.
        </p>
      </div>
    </div>
  );
};