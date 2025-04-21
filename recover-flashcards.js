// Script pour récupérer les flashcards du localStorage

// Fonction utilitaire pour imprimer les clés et valeurs du localStorage
function dumpLocalStorage() {
  console.log('=== CONTENU DU LOCALSTORAGE ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      // Essayons de l'obtenir en format JSON
      let value = localStorage.getItem(key);
      // Si la valeur est longue, on ne montre que le début
      if (value && value.length > 1000) {
        value = value.substring(0, 200) + '... [tronqué]';
      }
      console.log(`${key}: ${value}`);
    } catch (e) {
      console.error(`Erreur lors de la lecture de la clé ${key}:`, e);
    }
  }
  console.log('============================');
}

// Fonction pour montrer des statistiques sur l'utilisation du localStorage
function getStorageStats() {
  let totalSize = 0;
  let cardKeys = [];
  let deckKeys = [];
  let themeKeys = [];
  let otherKeys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key) || '';
    const size = (key.length + value.length) * 2; // Approximation en bytes (UTF-16)
    
    totalSize += size;
    
    if (key.includes('flashcard') || key.includes('card')) {
      cardKeys.push({ key, size: Math.round(size / 1024) });
    } else if (key.includes('deck')) {
      deckKeys.push({ key, size: Math.round(size / 1024) });
    } else if (key.includes('theme')) {
      themeKeys.push({ key, size: Math.round(size / 1024) });
    } else {
      otherKeys.push({ key, size: Math.round(size / 1024) });
    }
  }
  
  console.log('=== STATISTIQUES DU STOCKAGE ===');
  console.log(`Taille totale: ${Math.round(totalSize / 1024)} KB (sur 5120 KB max)`);
  console.log(`Clés liées aux cartes: ${cardKeys.length}`);
  console.log('Détail des clés de cartes:', cardKeys);
  console.log(`Clés liées aux decks: ${deckKeys.length}`);
  console.log(`Clés liées aux thèmes: ${themeKeys.length}`);
  console.log(`Autres clés: ${otherKeys.length}`);
  console.log('==============================');
}

// Fonction pour tenter de récupérer toutes les cartes
function recoverCards() {
  // Le nom de la clé utilisée pour stocker les cartes
  const CARDS_KEY = 'cds-flashcard-cards';
  
  // Liste pour stocker toutes les cartes récupérées
  let allCards = [];
  
  // 1. Essayons d'abord la clé principale
  try {
    const mainData = localStorage.getItem(CARDS_KEY);
    if (mainData) {
      try {
        const cards = JSON.parse(mainData);
        if (Array.isArray(cards) && cards.length > 0) {
          console.log(`Trouvé ${cards.length} cartes dans la clé principale`);
          allCards = allCards.concat(cards);
        }
      } catch (e) {
        console.warn('Erreur de parsing de la clé principale:', e);
      }
    }
  } catch (e) {
    console.error('Erreur lors de la récupération de la clé principale:', e);
  }
  
  // 2. Cherchons ensuite les segments
  const segmentPrefixes = ['_s', '_segment_'];
  
  segmentPrefixes.forEach(prefix => {
    for (let i = 0; i < 100; i++) {
      const segmentKey = `${CARDS_KEY}${prefix}${i}`;
      try {
        const segmentData = localStorage.getItem(segmentKey);
        if (!segmentData) continue;
        
        try {
          // Essayer de parser chaque segment
          let dataString = segmentData;
          
          // Si le segment est compressé, tenter de récupérer les données brutes
          if (segmentData.startsWith('C:') || segmentData.startsWith('R:')) {
            dataString = segmentData.substring(2); // Enlever le préfixe
          }
          
          const cards = JSON.parse(dataString);
          if (Array.isArray(cards) && cards.length > 0) {
            console.log(`Trouvé ${cards.length} cartes dans ${segmentKey}`);
            allCards = allCards.concat(cards);
          }
        } catch (parseError) {
          console.warn(`Erreur de parsing pour ${segmentKey}:`, parseError);
        }
      } catch (e) {
        // Ignorer les erreurs de récupération
      }
    }
  });
  
  // 3. Recherche des clés de sauvegarde
  const backupKeys = [
    `${CARDS_KEY}_backup`,
    `${CARDS_KEY}_legacy`,
    `${CARDS_KEY}_recovered`
  ];
  
  backupKeys.forEach(backupKey => {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) return;
      
      try {
        const cards = JSON.parse(backupData);
        if (Array.isArray(cards) && cards.length > 0) {
          console.log(`Trouvé ${cards.length} cartes dans ${backupKey}`);
          allCards = allCards.concat(cards);
        }
      } catch (parseError) {
        console.warn(`Erreur de parsing pour ${backupKey}:`, parseError);
      }
    } catch (e) {
      // Ignorer les erreurs de récupération
    }
  });
  
  // 4. Déduplication des cartes par ID
  const uniqueCards = {};
  allCards.forEach(card => {
    if (card && card.id) {
      uniqueCards[card.id] = card;
    }
  });
  
  const finalCards = Object.values(uniqueCards);
  
  console.log(`=== RÉSULTAT DE LA RÉCUPÉRATION ===`);
  console.log(`Total de cartes récupérées: ${finalCards.length}`);
  
  // 5. Sauvegarder les cartes récupérées
  if (finalCards.length > 0) {
    try {
      // D'abord, sauvegardons une copie de sécurité
      localStorage.setItem(`${CARDS_KEY}_emergency_backup`, JSON.stringify(finalCards));
      console.log('Sauvegarde d\'urgence créée avec succès');
      
      // Maintenant, restaurons les cartes dans la clé principale
      localStorage.setItem(CARDS_KEY, JSON.stringify(finalCards));
      console.log('Cartes restaurées avec succès dans la clé principale');
      
      // Nettoyons les segments pour éviter toute confusion
      for (let i = 0; i < 100; i++) {
        segmentPrefixes.forEach(prefix => {
          localStorage.removeItem(`${CARDS_KEY}${prefix}${i}`);
        });
      }
      console.log('Nettoyage des segments terminé');
      
      return finalCards;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des cartes récupérées:', e);
    }
  }
  
  return [];
}

// Fonction principale de récupération
function performRecovery() {
  console.log('Démarrage de la récupération des données...');
  
  // Afficher l'état actuel du localStorage
  getStorageStats();
  
  // Tenter de récupérer les cartes
  const recoveredCards = recoverCards();
  
  console.log(`Récupération terminée. ${recoveredCards.length} cartes restaurées.`);
  
  // Afficher les cartes récupérées (limité pour éviter de surcharger la console)
  if (recoveredCards.length > 0) {
    console.log('Échantillon des cartes récupérées:');
    recoveredCards.slice(0, 3).forEach((card, index) => {
      console.log(`Carte ${index + 1}:`, {
        id: card.id,
        deckId: card.deckId,
        front: card.front.text,
        back: card.back.text
      });
    });
    console.log(`... et ${recoveredCards.length - 3} autres cartes`);
  }
  
  return recoveredCards;
}

// Exécuter la récupération et retourner le résultat
performRecovery();