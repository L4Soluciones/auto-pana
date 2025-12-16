import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
  Modal,
  FlatList,
  Image,
  Switch,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, CommonActions, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronDown, Check, ArrowLeft, Info, CheckCircle, HelpCircle, Calendar } from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  hasCompletedSetup,
  setCompletedSetup,
  OIL_VISCOSITIES,
  DIESEL_OIL_VISCOSITIES,
  OIL_BASES,
  FUEL_TYPES,
  FuelType,
  addVehicle,
  updateVehicle,
  getVehicleById,
  setSelectedVehicleId,
  hasVehicles,
  migrateToMultiVehicle,
  migrateVehicleFuelType,
  migrateVehicleBrandSlug,
  updateVehicleMaintenanceItem,
  hasUserRegistration,
  hasSkippedRegistration,
} from "@/lib/storage";
import {
  getManufacturers,
  getModelsForBrand,
  getLubricantBrands,
  ManufacturerSpec,
  ModelSpec,
  LubricantBrand,
} from "@/lib/vehicle-specs";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

type WelcomeScreenRouteProp = RouteProp<RootStackParamList, "Welcome">;

interface QuickMaintenanceItem {
  id: string;
  name: string;
  linkedIds: string[];
}

const QUICK_MAINTENANCE_ITEMS: QuickMaintenanceItem[] = [
  { id: "oil", name: "Aceite y filtro de aceite", linkedIds: ["engine-oil"] },
  { id: "filters", name: "Filtros de aire/combustible", linkedIds: ["air-filter", "fuel-filter", "diesel-filter"] },
  { id: "brakes", name: "Frenos y pastillas", linkedIds: ["brake-pads", "brake-fluid"] },
  { id: "coolant", name: "Refrigerante/Anticongelante", linkedIds: ["coolant"] },
  { id: "belts", name: "Correas y cadena", linkedIds: ["timing-belt", "serpentine-belt"] },
  { id: "transmission", name: "Transmision", linkedIds: ["transmission-oil"] },
  { id: "tires", name: "Neumaticos (Cauchos)", linkedIds: ["tires"] },
  { id: "battery", name: "Bateria", linkedIds: ["battery"] },
];

const MONTHS_OPTIONS = [
  { value: 0, label: "Este mes" },
  { value: 1, label: "Hace 1 mes" },
  { value: 2, label: "Hace 2 meses" },
  { value: 3, label: "Hace 3 meses" },
  { value: 4, label: "Hace 4 meses" },
  { value: 5, label: "Hace 5 meses" },
  { value: 6, label: "Hace 6 meses" },
  { value: 9, label: "Hace 9 meses" },
  { value: 12, label: "Hace 1 ano" },
];

type MaintenanceAnswer = "yes" | "new" | "unsure" | null;

function DropdownSelector({
  label,
  value,
  options,
  placeholder,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
}) {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setShowModal(true)}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.backgroundRoot,
            borderColor: value ? Colors.light.primary : theme.border,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.dropdownText,
            { color: value ? theme.text : theme.textSecondary },
          ]}
        >
          {value || placeholder}
        </ThemedText>
        <ChevronDown color={theme.textSecondary} size={20} />
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">{label}</ThemedText>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <ThemedText type="body" style={{ color: Colors.light.primary }}>
                  Cerrar
                </ThemedText>
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setShowModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        value === item
                          ? Colors.light.primary + "20"
                          : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{
                      fontWeight: value === item ? "600" : "400",
                    }}
                  >
                    {item}
                  </ThemedText>
                  {value === item ? (
                    <Check color={Colors.light.primary} size={20} />
                  ) : null}
                </Pressable>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MaintenanceToggle({
  item,
  isEnabled,
  onToggle,
}: {
  item: QuickMaintenanceItem;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.toggleRow,
        { backgroundColor: theme.backgroundDefault },
      ]}
    >
      <View style={styles.toggleLabels}>
        <ThemedText
          type="small"
          style={[styles.toggleLabel, { color: !isEnabled ? Colors.light.alertRed : theme.textSecondary }]}
        >
          No
        </ThemedText>
        <Switch
          value={isEnabled}
          onValueChange={onToggle}
          trackColor={{ false: "#e0e0e0", true: Colors.light.primary + "40" }}
          thumbColor={isEnabled ? Colors.light.primary : "#f4f3f4"}
        />
        <ThemedText
          type="small"
          style={[styles.toggleLabel, { color: isEnabled ? Colors.light.success : theme.textSecondary }]}
        >
          Si
        </ThemedText>
      </View>
      <ThemedText type="body" style={styles.toggleName}>
        {item.name}
      </ThemedText>
    </View>
  );
}

function MonthsSelector({
  item,
  selectedMonths,
  onSelect,
}: {
  item: QuickMaintenanceItem;
  selectedMonths: number;
  onSelect: (months: number) => void;
}) {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  
  const selectedLabel = MONTHS_OPTIONS.find(o => o.value === selectedMonths)?.label || "Selecciona";

  return (
    <View
      style={[
        styles.monthsRow,
        { backgroundColor: theme.backgroundDefault },
      ]}
    >
      <View style={styles.monthsInfo}>
        <ThemedText type="body" style={styles.monthsName}>
          {item.name}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => setShowModal(true)}
        style={[
          styles.monthsDropdown,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Calendar color={Colors.light.primary} size={16} />
        <ThemedText type="small" style={{ color: theme.text, flex: 1 }}>
          {selectedLabel}
        </ThemedText>
        <ChevronDown color={theme.textSecondary} size={16} />
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={{ flex: 1 }}>
                {item.name}
              </ThemedText>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <ThemedText type="body" style={{ color: Colors.light.primary }}>
                  Cerrar
                </ThemedText>
              </Pressable>
            </View>
            <ThemedText
              type="small"
              style={[styles.monthsModalSubtitle, { color: theme.textSecondary }]}
            >
              Hace cuanto tiempo realizaste este mantenimiento?
            </ThemedText>
            <FlatList
              data={MONTHS_OPTIONS}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item: option }) => (
                <Pressable
                  onPress={() => {
                    onSelect(option.value);
                    setShowModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        selectedMonths === option.value
                          ? Colors.light.primary + "20"
                          : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{
                      fontWeight: selectedMonths === option.value ? "600" : "400",
                    }}
                  >
                    {option.label}
                  </ThemedText>
                  {selectedMonths === option.value ? (
                    <Check color={Colors.light.primary} size={20} />
                  ) : null}
                </Pressable>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BrandDropdownSelector({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (slug: string, name: string) => void;
}) {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const manufacturers = getManufacturers();
  const selectedManufacturer = manufacturers.find(m => m.slug === value);

  return (
    <View style={styles.inputGroup}>
      <ThemedText type="small" style={styles.label}>
        Marca
      </ThemedText>
      <Pressable
        onPress={() => setShowModal(true)}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.backgroundRoot,
            borderColor: value ? Colors.light.primary : theme.border,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.dropdownText,
            { color: value ? theme.text : theme.textSecondary },
          ]}
        >
          {selectedManufacturer?.name || "Selecciona"}
        </ThemedText>
        <ChevronDown color={theme.textSecondary} size={20} />
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Marca</ThemedText>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <ThemedText type="body" style={{ color: Colors.light.primary }}>
                  Cerrar
                </ThemedText>
              </Pressable>
            </View>
            <FlatList
              data={manufacturers}
              keyExtractor={(item) => item.slug}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.slug, item.name);
                    setShowModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        value === item.slug
                          ? Colors.light.primary + "20"
                          : "transparent",
                    },
                  ]}
                >
                  <View>
                    <ThemedText
                      type="body"
                      style={{
                        fontWeight: value === item.slug ? "600" : "400",
                      }}
                    >
                      {item.name}
                    </ThemedText>
                    {item.country ? (
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {item.country}
                      </ThemedText>
                    ) : null}
                  </View>
                  {value === item.slug ? (
                    <Check color={Colors.light.primary} size={20} />
                  ) : null}
                </Pressable>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ModelDropdownSelector({
  brandSlug,
  value,
  customValue,
  onSelect,
  onCustomChange,
}: {
  brandSlug: string;
  value: string;
  customValue: string;
  onSelect: (slug: string, name: string) => void;
  onCustomChange: (text: string) => void;
}) {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const models = getModelsForBrand(brandSlug);
  const selectedModel = models.find(m => m.slug === value);
  const isOtherSelected = selectedModel?.isOther === true;

  if (!brandSlug) {
    return (
      <View style={styles.inputGroup}>
        <ThemedText type="small" style={styles.label}>
          Modelo
        </ThemedText>
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.backgroundRoot,
              borderColor: theme.border,
              opacity: 0.6,
            },
          ]}
        >
          <ThemedText
            type="body"
            style={[styles.dropdownText, { color: theme.textSecondary }]}
          >
            Selecciona marca primero
          </ThemedText>
          <ChevronDown color={theme.textSecondary} size={20} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inputGroup}>
      <ThemedText type="small" style={styles.label}>
        Modelo
      </ThemedText>
      <Pressable
        onPress={() => setShowModal(true)}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.backgroundRoot,
            borderColor: value ? Colors.light.primary : theme.border,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.dropdownText,
            { color: value ? theme.text : theme.textSecondary },
          ]}
        >
          {isOtherSelected ? (customValue || "Otro...") : (selectedModel?.name || "Selecciona")}
        </ThemedText>
        <ChevronDown color={theme.textSecondary} size={20} />
      </Pressable>

      {isOtherSelected ? (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundRoot,
              color: theme.text,
              borderColor: customValue ? Colors.light.primary : theme.border,
              marginTop: Spacing.xs,
            },
          ]}
          placeholder="Escribe el modelo..."
          placeholderTextColor={theme.textSecondary}
          value={customValue}
          onChangeText={onCustomChange}
          autoCapitalize="words"
        />
      ) : null}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Modelo</ThemedText>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <ThemedText type="body" style={{ color: Colors.light.primary }}>
                  Cerrar
                </ThemedText>
              </Pressable>
            </View>
            <FlatList
              data={models}
              keyExtractor={(item) => item.slug}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.slug, item.name);
                    setShowModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        value === item.slug
                          ? Colors.light.primary + "20"
                          : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{
                      fontWeight: value === item.slug ? "600" : "400",
                      fontStyle: item.isOther ? "italic" : "normal",
                    }}
                  >
                    {item.name}
                  </ThemedText>
                  {value === item.slug ? (
                    <Check color={Colors.light.primary} size={20} />
                  ) : null}
                </Pressable>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LubricantBrandSelector({
  value,
  customValue,
  onSelect,
  onCustomChange,
}: {
  value: string;
  customValue: string;
  onSelect: (slug: string) => void;
  onCustomChange: (text: string) => void;
}) {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const lubricants = getLubricantBrands();
  const selectedLubricant = lubricants.find(l => l.slug === value);
  const isOtherSelected = selectedLubricant?.isOther === true;

  return (
    <View style={styles.inputGroup}>
      <ThemedText type="small" style={styles.label}>
        Marca de Aceite
      </ThemedText>
      <Pressable
        onPress={() => setShowModal(true)}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.backgroundRoot,
            borderColor: value ? Colors.light.primary : theme.border,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.dropdownText,
            { color: value ? theme.text : theme.textSecondary },
          ]}
        >
          {isOtherSelected ? (customValue || "Otro...") : (selectedLubricant?.name || "Selecciona (opcional)")}
        </ThemedText>
        <ChevronDown color={theme.textSecondary} size={20} />
      </Pressable>

      {isOtherSelected ? (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundRoot,
              color: theme.text,
              borderColor: customValue ? Colors.light.primary : theme.border,
              marginTop: Spacing.xs,
            },
          ]}
          placeholder="Escribe la marca..."
          placeholderTextColor={theme.textSecondary}
          value={customValue}
          onChangeText={onCustomChange}
          autoCapitalize="words"
        />
      ) : null}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Marca de Aceite</ThemedText>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <ThemedText type="body" style={{ color: Colors.light.primary }}>
                  Cerrar
                </ThemedText>
              </Pressable>
            </View>
            <FlatList
              data={lubricants}
              keyExtractor={(item) => item.slug}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.slug);
                    setShowModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        value === item.slug
                          ? Colors.light.primary + "20"
                          : "transparent",
                    },
                  ]}
                >
                  <View>
                    <ThemedText
                      type="body"
                      style={{
                        fontWeight: value === item.slug ? "600" : "400",
                        fontStyle: item.isOther ? "italic" : "normal",
                      }}
                    >
                      {item.name}
                    </ThemedText>
                    {item.country ? (
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {item.country}
                      </ThemedText>
                    ) : null}
                  </View>
                  {value === item.slug ? (
                    <Check color={Colors.light.primary} size={20} />
                  ) : null}
                </Pressable>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const route = useRoute<WelcomeScreenRouteProp>();
  const { theme } = useTheme();
  
  // Step 1: Vehicle Profile
  const [carName, setCarName] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [monthlyKm, setMonthlyKm] = useState("1200");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("gasolina");
  const [oilViscosity, setOilViscosity] = useState("");
  const [oilBase, setOilBase] = useState("");
  
  // New slug-based fields for vehicle-specs
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [lubricantBrand, setLubricantBrand] = useState("");
  const [customLubricant, setCustomLubricant] = useState("");
  
  // Step 2: Maintenance Setup (quick selection)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maintenanceAnswer, setMaintenanceAnswer] = useState<MaintenanceAnswer>(null);
  const [maintenanceToggles, setMaintenanceToggles] = useState<Record<string, boolean>>({});
  
  // Step 3: Months ago for each selected item
  const [maintenanceMonths, setMaintenanceMonths] = useState<Record<string, number>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newVehicleId, setNewVehicleId] = useState<string | null>(null);

  const mode = route.params?.mode || "setup";
  const vehicleId = route.params?.vehicleId;
  const isAddMode = mode === "addVehicle";
  const isEditMode = mode === "editVehicle";

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) =>
    (currentYear - i).toString()
  );

  const selectedItems = QUICK_MAINTENANCE_ITEMS.filter(
    (item) => maintenanceToggles[item.id]
  );

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    if (isAddMode) {
      setIsLoading(false);
      return;
    }

    if (isEditMode && vehicleId) {
      const vehicle = await getVehicleById(vehicleId);
      if (vehicle) {
        setCarName(vehicle.name);
        setCurrentKm(vehicle.currentKm.toString());
        setMonthlyKm((vehicle.monthlyKm || 1200).toString());
        setBrand(vehicle.brand);
        setModel(vehicle.model);
        setYear(vehicle.year.toString());
        setFuelType(vehicle.fuelType || "gasolina");
        setOilViscosity(vehicle.oilViscosity);
        setOilBase(vehicle.oilBase);
        setBrandSlug(vehicle.brandSlug || "");
        setModelSlug(vehicle.modelSlug || "");
        setCustomModel(vehicle.customModel || "");
        setLubricantBrand(vehicle.lubricantBrand || "");
        setCustomLubricant(vehicle.customLubricant || "");
      }
      setIsLoading(false);
      return;
    }

    await migrateToMultiVehicle();
    await migrateVehicleFuelType();
    await migrateVehicleBrandSlug();

    const vehiclesExist = await hasVehicles();
    const completed = await hasCompletedSetup();

    if (vehiclesExist || completed) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        })
      );
    } else {
      setIsLoading(false);
    }
  };

  const handleSaveStep1 = async () => {
    if (!isFormValid) return;

    setIsSaving(true);
    const km = parseInt(currentKm, 10) || 0;
    
    const models = getModelsForBrand(brandSlug);
    const selectedModel = models.find(m => m.slug === modelSlug);
    const finalModel = selectedModel?.isOther ? customModel.trim() : (selectedModel?.name || model.trim());

    if (isEditMode && vehicleId) {
      await updateVehicle(vehicleId, {
        name: carName.trim(),
        currentKm: km,
        monthlyKm: parseInt(monthlyKm, 10) || 1200,
        brand,
        model: finalModel,
        year: parseInt(year, 10),
        fuelType,
        oilViscosity,
        oilBase,
        brandSlug,
        modelSlug,
        customModel: customModel.trim(),
        lubricantBrand,
        customLubricant: customLubricant.trim(),
      });
      navigation.goBack();
    } else {
      const newVehicle = await addVehicle({
        name: carName.trim(),
        currentKm: km,
        monthlyKm: parseInt(monthlyKm, 10) || 1200,
        brand,
        model: finalModel,
        year: parseInt(year, 10),
        fuelType,
        oilViscosity,
        oilBase,
        brandSlug,
        modelSlug,
        customModel: customModel.trim(),
        lubricantBrand,
        customLubricant: customLubricant.trim(),
      });

      await setSelectedVehicleId(newVehicle.id);
      await setCompletedSetup();
      
      setNewVehicleId(newVehicle.id);
      setIsSaving(false);
      setStep(2);
    }
  };

  const handleMaintenanceAnswer = (answer: MaintenanceAnswer) => {
    setMaintenanceAnswer(answer);
    if (answer === "new" || answer === "unsure") {
      setMaintenanceToggles({});
      setMaintenanceMonths({});
    }
  };

  const handleToggleAll = (enabled: boolean) => {
    const newToggles: Record<string, boolean> = {};
    QUICK_MAINTENANCE_ITEMS.forEach(item => {
      newToggles[item.id] = enabled;
    });
    setMaintenanceToggles(newToggles);
    
    if (enabled) {
      const newMonths: Record<string, number> = {};
      QUICK_MAINTENANCE_ITEMS.forEach(item => {
        newMonths[item.id] = 0;
      });
      setMaintenanceMonths(newMonths);
    } else {
      setMaintenanceMonths({});
    }
  };

  const handleContinueToStep3 = () => {
    if (maintenanceAnswer === "yes" && selectedItems.length > 0) {
      const newMonths: Record<string, number> = {};
      selectedItems.forEach(item => {
        newMonths[item.id] = maintenanceMonths[item.id] ?? 0;
      });
      setMaintenanceMonths(newMonths);
      setStep(3);
    } else {
      handleFinishSetup();
    }
  };

  const handleFinishSetup = async () => {
    if (!newVehicleId) return;
    
    setIsSaving(true);

    if (maintenanceAnswer === "yes") {
      const km = parseInt(currentKm, 10) || 0;
      const monthlyAvg = parseInt(monthlyKm, 10) || 1200;
      
      // Get all maintenance item IDs that were selected
      const selectedLinkedIds = new Set<string>();
      for (const quickItem of selectedItems) {
        for (const linkedId of quickItem.linkedIds) {
          selectedLinkedIds.add(linkedId);
        }
      }
      
      // Update selected items with calculated lastServiceKm and mark as known
      for (const quickItem of selectedItems) {
        const monthsAgo = maintenanceMonths[quickItem.id] ?? 0;
        const estimatedKm = Math.max(0, km - (monthsAgo * monthlyAvg));
        
        for (const linkedId of quickItem.linkedIds) {
          await updateVehicleMaintenanceItem(newVehicleId, linkedId, { 
            lastServiceKm: estimatedKm,
            historyStatus: 'known'
          });
        }
      }
      
      // Mark unselected items as unknown (user said they have info but didn't select these)
      const vehicle = await getVehicleById(newVehicleId);
      if (vehicle) {
        for (const item of vehicle.maintenanceItems) {
          if (!selectedLinkedIds.has(item.id)) {
            await updateVehicleMaintenanceItem(newVehicleId, item.id, { 
              historyStatus: 'unknown'
            });
          }
        }
      }
    }

    setIsSaving(false);

    if (isAddMode) {
      navigation.goBack();
    } else {
      // Check if user has already registered or skipped - if not, show registration screen
      const userRegistered = await hasUserRegistration();
      const userSkipped = await hasSkippedRegistration();
      if (!userRegistered && !userSkipped) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "UserRegistration" }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          })
        );
      }
    }
  };

  const handleSkip = async () => {
    if (isAddMode) {
      navigation.goBack();
    } else {
      // Check if user has already registered or skipped - if not, show registration screen
      const userRegistered = await hasUserRegistration();
      const userSkipped = await hasSkippedRegistration();
      if (!userRegistered && !userSkipped) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "UserRegistration" }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          })
        );
      }
    }
  };

  const models = getModelsForBrand(brandSlug);
  const selectedModelSpec = models.find(m => m.slug === modelSlug);
  const isOtherModelSelected = selectedModelSpec?.isOther === true;
  const modelIsValid = modelSlug.length > 0 && (!isOtherModelSelected || customModel.trim().length > 0);

  const isFormValid =
    carName.trim().length > 0 &&
    currentKm.trim().length > 0 &&
    brandSlug.length > 0 &&
    modelIsValid &&
    year.length > 0 &&
    oilViscosity.length > 0 &&
    oilBase.length > 0;

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </ThemedView>
    );
  }

  // Step 3: Specify months ago for each selected maintenance
  if (step === 3) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAwareScrollViewCompat
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing["2xl"],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.step2Header}>
            <Pressable onPress={() => setStep(2)} style={styles.backButton}>
              <ArrowLeft color={theme.text} size={24} />
            </Pressable>
            <ThemedText type="h3" style={styles.step2Title}>
              Detalles del Mantenimiento
            </ThemedText>
            <View style={styles.backButton} />
          </View>

          <View
            style={[
              styles.questionCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.questionHeader}>
              <Calendar color={Colors.light.primary} size={20} />
              <ThemedText type="h4" style={styles.questionTitle}>
                Hace cuanto tiempo realizaste cada mantenimiento?
              </ThemedText>
            </View>
            <ThemedText
              type="small"
              style={[styles.questionSubtitle, { color: theme.textSecondary }]}
            >
              Usaremos tu promedio de {monthlyKm} km/mes para calcular el kilometraje del ultimo servicio.
            </ThemedText>
          </View>

          <View
            style={[
              styles.togglesCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.monthsList}>
              {selectedItems.map((item) => (
                <MonthsSelector
                  key={item.id}
                  item={item}
                  selectedMonths={maintenanceMonths[item.id] ?? 0}
                  onSelect={(months) =>
                    setMaintenanceMonths((prev) => ({ ...prev, [item.id]: months }))
                  }
                />
              ))}
            </View>

            <View style={styles.estimatedKmNote}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Ejemplo: Si seleccionas "Hace 2 meses" para el aceite, calcularemos:
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.light.primary, marginTop: Spacing.xs }}>
                {currentKm} km - (2 x {monthlyKm} km) = {Math.max(0, parseInt(currentKm, 10) - 2 * parseInt(monthlyKm, 10))} km
              </ThemedText>
            </View>
          </View>

          <View style={styles.step2Actions}>
            <Button
              onPress={handleFinishSetup}
              disabled={isSaving}
              style={[
                styles.saveButton,
                { backgroundColor: Colors.light.primary },
              ]}
            >
              {isSaving ? "Guardando..." : "Listo el pollo"}
            </Button>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Saltar este paso
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </ThemedView>
    );
  }

  // Step 2: Quick maintenance selection
  if (step === 2) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing["2xl"],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.step2Header}>
            <Pressable onPress={() => setStep(1)} style={styles.backButton}>
              <ArrowLeft color={theme.text} size={24} />
            </Pressable>
            <ThemedText type="h3" style={styles.step2Title}>
              Configuracion Rapida
            </ThemedText>
            <View style={styles.backButton} />
          </View>

          <View
            style={[
              styles.questionCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.questionHeader}>
              <Info color={theme.textSecondary} size={20} />
              <ThemedText type="h4" style={styles.questionTitle}>
                Has realizado alguno de estos mantenimientos recientemente?
              </ThemedText>
            </View>
            <ThemedText
              type="small"
              style={[styles.questionSubtitle, { color: theme.textSecondary }]}
            >
              Esto nos ayudara a programar las alertas correctamente desde el dia de hoy.
            </ThemedText>

            <View style={styles.answerButtons}>
              <Pressable
                onPress={() => handleMaintenanceAnswer("yes")}
                style={[
                  styles.answerButton,
                  {
                    backgroundColor:
                      maintenanceAnswer === "yes"
                        ? Colors.light.primary
                        : theme.backgroundSecondary,
                  },
                ]}
              >
                <CheckCircle
                  color={maintenanceAnswer === "yes" ? "#000" : theme.textSecondary}
                  size={16}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: maintenanceAnswer === "yes" ? "#000" : theme.text,
                    fontWeight: "600",
                  }}
                >
                  Si, tengo informacion
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleMaintenanceAnswer("new")}
                style={[
                  styles.answerButton,
                  {
                    backgroundColor:
                      maintenanceAnswer === "new"
                        ? Colors.light.primary
                        : theme.backgroundSecondary,
                  },
                ]}
              >
                <Info
                  color={maintenanceAnswer === "new" ? "#000" : theme.textSecondary}
                  size={16}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: maintenanceAnswer === "new" ? "#000" : theme.text,
                    fontWeight: "600",
                  }}
                >
                  No, vehiculo nuevo
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleMaintenanceAnswer("unsure")}
                style={[
                  styles.answerButton,
                  {
                    backgroundColor:
                      maintenanceAnswer === "unsure"
                        ? Colors.light.primary
                        : theme.backgroundSecondary,
                  },
                ]}
              >
                <HelpCircle
                  color={maintenanceAnswer === "unsure" ? "#000" : theme.textSecondary}
                  size={16}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: maintenanceAnswer === "unsure" ? "#000" : theme.text,
                    fontWeight: "600",
                  }}
                >
                  No estoy seguro
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {maintenanceAnswer === "yes" ? (
            <View
              style={[
                styles.togglesCard,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <ThemedText type="small" style={[styles.togglesLabel, { color: theme.textSecondary }]}>
                Acciones rapidas:
              </ThemedText>
              <View style={styles.quickActions}>
                <Pressable
                  onPress={() => handleToggleAll(true)}
                  style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Check color={Colors.light.success} size={14} />
                  <ThemedText type="small" style={{ fontWeight: "500" }}>
                    Seleccionar todo
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => handleToggleAll(false)}
                  style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Limpiar seleccion
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.togglesList}>
                {QUICK_MAINTENANCE_ITEMS.map((item) => (
                  <MaintenanceToggle
                    key={item.id}
                    item={item}
                    isEnabled={maintenanceToggles[item.id] || false}
                    onToggle={(enabled) =>
                      setMaintenanceToggles((prev) => ({ ...prev, [item.id]: enabled }))
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.step2Actions}>
            <Button
              onPress={handleContinueToStep3}
              disabled={isSaving}
              style={[
                styles.saveButton,
                { backgroundColor: Colors.light.primary },
              ]}
            >
              {maintenanceAnswer === "yes" && selectedItems.length > 0
                ? "Continuar"
                : "Listo el pollo"}
            </Button>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Saltar este paso
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Step 1: Vehicle profile form
  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isAddMode || isEditMode ? (
          <View style={styles.addModeHeader}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft color={theme.text} size={24} />
            </Pressable>
            <ThemedText type="h2" style={styles.addModeTitle}>
              {isEditMode ? "Editar Nave" : "Nueva Nave"}
            </ThemedText>
            <View style={styles.backButton} />
          </View>
        ) : (
          <View style={styles.heroSection}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <ThemedText type="h1" style={styles.title}>
              Auto Pana
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Registra los datos de tu nave
            </ThemedText>
          </View>
        )}

        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText type="h4" style={styles.cardTitle}>
            Perfil del Vehiculo
          </ThemedText>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                Nombre de la Nave
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundRoot,
                    color: theme.text,
                    borderColor: carName
                      ? Colors.light.primary
                      : theme.border,
                  },
                ]}
                placeholder="Ej: Mi Corolla, La Bestia..."
                placeholderTextColor={theme.textSecondary}
                value={carName}
                onChangeText={setCarName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <BrandDropdownSelector
                  value={brandSlug}
                  onSelect={(slug, name) => {
                    setBrandSlug(slug);
                    setBrand(name);
                    setModelSlug("");
                    setModel("");
                    setCustomModel("");
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ModelDropdownSelector
                  brandSlug={brandSlug}
                  value={modelSlug}
                  customValue={customModel}
                  onSelect={(slug, name) => {
                    setModelSlug(slug);
                    setModel(name);
                    if (slug !== "other") {
                      setCustomModel("");
                    }
                  }}
                  onCustomChange={setCustomModel}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <DropdownSelector
                  label="Año"
                  value={year}
                  options={yearOptions}
                  placeholder="Selecciona"
                  onSelect={setYear}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText type="small" style={styles.label}>
                  Kilometraje
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundRoot,
                      color: theme.text,
                      borderColor: currentKm
                        ? Colors.light.primary
                        : theme.border,
                    },
                  ]}
                  placeholder="45000"
                  placeholderTextColor={theme.textSecondary}
                  value={currentKm}
                  onChangeText={(text) =>
                    setCurrentKm(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                KM promedio mensual
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundRoot,
                    color: theme.text,
                    borderColor: monthlyKm
                      ? Colors.light.primary
                      : theme.border,
                  },
                ]}
                placeholder="1200"
                placeholderTextColor={theme.textSecondary}
                value={monthlyKm}
                onChangeText={(text) =>
                  setMonthlyKm(text.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
              />
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                Esto ayuda a calcular mantenimientos por tiempo
              </ThemedText>
            </View>

            <View style={styles.sectionDivider}>
              <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Combustible
              </ThemedText>
            </View>

            <DropdownSelector
              label="Tipo de Combustible"
              value={FUEL_TYPES.find(f => f.id === fuelType)?.name || ""}
              options={FUEL_TYPES.map(f => f.name)}
              placeholder="Selecciona"
              onSelect={(name) => {
                const selected = FUEL_TYPES.find(f => f.name === name);
                if (selected) {
                  const wasDiesel = fuelType === "diesel";
                  const isDiesel = selected.id === "diesel";
                  if (wasDiesel !== isDiesel) {
                    setOilViscosity("");
                  }
                  setFuelType(selected.id);
                }
              }}
            />

            <View style={styles.sectionDivider}>
              <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Tipo de Aceite
              </ThemedText>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <DropdownSelector
                  label="Viscosidad"
                  value={oilViscosity}
                  options={fuelType === "diesel" ? DIESEL_OIL_VISCOSITIES : OIL_VISCOSITIES}
                  placeholder={fuelType === "diesel" ? "Ej: Maxidiesel SAE 50" : "Ej: 20W-50"}
                  onSelect={setOilViscosity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <DropdownSelector
                  label="Base"
                  value={oilBase}
                  options={OIL_BASES}
                  placeholder="Selecciona"
                  onSelect={setOilBase}
                />
              </View>
            </View>

            <View style={styles.sectionDivider}>
              <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Marca de Lubricante (opcional)
              </ThemedText>
            </View>

            <LubricantBrandSelector
              value={lubricantBrand}
              customValue={customLubricant}
              onSelect={(slug) => {
                setLubricantBrand(slug);
                if (slug !== "other") {
                  setCustomLubricant("");
                }
              }}
              onCustomChange={setCustomLubricant}
            />
          </View>

          <Button
            onPress={handleSaveStep1}
            disabled={!isFormValid || isSaving}
            style={[
              styles.saveButton,
              {
                backgroundColor: isFormValid
                  ? Colors.light.primary
                  : theme.backgroundSecondary,
              },
            ]}
          >
            {isSaving ? "Guardando..." : isEditMode ? "Guardar Cambios" : "Continuar"}
          </Button>
        </View>

      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  addModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addModeTitle: {
    flex: 1,
    textAlign: "center",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  formSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    borderWidth: 2,
  },
  helperText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  dropdown: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 15,
    flex: 1,
  },
  sectionDivider: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  saveButton: {
    height: Spacing.buttonHeight,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: Spacing.lg,
  },
  footerText: {
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  optionsList: {
    paddingBottom: Spacing.xl,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  step2Header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  step2Title: {
    flex: 1,
    textAlign: "center",
  },
  questionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  questionTitle: {
    flex: 1,
    lineHeight: 22,
  },
  questionSubtitle: {
    marginBottom: Spacing.lg,
  },
  answerButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  answerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  togglesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  togglesLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  togglesList: {
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  toggleLabels: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  toggleName: {
    flex: 1,
  },
  step2Actions: {
    gap: Spacing.md,
    alignItems: "center",
  },
  skipButton: {
    padding: Spacing.sm,
  },
  monthsRow: {
    flexDirection: "column",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  monthsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  monthsName: {
    flex: 1,
    fontWeight: "500",
  },
  monthsDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  monthsModalSubtitle: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  monthsList: {
    gap: Spacing.sm,
  },
  estimatedKmNote: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
});
