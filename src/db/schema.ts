import { pgTable, serial, varchar, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  accessToken: text("access_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  batchId: varchar("batch_id", { length: 64 }).notNull(),
  batchName: varchar("batch_name", { length: 300 }),
  batchData: jsonb("batch_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  contentId: varchar("content_id", { length: 64 }).notNull(),
  done: boolean("done").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  subjectId: varchar("subject_id", { length: 64 }),
  tag: varchar("tag", { length: 64 }),
  kind: varchar("kind", { length: 32 }),
  contentId: varchar("content_id", { length: 64 }),
  title: varchar("title", { length: 500 }),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
});

export const verifyTokens = pgTable("verify_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
});

export const promos = pgTable("promos", {
  id: serial("id").primaryKey(),
  img: text("img").notNull(),
  link: text("link"),
  sortOrder: integer("sort_order").default(0).notNull(),
});
