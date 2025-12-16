import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import WelcomeScreen from "@/screens/WelcomeScreen";
import UserRegistrationScreen from "@/screens/UserRegistrationScreen";
import PrivacySettingsScreen from "@/screens/PrivacySettingsScreen";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import UpdateMileageScreen from "@/screens/UpdateMileageScreen";
import MaintenanceDetailScreen from "@/screens/MaintenanceDetailScreen";

export type RootStackParamList = {
  Welcome: { mode?: "setup" | "addVehicle" | "editVehicle"; vehicleId?: string } | undefined;
  UserRegistration: undefined;
  PrivacySettings: undefined;
  MainTabs: undefined;
  UpdateMileage: undefined;
  MaintenanceDetail: { itemId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserRegistration"
        component={UserRegistrationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateMileage"
        component={UpdateMileageScreen}
        options={{
          presentation: "modal",
          headerTitle: "Rodando",
        }}
      />
      <Stack.Screen
        name="MaintenanceDetail"
        component={MaintenanceDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "Mantenimiento",
        }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{
          presentation: "modal",
          headerTitle: "Privacidad",
        }}
      />
    </Stack.Navigator>
  );
}
