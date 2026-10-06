import VendorHeader from "@/components/VendorComponent/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutVendorAction } from "@/store/slices/vendorAuthSlice";
import { moderateScale, scale } from "@/theme";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VendorDashboardScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vendorUser, vendorDetails } = useAppSelector(
    (state) => state.vendorAuth
  );

  const [refreshing, setRefreshing] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  const storeName =
    vendorDetails?.businessDetails?.businessName ||
    vendorUser?.name ||
    "My Vendor Store";

  const handleLogout = () => {
    Alert.alert(
      "Vendor Logout",
      "Are you sure you want to log out of the Vendor Portal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await dispatch(logoutVendorAction());
            router.replace("/(auth)/vendorAuth/login/vendorlogin" as any);
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Standard Unified Vendor Header */}
      <VendorHeader />

      {/* Store Status Toggle Bar */}
      <View style={styles.storeStatusBar}>
        <View style={styles.statusBadgeRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isStoreOpen ? "#10B981" : "#EF4444" },
            ]}
          />
          <Text style={styles.statusText}>
            {isStoreOpen ? "Store is Open & Accepting Orders" : "Store is Currently Closed"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsStoreOpen((prev) => !prev)}
          style={[
            styles.toggleBtn,
            { backgroundColor: isStoreOpen ? "#E6F4EA" : "#FEE2E2" },
          ]}
        >
          <Feather
            name={isStoreOpen ? "power" : "play"}
            size={scale(14)}
            color={isStoreOpen ? "#10B981" : "#EF4444"}
          />
          <Text
            style={[
              styles.toggleBtnLabel,
              { color: isStoreOpen ? "#10B981" : "#EF4444" },
            ]}
          >
            {isStoreOpen ? "Close Store" : "Open Store"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Gradient Banner */}
        <LinearGradient
          colors={["#016073", "#005566", "#00687D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.welcomeSubtitle}>SELLERHUB DASHBOARD</Text>
              <Text style={styles.welcomeTitle}>
                Welcome, {vendorUser?.name || "Partner"}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={scale(14)}
                color="#86C4CB"
              />
              <Text style={styles.verifiedText}>Active Seller</Text>
            </View>
          </View>

          <Text style={styles.bannerMeta}>
            Track real-time orders, manage catalog inventory and monitor weekly
            payouts.
          </Text>
        </LinearGradient>

        {/* Key Metrics Grid */}
        <Text style={styles.sectionHeading}>Today's Overview</Text>
        <View style={styles.metricsGrid}>
          {/* Card 1: Today's Revenue */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#ECFDF5" }]}>
              <FontAwesome5 name="money-bill-wave" size={scale(14)} color="#059669" />
            </View>
            <Text style={styles.metricValue}>Rs. 14,850</Text>
            <Text style={styles.metricLabel}>Today's Sales</Text>
          </View>

          {/* Card 2: Orders */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#EFF6FF" }]}>
              <Feather name="shopping-bag" size={scale(15)} color="#2563EB" />
            </View>
            <Text style={styles.metricValue}>28 Orders</Text>
            <Text style={styles.metricLabel}>Today's Orders</Text>
          </View>

          {/* Card 3: Pending Orders */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#FFFBEB" }]}>
              <Feather name="clock" size={scale(15)} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>4 Pending</Text>
            <Text style={styles.metricLabel}>To Dispatch</Text>
          </View>

          {/* Card 4: Rating */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="star" size={scale(15)} color="#DC2626" />
            </View>
            <Text style={styles.metricValue}>4.9 / 5.0</Text>
            <Text style={styles.metricLabel}>Store Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionHeading}>Quick Operations</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert("Products", "Product catalog management opening soon.")
            }
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={["#E6F4F6", "#F0F9FA"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="plus-box"
                size={scale(22)}
                color="#016073"
              />
              <Text style={styles.actionBtnText}>Add Product</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert("Orders", "Order manager view opening soon.")
            }
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={["#E6F4F6", "#F0F9FA"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="truck-fast"
                size={scale(22)}
                color="#016073"
              />
              <Text style={styles.actionBtnText}>Live Orders</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push("/(auth)/vendorAuth/registrationProcess" as any)
            }
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={["#E6F4F6", "#F0F9FA"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="store-edit"
                size={scale(22)}
                color="#016073"
              />
              <Text style={styles.actionBtnText}>Store Info</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Card List */}
        <View style={styles.recentOrdersCard}>
          <View style={styles.recentOrdersHeader}>
            <Text style={styles.recentOrdersTitle}>Recent Customer Orders</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Sample Order 1 */}
          <View style={styles.orderItem}>
            <View style={styles.orderLeft}>
              <View style={styles.orderIconBox}>
                <Feather name="package" size={scale(16)} color="#016073" />
              </View>
              <View>
                <Text style={styles.orderId}>Order #BM-8921</Text>
                <Text style={styles.orderSub}>3 Items &middot; Grocery Staples</Text>
              </View>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>Rs. 1,450</Text>
              <View style={styles.prepBadge}>
                <Text style={styles.prepBadgeText}>Preparing</Text>
              </View>
            </View>
          </View>

          {/* Sample Order 2 */}
          <View style={[styles.orderItem, { borderBottomWidth: 0 }]}>
            <View style={styles.orderLeft}>
              <View style={styles.orderIconBox}>
                <Feather name="check" size={scale(16)} color="#059669" />
              </View>
              <View>
                <Text style={styles.orderId}>Order #BM-8919</Text>
                <Text style={styles.orderSub}>5 Items &middot; Fresh Produce</Text>
              </View>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>Rs. 2,120</Text>
              <View style={[styles.prepBadge, { backgroundColor: "#ECFDF5" }]}>
                <Text style={[styles.prepBadgeText, { color: "#059669" }]}>
                  Dispatched
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  storeAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  storeTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
    maxWidth: scale(170),
  },
  storeStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  statusDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
  },
  statusText: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    fontWeight: "600",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(6),
    gap: scale(5),
  },
  toggleBtnLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(40),
  },
  banner: {
    borderRadius: scale(14),
    padding: scale(18),
    marginBottom: moderateScale(18),
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  welcomeSubtitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#86C4CB",
    letterSpacing: 1,
    marginBottom: scale(2),
  },
  welcomeTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: moderateScale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(12),
    gap: scale(4),
  },
  verifiedText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bannerMeta: {
    fontSize: moderateScale(12),
    color: "#D1E9ED",
    lineHeight: moderateScale(17),
  },
  sectionHeading: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: moderateScale(10),
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    marginBottom: moderateScale(18),
  },
  metricCard: {
    width: (SCREEN_WIDTH - scale(36) - scale(10)) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricIcon: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(8),
  },
  metricValue: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: scale(2),
  },
  metricLabel: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: moderateScale(18),
  },
  actionBtn: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  actionGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    gap: scale(4),
  },
  actionBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
  recentOrdersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recentOrdersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  recentOrdersTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  viewAllText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  orderIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  orderId: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  orderSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(2),
  },
  prepBadge: {
    backgroundColor: "#EFF6FF",
    paddingVertical: scale(2),
    paddingHorizontal: scale(6),
    borderRadius: scale(4),
  },
  prepBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#2563EB",
  },
});

