/**
 * Module d'utilisation d'IndexedDB permettant de stocker des quantités importantes de données
 * de manière compatible avec l'interface actuelle de localStorage
 */
import { User, Deck, Theme, Flashcard, SharedDeckExport } from './localStorage';

// Nom de la base de données
const DB_NAME = 'flashcards-db';
const DB_VERSION = 1;

// Noms des object stores (tables)
const STORES = {
  USER: 'user',
  DECKS: 'decks',
  THEMES: 'themes',
  FLASHCARDS: 'flashcards',
  SHARED: 'shared_codes',
  SHARED_DECKS: 'shared_decks',
};

// Clés pour stocker les données en single-value
const KEYS = {
  USER: 'current_user',
  SHARED_DECKS_MAP: 'shared_decks_map',
};

/**
 * Ouvre une connexion à la base de données
 * @returns Promise<IDBDatabase>
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Erreur lors de l\'ouverture de la base de données IndexedDB:', event);
      reject('Impossible d\'ouvrir la base de données IndexedDB');
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Créer les object stores si nécessaire
      if (!db.objectStoreNames.contains(STORES.USER)) {
        db.createObjectStore(STORES.USER, { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains(STORES.DECKS)) {
        db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.THEMES)) {
        db.createObjectStore(STORES.THEMES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
        db.createObjectStore(STORES.FLASHCARDS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.SHARED)) {
        db.createObjectStore(STORES.SHARED, { keyPath: 'code' });
      }
      
      if (!db.objectStoreNames.contains(STORES.SHARED_DECKS)) {
        db.createObjectStore(STORES.SHARED_DECKS, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Récupère tous les éléments d'un object store
 * @param storeName Nom de l'object store
 * @returns Promise<T[]>
 */
async function getAllItems<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la récupération des données depuis ${storeName}:`, event);
        reject(`Erreur lors de la récupération des données depuis ${storeName}`);
        db.close();
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des données depuis ${storeName}:`, error);
    return [];
  }
}

/**
 * Récupère un élément par ID depuis un object store
 * @param storeName Nom de l'object store
 * @param id Identifiant de l'élément
 * @returns Promise<T | undefined>
 */
async function getItemById<T>(storeName: string, id: string): Promise<T | undefined> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la récupération de l'élément ${id} depuis ${storeName}:`, event);
        reject(`Erreur lors de la récupération de l'élément ${id}`);
        db.close();
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'élément ${id} depuis ${storeName}:`, error);
    return undefined;
  }
}

/**
 * Ajoute ou met à jour un élément dans un object store
 * @param storeName Nom de l'object store
 * @param item Élément à ajouter ou mettre à jour
 * @returns Promise<T>
 */
async function putItem<T>(storeName: string, item: T): Promise<T> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve(item);
        db.close();
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de l'ajout/mise à jour dans ${storeName}:`, event);
        reject(`Erreur lors de l'ajout/mise à jour dans ${storeName}`);
        db.close();
      };
    });
  } catch (error) {
    console.error(`Erreur lors de l'ajout/mise à jour dans ${storeName}:`, error);
    throw error;
  }
}

/**
 * Supprime un élément d'un object store
 * @param storeName Nom de l'object store
 * @param id Identifiant de l'élément
 * @returns Promise<boolean>
 */
async function deleteItem(storeName: string, id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
        db.close();
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la suppression de l'élément ${id} depuis ${storeName}:`, event);
        reject(`Erreur lors de la suppression de l'élément ${id}`);
        db.close();
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'élément ${id} depuis ${storeName}:`, error);
    return false;
  }
}

/**
 * Migre les données de localStorage vers IndexedDB
 * Nécessaire pour la première utilisation
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // Constantes des clés localStorage
    const STORAGE_KEYS = {
      USER: 'cds-flashcard-user',
      DECKS: 'cds-flashcard-decks',
      THEMES: 'cds-flashcard-themes',
      FLASHCARDS: 'cds-flashcard-cards',
      SHARED: 'cds-flashcard-shared',
      SHARED_DECKS: 'cds-flashcard-shared-decks',
    };
    
    // Récupération des données de localStorage
    let user: User | null = null;
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        user = JSON.parse(userData);
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération de l\'utilisateur depuis localStorage:', e);
    }
    
    let decks: Deck[] = [];
    try {
      // Essayer de charger les decks (segmentés ou non)
      const decksData = localStorage.getItem(STORAGE_KEYS.DECKS);
      if (decksData) {
        try {
          const parsed = JSON.parse(decksData);
          if (!parsed.isSegmented) {
            decks = parsed;
          } else {
            // Traiter les segments
            const { totalSegments } = parsed;
            for (let i = 0; i < totalSegments; i++) {
              const segmentKey = `${STORAGE_KEYS.DECKS}_s${i}`;
              const segmentData = localStorage.getItem(segmentKey);
              if (segmentData) {
                const segment = JSON.parse(segmentData);
                decks = decks.concat(segment);
              }
            }
          }
        } catch (e) {
          console.warn('Erreur lors du parsing des decks:', e);
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération des decks depuis localStorage:', e);
    }
    
    let themes: Theme[] = [];
    try {
      // Essayer de charger les thèmes (segmentés ou non)
      const themesData = localStorage.getItem(STORAGE_KEYS.THEMES);
      if (themesData) {
        try {
          const parsed = JSON.parse(themesData);
          if (!parsed.isSegmented) {
            themes = parsed;
          } else {
            // Traiter les segments
            const { totalSegments } = parsed;
            for (let i = 0; i < totalSegments; i++) {
              const segmentKey = `${STORAGE_KEYS.THEMES}_s${i}`;
              const segmentData = localStorage.getItem(segmentKey);
              if (segmentData) {
                const segment = JSON.parse(segmentData);
                themes = themes.concat(segment);
              }
            }
          }
        } catch (e) {
          console.warn('Erreur lors du parsing des thèmes:', e);
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération des thèmes depuis localStorage:', e);
    }
    
    let flashcards: Flashcard[] = [];
    try {
      // Essayer de charger les flashcards (segmentées ou non)
      const cardsData = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
      if (cardsData) {
        try {
          const parsed = JSON.parse(cardsData);
          if (!parsed.isSegmented) {
            flashcards = parsed;
          } else {
            // Traiter les segments
            const { totalSegments } = parsed;
            for (let i = 0; i < totalSegments; i++) {
              const segmentKey = `${STORAGE_KEYS.FLASHCARDS}_s${i}`;
              const segmentData = localStorage.getItem(segmentKey);
              if (segmentData) {
                const segment = JSON.parse(segmentData);
                flashcards = flashcards.concat(segment);
              }
            }
          }
        } catch (e) {
          console.warn('Erreur lors du parsing des flashcards:', e);
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération des flashcards depuis localStorage:', e);
    }
    
    let sharedCodes: any[] = [];
    try {
      const sharedData = localStorage.getItem(STORAGE_KEYS.SHARED);
      if (sharedData) {
        sharedCodes = JSON.parse(sharedData);
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération des codes de partage depuis localStorage:', e);
    }
    
    let sharedDecksMap: { [originalId: string]: string } = {};
    try {
      const sharedDecksData = localStorage.getItem(STORAGE_KEYS.SHARED_DECKS);
      if (sharedDecksData) {
        sharedDecksMap = JSON.parse(sharedDecksData);
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération des decks partagés depuis localStorage:', e);
    }
    
    // Sauvegarder dans IndexedDB
    const db = await openDatabase();
    
    // Utilisateur
    if (user) {
      const userTransaction = db.transaction(STORES.USER, 'readwrite');
      const userStore = userTransaction.objectStore(STORES.USER);
      userStore.put({ key: KEYS.USER, user });
    }
    
    // Decks
    const decksTransaction = db.transaction(STORES.DECKS, 'readwrite');
    const decksStore = decksTransaction.objectStore(STORES.DECKS);
    for (const deck of decks) {
      decksStore.put(deck);
    }
    
    // Thèmes
    const themesTransaction = db.transaction(STORES.THEMES, 'readwrite');
    const themesStore = themesTransaction.objectStore(STORES.THEMES);
    for (const theme of themes) {
      themesStore.put(theme);
    }
    
    // Flashcards
    const flashcardsTransaction = db.transaction(STORES.FLASHCARDS, 'readwrite');
    const flashcardsStore = flashcardsTransaction.objectStore(STORES.FLASHCARDS);
    for (const card of flashcards) {
      flashcardsStore.put(card);
    }
    
    // Codes de partage
    const sharedTransaction = db.transaction(STORES.SHARED, 'readwrite');
    const sharedStore = sharedTransaction.objectStore(STORES.SHARED);
    for (const sharedCode of sharedCodes) {
      sharedStore.put(sharedCode);
    }
    
    // Map des decks partagés
    const sharedDecksTransaction = db.transaction(STORES.SHARED_DECKS, 'readwrite');
    const sharedDecksStore = sharedDecksTransaction.objectStore(STORES.SHARED_DECKS);
    sharedDecksStore.put({ key: KEYS.SHARED_DECKS_MAP, map: sharedDecksMap });
    
    console.log('Migration des données de localStorage vers IndexedDB terminée avec succès!');
    
    // Fermer la connexion à la base de données
    db.close();
    
    // Marquer la migration comme terminée
    localStorage.setItem('indexeddb-migration-completed', 'true');
  } catch (error) {
    console.error('Erreur lors de la migration des données vers IndexedDB:', error);
    throw error;
  }
}

// ===== API compatible avec les fonctions actuelles de localStorage =====

// User functions
export async function getUser(): Promise<User | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.USER, 'readonly');
      const store = transaction.objectStore(STORES.USER);
      const request = store.get(KEYS.USER);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.user);
        } else {
          resolve(null);
        }
        db.close();
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', event);
        reject('Erreur lors de la récupération de l\'utilisateur');
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

export async function setUser(user: User): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.USER, 'readwrite');
      const store = transaction.objectStore(STORES.USER);
      const request = store.put({ key: KEYS.USER, user });
      
      request.onsuccess = () => {
        resolve();
        db.close();
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la sauvegarde de l\'utilisateur:', event);
        reject('Erreur lors de la sauvegarde de l\'utilisateur');
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
    throw error;
  }
}

export async function updateUser(userData: Partial<User>): Promise<User | null> {
  try {
    const currentUser = await getUser();
    if (!currentUser) return null;
    
    const updatedUser = { 
      ...currentUser, 
      ...userData, 
      updatedAt: new Date().toISOString() 
    };
    
    await setUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return null;
  }
}

// Deck functions
export async function getDecks(): Promise<Deck[]> {
  try {
    return await getAllItems<Deck>(STORES.DECKS);
  } catch (error) {
    console.error('Erreur lors de la récupération des decks:', error);
    return [];
  }
}

export async function getDeck(id: string): Promise<Deck | null> {
  try {
    const deck = await getItemById<Deck>(STORES.DECKS, id);
    return deck || null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du deck ${id}:`, error);
    return null;
  }
}

export async function createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
  try {
    const now = new Date().toISOString();
    
    const newDeck: Deck = {
      ...deck,
      id: `deck_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    await putItem(STORES.DECKS, newDeck);
    return newDeck;
  } catch (error) {
    console.error('Erreur lors de la création du deck:', error);
    throw error;
  }
}

export async function updateDeck(id: string, deckData: Partial<Deck>): Promise<Deck | null> {
  try {
    const currentDeck = await getDeck(id);
    if (!currentDeck) return null;
    
    const updatedDeck = { 
      ...currentDeck, 
      ...deckData, 
      updatedAt: new Date().toISOString() 
    };
    
    await putItem(STORES.DECKS, updatedDeck);
    return updatedDeck;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du deck ${id}:`, error);
    return null;
  }
}

export async function deleteDeck(id: string): Promise<boolean> {
  try {
    // Supprimer le deck
    await deleteItem(STORES.DECKS, id);
    
    // Supprimer les thèmes associés
    const themes = await getThemesByDeck(id);
    for (const theme of themes) {
      await deleteTheme(theme.id);
    }
    
    // Supprimer les flashcards associées
    const flashcards = await getFlashcardsByDeck(id);
    for (const card of flashcards) {
      await deleteFlashcard(card.id);
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du deck ${id}:`, error);
    return false;
  }
}

// Theme functions
export async function getThemes(): Promise<Theme[]> {
  try {
    return await getAllItems<Theme>(STORES.THEMES);
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error);
    return [];
  }
}

export async function getThemesByDeck(deckId: string): Promise<Theme[]> {
  try {
    const themes = await getThemes();
    return themes.filter(theme => theme.deckId === deckId);
  } catch (error) {
    console.error(`Erreur lors de la récupération des thèmes pour le deck ${deckId}:`, error);
    return [];
  }
}

export async function getTheme(id: string): Promise<Theme | undefined> {
  try {
    return await getItemById<Theme>(STORES.THEMES, id);
  } catch (error) {
    console.error(`Erreur lors de la récupération du thème ${id}:`, error);
    return undefined;
  }
}

export async function createTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<Theme> {
  try {
    const now = new Date().toISOString();
    
    const newTheme: Theme = {
      ...theme,
      id: `theme_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    await putItem(STORES.THEMES, newTheme);
    return newTheme;
  } catch (error) {
    console.error('Erreur lors de la création du thème:', error);
    throw error;
  }
}

export async function updateTheme(id: string, themeData: Partial<Theme>): Promise<Theme | null> {
  try {
    const currentTheme = await getTheme(id);
    if (!currentTheme) return null;
    
    const updatedTheme = { 
      ...currentTheme, 
      ...themeData, 
      updatedAt: new Date().toISOString() 
    };
    
    await putItem(STORES.THEMES, updatedTheme);
    return updatedTheme;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du thème ${id}:`, error);
    return null;
  }
}

export async function deleteTheme(id: string): Promise<boolean> {
  try {
    // Supprimer le thème
    await deleteItem(STORES.THEMES, id);
    
    // Mettre à jour les flashcards qui référencent ce thème
    const flashcards = await getFlashcardsByTheme(id);
    for (const card of flashcards) {
      await updateFlashcard(card.id, { themeId: undefined });
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du thème ${id}:`, error);
    return false;
  }
}

// Flashcard functions
export async function getFlashcards(): Promise<Flashcard[]> {
  try {
    return await getAllItems<Flashcard>(STORES.FLASHCARDS);
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    return [];
  }
}

export async function getFlashcardsByDeck(deckId: string): Promise<Flashcard[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.FLASHCARDS, 'readonly');
      const store = transaction.objectStore(STORES.FLASHCARDS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allFlashcards = request.result || [];
        // Filtrer côté client - dans une version future on pourrait 
        // ajouter un index sur deckId pour des performances optimales
        const filteredFlashcards = allFlashcards.filter(card => card.deckId === deckId);
        resolve(filteredFlashcards);
        db.close();
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la récupération des flashcards pour le deck ${deckId}:`, event);
        reject(`Erreur lors de la récupération des flashcards pour le deck ${deckId}`);
        db.close();
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des flashcards pour le deck ${deckId}:`, error);
    return [];
  }
}

export async function getFlashcardsByTheme(themeId: string): Promise<Flashcard[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.FLASHCARDS, 'readonly');
      const store = transaction.objectStore(STORES.FLASHCARDS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allFlashcards = request.result || [];
        // Filtrer côté client pour ce thème spécifique
        const filteredFlashcards = allFlashcards.filter(card => card.themeId === themeId);
        resolve(filteredFlashcards);
        db.close();
      };
      
      request.onerror = (event) => {
        console.error(`Erreur lors de la récupération des flashcards pour le thème ${themeId}:`, event);
        reject(`Erreur lors de la récupération des flashcards pour le thème ${themeId}`);
        db.close();
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des flashcards pour le thème ${themeId}:`, error);
    return [];
  }
}

export async function getFlashcard(id: string): Promise<Flashcard | undefined> {
  try {
    return await getItemById<Flashcard>(STORES.FLASHCARDS, id);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la flashcard ${id}:`, error);
    return undefined;
  }
}

export async function createFlashcard(flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flashcard> {
  try {
    const now = new Date().toISOString();
    
    const newFlashcard: Flashcard = {
      ...flashcard,
      id: `card_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    await putItem(STORES.FLASHCARDS, newFlashcard);
    return newFlashcard;
  } catch (error) {
    console.error('Erreur lors de la création de la flashcard:', error);
    throw error;
  }
}

export async function updateFlashcard(id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> {
  try {
    const currentCard = await getFlashcard(id);
    if (!currentCard) return null;
    
    const updatedCard = { 
      ...currentCard, 
      ...cardData, 
      updatedAt: new Date().toISOString() 
    };
    
    await putItem(STORES.FLASHCARDS, updatedCard);
    return updatedCard;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la flashcard ${id}:`, error);
    return null;
  }
}

export async function deleteFlashcard(id: string): Promise<boolean> {
  try {
    await deleteItem(STORES.FLASHCARDS, id);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la flashcard ${id}:`, error);
    return false;
  }
}

// Shared deck functions
interface SharedDeckCode {
  code: string;
  deckId: string;
  expiresAt?: string;
}

export async function getSharedDeckCodes(): Promise<SharedDeckCode[]> {
  try {
    return await getAllItems<SharedDeckCode>(STORES.SHARED);
  } catch (error) {
    console.error('Erreur lors de la récupération des codes de partage:', error);
    return [];
  }
}

export async function createShareCode(deckId: string, expiresInDays?: number): Promise<string> {
  try {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const newSharedCode: SharedDeckCode = {
      code,
      deckId,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : undefined,
    };
    
    await putItem(STORES.SHARED, newSharedCode);
    return code;
  } catch (error) {
    console.error('Erreur lors de la création du code de partage:', error);
    throw error;
  }
}

export async function getSharedDeck(code: string): Promise<Deck | undefined> {
  try {
    const sharedCode = await getItemById<SharedDeckCode>(STORES.SHARED, code);
    
    if (!sharedCode) return undefined;
    
    // Check if expired
    if (sharedCode.expiresAt && new Date(sharedCode.expiresAt) < new Date()) {
      // Remove expired code
      await deleteItem(STORES.SHARED, code);
      return undefined;
    }
    
    const deck = await getDeck(sharedCode.deckId);
    return deck || undefined;
  } catch (error) {
    console.error(`Erreur lors de la récupération du deck partagé avec le code ${code}:`, error);
    return undefined;
  }
}

// Fonctions pour les decks partagés
export async function getSharedImportedDecks(): Promise<{originalId: string, localDeckId: string}[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SHARED_DECKS, 'readonly');
      const store = transaction.objectStore(STORES.SHARED_DECKS);
      const request = store.get(KEYS.SHARED_DECKS_MAP);
      
      request.onsuccess = () => {
        if (request.result) {
          const map = request.result.map;
          const result = Object.entries(map).map(([originalId, localDeckId]) => ({
            originalId,
            localDeckId: localDeckId as string
          }));
          resolve(result);
        } else {
          resolve([]);
        }
        db.close();
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la récupération des decks importés:', event);
        reject('Erreur lors de la récupération des decks importés');
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des decks importés:', error);
    return [];
  }
}

export async function setSharedDeckMap(map: {[originalId: string]: string}): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SHARED_DECKS, 'readwrite');
      const store = transaction.objectStore(STORES.SHARED_DECKS);
      const request = store.put({ key: KEYS.SHARED_DECKS_MAP, map });
      
      request.onsuccess = () => {
        resolve();
        db.close();
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la sauvegarde de la carte des decks partagés:', event);
        reject('Erreur lors de la sauvegarde de la carte des decks partagés');
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la carte des decks partagés:', error);
    throw error;
  }
}

// Fonction pour obtenir la map des decks partagés
async function getSharedDecksMap(): Promise<{[originalId: string]: string}> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SHARED_DECKS, 'readonly');
      const store = transaction.objectStore(STORES.SHARED_DECKS);
      const request = store.get(KEYS.SHARED_DECKS_MAP);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.map);
        } else {
          resolve({});
        }
        db.close();
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la récupération de la carte des decks partagés:', event);
        reject('Erreur lors de la récupération de la carte des decks partagés');
        db.close();
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la carte des decks partagés:', error);
    return {};
  }
}

export async function importDeckFromJson(sharedDeckData: SharedDeckExport, authorId: string): Promise<string> {
  try {
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
    const sharedDecksMap = await getSharedDecksMap();
    sharedDecksMap[sharedDeckData.originalId] = newDeck.id;
    await setSharedDeckMap(sharedDecksMap);
    
    return newDeck.id;
  } catch (error) {
    console.error('Erreur lors de l\'importation du deck:', error);
    throw error;
  }
}

export async function updateDeckFromJson(sharedDeckData: SharedDeckExport): Promise<boolean> {
  try {
    // Vérifier si le deck original a déjà été importé
    const sharedDecksMap = await getSharedDecksMap();
    const localDeckId = sharedDecksMap[sharedDeckData.originalId];
    
    if (!localDeckId) {
      return false; // Le deck n'a pas été importé auparavant
    }
    
    // Vérifier si le deck existe encore localement
    const localDeck = await getDeck(localDeckId);
    if (!localDeck) {
      // Le deck a été supprimé localement, supprimer la référence
      delete sharedDecksMap[sharedDeckData.originalId];
      await setSharedDeckMap(sharedDecksMap);
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
  } catch (error) {
    console.error('Erreur lors de la mise à jour du deck:', error);
    return false;
  }
}

// Fonction pour exporter un deck au format JSON
export async function exportDeckToJson(deckId: string): Promise<SharedDeckExport> {
  try {
    const deck = await getDeck(deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }
    
    const themes = await getThemesByDeck(deckId);
    const flashcards = await getFlashcardsByDeck(deckId);
    
    const sharedDeck: SharedDeckExport = {
      id: `shared_${Date.now()}`,
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
  } catch (error) {
    console.error(`Erreur lors de l'exportation du deck ${deckId}:`, error);
    throw error;
  }
}