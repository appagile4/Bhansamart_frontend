import { getVendorCustomersApi, VendorCustomer } from "@/store/services/vendorService";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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

type CustomerFilter = "all" | "active" | "cancelled" | "top_buyers";

// Helper for customer avatar initials
const getInitials = (name?: string) => {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatOrderDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
};

// ── Memoized Customer Card ─────────────────────────────────────────────
const CustomerCard = memo(function CustomerCard({
  customer,
  onCall,
}: {
  customer: VendorCustomer;
  onCall: (phone: string) => void;
}) {
  const hasAvatar = Boolean(customer.avatar && customer.avatar.trim() !== "");
  const hasCancelled = customer.cancelledCount > 0;

  return (
    <View style={styles.card}>
      {/* Top Row: Avatar, Name, Email, Call Button */}
      <View style={styles.cardTopRow}>
        <View style={styles.avatarContainer}>
          {hasAvatar ? (
            <Image
              source={{ uri: customer.avatar }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {getInitials(customer.name)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.customerInfoCol}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer.name || "Customer"}
          </Text>

          {customer.phone && customer.phone !== "N/A" ? (
            <View style={styles.subInfoRow}>
              <Feather name="phone" size={scale(11)} color="#64748B" />
              <Text style={styles.customerPhone} numberOfLines={1}>
                {customer.phone}
              </Text>
            </View>
          ) : null}

          {customer.email ? (
            <View style={styles.subInfoRow}>
              <Feather name="mail" size={scale(11)} color="#94A3B8" />
              <Text style={styles.customerEmail} numberOfLines={1}>
                {customer.email}
              </Text>
            </View>
          ) : null}
        </View>

        {customer.phone && customer.phone !== "N/A" && (
          <TouchableOpacity
            style={styles.callBtn}
            activeOpacity={0.7}
            onPress={() => onCall(customer.phone)}
          >
            <Feather name="phone-call" size={scale(15)} color="#016073" />
          </TouchableOpacity>
        )}
      </View>

      {/* Metric Counters Grid */}
      <View style={styles.metricsGrid}>
        {/* Total Orders */}
        <View style={styles.metricItem}>
          <View style={[styles.metricIconWrap, { backgroundColor: "#E6F4F6" }]}>
            <Ionicons name="bag-handle-outline" size={scale(14)} color="#016073" />
          </View>
          <View>
            <Text style={styles.metricVal}>{customer.orderCount}</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
          </View>
        </View>

        {/* Products Purchased */}
        <View style={styles.metricItem}>
          <View style={[styles.metricIconWrap, { backgroundColor: "#F0FDF4" }]}>
            <Feather name="package" size={scale(13)} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.metricVal}>{customer.productCount || 0}</Text>
            <Text style={styles.metricLabel}>Products Bought</Text>
          </View>
        </View>

        {/* Cancelled Count */}
        <View style={styles.metricItem}>
          <View
            style={[
              styles.metricIconWrap,
              {
                backgroundColor: hasCancelled ? "#FEF2F2" : "#F8FAFC",
              },
            ]}
          >
            <Feather
              name="x-circle"
              size={scale(13)}
              color={hasCancelled ? "#DC2626" : "#94A3B8"}
            />
          </View>
          <View>
            <Text
              style={[
                styles.metricVal,
                hasCancelled && { color: "#DC2626" },
              ]}
            >
              {customer.cancelledCount || 0}
            </Text>
            <Text style={styles.metricLabel}>Cancelled</Text>
          </View>
        </View>
      </View>

      {/* Card Footer: Total Spent & Last Order Date */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total Purchases:</Text>
          <Text style={styles.footerAmount}>
            NPR {customer.totalSpent?.toLocaleString() || "0"}
          </Text>
        </View>

        {customer.lastOrderDate && (
          <View style={styles.footerRight}>
            <Feather name="calendar" size={scale(11)} color="#64748B" />
            <Text style={styles.lastOrderText}>
              Last: {formatOrderDate(customer.lastOrderDate)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

// ── Main Customer Screen Component ─────────────────────────────────────
export default function CustomerScreen() {
  const router = useRouter();

  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CustomerFilter>("all");

  // Load customers data from backend
  const loadCustomers = useCallback(async () => {
    try {
      const res = await getVendorCustomersApi();
      if (res && res.success) {
        setCustomers(res.data || []);
      }
    } catch (err: any) {
      console.error("[Fetch Vendor Customers Error]:", err);
      Alert.alert(
        "Could Not Load Customers",
        err.response?.data?.message || err.message || "Failed to load customer list."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
  };

  const handleCall = (phone: string) => {
    if (!phone || phone === "N/A") {
      Alert.alert("No Contact", "Customer contact number is not provided.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  // ── Aggregated Summary Stats ──
  const summaryStats = useMemo(() => {
    const totalCustomers = customers.length;
    let totalOrders = 0;
    let totalProducts = 0;
    let totalCancelled = 0;

    customers.forEach((c) => {
      totalOrders += c.orderCount || 0;
      totalProducts += c.productCount || 0;
      totalCancelled += c.cancelledCount || 0;
    });

    return { totalCustomers, totalOrders, totalProducts, totalCancelled };
  }, [customers]);

  // ── Filtered & Searched Customers ──
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    // Category Filter
    switch (activeFilter) {
      case "active":
        result = result.filter((c) => (c.orderCount - c.cancelledCount) > 0);
        break;
      case "cancelled":
        result = result.filter((c) => c.cancelledCount > 0);
        break;
      case "top_buyers":
        result.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
        break;
      default:
        break;
    }

    return result;
  }, [customers, searchQuery, activeFilter]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* 4-Stat Metric Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryVal}>{summaryStats.totalCustomers}</Text>
          <Text style={styles.summaryLabel}>Customers</Text>
        </View>
        <View style={styles.summaryDivider} />

        <View style={styles.summaryBox}>
          <Text style={[styles.summaryVal, { color: "#016073" }]}>
            {summaryStats.totalOrders}
          </Text>
          <Text style={styles.summaryLabel}>Store Orders</Text>
        </View>
        <View style={styles.summaryDivider} />

        <View style={styles.summaryBox}>
          <Text style={[styles.summaryVal, { color: "#16A34A" }]}>
            {summaryStats.totalProducts}
          </Text>
          <Text style={styles.summaryLabel}>Products Sold</Text>
        </View>
        <View style={styles.summaryDivider} />

        <View style={styles.summaryBox}>
          <Text style={[styles.summaryVal, { color: "#DC2626" }]}>
            {summaryStats.totalCancelled}
          </Text>
          <Text style={styles.summaryLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or email..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x-circle" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === "all" && styles.chipActive,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === "all" && styles.chipTextActive,
            ]}
          >
            All ({customers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === "active" && styles.chipActive,
          ]}
          onPress={() => setActiveFilter("active")}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === "active" && styles.chipTextActive,
            ]}
          >
            Active Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === "cancelled" && styles.chipActive,
          ]}
          onPress={() => setActiveFilter("cancelled")}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === "cancelled" && styles.chipTextActive,
            ]}
          >
            With Cancellations ({summaryStats.totalCancelled > 0 ? "!" : "0"})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === "top_buyers" && styles.chipActive,
          ]}
          onPress={() => setActiveFilter("top_buyers")}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === "top_buyers" && styles.chipTextActive,
            ]}
          >
            Top Buyers
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>

        <View style={styles.topNavCenter}>
          <Text style={styles.navTitle}>Store Customers</Text>
          <Text style={styles.navSub}>Customer Purchase & Order History</Text>
        </View>

        <View style={styles.customerCountBadge}>
          <Text style={styles.customerCountText}>
            {filteredCustomers.length}
          </Text>
        </View>
      </View>

      {/* Body List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#016073" />
          <Text style={styles.loadingText}>Fetching store customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item._id || item.customerId}
          renderItem={({ item }) => (
            <CustomerCard customer={item} onCall={handleCall} />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#016073"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={scale(36)} color="#016073" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? "No Matching Customers"
                  : "No Store Customers Yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No customer records matched "${searchQuery}". Try a different keyword.`
                  : "Customers who place orders from your store will appear here with their complete purchase and cancellation history."}
              </Text>
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
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(12),
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  topNavCenter: {
    flex: 1,
  },
  navTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  navSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  customerCountBadge: {
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  customerCountText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#016073",
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
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(40),
  },
  headerSection: {
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(12),
    gap: scale(12),
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: scale(8),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
  },
  summaryVal: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#0F172A",
  },
  summaryLabel: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: scale(2),
    fontWeight: "600",
  },
  summaryDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#E2E8F0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    height: scale(42),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12.5),
    color: "#0F172A",
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: "row",
    gap: scale(8),
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  chipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(14),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  avatarContainer: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#86C4CB",
    borderRadius: scale(23),
  },
  avatarInitials: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#016073",
  },
  customerInfoCol: {
    flex: 1,
    gap: scale(2),
  },
  customerName: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  subInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  customerPhone: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  customerEmail: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
  },
  callBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  metricsGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(10),
    marginTop: moderateScale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metricItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  metricIconWrap: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  metricVal: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  metricLabel: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: scale(1),
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(10),
    marginTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  footerLabel: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  footerAmount: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#016073",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  lastOrderText: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
    paddingHorizontal: scale(24),
  },
  emptyIconCircle: {
    width: scale(68),
    height: scale(68),
    borderRadius: scale(34),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(6),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    lineHeight: scale(18),
  },
});
