import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';

// Configuration pour la connexion WebSocket avec Neon Database
neonConfig.webSocketConstructor = ws;

// Fonction pour lire les données du localStorage (à exécuter dans un environnement client)
function getLocalStorageData() {
  const users = JSON.parse(localStorage.getItem('cds-flashcard-user') || 'null');
  const decks = JSON.parse(localStorage.getItem('cds-flashcard-decks') || '[]');
  const themes = JSON.parse(localStorage.getItem('cds-flashcard-themes') || '[]');
  const flashcards = JSON.parse(localStorage.getItem('cds-flashcard-cards') || '[]');
  const sharedCodes = JSON.parse(localStorage.getItem('cds-flashcard-shared') || '[]');
  const sharedDecks = JSON.parse(localStorage.getItem('cds-flashcard-shared-decks') || '[]');
  
  return { users, decks, themes, flashcards, sharedCodes, sharedDecks };
}

// Fonction pour migrer les données vers PostgreSQL
async function migrateDataToDB(data) {
  if (!process.env.DATABASE_URL) {
    console.error("Variable DATABASE_URL non définie");
    process.exit(1);
  }

  console.log("Connexion à la base de données...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Migrer l'utilisateur
    if (data.users) {
      const user = data.users;
      const userWithExternalId = {
        externalId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      };
      
      const [dbUser] = await db.insert(schema.users).values(userWithExternalId).returning();
      console.log(`Utilisateur migré: ${dbUser.name}`);
      
      // Migrer les decks
      if (data.decks && data.decks.length > 0) {
        for (const deck of data.decks) {
          const deckWithExternalId = {
            externalId: deck.id,
            title: deck.title,
            description: deck.description,
            coverImage: deck.coverImage,
            authorId: dbUser.id, // Utiliser l'ID de l'utilisateur migré
            isPublic: deck.isPublic,
            isPublished: deck.isPublished,
            publishedAt: deck.publishedAt ? new Date(deck.publishedAt) : null,
            tags: deck.tags,
          };
          
          const [dbDeck] = await db.insert(schema.decks).values(deckWithExternalId).returning();
          console.log(`Deck migré: ${dbDeck.title}`);
          
          // Migrer les thèmes pour ce deck
          const deckThemes = data.themes.filter(theme => theme.deckId === deck.id);
          for (const theme of deckThemes) {
            const themeWithExternalId = {
              externalId: theme.id,
              deckId: dbDeck.id, // Utiliser l'ID du deck migré
              title: theme.title,
              description: theme.description,
              coverImage: theme.coverImage,
            };
            
            const [dbTheme] = await db.insert(schema.themes).values(themeWithExternalId).returning();
            console.log(`Thème migré: ${dbTheme.title}`);
            
            // Migrer les flashcards pour ce thème
            const themeFlashcards = data.flashcards.filter(card => card.themeId === theme.id);
            for (const card of themeFlashcards) {
              const cardWithExternalId = {
                externalId: card.id,
                deckId: dbDeck.id, // Utiliser l'ID du deck migré
                themeId: dbTheme.id, // Utiliser l'ID du thème migré
                front: card.front,
                back: card.back,
              };
              
              const [dbCard] = await db.insert(schema.flashcards).values(cardWithExternalId).returning();
              console.log(`Flashcard migrée: ${card.id}`);
            }
          }
          
          // Migrer les flashcards sans thème pour ce deck
          const deckFlashcards = data.flashcards.filter(card => card.deckId === deck.id && !card.themeId);
          for (const card of deckFlashcards) {
            const cardWithExternalId = {
              externalId: card.id,
              deckId: dbDeck.id, // Utiliser l'ID du deck migré
              themeId: null,
              front: card.front,
              back: card.back,
            };
            
            const [dbCard] = await db.insert(schema.flashcards).values(cardWithExternalId).returning();
            console.log(`Flashcard sans thème migrée: ${card.id}`);
          }
          
          // Migrer les codes de partage pour ce deck
          const deckShareCodes = data.sharedCodes.filter(code => code.deckId === deck.id);
          for (const shareCode of deckShareCodes) {
            const sharedCodeData = {
              code: shareCode.code,
              deckId: dbDeck.id, // Utiliser l'ID du deck migré
              expiresAt: shareCode.expiresAt ? new Date(shareCode.expiresAt) : null,
            };
            
            const [dbShareCode] = await db.insert(schema.sharedCodes).values(sharedCodeData).returning();
            console.log(`Code de partage migré: ${dbShareCode.code}`);
          }
        }
      }
      
      // Migrer les relations d'importation
      if (data.sharedDecks && data.sharedDecks.length > 0) {
        for (const sharedDeck of data.sharedDecks) {
          // Trouver le deck local correspondant
          const localDeck = data.decks.find(d => d.id === sharedDeck.localDeckId);
          if (!localDeck) continue;
          
          // Trouver le deck local migré dans la base de données
          const [dbDeck] = await db
            .select()
            .from(schema.decks)
            .where(eq(schema.decks.externalId, localDeck.id));
          
          if (!dbDeck) continue;
          
          const importedDeckData = {
            originalDeckId: sharedDeck.originalId,
            localDeckId: dbDeck.id,
          };
          
          const [dbImportedDeck] = await db.insert(schema.importedDecks).values(importedDeckData).returning();
          console.log(`Relation d'importation migrée: ${sharedDeck.originalId} -> ${dbDeck.id}`);
        }
      }
    }
    
    console.log("Migration terminée avec succès !");
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
  } finally {
    await pool.end();
  }
}

// Fonction pour exporter un script qui peut être exécuté dans le navigateur
export function generateMigrationScript() {
  return `
    // Récupérer les données à partir du localStorage
    const data = ${getLocalStorageData.toString()}();
    
    // Envoyer les données au serveur pour migration
    fetch('/api/migrate-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          console.log('Migration des données réussie !');
          alert('Vos données ont été migrées avec succès vers la base de données.');
        } else {
          console.error('Erreur lors de la migration:', result.error);
          alert('Erreur lors de la migration: ' + result.error);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la requête:', error);
        alert('Erreur lors de la requête: ' + error.message);
      });
  `;
}

// Exporter les fonctions pour une utilisation dans d'autres fichiers
export { getLocalStorageData, migrateDataToDB };