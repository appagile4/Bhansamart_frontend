import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import storage from "@/utils/storage";
import AdminHeader from "@/components/AdminHeader";
import { moderateScale, scale, useTheme } from "@/theme";

export default function AdminProfileScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = user?.role === "superadmin";

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to exit the BhansaMart Administrative Console?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.removeItem("bhansa_admin_token");
              await storage.removeItem("bhansa_token");
              dispatch(logoutUser());
              router.replace("/(auth)/admin-login" as any);
            } catch (e) {
              router.replace("/(auth)/admin-login" as any);
            }
          },
        },
      ]
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const userInitials = (user?.name || "Admin")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader title="Admin Profile" subtitle="Account & System Information" />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Header Profile Identity Card */}
      <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.avatarRow}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isSuperadmin
                  ? (isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF")
                  : (isDark ? "rgba(2, 132, 199, 0.2)" : "#E0F2FE"),
                borderColor: isSuperadmin ? "#C084FC" : "#38BDF8",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isSuperadmin ? (isDark ? "#C084FC" : "#7E22CE") : (isDark ? "#38BDF8" : "#0284C7") },
              ]}
            >
              {userInitials}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: scale(14) }}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: textPrimary }]}>
                {user?.name || "BhansaMart Administrator"}
              </Text>
            </View>

            {/* Role Badge */}
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isSuperadmin
                    ? (isDark ? "rgba(168, 85, 247, 0.15)" : "#F3E8FF")
                    : (isDark ? "rgba(2, 132, 199, 0.15)" : "#E0F2FE"),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isSuperadmin ? "shield-crown" : "shield-account"}
                size={scale(13)}
                color={isSuperadmin ? (isDark ? "#C084FC" : "#7E22CE") : (isDark ? "#38BDF8" : "#0284C7")}
              />
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isSuperadmin ? (isDark ? "#C084FC" : "#7E22CE") : (isDark ? "#38BDF8" : "#0284C7") },
                ]}
              >
                {isSuperadmin ? "SUPERADMIN • PLATFORM OWNER" : "STAFF ADMIN • SCOPED"}
              </Text>
            </View>

            <Text style={[styles.emailText, { color: textSecondary }]}>
              {user?.email || "admin@bhansamart.com"}
            </Text>
            {user?.phone ? (
              <Text style={[styles.phoneText, { color: textSecondary }]}>
                Phone: {user.phone}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Identity Details */}
        <View style={[styles.metaStrip, { borderTopColor: border }]}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaKey, { color: textSecondary }]}>Account ID</Text>
            <Text style={[styles.metaVal, { color: textPrimary }]}>
              #{user?._id ? user._id.slice(-8).toUpperCase() : "ROOT-001"}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaKey, { color: textSecondary }]}>Status</Text>
            <Text style={[styles.metaVal, { color: "#10B981" }]}>Active Session</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaKey, { color: textSecondary }]}>Security</Text>
            <Text style={[styles.metaVal, { color: textPrimary }]}>JWT Verified</Text>
          </View>
        </View>
      </View>

      {/* Permissions / Scope Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <Feather name="shield" size={scale(18)} color="#10B981" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Administrative Authorization</Text>
        </View>

        {isSuperadmin ? (
          <View style={[styles.scopeBanner, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
            <MaterialCommunityIcons name="check-decagram" size={scale(20)} color="#10B981" />
            <View style={{ flex: 1, marginLeft: scale(8) }}>
              <Text style={styles.scopeBannerTitle}>Unrestricted Global Access</Text>
              <Text style={styles.scopeBannerDesc}>
                Full platform control over all vendor stores, customers, delivery riders, central treasury bank details, and the fixed 1.5% commission engine.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={[styles.scopeBanner, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
              <MaterialCommunityIcons name="storefront-outline" size={scale(20)} color="#3B82F6" />
              <View style={{ flex: 1, marginLeft: scale(8) }}>
                <Text style={[styles.scopeBannerTitle, { color: "#3B82F6" }]}>
                  Scoped Vendor Management
                </Text>
                <Text style={styles.scopeBannerDesc}>
                  Assigned to {user?.assignedVendors?.length || 0} designated vendor stores. Financial withdrawals and treasury accounts are restricted.
                </Text>
              </View>
            </View>

            <View style={styles.permList}>
              {[
                { name: "Manage Assigned Vendors", granted: user?.adminPermissions?.canManageVendors !== false },
                { name: "Edit Product Listings", granted: user?.adminPermissions?.canEditProducts !== false },
                { name: "Support Ticket Resolution", granted: user?.adminPermissions?.canManageTickets !== false },
                { name: "View Orders & Analytics", granted: user?.adminPermissions?.canViewOrders !== false },
                { name: "Financial Treasury & Payouts", granted: false },
              ].map((p, idx) => (
                <View key={idx} style={[styles.permRow, { borderBottomColor: border }]}>
                  <Text style={[styles.permName, { color: textPrimary }]}>{p.name}</Text>
                  <View style={[styles.permBadge, { backgroundColor: p.granted ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)" }]}>
                    <Text style={[styles.permBadgeText, { color: p.granted ? "#10B981" : "#EF4444" }]}>
                      {p.granted ? "Granted" : "Restricted"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* System Status Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <Feather name="server" size={scale(18)} color="#10B981" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>System & Platform Status</Text>
        </View>

        <View style={[styles.statusItemRow, { borderBottomColor: border }]}>
          <Text style={[styles.statusLabel, { color: textSecondary }]}>Central Superadmin Commission</Text>
          <Text style={[styles.statusValue, { color: "#10B981" }]}>Fixed 1.5%</Text>
        </View>

        <View style={[styles.statusItemRow, { borderBottomColor: border }]}>
          <Text style={[styles.statusLabel, { color: textSecondary }]}>Real-time Socket.IO</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={[styles.statusValue, { color: "#10B981" }]}>Connected</Text>
          </View>
        </View>

        <View style={[styles.statusItemRow, { borderBottomColor: border }]}>
          <Text style={[styles.statusLabel, { color: textSecondary }]}>App Version</Text>
          <Text style={[styles.statusValue, { color: textPrimary }]}>v1.0.0 (Production)</Text>
        </View>

        <View style={styles.statusItemRow}>
          <Text style={[styles.statusLabel, { color: textSecondary }]}>Console Interface</Text>
          <Text style={[styles.statusValue, { color: textPrimary }]}>NativeTabs + SideMenu</Text>
        </View>
      </View>

      {/* Logout Action Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={scale(18)} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Log Out from Console</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
    gap: scale(14),
    paddingBottom: scale(40),
  },
  profileCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(16),
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: moderateScale(22),
    fontWeight: "900",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    marginTop: scale(4),
  },
  roleBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emailText: {
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },
  phoneText: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  metaStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  metaCol: {
    alignItems: "flex-start",
  },
  metaKey: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaVal: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(2),
  },
  card: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(16),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: scale(12),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  scopeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(12),
    borderRadius: scale(8),
  },
  scopeBannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#10B981",
  },
  scopeBannerDesc: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    marginTop: scale(2),
    lineHeight: scale(16),
  },
  permList: {
    marginTop: scale(10),
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(8),
    borderBottomWidth: 1,
  },
  permName: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  permBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  permBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(10),
    borderBottomWidth: 1,
  },
  statusLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  statusValue: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  pulseDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: scale(10),
    marginTop: scale(6),
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
});
