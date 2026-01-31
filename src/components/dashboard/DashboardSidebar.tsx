import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Video,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import logo from '@/assets/logo.png';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const mainNavItems: NavItem[] = [
    { 
      id: 'macro', 
      label: 'Visão Macro', 
      icon: LayoutDashboard,
      onClick: () => onTabChange('macro')
    },
    { 
      id: 'detailed', 
      label: 'Análise Detalhada', 
      icon: BarChart3,
      onClick: () => onTabChange('detailed')
    },
    { 
      id: 'criativos', 
      label: 'Análise Criativos', 
      icon: Video,
      onClick: () => onTabChange('criativos')
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col",
          "bg-[hsl(215,35%,11%)] border-r border-border",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          <img src={logo} alt="King of Languages" className="h-16 w-16 object-contain" />
          {!isCollapsed && (
            <span className="font-display font-semibold text-foreground truncate">
              King Acquisition
            </span>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="mb-4">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dashboard
              </span>
            )}
            <div className="mt-2 space-y-1">
              {mainNavItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        </nav>
        {/* Bottom Section */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <NavButton
            item={{ 
              id: 'logout', 
              label: 'Sair', 
              icon: LogOut,
              onClick: handleSignOut
            }}
            isActive={false}
            isCollapsed={isCollapsed}
            variant="destructive"
          />
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-20 z-50",
            "flex items-center justify-center w-6 h-6",
            "rounded-full bg-[hsl(215,35%,11%)] border border-border",
            "text-muted-foreground hover:text-foreground hover:border-primary/50",
            "transition-colors duration-200"
          )}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  variant?: 'default' | 'destructive';
}

function NavButton({ item, isActive, isCollapsed, variant = 'default' }: NavButtonProps) {
  const Icon = item.icon;
  
  const buttonContent = (
    <button
      onClick={item.onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
        "text-sm font-medium transition-all duration-200",
        isCollapsed && "justify-center px-2",
        // Default variant
        variant === 'default' && [
          isActive 
            ? "bg-primary/15 text-primary border border-primary/20" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        ],
        // Destructive variant
        variant === 'destructive' && [
          "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        ]
      )}
    >
      <Icon className={cn(
        "h-4.5 w-4.5 flex-shrink-0",
        isActive && variant === 'default' && "text-primary"
      )} />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-[hsl(216,30%,14%)] border-border">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}
