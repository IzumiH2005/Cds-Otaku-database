/**
 * Utilitaires pour la détection des environnements mobiles et WebView
 * et l'adaptation de l'interface en conséquence
 */

/**
 * Vérifie si l'application s'exécute dans un environnement WebView d'application mobile
 */
export const isWebViewEnvironment = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return (
    // Android WebView
    /wv/.test(navigator.userAgent) ||
    // WebView génériques
    /Android.*Version\/[0-9]/.test(navigator.userAgent) ||
    // Applications hybrides
    /cordova|phonegap|capacitor/.test(navigator.userAgent) ||
    // Detect WebView in iOS
    (/iPhone|iPad|iPod/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent) && !(window as any).webkit) ||
    // Détection pour médian.co et autres outils similaires
    /median|webclip|appwebview/.test(navigator.userAgent.toLowerCase()) ||
    // PWA mode pour les applications installées
    ('standalone' in navigator && (navigator as any).standalone === true) ||
    // Mode d'affichage PWA
    (window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    ))
  );
};

/**
 * Vérifie si l'application s'exécute sur un appareil mobile (téléphone ou tablette)
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768)
  );
};

/**
 * Applique les adaptations nécessaires pour un bon fonctionnement sur mobile et WebView
 */
export const applyMobileOptimizations = (): void => {
  const isWebView = isWebViewEnvironment();
  const isMobile = isMobileDevice();
  
  if (isWebView || isMobile) {
    document.documentElement.classList.add('mobile-device');
    
    if (isWebView) {
      document.documentElement.classList.add('webview-mode');
      
      // Configuration pour le défilement approprié dans les WebViews
      document.documentElement.style.height = '100%';
      document.documentElement.style.overflowY = 'scroll';
      (document.documentElement.style as any)['-webkit-overflow-scrolling'] = 'touch';
      
      // Empêcher le rebond sur iOS
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      
      // Assurer que le contenu prend toute la hauteur disponible
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        (appContent as HTMLElement).style.minHeight = '100vh';
      }
      
      // Fixer les problèmes de hauteur de viewport sur certains appareils
      fixMobileViewportHeight();
    }
  }
};

/**
 * Corrige les problèmes de hauteur du viewport sur les appareils mobiles
 * (iOS, Chrome Android avec barre d'adresse, etc.)
 */
export const fixMobileViewportHeight = (): void => {
  // Définir la hauteur du viewport correctement sur mobile
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Initialiser la hauteur
  setViewportHeight();
  
  // Mettre à jour lors des redimensionnements
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
};

/**
 * Active le mode de désactivation de zoom dynamique pour assurer un défilement correct
 * Cette fonction doit être appelée quand le contrôle de zoom est activé
 */
export const enableMobileScrollingWithZoom = (zoomValue: number): void => {
  const isInWebView = isWebViewEnvironment();
  
  if (isInWebView) {
    // Adapter la mise en page en fonction du zoom
    document.documentElement.style.setProperty('--app-zoom-factor', `${zoomValue / 100}`);
    
    // Correction du défilement pour les niveaux de zoom faibles
    if (zoomValue <= 70) {
      document.body.classList.add('low-zoom-scroll-fix');
      document.documentElement.style.setProperty('--content-width', `${Math.max(130, 200 - zoomValue)}%`);
      document.documentElement.style.setProperty('--content-scrollable', 'true');
    } else {
      document.body.classList.remove('low-zoom-scroll-fix');
      document.documentElement.style.setProperty('--content-width', '100%');
      document.documentElement.style.setProperty('--content-scrollable', 'false');
    }
  }
};