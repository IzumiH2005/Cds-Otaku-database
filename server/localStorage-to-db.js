// Script de migration des données de localStorage vers PostgreSQL
// A exécuter après la création des tables

import { db } from './db.js';
import { users, decks, themes, flashcards } from '../shared/schema.js';
import { v4 as uuidv4 } from 'uuid';

// Fonction pour récupérer les données du localStorage
// Cette fonction doit être appelée dans le navigateur et son résultat exporté
function getLocalStorageData() {
  // Clés de localStorage
  const keys = {
    user: 'flashcard-app-user',
    decks: 'flashcard-app-decks',
    themes: 'flashcard-app-themes',
    cards: 'cds-flashcard-cards',
  };

  // Récupération des données
  const userData = JSON.parse(localStorage.getItem(keys.user) || 'null');
  const decksData = JSON.parse(localStorage.getItem(keys.decks) || '[]');
  const themesData = JSON.parse(localStorage.getItem(keys.themes) || '[]');
  
  // Recherche des cartes dans différentes clés possibles
  let cardsData = [];
  
  try {
    // Essayer la clé principale
    cardsData = JSON.parse(localStorage.getItem(keys.cards) || '[]');
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes:", error);
    
    // Chercher les segments
    const segmentPrefix = `${keys.cards}_s`;
    let allCards = [];
    
    for (let i = 0; i < 100; i++) {
      const segmentKey = `${segmentPrefix}${i}`;
      try {
        const segment = localStorage.getItem(segmentKey);
        if (segment) {
          const cards = JSON.parse(segment);
          if (Array.isArray(cards)) {
            allCards = [...allCards, ...cards];
          }
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    }
    
    if (allCards.length > 0) {
      cardsData = allCards;
    }
  }
  
  // En dernier recours, chercher dans la sauvegarde d'urgence
  if (cardsData.length === 0) {
    try {
      cardsData = JSON.parse(localStorage.getItem(`${keys.cards}_emergency_backup`) || '[]');
    } catch (error) {
      console.error("Erreur lors de la récupération de la sauvegarde d'urgence:", error);
    }
  }
  
  return {
    user: userData,
    decks: decksData,
    themes: themesData,
    cards: cardsData,
  };
}

// Fonction pour migrer les données vers la base de données
async function migrateDataToDB(data) {
  try {
    console.log("Début de la migration des données...");
    
    // 1. Migrer l'utilisateur
    let userId = null;
    if (data.user) {
      console.log("Migration de l'utilisateur...");
      
      // Vérifier si l'utilisateur existe déjà
      let [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.externalId, data.user.id));
      
      if (!existingUser) {
        // Créer l'utilisateur
        const [newUser] = await db.insert(users).values({
          externalId: data.user.id,
          name: data.user.name || 'Utilisateur',
          email: data.user.email || 'utilisateur@exemple.com',
          avatar: data.user.avatar,
          bio: data.user.bio || '',
        }).returning();
        
        userId = newUser.id;
        console.log(`Utilisateur créé avec ID: ${userId}`);
      } else {
        userId = existingUser.id;
        console.log(`Utilisateur existant trouvé avec ID: ${userId}`);
      }
    } else {
      // Créer un utilisateur par défaut si nécessaire
      const [defaultUser] = await db.insert(users).values({
        externalId: uuidv4(),
        name: 'Utilisateur par défaut',
        email: 'default@exemple.com',
        bio: 'Utilisateur créé lors de la migration',
      }).returning();
      
      userId = defaultUser.id;
      console.log(`Utilisateur par défaut créé avec ID: ${userId}`);
    }
    
    // 2. Migrer les decks
    console.log("Migration des decks...");
    const deckIdMap = new Map(); // Pour mapper les anciens IDs aux nouveaux
    
    for (const deck of data.decks) {
      // Vérifier si le deck existe déjà
      let [existingDeck] = await db
        .select()
        .from(decks)
        .where(eq(decks.externalId, deck.id));
      
      if (!existingDeck) {
        // Créer le deck
        const [newDeck] = await db.insert(decks).values({
          externalId: deck.id,
          title: deck.title,
          description: deck.description || '',
          coverImage: deck.coverImage,
          authorId: userId,
          isPublic: deck.isPublic || false,
          isPublished: deck.isPublished || false,
          publishedAt: deck.publishedAt ? new Date(deck.publishedAt) : null,
          tags: deck.tags || [],
        }).returning();
        
        deckIdMap.set(deck.id, newDeck.id);
        console.log(`Deck "${deck.title}" créé avec ID: ${newDeck.id}`);
      } else {
        deckIdMap.set(deck.id, existingDeck.id);
        console.log(`Deck "${deck.title}" existant trouvé avec ID: ${existingDeck.id}`);
      }
    }
    
    // 3. Migrer les thèmes
    console.log("Migration des thèmes...");
    const themeIdMap = new Map(); // Pour mapper les anciens IDs aux nouveaux
    
    for (const theme of data.themes) {
      // Vérifier que le deck associé existe
      const deckId = deckIdMap.get(theme.deckId);
      if (!deckId) {
        console.warn(`Le deck associé au thème "${theme.title}" (ID: ${theme.deckId}) n'existe pas. Thème ignoré.`);
        continue;
      }
      
      // Vérifier si le thème existe déjà
      let [existingTheme] = await db
        .select()
        .from(themes)
        .where(eq(themes.externalId, theme.id));
      
      if (!existingTheme) {
        // Créer le thème
        const [newTheme] = await db.insert(themes).values({
          externalId: theme.id,
          deckId: deckId,
          title: theme.title,
          description: theme.description || '',
          coverImage: theme.coverImage,
        }).returning();
        
        themeIdMap.set(theme.id, newTheme.id);
        console.log(`Thème "${theme.title}" créé avec ID: ${newTheme.id}`);
      } else {
        themeIdMap.set(theme.id, existingTheme.id);
        console.log(`Thème "${theme.title}" existant trouvé avec ID: ${existingTheme.id}`);
      }
    }
    
    // 4. Migrer les flashcards
    console.log("Migration des flashcards...");
    
    for (const card of data.cards) {
      // Vérifier que le deck associé existe
      const deckId = deckIdMap.get(card.deckId);
      if (!deckId) {
        console.warn(`Le deck associé à la carte (ID: ${card.id}) n'existe pas. Carte ignorée.`);
        continue;
      }
      
      // Vérifier si la thème associé existe (s'il y en a un)
      let themeId = null;
      if (card.themeId) {
        themeId = themeIdMap.get(card.themeId);
        if (!themeId) {
          console.warn(`Le thème associé à la carte (ID: ${card.id}) n'existe pas.`);
        }
      }
      
      // Vérifier si la carte existe déjà
      let [existingCard] = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.externalId, card.id));
      
      if (!existingCard) {
        // Créer la carte
        const [newCard] = await db.insert(flashcards).values({
          externalId: card.id,
          deckId: deckId,
          themeId: themeId,
          front: card.front,
          back: card.back,
        }).returning();
        
        console.log(`Flashcard créée avec ID: ${newCard.id}`);
      } else {
        console.log(`Flashcard existante trouvée avec ID: ${existingCard.id}`);
      }
    }
    
    console.log("Migration terminée avec succès!");
    return {
      migrated: {
        users: 1,
        decks: data.decks.length,
        themes: data.themes.length,
        cards: data.cards.length
      }
    };
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    throw error;
  }
}

// Générer un script de migration qui peut être utilisé dans la console du navigateur
export function generateMigrationScript() {
  return `
// Récupérer les données du localStorage
const localData = ${getLocalStorageData.toString()}();

// Convertir en JSON pour l'export
const exportData = JSON.stringify(localData);

// Télécharger les données
function downloadData(data, filename) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

downloadData(exportData, 'flashcards-export.json');
console.log('Les données ont été exportées. Vous pouvez maintenant les importer dans la base de données.');
`;
}

// Si ce script est exécuté directement
if (typeof window === 'undefined' && require.main === module) {
  console.log(generateMigrationScript());
}