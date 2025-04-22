import React, { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";

// Interface pour stocker la configuration de zoom dans le localStorage
interface ZoomSettings {
  value: number;
  lastUpdated: number;
}

export const ZoomControl: React.FC = () => {
  // Valeur de zoom par défaut à 60%
  const [zoomValue, setZoomValue] = useState<number>(60);
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
        setZoomValue(60);
        applyZoom(60);
      }
    } else {
      // Aucune valeur enregistrée, appliquer le zoom par défaut
      applyZoom(60);
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