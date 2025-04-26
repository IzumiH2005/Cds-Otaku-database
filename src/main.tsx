import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/display-mode.css'

// Initialisation de l'adaptateur de stockage
import { initStorageAdapter } from './lib/storageAdapter'

// Initialiser l'adaptateur de stockage au démarrage de l'application
initStorageAdapter().then(() => {
  console.log('Adaptateur de stockage initialisé correctement au démarrage');
}).catch(error => {
  console.error('Erreur lors de l\'initialisation de l\'adaptateur de stockage:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
