import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Car, FileText, Wrench } from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import HomeScreen from "@/screens/HomeScreen";
import PapelesScreen from "@/screens/PapelesScreen";
import TallerScreen from "@/screens/TallerScreen";

export type MainTabParamList = {
  MiNave: undefined;
  Papeles: undefined;
  ElTaller: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundRoot,
          borderTopColor: theme.border,
          paddingTop: Spacing.sm,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: Spacing.xs,
        },
      }}
    >
      <Tab.Screen
        name="MiNave"
        component={HomeScreen}
        options={{
          tabBarLabel: "Mi Nave",
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Papeles"
        component={PapelesScreen}
        options={{
          tabBarLabel: "Papeles",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ElTaller"
        component={TallerScreen}
        options={{
          tabBarLabel: "El Taller",
          tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
