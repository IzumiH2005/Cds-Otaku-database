import React, { useEffect } from 'react';
import { applyMobileOptimizations, isWebViewEnvironment } from './mobileDetection';

/**
 * Ce composant s'assure que l'application s'adapte correctement 
 * lorsqu'elle est utilisée dans un environnement d'application mobile
 * via médian.co ou d'autres solutions similaires.
 */
const AppWebView: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Appliquer les optimisations pour le mode mobile
    applyMobileOptimizations();
    
    // Détecter si nous sommes dans une WebView
    const isWebView = isWebViewEnvironment();
    
    // Empêcher le blocage du défilement tactile
    const handleTouchMove = (e: TouchEvent) => {
      // Permettre le défilement par défaut
      if (e.cancelable) {
        e.stopPropagation();
      }
    };
    
    if (isWebView) {
      // 1. Ajouter une classe pour le mode WebView pour le styling CSS
      document.documentElement.classList.add('webview-mode');
      
      // 2. Corriger les problèmes de défilement sur mobile
      fixScrollingIssues();
      
      // 3. Gérer la pression longue pour éviter les comportements indésirables
      preventLongPressMenus();
      
      // 4. Ajouter l'écouteur d'événement pour le défilement
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
    
    return () => {
      // Nettoyage si nécessaire
      if (isWebView) {
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);
  
  /**
   * Corrige les problèmes de défilement dans les WebViews
   */
  const fixScrollingIssues = () => {
    // Assurer que le conteneur principal est scrollable
    document.body.style.overflow = 'auto';
    document.body.style.overscrollBehavior = 'touch';
    // Safari/iOS support for smooth scrolling
    (document.body.style as any)['-webkit-overflow-scrolling'] = 'touch';
    
    // S'assurer que le défilement est toujours possible, même sur petits écrans
    document.documentElement.style.height = '100%';
    document.documentElement.style.minHeight = '100%';
    
    // Appliquer un style pour rendre le contenu scrollable sous zoom
    const style = document.createElement('style');
    style.textContent = `
      /* Corriger les problèmes de défilement dans les applications Android */
      html.webview-mode, html.webview-mode body {
        height: auto !important;
        min-height: 100% !important;
        position: relative !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        touch-action: pan-y !important;
      }
      
      /* S'assurer que le contenu reste défilable, même avec des zones fixes */
      html.webview-mode .app-content {
        min-height: 101vh !important;
        padding-bottom: 50px !important;
      }
      
      /* Éviter les problèmes de couche de défilement */
      html.webview-mode.low-zoom-scroll-fix .app-content {
        height: auto !important;
        min-height: 101vh !important;
        transform-origin: top center !important;
      }
      
      /* Correction des marges et paddings */
      html.webview-mode .container {
        overflow-x: visible !important;
      }
      
      /* Permettre le défilement jusqu'en bas même au zoom */
      body.zoom-level-30 .app-content,
      body.zoom-level-40 .app-content,
      body.zoom-level-50 .app-content {
        padding-bottom: 100px !important;
      }
      
      /* Empêcher les éléments fixes de bloquer le défilement */
      html.webview-mode .zoom-control-container {
        position: fixed !important;
        bottom: 80px !important;
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Empêcher le blocage du défilement tactile
    const handleTouchMove = (e: TouchEvent) => {
      // Permettre le défilement par défaut
      if (e.cancelable) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
  };
  
  /**
   * Empêche les menus contextuels lors des pressions longues
   * qui peuvent perturber l'expérience utilisateur
   */
  const preventLongPressMenus = () => {
    document.body.addEventListener('contextmenu', (e) => {
      // Empêcher le menu contextuel sur mobile
      e.preventDefault();
      return false;
    });
    
    // Désactiver également la sélection de texte indésirable
    const style = document.createElement('style');
    style.textContent = `
      html.webview-mode {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }
      
      /* Permissions pour les champs de saisie */
      html.webview-mode input, 
      html.webview-mode textarea {
        -webkit-user-select: auto !important;
        user-select: auto !important;
      }
    `;
    document.head.appendChild(style);
  };
  
  // Ce composant ne rend rien visuellement, il applique juste des optimisations
  return <>{children}</>;
};

export default AppWebView;