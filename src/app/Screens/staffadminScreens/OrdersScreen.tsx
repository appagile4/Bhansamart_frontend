import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";
import AdminStoreFilterDropdown, {
  getStoreDisplayName,
} from "@/components/AdminStoreFilterDropdown";
import {
  fetchStaffAssignedVendorsApi,
  fetchStaffDashboardOverviewApi,
} from "@/store/services/adminService";
import api from "@/store/services/api";

export default function StaffAdminOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal & Live Order Detail State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const activeOrderIdRef = useRef<string | null>(null);

  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors) {
        setAssignedVendors(res.vendors);
      }
    } catch (e) {
      console.warn("[Orders] Error loading vendors", e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get("/admin/staff-operations/orders", {
        params: {
          vendorId: selectedVendorId !== "all" ? selectedVendorId : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      const list = res.data?.data?.orders || res.data?.orders || [];
      if (Array.isArray(list)) {
        setOrders(list);
      }
    } catch (e: any) {
      console.error("[OrdersScreen] Error loading orders:", {
        message: e?.message,
        statusCode: e?.statusCode,
        raw: e?.raw,
      });
      // Fallback to dashboard recent orders
      try {
        const fallbackRes = await fetchStaffDashboardOverviewApi({
          vendorId: selectedVendorId !== "all" ? selectedVendorId : undefined,
        });
        if (fallbackRes?.data?.recentOrders) {
          setOrders(fallbackRes.data.recentOrders);
        }
      } catch (err) {
        console.error("[OrdersScreen] Fallback fetch error:", err);
      }
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
    loadOrders();
  }, [selectedVendorId, statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // ── Modal Actions & Live Fetching ──────────────────────────────────────
  const handleOpenOrderModal = (item: any) => {
    setSelectedOrder(item);
    setOrderDetail(null);
    setModalLoading(true);
    setModalError(null);

    const targetId = item._id || item.id || item.orderNumber;
    activeOrderIdRef.current = targetId;
    fetchLiveOrderDetail(targetId);
  };

  const fetchLiveOrderDetail = async (orderId: string) => {
    try {
      setModalLoading(true);
      setModalError(null);

      const res = await api.get(`/orders/${orderId}`);
      const fullData = res.data?.data || res.data;

      // Prevent race conditions: only update if modal is still focused on this order
      if (activeOrderIdRef.current === orderId) {
        setOrderDetail(fullData);
      }
    } catch (err: any) {
      if (activeOrderIdRef.current === orderId) {
        console.warn("[OrdersScreen] Live order detail fetch failed:", err);
        setModalError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load full live details. Showing summary."
        );
      }
    } finally {
      if (activeOrderIdRef.current === orderId) {
        setModalLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
    setModalLoading(false);
    setModalError(null);
    activeOrderIdRef.current = null;
  };

  // Filter local search if not querying backend
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const num = (o.orderNumber || "").toLowerCase();
      const vName = (
        o.vendor?.businessDetails?.businessName ||
        o.vendorName ||
        ""
      ).toLowerCase();
      const cName = (o.customer?.name || "").toLowerCase();
      return num.includes(q) || vName.includes(q) || cName.includes(q);
    });
  }, [orders, search]);

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const statusFilterItems = [
    { key: "ALL", label: "All Orders", icon: "layers-outline" },
    { key: "PLACED", label: "Placed", icon: "time-outline" },
    { key: "ACCEPTED", label: "Accepted", icon: "checkmark-circle-outline" },
    { key: "PREPARING", label: "Preparing", icon: "restaurant-outline" },
    { key: "READY_FOR_PICKUP", label: "Ready", icon: "bag-check-outline" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "bicycle-outline" },
    { key: "DELIVERED", label: "Delivered", icon: "checkmark-done-circle-outline" },
    { key: "CANCELLED", label: "Cancelled", icon: "close-circle-outline" },
  ];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    for (const o of orders) {
      const st = o.orderStatus || "PLACED";
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [orders]);

  // Authoritative active order to display
  const activeOrder = orderDetail || selectedOrder;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StaffAdminHeader title="Orders Management" showBack />

      <View style={styles.content}>
        {/* Store Filter Dropdown */}
        <AdminStoreFilterDropdown
          vendors={assignedVendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={setSelectedVendorId}
        />

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
          <Feather name="search" size={scale(16)} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search Order Number, Customer, or Store..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={scale(16)} color={textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Status Filter Chips */}
        <View style={styles.statusChipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusChipsRow}
          >
            {statusFilterItems.map((item) => {
              const isSelected = statusFilter === item.key;
              const count = statusCounts[item.key] || 0;

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.75}
                  onPress={() => setStatusFilter(item.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? "#0284C7" : cardBg,
                      borderColor: isSelected ? "#0284C7" : border,
                    },
                    isSelected && styles.filterChipActive,
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={scale(14)}
                    color={isSelected ? "#FFFFFF" : textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? "#FFFFFF" : textPrimary },
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {count > 0 ? (
                    <View
                      style={[
                        styles.chipBadge,
                        {
                          backgroundColor: isSelected
                            ? "rgba(255, 255, 255, 0.25)"
                            : isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(0, 0, 0, 0.05)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipBadgeText,
                          { color: isSelected ? "#FFFFFF" : textSecondary },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Orders List */}
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading orders...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item._id || item.id || item.orderNumber}
            renderItem={({ item }) => {
              const vendorName =
                item.vendor?.businessDetails?.businessName ||
                item.vendorName ||
                "Assigned Store";

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenOrderModal(item)}
                  style={[styles.orderCard, { backgroundColor: cardBg, borderColor: border }]}
                >
                  <View style={styles.orderHeader}>
                    <View style={{ gap: moderateScale(1) }}>
                      <Text style={[styles.orderNum, { color: textPrimary }]}>
                        #{item.orderNumber}
                      </Text>
                      <Text style={[styles.vendorSubtitle, { color: textSecondary }]}>
                        Store: {vendorName}
                      </Text>
                    </View>
                    <RequestStatusBadge status={item.orderStatus} type="order" />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.orderBodyRow}>
                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: textSecondary }]}>
                        Customer
                      </Text>
                      <Text style={[styles.metaVal, { color: textPrimary }]} numberOfLines={1}>
                        {item.customer?.name || "Customer"}
                      </Text>
                    </View>

                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: textSecondary }]}>
                        Payment
                      </Text>
                      <Text style={[styles.metaVal, { color: "#0284C7" }]}>
                        Rs. {Number(item.totalAmount || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: textSecondary }]}>
                        Method
                      </Text>
                      <Text style={[styles.metaVal, { color: textPrimary }]}>
                        {item.paymentMethod === "Cash on delivery" ? "COD" : item.paymentMethod || "Online"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.timeText, { color: textSecondary }]}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                    <View style={styles.cardActionRow}>
                      <Text style={styles.actionText}>View Full Details</Text>
                      <Feather name="chevron-right" size={scale(14)} color="#0284C7" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Orders</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No orders found matching this store and status filter.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Extended Order Detail Modal ─────────────────────────────────── */}
      {selectedOrder && (
        <Modal
          visible={!!selectedOrder}
          transparent
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                    <Text style={[styles.modalTitle, { color: textPrimary }]}>
                      Order #{activeOrder.orderNumber}
                    </Text>
                    {modalLoading ? (
                      <ActivityIndicator size="small" color="#0284C7" />
                    ) : null}
                  </View>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    Fulfillment, Partner & Financial Audit
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeIconBtn}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Error Banner with Retry */}
              {modalError ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => fetchLiveOrderDetail(selectedOrder._id || selectedOrder.id || selectedOrder.orderNumber)}
                  style={styles.errorBanner}
                >
                  <Ionicons name="alert-circle-outline" size={scale(16)} color="#EF4444" />
                  <Text style={styles.errorBannerText} numberOfLines={1}>
                    {modalError}
                  </Text>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              ) : null}

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: moderateScale(12), paddingBottom: moderateScale(24) }}
              >
                {/* 1. Primary Status & Store Overview */}
                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Status</Text>
                  <RequestStatusBadge status={activeOrder.orderStatus} type="order" />
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Order Date</Text>
                  <Text style={[styles.valText, { color: textPrimary }]}>
                    {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleString() : "N/A"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Customer Payment</Text>
                  <Text style={[styles.valBold, { color: "#0284C7" }]}>
                    Rs. {Number(activeOrder.totalAmount || 0).toLocaleString()} ({activeOrder.paymentMethod})
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Payment Status</Text>
                  <Text
                    style={[
                      styles.valBold,
                      { color: activeOrder.paymentStatus === "paid" ? "#059669" : "#D97706" },
                    ]}
                  >
                    {activeOrder.paymentStatus?.toUpperCase() || "PENDING"}
                  </Text>
                </View>

                {/* 2. SECTION A: Customer Details with Navigation */}
                <View style={[styles.sectionBox, { borderColor: border }]}>
                  <TouchableOpacity
                    style={styles.sectionHeaderClickable}
                    onPress={() => {
                      const custId = activeOrder.customer?._id || activeOrder.customer;
                      if (custId) {
                        handleCloseModal();
                        router.push({
                          pathname: "/Screens/staffadminScreens/customerdetails",
                          params: { customerId: custId },
                        });
                      }
                    }}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="person-outline" size={scale(16)} color="#0284C7" />
                      <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                        Customer Details
                      </Text>
                    </View>
                    <View style={styles.linkRow}>
                      <Text style={styles.viewProfileText}>View Profile</Text>
                      <Feather name="chevron-right" size={scale(14)} color="#0284C7" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.customerCardMini}>
                    <View style={styles.custAvatar}>
                      {activeOrder.customer?.avatar ? (
                        <Image source={{ uri: activeOrder.customer.avatar }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarChar}>
                          {(activeOrder.customer?.name || "C")[0].toUpperCase()}
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.custName, { color: textPrimary }]}>
                        {activeOrder.customer?.name || "Customer Name"}
                      </Text>
                      <Text style={[styles.custMeta, { color: textSecondary }]}>
                        ID: {activeOrder.customer?._id || activeOrder.customer || "N/A"}
                      </Text>
                      <Text style={[styles.custMeta, { color: textSecondary }]}>
                        Email: {activeOrder.customer?.email || "N/A"}
                      </Text>
                      <Text style={[styles.custMeta, { color: textSecondary }]}>
                        Phone: {activeOrder.customer?.phone || activeOrder.deliveryAddress?.phone || "N/A"}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Lifetime Insights */}
                  {activeOrder.customerInsights ? (
                    <View style={styles.insightsStrip}>
                      <View style={styles.insightCol}>
                        <Text style={[styles.insightNum, { color: textPrimary }]}>
                          {activeOrder.customerInsights.totalCompletedOrders ?? 0}
                        </Text>
                        <Text style={[styles.insightLabel, { color: textSecondary }]}>
                          Orders Done
                        </Text>
                      </View>
                      <View style={styles.insightCol}>
                        <Text style={[styles.insightNum, { color: "#0284C7" }]}>
                          Rs. {Number(activeOrder.customerInsights.totalCompletedSpending || 0).toLocaleString()}
                        </Text>
                        <Text style={[styles.insightLabel, { color: textSecondary }]}>
                          Lifetime Spend
                        </Text>
                      </View>
                      <View style={styles.insightCol}>
                        <Text style={[styles.insightNum, { color: textPrimary, fontSize: moderateScale(11) }]}>
                          {activeOrder.customerInsights.lastPurchaseDate
                            ? new Date(activeOrder.customerInsights.lastPurchaseDate).toLocaleDateString()
                            : "None"}
                        </Text>
                        <Text style={[styles.insightLabel, { color: textSecondary }]}>
                          Last Purchase
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Delivery Address */}
                  {activeOrder.deliveryAddress && (
                    <View style={styles.innerAddressBox}>
                      <Text style={[styles.innerSubLabel, { color: textSecondary }]}>
                        Delivery Address
                      </Text>
                      <Text style={[styles.innerAddressText, { color: textPrimary }]}>
                        {activeOrder.deliveryAddress.addressLine || "Address on record"}
                      </Text>
                      {activeOrder.deliveryAddress.city ? (
                        <Text style={[styles.innerAddressText, { color: textSecondary }]}>
                          {activeOrder.deliveryAddress.city} {activeOrder.deliveryAddress.phone ? `• Phone: ${activeOrder.deliveryAddress.phone}` : ""}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* 3. SECTION B: Vendor Details */}
                <View style={[styles.sectionBox, { borderColor: border }]}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="storefront-outline" size={scale(16)} color="#7C3AED" />
                    <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                      Vendor Store Details
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: textSecondary }]}>Store Name</Text>
                    <Text style={[styles.infoValBold, { color: textPrimary }]}>
                      {activeOrder.vendor?.businessDetails?.businessName ||
                        activeOrder.vendorName ||
                        "Assigned Store"}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: textSecondary }]}>Vendor ID</Text>
                    <Text style={[styles.infoVal, { color: textSecondary }]}>
                      {activeOrder.vendor?._id || "N/A"}
                    </Text>
                  </View>

                  {activeOrder.vendor?.businessDetails?.businessPhone || activeOrder.vendor?.sellerDetails?.sellerPhone ? (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: textSecondary }]}>Contact Phone</Text>
                      <Text style={[styles.infoVal, { color: textPrimary }]}>
                        {activeOrder.vendor?.businessDetails?.businessPhone || activeOrder.vendor?.sellerDetails?.sellerPhone}
                      </Text>
                    </View>
                  ) : null}

                  {activeOrder.vendor?.shippingLocations?.warehouseAddress ? (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: textSecondary }]}>Warehouse</Text>
                      <Text style={[styles.infoVal, { color: textSecondary }]} numberOfLines={2}>
                        {activeOrder.vendor.shippingLocations.warehouseAddress}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: textSecondary }]}>Order Processing</Text>
                    <Text style={[styles.infoValBold, { color: "#10B981" }]}>
                      {activeOrder.orderStatus}
                    </Text>
                  </View>
                </View>

                {/* 4. SECTION C: Delivery Partner Details */}
                <View style={[styles.sectionBox, { borderColor: border }]}>
                  <View style={styles.sectionHeaderLeft}>
                    <MaterialCommunityIcons name="motorbike" size={scale(16)} color="#10B981" />
                    <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                      Delivery Partner Assignment
                    </Text>
                  </View>

                  {!activeOrder.assignedDeliveryBoy ? (
                    <View style={styles.notAssignedBox}>
                      <Ionicons name="information-circle-outline" size={scale(18)} color="#F59E0B" />
                      <Text style={styles.notAssignedText}>
                        Not Assigned • No delivery partner assigned yet
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: moderateScale(4) }}>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Partner Name</Text>
                        <Text style={[styles.infoValBold, { color: textPrimary }]}>
                          {activeOrder.assignedDeliveryBoy.fullName || "Delivery Partner"}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Partner ID</Text>
                        <Text style={[styles.infoVal, { color: textSecondary }]}>
                          {activeOrder.assignedDeliveryBoy._id || "N/A"}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Partner Phone</Text>
                        <Text style={[styles.infoVal, { color: "#10B981" }]}>
                          {activeOrder.assignedDeliveryBoy.phone || "N/A"}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Delivery Status</Text>
                        <Text style={[styles.infoValBold, { color: activeOrder.orderStatus === "DELIVERED" ? "#059669" : "#0284C7" }]}>
                          {activeOrder.deliveryAssignments?.[0]?.status || (activeOrder.deliveredAt ? "COMPLETED" : "ASSIGNED")}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Partner Earning</Text>
                        <Text style={[styles.infoValBold, { color: "#059669" }]}>
                          ₹{activeOrder.deliveryEarning || 30} (Configured Base)
                        </Text>
                      </View>

                      {activeOrder.deliveredAt ? (
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: textSecondary }]}>Delivered At</Text>
                          <Text style={[styles.infoVal, { color: textPrimary }]}>
                            {new Date(activeOrder.deliveredAt).toLocaleString()}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* 5. SECTION D: Product Details & Items Breakdown */}
                {activeOrder.items?.length > 0 && (
                  <View style={[styles.sectionBox, { borderColor: border }]}>
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="basket-outline" size={scale(16)} color="#F59E0B" />
                      <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                        Ordered Items ({activeOrder.items.length})
                      </Text>
                    </View>

                    {activeOrder.items.map((it: any, idx: number) => {
                      const itemSubtotal = Number(it.price || 0) * (it.quantity || 1);
                      return (
                        <View key={it._id || idx} style={styles.productItemCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemNameText, { color: textPrimary }]}>
                              {it.quantity}x {it.name || it.productName || "Product"}
                            </Text>
                            <Text style={[styles.itemSubText, { color: textSecondary }]}>
                              Unit: Rs. {it.price} • ID: {it.productId || it.product?._id || it.product || "N/A"}
                            </Text>
                            <Text style={[styles.itemVendorText, { color: "#7C3AED" }]}>
                              Vendor: {it.vendorName || activeOrder.vendor?.businessDetails?.businessName || "Store"}
                            </Text>
                          </View>
                          <Text style={[styles.itemTotalAmount, { color: "#0284C7" }]}>
                            Rs. {itemSubtotal.toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}

                    <View style={styles.financialDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: textSecondary }]}>Items Total</Text>
                      <Text style={[styles.summaryVal, { color: textPrimary }]}>
                        Rs. {Number(activeOrder.itemsTotal || activeOrder.totalAmount || 0).toLocaleString()}
                      </Text>
                    </View>

                    {activeOrder.deliveryCharge ? (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: textSecondary }]}>Delivery Fee</Text>
                        <Text style={[styles.summaryVal, { color: textPrimary }]}>
                          Rs. {Number(activeOrder.deliveryCharge).toLocaleString()}
                        </Text>
                      </View>
                    ) : null}

                    {activeOrder.discount ? (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: textSecondary }]}>Discount</Text>
                        <Text style={[styles.summaryVal, { color: "#EF4444" }]}>
                          - Rs. {Number(activeOrder.discount).toLocaleString()}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.summaryRow}>
                      <Text style={[styles.grandTotalLabel, { color: textPrimary }]}>Grand Total</Text>
                      <Text style={[styles.grandTotalVal, { color: "#0284C7" }]}>
                        Rs. {Number(activeOrder.totalAmount || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 6. SECTION E: COD & Financial Tracking */}
                <View style={[styles.sectionBox, { borderColor: border }]}>
                  <View style={styles.sectionHeaderLeft}>
                    <MaterialCommunityIcons name="cash-register" size={scale(16)} color="#059669" />
                    <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                      COD & Financial Tracking
                    </Text>
                  </View>

                  {activeOrder.paymentMethod === "Cash on delivery" ? (
                    <View style={{ gap: moderateScale(4) }}>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>COD Amount Due</Text>
                        <Text style={[styles.infoValBold, { color: textPrimary }]}>
                          Rs. {Number(activeOrder.codTracking?.amountDue ?? activeOrder.codDetails?.amountDue ?? activeOrder.totalAmount).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Cash Collected</Text>
                        <Text style={[styles.infoValBold, { color: "#059669" }]}>
                          Rs. {Number(activeOrder.codTracking?.amountCollected ?? activeOrder.codDetails?.amountCollected ?? (activeOrder.codDetails?.status !== "COD_PENDING" ? activeOrder.totalAmount : 0)).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Collection Status</Text>
                        <Text style={[styles.infoValBold, { color: "#0284C7" }]}>
                          {activeOrder.codTracking?.status || activeOrder.codDetails?.status || "COD_PENDING"}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Store Handover</Text>
                        <Text
                          style={[
                            styles.infoValBold,
                            {
                              color: activeOrder.codTracking?.vendorConfirmed
                                ? "#059669"
                                : activeOrder.codTracking?.handoverReceipt
                                ? "#0284C7"
                                : "#D97706",
                            },
                          ]}
                        >
                          {activeOrder.codTracking?.vendorConfirmed
                            ? "Confirmed by Vendor"
                            : activeOrder.codTracking?.handoverReceipt
                            ? `Submitted (${activeOrder.codTracking.handoverReceipt})`
                            : "Pending Cash Handover"}
                        </Text>
                      </View>

                      {activeOrder.codTracking?.discrepancy?.hasDiscrepancy ? (
                        <View style={styles.discrepancyBanner}>
                          <Ionicons name="warning-outline" size={scale(16)} color="#EF4444" />
                          <Text style={styles.discrepancyText}>
                            Discrepancy: Shortfall of Rs. {activeOrder.codTracking.discrepancy.shortfall}. Reason: {activeOrder.codTracking.discrepancy.reason}
                          </Text>
                        </View>
                      ) : null}

                      <Text style={[styles.auditNotice, { color: textSecondary }]}>
                        • Physical COD cash is handed directly to store counter. Digital wallets are not artificially inflated.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: moderateScale(4) }}>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Payment Method</Text>
                        <Text style={[styles.infoValBold, { color: textPrimary }]}>
                          {activeOrder.paymentMethod}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Payment Status</Text>
                        <Text style={[styles.infoValBold, { color: "#059669" }]}>
                          {activeOrder.paymentStatus}
                        </Text>
                      </View>
                      {activeOrder.paymentDetails?.gatewayTransactionId ? (
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: textSecondary }]}>Transaction Ref</Text>
                          <Text style={[styles.infoVal, { color: textSecondary }]}>
                            {activeOrder.paymentDetails.gatewayTransactionId}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* 7. SECTION F: Return, Refund & Claims */}
                <View style={[styles.sectionBox, { borderColor: border }]}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="swap-horizontal-outline" size={scale(16)} color="#EC4899" />
                    <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                      Returns, Refunds & Exchanges
                    </Text>
                  </View>

                  {(!activeOrder.refunds || activeOrder.refunds.length === 0) && !activeOrder.refundDetails ? (
                    <Text style={[styles.emptySectionText, { color: textSecondary }]}>
                      No return, refund, or exchange claims filed for this order.
                    </Text>
                  ) : (
                    (activeOrder.refunds || [activeOrder.refundDetails]).map((ref: any, idx: number) => (
                      <View key={ref?._id || idx} style={styles.refundBlock}>
                        <View style={styles.refundHeaderRow}>
                          <Text style={[styles.refundNum, { color: textPrimary }]}>
                            Claim #{ref.refundNumber || ref._id}
                          </Text>
                          <RequestStatusBadge status={ref.status} type="refund" />
                        </View>

                        <Text style={[styles.refundReason, { color: textSecondary }]}>
                          Reason: {ref.reason || "Customer requested refund"}
                        </Text>

                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: textSecondary }]}>Refund Amount</Text>
                          <Text style={[styles.infoValBold, { color: "#EF4444" }]}>
                            Rs. {Number(ref.amount || ref.totalAmount || 0).toLocaleString()}
                          </Text>
                        </View>

                        {ref.customerPayoutDetails ? (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: textSecondary }]}>Payout Target</Text>
                            <Text style={[styles.infoVal, { color: textPrimary }]}>
                              {ref.customerPayoutDetails.method || "Direct Payout"} ({ref.customerPayoutDetails.upiId || ref.customerPayoutDetails.accountNumber || "Masked"})
                            </Text>
                          </View>
                        ) : null}

                        {ref.vendorPaymentDetails?.transactionReference ? (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: textSecondary }]}>UTR / Reference</Text>
                            <Text style={[styles.infoVal, { color: "#10B981" }]}>
                              {ref.vendorPaymentDetails.transactionReference}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>

                {/* Close Modal Button */}
                <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal}>
                  <Text style={styles.closeBtnText}>Close Modal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(10),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    gap: scale(8),
    marginVertical: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  statusChipsWrapper: {
    marginVertical: moderateScale(4),
  },
  statusChipsRow: {
    gap: scale(8),
    paddingVertical: moderateScale(4),
    paddingRight: scale(14),
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  filterChipActive: {
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  filterChipTextActive: {
    fontWeight: "700",
  },
  chipBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(1.5),
    borderRadius: scale(10),
    marginLeft: scale(2),
  },
  chipBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(20),
  },
  loadingText: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(13),
  },
  listContent: {
    paddingBottom: moderateScale(24),
    gap: moderateScale(10),
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(12),
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNum: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  vendorSubtitle: {
    fontSize: moderateScale(11.5),
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    marginVertical: moderateScale(8),
  },
  orderBodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: moderateScale(11),
  },
  metaVal: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    marginTop: moderateScale(1),
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(8),
  },
  timeText: {
    fontSize: moderateScale(11),
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  actionText: {
    fontSize: moderateScale(12),
    color: "#0284C7",
    fontWeight: "600",
  },
  emptyBox: {
    padding: scale(24),
    borderRadius: scale(14),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(16),
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    marginTop: moderateScale(1),
  },
  closeIconBtn: {
    padding: scale(6),
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(3),
  },
  label: {
    fontSize: moderateScale(12),
  },
  valText: {
    fontSize: moderateScale(12),
  },
  valBold: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
    marginBottom: moderateScale(8),
    gap: scale(6),
  },
  errorBannerText: {
    flex: 1,
    color: "#EF4444",
    fontSize: moderateScale(11.5),
  },
  retryText: {
    color: "#0284C7",
    fontWeight: "700",
    fontSize: moderateScale(11.5),
  },
  sectionBox: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(12),
    gap: moderateScale(6),
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  sectionHeading: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  sectionHeaderClickable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  viewProfileText: {
    fontSize: moderateScale(12),
    color: "#0284C7",
    fontWeight: "600",
  },
  customerCardMini: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(4),
  },
  custAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
  },
  avatarChar: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  custName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  custMeta: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(1),
  },
  insightsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    padding: scale(8),
    borderRadius: scale(8),
    marginVertical: moderateScale(4),
  },
  insightCol: {
    flex: 1,
    alignItems: "center",
  },
  insightNum: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  insightLabel: {
    fontSize: moderateScale(10),
    marginTop: moderateScale(1),
  },
  innerAddressBox: {
    paddingTop: moderateScale(4),
  },
  innerSubLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  innerAddressText: {
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(2),
  },
  infoLabel: {
    fontSize: moderateScale(12),
  },
  infoVal: {
    fontSize: moderateScale(12),
  },
  infoValBold: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  notAssignedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    padding: scale(8),
    borderRadius: scale(8),
    gap: scale(6),
  },
  notAssignedText: {
    color: "#D97706",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  productItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  itemNameText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
  },
  itemSubText: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(1),
  },
  itemVendorText: {
    fontSize: moderateScale(10.5),
    fontWeight: "500",
    marginTop: moderateScale(1),
  },
  itemTotalAmount: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  financialDivider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    marginVertical: moderateScale(6),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(2),
  },
  summaryLabel: {
    fontSize: moderateScale(12),
  },
  summaryVal: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  grandTotalLabel: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  grandTotalVal: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  discrepancyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: scale(8),
    borderRadius: scale(8),
    gap: scale(6),
    marginVertical: moderateScale(4),
  },
  discrepancyText: {
    color: "#EF4444",
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    flex: 1,
  },
  auditNotice: {
    fontSize: moderateScale(10.5),
    fontStyle: "italic",
    marginTop: moderateScale(4),
  },
  emptySectionText: {
    fontSize: moderateScale(12),
    fontStyle: "italic",
    paddingVertical: moderateScale(4),
  },
  refundBlock: {
    paddingVertical: moderateScale(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  refundHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refundNum: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  refundReason: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(4),
  },
  closeBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: moderateScale(12),
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
});
