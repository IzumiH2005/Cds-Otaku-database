import React, { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { enableMobileScrollingWithZoom } from '@/utils/mobileDetection';

// Interface pour stocker la configuration de zoom dans le localStorage
interface ZoomSettings {
  value: number;
  lastUpdated: number;
}

export const ZoomControl: React.FC = () => {
  // Valeur de zoom par défaut à 50%
  const [zoomValue, setZoomValue] = useState<number>(50);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Récupérer la valeur de zoom du localStorage au chargement
  useEffect(() => {
    const savedZoom = localStorage.getItem('app_zoom_level');
    if (savedZoom) {
      try {
        const zoomSettings: ZoomSettings = JSON.parse(savedZoom);
        setZoomValue(zoomSettings.value);
        applyZoom(zoomSettings.value);
      } catch (e) {
        console.error("Erreur lors de la récupération du zoom", e);
        // En cas d'erreur, définir et appliquer le zoom par défaut
        setZoomValue(50);
        applyZoom(50);
      }
    } else {
      // Aucune valeur enregistrée, appliquer le zoom par défaut
      applyZoom(50);
    }
    
    // Ajouter la classe pour le mode responsive avec zoom
    document.documentElement.classList.add('zoom-responsive');
  }, []);
  
  // Appliquer le zoom à l'interface
  const applyZoom = (value: number) => {
    // Appliquer le zoom au contenu principal de l'application
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      (appContent as HTMLElement).style.transform = `scale(${value / 100})`;
      (appContent as HTMLElement).style.transformOrigin = 'top center';
      
      // Ajuster la hauteur du conteneur pour éviter les problèmes de défilement
      const container = document.querySelector('.app-container');
      if (container) {
        const scaleFactor = value / 100;
        const contentHeight = appContent.scrollHeight;
        (container as HTMLElement).style.minHeight = `${contentHeight * scaleFactor}px`;
      }
    }
    
    // Enregistrer la valeur dans le localStorage
    const zoomSettings: ZoomSettings = {
      value: value,
      lastUpdated: Date.now()
    };
    localStorage.setItem('app_zoom_level', JSON.stringify(zoomSettings));
    
    // Ajouter une classe au body pour indiquer le niveau de zoom actuel
    document.body.classList.forEach((className) => {
      if (className.startsWith('zoom-level-')) {
        document.body.classList.remove(className);
      }
    });
    document.body.classList.add(`zoom-level-${Math.round(value)}`);
    
    // Activer les optimisations spécifiques pour les applications mobiles (WebView)
    enableMobileScrollingWithZoom(value);
    
    // Adapter le layout en fonction du niveau de zoom pour tous les environnements
    if (value <= 50) {
      // À petit zoom, on élargit le contenu pour éviter les espaces vides
      document.documentElement.style.setProperty('--content-width', '150%');
      document.documentElement.style.setProperty('--content-left', '-25%');
      
      // S'assurer que le contenu est correctement élargi
      if (appContent) {
        (appContent as HTMLElement).style.width = '150%';
        (appContent as HTMLElement).style.left = '-25%';
        (appContent as HTMLElement).style.position = 'relative';
        
        // Correction pour que le défilement fonctionne jusqu'en bas
        (appContent as HTMLElement).style.paddingBottom = '120px';
      }
    } 
    else if (value <= 70) {
      document.documentElement.style.setProperty('--content-width', '130%');
      document.documentElement.style.setProperty('--content-left', '-15%');
      
      if (appContent) {
        (appContent as HTMLElement).style.width = '130%';
        (appContent as HTMLElement).style.left = '-15%';
        (appContent as HTMLElement).style.position = 'relative';
        
        // Correction pour que le défilement fonctionne jusqu'en bas
        (appContent as HTMLElement).style.paddingBottom = '100px';
      }
    } 
    else {
      document.documentElement.style.setProperty('--content-width', '100%');
      document.documentElement.style.setProperty('--content-left', '0');
      
      if (appContent) {
        (appContent as HTMLElement).style.width = '100%';
        (appContent as HTMLElement).style.left = '0';
        (appContent as HTMLElement).style.paddingBottom = '80px';
      }
    }
    
    // Déclencher un événement de redimensionnement pour que l'interface s'adapte
    window.dispatchEvent(new Event('resize'));
  };
  
  // Gérer le changement de valeur du slider
  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    setZoomValue(newZoom);
    applyZoom(newZoom);
  };
  
  // Réinitialiser le zoom à 100%
  const resetZoom = () => {
    setZoomValue(100);
    applyZoom(100);
  };
  
  // Afficher/masquer le contrôle de zoom
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="zoom-control-container">
      {/* Bouton de zoom toujours visible qui affiche la valeur actuelle */}
      <button 
        onClick={toggleVisibility}
        className="zoom-toggle-button"
      >
        {zoomValue} %
      </button>
      
      {/* Contrôle de zoom qui apparaît lorsqu'on clique sur le bouton */}
      {isVisible && (
        <div className="zoom-control-panel">
          <div className="zoom-slider-container">
            <span className="zoom-minus">-</span>
            <Slider
              value={[zoomValue]}
              min={30}
              max={150}
              step={5}
              onValueChange={handleZoomChange}
              className="zoom-slider"
            />
            <span className="zoom-plus">+</span>
          </div>
          
          <button 
            onClick={resetZoom}
            className="zoom-reset-button"
          >
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
};

export default ZoomControl;