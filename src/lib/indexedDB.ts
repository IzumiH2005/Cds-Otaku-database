/**
 * Service de gestion des fichiers audio avec IndexedDB
 * Ce service permet de stocker et récupérer des fichiers audio
 * en utilisant IndexedDB au lieu de localStorage
 */

const DB_NAME = 'cds-flashcards-db';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-files';

interface AudioFile {
  id: string;
  data: string; // base64 data
  type: string;
  createdAt: number;
}

/**
 * Initialise la base de données IndexedDB
 */
export function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erreur lors de l\'ouverture de la base de données IndexedDB:', event);
      reject(new Error('Impossible d\'ouvrir la base de données IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('Base de données IndexedDB ouverte avec succès');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Créer le store pour les fichiers audio s'il n'existe pas
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        const store = db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('Store audio créé dans IndexedDB');
      }
    };
  });
}

/**
 * Obtient une instance de la base de données
 */
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = initIndexedDB();
  }
  return dbPromise;
}

/**
 * Sauvegarde un fichier audio dans IndexedDB
 * @param audioId Identifiant unique du fichier audio
 * @param audioData Données audio en base64
 * @param audioType Type MIME du fichier audio
 * @returns Une promesse qui résout avec l'ID du fichier audio
 */
export async function saveAudioToIndexedDB(
  audioId: string,
  audioData: string,
  audioType: string
): Promise<string> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const audioFile: AudioFile = {
        id: audioId,
        data: audioData,
        type: audioType,
        createdAt: Date.now(),
      };
      
      const request = store.put(audioFile);
      
      request.onsuccess = () => {
        console.log(`Fichier audio ${audioId} sauvegardé dans IndexedDB`);
        resolve(audioId);
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la sauvegarde du fichier audio:', event);
        reject(new Error('Impossible de sauvegarder le fichier audio'));
      };
    });
  } catch (error) {
    console.error('Erreur lors de l\'accès à IndexedDB:', error);
    throw error;
  }
}

/**
 * Récupère un fichier audio depuis IndexedDB
 * @param audioId Identifiant du fichier audio
 * @returns Une promesse qui résout avec les données audio en base64
 */
export async function getAudioFromIndexedDB(audioId: string): Promise<string | null> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.get(audioId);
      
      request.onsuccess = () => {
        const audioFile = request.result as AudioFile | undefined;
        if (audioFile) {
          console.log(`Fichier audio ${audioId} récupéré depuis IndexedDB`);
          resolve(audioFile.data);
        } else {
          console.log(`Fichier audio ${audioId} non trouvé dans IndexedDB`);
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la récupération du fichier audio:', event);
        reject(new Error('Impossible de récupérer le fichier audio'));
      };
    });
  } catch (error) {
    console.error('Erreur lors de l\'accès à IndexedDB:', error);
    return null;
  }
}

/**
 * Supprime un fichier audio d'IndexedDB
 * @param audioId Identifiant du fichier audio
 * @returns Une promesse qui résout avec true si le fichier a été supprimé
 */
export async function deleteAudioFromIndexedDB(audioId: string): Promise<boolean> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.delete(audioId);
      
      request.onsuccess = () => {
        console.log(`Fichier audio ${audioId} supprimé d'IndexedDB`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors de la suppression du fichier audio:', event);
        reject(new Error('Impossible de supprimer le fichier audio'));
      };
    });
  } catch (error) {
    console.error('Erreur lors de l\'accès à IndexedDB:', error);
    return false;
  }
}

/**
 * Génère un identifiant unique pour un fichier audio
 */
export function generateAudioId(): string {
  return `audio_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Nettoie les anciens fichiers audio qui ne sont plus référencés
 * @param keepIds Liste des IDs à conserver
 */
export async function cleanupUnusedAudioFiles(keepIds: string[]): Promise<void> {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const audioFile = cursor.value as AudioFile;
          
          if (!keepIds.includes(audioFile.id)) {
            console.log(`Suppression du fichier audio non utilisé: ${audioFile.id}`);
            cursor.delete();
          }
          
          cursor.continue();
        } else {
          console.log('Nettoyage des fichiers audio terminé');
          resolve();
        }
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors du nettoyage des fichiers audio:', event);
        reject(new Error('Impossible de nettoyer les fichiers audio'));
      };
    });
  } catch (error) {
    console.error('Erreur lors de l\'accès à IndexedDB:', error);
  }
}

/**
 * Initialise IndexedDB quand le module est chargé
 */
try {
  initIndexedDB().catch(error => {
    console.error('Échec de l\'initialisation d\'IndexedDB:', error);
  });
} catch (e) {
  console.error('Erreur pendant l\'initialisation d\'IndexedDB:', e);
}