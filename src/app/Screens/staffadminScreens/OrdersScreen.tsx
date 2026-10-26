import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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
  }, [selectedVendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const num = (o.orderNumber || "").toLowerCase();
      const vendorName = (
        o.vendor?.businessDetails?.businessName ||
        o.vendorName ||
        ""
      ).toLowerCase();
      const q = search.trim().toLowerCase();

      const matchesSearch = !q || num.includes(q) || vendorName.includes(q);
      const matchesStatus =
        statusFilter === "ALL" ||
        (o.orderStatus || "").toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const STATUS_PILLS = [
    "ALL",
    "PLACED",
    "ACCEPTED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Orders Tracking"
        subtitle={`${orders.length} Scoped Orders`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Store Scoper */}
        <AdminStoreFilterDropdown
          vendors={assignedVendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(id) => setSelectedVendorId(id)}
          title="Assigned Store Scope"
        />

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
          <Feather name="search" size={scale(16)} color={textSecondary} />
          <TextInput
            placeholder="Search order number or store..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={scale(16)} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={{ gap: scale(6), paddingBottom: moderateScale(4) }}
        >
          {STATUS_PILLS.map((st) => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? "#0284C7" : cardBg,
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {st.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading scoped orders...
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
                  onPress={() => setSelectedOrder(item)}
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

                  <View style={styles.orderMiddle}>
                    <View style={styles.infoCol}>
                      <Text style={[styles.label, { color: textSecondary }]}>Total Amount</Text>
                      <Text style={[styles.priceText, { color: "#0284C7" }]}>
                        Rs. {Number(item.totalAmount || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={[styles.label, { color: textSecondary }]}>Payment</Text>
                      <Text style={[styles.valText, { color: textPrimary }]}>
                        {item.paymentMethod || "COD"}
                      </Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={[styles.label, { color: textSecondary }]}>Items</Text>
                      <Text style={[styles.valText, { color: textPrimary }]}>
                        {item.items?.length || 1} items
                      </Text>
                    </View>
                  </View>

                  {item.deliveryAddress?.addressLine ? (
                    <View style={[styles.addressRow, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                      <Feather name="map-pin" size={scale(12)} color={textSecondary} />
                      <Text style={[styles.addressText, { color: textSecondary }]} numberOfLines={1}>
                        {item.deliveryAddress.addressLine}
                      </Text>
                    </View>
                  ) : null}
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          visible={!!selectedOrder}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Order #{selectedOrder.orderNumber}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    Fulfillment & Delivery Details
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: moderateScale(12) }}>
                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Status</Text>
                  <RequestStatusBadge status={selectedOrder.orderStatus} type="order" />
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Store Name</Text>
                  <Text style={[styles.valBold, { color: textPrimary }]}>
                    {selectedOrder.vendor?.businessDetails?.businessName ||
                      selectedOrder.vendorName ||
                      "Assigned Store"}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Customer Payment</Text>
                  <Text style={[styles.valBold, { color: "#0284C7" }]}>
                    Rs. {Number(selectedOrder.totalAmount || 0).toLocaleString()} ({selectedOrder.paymentMethod})
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.label, { color: textSecondary }]}>Payment Status</Text>
                  <Text style={[styles.valBold, { color: selectedOrder.paymentStatus === "paid" ? "#059669" : "#D97706" }]}>
                    {selectedOrder.paymentStatus?.toUpperCase() || "PENDING"}
                  </Text>
                </View>

                {selectedOrder.deliveryAddress && (
                  <View style={styles.detailBlock}>
                    <Text style={[styles.label, { color: textSecondary, marginBottom: moderateScale(4) }]}>
                      Delivery Address
                    </Text>
                    <Text style={[styles.valText, { color: textPrimary }]}>
                      {selectedOrder.deliveryAddress.addressLine || "Local Address"}
                    </Text>
                    {selectedOrder.deliveryAddress.phone ? (
                      <Text style={[styles.valText, { color: textSecondary }]}>
                        Phone: {selectedOrder.deliveryAddress.phone}
                      </Text>
                    ) : null}
                  </View>
                )}

                {selectedOrder.items?.length > 0 && (
                  <View style={styles.detailBlock}>
                    <Text style={[styles.label, { color: textSecondary, marginBottom: moderateScale(6) }]}>
                      Ordered Items ({selectedOrder.items.length})
                    </Text>
                    {selectedOrder.items.map((it: any, idx: number) => (
                      <View key={it._id || idx} style={styles.itemRow}>
                        <Text style={[styles.itemName, { color: textPrimary }]}>
                          {it.quantity}x {it.name || it.productName || "Product Item"}
                        </Text>
                        <Text style={[styles.itemPrice, { color: textPrimary }]}>
                          Rs. {Number(it.price || 0) * (it.quantity || 1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedOrder(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
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
  pillsScroll: {
    maxHeight: moderateScale(38),
    marginBottom: moderateScale(10),
  },
  filterPill: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11),
  },
  listContent: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  orderCard: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(8),
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderNum: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  vendorSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
  },
  orderMiddle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  infoCol: {
    gap: moderateScale(2),
  },
  label: {
    fontSize: moderateScale(10.5),
    fontWeight: "500",
  },
  valText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  valBold: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  priceText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingTop: moderateScale(6),
    borderTopWidth: 1,
  },
  addressText: {
    fontSize: moderateScale(11),
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(16),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    marginTop: moderateScale(1),
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  detailBlock: {
    paddingVertical: moderateScale(6),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(3),
  },
  itemName: {
    fontSize: moderateScale(12),
    flex: 1,
  },
  itemPrice: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
