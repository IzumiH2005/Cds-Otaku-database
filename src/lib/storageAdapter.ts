/**
 * Adaptateur de stockage utilisant IndexedDB pour stocker de grandes quantités de données.
 * 
 * Ce module utilise IndexedDB pour le stockage des données, permettant de gérer
 * des milliers de flashcards et d'autres objets sans limitation de taille.
 */

import * as LocalStorage from './localStorage';
import * as IndexedDB from './indexedDB';
import { User, Deck, Theme, Flashcard, SharedDeckExport } from './localStorage';

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
    console.error('IndexedDB n\'est pas supporté par ce navigateur. L\'application pourrait ne pas fonctionner correctement.');
    // Continuer quand même avec les fonctions IndexedDB, qui géreront les erreurs et fourniront des valeurs par défaut
    return;
  }
  
  // Vérifier si la migration a déjà été effectuée
  migrationCompleted = localStorage.getItem('indexeddb-migration-completed') === 'true';
  
  // Si la migration n'a pas été faite
  if (!migrationCompleted) {
    try {
      console.log('Migration des données de localStorage vers IndexedDB...');
      await IndexedDB.migrateFromLocalStorage();
      migrationCompleted = true;
      localStorage.setItem('indexeddb-migration-completed', 'true');
      console.log('Migration terminée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la migration vers IndexedDB:', error);
      // Quand même continuer avec IndexedDB, les fonctions géreront les erreurs
    }
  }
}

// Fonctions User
export async function getUser(): Promise<User | null> {
  try {
    return await IndexedDB.getUser();
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

export async function setUser(user: User): Promise<void> {
  try {
    await IndexedDB.setUser(user);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
  }
}

export async function updateUser(userData: Partial<User>): Promise<User | null> {
  try {
    return await IndexedDB.updateUser(userData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return null;
  }
}

// Fonctions Deck
export async function getDecks(): Promise<Deck[]> {
  try {
    return await IndexedDB.getDecks();
  } catch (error) {
    console.error('Erreur lors de la récupération des decks:', error);
    return [];
  }
}

export async function getDeck(id: string): Promise<Deck | null> {
  try {
    return await IndexedDB.getDeck(id);
  } catch (error) {
    console.error(`Erreur lors de la récupération du deck ${id}:`, error);
    return null;
  }
}

export async function createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
  try {
    return await IndexedDB.createDeck(deck);
  } catch (error) {
    console.error('Erreur lors de la création du deck:', error);
    throw new Error('Impossible de créer le deck');
  }
}

export async function updateDeck(id: string, deckData: Partial<Deck>): Promise<Deck | null> {
  try {
    return await IndexedDB.updateDeck(id, deckData);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du deck ${id}:`, error);
    return null;
  }
}

export async function deleteDeck(id: string): Promise<boolean> {
  try {
    return await IndexedDB.deleteDeck(id);
  } catch (error) {
    console.error(`Erreur lors de la suppression du deck ${id}:`, error);
    return false;
  }
}

// Fonctions Theme
export async function getThemes(): Promise<Theme[]> {
  try {
    return await IndexedDB.getThemes();
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error);
    return [];
  }
}

export async function getThemesByDeck(deckId: string): Promise<Theme[]> {
  try {
    return await IndexedDB.getThemesByDeck(deckId);
  } catch (error) {
    console.error(`Erreur lors de la récupération des thèmes du deck ${deckId}:`, error);
    return [];
  }
}

export async function getTheme(id: string): Promise<Theme | undefined> {
  try {
    return await IndexedDB.getTheme(id);
  } catch (error) {
    console.error(`Erreur lors de la récupération du thème ${id}:`, error);
    return undefined;
  }
}

export async function createTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<Theme> {
  try {
    return await IndexedDB.createTheme(theme);
  } catch (error) {
    console.error('Erreur lors de la création du thème:', error);
    throw new Error('Impossible de créer le thème');
  }
}

export async function updateTheme(id: string, themeData: Partial<Theme>): Promise<Theme | null> {
  try {
    return await IndexedDB.updateTheme(id, themeData);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du thème ${id}:`, error);
    return null;
  }
}

export async function deleteTheme(id: string): Promise<boolean> {
  try {
    return await IndexedDB.deleteTheme(id);
  } catch (error) {
    console.error(`Erreur lors de la suppression du thème ${id}:`, error);
    return false;
  }
}

// Fonctions Flashcard
export async function getFlashcards(): Promise<Flashcard[]> {
  try {
    return await IndexedDB.getFlashcards();
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    return [];
  }
}

export async function getFlashcardsByDeck(deckId: string): Promise<Flashcard[]> {
  try {
    return await IndexedDB.getFlashcardsByDeck(deckId);
  } catch (error) {
    console.error(`Erreur lors de la récupération des flashcards du deck ${deckId}:`, error);
    return [];
  }
}

export async function getFlashcardsByTheme(themeId: string): Promise<Flashcard[]> {
  try {
    return await IndexedDB.getFlashcardsByTheme(themeId);
  } catch (error) {
    console.error(`Erreur lors de la récupération des flashcards du thème ${themeId}:`, error);
    return [];
  }
}

export async function getFlashcard(id: string): Promise<Flashcard | undefined> {
  try {
    return await IndexedDB.getFlashcard(id);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la flashcard ${id}:`, error);
    return undefined;
  }
}

export async function createFlashcard(flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flashcard> {
  try {
    return await IndexedDB.createFlashcard(flashcard);
  } catch (error) {
    console.error('Erreur lors de la création de la flashcard:', error);
    throw new Error('Impossible de créer la flashcard');
  }
}

export async function updateFlashcard(id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> {
  try {
    return await IndexedDB.updateFlashcard(id, cardData);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la flashcard ${id}:`, error);
    return null;
  }
}

export async function deleteFlashcard(id: string): Promise<boolean> {
  try {
    return await IndexedDB.deleteFlashcard(id);
  } catch (error) {
    console.error(`Erreur lors de la suppression de la flashcard ${id}:`, error);
    return false;
  }
}

// Fonctions SharedDeck
export async function getSharedDeckCodes(): Promise<any[]> {
  try {
    return await IndexedDB.getSharedDeckCodes();
  } catch (error) {
    console.error('Erreur lors de la récupération des codes de partage:', error);
    return [];
  }
}

export async function createShareCode(deckId: string, expiresInDays?: number): Promise<string> {
  try {
    return await IndexedDB.createShareCode(deckId, expiresInDays);
  } catch (error) {
    console.error(`Erreur lors de la création du code de partage pour le deck ${deckId}:`, error);
    throw new Error('Impossible de créer le code de partage');
  }
}

export async function getSharedDeck(code: string): Promise<Deck | undefined> {
  try {
    return await IndexedDB.getSharedDeck(code);
  } catch (error) {
    console.error(`Erreur lors de la récupération du deck partagé avec le code ${code}:`, error);
    return undefined;
  }
}

// Fonctions d'export/import de decks
export async function exportDeckToJson(deckId: string): Promise<SharedDeckExport> {
  try {
    return await IndexedDB.exportDeckToJson(deckId);
  } catch (error) {
    console.error(`Erreur lors de l'export du deck ${deckId} en JSON:`, error);
    throw new Error('Impossible d\'exporter le deck');
  }
}

export async function importDeckFromJson(sharedDeckData: SharedDeckExport, authorId: string): Promise<string> {
  try {
    return await IndexedDB.importDeckFromJson(sharedDeckData, authorId);
  } catch (error) {
    console.error('Erreur lors de l\'import du deck:', error);
    throw new Error('Impossible d\'importer le deck');
  }
}

export async function updateDeckFromJson(sharedDeckData: SharedDeckExport): Promise<boolean> {
  try {
    return await IndexedDB.updateDeckFromJson(sharedDeckData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du deck depuis le JSON:', error);
    return false;
  }
}

// Fonctions pour les decks partagés importés
export async function getSharedImportedDecks(): Promise<{originalId: string, localDeckId: string}[]> {
  try {
    return await IndexedDB.getSharedImportedDecks();
  } catch (error) {
    console.error('Erreur lors de la récupération des decks importés:', error);
    return [];
  }
}