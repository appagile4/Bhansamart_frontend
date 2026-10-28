import DashboardStatCard from "@/components/staffAdminComponent/DashboardStatCard";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import { fetchDeliveryCodReconciliationAdminApi } from "@/store/services/adminService";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StaffAdminDeliveriesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [codData, setCodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCod = async () => {
    try {
      const res = await fetchDeliveryCodReconciliationAdminApi();
      if (res?.data || Array.isArray(res)) {
        setCodData(res.data || res);
      }
    } catch (err) {
      console.warn("[Deliveries] Failed to load COD data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCod();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCod();
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  // Calculate totals
  const totalRidersWithCash = codData.filter(
    (r) => Number(r.pendingCash || r.outstandingCash || 0) > 0,
  ).length;
  const totalOutstandingCash = codData.reduce(
    (acc, curr) => acc + Number(curr.pendingCash || curr.outstandingCash || 0),
    0,
  );
  const totalCollectedCash = codData.reduce(
    (acc, curr) => acc + Number(curr.totalCollected || 0),
    0,
  );

  return (
    <View
      style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}
    >
      <StaffAdminHeader
        title="Fleet & COD"
        subtitle="Rider Tracking & Cash Handover"
        onRefresh={onRefresh}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0284C7"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hub Banner Cards */}
        <View style={styles.topCardsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/DeliveryManagementScreen" as any,
              )
            }
            style={[
              styles.hubCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={[styles.hubIconBox, { backgroundColor: "#ECFDF5" }]}>
              <MaterialCommunityIcons
                name="moped"
                size={scale(24)}
                color="#059669"
              />
            </View>
            <Text style={[styles.hubTitle, { color: textPrimary }]}>
              Delivery Fleet
            </Text>
            <Text style={[styles.hubSubtitle, { color: textSecondary }]}>
              View active riders, dispatches & delivery performance
            </Text>
            <View style={styles.hubActionRow}>
              <Text style={[styles.hubActionText, { color: "#059669" }]}>
                Open Fleet Console
              </Text>
              <Feather name="arrow-right" size={scale(14)} color="#059669" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/CODReconciliationScreen" as any,
              )
            }
            style={[
              styles.hubCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={[styles.hubIconBox, { backgroundColor: "#FFFBEB" }]}>
              <MaterialCommunityIcons
                name="cash-register"
                size={scale(24)}
                color="#D97706"
              />
            </View>
            <Text style={[styles.hubTitle, { color: textPrimary }]}>
              COD Reconciliation
            </Text>
            <Text style={[styles.hubSubtitle, { color: textSecondary }]}>
              Audit collected cash, rider deposits & dispute records
            </Text>
            <View style={styles.hubActionRow}>
              <Text style={[styles.hubActionText, { color: "#D97706" }]}>
                Audit Cash Handover
              </Text>
              <Feather name="arrow-right" size={scale(14)} color="#D97706" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/adminScreens/map" as any)}
            style={[
              styles.hubCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={[styles.hubIconBox, { backgroundColor: "#EFF6FF" }]}>
              <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={scale(24)}
                color="#2563EB"
              />
            </View>
            <Text style={[styles.hubTitle, { color: textPrimary }]}>
              Live Fleet Radar
            </Text>
            <Text style={[styles.hubSubtitle, { color: textSecondary }]}>
              GPS real-time map of store locations and active delivery riders
            </Text>
            <View style={styles.hubActionRow}>
              <Text style={[styles.hubActionText, { color: "#2563EB" }]}>
                Open Radar Map
              </Text>
              <Feather name="arrow-right" size={scale(14)} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>

        {/* COD Quick Summary */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Cash Audit Summary
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Verified collections from completed orders
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <DashboardStatCard
            title="Outstanding Cash"
            value={`Rs. ${totalOutstandingCash.toLocaleString()}`}
            subtitle="Held by delivery riders"
            icon="cash-clock"
            iconColor="#DC2626"
            iconBg="rgba(220, 38, 38, 0.12)"
            badgeText={
              totalRidersWithCash > 0
                ? `${totalRidersWithCash} Riders`
                : undefined
            }
            badgeColor="#FEF2F2"
            badgeTextColor="#DC2626"
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/CODReconciliationScreen" as any,
              )
            }
          />

          <DashboardStatCard
            title="Total Handover"
            value={`Rs. ${totalCollectedCash.toLocaleString()}`}
            subtitle="Lifetime collected COD"
            icon="cash-check"
            iconColor="#059669"
            iconBg="rgba(5, 150, 105, 0.12)"
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/CODReconciliationScreen" as any,
              )
            }
          />
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
    paddingBottom: moderateScale(100),
    gap: moderateScale(14),
  },
  topCardsRow: {
    gap: moderateScale(12),
  },
  hubCard: {
    padding: scale(16),
    borderRadius: scale(14),
    borderWidth: 1,
    gap: moderateScale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  hubIconBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  hubTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  hubSubtitle: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
  },
  hubActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: moderateScale(6),
  },
  hubActionText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    marginTop: moderateScale(1),
  },
  kpiRow: {
    gap: moderateScale(10),
  },
});
