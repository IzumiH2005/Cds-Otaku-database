/**
 * Module de sauvegarde pour garantir l'accès aux données essentielles
 * en cas de problème avec IndexedDB
 * 
 * Ce module utilise localStorage comme solution de secours et
 * maintient une copie des données critiques qui peuvent être
 * récupérées en cas d'échec d'IndexedDB
 */

import { KEYS } from './sessionManager';

// Clés utilisées pour la sauvegarde dans localStorage
const BACKUP_PREFIX = 'backup_';
const BACKUP_TIMESTAMP = 'backup_timestamp';
const BACKUP_KEYS = [
  KEYS.SESSION_KEY,
  'decks',
  'themes',
  'flashcards',
  KEYS.USER_DATA_KEY
];

/**
 * Sauvegarde des données essentielles dans localStorage
 * @param key Clé d'accès aux données
 * @param data Données à sauvegarder
 */
export const backupData = (key: string, data: any): void => {
  if (!BACKUP_KEYS.includes(key)) return;
  
  try {
    // Convertir les données en chaîne JSON
    const serializedData = JSON.stringify(data);
    
    // Stocker dans localStorage avec un préfixe
    localStorage.setItem(`${BACKUP_PREFIX}${key}`, serializedData);
    
    // Mettre à jour le timestamp
    localStorage.setItem(BACKUP_TIMESTAMP, Date.now().toString());
    
    console.log(`Backup created for ${key}`);
  } catch (error) {
    console.error(`Error creating backup for ${key}:`, error);
  }
};

/**
 * Récupération des données de sauvegarde
 * @param key Clé d'accès aux données
 * @param defaultValue Valeur par défaut si aucune sauvegarde n'existe
 * @returns Les données récupérées ou la valeur par défaut
 */
export const getBackupData = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedData = localStorage.getItem(`${BACKUP_PREFIX}${key}`);
    if (!serializedData) return defaultValue;
    
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Error retrieving backup for ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Vérifie si une sauvegarde existe pour une clé donnée
 * @param key Clé à vérifier
 * @returns true si une sauvegarde existe, false sinon
 */
export const hasBackup = (key: string): boolean => {
  return localStorage.getItem(`${BACKUP_PREFIX}${key}`) !== null;
};

/**
 * Obtenir l'âge de la dernière sauvegarde en millisecondes
 * @returns Âge de la dernière sauvegarde ou -1 si aucune sauvegarde n'existe
 */
export const getBackupAge = (): number => {
  const timestamp = localStorage.getItem(BACKUP_TIMESTAMP);
  if (!timestamp) return -1;
  
  const backupTime = parseInt(timestamp, 10);
  return Date.now() - backupTime;
};

/**
 * Supprime toutes les sauvegardes
 */
export const clearBackups = (): void => {
  try {
    BACKUP_KEYS.forEach(key => {
      localStorage.removeItem(`${BACKUP_PREFIX}${key}`);
    });
    localStorage.removeItem(BACKUP_TIMESTAMP);
    
    console.log("All backups cleared");
  } catch (error) {
    console.error("Error clearing backups:", error);
  }
};

/**
 * Intègre le module de sauvegarde avec enhancedIndexedDB
 * Récupère les données existantes dans localStorage et effectue la migration si nécessaire
 */
export const initBackupSystem = (): void => {
  console.log("Backup system initialization started");
  
  try {
    // Collecter les clés de localStorage qui ne sont pas des sauvegardes
    const localStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith(BACKUP_PREFIX)) {
        localStorageKeys.push(key);
      }
    }
    
    // Journaliser le nombre de clés trouvées
    console.log(`Found ${localStorageKeys.length} keys in localStorage to backup`);
    
    // Créer des sauvegardes pour les données importantes
    localStorageKeys.forEach(key => {
      if (BACKUP_KEYS.includes(key)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Tenter de parser comme JSON si possible
            try {
              const parsedValue = JSON.parse(value);
              backupData(key, parsedValue);
              console.log(`Created backup for ${key} (parsed JSON)`);
            } catch {
              // Sauvegarder comme chaîne si ce n'est pas du JSON valide
              backupData(key, value);
              console.log(`Created backup for ${key} (raw string)`);
            }
          }
        } catch (err) {
          console.error(`Error backing up localStorage key ${key}:`, err);
        }
      }
    });
    
    // Mise à jour du timestamp global
    localStorage.setItem(BACKUP_TIMESTAMP, Date.now().toString());
    console.log("Backup system successfully initialized");
  } catch (error) {
    console.error("Error during backup system initialization:", error);
  }
};