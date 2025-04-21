import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration pour la connexion WebSocket avec Neon Database
neonConfig.webSocketConstructor = ws;

async function main() {
  try {
    console.log("Connexion à la base de données...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log("Création des tables...");
    // Création de la table users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        avatar TEXT,
        bio TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table users créée ou existante");

    // Création de la table decks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS decks (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        cover_image TEXT,
        author_id INTEGER NOT NULL REFERENCES users(id),
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMP,
        tags TEXT[],
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table decks créée ou existante");

    // Création de la table themes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS themes (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        deck_id INTEGER NOT NULL REFERENCES decks(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        cover_image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table themes créée ou existante");

    // Création de la table flashcards
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        deck_id INTEGER NOT NULL REFERENCES decks(id),
        theme_id INTEGER REFERENCES themes(id),
        front JSONB NOT NULL,
        back JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table flashcards créée ou existante");

    // Création de la table shared_codes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        deck_id INTEGER NOT NULL REFERENCES decks(id),
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table shared_codes créée ou existante");

    // Création de la table imported_decks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imported_decks (
        id SERIAL PRIMARY KEY,
        original_deck_id VARCHAR(255) NOT NULL,
        local_deck_id INTEGER NOT NULL REFERENCES decks(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table imported_decks créée ou existante");

    console.log("Toutes les tables ont été créées ou vérifiées !");
    await pool.end();
  } catch (error) {
    console.error("Erreur lors de la création des tables:", error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});