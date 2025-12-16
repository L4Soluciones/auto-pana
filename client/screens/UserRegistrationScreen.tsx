import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Switch,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { MapPin, Mail, Bell, BarChart3, X } from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { getVehicles, setUserRegistration, setRegistrationSkipped, UserRegistration } from "@/lib/storage";
import Constants from "expo-constants";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "UserRegistration">;

export default function UserRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [locationConsent, setLocationConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
  } | null>(null);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const requestLocationPermission = async () => {
    setLocationStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationStatus("granted");
        setLocationConsent(true);
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        let city, state, country;
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (address) {
            city = address.city || address.subregion || undefined;
            state = address.region || undefined;
            country = address.country || undefined;
          }
        } catch {
          // Ignore reverse geocoding errors
        }
        
        setLocationData({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city,
          state,
          country,
        });
      } else {
        setLocationStatus("denied");
        setLocationConsent(false);
      }
    } catch {
      setLocationStatus("denied");
      setLocationConsent(false);
    }
  };

  const handleSkip = async () => {
    await setRegistrationSkipped(true);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      })
    );
  };

  const handleRegister = async () => {
    if (!email.trim()) {
      setEmailError("Ingresa tu correo");
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setEmailError("Correo invalido");
      return;
    }
    
    setEmailError("");
    setIsLoading(true);
    
    try {
      const url = new URL("/api/users/register", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          marketingConsent,
          analyticsConsent,
          locationConsent,
          latitude: locationData?.latitude,
          longitude: locationData?.longitude,
          city: locationData?.city,
          state: locationData?.state,
          country: locationData?.country,
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || "1.0.0",
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.user?.id) {
        // Save full registration data locally
        const registration: UserRegistration = {
          userId: data.user.id,
          email: email.trim().toLowerCase(),
          marketingConsent,
          analyticsConsent,
          registrationLocation: locationData ? {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            city: locationData.city,
            state: locationData.state,
            country: locationData.country,
          } : undefined,
          registeredAt: new Date().toISOString(),
        };
        await setUserRegistration(registration);
        
        // Sync vehicles to backend
        const vehicles = await getVehicles();
        for (const vehicle of vehicles) {
          try {
            const vehicleUrl = new URL("/api/vehicles/sync", getApiUrl());
            await fetch(vehicleUrl.toString(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: data.user.id,
                localVehicleId: vehicle.id,
                brandSlug: vehicle.brandSlug,
                brandName: vehicle.brand,
                modelSlug: vehicle.modelSlug,
                modelName: vehicle.model,
                customModel: vehicle.customModel,
                year: vehicle.year,
                fuelType: vehicle.fuelType,
                oilViscosity: vehicle.oilViscosity,
                oilBase: vehicle.oilBase,
                lubricantBrand: vehicle.lubricantBrand,
                customLubricant: vehicle.customLubricant,
                currentKm: vehicle.currentKm,
                monthlyKm: vehicle.monthlyKm,
              }),
            });
          } catch {
            // Ignore individual vehicle sync errors
          }
        }
      }
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        })
      );
    } catch {
      // On error, still navigate but don't save registration
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <X color={theme.textSecondary} size={24} />
        </Pressable>

        <View style={styles.header}>
          <ThemedText type="h1" style={styles.title}>
            Unete a Auto Pana
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Registrate para recibir ofertas exclusivas de talleres, lubricantes y repuestos en tu zona
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Mail color={theme.text} size={18} />
              <ThemedText type="small" style={styles.label}>
                Correo electronico
              </ThemedText>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundRoot,
                  borderColor: emailError ? Colors.light.alertRed : theme.border,
                  color: theme.text,
                },
              ]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <ThemedText type="small" style={{ color: Colors.light.alertRed }}>
                {emailError}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.consentSection}>
            <View style={styles.labelRow}>
              <MapPin color={theme.text} size={18} />
              <ThemedText type="small" style={styles.label}>
                Ubicacion
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
              Permite acceso a tu ubicacion para recibir ofertas de talleres y tiendas cercanas
            </ThemedText>
            {locationStatus === "idle" ? (
              <Button
                onPress={requestLocationPermission}
                style={{ marginBottom: Spacing.sm }}
              >
                Permitir ubicacion
              </Button>
            ) : locationStatus === "loading" ? (
              <View style={styles.locationStatus}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                  Obteniendo ubicacion...
                </ThemedText>
              </View>
            ) : locationStatus === "granted" ? (
              <View style={styles.locationStatus}>
                <MapPin color={Colors.light.success} size={16} />
                <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: Colors.light.success }}>
                  {locationData?.city || locationData?.state || "Ubicacion obtenida"}
                  {locationData?.state && locationData?.city ? `, ${locationData.state}` : ""}
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="small" style={{ color: Colors.light.warningOrange }}>
                Ubicacion denegada - puedes cambiar esto en configuracion
              </ThemedText>
            )}
          </View>

          <View style={[styles.consentRow, { borderColor: theme.border }]}>
            <View style={styles.consentInfo}>
              <View style={styles.labelRow}>
                <Bell color={theme.text} size={18} />
                <ThemedText type="body" style={styles.consentLabel}>
                  Ofertas y promociones
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Recibe ofertas de talleres, lubricantes y repuestos por correo
              </ThemedText>
            </View>
            <Switch
              value={marketingConsent}
              onValueChange={setMarketingConsent}
              trackColor={{ false: theme.border, true: Colors.light.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.consentRow, { borderColor: theme.border }]}>
            <View style={styles.consentInfo}>
              <View style={styles.labelRow}>
                <BarChart3 color={theme.text} size={18} />
                <ThemedText type="body" style={styles.consentLabel}>
                  Mejorar Auto Pana
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Comparte datos anonimos para mejorar la app
              </ThemedText>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={setAnalyticsConsent}
              trackColor={{ false: theme.border, true: Colors.light.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            onPress={handleRegister}
            disabled={isLoading}
            style={{ marginBottom: Spacing.md }}
          >
            {isLoading ? "Registrando..." : "Listo el pollo"}
          </Button>
          <Pressable onPress={handleSkip}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Saltar por ahora
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="small" style={[styles.privacy, { color: theme.textSecondary }]}>
          Al registrarte aceptas nuestra politica de privacidad. Tu informacion esta segura y nunca sera compartida sin tu permiso.
        </ThemedText>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  skipButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  form: {
    flex: 1,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  label: {
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  consentSection: {
    marginBottom: Spacing.sm,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  consentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  consentLabel: {
    fontWeight: "600",
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xl,
  },
  privacy: {
    marginTop: Spacing.lg,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
  },
});
