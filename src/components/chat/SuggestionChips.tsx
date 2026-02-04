import { cn } from '@/lib/utils';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ suggestions, onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 text-xs rounded-full border border-border",
            "bg-transparent text-muted-foreground",
            "hover:border-primary hover:text-foreground",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export const suggestionsByTab: Record<string, string[]> = {
  macro: [
    "Qual canal tem melhor ROAS?",
    "Me dá um resumo do período",
    "Explica o funil de conversão",
    "Compare os canais",
  ],
  detailed: [
    "Qual campanha tem o CPA mais alto?",
    "Como a receita é calculada aqui?",
    "Quais campanhas devo pausar?",
    "Analise a eficiência das campanhas",
  ],
  criativos: [
    "Qual criativo tem melhor Hook Rate?",
    "O que significa Hold Rate?",
    "Como melhorar a retenção dos vídeos?",
    "Quais criativos devo escalar?",
  ],
  ltv: [
    "Como o LTV é calculado?",
    "O que a curva de sobrevivência mostra?",
    "Qual canal traz os melhores alunos?",
    "Analise a taxa de churn",
  ],
};

export const welcomeSuggestions = [
  "O que devo olhar primeiro?",
  "Como o CAC é calculado?",
  "Me dá um resumo do período",
  "Por que os dados parecem diferentes entre abas?",
];
