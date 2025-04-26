/**
 * Module d'amélioration de localStorage permettant de stocker des quantités importantes de données
 * même au-delà des limites typiques de localStorage (5MB)
 */

// Constantes pour la pagination et la segmentation des données
const MAX_ITEMS_PER_SEGMENT = 100; // Nombre maximal d'éléments par segment
const PREFIX_SEGMENT = "_segment"; // Préfixe utilisé pour les segments

/**
 * Sauvegarde des données en les segmentant si nécessaire
 * @param key Clé principale pour les données
 * @param data Données à sauvegarder (tableau d'objets)
 */
export function saveData<T>(key: string, data: T[]): void {
  try {
    // Si les données sont petites, on les sauvegarde directement
    if (data.length <= MAX_ITEMS_PER_SEGMENT) {
      localStorage.setItem(key, JSON.stringify(data));
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
      lastUpdated: new Date().toISOString()
    };
    
    // Sauvegarde des méta-informations
    localStorage.setItem(key, JSON.stringify(metaInfo));
    
    // Sauvegarde des segments
    for (let i = 0; i < totalSegments; i++) {
      const start = i * MAX_ITEMS_PER_SEGMENT;
      const end = Math.min(start + MAX_ITEMS_PER_SEGMENT, data.length);
      const segment = data.slice(start, end);
      
      localStorage.setItem(`${key}${PREFIX_SEGMENT}${i}`, JSON.stringify(segment));
    }
    
    // Suppression des anciens segments superflus
    for (let i = totalSegments; i < totalSegments + 10; i++) {
      localStorage.removeItem(`${key}${PREFIX_SEGMENT}${i}`);
    }
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de données pour ${key}:`, error);
    // En cas d'erreur, on essaie de sauvegarder en mode dégradé
    try {
      localStorage.setItem(`${key}_error`, JSON.stringify({
        message: "Erreur lors de la dernière sauvegarde",
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      // Silence
    }
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
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    const parsed = JSON.parse(data);
    
    // Si les données ne sont pas segmentées, on les retourne directement
    if (!parsed.isSegmented) {
      return parsed as T[];
    }
    
    // Sinon, on reconstitue les données à partir des segments
    const { totalSegments, totalItems } = parsed;
    const result: T[] = [];
    
    for (let i = 0; i < totalSegments; i++) {
      const segmentData = localStorage.getItem(`${key}${PREFIX_SEGMENT}${i}`);
      if (segmentData) {
        const segment = JSON.parse(segmentData) as T[];
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
  for (let i = 0; i < 100; i++) { // Limite arbitraire de 100 segments
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