// Types étendus pour le localStorage et IndexedDB
// Ces types ajoutent des propriétés supplémentaires aux types de base
// pour les besoins spécifiques du frontend

export interface UserExtended {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  preferredLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeckExtended {
  id: string;
  authorId: string;
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Propriétés étendues
  isExample?: boolean; // Marque un deck comme étant un exemple/démonstration
}

export interface ThemeExtended {
  id: string;
  deckId: string;
  title: string;
  description: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  // Propriétés étendues
  isExample?: boolean; // Marque un thème comme étant un exemple/démonstration
}

export interface FlashcardExtended {
  id: string;
  deckId: string;
  themeId?: string;
  front: any;
  back: any;
  hints?: string[];
  additionalInfo?: string;
  frontImage?: string;
  backImage?: string;
  frontAudio?: string;
  backAudio?: string;
  createdAt: string;
  updatedAt: string;
  // Propriétés étendues
  isExample?: boolean; // Marque une flashcard comme étant un exemple/démonstration
}

// Alias de types pour simplifier la migration
export type User = UserExtended;
export type Deck = DeckExtended;
export type Theme = ThemeExtended;
export type Flashcard = FlashcardExtended;

// Type pour l'export de decks partagés
export interface SharedDeckExport {
  deck: Deck;
  themes: Theme[];
  flashcards: Flashcard[];
  exportDate: string;
  version: string;
}