import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/display-mode.css'
import { schedulePeriodicCleanup } from './lib/audioCleanup'

// Monter l'application d'abord
const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<App />);

// Initialiser le service de nettoyage des fichiers audio après que l'application soit chargée
// pour éviter d'interférer avec l'interface utilisateur pendant le chargement initial
// Effectuer un nettoyage toutes les 60 minutes (moins fréquent pour réduire l'impact sur les performances)
window.addEventListener('load', () => {
  // Retarder l'initialisation du service de nettoyage pour éviter d'impacter les performances initiales
  setTimeout(() => {
    schedulePeriodicCleanup(60);
  }, 5000); // Attendre 5 secondes après le chargement complet
});
