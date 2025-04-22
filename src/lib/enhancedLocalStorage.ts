/**
 * Module d'amélioration de localStorage permettant de stocker des quantités importantes de données
 */

/**
 * Constantes pour la pagination et la segmentation des données
 */
const MAX_ITEMS_PER_SEGMENT = 20; // Optimisé pour les flashcards (20 par segment)
const PREFIX_SEGMENT = "_s"; // Préfixe compatible avec les anciennes données
const MAX_SEGMENTS = 200; // Augmenté pour permettre plus de données

/**
 * Sauvegarde des données en les segmentant si nécessaire
 * @param key Clé principale pour les données
 * @param data Données à sauvegarder (tableau d'objets)
 */
export function saveData<T>(key: string, data: T[]): void {
  try {
    // Si les données sont petites, on les sauvegarde directement
    if (data.length <= MAX_ITEMS_PER_SEGMENT) {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(key, jsonData);
      // On nettoie d'éventuels segments qui pourraient exister
      for (let i = 0; i < MAX_SEGMENTS; i++) {
        const segmentKey = `${key}${PREFIX_SEGMENT}${i}`;
        if (localStorage.getItem(segmentKey) !== null) {
          localStorage.removeItem(segmentKey);
        } else {
          break; // On s'arrête si on ne trouve plus de segments
        }
      }
      return;
    }

    // Sinon, on divise les données en segments
    const totalSegments = Math.ceil(data.length / MAX_ITEMS_PER_SEGMENT);
    
    // Méta-informations sur les segments (pour retrouver les données)
    const metaInfo = {
      isSegmented: true,
      totalSegments,
      totalItems: data.length,
      lastUpdated: new Date().toISOString()
    };
    
    // Sauvegarde des méta-informations
    localStorage.setItem(key, JSON.stringify(metaInfo));
    
    // Sauvegarde des segments
    for (let i = 0; i < totalSegments; i++) {
      const start = i * MAX_ITEMS_PER_SEGMENT;
      const end = Math.min(start + MAX_ITEMS_PER_SEGMENT, data.length);
      const segment = data.slice(start, end);
      
      const jsonData = JSON.stringify(segment);
      localStorage.setItem(`${key}${PREFIX_SEGMENT}${i}`, jsonData);
    }
    
    // Suppression des anciens segments inutiles
    for (let i = totalSegments; i < MAX_SEGMENTS; i++) {
      const segmentKey = `${key}${PREFIX_SEGMENT}${i}`;
      if (localStorage.getItem(segmentKey) !== null) {
        localStorage.removeItem(segmentKey);
      } else {
        break; // On s'arrête si on ne trouve plus de segments
      }
    }
    
    console.log(`Données sauvegardées pour ${key}: ${data.length} éléments, ${totalSegments} segments`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de données pour ${key}:`, error);
  }
}

/**
 * Charge des données potentiellement segmentées
 * @param key Clé principale pour les données
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns Les données chargées
 */
export function loadData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const rawData = localStorage.getItem(key);
    if (!rawData) return defaultValue;
    
    // Essayer de parser les données
    const parsed = JSON.parse(rawData);
    
    // Si les données ne sont pas segmentées, les retourner directement
    if (!parsed.isSegmented) {
      return parsed as T[];
    }
    
    // Sinon, reconstituer les données à partir des segments
    const { totalSegments, totalItems } = parsed;
    const result: T[] = [];
    
    for (let i = 0; i < totalSegments; i++) {
      const segmentKey = `${key}${PREFIX_SEGMENT}${i}`;
      const segmentData = localStorage.getItem(segmentKey);
      
      if (segmentData) {
        try {
          const segment = JSON.parse(segmentData) as T[];
          result.push(...segment);
        } catch (err) {
          console.error(`Erreur lors du parsing du segment ${i} pour ${key}:`, err);
        }
      } else {
        console.warn(`Segment manquant ${i} pour ${key}`);
      }
    }
    
    if (result.length !== totalItems) {
      console.warn(`Incohérence dans les données segmentées pour ${key}: ${result.length} éléments chargés au lieu de ${totalItems}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors du chargement de données pour ${key}:`, error);
    
    // Tentative de récupération des données originales
    try {
      // Chercher si les données existent directement dans une version antérieure
      try {
        // Essayer de voir si les données sont directement dans la clé (version pré-segmentation)
        const oldData = localStorage.getItem(key);
        if (oldData && !oldData.includes('isSegmented')) {
          try {
            // Tenter de parser directement
            const parsedData = JSON.parse(oldData) as T[];
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log(`Récupération des anciennes données pour ${key}: ${parsedData.length} éléments`);
              // Sauvegarder une copie pour préserver les données
              localStorage.setItem(`${key}_backup`, oldData);
              return parsedData;
            }
          } catch (parseError) {
            console.warn(`Erreur lors du parsing des anciennes données de ${key}`, parseError);
          }
        }
      } catch (e) {
        // Ignorer cette étape si elle échoue
      }
      
      // Chercher si des anciennes données existent avec prefix
      const legacyKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storedKey = localStorage.key(i);
        if (storedKey && storedKey.startsWith(key)) legacyKeys.push(storedKey);
      }
      
      if (legacyKeys.length > 0) {
        console.log(`Clés trouvées pour ${key}:`, legacyKeys);
      }
      
      // Chercher les anciennes versions sauvegardées
      const legacyData = localStorage.getItem(`${key}_legacy`) || localStorage.getItem(`${key}_backup`);
      if (legacyData) {
        console.log(`Récupération de données anciennes pour ${key}`);
        try {
          return JSON.parse(legacyData) as T[];
        } catch (e) {
          console.warn(`Erreur lors du parsing des données legacy pour ${key}`, e);
        }
      }
      
      // Sinon, essayer de récupérer les segments directement
      const result: T[] = [];
      
      // D'abord, essayer avec les anciens préfixes qui pourraient exister
      const prefixes = ["_s", "_segment_", ""];
      
      for (const prefix of prefixes) {
        let foundSegments = false;
        
        for (let i = 0; i < MAX_SEGMENTS; i++) {
          const segmentKey = `${key}${prefix}${i}`;
          const segmentData = localStorage.getItem(segmentKey);
          
          if (!segmentData) {
            if (i > 0 && result.length > 0) break; // On a probablement tout récupéré
            continue;
          }
          
          foundSegments = true;
          
          try {
            // Essayer de décompresser si nécessaire 
            let jsonData = segmentData;
            if (segmentData.startsWith('C:') || segmentData.startsWith('R:')) {
              try {
                // Tenter de récupérer le contenu brut
                jsonData = segmentData.substring(2);
              } catch (e) {
                // Ignorer si cela échoue
                jsonData = segmentData;
              }
            }
            
            const segment = JSON.parse(jsonData) as T[];
            result.push(...segment);
            console.log(`Segment ${i} récupéré pour ${key} (préfixe: ${prefix}): ${segment.length} éléments`);
          } catch (segmentError) {
            console.warn(`Erreur lors de la récupération du segment ${i} pour ${key} (préfixe: ${prefix}):`, segmentError);
          }
        }
        
        if (foundSegments) break; // Si on a trouvé des segments avec ce préfixe, ne pas essayer les autres
      }
      
      if (result.length > 0) {
        console.log(`Récupération partielle: ${result.length} éléments pour ${key}`);
        // Sauvegarder les données récupérées pour éviter de répéter l'opération
        try {
          const recovered = JSON.stringify(result);
          localStorage.setItem(`${key}_recovered`, recovered);
        } catch (e) {
          // Ignorer l'erreur de sauvegarde 
        }
        return result;
      }
      
      // Dernière tentative: voir si on a déjà sauvegardé des données récupérées
      const recoveredData = localStorage.getItem(`${key}_recovered`);
      if (recoveredData) {
        try {
          return JSON.parse(recoveredData) as T[];
        } catch (e) {
          // Ignorer l'erreur
        }
      }
    } catch (recoveryError) {
      console.error(`Échec de la récupération en mode dégradé pour ${key}:`, recoveryError);
    }
    
    return defaultValue;
  }
}

/**
 * Ajoute un élément à un tableau de données potentiellement segmenté
 * @param key Clé principale pour les données
 * @param item Élément à ajouter
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 */
export function addItem<T>(key: string, item: T, defaultValue: T[] = []): void {
  const data = loadData<T>(key, defaultValue);
  data.push(item);
  saveData(key, data);
}

/**
 * Met à jour un élément dans un tableau de données potentiellement segmenté
 * @param key Clé principale pour les données
 * @param id Identifiant de l'élément à mettre à jour
 * @param updateFn Fonction de mise à jour qui reçoit l'élément et retourne l'élément mis à jour
 * @param idField Nom du champ d'identifiant (par défaut: 'id')
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns true si l'élément a été trouvé et mis à jour, false sinon
 */
export function updateItem<T>(
  key: string, 
  id: string | number, 
  updateFn: (item: T) => T, 
  idField: keyof T = 'id' as keyof T,
  defaultValue: T[] = []
): boolean {
  const data = loadData<T>(key, defaultValue);
  const index = data.findIndex(item => (item as any)[idField] === id);
  
  if (index === -1) return false;
  
  data[index] = updateFn(data[index]);
  saveData(key, data);
  return true;
}

/**
 * Supprime un élément d'un tableau de données potentiellement segmenté
 * @param key Clé principale pour les données
 * @param id Identifiant de l'élément à supprimer
 * @param idField Nom du champ d'identifiant (par défaut: 'id')
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns true si l'élément a été trouvé et supprimé, false sinon
 */
export function removeItem<T>(
  key: string, 
  id: string | number, 
  idField: keyof T = 'id' as keyof T,
  defaultValue: T[] = []
): boolean {
  const data = loadData<T>(key, defaultValue);
  const index = data.findIndex(item => (item as any)[idField] === id);
  
  if (index === -1) return false;
  
  data.splice(index, 1);
  saveData(key, data);
  return true;
}

/**
 * Recherche un élément par son identifiant
 * @param key Clé principale pour les données
 * @param id Identifiant de l'élément à trouver
 * @param idField Nom du champ d'identifiant (par défaut: 'id')
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns L'élément trouvé ou undefined
 */
export function findItemById<T>(
  key: string, 
  id: string | number, 
  idField: keyof T = 'id' as keyof T,
  defaultValue: T[] = []
): T | undefined {
  const data = loadData<T>(key, defaultValue);
  return data.find(item => (item as any)[idField] === id);
}

/**
 * Filtre les éléments selon un prédicat
 * @param key Clé principale pour les données
 * @param predicate Fonction de filtrage
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns Tableau des éléments qui satisfont le prédicat
 */
export function filterItems<T>(
  key: string, 
  predicate: (item: T) => boolean,
  defaultValue: T[] = []
): T[] {
  const data = loadData<T>(key, defaultValue);
  return data.filter(predicate);
}

/**
 * Supprime tous les segments associés à une clé
 * @param key Clé principale
 */
function clearSegments(key: string): void {
  for (let i = 0; i < MAX_SEGMENTS; i++) {
    const segmentKey = `${key}${PREFIX_SEGMENT}${i}`;
    if (localStorage.getItem(segmentKey) !== null) {
      localStorage.removeItem(segmentKey);
    } else if (i > 10) {
      // Optimisation: si on ne trouve pas 10 segments consécutifs, on arrête
      break;
    }
  }
}

/**
 * Vérifie l'état de stockage et retourne des statistiques
 * @returns Statistiques sur l'utilisation du stockage
 */
export function getStorageStats(): { used: number, total: number, items: number, segments: number } {
  let size = 0;
  let items = 0;
  let segments = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key) || '';
    size += (key.length + value.length) * 2; // Approximation en bytes (UTF-16)
    
    if (key.includes(PREFIX_SEGMENT)) {
      segments++;
    } else {
      items++;
    }
  }
  
  return {
    used: Math.round(size / 1024), // KB
    total: 5 * 1024, // Typiquement 5MB
    items,
    segments
  };
}