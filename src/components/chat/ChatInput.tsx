import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Pergunte sobre os dados..." }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 100; // ~4 lines
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-border bg-secondary rounded-b-2xl p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent border-none resize-none",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[24px] max-h-[100px]"
          )}
          aria-label="Mensagem"
        />
        
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            "transition-all duration-200",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_12px_rgba(0,217,255,0.3)]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          aria-label="Enviar mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
