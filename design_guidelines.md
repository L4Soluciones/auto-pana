# Auto Pana - Design Guidelines

## Overview
A car maintenance tracker with Venezuelan personality, electric energy, and driver-friendly UX. The app helps users track their vehicle's mileage and maintenance schedule with friendly local slang and high-contrast visual alerts.

## Architecture Decisions

### Authentication
**No Auth Required** - Single-user, local-first utility app
- Data stored locally using AsyncStorage
- No login/signup flow needed
- No profile/settings screen required (car name serves as personalization)

### Navigation
**Stack-Only Navigation**
- Linear flow: Welcome/Setup → Home Dashboard
- Stack Navigator handles transitions between screens
- No tab bar or drawer needed
- First-time users see Welcome/Setup screen
- Returning users land directly on Home Dashboard

### Screen Specifications

#### Screen 1: Welcome/Setup (First Launch Only)
**Purpose:** Initial car configuration
**Layout:**
- Transparent header
- Scrollable form content
- Top inset: insets.top + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl

**Components:**
- Input field: "Nombre de la Nave" (Car Name)
- Numeric input: "Kilometraje Actual" (Current Mileage)
- Submit button: "Listo el pollo" (Save)
- Electric yellow accent color for active inputs

#### Screen 2: Home Dashboard (Main Screen)
**Purpose:** Monitor car status and update mileage
**Layout:**
- Custom header with transparent background
- Header includes mascot logo (provided lightning bolt character)
- Header title: "Mi Nave"
- Scrollable main content
- Top inset: headerHeight + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl

**Header Section:**
- Mascot logo at top (use provided attached images)
- Car name display
- Huge, bold text showing current KM

**Floating Action:**
- Prominent yellow button: "Rodando" (Update KM)
- Positioned for easy thumb access
- Shadow specs: offset {width: 0, height: 2}, opacity: 0.10, radius: 2

**Maintenance List:**
- Card-based list for: Oil, Tires, Brakes
- Each card displays:
  - Maintenance item name with lucide icon
  - Last service KM
  - Service interval (e.g., "Every 5000km")
  - Remaining KM until next service
  - Status indicator

**Visual Status Logic:**
- **Good (>500 KM remaining):** "Todo Fino" - Standard card with subtle border
- **Warning (500-250 KM):** "Mosca!" - Yellow accent border, warning icon
- **Critical (<500 KM):** "Ponte Pila!" - RED border, alert icon, text "Cambia esa vaina!"

## Design System

### Color Palette
- **Primary:** Electric Yellow (#FFD700) - High energy, attention-grabbing
- **Secondary:** Black (#000000) - Strong contrast
- **Background:** White (#FFFFFF) - Clean, readable
- **Alert Red:** Bright red for critical maintenance warnings
- **Text Primary:** Black on white backgrounds
- **Text Secondary:** Dark gray for supporting information

### Typography
- **Header/Title:** Bold, large text for car name and current KM
- **Body Text:** Clear, legible font optimized for quick reading
- **Status Text:** Bold weight for "Todo Fino", "Mosca!", "Ponte Pila!"
- Ensure text remains readable in bright daylight (high contrast)

### Visual Design
- **Icons:** Use lucide-react-native for all maintenance items and status indicators
- **No Emojis:** Rely on lucide icons for visual communication
- **Touchable Feedback:** All buttons show clear press states with slight scale or opacity change
- **Floating Button Shadow:** Use exact specs - offset {0, 2}, opacity 0.10, radius 2
- **Card Borders:** Dynamic based on maintenance status (neutral → yellow → red)
- **Mascot Logo:** Display the provided lightning bolt character prominently in header

### Assets
**Critical Assets:**
1. Mascot logo/character (provided lightning bolt images)
   - Use in header of Home Dashboard
   - Represents the energetic, helpful "Pana" personality

**Standard Icons (lucide-react-native):**
- Oil drop icon for oil changes
- Wheel/tire icon for tire maintenance
- Brake pad icon for brake service
- Alert triangle for warnings
- Check circle for "Todo Fino" status

### Interaction Design
- **Button "Rodando":** Tap to open modal/sheet for updating current KM
- **Maintenance Cards:** Tap to view/edit service history and intervals
- **Status Alerts:** Visual only, no intrusive popups
- **Form Validation:** Ensure KM inputs are numeric, non-negative

### Accessibility
- High contrast color scheme (yellow/black on white) aids visibility
- Bold text for critical information (current KM, status warnings)
- Clear visual hierarchy with status-based color coding
- Touch targets sized appropriately for use while parked/at gas stations
- Readable font sizes optimized for quick glances

### Venezuelan Slang Integration
- "Mi Nave" - My ship/car (header title)
- "Rodando" - Rolling/driving (update KM button)
- "Listo el pollo" - Ready/done (save button)
- "Todo Fino" - Everything's fine (good status)
- "Mosca!" - Watch out (warning status)
- "Ponte Pila!" - Wake up/pay attention (critical status)
- "Cambia esa vaina!" - Change that thing (urgent maintenance message)

### Responsive Design
- Support various Android and iOS screen sizes
- Ensure floating "Rodando" button remains accessible on all devices
- Scale card list appropriately for different screen heights
- Maintain readable text sizes across device sizes