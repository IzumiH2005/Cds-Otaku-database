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
    return displayMode === 'mobile' ? 'Mode Mobile' : 'Mode Bureau';
  };

  const getTooltipText = () => {
    if (displayMode === 'auto') {
      return 'L\'affichage s\'adapte automatiquement à la taille de votre écran. Cliquez pour changer.';
    }
    return displayMode === 'mobile' 
      ? 'Affichage forcé en mode mobile. Cliquez pour passer en mode bureau.'
      : 'Affichage forcé en mode bureau. Cliquez pour passer en mode mobile.';
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleMode}
              className="flex items-center gap-2"
            >
              {getButtonIcon()}
              <span className="hidden md:inline-block">{getButtonLabel()}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
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
                className="flex items-center justify-center"
              >
                <RefreshCw size={16} />
                <span className="sr-only">Revenir au mode automatique</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Revenir au mode automatique</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}