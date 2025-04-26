/**
 * Couche de compatibilité entre localStorage et IndexedDB
 * AVERTISSEMENT : Ce fichier fournit des fonctions synchrones simplifiées
 * qui retournent des valeurs par défaut. Il est recommandé d'utiliser
 * directement les fonctions asynchrones de enhancedIndexedDB.ts
 */

import { User, Deck, Theme, Flashcard } from './localStorage';

// Exports pour maintenir la compatibilité avec le code existant
export { 
  User, Deck, Theme, Flashcard
} from './localStorage';

// Fonctions synchrones simplifiées qui retournent des valeurs par défaut
export const getUser = (): User | null => null;
export const getDecks = (): Deck[] => [];
export const getDeck = (id: string): Deck | null => null;
export const getThemes = (): Theme[] => [];
export const getThemesByDeck = (deckId: string): Theme[] => [];
export const getFlashcards = (): Flashcard[] => [];
export const getFlashcardsByDeck = (deckId: string): Flashcard[] => [];
export const getFlashcardsByTheme = (themeId: string): Flashcard[] => [];
export const getFlashcard = (id: string): Flashcard | undefined => undefined;
export const getTheme = (id: string): Theme | undefined => undefined;
export const getSharedDeckCodes = (): { code: string, deckId: string, expiresAt?: string }[] => [];
export const getSharedDeck = (code: string): Deck | undefined => undefined;
export const getSharedImportedDecks = (): {originalId: string, localDeckId: string}[] => [];
export const isSharedImportedDeck = (deckId: string): boolean => false;
export const getOriginalDeckIdForImported = (deckId: string): string | null => null;

// Fonctions d'écriture qui ne font rien
export const setUser = (user: User): void => {};
export const updateUser = (userData: Partial<User>): User | null => null;
export const createDeck = (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Deck | null => null;
export const updateDeck = (id: string, deckData: Partial<Deck>): Deck | null => null;
export const deleteDeck = (id: string): boolean => false;
export const createTheme = (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Theme | null => null;
export const updateTheme = (id: string, themeData: Partial<Theme>): Theme | null => null;
export const deleteTheme = (id: string): boolean => false;
export const createFlashcard = (card: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Flashcard | null => null;
export const updateFlashcard = (id: string, cardData: Partial<Flashcard>): Flashcard | null => null;
export const deleteFlashcard = (id: string): boolean => false;
export const createShareCode = (deckId: string): string => "";

// Type pour l'exportation partagée
export interface SharedDeckExport {
  deck: Deck;
  themes: Theme[];
  flashcards: Flashcard[];
  exportDate: string;
  version: string;
}

// Fonctions d'exportation/importation qui ne font rien
export const exportDeckToJson = (deckId: string): SharedDeckExport | null => null;
export const importDeckFromJson = (sharedDeckData: SharedDeckExport, authorId: string): string => "";
export const updateDeckFromJson = (sharedDeckData: SharedDeckExport): boolean => false;
export const publishDeck = (deckId: string): boolean => false;
export const unpublishDeck = (deckId: string): boolean => false;
export const updatePublishedDeck = (deckId: string, deckData: Partial<Deck>): Deck | null => null;
export const getBase64 = (file: File): string => "";
export const generateSampleData = (): void => {};