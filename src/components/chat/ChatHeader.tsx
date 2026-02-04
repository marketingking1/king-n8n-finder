import { Bot, Minus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const tabNames: Record<string, string> = {
  macro: 'Visão Macro',
  detailed: 'Análise Micro',
  criativos: 'Análise Nano',
  ltv: 'Análise LTV',
};

interface ChatHeaderProps {
  activeTab: string;
  onMinimize: () => void;
  onClose: () => void;
  onClear: () => void;
  hasMessages: boolean;
}

export function ChatHeader({ activeTab, onMinimize, onClose, onClear, hasMessages }: ChatHeaderProps) {
  return (
    <div className="h-14 px-4 flex items-center justify-between bg-[hsl(216,30%,14%)] border-b border-border rounded-t-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">Data Hound AI</h3>
          <p className="text-xs text-muted-foreground">
            Analisando: {tabNames[activeTab] || activeTab}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasMessages && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar conversa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Limpar conversa</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todo o histórico de mensagens será apagado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClear}>Limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMinimize}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Minimizar"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Minimizar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fechar</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
