/**
 * Couche de compatibilité entre localStorage et IndexedDB
 * Ce fichier fournit des fonctions synchrones pour les composants qui n'ont pas été mis à jour
 * pour utiliser les versions asynchrones des fonctions de stockage.
 */

import {
  User, Deck, Theme, Flashcard, SharedDeckExport,
  getUser, getDecks, getDeck, getThemes, getThemesByDeck, getFlashcards, getFlashcardsByDeck,
  getFlashcardsByTheme, getFlashcard, getTheme, getSharedDeckCodes, getSharedDeck,
  getSharedImportedDecks, isSharedImportedDeck, getOriginalDeckIdForImported,
  setUser, updateUser, createDeck, updateDeck, deleteDeck, createTheme, updateTheme,
  deleteTheme, createFlashcard, updateFlashcard, deleteFlashcard, createShareCode,
  exportDeckToJson, importDeckFromJson, updateDeckFromJson, publishDeck, unpublishDeck,
  updatePublishedDeck, getBase64, generateSampleData
} from './localStorage';

// Fonctions de compatibilité synchrone
export { getUserSync as getUser } from './localStorage';
export { getDecksSync as getDecks } from './localStorage';
export { getDeckSync as getDeck } from './localStorage';
export { getThemesSync as getThemes } from './localStorage';
export { getThemesByDeckSync as getThemesByDeck } from './localStorage';
export { getFlashcardsSync as getFlashcards } from './localStorage';
export { getFlashcardsByDeckSync as getFlashcardsByDeck } from './localStorage';

// Fonctions asynchrones avec wrappers synchrones
export const getFlashcardsByThemeSync = (themeId: string): Flashcard[] => {
  let result: Flashcard[] = [];
  getFlashcardsByTheme(themeId).then(cards => { result = cards; });
  return result;
};

export const getFlashcardSync = (id: string): Flashcard | undefined => {
  let result: Flashcard | undefined = undefined;
  getFlashcard(id).then(card => { result = card; });
  return result;
};

export const getThemeSync = (id: string): Theme | undefined => {
  let result: Theme | undefined = undefined;
  getTheme(id).then(theme => { result = theme; });
  return result;
};

export const getSharedDeckCodesSync = (): { code: string, deckId: string, expiresAt?: string }[] => {
  let result: { code: string, deckId: string, expiresAt?: string }[] = [];
  getSharedDeckCodes().then(codes => { result = codes; });
  return result;
};

export const getSharedDeckSync = (code: string): Deck | undefined => {
  let result: Deck | undefined = undefined;
  getSharedDeck(code).then(deck => { result = deck; });
  return result;
};

export const getSharedImportedDecksSync = (): {originalId: string, localDeckId: string}[] => {
  let result: {originalId: string, localDeckId: string}[] = [];
  getSharedImportedDecks().then(decks => { result = decks; });
  return result;
};

export const isSharedImportedDeckSync = (deckId: string): boolean => {
  let result = false;
  isSharedImportedDeck(deckId).then(isImported => { result = isImported; });
  return result;
};

export const getOriginalDeckIdForImportedSync = (deckId: string): string | null => {
  let result: string | null = null;
  getOriginalDeckIdForImported(deckId).then(id => { result = id; });
  return result;
};

// Fonctions d'écriture
export const setUserSync = (user: User): void => {
  setUser(user).catch(error => {
    console.error("Error in setUserSync:", error);
  });
};

export const updateUserSync = (userData: Partial<User>): User | null => {
  let result: User | null = null;
  updateUser(userData).then(user => { result = user; });
  return result;
};

export const createDeckSync = (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Deck | null => {
  let result: Deck | null = null;
  createDeck(deck).then(newDeck => { result = newDeck; });
  return result;
};

export const updateDeckSync = (id: string, deckData: Partial<Deck>): Deck | null => {
  let result: Deck | null = null;
  updateDeck(id, deckData).then(updatedDeck => { result = updatedDeck; });
  return result;
};

export const deleteDeckSync = (id: string): boolean => {
  let result = false;
  deleteDeck(id).then(success => { result = success; });
  return result;
};

export const createThemeSync = (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Theme | null => {
  let result: Theme | null = null;
  createTheme(theme).then(newTheme => { result = newTheme; });
  return result;
};

export const updateThemeSync = (id: string, themeData: Partial<Theme>): Theme | null => {
  let result: Theme | null = null;
  updateTheme(id, themeData).then(updatedTheme => { result = updatedTheme; });
  return result;
};

export const deleteThemeSync = (id: string): boolean => {
  let result = false;
  deleteTheme(id).then(success => { result = success; });
  return result;
};

export const createFlashcardSync = (flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Flashcard | null => {
  let result: Flashcard | null = null;
  createFlashcard(flashcard).then(newCard => { result = newCard; });
  return result;
};

export const updateFlashcardSync = (id: string, cardData: Partial<Flashcard>): Flashcard | null => {
  let result: Flashcard | null = null;
  updateFlashcard(id, cardData).then(updatedCard => { result = updatedCard; });
  return result;
};

export const deleteFlashcardSync = (id: string): boolean => {
  let result = false;
  deleteFlashcard(id).then(success => { result = success; });
  return result;
};

export const createShareCodeSync = (deckId: string, expiresInDays?: number): string => {
  let result = "";
  createShareCode(deckId, expiresInDays).then(code => { result = code; });
  return result;
};

export const exportDeckToJsonSync = (deckId: string): SharedDeckExport | null => {
  let result: SharedDeckExport | null = null;
  exportDeckToJson(deckId).then(exported => { result = exported; });
  return result;
};

export const importDeckFromJsonSync = (sharedDeckData: SharedDeckExport, authorId: string): string => {
  let result = "";
  importDeckFromJson(sharedDeckData, authorId).then(id => { result = id; });
  return result;
};

export const updateDeckFromJsonSync = (sharedDeckData: SharedDeckExport): boolean => {
  let result = false;
  updateDeckFromJson(sharedDeckData).then(success => { result = success; });
  return result;
};

export const publishDeckSync = (deckId: string): boolean => {
  let result = false;
  publishDeck(deckId).then(success => { result = success; });
  return result;
};

export const unpublishDeckSync = (deckId: string): boolean => {
  let result = false;
  unpublishDeck(deckId).then(success => { result = success; });
  return result;
};

export const updatePublishedDeckSync = (deckId: string, deckData: Partial<Deck>): Deck | null => {
  let result: Deck | null = null;
  updatePublishedDeck(deckId, deckData).then(updatedDeck => { result = updatedDeck; });
  return result;
};

export const generateSampleDataSync = (): void => {
  generateSampleData().catch(error => {
    console.error("Error generating sample data:", error);
  });
};
export { generateSampleDataSync as generateSampleData };

// Réexporter les types pour faciliter l'importation
export type { User, Deck, Theme, Flashcard, SharedDeckExport };

// Réexporter les fonctions utilitaires non-liées au stockage
export { getBase64 };