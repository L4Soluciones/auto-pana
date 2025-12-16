# Auto Pana - Car Maintenance Tracker

## Overview

Auto Pana is a React Native mobile app built with Expo for tracking car maintenance. The app uses Venezuelan slang throughout for a friendly, local feel. It helps users track their vehicle's mileage and maintenance schedule with visual alerts.

## App Features

- **Multi-Vehicle Support (Garaje)**: Users can add and manage multiple vehicles with a vehicle selector
- **Welcome/Setup Screen**: First-time users enter their car name and current mileage; supports adding new vehicles
- **Home Dashboard**: Displays selected vehicle name, current KM, and maintenance status with vehicle switcher
- **Maintenance Tracking**: Track Oil (Aceite), Tires (Cauchos), and Brakes (Frenos) per vehicle
- **Smart Alerts**: Visual status changes based on remaining KM until service
- **Local Storage**: All data persisted locally using AsyncStorage with per-vehicle isolation
- **GPS-Based Automatic Mileage Tracking**: Optional feature to track trips via GPS and auto-update vehicle KM

## Venezuelan Slang Used

- "Mi Nave" - My ship/car
- "Rodando" - Rolling/driving (update KM button)
- "Listo el pollo" - Ready/done (save button)
- "Todo Fino" - Everything's fine (good status)
- "Mosca!" - Watch out (warning status)
- "Ponte Pila!" - Wake up/pay attention (critical status)
- "Cambia esa vaina!" - Change that thing (urgent maintenance)

## Color Scheme

- **Primary**: Electric Yellow (#FFD700)
- **Secondary**: Black
- **Background**: White
- **Alert Red**: #DC2626 (for critical maintenance)
- **Warning Orange**: #F59E0B (for warnings)

## Tech Stack

- React Native with Expo SDK
- React Navigation (Stack Navigator)
- AsyncStorage for local data persistence
- lucide-react-native for icons
- react-native-reanimated for animations

## Project Structure

```
client/
├── components/        # Reusable UI components
├── constants/         # Theme, colors, spacing
├── hooks/            # Custom React hooks
├── lib/              # Storage utilities
├── navigation/       # Navigation configuration
└── screens/          # App screens
```

## Screens

1. **WelcomeScreen** - Initial setup for car name and mileage (also supports edit mode)
2. **HomeScreen** - Main dashboard with maintenance cards, document expiry alerts, and vehicle selector with edit/delete
3. **PapelesScreen** - Digital Glovebox for documents (Licencia, Cedula, Certificado Medico, RCV, Impuesto Municipal, Certificado de Saberes)
4. **TallerScreen** - Expense tracker with monthly summary
5. **UpdateMileageScreen** - Modal to update current KM with success modal
6. **MaintenanceDetailScreen** - View/edit maintenance item details

## Vehicle Management

The "Mi Garaje" vehicle selector (accessible from the header) allows:
- **Switch vehicles**: Tap on any vehicle to select it
- **Add vehicle**: "Agregar otra nave" button to add a new vehicle
- **Edit vehicle**: Pencil icon to modify vehicle details (opens WelcomeScreen in edit mode)
- **Delete vehicle**: Trash icon with confirmation dialog to remove a vehicle

## Navigation

Bottom Tab Navigator with 3 tabs:
- **Mi Nave** - Home/Maintenance (HomeScreen)
- **Papeles** - Digital Glovebox (PapelesScreen)
- **El Taller** - Expense Tracker (TallerScreen)

## Running the App

The Expo development server runs on port 8081. Users can scan the QR code in Expo Go to test on their physical device.

## Data Model

### Vehicle (Multi-Vehicle Support)
- `id`: string - Unique vehicle identifier
- `name`: string - Vehicle name
- `brand`: string - Car brand display name (Toyota, Ford, etc.)
- `model`: string - Car model display name (Corolla, Fiesta, etc.)
- `year`: number - Car year
- `fuelType`: FuelType - Fuel type (gasolina, diesel, gnv, hibrido)
- `oilViscosity`: string - Oil viscosity (5W-30, 20W-50, etc.)
- `oilBase`: string - Oil base (Mineral, Semi-sintetico, Sintetico)
- `currentKm`: number - Current mileage
- `monthlyKm`: number - Average monthly KM (default: 1200, used for time-based maintenance calculations)
- `maintenanceItems`: MaintenanceItem[] - Per-vehicle maintenance items (model-specific intervals)
- `faults`: Fault[] - Per-vehicle reported faults
- `brandSlug`: string (optional) - Manufacturer slug for database lookup
- `modelSlug`: string (optional) - Model slug for database lookup
- `customModel`: string (optional) - Custom model name when "Otro" selected
- `lubricantBrand`: string (optional) - Selected lubricant brand slug
- `customLubricant`: string (optional) - Custom lubricant brand name

### Venezuelan Vehicle Database (vehicle-specs.ts)
The app includes a comprehensive database of vehicles popular in Venezuela:

**17 Manufacturers:**
Chevrolet, Toyota, Ford, Hyundai, Kia, Mazda, Mitsubishi, Nissan, Honda, Fiat, Renault, Volkswagen, Jeep, Dodge, Suzuki, Chery, BYD

**150+ Models with specific maintenance intervals:**
- Toyota Corolla, Hilux, Yaris, Fortuner, Prado, Land Cruiser, 4Runner, RAV4, Camry
- Chevrolet Aveo, Spark, Cruze, Optra, Captiva, Silverado, Tahoe, Trailblazer, Luv D-Max
- Ford Fiesta, Focus, Explorer, Ranger, F-150, Expedition, Escape, Fusion, Edge
- And many more...

**Model-Specific Maintenance Intervals:**
- Each model can override default fuel-type intervals
- Example: Toyota Hilux (pickup) has 10,000 km oil change vs 5,000 km default
- Example: Land Cruiser has 100,000 km tires vs 50,000 km default

**Lubricant Brands (Venezuelan market):**
PDV (PDVSA), Venoco, Shell, Mobil 1, Castrol, Valvoline, Pennzoil, Havoline, Total Quartz, Motul, Liqui Moly, Inca, Motorcraft, Roshfrans, Gonher, Gulf, ACDelco, Mopar, UltraLub, Sky, Otro (custom)

### FuelType
- `gasolina`: Standard gasoline vehicles (most common)
- `diesel`: Diesel trucks and SUVs
- `gnv`: GNV (Gas Natural Vehicular) - very popular in Venezuela
- `hibrido`: Hybrid vehicles

### MaintenanceItem
- `id`: string - Unique identifier
- `name`: string - Display name
- `icon`: string - Icon name from lucide
- `lastServiceKm`: number - KM at last service (can be set by KM or calculated from months)
- `intervalKm`: number - Service interval in KM
- `historyStatus`: HistoryStatus - 'known' | 'unknown' - Indicates if user confirmed maintenance history

### HistoryStatus
- `known`: User confirmed this item's maintenance history during setup
- `unknown`: User said they have information BUT didn't select this item (history unknown)

### Maintenance Input Options
Users can set "ultimo servicio" (last service) in two ways:
- **Por KM**: Enter the exact KM when service was performed
- **Hace X meses**: Enter months ago, and the app calculates estimated KM using the vehicle's monthly average (currentKm - months * monthlyKm)

**Maintenance Items by Fuel Type:**

**Gasolina:**
- Aceite de Motor (5,000 km), Aceite de Caja (60,000 km), Filtro de Aire (15,000 km)
- Filtro de Gasolina (30,000 km), Bujias (30,000 km), Frenos: Pastillas/Liquido (40,000 km)
- Cauchos (50,000 km), Bateria (40,000 km)

**Diesel:**
- Aceite de Motor (10,000 km - longer interval), Filtro de Diesel (20,000 km)
- No spark plugs (bujias) for diesel

**GNV (Gas Natural):**
- Same as gasoline plus: Bombona GNV (60,000 km), Valvulas GNV (30,000 km)
- Bujias GNV (20,000 km - shorter interval than regular spark plugs)

**Hibrido:**
- Same as gasoline plus: Bateria Hibrida (100,000 km)

### Fault (Los Ruiditos)
- `id`: string - Unique identifier
- `description`: string - Fault description
- `date`: string - ISO date when reported
- `km`: number - Mileage when fault was reported

## Status Logic

- **Good (>1000 KM remaining)**: "Todo Fino" - Green checkmark
- **Warning (500-1000 KM)**: "Mosca!" - Orange warning
- **Critical (<500 KM or overdue)**: "Ponte Pila!" - Red alert with "Cambia esa vaina!"
- **Unknown (historyStatus = 'unknown')**: "Mosca! - Sin historial" - Orange alert prompting user to add history

## User Analytics System

The app includes an optional user analytics system for advertising value:

### User Registration (Optional)
- **UserRegistrationScreen**: Appears after first vehicle setup (can be skipped)
- Collects email address with validation
- Marketing consent toggle (default: off)
- Analytics consent toggle (default: on)
- Location capture using expo-location with permission flow
- Accessible later via "Privacidad" button in Mi Garaje modal

### PrivacySettingsScreen
- View registered email and location
- Toggle marketing and analytics consent
- Delete registration data option
- Register button for unregistered users

### Database Schema (PostgreSQL)
Tables in `shared/schema.ts`:
- **app_users**: User email, location, consent flags, app metadata
- **user_vehicles**: Synced vehicle data linked to users
- **user_consents**: Normalized current consent state per type
- **consent_events**: Audit log for consent changes (GDPR compliance)

### API Endpoints
- `POST /api/users/register`: Create/update user with consents
- `PATCH /api/users/consent`: Update individual consent preference
- `POST /api/vehicles/sync`: Sync vehicle data to analytics
- `GET /api/users/:userId/vehicles`: Get user's synced vehicles
- `GET /api/users/by-email/:email`: Check registration status

### Storage Utilities
- `hasUserRegistration()`: Check if user is registered
- `hasSkippedRegistration()`: Check if user skipped registration
- `getUserRegistration()`: Get full local registration data
- `setUserRegistration()`: Save registration locally
- `clearUserRegistration()`: Delete local registration

### Privacy Compliance
- All registration is optional - users can skip and still use the app
- Consent toggles sync to server with event logging
- Location only captured with explicit permission
- Local vehicle data stays on device - only synced if registered
