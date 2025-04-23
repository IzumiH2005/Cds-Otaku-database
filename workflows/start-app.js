console.log('🚀 Démarrage de l\'application...');

import { spawn } from 'child_process';
import process from 'process';

// Démarrer l'application avec Vite en mode développement
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
});

// Gérer la sortie propre
process.on('SIGINT', () => {
  console.log('Arrêt de l\'application...');
  vite.kill('SIGINT');
  process.exit(0);
});

vite.on('error', (error) => {
  console.error('Erreur lors du démarrage de l\'application:', error);
  process.exit(1);
});

vite.on('close', (code) => {
  console.log(`L'application s'est arrêtée avec le code: ${code}`);
  process.exit(code);
});