// Types
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import * as enhancedDB from './enhancedIndexedDB';

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
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  authorId: string;
  isPublic: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// LocalStorage Key Constants
const STORAGE_KEYS = {
  USER: 'cds-flashcard-user',
  DECKS: 'cds-flashcard-decks',
  THEMES: 'cds-flashcard-themes',
  FLASHCARDS: 'cds-flashcard-cards',
  SHARED: 'cds-flashcard-shared',
  SHARED_DECKS: 'cds-flashcard-shared-decks',
};

// Utiliser les fonctions d'amélioration d'IndexedDB

// Helper functions avec IndexedDB
const getItem = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    // Si c'est un array, utiliser loadData qui gère la base de données
    if (Array.isArray(defaultValue)) {
      return await enhancedDB.loadData(key, defaultValue);
    }
    
    // Sinon, utiliser getItem
    const item = await enhancedDB.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item from IndexedDB: ${key}`, error);
    return defaultValue;
  }
};

const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    // Si c'est un array, utiliser saveData qui gère la base de données
    if (Array.isArray(value)) {
      await enhancedDB.saveData(key, value);
    } else {
      // Sinon, utiliser setItem standard
      await enhancedDB.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error setting item in IndexedDB: ${key}`, error);
  }
};

// Fonction pour assurer la compatibilité avec le code existant
// Transforme les fonctions asynchrones en promesses qui retournent des résultats
// pour éviter d'avoir à modifier tout le code existant
const syncWrapper = <T, R>(asyncFn: (...args: T[]) => Promise<R>): ((...args: T[]) => R | null) => {
  return (...args: T[]): R | null => {
    let result: R | null = null;
    asyncFn(...args).then(r => {
      result = r;
    }).catch(error => {
      console.error("Error in syncWrapper:", error);
    });
    // Retourne null car les anciennes fonctions synchrones ne peuvent pas attendre
    // les résultats des promesses. Le code qui utilise ces fonctions devra être
    // adapté pour utiliser des promesses par la suite.
    return result;
  };
};

// User functions
export const getUser = async (): Promise<User | null> => {
  return await getItem<User | null>(STORAGE_KEYS.USER, null);
};

export const setUser = async (user: User): Promise<void> => {
  if (!user.supabaseId) {
    user.supabaseId = uuidv4();
  }
  await setItem(STORAGE_KEYS.USER, user);
};

export const updateUser = async (userData: Partial<User>): Promise<User | null> => {
  const currentUser = await getUser();
  if (!currentUser) return null;
  
  const updatedUser = { 
    ...currentUser, 
    ...userData, 
    updatedAt: new Date().toISOString(),
    supabaseId: userData.supabaseId || currentUser.supabaseId || uuidv4()
  };
  await setUser(updatedUser);
  return updatedUser;
};

// Deck functions
export const getDecks = async (): Promise<Deck[]> => {
  return await getItem<Deck[]>(STORAGE_KEYS.DECKS, []);
};

export const getDeck = async (id: string): Promise<Deck | null> => {
  const decks = await getDecks();
  return decks.find(deck => deck.id === id) || null;
};

export const createDeck = async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> => {
  const decks = await getDecks();
  const now = new Date().toISOString();
  
  const newDeck: Deck = {
    ...deck,
    id: `deck_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  await setItem(STORAGE_KEYS.DECKS, [...decks, newDeck]);
  return newDeck;
};

export const updateDeck = async (id: string, deckData: Partial<Deck>): Promise<Deck | null> => {
  const decks = await getDecks();
  const deckIndex = decks.findIndex(deck => deck.id === id);
  
  if (deckIndex === -1) return null;
  
  const updatedDeck = { 
    ...decks[deckIndex], 
    ...deckData, 
    updatedAt: new Date().toISOString() 
  };
  
  decks[deckIndex] = updatedDeck;
  await setItem(STORAGE_KEYS.DECKS, decks);
  
  return updatedDeck;
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  const decks = await getDecks();
  const updatedDecks = decks.filter(deck => deck.id !== id);
  
  if (updatedDecks.length === decks.length) return false;
  
  await setItem(STORAGE_KEYS.DECKS, updatedDecks);
  
  // Delete related themes and flashcards
  const themes = await getThemes();
  const updatedThemes = themes.filter(theme => theme.deckId !== id);
  await setItem(STORAGE_KEYS.THEMES, updatedThemes);
  
  const flashcards = await getFlashcards();
  const updatedFlashcards = flashcards.filter(card => card.deckId !== id);
  await setItem(STORAGE_KEYS.FLASHCARDS, updatedFlashcards);
  
  return true;
};

// Theme functions
export const getThemes = async (): Promise<Theme[]> => {
  return await getItem<Theme[]>(STORAGE_KEYS.THEMES, []);
};

export const getThemesByDeck = async (deckId: string): Promise<Theme[]> => {
  const themes = await getThemes();
  return themes.filter(theme => theme.deckId === deckId);
};

export const getTheme = async (id: string): Promise<Theme | undefined> => {
  const themes = await getThemes();
  return themes.find(theme => theme.id === id);
};

export const createTheme = async (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<Theme> => {
  const themes = await getThemes();
  const now = new Date().toISOString();
  
  const newTheme: Theme = {
    ...theme,
    id: `theme_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  await setItem(STORAGE_KEYS.THEMES, [...themes, newTheme]);
  return newTheme;
};

export const updateTheme = async (id: string, themeData: Partial<Theme>): Promise<Theme | null> => {
  const themes = await getThemes();
  const themeIndex = themes.findIndex(theme => theme.id === id);
  
  if (themeIndex === -1) return null;
  
  const updatedTheme = { 
    ...themes[themeIndex], 
    ...themeData, 
    updatedAt: new Date().toISOString() 
  };
  
  themes[themeIndex] = updatedTheme;
  await setItem(STORAGE_KEYS.THEMES, themes);
  
  return updatedTheme;
};

export const deleteTheme = async (id: string): Promise<boolean> => {
  const themes = await getThemes();
  const updatedThemes = themes.filter(theme => theme.id !== id);
  
  if (updatedThemes.length === themes.length) return false;
  
  await setItem(STORAGE_KEYS.THEMES, updatedThemes);
  
  // Update related flashcards to remove theme reference
  const flashcards = await getFlashcards();
  const updatedFlashcards = flashcards.map(card => {
    if (card.themeId === id) {
      return { ...card, themeId: undefined };
    }
    return card;
  });
  
  await setItem(STORAGE_KEYS.FLASHCARDS, updatedFlashcards);
  
  return true;
};

// Flashcard functions
export const getFlashcards = async (): Promise<Flashcard[]> => {
  return await getItem<Flashcard[]>(STORAGE_KEYS.FLASHCARDS, []);
};

export const getFlashcardsByDeck = async (deckId: string): Promise<Flashcard[]> => {
  const flashcards = await getFlashcards();
  return flashcards.filter(card => card.deckId === deckId);
};

export const getFlashcardsByTheme = async (themeId: string): Promise<Flashcard[]> => {
  const flashcards = await getFlashcards();
  return flashcards.filter(card => card.themeId === themeId);
};

export const getFlashcard = async (id: string): Promise<Flashcard | undefined> => {
  const flashcards = await getFlashcards();
  return flashcards.find(card => card.id === id);
};

export const createFlashcard = async (flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flashcard> => {
  const flashcards = await getFlashcards();
  const now = new Date().toISOString();
  
  const newFlashcard: Flashcard = {
    ...flashcard,
    id: `card_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  // Utiliser directement addItem de enhancedIndexedDB pour ajouter la flashcard
  await enhancedDB.addItem(STORAGE_KEYS.FLASHCARDS, newFlashcard, []);
  return newFlashcard;
};

export const updateFlashcard = async (id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> => {
  const flashcards = await getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);
  
  if (cardIndex === -1) return null;
  
  const updatedCard = { 
    ...flashcards[cardIndex], 
    ...cardData, 
    updatedAt: new Date().toISOString() 
  };
  
  // Utiliser updateItem de enhancedIndexedDB pour mise à jour optimisée
  const success = await enhancedDB.updateItem(
    STORAGE_KEYS.FLASHCARDS,
    id,
    () => updatedCard,
    'id',
    []
  );
  
  return success ? updatedCard : null;
};

export const deleteFlashcard = async (id: string): Promise<boolean> => {
  // Utiliser removeArrayItem de enhancedIndexedDB pour suppression optimisée
  return await enhancedDB.removeArrayItem(
    STORAGE_KEYS.FLASHCARDS,
    id,
    'id',
    []
  );
};

// Shared deck functions
interface SharedDeckCode {
  code: string;
  deckId: string;
  expiresAt?: string;
}

export const getSharedDeckCodes = async (): Promise<SharedDeckCode[]> => {
  return await getItem<SharedDeckCode[]>(STORAGE_KEYS.SHARED, []);
};

export const createShareCode = async (deckId: string, expiresInDays?: number): Promise<string> => {
  const sharedCodes = await getSharedDeckCodes();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const newSharedCode: SharedDeckCode = {
    code,
    deckId,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : undefined,
  };
  
  await setItem(STORAGE_KEYS.SHARED, [...sharedCodes, newSharedCode]);
  return code;
};

export const getSharedDeck = async (code: string): Promise<Deck | undefined> => {
  const sharedCodes = await getSharedDeckCodes();
  const sharedCode = sharedCodes.find(sc => sc.code === code);
  
  if (!sharedCode) return undefined;
  
  // Check if expired
  if (sharedCode.expiresAt && new Date(sharedCode.expiresAt) < new Date()) {
    // Remove expired code
    const updatedCodes = sharedCodes.filter(sc => sc.code !== code);
    await setItem(STORAGE_KEYS.SHARED, updatedCodes);
    return undefined;
  }
  
  const deck = await getDeck(sharedCode.deckId);
  return deck || undefined;
};

// *** NOUVELLE FONCTIONNALITÉ: Partage de deck via JSON ***

// Interface pour le format de deck partagé
export interface SharedDeckExport {
  id: string;
  originalId: string; // ID original du deck
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  themes: {
    id: string;
    title: string;
    description: string;
    coverImage?: string;
  }[];
  flashcards: {
    id: string;
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
  }[];
  version: number;
  exportedAt: string;
}

// Fonction pour exporter un deck au format JSON
export const exportDeckToJson = async (deckId: string): Promise<SharedDeckExport> => {
  const deck = await getDeck(deckId);
  if (!deck) {
    throw new Error("Deck not found");
  }
  
  const themes = await getThemesByDeck(deckId);
  const flashcards = await getFlashcardsByDeck(deckId);
  
  const sharedDeck: SharedDeckExport = {
    id: `shared_${uuidv4()}`,
    originalId: deckId,
    title: deck.title,
    description: deck.description,
    coverImage: deck.coverImage,
    tags: deck.tags || [],
    themes: themes.map(theme => ({
      id: theme.id,
      title: theme.title,
      description: theme.description,
      coverImage: theme.coverImage,
    })),
    flashcards: flashcards.map(card => ({
      id: card.id,
      themeId: card.themeId,
      front: {
        text: card.front.text,
        image: card.front.image,
        audio: card.front.audio,
        additionalInfo: card.front.additionalInfo,
      },
      back: {
        text: card.back.text,
        image: card.back.image,
        audio: card.back.audio,
        additionalInfo: card.back.additionalInfo,
      },
    })),
    version: 1,
    exportedAt: new Date().toISOString()
  };
  
  return sharedDeck;
};

// Fonction pour importer un deck depuis un format JSON
export const importDeckFromJson = async (sharedDeckData: SharedDeckExport, authorId: string): Promise<string> => {
  // Créer le nouveau deck
  const newDeck = await createDeck({
    title: `${sharedDeckData.title} (Importé)`,
    description: sharedDeckData.description,
    coverImage: sharedDeckData.coverImage,
    authorId: authorId,
    isPublic: false,
    tags: sharedDeckData.tags,
  });
  
  // Créer une map pour associer les anciens IDs de thèmes aux nouveaux
  const themeIdMap = new Map<string, string>();
  
  // Créer les thèmes
  for (const theme of sharedDeckData.themes) {
    const newTheme = await createTheme({
      deckId: newDeck.id,
      title: theme.title,
      description: theme.description,
      coverImage: theme.coverImage,
    });
    
    themeIdMap.set(theme.id, newTheme.id);
  }
  
  // Créer les flashcards
  for (const card of sharedDeckData.flashcards) {
    const newThemeId = card.themeId ? themeIdMap.get(card.themeId) : undefined;
    
    await createFlashcard({
      deckId: newDeck.id,
      themeId: newThemeId,
      front: {
        text: card.front.text,
        image: card.front.image,
        audio: card.front.audio,
        additionalInfo: card.front.additionalInfo,
      },
      back: {
        text: card.back.text,
        image: card.back.image,
        audio: card.back.audio,
        additionalInfo: card.back.additionalInfo,
      },
    });
  }
  
  // Sauvegarder la référence du deck partagé
  const sharedDecks = await getItem<{[originalId: string]: string}>(STORAGE_KEYS.SHARED_DECKS, {});
  sharedDecks[sharedDeckData.originalId] = newDeck.id;
  await setItem(STORAGE_KEYS.SHARED_DECKS, sharedDecks);
  
  return newDeck.id;
};

// Fonction pour mettre à jour un deck existant avec une nouvelle version partagée
export const updateDeckFromJson = async (sharedDeckData: SharedDeckExport): Promise<boolean> => {
  // Vérifier si le deck original a déjà été importé
  const sharedDecks = await getItem<{[originalId: string]: string}>(STORAGE_KEYS.SHARED_DECKS, {});
  const localDeckId = sharedDecks[sharedDeckData.originalId];
  
  if (!localDeckId) {
    return false; // Le deck n'a pas été importé auparavant
  }
  
  // Vérifier si le deck existe encore localement
  const localDeck = await getDeck(localDeckId);
  if (!localDeck) {
    // Le deck a été supprimé localement, supprimer la référence
    delete sharedDecks[sharedDeckData.originalId];
    await setItem(STORAGE_KEYS.SHARED_DECKS, sharedDecks);
    return false;
  }
  
  // Mettre à jour les informations du deck
  await updateDeck(localDeckId, {
    title: sharedDeckData.title,
    description: sharedDeckData.description,
    coverImage: sharedDeckData.coverImage,
    tags: sharedDeckData.tags,
  });
  
  // Supprimer les thèmes et flashcards existants
  const existingThemes = await getThemesByDeck(localDeckId);
  for (const theme of existingThemes) {
    await deleteTheme(theme.id);
  }
  
  const existingFlashcards = await getFlashcardsByDeck(localDeckId);
  for (const card of existingFlashcards) {
    await deleteFlashcard(card.id);
  }
  
  // Créer une map pour associer les anciens IDs de thèmes aux nouveaux
  const themeIdMap = new Map<string, string>();
  
  // Créer les nouveaux thèmes
  for (const theme of sharedDeckData.themes) {
    const newTheme = await createTheme({
      deckId: localDeckId,
      title: theme.title,
      description: theme.description,
      coverImage: theme.coverImage,
    });
    
    themeIdMap.set(theme.id, newTheme.id);
  }
  
  // Créer les nouvelles flashcards
  for (const card of sharedDeckData.flashcards) {
    const newThemeId = card.themeId ? themeIdMap.get(card.themeId) : undefined;
    
    await createFlashcard({
      deckId: localDeckId,
      themeId: newThemeId,
      front: {
        text: card.front.text,
        image: card.front.image,
        audio: card.front.audio,
        additionalInfo: card.front.additionalInfo,
      },
      back: {
        text: card.back.text,
        image: card.back.image,
        audio: card.back.audio,
        additionalInfo: card.back.additionalInfo,
      },
    });
  }
  
  return true;
};

// Fonction pour obtenir tous les decks partagés importés
export const getSharedImportedDecks = async (): Promise<{originalId: string, localDeckId: string}[]> => {
  const sharedDecks = await getItem<{[originalId: string]: string}>(STORAGE_KEYS.SHARED_DECKS, {});
  return Object.entries(sharedDecks).map(([originalId, localDeckId]) => ({
    originalId,
    localDeckId
  }));
};

// Fonction pour vérifier si un deck est un deck partagé importé
export const isSharedImportedDeck = async (deckId: string): Promise<boolean> => {
  const sharedDecks = await getItem<{[originalId: string]: string}>(STORAGE_KEYS.SHARED_DECKS, {});
  return Object.values(sharedDecks).includes(deckId);
};

// Fonction pour obtenir l'ID original d'un deck importé
export const getOriginalDeckIdForImported = async (deckId: string): Promise<string | null> => {
  const sharedDecks = await getItem<{[originalId: string]: string}>(STORAGE_KEYS.SHARED_DECKS, {});
  for (const [originalId, localId] of Object.entries(sharedDecks)) {
    if (localId === deckId) {
      return originalId;
    }
  }
  return null;
};

// Fonction pour publier un deck (le rendre public)
export const publishDeck = async (deckId: string): Promise<boolean> => {
  const deck = await getDeck(deckId);
  if (!deck) return false;
  
  await updateDeck(deckId, {
    isPublic: true,
    isPublished: true,
    publishedAt: new Date().toISOString()
  });
  
  return true;
};

// Fonction pour dépublier un deck (le rendre privé)
export const unpublishDeck = async (deckId: string): Promise<boolean> => {
  const deck = await getDeck(deckId);
  if (!deck) return false;
  
  await updateDeck(deckId, {
    isPublic: false,
    isPublished: false
  });
  
  return true;
};

// Fonction pour mettre à jour un deck publié (sans changer son statut de publication)
export const updatePublishedDeck = async (deckId: string, deckData: Partial<Deck>): Promise<Deck | null> => {
  const deck = await getDeck(deckId);
  if (!deck || !deck.isPublished) return null;
  
  return await updateDeck(deckId, {
    ...deckData,
    isPublic: true,
    isPublished: true
  });
};

// Fonction utilitaire pour convertir des images en base64
export const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Fonction pour générer des données d'exemple
export const generateSampleData = async (): Promise<void> => {
  const user = await getUser();
  if (!user) return;

  // Vérifier si des données existent déjà
  const decks = await getDecks();
  if (decks.length > 0) return;

  // Créer un deck d'exemple
  const deck = await createDeck({
    title: "Introduction à JavaScript",
    description: "Les concepts fondamentaux de JavaScript",
    authorId: user.id,
    isPublic: true,
    tags: ["programmation", "débutant", "javascript"]
  });

  // Créer des thèmes
  const baseTheme = await createTheme({
    deckId: deck.id,
    title: "Bases du langage",
    description: "Variables, types, opérateurs et structures de contrôle"
  });

  const functionsTheme = await createTheme({
    deckId: deck.id,
    title: "Fonctions",
    description: "Déclaration, expressions, fonctions fléchées et closures"
  });

  // Créer des flashcards pour le thème "Bases du langage"
  await createFlashcard({
    deckId: deck.id,
    themeId: baseTheme.id,
    front: {
      text: "Qu'est-ce qu'une variable en JavaScript?"
    },
    back: {
      text: "Une variable est un conteneur pour stocker des données. En JavaScript, on peut déclarer des variables avec 'var', 'let' ou 'const'.",
      additionalInfo: "let x = 5; // Déclare une variable modifiable\nconst PI = 3.14; // Déclare une constante"
    }
  });

  await createFlashcard({
    deckId: deck.id,
    themeId: baseTheme.id,
    front: {
      text: "Quels sont les types primitifs en JavaScript?"
    },
    back: {
      text: "JavaScript a 7 types primitifs: string, number, boolean, null, undefined, symbol et bigint.",
      additionalInfo: "Les types primitifs sont immuables et manipulés par valeur."
    }
  });

  // Créer des flashcards pour le thème "Fonctions"
  await createFlashcard({
    deckId: deck.id,
    themeId: functionsTheme.id,
    front: {
      text: "Quelle est la différence entre une déclaration de fonction et une expression de fonction?"
    },
    back: {
      text: "Une déclaration de fonction définit une fonction nommée et est hissée (hoisted). Une expression de fonction assigne une fonction à une variable et n'est pas hissée.",
      additionalInfo: "// Déclaration\nfunction add(a, b) { return a + b; }\n\n// Expression\nconst add = function(a, b) { return a + b; };"
    }
  });

  await createFlashcard({
    deckId: deck.id,
    themeId: functionsTheme.id,
    front: {
      text: "Qu'est-ce qu'une fonction fléchée (arrow function)?"
    },
    back: {
      text: "Une fonction fléchée est une syntaxe concise pour écrire des fonctions en JavaScript, introduite dans ES6. Elle ne possède pas son propre 'this'.",
      additionalInfo: "const add = (a, b) => a + b;\n\n// Équivalent à:\nconst add = function(a, b) { return a + b; };"
    }
  });

  console.log("Sample data generated successfully");
};

// Fonctions de récupération synchrone (pour compatibilité avec le code existant)
// Ces fonctions vont essayer de récupérer les données, mais ne garantissent pas leurs résultats
// Elles sont là uniquement pour faciliter la transition vers la version asynchrone
export const getUserSync = (): User | null => {
  let result: User | null = null;
  getUser().then(user => { result = user; });
  return result;
};

export const getDecksSync = (): Deck[] => {
  let result: Deck[] = [];
  getDecks().then(decks => { result = decks; });
  return result;
};

export const getDeckSync = (id: string): Deck | null => {
  let result: Deck | null = null;
  getDeck(id).then(deck => { result = deck; });
  return result;
};

export const getThemesSync = (): Theme[] => {
  let result: Theme[] = [];
  getThemes().then(themes => { result = themes; });
  return result;
};

export const getThemesByDeckSync = (deckId: string): Theme[] => {
  let result: Theme[] = [];
  getThemesByDeck(deckId).then(themes => { result = themes; });
  return result;
};

export const getFlashcardsSync = (): Flashcard[] => {
  let result: Flashcard[] = [];
  getFlashcards().then(flashcards => { result = flashcards; });
  return result;
};

export const getFlashcardsByDeckSync = (deckId: string): Flashcard[] => {
  let result: Flashcard[] = [];
  getFlashcardsByDeck(deckId).then(flashcards => { result = flashcards; });
  return result;
};

// Fonctions synchrones supplémentaires pour la gestion des flashcards
export const updateFlashcardSync = (id: string, cardData: Partial<Flashcard>): Flashcard | null => {
  let result: Flashcard | null = null;
  updateFlashcard(id, cardData).then(card => { result = card; });
  return result;
};

export const deleteFlashcardSync = (id: string): boolean => {
  let result: boolean = false;
  deleteFlashcard(id).then(success => { result = success; });
  return result;
};

// Fonction synchrone pour getBase64
export const getBase64Sync = (file: File): string => {
  let result: string = '';
  getBase64(file).then(base64 => { result = base64; });
  return result;
};

// Fonctions synchrones pour la gestion des thèmes
export const updateThemeSync = (id: string, themeData: Partial<Theme>): Theme | null => {
  let result: Theme | null = null;
  updateTheme(id, themeData).then(theme => { result = theme; });
  return result;
};

export const deleteThemeSync = (id: string): boolean => {
  let result: boolean = false;
  deleteTheme(id).then(success => { result = success; });
  return result;
};