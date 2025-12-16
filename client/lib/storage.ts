import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  getAllMaintenanceIntervals, 
  MaintenanceItemKey, 
  getManufacturers, 
  getModelsForBrand 
} from "./vehicle-specs";

const STORAGE_KEYS = {
  CAR_DATA: "@ponte_pila:car_data",
  MAINTENANCE_ITEMS: "@ponte_pila:maintenance_items",
  HAS_SETUP: "@ponte_pila:has_setup",
  DOCUMENTS: "@ponte_pila:documents",
  EXPENSES: "@ponte_pila:expenses",
  FAULTS: "@ponte_pila:faults",
  VEHICLES: "@ponte_pila:vehicles",
  SELECTED_VEHICLE_ID: "@ponte_pila:selected_vehicle_id",
  USER_REGISTRATION_ID: "@ponte_pila:user_registration_id",
};

export interface CarData {
  name: string;
  currentKm: number;
  brand: string;
  model: string;
  year: number;
  oilViscosity: string;
  oilBase: string;
}

export type HistoryStatus = 'known' | 'unknown';

export interface MaintenanceItem {
  id: string;
  name: string;
  icon: string;
  lastServiceKm: number;
  intervalKm: number;
  historyStatus: HistoryStatus;
}

const DEFAULT_MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: "engine-oil",
    name: "Aceite de Motor",
    icon: "droplet",
    lastServiceKm: 0,
    intervalKm: 5000,
    historyStatus: "known",
  },
  {
    id: "transmission-oil",
    name: "Aceite de Caja",
    icon: "settings",
    lastServiceKm: 0,
    intervalKm: 60000,
    historyStatus: "known",
  },
  {
    id: "brake-pads",
    name: "Frenos: Pastillas",
    icon: "disc",
    lastServiceKm: 0,
    intervalKm: 40000,
    historyStatus: "known",
  },
  {
    id: "brake-fluid",
    name: "Frenos: Liquido",
    icon: "flask",
    lastServiceKm: 0,
    intervalKm: 40000,
    historyStatus: "known",
  },
  {
    id: "tires",
    name: "Cauchos",
    icon: "circle",
    lastServiceKm: 0,
    intervalKm: 50000,
    historyStatus: "known",
  },
  {
    id: "battery",
    name: "Bateria",
    icon: "battery",
    lastServiceKm: 0,
    intervalKm: 40000,
    historyStatus: "known",
  },
];

export async function hasCompletedSetup(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SETUP);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setCompletedSetup(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SETUP, "true");
  } catch (error) {
    console.error("Error setting setup status:", error);
  }
}

export async function getCarData(): Promise<CarData | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CAR_DATA);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function saveCarData(data: CarData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CAR_DATA, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving car data:", error);
  }
}

export async function updateCurrentKm(km: number): Promise<void> {
  try {
    const carData = await getCarData();
    if (carData) {
      await saveCarData({ ...carData, currentKm: km });
    }
  } catch (error) {
    console.error("Error updating km:", error);
  }
}

export async function getMaintenanceItems(): Promise<MaintenanceItem[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_ITEMS);
    if (!value) return DEFAULT_MAINTENANCE_ITEMS;
    
    const storedItems: MaintenanceItem[] = JSON.parse(value);
    const storedIds = new Set(storedItems.map(item => item.id));
    
    // Migrate: Add any new default items that don't exist in stored data
    let needsUpdate = false;
    const updatedItems = [...storedItems];
    
    for (const defaultItem of DEFAULT_MAINTENANCE_ITEMS) {
      if (!storedIds.has(defaultItem.id)) {
        // Get current km to initialize lastServiceKm for new items
        const carData = await getCarData();
        const currentKm = carData?.currentKm || 0;
        updatedItems.push({ ...defaultItem, lastServiceKm: currentKm });
        needsUpdate = true;
      }
    }
    
    // Handle old "oil" -> "engine-oil" migration
    const hasOldOil = storedItems.find(item => item.id === "oil");
    const hasNewEngineOil = storedItems.find(item => item.id === "engine-oil");
    if (hasOldOil && !hasNewEngineOil) {
      const idx = updatedItems.findIndex(item => item.id === "oil");
      if (idx >= 0) {
        updatedItems[idx] = { ...updatedItems[idx], id: "engine-oil", name: "Aceite de Motor" };
        needsUpdate = true;
      }
    }
    
    // Handle old "brakes" -> "brake-pads" migration
    const hasOldBrakes = storedItems.find(item => item.id === "brakes");
    const hasNewBrakePads = storedItems.find(item => item.id === "brake-pads");
    if (hasOldBrakes && !hasNewBrakePads) {
      const idx = updatedItems.findIndex(item => item.id === "brakes");
      if (idx >= 0) {
        updatedItems[idx] = { ...updatedItems[idx], id: "brake-pads", name: "Frenos: Pastillas" };
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await saveMaintenanceItems(updatedItems);
    }
    
    return updatedItems;
  } catch {
    return DEFAULT_MAINTENANCE_ITEMS;
  }
}

export async function saveMaintenanceItems(
  items: MaintenanceItem[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.MAINTENANCE_ITEMS,
      JSON.stringify(items)
    );
  } catch (error) {
    console.error("Error saving maintenance items:", error);
  }
}

export async function updateMaintenanceItem(
  id: string,
  updates: Partial<MaintenanceItem>
): Promise<void> {
  try {
    const items = await getMaintenanceItems();
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    await saveMaintenanceItems(updatedItems);
  } catch (error) {
    console.error("Error updating maintenance item:", error);
  }
}

export async function initializeMaintenanceItems(
  currentKm: number
): Promise<void> {
  const items = DEFAULT_MAINTENANCE_ITEMS.map((item) => ({
    ...item,
    lastServiceKm: currentKm,
    historyStatus: 'known' as HistoryStatus,
  }));
  await saveMaintenanceItems(items);
}

export function getMaintenanceStatus(
  currentKm: number,
  item: MaintenanceItem
): {
  remainingKm: number;
  status: "good" | "warning" | "critical" | "unknown";
  statusText: string;
  message: string;
} {
  // Check for unknown history first
  const historyStatus = item.historyStatus ?? 'known';
  if (historyStatus === 'unknown') {
    return {
      remainingKm: 0,
      status: "unknown",
      statusText: "Mosca!",
      message: "Sin historial",
    };
  }

  const nextServiceKm = item.lastServiceKm + item.intervalKm;
  const remainingKm = nextServiceKm - currentKm;

  if (remainingKm <= 0) {
    return {
      remainingKm: 0,
      status: "critical",
      statusText: "Ponte Pila!",
      message: "Cambia esa vaina!",
    };
  } else if (remainingKm <= 500) {
    return {
      remainingKm,
      status: "critical",
      statusText: "Ponte Pila!",
      message: "Cambia esa vaina!",
    };
  } else if (remainingKm <= 1000) {
    return {
      remainingKm,
      status: "warning",
      statusText: "Mosca!",
      message: "Ya casi toca",
    };
  } else {
    return {
      remainingKm,
      status: "good",
      statusText: "Todo Fino",
      message: "Sin problemas",
    };
  }
}

export type DocumentType = "licencia" | "medico" | "rcv" | "cedula" | "impuesto_municipal" | "certificado_saberes";

export interface Document {
  id: DocumentType;
  name: string;
  expirationDate: string | null;
  hasPhoto: boolean;
}

const DEFAULT_DOCUMENTS: Document[] = [
  { id: "licencia", name: "Licencia", expirationDate: null, hasPhoto: false },
  { id: "cedula", name: "Cedula", expirationDate: null, hasPhoto: false },
  { id: "medico", name: "Certificado Medico", expirationDate: null, hasPhoto: false },
  { id: "rcv", name: "R.C.V.", expirationDate: null, hasPhoto: false },
  { id: "impuesto_municipal", name: "Impuesto Municipal", expirationDate: null, hasPhoto: false },
  { id: "certificado_saberes", name: "Certificado de Saberes", expirationDate: null, hasPhoto: false },
];

export async function getDocuments(): Promise<Document[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!value) return DEFAULT_DOCUMENTS;
    
    const storedDocs: Document[] = JSON.parse(value);
    const storedIds = new Set(storedDocs.map(d => d.id));
    
    // Add any new default documents that don't exist in stored data
    let needsUpdate = false;
    const updatedDocs = [...storedDocs];
    
    for (const defaultDoc of DEFAULT_DOCUMENTS) {
      if (!storedIds.has(defaultDoc.id)) {
        updatedDocs.push(defaultDoc);
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updatedDocs));
    }
    
    return updatedDocs;
  } catch {
    return DEFAULT_DOCUMENTS;
  }
}

export async function saveDocuments(documents: Document[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  } catch (error) {
    console.error("Error saving documents:", error);
  }
}

export async function updateDocument(
  id: DocumentType,
  updates: Partial<Document>
): Promise<void> {
  try {
    const documents = await getDocuments();
    const updatedDocuments = documents.map((doc) =>
      doc.id === id ? { ...doc, ...updates } : doc
    );
    await saveDocuments(updatedDocuments);
  } catch (error) {
    console.error("Error updating document:", error);
  }
}

export function getDocumentDaysRemaining(expirationDate: string | null): number | null {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiringDocuments(documents: Document[]): Document[] {
  return documents.filter((doc) => {
    const days = getDocumentDaysRemaining(doc.expirationDate);
    return days !== null && days < 15;
  });
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (error) {
    console.error("Error saving expenses:", error);
  }
}

export async function addExpense(expense: Omit<Expense, "id">): Promise<void> {
  try {
    const expenses = await getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    await saveExpenses([newExpense, ...expenses]);
  } catch (error) {
    console.error("Error adding expense:", error);
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    const expenses = await getExpenses();
    await saveExpenses(expenses.filter((e) => e.id !== id));
  } catch (error) {
    console.error("Error deleting expense:", error);
  }
}

export function getCurrentMonthTotal(expenses: Expense[]): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((total, expense) => total + expense.amount, 0);
}

export interface Fault {
  id: string;
  description: string;
  date: string;
  km: number;
}

export async function getFaults(): Promise<Fault[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.FAULTS);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveFaults(faults: Fault[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAULTS, JSON.stringify(faults));
  } catch (error) {
    console.error("Error saving faults:", error);
  }
}

export async function addFault(fault: Omit<Fault, "id">): Promise<void> {
  try {
    const faults = await getFaults();
    const newFault: Fault = {
      ...fault,
      id: Date.now().toString(),
    };
    await saveFaults([newFault, ...faults]);
  } catch (error) {
    console.error("Error adding fault:", error);
  }
}

export async function deleteFault(id: string): Promise<void> {
  try {
    const faults = await getFaults();
    await saveFaults(faults.filter((f) => f.id !== id));
  } catch (error) {
    console.error("Error deleting fault:", error);
  }
}

export const CAR_BRANDS = [
  "Toyota", "Ford", "Chevrolet", "Honda", "Hyundai", "Kia", "Nissan", 
  "Mazda", "Mitsubishi", "Volkswagen", "Fiat", "Renault", "Jeep", 
  "Dodge", "Chrysler", "Suzuki", "Subaru", "BMW", "Mercedes-Benz", "Otro"
];

export const OIL_VISCOSITIES = [
  "0W-20", "0W-30", "0W-40", "5W-20", "5W-30", "5W-40", "10W-30", "10W-40", "15W-40", "20W-50", "25W-60"
];

export const DIESEL_OIL_VISCOSITIES = [
  "15W-40", "20W-50", "20W-60", "Maxidiesel SAE 50"
];

export const OIL_BASES = [
  "Mineral", "Semi-sintetico", "Sintetico"
];

// ============================================
// FUEL TYPE SUPPORT
// ============================================

export type FuelType = 'gasolina' | 'diesel' | 'gnv' | 'hibrido';

export const FUEL_TYPES: { id: FuelType; name: string }[] = [
  { id: 'gasolina', name: 'Gasolina' },
  { id: 'diesel', name: 'Diesel' },
  { id: 'gnv', name: 'GNV (Gas Natural)' },
  { id: 'hibrido', name: 'Hibrido' },
];

type MaintenanceItemTemplate = Omit<MaintenanceItem, 'lastServiceKm' | 'historyStatus'>;

const GASOLINE_MAINTENANCE_ITEMS: MaintenanceItemTemplate[] = [
  { id: "engine-oil", name: "Aceite de Motor", icon: "droplet", intervalKm: 5000 },
  { id: "transmission-oil", name: "Aceite de Caja", icon: "settings", intervalKm: 60000 },
  { id: "air-filter", name: "Filtro de Aire", icon: "wind", intervalKm: 15000 },
  { id: "fuel-filter", name: "Filtro de Gasolina", icon: "filter", intervalKm: 30000 },
  { id: "spark-plugs", name: "Bujias", icon: "zap", intervalKm: 30000 },
  { id: "brake-pads", name: "Frenos: Pastillas", icon: "disc", intervalKm: 40000 },
  { id: "brake-fluid", name: "Frenos: Liquido", icon: "flask", intervalKm: 40000 },
  { id: "tires", name: "Cauchos", icon: "circle", intervalKm: 50000 },
  { id: "battery", name: "Bateria", icon: "battery", intervalKm: 40000 },
];

const DIESEL_MAINTENANCE_ITEMS: MaintenanceItemTemplate[] = [
  { id: "engine-oil", name: "Aceite de Motor", icon: "droplet", intervalKm: 10000 },
  { id: "transmission-oil", name: "Aceite de Caja", icon: "settings", intervalKm: 60000 },
  { id: "air-filter", name: "Filtro de Aire", icon: "wind", intervalKm: 15000 },
  { id: "diesel-filter", name: "Filtro de Diesel", icon: "filter", intervalKm: 20000 },
  { id: "brake-pads", name: "Frenos: Pastillas", icon: "disc", intervalKm: 40000 },
  { id: "brake-fluid", name: "Frenos: Liquido", icon: "flask", intervalKm: 40000 },
  { id: "tires", name: "Cauchos", icon: "circle", intervalKm: 50000 },
  { id: "battery", name: "Bateria", icon: "battery", intervalKm: 40000 },
];

const GNV_MAINTENANCE_ITEMS: MaintenanceItemTemplate[] = [
  { id: "engine-oil", name: "Aceite de Motor", icon: "droplet", intervalKm: 5000 },
  { id: "transmission-oil", name: "Aceite de Caja", icon: "settings", intervalKm: 60000 },
  { id: "air-filter", name: "Filtro de Aire", icon: "wind", intervalKm: 15000 },
  { id: "fuel-filter", name: "Filtro de Gasolina", icon: "filter", intervalKm: 30000 },
  { id: "spark-plugs-gnv", name: "Bujias GNV", icon: "zap", intervalKm: 20000 },
  { id: "gnv-tank", name: "Bombona GNV", icon: "cylinder", intervalKm: 60000 },
  { id: "gnv-valves", name: "Valvulas GNV", icon: "git-branch", intervalKm: 30000 },
  { id: "brake-pads", name: "Frenos: Pastillas", icon: "disc", intervalKm: 40000 },
  { id: "brake-fluid", name: "Frenos: Liquido", icon: "flask", intervalKm: 40000 },
  { id: "tires", name: "Cauchos", icon: "circle", intervalKm: 50000 },
  { id: "battery", name: "Bateria", icon: "battery", intervalKm: 40000 },
];

const HYBRID_MAINTENANCE_ITEMS: MaintenanceItemTemplate[] = [
  { id: "engine-oil", name: "Aceite de Motor", icon: "droplet", intervalKm: 5000 },
  { id: "transmission-oil", name: "Aceite de Caja", icon: "settings", intervalKm: 60000 },
  { id: "air-filter", name: "Filtro de Aire", icon: "wind", intervalKm: 15000 },
  { id: "fuel-filter", name: "Filtro de Gasolina", icon: "filter", intervalKm: 30000 },
  { id: "spark-plugs", name: "Bujias", icon: "zap", intervalKm: 30000 },
  { id: "brake-pads", name: "Frenos: Pastillas", icon: "disc", intervalKm: 40000 },
  { id: "brake-fluid", name: "Frenos: Liquido", icon: "flask", intervalKm: 40000 },
  { id: "tires", name: "Cauchos", icon: "circle", intervalKm: 50000 },
  { id: "battery", name: "Bateria", icon: "battery", intervalKm: 40000 },
  { id: "hybrid-battery", name: "Bateria Hibrida", icon: "battery-charging", intervalKm: 100000 },
];

function getMaintenanceItemsByFuelType(fuelType: FuelType): MaintenanceItemTemplate[] {
  switch (fuelType) {
    case 'diesel':
      return DIESEL_MAINTENANCE_ITEMS;
    case 'gnv':
      return GNV_MAINTENANCE_ITEMS;
    case 'hibrido':
      return HYBRID_MAINTENANCE_ITEMS;
    case 'gasolina':
    default:
      return GASOLINE_MAINTENANCE_ITEMS;
  }
}

// ============================================
// MULTI-VEHICLE SUPPORT (Garaje)
// ============================================

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  oilViscosity: string;
  oilBase: string;
  fuelType: FuelType;
  currentKm: number;
  monthlyKm: number;
  maintenanceItems: MaintenanceItem[];
  faults: Fault[];
  // New fields for improved brand/model selection
  brandSlug?: string;
  modelSlug?: string;
  customModel?: string;
  lubricantBrand?: string;
  customLubricant?: string;
}

function generateVehicleId(): string {
  return `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultMaintenanceItems(
  currentKm: number, 
  fuelType: FuelType = 'gasolina', 
  historyStatus: HistoryStatus = 'known',
  brandSlug?: string,
  modelSlug?: string
): MaintenanceItem[] {
  const items = getMaintenanceItemsByFuelType(fuelType);
  
  // Get model-specific intervals if brand and model are provided
  const modelIntervals = brandSlug && modelSlug 
    ? getAllMaintenanceIntervals(brandSlug, modelSlug) 
    : null;
  
  return items.map((item) => {
    // Use model-specific interval if available, otherwise use fuel-type default
    const intervalKm = modelIntervals && modelIntervals[item.id as MaintenanceItemKey]
      ? modelIntervals[item.id as MaintenanceItemKey]
      : item.intervalKm;
    
    return {
      ...item,
      intervalKm,
      lastServiceKm: currentKm,
      historyStatus,
    };
  });
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveVehicles(vehicles: Vehicle[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  } catch (error) {
    console.error("Error saving vehicles:", error);
  }
}

export async function getSelectedVehicleId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE_ID);
    return value;
  } catch {
    return null;
  }
}

export async function setSelectedVehicleId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE_ID, id);
  } catch (error) {
    console.error("Error setting selected vehicle ID:", error);
  }
}

export async function getSelectedVehicle(): Promise<Vehicle | null> {
  try {
    const selectedId = await getSelectedVehicleId();
    if (!selectedId) return null;
    
    const vehicles = await getVehicles();
    const vehicle = vehicles.find((v) => v.id === selectedId) || null;
    
    // Deduplicate maintenance items if vehicle exists
    if (vehicle && vehicle.maintenanceItems) {
      const seenIds = new Set<string>();
      const deduplicatedItems = vehicle.maintenanceItems.filter((item) => {
        if (seenIds.has(item.id)) {
          return false;
        }
        seenIds.add(item.id);
        return true;
      });
      
      // If duplicates were found, update storage and return clean vehicle
      if (deduplicatedItems.length !== vehicle.maintenanceItems.length) {
        vehicle.maintenanceItems = deduplicatedItems;
        await updateVehicle(vehicle.id, { maintenanceItems: deduplicatedItems });
      }
    }
    
    return vehicle;
  } catch {
    return null;
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  try {
    const vehicles = await getVehicles();
    return vehicles.find((v) => v.id === id) || null;
  } catch {
    return null;
  }
}

export async function addVehicle(
  vehicleData: Omit<Vehicle, "id" | "maintenanceItems" | "faults">
): Promise<Vehicle> {
  const vehicles = await getVehicles();
  
  const newVehicle: Vehicle = {
    ...vehicleData,
    id: generateVehicleId(),
    maintenanceItems: createDefaultMaintenanceItems(
      vehicleData.currentKm, 
      vehicleData.fuelType,
      'known',
      vehicleData.brandSlug,
      vehicleData.modelSlug
    ),
    faults: [],
  };
  
  await saveVehicles([...vehicles, newVehicle]);
  
  // If this is the first vehicle, set it as selected
  if (vehicles.length === 0) {
    await setSelectedVehicleId(newVehicle.id);
  }
  
  return newVehicle;
}

export async function updateVehicle(
  id: string,
  updates: Partial<Omit<Vehicle, "id">>
): Promise<void> {
  try {
    const vehicles = await getVehicles();
    const updatedVehicles = vehicles.map((vehicle) =>
      vehicle.id === id ? { ...vehicle, ...updates } : vehicle
    );
    await saveVehicles(updatedVehicles);
  } catch (error) {
    console.error("Error updating vehicle:", error);
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  try {
    console.log("deleteVehicle called with id:", id);
    const vehicles = await getVehicles();
    console.log("Current vehicles count:", vehicles.length);
    const filteredVehicles = vehicles.filter((v) => v.id !== id);
    console.log("After filter vehicles count:", filteredVehicles.length);
    await saveVehicles(filteredVehicles);
    console.log("Vehicles saved successfully");
    
    // If the deleted vehicle was selected, select the first remaining vehicle
    const selectedId = await getSelectedVehicleId();
    if (selectedId === id && filteredVehicles.length > 0) {
      await setSelectedVehicleId(filteredVehicles[0].id);
      console.log("Selected first remaining vehicle");
    } else if (filteredVehicles.length === 0) {
      // Clear ALL storage flags so WelcomeScreen shows the setup flow
      // and migration doesn't recreate the vehicle from old data
      console.log("Clearing all storage flags for fresh setup");
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_VEHICLE_ID);
      await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SETUP);
      // Clear old legacy keys to prevent migration from recreating vehicle
      await AsyncStorage.removeItem(STORAGE_KEYS.CAR_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.MAINTENANCE_ITEMS);
      await AsyncStorage.removeItem(STORAGE_KEYS.FAULTS);
      console.log("All storage flags and legacy data cleared");
    }
  } catch (error) {
    console.error("Error deleting vehicle:", error);
  }
}

// Vehicle-specific maintenance functions
export async function updateVehicleMaintenanceItem(
  vehicleId: string,
  maintenanceId: string,
  updates: Partial<MaintenanceItem>
): Promise<void> {
  try {
    const vehicles = await getVehicles();
    const updatedVehicles = vehicles.map((vehicle) => {
      if (vehicle.id !== vehicleId) return vehicle;
      
      const updatedItems = vehicle.maintenanceItems.map((item) =>
        item.id === maintenanceId ? { ...item, ...updates } : item
      );
      
      return { ...vehicle, maintenanceItems: updatedItems };
    });
    await saveVehicles(updatedVehicles);
  } catch (error) {
    console.error("Error updating vehicle maintenance item:", error);
  }
}

export async function getVehicleMaintenanceItems(
  vehicleId: string
): Promise<MaintenanceItem[]> {
  const vehicle = await getVehicleById(vehicleId);
  return vehicle?.maintenanceItems || [];
}

// Vehicle-specific fault functions
export async function addVehicleFault(
  vehicleId: string,
  fault: Omit<Fault, "id">
): Promise<void> {
  try {
    const vehicles = await getVehicles();
    const updatedVehicles = vehicles.map((vehicle) => {
      if (vehicle.id !== vehicleId) return vehicle;
      
      const newFault: Fault = {
        ...fault,
        id: Date.now().toString(),
      };
      
      return { ...vehicle, faults: [newFault, ...vehicle.faults] };
    });
    await saveVehicles(updatedVehicles);
  } catch (error) {
    console.error("Error adding vehicle fault:", error);
  }
}

export async function deleteVehicleFault(
  vehicleId: string,
  faultId: string
): Promise<void> {
  try {
    const vehicles = await getVehicles();
    const updatedVehicles = vehicles.map((vehicle) => {
      if (vehicle.id !== vehicleId) return vehicle;
      
      return {
        ...vehicle,
        faults: vehicle.faults.filter((f) => f.id !== faultId),
      };
    });
    await saveVehicles(updatedVehicles);
  } catch (error) {
    console.error("Error deleting vehicle fault:", error);
  }
}

export async function getVehicleFaults(vehicleId: string): Promise<Fault[]> {
  const vehicle = await getVehicleById(vehicleId);
  return vehicle?.faults || [];
}

// Update vehicle mileage
export async function updateVehicleKm(
  vehicleId: string,
  km: number
): Promise<void> {
  try {
    await updateVehicle(vehicleId, { currentKm: km });
  } catch (error) {
    console.error("Error updating vehicle km:", error);
  }
}

// Migration function: Convert old single-car data to multi-vehicle format
export async function migrateToMultiVehicle(): Promise<boolean> {
  try {
    // Check if already migrated (vehicles exist)
    const vehicles = await getVehicles();
    if (vehicles.length > 0) {
      return false; // Already migrated
    }
    
    // Check for old car data
    const oldCarData = await AsyncStorage.getItem(STORAGE_KEYS.CAR_DATA);
    if (!oldCarData) {
      return false; // No old data to migrate
    }
    
    const carData: CarData = JSON.parse(oldCarData);
    
    // Get old maintenance items
    const oldMaintenanceItems = await getMaintenanceItems();
    
    // Deduplicate maintenance items by ID (keep the first occurrence)
    const seenIds = new Set<string>();
    const deduplicatedMaintenanceItems = oldMaintenanceItems.filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    
    // Get old faults
    const oldFaults = await getFaults();
    
    // Create first vehicle from old data (default to gasolina for existing vehicles)
    const firstVehicle: Vehicle = {
      id: generateVehicleId(),
      name: carData.name,
      brand: carData.brand || "",
      model: carData.model || "",
      year: carData.year || new Date().getFullYear(),
      oilViscosity: carData.oilViscosity || "20W-50",
      oilBase: carData.oilBase || "Mineral",
      fuelType: "gasolina",
      currentKm: carData.currentKm,
      monthlyKm: 1200,
      maintenanceItems: deduplicatedMaintenanceItems,
      faults: oldFaults,
    };
    
    // Save as first vehicle
    await saveVehicles([firstVehicle]);
    await setSelectedVehicleId(firstVehicle.id);
    
    // Clean up old keys (optional - keep for safety during transition)
    // await AsyncStorage.removeItem(STORAGE_KEYS.CAR_DATA);
    // await AsyncStorage.removeItem(STORAGE_KEYS.MAINTENANCE_ITEMS);
    // await AsyncStorage.removeItem(STORAGE_KEYS.FAULTS);
    
    console.log("Migration to multi-vehicle completed successfully");
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Check if app needs migration
export async function needsMigration(): Promise<boolean> {
  const vehicles = await getVehicles();
  if (vehicles.length > 0) return false;
  
  const oldCarData = await AsyncStorage.getItem(STORAGE_KEYS.CAR_DATA);
  return oldCarData !== null;
}

// Check if app has any vehicles set up
export async function hasVehicles(): Promise<boolean> {
  const vehicles = await getVehicles();
  return vehicles.length > 0;
}

// Migration: Add fuelType to existing vehicles and regenerate fuel-type-specific maintenance items
export async function migrateVehicleFuelType(): Promise<boolean> {
  try {
    const vehicles = await getVehicles();
    if (vehicles.length === 0) return false;
    
    let needsUpdate = false;
    const updatedVehicles = vehicles.map((vehicle) => {
      let updated = { ...vehicle };
      
      // Add default monthlyKm if not present
      if (!vehicle.monthlyKm) {
        updated.monthlyKm = 1200;
        needsUpdate = true;
      }
      
      // Migrate historyStatus for existing maintenance items
      if (updated.maintenanceItems) {
        const migratedItems = updated.maintenanceItems.map((item) => {
          // If historyStatus is already set, keep it
          if (item.historyStatus) return item;
          
          // For existing vehicles: if lastServiceKm = 0 and vehicle has high mileage, 
          // mark as unknown since we don't know the history
          const isUsedVehicle = vehicle.currentKm > 10000;
          const hasNoHistory = item.lastServiceKm === 0;
          
          if (isUsedVehicle && hasNoHistory) {
            needsUpdate = true;
            return { ...item, historyStatus: 'unknown' as HistoryStatus };
          }
          
          // Otherwise assume history is known
          if (!item.historyStatus) {
            needsUpdate = true;
            return { ...item, historyStatus: 'known' as HistoryStatus };
          }
          
          return item;
        });
        updated.maintenanceItems = migratedItems;
      }
      
      // If vehicle already has fuelType, skip fuel type migration
      if (vehicle.fuelType) return updated;
      
      // Add default fuelType for existing vehicles
      needsUpdate = true;
      const fuelType: FuelType = 'gasolina';
      
      // Generate new fuel-type-specific maintenance items
      const newItems = createDefaultMaintenanceItems(vehicle.currentKm, fuelType);
      
      // Preserve lastServiceKm and historyStatus from existing items where IDs match
      const preservedItems = newItems.map((newItem) => {
        const existingItem = updated.maintenanceItems?.find((old) => old.id === newItem.id);
        if (existingItem) {
          return { 
            ...newItem, 
            lastServiceKm: existingItem.lastServiceKm,
            historyStatus: existingItem.historyStatus || 'known'
          };
        }
        return newItem;
      });
      
      return {
        ...updated,
        fuelType,
        maintenanceItems: preservedItems,
      };
    });
    
    if (needsUpdate) {
      await saveVehicles(updatedVehicles);
      console.log("Migration: Added fuelType/monthlyKm/historyStatus and regenerated maintenance items for existing vehicles");
    }
    
    return needsUpdate;
  } catch (error) {
    console.error("Error migrating vehicle fuel types:", error);
    return false;
  }
}

// Migration: Match existing vehicle brand/model to slugs and update maintenance intervals
export async function migrateVehicleBrandSlug(): Promise<boolean> {
  try {
    const vehicles = await getVehicles();
    if (vehicles.length === 0) return false;
    
    const manufacturers = getManufacturers();
    let needsUpdate = false;
    
    const updatedVehicles = vehicles.map((vehicle) => {
      // Skip if already has brandSlug
      if (vehicle.brandSlug) return vehicle;
      
      // Try to match brand display name to manufacturer slug
      const matchedManufacturer = manufacturers.find(
        (m) => m.name.toLowerCase() === vehicle.brand.toLowerCase()
      );
      
      if (!matchedManufacturer) return vehicle;
      
      needsUpdate = true;
      const brandSlug = matchedManufacturer.slug;
      
      // Try to match model display name to model slug
      const models = getModelsForBrand(brandSlug);
      const matchedModel = models.find(
        (m) => m.name.toLowerCase() === vehicle.model.toLowerCase()
      );
      
      const modelSlug = matchedModel?.slug || undefined;
      
      // Update maintenance intervals based on matched brand/model
      const modelIntervals = modelSlug 
        ? getAllMaintenanceIntervals(brandSlug, modelSlug) 
        : null;
      
      const updatedMaintenanceItems = vehicle.maintenanceItems.map((item) => {
        const intervalKm = modelIntervals && modelIntervals[item.id as MaintenanceItemKey]
          ? modelIntervals[item.id as MaintenanceItemKey]
          : item.intervalKm;
        
        return { ...item, intervalKm };
      });
      
      return {
        ...vehicle,
        brandSlug,
        modelSlug,
        maintenanceItems: updatedMaintenanceItems,
      };
    });
    
    if (needsUpdate) {
      await saveVehicles(updatedVehicles);
      console.log("Migration: Matched vehicle brands/models to slugs and updated maintenance intervals");
    }
    
    return needsUpdate;
  } catch (error) {
    console.error("Error migrating vehicle brand slugs:", error);
    return false;
  }
}

// User registration types and storage
export interface RegistrationLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface UserRegistration {
  userId?: string;
  email: string;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  registrationLocation?: RegistrationLocation;
  registeredAt: string;
}

const USER_REGISTRATION_KEY = "@auto_pana_user_registration";

export async function getUserRegistrationId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_REGISTRATION_ID);
    return value;
  } catch {
    return null;
  }
}

export async function setUserRegistrationId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_REGISTRATION_ID, id);
  } catch (error) {
    console.error("Error saving user registration ID:", error);
  }
}

export async function hasUserRegistration(): Promise<boolean> {
  const id = await getUserRegistrationId();
  return id !== null;
}

export async function getUserRegistration(): Promise<UserRegistration | null> {
  try {
    const data = await AsyncStorage.getItem(USER_REGISTRATION_KEY);
    if (data) {
      return JSON.parse(data) as UserRegistration;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setUserRegistration(registration: UserRegistration): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_REGISTRATION_KEY, JSON.stringify(registration));
    if (registration.userId) {
      await setUserRegistrationId(registration.userId);
    }
  } catch (error) {
    console.error("Error saving user registration:", error);
  }
}

export async function clearUserRegistration(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_REGISTRATION_KEY);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_REGISTRATION_ID);
  } catch (error) {
    console.error("Error clearing user registration:", error);
  }
}

const REGISTRATION_SKIPPED_KEY = "@auto_pana_registration_skipped";

export async function setRegistrationSkipped(skipped: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(REGISTRATION_SKIPPED_KEY, skipped ? "true" : "false");
  } catch (error) {
    console.error("Error saving registration skipped:", error);
  }
}

export async function hasSkippedRegistration(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(REGISTRATION_SKIPPED_KEY);
    return value === "true";
  } catch {
    return false;
  }
}
