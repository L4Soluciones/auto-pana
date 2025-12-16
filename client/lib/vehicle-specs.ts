// Vehicle database for Venezuelan market
// Maintenance intervals in KM based on manufacturer recommendations

export type VehicleCategory = 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'van' | 'coupe' | 'truck' | 'bus';

export interface ModelSpec {
  slug: string;
  name: string;
  category?: VehicleCategory;
  isOther?: boolean;
  maintenanceOverrides?: Partial<Record<MaintenanceItemKey, number>>;
}

export interface ManufacturerSpec {
  slug: string;
  name: string;
  country: string;
  models: ModelSpec[];
  defaultMaintenanceIntervals?: Partial<Record<MaintenanceItemKey, number>>;
}

export type MaintenanceItemKey = 
  | 'engine-oil'
  | 'transmission-oil'
  | 'air-filter'
  | 'fuel-filter'
  | 'spark-plugs'
  | 'brake-pads'
  | 'brake-fluid'
  | 'tires'
  | 'battery'
  | 'coolant'
  | 'timing-belt'
  | 'gnv-tank'
  | 'gnv-valves'
  | 'gnv-spark-plugs'
  | 'hybrid-battery'
  | 'diesel-filter';

export interface LubricantBrand {
  slug: string;
  name: string;
  country: string;
  isOther?: boolean;
}

// Default maintenance intervals (fallback)
export const DEFAULT_MAINTENANCE_INTERVALS: Record<MaintenanceItemKey, number> = {
  'engine-oil': 5000,
  'transmission-oil': 60000,
  'air-filter': 15000,
  'fuel-filter': 30000,
  'spark-plugs': 30000,
  'brake-pads': 40000,
  'brake-fluid': 40000,
  'tires': 50000,
  'battery': 40000,
  'coolant': 60000,
  'timing-belt': 100000,
  'gnv-tank': 60000,
  'gnv-valves': 30000,
  'gnv-spark-plugs': 20000,
  'hybrid-battery': 100000,
  'diesel-filter': 20000,
};

// Lubricant brands popular in Venezuela
export const LUBRICANT_BRANDS: LubricantBrand[] = [
  { slug: 'pdvsa', name: 'PDV (PDVSA)', country: 'Venezuela' },
  { slug: 'venoco', name: 'Venoco', country: 'Venezuela' },
  { slug: 'shell', name: 'Shell', country: 'Internacional' },
  { slug: 'mobil', name: 'Mobil 1', country: 'Internacional' },
  { slug: 'castrol', name: 'Castrol', country: 'Internacional' },
  { slug: 'valvoline', name: 'Valvoline', country: 'Internacional' },
  { slug: 'pennzoil', name: 'Pennzoil', country: 'Internacional' },
  { slug: 'havoline', name: 'Havoline (Texaco)', country: 'Internacional' },
  { slug: 'total', name: 'Total Quartz', country: 'Internacional' },
  { slug: 'motul', name: 'Motul', country: 'Internacional' },
  { slug: 'liquimoly', name: 'Liqui Moly', country: 'Alemania' },
  { slug: 'inca', name: 'Inca', country: 'Venezuela' },
  { slug: 'motorcraft', name: 'Motorcraft', country: 'USA' },
  { slug: 'roshfrans', name: 'Roshfrans', country: 'Mexico' },
  { slug: 'gonher', name: 'Gonher', country: 'Mexico' },
  { slug: 'gulf', name: 'Gulf', country: 'Internacional' },
  { slug: 'acdelco', name: 'ACDelco', country: 'USA' },
  { slug: 'mopar', name: 'Mopar', country: 'USA' },
  { slug: 'ultralub', name: 'UltraLub', country: 'Internacional' },
  { slug: 'sky', name: 'Sky', country: 'Venezuela' },
  { slug: 'other', name: 'Otro', country: '', isOther: true },
];

// Vehicle manufacturers and models popular in Venezuela
export const MANUFACTURERS: ManufacturerSpec[] = [
  {
    slug: 'chevrolet',
    name: 'Chevrolet',
    country: 'USA',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'aveo', name: 'Aveo', category: 'sedan' },
      { slug: 'spark', name: 'Spark', category: 'hatchback' },
      { slug: 'cruze', name: 'Cruze', category: 'sedan' },
      { slug: 'optra', name: 'Optra', category: 'sedan' },
      { slug: 'corsa', name: 'Corsa', category: 'hatchback' },
      { slug: 'sail', name: 'Sail', category: 'sedan' },
      { slug: 'captiva', name: 'Captiva', category: 'suv' },
      { slug: 'tahoe', name: 'Tahoe', category: 'suv', maintenanceOverrides: { 'engine-oil': 8000 } },
      { slug: 'trailblazer', name: 'TrailBlazer', category: 'suv' },
      { slug: 'silverado', name: 'Silverado', category: 'pickup', maintenanceOverrides: { 'engine-oil': 8000 } },
      { slug: 'luv-dmax', name: 'LUV D-Max', category: 'pickup' },
      { slug: 'grand-vitara', name: 'Grand Vitara', category: 'suv' },
      { slug: 'tracker', name: 'Tracker', category: 'suv' },
      { slug: 'orlando', name: 'Orlando', category: 'van' },
      { slug: 'malibu', name: 'Malibu', category: 'sedan' },
      { slug: 'camaro', name: 'Camaro', category: 'coupe' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'toyota',
    name: 'Toyota',
    country: 'Japon',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 80000,
      'timing-belt': 150000,
    },
    models: [
      { slug: 'corolla', name: 'Corolla', category: 'sedan' },
      { slug: 'yaris', name: 'Yaris', category: 'hatchback' },
      { slug: 'camry', name: 'Camry', category: 'sedan' },
      { slug: 'hilux', name: 'Hilux', category: 'pickup', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'fortuner', name: 'Fortuner', category: 'suv' },
      { slug: 'land-cruiser', name: 'Land Cruiser', category: 'suv', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'prado', name: 'Prado', category: 'suv' },
      { slug: 'rav4', name: 'RAV4', category: 'suv' },
      { slug: '4runner', name: '4Runner', category: 'suv', maintenanceOverrides: { 'engine-oil': 8000 } },
      { slug: 'terios', name: 'Terios', category: 'suv' },
      { slug: 'starlet', name: 'Starlet', category: 'hatchback' },
      { slug: 'machito', name: 'Machito', category: 'suv' },
      { slug: 'autana', name: 'Autana', category: 'suv' },
      { slug: 'sienna', name: 'Sienna', category: 'van' },
      { slug: 'tacoma', name: 'Tacoma', category: 'pickup' },
      { slug: 'tundra', name: 'Tundra', category: 'pickup', maintenanceOverrides: { 'engine-oil': 8000 } },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'ford',
    name: 'Ford',
    country: 'USA',
    defaultMaintenanceIntervals: {
      'engine-oil': 8000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'fiesta', name: 'Fiesta', category: 'hatchback', maintenanceOverrides: { 'engine-oil': 5000 } },
      { slug: 'focus', name: 'Focus', category: 'sedan' },
      { slug: 'fusion', name: 'Fusion', category: 'sedan' },
      { slug: 'mustang', name: 'Mustang', category: 'coupe' },
      { slug: 'explorer', name: 'Explorer', category: 'suv' },
      { slug: 'escape', name: 'Escape', category: 'suv' },
      { slug: 'ecosport', name: 'EcoSport', category: 'suv', maintenanceOverrides: { 'engine-oil': 5000 } },
      { slug: 'ranger', name: 'Ranger', category: 'pickup' },
      { slug: 'f-150', name: 'F-150', category: 'pickup', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'f-250', name: 'F-250', category: 'pickup', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'f-350', name: 'F-350', category: 'pickup', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'expedition', name: 'Expedition', category: 'suv' },
      { slug: 'edge', name: 'Edge', category: 'suv' },
      { slug: 'ka', name: 'Ka', category: 'hatchback' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'hyundai',
    name: 'Hyundai',
    country: 'Corea del Sur',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'accent', name: 'Accent', category: 'sedan' },
      { slug: 'elantra', name: 'Elantra', category: 'sedan' },
      { slug: 'sonata', name: 'Sonata', category: 'sedan' },
      { slug: 'tucson', name: 'Tucson', category: 'suv' },
      { slug: 'santa-fe', name: 'Santa Fe', category: 'suv' },
      { slug: 'creta', name: 'Creta', category: 'suv' },
      { slug: 'venue', name: 'Venue', category: 'suv' },
      { slug: 'kona', name: 'Kona', category: 'suv' },
      { slug: 'palisade', name: 'Palisade', category: 'suv' },
      { slug: 'i10', name: 'i10', category: 'hatchback' },
      { slug: 'i20', name: 'i20', category: 'hatchback' },
      { slug: 'i30', name: 'i30', category: 'hatchback' },
      { slug: 'getz', name: 'Getz', category: 'hatchback' },
      { slug: 'grand-i10', name: 'Grand i10', category: 'hatchback' },
      { slug: 'h1', name: 'H1', category: 'van' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'kia',
    name: 'Kia',
    country: 'Corea del Sur',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'rio', name: 'Rio', category: 'sedan' },
      { slug: 'cerato', name: 'Cerato', category: 'sedan' },
      { slug: 'forte', name: 'Forte', category: 'sedan' },
      { slug: 'optima', name: 'Optima', category: 'sedan' },
      { slug: 'sportage', name: 'Sportage', category: 'suv' },
      { slug: 'sorento', name: 'Sorento', category: 'suv' },
      { slug: 'seltos', name: 'Seltos', category: 'suv' },
      { slug: 'soul', name: 'Soul', category: 'hatchback' },
      { slug: 'picanto', name: 'Picanto', category: 'hatchback' },
      { slug: 'carnival', name: 'Carnival', category: 'van' },
      { slug: 'telluride', name: 'Telluride', category: 'suv' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'nissan',
    name: 'Nissan',
    country: 'Japon',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'sentra', name: 'Sentra', category: 'sedan' },
      { slug: 'versa', name: 'Versa', category: 'sedan' },
      { slug: 'altima', name: 'Altima', category: 'sedan' },
      { slug: 'tiida', name: 'Tiida', category: 'hatchback' },
      { slug: 'march', name: 'March', category: 'hatchback' },
      { slug: 'pathfinder', name: 'Pathfinder', category: 'suv' },
      { slug: 'xtrail', name: 'X-Trail', category: 'suv' },
      { slug: 'qashqai', name: 'Qashqai', category: 'suv' },
      { slug: 'murano', name: 'Murano', category: 'suv' },
      { slug: 'kicks', name: 'Kicks', category: 'suv' },
      { slug: 'frontier', name: 'Frontier', category: 'pickup' },
      { slug: 'navara', name: 'Navara', category: 'pickup' },
      { slug: 'patrol', name: 'Patrol', category: 'suv', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'np300', name: 'NP300', category: 'pickup' },
      { slug: 'titan', name: 'Titan', category: 'pickup' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'honda',
    name: 'Honda',
    country: 'Japon',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
      'timing-belt': 160000,
    },
    models: [
      { slug: 'civic', name: 'Civic', category: 'sedan' },
      { slug: 'accord', name: 'Accord', category: 'sedan' },
      { slug: 'city', name: 'City', category: 'sedan' },
      { slug: 'fit', name: 'Fit', category: 'hatchback' },
      { slug: 'crv', name: 'CR-V', category: 'suv' },
      { slug: 'hrv', name: 'HR-V', category: 'suv' },
      { slug: 'pilot', name: 'Pilot', category: 'suv' },
      { slug: 'odyssey', name: 'Odyssey', category: 'van' },
      { slug: 'ridgeline', name: 'Ridgeline', category: 'pickup' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'mazda',
    name: 'Mazda',
    country: 'Japon',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'mazda2', name: 'Mazda 2', category: 'hatchback' },
      { slug: 'mazda3', name: 'Mazda 3', category: 'sedan' },
      { slug: 'mazda6', name: 'Mazda 6', category: 'sedan' },
      { slug: 'cx3', name: 'CX-3', category: 'suv' },
      { slug: 'cx5', name: 'CX-5', category: 'suv' },
      { slug: 'cx9', name: 'CX-9', category: 'suv' },
      { slug: 'bt50', name: 'BT-50', category: 'pickup' },
      { slug: 'allegro', name: 'Allegro', category: 'sedan' },
      { slug: '323', name: '323', category: 'sedan' },
      { slug: '626', name: '626', category: 'sedan' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'mitsubishi',
    name: 'Mitsubishi',
    country: 'Japon',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'lancer', name: 'Lancer', category: 'sedan' },
      { slug: 'mirage', name: 'Mirage', category: 'hatchback' },
      { slug: 'outlander', name: 'Outlander', category: 'suv' },
      { slug: 'montero', name: 'Montero', category: 'suv', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'pajero', name: 'Pajero', category: 'suv', maintenanceOverrides: { 'engine-oil': 10000 } },
      { slug: 'nativa', name: 'Nativa', category: 'suv' },
      { slug: 'asx', name: 'ASX', category: 'suv' },
      { slug: 'l200', name: 'L200', category: 'pickup' },
      { slug: 'triton', name: 'Triton', category: 'pickup' },
      { slug: 'eclipse', name: 'Eclipse Cross', category: 'suv' },
      { slug: 'signo', name: 'Signo', category: 'sedan' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'volkswagen',
    name: 'Volkswagen',
    country: 'Alemania',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'gol', name: 'Gol', category: 'hatchback', maintenanceOverrides: { 'engine-oil': 5000 } },
      { slug: 'polo', name: 'Polo', category: 'hatchback' },
      { slug: 'golf', name: 'Golf', category: 'hatchback' },
      { slug: 'jetta', name: 'Jetta', category: 'sedan' },
      { slug: 'passat', name: 'Passat', category: 'sedan' },
      { slug: 'tiguan', name: 'Tiguan', category: 'suv' },
      { slug: 'touareg', name: 'Touareg', category: 'suv' },
      { slug: 'amarok', name: 'Amarok', category: 'pickup' },
      { slug: 'fox', name: 'Fox', category: 'hatchback' },
      { slug: 'voyage', name: 'Voyage', category: 'sedan' },
      { slug: 'bora', name: 'Bora', category: 'sedan' },
      { slug: 'beetle', name: 'Beetle', category: 'coupe' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'renault',
    name: 'Renault',
    country: 'Francia',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'logan', name: 'Logan', category: 'sedan' },
      { slug: 'sandero', name: 'Sandero', category: 'hatchback' },
      { slug: 'stepway', name: 'Sandero Stepway', category: 'hatchback' },
      { slug: 'duster', name: 'Duster', category: 'suv' },
      { slug: 'captur', name: 'Captur', category: 'suv' },
      { slug: 'koleos', name: 'Koleos', category: 'suv' },
      { slug: 'symbol', name: 'Symbol', category: 'sedan' },
      { slug: 'megane', name: 'Megane', category: 'hatchback' },
      { slug: 'fluence', name: 'Fluence', category: 'sedan' },
      { slug: 'kwid', name: 'Kwid', category: 'hatchback' },
      { slug: 'oroch', name: 'Oroch', category: 'pickup' },
      { slug: 'kangoo', name: 'Kangoo', category: 'van' },
      { slug: 'clio', name: 'Clio', category: 'hatchback' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'fiat',
    name: 'Fiat',
    country: 'Italia',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'uno', name: 'Uno', category: 'hatchback' },
      { slug: 'palio', name: 'Palio', category: 'hatchback' },
      { slug: 'siena', name: 'Siena', category: 'sedan' },
      { slug: 'punto', name: 'Punto', category: 'hatchback' },
      { slug: 'cronos', name: 'Cronos', category: 'sedan' },
      { slug: 'argo', name: 'Argo', category: 'hatchback' },
      { slug: 'mobi', name: 'Mobi', category: 'hatchback' },
      { slug: 'toro', name: 'Toro', category: 'pickup' },
      { slug: 'strada', name: 'Strada', category: 'pickup' },
      { slug: 'ducato', name: 'Ducato', category: 'van' },
      { slug: '500', name: '500', category: 'hatchback' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'jeep',
    name: 'Jeep',
    country: 'USA',
    defaultMaintenanceIntervals: {
      'engine-oil': 8000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'wrangler', name: 'Wrangler', category: 'suv' },
      { slug: 'grand-cherokee', name: 'Grand Cherokee', category: 'suv' },
      { slug: 'cherokee', name: 'Cherokee', category: 'suv' },
      { slug: 'compass', name: 'Compass', category: 'suv' },
      { slug: 'renegade', name: 'Renegade', category: 'suv' },
      { slug: 'liberty', name: 'Liberty', category: 'suv' },
      { slug: 'patriot', name: 'Patriot', category: 'suv' },
      { slug: 'gladiator', name: 'Gladiator', category: 'pickup' },
      { slug: 'cj', name: 'CJ', category: 'suv' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'dodge',
    name: 'Dodge',
    country: 'USA',
    defaultMaintenanceIntervals: {
      'engine-oil': 8000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'charger', name: 'Charger', category: 'sedan' },
      { slug: 'challenger', name: 'Challenger', category: 'coupe' },
      { slug: 'durango', name: 'Durango', category: 'suv' },
      { slug: 'journey', name: 'Journey', category: 'suv' },
      { slug: 'ram', name: 'RAM 1500', category: 'pickup' },
      { slug: 'ram-2500', name: 'RAM 2500', category: 'pickup' },
      { slug: 'ram-3500', name: 'RAM 3500', category: 'pickup' },
      { slug: 'neon', name: 'Neon', category: 'sedan' },
      { slug: 'attitude', name: 'Attitude', category: 'sedan' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'suzuki',
    name: 'Suzuki',
    country: 'Japon',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'swift', name: 'Swift', category: 'hatchback' },
      { slug: 'alto', name: 'Alto', category: 'hatchback' },
      { slug: 'vitara', name: 'Vitara', category: 'suv' },
      { slug: 'grand-vitara', name: 'Grand Vitara', category: 'suv' },
      { slug: 'jimny', name: 'Jimny', category: 'suv' },
      { slug: 'sx4', name: 'SX4', category: 'hatchback' },
      { slug: 'samurai', name: 'Samurai', category: 'suv' },
      { slug: 'ignis', name: 'Ignis', category: 'hatchback' },
      { slug: 'celerio', name: 'Celerio', category: 'hatchback' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'peugeot',
    name: 'Peugeot',
    country: 'Francia',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: '206', name: '206', category: 'hatchback' },
      { slug: '207', name: '207', category: 'hatchback' },
      { slug: '208', name: '208', category: 'hatchback' },
      { slug: '301', name: '301', category: 'sedan' },
      { slug: '307', name: '307', category: 'hatchback' },
      { slug: '308', name: '308', category: 'hatchback' },
      { slug: '408', name: '408', category: 'sedan' },
      { slug: '2008', name: '2008', category: 'suv' },
      { slug: '3008', name: '3008', category: 'suv' },
      { slug: '5008', name: '5008', category: 'suv' },
      { slug: 'partner', name: 'Partner', category: 'van' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'chery',
    name: 'Chery',
    country: 'China',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 50000,
    },
    models: [
      { slug: 'orinoco', name: 'Orinoco', category: 'sedan' },
      { slug: 'arauca', name: 'Arauca', category: 'hatchback' },
      { slug: 'x1', name: 'X1', category: 'hatchback' },
      { slug: 'tiggo', name: 'Tiggo', category: 'suv' },
      { slug: 'tiggo-2', name: 'Tiggo 2', category: 'suv' },
      { slug: 'tiggo-3', name: 'Tiggo 3', category: 'suv' },
      { slug: 'tiggo-4', name: 'Tiggo 4', category: 'suv' },
      { slug: 'tiggo-5', name: 'Tiggo 5', category: 'suv' },
      { slug: 'tiggo-7', name: 'Tiggo 7', category: 'suv' },
      { slug: 'tiggo-8', name: 'Tiggo 8', category: 'suv' },
      { slug: 'qq', name: 'QQ', category: 'hatchback' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'encava',
    name: 'Encava',
    country: 'Venezuela',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 80000,
    },
    models: [
      { slug: 'ent-610', name: 'ENT-610', category: 'bus' },
      { slug: 'ent-900', name: 'ENT-900', category: 'bus' },
      { slug: 'ent-3000', name: 'ENT-3000', category: 'bus' },
      { slug: 'isuzu-ent', name: 'Isuzu ENT', category: 'bus' },
      { slug: 'e-3000', name: 'E-3000', category: 'bus' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'jac',
    name: 'JAC',
    country: 'China',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 's2', name: 'S2', category: 'suv' },
      { slug: 's3', name: 'S3', category: 'suv' },
      { slug: 's4', name: 'S4', category: 'suv' },
      { slug: 's5', name: 'S5', category: 'suv' },
      { slug: 's7', name: 'S7', category: 'suv' },
      { slug: 't6', name: 'T6', category: 'pickup' },
      { slug: 't8', name: 'T8', category: 'pickup' },
      { slug: 'j2', name: 'J2', category: 'hatchback' },
      { slug: 'j3', name: 'J3', category: 'sedan' },
      { slug: 'j4', name: 'J4', category: 'sedan' },
      { slug: 'refine', name: 'Refine', category: 'van' },
      { slug: 'sunray', name: 'Sunray', category: 'van' },
      { slug: 'n-series', name: 'N Series', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'mack',
    name: 'Mack',
    country: 'USA',
    defaultMaintenanceIntervals: {
      'engine-oil': 15000,
      'transmission-oil': 100000,
    },
    models: [
      { slug: 'anthem', name: 'Anthem', category: 'truck' },
      { slug: 'granite', name: 'Granite', category: 'truck' },
      { slug: 'pinnacle', name: 'Pinnacle', category: 'truck' },
      { slug: 'titan', name: 'Titan', category: 'truck' },
      { slug: 'lr', name: 'LR', category: 'truck' },
      { slug: 'md', name: 'MD', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'gm',
    name: 'GM',
    country: 'USA',
    defaultMaintenanceIntervals: {
      'engine-oil': 8000,
      'transmission-oil': 80000,
    },
    models: [
      { slug: 'kodiak', name: 'Kodiak', category: 'truck' },
      { slug: 'topkick', name: 'TopKick', category: 'truck' },
      { slug: 'c4500', name: 'C4500', category: 'truck' },
      { slug: 'c5500', name: 'C5500', category: 'truck' },
      { slug: 'c6500', name: 'C6500', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'volvo',
    name: 'Volvo',
    country: 'Suecia',
    defaultMaintenanceIntervals: {
      'engine-oil': 15000,
      'transmission-oil': 100000,
    },
    models: [
      { slug: 'fh', name: 'FH', category: 'truck' },
      { slug: 'fm', name: 'FM', category: 'truck' },
      { slug: 'fmx', name: 'FMX', category: 'truck' },
      { slug: 'vnl', name: 'VNL', category: 'truck' },
      { slug: 'vnr', name: 'VNR', category: 'truck' },
      { slug: 'xc40', name: 'XC40', category: 'suv' },
      { slug: 'xc60', name: 'XC60', category: 'suv' },
      { slug: 'xc90', name: 'XC90', category: 'suv' },
      { slug: 's60', name: 'S60', category: 'sedan' },
      { slug: 's90', name: 'S90', category: 'sedan' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'iveco',
    name: 'Iveco',
    country: 'Italia',
    defaultMaintenanceIntervals: {
      'engine-oil': 15000,
      'transmission-oil': 80000,
    },
    models: [
      { slug: 'daily', name: 'Daily', category: 'van' },
      { slug: 'eurocargo', name: 'Eurocargo', category: 'truck' },
      { slug: 'trakker', name: 'Trakker', category: 'truck' },
      { slug: 'stralis', name: 'Stralis', category: 'truck' },
      { slug: 's-way', name: 'S-Way', category: 'truck' },
      { slug: 'x-way', name: 'X-Way', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'foton',
    name: 'Foton',
    country: 'China',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'tunland', name: 'Tunland', category: 'pickup' },
      { slug: 'sauvana', name: 'Sauvana', category: 'suv' },
      { slug: 'gratour', name: 'Gratour', category: 'van' },
      { slug: 'view', name: 'View', category: 'van' },
      { slug: 'aumark', name: 'Aumark', category: 'truck' },
      { slug: 'auman', name: 'Auman', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'scania',
    name: 'Scania',
    country: 'Suecia',
    defaultMaintenanceIntervals: {
      'engine-oil': 20000,
      'transmission-oil': 120000,
    },
    models: [
      { slug: 'r-series', name: 'Serie R', category: 'truck' },
      { slug: 's-series', name: 'Serie S', category: 'truck' },
      { slug: 'g-series', name: 'Serie G', category: 'truck' },
      { slug: 'p-series', name: 'Serie P', category: 'truck' },
      { slug: 'l-series', name: 'Serie L', category: 'truck' },
      { slug: 'xt', name: 'XT', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'mercedes-benz',
    name: 'Mercedes-Benz',
    country: 'Alemania',
    defaultMaintenanceIntervals: {
      'engine-oil': 15000,
      'transmission-oil': 80000,
    },
    models: [
      { slug: 'actros', name: 'Actros', category: 'truck' },
      { slug: 'atego', name: 'Atego', category: 'truck' },
      { slug: 'axor', name: 'Axor', category: 'truck' },
      { slug: 'arocs', name: 'Arocs', category: 'truck' },
      { slug: 'sprinter', name: 'Sprinter', category: 'van' },
      { slug: 'vito', name: 'Vito', category: 'van' },
      { slug: 'clase-a', name: 'Clase A', category: 'hatchback' },
      { slug: 'clase-c', name: 'Clase C', category: 'sedan' },
      { slug: 'clase-e', name: 'Clase E', category: 'sedan' },
      { slug: 'clase-s', name: 'Clase S', category: 'sedan' },
      { slug: 'gla', name: 'GLA', category: 'suv' },
      { slug: 'glb', name: 'GLB', category: 'suv' },
      { slug: 'glc', name: 'GLC', category: 'suv' },
      { slug: 'gle', name: 'GLE', category: 'suv' },
      { slug: 'gls', name: 'GLS', category: 'suv' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'daewoo',
    name: 'Daewoo',
    country: 'Corea del Sur',
    defaultMaintenanceIntervals: {
      'engine-oil': 5000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'matiz', name: 'Matiz', category: 'hatchback' },
      { slug: 'lanos', name: 'Lanos', category: 'sedan' },
      { slug: 'nubira', name: 'Nubira', category: 'sedan' },
      { slug: 'leganza', name: 'Leganza', category: 'sedan' },
      { slug: 'cielo', name: 'Cielo', category: 'sedan' },
      { slug: 'espero', name: 'Espero', category: 'sedan' },
      { slug: 'racer', name: 'Racer', category: 'sedan' },
      { slug: 'tico', name: 'Tico', category: 'hatchback' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'dongfeng',
    name: 'Dongfeng',
    country: 'China',
    defaultMaintenanceIntervals: {
      'engine-oil': 10000,
      'transmission-oil': 60000,
    },
    models: [
      { slug: 'ax7', name: 'AX7', category: 'suv' },
      { slug: 'ax4', name: 'AX4', category: 'suv' },
      { slug: 's30', name: 'S30', category: 'sedan' },
      { slug: 'h30', name: 'H30', category: 'hatchback' },
      { slug: 'rich', name: 'Rich', category: 'pickup' },
      { slug: 'dfsk', name: 'DFSK', category: 'van' },
      { slug: 'captain', name: 'Captain', category: 'truck' },
      { slug: 'other', name: 'Otro', isOther: true },
    ],
  },
  {
    slug: 'other',
    name: 'Otra Marca',
    country: '',
    models: [
      { slug: 'other', name: 'Escribir marca y modelo', isOther: true },
    ],
  },
];

// Helper functions
export function getManufacturers(): ManufacturerSpec[] {
  return MANUFACTURERS;
}

export function getManufacturerBySlug(slug: string): ManufacturerSpec | undefined {
  return MANUFACTURERS.find(m => m.slug === slug);
}

export function getModelsForBrand(brandSlug: string): ModelSpec[] {
  const manufacturer = getManufacturerBySlug(brandSlug);
  return manufacturer?.models || [];
}

export function getModelBySlug(brandSlug: string, modelSlug: string): ModelSpec | undefined {
  const models = getModelsForBrand(brandSlug);
  return models.find(m => m.slug === modelSlug);
}

export function getLubricantBrands(): LubricantBrand[] {
  return LUBRICANT_BRANDS;
}

export function getLubricantBySlug(slug: string): LubricantBrand | undefined {
  return LUBRICANT_BRANDS.find(l => l.slug === slug);
}

// Get maintenance interval for a specific item, considering model overrides
export function getMaintenanceInterval(
  brandSlug: string,
  modelSlug: string,
  itemKey: MaintenanceItemKey
): number {
  const manufacturer = getManufacturerBySlug(brandSlug);
  const model = getModelBySlug(brandSlug, modelSlug);
  
  // Priority: model override > manufacturer default > global default
  if (model?.maintenanceOverrides?.[itemKey]) {
    return model.maintenanceOverrides[itemKey]!;
  }
  
  if (manufacturer?.defaultMaintenanceIntervals?.[itemKey]) {
    return manufacturer.defaultMaintenanceIntervals[itemKey]!;
  }
  
  return DEFAULT_MAINTENANCE_INTERVALS[itemKey];
}

// Get all maintenance intervals for a model
export function getAllMaintenanceIntervals(
  brandSlug: string,
  modelSlug: string
): Record<MaintenanceItemKey, number> {
  const result = { ...DEFAULT_MAINTENANCE_INTERVALS };
  
  const manufacturer = getManufacturerBySlug(brandSlug);
  const model = getModelBySlug(brandSlug, modelSlug);
  
  // Apply manufacturer defaults
  if (manufacturer?.defaultMaintenanceIntervals) {
    Object.assign(result, manufacturer.defaultMaintenanceIntervals);
  }
  
  // Apply model overrides
  if (model?.maintenanceOverrides) {
    Object.assign(result, model.maintenanceOverrides);
  }
  
  return result;
}
