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
// Variable pour stocker l'ID d'intervalle afin de pouvoir l'arrêter si nécessaire
let cleanupIntervalId: number | null = null;

export function schedulePeriodicCleanup(intervalInMinutes: number = 60): void {
  console.log(`Programmation du nettoyage des fichiers audio toutes les ${intervalInMinutes} minutes`);
  
  // Nettoyer tout intervalle existant pour éviter les doublons
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
  
  // Planifier le nettoyage périodique avec une encapsulation de sécurité
  cleanupIntervalId = window.setInterval(() => {
    // Utiliser requestIdleCallback si disponible (pour ne pas interférer avec l'interface utilisateur)
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        cleanupUnusedAudioFiles().catch(err => 
          console.error('Erreur lors du nettoyage périodique des fichiers audio:', err)
        );
      }, { timeout: 10000 }); // Timeout de 10 secondes max
    } else {
      // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
      setTimeout(() => {
        cleanupUnusedAudioFiles().catch(err => 
          console.error('Erreur lors du nettoyage périodique des fichiers audio:', err)
        );
      }, 500); // Petit délai pour ne pas bloquer le thread principal
    }
  }, intervalInMinutes * 60 * 1000);
  
  // S'assurer que l'intervalle est effacé lorsque la page est fermée
  window.addEventListener('beforeunload', () => {
    if (cleanupIntervalId !== null) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
  });
  
  // Effectuer un premier nettoyage après un délai plus important pour permettre
  // à l'application de se charger complètement d'abord
  setTimeout(() => {
    // Utiliser requestIdleCallback pour le premier nettoyage également
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        cleanupUnusedAudioFiles().catch(console.error);
      }, { timeout: 10000 });
    } else {
      cleanupUnusedAudioFiles().catch(console.error);
    }
  }, 60000); // Augmenter à 60 secondes pour s'assurer que l'application est stable
}