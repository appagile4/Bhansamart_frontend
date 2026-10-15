import VendorHeader from "@/components/VendorComponent/header";
import { useLocalSearchParams, useRouter } from "expo-router";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  updateVendorOrderStatus,
  vendorOrderNewRealtime,
  OrderRecord,
} from "@/store/slices/orderSlice";
import socketService from "@/store/services/socketService";

const FILTER_TABS = ["All", "Pending", "Preparing", "Ready", "Completed", "Cancelled"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const getStatusColor = (status: string) => {
  switch (status) {
    case "PLACED":
    case "New":
    case "Pending":
      return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Pending" };
    case "ACCEPTED":
    case "PREPARING":
    case "Preparing":
      return { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", label: "Preparing" };
    case "READY_FOR_PICKUP":
    case "Ready":
      return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Ready" };
    case "OUT_FOR_DELIVERY":
      return { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE", label: "Out for Delivery" };
    case "DELIVERED":
    case "Delivered":
    case "Completed":
      return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Completed" };
    case "REJECTED":
    case "CANCELLED":
    case "Cancelled":
      return { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", label: "Cancelled" };
    default:
      return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", label: status };
  }
};

const VendorOrderItemCard = memo(function VendorOrderItemCard({
  item,
  actionLoading,
  onUpdateStatus,
}: {
  item: OrderRecord;
  actionLoading: boolean;
  onUpdateStatus: (id: string, newStatus: string, reason?: string) => void;
}) {
  const router = useRouter();
  const statusStyle = getStatusColor(item.orderStatus);
  const formattedTime = item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  const customerName =
    item.customer?.name || (item as any).customerName || "Customer";
  const customerPhone =
    item.customer?.phone ||
    item.deliveryAddress?.phone ||
    (item as any).customerPhone ||
    "N/A";
  const address =
    item.deliveryAddress?.addressLine || (item as any).address || "Kathmandu";

  const handleOpenDetails = () => {
    router.push({
      pathname: "/Screens/vendorScreens/orderdetails",
      params: { orderId: item._id, orderNumber: item.orderNumber },
    } as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleOpenDetails}
      style={styles.orderCard}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
            <Text style={styles.orderId}>{item.orderNumber}</Text>
            <Feather name="chevron-right" size={scale(15)} color="#94A3B8" />
          </View>
          <Text style={styles.orderTime}>{formattedTime}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Customer & Address Details */}
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={scale(14)} color="#64748B" />
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.customerPhone}>({customerPhone})</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={scale(14)} color="#64748B" />
          <Text style={styles.addressText} numberOfLines={1}>
            {address}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="basket-outline" size={scale(14)} color="#64748B" />
          <Text style={styles.itemsCountText}>
            {item.totalCount || item.items?.length || 1} items &middot; Total:{" "}
            <Text style={styles.amountText}>NPR {item.totalAmount}</Text>
          </Text>
        </View>

        {/* Item Summaries for Kitchen/Fulfillment */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsPreviewBox}>
            {item.items.map((it, idx) => (
              <Text key={idx} style={styles.itemPreviewLine} numberOfLines={1}>
                &bull; {it.quantity}x {it.name} ({it.weight || "1 unit"})
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        {item.orderStatus === "PLACED" && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              disabled={actionLoading}
              onPress={() => {
                Alert.alert(
                  "Decline Order",
                  "Are you sure you want to decline this order?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Out of Stock",
                      style: "destructive",
                      onPress: () =>
                        onUpdateStatus(item._id, "REJECTED", "Items Out of Stock"),
                    },
                    {
                      text: "Store Busy",
                      style: "destructive",
                      onPress: () =>
                        onUpdateStatus(item._id, "REJECTED", "Store Busy"),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              disabled={actionLoading}
              onPress={() => onUpdateStatus(item._id, "ACCEPTED")}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {(item.orderStatus === "ACCEPTED" || item.orderStatus === "PREPARING") && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.readyBtn]}
            disabled={actionLoading}
            onPress={() => onUpdateStatus(item._id, "READY_FOR_PICKUP")}
          >
            <MaterialCommunityIcons name="check-all" size={scale(16)} color="#FFFFFF" />
            <Text style={styles.readyBtnText}>Mark Order Ready</Text>
          </TouchableOpacity>
        )}

        {item.orderStatus === "READY_FOR_PICKUP" && (
          <View style={styles.readyNotice}>
            <Ionicons name="bicycle" size={scale(16)} color="#008080" />
            <Text style={styles.readyNoticeText}>Waiting for Delivery Partner</Text>
          </View>
        )}

        {item.orderStatus === "OUT_FOR_DELIVERY" && (
          <View style={styles.readyNotice}>
            <Ionicons name="bicycle" size={scale(16)} color="#7C3AED" />
            <Text style={[styles.readyNoticeText, { color: "#7C3AED" }]}>
              Order is Out for Delivery
            </Text>
          </View>
        )}

        {item.orderStatus === "DELIVERED" && (
          <View style={styles.deliveredNotice}>
            <Ionicons name="checkmark-circle" size={scale(16)} color="#16A34A" />
            <Text style={styles.deliveredNoticeText}>Order Delivered Successfully</Text>
          </View>
        )}

        {(item.orderStatus === "REJECTED" || item.orderStatus === "CANCELLED") && (
          <View style={styles.cancelledNotice}>
            <Ionicons name="close-circle" size={scale(16)} color="#DC2626" />
            <Text style={styles.cancelledNoticeText}>
              {item.rejectionReason || "Order Declined"}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function VendorOrderScreen() {
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ status?: string; filter?: string }>();
  const { vendorOrders, vendorPendingCount, vendorLoading, actionLoading } =
    useAppSelector((state) => state.order);

  const [selectedFilter, setSelectedFilter] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync route params (e.g. from SideMenu: pending, completed, all)
  useEffect(() => {
    const raw = (params.status || params.filter || "").toLowerCase().trim();
    if (!raw) return;

    if (raw === "pending" || raw === "new") {
      setSelectedFilter("Pending");
    } else if (raw === "completed" || raw === "delivered") {
      setSelectedFilter("Completed");
    } else if (raw === "preparing") {
      setSelectedFilter("Preparing");
    } else if (raw === "ready") {
      setSelectedFilter("Ready");
    } else if (raw === "cancelled" || raw === "rejected") {
      setSelectedFilter("Cancelled");
    } else if (raw === "all") {
      setSelectedFilter("All");
    }
  }, [params.status, params.filter]);

  // ── 1. Fetch live orders & Connect Real-Time Socket ─────────────────
  useEffect(() => {
    dispatch(fetchVendorOrders());

    // Connect vendor socket
    socketService.connect(true).then(() => {
      socketService.subscribeToVendorOrders();
    });

    // Listen for new orders emitted directly to this vendor
    const unsubscribeNew = socketService.onNewVendorOrder((incomingOrder) => {
      dispatch(vendorOrderNewRealtime(incomingOrder));
    });

    // Listen for status updates
    const unsubscribeStatus = socketService.onOrderStatusUpdated((update) => {
      dispatch(orderStatusUpdatedRealtime(update));
    });

    return () => {
      unsubscribeNew();
      unsubscribeStatus();
    };
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  // ── 2. Handle Status Transitions (Accept / Reject / Ready) ───────────
  const handleUpdateStatus = useCallback(
    async (orderId: string, newStatus: string, reason?: string) => {
      try {
        const result = await dispatch(
          updateVendorOrderStatus({ orderId, status: newStatus, reason })
        );

        if (updateVendorOrderStatus.fulfilled.match(result)) {
          console.log(`[VendorOrder] Status updated successfully to ${newStatus}`);
        } else {
          Alert.alert(
            "Action Failed",
            (result.payload as string) || "Could not update order status."
          );
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Something went wrong.");
      }
    },
    [dispatch]
  );

  // ── 3. Filter and Search Logic ──────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return vendorOrders.filter((order) => {
      // Filter by tab
      if (selectedFilter === "Pending") {
        if (order.orderStatus !== "PLACED") return false;
      } else if (selectedFilter === "Preparing") {
        if (order.orderStatus !== "ACCEPTED" && order.orderStatus !== "PREPARING")
          return false;
      } else if (selectedFilter === "Ready") {
        if (
          order.orderStatus !== "READY_FOR_PICKUP" &&
          order.orderStatus !== "OUT_FOR_DELIVERY"
        )
          return false;
      } else if (selectedFilter === "Completed") {
        if (order.orderStatus !== "DELIVERED") return false;
      } else if (selectedFilter === "Cancelled") {
        if (order.orderStatus !== "CANCELLED" && order.orderStatus !== "REJECTED")
          return false;
      }

      // Search Query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNum = order.orderNumber.toLowerCase().includes(query);
        const matchesName = (
          order.customer?.name ||
          (order as any).customerName ||
          ""
        )
          .toLowerCase()
          .includes(query);
        return matchesNum || matchesName;
      }

      return true;
    });
  }, [vendorOrders, selectedFilter, searchQuery]);

  const renderOrderItem = useCallback(
    ({ item }: { item: OrderRecord }) => (
      <VendorOrderItemCard
        item={item}
        actionLoading={actionLoading}
        onUpdateStatus={handleUpdateStatus}
      />
    ),
    [actionLoading, handleUpdateStatus]
  );

  const keyExtractor = useCallback((item: OrderRecord) => item._id, []);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Vendor Header */}
      <VendorHeader />

      {/* Screen Title Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Order Management</Text>
          {vendorPendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {vendorPendingCount} Pending
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          Accept incoming customer orders in real time
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          placeholder="Search order # or customer..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        {FILTER_TABS.map((tab) => {
          const isSelected = selectedFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedFilter(tab)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders FlatList */}
      <FlatList
        data={filteredOrders}
        keyExtractor={keyExtractor}
        renderItem={renderOrderItem}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={vendorLoading}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={scale(48)}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === "Pending"
                ? "Waiting for incoming customer orders..."
                : selectedFilter === "Completed"
                ? "No completed orders found."
                : "There are no orders matching your current filter."}
            </Text>
          </View>
        }
      />
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#016073",
  },
  pendingBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  pendingBadgeText: {
    color: "#1D4ED8",
    fontSize: moderateScale(11.5),
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    paddingHorizontal: scale(12),
    height: moderateScale(40),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#1E293B",
    padding: 0,
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  filterChipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(100),
    gap: moderateScale(12),
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  orderId: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  orderTime: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  cardBody: {
    gap: moderateScale(4),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  customerName: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#1E293B",
  },
  customerPhone: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  addressText: {
    fontSize: moderateScale(12),
    color: "#64748B",
    flex: 1,
  },
  itemsCountText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  amountText: {
    fontWeight: "700",
    color: "#0F172A",
  },
  itemsPreviewBox: {
    backgroundColor: "#F8FAFC",
    padding: scale(8),
    borderRadius: scale(8),
    marginTop: scale(4),
    gap: scale(2),
  },
  itemPreviewLine: {
    fontSize: moderateScale(11.5),
    color: "#475569",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: moderateScale(10),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
  },
  rejectBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#DC2626",
  },
  acceptBtn: {
    backgroundColor: "#059669",
  },
  acceptBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  readyBtn: {
    flexDirection: "row",
    gap: scale(6),
    backgroundColor: "#008080",
  },
  readyBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  readyNotice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#F0FDFA",
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
  },
  readyNoticeText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#008080",
  },
  deliveredNotice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#F0FDF4",
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
  },
  deliveredNoticeText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#16A34A",
  },
  cancelledNotice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#FEF2F2",
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
  },
  cancelledNoticeText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#DC2626",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
    gap: moderateScale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#64748B",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
});
