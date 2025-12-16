import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Droplet,
  Circle,
  Disc,
  AlertTriangle,
  CheckCircle,
  Wrench,
} from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getSelectedVehicle,
  updateVehicleMaintenanceItem,
  getMaintenanceStatus,
  MaintenanceItem,
  Vehicle,
} from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type MaintenanceDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MaintenanceDetail"
>;

type MaintenanceDetailRouteProp = RouteProp<
  RootStackParamList,
  "MaintenanceDetail"
>;

const getIcon = (iconName: string, color: string, size: number = 28) => {
  switch (iconName) {
    case "droplet":
      return <Droplet color={color} size={size} />;
    case "circle":
      return <Circle color={color} size={size} />;
    case "disc":
      return <Disc color={color} size={size} />;
    default:
      return <Circle color={color} size={size} />;
  }
};

type InputMode = 'km' | 'months';

export default function MaintenanceDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<MaintenanceDetailNavigationProp>();
  const route = useRoute<MaintenanceDetailRouteProp>();
  const { theme } = useTheme();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [item, setItem] = useState<MaintenanceItem | null>(null);
  const [newLastServiceKm, setNewLastServiceKm] = useState("");
  const [newIntervalKm, setNewIntervalKm] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>('km');
  const [monthsAgo, setMonthsAgo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const vehicle = await getSelectedVehicle();
    setSelectedVehicle(vehicle);
    
    if (vehicle) {
      const foundItem = vehicle.maintenanceItems.find(
        (i) => i.id === route.params.itemId
      );

      if (foundItem) {
        setItem(foundItem);
        setNewLastServiceKm(foundItem.lastServiceKm.toString());
        setNewIntervalKm(foundItem.intervalKm.toString());
      }
    }
  };

  const currentKm = selectedVehicle?.currentKm || 0;

  const handleMarkAsDone = async () => {
    if (!item || !selectedVehicle) return;

    setIsSaving(true);
    await updateVehicleMaintenanceItem(selectedVehicle.id, item.id, {
      lastServiceKm: currentKm,
    });
    navigation.goBack();
  };

  const calculateKmFromMonths = (months: number): number => {
    const monthlyKm = selectedVehicle?.monthlyKm || 1200;
    const currentKmNow = selectedVehicle?.currentKm || 0;
    return Math.max(0, currentKmNow - (months * monthlyKm));
  };

  const calculateMonthsFromKm = (lastKm: number): number => {
    const monthlyKm = selectedVehicle?.monthlyKm || 1200;
    const currentKmNow = selectedVehicle?.currentKm || 0;
    if (monthlyKm <= 0) return 0;
    return Math.max(0, Math.round((currentKmNow - lastKm) / monthlyKm));
  };

  const handleModeChange = (newMode: InputMode) => {
    if (newMode === inputMode) return;
    
    if (newMode === 'months' && newLastServiceKm.trim().length > 0) {
      const lastKm = parseInt(newLastServiceKm, 10);
      if (!isNaN(lastKm)) {
        const estimatedMonths = calculateMonthsFromKm(lastKm);
        setMonthsAgo(estimatedMonths.toString());
      }
    } else if (newMode === 'km' && monthsAgo.trim().length > 0) {
      const months = parseInt(monthsAgo, 10);
      if (!isNaN(months)) {
        const estimatedKm = calculateKmFromMonths(months);
        setNewLastServiceKm(estimatedKm.toString());
      }
    }
    
    setInputMode(newMode);
  };

  const handleSave = async () => {
    if (!item || !selectedVehicle) return;

    let lastService: number;
    if (inputMode === 'months') {
      const months = parseInt(monthsAgo, 10);
      if (isNaN(months) || months < 0) return;
      lastService = calculateKmFromMonths(months);
    } else {
      lastService = parseInt(newLastServiceKm, 10);
      if (isNaN(lastService)) return;
    }

    const interval = parseInt(newIntervalKm, 10);
    if (isNaN(interval) || interval <= 0) return;

    setIsSaving(true);
    await updateVehicleMaintenanceItem(selectedVehicle.id, item.id, {
      lastServiceKm: lastService,
      intervalKm: interval,
    });
    navigation.goBack();
  };

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const status = getMaintenanceStatus(currentKm, item);

  const getStatusColor = () => {
    switch (status.status) {
      case "critical":
        return Colors.light.alertRed;
      case "warning":
        return Colors.light.warningOrange;
      default:
        return Colors.light.success;
    }
  };

  const getStatusIcon = () => {
    if (status.status === "critical" || status.status === "warning") {
      return <AlertTriangle color="#FFFFFF" size={24} />;
    }
    return <CheckCircle color="#FFFFFF" size={24} />;
  };

  const isLastServiceValid = inputMode === 'km' 
    ? newLastServiceKm.trim().length > 0 
    : monthsAgo.trim().length > 0 && parseInt(monthsAgo, 10) >= 0;

  const isValid =
    isLastServiceValid &&
    newIntervalKm.trim().length > 0 &&
    parseInt(newIntervalKm, 10) > 0;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            {getIcon(item.icon, theme.text)}
          </View>
          <ThemedText type="h2" style={styles.title}>
            {item.name}
          </ThemedText>
          {selectedVehicle ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {selectedVehicle.name}
            </ThemedText>
          ) : null}
        </View>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: getStatusColor() },
          ]}
        >
          <View style={styles.statusHeader}>
            {getStatusIcon()}
            <ThemedText type="h4" style={styles.statusText}>
              {status.statusText}
            </ThemedText>
          </View>

          {status.status === "critical" ? (
            <ThemedText type="body" style={styles.alertMessage}>
              {status.message}
            </ThemedText>
          ) : null}
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.infoRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Kilometraje restante
            </ThemedText>
            <ThemedText type="h4">
              {status.remainingKm.toLocaleString()} km
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Proximo servicio
            </ThemedText>
            <ThemedText type="h4">
              {(item.lastServiceKm + item.intervalKm).toLocaleString()} km
            </ThemedText>
          </View>
        </View>

        {status.status !== "good" ? (
          <Pressable
            onPress={handleMarkAsDone}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.markDoneButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Wrench color="#FFFFFF" size={20} />
            <ThemedText type="body" style={styles.markDoneText}>
              Ya lo cambie
            </ThemedText>
          </Pressable>
        ) : null}

        <View style={styles.formSection}>
          <ThemedText type="h4" style={styles.formTitle}>
            Configuracion
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Ultimo servicio
            </ThemedText>
            <View style={styles.toggleContainer}>
              <Pressable
                onPress={() => handleModeChange('km')}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: inputMode === 'km' 
                      ? Colors.light.primary 
                      : theme.backgroundDefault,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: inputMode === 'km' ? '#000' : theme.text,
                    fontWeight: inputMode === 'km' ? '600' : '400',
                  }}
                >
                  Por KM
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleModeChange('months')}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: inputMode === 'months' 
                      ? Colors.light.primary 
                      : theme.backgroundDefault,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: inputMode === 'months' ? '#000' : theme.text,
                    fontWeight: inputMode === 'months' ? '600' : '400',
                  }}
                >
                  Hace X meses
                </ThemedText>
              </Pressable>
            </View>

            {inputMode === 'km' ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ej: 45000"
                placeholderTextColor={theme.textSecondary}
                value={newLastServiceKm}
                onChangeText={(text) =>
                  setNewLastServiceKm(text.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
              />
            ) : (
              <View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundDefault,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Ej: 3"
                  placeholderTextColor={theme.textSecondary}
                  value={monthsAgo}
                  onChangeText={(text) =>
                    setMonthsAgo(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                />
                {monthsAgo.trim().length > 0 ? (
                  <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                    Estimado: {calculateKmFromMonths(parseInt(monthsAgo, 10) || 0).toLocaleString()} km
                  </ThemedText>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Intervalo (km)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Ej: 5000"
              placeholderTextColor={theme.textSecondary}
              value={newIntervalKm}
              onChangeText={(text) =>
                setNewIntervalKm(text.replace(/[^0-9]/g, ""))
              }
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleSave}
            disabled={!isValid || isSaving}
            style={[
              styles.saveButton,
              {
                backgroundColor: isValid
                  ? Colors.light.primary
                  : theme.backgroundSecondary,
              },
            ]}
          >
            {isSaving ? "Guardando..." : "Listo el pollo"}
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
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
  },
  statusCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  alertMessage: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: Spacing.xs,
  },
  markDoneButton: {
    backgroundColor: Colors.light.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  markDoneText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  formTitle: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: "auto",
  },
  saveButton: {
    height: Spacing.buttonHeight,
  },
});
