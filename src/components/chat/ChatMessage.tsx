import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-2 max-w-[90%]", isUser && "flex-row-reverse")}>
        {!isUser && (
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-3 h-3 text-primary" />
          </div>
        )}
        
        <div className="flex flex-col">
          <div
            className={cn(
              "px-3.5 py-2.5 text-sm",
              isUser
                ? "bg-primary/15 border border-primary/30 rounded-xl rounded-br-sm text-foreground"
                : "bg-secondary border border-border rounded-xl rounded-bl-sm text-foreground"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-background/50 prose-pre:p-2">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
          
          {!isStreaming && (
            <span className={cn(
              "text-[11px] text-muted-foreground mt-1",
              isUser ? "text-right" : "text-left"
            )}>
              {format(timestamp, 'HH:mm')}
            </span>
          )}
        </div>
        
        {isUser && (
          <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-3 h-3 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
});
