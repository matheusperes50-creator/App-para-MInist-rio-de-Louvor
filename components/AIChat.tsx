import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Copy, Bot, User, Check, RefreshCcw, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
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

    setErrorDetails(null);
    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use the API_KEY from process.env directly
      const apiKey = process.env.API_KEY;
      
      if (!apiKey || apiKey === '' || apiKey === 'undefined') {
        throw new Error("API_KEY_NOT_FOUND");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'Você é um assistente especializado para o Ministério de Louvor da igreja PIBJE. Sua função é sugerir músicas, ajudar em escalas, escrever devocionais práticos e dar conselhos ministeriais bíblicos. Seja breve, direto e encorajador. Use português do Brasil.',
        },
      });

      const streamResponse = await chat.sendMessageStream({ message: textToSend });

      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          assistantContent += text;
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = assistantContent;
            }
            return updated;
          });
        }
      }
    } catch (error: any) {
      console.error("Erro na comunicação com a IA:", error);
      
      let displayMessage = "O serviço de IA está temporariamente indisponível.";
      
      if (error.message === "API_KEY_NOT_FOUND") {
        displayMessage = "Configuração incompleta: API_KEY não encontrada no ambiente.";
      } else if (error.message?.includes("API key not valid")) {
        displayMessage = "A chave de API fornecida é inválida ou expirou.";
      }

      setErrorDetails(displayMessage);
      
      setMessages(prev => {
        const updated = [...prev];
        // Se já adicionamos um placeholder para o assistente, removemos ou atualizamos
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && updated[updated.length - 1].content === '') {
           updated[updated.length - 1].content = `⚠️ Erro: ${displayMessage}\n\nVerifique se a chave API foi configurada corretamente no seu ambiente.`;
           return updated;
        }
        return [...prev, { 
          role: 'assistant', 
          content: `⚠️ Erro: ${displayMessage}` 
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyConversation = () => {
    if (messages.length === 0) return;
    const conversationText = messages.map(m => `${m.role === 'user' ? 'Membro' : 'IA'}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(conversationText);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const suggestions = [
    "Dicas para melhorar o entrosamento do vocal",
    "Sugira 3 músicas para o tema Adoração",
    "Escreva um devocional para o ensaio de hoje",
    "Dicas de organização para o líder de louvor"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[500px] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
      <header className="bg-emerald-900 p-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl">
            <Sparkles size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-base uppercase leading-none tracking-tight">Assistente IA</h2>
            <p className="text-emerald-300 text-[9px] font-bold uppercase tracking-widest mt-1">Inteligência Ministerial</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyConversation} disabled={messages.length === 0} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-20" title="Copiar Conversa">
            {copying ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button onClick={() => setMessages([])} disabled={messages.length === 0} className="p-2.5 bg-white/10 hover:bg-red-500/20 text-white rounded-xl transition-all disabled:opacity-20" title="Limpar Chat">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30 scroll-smooth no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 animate-pulse">
              <Bot size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Olá! Como posso ajudar hoje?</h3>
              <p className="text-slate-400 text-xs font-medium">Estou pronto para auxiliar na gestão e espiritualidade da sua equipe.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full">
              {suggestions.map((s, idx) => (
                <button key={idx} onClick={() => handleSendMessage(s)} className="text-left px-4 py-3 bg-white border border-slate-100 hover:border-emerald-500 rounded-2xl text-[11px] font-bold text-slate-600 hover:text-emerald-700 transition-all shadow-sm flex items-center gap-3 group">
                  <RefreshCcw size={12} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-500" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-slate-200 text-emerald-600'}`}>
              {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
              m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {isLoading && idx === messages.length - 1 && !m.content && (
                <div className="flex gap-1 items-center py-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-50">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida ou pedido..."
            disabled={isLoading}
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-700 placeholder:text-slate-400 transition-all text-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white rounded-xl shadow-lg transition-all active:scale-95"
          >
            {isLoading ? <RefreshCcw className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
        <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest mt-4">
          Baseado em Gemini Flash • Respostas podem conter erros
        </p>
      </div>
    </div>
  );
};