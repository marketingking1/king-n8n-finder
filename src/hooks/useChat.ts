import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardDataState } from '@/contexts/DashboardDataContext';
import { format } from 'date-fns';

const STORAGE_KEY = 'datahound-chat-history';
const MAX_STORED_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 20;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface DashboardContext {
  activeTab: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
  filters: {
    campanhas: string[];
    grupos: string[];
    canais: string[];
    granularity: string;
  };
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  clearMessages: () => void;
  error: string | null;
}

// Collect only relevant data for the active tab
function collectDashboardData(activeTab: string, data: DashboardDataState) {
  switch (activeTab) {
    case 'macro':
      return { 
        macro: data.macro, 
        channelMetrics: data.channelMetrics?.slice(0, 10) 
      };
    case 'detailed':
      return { 
        campaignMetrics: data.campaignMetrics?.slice(0, 10) 
      };
    case 'criativos':
      return { 
        creativeKPIs: data.creativeKPIs, 
        topCreatives: data.topCreatives?.slice(0, 10) 
      };
    case 'ltv':
      return { 
        ltvMetrics: data.ltvMetrics, 
        channelLTV: data.channelLTV?.slice(0, 10) 
      };
    default:
      return {};
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadMessagesFromStorage(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
  } catch (e) {
    console.error('Failed to load chat history:', e);
  }
  return [];
}

function saveMessagesToStorage(messages: ChatMessage[]) {
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
}

export function useChat(context: DashboardContext, data: DashboardDataState): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessagesFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    const nonStreamingMessages = messages.filter((m) => !m.isStreaming);
    if (nonStreamingMessages.length > 0) {
      saveMessagesToStorage(nonStreamingMessages);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Prepare messages for API (last N messages)
      const historyForApi = [...messages, userMessage]
        .slice(-MAX_CONTEXT_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      // Prepare dashboard context
      const dashboardContext = {
        activeTab: context.activeTab,
        dateRange: {
          from: context.dateRange.from ? format(context.dateRange.from, 'yyyy-MM-dd') : null,
          to: context.dateRange.to ? format(context.dateRange.to, 'yyyy-MM-dd') : null,
        },
        filters: context.filters,
      };

      // Collect relevant dashboard data
      const dashboardData = collectDashboardData(context.activeTab, data);

      try {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-ai`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: historyForApi,
              dashboardContext,
              dashboardData,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Muitas requisições. Aguarde um momento antes de enviar outra pergunta.');
          }
          if (response.status === 402) {
            throw new Error('Créditos insuficientes. Adicione créditos para continuar.');
          }
          throw new Error('Erro ao processar sua pergunta. Tente novamente.');
        }

        // Create streaming assistant message
        const assistantMessageId = generateId();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          },
        ]);

        // Process SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let textBuffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            textBuffer += decoder.decode(value, { stream: true });

            // Process line-by-line
            let newlineIndex: number;
            while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
              let line = textBuffer.slice(0, newlineIndex);
              textBuffer = textBuffer.slice(newlineIndex + 1);

              if (line.endsWith('\r')) line = line.slice(0, -1);
              if (line.startsWith(':') || line.trim() === '') continue;
              if (!line.startsWith('data: ')) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') break;

              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  assistantContent += delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                    )
                  );
                }
              } catch {
                // Incomplete JSON, put back and wait
                textBuffer = line + '\n' + textBuffer;
                break;
              }
            }
          }
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        console.error('Chat error:', err);
        setError(err.message || 'Desculpe, não consegui processar sua pergunta. Tente novamente.');

        // Remove any incomplete assistant message
        setMessages((prev) => prev.filter((m) => !m.isStreaming));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [context, data, messages, isLoading]
  );

  return {
    messages,
    sendMessage,
    isLoading,
    clearMessages,
    error,
  };
}
