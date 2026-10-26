import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";

export default function StaffAdminOperationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const MODULES = [
    {
      id: "refunds",
      title: "Returns & Refund Claims",
      subtitle: "Vendor-accepted 8-step returns lifecycle, examination & payout notes",
      icon: "keyboard-return" as const,
      iconColor: "#DC2626",
      iconBg: "rgba(220, 38, 38, 0.1)",
      route: "/Screens/staffadminScreens/ReturnsRefundsScreen",
      badge: "8-Step Lifecycle",
    },
    {
      id: "brands",
      title: "Brand Submission Queue",
      subtitle: "Review store brand name, logo, certification docs & permissions",
      icon: "certificate-outline" as const,
      iconColor: "#7C3AED",
      iconBg: "rgba(124, 58, 237, 0.1)",
      route: "/Screens/staffadminScreens/BrandSubmissionsScreen",
      badge: "Verification",
    },
    {
      id: "withdrawals",
      title: "Withdrawal Requests",
      subtitle: "Inspect vendor requested amount, ledger history & escalate to Superadmin",
      icon: "cash-fast" as const,
      iconColor: "#D97706",
      iconBg: "rgba(217, 119, 6, 0.1)",
      route: "/Screens/staffadminScreens/WithdrawalsScreen",
      badge: "Escalation",
    },
    {
      id: "tickets",
      title: "Vendor Support Tickets",
      subtitle: "Communicate directly with store owners, view attachments & replies",
      icon: "ticket-confirmation-outline" as const,
      iconColor: "#2563EB",
      iconBg: "rgba(37, 99, 235, 0.1)",
      route: "/Screens/staffadminScreens/TicketsScreen",
      badge: "Inquiries",
    },
    {
      id: "products",
      title: "Product Moderation",
      subtitle: "Inspect assigned store products, stock status, pricing & approvals",
      icon: "cube-scan" as const,
      iconColor: "#059669",
      iconBg: "rgba(5, 150, 105, 0.1)",
      route: "/Screens/staffadminScreens/ProductsScreen",
      badge: "Inventory",
    },
    {
      id: "orders",
      title: "Orders Tracking & Fulfillment",
      subtitle: "View scoped orders, customer addresses, rider status & live updates",
      icon: "package-variant-closed" as const,
      iconColor: "#0284C7",
      iconBg: "rgba(2, 132, 199, 0.1)",
      route: "/Screens/staffadminScreens/OrdersScreen",
      badge: "Orders",
    },
    {
      id: "broadcasts",
      title: "Vendor Broadcast Notifications",
      subtitle: "Dispatch announcements, alerts & urgent notices with RBAC targeting",
      icon: "bullhorn-outline" as const,
      iconColor: "#0EA5E9",
      iconBg: "rgba(14, 165, 233, 0.1)",
      route: "/Screens/staffadminScreens/BroadcastNotificationScreen",
      badge: "Broadcast",
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Operations Hub"
        subtitle="Staff Admin Review & Queues"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introBox}>
          <Text style={[styles.introTitle, { color: textPrimary }]}>
            Operational Task Workflows
          </Text>
          <Text style={[styles.introDesc, { color: textSecondary }]}>
            All actions and reviews are logged to the platform audit trail and strictly scoped to your assigned stores.
          </Text>
        </View>

        <View style={styles.modulesList}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              activeOpacity={0.7}
              onPress={() => router.push(mod.route as any)}
              style={[styles.moduleCard, { backgroundColor: cardBg, borderColor: border }]}
            >
              <View style={[styles.iconBox, { backgroundColor: mod.iconBg }]}>
                <MaterialCommunityIcons name={mod.icon} size={scale(22)} color={mod.iconColor} />
              </View>

              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>
                    {mod.title}
                  </Text>
                  {mod.badge && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{mod.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
                  {mod.subtitle}
                </Text>
              </View>

              <Feather name="chevron-right" size={scale(18)} color={textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(30),
    gap: moderateScale(14),
  },
  introBox: {
    gap: moderateScale(4),
  },
  introTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  introDesc: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
  },
  modulesList: {
    gap: moderateScale(10),
  },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(14),
    borderRadius: scale(14),
    borderWidth: 1,
    gap: scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: {
    flex: 1,
    gap: moderateScale(3),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: scale(4),
  },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  badgePill: {
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(1.5),
    borderRadius: scale(6),
  },
  badgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#0369A1",
  },
  cardSubtitle: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(15),
  },
});
