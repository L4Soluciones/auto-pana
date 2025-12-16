import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Gauge, TrendingUp, CheckCircle } from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getSelectedVehicle, updateVehicleKm, Vehicle } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type UpdateMileageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UpdateMileage"
>;

export default function UpdateMileageScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<UpdateMileageNavigationProp>();
  const { theme } = useTheme();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [newKm, setNewKm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedKm, setSavedKm] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const vehicle = await getSelectedVehicle();
    setSelectedVehicle(vehicle);
    if (vehicle) {
      setNewKm(vehicle.currentKm.toString());
    }
  };

  const handleSave = async () => {
    if (!selectedVehicle) return;
    
    const km = parseInt(newKm, 10);
    if (isNaN(km) || km < 0) return;

    setIsSaving(true);
    await updateVehicleKm(selectedVehicle.id, km);
    setSavedKm(km);
    setIsSaving(false);
    setShowSuccessModal(true);
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const isValid =
    newKm.trim().length > 0 &&
    parseInt(newKm, 10) >= (selectedVehicle?.currentKm || 0);

  const kmDifference = selectedVehicle
    ? parseInt(newKm || "0", 10) - selectedVehicle.currentKm
    : 0;

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
        <View style={styles.iconSection}>
          <View style={styles.iconBadge}>
            <Gauge color="#000000" size={32} />
          </View>
        </View>

        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Actualizar Kilometraje
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Cuantos km tiene {selectedVehicle?.name || "tu nave"} ahora?
          </ThemedText>
        </View>

        <View
          style={[
            styles.currentCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Kilometraje actual
          </ThemedText>
          <ThemedText type="h2">
            {selectedVehicle?.currentKm.toLocaleString() || "0"} km
          </ThemedText>
        </View>

        <View style={styles.inputSection}>
          <ThemedText type="body" style={styles.label}>
            Nuevo Kilometraje
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: isValid ? Colors.light.primary : theme.border,
              },
            ]}
            placeholder="Ej: 46500"
            placeholderTextColor={theme.textSecondary}
            value={newKm}
            onChangeText={(text) => setNewKm(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            autoFocus
          />

          {kmDifference > 0 ? (
            <View style={styles.differenceContainer}>
              <TrendingUp color={Colors.light.success} size={16} />
              <ThemedText
                type="small"
                style={[styles.differenceText, { color: Colors.light.success }]}
              >
                +{kmDifference.toLocaleString()} km recorridos
              </ThemedText>
            </View>
          ) : kmDifference < 0 ? (
            <ThemedText
              type="small"
              style={[styles.errorText, { color: Colors.light.alertRed }]}
            >
              El kilometraje no puede ser menor al actual
            </ThemedText>
          ) : null}
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

      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleContinue}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.successIcon}>
              <CheckCircle color={Colors.light.success} size={64} />
            </View>

            <ThemedText type="h2" style={styles.successTitle}>
              Listo!
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.successSubtitle, { color: theme.textSecondary }]}
            >
              {selectedVehicle?.name || "Tu nave"} ahora tiene {savedKm.toLocaleString()} km
            </ThemedText>

            <Button onPress={handleContinue} style={styles.continueButton}>
              Continuar
            </Button>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  currentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  inputSection: {
    marginBottom: Spacing["3xl"],
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: 64,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 28,
    fontWeight: "700",
    borderWidth: 2,
    textAlign: "center",
  },
  differenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  differenceText: {
    fontWeight: "600",
  },
  errorText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: "auto",
  },
  saveButton: {
    height: Spacing.buttonHeight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    textAlign: "center",
  },
  continueButton: {
    width: "100%",
    backgroundColor: Colors.light.primary,
    height: Spacing.buttonHeight,
  },
});
