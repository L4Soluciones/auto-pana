import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertAppUserSchema, insertUserVehicleSchema } from "@shared/schema";
import { z } from "zod";

// Validation schemas for API requests
const registerUserSchema = z.object({
  email: z.string().email("Email invalido"),
  deviceId: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  marketingConsent: z.boolean().default(false),
  analyticsConsent: z.boolean().default(true),
  locationConsent: z.boolean().default(false),
  appVersion: z.string().optional(),
  platform: z.string().optional(),
});

const syncVehicleSchema = z.object({
  userId: z.string(),
  localVehicleId: z.string(),
  brandSlug: z.string().optional(),
  brandName: z.string().optional(),
  modelSlug: z.string().optional(),
  modelName: z.string().optional(),
  customModel: z.string().optional(),
  year: z.number().optional(),
  fuelType: z.string().optional(),
  oilViscosity: z.string().optional(),
  oilBase: z.string().optional(),
  lubricantBrand: z.string().optional(),
  customLubricant: z.string().optional(),
  currentKm: z.number().optional(),
  monthlyKm: z.number().optional(),
});

const updateConsentSchema = z.object({
  userId: z.string(),
  consentType: z.enum(["marketing", "analytics", "location"]),
  granted: z.boolean(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register new user with consent
  app.post("/api/users/register", async (req: Request, res: Response) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getAppUserByEmail(data.email);
      if (existingUser) {
        // Update existing user and return - include all consent fields
        const updatedUser = await storage.updateAppUser(existingUser.id, {
          marketingConsent: data.marketingConsent,
          analyticsConsent: data.analyticsConsent,
          locationConsent: data.locationConsent,
          latitude: data.latitude !== undefined ? data.latitude.toString() : undefined,
          longitude: data.longitude !== undefined ? data.longitude.toString() : undefined,
          country: data.country,
          state: data.state,
          city: data.city,
          appVersion: data.appVersion,
          platform: data.platform,
        });
        
        // Log consent events for all consent changes and upsert normalized consents
        if (data.marketingConsent !== existingUser.marketingConsent) {
          await storage.logConsentEvent({
            userId: existingUser.id,
            consentType: "marketing",
            granted: data.marketingConsent,
            ipAddress: req.ip || null,
          });
        }
        await storage.upsertUserConsent(existingUser.id, "marketing", data.marketingConsent);
        
        if (data.analyticsConsent !== existingUser.analyticsConsent) {
          await storage.logConsentEvent({
            userId: existingUser.id,
            consentType: "analytics",
            granted: data.analyticsConsent,
            ipAddress: req.ip || null,
          });
        }
        await storage.upsertUserConsent(existingUser.id, "analytics", data.analyticsConsent);
        
        if (data.locationConsent !== existingUser.locationConsent) {
          await storage.logConsentEvent({
            userId: existingUser.id,
            consentType: "location",
            granted: data.locationConsent,
            ipAddress: req.ip || null,
          });
        }
        await storage.upsertUserConsent(existingUser.id, "location", data.locationConsent);
        
        return res.json({ success: true, user: updatedUser, isNew: false });
      }
      
      // Create new user
      const user = await storage.createAppUser({
        ...data,
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
      });
      
      // Log initial consent events and upsert normalized consents
      const consentTypes = [
        { type: "marketing", granted: data.marketingConsent },
        { type: "analytics", granted: data.analyticsConsent },
        { type: "location", granted: data.locationConsent },
      ];
      
      for (const consent of consentTypes) {
        await storage.logConsentEvent({
          userId: user.id,
          consentType: consent.type,
          granted: consent.granted,
          ipAddress: req.ip || null,
        });
        await storage.upsertUserConsent(user.id, consent.type, consent.granted);
      }
      
      res.status(201).json({ success: true, user, isNew: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ success: false, error: "Error al registrar usuario" });
    }
  });

  // Update user consent
  app.patch("/api/users/consent", async (req: Request, res: Response) => {
    try {
      const data = updateConsentSchema.parse(req.body);
      
      // Log consent event and upsert normalized consent
      await storage.logConsentEvent({
        userId: data.userId,
        consentType: data.consentType,
        granted: data.granted,
        ipAddress: req.ip || null,
      });
      await storage.upsertUserConsent(data.userId, data.consentType, data.granted);
      
      // Update user consent field
      const updateField: Record<string, boolean> = {};
      if (data.consentType === "marketing") {
        updateField.marketingConsent = data.granted;
      } else if (data.consentType === "analytics") {
        updateField.analyticsConsent = data.granted;
      } else if (data.consentType === "location") {
        updateField.locationConsent = data.granted;
      }
      
      const user = await storage.updateAppUser(data.userId, updateField);
      
      res.json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      console.error("Error updating consent:", error);
      res.status(500).json({ success: false, error: "Error al actualizar consentimiento" });
    }
  });

  // Sync vehicle data
  app.post("/api/vehicles/sync", async (req: Request, res: Response) => {
    try {
      const data = syncVehicleSchema.parse(req.body);
      
      // Check if vehicle already exists for this user
      const existingVehicles = await storage.getUserVehicles(data.userId);
      const existingVehicle = existingVehicles.find(
        v => v.localVehicleId === data.localVehicleId
      );
      
      if (existingVehicle) {
        // Update existing vehicle
        const updated = await storage.updateUserVehicle(existingVehicle.id, data);
        return res.json({ success: true, vehicle: updated, isNew: false });
      }
      
      // Create new vehicle
      const vehicle = await storage.createUserVehicle(data);
      res.status(201).json({ success: true, vehicle, isNew: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      console.error("Error syncing vehicle:", error);
      res.status(500).json({ success: false, error: "Error al sincronizar vehiculo" });
    }
  });

  // Get user vehicles
  app.get("/api/users/:userId/vehicles", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const vehicles = await storage.getUserVehicles(userId);
      res.json({ success: true, vehicles });
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ success: false, error: "Error al obtener vehiculos" });
    }
  });

  // Get user by email (for checking registration status)
  app.get("/api/users/by-email/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const user = await storage.getAppUserByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ success: false, error: "Error al obtener usuario" });
    }
  });

  // Analytics endpoint - get user stats (for admin/analytics purposes)
  app.get("/api/analytics/stats", async (_req: Request, res: Response) => {
    try {
      // This would be expanded with actual analytics queries
      res.json({
        success: true,
        message: "Analytics endpoint ready",
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ success: false, error: "Error al obtener estadisticas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
