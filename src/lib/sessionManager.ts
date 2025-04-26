// Session key management utilities with IndexedDB

import * as idb from './enhancedIndexedDB';

// Storage key constant
const STORAGE_KEY = "cds-flashcard-session-key";
const USER_DATA_PREFIX = "cds-flashcard-user-";
const SESSION_EXPIRY_KEY = "cds-flashcard-session-expiry";
const SESSION_DURATION_DAYS = 30; // Sessions valid for 30 days by default
const STATS_KEY_SUFFIX = "_stats";
const LAST_ACTIVITY_KEY_SUFFIX = "_last_activity";

// Generate a new session key
export const generateSessionKey = (): string => {
  return Math.random().toString(36).substring(2, 6).toUpperCase() + 
         Math.random().toString(36).substring(2, 6).toUpperCase() + 
         Math.random().toString(36).substring(2, 4).toUpperCase();
};

// Save session key to IndexedDB with expiration
export const saveSessionKey = async (key: string): Promise<void> => {
  await idb.setItem(STORAGE_KEY, key);
  
  // Set session expiry
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + SESSION_DURATION_DAYS);
  await idb.setItem(SESSION_EXPIRY_KEY, expiryDate.toISOString());
  
  // Initialize user data for this session if not already present
  await initializeUserDataForSession(key);
  
  // Record last activity
  await updateLastActivity();
};

// Get session key from IndexedDB
export const getSessionKey = async (): Promise<string | null> => {
  return await idb.getItem(STORAGE_KEY);
};

// Remove session key (logout)
export const clearSessionKey = async (): Promise<void> => {
  await idb.removeItemByKey(STORAGE_KEY);
  await idb.removeItemByKey(SESSION_EXPIRY_KEY);
};

// Check if a session exists
export const hasSession = async (): Promise<boolean> => {
  const sessionKey = await getSessionKey();
  const expired = await isSessionExpired();
  return !!sessionKey && !expired;
};

// Check if the session is expired
export const isSessionExpired = async (): Promise<boolean> => {
  const expiryDateString = await idb.getItem(SESSION_EXPIRY_KEY);
  if (!expiryDateString) return false; // No expiry set, assume not expired
  
  const expiryDate = new Date(expiryDateString);
  const currentDate = new Date();
  
  return currentDate > expiryDate;
};

// Extend session validity
export const extendSession = async (): Promise<void> => {
  const sessionKey = await getSessionKey();
  if (!sessionKey) return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + SESSION_DURATION_DAYS);
  await idb.setItem(SESSION_EXPIRY_KEY, expiryDate.toISOString());
  
  // Update last activity timestamp
  await updateLastActivity();
};

// Track last user activity
export const updateLastActivity = async (): Promise<void> => {
  const sessionKey = await getSessionKey();
  if (!sessionKey) return;
  
  await idb.setItem(
    `${USER_DATA_PREFIX}${sessionKey}${LAST_ACTIVITY_KEY_SUFFIX}`, 
    new Date().toISOString()
  );
  
  // Update stats with this activity
  await updateSessionStats({ lastActive: new Date().toISOString() });
};

// Verify if session is valid (in a real app this would check against a backend)
export const verifySession = async (): Promise<boolean> => {
  const sessionKey = await getSessionKey();
  if (!sessionKey) return false;
  if (await isSessionExpired()) {
    await clearSessionKey();
    return false;
  }
  
  // In a real app, this would validate the session key with a backend
  // For this demo, we'll just check if it follows our expected format
  const isValidFormat = /^[A-Z0-9]{12,14}$/.test(sessionKey);
  const userDataKeys = await getUserDataKeys(sessionKey);
  const hasUserData = userDataKeys.length > 0;
  
  // Extend session validity if it's valid
  if (isValidFormat) {
    await extendSession();
    await updateLastActivity();
  }
  
  return isValidFormat;
};

// Initialize user data for a new session
const initializeUserDataForSession = async (sessionKey: string): Promise<void> => {
  // Check if this is a new session without data
  const userDataKeys = await getUserDataKeys(sessionKey);
  if (userDataKeys.length === 0) {
    // Initialize with empty data structures
    await idb.setItem(`${USER_DATA_PREFIX}${sessionKey}_decks`, JSON.stringify([]));
    await idb.setItem(`${USER_DATA_PREFIX}${sessionKey}_themes`, JSON.stringify([]));
    await idb.setItem(`${USER_DATA_PREFIX}${sessionKey}_flashcards`, JSON.stringify([]));
    await idb.setItem(`${USER_DATA_PREFIX}${sessionKey}_profile`, JSON.stringify({
      name: "Utilisateur",
      createdAt: new Date().toISOString()
    }));
    
    // Initialize session statistics
    await initializeSessionStats(sessionKey);
    
    console.log(`New session initialized: ${sessionKey}`);
  } else {
    console.log(`Existing session loaded: ${sessionKey}`);
    
    // Make sure stats exist for existing sessions
    const statsKey = `${USER_DATA_PREFIX}${sessionKey}${STATS_KEY_SUFFIX}`;
    const statsData = await idb.getItem(statsKey);
    if (!statsData) {
      await initializeSessionStats(sessionKey);
    }
  }
};

// Initialize session statistics
const initializeSessionStats = async (sessionKey: string): Promise<void> => {
  const statsKey = `${USER_DATA_PREFIX}${sessionKey}${STATS_KEY_SUFFIX}`;
  const initialStats = {
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalStudyTime: 0, // in minutes
    studySessions: 0,
    cardsReviewed: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    streakDays: 0,
    lastStudyDate: null,
    studyDays: [],
    averageScore: 0
  };
  
  await idb.setItem(statsKey, JSON.stringify(initialStats));
};

// Update session statistics
export const updateSessionStats = async (updates: Record<string, any>): Promise<void> => {
  const sessionKey = await getSessionKey();
  if (!sessionKey) return;
  
  const statsKey = `${USER_DATA_PREFIX}${sessionKey}${STATS_KEY_SUFFIX}`;
  const statsData = await idb.getItem(statsKey);
  
  if (statsData) {
    try {
      const stats = JSON.parse(statsData);
      const updatedStats = { ...stats, ...updates };
      
      // Calculate average score if we have answers
      if (updates.correctAnswers !== undefined || updates.incorrectAnswers !== undefined) {
        const totalCorrect = updatedStats.correctAnswers || 0;
        const totalAnswers = (updatedStats.correctAnswers || 0) + (updatedStats.incorrectAnswers || 0);
        
        if (totalAnswers > 0) {
          updatedStats.averageScore = Math.round((totalCorrect / totalAnswers) * 100);
        }
      }
      
      // Update study streak
      if (updates.lastStudyDate) {
        const today = new Date().toISOString().split('T')[0];
        const lastStudyDate = new Date(stats.lastStudyDate || 0).toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Add today to study days if not already there
        if (!updatedStats.studyDays.includes(today)) {
          updatedStats.studyDays.push(today);
        }
        
        // Update streak
        if (lastStudyDate === yesterday) {
          updatedStats.streakDays += 1;
        } else if (lastStudyDate !== today) {
          updatedStats.streakDays = 1;
        }
      }
      
      await idb.setItem(statsKey, JSON.stringify(updatedStats));
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  } else {
    // Initialize stats if they don't exist
    await initializeSessionStats(sessionKey);
    await updateSessionStats(updates);
  }
};

// Get session statistics
export const getSessionStats = async (): Promise<Record<string, any> | null> => {
  const sessionKey = await getSessionKey();
  if (!sessionKey) return null;
  
  const statsKey = `${USER_DATA_PREFIX}${sessionKey}${STATS_KEY_SUFFIX}`;
  const statsData = await idb.getItem(statsKey);
  
  if (statsData) {
    try {
      return JSON.parse(statsData);
    } catch (error) {
      console.error("Error parsing stats:", error);
      return null;
    }
  }
  
  return null;
};

// Get all IndexedDB keys associated with a session
const getUserDataKeys = async (sessionKey: string): Promise<string[]> => {
  const allKeys = await idb.getAllKeys();
  return allKeys.filter(key => key.startsWith(`${USER_DATA_PREFIX}${sessionKey}`));
};

// Get all IndexedDB data for export
export const exportSessionData = async (): Promise<string> => {
  const sessionKey = await getSessionKey();
  if (!sessionKey) {
    throw new Error("No active session found");
  }
  
  // Gather all data for this session
  const exportData: Record<string, any> = {
    sessionKey,
    exportDate: new Date().toISOString(),
    userData: {},
    appData: {}, // App-specific data like decks, themes, etc.
    stats: await getSessionStats()
  };
  
  // Get all session-specific user data
  const userDataKeys = await getUserDataKeys(sessionKey);
  for (const key of userDataKeys) {
    const keyName = key.replace(`${USER_DATA_PREFIX}${sessionKey}_`, '');
    const value = await idb.getItem(key);
    if (value) {
      try {
        exportData.userData[keyName] = JSON.parse(value);
      } catch (e) {
        exportData.userData[keyName] = value;
      }
    }
  }
  
  // Also export app-specific data
  const appDataKeys = ['cds-flashcard-decks', 'cds-flashcard-themes', 'cds-flashcard-cards', 'cds-flashcard-user'];
  for (const key of appDataKeys) {
    const value = await idb.getItem(key);
    if (value) {
      try {
        exportData.appData[key] = JSON.parse(value);
      } catch (e) {
        exportData.appData[key] = value;
      }
    }
  }
  
  return JSON.stringify(exportData, null, 2);
};

// Import session data
export const importSessionData = async (data: string): Promise<boolean> => {
  try {
    // Parse the imported data
    const importData = JSON.parse(data);
    
    // Validate the data structure
    if (!importData.sessionKey || !importData.userData || !importData.appData) {
      console.error("Invalid import data format");
      return false;
    }
    
    // Import the session key
    await saveSessionKey(importData.sessionKey);
    
    // Import all user data
    for (const [key, value] of Object.entries(importData.userData)) {
      await idb.setItem(
        `${USER_DATA_PREFIX}${importData.sessionKey}_${key}`,
        typeof value === 'string' ? value : JSON.stringify(value)
      );
    }
    
    // Import app data
    for (const [key, value] of Object.entries(importData.appData)) {
      await idb.setItem(
        key,
        typeof value === 'string' ? value : JSON.stringify(value)
      );
    }
    
    // If stats are present in the import, update them
    if (importData.stats) {
      const statsKey = `${USER_DATA_PREFIX}${importData.sessionKey}${STATS_KEY_SUFFIX}`;
      await idb.setItem(statsKey, JSON.stringify(importData.stats));
    }
    
    console.log("Session data successfully imported");
    return true;
  } catch (error) {
    console.error("Error importing session data:", error);
    return false;
  }
};

// Link user data to session key
export const linkUserDataToSession = async (sessionKey: string): Promise<void> => {
  // In a real-world scenario, this would be handled by a backend service
  // For now, we're using IndexedDB as our "database"
  
  // Make sure the session is initialized
  await initializeUserDataForSession(sessionKey);
  
  console.log(`User data linked to session: ${sessionKey}`);
};

// Get remaining session time in days
export const getSessionRemainingDays = async (): Promise<number | null> => {
  const expiryDateString = await idb.getItem(SESSION_EXPIRY_KEY);
  if (!expiryDateString) return null;
  
  const expiryDate = new Date(expiryDateString);
  const currentDate = new Date();
  
  // Calculate difference in days
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays); // Don't return negative days
};

// Update the statistics when studying cards
export const recordCardStudy = async (isCorrect: boolean, studyTimeMinutes: number = 1): Promise<void> => {
  await updateSessionStats({
    cardsReviewed: 1, // Increment by 1
    correctAnswers: isCorrect ? 1 : 0,
    incorrectAnswers: isCorrect ? 0 : 1,
    totalStudyTime: studyTimeMinutes,
    studySessions: 1,
    lastStudyDate: new Date().toISOString()
  });
};

// Get study streak
export const getStudyStreak = async (): Promise<number> => {
  const stats = await getSessionStats();
  return stats?.streakDays || 0;
};

// Fonctions synchrones pour compatibilité avec le code existant
// Ces fonctions n'attendent pas les promesses et retournent des valeurs par défaut
// pour faciliter la transition vers la version asynchrone
export const getSessionKeySync = (): string | null => {
  let result: string | null = null;
  getSessionKey().then(key => { result = key; });
  return result;
};

export const hasSessionSync = (): boolean => {
  let result = false;
  hasSession().then(has => { result = has; });
  return result;
};

export const isSessionExpiredSync = (): boolean => {
  let result = false;
  isSessionExpired().then(expired => { result = expired; });
  return result;
};

export const verifySessionSync = (): boolean => {
  let result = false;
  verifySession().then(valid => { result = valid; });
  return result;
};

export const getSessionStatsSync = (): Record<string, any> | null => {
  let result: Record<string, any> | null = null;
  getSessionStats().then(stats => { result = stats; });
  return result;
};

export const getStudyStreakSync = (): number => {
  let result = 0;
  getStudyStreak().then(streak => { result = streak; });
  return result;
};

export const getSessionRemainingDaysSync = (): number | null => {
  let result: number | null = null;
  getSessionRemainingDays().then(days => { result = days; });
  return result;
};

export const recordCardStudySync = (isCorrect: boolean, studyTimeMinutes: number = 1): void => {
  recordCardStudy(isCorrect, studyTimeMinutes).catch(error => {
    console.error("Error in recordCardStudySync:", error);
  });
};

export const updateSessionStatsSync = (updates: Record<string, any>): void => {
  updateSessionStats(updates).catch(error => {
    console.error("Error in updateSessionStatsSync:", error);
  });
};