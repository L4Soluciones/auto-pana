import {
  appUsers,
  userVehicles,
  userConsents,
  consentEvents,
  type AppUser,
  type InsertAppUser,
  type UserVehicle,
  type InsertUserVehicle,
  type ConsentEvent,
  type InsertConsentEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // App Users
  getAppUser(id: string): Promise<AppUser | undefined>;
  getAppUserByEmail(email: string): Promise<AppUser | undefined>;
  createAppUser(user: InsertAppUser): Promise<AppUser>;
  updateAppUser(id: string, updates: Partial<InsertAppUser>): Promise<AppUser | undefined>;
  
  // User Vehicles
  getUserVehicles(userId: string): Promise<UserVehicle[]>;
  createUserVehicle(vehicle: InsertUserVehicle): Promise<UserVehicle>;
  updateUserVehicle(id: string, updates: Partial<InsertUserVehicle>): Promise<UserVehicle | undefined>;
  deleteUserVehicle(id: string): Promise<void>;
  
  // Consent Events
  logConsentEvent(event: InsertConsentEvent): Promise<ConsentEvent>;
  getConsentEvents(userId: string): Promise<ConsentEvent[]>;
  
  // User Consents (normalized current state)
  upsertUserConsent(userId: string, consentType: string, granted: boolean): Promise<void>;
  getUserConsents(userId: string): Promise<{ consentType: string; granted: boolean }[]>;
}

export class DatabaseStorage implements IStorage {
  // App Users
  async getAppUser(id: string): Promise<AppUser | undefined> {
    const [user] = await db.select().from(appUsers).where(eq(appUsers.id, id));
    return user || undefined;
  }

  async getAppUserByEmail(email: string): Promise<AppUser | undefined> {
    const [user] = await db.select().from(appUsers).where(eq(appUsers.email, email.toLowerCase()));
    return user || undefined;
  }

  async createAppUser(insertUser: InsertAppUser): Promise<AppUser> {
    const [user] = await db
      .insert(appUsers)
      .values({ ...insertUser, email: insertUser.email.toLowerCase() })
      .returning();
    return user;
  }

  async updateAppUser(id: string, updates: Partial<InsertAppUser>): Promise<AppUser | undefined> {
    const [user] = await db
      .update(appUsers)
      .set(updates)
      .where(eq(appUsers.id, id))
      .returning();
    return user || undefined;
  }

  // User Vehicles
  async getUserVehicles(userId: string): Promise<UserVehicle[]> {
    return db.select().from(userVehicles).where(eq(userVehicles.userId, userId));
  }

  async createUserVehicle(vehicle: InsertUserVehicle): Promise<UserVehicle> {
    const [newVehicle] = await db
      .insert(userVehicles)
      .values(vehicle)
      .returning();
    return newVehicle;
  }

  async updateUserVehicle(id: string, updates: Partial<InsertUserVehicle>): Promise<UserVehicle | undefined> {
    const [vehicle] = await db
      .update(userVehicles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userVehicles.id, id))
      .returning();
    return vehicle || undefined;
  }

  async deleteUserVehicle(id: string): Promise<void> {
    await db.delete(userVehicles).where(eq(userVehicles.id, id));
  }

  // Consent Events
  async logConsentEvent(event: InsertConsentEvent): Promise<ConsentEvent> {
    const [consentEvent] = await db
      .insert(consentEvents)
      .values(event)
      .returning();
    return consentEvent;
  }

  async getConsentEvents(userId: string): Promise<ConsentEvent[]> {
    return db.select().from(consentEvents).where(eq(consentEvents.userId, userId));
  }

  // User Consents (normalized current state) - upsert logic
  async upsertUserConsent(userId: string, consentType: string, granted: boolean): Promise<void> {
    // Check if consent record exists
    const [existing] = await db
      .select()
      .from(userConsents)
      .where(and(eq(userConsents.userId, userId), eq(userConsents.consentType, consentType)));
    
    if (existing) {
      // Update existing consent
      await db
        .update(userConsents)
        .set({ granted, updatedAt: new Date() })
        .where(eq(userConsents.id, existing.id));
    } else {
      // Insert new consent
      await db
        .insert(userConsents)
        .values({ userId, consentType, granted });
    }
  }

  async getUserConsents(userId: string): Promise<{ consentType: string; granted: boolean }[]> {
    const consents = await db
      .select({ consentType: userConsents.consentType, granted: userConsents.granted })
      .from(userConsents)
      .where(eq(userConsents.userId, userId));
    return consents;
  }
}

export const storage = new DatabaseStorage();
