'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatTabProps {
  caseId: string;
  language?: string;
}

export function ChatTab({ caseId, language = 'English' }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Case Copilot. Ask me anything about this case—risks, extracted details, or anomalies.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts depending on language
  const suggestedPrompts = language === 'Azerbaijani' 
    ? [
        'Bu işin əsas riskləri hansılardır?',
        'Bütün işi maddələrlə ümumiləşdir.',
        'Hər hansı bir uyğunsuzluq və ya sənəd çatışmazlığı var?',
      ]
    : language === 'Turkish'
    ? [
        'Bu davanın ana riskleri nelerdir?',
        'Tüm davayı maddeler halinde özetle.',
        'Herhangi bir uyumsuzluk veya belge eksikliği var mı?',
      ]
    : [
        'What are the key risk vectors?',
        'Summarize this case in bullet points.',
        'Are there any data anomalies or omissions?',
      ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const activeMessages = [...messages, userMsg];

    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: activeMessages,
          lang: language,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response from Case Copilot.');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream available.');

      const decoder = new TextDecoder();
      let buffer = '';
      
      // Initialize empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          
          if (part.startsWith('data: ')) {
            const dataStr = part.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                setMessages(prev => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last && last.role === 'assistant') {
                    last.content += data.chunk;
                  }
                  return next;
                });
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (err) {
              console.error('Failed to parse chat token:', err);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Error communicating with assistant.';
      toast.error(errMsg);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Apologies, I encountered an internal cognitive error. Please check your AI API configurations.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col h-[600px] border border-border-subtle bg-bg-surface-2/65 backdrop-blur-md rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-surface-2/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/15 text-accent shadow-[0_0_12px_rgba(20,110,245,0.15)]">
            <Icon.Logo size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-primary">Case Copilot</h3>
            <p className="text-[10px] text-text-muted">RAG ground truth over uploaded extractions</p>
          </div>
        </div>
        <span className="text-[10px] font-mono border border-border-subtle/50 px-2 py-0.5 rounded bg-bg-surface text-text-muted flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Context
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 thin-scroll">
        {messages.map((m, idx) => (
          <div 
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.25s_ease-out]`}
          >
            <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-border-subtle text-xs font-bold ${
                m.role === 'user' ? 'bg-accent/10 text-accent' : 'bg-purple-500/10 text-purple-400'
              }`}>
                {m.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-accent text-white border border-accent/20 shadow-[0_3px_10px_rgba(20,110,245,0.12)]'
                  : 'bg-bg-surface border border-border-subtle text-text-primary selection:bg-purple-500/20'
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {loading && idx === messages.length - 1 && m.content === '' && (
                  <span className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      {messages.length === 1 && (
        <div className="px-5 py-3 border-t border-border-subtle bg-bg-surface/30">
          <span className="text-[9px] uppercase font-mono tracking-widest text-text-muted block mb-2">Suggested Inquiries</span>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-[11px] text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg border border-border-subtle hover:border-accent bg-bg-surface hover:bg-bg-surface-2 transition-all text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} className="p-4 border-t border-border-subtle bg-bg-surface-2/80 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Case Copilot anything..."
          disabled={loading}
          className="flex-1 bg-bg-surface px-4 py-2 text-xs rounded-lg border border-border-subtle focus:border-accent focus:outline-none placeholder-text-muted disabled:opacity-60 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn btn-primary px-4 py-2 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          {loading ? (
            <Icon.Loop size={14} className="animate-spin" />
          ) : (
            <Icon.Arrow size={14} />
          )}
        </button>
      </form>
    </div>
  );
}
