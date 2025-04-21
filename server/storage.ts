import { db } from "./db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { 
  users, 
  decks, 
  themes, 
  flashcards, 
  sharedCodes,
  importedDecks,
  User,
  Deck,
  Theme,
  Flashcard,
  SharedCode,
  ImportedDeck
} from "../shared/schema";

// Interface de stockage
export interface IStorage {
  // Utilisateurs
  getUser(id: number): Promise<User | undefined>;
  getUserByExternalId(externalId: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  
  // Decks
  getDecks(): Promise<Deck[]>;
  getDecksByAuthor(authorId: number): Promise<Deck[]>;
  getDeck(id: number): Promise<Deck | undefined>;
  getDeckByExternalId(externalId: string): Promise<Deck | undefined>;
  createDeck(deck: Omit<Deck, "id" | "createdAt" | "updatedAt">): Promise<Deck>;
  updateDeck(id: number, deckData: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
  
  // Thèmes
  getThemes(): Promise<Theme[]>;
  getThemesByDeck(deckId: number): Promise<Theme[]>;
  getTheme(id: number): Promise<Theme | undefined>;
  getThemeByExternalId(externalId: string): Promise<Theme | undefined>;
  createTheme(theme: Omit<Theme, "id" | "createdAt" | "updatedAt">): Promise<Theme>;
  updateTheme(id: number, themeData: Partial<Theme>): Promise<Theme | undefined>;
  deleteTheme(id: number): Promise<boolean>;
  
  // Flashcards
  getFlashcards(): Promise<Flashcard[]>;
  getFlashcardsByDeck(deckId: number): Promise<Flashcard[]>;
  getFlashcardsByTheme(themeId: number): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  getFlashcardByExternalId(externalId: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: Omit<Flashcard, "id" | "createdAt" | "updatedAt">): Promise<Flashcard>;
  updateFlashcard(id: number, cardData: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<boolean>;
  
  // Codes de partage
  getSharedDeckCodes(): Promise<SharedCode[]>;
  createShareCode(deckId: number, expiresAt?: Date): Promise<string>;
  getSharedDeckByCode(code: string): Promise<Deck | undefined>;
  
  // Decks importés
  getImportedDecks(): Promise<ImportedDeck[]>;
  createImportedDeck(importedDeck: Omit<ImportedDeck, "id" | "createdAt">): Promise<ImportedDeck>;
  isSharedImportedDeck(deckId: number): Promise<boolean>;
  getOriginalDeckIdForImported(deckId: number): Promise<string | null>;
}

// Implémentation de l'interface avec PostgreSQL
export class DatabaseStorage implements IStorage {
  // Utilisateurs
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByExternalId(externalId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.externalId, externalId));
    return user;
  }
  
  async createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Decks
  async getDecks(): Promise<Deck[]> {
    return await db.select().from(decks);
  }
  
  async getDecksByAuthor(authorId: number): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.authorId, authorId));
  }
  
  async getDeck(id: number): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    return deck;
  }
  
  async getDeckByExternalId(externalId: string): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.externalId, externalId));
    return deck;
  }
  
  async createDeck(deck: Omit<Deck, "id" | "createdAt" | "updatedAt">): Promise<Deck> {
    const [newDeck] = await db.insert(decks).values(deck).returning();
    return newDeck;
  }
  
  async updateDeck(id: number, deckData: Partial<Deck>): Promise<Deck | undefined> {
    const [updatedDeck] = await db
      .update(decks)
      .set({ ...deckData, updatedAt: new Date() })
      .where(eq(decks.id, id))
      .returning();
    return updatedDeck;
  }
  
  async deleteDeck(id: number): Promise<boolean> {
    const result = await db.delete(decks).where(eq(decks.id, id));
    return !!result;
  }
  
  // Thèmes
  async getThemes(): Promise<Theme[]> {
    return await db.select().from(themes);
  }
  
  async getThemesByDeck(deckId: number): Promise<Theme[]> {
    return await db.select().from(themes).where(eq(themes.deckId, deckId));
  }
  
  async getTheme(id: number): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.id, id));
    return theme;
  }
  
  async getThemeByExternalId(externalId: string): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.externalId, externalId));
    return theme;
  }
  
  async createTheme(theme: Omit<Theme, "id" | "createdAt" | "updatedAt">): Promise<Theme> {
    const [newTheme] = await db.insert(themes).values(theme).returning();
    return newTheme;
  }
  
  async updateTheme(id: number, themeData: Partial<Theme>): Promise<Theme | undefined> {
    const [updatedTheme] = await db
      .update(themes)
      .set({ ...themeData, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();
    return updatedTheme;
  }
  
  async deleteTheme(id: number): Promise<boolean> {
    const result = await db.delete(themes).where(eq(themes.id, id));
    return !!result;
  }
  
  // Flashcards
  async getFlashcards(): Promise<Flashcard[]> {
    return await db.select().from(flashcards);
  }
  
  async getFlashcardsByDeck(deckId: number): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.deckId, deckId));
  }
  
  async getFlashcardsByTheme(themeId: number): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.themeId, themeId));
  }
  
  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const [flashcard] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return flashcard;
  }
  
  async getFlashcardByExternalId(externalId: string): Promise<Flashcard | undefined> {
    const [flashcard] = await db.select().from(flashcards).where(eq(flashcards.externalId, externalId));
    return flashcard;
  }
  
  async createFlashcard(flashcard: Omit<Flashcard, "id" | "createdAt" | "updatedAt">): Promise<Flashcard> {
    const [newFlashcard] = await db.insert(flashcards).values(flashcard).returning();
    return newFlashcard;
  }
  
  async updateFlashcard(id: number, cardData: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [updatedFlashcard] = await db
      .update(flashcards)
      .set({ ...cardData, updatedAt: new Date() })
      .where(eq(flashcards.id, id))
      .returning();
    return updatedFlashcard;
  }
  
  async deleteFlashcard(id: number): Promise<boolean> {
    const result = await db.delete(flashcards).where(eq(flashcards.id, id));
    return !!result;
  }
  
  // Codes de partage
  async getSharedDeckCodes(): Promise<SharedCode[]> {
    return await db.select().from(sharedCodes);
  }
  
  async createShareCode(deckId: number, expiresAt?: Date): Promise<string> {
    const code = uuidv4().substring(0, 8);
    await db.insert(sharedCodes).values({
      code,
      deckId,
      expiresAt,
    });
    return code;
  }
  
  async getSharedDeckByCode(code: string): Promise<Deck | undefined> {
    const [sharedCode] = await db
      .select()
      .from(sharedCodes)
      .where(eq(sharedCodes.code, code));
    
    if (!sharedCode) return undefined;
    
    // Vérifier si le code n'est pas expiré
    if (sharedCode.expiresAt && sharedCode.expiresAt < new Date()) {
      return undefined;
    }
    
    const [deck] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, sharedCode.deckId));
    
    return deck;
  }
  
  // Decks importés
  async getImportedDecks(): Promise<ImportedDeck[]> {
    return await db.select().from(importedDecks);
  }
  
  async createImportedDeck(importedDeck: Omit<ImportedDeck, "id" | "createdAt">): Promise<ImportedDeck> {
    const [newImportedDeck] = await db.insert(importedDecks).values(importedDeck).returning();
    return newImportedDeck;
  }
  
  async isSharedImportedDeck(deckId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(importedDecks)
      .where(eq(importedDecks.localDeckId, deckId));
    
    return !!result;
  }
  
  async getOriginalDeckIdForImported(deckId: number): Promise<string | null> {
    const [result] = await db
      .select({ originalDeckId: importedDecks.originalDeckId })
      .from(importedDecks)
      .where(eq(importedDecks.localDeckId, deckId));
    
    return result ? result.originalDeckId : null;
  }
}

// Instance de stockage à utiliser dans l'application
export const storage = new DatabaseStorage();