import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import DashboardStatCard from "@/components/staffAdminComponent/DashboardStatCard";
import SalesChart from "@/components/staffAdminComponent/SalesChart";
import AdminStoreFilterDropdown from "@/components/AdminStoreFilterDropdown";
import {
  fetchStaffAssignedVendorsApi,
  fetchVendorSalesAnalyticsApi,
} from "@/store/services/adminService";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "monthly", label: "This Month" },
];

export default function StaffAdminSalesAnalyticsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [selectedRange, setSelectedRange] = useState("7d");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors) {
        setAssignedVendors(res.vendors);
      }
    } catch (e) {
      console.warn("[SalesAnalytics] Error loading vendors", e);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetchVendorSalesAnalyticsApi({
        range: selectedRange,
        vendorId: selectedVendorId !== "all" ? selectedVendorId : undefined,
      });
      if (res?.data || res?.summary) {
        setAnalytics(res.data || res);
      }
    } catch (e) {
      console.warn("[SalesAnalytics] Error loading analytics", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAnalytics();
  }, [selectedRange, selectedVendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const summary = analytics?.summary || {
    grossSales: 0,
    completedSales: 0,
    codSales: 0,
    onlineSales: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Sales Analytics"
        subtitle="Revenue & Orders Reports"
        showBack
        onRefresh={onRefresh}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Store Scoper */}
        <AdminStoreFilterDropdown
          vendors={assignedVendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(id) => setSelectedVendorId(id)}
          title="Assigned Store Scope"
        />

        {/* Range Selector */}
        <View style={styles.rangesRow}>
          {RANGES.map((r) => {
            const isSelected = selectedRange === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setSelectedRange(r.id)}
                style={[
                  styles.rangePill,
                  {
                    backgroundColor: isSelected ? "#0284C7" : cardBg,
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rangeText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Calculating scoped sales report...
            </Text>
          </View>
        ) : (
          <View style={{ gap: moderateScale(14) }}>
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <DashboardStatCard
                title="Delivered Revenue"
                value={`Rs. ${Number(summary.completedSales || 0).toLocaleString()}`}
                subtitle="Fulfilled orders sales"
                icon="cash-check"
                iconColor="#059669"
                iconBg="rgba(5, 150, 105, 0.12)"
              />
              <DashboardStatCard
                title="Total Gross Sales"
                value={`Rs. ${Number(summary.grossSales || 0).toLocaleString()}`}
                subtitle={`${summary.totalOrders || 0} total orders placed`}
                icon="currency-usd"
                iconColor="#0284C7"
                iconBg="rgba(2, 132, 199, 0.12)"
              />
            </View>

            <View style={styles.kpiRow}>
              <DashboardStatCard
                title="Cash on Delivery"
                value={`Rs. ${Number(summary.codSales || 0).toLocaleString()}`}
                subtitle="Delivered COD orders"
                icon="cash-multiple"
                iconColor="#D97706"
                iconBg="rgba(217, 119, 6, 0.12)"
              />
              <DashboardStatCard
                title="Online / Wallets"
                value={`Rs. ${Number(summary.onlineSales || 0).toLocaleString()}`}
                subtitle="eSewa, Khalti & Cards"
                icon="credit-card-check-outline"
                iconColor="#4F46E5"
                iconBg="rgba(79, 70, 229, 0.12)"
              />
            </View>

            {/* Daily Trends Chart */}
            <SalesChart
              data={analytics?.dailyTrends || []}
              title="Daily Sales Trajectory"
            />

            {/* Orders Breakdown by Status */}
            {analytics?.ordersByStatus?.length > 0 && (
              <View style={[styles.breakdownCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.breakdownTitle, { color: textPrimary }]}>
                  Orders Distribution by Status
                </Text>
                <View style={styles.breakdownList}>
                  {analytics.ordersByStatus.map((st: any) => (
                    <View key={st._id} style={styles.breakdownItem}>
                      <View style={{ gap: moderateScale(2) }}>
                        <Text style={[styles.statusKey, { color: textPrimary }]}>
                          {(st._id || "UNKNOWN").replace(/_/g, " ")}
                        </Text>
                        <Text style={[styles.statusVal, { color: textSecondary }]}>
                          Rs. {Number(st.value || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{st.count} orders</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Category Performance */}
            {analytics?.categorySales?.length > 0 && (
              <View style={[styles.breakdownCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.breakdownTitle, { color: textPrimary }]}>
                  Category Sales Breakdown
                </Text>
                <View style={styles.breakdownList}>
                  {analytics.categorySales.map((cat: any, idx: number) => (
                    <View key={cat._id || idx} style={styles.breakdownItem}>
                      <Text style={[styles.statusKey, { color: textPrimary }]}>
                        {cat._id || "General Merchandise"}
                      </Text>
                      <Text style={[styles.priceTag, { color: "#0284C7" }]}>
                        Rs. {Number(cat.totalSales || 0).toLocaleString()} ({cat.count} units)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
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
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(30),
    gap: moderateScale(12),
  },
  rangesRow: {
    flexDirection: "row",
    gap: scale(6),
    marginVertical: moderateScale(6),
    flexWrap: "wrap",
  },
  rangePill: {
    paddingHorizontal: scale(11),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  rangeText: {
    fontSize: moderateScale(11),
  },
  loadingCenter: {
    paddingVertical: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  kpiRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  breakdownCard: {
    padding: scale(14),
    borderRadius: scale(14),
    borderWidth: 1,
    gap: moderateScale(10),
  },
  breakdownTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  breakdownList: {
    gap: moderateScale(8),
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  statusKey: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  statusVal: {
    fontSize: moderateScale(11),
  },
  countBadge: {
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  countBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#0369A1",
  },
  priceTag: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
});
