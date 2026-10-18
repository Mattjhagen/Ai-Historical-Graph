import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  CheckCircle2,
  HelpCircle,
  Minimize2,
  Maximize2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, AIActionResponse, DatasetSummary, RngConfig } from '../types';
import { parseLocalNLPCommand } from '../utils/dataProcessor';

interface AIAssistantProps {
  currentDatasetSummary: DatasetSummary | null;
  currentRngConfig: RngConfig;
  onExecuteAction: (action: NonNullable<AIActionResponse['action']>) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const QUICK_PROMPTS = [
  'Show me only the last 30 days',
  'Give me 50 random integers between 10 and 100',
  'Highlight peak and show 7-day MA',
  'Generate 20 floats between 0 and 1 with 3 decimals',
  'Reset zoom to full history',
  'Switch to Bar Chart',
];

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentDatasetSummary,
  currentRngConfig,
  onExecuteAction,
  isOpen,
  onToggleOpen,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Welcome! I'm your AI Copilot. Ask me in plain English to control the graph or generate random numbers (e.g., *'Show me only the last 30 days'* or *'Give me 50 random integers between 10 and 100'*).",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      // Send to server-side Gemini API route
      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          currentDatasetSummary,
          currentRngConfig,
        }),
      });

      let data: AIActionResponse;

      if (res.ok) {
        data = await res.json();
        // If server indicated fallback, or if response didn't include action
        if (data.action?.type === 'NONE' || (data as any).fallback) {
          const localFallback = parseLocalNLPCommand(
            textToSend,
            currentDatasetSummary?.numericColumns || []
          );
          if (localFallback.action.type !== 'NONE') {
            data = localFallback;
          }
        }
      } else {
        // Fallback to local intelligent rule engine
        data = parseLocalNLPCommand(
          textToSend,
          currentDatasetSummary?.numericColumns || []
        );
      }

      // Execute action if present
      let actionLabel = '';
      if (data.action && data.action.type !== 'NONE') {
        onExecuteAction(data.action);
        actionLabel = `Action applied: ${data.action.type.replace(/_/g, ' ')}`;
      }

      const assistantMessage: ChatMessage = {
        id: 'reply-' + Date.now(),
        sender: 'assistant',
        text: data.reply || "Done! I've updated the settings accordingly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: actionLabel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      // Local fallback on network error
      const localFallback = parseLocalNLPCommand(
        textToSend,
        currentDatasetSummary?.numericColumns || []
      );
      if (localFallback.action.type !== 'NONE') {
        onExecuteAction(localFallback.action);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'reply-' + Date.now(),
          sender: 'assistant',
          text: localFallback.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: localFallback.action.type !== 'NONE' ? `Action applied: ${localFallback.action.type}` : undefined,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs px-4 py-3 rounded-2xl shadow-xl shadow-cyan-950/50 border border-cyan-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>Ask AI Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-750 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Natural Language AI Copilot</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-mono">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Controls graph zooming &amp; RNG instantly</p>
          </div>
        </div>

        <button
          onClick={onToggleOpen}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Minimize Assistant"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold pl-1">
          Try:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="text-[11px] bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700/80 rounded-lg px-2.5 py-1 transition flex-shrink-0 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.actionExecuted && (
                <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{msg.actionExecuted}</span>
                </div>
              )}

              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-slate-400">
            <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-800/80 rounded-2xl px-3 py-2 text-slate-400 border border-slate-750 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <span className="text-[11px] ml-1">Interpreting command...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command (e.g. 'Show last 30 days', 'Give me 50 ints 1-100')..."
            className="flex-1 bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow transition cursor-pointer"
            title="Send command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
