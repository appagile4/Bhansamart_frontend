import VendorHeader from "@/components/VendorComponent/header";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchVendorOrders,
  orderStatusUpdatedRealtime,
  vendorOrderNewRealtime,
  OrderRecord,
} from "@/store/slices/orderSlice";
import socketService from "@/store/services/socketService";

const TABS = ["All", "Active", "Out For Delivery", "Delivered"] as const;
type TabType = (typeof TABS)[number];

const getDeliveryStatus = (order: OrderRecord) => {
  const status = order.orderStatus;
  const hasRider = !!order.assignedDeliveryBoy;

  switch (status) {
    case "OUT_FOR_DELIVERY":
      return {
        bg: "#F5F3FF",
        text: "#7C3AED",
        border: "#DDD6FE",
        label: "Out For Delivery",
        icon: "motorbike" as const,
      };
    case "READY_FOR_PICKUP":
      return {
        bg: "#F0FDF4",
        text: "#15803D",
        border: "#BBF7D0",
        label: hasRider ? "Rider Arrived / Ready" : "Ready For Pickup",
        icon: "store" as const,
      };
    case "ACCEPTED":
    case "PREPARING":
      return {
        bg: "#FFFBEB",
        text: "#B45309",
        border: "#FDE68A",
        label: hasRider ? "Rider Assigned" : "Preparing / Dispatching",
        icon: "clock-outline" as const,
      };
    case "DELIVERED":
      return {
        bg: "#F8FAFC",
        text: "#475569",
        border: "#E2E8F0",
        label: "Delivered",
        icon: "check-circle" as const,
      };
    case "CANCELLED":
    case "REJECTED":
      return {
        bg: "#FEF2F2",
        text: "#B91C1C",
        border: "#FECACA",
        label: "Cancelled",
        icon: "close-circle" as const,
      };
    case "PLACED":
    default:
      return {
        bg: "#EFF6FF",
        text: "#1D4ED8",
        border: "#BFDBFE",
        label: "New / Dispatching",
        icon: "bell-ring-outline" as const,
      };
  }
};

export default function VendorDeliveryScreen() {
  const dispatch = useAppDispatch();
  const { vendorOrders, vendorLoading } = useAppSelector((state) => state.order);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(() => {
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  useEffect(() => {
    loadData();

    // Connect vendor socket & subscribe to store room
    socketService.connect("vendor").then(() => {
      socketService.subscribeToVendorOrders();
    });

    const unsubscribeNew = socketService.onNewVendorOrder((incomingOrder) => {
      dispatch(vendorOrderNewRealtime(incomingOrder));
      loadData();
    });

    const unsubscribeStatus = socketService.onOrderStatusUpdated((update) => {
      dispatch(orderStatusUpdatedRealtime(update));
      loadData();
    });

    const unsubscribeDelivery = socketService.onDeliveryPartnerAssigned(() => {
      loadData();
    });

    return () => {
      unsubscribeNew();
      unsubscribeStatus();
      unsubscribeDelivery();
    };
  }, [dispatch, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchVendorOrders());
    setRefreshing(false);
  };

  // Metrics dynamically computed from real vendor orders
  const metrics = useMemo(() => {
    let active = 0;
    let outForDelivery = 0;
    let delivered = 0;

    vendorOrders.forEach((o) => {
      if (
        ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(
          o.orderStatus
        )
      ) {
        active++;
      }
      if (o.orderStatus === "OUT_FOR_DELIVERY") {
        outForDelivery++;
      }
      if (o.orderStatus === "DELIVERED") {
        delivered++;
      }
    });

    const total = vendorOrders.length;
    const nonCancelled = vendorOrders.filter(
      (o) => !["CANCELLED", "REJECTED"].includes(o.orderStatus)
    ).length;
    const onTimeRate = total > 0 ? Math.round((nonCancelled / total) * 100) : 100;

    return {
      active,
      outForDelivery,
      delivered,
      onTimeRate: `${onTimeRate}%`,
    };
  }, [vendorOrders]);

  // Tab filtering & Search query
  const filteredDeliveries = useMemo(() => {
    return vendorOrders.filter((order) => {
      // Tab filter
      if (activeTab === "Active") {
        if (
          !["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(
            order.orderStatus
          )
        ) {
          return false;
        }
      } else if (activeTab === "Out For Delivery") {
        if (order.orderStatus !== "OUT_FOR_DELIVERY") {
          return false;
        }
      } else if (activeTab === "Delivered") {
        if (order.orderStatus !== "DELIVERED") {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const orderNum = order.orderNumber?.toLowerCase() || "";
        const riderName =
          order.assignedDeliveryBoy?.fullName?.toLowerCase() || "";
        const custName = order.customer?.name?.toLowerCase() || "";
        const address =
          order.deliveryAddress?.addressLine?.toLowerCase() || "";

        return (
          orderNum.includes(query) ||
          riderName.includes(query) ||
          custName.includes(query) ||
          address.includes(query)
        );
      }

      return true;
    });
  }, [vendorOrders, activeTab, searchQuery]);

  const handleCallRider = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert(
        "Rider Contact",
        "A delivery partner has not yet been assigned to this order, or phone contact is unavailable."
      );
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert("Error", `Could not open dialer for ${name || "rider"}.`);
    });
  };

  const handleCallCustomer = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert("Customer Contact", "Customer contact number is unavailable.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert("Error", `Could not open dialer for ${name || "customer"}.`);
    });
  };

  const renderDeliveryCard = ({ item }: { item: OrderRecord }) => {
    const statusStyle = getDeliveryStatus(item);
    const rider = item.assignedDeliveryBoy;
    const isPickedUp = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(item.orderStatus);

    const formattedTime = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now";

    return (
      <View style={styles.card}>
        {/* Card Header: Order Number, Time & Status Badge */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.etaText}>
              Placed: <Text style={styles.etaHighlight}>{formattedTime}</Text>
              {item.estimatedDeliveryTime ? ` • ETA: ${item.estimatedDeliveryTime}` : ""}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
            ]}
          >
            <MaterialCommunityIcons
              name={statusStyle.icon}
              size={scale(12)}
              color={statusStyle.text}
              style={{ marginRight: scale(4) }}
            />
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Card Body: Rider Details & Customer Delivery Address */}
        <View style={styles.cardBody}>
          {/* Rider Section */}
          <View
            style={[
              styles.riderInfoBox,
              !rider && styles.riderInfoBoxSearching,
            ]}
          >
            <View style={styles.riderAvatar}>
              <MaterialCommunityIcons
                name="motorbike"
                size={scale(18)}
                color={rider ? "#0F766E" : "#94A3B8"}
              />
            </View>
            <View style={{ flex: 1 }}>
              {rider ? (
                <>
                  <View style={styles.riderNameRow}>
                    <Text style={styles.riderName}>{rider.fullName}</Text>
                    {rider.metrics?.rating ? (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={scale(10)} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {Number(rider.metrics.rating).toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.riderSubText}>
                    {rider.phone ? rider.phone : "No Phone"} •{" "}
                    {rider.vehicleDetails?.vehicleType || "Motorbike"}
                    {rider.vehicleDetails?.vehicleNumber
                      ? ` (${rider.vehicleDetails.vehicleNumber})`
                      : ""}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.riderSearchingText}>
                    Searching Delivery Partner...
                  </Text>
                  <Text style={styles.riderSearchingSubText}>
                    Automated dispatch is locating the nearest active rider
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Customer & Destination */}
          <View style={styles.destinationRow}>
            <Ionicons name="location-sharp" size={scale(16)} color="#2563EB" />
            <View style={{ flex: 1, marginLeft: scale(8) }}>
              <Text style={styles.customerName}>
                Deliver to: {item.customer?.name || "Customer"}
                {item.deliveryAddress?.phone ? ` (${item.deliveryAddress.phone})` : ""}
              </Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {item.deliveryAddress?.addressLine || "Kathmandu Address"}
              </Text>
            </View>
          </View>

          {/* Items & Payment pill */}
          <View style={styles.itemsSummaryRow}>
            <Text style={styles.itemsSummaryText}>
              📦 {item.totalCount || item.items?.length || 1} Item(s) • Total: ₹{item.totalAmount}
            </Text>
            <Text style={styles.paymentMethodText}>
              {item.paymentMethod || "COD"} ({item.paymentStatus || "pending"})
            </Text>
          </View>
        </View>

        {/* Card Footer: Handover OTP & Rider Action Buttons */}
        <View style={styles.cardFooter}>
          {/* Handover OTP Box */}
          {item.vendorPickupOtp ? (
            isPickedUp ? (
              <View style={styles.otpCompletedBox}>
                <Ionicons name="checkmark-circle" size={scale(14)} color="#15803D" />
                <Text style={styles.otpCompletedText}>Package Handed Over</Text>
              </View>
            ) : (
              <View style={styles.otpActiveBox}>
                <Text style={styles.otpLabel}>Handover OTP:</Text>
                <Text style={styles.otpCode}>{item.vendorPickupOtp}</Text>
              </View>
            )
          ) : (
            <View style={styles.otpWaitingBox}>
              <Text style={styles.otpWaitingText}>OTP ready upon dispatch</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {rider?.phone ? (
              <TouchableOpacity
                style={styles.callRiderBtn}
                onPress={() => handleCallRider(rider.phone, rider.fullName)}
                activeOpacity={0.8}
              >
                <Feather name="phone-call" size={scale(13)} color="#FFFFFF" />
                <Text style={styles.callRiderBtnText}>Call Rider</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.callRiderBtn, styles.callRiderBtnDisabled]}
                disabled
              >
                <Feather name="clock" size={scale(13)} color="#94A3B8" />
                <Text style={styles.callRiderBtnTextDisabled}>Awaiting Rider</Text>
              </TouchableOpacity>
            )}

            {item.deliveryAddress?.phone ? (
              <TouchableOpacity
                style={styles.callCustomerBtn}
                onPress={() =>
                  handleCallCustomer(
                    item.deliveryAddress?.phone || item.customer?.phone,
                    item.customer?.name
                  )
                }
                activeOpacity={0.8}
              >
                <Feather name="user" size={scale(13)} color="#0F766E" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Unified Vendor Header */}
      <VendorHeader activeRoute="/VendorMain/delivery" />

      {/* Sub Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery & Fleet</Text>
        <Text style={styles.headerSubtitle}>
          Live dispatch, handover OTP verification, and rider tracking
        </Text>
      </View>

      {/* Metric Highlights dynamically computed from real orders */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNum}>{metrics.active}</Text>
          <Text style={styles.metricLabel}>Active Dispatches</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: "#7C3AED" }]}>
            {metrics.outForDelivery}
          </Text>
          <Text style={styles.metricLabel}>Out For Delivery</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: "#16A34A" }]}>
            {metrics.delivered}
          </Text>
          <Text style={styles.metricLabel}>Delivered</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isSelected = activeTab === tab;
          let count = 0;
          if (tab === "All") count = vendorOrders.length;
          else if (tab === "Active") count = metrics.active;
          else if (tab === "Out For Delivery") count = metrics.outForDelivery;
          else if (tab === "Delivered") count = metrics.delivered;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  isSelected && styles.tabButtonTextActive,
                ]}
              >
                {tab} {count > 0 ? `(${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order #, Rider, or Customer..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Deliveries FlatList */}
      {vendorLoading && !refreshing && vendorOrders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading live delivery fleet...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          keyExtractor={(d) => String(d._id || d.orderNumber)}
          renderItem={renderDeliveryCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0F766E"]}
              tintColor="#0F766E"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="moped-outline"
                size={scale(56)}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? "No matching deliveries found"
                  : `No ${activeTab !== "All" ? activeTab : ""} deliveries`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try checking your search keywords or clear the search filter."
                  : "When customers place orders and riders are dispatched, they will appear here in real-time."}
              </Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={onRefresh}
                activeOpacity={0.85}
              >
                <Feather name="refresh-cw" size={scale(14)} color="#FFFFFF" />
                <Text style={styles.refreshBtnText}>Refresh Fleet</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#0F766E",
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  metricsRow: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(6),
    gap: scale(10),
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  metricNum: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#0F766E",
  },
  metricLabel: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    marginTop: scale(2),
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    gap: scale(8),
  },
  tabButton: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
    backgroundColor: "#E2E8F0",
  },
  tabButtonActive: {
    backgroundColor: "#0F766E",
  },
  tabButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#475569",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(16),
    marginBottom: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? moderateScale(8) : moderateScale(4),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12.5),
    color: "#1E293B",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(12),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  orderNumber: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F766E",
  },
  etaText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(2),
  },
  etaHighlight: {
    fontWeight: "700",
    color: "#1E293B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  cardBody: {
    padding: scale(14),
    gap: moderateScale(10),
  },
  riderInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#CCFBF1",
    gap: scale(10),
  },
  riderInfoBoxSearching: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  riderAvatar: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  riderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  riderName: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(5),
    paddingVertical: scale(1),
    borderRadius: scale(4),
    gap: scale(2),
  },
  ratingText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#92400E",
  },
  riderSubText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  riderSearchingText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#92400E",
  },
  riderSearchingSubText: {
    fontSize: moderateScale(10.5),
    color: "#B45309",
    marginTop: scale(1),
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  customerName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
  },
  addressText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1),
    lineHeight: moderateScale(16),
  },
  itemsSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
  },
  itemsSummaryText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#334155",
  },
  paymentMethodText: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    textTransform: "capitalize",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  otpActiveBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  otpLabel: {
    fontSize: moderateScale(11),
    color: "#0F766E",
    fontWeight: "700",
  },
  otpCode: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#0F766E",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    letterSpacing: 1.5,
  },
  otpCompletedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
  },
  otpCompletedText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#15803D",
  },
  otpWaitingBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  otpWaitingText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    fontStyle: "italic",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  callRiderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#0F766E",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(8),
  },
  callRiderBtnDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  callRiderBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  callRiderBtnTextDisabled: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#94A3B8",
  },
  callCustomerBtn: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    padding: scale(7),
    borderRadius: scale(8),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
    paddingHorizontal: scale(30),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
    marginTop: moderateScale(12),
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    marginTop: moderateScale(6),
    lineHeight: moderateScale(18),
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#0F766E",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(9),
    borderRadius: scale(8),
    marginTop: moderateScale(18),
  },
  refreshBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
