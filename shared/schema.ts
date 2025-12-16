import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// User analytics table - stores registered users with consent
export const appUsers = pgTable("app_users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  deviceId: text("device_id"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  // Location data from registration
  country: text("country"),
  state: text("state"),
  city: text("city"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  // Consent flags
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  analyticsConsent: boolean("analytics_consent").default(true).notNull(),
  locationConsent: boolean("location_consent").default(false).notNull(),
  // App metadata
  appVersion: text("app_version"),
  platform: text("platform"), // ios, android, web
});

// User vehicles table - stores vehicle data for analytics
export const userVehicles = pgTable("user_vehicles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  localVehicleId: text("local_vehicle_id").notNull(),
  // Vehicle identification
  brandSlug: text("brand_slug"),
  brandName: text("brand_name"),
  modelSlug: text("model_slug"),
  modelName: text("model_name"),
  customModel: text("custom_model"),
  year: integer("year"),
  // Vehicle specs
  fuelType: text("fuel_type"), // gasolina, diesel, gnv, hibrido
  oilViscosity: text("oil_viscosity"),
  oilBase: text("oil_base"),
  lubricantBrand: text("lubricant_brand"),
  customLubricant: text("custom_lubricant"),
  // Usage metrics
  currentKm: integer("current_km"),
  monthlyKm: integer("monthly_km"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User consents - normalized table for current consent state
export const userConsents = pgTable("user_consents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(), // marketing, analytics, location
  granted: boolean("granted").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Consent events log - audit trail for consent changes
export const consentEvents = pgTable("consent_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(), // marketing, analytics, location
  granted: boolean("granted").notNull(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Relations
export const appUsersRelations = relations(appUsers, ({ many }) => ({
  vehicles: many(userVehicles),
  consents: many(userConsents),
  consentEvents: many(consentEvents),
}));

export const userConsentsRelations = relations(userConsents, ({ one }) => ({
  user: one(appUsers, {
    fields: [userConsents.userId],
    references: [appUsers.id],
  }),
}));

export const userVehiclesRelations = relations(userVehicles, ({ one }) => ({
  user: one(appUsers, {
    fields: [userVehicles.userId],
    references: [appUsers.id],
  }),
}));

export const consentEventsRelations = relations(consentEvents, ({ one }) => ({
  user: one(appUsers, {
    fields: [consentEvents.userId],
    references: [appUsers.id],
  }),
}));

// Zod schemas for validation
export const insertAppUserSchema = createInsertSchema(appUsers, {
  email: z.string().email("Email invalido"),
}).omit({ id: true, registeredAt: true });

export const selectAppUserSchema = createSelectSchema(appUsers);

export const insertUserVehicleSchema = createInsertSchema(userVehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserVehicleSchema = createSelectSchema(userVehicles);

export const insertConsentEventSchema = createInsertSchema(consentEvents).omit({
  id: true,
  occurredAt: true,
});

// Types
export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = z.infer<typeof insertAppUserSchema>;
export type UserVehicle = typeof userVehicles.$inferSelect;
export type InsertUserVehicle = z.infer<typeof insertUserVehicleSchema>;
export type ConsentEvent = typeof consentEvents.$inferSelect;
export type InsertConsentEvent = z.infer<typeof insertConsentEventSchema>;
