import { useDisplayMode } from "@/hooks/use-mobile";
import React from "react";
import { Smartphone, Monitor, RefreshCw } from "lucide-react";

interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant de mise en page qui adapte l'apparence en fonction du mode d'affichage sélectionné
 * (mobile, bureau ou automatique en fonction de la taille de l'écran).
 */
export function LayoutContainer({ children, className = "" }: LayoutContainerProps) {
  const { isMobile, isScreenMobile, displayMode, resetToAuto } = useDisplayMode();

  // Détermine si nous sommes en mode d'affichage forcé (différent de la taille d'écran réelle)
  const isForcedMode = displayMode !== 'auto';
  const isForcedMobileOnDesktop = isMobile && !isScreenMobile;
  const isForcedDesktopOnMobile = !isMobile && isScreenMobile;

  // Classes CSS à appliquer en fonction du mode d'affichage
  const containerClasses = [
    'bg-background min-h-screen mode-transition',
    isMobile ? 'mobile-mode-container mobile-view-adjustments' : '',
    isForcedMode ? 'forced-mode-border' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Bannière indiquant le mode forcé */}
      {isForcedMode && (
        <div className="mode-message sticky top-0 z-50">
          {isMobile 
            ? "Mode mobile" + (!isScreenMobile ? " (forcé)" : "")
            : "Mode bureau" + (isScreenMobile ? " (forcé)" : "")
          }
        </div>
      )}

      {children}

      {/* Indicateur flottant de mode (visible uniquement en mode forcé) */}
      {isForcedMode && typeof window !== 'undefined' && (
        <div 
          className="display-mode-indicator"
          onClick={resetToAuto}
          role="button"
          tabIndex={0}
          title="Cliquez pour revenir au mode automatique"
        >
          {isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
          <span>
            {isMobile ? "Mode mobile" : "Mode bureau"}
          </span>
          <RefreshCw size={12} />
        </div>
      )}
    </div>
  );
}