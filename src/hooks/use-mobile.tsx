import * as React from "react"

// Largeur seuil pour considérer un appareil comme mobile
const MOBILE_BREAKPOINT = 768

// Clé pour stocker le mode préféré dans le localStorage
const DISPLAY_MODE_KEY = 'preferred-display-mode'

// Types pour les modes d'affichage
type DisplayMode = 'auto' | 'mobile' | 'desktop'

// Fonction pour vérifier la taille de l'écran et déterminer si l'appareil est mobile
const checkIsMobileByScreen = () => window.innerWidth < MOBILE_BREAKPOINT

// Hook pour gérer le basculement entre les modes mobile et bureau
export function useDisplayMode() {
  // État pour suivre le mode d'affichage actuel (auto, mobile, bureau)
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(DISPLAY_MODE_KEY) as DisplayMode) || 'auto'
    }
    return 'auto'
  })

  // État pour suivre si l'écran est de taille mobile (basé sur la largeur réelle)
  const [isScreenMobile, setIsScreenMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? checkIsMobileByScreen() : false
  )

  // Effet pour écouter les changements de taille d'écran
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsScreenMobile(checkIsMobileByScreen())
    }
    
    // Configurer l'écouteur d'événements
    mql.addEventListener("change", onChange)
    
    // Définir l'état initial
    setIsScreenMobile(checkIsMobileByScreen())
    
    // Nettoyer l'écouteur d'événements
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Fonction pour changer manuellement le mode d'affichage
  const setMode = React.useCallback((mode: DisplayMode) => {
    setDisplayMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISPLAY_MODE_KEY, mode)
    }
  }, [])

  // Fonction pour basculer entre les modes mobile et bureau
  const toggleMode = React.useCallback(() => {
    const newMode = displayMode === 'auto' 
      ? (isScreenMobile ? 'desktop' : 'mobile')
      : displayMode === 'mobile' 
        ? 'desktop' 
        : 'mobile'
    
    setMode(newMode)
  }, [displayMode, isScreenMobile, setMode])

  // Fonction pour réinitialiser au mode automatique
  const resetToAuto = React.useCallback(() => {
    setMode('auto')
  }, [setMode])

  // Calcul du mode d'affichage effectif (si auto, utiliser la taille d'écran réelle)
  const isMobile = displayMode === 'auto' 
    ? isScreenMobile 
    : displayMode === 'mobile'

  return {
    isMobile,           // Si l'affichage est actuellement en mode mobile
    isScreenMobile,     // Si l'écran est physiquement de taille mobile
    displayMode,        // Le mode d'affichage sélectionné
    setMode,            // Fonction pour définir un mode spécifique
    toggleMode,         // Fonction pour basculer entre mobile et bureau
    resetToAuto,        // Fonction pour revenir au mode automatique
  }
}

// Hook de compatibilité avec l'ancienne API
export function useIsMobile() {
  const { isMobile } = useDisplayMode()
  return !!isMobile
}
