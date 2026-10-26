import React from "react";
import {
  DimensionValue,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  onPress?: () => void;
  width?: DimensionValue;
}

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "#0284C7",
  iconBg = "rgba(2, 132, 199, 0.12)",
  badgeText,
  badgeColor = "#F1F5F9",
  badgeTextColor = "#475569",
  onPress,
  width,
}: DashboardStatCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: border,
          width: width || "100%",
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={scale(20)} color={iconColor} />
        </View>

        {badgeText ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.contentCol}>
        <Text style={[styles.valueText, { color: textPrimary }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.titleText, { color: textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitleText, { color: textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: scale(14),
    padding: scale(12),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  iconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: scale(7),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  contentCol: {
    gap: moderateScale(2),
  },
  valueText: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  titleText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  subtitleText: {
    fontSize: moderateScale(10.5),
    fontWeight: "400",
    marginTop: moderateScale(1),
  },
});
