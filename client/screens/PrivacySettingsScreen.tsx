import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { Shield, Mail, MapPin, BarChart3, Target, Trash2 } from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getUserRegistration,
  setUserRegistration,
  clearUserRegistration,
  UserRegistration,
} from "@/lib/storage";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type PrivacySettingsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PrivacySettings"
>;

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<PrivacySettingsNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistrationState] = useState<UserRegistration | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    loadRegistration();
  }, []);

  const loadRegistration = async () => {
    try {
      const reg = await getUserRegistration();
      if (reg) {
        setRegistrationState(reg);
        setMarketingConsent(reg.marketingConsent);
        setAnalyticsConsent(reg.analyticsConsent);
      }
    } catch (error) {
      console.error("Error loading registration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsentMutation = useMutation({
    mutationFn: async (data: { userId: string; consentType: string; granted: boolean }) => {
      return apiRequest("PATCH", "/api/users/consent", data);
    },
  });

  const handleMarketingToggle = async (value: boolean) => {
    setMarketingConsent(value);
    if (registration) {
      const updatedReg = { ...registration, marketingConsent: value };
      await setUserRegistration(updatedReg);
      setRegistrationState(updatedReg);
      
      if (registration.userId) {
        updateConsentMutation.mutate({
          userId: registration.userId,
          consentType: "marketing",
          granted: value,
        });
      }
    }
  };

  const handleAnalyticsToggle = async (value: boolean) => {
    setAnalyticsConsent(value);
    if (registration) {
      const updatedReg = { ...registration, analyticsConsent: value };
      await setUserRegistration(updatedReg);
      setRegistrationState(updatedReg);
      
      if (registration.userId) {
        updateConsentMutation.mutate({
          userId: registration.userId,
          consentType: "analytics",
          granted: value,
        });
      }
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Eliminar mis datos",
      "Esta accion eliminara tu registro y preferencias. Tus vehiculos y datos de mantenimiento se mantendran en tu dispositivo. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await clearUserRegistration();
            setRegistrationState(null);
            Alert.alert("Listo", "Tu registro ha sido eliminado");
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRegister = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "UserRegistration",
      })
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Shield size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.title}>Privacidad</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Controla como usamos tu informacion
          </ThemedText>
        </View>

        {registration ? (
          <>
            <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.cardHeader}>
                <Mail size={20} color={theme.primary} />
                <ThemedText style={styles.cardTitle}>Tu cuenta</ThemedText>
              </View>
              <ThemedText style={[styles.cardValue, { color: theme.textSecondary }]}>
                {registration.email}
              </ThemedText>
              {registration.registrationLocation && (
                <View style={styles.locationRow}>
                  <MapPin size={16} color={theme.textSecondary} />
                  <ThemedText style={[styles.locationText, { color: theme.textSecondary }]}>
                    Registrado desde: {registration.registrationLocation.city || "ubicacion guardada"}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.cardHeader}>
                <Target size={20} color={theme.primary} />
                <ThemedText style={styles.cardTitle}>Marketing</ThemedText>
              </View>
              <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
                Recibir ofertas y promociones de productos automotrices
              </ThemedText>
              <View style={styles.toggleRow}>
                <ThemedText>Permitir comunicaciones</ThemedText>
                <Switch
                  value={marketingConsent}
                  onValueChange={handleMarketingToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={isDark ? "#ffffff" : "#ffffff"}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.cardHeader}>
                <BarChart3 size={20} color={theme.primary} />
                <ThemedText style={styles.cardTitle}>Analiticas</ThemedText>
              </View>
              <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
                Ayudanos a mejorar la app compartiendo datos de uso anonimos
              </ThemedText>
              <View style={styles.toggleRow}>
                <ThemedText>Compartir analiticas</ThemedText>
                <Switch
                  value={analyticsConsent}
                  onValueChange={handleAnalyticsToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={isDark ? "#ffffff" : "#ffffff"}
                />
              </View>
            </View>

            <Pressable
              style={[styles.deleteButton, { borderColor: theme.alertRed }]}
              onPress={handleDeleteData}
            >
              <Trash2 size={20} color={theme.alertRed} />
              <ThemedText style={[styles.deleteText, { color: theme.alertRed }]}>
                Eliminar mi registro
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.noRegistrationContainer}>
              <ThemedText style={styles.noRegistrationTitle}>
                No estas registrado
              </ThemedText>
              <ThemedText style={[styles.noRegistrationText, { color: theme.textSecondary }]}>
                Registrate para guardar tus preferencias de privacidad y recibir ofertas personalizadas
              </ThemedText>
              <Button
                onPress={handleRegister}
                style={styles.registerButton}
              >
                Registrarme
              </Button>
            </View>
          </View>
        )}

        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Tus datos de vehiculos y mantenimiento se guardan localmente en tu dispositivo y nunca se comparten sin tu consentimiento.
        </ThemedText>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  locationText: {
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noRegistrationContainer: {
    alignItems: "center",
    padding: Spacing.md,
  },
  noRegistrationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  noRegistrationText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  registerButton: {
    width: "100%",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
