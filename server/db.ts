import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure WebSockets for Neon database
neonConfig.webSocketConstructor = ws;

// Vérifier que DATABASE_URL est disponible
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL n'est pas défini. Assurez-vous d'avoir configuré la base de données."
  );
}

// Créer une connexion à la base de données
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });