/**
 * Service de nettoyage périodique des fichiers audio non utilisés dans IndexedDB
 */

import * as indexedDB from './indexedDB';
import { getFlashcards } from './localStorage';

/**
 * Nettoie les fichiers audio non utilisés dans IndexedDB
 * @returns Une promesse qui se résout lorsque le nettoyage est terminé
 */
export async function cleanupUnusedAudioFiles(): Promise<void> {
  try {
    console.log('Début du nettoyage des fichiers audio...');
    
    // Récupérer toutes les cartes existantes
    const allCards = getFlashcards();
    
    // Collecter tous les IDs audio utilisés
    const usedAudioIds: string[] = [];
    
    allCards.forEach(card => {
      // Vérifier si le recto a un audio dans IndexedDB
      if (card.front?.audio && card.front.audio.startsWith('indexeddb:')) {
        const audioId = card.front.audio.replace('indexeddb:', '');
        usedAudioIds.push(audioId);
      }
      
      // Vérifier si le verso a un audio dans IndexedDB
      if (card.back?.audio && card.back.audio.startsWith('indexeddb:')) {
        const audioId = card.back.audio.replace('indexeddb:', '');
        usedAudioIds.push(audioId);
      }
    });
    
    console.log(`Fichiers audio utilisés: ${usedAudioIds.length}`);
    
    // Supprimer tous les fichiers audio qui ne sont pas utilisés
    await indexedDB.cleanupUnusedAudioFiles(usedAudioIds);
    
    console.log('Nettoyage des fichiers audio terminé');
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers audio:', error);
  }
}

/**
 * Programme un nettoyage périodique des fichiers audio
 * @param intervalInMinutes L'intervalle en minutes entre chaque nettoyage
 */
export function schedulePeriodicCleanup(intervalInMinutes: number = 60): void {
  console.log(`Programmation du nettoyage des fichiers audio toutes les ${intervalInMinutes} minutes`);
  
  // Planifier le nettoyage périodique
  const intervalId = setInterval(() => {
    cleanupUnusedAudioFiles().catch(console.error);
  }, intervalInMinutes * 60 * 1000);
  
  // S'assurer que l'intervalle est effacé lorsque la page est fermée
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });
  
  // Effectuer un premier nettoyage après démarrage
  setTimeout(() => {
    cleanupUnusedAudioFiles().catch(console.error);
  }, 30000); // Attendre 30 secondes pour le premier nettoyage
}