import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";

interface NotificationItemProps {
  notification: any;
  onPress: () => void;
  onMarkRead?: () => void;
}

export default function NotificationItem({
  notification,
  onPress,
  onMarkRead,
}: NotificationItemProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const isUnread = !notification.isRead;
  const type = (notification.type || "SYSTEM").toUpperCase();

  let icon: keyof typeof MaterialCommunityIcons.glyphMap = "bell-outline";
  let iconColor = "#0284C7";
  let iconBg = "rgba(2, 132, 199, 0.12)";

  if (type.includes("REFUND")) {
    icon = "keyboard-return";
    iconColor = "#DC2626";
    iconBg = "rgba(220, 38, 38, 0.12)";
  } else if (type.includes("TICKET")) {
    icon = "ticket-confirmation-outline";
    iconColor = "#2563EB";
    iconBg = "rgba(37, 99, 235, 0.12)";
  } else if (type.includes("BRAND")) {
    icon = "certificate-outline";
    iconColor = "#7C3AED";
    iconBg = "rgba(124, 58, 237, 0.12)";
  } else if (type.includes("WITHDRAWAL")) {
    icon = "cash-fast";
    iconColor = "#D97706";
    iconBg = "rgba(217, 119, 6, 0.12)";
  } else if (type.includes("ORDER") || type.includes("DELIVERY")) {
    icon = "truck-fast-outline";
    iconColor = "#059669";
    iconBg = "rgba(5, 150, 105, 0.12)";
  }

  // Format date relative
  const timeFormatted = React.useMemo(() => {
    if (!notification.createdAt) return "";
    const diff = Math.floor((Date.now() - new Date(notification.createdAt).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }, [notification.createdAt]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: isUnread
            ? isDark
              ? "rgba(2, 132, 199, 0.08)"
              : "#F0F9FF"
            : cardBg,
          borderColor: isUnread ? "#BAE6FD" : border,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={scale(20)} color={iconColor} />
      </View>

      <View style={styles.contentCol}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
            {notification.title || "Staff Alert"}
          </Text>
          <Text style={[styles.timeText, { color: textSecondary }]}>
            {timeFormatted}
          </Text>
        </View>

        <Text style={[styles.bodyText, { color: textSecondary }]} numberOfLines={2}>
          {notification.message || notification.body || ""}
        </Text>

        {notification.vendorName && (
          <View style={styles.vendorPill}>
            <Text style={styles.vendorText}>Store: {notification.vendorName}</Text>
          </View>
        )}
      </View>

      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: moderateScale(8),
    gap: scale(10),
    position: "relative",
  },
  iconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  contentCol: {
    flex: 1,
    gap: moderateScale(3),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    flex: 1,
    marginRight: scale(6),
  },
  timeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "500",
  },
  bodyText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  vendorPill: {
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(1.5),
    borderRadius: scale(4),
    alignSelf: "flex-start",
    marginTop: moderateScale(3),
  },
  vendorText: {
    fontSize: moderateScale(10),
    color: "#0369A1",
    fontWeight: "600",
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#0284C7",
    marginTop: scale(4),
  },
});
