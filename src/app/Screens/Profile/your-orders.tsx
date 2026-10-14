import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCustomerOrders,
  orderStatusUpdatedRealtime,
  OrderRecord,
} from "@/store/slices/orderSlice";
import socketService from "@/store/services/socketService";

export default function YourOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { customerOrders, customerLoading } = useAppSelector(
    (state) => state.order
  );

  useEffect(() => {
    dispatch(fetchCustomerOrders());

    // Connect socket to receive background status updates
    socketService.connect(false);
    const unsubscribe = socketService.onOrderStatusUpdated((update) => {
      dispatch(orderStatusUpdatedRealtime(update));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchCustomerOrders());
  };

  const handleOrderSummary = (order: OrderRecord) => {
    router.push({
      pathname: "/Screens/Profile/order-summary" as any,
      params: {
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  };

  const handleReorder = (order: OrderRecord) => {
    Alert.alert(
      "Reorder",
      `Would you like to re-order items from ${order.orderNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reorder Now",
          onPress: () => router.push("/customerMain/cart" as any),
        },
      ]
    );
  };

  const handleMoreOptions = (order: OrderRecord) => {
    Alert.alert("Order Options", `Order ID: ${order.orderNumber}`, [
      { text: "View Details", onPress: () => handleOrderSummary(order) },
      {
        text: "Download Invoice",
        onPress: () => Alert.alert("Invoice downloaded"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Your Orders</Text>
          <View style={{ width: scale(36) }} />
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Orders Cards List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={customerLoading}
            onRefresh={onRefresh}
            colors={["#008080"]}
          />
        }
      >
        {customerOrders.length === 0 && !customerLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={scale(56)} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
            <Text style={styles.emptySubtitle}>
              When you place an order, you can track its live status right here.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/customerMain/home" as any)}
            >
              <Text style={styles.shopBtnText}>Explore Products</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {customerOrders.map((order) => {
          const isCancelled =
            order.orderStatus === "CANCELLED" || order.orderStatus === "REJECTED";
          const isDelivered = order.orderStatus === "DELIVERED";
          const isActive = !isCancelled && !isDelivered;

          return (
            <View key={order._id} style={styles.orderCard}>
              {/* Top Order Status Row */}
              <View style={styles.cardHeaderRow}>
                {/* Left Icon */}
                <View
                  style={[
                    styles.statusIconBox,
                    isCancelled
                      ? styles.statusIconCancelled
                      : isDelivered
                      ? styles.statusIconDelivered
                      : styles.statusIconPlaced,
                  ]}
                >
                  {isCancelled ? (
                    <Feather name="x" size={scale(22)} color="#EF4444" />
                  ) : isDelivered ? (
                    <Ionicons
                      name="checkmark-done"
                      size={scale(24)}
                      color="#059669"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="shopping"
                      size={scale(26)}
                      color="#D97706"
                    />
                  )}
                </View>

                {/* Middle Title & Subtitle */}
                <View style={styles.statusTextCol}>
                  <Text style={styles.statusTitle}>
                    {order.orderStatus === "PLACED"
                      ? "Order Placed"
                      : order.orderStatus === "ACCEPTED"
                      ? "Order Accepted"
                      : order.orderStatus === "PREPARING"
                      ? "Preparing Items"
                      : order.orderStatus === "READY_FOR_PICKUP"
                      ? "Ready for Pickup"
                      : order.orderStatus === "OUT_FOR_DELIVERY"
                      ? "Out for Delivery"
                      : order.orderStatus === "DELIVERED"
                      ? "Order Delivered"
                      : "Order Cancelled"}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    Rs.{order.totalAmount} &bull; {order.orderNumber}
                  </Text>
                </View>

                {/* Right Active Badge or More Options */}
                {isActive ? (
                  <View style={styles.activeBadgeContainer}>
                    <View style={styles.blueDot} />
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>Live</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleMoreOptions(order)}
                    style={styles.moreBtn}
                  >
                    <Feather
                      name="more-vertical"
                      size={scale(20)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Products Thumbnails Preview Row */}
              <View style={styles.productsThumbRow}>
                {order.items?.slice(0, 4).map((it, i) => (
                  <View key={i} style={styles.thumbSquare}>
                    <Image
                      source={{
                        uri:
                          it.imageUrl ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80",
                      }}
                      style={styles.thumbImage}
                      contentFit="contain"
                    />
                  </View>
                ))}
              </View>

              <View style={styles.cardDivider} />

              {/* Bottom Action CTA Button */}
              {isActive ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOrderSummary(order)}
                  style={styles.trackOrderBtn}
                >
                  <Text style={styles.trackOrderText}>Track Order Status</Text>
                  <Feather
                    name="chevron-right"
                    size={scale(16)}
                    color="#008080"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOrderSummary(order)}
                    style={styles.summaryBtn}
                  >
                    <Text style={styles.summaryBtnText}>Order Summary</Text>
                    <Feather
                      name="chevron-right"
                      size={scale(16)}
                      color="#475569"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleReorder(order)}
                    style={styles.reorderBtn}
                  >
                    <Ionicons
                      name="repeat"
                      size={scale(16)}
                      color="#008080"
                    />
                    <Text style={styles.reorderBtnText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeAreaHeader: {
    backgroundColor: "#ffffff",
  },
  navBar: {
    height: moderateScale(44),
    paddingHorizontal: scale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#1E293B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(14),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
    gap: moderateScale(10),
  },
  emptyTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
  shopBtn: {
    backgroundColor: "#008080",
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(10),
    borderRadius: scale(10),
    marginTop: moderateScale(10),
  },
  shopBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: moderateScale(13.5),
  },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  statusIconPlaced: {
    backgroundColor: "#FEF3C7",
  },
  statusIconDelivered: {
    backgroundColor: "#D1FAE5",
  },
  statusIconCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusTextCol: {
    flex: 1,
  },
  statusTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  statusSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  activeBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  blueDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#10B981",
  },
  activePill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  activePillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#059669",
  },
  moreBtn: {
    padding: scale(4),
  },
  productsThumbRow: {
    flexDirection: "row",
    gap: scale(8),
    marginTop: moderateScale(12),
  },
  thumbSquare: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(8),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(12),
  },
  trackOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDFA",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(9),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  trackOrderText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#008080",
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  summaryBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#475569",
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#F0FDFA",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(6),
  },
  reorderBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#008080",
  },
});
