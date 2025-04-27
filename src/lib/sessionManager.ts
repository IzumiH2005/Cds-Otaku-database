/**
 * Module de gestion de session utilisant IndexedDB
 * 
 * Fournit des fonctions de gestion de session qui utilisent IndexedDB pour le stockage
 * Comprend des versions synchrones pour la compatibilité avec le code existant
 */

import { v4 as uuidv4 } from 'uuid';
import * as IndexedDB from './enhancedIndexedDB';

// Configuration exportée pour l'accès global
export const DB_CONFIG = {
  NAME: 'cds-flashcard-db',
  VERSION: 1,
  STORE_NAME: 'app-data',
};

export const KEYS = {
  SESSION_KEY: 'sessionKey',
  SESSION_DATA_PREFIX: 'session_',
  USER_DATA_KEY: 'userData',
};

// Interfaces
interface SessionData {
  key: string;
  lastActive: string;
  userData?: Record<string, any>;
  exportDate?: string;
}

// Fonctions asynchrones utilisant IndexedDB
export const hasSession = async (): Promise<boolean> => {
  const sessionKey = await getSessionKey();
  return sessionKey !== null;
};

export const getSessionKey = async (): Promise<string | null> => {
  return await IndexedDB.loadData(KEYS.SESSION_KEY, null);
};

export const saveSessionKey = async (key: string): Promise<void> => {
  await IndexedDB.saveData(KEYS.SESSION_KEY, key);
  
  // Enregistrer des métadonnées de session
  await IndexedDB.saveData(`${KEYS.SESSION_DATA_PREFIX}${key}`, {
    key,
    lastActive: new Date().toISOString()
  });
};

export const generateSessionKey = (): string => {
  const key = uuidv4();
  console.log("Generated new session key:", key.substring(0, 5) + '...');
  
  // Aussi sauvegarder dans localStorage immédiatement pour garantir l'accès synchrone
  try {
    localStorage.setItem(KEYS.SESSION_KEY, key);
    console.log("Saved new key to localStorage for immediate access");
  } catch (error) {
    console.error("Error saving key to localStorage:", error);
  }
  
  return key;
};

export const verifySession = async (key: string): Promise<boolean> => {
  if (!key) return false;
  
  const storedSessionKey = await getSessionKey();
  return key === storedSessionKey;
};

export const exportSessionData = async (): Promise<string> => {
  try {
    const sessionKey = await getSessionKey();
    if (!sessionKey) {
      throw new Error("Aucune session active");
    }
    
    // Récupérer les données utilisateur
    const userData = await IndexedDB.loadData(KEYS.USER_DATA_KEY, {});
    
    // Récupérer les données de decks, thèmes et flashcards
    const decks = await IndexedDB.loadData("decks", []);
    const themes = await IndexedDB.loadData("themes", []);
    const flashcards = await IndexedDB.loadData("flashcards", []);
    
    // Créer le package de données
    const exportData = {
      sessionKey,
      userData,
      decks,
      themes,
      flashcards,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    return JSON.stringify(exportData);
  } catch (error) {
    console.error("Erreur lors de l'exportation des données:", error);
    throw error;
  }
};

export const importSessionData = async (data: string): Promise<boolean> => {
  try {
    // Parser les données importées
    const importedData = JSON.parse(data);
    
    // Validation de base
    if (!importedData || !importedData.sessionKey) {
      throw new Error("Données invalides");
    }
    
    // Sauvegarder la clé de session
    await saveSessionKey(importedData.sessionKey);
    
    // Sauvegarder les données utilisateur
    if (importedData.userData) {
      await IndexedDB.saveData(KEYS.USER_DATA_KEY, importedData.userData);
    }
    
    // Sauvegarder les decks, thèmes et flashcards
    if (importedData.decks) {
      await IndexedDB.saveData("decks", importedData.decks);
    }
    
    if (importedData.themes) {
      await IndexedDB.saveData("themes", importedData.themes);
    }
    
    if (importedData.flashcards) {
      await IndexedDB.saveData("flashcards", importedData.flashcards);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'importation des données:", error);
    return false;
  }
};

// Versions synchrones pour la compatibilité avec le code existant
// Ces fonctions lancent des opérations asynchrones en arrière-plan

export const hasSessionSync = (): boolean => {
  try {
    // Tentative de lecture directe depuis localStorage pour compatibilité
    const sessionKey = localStorage.getItem(KEYS.SESSION_KEY);
    
    // Gestion du cas où sessionKey est défini mais est une chaîne vide
    const hasValidKey = sessionKey !== null && sessionKey.trim() !== '';
    
    if (hasValidKey) {
      console.log("hasSessionSync: Valid session key found in localStorage");
    } else {
      console.log("hasSessionSync: No valid session key in localStorage");
    }
    
    // Déclenche l'opération asynchrone réelle en arrière-plan sans bloquer
    setTimeout(async () => {
      try {
        const result = await hasSession();
        console.log("Session check (async):", result);
        
        // Si le résultat asynchrone est différent de la vérification synchrone,
        // on met à jour localStorage pour la cohérence
        if (result && !hasValidKey) {
          const key = await getSessionKey();
          if (key) {
            localStorage.setItem(KEYS.SESSION_KEY, key);
            console.log("Updated localStorage with session key from IndexedDB");
          }
        }
      } catch (error) {
        console.error("Error checking session (async):", error);
      }
    }, 0);
    
    return hasValidKey;
  } catch (error) {
    console.error("Error in hasSessionSync:", error);
    return false;
  }
};

export const getSessionKeySync = (): string => {
  try {
    // Lire depuis localStorage pour compatibilité immédiate
    const sessionKey = localStorage.getItem(KEYS.SESSION_KEY);
    
    if (sessionKey) {
      console.log("getSessionKeySync: Retrieved key from localStorage:", sessionKey.substring(0, 3) + '...');
    } else {
      console.log("getSessionKeySync: No key found in localStorage");
    }
    
    // Si aucune clé en localStorage, vérifier au moins une fois directement 
    // les données de sauvegarde (sans attendre IndexedDB)
    if (!sessionKey) {
      try {
        const backupKey = localStorage.getItem('backup_' + KEYS.SESSION_KEY);
        if (backupKey) {
          const parsedKey = JSON.parse(backupKey);
          if (typeof parsedKey === 'string') {
            console.log("getSessionKeySync: Retrieved key from backup system");
            // Stocker directement dans localStorage pour les prochains appels
            localStorage.setItem(KEYS.SESSION_KEY, parsedKey);
            return parsedKey;
          }
        }
      } catch (e) {
        console.warn("Error reading from backup:", e);
      }
    }
    
    // Déclenche l'opération réelle en arrière-plan sans bloquer
    setTimeout(async () => {
      try {
        const key = await getSessionKey();
        if (key) {
          console.log("Session key retrieved (async):", key.substring(0, 3) + '...');
          
          // Si la clé est différente de celle en localStorage, mettre à jour localStorage
          if (key !== sessionKey) {
            localStorage.setItem(KEYS.SESSION_KEY, key);
            console.log("Updated localStorage with session key from IndexedDB");
          }
        } else {
          console.log("No session key found in IndexedDB");
          
          // Si aucune clé dans IndexedDB mais une clé en localStorage, synchroniser vers IndexedDB
          if (sessionKey) {
            await saveSessionKey(sessionKey);
            console.log("Synchronized localStorage key to IndexedDB");
          }
        }
      } catch (error) {
        console.error("Error retrieving session key (async):", error);
      }
    }, 0);
    
    // Retourner la clé de localStorage ou une chaîne vide
    return sessionKey || "";
  } catch (error) {
    console.error("Error in getSessionKeySync:", error);
    return "";
  }
};

export const saveSessionKeySync = (key: string): void => {
  // Pour la compatibilité, sauvegarde également dans localStorage
  try {
    localStorage.setItem(KEYS.SESSION_KEY, key);
  } catch (error) {
    console.error("Error in saveSessionKeySync:", error);
  }
  
  // Lancer l'opération asynchrone en arrière-plan
  setTimeout(async () => {
    await saveSessionKey(key);
    console.log("Session key saved (async)");
  }, 0);
};

export const generateSessionKeySync = (): string => {
  // Cette fonction est déjà synchrone
  return generateSessionKey();
};

export const exportSessionDataSync = (): string => {
  try {
    // Tenter de récupérer les données de localStorage pour compatibilité immédiate
    const sessionKey = localStorage.getItem(KEYS.SESSION_KEY) || "";
    const exportData = {
      key: sessionKey,
      lastActive: new Date().toISOString(),
      userData: {},
      exportDate: new Date().toISOString()
    };
    
    // Déclencher l'exportation réelle en arrière-plan
    setTimeout(async () => {
      try {
        const asyncExportData = await exportSessionData();
        console.log("Session data exported (async) successfully");
        
        // Stocker en localStorage pour les futures requêtes synchrones
        localStorage.setItem('lastExportData', asyncExportData);
      } catch (error) {
        console.error("Error exporting session data (async):", error);
      }
    }, 0);
    
    // Vérifier s'il y a des données d'export précédentes
    const lastExport = localStorage.getItem('lastExportData');
    if (lastExport) {
      return lastExport;
    }
    
    return JSON.stringify(exportData);
  } catch (error) {
    console.error("Error in exportSessionDataSync:", error);
    return JSON.stringify({
      key: "",
      lastActive: new Date().toISOString(),
      userData: {},
      exportDate: new Date().toISOString()
    });
  }
};

export const importSessionDataSync = (data: string): boolean => {
  try {
    // Vérifier que les données sont au bon format
    const parsedData = JSON.parse(data);
    if (!parsedData || !parsedData.key) {
      console.error("Invalid import data format");
      return false;
    }
    
    // Mettre à jour localStorage immédiatement pour compatibilité
    localStorage.setItem(KEYS.SESSION_KEY, parsedData.key);
    
    // Lancer l'importation asynchrone en arrière-plan
    setTimeout(async () => {
      try {
        const result = await importSessionData(data);
        console.log("Session data import result (async):", result);
      } catch (error) {
        console.error("Error importing session data (async):", error);
      }
    }, 0);
    
    return true;
  } catch (error) {
    console.error("Error in importSessionDataSync:", error);
    return false;
  }
};

export const verifySessionSync = (key: string): boolean => {
  try {
    if (!key || key.trim() === '') {
      console.log("verifySessionSync: No key provided, session invalid");
      return false;
    }

    // Vérification simple et immédiate pour compatibilité avec localStorage
    const currentKey = localStorage.getItem(KEYS.SESSION_KEY);
    
    // Validation plus stricte
    if (!currentKey || currentKey.trim() === '') {
      console.log("verifySessionSync: No key in localStorage to verify against");
      
      // Si aucune clé en localStorage, mais qu'une clé est fournie, on la considère valide
      // et on la sauvegarde en localStorage pour faciliter la migration
      localStorage.setItem(KEYS.SESSION_KEY, key);
      console.log("verifySessionSync: Saved provided key to localStorage");
      
      // Lancer la vérification asynchrone en arrière-plan
      setTimeout(async () => {
        try {
          // Sauvegarder la clé en IndexedDB
          await saveSessionKey(key);
          console.log("verifySessionSync: Saved key to IndexedDB asynchronously");
        } catch (asyncError) {
          console.error("Error in verifySessionSync async operation:", asyncError);
        }
      }, 0);
      
      return true;
    }
    
    // Si les deux clés existent, les comparer
    const isValid = key === currentKey;
    console.log("verifySessionSync: Key validation result:", isValid);
    
    // Déclencher la vérification asynchrone complète en arrière-plan
    setTimeout(async () => {
      try {
        const result = await verifySession(key);
        console.log("Session verification result (async):", result);
        
        // Si les résultats sont différents, mettre à jour localStorage
        if (result && !isValid) {
          localStorage.setItem(KEYS.SESSION_KEY, key);
          console.log("verifySessionSync: Updated localStorage with valid key from async check");
        }
      } catch (error) {
        console.error("Error verifying session (async):", error);
      }
    }, 0);
    
    return isValid;
  } catch (error) {
    console.error("Error in verifySessionSync:", error);
    return false;
  }
};

// Fonctions d'étude et de statistiques
export const recordCardStudy = async (correct: boolean): Promise<void> => {
  try {
    const userData = await IndexedDB.loadData(KEYS.USER_DATA_KEY, {
      stats: {
        cardsStudied: 0,
        correctAnswers: 0,
        incorrectAnswers: 0
      }
    });
    
    // S'assurer que les stats existent
    if (!userData.stats) {
      userData.stats = {
        cardsStudied: 0,
        correctAnswers: 0,
        incorrectAnswers: 0
      };
    }
    
    // Mettre à jour les statistiques
    userData.stats.cardsStudied = (userData.stats.cardsStudied || 0) + 1;
    
    if (correct) {
      userData.stats.correctAnswers = (userData.stats.correctAnswers || 0) + 1;
    } else {
      userData.stats.incorrectAnswers = (userData.stats.incorrectAnswers || 0) + 1;
    }
    
    // Sauvegarder les modifications
    await IndexedDB.saveData(KEYS.USER_DATA_KEY, userData);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'étude:", error);
  }
};

export const updateSessionStats = async (stats: Partial<{ 
  studySessions: number;
  totalStudyTime: number;
  lastStudyDate: string;
}>): Promise<void> => {
  try {
    const userData = await IndexedDB.loadData(KEYS.USER_DATA_KEY, {
      stats: {
        studySessions: 0,
        totalStudyTime: 0,
        lastStudyDate: new Date().toISOString()
      }
    });
    
    // S'assurer que les stats existent
    if (!userData.stats) {
      userData.stats = {
        studySessions: 0,
        totalStudyTime: 0,
        lastStudyDate: new Date().toISOString()
      };
    }
    
    // Mettre à jour les statistiques
    if (stats.studySessions) {
      userData.stats.studySessions = (userData.stats.studySessions || 0) + stats.studySessions;
    }
    
    if (stats.totalStudyTime) {
      userData.stats.totalStudyTime = (userData.stats.totalStudyTime || 0) + stats.totalStudyTime;
    }
    
    if (stats.lastStudyDate) {
      userData.stats.lastStudyDate = stats.lastStudyDate;
    }
    
    // Sauvegarder les modifications
    await IndexedDB.saveData(KEYS.USER_DATA_KEY, userData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statistiques de session:", error);
  }
};

/**
 * Récupère les statistiques de session de l'utilisateur
 * @returns Les statistiques de session
 */
export const getSessionStats = async (): Promise<{
  cardsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
  studySessions: number;
  totalStudyTime: number;
  lastStudyDate: string;
}> => {
  try {
    const userData = await IndexedDB.loadData(KEYS.USER_DATA_KEY, {
      stats: {
        cardsStudied: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        studySessions: 0,
        totalStudyTime: 0,
        lastStudyDate: new Date().toISOString()
      }
    });
    
    return userData.stats || {
      cardsStudied: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      studySessions: 0,
      totalStudyTime: 0,
      lastStudyDate: new Date().toISOString()
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      cardsStudied: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      studySessions: 0,
      totalStudyTime: 0,
      lastStudyDate: new Date().toISOString()
    };
  }
};

/**
 * Version synchrone de getSessionStats pour la compatibilité
 * @returns Les statistiques de session
 */
export const getSessionStatsSync = (): {
  cardsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
  studySessions: number;
  totalStudyTime: number;
  lastStudyDate: string;
} => {
  // Version synchrone qui initialise une opération asynchrone en arrière-plan
  // Valeurs par défaut retournées immédiatement
  const defaultStats = {
    cardsStudied: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    studySessions: 0,
    totalStudyTime: 0,
    lastStudyDate: new Date().toISOString()
  };
  
  setTimeout(async () => {
    try {
      const stats = await getSessionStats();
      console.log("Stats retrieved (async):", stats);
    } catch (error) {
      console.error("Error retrieving stats (async):", error);
    }
  }, 0);
  
  return defaultStats;
};