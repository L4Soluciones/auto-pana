import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface AdBannerProps {
  variant?: "footer" | "interstitial";
}

export function AdBanner({ variant = "footer" }: AdBannerProps) {
  const { theme } = useTheme();

  if (variant === "interstitial") {
    return (
      <View
        style={[
          styles.interstitialContainer,
          { backgroundColor: "#1a1a1a" },
        ]}
      >
        <ThemedText type="small" style={[styles.sponsorText, { color: "#888888" }]}>
          APP diseñada por
        </ThemedText>
        <ThemedText type="h4" style={[styles.sponsorName, { color: Colors.light.primary }]}>
          L4Soluciones.com
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.footerContainer,
        { backgroundColor: "#1a1a1a" },
      ]}
    >
      <View style={styles.footerRow}>
        <ThemedText type="small" style={[styles.footerText, { color: "#888888" }]}>
          APP diseñada por{" "}
        </ThemedText>
        <ThemedText type="small" style={[styles.footerSponsor, { color: Colors.light.primary }]}>
          L4Soluciones.com
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {},
  footerSponsor: {
    fontWeight: "600",
  },
  interstitialContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  sponsorText: {
    marginBottom: Spacing.xs,
  },
  sponsorName: {
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  adText: {
    textAlign: "center",
  },
});
