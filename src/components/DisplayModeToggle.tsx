import React from "react";
import { useDisplayMode } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, RefreshCw } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DisplayModeToggle() {
  const { 
    displayMode, 
    isScreenMobile,
    toggleMode, 
    resetToAuto 
  } = useDisplayMode();

  const getButtonIcon = () => {
    if (displayMode === 'auto') {
      return isScreenMobile ? <Smartphone size={18} /> : <Monitor size={18} />;
    }
    return displayMode === 'mobile' ? <Smartphone size={18} /> : <Monitor size={18} />;
  };

  const getButtonLabel = () => {
    if (displayMode === 'auto') {
      return isScreenMobile ? 'Mode Auto (Mobile)' : 'Mode Auto (Bureau)';
    }
    return displayMode === 'mobile' ? 'Mode Compact' : 'Mode Optimisé';
  };

  const getTooltipText = () => {
    if (displayMode === 'auto') {
      return 'L\'affichage s\'adapte automatiquement à la taille de votre écran. Cliquez pour changer.';
    }
    return displayMode === 'mobile' 
      ? 'Affichage en mode compact (format mobile). Cliquez pour passer en mode optimisé.'
      : 'Affichage en largeur optimisée pour la lecture. Cliquez pour passer en mode compact.';
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleMode}
              className="flex items-center gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              {getButtonIcon()}
              <span className="hidden md:inline-block">{getButtonLabel()}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-xs">
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {displayMode !== 'auto' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetToAuto}
                className="flex items-center justify-center h-8 w-8 p-0"
              >
                <RefreshCw size={14} />
                <span className="sr-only">Revenir au mode automatique</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>Revenir au mode automatique</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}