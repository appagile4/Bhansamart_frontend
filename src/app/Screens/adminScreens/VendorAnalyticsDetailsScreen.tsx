import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AdminHeader from "@/components/AdminHeader";
import AdminStoreFilterDropdown, {
  getStoreDisplayName,
} from "@/components/AdminStoreFilterDropdown";
import SalesChart from "@/components/staffAdminComponent/SalesChart";
import { moderateScale, scale, useTheme } from "@/theme";
import api from "@/store/services/api";
import {
  fetchStaffAssignedVendorsApi,
  fetchVendorSalesAnalyticsApi,
} from "@/store/services/adminService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type KpiTab = "all" | "gross" | "net" | "payment" | "returns";

const KPI_TABS: { id: KpiTab; label: string; icon: any; color: string }[] = [
  { id: "all", label: "All Details", icon: "view-dashboard-outline", color: "#0284C7" },
  { id: "gross", label: "Gross Sales", icon: "cash-multiple", color: "#10B981" },
  { id: "net", label: "Net Realized", icon: "chart-line", color: "#0EA5E9" },
  { id: "payment", label: "Payment Split", icon: "bank-transfer", color: "#F59E0B" },
  { id: "returns", label: "Returns / Cancel", icon: "keyboard-return", color: "#EF4444" },
];

const TIME_RANGES = [
  { label: "All Time", value: "all" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "Monthly", value: "monthly" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
];

export default function VendorAnalyticsDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const params = useLocalSearchParams<{
    vendorId?: string;
    timeRange?: string;
    initialTab?: string;
  }>();

  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    params.vendorId || "all"
  );
  const [timeRange, setTimeRange] = useState<string>(
    params.timeRange || "all"
  );
  const [activeTab, setActiveTab] = useState<KpiTab>(
    (params.initialTab as KpiTab) || "all"
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);

  // Analytics data
  const [summary, setSummary] = useState<any>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // Load vendors list for dropdown
  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors && res.vendors.length > 0) {
        setAssignedVendors(res.vendors);
      } else {
        const fallback = await api.get("/admin/vendors?limit=100");
        if (fallback.data?.vendors) {
          setAssignedVendors(fallback.data.vendors);
        }
      }
    } catch {
      try {
        const fallback = await api.get("/admin/vendors?limit=100");
        if (fallback.data?.vendors) {
          setAssignedVendors(fallback.data.vendors);
        }
      } catch {}
    }
  };

  // Load complete analytics
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: any = { range: timeRange };
      if (selectedVendorId !== "all") {
        queryParams.vendorId = selectedVendorId;
      }
      const res = await fetchVendorSalesAnalyticsApi(queryParams);
      if (res?.analytics) {
        setSummary(res.analytics.summary || null);
        setOrdersByStatus(res.analytics.ordersByStatus || []);
        setCategoryBreakdown(res.analytics.categoryBreakdown || []);
        setTimeline(res.analytics.timeline || []);
        setTopProducts(res.analytics.topSellingProducts || []);
      }
    } catch (err) {
      console.error("Failed to load vendor analytics details:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVendorId, timeRange]);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendors(), loadAnalytics()]);
    setRefreshing(false);
  };

  // Current selected vendor object
  const currentVendor = useMemo(() => {
    if (selectedVendorId === "all") return null;
    return assignedVendors.find(
      (v) => (v._id || v.id) === selectedVendorId
    );
  }, [assignedVendors, selectedVendorId]);

  const storeTitle = useMemo(() => {
    if (selectedVendorId === "all") return "All Stores Overview";
    return getStoreDisplayName(currentVendor);
  }, [selectedVendorId, currentVendor]);

  // Derived Calculations
  const grossSales = Number(summary?.grossSales || 0);
  const totalOrders = Number(summary?.totalOrders || summary?.orderCount || 0);
  const netSales = Number(summary?.netSales || 0);
  const completedOrders = Number(summary?.completedOrders || 0);
  const codSales = Number(summary?.codSales || 0);
  const onlineSales = Number(summary?.onlineSales || 0);
  const returnedOrders = Number(summary?.returnedOrders || 0);
  const cancelledOrders = Number(summary?.cancelledOrders || 0);
  const returnRefundRate = Number(summary?.returnRefundRate || 0);

  // Average Order Value (AOV)
  const aov = totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0;
  // Realization rate
  const realizationRate =
    grossSales > 0 ? Math.min(100, Math.round((netSales / grossSales) * 100)) : 0;
  // Total payment sum for split calculation
  const totalPayments = codSales + onlineSales || grossSales || 1;
  const codPct = Math.round((codSales / totalPayments) * 100);
  const onlinePct = Math.round((onlineSales / totalPayments) * 100);

  // Cancellation Rate
  const cancelRate =
    totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : "0.0";

  // Theme Colors
  const bg = isDark ? "#080D11" : "#F8FAFC";
  const cardBg = isDark ? "#121A21" : "#FFFFFF";
  const border = isDark ? "#22313D" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("DELIVERED") || s.includes("COMPLETED")) return "#10B981";
    if (s.includes("CANCEL")) return "#EF4444";
    if (s.includes("RETURN") || s.includes("REFUND")) return "#F43F5E";
    if (s.includes("SHIP") || s.includes("OUT")) return "#0EA5E9";
    if (s.includes("CONFIRM") || s.includes("ACCEPT")) return "#8B5CF6";
    if (s.includes("PENDING") || s.includes("PROCESS")) return "#F59E0B";
    return "#64748B";
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="KPI Analytics Details"
        subtitle={storeTitle}
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0284C7"]}
            tintColor="#0284C7"
          />
        }
      >
        {/* 1. Store Filter Dropdown */}
        <View style={styles.dropdownWrap}>
          <AdminStoreFilterDropdown
            vendors={assignedVendors}
            selectedVendorId={selectedVendorId}
            onSelectVendor={setSelectedVendorId}
            title="Filter by Vendor Store"
          />
        </View>

        {/* 2. Time Range Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeRangeScroll}
        >
          {TIME_RANGES.map((r) => {
            const active = timeRange === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.rangePill,
                  active && styles.rangePillActive,
                  !active && {
                    backgroundColor: isDark ? "#121A21" : "#FFFFFF",
                    borderColor: border,
                  },
                ]}
                onPress={() => setTimeRange(r.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.rangeText,
                    active && styles.rangeTextActive,
                    !active && { color: textSecondary },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. KPI Tabs Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiTabsScroll}
        >
          {KPI_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.kpiTabBtn,
                  active && {
                    backgroundColor: tab.color,
                    borderColor: tab.color,
                  },
                  !active && {
                    backgroundColor: isDark ? "#121A21" : "#FFFFFF",
                    borderColor: border,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={scale(15)}
                  color={active ? "#FFFFFF" : tab.color}
                />
                <Text
                  style={[
                    styles.kpiTabText,
                    active && styles.kpiTabTextActive,
                    !active && { color: textPrimary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loaderText, { color: textSecondary }]}>
              Aggregating detailed metrics...
            </Text>
          </View>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: GROSS SALES DEEP DIVE */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {(activeTab === "all" || activeTab === "gross") && (
              <View
                style={[
                  styles.detailSection,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={scale(20)} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Gross Sales Analysis
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Top-line order volumes & value metrics
                    </Text>
                  </View>
                </View>

                {/* Gross Sales Metrics Grid */}
                <View style={styles.miniStatsRow}>
                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Total Gross Sales</Text>
                    <Text style={[styles.miniStatValue, { color: "#10B981" }]}>
                      NPR {grossSales.toLocaleString()}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      All placed orders
                    </Text>
                  </View>

                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Total Orders</Text>
                    <Text style={[styles.miniStatValue, { color: textPrimary }]}>
                      {totalOrders}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      Orders created
                    </Text>
                  </View>

                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Average Order (AOV)</Text>
                    <Text style={[styles.miniStatValue, { color: "#0EA5E9" }]}>
                      NPR {aov.toLocaleString()}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      Revenue per order
                    </Text>
                  </View>
                </View>

                {/* Orders by Status Breakdown */}
                {ordersByStatus.length > 0 && (
                  <View style={styles.subBlock}>
                    <Text style={[styles.subBlockTitle, { color: textPrimary }]}>
                      Order Status Volume Distribution
                    </Text>
                    <View style={styles.statusList}>
                      {ordersByStatus.map((st) => {
                        const count = st.count || 0;
                        const val = st.value || 0;
                        const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                        const col = getStatusColor(st._id);

                        return (
                          <View key={st._id} style={styles.statusRow}>
                            <View style={styles.statusInfoLeft}>
                              <View style={[styles.statusDot, { backgroundColor: col }]} />
                              <Text style={[styles.statusName, { color: textPrimary }]}>
                                {(st._id || "UNKNOWN").replace(/_/g, " ")}
                              </Text>
                            </View>

                            <View style={styles.statusBarWrap}>
                              <View
                                style={[
                                  styles.statusBarTrack,
                                  { backgroundColor: isDark ? "#1E2A35" : "#E2E8F0" },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusBarFill,
                                    { width: `${Math.max(5, pct)}%`, backgroundColor: col },
                                  ]}
                                />
                              </View>
                            </View>

                            <View style={styles.statusInfoRight}>
                              <Text style={[styles.statusCount, { color: textPrimary }]}>
                                {count} ({pct}%)
                              </Text>
                              <Text style={[styles.statusValText, { color: textSecondary }]}>
                                NPR {val.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: NET REALIZED SALES DEEP DIVE */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {(activeTab === "all" || activeTab === "net") && (
              <View
                style={[
                  styles.detailSection,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: "rgba(14, 165, 233, 0.12)" }]}>
                    <MaterialCommunityIcons name="chart-line" size={scale(20)} color="#0EA5E9" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Net Realized Revenue
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Actual completed delivered earnings after deductions
                    </Text>
                  </View>
                </View>

                {/* Net Realized Metric Box */}
                <View style={styles.miniStatsRow}>
                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Net Realized Sales</Text>
                    <Text style={[styles.miniStatValue, { color: "#0EA5E9" }]}>
                      NPR {netSales.toLocaleString()}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: "#10B981" }]}>
                      Delivered minus refunds
                    </Text>
                  </View>

                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Realization Rate</Text>
                    <Text style={[styles.miniStatValue, { color: "#10B981" }]}>
                      {realizationRate}%
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      Of gross sales captured
                    </Text>
                  </View>

                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Fulfilled Orders</Text>
                    <Text style={[styles.miniStatValue, { color: textPrimary }]}>
                      {completedOrders}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      Delivered to customers
                    </Text>
                  </View>
                </View>

                {/* Category Contribution to Net Sales */}
                {categoryBreakdown.length > 0 && (
                  <View style={styles.subBlock}>
                    <Text style={[styles.subBlockTitle, { color: textPrimary }]}>
                      Category Revenue Contribution
                    </Text>
                    <View style={styles.categoryList}>
                      {categoryBreakdown.map((c, idx) => {
                        const rev = c.revenue || 0;
                        const units = c.unitsSold || 0;
                        const share =
                          grossSales > 0 ? Math.round((rev / grossSales) * 100) : 0;

                        return (
                          <View key={c.category || idx} style={[styles.categoryCard, { borderColor: border }]}>
                            <View style={styles.catHeader}>
                              <Text style={[styles.catName, { color: textPrimary }]}>
                                {c.category || "General Products"}
                              </Text>
                              <Text style={[styles.catRev, { color: "#0EA5E9" }]}>
                                NPR {rev.toLocaleString()}
                              </Text>
                            </View>

                            <View style={styles.catFooter}>
                              <Text style={[styles.catUnits, { color: textSecondary }]}>
                                {units} items sold
                              </Text>
                              <Text style={[styles.catShare, { color: textSecondary }]}>
                                {share}% share
                              </Text>
                            </View>

                            {/* Progress bar */}
                            <View
                              style={[
                                styles.catTrack,
                                { backgroundColor: isDark ? "#1E2A35" : "#E2E8F0" },
                              ]}
                            >
                              <View
                                style={[
                                  styles.catFill,
                                  { width: `${Math.max(5, share)}%` },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: PAYMENT SPLIT (COD VS PREPAID) */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {(activeTab === "all" || activeTab === "payment") && (
              <View
                style={[
                  styles.detailSection,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                    <MaterialCommunityIcons name="bank-transfer" size={scale(20)} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Payment Method Settlement Split
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Cash On Delivery vs Digital Prepaid Wallets
                    </Text>
                  </View>
                </View>

                {/* Visual Ratio Bar */}
                <View style={styles.paymentMeterWrap}>
                  <View style={styles.meterLabelsRow}>
                    <Text style={[styles.meterLabelText, { color: "#F59E0B" }]}>
                      COD: {codPct}%
                    </Text>
                    <Text style={[styles.meterLabelText, { color: "#3B82F6" }]}>
                      Online: {onlinePct}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.splitMeterTrack,
                      { backgroundColor: isDark ? "#1E2A35" : "#E2E8F0" },
                    ]}
                  >
                    <View
                      style={[
                        styles.splitMeterSegment,
                        { width: `${codPct}%`, backgroundColor: "#F59E0B" },
                      ]}
                    />
                    <View
                      style={[
                        styles.splitMeterSegment,
                        { width: `${onlinePct}%`, backgroundColor: "#3B82F6" },
                      ]}
                    />
                  </View>
                </View>

                {/* Side-by-Side Detail Cards */}
                <View style={styles.paymentSplitRow}>
                  {/* COD Card */}
                  <View
                    style={[
                      styles.paymentSplitCard,
                      {
                        backgroundColor: isDark ? "#1A170A" : "#FFFBEB",
                        borderColor: isDark ? "#78350F" : "#FDE68A",
                      },
                    ]}
                  >
                    <View style={styles.splitCardHeader}>
                      <MaterialCommunityIcons name="cash-multiple" size={scale(20)} color="#D97706" />
                      <Text style={[styles.splitCardTitle, { color: "#D97706" }]}>
                        Cash On Delivery
                      </Text>
                    </View>
                    <Text style={[styles.splitAmount, { color: isDark ? "#FDE68A" : "#92400E" }]}>
                      NPR {codSales.toLocaleString()}
                    </Text>
                    <Text style={[styles.splitSub, { color: isDark ? "#D97706" : "#B45309" }]}>
                      {codPct}% of total orders volume
                    </Text>
                    <View style={styles.splitNoteBox}>
                      <Text style={[styles.splitNoteText, { color: textSecondary }]}>
                        Collected by delivery partner upon handover.
                      </Text>
                    </View>
                  </View>

                  {/* Online Payment Card */}
                  <View
                    style={[
                      styles.paymentSplitCard,
                      {
                        backgroundColor: isDark ? "#0B192E" : "#EFF6FF",
                        borderColor: isDark ? "#1E3A8A" : "#BFDBFE",
                      },
                    ]}
                  >
                    <View style={styles.splitCardHeader}>
                      <MaterialCommunityIcons name="credit-card-check-outline" size={scale(20)} color="#2563EB" />
                      <Text style={[styles.splitCardTitle, { color: "#2563EB" }]}>
                        Digital / Prepaid
                      </Text>
                    </View>
                    <Text style={[styles.splitAmount, { color: isDark ? "#BFDBFE" : "#1E40AF" }]}>
                      NPR {onlineSales.toLocaleString()}
                    </Text>
                    <Text style={[styles.splitSub, { color: isDark ? "#60A5FA" : "#1D4ED8" }]}>
                      {onlinePct}% of total orders volume
                    </Text>
                    <View style={styles.splitNoteBox}>
                      <Text style={[styles.splitNoteText, { color: textSecondary }]}>
                        Prepaid via eSewa, Khalti, or cards with guaranteed capture.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: RETURNS & CANCELLATIONS */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {(activeTab === "all" || activeTab === "returns") && (
              <View
                style={[
                  styles.detailSection,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                    <MaterialCommunityIcons name="keyboard-return" size={scale(20)} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Returns & Cancellation Risk
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Operational health, refund rates, and order loss indicators
                    </Text>
                  </View>
                </View>

                {/* Return/Cancel Cards */}
                <View style={styles.miniStatsRow}>
                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Returns / Refunds</Text>
                    <Text style={[styles.miniStatValue, { color: "#EF4444" }]}>
                      {returnedOrders}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      {returnRefundRate}% refund rate
                    </Text>
                  </View>

                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Cancelled Orders</Text>
                    <Text style={[styles.miniStatValue, { color: "#F43F5E" }]}>
                      {cancelledOrders}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      {cancelRate}% cancel rate
                    </Text>
                  </View>

                  <View style={[styles.miniStatBox, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
                    <Text style={[styles.miniStatLabel, { color: textSecondary }]}>Operational Health</Text>
                    <Text
                      style={[
                        styles.miniStatValue,
                        {
                          color:
                            returnRefundRate < 5 && Number(cancelRate) < 5
                              ? "#10B981"
                              : returnRefundRate < 10
                              ? "#F59E0B"
                              : "#EF4444",
                          fontSize: moderateScale(14),
                        },
                      ]}
                    >
                      {returnRefundRate < 5 && Number(cancelRate) < 5
                        ? "Optimal"
                        : returnRefundRate < 10
                        ? "Moderate"
                        : "Needs Attention"}
                    </Text>
                    <Text style={[styles.miniStatHint, { color: textSecondary }]}>
                      Benchmark: &lt; 5%
                    </Text>
                  </View>
                </View>

                {/* Operational Recommendations Card */}
                <View
                  style={[
                    styles.adviceCard,
                    {
                      backgroundColor: isDark ? "#151B22" : "#F1F5F9",
                      borderColor: border,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(8) }}>
                    <Feather name="shield" size={scale(16)} color="#0284C7" />
                    <Text style={[styles.adviceHeader, { color: textPrimary }]}>
                      Risk Mitigation Guidelines
                    </Text>
                  </View>
                  <Text style={[styles.adviceItem, { color: textSecondary }]}>
                    • Verify perishable & fragile packing before delivery handoff to reduce transit damage returns.
                  </Text>
                  <Text style={[styles.adviceItem, { color: textSecondary }]}>
                    • Ensure accurate SKU listing and weight specifications to minimize buyer cancellation.
                  </Text>
                  <Text style={[styles.adviceItem, { color: textSecondary }]}>
                    • Contact buyers immediately upon order placement to confirm COD address validity.
                  </Text>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* 5. DAILY REVENUE TIMELINE CHART */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {timeline.length > 0 && (
              <View style={{ marginTop: scale(4), marginBottom: scale(14) }}>
                <SalesChart data={timeline} title="Sales Trajectory Timeline" />
              </View>
            )}
          </>
        )}
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
  content: {
    paddingHorizontal: scale(14),
    paddingTop: scale(10),
    paddingBottom: scale(40),
  },

  dropdownWrap: {
    marginBottom: scale(12),
  },
  timeRangeScroll: {
    gap: scale(8),
    paddingBottom: scale(12),
  },
  rangePill: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  rangePillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  rangeText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  rangeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* KPI Tab Switcher */
  kpiTabsScroll: {
    gap: scale(8),
    paddingBottom: scale(14),
  },
  kpiTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  kpiTabText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  kpiTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  loaderWrap: {
    paddingVertical: moderateScale(50),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loaderText: {
    fontSize: moderateScale(13),
  },

  /* Detail Section Cards */
  detailSection: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(14),
    marginBottom: scale(14),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginBottom: scale(14),
  },
  iconBadge: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: moderateScale(11),
    marginTop: scale(1),
  },

  /* Mini Stats Row */
  miniStatsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(12),
  },
  miniStatBox: {
    flex: 1,
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(10),
    alignItems: "flex-start",
  },
  miniStatLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    marginBottom: scale(4),
  },
  miniStatValue: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginBottom: scale(2),
  },
  miniStatHint: {
    fontSize: moderateScale(9.5),
  },

  /* Subblock: Status breakdown */
  subBlock: {
    marginTop: scale(8),
    paddingTop: scale(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.2)",
  },
  subBlockTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    marginBottom: scale(10),
  },
  statusList: {
    gap: scale(10),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    width: scale(85),
  },
  statusDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
  },
  statusName: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusBarWrap: {
    flex: 1,
    paddingHorizontal: scale(8),
  },
  statusBarTrack: {
    height: scale(6),
    borderRadius: scale(3),
    overflow: "hidden",
  },
  statusBarFill: {
    height: "100%",
    borderRadius: scale(3),
  },
  statusInfoRight: {
    alignItems: "flex-end",
    minWidth: scale(70),
  },
  statusCount: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  statusValText: {
    fontSize: moderateScale(9.5),
  },

  /* Category contribution */
  categoryList: {
    gap: scale(8),
  },
  categoryCard: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(10),
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(4),
  },
  catName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  catRev: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  catFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(6),
  },
  catUnits: {
    fontSize: moderateScale(10.5),
  },
  catShare: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  catTrack: {
    height: scale(5),
    borderRadius: scale(2.5),
    overflow: "hidden",
  },
  catFill: {
    height: "100%",
    backgroundColor: "#0EA5E9",
    borderRadius: scale(2.5),
  },

  /* Payment Split Meter */
  paymentMeterWrap: {
    marginBottom: scale(14),
  },
  meterLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(6),
  },
  meterLabelText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  splitMeterTrack: {
    height: scale(10),
    borderRadius: scale(5),
    overflow: "hidden",
    flexDirection: "row",
  },
  splitMeterSegment: {
    height: "100%",
  },

  paymentSplitRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  paymentSplitCard: {
    flex: 1,
    borderRadius: scale(12),
    borderWidth: 1.5,
    padding: scale(12),
  },
  splitCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(8),
  },
  splitCardTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  splitAmount: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginBottom: scale(2),
  },
  splitSub: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    marginBottom: scale(6),
  },
  splitNoteBox: {
    paddingTop: scale(6),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.3)",
  },
  splitNoteText: {
    fontSize: moderateScale(9.5),
    lineHeight: scale(13),
  },

  /* Advice Card */
  adviceCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginTop: scale(10),
  },
  adviceHeader: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  adviceItem: {
    fontSize: moderateScale(10.5),
    lineHeight: scale(16),
    marginBottom: scale(3),
  },
});
