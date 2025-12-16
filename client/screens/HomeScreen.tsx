import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Modal,
  Platform,
  Linking,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  Droplet,
  Circle,
  Disc,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Gauge,
  Settings,
  Battery,
  FlaskConical,
  ChevronDown,
  Plus,
  Car,
  Check,
  Pencil,
  Trash2,
  Shield,
  Navigation,
  Play,
  Square,
  MapPin,
} from "lucide-react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  getSelectedVehicle,
  getVehicles,
  setSelectedVehicleId,
  deleteVehicle,
  getMaintenanceStatus,
  getDocuments,
  getExpiringDocuments,
  getDocumentDaysRemaining,
  Vehicle,
  MaintenanceItem,
  Document,
} from "@/lib/storage";
import {
  tripTrackingService,
  TrackingState,
  checkLocationPermission,
  requestLocationPermission,
  setTrackingEnabled,
  getTrackingEnabled,
} from "@/lib/trip-tracking";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getIcon = (iconName: string, color: string, size: number = 22) => {
  switch (iconName) {
    case "droplet":
      return <Droplet color={color} size={size} />;
    case "circle":
      return <Circle color={color} size={size} />;
    case "disc":
      return <Disc color={color} size={size} />;
    case "settings":
      return <Settings color={color} size={size} />;
    case "battery":
      return <Battery color={color} size={size} />;
    case "flask":
      return <FlaskConical color={color} size={size} />;
    default:
      return <Circle color={color} size={size} />;
  }
};

function MaintenanceCard({
  item,
  currentKm,
  onPress,
}: {
  item: MaintenanceItem;
  currentKm: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const status = getMaintenanceStatus(currentKm, item);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getBorderColor = () => {
    switch (status.status) {
      case "critical":
        return Colors.light.alertRed;
      case "warning":
      case "unknown":
        return Colors.light.warningOrange;
      default:
        return "transparent";
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case "critical":
        return Colors.light.alertRed;
      case "warning":
      case "unknown":
        return Colors.light.warningOrange;
      default:
        return Colors.light.success;
    }
  };

  const getStatusIcon = () => {
    if (status.status === "critical" || status.status === "warning" || status.status === "unknown") {
      return <AlertTriangle color={getStatusColor()} size={16} />;
    }
    return <CheckCircle color={getStatusColor()} size={16} />;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.maintenanceCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: getBorderColor(),
          borderWidth: status.status !== "good" && status.status !== "unknown" ? 2 : (status.status === "unknown" ? 1 : 0),
        },
        animatedStyle,
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            {getIcon(item.icon, theme.text)}
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="body" style={styles.itemName}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Cada {item.intervalKm.toLocaleString()} km
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.statusBadge}>
            {getStatusIcon()}
            <ThemedText
              type="small"
              style={[styles.statusText, { color: getStatusColor() }]}
            >
              {status.statusText}
            </ThemedText>
          </View>
          <ChevronRight color={theme.textSecondary} size={18} />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View
          style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getStatusColor(),
                width: `${Math.min(100, Math.max(0, (status.remainingKm / item.intervalKm) * 100))}%`,
              },
            ]}
          />
        </View>
        <ThemedText type="small" style={[styles.remainingText, { color: getStatusColor() }]}>
          {status.status === "unknown"
            ? status.message
            : status.remainingKm > 0
              ? `${status.remainingKm.toLocaleString()} km restantes`
              : status.message}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

function FloatingButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.floatingButton, animatedStyle]}
    >
      <Gauge color="#000000" size={22} />
      <ThemedText type="body" style={styles.floatingButtonText}>
        Rodando
      </ThemedText>
    </AnimatedPressable>
  );
}

function GPSTrackingBanner({
  trackingState,
  accumulatedKm,
  onToggle,
  isEnabled,
  onStartStop,
}: {
  trackingState: TrackingState;
  accumulatedKm: number;
  onToggle: (value: boolean) => void;
  isEnabled: boolean;
  onStartStop: () => void;
}) {
  const { theme } = useTheme();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (trackingState === 'recording') {
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [trackingState, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const getStateInfo = () => {
    switch (trackingState) {
      case 'detecting':
        return { text: 'Detectando...', color: Colors.light.warningOrange };
      case 'recording':
        return { text: 'Grabando', color: Colors.light.success };
      case 'paused':
        return { text: 'Pausado', color: Colors.light.warningOrange };
      default:
        return { text: 'Inactivo', color: theme.textSecondary };
    }
  };

  const stateInfo = getStateInfo();
  const isActive = trackingState !== 'idle';

  return (
    <View style={[styles.trackingBanner, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.trackingHeader}>
        <View style={styles.trackingHeaderLeft}>
          <Navigation color={Colors.light.primary} size={20} />
          <ThemedText type="body" style={styles.trackingTitle}>
            Rodaje Automatico
          </ThemedText>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={onToggle}
          trackColor={{ false: theme.backgroundSecondary, true: Colors.light.primary + '80' }}
          thumbColor={isEnabled ? Colors.light.primary : theme.textSecondary}
        />
      </View>

      {isEnabled ? (
        <View style={styles.trackingContent}>
          <View style={styles.trackingStats}>
            <View style={styles.trackingStatItem}>
              <Animated.View style={[styles.statusDot, { backgroundColor: stateInfo.color }, trackingState === 'recording' ? pulseStyle : undefined]} />
              <ThemedText type="small" style={{ color: stateInfo.color }}>
                {stateInfo.text}
              </ThemedText>
            </View>
            {accumulatedKm > 0 ? (
              <View style={styles.trackingStatItem}>
                <MapPin color={Colors.light.primary} size={14} />
                <ThemedText type="small" style={{ color: Colors.light.primary }}>
                  +{accumulatedKm.toFixed(1)} km
                </ThemedText>
              </View>
            ) : null}
          </View>

          <Pressable
            style={[
              styles.trackingButton,
              { backgroundColor: isActive ? Colors.light.alertRed : Colors.light.success },
            ]}
            onPress={onStartStop}
          >
            {isActive ? (
              <Square color="#fff" size={16} />
            ) : (
              <Play color="#fff" size={16} />
            )}
            <ThemedText type="small" style={styles.trackingButtonText}>
              {isActive ? 'Detener' : 'Iniciar'}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Activa para contar km automaticamente mientras manejas
        </ThemedText>
      )}
    </View>
  );
}

function GPSConsentModal({
  visible,
  onAccept,
  onDecline,
}: {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDecline}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={[styles.consentModalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.consentIconContainer}>
            <Navigation color={Colors.light.primary} size={48} />
          </View>
          <ThemedText type="h3" style={styles.consentTitle}>
            Rodaje Automatico
          </ThemedText>
          <ThemedText type="body" style={[styles.consentText, { color: theme.textSecondary }]}>
            Esta funcion usa el GPS de tu telefono para contar los kilometros mientras manejas. El GPS solo se activa cuando detecta que estas en movimiento.
          </ThemedText>
          <View style={styles.consentFeatures}>
            <View style={styles.consentFeatureItem}>
              <CheckCircle color={Colors.light.success} size={18} />
              <ThemedText type="small" style={{ color: theme.text }}>
                Actualiza los km automaticamente
              </ThemedText>
            </View>
            <View style={styles.consentFeatureItem}>
              <CheckCircle color={Colors.light.success} size={18} />
              <ThemedText type="small" style={{ color: theme.text }}>
                Solo funciona cuando vas manejando
              </ThemedText>
            </View>
            <View style={styles.consentFeatureItem}>
              <CheckCircle color={Colors.light.success} size={18} />
              <ThemedText type="small" style={{ color: theme.text }}>
                Tus datos quedan en tu telefono
              </ThemedText>
            </View>
          </View>
          <View style={styles.consentButtons}>
            <Pressable
              style={[styles.consentButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={onDecline}
            >
              <ThemedText type="body" style={{ fontWeight: '600' }}>Ahora no</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.consentButton, { backgroundColor: Colors.light.primary }]}
              onPress={onAccept}
            >
              <ThemedText type="body" style={{ fontWeight: '600', color: '#000' }}>Activar</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function VehicleSelectorModal({
  visible,
  onClose,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onPrivacySettings,
}: {
  visible: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicle: Vehicle) => void;
  onPrivacySettings: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHandle} />
          <ThemedText type="h3" style={styles.modalTitle}>
            Mi Garaje
          </ThemedText>

          <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
            {vehicles.map((vehicle) => {
              const isSelected = selectedVehicle?.id === vehicle.id;
              return (
                <View key={vehicle.id} style={styles.vehicleItemContainer}>
                  <Pressable
                    style={[
                      styles.vehicleItem,
                      {
                        backgroundColor: isSelected
                          ? Colors.light.primary + "20"
                          : theme.backgroundSecondary,
                        borderColor: isSelected ? Colors.light.primary : "transparent",
                        borderWidth: isSelected ? 2 : 0,
                        flex: 1,
                      },
                    ]}
                    onPress={() => onSelectVehicle(vehicle)}
                  >
                    <View style={styles.vehicleItemLeft}>
                      <View
                        style={[
                          styles.vehicleIcon,
                          { backgroundColor: Colors.light.primary },
                        ]}
                      >
                        <Car color="#000" size={20} />
                      </View>
                      <View style={styles.vehicleItemInfo}>
                        <ThemedText type="body" style={styles.vehicleItemName}>
                          {vehicle.name}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={{ color: theme.textSecondary }}
                        >
                          {vehicle.brand} {vehicle.model} - {vehicle.currentKm.toLocaleString()} km
                        </ThemedText>
                      </View>
                    </View>
                    {isSelected ? (
                      <Check color={Colors.light.primary} size={22} />
                    ) : null}
                  </Pressable>
                  <View style={styles.vehicleActions}>
                    <Pressable
                      style={[styles.vehicleActionButton, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => onEditVehicle(vehicle)}
                    >
                      <Pencil color={theme.text} size={18} />
                    </Pressable>
                    <Pressable
                      style={[styles.vehicleActionButton, { backgroundColor: Colors.light.alertRed + "20" }]}
                      onPress={() => onDeleteVehicle(vehicle)}
                    >
                      <Trash2 color={Colors.light.alertRed} size={18} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            style={[
              styles.addVehicleButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={onAddVehicle}
          >
            <Plus color={Colors.light.primary} size={22} />
            <ThemedText type="body" style={styles.addVehicleText}>
              Agregar otra nave
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.privacyButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={onPrivacySettings}
          >
            <Shield color={theme.textSecondary} size={20} />
            <ThemedText type="body" style={[styles.addVehicleText, { color: theme.textSecondary }]}>
              Privacidad
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const [selectedVehicle, setSelectedVehicleState] = useState<Vehicle | null>(null);
  const [vehicles, setVehiclesState] = useState<Vehicle[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [trackingEnabled, setTrackingEnabledState] = useState(false);
  const [accumulatedKm, setAccumulatedKm] = useState(0);
  const [showGPSConsent, setShowGPSConsent] = useState(false);

  const loadData = async () => {
    const allVehicles = await getVehicles();
    const vehicle = await getSelectedVehicle();
    const docs = await getDocuments();
    const expiring = getExpiringDocuments(docs);
    const isTrackingEnabled = await getTrackingEnabled();
    setVehiclesState(allVehicles);
    setSelectedVehicleState(vehicle);
    setExpiringDocs(expiring);
    setTrackingEnabledState(isTrackingEnabled);
    setTrackingState(tripTrackingService.getState());
    setAccumulatedKm(tripTrackingService.getAccumulatedSessionKm());
  };

  useEffect(() => {
    const unsubscribe = tripTrackingService.addListener((state, km) => {
      setTrackingState(state);
      setAccumulatedKm(km);
    });
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateMileage = () => {
    navigation.navigate("UpdateMileage");
  };

  const handleMaintenancePress = (itemId: string) => {
    navigation.navigate("MaintenanceDetail", { itemId });
  };

  const handleSelectVehicle = async (vehicle: Vehicle) => {
    await setSelectedVehicleId(vehicle.id);
    setSelectedVehicleState(vehicle);
    setShowVehicleSelector(false);
  };

  const handleAddVehicle = () => {
    setShowVehicleSelector(false);
    navigation.navigate("Welcome", { mode: "addVehicle" });
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setShowVehicleSelector(false);
    navigation.navigate("Welcome", { mode: "editVehicle", vehicleId: vehicle.id });
  };

  const handleDeleteVehiclePress = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (vehicleToDelete) {
      console.log("Deleting vehicle:", vehicleToDelete.id, vehicleToDelete.name);
      await deleteVehicle(vehicleToDelete.id);
      console.log("Vehicle deleted successfully");
      setShowDeleteConfirm(false);
      setVehicleToDelete(null);
      
      // If we deleted all vehicles, navigate to welcome screen
      const remainingVehicles = await getVehicles();
      console.log("Remaining vehicles:", remainingVehicles.length);
      if (remainingVehicles.length === 0) {
        console.log("No vehicles left, navigating to Welcome screen");
        setShowVehicleSelector(false);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Welcome", params: { mode: "setup" } }],
          })
        );
      } else {
        console.log("Loading remaining vehicles");
        await loadData();
      }
    }
  };

  const handleTrackingToggle = async (value: boolean) => {
    if (value && !trackingEnabled) {
      setShowGPSConsent(true);
    } else if (!value) {
      await setTrackingEnabled(false);
      setTrackingEnabledState(false);
      if (trackingState !== 'idle') {
        try {
          await tripTrackingService.stop();
        } catch (error) {
          console.error('Error stopping tracking:', error);
        }
        await loadData();
      }
    }
  };

  const handleGPSConsentAccept = async () => {
    setShowGPSConsent(false);
    try {
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          if (Platform.OS !== 'web') {
            try {
              await Linking.openSettings();
            } catch (error) {
              console.error('Could not open settings:', error);
            }
          }
          return;
        }
      }
      await setTrackingEnabled(true);
      setTrackingEnabledState(true);
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const handleGPSConsentDecline = () => {
    setShowGPSConsent(false);
  };

  const handleTrackingStartStop = async () => {
    try {
      if (trackingState === 'idle') {
        const started = await tripTrackingService.start();
        if (!started) {
          const hasPermission = await checkLocationPermission();
          if (!hasPermission) {
            setShowGPSConsent(true);
          }
        }
      } else {
        await tripTrackingService.stop();
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
    }
  };

  const maintenanceItems = selectedVehicle?.maintenanceItems || [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logoSmall}
              resizeMode="contain"
            />
            <ThemedText type="body" style={styles.headerTitle}>
              Auto Pana
            </ThemedText>
          </View>
          {vehicles.length > 0 ? (
            <Pressable
              style={[
                styles.vehicleSelectorButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => setShowVehicleSelector(true)}
            >
              <Car color={theme.text} size={16} />
              <ThemedText type="small" style={styles.vehicleSelectorText} numberOfLines={1}>
                {selectedVehicle?.name || "Seleccionar"}
              </ThemedText>
              <ChevronDown color={theme.textSecondary} size={16} />
            </Pressable>
          ) : null}
        </View>

        {expiringDocs.length > 0 ? (
          <View style={styles.alertBanner}>
            <AlertTriangle color="#000" size={18} />
            <View style={styles.alertContent}>
              <ThemedText type="body" style={styles.alertTitle}>
                Epa! {expiringDocs[0].name === "Certificado Medico" 
                  ? "El Medico" 
                  : expiringDocs[0].name === "Licencia" 
                    ? "La Licencia" 
                    : "El " + expiringDocs[0].name} se te vence pronto!
              </ThemedText>
              <ThemedText type="small" style={styles.alertSubtitle}>
                {(() => {
                  const days = getDocumentDaysRemaining(expiringDocs[0].expirationDate);
                  if (days === null) return "";
                  if (days <= 0) return "Ya vencio!";
                  return `${days} dias restantes`;
                })()}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <ThemedText type="small" style={styles.heroLabel}>
              Mi Nave
            </ThemedText>
            <ThemedText type="h2" style={styles.carName}>
              {selectedVehicle?.name || "Cargando..."}
            </ThemedText>
            {selectedVehicle?.brand ? (
              <ThemedText type="small" style={styles.carDetails}>
                {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.kmDisplay}>
            <ThemedText type="hero" style={styles.kmNumber}>
              {selectedVehicle?.currentKm.toLocaleString() || "0"}
            </ThemedText>
            <ThemedText type="h3" style={styles.kmLabel}>
              km
            </ThemedText>
          </View>
        </View>

        <GPSTrackingBanner
          trackingState={trackingState}
          accumulatedKm={accumulatedKm}
          isEnabled={trackingEnabled}
          onToggle={handleTrackingToggle}
          onStartStop={handleTrackingStartStop}
        />

        <View style={styles.maintenanceSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Mantenimiento
          </ThemedText>
          <View style={styles.maintenanceList}>
            {maintenanceItems.map((item) => (
              <MaintenanceCard
                key={item.id}
                item={item}
                currentKm={selectedVehicle?.currentKm || 0}
                onPress={() => handleMaintenancePress(item.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.brandingFooter}>
          <ThemedText type="small" style={styles.brandingText}>
            APP diseñada por{" "}
          </ThemedText>
          <ThemedText type="small" style={styles.brandingLink}>
            L4Soluciones.com
          </ThemedText>
        </View>
      </ScrollView>

      <View
        style={[
          styles.floatingButtonContainer,
          { bottom: insets.bottom + Spacing.xl },
        ]}
      >
        <FloatingButton onPress={handleUpdateMileage} />
      </View>

      <VehicleSelectorModal
        visible={showVehicleSelector}
        onClose={() => setShowVehicleSelector(false)}
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={handleSelectVehicle}
        onAddVehicle={handleAddVehicle}
        onEditVehicle={handleEditVehicle}
        onDeleteVehicle={handleDeleteVehiclePress}
        onPrivacySettings={() => {
          setShowVehicleSelector(false);
          navigation.navigate("PrivacySettings");
        }}
      />

      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.deleteModalTitle}>
              Eliminar nave?
            </ThemedText>
            <ThemedText type="body" style={[styles.deleteModalText, { color: theme.textSecondary }]}>
              Seguro que quieres eliminar "{vehicleToDelete?.name}"? Esta accion no se puede deshacer.
            </ThemedText>
            <View style={styles.deleteModalButtons}>
              <Pressable
                style={[styles.deleteModalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setVehicleToDelete(null);
                }}
              >
                <ThemedText type="body" style={{ fontWeight: "600" }}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.deleteModalButton, { backgroundColor: Colors.light.alertRed }]}
                onPress={handleConfirmDelete}
              >
                <ThemedText type="body" style={{ fontWeight: "600", color: "#fff" }}>Eliminar</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <GPSConsentModal
        visible={showGPSConsent}
        onAccept={handleGPSConsentAccept}
        onDecline={handleGPSConsentDecline}
      />
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
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoSmall: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontWeight: "700",
  },
  vehicleSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    maxWidth: 160,
  },
  vehicleSelectorText: {
    fontWeight: "600",
    flex: 1,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.light.warningOrange,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: "#000",
    fontWeight: "600",
  },
  alertSubtitle: {
    color: "rgba(0,0,0,0.7)",
  },
  heroCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTop: {
    marginBottom: Spacing.lg,
  },
  heroLabel: {
    color: "rgba(0,0,0,0.6)",
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  carName: {
    color: "#000000",
  },
  carDetails: {
    color: "rgba(0,0,0,0.5)",
    marginTop: Spacing.xs,
  },
  kmDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  kmNumber: {
    color: "#000000",
    letterSpacing: -2,
  },
  kmLabel: {
    color: "rgba(0,0,0,0.6)",
  },
  maintenanceSection: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  maintenanceList: {
    gap: Spacing.md,
  },
  maintenanceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusText: {
    fontWeight: "600",
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  remainingText: {
    fontWeight: "500",
  },
  floatingButtonContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  floatingButton: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingButtonText: {
    color: "#000000",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(128,128,128,0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
  },
  vehicleList: {
    marginBottom: Spacing.lg,
  },
  vehicleItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  vehicleActions: {
    flexDirection: "column",
    gap: Spacing.xs,
  },
  vehicleActionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleItemInfo: {
    flex: 1,
  },
  vehicleItemName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  privacyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  addVehicleText: {
    fontWeight: "600",
    color: Colors.light.primary,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  deleteModalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  deleteModalTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  deleteModalText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  brandingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: "#1a1a1a",
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  brandingText: {
    color: "#888888",
  },
  brandingLink: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  trackingBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  trackingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trackingTitle: {
    fontWeight: "600",
  },
  trackingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  trackingStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  trackingStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  trackingButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  consentModalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  consentIconContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  consentTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  consentText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  consentFeatures: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  consentFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  consentButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  consentButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
