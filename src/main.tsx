import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import SimpleIndex from './pages/SimpleIndex.tsx'
import { HashRouter } from 'react-router-dom'
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
  
  // Vérifier le mode d'exécution (complet ou diagnostic)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const shouldUseFullApp = mode === 'full';
  
  try {
    if (shouldUseFullApp) {
      logInfo('Attempting to render full application as requested...');
      
      // Utiliser l'application complète
      createRoot(rootElement).render(<App />);
      
      logInfo('Full app rendered successfully');
      
      // Ajouter un message pour indiquer que nous sommes en mode complet avec diagnostic
      const fullModeMessage = document.createElement('div');
      fullModeMessage.style.position = 'fixed';
      fullModeMessage.style.top = '10px';
      fullModeMessage.style.left = '10px';
      fullModeMessage.style.padding = '10px';
      fullModeMessage.style.backgroundColor = 'rgba(0, 180, 0, 0.8)';
      fullModeMessage.style.color = 'white';
      fullModeMessage.style.borderRadius = '5px';
      fullModeMessage.style.fontFamily = 'sans-serif';
      fullModeMessage.style.fontSize = '14px';
      fullModeMessage.style.zIndex = '9999';
      fullModeMessage.style.maxWidth = '300px';
      fullModeMessage.innerHTML = '<strong>Application complète</strong><br>L\'application complète est chargée.<br><a href="/?mode=diagnostic" style="color: yellow;">Revenir au mode diagnostic</a>';
      
      document.body.appendChild(fullModeMessage);
    } else {
      logInfo('Rendering simplified app for diagnostic...');
      
      // Utiliser SimpleIndex pour test et diagnostic - une page simplifiée sans dépendances complexes
      createRoot(rootElement).render(
        <HashRouter>
          <SimpleIndex />
        </HashRouter>
      );
      
      logInfo('Simple app rendered successfully');
      
      // Ajouter un message pour indiquer que nous n'utilisons pas l'application complète
      const diagMessage = document.createElement('div');
      diagMessage.style.position = 'fixed';
      diagMessage.style.top = '10px';
      diagMessage.style.left = '10px';
      diagMessage.style.padding = '10px';
      diagMessage.style.backgroundColor = 'rgba(255, 200, 0, 0.9)';
      diagMessage.style.color = 'black';
      diagMessage.style.borderRadius = '5px';
      diagMessage.style.fontFamily = 'sans-serif';
      diagMessage.style.fontSize = '14px';
      diagMessage.style.zIndex = '9999';
      diagMessage.style.maxWidth = '300px';
      diagMessage.innerHTML = '<strong>Mode diagnostic</strong><br>Interface simplifiée chargée pour résoudre les problèmes.<br><a href="/?mode=full" style="color: blue;">Tenter de charger l\'application complète</a>';
      
      document.body.appendChild(diagMessage);
    }
  } catch (renderError) {
    console.error('Error rendering app:', renderError);
    logInfo('Error rendering app: ' + String(renderError));
    
    // Afficher une page d'erreur basique
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        <h1 style="color: #d32f2f;">Erreur lors du démarrage de l'application</h1>
        <p>Une erreur est survenue pendant le chargement${shouldUseFullApp ? ' de l\'application complète' : ' de la version simplifiée'}. </p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; max-width: 80%; overflow: auto;">${String(renderError)}</pre>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button onclick="location.reload()" style="padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">Recharger</button>
          ${shouldUseFullApp ? '<a href="/?mode=diagnostic" style="padding: 10px 20px; background: #ff9800; color: white; border: none; border-radius: 4px; text-decoration: none;">Revenir au mode diagnostic</a>' : ''}
        </div>
      </div>
    `;
  }
};

// Initialiser IndexedDB et le système de sauvegarde avant de rendre l'application
logInfo('Initializing storage systems...');

// Vérifier si IndexedDB est disponible
if (typeof indexedDB === 'undefined') {
  logInfo('IndexedDB is not available in this browser!');
  
  // Initialiser uniquement le système de sauvegarde
  import('./lib/storageBackup').then(({ initBackupSystem, ensureDefaultValues }) => {
    logInfo('Backup system initialized (using localStorage only)');
    initBackupSystem();
    ensureDefaultValues();
    logInfo('Created default values for all required data types');
    renderApp();
  }).catch(error => {
    console.error('Error initializing backup system:', error);
    logInfo('Error initializing backup system: ' + String(error));
    
    // Même si le système de sauvegarde a échoué, tenter de créer des valeurs par défaut minimales
    // pour éviter un plantage complet de l'application
    try {
      if (!localStorage.getItem('sessionKey')) {
        const tempSessionKey = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('sessionKey', tempSessionKey);
        logInfo('Emergency fallback: Created session key');
      }
    } catch (e) {
      logInfo('Complete failure - cannot write to localStorage');
    }
    
    renderApp(); // Rendre l'application malgré l'erreur
  });
} else {
  // Initialiser à la fois IndexedDB et le système de sauvegarde
  Promise.all([
    import('./lib/enhancedIndexedDB'),
    import('./lib/storageBackup')
  ]).then(([indexedDBModule, backupModule]) => {
    logInfo('IndexedDB initialized successfully');
    backupModule.initBackupSystem();
    backupModule.ensureDefaultValues();
    logInfo('Backup system initialized and synchronized with IndexedDB');
    
    // Vérifier s'il y a des données à récupérer depuis localStorage
    const sessionKey = localStorage.getItem('sessionKey');
    if (sessionKey) {
      logInfo('Existing session found in localStorage, will be synchronized with IndexedDB');
    }
    
    renderApp();
  }).catch(error => {
    console.error('Error initializing storage systems:', error);
    logInfo('Error initializing storage systems: ' + String(error));
    
    // Tenter d'initialiser uniquement le système de sauvegarde
    import('./lib/storageBackup').then(({ initBackupSystem, ensureDefaultValues }) => {
      logInfo('Fallback to backup system only');
      initBackupSystem();
      ensureDefaultValues();
      logInfo('Created default values for all required data types');
      renderApp();
    }).catch(() => {
      logInfo('Complete storage initialization failure!');
      
      // Dernier recours - créer des données minimales directement
      try {
        if (!localStorage.getItem('sessionKey')) {
          const tempSessionKey = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('sessionKey', tempSessionKey);
          logInfo('Last resort: Created basic session key');
        }
      } catch (e) {
        logInfo('Complete failure - cannot write to localStorage');
      }
      
      renderApp(); // Rendre l'application malgré l'erreur
    });
  });
}
