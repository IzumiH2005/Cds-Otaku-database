// Types
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  supabaseId?: string;
}

export interface Theme {
  id: string;
  deckId: string;
  title: string;
  description: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  themeId?: string;
  front: {
    text: string;
    image?: string;
    audio?: string;
    additionalInfo?: string;
  };
  back: {
    text: string;
    image?: string;
    audio?: string;
    additionalInfo?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastReviewed?: string | null;
  reviewCount?: number;
  difficulty?: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  authorId: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fonctions fictives pour la migration IndexedDB
// Versions asynchrones
export const getDecks = async (): Promise<Deck[]> => {
  return [];
};

export const getDeck = async (id: string): Promise<Deck | null> => {
  return null;
};

export const getThemes = async (): Promise<Theme[]> => {
  return [];
};

export const getThemesByDeck = async (deckId: string): Promise<Theme[]> => {
  return [];
};

export const getFlashcards = async (): Promise<Flashcard[]> => {
  return [];
};

export const getFlashcardsByDeck = async (deckId: string): Promise<Flashcard[]> => {
  return [];
};

export const getFlashcardsByTheme = async (themeId: string): Promise<Flashcard[]> => {
  return [];
};

export const getBase64 = async (file: File): Promise<string> => {
  return '';
};

export const getUser = async (): Promise<User | null> => {
  return null;
};

export const createTheme = async (themeData: Omit<Theme, "id" | "createdAt" | "updatedAt">): Promise<Theme> => {
  return {
    id: uuidv4(),
    ...themeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createFlashcard = async (cardData: Omit<Flashcard, "id" | "createdAt" | "updatedAt">): Promise<Flashcard> => {
  return {
    id: uuidv4(),
    ...cardData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastReviewed: null,
    reviewCount: 0,
    difficulty: 0
  };
};

export const createShareCode = async (deckId: string, days: number = 30): Promise<string> => {
  return uuidv4();
};

export const createDeck = async (deckData: Omit<Deck, "id" | "createdAt" | "updatedAt">): Promise<Deck> => {
  return {
    id: uuidv4(),
    ...deckData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const getSharedImportedDecks = async (): Promise<{ originalId: string; localDeckId: string; }[]> => {
  return [];
};

export const initializeDefaultUser = async (): Promise<User> => {
  return {
    id: uuidv4(),
    name: "Utilisateur",
    email: "",
    createdAt: new Date().toISOString()
  };
};

export const updateUser = async (userData: Partial<User>): Promise<User | null> => {
  return null;
};

export const updateFlashcard = async (id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> => {
  return null;
};

export const deleteFlashcard = async (id: string): Promise<boolean> => {
  return false;
};

export const updateTheme = async (id: string, themeData: Partial<Theme>): Promise<Theme | null> => {
  return null;
};

export const deleteTheme = async (id: string): Promise<boolean> => {
  return false;
};

// Versions synchrones
export const getDecksSync = (): Deck[] => [];
export const getDeckSync = (id: string): Deck | null => null;
export const getThemesSync = (): Theme[] => [];
export const getThemesByDeckSync = (deckId: string): Theme[] => [];
export const getFlashcardsSync = (): Flashcard[] => [];
export const getFlashcardsByDeckSync = (deckId: string): Flashcard[] => [];
export const updateFlashcardSync = (id: string, cardData: Partial<Flashcard>): Flashcard | null => null;
export const deleteFlashcardSync = (id: string): boolean => false;
export const getBase64Sync = (file: File): string => '';
export const updateThemeSync = (id: string, themeData: Partial<Theme>): Theme | null => null;
export const deleteThemeSync = (id: string): boolean => false;
export const getUserSync = (): User | null => null;
export const createThemeSync = (themeData: Omit<Theme, "id" | "createdAt" | "updatedAt">): Theme => ({ 
  id: "",
  deckId: "",
  title: "",
  description: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
} as Theme);
export const createFlashcardSync = (cardData: Omit<Flashcard, "id" | "createdAt" | "updatedAt">): Flashcard => ({
  id: "",
  deckId: "",
  front: { text: "" },
  back: { text: "" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastReviewed: null,
  reviewCount: 0,
  difficulty: 0
} as Flashcard);
export const createShareCodeSync = (deckId: string, days: number = 30): string => "";
export const createDeckSync = (deckData: Omit<Deck, "id" | "createdAt" | "updatedAt">): Deck => ({
  id: "",
  title: "",
  description: "",
  authorId: "",
  isPublic: false,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
} as Deck);
export const getSharedImportedDecksSync = (): { originalId: string; localDeckId: string; }[] => [];
export const initializeDefaultUserSync = (): User => ({
  id: "",
  name: "Utilisateur",
  email: "",
  createdAt: new Date().toISOString()
} as User);
export const updateUserSync = (userData: Partial<User>): User | null => null;