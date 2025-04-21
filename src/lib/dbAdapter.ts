// Adaptateur pour la base de données qui maintient une compatibilité avec l'interface localStorage
import { v4 as uuidv4 } from 'uuid';
import { User, Deck, Theme, Flashcard } from './localStorage';

// Types des fonctions de l'adaptateur de base de données
type ApiFunction = <T>(endpoint: string, options?: RequestInit) => Promise<T>;

// Cache pour minimiser les appels API
const cache: Record<string, any> = {};
const cacheExpiry: Record<string, number> = {};
const CACHE_DURATION = 60000; // 1 minute par défaut

// Endpoints API pour les différentes ressources
const API_ENDPOINTS = {
  USERS: '/api/users',
  DECKS: '/api/decks',
  THEMES: '/api/themes',
  FLASHCARDS: '/api/flashcards',
  SHARED_CODES: '/api/shared-codes',
};

// Configuration de l'API
let apiBaseUrl = '';
let isInitialized = false;

/**
 * Initialise l'adaptateur de base de données
 * @param baseUrl URL de base de l'API (optionnel, par défaut: '')
 */
export const initDbAdapter = (baseUrl: string = '') => {
  apiBaseUrl = baseUrl;
  isInitialized = true;
  console.log(`Adaptateur DB initialisé avec baseUrl: ${baseUrl}`);
};

// Fonction générique pour effectuer des appels API avec gestion d'erreur
const apiRequest: ApiFunction = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  if (!isInitialized) {
    console.warn('Adaptateur DB non initialisé, initialisation avec baseUrl par défaut');
    initDbAdapter();
  }

  try {
    const url = `${apiBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de l'appel API vers ${endpoint}:`, error);
    throw error;
  }
};

// Fonction pour gérer le cache
const withCache = async <T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  duration: number = CACHE_DURATION
): Promise<T> => {
  const now = Date.now();
  
  // Si les données sont en cache et valides, les retourner
  if (cacheKey in cache && cacheExpiry[cacheKey] > now) {
    return Promise.resolve(cache[cacheKey] as T);
  }
  
  // Sinon, récupérer les données et les mettre en cache
  try {
    const data = await fetchFn();
    cache[cacheKey] = data;
    cacheExpiry[cacheKey] = now + duration;
    return data;
  } catch (error) {
    // En cas d'erreur, supprimer le cache potentiellement invalide
    delete cache[cacheKey];
    delete cacheExpiry[cacheKey];
    throw error;
  }
};

// Fonctions utilisateur avec compatibilité localStorage
export const getUser = async (): Promise<User | null> => {
  try {
    return await withCache('user', async () => {
      const response = await apiRequest<User>(API_ENDPOINTS.USERS + '/current');
      return response || null;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

export const setUser = async (user: User): Promise<void> => {
  try {
    if (!user.id) {
      user.id = uuidv4();
    }
    
    await apiRequest(API_ENDPOINTS.USERS, {
      method: 'POST',
      body: JSON.stringify(user),
    });
    
    // Invalider le cache utilisateur
    delete cache['user'];
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
  }
};

export const updateUser = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const user = await getUser();
    if (!user) return null;
    
    const updatedUser = await apiRequest<User>(API_ENDPOINTS.USERS, {
      method: 'PATCH',
      body: JSON.stringify({ ...userData, id: user.id }),
    });
    
    // Invalider le cache utilisateur
    delete cache['user'];
    
    return updatedUser;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return null;
  }
};

// Fonctions deck avec compatibilité localStorage
export const getDecks = async (): Promise<Deck[]> => {
  try {
    return await withCache('decks', async () => {
      return await apiRequest<Deck[]>(API_ENDPOINTS.DECKS);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des decks:', error);
    return [];
  }
};

export const getDeck = async (id: string): Promise<Deck | null> => {
  try {
    return await withCache(`deck_${id}`, async () => {
      const response = await apiRequest<Deck>(`${API_ENDPOINTS.DECKS}/${id}`);
      return response || null;
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération du deck ${id}:`, error);
    return null;
  }
};

export const createDeck = async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> => {
  try {
    const newDeck = await apiRequest<Deck>(API_ENDPOINTS.DECKS, {
      method: 'POST',
      body: JSON.stringify(deck),
    });
    
    // Invalider le cache des decks
    delete cache['decks'];
    
    return newDeck;
  } catch (error) {
    console.error('Erreur lors de la création du deck:', error);
    throw error;
  }
};

export const updateDeck = async (id: string, deckData: Partial<Deck>): Promise<Deck | null> => {
  try {
    const updatedDeck = await apiRequest<Deck>(`${API_ENDPOINTS.DECKS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(deckData),
    });
    
    // Invalider les caches
    delete cache['decks'];
    delete cache[`deck_${id}`];
    
    return updatedDeck;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du deck ${id}:`, error);
    return null;
  }
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  try {
    await apiRequest(`${API_ENDPOINTS.DECKS}/${id}`, {
      method: 'DELETE',
    });
    
    // Invalider les caches
    delete cache['decks'];
    delete cache[`deck_${id}`];
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du deck ${id}:`, error);
    return false;
  }
};

// Fonctions thème avec compatibilité localStorage
export const getThemes = async (): Promise<Theme[]> => {
  try {
    return await withCache('themes', async () => {
      return await apiRequest<Theme[]>(API_ENDPOINTS.THEMES);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error);
    return [];
  }
};

export const getThemesByDeck = async (deckId: string): Promise<Theme[]> => {
  try {
    return await withCache(`themes_deck_${deckId}`, async () => {
      return await apiRequest<Theme[]>(`${API_ENDPOINTS.DECKS}/${deckId}/themes`);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des thèmes pour le deck ${deckId}:`, error);
    return [];
  }
};

export const getTheme = async (id: string): Promise<Theme | undefined> => {
  try {
    return await withCache(`theme_${id}`, async () => {
      return await apiRequest<Theme>(`${API_ENDPOINTS.THEMES}/${id}`);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération du thème ${id}:`, error);
    return undefined;
  }
};

export const createTheme = async (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<Theme> => {
  try {
    const newTheme = await apiRequest<Theme>(API_ENDPOINTS.THEMES, {
      method: 'POST',
      body: JSON.stringify(theme),
    });
    
    // Invalider les caches
    delete cache['themes'];
    delete cache[`themes_deck_${theme.deckId}`];
    
    return newTheme;
  } catch (error) {
    console.error('Erreur lors de la création du thème:', error);
    throw error;
  }
};

export const updateTheme = async (id: string, themeData: Partial<Theme>): Promise<Theme | null> => {
  try {
    const theme = await getTheme(id);
    if (!theme) return null;
    
    const updatedTheme = await apiRequest<Theme>(`${API_ENDPOINTS.THEMES}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(themeData),
    });
    
    // Invalider les caches
    delete cache['themes'];
    delete cache[`theme_${id}`];
    delete cache[`themes_deck_${theme.deckId}`];
    
    return updatedTheme;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du thème ${id}:`, error);
    return null;
  }
};

export const deleteTheme = async (id: string): Promise<boolean> => {
  try {
    const theme = await getTheme(id);
    if (!theme) return false;
    
    await apiRequest(`${API_ENDPOINTS.THEMES}/${id}`, {
      method: 'DELETE',
    });
    
    // Invalider les caches
    delete cache['themes'];
    delete cache[`theme_${id}`];
    delete cache[`themes_deck_${theme.deckId}`];
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du thème ${id}:`, error);
    return false;
  }
};

// Fonctions flashcard avec compatibilité localStorage
export const getFlashcards = async (): Promise<Flashcard[]> => {
  try {
    return await withCache('flashcards', async () => {
      return await apiRequest<Flashcard[]>(API_ENDPOINTS.FLASHCARDS);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des flashcards:', error);
    return [];
  }
};

export const getFlashcardsByDeck = async (deckId: string): Promise<Flashcard[]> => {
  try {
    return await withCache(`flashcards_deck_${deckId}`, async () => {
      return await apiRequest<Flashcard[]>(`${API_ENDPOINTS.DECKS}/${deckId}/flashcards`);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des flashcards pour le deck ${deckId}:`, error);
    return [];
  }
};

export const getFlashcardsByTheme = async (themeId: string): Promise<Flashcard[]> => {
  try {
    return await withCache(`flashcards_theme_${themeId}`, async () => {
      return await apiRequest<Flashcard[]>(`${API_ENDPOINTS.THEMES}/${themeId}/flashcards`);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des flashcards pour le thème ${themeId}:`, error);
    return [];
  }
};

export const getFlashcard = async (id: string): Promise<Flashcard | undefined> => {
  try {
    return await withCache(`flashcard_${id}`, async () => {
      return await apiRequest<Flashcard>(`${API_ENDPOINTS.FLASHCARDS}/${id}`);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération de la flashcard ${id}:`, error);
    return undefined;
  }
};

export const createFlashcard = async (flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flashcard> => {
  try {
    const newFlashcard = await apiRequest<Flashcard>(API_ENDPOINTS.FLASHCARDS, {
      method: 'POST',
      body: JSON.stringify(flashcard),
    });
    
    // Invalider les caches
    delete cache['flashcards'];
    delete cache[`flashcards_deck_${flashcard.deckId}`];
    if (flashcard.themeId) {
      delete cache[`flashcards_theme_${flashcard.themeId}`];
    }
    
    return newFlashcard;
  } catch (error) {
    console.error('Erreur lors de la création de la flashcard:', error);
    throw error;
  }
};

export const updateFlashcard = async (id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> => {
  try {
    const flashcard = await getFlashcard(id);
    if (!flashcard) return null;
    
    const updatedFlashcard = await apiRequest<Flashcard>(`${API_ENDPOINTS.FLASHCARDS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cardData),
    });
    
    // Invalider les caches
    delete cache['flashcards'];
    delete cache[`flashcard_${id}`];
    delete cache[`flashcards_deck_${flashcard.deckId}`];
    if (flashcard.themeId) {
      delete cache[`flashcards_theme_${flashcard.themeId}`];
    }
    
    return updatedFlashcard;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la flashcard ${id}:`, error);
    return null;
  }
};

export const deleteFlashcard = async (id: string): Promise<boolean> => {
  try {
    const flashcard = await getFlashcard(id);
    if (!flashcard) return false;
    
    await apiRequest(`${API_ENDPOINTS.FLASHCARDS}/${id}`, {
      method: 'DELETE',
    });
    
    // Invalider les caches
    delete cache['flashcards'];
    delete cache[`flashcard_${id}`];
    delete cache[`flashcards_deck_${flashcard.deckId}`];
    if (flashcard.themeId) {
      delete cache[`flashcards_theme_${flashcard.themeId}`];
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la flashcard ${id}:`, error);
    return false;
  }
};

// Interface partagée pour les codes de partage et les decks importés
// Ces fonctions sont nécessaires pour maintenir la compatibilité

export interface SharedDeckCode {
  code: string;
  deckId: string;
  expiresAt?: string;
}

export const getSharedDeckCodes = async (): Promise<SharedDeckCode[]> => {
  try {
    return await withCache('shared_codes', async () => {
      return await apiRequest<SharedDeckCode[]>(API_ENDPOINTS.SHARED_CODES);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des codes de partage:', error);
    return [];
  }
};

export const createShareCode = async (deckId: string, expiresInDays?: number): Promise<string> => {
  try {
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString() 
      : undefined;
    
    const response = await apiRequest<{ code: string }>(API_ENDPOINTS.SHARED_CODES, {
      method: 'POST',
      body: JSON.stringify({ deckId, expiresAt }),
    });
    
    // Invalider le cache
    delete cache['shared_codes'];
    
    return response.code;
  } catch (error) {
    console.error('Erreur lors de la création du code de partage:', error);
    throw error;
  }
};

export const getSharedDeck = async (code: string): Promise<Deck | undefined> => {
  try {
    return await withCache(`shared_deck_${code}`, async () => {
      return await apiRequest<Deck>(`${API_ENDPOINTS.SHARED_CODES}/${code}/deck`);
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération du deck partagé avec le code ${code}:`, error);
    return undefined;
  }
};

// Fonction pour vider le cache (utile lors des tests ou pour forcer un rafraîchissement)
export const clearCache = (key?: string): void => {
  if (key) {
    delete cache[key];
    delete cacheExpiry[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
    Object.keys(cacheExpiry).forEach(k => delete cacheExpiry[k]);
  }
};

// Initialiser l'adaptateur avec les valeurs par défaut
initDbAdapter();