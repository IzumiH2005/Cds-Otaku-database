// Ce script permet de tester les fonctionnalités de base d'IndexedDB
// Il montre comment ouvrir une base de données, créer un object store et effectuer des opérations CRUD

// Configuration
const DB_NAME = 'test-db';
const DB_VERSION = 1;
const STORE_NAME = 'test-store';

// Ouvrir une connexion à la base de données
console.log("Ouverture de la base de données IndexedDB...");
const request = indexedDB.open(DB_NAME, DB_VERSION);

// Gestionnaire d'erreur
request.onerror = (event) => {
  console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
};

// Gestionnaire pour la mise à niveau de la base de données
request.onupgradeneeded = (event) => {
  console.log("Mise à niveau de la base de données...");
  const db = event.target.result;
  
  // Créer un object store
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    console.log("Object store créé:", STORE_NAME);
  }
};

// Gestionnaire de succès
request.onsuccess = (event) => {
  const db = event.target.result;
  console.log("Base de données ouverte avec succès!");
  
  // Effectuer des opérations de test
  testOperations(db);
};

// Fonction pour tester les opérations CRUD
async function testOperations(db) {
  try {
    // 1. Ajouter des données
    console.log("Ajout de données...");
    await addData(db, { id: 1, name: 'Item 1', value: 'Valeur 1' });
    await addData(db, { id: 2, name: 'Item 2', value: 'Valeur 2' });
    
    // 2. Lire des données
    console.log("Lecture de données...");
    const item1 = await getData(db, 1);
    console.log("Item 1:", item1);
    
    // 3. Mettre à jour des données
    console.log("Mise à jour de données...");
    await updateData(db, { id: 1, name: 'Item 1 (mis à jour)', value: 'Nouvelle valeur' });
    const updatedItem = await getData(db, 1);
    console.log("Item 1 mis à jour:", updatedItem);
    
    // 4. Supprimer des données
    console.log("Suppression de données...");
    await deleteData(db, 2);
    const allData = await getAllData(db);
    console.log("Toutes les données après suppression:", allData);
    
    console.log("Tests terminés avec succès!");
  } catch (error) {
    console.error("Erreur lors des tests:", error);
  }
}

// Fonction pour ajouter des données
function addData(db, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(data);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fonction pour lire des données
function getData(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fonction pour mettre à jour des données
function updateData(db, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fonction pour supprimer des données
function deleteData(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fonction pour récupérer toutes les données
function getAllData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}