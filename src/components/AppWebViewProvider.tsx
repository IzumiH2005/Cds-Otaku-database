import React, { useEffect } from 'react';

/**
 * Composant qui configure l'environnement optimal pour WebView/application mobile
 * Doit être placé au plus haut niveau de l'application
 */
const AppWebViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Détecter si nous sommes dans une application via médian.co ou similaire
    const isInAndroidApp = /Android/i.test(navigator.userAgent) || 
                           /median|webview|app/i.test(navigator.userAgent.toLowerCase());
    
    // Fonctions pour gérer les événements de redimensionnement
    const handleResize = () => {
      // Définir une variable CSS personnalisée pour la hauteur réelle du viewport
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    };
    
    const handleOrientation = () => {
      // Différer la mise à jour pour tenir compte du temps de rotation
      setTimeout(handleResize, 200);
    };
    
    if (isInAndroidApp) {
      // Marquer comme étant en mode application
      document.documentElement.classList.add('android-app-mode');
      
      // Optimiser le défilement pour les applications Android
      enableAppScrolling();
      
      // Fixer la hauteur du viewport correctement
      fixAppViewportHeight();
      
      // Ajouter les écouteurs d'événements
      window.addEventListener('resize', handleResize, { passive: true });
      window.addEventListener('orientationchange', handleOrientation, { passive: true });
    }
    
    return () => {
      // Cleanup si nécessaire
      if (isInAndroidApp) {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientation);
      }
    };
  }, []);
  
  // Fonction pour activer un défilement optimal
  const enableAppScrolling = () => {
    // Ajouter des styles spécifiques pour l'application
    const style = document.createElement('style');
    style.textContent = `
      /* Styles spécifiques pour médian.co et applications Android */
      html.android-app-mode, 
      html.android-app-mode body {
        height: auto !important;
        min-height: 100% !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        position: relative !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: none !important;
        touch-action: pan-y !important;
      }
      
      /* Assurer que l'écran entier est scrollable */
      html.android-app-mode .app-content {
        min-height: 101vh !important;
        padding-bottom: 150px !important; /* Espace supplémentaire en bas */
        overflow-y: visible !important;
      }
      
      /* Correction pour le contrôle de zoom qui peut bloquer le défilement */
      html.android-app-mode .zoom-control-container {
        position: fixed !important;
        bottom: 20px !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
      }
      
      /* Permettre le défilement complet dans les pages de flashcards */
      html.android-app-mode .flashcard-grid {
        padding-bottom: 200px !important;
        overflow-y: visible !important;
      }
      
      /* S'assurer que le contenu est bien visible */
      html.android-app-mode .container {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      /* Adaptation spéciale pour le zoom à 50% */
      html.android-app-mode body.zoom-level-50 .app-content {
        min-height: calc(150vh) !important;
        padding-bottom: 300px !important;
      }
    `;
    document.head.appendChild(style);
    
    // Forcer le refresh du layout sur les événements de scroll
    document.addEventListener('scroll', () => {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
    }, { passive: true });
  };
  
  // Corriger les problèmes de hauteur de viewport dans les applications
  const fixAppViewportHeight = () => {
    const handleResize = () => {
      // Définir une variable CSS personnalisée pour la hauteur réelle du viewport
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--real-vh', `${vh}px`);
      
      // Forcer la mise à jour des hauteurs
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        (appContent as HTMLElement).style.minHeight = `${window.innerHeight}px`;
      }
    };
    
    const handleOrientation = () => {
      // Différer la mise à jour pour tenir compte du temps de rotation
      setTimeout(handleResize, 200);
    };
    
    // Appliquer immédiatement
    handleResize();
    
    // Surveiller les changements
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientation, { passive: true });
  };

  // Ce composant ne rend rien visuellement, il applique juste les optimisations
  return <>{children}</>;
};

export default AppWebViewProvider;