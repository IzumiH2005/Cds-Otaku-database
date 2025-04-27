/**
 * Module d'amélioration d'IndexedDB permettant de stocker des quantités importantes de données
 * sans les limitations de localStorage (5MB)
 * 
 * Comprend un système de sauvegarde automatique via localStorage pour garantir 
 * l'accès aux données critiques en cas de problème avec IndexedDB
 */

// Import du système de sauvegarde
import { backupData, getBackupData, hasBackup } from './storageBackup';

// Constantes pour la base de données
const DB_NAME = 'cds-flashcard-db';
const DB_VERSION = 1;
const STORE_NAME = 'app-data';

// Indication si IndexedDB est disponible et fonctionnel
let isIndexedDBAvailable = true;

/**
 * Initialise la base de données IndexedDB avec la structure nécessaire.
 * Retourne une promesse qui se résout lorsque la base de données est prête.
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("Erreur d'ouverture de la base de données IndexedDB:", event);
      reject("Impossible d'ouvrir la base de données IndexedDB");
    };
    
    request.onsuccess = (event) => {
      const db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Créer un object store pour stocker les données
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Effectue une transaction en lecture seule sur la base de données.
 * @param callback Fonction qui reçoit l'object store et effectue des opérations
 * @returns Une promesse qui se résout avec le résultat de la fonction callback
 */
const readTransaction = async <T>(callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = callback(store);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error("Erreur lors de la lecture depuis IndexedDB:", event);
      reject("Erreur de lecture IndexedDB");
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * Effectue une transaction en écriture sur la base de données.
 * @param callback Fonction qui reçoit l'object store et effectue des opérations
 * @returns Une promesse qui se résout quand la transaction est terminée
 */
const writeTransaction = async <T>(callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = callback(store);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error("Erreur lors de l'écriture dans IndexedDB:", event);
      reject("Erreur d'écriture IndexedDB");
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

/**
 * Sauvegarde des données
 * @param key Clé principale pour les données
 * @param data Données à sauvegarder
 */
export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    // Tentative de sauvegarde dans IndexedDB
    await writeTransaction(store => 
      store.put({
        key,
        value: data,
        lastUpdated: new Date().toISOString()
      })
    );
    
    // Sauvegarde de secours dans localStorage
    backupData(key, data);
    
    // IndexedDB est fonctionnel
    isIndexedDBAvailable = true;
  } catch (error) {
    // IndexedDB a échoué
    isIndexedDBAvailable = false;
    console.error(`Erreur lors de la sauvegarde de données pour ${key}:`, error);
    
    // Sauvegarde de secours dans localStorage malgré l'erreur
    try {
      backupData(key, data);
      console.log(`Backup créé pour ${key} malgré l'échec d'IndexedDB`);
    } catch (backupError) {
      console.error(`Échec complet de sauvegarde pour ${key}:`, backupError);
    }
  }
}

/**
 * Charge des données
 * @param key Clé principale pour les données
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns Les données chargées
 */
export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    // Si IndexedDB a échoué précédemment, utiliser directement localStorage
    if (!isIndexedDBAvailable) {
      if (hasBackup(key)) {
        console.log(`Utilisation du backup localStorage pour ${key} (IndexedDB indisponible)`);
        return getBackupData<T>(key, defaultValue);
      }
      return defaultValue;
    }
    
    // Tentative de chargement depuis IndexedDB
    const result = await readTransaction<{ key: string, value: T } | undefined>(store => 
      store.get(key)
    );
    
    if (result) {
      // Mettre à jour la sauvegarde avec les données récentes
      backupData(key, result.value);
      return result.value;
    } else if (hasBackup(key)) {
      // Si données présentes dans localStorage mais pas dans IndexedDB
      const backupValue = getBackupData<T>(key, defaultValue);
      console.log(`Restauration depuis backup localStorage pour ${key}`);
      
      // Sauvegarder en IndexedDB pour la prochaine fois
      setTimeout(() => {
        saveData(key, backupValue).catch(e => 
          console.error(`Erreur lors de la restauration en IndexedDB pour ${key}:`, e)
        );
      }, 0);
      
      return backupValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Erreur lors du chargement de données pour ${key}:`, error);
    isIndexedDBAvailable = false;
    
    // Tentative de récupération depuis localStorage
    if (hasBackup(key)) {
      console.log(`Récupération depuis backup localStorage après erreur pour ${key}`);
      return getBackupData<T>(key, defaultValue);
    }
    
    return defaultValue;
  }
}

/**
 * Ajoute un élément à un tableau de données
 * @param key Clé principale pour les données
 * @param item Élément à ajouter
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 */
export async function addItem<T>(key: string, item: T, defaultValue: T[] = []): Promise<void> {
  try {
    const data = await loadData<T[]>(key, defaultValue);
    data.push(item);
    await saveData(key, data);
  } catch (error) {
    console.error(`Erreur lors de l'ajout d'un élément pour ${key}:`, error);
  }
}

/**
 * Met à jour un élément dans un tableau de données
 * @param key Clé principale pour les données
 * @param id Identifiant de l'élément à mettre à jour
 * @param updateFn Fonction de mise à jour qui reçoit l'élément et retourne l'élément mis à jour
 * @param idField Nom du champ d'identifiant (par défaut: 'id')
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns true si l'élément a été trouvé et mis à jour, false sinon
 */
export async function updateItem<T>(
  key: string, 
  id: string | number, 
  updateFn: (item: T) => T, 
  idField: keyof T = 'id' as keyof T,
  defaultValue: T[] = []
): Promise<boolean> {
  try {
    const data = await loadData<T[]>(key, defaultValue);
    const index = data.findIndex(item => (item as any)[idField] === id);
    
    if (index === -1) return false;
    
    data[index] = updateFn(data[index]);
    await saveData(key, data);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour d'un élément pour ${key}:`, error);
    return false;
  }
}

/**
 * Supprime un élément d'un tableau de données
 * @param key Clé principale pour les données
 * @param id Identifiant de l'élément à supprimer
 * @param idField Nom du champ d'identifiant (par défaut: 'id')
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns true si l'élément a été trouvé et supprimé, false sinon
 */
export async function removeArrayItem<T>(
  key: string, 
  id: string | number, 
  idField: keyof T = 'id' as keyof T,
  defaultValue: T[] = []
): Promise<boolean> {
  try {
    const data = await loadData<T[]>(key, defaultValue);
    const index = data.findIndex(item => (item as any)[idField] === id);
    
    if (index === -1) return false;
    
    data.splice(index, 1);
    await saveData(key, data);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression d'un élément pour ${key}:`, error);
    return false;
  }
}

/**
 * Recherche un élément par son identifiant
 * @param key Clé principale pour les données
 * @param id Identifiant de l'élément à trouver
 * @param idField Nom du champ d'identifiant (par défaut: 'id')
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns L'élément trouvé ou undefined
 */
export async function findItemById<T>(
  key: string, 
  id: string | number, 
  idField: keyof T = 'id' as keyof T,
  defaultValue: T[] = []
): Promise<T | undefined> {
  try {
    const data = await loadData<T[]>(key, defaultValue);
    return data.find(item => (item as any)[idField] === id);
  } catch (error) {
    console.error(`Erreur lors de la recherche d'un élément pour ${key}:`, error);
    return undefined;
  }
}

/**
 * Filtre les éléments selon un prédicat
 * @param key Clé principale pour les données
 * @param predicate Fonction de filtrage
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns Tableau des éléments qui satisfont le prédicat
 */
export async function filterItems<T>(
  key: string, 
  predicate: (item: T) => boolean,
  defaultValue: T[] = []
): Promise<T[]> {
  try {
    const data = await loadData<T[]>(key, defaultValue);
    return data.filter(predicate);
  } catch (error) {
    console.error(`Erreur lors du filtrage d'éléments pour ${key}:`, error);
    return [];
  }
}

/**
 * Supprime une clé et ses données
 * @param key Clé à supprimer
 */
export async function removeData(key: string): Promise<void> {
  try {
    await writeTransaction(store => store.delete(key));
  } catch (error) {
    console.error(`Erreur lors de la suppression de données pour ${key}:`, error);
  }
}

/**
 * Obtient la liste des clés dans la base de données
 * @returns Promesse qui se résout avec un tableau de clés
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      
      request.onerror = (event) => {
        console.error("Erreur lors de la récupération des clés depuis IndexedDB:", event);
        reject("Erreur de lecture des clés IndexedDB");
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des clés:", error);
    return [];
  }
}

/**
 * Vérifie l'état de stockage et retourne des statistiques
 * @returns Statistiques sur l'utilisation du stockage
 */
export async function getStorageStats(): Promise<{ items: number }> {
  try {
    const keys = await getAllKeys();
    return {
      items: keys.length
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return { items: 0 };
  }
}

/**
 * Méthode de compatibilité pour les fonctions localStorage simples
 * @param key Clé
 * @param value Données à stocker
 */
export async function setItem(key: string, value: string): Promise<void> {
  await saveData(key, value);
}

/**
 * Méthode de compatibilité pour les fonctions localStorage simples
 * @param key Clé
 * @returns Valeur stockée ou null
 */
export async function getItem(key: string): Promise<string | null> {
  return await loadData<string | null>(key, null);
}

/**
 * Méthode de compatibilité pour les fonctions localStorage simples
 * @param key Clé à supprimer
 */
export async function removeItemByKey(key: string): Promise<void> {
  await removeData(key);
}