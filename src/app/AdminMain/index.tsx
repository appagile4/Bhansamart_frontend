import AdminHeader from "@/components/AdminHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminDashboardCharts,
  fetchAdminDashboardStats,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIMEFRAMES = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7days", label: "7 Days" },
  { id: "last30days", label: "30 Days" },
  { id: "thisMonth", label: "This Month" },
];

export default function AdminDashboardOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  // Responsive Breakpoints
  const isSmallDevice = windowWidth < 360;
  const isTablet = windowWidth >= 768;
  const isLargeTablet = windowWidth >= 1024;

  const horizontalPadding = isTablet ? scale(24) : scale(16);
  const gridGap = isTablet ? scale(16) : scale(12);
  const kpiColumns = isTablet ? (isLargeTablet ? 4 : 3) : 2;
  const kpiCardWidth =
    (windowWidth - horizontalPadding * 2 - gridGap * (kpiColumns - 1)) /
    kpiColumns;

  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [chartMetric, setChartMetric] = useState<"sales" | "orders">("sales");

  const { stats, charts, loading } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);

  const isSuperAdmin = user?.role === "superadmin" || stats?.isSuperAdmin === true;

  const loadData = () => {
    dispatch(fetchAdminDashboardStats({ timeframe: selectedTimeframe }));
    dispatch(fetchAdminDashboardCharts(7));
  };

  useEffect(() => {
    loadData();
  }, [selectedTimeframe, dispatch]);

  const kpi = stats?.kpi;

  // ── 7-Day Performance Timeline ──────────────────────────────────────────
  const chartTimeline = useMemo(() => {
    const list = [];
    const trends = charts?.dailyTrends || [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayLabel =
        i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const found = trends.find((t: any) => t._id === dateStr || t._id === localDateStr);

      list.push({
        date: dateStr,
        day: dayLabel,
        dayNum: dayNum.toString(),
        sales: found ? Number(found.sales || 0) : 0,
        orders: found ? Number(found.ordersCount || 0) : 0,
      });
    }
    return list;
  }, [charts]);

  const maxSales = useMemo(
    () => Math.max(...chartTimeline.map((item) => item.sales), 1000),
    [chartTimeline],
  );
  const maxOrders = useMemo(
    () => Math.max(...chartTimeline.map((item) => item.orders), 5),
    [chartTimeline],
  );

  const totalPeriodSales = useMemo(
    () => chartTimeline.reduce((acc, curr) => acc + curr.sales, 0),
    [chartTimeline],
  );
  const totalPeriodOrders = useMemo(
    () => chartTimeline.reduce((acc, curr) => acc + curr.orders, 0),
    [chartTimeline],
  );

  const peakDay = useMemo(() => {
    if (chartMetric === "sales") {
      return [...chartTimeline].sort((a, b) => b.sales - a.sales)[0];
    }
    return [...chartTimeline].sort((a, b) => b.orders - a.orders)[0];
  }, [chartTimeline, chartMetric]);

  // ── Payment Methods Breakdown ───────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const raw = charts?.paymentBreakdown || [];

    const isCodId = (id: string) => {
      const s = (id || "").toLowerCase();
      return s.includes("cash") || s.includes("cod");
    };

    const codItems = raw.filter((p: any) => isCodId(p._id));
    const digitalItems = raw.filter(
      (p: any) => !isCodId(p._id) && (p._id || "").toLowerCase() !== "replacement (no charge)",
    );

    const codAmount = codItems.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
    const codCount = codItems.reduce((acc: number, c: any) => acc + (c.count || 0), 0);
    const digitalAmount = digitalItems.reduce(
      (acc: number, c: any) => acc + (c.amount || 0),
      0,
    );
    const digitalCount = digitalItems.reduce(
      (acc: number, c: any) => acc + (c.count || 0),
      0,
    );

    const grandTotal = codAmount + digitalAmount || 1;

    return [
      {
        id: "cod",
        label: "Cash On Delivery (COD)",
        icon: "cash-multiple",
        color: "#F59E0B",
        gradient: ["#F59E0B", "#D97706"] as [string, string],
        bgLight: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
        amount: codAmount,
        count: codCount,
        pct: Math.round((codAmount / grandTotal) * 100),
      },
      {
        id: "digital",
        label: "Digital & Online (Khalti / Card / eSewa)",
        icon: "credit-card-check-outline",
        color: "#0284C7",
        gradient: ["#0284C7", "#0369A1"] as [string, string],
        bgLight: isDark ? "rgba(2, 132, 199, 0.15)" : "#E0F2FE",
        amount: digitalAmount,
        count: digitalCount,
        pct: Math.round((digitalAmount / grandTotal) * 100),
      },
    ];
  }, [charts, isDark]);

  // ── Fulfillment Pipeline ────────────────────────────────────────────────
  const fulfillmentMetrics = useMemo(() => {
    const total = kpi?.orders?.total || 0;
    const completed = kpi?.orders?.completed || 0;
    const pending = kpi?.orders?.pending || 0;
    const safeTotal = total > 0 ? total : 1;

    return {
      total,
      completed,
      pending,
      completedPct: total > 0 ? Math.round((completed / safeTotal) * 100) : 0,
      pendingPct: total > 0 ? Math.round((pending / safeTotal) * 100) : 0,
    };
  }, [kpi]);

  // Premium Theme Colors
  const bg = isDark ? "#0A0F14" : "#F8FAFC";
  const cardBg = isDark ? "#121922" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  // Card Width for Shortcuts
  const shortcutContainerWidth =
    windowWidth - horizontalPadding * 2 - scale(32);
  const shortcutItemWidth = Math.max(
    scale(56),
    (shortcutContainerWidth - scale(10) * 4) / 5,
  );

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="BhansaMart Console"
        subtitle="Executive KPI & Operations Overview"
      />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + scale(48),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            colors={["#0284C7"]}
            tintColor="#0284C7"
          />
        }
      >
        {/* ── Top Executive Welcome & Timeframe Filter ───────────────── */}
        <View style={styles.topBar}>
          <View style={styles.headerInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeTitle, { color: textPrimary }]}>
                Executive Performance Console
              </Text>
              <Text style={[styles.welcomeSub, { color: textSecondary }]}>
                Real-time metrics synchronized with BhansaMart central cluster
              </Text>
            </View>
            <View style={styles.livePulseContainer}>
              <View style={styles.livePulseDot} />
              <Text style={styles.livePulseText}>LIVE</Text>
            </View>
          </View>

          {/* Timeframe Selector Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {TIMEFRAMES.map((tf) => {
              const isActive = selectedTimeframe === tf.id;
              return (
                <TouchableOpacity
                  key={tf.id}
                  style={[
                    styles.timeframePill,
                    isActive && styles.timeframePillActive,
                    !isActive && {
                      backgroundColor: isDark ? "#16202A" : "#F1F5F9",
                      borderColor: border,
                    },
                  ]}
                  onPress={() => setSelectedTimeframe(tf.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeframeText,
                      isActive && styles.timeframeTextActive,
                      !isActive && { color: textSecondary },
                    ]}
                  >
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Financial KPI Banner (Superadmin Commission Terminal) ─────── */}
        {isSuperAdmin && kpi?.finances ? (
          <LinearGradient
            colors={
              isDark
                ? (["#064E3B", "#022C22"] as const)
                : (["#ECFDF5", "#D1FAE5"] as const)
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.financeBannerCard,
              { borderColor: isDark ? "#059669" : "#A7F3D0" },
            ]}
          >
            <View style={styles.financeBannerHeader}>
              <View style={styles.financeTitleRow}>
                <View
                  style={[
                    styles.crownBadgeBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.25)"
                        : "rgba(16, 185, 129, 0.15)",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={scale(20)}
                    color="#10B981"
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.financeBannerTitle,
                      { color: isDark ? "#F8FAFC" : "#065F46" },
                    ]}
                  >
                    Platform Commission Engine
                  </Text>
                  <Text
                    style={[
                      styles.financeBannerSub,
                      { color: isDark ? "#A7F3D0" : "#047857" },
                    ]}
                  >
                    Central Fixed 1.5% Net Auto-Settled Ledger
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.financeStatsGrid}>
              <View
                style={[
                  styles.financeStatItem,
                  {
                    backgroundColor: isDark
                      ? "rgba(0, 0, 0, 0.25)"
                      : "rgba(255, 255, 255, 0.65)",
                    borderColor: isDark ? "#065F46" : "#A7F3D0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.financeStatLabel,
                    { color: isDark ? "#A7F3D0" : "#047857" },
                  ]}
                >
                  Net 1.5% Earned
                </Text>
                <Text
                  style={[
                    styles.financeStatValue,
                    { color: isDark ? "#34D399" : "#065F46" },
                  ]}
                  numberOfLines={1}
                >
                  NPR {(kpi.finances.netCommissionEarned || 0).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.financeStatItem,
                  {
                    backgroundColor: isDark
                      ? "rgba(0, 0, 0, 0.25)"
                      : "rgba(255, 255, 255, 0.65)",
                    borderColor: isDark ? "#065F46" : "#A7F3D0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.financeStatLabel,
                    { color: isDark ? "#94A3B8" : "#475569" },
                  ]}
                >
                  Gross Transacted
                </Text>
                <Text
                  style={[
                    styles.financeStatValue,
                    { color: isDark ? "#F8FAFC" : "#0F172A" },
                  ]}
                  numberOfLines={1}
                >
                  NPR {(kpi.finances.grossTransactions || 0).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.financeStatItem,
                  {
                    backgroundColor: isDark
                      ? "rgba(0, 0, 0, 0.25)"
                      : "rgba(255, 255, 255, 0.65)",
                    borderColor: isDark ? "#065F46" : "#A7F3D0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.financeStatLabel,
                    { color: isDark ? "#94A3B8" : "#475569" },
                  ]}
                >
                  Vendor Net Pool
                </Text>
                <Text
                  style={[
                    styles.financeStatValue,
                    { color: isDark ? "#F8FAFC" : "#0F172A" },
                  ]}
                  numberOfLines={1}
                >
                  NPR {(kpi.finances.vendorGrossEarnings || 0).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.financeStatItem,
                  {
                    backgroundColor: isDark
                      ? "rgba(0, 0, 0, 0.25)"
                      : "rgba(255, 255, 255, 0.65)",
                    borderColor: isDark ? "#065F46" : "#A7F3D0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.financeStatLabel,
                    { color: isDark ? "#FCD34D" : "#B45309" },
                  ]}
                >
                  Pending Payouts
                </Text>
                <Text
                  style={[
                    styles.financeStatValue,
                    { color: isDark ? "#FBBF24" : "#D97706" },
                  ]}
                  numberOfLines={1}
                >
                  {kpi.finances.pendingWithdrawalsCount} Requests
                </Text>
              </View>
            </View>
          </LinearGradient>
        ) : null}

        {/* ── Responsive KPI Metric Cards Grid ─────────────────────────── */}
        <View style={[styles.kpiGrid, { gap: gridGap }]}>
          {/* Orders Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/staffadminScreens/OrdersScreen" as any)}
            style={[
              styles.kpiCard,
              {
                width: kpiCardWidth,
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Total Orders
              </Text>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: "rgba(2, 132, 199, 0.12)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={scale(18)}
                  color="#0284C7"
                />
              </View>
            </View>
            <Text
              style={[styles.kpiValue, { color: textPrimary }]}
              numberOfLines={1}
            >
              {kpi?.orders?.total || 0}
            </Text>
            <View style={styles.kpiBreakdownRow}>
              <View style={styles.kpiChipRow}>
                <View
                  style={[styles.dotIndicator, { backgroundColor: "#10B981" }]}
                />
                <Text style={styles.kpiChipTextSuccess}>
                  {kpi?.orders?.completed || 0} Delivered
                </Text>
              </View>
              <View style={styles.kpiChipRow}>
                <View
                  style={[styles.dotIndicator, { backgroundColor: "#F59E0B" }]}
                />
                <Text style={styles.kpiChipTextWarning}>
                  {kpi?.orders?.pending || 0} Active
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Gross Sales */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                width: kpiCardWidth,
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
            onPress={() => router.navigate("/AdminMain/finance" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Gross Sales
              </Text>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: "rgba(16, 185, 129, 0.12)" },
                ]}
              >
                <Feather name="trending-up" size={scale(18)} color="#10B981" />
              </View>
            </View>
            <Text
              style={[styles.kpiValue, { color: textPrimary }]}
              numberOfLines={1}
            >
              NPR {(kpi?.orders?.grossSales || 0).toLocaleString()}
            </Text>
            <Text
              style={[styles.kpiSub, { color: textSecondary }]}
              numberOfLines={1}
            >
              Settled customer receipts
            </Text>
          </TouchableOpacity>

          {/* Vendors */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                width: kpiCardWidth,
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
            onPress={() => router.navigate("/AdminMain/vendors" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Vendors
              </Text>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: "rgba(168, 85, 247, 0.12)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={scale(18)}
                  color="#A855F7"
                />
              </View>
            </View>
            <Text
              style={[styles.kpiValue, { color: textPrimary }]}
              numberOfLines={1}
            >
              {kpi?.vendors?.total || 0}
            </Text>
            <View style={styles.kpiBreakdownRow}>
              <Text style={styles.kpiChipTextSuccess}>
                {kpi?.vendors?.active || 0} Active Stores
              </Text>
              <Text style={styles.kpiChipTextWarning}>
                {kpi?.vendors?.pendingVerification || 0} Pending KYC
              </Text>
            </View>
          </TouchableOpacity>

          {/* Delivery Fleet */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                width: kpiCardWidth,
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
            onPress={() => router.push("/Screens/adminScreens/delivery" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Delivery Fleet
              </Text>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: "rgba(245, 158, 11, 0.12)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="moped-outline"
                  size={scale(18)}
                  color="#F59E0B"
                />
              </View>
            </View>
            <Text
              style={[styles.kpiValue, { color: textPrimary }]}
              numberOfLines={1}
            >
              {kpi?.deliveryBoys?.total || 0}
            </Text>
            <Text style={styles.kpiChipTextSuccess} numberOfLines={1}>
              🟢 {kpi?.deliveryBoys?.online || 0} Active on Radar
            </Text>
          </TouchableOpacity>

          {/* Customers */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                width: kpiCardWidth,
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
            onPress={() =>
              router.push("/Screens/adminScreens/customers" as any)
            }
            activeOpacity={0.7}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Customers
              </Text>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: "rgba(59, 130, 246, 0.12)" },
                ]}
              >
                <Feather name="users" size={scale(18)} color="#3B82F6" />
              </View>
            </View>
            <Text
              style={[styles.kpiValue, { color: textPrimary }]}
              numberOfLines={1}
            >
              {kpi?.customers?.total || 0}
            </Text>
            <Text
              style={[styles.kpiSub, { color: textSecondary }]}
              numberOfLines={1}
            >
              {kpi?.customers?.active || 0} Active users
            </Text>
          </TouchableOpacity>

          {/* Support Tickets */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                width: kpiCardWidth,
                backgroundColor: cardBg,
                borderColor: border,
              },
            ]}
            onPress={() => router.push("/Screens/adminScreens/tickets" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Open Tickets
              </Text>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: "rgba(239, 68, 68, 0.12)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="ticket-outline"
                  size={scale(18)}
                  color="#EF4444"
                />
              </View>
            </View>
            <Text
              style={[styles.kpiValue, { color: "#EF4444" }]}
              numberOfLines={1}
            >
              {kpi?.tickets?.open || 0}
            </Text>
            <Text
              style={[styles.kpiSub, { color: textSecondary }]}
              numberOfLines={1}
            >
              Disputes requiring resolution
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Operational Quick Shortcuts ──────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scale(8),
              }}
            >
              <View
                style={[
                  styles.sectionIconBadge,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={scale(16)}
                  color="#0284C7"
                />
              </View>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Operational Quick Launch
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
              Single-Tap Navigation
            </Text>
          </View>

          <View style={styles.shortcutsGrid}>
            <TouchableOpacity
              style={[styles.shortcutBtn, { width: shortcutItemWidth }]}
              onPress={() => router.navigate("/AdminMain/vendors" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(2, 132, 199, 0.2)"
                      : "#E0F2FE",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="storefront-check"
                  size={scale(22)}
                  color="#0284C7"
                />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: textPrimary }]}
                numberOfLines={2}
              >
                Review Vendors
              </Text>
            </TouchableOpacity>

            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.shortcutBtn, { width: shortcutItemWidth }]}
                onPress={() =>
                  router.push("/Screens/adminScreens/admins" as any)
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.shortcutIcon,
                    {
                      backgroundColor: isDark
                        ? "rgba(126, 34, 206, 0.2)"
                        : "#F3E8FF",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={scale(22)}
                    color="#7E22CE"
                  />
                </View>
                <Text
                  style={[styles.shortcutLabel, { color: textPrimary }]}
                  numberOfLines={2}
                >
                  Staff Admins
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.shortcutBtn, { width: shortcutItemWidth }]}
              onPress={() => router.navigate("/AdminMain/catalog" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(217, 119, 6, 0.2)"
                      : "#FEF3C7",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={scale(22)}
                  color="#D97706"
                />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: textPrimary }]}
                numberOfLines={2}
              >
                Master Catalog
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutBtn, { width: shortcutItemWidth }]}
              onPress={() => router.push("/Screens/adminScreens/map" as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(21, 128, 61, 0.2)"
                      : "#DCFCE7",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={scale(22)}
                  color="#15803D"
                />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: textPrimary }]}
                numberOfLines={2}
              >
                Fleet Radar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutBtn, { width: shortcutItemWidth }]}
              onPress={() =>
                router.push("/Screens/adminScreens/notifications" as any)
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shortcutIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(225, 29, 72, 0.2)"
                      : "#FFE4E6",
                  },
                ]}
              >
                <Feather name="bell" size={scale(20)} color="#E11D48" />
              </View>
              <Text
                style={[styles.shortcutLabel, { color: textPrimary }]}
                numberOfLines={2}
              >
                Broadcast
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 7-Day Performance Charts (Responsive & Interactive) ──────── */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          {/* Header & Toggle */}
          <View style={styles.chartHeader}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scale(6),
                }}
              >
                <MaterialCommunityIcons
                  name="chart-bell-curve-cumulative"
                  size={scale(18)}
                  color="#0284C7"
                />
                <Text style={[styles.chartCardTitle, { color: textPrimary }]}>
                  Platform Trends & Volumes
                </Text>
              </View>
              <Text
                style={[styles.chartCardSubtitle, { color: textSecondary }]}
              >
                7-day operational tracking across all vendors
              </Text>
            </View>

            {/* Metric Switcher */}
            <View
              style={[
                styles.metricToggleBox,
                { backgroundColor: isDark ? "#0D1318" : "#F1F5F9" },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.metricBtn,
                  chartMetric === "sales" && styles.metricBtnActive,
                ]}
                onPress={() => setChartMetric("sales")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.metricBtnText,
                    chartMetric === "sales" && styles.metricBtnTextActive,
                  ]}
                >
                  Revenue
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.metricBtn,
                  chartMetric === "orders" && styles.metricBtnActive,
                ]}
                onPress={() => setChartMetric("orders")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.metricBtnText,
                    chartMetric === "orders" && styles.metricBtnTextActive,
                  ]}
                >
                  Orders
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Period Summary KPI Strip */}
          <View
            style={[
              styles.periodSummaryStrip,
              {
                backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                borderColor: border,
              },
            ]}
          >
            <View style={styles.periodStatItem}>
              <Text style={[styles.periodStatLabel, { color: textSecondary }]}>
                {chartMetric === "sales" ? "Period Volume" : "Period Orders"}
              </Text>
              <Text style={[styles.periodStatValue, { color: textPrimary }]}>
                {chartMetric === "sales"
                  ? `NPR ${totalPeriodSales.toLocaleString()}`
                  : `${totalPeriodOrders} Orders`}
              </Text>
            </View>

            <View
              style={[
                styles.periodStatDivider,
                { backgroundColor: isDark ? "#2A3644" : "#E2E8F0" },
              ]}
            />

            <View style={styles.periodStatItem}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scale(4),
                }}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={scale(11)}
                  color="#10B981"
                />
                <Text
                  style={[styles.periodStatLabel, { color: textSecondary }]}
                >
                  Peak ({peakDay?.day || "N/A"})
                </Text>
              </View>
              <Text style={[styles.periodStatValue, { color: "#10B981" }]}>
                {chartMetric === "sales"
                  ? `NPR ${(peakDay?.sales || 0).toLocaleString()}`
                  : `${peakDay?.orders || 0} Orders`}
              </Text>
            </View>
          </View>

          {/* Dynamic Responsive Bar Chart Visualization */}
          <View
            style={[
              styles.chartBarsContainer,
              { height: isTablet ? scale(160) : scale(135) },
            ]}
          >
            {chartTimeline.map((item) => {
              const value = chartMetric === "sales" ? item.sales : item.orders;
              const maxVal = chartMetric === "sales" ? maxSales : maxOrders;
              const heightPct = Math.max(
                12,
                Math.min(100, Math.round((value / maxVal) * 100)),
              );
              const isPeak =
                value > 0 &&
                (chartMetric === "sales"
                  ? item.sales === peakDay?.sales
                  : item.orders === peakDay?.orders);

              return (
                <View key={item.date} style={styles.chartColumn}>
                  {/* Value Above Bar */}
                  <View style={styles.valueTagBox}>
                    {isPeak && (
                      <View style={styles.peakCrownDot}>
                        <MaterialCommunityIcons
                          name="crown"
                          size={scale(10)}
                          color="#10B981"
                        />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.chartBarValue,
                        {
                          color: isPeak
                            ? "#10B981"
                            : isDark
                              ? "#94A3B8"
                              : "#64748B",
                          fontWeight: isPeak ? "800" : "600",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {chartMetric === "sales"
                        ? value >= 1000
                          ? `${(value / 1000).toFixed(1)}k`
                          : `${value}`
                        : `${value}`}
                    </Text>
                  </View>

                  {/* Vertical Bar Column */}
                  <View
                    style={[
                      styles.chartBarTrack,
                      {
                        backgroundColor: isDark ? "#1A232E" : "#F1F5F9",
                        borderColor: isDark ? "#243242" : "#E2E8F0",
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isPeak
                          ? (["#34D399", "#059669"] as const)
                          : chartMetric === "sales"
                            ? (["#38BDF8", "#0284C7"] as const)
                            : (["#A78BFA", "#7C3AED"] as const)
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.chartBarFill,
                        {
                          height: `${heightPct}%`,
                        },
                      ]}
                    />
                  </View>

                  {/* Day Label with Date */}
                  <View style={{ alignItems: "center", marginTop: scale(6) }}>
                    <Text
                      style={[
                        styles.chartDayLabel,
                        {
                          color: isPeak
                            ? "#0284C7"
                            : isDark
                              ? "#CBD5E1"
                              : "#475569",
                          fontWeight: isPeak ? "800" : "600",
                        },
                      ]}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={[styles.chartDateNum, { color: textSecondary }]}
                    >
                      {item.dayNum}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Payment Settlement Channels Breakdown ────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: cardBg,
              borderColor: border,
              marginTop: scale(16),
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scale(8),
              }}
            >
              <View
                style={[
                  styles.sectionIconBadge,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <MaterialCommunityIcons
                  name="wallet-membership"
                  size={scale(16)}
                  color="#10B981"
                />
              </View>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Payment Settlement Mix
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
              Channel Proportions
            </Text>
          </View>

          <View style={{ gap: scale(12) }}>
            {paymentBreakdown.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.paymentItemCard,
                  {
                    backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
              >
                <View style={styles.paymentItemHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scale(12),
                    }}
                  >
                    <View
                      style={[
                        styles.paymentIconBox,
                        { backgroundColor: item.bgLight },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={scale(20)}
                        color={item.color}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.paymentItemLabel,
                          { color: textPrimary },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.paymentItemSub,
                          { color: textSecondary },
                        ]}
                      >
                        {item.count} orders processed
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[styles.paymentItemAmount, { color: textPrimary }]}
                    >
                      NPR {item.amount.toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.pctPill,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(0, 0, 0, 0.04)",
                        },
                      ]}
                    >
                      <Text
                        style={[styles.paymentItemPct, { color: item.color }]}
                      >
                        {item.pct}% share
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Meter Bar with Gradient */}
                <View
                  style={[
                    styles.paymentProgressBarTrack,
                    { backgroundColor: isDark ? "#243242" : "#E2E8F0" },
                  ]}
                >
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.paymentProgressBarFill,
                      {
                        width: `${Math.max(6, item.pct)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Operational Order Health & Pipeline ──────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: cardBg,
              borderColor: border,
              marginTop: scale(16),
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scale(8),
              }}
            >
              <View
                style={[
                  styles.sectionIconBadge,
                  { backgroundColor: "rgba(2, 132, 199, 0.12)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="shield-airplane"
                  size={scale(16)}
                  color="#0284C7"
                />
              </View>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Order Fulfillment Health
              </Text>
            </View>
            <View style={styles.successRateBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={scale(13)}
                color="#10B981"
              />
              <Text style={styles.successRateText}>
                {fulfillmentMetrics.completedPct}% Success
              </Text>
            </View>
          </View>

          {/* Segmented Pipeline Meter */}
          <View
            style={[
              styles.fulfillmentMeterTrack,
              { backgroundColor: isDark ? "#243242" : "#E2E8F0" },
            ]}
          >
            <View
              style={[
                styles.fulfillmentMeterSegment,
                {
                  width: `${fulfillmentMetrics.completedPct}%`,
                  backgroundColor: "#10B981",
                },
              ]}
            />
            <View
              style={[
                styles.fulfillmentMeterSegment,
                {
                  width: `${fulfillmentMetrics.pendingPct}%`,
                  backgroundColor: "#F59E0B",
                },
              ]}
            />
          </View>

          {/* Fulfillment Legend */}
          <View style={styles.fulfillmentLegendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#10B981" }]}
              />
              <Text style={[styles.legendText, { color: textSecondary }]}>
                Delivered ({fulfillmentMetrics.completed})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#F59E0B" }]}
              />
              <Text style={[styles.legendText, { color: textSecondary }]}>
                In Pipeline ({fulfillmentMetrics.pending})
              </Text>
            </View>
          </View>
        </View>
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
    paddingTop: scale(14),
  },

  /* ── Header Bar ── */
  topBar: {
    marginBottom: scale(16),
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  welcomeTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: moderateScale(11.5),
    marginTop: scale(2),
    lineHeight: scale(16),
  },
  livePulseContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    gap: scale(5),
  },
  livePulseDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#10B981",
  },
  livePulseText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  filterScroll: {
    gap: scale(8),
    paddingVertical: scale(2),
  },
  timeframePill: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(7),
    borderRadius: scale(18),
    borderWidth: 1,
  },
  timeframePillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  timeframeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  timeframeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* ── Financial KPI Banner ── */
  financeBannerCard: {
    borderRadius: scale(16),
    borderWidth: 1.5,
    padding: scale(16),
    marginBottom: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  financeBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  financeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  crownBadgeBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  financeBannerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  financeBannerSub: {
    fontSize: moderateScale(10.5),
    marginTop: scale(1),
    fontWeight: "600",
  },
  viewLedgerBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  viewLedgerLink: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  financeStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(8),
  },
  financeStatItem: {
    width: "48.5%",
    borderRadius: scale(12),
    borderWidth: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
  },
  financeStatLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  financeStatValue: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: scale(3),
    letterSpacing: -0.2,
  },

  /* ── KPI Grid ── */
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: scale(16),
  },
  kpiCard: {
    borderRadius: scale(15),
    borderWidth: 1,
    padding: scale(14),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  kpiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  kpiLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  kpiIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    marginBottom: scale(4),
    letterSpacing: -0.3,
  },
  kpiSub: {
    fontSize: moderateScale(10.5),
  },
  kpiBreakdownRow: {
    flexDirection: "column",
    gap: scale(2),
  },
  kpiChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  dotIndicator: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
  },
  kpiChipTextSuccess: {
    fontSize: moderateScale(10.5),
    color: "#10B981",
    fontWeight: "600",
  },
  kpiChipTextWarning: {
    fontSize: moderateScale(10.5),
    color: "#F59E0B",
    fontWeight: "600",
  },

  /* ── Operational Quick Shortcuts ── */
  sectionCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  sectionIconBadge: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(7),
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  shortcutsGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  shortcutBtn: {
    alignItems: "center",
  },
  shortcutIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(15),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(6),
  },
  shortcutLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    textAlign: "center",
    lineHeight: scale(13),
  },

  /* ── 7-Day Performance Charts ── */
  chartCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    marginTop: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  chartCardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  chartCardSubtitle: {
    fontSize: moderateScale(10.5),
    marginTop: scale(2),
  },
  metricToggleBox: {
    flexDirection: "row",
    borderRadius: scale(10),
    padding: scale(3),
  },
  metricBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(8),
  },
  metricBtnActive: {
    backgroundColor: "#0284C7",
  },
  metricBtnText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#64748B",
  },
  metricBtnTextActive: {
    color: "#FFFFFF",
  },
  periodSummaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: scale(12),
    borderWidth: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    marginBottom: scale(18),
  },
  periodStatItem: {
    alignItems: "center",
  },
  periodStatLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  periodStatValue: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginTop: scale(2),
  },
  periodStatDivider: {
    width: 1,
    height: scale(26),
  },
  chartBarsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: scale(16),
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  valueTagBox: {
    alignItems: "center",
    minHeight: scale(20),
    justifyContent: "flex-end",
    marginBottom: scale(4),
  },
  peakCrownDot: {
    marginBottom: scale(1),
  },
  chartBarValue: {
    fontSize: moderateScale(8.5),
  },
  chartBarTrack: {
    width: "42%",
    maxWidth: scale(22),
    minWidth: scale(14),
    height: "65%",
    borderRadius: scale(7),
    overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: 0.5,
  },
  chartBarFill: {
    width: "100%",
    borderTopLeftRadius: scale(7),
    borderTopRightRadius: scale(7),
  },
  chartDayLabel: {
    fontSize: moderateScale(10),
  },
  chartDateNum: {
    fontSize: moderateScale(8.5),
    marginTop: scale(1),
  },

  /* ── Payment Breakdown ── */
  paymentItemCard: {
    borderRadius: scale(13),
    borderWidth: 1,
    padding: scale(12),
  },
  paymentItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  paymentIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(11),
    alignItems: "center",
    justifyContent: "center",
  },
  paymentItemLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  paymentItemSub: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  paymentItemAmount: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  pctPill: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    marginTop: scale(2),
  },
  paymentItemPct: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  paymentProgressBarTrack: {
    height: scale(6),
    borderRadius: scale(3),
    overflow: "hidden",
  },
  paymentProgressBarFill: {
    height: "100%",
    borderRadius: scale(3),
  },

  /* ── Fulfillment Styles ── */
  successRateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(10),
    gap: scale(4),
  },
  successRateText: {
    fontSize: moderateScale(10),
    color: "#10B981",
    fontWeight: "800",
  },
  fulfillmentMeterTrack: {
    height: scale(10),
    borderRadius: scale(5),
    overflow: "hidden",
    flexDirection: "row",
    marginVertical: scale(10),
  },
  fulfillmentMeterSegment: {
    height: "100%",
  },
  fulfillmentLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
    marginTop: scale(4),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  legendDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
  },
  legendText: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
});
