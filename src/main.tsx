import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Marquer l'application comme chargée dès que React commence à rendre
if (typeof window !== 'undefined' && window.markAppAsLoaded) {
  window.markAppAsLoaded();
}

// Initialiser IndexedDB avant de rendre l'application
import('./lib/enhancedIndexedDB').then(() => {
  console.log('IndexedDB initialized');
  createRoot(document.getElementById("root")!).render(<App />);
}).catch(error => {
  console.error('Error initializing IndexedDB:', error);
  // Rendre l'application malgré l'erreur pour montrer un message
  createRoot(document.getElementById("root")!).render(<App />);
});
