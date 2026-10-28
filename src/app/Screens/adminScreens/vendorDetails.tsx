import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminVendorDetails,
  reviewAdminWithdrawal,
  updateAdminVendorVerification,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

type DetailTab = "orders" | "transactions" | "claims" | "financials" | "customers" | "products" | "withdrawals" | "risk";

export default function AdminVendorDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const isTablet = windowWidth >= 768;
  const horizontalPadding = isTablet ? scale(24) : scale(16);

  const [activeTab, setActiveTab] = useState<DetailTab>("orders");
  const [refreshing, setRefreshing] = useState(false);

  // Sub-tab filters
  const [orderFilter, setOrderFilter] = useState<"ALL" | "DELIVERED" | "ACTIVE" | "CANCELLED">("ALL");
  const [claimFilter, setClaimFilter] = useState<"ALL" | "REFUND" | "RETURN" | "REPLACEMENT" | "PENDING">("ALL");
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(10);
  const [visibleTxnCount, setVisibleTxnCount] = useState(10);

  // Withdrawal review modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [withdrawalAction, setWithdrawalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [payoutReference, setPayoutReference] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const { currentVendor, loading } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "superadmin";

  const loadDetails = async () => {
    if (id) {
      await dispatch(fetchAdminVendorDetails(id));
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDetails();
    setRefreshing(false);
  };

  // Vendor Data Unpacking
  const vendor = currentVendor?.vendor;
  const stats = currentVendor?.stats || {
    productsCount: 0,
    activeProductsCount: 0,
    ordersCount: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    uniqueCustomersCount: 0,
  };
  const financials = currentVendor?.financials || {
    totalGrossSales: 0,
    totalCommissionPaid: 0,
    netEarnings: 0,
    currentWalletBalance: 0,
    pendingWithdrawalsCount: 0,
    pendingWithdrawalsAmount: 0,
    totalWithdrawalsPaid: 0,
  };
  const customers = currentVendor?.customers || [];
  const orders: any[] = currentVendor?.orders || currentVendor?.recentOrders || [];
  const recentOrders = currentVendor?.recentOrders || orders.slice(0, 15);
  const productTransactions: any[] = currentVendor?.productTransactions || [];
  const claims = currentVendor?.claims || {
    totalClaims: 0,
    refundsCount: 0,
    returnsCount: 0,
    replacementsCount: 0,
    pendingClaimsCount: 0,
    completedClaimsCount: 0,
    totalRefundAmount: 0,
    list: [],
  };
  const products = currentVendor?.products || [];
  const withdrawals = currentVendor?.withdrawals || [];
  const tickets = currentVendor?.tickets || {
    list: [],
    openTicketsCount: 0,
    riskLevel: "LOW",
    riskReason: "No operational issues flagged.",
  };
  const assignedAdmin = currentVendor?.assignedAdmin;

  // Filtered orders & claims
  const filteredOrders = orders.filter((ord: any) => {
    const st = (ord.orderStatus || "").toUpperCase();
    if (orderFilter === "DELIVERED") return st === "DELIVERED" || st === "COMPLETED";
    if (orderFilter === "ACTIVE") return ["PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(st);
    if (orderFilter === "CANCELLED") return ["CANCELLED", "REJECTED", "REFUNDED"].includes(st);
    return true;
  });

  const filteredClaims = (claims.list || []).filter((clm: any) => {
    const ct = (clm.claimType || "").toUpperCase();
    const st = (clm.status || "").toUpperCase();
    if (claimFilter === "REFUND") return ct.includes("REFUND") || ct.includes("CANCEL");
    if (claimFilter === "RETURN") return ct.includes("RETURN") || ct.includes("DEFECT") || ct.includes("WRONG");
    if (claimFilter === "REPLACEMENT") return ct.includes("REPLACE");
    if (claimFilter === "PENDING") return ["REQUESTED", "PROCESSING"].includes(st);
    return true;
  });

  const verificationStatus = (
    vendor?.status ||
    vendor?.verificationStatus ||
    vendor?.businessDetails?.verificationStatus ||
    "approved"
  ).toLowerCase();
  const isApproved = verificationStatus === "approved" || verificationStatus === "active";
  const isPending = verificationStatus === "pending" || verificationStatus === "draft";

  const riskLevel = tickets.riskLevel || "LOW";
  const isHighRisk = riskLevel === "HIGH";
  const isMediumRisk = riskLevel === "MEDIUM";

  // Verification Action
  const handleUpdateVerification = (status: "approved" | "rejected") => {
    Alert.alert(
      "Confirm Store Verification",
      `Are you sure you want to mark ${vendor?.businessDetails?.businessName || "this store"} as '${status.toUpperCase()}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            if (vendor?._id) {
              await dispatch(
                updateAdminVendorVerification({
                  id: vendor._id,
                  verificationStatus: status,
                })
              );
              loadDetails();
            }
          },
        },
      ]
    );
  };

  // Review Withdrawal Action
  const handleConfirmWithdrawalReview = async () => {
    if (!selectedWithdrawal) return;
    if (withdrawalAction === "APPROVE" && !payoutReference.trim()) {
      Alert.alert("Validation", "Please enter bank payout / transaction reference.");
      return;
    }
    if (withdrawalAction === "REJECT" && !rejectReason.trim()) {
      Alert.alert("Validation", "Please provide a reason for declining this withdrawal.");
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      await dispatch(
        reviewAdminWithdrawal({
          id: selectedWithdrawal._id,
          action: withdrawalAction,
          payoutReference: payoutReference.trim() || undefined,
          reason: rejectReason.trim() || undefined,
        })
      );
      setSelectedWithdrawal(null);
      setPayoutReference("");
      setRejectReason("");
      loadDetails();
      Alert.alert("Success", `Withdrawal successfully ${withdrawalAction === "APPROVE" ? "approved" : "declined"}.`);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to process withdrawal action.");
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Theme Colors
  const bg = isDark ? "#0A0F14" : "#F8FAFC";
  const cardBg = isDark ? "#121922" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (loading && !vendor) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Loading Vendor Intelligence...
        </Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name="storefront-remove" size={scale(48)} color="#94A3B8" />
        <Text style={[styles.errorTitle, { color: textPrimary }]}>Vendor Not Found</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Vendor Intelligence"
        subtitle={vendor.businessDetails?.businessName || "Store Profile"}
        showBack
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0284C7"]} />
        }
      >
        {/* ── 1. Store Identity Hero Card ─────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.heroTopRow}>
            {/* Store Avatar */}
            <View
              style={[
                styles.storeAvatarBox,
                {
                  backgroundColor: isDark
                    ? "rgba(2, 132, 199, 0.2)"
                    : "#E0F2FE",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="storefront"
                size={scale(32)}
                color="#0284C7"
              />
            </View>

            {/* Store Title & Badges */}
            <View style={{ flex: 1, marginLeft: scale(14) }}>
              <View style={styles.storeTitleBadgesRow}>
                <Text
                  style={[styles.storeHeroName, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {vendor.businessDetails?.businessName || "Registered Store"}
                </Text>
              </View>

              <Text style={[styles.sellerSub, { color: textSecondary }]}>
                Owner: {vendor.sellerDetails?.sellerName || "N/A"} &bull;{" "}
                {vendor.sellerDetails?.sellerPhone || vendor.businessDetails?.businessPhone || vendor.userId?.phone || vendor.userId?.email || "No phone"}
              </Text>

              {/* Status Pills */}
              <View style={styles.pillBadgeRow}>
                {/* Verification Status */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isApproved
                        ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                        : isPending
                          ? isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"
                          : isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isApproved
                          ? "#10B981"
                          : isPending
                            ? "#F59E0B"
                            : "#EF4444",
                      },
                    ]}
                  >
                    {verificationStatus.toUpperCase()}
                  </Text>
                </View>

                {/* Store Open/Closed */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: vendor.isStoreOpen
                        ? isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5"
                        : isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.openClosedDot,
                      { backgroundColor: vendor.isStoreOpen ? "#10B981" : "#EF4444" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: vendor.isStoreOpen ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {vendor.isStoreOpen ? "OPEN" : "CLOSED"}
                  </Text>
                </View>

                {/* Risk Level Pill */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isHighRisk
                        ? isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"
                        : isMediumRisk
                          ? isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"
                          : isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isHighRisk ? "alert-circle" : isMediumRisk ? "alert" : "shield-check"}
                    size={scale(12)}
                    color={isHighRisk ? "#EF4444" : isMediumRisk ? "#F59E0B" : "#10B981"}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isHighRisk
                          ? "#EF4444"
                          : isMediumRisk
                            ? "#F59E0B"
                            : "#10B981",
                      },
                    ]}
                  >
                    {riskLevel} RISK
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Contact & Action Bar */}
          <View style={[styles.heroDivider, { backgroundColor: border }]} />
          <View style={styles.heroFooterRow}>
            <View style={styles.contactItemRow}>
              <TouchableOpacity
                style={[styles.quickIconBtn, { borderColor: border }]}
                onPress={() => {
                  if (vendor.sellerDetails?.sellerPhone) {
                    Linking.openURL(`tel:${vendor.sellerDetails.sellerPhone}`);
                  }
                }}
              >
                <Feather name="phone" size={scale(14)} color="#0284C7" />
                <Text style={[styles.quickIconBtnText, { color: textPrimary }]}>
                  {vendor.sellerDetails?.sellerPhone || "Call"}
                </Text>
              </TouchableOpacity>

              <View style={styles.metaCol}>
                <Text style={styles.metaSubLabel}>Assigned Admin</Text>
                <Text style={[styles.metaValText, { color: textPrimary }]}>
                  {assignedAdmin ? assignedAdmin.name : "Direct Operations"}
                </Text>
              </View>
            </View>

            {/* Verification Buttons */}
            <View style={styles.verificationActionBtns}>
              {!isApproved ? (
                <TouchableOpacity
                  style={[styles.verifyBtn, { backgroundColor: "#10B981" }]}
                  onPress={() => handleUpdateVerification("approved")}
                  activeOpacity={0.8}
                >
                  <Feather name="check" size={scale(14)} color="#FFFFFF" />
                  <Text style={styles.verifyBtnText}>Approve Store</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.verifyBtn, { backgroundColor: "#EF4444" }]}
                  onPress={() => handleUpdateVerification("rejected")}
                  activeOpacity={0.8}
                >
                  <Feather name="x" size={scale(14)} color="#FFFFFF" />
                  <Text style={styles.verifyBtnText}>Revoke Access</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ── 2. Interactive Navigation Tabs ───────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {[
            { id: "orders", label: `Orders (${orders.length})`, icon: "clipboard-list-outline" },
            { id: "transactions", label: `Product Sales (${productTransactions.length})`, icon: "swap-horizontal-bold" },
            { id: "claims", label: `Refund & Replace (${claims.totalClaims})`, icon: "cached" },
            { id: "financials", label: "Financials & Profits", icon: "cash-register" },
            { id: "customers", label: `Buyers (${stats.uniqueCustomersCount})`, icon: "account-group" },
            { id: "products", label: `Catalog (${stats.productsCount})`, icon: "package-variant-closed" },
            { id: "withdrawals", label: `Payouts (${withdrawals.length})`, icon: "bank-transfer" },
            { id: "risk", label: `Risk & Tickets (${tickets.openTicketsCount})`, icon: "shield-alert-outline" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabPill,
                  isActive && styles.tabPillActive,
                  !isActive && {
                    backgroundColor: isDark ? "#121922" : "#FFFFFF",
                    borderColor: border,
                  },
                ]}
                onPress={() => setActiveTab(tab.id as DetailTab)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={scale(16)}
                  color={isActive ? "#FFFFFF" : textSecondary}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    isActive && styles.tabPillTextActive,
                    !isActive && { color: textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 3. Tab Contents ─────────────────────────────────────────── */}

        {/* ══ TAB: ORDERS DIRECTORY & ORDER DETAILS ══ */}
        {activeTab === "orders" && (
          <View style={styles.tabContentContainer}>
            {/* Quick KPI Row */}
            <View style={styles.gridTwoCols}>
              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>Total Store Orders</Text>
                  <MaterialCommunityIcons name="shopping" size={scale(18)} color="#0284C7" />
                </View>
                <Text style={[styles.finCardAmount, { color: textPrimary }]}>{orders.length}</Text>
                <Text style={[styles.finCardSub, { color: "#10B981" }]}>
                  {orders.filter((o: any) => (o.orderStatus || "").toUpperCase() === "DELIVERED").length} Completed
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>Active / In-Transit</Text>
                  <MaterialCommunityIcons name="truck-delivery" size={scale(18)} color="#F59E0B" />
                </View>
                <Text style={[styles.finCardAmount, { color: "#F59E0B" }]}>
                  {orders.filter((o: any) => ["PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes((o.orderStatus || "").toUpperCase())).length}
                </Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  {orders.filter((o: any) => ["CANCELLED", "REJECTED", "REFUNDED"].includes((o.orderStatus || "").toUpperCase())).length} Cancelled/Refunded
                </Text>
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterChipRow}>
              {[
                { id: "ALL", label: `All (${orders.length})` },
                { id: "DELIVERED", label: "Delivered" },
                { id: "ACTIVE", label: "In-Progress" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.subFilterChip,
                    orderFilter === f.id && styles.subFilterChipActive,
                    orderFilter !== f.id && { backgroundColor: isDark ? "#16202A" : "#FFFFFF", borderColor: border },
                  ]}
                  onPress={() => setOrderFilter(f.id as any)}
                >
                  <Text
                    style={[
                      styles.subFilterChipText,
                      orderFilter === f.id && styles.subFilterChipTextActive,
                      orderFilter !== f.id && { color: textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Orders Cards */}
            <View style={{ gap: scale(12), marginTop: scale(12) }}>
              {filteredOrders.length === 0 ? (
                <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.emptyContentBox}>
                    <MaterialCommunityIcons name="clipboard-text-off-outline" size={scale(40)} color="#94A3B8" />
                    <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                      No orders found under selected filter.
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  {filteredOrders.slice(0, visibleOrdersCount).map((ord: any) => {
                    const st = (ord.orderStatus || "").toUpperCase();
                    const isDelivered = st === "DELIVERED" || st === "COMPLETED";
                    const isCancelled = st === "CANCELLED" || st === "REJECTED";
                    const refStatus = (ord.refundStatus || "NONE").toUpperCase();
                    const hasRefund = refStatus !== "NONE";
                    const isCodOrder =
                      (ord.paymentMethod || "").toLowerCase().includes("cash") ||
                      (ord.paymentMethod || "").toLowerCase().includes("cod") ||
                      ord.isCod === true;
                    const orderComm = isCodOrder
                      ? 0
                      : ord.commissionAmount != null
                      ? ord.commissionAmount
                      : Math.round((ord.totalAmount || 0) * 0.015 * 100) / 100;
                    const orderVendorNet = isCodOrder
                      ? ord.totalAmount || 0
                      : ord.vendorNetAmount != null
                      ? ord.vendorNetAmount
                      : Math.round(((ord.totalAmount || 0) - orderComm) * 100) / 100;

                    return (
                      <View
                        key={ord._id}
                        style={[
                          styles.orderCardDetailed,
                          { backgroundColor: cardBg, borderColor: border },
                        ]}
                      >
                        {/* Top Bar: Order Number, Date, Status */}
                        <View style={styles.orderCardHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), flexWrap: "wrap" }}>
                              <Text style={[styles.orderNumberTextLarge, { color: textPrimary }]}>
                                #{ord.orderNumber || ord._id.slice(-6).toUpperCase()}
                              </Text>
                              {hasRefund && (
                                <View style={[styles.claimTypeTag, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                                  <Text style={[styles.claimTypeTagText, { color: "#A855F7" }]}>
                                    {refStatus}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.orderDateSub, { color: textSecondary }]}>
                              {new Date(ord.createdAt).toLocaleDateString()} at{" "}
                              {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.orderStatusPill,
                              {
                                backgroundColor: isDelivered
                                  ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                  : isCancelled
                                  ? isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"
                                  : isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.orderStatusPillText,
                                {
                                  color: isDelivered ? "#10B981" : isCancelled ? "#EF4444" : "#F59E0B",
                                },
                              ]}
                            >
                              {st}
                            </Text>
                          </View>
                        </View>

                        {/* Buyer Details */}
                        <View style={[styles.buyerInfoRow, { backgroundColor: isDark ? "#16202A" : "#F8FAFC", borderColor: border }]}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), flex: 1 }}>
                            <Feather name="user" size={scale(13)} color="#0284C7" />
                            <Text style={[styles.buyerInfoText, { color: textPrimary }]} numberOfLines={1}>
                              {ord.customer?.name || "Customer"}
                            </Text>
                          </View>
                          {ord.customer?.phone ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4) }}>
                              <Feather name="phone" size={scale(12)} color={textSecondary} />
                              <Text style={[styles.buyerInfoSubText, { color: textSecondary }]}>
                                {ord.customer.phone}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Products In Order */}
                        <View style={styles.orderProductsContainer}>
                          <Text style={[styles.itemsHeaderLabel, { color: textSecondary }]}>
                            PURCHASED PRODUCTS ({ord.items?.length || 0})
                          </Text>
                          {(ord.items || []).map((it: any, idx: number) => (
                            <View key={idx} style={[styles.orderProductRow, { borderBottomColor: border }]}>
                              {it.imageUrl ? (
                                <Image source={{ uri: it.imageUrl }} style={styles.itemImageThumb} />
                              ) : (
                                <View style={[styles.itemImagePlaceholder, { backgroundColor: isDark ? "#263238" : "#E2E8F0" }]}>
                                  <MaterialCommunityIcons name="package-variant" size={scale(16)} color="#94A3B8" />
                                </View>
                              )}
                              <View style={{ flex: 1, marginLeft: scale(10) }}>
                                <Text style={[styles.productItemTitle, { color: textPrimary }]} numberOfLines={1}>
                                  {it.name}
                                </Text>
                                <Text style={[styles.productItemMeta, { color: textSecondary }]}>
                                  Qty: {it.quantity || 1} &bull; NPR {(it.price || 0).toLocaleString()} each
                                </Text>
                              </View>
                              <Text style={[styles.productItemTotal, { color: textPrimary }]}>
                                NPR {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Order Financial Breakdown */}
                        <View style={[styles.orderFinBreakdown, { borderTopColor: border }]}>
                          <View style={styles.orderFinRow}>
                            <Text style={[styles.orderFinLabel, { color: textSecondary }]}>Gross Sale Total</Text>
                            <Text style={[styles.orderFinVal, { color: textPrimary }]}>
                              NPR {(ord.totalAmount || 0).toLocaleString()}
                            </Text>
                          </View>
                          <View style={styles.orderFinRow}>
                            <Text style={[styles.orderFinLabel, { color: textSecondary }]}>
                              {isCodOrder ? "Platform Commission (COD 0%)" : "Fixed 1.5% Commission"}
                            </Text>
                            <Text style={[styles.orderFinVal, { color: isCodOrder ? "#10B981" : "#A855F7" }]}>
                              {isCodOrder ? "NPR 0 (0% No Cut)" : `- NPR ${orderComm.toLocaleString()}`}
                            </Text>
                          </View>
                          <View style={styles.orderFinRow}>
                            <Text style={[styles.orderFinLabelBold, { color: textPrimary }]}>
                              {isCodOrder ? "Net Vendor Cash (100%)" : "Net Vendor Credit"}
                            </Text>
                            <Text style={[styles.orderFinValBold, { color: "#10B981" }]}>
                              + NPR {orderVendorNet.toLocaleString()}
                            </Text>
                          </View>
                          <View style={styles.orderPaymentFooter}>
                            <Text style={[styles.paymentMethodLabel, { color: textSecondary }]}>
                              Paid via: <Text style={{ color: textPrimary, fontWeight: "700" }}>{ord.paymentMethod || "Cash on delivery"}</Text>
                            </Text>
                            <Text style={[styles.paymentStatusTag, { color: ord.paymentStatus === "paid" ? "#10B981" : "#F59E0B" }]}>
                              {(ord.paymentStatus || "PENDING").toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {filteredOrders.length > visibleOrdersCount && (
                    <TouchableOpacity
                      style={[styles.loadMoreItemsBtn, { borderColor: border, backgroundColor: cardBg }]}
                      onPress={() => setVisibleOrdersCount((prev) => prev + 10)}
                      activeOpacity={0.7}
                    >
                      <Feather name="chevron-down" size={scale(16)} color="#0284C7" />
                      <Text style={[styles.loadMoreItemsBtnText, { color: "#0284C7" }]}>
                        Load More Orders ({filteredOrders.length - visibleOrdersCount} remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* ══ TAB: TRANSACTIONS OF HIS PRODUCTS ══ */}
        {activeTab === "transactions" && (
          <View style={styles.tabContentContainer}>
            {/* Sales Volume Banner */}
            <LinearGradient
              colors={isDark ? (["#1E1B4B", "#0F172A"] as const) : (["#EEF2FF", "#E0E7FF"] as const)}
              style={[styles.financialBannerCard, { borderColor: isDark ? "#4338CA" : "#C7D2FE" }]}
            >
              <View style={styles.finHeaderRow}>
                <View>
                  <Text style={[styles.finHeaderLabel, { color: isDark ? "#A5B4FC" : "#3730A3" }]}>
                    TOTAL PRODUCT SALES VOLUME
                  </Text>
                  <Text style={[styles.finLargeAmount, { color: isDark ? "#818CF8" : "#4338CA" }]}>
                    NPR {(financials.totalGrossSales || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.finWalletBadge, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#E0E7FF" }]}>
                  <MaterialCommunityIcons name="swap-horizontal-bold" size={scale(24)} color="#6366F1" />
                </View>
              </View>
              <View style={styles.finBannerStatsRow}>
                <View style={styles.finBannerStatBox}>
                  <Text style={[styles.finMiniLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                    COMMISSION (1.5% ONLINE / 0% COD)
                  </Text>
                  <Text style={[styles.finMiniVal, { color: "#A855F7" }]}>
                    NPR {(financials.totalCommissionPaid || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.finBannerStatBox}>
                  <Text style={[styles.finMiniLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                    NET CREDITED TO VENDOR
                  </Text>
                  <Text style={[styles.finMiniVal, { color: "#10B981" }]}>
                    NPR {(financials.netEarnings || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Transactions List */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border, marginTop: scale(14) }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="book-open-outline" size={scale(18)} color="#6366F1" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Customer Product Purchase Ledger
                  </Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: "#EEF2FF" }]}>
                  <Text style={[styles.countBadgeText, { color: "#6366F1" }]}>
                    {productTransactions.length} Sales
                  </Text>
                </View>
              </View>

              {productTransactions.length === 0 ? (
                <View style={styles.emptyContentBox}>
                  <MaterialCommunityIcons name="cash-remove" size={scale(36)} color="#94A3B8" />
                  <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                    No product transactions recorded yet.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: scale(10), marginTop: scale(10) }}>
                  {productTransactions.slice(0, visibleTxnCount).map((tx: any, idx: number) => {
                    const isSettled = tx.status === "SETTLED" || tx.status === "COMPLETED";
                    const isReversed = tx.status === "REVERSED" || tx.type === "REFUND_DEDUCTION";
                    const isCodTx =
                      ["COD_COLLECTION", "COD_HANDOVER", "DIRECT_QR_PAYMENT"].includes(tx.type) ||
                      (tx.paymentMethod || "").toLowerCase().includes("cash") ||
                      (tx.paymentMethod || "").toLowerCase().includes("cod") ||
                      tx.isCod === true;
                    const txFee = isCodTx ? 0 : (tx.commission || 0);
                    const txNet = isCodTx ? (tx.grossAmount || tx.netAmount || 0) : (tx.netAmount || 0);

                    return (
                      <View
                        key={tx._id || idx}
                        style={[
                          styles.customerCardItem,
                          {
                            backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                            borderColor: border,
                            padding: scale(12),
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={[styles.orderNumberText, { color: textPrimary }]}>
                              Order #{tx.orderNumber || "DIRECT"}
                            </Text>
                            <Text style={[styles.orderAmountText, { color: isReversed ? "#EF4444" : "#10B981" }]}>
                              {isReversed ? "-" : "+"} NPR {txNet.toLocaleString()}
                            </Text>
                          </View>

                          <Text style={[styles.customerContact, { color: textSecondary, marginTop: scale(2) }]}>
                            Buyer: {tx.customerName || "Customer"} &bull; {new Date(tx.createdAt).toLocaleDateString()}
                          </Text>

                          {tx.itemsSummary ? (
                            <Text style={[styles.itemName, { color: textPrimary, marginTop: scale(4) }]} numberOfLines={2}>
                              Products: {tx.itemsSummary}
                            </Text>
                          ) : null}

                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: scale(8), borderTopWidth: 1, borderTopColor: border, paddingTop: scale(6) }}>
                            <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>
                              Gross: NPR {(tx.grossAmount || 0).toLocaleString()} | Fee: NPR {txFee.toLocaleString()} {isCodTx ? "(0% COD)" : ""}
                            </Text>
                            <View
                              style={[
                                styles.orderStatusPill,
                                {
                                  backgroundColor: isSettled
                                    ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                    : isReversed
                                    ? isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"
                                    : isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.orderStatusPillText,
                                  { color: isSettled ? "#10B981" : isReversed ? "#EF4444" : "#F59E0B" },
                                ]}
                              >
                                {tx.status || "SETTLED"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {productTransactions.length > visibleTxnCount && (
                    <TouchableOpacity
                      style={[styles.loadMoreItemsBtn, { borderColor: border, backgroundColor: cardBg }]}
                      onPress={() => setVisibleTxnCount((prev) => prev + 10)}
                      activeOpacity={0.7}
                    >
                      <Feather name="chevron-down" size={scale(16)} color="#6366F1" />
                      <Text style={[styles.loadMoreItemsBtnText, { color: "#6366F1" }]}>
                        Load More Sales ({productTransactions.length - visibleTxnCount} remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══ TAB: RETURNS, REFUNDS & REPLACEMENTS ══ */}
        {activeTab === "claims" && (
          <View style={styles.tabContentContainer}>
            {/* KPI Overview Grid */}
            <View style={styles.gridTwoCols}>
              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>Total Claims</Text>
                  <MaterialCommunityIcons name="cached" size={scale(18)} color="#A855F7" />
                </View>
                <Text style={[styles.finCardAmount, { color: textPrimary }]}>{claims.totalClaims}</Text>
                <Text style={[styles.finCardSub, { color: "#EF4444" }]}>
                  {claims.pendingClaimsCount} Pending Action
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>Refunds Processed</Text>
                  <MaterialCommunityIcons name="cash-refund" size={scale(18)} color="#EF4444" />
                </View>
                <Text style={[styles.finCardAmount, { color: "#EF4444" }]}>{claims.refundsCount}</Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  NPR {(claims.totalRefundAmount || 0).toLocaleString()} refunded
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>Returns Logged</Text>
                  <MaterialCommunityIcons name="keyboard-return" size={scale(18)} color="#0284C7" />
                </View>
                <Text style={[styles.finCardAmount, { color: "#0284C7" }]}>{claims.returnsCount}</Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  Return requests
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>Replacements</Text>
                  <MaterialCommunityIcons name="swap-horizontal" size={scale(18)} color="#F59E0B" />
                </View>
                <Text style={[styles.finCardAmount, { color: "#F59E0B" }]}>{claims.replacementsCount}</Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  Product replacements
                </Text>
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterChipRow}>
              {[
                { id: "ALL", label: `All (${claims.totalClaims})` },
                { id: "REFUND", label: `Refunds (${claims.refundsCount})` },
                { id: "RETURN", label: `Returns (${claims.returnsCount})` },
                { id: "REPLACEMENT", label: `Replace (${claims.replacementsCount})` },
                { id: "PENDING", label: `Pending (${claims.pendingClaimsCount})` },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.subFilterChip,
                    claimFilter === f.id && styles.subFilterChipActive,
                    claimFilter !== f.id && { backgroundColor: isDark ? "#16202A" : "#FFFFFF", borderColor: border },
                  ]}
                  onPress={() => setClaimFilter(f.id as any)}
                >
                  <Text
                    style={[
                      styles.subFilterChipText,
                      claimFilter === f.id && styles.subFilterChipTextActive,
                      claimFilter !== f.id && { color: textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Claims Cards */}
            <View style={{ gap: scale(12), marginTop: scale(12) }}>
              {filteredClaims.length === 0 ? (
                <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.emptyContentBox}>
                    <MaterialCommunityIcons name="check-decagram-outline" size={scale(40)} color="#10B981" />
                    <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                      No refund, return, or replacement claims under selected filter.
                    </Text>
                  </View>
                </View>
              ) : (
                filteredClaims.map((clm: any) => {
                  const ct = (clm.claimType || "REFUND").toUpperCase();
                  const st = (clm.status || "REQUESTED").toUpperCase();
                  const isPending = ["REQUESTED", "PROCESSING"].includes(st);
                  const isCompleted = st === "COMPLETED" || st === "APPROVED";

                  return (
                    <View
                      key={clm._id}
                      style={[
                        styles.orderCardDetailed,
                        { backgroundColor: cardBg, borderColor: border },
                      ]}
                    >
                      {/* Top Header */}
                      <View style={styles.orderCardHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), flexWrap: "wrap" }}>
                            <Text style={[styles.orderNumberTextLarge, { color: textPrimary }]}>
                              {clm.refundNumber}
                            </Text>
                            <View
                              style={[
                                styles.claimTypeTag,
                                {
                                  backgroundColor: ct.includes("REPLACE")
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : ct.includes("RETURN")
                                    ? "rgba(2, 132, 199, 0.15)"
                                    : "rgba(168, 85, 247, 0.15)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.claimTypeTagText,
                                  {
                                    color: ct.includes("REPLACE")
                                      ? "#F59E0B"
                                      : ct.includes("RETURN")
                                      ? "#0284C7"
                                      : "#A855F7",
                                  },
                                ]}
                              >
                                {ct}
                              </Text>
                            </View>
                          </View>

                          <Text style={[styles.orderDateSub, { color: textSecondary }]}>
                            Order #{clm.orderNumber} &bull; {new Date(clm.createdAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.orderStatusPill,
                            {
                              backgroundColor: isCompleted
                                ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                : isPending
                                ? isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"
                                : isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.orderStatusPillText,
                              {
                                color: isCompleted ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                              },
                            ]}
                          >
                            {st}
                          </Text>
                        </View>
                      </View>

                      {/* Customer & Reason Box */}
                      <View style={[styles.buyerInfoRow, { backgroundColor: isDark ? "#16202A" : "#F8FAFC", borderColor: border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.buyerInfoText, { color: textPrimary }]}>
                            Customer: {clm.customerName || "Customer"} {clm.customerPhone ? `(${clm.customerPhone})` : ""}
                          </Text>
                          <Text style={[styles.claimReasonText, { color: textSecondary, marginTop: scale(2) }]}>
                            Reason: <Text style={{ color: isDark ? "#F8FAFC" : "#334155", fontWeight: "600" }}>{clm.reason}</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Claimed Items */}
                      {clm.items && clm.items.length > 0 && (
                        <View style={styles.orderProductsContainer}>
                          <Text style={[styles.itemsHeaderLabel, { color: textSecondary }]}>
                            CLAIMED ITEMS ({clm.items.length})
                          </Text>
                          {clm.items.map((it: any, i: number) => (
                            <View key={i} style={[styles.orderProductRow, { borderBottomColor: border }]}>
                              <Text style={[styles.productItemTitle, { color: textPrimary, flex: 1 }]} numberOfLines={1}>
                                &bull; {it.name} &times; {it.quantity || 1}
                              </Text>
                              <Text style={[styles.productItemTotal, { color: textPrimary }]}>
                                NPR {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Financial Impact */}
                      <View style={[styles.orderFinBreakdown, { borderTopColor: border }]}>
                        <View style={styles.orderFinRow}>
                          <Text style={[styles.orderFinLabel, { color: textSecondary }]}>Claim / Refund Amount</Text>
                          <Text style={[styles.orderFinVal, { color: "#EF4444" }]}>
                            NPR {(clm.amount || 0).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.orderFinRow}>
                          <Text style={[styles.orderFinLabel, { color: textSecondary }]}>Vendor Deduction</Text>
                          <Text style={[styles.orderFinVal, { color: textPrimary }]}>
                            NPR {(clm.vendorDeduction || 0).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.orderFinRow}>
                          <Text style={[styles.orderFinLabel, { color: textSecondary }]}>
                            {clm.commissionReversal === 0 ? "Commission Reversal (COD 0%)" : "Commission Reversal (1.5%)"}
                          </Text>
                          <Text style={[styles.orderFinVal, { color: "#10B981" }]}>
                            NPR {(clm.commissionReversal || 0).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ══ TAB 1: FINANCIALS & REVENUE BREAKDOWN ══ */}
        {activeTab === "financials" && (
          <View style={styles.tabContentContainer}>
            {/* Live Wallet & Earnings Banner */}
            <LinearGradient
              colors={
                isDark
                  ? (["#0F291E", "#071610"] as const)
                  : (["#ECFDF5", "#D1FAE5"] as const)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.financialBannerCard,
                { borderColor: isDark ? "#059669" : "#A7F3D0" },
              ]}
            >
              <View style={styles.finHeaderRow}>
                <View>
                  <Text style={[styles.finHeaderLabel, { color: isDark ? "#A7F3D0" : "#065F46" }]}>
                    CURRENT VENDOR WALLET BALANCE
                  </Text>
                  <Text style={[styles.finLargeAmount, { color: isDark ? "#34D399" : "#047857" }]}>
                    NPR {(financials.currentWalletBalance || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.finWalletBadge}>
                  <MaterialCommunityIcons name="wallet" size={scale(24)} color="#10B981" />
                </View>
              </View>

              <View style={styles.finBannerStatsRow}>
                <View style={styles.finBannerStatBox}>
                  <Text style={[styles.finMiniLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                    PENDING PAYOUT
                  </Text>
                  <Text style={[styles.finMiniVal, { color: "#F59E0B" }]}>
                    NPR {(financials.pendingWithdrawalsAmount || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.finBannerStatBox}>
                  <Text style={[styles.finMiniLabel, { color: isDark ? "#94A3B8" : "#475569" }]}>
                    TOTAL PAID OUT
                  </Text>
                  <Text style={[styles.finMiniVal, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                    NPR {(financials.totalWithdrawalsPaid || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Lifetime Sales & 1.5% Commission Summary Cards */}
            <View style={styles.gridTwoCols}>
              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>
                    Total Gross Sales
                  </Text>
                  <View style={[styles.iconBoxMini, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={scale(18)} color="#0284C7" />
                  </View>
                </View>
                <Text style={[styles.finCardAmount, { color: textPrimary }]}>
                  NPR {(financials.totalGrossSales || 0).toLocaleString()}
                </Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  From {stats.ordersCount} total orders
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>
                    Net Vendor Profit
                  </Text>
                  <View style={[styles.iconBoxMini, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                    <Feather name="trending-up" size={scale(18)} color="#10B981" />
                  </View>
                </View>
                <Text style={[styles.finCardAmount, { color: "#10B981" }]}>
                  NPR {(financials.netEarnings || 0).toLocaleString()}
                </Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  Net earnings after fees
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>
                    Commission Deducted
                  </Text>
                  <View style={[styles.iconBoxMini, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
                    <MaterialCommunityIcons name="percent" size={scale(18)} color="#A855F7" />
                  </View>
                </View>
                <Text style={[styles.finCardAmount, { color: "#A855F7" }]}>
                  NPR {(financials.totalCommissionPaid || 0).toLocaleString()}
                </Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  Fixed 1.5% online (0% on COD)
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={[styles.finCardLabel, { color: textSecondary }]}>
                    Order Deliveries
                  </Text>
                  <View style={[styles.iconBoxMini, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                    <MaterialCommunityIcons name="truck-check" size={scale(18)} color="#F59E0B" />
                  </View>
                </View>
                <Text style={[styles.finCardAmount, { color: textPrimary }]}>
                  {stats.deliveredOrders} / {stats.ordersCount}
                </Text>
                <Text style={[styles.finCardSub, { color: stats.cancelledOrders > 0 ? "#EF4444" : textSecondary }]}>
                  {stats.cancelledOrders} cancelled
                </Text>
              </View>
            </View>

            {/* Bank Credentials Card */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border, marginTop: scale(14) }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="bank" size={scale(18)} color="#0284C7" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Registered Bank & Payout Channel
                  </Text>
                </View>
              </View>

              <View style={styles.bankInfoGrid}>
                <View style={styles.bankInfoCol}>
                  <Text style={styles.metaSubLabel}>Bank Name</Text>
                  <Text style={[styles.bankValueText, { color: textPrimary }]}>
                    {vendor.bankDetails?.bankName || "Not configured"}
                  </Text>
                </View>
                <View style={styles.bankInfoCol}>
                  <Text style={styles.metaSubLabel}>Account Holder</Text>
                  <Text style={[styles.bankValueText, { color: textPrimary }]}>
                    {vendor.bankDetails?.accountHolderName || vendor.sellerDetails?.sellerName || "N/A"}
                  </Text>
                </View>
                <View style={styles.bankInfoCol}>
                  <Text style={styles.metaSubLabel}>Account Number</Text>
                  <Text style={[styles.bankValueText, { color: textPrimary }]}>
                    {vendor.bankDetails?.accountNumber || "N/A"}
                  </Text>
                </View>
                <View style={styles.bankInfoCol}>
                  <Text style={styles.metaSubLabel}>Branch / Routing</Text>
                  <Text style={[styles.bankValueText, { color: textPrimary }]}>
                    {vendor.bankDetails?.branch || "Central"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ══ TAB 2: CUSTOMERS & PURCHASING HISTORY ══ */}
        {activeTab === "customers" && (
          <View style={styles.tabContentContainer}>
            {/* Unique Customers Summary */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="account-group" size={scale(18)} color="#0284C7" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Customers Who Bought from this Store
                  </Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: "#E0F2FE" }]}>
                  <Text style={styles.countBadgeText}>{customers.length} Buyers</Text>
                </View>
              </View>

              {customers.length === 0 ? (
                <View style={styles.emptyContentBox}>
                  <MaterialCommunityIcons name="account-off-outline" size={scale(36)} color="#94A3B8" />
                  <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                    No registered customers have ordered from this store yet.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: scale(10), marginTop: scale(10) }}>
                  {customers.map((c: any) => (
                    <View
                      key={c._id}
                      style={[
                        styles.customerCardItem,
                        {
                          backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <View style={styles.customerAvatarMini}>
                        <Text style={styles.customerAvatarText}>
                          {(c.name || "C").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: scale(10) }}>
                        <Text style={[styles.customerName, { color: textPrimary }]}>
                          {c.name}
                        </Text>
                        <Text style={[styles.customerContact, { color: textSecondary }]}>
                          {c.phone || c.email || "No direct phone"}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.customerSpent, { color: "#10B981" }]}>
                          NPR {Number(c.totalSpent || 0).toLocaleString()}
                        </Text>
                        <Text style={[styles.customerOrderCount, { color: textSecondary }]}>
                          {c.ordersCount} {c.ordersCount === 1 ? "order" : "orders"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recent Orders Breakdown with Products */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border, marginTop: scale(14) }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="receipt" size={scale(18)} color="#A855F7" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Recent Orders & Purchased Items
                  </Text>
                </View>
              </View>

              {recentOrders.length === 0 ? (
                <View style={styles.emptyContentBox}>
                  <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                    No orders logged for this vendor.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: scale(12), marginTop: scale(10) }}>
                  {recentOrders.map((ord: any) => {
                    const st = (ord.orderStatus || "").toLowerCase();
                    const isDelivered = st === "delivered" || st === "completed";
                    const isCancelled = st === "cancelled" || st === "refunded";

                    return (
                      <View
                        key={ord._id}
                        style={[
                          styles.orderItemCard,
                          {
                            backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                            borderColor: border,
                          },
                        ]}
                      >
                        <View style={styles.orderTopHeader}>
                          <View>
                            <Text style={[styles.orderNumberText, { color: textPrimary }]}>
                              Order #{ord.orderNumber || ord._id.slice(-6).toUpperCase()}
                            </Text>
                            <Text style={[styles.orderDateText, { color: textSecondary }]}>
                              Buyer: {ord.customer?.name || "Customer"} &bull;{" "}
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.orderAmountText, { color: textPrimary }]}>
                              NPR {(ord.totalAmount || 0).toLocaleString()}
                            </Text>
                            <View
                              style={[
                                styles.orderStatusPill,
                                {
                                  backgroundColor: isDelivered
                                    ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                    : isCancelled
                                      ? isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"
                                      : isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.orderStatusPillText,
                                  {
                                    color: isDelivered
                                      ? "#10B981"
                                      : isCancelled
                                        ? "#EF4444"
                                        : "#F59E0B",
                                  },
                                ]}
                              >
                                {ord.orderStatus?.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Order Items list */}
                        {ord.items && ord.items.length > 0 && (
                          <View style={styles.orderItemsList}>
                            {ord.items.map((it: any, i: number) => (
                              <View key={i} style={styles.orderItemRow}>
                                <Text style={[styles.itemName, { color: textPrimary }]} numberOfLines={1}>
                                  &bull; {it.name} &times; {it.quantity}
                                </Text>
                                <Text style={[styles.itemPrice, { color: textSecondary }]}>
                                  NPR {it.price * (it.quantity || 1)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══ TAB 3: CATALOG & INVENTORY ══ */}
        {activeTab === "products" && (
          <View style={styles.tabContentContainer}>
            {/* Products Inventory Stats */}
            <View style={styles.gridTwoCols}>
              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.finCardLabel, { color: textSecondary }]}>Total Catalog</Text>
                <Text style={[styles.finCardAmount, { color: textPrimary }]}>
                  {stats.productsCount} Items
                </Text>
                <Text style={[styles.finCardSub, { color: "#10B981" }]}>
                  {stats.activeProductsCount} Live in Store
                </Text>
              </View>

              <View style={[styles.finMetricCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.finCardLabel, { color: textSecondary }]}>Inactive / Out of Stock</Text>
                <Text style={[styles.finCardAmount, { color: stats.productsCount - stats.activeProductsCount > 0 ? "#EF4444" : textSecondary }]}>
                  {Math.max(0, stats.productsCount - stats.activeProductsCount)} Items
                </Text>
                <Text style={[styles.finCardSub, { color: textSecondary }]}>
                  Requires vendor restocking
                </Text>
              </View>
            </View>

            {/* Products List */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border, marginTop: scale(14) }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="package-variant" size={scale(18)} color="#0284C7" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Vendor Product Catalog
                  </Text>
                </View>
              </View>

              {products.length === 0 ? (
                <View style={styles.emptyContentBox}>
                  <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                    No products added by this vendor.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: scale(10), marginTop: scale(10) }}>
                  {products.map((p: any) => {
                    const imgUrl = p.images && p.images[0]?.url;
                    return (
                      <View
                        key={p._id}
                        style={[
                          styles.productCardItem,
                          {
                            backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                            borderColor: border,
                          },
                        ]}
                      >
                        {imgUrl ? (
                          <Image source={{ uri: imgUrl }} style={styles.productThumb} resizeMode="cover" />
                        ) : (
                          <View style={[styles.productThumbPlaceholder, { backgroundColor: isDark ? "#243242" : "#E2E8F0" }]}>
                            <Feather name="box" size={scale(18)} color="#94A3B8" />
                          </View>
                        )}

                        <View style={{ flex: 1, marginLeft: scale(12) }}>
                          <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={[styles.productCategory, { color: textSecondary }]}>
                            Category: {p.category?.name || "General"}
                          </Text>
                          <View style={styles.productMetaRow}>
                            <Text style={[styles.productPrice, { color: "#0284C7" }]}>
                              NPR {p.price}
                            </Text>
                            {p.originalPrice > p.price && (
                              <Text style={styles.productOrigPrice}>
                                NPR {p.originalPrice}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                          <View
                            style={[
                              styles.stockBadge,
                              {
                                backgroundColor: p.stock > 0
                                  ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                  : isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stockBadgeText,
                                { color: p.stock > 0 ? "#10B981" : "#EF4444" },
                              ]}
                            >
                              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                            </Text>
                          </View>
                          <Text style={{ fontSize: moderateScale(10), color: p.isActive ? "#10B981" : "#EF4444", marginTop: scale(4) }}>
                            {p.isActive ? "● Active" : "○ Inactive"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══ TAB 4: WITHDRAWALS & PAYOUTS ══ */}
        {activeTab === "withdrawals" && (
          <View style={styles.tabContentContainer}>
            {/* Payouts Overview */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="bank-transfer-out" size={scale(18)} color="#F59E0B" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Vendor Withdrawal Requests & Settlements
                  </Text>
                </View>
              </View>

              {withdrawals.length === 0 ? (
                <View style={styles.emptyContentBox}>
                  <Text style={[styles.emptyPromptText, { color: textSecondary }]}>
                    No withdrawal requests submitted by this vendor.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: scale(12), marginTop: scale(10) }}>
                  {withdrawals.map((w: any) => {
                    const isPendingW = w.status === "PENDING";
                    const isPaid = w.status === "COMPLETED";

                    return (
                      <View
                        key={w._id}
                        style={[
                          styles.withdrawalItemCard,
                          {
                            backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                            borderColor: border,
                          },
                        ]}
                      >
                        <View style={styles.withdrawalTopRow}>
                          <View>
                            <Text style={[styles.withdrawalAmount, { color: textPrimary }]}>
                              NPR {Number(w.amount || 0).toLocaleString()}
                            </Text>
                            <Text style={[styles.withdrawalDate, { color: textSecondary }]}>
                              Requested on {new Date(w.createdAt).toLocaleDateString()}
                            </Text>
                            {w.payoutReference && (
                              <Text style={[styles.payoutRefText, { color: "#10B981" }]}>
                                Ref: {w.payoutReference}
                              </Text>
                            )}
                          </View>

                          <View style={{ alignItems: "flex-end" }}>
                            <View
                              style={[
                                styles.orderStatusPill,
                                {
                                  backgroundColor: isPaid
                                    ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                    : isPendingW
                                      ? isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"
                                      : isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.orderStatusPillText,
                                  {
                                    color: isPaid
                                      ? "#10B981"
                                      : isPendingW
                                        ? "#F59E0B"
                                        : "#EF4444",
                                  },
                                ]}
                              >
                                {w.status || "PENDING"}
                              </Text>
                            </View>

                            {/* Direct Admin Action on Pending Withdrawal */}
                            {isPendingW && isSuperAdmin && (
                              <View style={styles.withdrawalActionBtnRow}>
                                <TouchableOpacity
                                  style={[styles.miniActionBtn, { backgroundColor: "#10B981" }]}
                                  onPress={() => {
                                    setSelectedWithdrawal(w);
                                    setWithdrawalAction("APPROVE");
                                  }}
                                >
                                  <Text style={styles.miniActionBtnText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.miniActionBtn, { backgroundColor: "#EF4444" }]}
                                  onPress={() => {
                                    setSelectedWithdrawal(w);
                                    setWithdrawalAction("REJECT");
                                  }}
                                >
                                  <Text style={styles.miniActionBtnText}>Decline</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══ TAB 5: DISPUTES & RISK ANALYSIS ══ */}
        {activeTab === "risk" && (
          <View style={styles.tabContentContainer}>
            {/* Risk Assessment Summary */}
            <View
              style={[
                styles.riskCardBanner,
                {
                  backgroundColor: isHighRisk
                    ? isDark ? "#281216" : "#FEE2E2"
                    : isMediumRisk
                      ? isDark ? "#261D12" : "#FEF3C7"
                      : isDark ? "#0E2419" : "#ECFDF5",
                  borderColor: isHighRisk ? "#EF4444" : isMediumRisk ? "#F59E0B" : "#10B981",
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
                <MaterialCommunityIcons
                  name={isHighRisk ? "shield-alert" : isMediumRisk ? "shield-half-full" : "shield-check"}
                  size={scale(24)}
                  color={isHighRisk ? "#EF4444" : isMediumRisk ? "#F59E0B" : "#10B981"}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.riskTitle,
                      { color: isHighRisk ? "#EF4444" : isMediumRisk ? "#F59E0B" : "#10B981" },
                    ]}
                  >
                    Risk Assessment: {riskLevel} RISK
                  </Text>
                  <Text style={[styles.riskReasonText, { color: textSecondary }]}>
                    {tickets.riskReason}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tickets List */}
            <View style={[styles.sectionContainerCard, { backgroundColor: cardBg, borderColor: border, marginTop: scale(14) }]}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <MaterialCommunityIcons name="ticket-confirmation-outline" size={scale(18)} color="#EF4444" />
                  <Text style={[styles.cardHeaderTitle, { color: textPrimary }]}>
                    Support Tickets & Complaints ({tickets.list?.length || 0})
                  </Text>
                </View>
              </View>

              {!tickets.list || tickets.list.length === 0 ? (
                <View style={styles.emptyContentBox}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={scale(36)} color="#10B981" />
                  <Text style={[styles.emptyPromptText, { color: "#10B981" }]}>
                    No open tickets or disputes registered for this store.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: scale(10), marginTop: scale(10) }}>
                  {tickets.list.map((tk: any) => (
                    <View
                      key={tk._id}
                      style={[
                        styles.ticketCardItem,
                        {
                          backgroundColor: isDark ? "#16202A" : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <View style={styles.ticketTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.ticketNumText, { color: "#0284C7" }]}>
                            #{tk.ticketNumber || tk._id.slice(-6).toUpperCase()}
                          </Text>
                          <Text style={[styles.ticketSubject, { color: textPrimary }]}>
                            {tk.subject || "Customer Complaint"}
                          </Text>
                          <Text style={[styles.ticketDate, { color: textSecondary }]}>
                            Raised by: {tk.raisedBy?.name || "Customer"} &bull;{" "}
                            {new Date(tk.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.orderStatusPill,
                            {
                              backgroundColor: tk.status === "RESOLVED"
                                ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                                : isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.orderStatusPillText,
                              { color: tk.status === "RESOLVED" ? "#10B981" : "#EF4444" },
                            ]}
                          >
                            {tk.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Withdrawal Review Modal ────────────────────────────────────── */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalHeading, { color: textPrimary }]}>
                {withdrawalAction === "APPROVE" ? "Approve Payout" : "Decline Payout"}
              </Text>
              <TouchableOpacity onPress={() => setSelectedWithdrawal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: textSecondary }]}>
              {withdrawalAction === "APPROVE"
                ? `Confirming bank transfer of NPR ${Number(selectedWithdrawal?.amount || 0).toLocaleString()} to ${vendor.businessDetails?.businessName}.`
                : `Decline withdrawal request of NPR ${Number(selectedWithdrawal?.amount || 0).toLocaleString()} and restore wallet balance.`}
            </Text>

            {withdrawalAction === "APPROVE" ? (
              <View style={{ marginTop: scale(12) }}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Bank Reference / Trx ID *</Text>
                <TextInput
                  style={[styles.textInputStyle, { color: textPrimary, borderColor: border }]}
                  placeholder="e.g. NBL-TXN-984218"
                  placeholderTextColor="#94A3B8"
                  value={payoutReference}
                  onChangeText={setPayoutReference}
                />
              </View>
            ) : (
              <View style={{ marginTop: scale(12) }}>
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Decline Reason *</Text>
                <TextInput
                  style={[styles.textInputStyle, { color: textPrimary, borderColor: border, height: scale(60) }]}
                  placeholder="e.g. Bank account details mismatch"
                  placeholderTextColor="#94A3B8"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                />
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: border }]}
                onPress={() => setSelectedWithdrawal(null)}
              >
                <Text style={[styles.modalCancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: withdrawalAction === "APPROVE" ? "#10B981" : "#EF4444" },
                ]}
                onPress={handleConfirmWithdrawalReview}
                disabled={submittingWithdrawal}
              >
                {submittingWithdrawal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    {withdrawalAction === "APPROVE" ? "Confirm Payout" : "Confirm Decline"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(12),
  },
  loadingText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  errorTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  backBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    backgroundColor: "#0284C7",
    marginTop: scale(10),
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* ── Store Hero Card ── */
  heroCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    marginBottom: scale(14),
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
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  storeAvatarBox: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  storeTitleBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeHeroName: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sellerSub: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  pillBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginTop: scale(8),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  statusPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
  },
  openClosedDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scale(14),
  },
  heroFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  quickIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  quickIconBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  metaCol: {
    marginLeft: scale(4),
  },
  metaSubLabel: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaValText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  verificationActionBtns: {
    flexDirection: "row",
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(12),
    paddingVertical: scale(7),
    borderRadius: scale(8),
  },
  verifyBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },

  /* ── Tab Navigation Pills ── */
  tabScroll: {
    gap: scale(8),
    paddingBottom: scale(14),
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  tabPillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  tabPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  tabContentContainer: {
    gap: scale(12),
  },

  /* ── Financial Terminal ── */
  financialBannerCard: {
    borderRadius: scale(16),
    borderWidth: 1.5,
    padding: scale(16),
    marginBottom: scale(4),
  },
  finHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  finHeaderLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  finLargeAmount: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    marginTop: scale(2),
    letterSpacing: -0.4,
  },
  finWalletBadge: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  finBannerStatsRow: {
    flexDirection: "row",
    gap: scale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(16, 185, 129, 0.3)",
    paddingTop: scale(10),
  },
  finBannerStatBox: {
    flex: 1,
  },
  finMiniLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
  },
  finMiniVal: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginTop: scale(2),
  },
  gridTwoCols: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(10),
  },
  finMetricCard: {
    width: "48.5%",
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(12),
  },
  kpiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(6),
  },
  iconBoxMini: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(7),
    alignItems: "center",
    justifyContent: "center",
  },
  finCardLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  finCardAmount: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  finCardSub: {
    fontSize: moderateScale(9.5),
    marginTop: scale(2),
  },
  sectionContainerCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
  },
  cardHeaderFlex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  cardHeaderTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  bankInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(12),
    marginTop: scale(10),
  },
  bankInfoCol: {
    width: "47%",
  },
  bankValueText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(2),
  },

  /* ── Customer Intelligence ── */
  countBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  countBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#0284C7",
  },
  emptyContentBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(24),
    gap: scale(6),
  },
  emptyPromptText: {
    fontSize: moderateScale(11.5),
    textAlign: "center",
  },
  customerCardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  customerAvatarMini: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  customerAvatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: moderateScale(13),
  },
  customerName: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  customerContact: {
    fontSize: moderateScale(10.5),
    marginTop: scale(1),
  },
  customerSpent: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
  },
  customerOrderCount: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  orderItemCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  orderTopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumberText: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
  },
  orderDateText: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  orderAmountText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  orderStatusPill: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(5),
    marginTop: scale(2),
  },
  orderStatusPillText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  orderItemsList: {
    marginTop: scale(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#CBD5E1",
    paddingTop: scale(6),
    gap: scale(2),
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: moderateScale(10.5),
    flex: 1,
  },
  itemPrice: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },

  /* ── Products Tab ── */
  productCardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  productThumb: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(8),
  },
  productThumbPlaceholder: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  productCategory: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  productMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(2),
  },
  productPrice: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  productOrigPrice: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  stockBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(5),
  },
  stockBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },

  /* ── Withdrawals Tab ── */
  withdrawalItemCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  withdrawalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  withdrawalAmount: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  withdrawalDate: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  payoutRefText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    marginTop: scale(2),
  },
  withdrawalActionBtnRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: scale(8),
  },
  miniActionBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  miniActionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9.5),
    fontWeight: "800",
  },

  /* ── Risk & Tickets Tab ── */
  riskCardBanner: {
    borderRadius: scale(14),
    borderWidth: 1.5,
    padding: scale(14),
  },
  riskTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  riskReasonText: {
    fontSize: moderateScale(10.5),
    marginTop: scale(2),
  },
  ticketCardItem: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  ticketTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketNumText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  ticketSubject: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    marginTop: scale(1),
  },
  ticketDate: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },

  /* ── Modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: scale(20),
  },
  modalBox: {
    width: "100%",
    maxWidth: scale(380),
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(20),
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  modalHeading: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  modalDesc: {
    fontSize: moderateScale(11.5),
    lineHeight: scale(16),
  },
  inputLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    marginBottom: scale(4),
  },
  textInputStyle: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    fontSize: moderateScale(12.5),
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(16),
  },
  modalCancelBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  modalConfirmBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  modalConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "800",
  },

  /* ── Filter Sub-Chips ── */
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginTop: scale(10),
  },
  subFilterChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  subFilterChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  subFilterChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  subFilterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* ── Detailed Order & Claim Cards ── */
  orderCardDetailed: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(14),
    gap: scale(10),
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumberTextLarge: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  orderDateSub: {
    fontSize: moderateScale(10.5),
    marginTop: scale(2),
  },
  claimTypeTag: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(5),
  },
  claimTypeTagText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
  },

  /* Buyer & Reason Row */
  buyerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  buyerInfoText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  buyerInfoSubText: {
    fontSize: moderateScale(10.5),
  },
  claimReasonText: {
    fontSize: moderateScale(11),
  },

  /* Order Products list */
  orderProductsContainer: {
    gap: scale(8),
  },
  itemsHeaderLabel: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  orderProductRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(6),
    borderBottomWidth: 1,
  },
  itemImageThumb: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(6),
  },
  itemImagePlaceholder: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  productItemTitle: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  productItemMeta: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  productItemTotal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },

  /* Order Financial Breakdown */
  orderFinBreakdown: {
    borderTopWidth: 1,
    paddingTop: scale(8),
    gap: scale(4),
  },
  orderFinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderFinLabel: {
    fontSize: moderateScale(11),
  },
  orderFinVal: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  orderFinLabelBold: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  orderFinValBold: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
  },
  orderPaymentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(4),
  },
  paymentMethodLabel: {
    fontSize: moderateScale(10.5),
  },
  paymentStatusTag: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  loadMoreItemsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    marginTop: scale(10),
    gap: scale(6),
  },
  loadMoreItemsBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
});
