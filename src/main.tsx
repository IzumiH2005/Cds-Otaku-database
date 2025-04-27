import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Application starting...');

// Définir une fonction globale pour les logs
const logInfo = (message: string, data?: any) => {
  const logElement = document.getElementById('startup-logs');
  if (logElement) {
    const logItem = document.createElement('div');
    logItem.textContent = `${new Date().toISOString().slice(11, 19)} - ${message}`;
    logElement.appendChild(logItem);
  }
  console.log(message, data || '');
};

// Créer une div pour les logs de démarrage
if (typeof window !== 'undefined') {
  const logsContainer = document.createElement('div');
  logsContainer.id = 'startup-logs';
  logsContainer.style.position = 'fixed';
  logsContainer.style.bottom = '10px';
  logsContainer.style.right = '10px';
  logsContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
  logsContainer.style.color = 'white';
  logsContainer.style.padding = '10px';
  logsContainer.style.borderRadius = '5px';
  logsContainer.style.maxHeight = '200px';
  logsContainer.style.overflow = 'auto';
  logsContainer.style.zIndex = '9999';
  logsContainer.style.fontSize = '12px';
  logsContainer.style.fontFamily = 'monospace';
  
  // Ajouter une façon de le fermer
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    document.body.removeChild(logsContainer);
  };
  
  logsContainer.appendChild(closeButton);
  
  // Ajouter un titre
  const title = document.createElement('div');
  title.textContent = 'Logs de démarrage';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '5px';
  logsContainer.appendChild(title);
  
  document.body.appendChild(logsContainer);
  
  logInfo('Environnement: ' + import.meta.env.MODE);
  logInfo('IndexedDB disponible: ' + (typeof indexedDB !== 'undefined'));
}

// Marquer l'application comme chargée dès que React commence à rendre
if (typeof window !== 'undefined' && (window as any).markAppAsLoaded) {
  (window as any).markAppAsLoaded();
  logInfo('App marked as loaded');
}

// Fonction pour rendre l'application
const renderApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  try {
    logInfo('Rendering app...');
    createRoot(rootElement).render(<App />);
    logInfo('App rendered successfully');
  } catch (renderError) {
    console.error('Error rendering App:', renderError);
    logInfo('Error rendering App: ' + String(renderError));
    
    // Afficher une page d'erreur basique
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        <h1 style="color: #d32f2f;">Erreur lors du démarrage de l'application</h1>
        <p>Une erreur est survenue pendant le chargement. Veuillez essayer de recharger la page.</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; max-width: 80%; overflow: auto;">${String(renderError)}</pre>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">Recharger</button>
        <a href="#/basic-test" style="margin-top: 10px; color: #2196f3;">Aller à la page de test basique</a>
      </div>
    `;
  }
};

// Initialiser IndexedDB avant de rendre l'application
logInfo('Initializing IndexedDB...');

// Vérifier si IndexedDB est disponible
if (typeof indexedDB === 'undefined') {
  logInfo('IndexedDB is not available in this browser!');
  renderApp(); // Rendre l'application quand même
} else {
  // Essayer d'initialiser IndexedDB
  import('./lib/enhancedIndexedDB').then(() => {
    logInfo('IndexedDB initialized successfully');
    renderApp();
  }).catch(error => {
    console.error('Error initializing IndexedDB:', error);
    logInfo('Error initializing IndexedDB: ' + String(error));
    renderApp(); // Rendre l'application malgré l'erreur
  });
}
