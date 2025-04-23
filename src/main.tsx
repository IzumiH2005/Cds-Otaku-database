import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/display-mode.css'
import { schedulePeriodicCleanup } from './lib/audioCleanup'

// Initialiser le service de nettoyage des fichiers audio
// Effectuer un nettoyage toutes les 30 minutes
schedulePeriodicCleanup(30);

createRoot(document.getElementById("root")!).render(<App />);
