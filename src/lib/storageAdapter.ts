/**
 * Adaptateur de stockage qui encapsule l'accès à localStorage ou IndexedDB
 * selon la configuration et la disponibilité.
 * 
 * Ce module fournit une API cohérente quel que soit le backend utilisé,
 * permettant ainsi une transition en douceur entre les différentes
 * méthodes de stockage.
 */

import * as LocalStorage from './localStorage';
import * as IndexedDB from './indexedDB';
import { User, Deck, Theme, Flashcard, SharedDeckExport } from './localStorage';

// Flag pour activer/désactiver l'utilisation d'IndexedDB
let useIndexedDB = true;

// Flag pour suivre l'état de migration
let migrationCompleted = false;

/**
 * Initialise l'adaptateur de stockage
 * Vérifie si IndexedDB est supporté et disponible, 
 * et effectue la migration des données si nécessaire
 */
export async function initStorageAdapter(): Promise<void> {
  // Vérifier si IndexedDB est supporté par le navigateur
  if (!window.indexedDB) {
    console.warn('IndexedDB n\'est pas supporté par ce navigateur. Utilisation de localStorage.');
    useIndexedDB = false;
    return;
  }
  
  // Vérifier si la migration a déjà été effectuée
  migrationCompleted = localStorage.getItem('indexeddb-migration-completed') === 'true';
  
  // Si on veut utiliser IndexedDB et que la migration n'a pas été faite
  if (useIndexedDB && !migrationCompleted) {
    try {
      console.log('Migration des données de localStorage vers IndexedDB...');
      await IndexedDB.migrateFromLocalStorage();
      migrationCompleted = true;
      console.log('Migration terminée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la migration vers IndexedDB:', error);
      console.warn('Retour à localStorage suite à une erreur de migration.');
      useIndexedDB = false;
    }
  }
}

/**
 * Change le backend de stockage utilisé
 * @param useIDB True pour utiliser IndexedDB, false pour utiliser localStorage
 */
export function setStorageBackend(useIDB: boolean): void {
  // Ne pas changer pour IndexedDB si la migration n'a pas été effectuée
  if (useIDB && !migrationCompleted) {
    console.warn('Impossible d\'utiliser IndexedDB sans migration préalable.');
    return;
  }
  
  useIndexedDB = useIDB;
  console.log(`Stockage réglé sur: ${useIDB ? 'IndexedDB' : 'localStorage'}`);
}

/**
 * Méthode d'assistance pour appeler la fonction appropriée en fonction du backend
 */
async function callAppropriateFunction<T>(
  localStorageFunction: (...args: any[]) => T,
  indexedDBFunction: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  if (useIndexedDB) {
    try {
      return await indexedDBFunction(...args);
    } catch (error) {
      console.error('Erreur avec IndexedDB, fallback sur localStorage:', error);
      return localStorageFunction(...args);
    }
  } else {
    return localStorageFunction(...args);
  }
}

// Fonctions User
export async function getUser(): Promise<User | null> {
  return await callAppropriateFunction(
    LocalStorage.getUser,
    IndexedDB.getUser
  );
}

export async function setUser(user: User): Promise<void> {
  if (useIndexedDB) {
    await IndexedDB.setUser(user);
  } else {
    LocalStorage.setUser(user);
  }
}

export async function updateUser(userData: Partial<User>): Promise<User | null> {
  return await callAppropriateFunction(
    LocalStorage.updateUser,
    IndexedDB.updateUser,
    userData
  );
}

// Fonctions Deck
export async function getDecks(): Promise<Deck[]> {
  return await callAppropriateFunction(
    LocalStorage.getDecks,
    IndexedDB.getDecks
  );
}

export async function getDeck(id: string): Promise<Deck | null> {
  return await callAppropriateFunction(
    LocalStorage.getDeck,
    IndexedDB.getDeck,
    id
  );
}

export async function createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
  return await callAppropriateFunction(
    LocalStorage.createDeck,
    IndexedDB.createDeck,
    deck
  );
}

export async function updateDeck(id: string, deckData: Partial<Deck>): Promise<Deck | null> {
  return await callAppropriateFunction(
    LocalStorage.updateDeck,
    IndexedDB.updateDeck,
    id,
    deckData
  );
}

export async function deleteDeck(id: string): Promise<boolean> {
  return await callAppropriateFunction(
    LocalStorage.deleteDeck,
    IndexedDB.deleteDeck,
    id
  );
}

// Fonctions Theme
export async function getThemes(): Promise<Theme[]> {
  return await callAppropriateFunction(
    LocalStorage.getThemes,
    IndexedDB.getThemes
  );
}

export async function getThemesByDeck(deckId: string): Promise<Theme[]> {
  return await callAppropriateFunction(
    LocalStorage.getThemesByDeck,
    IndexedDB.getThemesByDeck,
    deckId
  );
}

export async function getTheme(id: string): Promise<Theme | undefined> {
  return await callAppropriateFunction(
    LocalStorage.getTheme,
    IndexedDB.getTheme,
    id
  );
}

export async function createTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<Theme> {
  return await callAppropriateFunction(
    LocalStorage.createTheme,
    IndexedDB.createTheme,
    theme
  );
}

export async function updateTheme(id: string, themeData: Partial<Theme>): Promise<Theme | null> {
  return await callAppropriateFunction(
    LocalStorage.updateTheme,
    IndexedDB.updateTheme,
    id,
    themeData
  );
}

export async function deleteTheme(id: string): Promise<boolean> {
  return await callAppropriateFunction(
    LocalStorage.deleteTheme,
    IndexedDB.deleteTheme,
    id
  );
}

// Fonctions Flashcard
export async function getFlashcards(): Promise<Flashcard[]> {
  return await callAppropriateFunction(
    LocalStorage.getFlashcards,
    IndexedDB.getFlashcards
  );
}

export async function getFlashcardsByDeck(deckId: string): Promise<Flashcard[]> {
  return await callAppropriateFunction(
    LocalStorage.getFlashcardsByDeck,
    IndexedDB.getFlashcardsByDeck,
    deckId
  );
}

export async function getFlashcardsByTheme(themeId: string): Promise<Flashcard[]> {
  return await callAppropriateFunction(
    LocalStorage.getFlashcardsByTheme,
    IndexedDB.getFlashcardsByTheme,
    themeId
  );
}

export async function getFlashcard(id: string): Promise<Flashcard | undefined> {
  return await callAppropriateFunction(
    LocalStorage.getFlashcard,
    IndexedDB.getFlashcard,
    id
  );
}

export async function createFlashcard(flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flashcard> {
  return await callAppropriateFunction(
    LocalStorage.createFlashcard,
    IndexedDB.createFlashcard,
    flashcard
  );
}

export async function updateFlashcard(id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> {
  return await callAppropriateFunction(
    LocalStorage.updateFlashcard,
    IndexedDB.updateFlashcard,
    id,
    cardData
  );
}

export async function deleteFlashcard(id: string): Promise<boolean> {
  return await callAppropriateFunction(
    LocalStorage.deleteFlashcard,
    IndexedDB.deleteFlashcard,
    id
  );
}

// Fonctions SharedDeck
export async function getSharedDeckCodes(): Promise<any[]> {
  return await callAppropriateFunction(
    LocalStorage.getSharedDeckCodes,
    IndexedDB.getSharedDeckCodes
  );
}

export async function createShareCode(deckId: string, expiresInDays?: number): Promise<string> {
  return await callAppropriateFunction(
    LocalStorage.createShareCode,
    IndexedDB.createShareCode,
    deckId,
    expiresInDays
  );
}

export async function getSharedDeck(code: string): Promise<Deck | undefined> {
  return await callAppropriateFunction(
    LocalStorage.getSharedDeck,
    IndexedDB.getSharedDeck,
    code
  );
}

// Fonctions d'export/import de decks
export async function exportDeckToJson(deckId: string): Promise<SharedDeckExport> {
  return await callAppropriateFunction(
    LocalStorage.exportDeckToJson,
    IndexedDB.exportDeckToJson,
    deckId
  );
}

export async function importDeckFromJson(sharedDeckData: SharedDeckExport, authorId: string): Promise<string> {
  return await callAppropriateFunction(
    LocalStorage.importDeckFromJson,
    IndexedDB.importDeckFromJson,
    sharedDeckData,
    authorId
  );
}

export async function updateDeckFromJson(sharedDeckData: SharedDeckExport): Promise<boolean> {
  return await callAppropriateFunction(
    LocalStorage.updateDeckFromJson,
    IndexedDB.updateDeckFromJson,
    sharedDeckData
  );
}

// Fonctions pour les decks partagés importés
export async function getSharedImportedDecks(): Promise<{originalId: string, localDeckId: string}[]> {
  // Cette fonction a besoin d'être adaptée car l'implémentation diffère entre localStorage et IndexedDB
  if (useIndexedDB) {
    try {
      return await IndexedDB.getSharedImportedDecks();
    } catch (error) {
      console.error('Erreur avec IndexedDB, fallback sur localStorage:', error);
      return LocalStorage.getSharedImportedDecks();
    }
  } else {
    return LocalStorage.getSharedImportedDecks();
  }
}