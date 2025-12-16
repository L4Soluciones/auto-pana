import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateVehicleKm, getSelectedVehicle } from './storage';

const STORAGE_KEYS = {
  TRIP_DATA: '@ponte_pila:trip_data',
  TRACKING_ENABLED: '@ponte_pila:tracking_enabled',
  ACCUMULATED_KM: '@ponte_pila:accumulated_km',
};

export type TrackingState = 'idle' | 'detecting' | 'recording' | 'paused';

export interface TripPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  accuracy: number | null;
}

export interface TripSession {
  id: string;
  vehicleId: string;
  startTime: number;
  endTime: number | null;
  points: TripPoint[];
  distanceKm: number;
  status: 'active' | 'completed';
}

export interface TrackingSettings {
  enabled: boolean;
  minSpeedKmh: number;
  maxAccuracyMeters: number;
  minDistanceMeters: number;
  stationaryTimeoutMs: number;
}

const DEFAULT_SETTINGS: TrackingSettings = {
  enabled: false,
  minSpeedKmh: 10,
  maxAccuracyMeters: 50,
  minDistanceMeters: 20,
  stationaryTimeoutMs: 120000,
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

export function isValidLocationPoint(
  point: TripPoint,
  previousPoint: TripPoint | null,
  settings: TrackingSettings
): boolean {
  if (point.accuracy !== null && point.accuracy > settings.maxAccuracyMeters) {
    return false;
  }
  
  if (previousPoint) {
    const distanceKm = calculateHaversineDistance(
      previousPoint.latitude,
      previousPoint.longitude,
      point.latitude,
      point.longitude
    );
    const timeDiffSeconds = (point.timestamp - previousPoint.timestamp) / 1000;
    
    if (timeDiffSeconds > 0) {
      const speedKmh = (distanceKm / timeDiffSeconds) * 3600;
      if (speedKmh > 200) {
        return false;
      }
    }
  }
  
  return true;
}

export function convertSpeedToKmh(speedMs: number | null): number {
  if (speedMs === null || speedMs < 0) return 0;
  return speedMs * 3.6;
}

export function isDriving(speedKmh: number, minSpeedKmh: number): boolean {
  return speedKmh >= minSpeedKmh;
}

export async function getTrackingEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.TRACKING_ENABLED);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setTrackingEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_ENABLED, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting tracking enabled:', error);
  }
}

export async function getAccumulatedKm(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ACCUMULATED_KM);
    return value ? parseFloat(value) : 0;
  } catch {
    return 0;
  }
}

export async function addAccumulatedKm(km: number): Promise<number> {
  try {
    const current = await getAccumulatedKm();
    const newTotal = current + km;
    await AsyncStorage.setItem(STORAGE_KEYS.ACCUMULATED_KM, newTotal.toString());
    return newTotal;
  } catch {
    return 0;
  }
}

export async function resetAccumulatedKm(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCUMULATED_KM, '0');
  } catch (error) {
    console.error('Error resetting accumulated km:', error);
  }
}

export async function syncAccumulatedKmToVehicle(): Promise<number> {
  try {
    const vehicle = await getSelectedVehicle();
    if (!vehicle) return 0;
    
    const accumulated = await getAccumulatedKm();
    if (accumulated <= 0) return vehicle.currentKm;
    
    const newKm = vehicle.currentKm + Math.round(accumulated);
    await updateVehicleKm(vehicle.id, newKm);
    await resetAccumulatedKm();
    
    return newKm;
  } catch (error) {
    console.error('Error syncing accumulated km:', error);
    return 0;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

class TripTrackingService {
  private state: TrackingState = 'idle';
  private currentSession: TripSession | null = null;
  private lastPoint: TripPoint | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private settings: TrackingSettings = DEFAULT_SETTINGS;
  private stationaryTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(state: TrackingState, km: number) => void> = new Set();
  private accumulatedSessionKm: number = 0;

  getState(): TrackingState {
    return this.state;
  }

  getAccumulatedSessionKm(): number {
    return this.accumulatedSessionKm;
  }

  addListener(callback: (state: TrackingState, km: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.state, this.accumulatedSessionKm));
  }

  private setState(newState: TrackingState): void {
    this.state = newState;
    this.notifyListeners();
  }

  async start(): Promise<boolean> {
    if (this.state !== 'idle') return false;
    
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return false;
    }
    
    const vehicle = await getSelectedVehicle();
    if (!vehicle) return false;
    
    this.currentSession = {
      id: `trip_${Date.now()}`,
      vehicleId: vehicle.id,
      startTime: Date.now(),
      endTime: null,
      points: [],
      distanceKm: 0,
      status: 'active',
    };
    
    this.accumulatedSessionKm = 0;
    this.lastPoint = null;
    this.setState('detecting');
    
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: this.settings.minDistanceMeters,
          timeInterval: 3000,
        },
        this.handleLocationUpdate.bind(this)
      );
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.setState('idle');
      return false;
    }
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    const point: TripPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      speed: location.coords.speed,
      accuracy: location.coords.accuracy,
    };
    
    const speedKmh = convertSpeedToKmh(point.speed);
    const isDrivingNow = isDriving(speedKmh, this.settings.minSpeedKmh);
    
    if (this.state === 'detecting') {
      if (isDrivingNow) {
        this.setState('recording');
        this.lastPoint = point;
        this.currentSession?.points.push(point);
        this.resetStationaryTimer();
      }
    } else if (this.state === 'recording') {
      if (isValidLocationPoint(point, this.lastPoint, this.settings)) {
        if (this.lastPoint) {
          const distanceKm = calculateHaversineDistance(
            this.lastPoint.latitude,
            this.lastPoint.longitude,
            point.latitude,
            point.longitude
          );
          
          if (distanceKm >= this.settings.minDistanceMeters / 1000) {
            this.accumulatedSessionKm += distanceKm;
            if (this.currentSession) {
              this.currentSession.distanceKm += distanceKm;
              this.currentSession.points.push(point);
            }
            this.notifyListeners();
          }
        }
        this.lastPoint = point;
      }
      
      if (isDrivingNow) {
        this.resetStationaryTimer();
      } else {
        this.startStationaryTimer();
      }
    } else if (this.state === 'paused') {
      if (isDrivingNow) {
        this.setState('recording');
        this.lastPoint = point;
        this.resetStationaryTimer();
      }
    }
  }

  private startStationaryTimer(): void {
    if (this.stationaryTimer) return;
    
    this.stationaryTimer = setTimeout(() => {
      if (this.state === 'recording') {
        this.setState('paused');
      }
    }, this.settings.stationaryTimeoutMs);
  }

  private resetStationaryTimer(): void {
    if (this.stationaryTimer) {
      clearTimeout(this.stationaryTimer);
      this.stationaryTimer = null;
    }
  }

  async stop(): Promise<number> {
    this.resetStationaryTimer();
    
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    
    const sessionKm = this.accumulatedSessionKm;
    
    if (sessionKm > 0) {
      await addAccumulatedKm(sessionKm);
      await syncAccumulatedKmToVehicle();
    }
    
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.status = 'completed';
      this.currentSession = null;
    }
    
    this.accumulatedSessionKm = 0;
    this.lastPoint = null;
    this.setState('idle');
    
    return sessionKm;
  }

  updateSettings(newSettings: Partial<TrackingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}

export const tripTrackingService = new TripTrackingService();
