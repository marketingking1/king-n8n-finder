import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { SuggestionChips, welcomeSuggestions, suggestionsByTab } from './SuggestionChips';
import { Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  activeTab: string;
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatMessages({ messages, isLoading, activeTab, onSuggestionClick }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (scrollRef.current) {
      const behavior = isFirstRender.current ? 'auto' : 'smooth';
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isFirstRender.current = false;
    }
  }, [messages, isLoading]);

  const showWelcome = messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const showContextualSuggestions = !isLoading && lastMessage?.role === 'assistant' && !lastMessage.isStreaming;

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="py-4 space-y-4">
        {showWelcome && (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-secondary border border-border rounded-xl rounded-bl-sm px-3.5 py-2.5 max-w-[90%]">
                <div className="text-sm text-foreground space-y-2">
                  <p>👋 Olá! Sou o <strong>Data Hound AI</strong>, seu assistente do dashboard.</p>
                  <p>Posso te ajudar a:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Entender como cada métrica é calculada</li>
                    <li>Analisar os dados e gerar resumos</li>
                    <li>Explicar gráficos e tendências</li>
                    <li>Orientar qual dado olhar primeiro</li>
                  </ul>
                  <p className="text-muted-foreground">Experimente perguntar:</p>
                </div>
                <SuggestionChips
                  suggestions={welcomeSuggestions}
                  onSelect={onSuggestionClick}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            isStreaming={message.isStreaming}
          />
        ))}

        {isLoading && !messages.some(m => m.isStreaming) && <TypingIndicator />}

        {showContextualSuggestions && (
          <div className="pl-7">
            <SuggestionChips
              suggestions={suggestionsByTab[activeTab] || suggestionsByTab.macro}
              onSelect={onSuggestionClick}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
