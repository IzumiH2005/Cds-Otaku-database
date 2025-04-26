import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';

// Configuration pour la connexion WebSocket avec Neon Database
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Variable DATABASE_URL non définie");
    process.exit(1);
  }

  console.log("Connexion à la base de données...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Création des tables...");
  
  try {
    // Utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        avatar TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table users créée");

    // Decks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS decks (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        cover_image TEXT,
        author_id INTEGER REFERENCES users(id) NOT NULL,
        is_public BOOLEAN DEFAULT FALSE NOT NULL,
        is_published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMP,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table decks créée");

    // Themes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS themes (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        deck_id INTEGER REFERENCES decks(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        cover_image TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table themes créée");

    // Flashcards
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        deck_id INTEGER REFERENCES decks(id) NOT NULL,
        theme_id INTEGER REFERENCES themes(id),
        front JSONB NOT NULL,
        back JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table flashcards créée");

    // Shared codes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        deck_id INTEGER REFERENCES decks(id) NOT NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table shared_codes créée");

    // Imported decks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imported_decks (
        id SERIAL PRIMARY KEY,
        original_deck_id VARCHAR(255) NOT NULL,
        local_deck_id INTEGER REFERENCES decks(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Table imported_decks créée");

    console.log("Migration terminée avec succès");
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();