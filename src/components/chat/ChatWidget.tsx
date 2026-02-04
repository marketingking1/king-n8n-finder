import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatWidgetProps {
  activeTab: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
  filters: {
    campanhas: string[];
    grupos: string[];
    canais: string[];
    granularity: string;
  };
}

export function ChatWidget({ activeTab, dateRange, filters }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const dashboardData = useDashboardData();

  const context = {
    activeTab,
    dateRange,
    filters,
  };

  const { messages, sendMessage, isLoading, clearMessages, error } = useChat(context, dashboardData);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggle}
                  className={cn(
                    "w-14 h-14 rounded-full bg-primary text-primary-foreground",
                    "flex items-center justify-center",
                    "shadow-lg hover:shadow-[0_0_20px_hsla(186,100%,50%,0.4)]",
                    "hover:scale-105 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  )}
                  aria-label="Abrir assistente Data Hound AI"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Assistente Data Hound AI</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              "fixed z-50 flex flex-col",
              "bg-card border border-border rounded-2xl",
              "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
              isMobile
                ? "inset-0 m-0 rounded-none"
                : "bottom-6 right-6 w-[420px] h-[600px] max-h-[85vh]"
            )}
            role="dialog"
            aria-labelledby="chat-title"
            aria-modal="true"
          >
            <ChatHeader
              activeTab={activeTab}
              onMinimize={handleClose}
              onClose={handleClose}
              onClear={clearMessages}
              hasMessages={messages.length > 0}
            />

            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              activeTab={activeTab}
              onSuggestionClick={handleSend}
            />

            {error && (
              <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <ChatInput onSend={handleSend} disabled={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
