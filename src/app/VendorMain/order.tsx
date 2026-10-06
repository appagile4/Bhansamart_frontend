import VendorHeader from "@/components/VendorComponent/header";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface VendorOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  totalAmount: number;
  status: "New" | "Preparing" | "Ready" | "Delivered" | "Cancelled";
  time: string;
  address: string;
}

const SAMPLE_ORDERS: VendorOrder[] = [
  {
    id: "1",
    orderNumber: "#BM-9481",
    customerName: "Rahul Sharma",
    customerPhone: "+977-9801234567",
    itemsCount: 4,
    totalAmount: 1450,
    status: "New",
    time: "5 mins ago",
    address: "Baneshwor, Kathmandu",
  },
  {
    id: "2",
    orderNumber: "#BM-9480",
    customerName: "Anita Karki",
    customerPhone: "+977-9812345678",
    itemsCount: 2,
    totalAmount: 680,
    status: "Preparing",
    time: "20 mins ago",
    address: "Koteshwor, Kathmandu",
  },
  {
    id: "3",
    orderNumber: "#BM-9479",
    customerName: "Prakash Thapa",
    customerPhone: "+977-9823456789",
    itemsCount: 6,
    totalAmount: 2340,
    status: "Ready",
    time: "45 mins ago",
    address: "Patan Dhoka, Lalitpur",
  },
  {
    id: "4",
    orderNumber: "#BM-9478",
    customerName: "Sunita Rai",
    customerPhone: "+977-9834567890",
    itemsCount: 1,
    totalAmount: 320,
    status: "Delivered",
    time: "2 hours ago",
    address: "Balkumari, Lalitpur",
  },
];

const FILTER_TABS = ["All", "New", "Preparing", "Ready", "Delivered"];

export default function VendorOrdersScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<VendorOrder[]>(SAMPLE_ORDERS);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      selectedFilter === "All" || order.status === selectedFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: VendorOrder["status"]) => {
    switch (status) {
      case "New":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
      case "Preparing":
        return { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" };
      case "Ready":
        return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" };
      case "Delivered":
        return { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" };
      case "Cancelled":
        return { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" };
    }
  };

  const updateOrderStatus = (id: string, newStatus: VendorOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const renderOrderItem = ({ item }: { item: VendorOrder }) => {
    const statusStyle = getStatusColor(item.status);

    return (
      <View style={styles.orderCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>{item.orderNumber}</Text>
            <Text style={styles.orderTime}>{item.time}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Customer & Address Details */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={scale(14)} color="#64748B" />
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.customerPhone}>({item.customerPhone})</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={scale(14)} color="#64748B" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="basket-outline" size={scale(14)} color="#64748B" />
            <Text style={styles.itemsCountText}>
              {item.itemsCount} {item.itemsCount === 1 ? "item" : "items"} &middot; Total:{" "}
              <Text style={styles.amountText}>NPR {item.totalAmount}</Text>
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          {item.status === "New" && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => updateOrderStatus(item.id, "Cancelled")}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => updateOrderStatus(item.id, "Preparing")}
              >
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === "Preparing" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.readyBtn]}
              onPress={() => updateOrderStatus(item.id, "Ready")}
            >
              <MaterialCommunityIcons name="check-all" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.readyBtnText}>Mark Food Ready</Text>
            </TouchableOpacity>
          )}

          {item.status === "Ready" && (
            <View style={styles.readyNotice}>
              <Ionicons name="bicycle" size={scale(16)} color="#008080" />
              <Text style={styles.readyNoticeText}>Waiting for Delivery Partner</Text>
            </View>
          )}

          {item.status === "Delivered" && (
            <View style={styles.deliveredNotice}>
              <Ionicons name="checkmark-circle" size={scale(16)} color="#16A34A" />
              <Text style={styles.deliveredNoticeText}>Order Delivered Successfully</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Unified Vendor Header */}
      <VendorHeader activeRoute="/VendorMain/order" />

      {/* Sub Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Orders</Text>
        <Text style={styles.headerSubtitle}>
          Manage incoming, preparing, and completed orders
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

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
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
              There are no orders matching your current filter.
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
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#016073",
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
    marginTop: moderateScale(12),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(12),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
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
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(12),
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  orderId: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#016073",
  },
  orderTime: {
    fontSize: moderateScale(11),
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
    padding: scale(14),
    gap: scale(6),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  customerName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
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
    color: "#475569",
  },
  amountText: {
    fontWeight: "800",
    color: "#016073",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingBottom: moderateScale(12),
    gap: scale(10),
  },
  actionBtn: {
    flex: 1,
    height: moderateScale(38),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: scale(6),
  },
  rejectBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#DC2626",
  },
  acceptBtn: {
    backgroundColor: "#016073",
  },
  acceptBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  readyBtn: {
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
    backgroundColor: "#E6F4F6",
    paddingVertical: moderateScale(8),
    borderRadius: scale(6),
  },
  readyNoticeText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#004D5A",
  },
  deliveredNotice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#F0FDF4",
    paddingVertical: moderateScale(8),
    borderRadius: scale(6),
  },
  deliveredNoticeText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#16A34A",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#64748B",
    marginTop: moderateScale(10),
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textAlign: "center",
    marginTop: scale(4),
  },
});

