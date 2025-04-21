/**
 * Module d'amélioration de localStorage permettant de stocker des quantités importantes de données
 * même au-delà des limites typiques de localStorage (5MB)
 * 
 * Fonctionnalités:
 * - Segmentation des données pour dépasser la limite de 5MB
 * - Compression LZW pour optimiser l'espace de stockage
 * - Gestion des erreurs de stockage
 */

/**
 * Utilitaires de compression LZW (Lempel-Ziv-Welch) pour réduire la taille des données
 */
const LZW = {
  // Compression du texte
  compress: (uncompressed: string): string => {
    if (!uncompressed) return '';
    
    const dictionary: Record<string, number> = {};
    const result: number[] = [];
    let dictSize = 256;
    
    for (let i = 0; i < 256; i++) {
      dictionary[String.fromCharCode(i)] = i;
    }
    
    let w = '';
    for (let i = 0; i < uncompressed.length; i++) {
      const c = uncompressed.charAt(i);
      const wc = w + c;
      if (dictionary[wc] !== undefined) {
        w = wc;
      } else {
        result.push(dictionary[w]);
        dictionary[wc] = dictSize++;
        w = c;
      }
    }
    
    if (w !== '') {
      result.push(dictionary[w]);
    }
    
    return result.map(code => String.fromCharCode(code)).join('');
  },
  
  // Décompression du texte
  decompress: (compressed: string): string => {
    if (!compressed) return '';
    
    const dictionary: Record<number, string> = {};
    let dictSize = 256;
    
    for (let i = 0; i < 256; i++) {
      dictionary[i] = String.fromCharCode(i);
    }
    
    const encodedData = Array.from(compressed).map(char => char.charCodeAt(0));
    let w = dictionary[encodedData[0]];
    let result = w;
    
    for (let i = 1; i < encodedData.length; i++) {
      const k = encodedData[i];
      let entry: string;
      
      if (dictionary[k] !== undefined) {
        entry = dictionary[k];
      } else if (k === dictSize) {
        entry = w + w.charAt(0);
      } else {
        throw new Error('Erreur: k invalide');
      }
      
      result += entry;
      dictionary[dictSize++] = w + entry.charAt(0);
      w = entry;
    }
    
    return result;
  }
};

// Constantes pour la pagination et la segmentation des données
const MAX_ITEMS_PER_SEGMENT = 10; // Nombre maximal d'éléments par segment - très réduit pour une meilleure gestion
const PREFIX_SEGMENT = "_s"; // Préfixe court pour les segments (économie d'espace)
const USE_COMPRESSION = true; // Activer la compression des données
const MAX_SEGMENTS = 1000; // Support jusqu'à 1000 segments (10 000 flashcards potentielles)

/**
 * Compresse une chaîne JSON pour le stockage
 * @param jsonData Données JSON à compresser
 * @returns Chaîne compressée ou la chaîne originale si la compression est désactivée
 */
function compressData(jsonData: string): string {
  if (!USE_COMPRESSION) return jsonData;
  
  try {
    // Compression LZW
    const compressed = LZW.compress(jsonData);
    
    // Si la compression réduit effectivement la taille, on l'utilise
    if (compressed.length < jsonData.length * 0.9) { // Au moins 10% de gain
      return `C:${compressed}`; // Préfixe pour indiquer que c'est compressé
    }
    
    // Sinon on garde la version non compressée
    return `R:${jsonData}`; // Préfixe pour indiquer que c'est brut (raw)
  } catch (error) {
    console.warn('Erreur de compression, utilisation des données non compressées:', error);
    return `R:${jsonData}`;
  }
}

/**
 * Décompresse une chaîne stockée
 * @param data Données potentiellement compressées
 * @returns Chaîne JSON décompressée
 */
function decompressData(data: string): string {
  if (!data || data.length < 2) return data;
  
  // Vérifier si les données sont compressées
  const prefix = data.substring(0, 2);
  const content = data.substring(2);
  
  if (prefix === 'C:') {
    // Données compressées, appliquer la décompression
    try {
      return LZW.decompress(content);
    } catch (error) {
      console.error('Erreur de décompression:', error);
      throw error; // Propagation de l'erreur pour gestion plus haut
    }
  } else if (prefix === 'R:') {
    // Données brutes, retourner le contenu tel quel
    return content;
  }
  
  // Format non reconnu, retourner tel quel (compatibilité descendante)
  return data;
}

/**
 * Sauvegarde des données en les segmentant si nécessaire et en les compressant
 * @param key Clé principale pour les données
 * @param data Données à sauvegarder (tableau d'objets)
 */
export function saveData<T>(key: string, data: T[]): void {
  try {
    // Si les données sont petites, on les sauvegarde directement
    if (data.length <= MAX_ITEMS_PER_SEGMENT) {
      const jsonData = JSON.stringify(data);
      const compressedData = compressData(jsonData);
      
      localStorage.setItem(key, compressedData);
      // Suppression des segments éventuels
      clearSegments(key);
      return;
    }

    // Sinon, on divise les données en segments
    const totalSegments = Math.ceil(data.length / MAX_ITEMS_PER_SEGMENT);
    
    // Méta-informations sur les segments
    const metaInfo = {
      isSegmented: true,
      totalSegments,
      totalItems: data.length,
      isCompressed: USE_COMPRESSION,
      lastUpdated: new Date().toISOString()
    };
    
    // Sauvegarde des méta-informations (non compressées pour la performance)
    localStorage.setItem(key, JSON.stringify(metaInfo));
    
    // Sauvegarde des segments avec compression
    for (let i = 0; i < totalSegments; i++) {
      const start = i * MAX_ITEMS_PER_SEGMENT;
      const end = Math.min(start + MAX_ITEMS_PER_SEGMENT, data.length);
      const segment = data.slice(start, end);
      
      const jsonData = JSON.stringify(segment);
      const compressedData = compressData(jsonData);
      
      localStorage.setItem(`${key}${PREFIX_SEGMENT}${i}`, compressedData);
    }
    
    // Suppression des anciens segments superflus
    for (let i = totalSegments; i < totalSegments + 10; i++) {
      localStorage.removeItem(`${key}${PREFIX_SEGMENT}${i}`);
    }
    
    console.log(`Données sauvegardées pour ${key}: ${data.length} éléments, ${totalSegments} segments`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de données pour ${key}:`, error);
    // En cas d'erreur, on essaie de sauvegarder en mode dégradé
    try {
      localStorage.setItem(`${key}_error`, JSON.stringify({
        message: "Erreur lors de la dernière sauvegarde",
        timestamp: new Date().toISOString(),
        error: String(error)
      }));
    } catch (e) {
      // Silence
    }
  }
}

/**
 * Charge des données potentiellement segmentées et compressées
 * @param key Clé principale pour les données
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée
 * @returns Les données chargées
 */
export function loadData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const rawData = localStorage.getItem(key);
    if (!rawData) return defaultValue;
    
    // Vérifier si les données sont potentiellement compressées
    if (rawData.startsWith('C:') || rawData.startsWith('R:')) {
      // Décompresser d'abord
      const jsonData = decompressData(rawData);
      return JSON.parse(jsonData) as T[];
    }
    
    // Sinon, essayer de parser normalement
    const parsed = JSON.parse(rawData);
    
    // Si les données ne sont pas segmentées, les retourner directement
    if (!parsed.isSegmented) {
      return parsed as T[];
    }
    
    // Sinon, reconstituer les données à partir des segments (potentiellement compressés)
    const { totalSegments, totalItems, isCompressed = false } = parsed;
    const result: T[] = [];
    
    for (let i = 0; i < totalSegments; i++) {
      const segmentKey = `${key}${PREFIX_SEGMENT}${i}`;
      const segmentData = localStorage.getItem(segmentKey);
      
      if (segmentData) {
        let segmentJson: string;
        
        // Vérifier si le segment est compressé
        if (isCompressed || segmentData.startsWith('C:') || segmentData.startsWith('R:')) {
          segmentJson = decompressData(segmentData);
        } else {
          segmentJson = segmentData;
        }
        
        const segment = JSON.parse(segmentJson) as T[];
        result.push(...segment);
      }
    }
    
    // Vérification de cohérence
    if (result.length !== totalItems) {
      console.warn(`Incohérence dans les données segmentées pour ${key}: ${result.length} éléments chargés au lieu de ${totalItems}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors du chargement de données pour ${key}:`, error);
    // En cas d'erreur, essayer de récupérer les données brutes
    try {
      // Tentative de récupération directe des segments sans vérification des méta-données
      const result: T[] = [];
      for (let i = 0; i < MAX_SEGMENTS; i++) {
        const segmentKey = `${key}${PREFIX_SEGMENT}${i}`;
        const segmentData = localStorage.getItem(segmentKey);
        
        if (!segmentData) {
          if (i > 10 && result.length > 0) break; // On a probablement tout récupéré
          continue;
        }
        
        try {
          let segmentJson: string;
          if (segmentData.startsWith('C:') || segmentData.startsWith('R:')) {
            segmentJson = decompressData(segmentData);
          } else {
            segmentJson = segmentData;
          }
          
          const segment = JSON.parse(segmentJson) as T[];
          result.push(...segment);
        } catch (segmentError) {
          console.warn(`Erreur lors de la récupération du segment ${i} pour ${key}:`, segmentError);
        }
      }
      
      if (result.length > 0) {
        console.log(`Mode dégradé: Récupération de ${result.length} éléments pour ${key}`);
        return result;
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