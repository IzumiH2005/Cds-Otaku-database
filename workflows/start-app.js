// Workflow pour démarrer l'application
import { spawn } from 'child_process';

console.log('🚀 Démarrage de l\'application...');

// Démarrer l'application avec npm
const app = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

app.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage de l\'application:', error);
  process.exit(1);
});

// Gestion des signaux pour arrêter proprement l'application
process.on('SIGINT', () => {
  console.log('🛑 Arrêt de l\'application...');
  app.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt de l\'application...');
  app.kill('SIGTERM');
});