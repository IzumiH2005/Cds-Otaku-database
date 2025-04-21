import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, boolean, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  decks: many(decks),
}));

// Decks table
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image"),
  authorId: serial("author_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const decksRelations = relations(decks, ({ one, many }) => ({
  author: one(users, {
    fields: [decks.authorId],
    references: [users.id],
  }),
  themes: many(themes),
  flashcards: many(flashcards),
}));

// Themes table
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  deckId: serial("deck_id").references(() => decks.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const themesRelations = relations(themes, ({ one, many }) => ({
  deck: one(decks, {
    fields: [themes.deckId],
    references: [decks.id],
  }),
  flashcards: many(flashcards),
}));

// Flashcards table
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  deckId: serial("deck_id").references(() => decks.id).notNull(),
  themeId: serial("theme_id").references(() => themes.id),
  front: jsonb("front").notNull(),
  back: jsonb("back").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  deck: one(decks, {
    fields: [flashcards.deckId],
    references: [decks.id],
  }),
  theme: one(themes, {
    fields: [flashcards.themeId],
    references: [themes.id],
  }),
}));

// Shared codes table
export const sharedCodes = pgTable("shared_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  deckId: serial("deck_id").references(() => decks.id).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sharedCodesRelations = relations(sharedCodes, ({ one }) => ({
  deck: one(decks, {
    fields: [sharedCodes.deckId],
    references: [decks.id],
  }),
}));

// Import relationships
export const importedDecks = pgTable("imported_decks", {
  id: serial("id").primaryKey(),
  originalDeckId: varchar("original_deck_id", { length: 255 }).notNull(),
  localDeckId: serial("local_deck_id").references(() => decks.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const importedDecksRelations = relations(importedDecks, ({ one }) => ({
  localDeck: one(decks, {
    fields: [importedDecks.localDeckId],
    references: [decks.id],
  }),
}));

// Schema types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = typeof decks.$inferInsert;
export const insertDeckSchema = createInsertSchema(decks).omit({ id: true });

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;
export const insertThemeSchema = createInsertSchema(themes).omit({ id: true });

export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = typeof flashcards.$inferInsert;
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true });

export type SharedCode = typeof sharedCodes.$inferSelect;
export type InsertSharedCode = typeof sharedCodes.$inferInsert;
export const insertSharedCodeSchema = createInsertSchema(sharedCodes).omit({ id: true });

export type ImportedDeck = typeof importedDecks.$inferSelect;
export type InsertImportedDeck = typeof importedDecks.$inferInsert;
export const insertImportedDeckSchema = createInsertSchema(importedDecks).omit({ id: true });