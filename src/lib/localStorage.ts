/**
 * MIGRATION COMPLETE: localStorage.ts est maintenant une interface vers IndexedDB
 * 
 * TOUTES les fonctions utilisent IndexedDB à la place de localStorage
 * Les appels synchrones sont remplacés par des appels asynchrones
 * 
 * IMPORTANT: Lors de la migration d'un composant, vous devez:
 * 1. Ajouter async/await aux fonctions qui utilisent ces méthodes
 * 2. Gérer la logique asynchrone dans les composants React (useEffect, etc.)
 */

import { v4 as uuidv4 } from "uuid";
import * as IndexedDB from "./enhancedIndexedDB";

// Types de base pour l'application
export interface User {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  settings?: any;
  preferredLanguage?: string;
}

export interface Deck {
  id: string;
  authorId: string;
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
  front: string;
  back: string;
  hints?: string[];
  additionalInfo?: string;
  frontImage?: string;
  backImage?: string;
  frontAudio?: string;
  backAudio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedDeckExport {
  deck: Deck;
  themes: Theme[];
  flashcards: Flashcard[];
  exportDate: string;
  version: string;
}

// Fonctions liées aux utilisateurs
export const getUser = async (): Promise<User | null> => {
  return await IndexedDB.loadData("user", null);
};

export const initializeDefaultUser = async (): Promise<User> => {
  const defaultUser: User = {
    id: uuidv4(),
    name: "Utilisateur",
    bio: "",
    avatar: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferredLanguage: "fr"
  };
  
  await IndexedDB.saveData("user", defaultUser);
  return defaultUser;
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const user: User = {
    id: uuidv4(),
    name: userData.name || "Utilisateur",
    email: userData.email,
    bio: userData.bio || "",
    avatar: userData.avatar || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferredLanguage: userData.preferredLanguage || "fr",
    ...userData
  };
  
  await IndexedDB.saveData("user", user);
  return user;
};

export const updateUser = async (userData: Partial<User>): Promise<User | null> => {
  const user = await getUser();
  if (!user) return null;
  
  const updatedUser = {
    ...user,
    ...userData,
    updatedAt: new Date().toISOString()
  };
  
  await IndexedDB.saveData("user", updatedUser);
  return updatedUser;
};

// Fonctions liées aux decks
export const getDecks = async (): Promise<Deck[]> => {
  return await IndexedDB.loadData("decks", []);
};

export const getDecksByAuthor = async (authorId: string): Promise<Deck[]> => {
  const decks = await getDecks();
  return decks.filter(deck => deck.authorId === authorId);
};

export const getDeck = async (id: string): Promise<Deck | null> => {
  const decks = await getDecks();
  return decks.find(deck => deck.id === id) || null;
};

export const createDeck = async (deckData: Omit<Deck, "id" | "createdAt" | "updatedAt">): Promise<Deck> => {
  const decks = await getDecks();
  
  const newDeck: Deck = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...deckData
  };
  
  await IndexedDB.saveData("decks", [...decks, newDeck]);
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
  await IndexedDB.saveData("decks", decks);
  
  return updatedDeck;
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  const decks = await getDecks();
  const newDecks = decks.filter(deck => deck.id !== id);
  
  if (newDecks.length === decks.length) return false;
  
  await IndexedDB.saveData("decks", newDecks);
  
  // Supprimer aussi les thèmes et flashcards associés
  const themes = await getThemes();
  const newThemes = themes.filter(theme => theme.deckId !== id);
  await IndexedDB.saveData("themes", newThemes);
  
  const flashcards = await getFlashcards();
  const newFlashcards = flashcards.filter(card => card.deckId !== id);
  await IndexedDB.saveData("flashcards", newFlashcards);
  
  return true;
};

// Fonctions liées aux thèmes
export const getThemes = async (): Promise<Theme[]> => {
  return await IndexedDB.loadData("themes", []);
};

export const getThemesByDeck = async (deckId: string): Promise<Theme[]> => {
  const themes = await getThemes();
  return themes.filter(theme => theme.deckId === deckId);
};

export const getTheme = async (id: string): Promise<Theme | undefined> => {
  const themes = await getThemes();
  return themes.find(theme => theme.id === id);
};

export const createTheme = async (themeData: Omit<Theme, "id" | "createdAt" | "updatedAt">): Promise<Theme> => {
  const themes = await getThemes();
  
  const newTheme: Theme = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...themeData
  };
  
  await IndexedDB.saveData("themes", [...themes, newTheme]);
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
  await IndexedDB.saveData("themes", themes);
  
  return updatedTheme;
};

export const deleteTheme = async (id: string): Promise<boolean> => {
  const themes = await getThemes();
  const newThemes = themes.filter(theme => theme.id !== id);
  
  if (newThemes.length === themes.length) return false;
  
  await IndexedDB.saveData("themes", newThemes);
  
  // Mettre à jour les flashcards associées
  const flashcards = await getFlashcards();
  const updatedFlashcards = flashcards.map(card => {
    if (card.themeId === id) {
      return { ...card, themeId: undefined };
    }
    return card;
  });
  
  await IndexedDB.saveData("flashcards", updatedFlashcards);
  
  return true;
};

// Fonctions liées aux cartes
export const getFlashcards = async (): Promise<Flashcard[]> => {
  return await IndexedDB.loadData("flashcards", []);
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

export const createFlashcard = async (cardData: Omit<Flashcard, "id" | "createdAt" | "updatedAt">): Promise<Flashcard> => {
  const flashcards = await getFlashcards();
  
  const newCard: Flashcard = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...cardData
  };
  
  await IndexedDB.saveData("flashcards", [...flashcards, newCard]);
  return newCard;
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
  
  flashcards[cardIndex] = updatedCard;
  await IndexedDB.saveData("flashcards", flashcards);
  
  return updatedCard;
};

export const deleteFlashcard = async (id: string): Promise<boolean> => {
  const flashcards = await getFlashcards();
  const newFlashcards = flashcards.filter(card => card.id !== id);
  
  if (newFlashcards.length === flashcards.length) return false;
  
  await IndexedDB.saveData("flashcards", newFlashcards);
  return true;
};

// Partage et exportation
export const getSharedDeckCodes = async (): Promise<{ code: string, deckId: string, expiresAt?: string }[]> => {
  return await IndexedDB.loadData("sharedCodes", []);
};

export const createShareCode = async (deckId: string): Promise<string> => {
  const codes = await getSharedDeckCodes();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  // Expiration dans 7 jours
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const newCodes = [...codes, { 
    code, 
    deckId, 
    expiresAt: expiresAt.toISOString() 
  }];
  
  await IndexedDB.saveData("sharedCodes", newCodes);
  return code;
};

export const getSharedDeck = async (code: string): Promise<Deck | undefined> => {
  const codes = await getSharedDeckCodes();
  const sharedCode = codes.find(c => c.code === code);
  
  if (!sharedCode) return undefined;
  
  // Vérifier l'expiration
  if (sharedCode.expiresAt) {
    const expiresAt = new Date(sharedCode.expiresAt);
    if (expiresAt < new Date()) return undefined;
  }
  
  return await getDeck(sharedCode.deckId) || undefined;
};

export const exportDeckToJson = async (deckId: string): Promise<SharedDeckExport> => {
  const deck = await getDeck(deckId);
  const themes = await getThemesByDeck(deckId);
  const cards = await getFlashcardsByDeck(deckId);
  
  if (!deck) throw new Error("Deck not found");
  
  return {
    deck,
    themes,
    flashcards: cards,
    exportDate: new Date().toISOString(),
    version: "1.0"
  };
};

export const getSharedImportedDecks = async (): Promise<{originalId: string, localDeckId: string}[]> => {
  return await IndexedDB.loadData("importedDecks", []);
};

export const isSharedImportedDeck = async (deckId: string): Promise<boolean> => {
  const importedDecks = await getSharedImportedDecks();
  return importedDecks.some(imported => imported.localDeckId === deckId);
};

export const getOriginalDeckIdForImported = async (deckId: string): Promise<string | null> => {
  const importedDecks = await getSharedImportedDecks();
  const imported = importedDecks.find(i => i.localDeckId === deckId);
  return imported ? imported.originalId : null;
};

export const importDeckFromJson = async (sharedDeckData: SharedDeckExport, authorId: string): Promise<string> => {
  try {
    const { deck, themes, flashcards } = sharedDeckData;
    
    // Créer le deck
    const newDeck = await createDeck({
      authorId,
      title: deck.title,
      description: deck.description,
      coverImage: deck.coverImage,
      isPublic: false, // Par défaut privé
      tags: deck.tags
    });
    
    // Créer les thèmes
    const themeIdMap = new Map<string, string>();
    for (const theme of themes) {
      const newTheme = await createTheme({
        deckId: newDeck.id,
        title: theme.title,
        description: theme.description,
        coverImage: theme.coverImage
      });
      
      themeIdMap.set(theme.id, newTheme.id);
    }
    
    // Créer les flashcards
    for (const card of flashcards) {
      await createFlashcard({
        deckId: newDeck.id,
        themeId: card.themeId ? themeIdMap.get(card.themeId) : undefined,
        front: card.front,
        back: card.back,
        hints: card.hints,
        additionalInfo: card.additionalInfo,
        frontImage: card.frontImage,
        backImage: card.backImage,
        frontAudio: card.frontAudio,
        backAudio: card.backAudio
      });
    }
    
    // Enregistrer l'importation
    const importedDecks = await getSharedImportedDecks();
    await IndexedDB.saveData("importedDecks", [
      ...importedDecks,
      { originalId: deck.id, localDeckId: newDeck.id }
    ]);
    
    return newDeck.id;
  } catch (error) {
    console.error("Erreur lors de l'importation du deck:", error);
    throw error;
  }
};

export const updateDeckFromJson = async (sharedDeckData: SharedDeckExport): Promise<boolean> => {
  try {
    const { deck, themes, flashcards } = sharedDeckData;
    
    // Trouver le deck local correspondant
    const importedDecks = await getSharedImportedDecks();
    const importInfo = importedDecks.find(i => i.originalId === deck.id);
    
    if (!importInfo) return false;
    
    const localDeck = await getDeck(importInfo.localDeckId);
    if (!localDeck) return false;
    
    // Mettre à jour le deck
    await updateDeck(localDeck.id, {
      title: deck.title,
      description: deck.description,
      coverImage: deck.coverImage,
      tags: deck.tags
    });
    
    // Récupérer les thèmes et flashcards existants
    const existingThemes = await getThemesByDeck(localDeck.id);
    const existingCards = await getFlashcardsByDeck(localDeck.id);
    
    // Supprimer les thèmes existants
    for (const theme of existingThemes) {
      await deleteTheme(theme.id);
    }
    
    // Supprimer les cartes existantes
    for (const card of existingCards) {
      await deleteFlashcard(card.id);
    }
    
    // Créer les nouveaux thèmes
    const themeIdMap = new Map<string, string>();
    for (const theme of themes) {
      const newTheme = await createTheme({
        deckId: localDeck.id,
        title: theme.title,
        description: theme.description,
        coverImage: theme.coverImage
      });
      
      themeIdMap.set(theme.id, newTheme.id);
    }
    
    // Créer les nouvelles flashcards
    for (const card of flashcards) {
      await createFlashcard({
        deckId: localDeck.id,
        themeId: card.themeId ? themeIdMap.get(card.themeId) : undefined,
        front: card.front,
        back: card.back,
        hints: card.hints,
        additionalInfo: card.additionalInfo,
        frontImage: card.frontImage,
        backImage: card.backImage,
        frontAudio: card.frontAudio,
        backAudio: card.backAudio
      });
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du deck importé:", error);
    return false;
  }
};

// Publications
export const publishDeck = async (deck: Deck): Promise<boolean> => {
  try {
    await updateDeck(deck.id, { isPublic: true });
    return true;
  } catch (error) {
    console.error("Erreur lors de la publication du deck:", error);
    return false;
  }
};

export const unpublishDeck = async (deckId: string): Promise<boolean> => {
  try {
    await updateDeck(deckId, { isPublic: false });
    return true;
  } catch (error) {
    console.error("Erreur lors de la dépublication du deck:", error);
    return false;
  }
};

export const updatePublishedDeck = async (deck: Deck): Promise<Deck | null> => {
  return updateDeck(deck.id, { isPublic: true });
};

// Utilitaires
export const getBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Initialisation des données
export const generateSampleData = async (): Promise<void> => {
  // Vérifier si l'utilisateur existe déjà
  const user = await getUser();
  if (!user) {
    // Créer un utilisateur par défaut si aucun n'existe
    await createUser({
      name: "Utilisateur",
      preferredLanguage: "fr"
    });
    
    // Créer quelques decks de démonstration
    const defaultDeckId = await createDefaultDeck();
    
    // Créer un sample theme
    const themeId = await createDefaultTheme(defaultDeckId);
    
    // Créer des flashcards par défaut
    await createDefaultFlashcards(defaultDeckId, themeId);
  }
};

// Fonctions pour créer des données par défaut
async function createDefaultDeck(): Promise<string> {
  const user = await getUser();
  if (!user) throw new Error("User not found");
  
  const deck = await createDeck({
    authorId: user.id,
    title: "Introduction à la programmation",
    description: "Concepts de base de la programmation et du développement logiciel",
    isPublic: true,
    tags: ["Programmation", "Informatique", "Débutant"]
  });
  
  return deck.id;
}

async function createDefaultTheme(deckId: string): Promise<string> {
  const theme = await createTheme({
    deckId,
    title: "Concepts fondamentaux",
    description: "Les concepts fondamentaux de la programmation"
  });
  
  return theme.id;
}

async function createDefaultFlashcards(deckId: string, themeId: string): Promise<void> {
  const sampleCards = [
    {
      front: "Qu'est-ce qu'une variable?",
      back: "Une variable est un conteneur pour stocker des valeurs de données. Les variables sont utilisées pour stocker des informations qui peuvent être référencées et manipulées dans un programme."
    },
    {
      front: "Qu'est-ce qu'une condition?",
      back: "Une condition est une expression qui évalue à vrai ou faux et qui permet d'exécuter différentes actions en fonction du résultat."
    },
    {
      front: "Qu'est-ce qu'une fonction?",
      back: "Une fonction est un bloc de code réutilisable qui effectue une tâche spécifique. Les fonctions permettent de diviser un programme en parties plus petites et plus faciles à gérer."
    }
  ];
  
  for (const cardData of sampleCards) {
    await createFlashcard({
      deckId,
      themeId,
      front: cardData.front,
      back: cardData.back,
      hints: ["Réfléchissez aux concepts de base de la programmation"],
      additionalInfo: "Concept fondamental de programmation"
    });
  }
}

// Version synchrone pour backward compatibility
// Gestion de session - Toutes les fonctions sont désormais migrées vers le fichier sessionManager.ts
// avec une interface 100% asynchrone basée sur IndexedDB