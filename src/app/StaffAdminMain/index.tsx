import AdminStoreFilterDropdown, {
  getStoreDisplayName,
} from "@/components/AdminStoreFilterDropdown";
import DashboardStatCard from "@/components/staffAdminComponent/DashboardStatCard";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";
import SalesChart from "@/components/staffAdminComponent/SalesChart";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import { useAppSelector } from "@/store/hooks";
import {
  fetchStaffAssignedVendorsApi,
  fetchStaffDashboardOverviewApi,
} from "@/store/services/adminService";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const TIMEFRAMES = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7days", label: "7 Days" },
  { id: "30days", label: "30 Days" },
  { id: "thisMonth", label: "This Month" },
];

export default function StaffAdminDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const { width: windowWidth } = useWindowDimensions();

  const user = useAppSelector((state) => state.auth.user);

  // Responsive Grid
  const isTablet = windowWidth >= 768;
  const kpiColumns = isTablet ? 4 : 2;
  const paddingH = isTablet ? scale(24) : scale(16);
  const gap = isTablet ? scale(14) : scale(10);
  const cardWidth =
    (windowWidth - paddingH * 2 - gap * (kpiColumns - 1)) / kpiColumns;

  // State
  const [selectedTimeframe, setSelectedTimeframe] = useState("today");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Assigned Vendors
  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors) {
        setAssignedVendors(res.vendors);
      }
    } catch (err: any) {
      console.error("[StaffAdmin] Error fetching assigned vendors:", {
        message: err?.message,
        statusCode: err?.statusCode,
        raw: err?.raw,
      });
    }
  };

  // Load Overview Data
  const loadDashboard = async () => {
    try {
      setError(null);
      const res = await fetchStaffDashboardOverviewApi({
        timeframe: selectedTimeframe,
        vendorId: selectedVendorId !== "all" ? selectedVendorId : undefined,
      });
      if (res?.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error("[StaffAdmin Dashboard] Failed to load dashboard data:", {
        message: err?.message,
        statusCode: err?.statusCode,
        errors: err?.errors,
        raw: err?.raw,
        stack: err?.stack || err?.raw?.stack,
      });
      setError(
        err?.message ||
          err?.raw?.message ||
          "Failed to load dashboard data. Tap retry."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (error) {
      console.warn("[StaffAdmin Dashboard State Error]:", error);
    }
  }, [error]);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard();
  }, [selectedTimeframe, selectedVendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVendors();
    loadDashboard();
  };

  const kpi = dashboardData?.kpi || {
    totalVendors: 0,
    activeVendors: 0,
    inactiveVendors: 0,
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    grossSales: 0,
    deliveredSales: 0,
    codSales: 0,
    onlineSales: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  };

  const tasks = dashboardData?.pendingTasks || {
    pendingRefunds: 0,
    pendingBrands: 0,
    pendingWithdrawals: 0,
    openTickets: 0,
    activeDeliveries: 0,
    totalPendingTasks: 0,
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const selectedStoreObj = useMemo(() => {
    if (selectedVendorId === "all") return null;
    return (
      assignedVendors.find((v) => (v._id || v.id) === selectedVendorId) || null
    );
  }, [assignedVendors, selectedVendorId]);

  const selectedStoreName = selectedStoreObj
    ? getStoreDisplayName(selectedStoreObj)
    : `All Assigned Stores (${assignedVendors.length})`;

  return (
    <View
      style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}
    >
      {/* 1. Header */}
      <StaffAdminHeader
        title="BhansaMart Ops"
        subtitle={selectedStoreName}
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: paddingH },
        ]}
      >
        {/* 2. Store Scope Switcher */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Assigned Store Scope
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            All metrics reflect assigned stores only
          </Text>
        </View>

        <AdminStoreFilterDropdown
          vendors={assignedVendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
          title="Assigned Vendors Filter"
        />

        {/* 3. Timeframe Filter Pills */}
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf) => {
            const isSelected = selectedTimeframe === tf.id;
            return (
              <TouchableOpacity
                key={tf.id}
                activeOpacity={0.7}
                onPress={() => setSelectedTimeframe(tf.id)}
                style={[
                  styles.timeframePill,
                  {
                    backgroundColor: isSelected
                      ? "#0284C7"
                      : isDark
                        ? "#151D24"
                        : "#FFFFFF",
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading Spinner / Error */}
        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Calculating scoped metrics...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={scale(20)}
              color="#EF4444"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                console.log("[StaffAdmin] Retrying dashboard load...");
                setLoading(true);
                loadDashboard();
              }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Priority Operational Action Items (Pending Work) */}
        <View style={styles.sectionHeader}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: scale(6),
            }}
          >
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Operational Pending Work
            </Text>
            {tasks.totalPendingTasks > 0 && (
              <View style={styles.taskCountBadge}>
                <Text style={styles.taskCountText}>
                  {tasks.totalPendingTasks}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Actions requiring StaffAdmin review
          </Text>
        </View>

        <View style={styles.actionItemsRow}>
          {/* Refund Review Queue */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/ReturnsRefundsScreen" as any,
              )
            }
            style={[
              styles.actionItemCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: "rgba(220, 38, 38, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="keyboard-return"
                size={scale(20)}
                color="#DC2626"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.actionTitleRow}>
                <Text style={[styles.actionCardTitle, { color: textPrimary }]}>
                  Refund Claims
                </Text>
                {tasks.pendingRefunds > 0 && (
                  <View
                    style={[styles.pillAlert, { backgroundColor: "#FEF2F2" }]}
                  >
                    <Text style={[styles.pillAlertText, { color: "#DC2626" }]}>
                      {tasks.pendingRefunds} Pending
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.actionCardSubtitle, { color: textSecondary }]}
              >
                Vendor-accepted returns for examination
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={scale(16)}
              color={textSecondary}
            />
          </TouchableOpacity>

          {/* Brand Review Queue */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/BrandSubmissionsScreen" as any,
              )
            }
            style={[
              styles.actionItemCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: "rgba(124, 58, 237, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="certificate-outline"
                size={scale(20)}
                color="#7C3AED"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.actionTitleRow}>
                <Text style={[styles.actionCardTitle, { color: textPrimary }]}>
                  Brand Submissions
                </Text>
                {tasks.pendingBrands > 0 && (
                  <View
                    style={[styles.pillAlert, { backgroundColor: "#F5F3FF" }]}
                  >
                    <Text style={[styles.pillAlertText, { color: "#7C3AED" }]}>
                      {tasks.pendingBrands} Review
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.actionCardSubtitle, { color: textSecondary }]}
              >
                Vendor brand logos & certificates
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={scale(16)}
              color={textSecondary}
            />
          </TouchableOpacity>

          {/* Withdrawal Escalations */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push("/Screens/staffadminScreens/WithdrawalsScreen" as any)
            }
            style={[
              styles.actionItemCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: "rgba(217, 119, 6, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="cash-fast"
                size={scale(20)}
                color="#D97706"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.actionTitleRow}>
                <Text style={[styles.actionCardTitle, { color: textPrimary }]}>
                  Withdrawal Requests
                </Text>
                {tasks.pendingWithdrawals > 0 && (
                  <View
                    style={[styles.pillAlert, { backgroundColor: "#FFFBEB" }]}
                  >
                    <Text style={[styles.pillAlertText, { color: "#D97706" }]}>
                      {tasks.pendingWithdrawals} Pending
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.actionCardSubtitle, { color: textSecondary }]}
              >
                Examine ledger balance & escalate to Superadmin
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={scale(16)}
              color={textSecondary}
            />
          </TouchableOpacity>

          {/* Support Tickets */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push("/Screens/staffadminScreens/TicketsScreen" as any)
            }
            style={[
              styles.actionItemCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: "rgba(37, 99, 235, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="ticket-confirmation-outline"
                size={scale(20)}
                color="#2563EB"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.actionTitleRow}>
                <Text style={[styles.actionCardTitle, { color: textPrimary }]}>
                  Vendor Support Tickets
                </Text>
                {tasks.openTickets > 0 && (
                  <View
                    style={[styles.pillAlert, { backgroundColor: "#EFF6FF" }]}
                  >
                    <Text style={[styles.pillAlertText, { color: "#2563EB" }]}>
                      {tasks.openTickets} Open
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.actionCardSubtitle, { color: textSecondary }]}
              >
                Inquiries, issues & dispute resolutions
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={scale(16)}
              color={textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* 5. Key Operational Metrics (KPIs) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Performance KPIs ({selectedTimeframe})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Calculated from live order and product records
          </Text>
        </View>

        <View style={[styles.kpiGrid, { gap }]}>
          <DashboardStatCard
            title="Delivered Sales"
            value={`Rs. ${kpi.deliveredSales.toLocaleString()}`}
            subtitle={`${kpi.deliveredOrders} orders delivered`}
            icon="currency-usd"
            iconColor="#059669"
            iconBg="rgba(5, 150, 105, 0.12)"
            badgeText={kpi.deliveredSales > 0 ? "Active" : undefined}
            badgeColor="#ECFDF5"
            badgeTextColor="#059669"
            width={cardWidth}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/SalesAnalyticsScreen" as any,
              )
            }
          />

          <DashboardStatCard
            title="Total Orders"
            value={kpi.totalOrders}
            subtitle={`${kpi.pendingOrders} pending, ${kpi.cancelledOrders} cancelled`}
            icon="shopping-outline"
            iconColor="#0284C7"
            iconBg="rgba(2, 132, 199, 0.12)"
            width={cardWidth}
            onPress={() =>
              router.push("/Screens/staffadminScreens/OrdersScreen" as any)
            }
          />

          <DashboardStatCard
            title="Assigned Stores"
            value={kpi.totalVendors}
            subtitle={`${kpi.activeVendors} open, ${kpi.inactiveVendors} closed`}
            icon="storefront-outline"
            iconColor="#7C3AED"
            iconBg="rgba(124, 58, 237, 0.12)"
            width={cardWidth}
            onPress={() => router.push("/StaffAdminMain/vendors" as any)}
          />

          <DashboardStatCard
            title="Catalog Items"
            value={kpi.totalProducts}
            subtitle={`${kpi.activeProducts} active, ${kpi.outOfStockProducts} out of stock`}
            icon="cube-outline"
            iconColor="#D97706"
            iconBg="rgba(217, 119, 6, 0.12)"
            badgeText={
              kpi.outOfStockProducts > 0
                ? `${kpi.outOfStockProducts} Low`
                : undefined
            }
            badgeColor="#FEF2F2"
            badgeTextColor="#DC2626"
            width={cardWidth}
            onPress={() =>
              router.push("/Screens/staffadminScreens/ProductsScreen" as any)
            }
          />

          <DashboardStatCard
            title="COD Collections"
            value={`Rs. ${kpi.codSales.toLocaleString()}`}
            subtitle="Cash with riders / store"
            icon="cash-multiple"
            iconColor="#0D9488"
            iconBg="rgba(13, 148, 136, 0.12)"
            width={cardWidth}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/CODReconciliationScreen" as any,
              )
            }
          />

          <DashboardStatCard
            title="Digital Sales"
            value={`Rs. ${kpi.onlineSales.toLocaleString()}`}
            subtitle="Wallets & Card payments"
            icon="credit-card-check-outline"
            iconColor="#4F46E5"
            iconBg="rgba(79, 70, 229, 0.12)"
            width={cardWidth}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/SalesAnalyticsScreen" as any,
              )
            }
          />
        </View>

        {/* 6. 7-Day Performance Timeline Chart */}
        <View style={{ marginTop: moderateScale(16) }}>
          <SalesChart
            data={dashboardData?.dailyTrends || []}
            title="7-Day Performance Trend"
          />
        </View>

        {/* 7. Quick Operational Access Hub */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Operational Modules
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Direct access to assigned store operations
          </Text>
        </View>

        <View style={styles.modulesGrid}>
          <TouchableOpacity
            style={[
              styles.moduleCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push("/Screens/staffadminScreens/ProductsScreen" as any)
            }
          >
            <View
              style={[styles.moduleIconBox, { backgroundColor: "#EFF6FF" }]}
            >
              <MaterialCommunityIcons
                name="cube-scan"
                size={scale(20)}
                color="#2563EB"
              />
            </View>
            <Text style={[styles.moduleTitle, { color: textPrimary }]}>
              Product Moderation
            </Text>
            <Text style={[styles.moduleDesc, { color: textSecondary }]}>
              Stock, pricing & approvals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.moduleCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push("/Screens/staffadminScreens/OrdersScreen" as any)
            }
          >
            <View
              style={[styles.moduleIconBox, { backgroundColor: "#ECFDF5" }]}
            >
              <MaterialCommunityIcons
                name="package-variant"
                size={scale(20)}
                color="#059669"
              />
            </View>
            <Text style={[styles.moduleTitle, { color: textPrimary }]}>
              Order Tracking
            </Text>
            <Text style={[styles.moduleDesc, { color: textSecondary }]}>
              Live fulfillment status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.moduleCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/DeliveryManagementScreen" as any,
              )
            }
          >
            <View
              style={[styles.moduleIconBox, { backgroundColor: "#F0FDF4" }]}
            >
              <MaterialCommunityIcons
                name="moped"
                size={scale(20)}
                color="#059669"
              />
            </View>
            <Text style={[styles.moduleTitle, { color: textPrimary }]}>
              Rider Fleet
            </Text>
            <Text style={[styles.moduleDesc, { color: textSecondary }]}>
              Deliveries & assignments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.moduleCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/Screens/staffadminScreens/CODReconciliationScreen" as any,
              )
            }
          >
            <View
              style={[styles.moduleIconBox, { backgroundColor: "#FFFBEB" }]}
            >
              <MaterialCommunityIcons
                name="cash-register"
                size={scale(20)}
                color="#D97706"
              />
            </View>
            <Text style={[styles.moduleTitle, { color: textPrimary }]}>
              COD Reconciliation
            </Text>
            <Text style={[styles.moduleDesc, { color: textSecondary }]}>
              Cash audit & disputes
            </Text>
          </TouchableOpacity>
        </View>

        {/* 8. Recent Orders Feed */}
        <View style={styles.sectionHeader}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <View>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Recent Orders
              </Text>
              <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                Latest orders from assigned stores
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push("/Screens/staffadminScreens/OrdersScreen" as any)
              }
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="arrow-right" size={scale(13)} color="#0284C7" />
            </TouchableOpacity>
          </View>
        </View>

        {dashboardData?.recentOrders?.length > 0 ? (
          <View style={styles.recentList}>
            {dashboardData.recentOrders.map((ord: any) => (
              <View
                key={ord._id}
                style={[
                  styles.recentItemCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.recentHeaderRow}>
                  <View style={{ gap: moderateScale(2) }}>
                    <Text
                      style={[styles.orderNumberText, { color: textPrimary }]}
                    >
                      #{ord.orderNumber}
                    </Text>
                    <Text
                      style={[styles.recentStoreName, { color: textSecondary }]}
                    >
                      Store: {ord.vendorName}
                    </Text>
                  </View>
                  <RequestStatusBadge status={ord.orderStatus} type="order" />
                </View>

                <View
                  style={[
                    styles.recentMetaRow,
                    { borderTopColor: isDark ? "#222D35" : "#F1F5F9" },
                  ]}
                >
                  <Text style={[styles.metaPrice, { color: textPrimary }]}>
                    Rs. {Number(ord.totalAmount || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.metaPayment, { color: textSecondary }]}>
                    {ord.paymentMethod} ({ord.paymentStatus})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <MaterialCommunityIcons
              name="cart-off"
              size={scale(28)}
              color={textSecondary}
            />
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              No recent orders in this timeframe.
            </Text>
          </View>
        )}

        <View style={{ height: moderateScale(40) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(30),
  },
  sectionHeader: {
    marginTop: moderateScale(14),
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    marginTop: moderateScale(1),
  },
  taskCountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(1),
  },
  taskCountText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  timeframeRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: moderateScale(8),
    marginBottom: moderateScale(10),
    flexWrap: "wrap",
  },
  timeframePill: {
    paddingHorizontal: scale(11),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  timeframeText: {
    fontSize: moderateScale(11),
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: moderateScale(12),
  },
  loadingText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: scale(10),
    padding: scale(12),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginVertical: moderateScale(8),
  },
  errorText: {
    fontSize: moderateScale(12),
    color: "#DC2626",
    flex: 1,
  },
  retryBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  actionItemsRow: {
    gap: moderateScale(8),
  },
  actionItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(10),
  },
  actionIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: scale(4),
  },
  actionCardTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  actionCardSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "400",
    marginTop: moderateScale(2),
  },
  pillAlert: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(1.5),
    borderRadius: scale(6),
  },
  pillAlertText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
  },
  moduleCard: {
    width: "48%",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(4),
  },
  moduleIconBox: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  moduleTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  moduleDesc: {
    fontSize: moderateScale(10.5),
    fontWeight: "400",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  viewAllText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0284C7",
  },
  recentList: {
    gap: moderateScale(8),
  },
  recentItemCard: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(8),
  },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderNumberText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  recentStoreName: {
    fontSize: moderateScale(11),
    fontWeight: "500",
  },
  recentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(6),
    borderTopWidth: 1,
  },
  metaPrice: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  metaPayment: {
    fontSize: moderateScale(11),
  },
  emptyBox: {
    padding: scale(20),
    borderRadius: scale(12),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
  },
  emptyText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
});
