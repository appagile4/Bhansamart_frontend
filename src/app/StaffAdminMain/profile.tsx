import React, { useEffect, useState } from "react";
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
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import { fetchStaffAssignedVendorsApi } from "@/store/services/adminService";
import { getStoreDisplayName } from "@/components/AdminStoreFilterDropdown";

export default function StaffAdminProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [assignedStores, setAssignedStores] = useState<any[]>([]);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await fetchStaffAssignedVendorsApi();
        if (res?.vendors) {
          setAssignedStores(res.vendors);
        }
      } catch (e) {
        // Silent catch
      }
    };
    loadStores();
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out from Staff Admin Console?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await storage.removeItem("bhansa_admin_token");
          await dispatch(logoutUser());
          router.replace("/(auth)/admin-login" as any);
        },
      },
    ]);
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const permissions = user?.adminPermissions || {
    canManageVendors: true,
    canEditProducts: true,
    canManageTickets: true,
    canViewOrders: true,
    canSendNotifications: true,
    canViewAnalytics: true,
    canReviewWithdrawals: true,
    canReviewBrands: true,
    canExamineRefunds: true,
    canReconcileCod: true,
    canTrackDeliveries: true,
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Admin Profile"
        subtitle="Staff Role & Assignment"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.avatarBig}>
            <MaterialCommunityIcons name="account-tie" size={scale(36)} color="#0284C7" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textPrimary }]}>
              {user?.name || "Staff Administrator"}
            </Text>
            <Text style={[styles.profileEmail, { color: textSecondary }]}>
              {user?.email || "admin@bhansamart.com"}
            </Text>
            <View style={styles.roleRow}>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>Role: Staff Admin</Text>
              </View>
              {user?.phone ? (
                <Text style={[styles.phoneText, { color: textSecondary }]}>
                  {user.phone}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Assigned Vendors Scoping Card */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="storefront-check" size={scale(20)} color="#0284C7" />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Assigned Store Scope ({assignedStores.length})
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: textSecondary }]}>
            Your operations, dashboards, order actions, and tickets are strictly bounded to the following stores assigned by platform Superadmin:
          </Text>

          <View style={styles.storesWrap}>
            {assignedStores.length > 0 ? (
              assignedStores.map((st) => (
                <View key={st._id || st.id} style={styles.storePill}>
                  <MaterialCommunityIcons name="storefront" size={scale(14)} color="#0369A1" />
                  <Text style={styles.storePillText}>{getStoreDisplayName(st)}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noStoresText, { color: textSecondary }]}>
                No stores currently assigned. Contact platform Superadmin.
              </Text>
            )}
          </View>
        </View>

        {/* Granted Permissions Card */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-check" size={scale(20)} color="#059669" />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Operational Permissions
            </Text>
          </View>

          <View style={styles.permissionsGrid}>
            {Object.entries(permissions).map(([key, val]) => (
              <View key={key} style={styles.permRow}>
                <Ionicons
                  name={val ? "checkmark-circle" : "close-circle"}
                  size={scale(16)}
                  color={val ? "#059669" : "#94A3B8"}
                />
                <Text style={[styles.permText, { color: val ? textPrimary : textSecondary }]}>
                  {key
                    .replace(/^can/, "")
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                </Text>
              </View>
            ))}
          </View>

          {/* Security Disclaimer */}
          <View style={styles.securityNoticeBox}>
            <MaterialCommunityIcons name="lock-outline" size={scale(16)} color="#0284C7" />
            <Text style={styles.securityNoticeText}>
              Financial payouts, central bank configs, and platform commission ledgers are restricted strictly to Platform Superadmin.
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Feather name="log-out" size={scale(18)} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out of Console</Text>
        </TouchableOpacity>
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
    paddingBottom: moderateScale(40),
    gap: moderateScale(14),
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(16),
    borderRadius: scale(14),
    borderWidth: 1,
    gap: scale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarBig: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(16),
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: moderateScale(3),
  },
  profileName: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  profileEmail: {
    fontSize: moderateScale(12),
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: moderateScale(2),
  },
  rolePill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
  },
  roleText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#0369A1",
  },
  phoneText: {
    fontSize: moderateScale(11.5),
  },
  sectionCard: {
    padding: scale(16),
    borderRadius: scale(14),
    borderWidth: 1,
    gap: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  cardTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
  },
  cardDesc: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
  },
  storesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: moderateScale(4),
  },
  storePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#E0F2FE",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
  },
  storePillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#0369A1",
  },
  noStoresText: {
    fontSize: moderateScale(12),
    fontStyle: "italic",
  },
  permissionsGrid: {
    gap: moderateScale(8),
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  permText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
  },
  securityNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    padding: scale(10),
    borderRadius: scale(8),
    gap: scale(8),
    marginTop: moderateScale(4),
  },
  securityNoticeText: {
    fontSize: moderateScale(11),
    color: "#0369A1",
    flex: 1,
    lineHeight: moderateScale(15),
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    backgroundColor: "#FEF2F2",
    borderRadius: scale(12),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: moderateScale(10),
  },
  logoutText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#EF4444",
  },
});
