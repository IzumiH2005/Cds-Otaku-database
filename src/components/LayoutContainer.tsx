import { useDisplayMode } from "@/hooks/use-mobile";
import React, { useEffect } from "react";
import { Smartphone, Monitor, RefreshCw } from "lucide-react";
import ZoomControl from "./ZoomControl";

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
    'bg-background min-h-screen mode-transition app-container',
    // Mode mobile: toujours appliquer une largeur limitée (avec ou sans mode forcé)
    isMobile ? 'mobile-mode-container mobile-view-adjustments' : '',
    // En mode desktop: appliquer aussi une largeur contrôlée mais plus large que mobile
    !isMobile ? 'desktop-mode-container' : '',
    // Indicateur visuel pour les modes forcés
    isForcedMode ? 'forced-mode-border' : '',
    className
  ].filter(Boolean).join(' ');

  // Synchroniser les changements de taille d'écran, les orientations, etc.
  useEffect(() => {
    const handleResize = () => {
      // Forcer un recalcul des dimensions pour l'adaptation du zoom
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        const currentZoom = parseFloat(localStorage.getItem('app_zoom_level') || '100') / 100;
        const height = window.innerHeight;
        document.documentElement.style.setProperty('--app-height', `${height}px`);
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Définir la hauteur initiale
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div className={containerClasses}>
      {/* Bannière indiquant le mode forcé */}
      {isForcedMode && (
        <div className="mode-message sticky top-0 z-50">
          {isMobile 
            ? "Mode compact" + (!isScreenMobile ? " (forcé)" : "")
            : "Mode largeur optimisée" + (isScreenMobile ? " (forcé)" : "")
          }
        </div>
      )}

      <div className="app-content">
        {children}
      </div>

      {/* Contrôle de zoom pour interface mobile */}
      {isMobile && <ZoomControl />}

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
            {isMobile ? "Mode compact" : "Mode optimisé"}
          </span>
          <RefreshCw size={12} />
        </div>
      )}
    </div>
  );
}