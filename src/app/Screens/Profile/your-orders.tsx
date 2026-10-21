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
  const isDark = theme.mode === "dark";
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
      { text: "View Details & Return/Refund", onPress: () => handleOrderSummary(order) },
      {
        text: "Download Invoice",
        onPress: () => Alert.alert("Invoice downloaded"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const rootBg = isDark ? "#080D0F" : "#F8FAFC";
  const headerBg = isDark ? "#080D0F" : "#FFFFFF";
  const navTitleColor = isDark ? "#F8FAFC" : "#1E293B";
  const backIconColor = isDark ? "#F8FAFC" : "#1E293B";
  const dividerColor = isDark ? "#1E252E" : "#F1F5F9";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const cardBorder = isDark ? "#303B45" : "#E2E8F0";
  const statusTitleColor = isDark ? "#F8FAFC" : "#1E293B";
  const statusSubtitleColor = isDark ? "#A8B2BE" : "#64748B";
  const thumbBg = isDark ? "#1B252E" : "#F8FAFC";
  const thumbBorder = isDark ? "#303B45" : "#F1F5F9";
  const trackBtnBg = isDark ? "rgba(0, 128, 128, 0.16)" : "#F0FDFA";
  const trackBtnBorder = isDark ? "rgba(0, 128, 128, 0.3)" : "#CCFBF1";
  const trackBtnText = isDark ? "#2DD4BF" : "#008080";
  const summaryBtnText = isDark ? "#A8B2BE" : "#475569";
  const reorderBtnBg = isDark ? "rgba(0, 128, 128, 0.16)" : "#F0FDFA";
  const reorderBtnText = isDark ? "#2DD4BF" : "#008080";
  const refreshColor = isDark ? "#39D353" : "#008080";

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView edges={["top"]} style={[styles.safeAreaHeader, { backgroundColor: headerBg }]}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color={backIconColor} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: navTitleColor }]}>Your Orders</Text>
          <View style={{ width: scale(36) }} />
        </View>
        <View style={[styles.headerDivider, { backgroundColor: dividerColor }]} />
      </SafeAreaView>

      {/* 2. Orders Cards List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={customerLoading}
            onRefresh={onRefresh}
            colors={[refreshColor]}
            tintColor={refreshColor}
          />
        }
      >
        {customerOrders.length === 0 && !customerLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={scale(56)} color={isDark ? "#64748B" : "#94A3B8"} />
            <Text style={[styles.emptyTitle, { color: isDark ? "#F8FAFC" : "#334155" }]}>
              No Orders Placed Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? "#A8B2BE" : "#64748B" }]}>
              When you place an order, you can track its live status right here.
            </Text>
            <TouchableOpacity
              style={[styles.shopBtn, { backgroundColor: isDark ? "#39D353" : "#008080" }]}
              onPress={() => router.push("/customerMain/home" as any)}
            >
              <Text style={[styles.shopBtnText, isDark && { color: "#080D0F", fontWeight: "800" }]}>
                Explore Products
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {customerOrders.map((order) => {
          const isCancelled =
            order.orderStatus === "CANCELLED" || order.orderStatus === "REJECTED";
          const isDelivered = order.orderStatus === "DELIVERED";
          const isActive = !isCancelled && !isDelivered;

          return (
            <View
              key={order._id}
              style={[
                styles.orderCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              {/* Top Order Status Row */}
              <View style={styles.cardHeaderRow}>
                {/* Left Icon */}
                <View
                  style={[
                    styles.statusIconBox,
                    isCancelled
                      ? { backgroundColor: isDark ? "rgba(239, 68, 68, 0.18)" : "#FEE2E2" }
                      : isDelivered
                      ? { backgroundColor: isDark ? "rgba(16, 185, 129, 0.18)" : "#D1FAE5" }
                      : { backgroundColor: isDark ? "rgba(245, 158, 11, 0.18)" : "#FEF3C7" },
                  ]}
                >
                  {isCancelled ? (
                    <Feather name="x" size={scale(22)} color="#EF4444" />
                  ) : isDelivered ? (
                    <Ionicons
                      name="checkmark-done"
                      size={scale(24)}
                      color={isDark ? "#4ADE80" : "#059669"}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="shopping"
                      size={scale(26)}
                      color={isDark ? "#FBBF24" : "#D97706"}
                    />
                  )}
                </View>

                {/* Middle Title & Subtitle */}
                <View style={styles.statusTextCol}>
                  <Text style={[styles.statusTitle, { color: statusTitleColor }]}>
                    {order.refundStatus === "REQUESTED"
                      ? order.refundDetails?.claimType === "REPLACEMENT"
                        ? "Replacement Requested"
                        : "Return / Refund Requested"
                      : order.refundStatus === "APPROVED"
                      ? order.refundDetails?.claimType === "REPLACEMENT"
                        ? "Replacement Approved"
                        : "Claim Approved"
                      : order.refundStatus === "REFUNDED" ||
                        order.refundStatus === "PARTIAL_REFUNDED"
                      ? "Refund Completed"
                      : order.refundStatus === "REPLACED"
                      ? "Replacement Completed"
                      : order.refundStatus === "REJECTED"
                      ? "Claim Declined"
                      : order.orderStatus === "PLACED"
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
                  <Text style={[styles.statusSubtitle, { color: statusSubtitleColor }]}>
                    Rs.{order.totalAmount} &bull; {order.orderNumber}
                  </Text>
                </View>

                {/* Right Active Badge or More Options */}
                {order.refundStatus &&
                order.refundStatus !== "NONE" &&
                order.refundStatus !== "NOT_APPLICABLE" ? (
                  <View
                    style={[
                      styles.activePill,
                      {
                        backgroundColor:
                          order.refundStatus === "REFUNDED" ||
                          order.refundStatus === "REPLACED"
                            ? isDark
                              ? "rgba(16, 185, 129, 0.2)"
                              : "#D1FAE5"
                            : order.refundStatus === "REJECTED"
                              ? isDark
                                ? "rgba(239, 68, 68, 0.2)"
                                : "#FEE2E2"
                              : isDark
                                ? "rgba(245, 158, 11, 0.2)"
                                : "#FEF3C7",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activePillText,
                        {
                          color:
                            order.refundStatus === "REFUNDED" ||
                            order.refundStatus === "REPLACED"
                              ? isDark
                                ? "#34D399"
                                : "#059669"
                              : order.refundStatus === "REJECTED"
                                ? isDark
                                  ? "#F87171"
                                  : "#DC2626"
                                : isDark
                                  ? "#FBBF24"
                                  : "#D97706",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {order.refundStatus === "REQUESTED"
                        ? "Under Review"
                        : order.refundStatus === "APPROVED"
                          ? "Approved"
                          : order.refundStatus === "REFUNDED"
                            ? "Refunded"
                            : order.refundStatus === "REPLACED"
                              ? "Replaced"
                              : "Declined"}
                    </Text>
                  </View>
                ) : isActive ? (
                  <View style={styles.activeBadgeContainer}>
                    <View style={styles.blueDot} />
                    <View
                      style={[
                        styles.activePill,
                        isDark && { backgroundColor: "rgba(16, 185, 129, 0.2)" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activePillText,
                          isDark && { color: "#34D399" },
                        ]}
                      >
                        Live
                      </Text>
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
                      color={isDark ? "#94A3B8" : "#64748B"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Products Thumbnails Preview Row */}
              <View style={styles.productsThumbRow}>
                {order.items?.slice(0, 4).map((it, i) => (
                  <View
                    key={i}
                    style={[
                      styles.thumbSquare,
                      { backgroundColor: thumbBg, borderColor: thumbBorder },
                    ]}
                  >
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

              <View
                style={[styles.cardDivider, { backgroundColor: dividerColor }]}
              />

              {/* Bottom Action CTA Button */}
              {isActive ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOrderSummary(order)}
                  style={[
                    styles.trackOrderBtn,
                    { backgroundColor: trackBtnBg, borderColor: trackBtnBorder },
                  ]}
                >
                  <Text style={[styles.trackOrderText, { color: trackBtnText }]}>
                    Track Order Status
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={scale(16)}
                    color={trackBtnText}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOrderSummary(order)}
                    style={styles.summaryBtn}
                  >
                    <Text
                      style={[
                        styles.summaryBtnText,
                        { color: summaryBtnText },
                      ]}
                    >
                      Order Summary
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={scale(16)}
                      color={isDark ? "#94A3B8" : "#475569"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleReorder(order)}
                    style={[
                      styles.reorderBtn,
                      { backgroundColor: reorderBtnBg },
                    ]}
                  >
                    <Ionicons
                      name="repeat"
                      size={scale(16)}
                      color={reorderBtnText}
                    />
                    <Text
                      style={[
                        styles.reorderBtnText,
                        { color: reorderBtnText },
                      ]}
                    >
                      Reorder
                    </Text>
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
  },
  safeAreaHeader: {},
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
  },
  headerDivider: {
    height: 1,
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
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
  shopBtn: {
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
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
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
  statusTextCol: {
    flex: 1,
  },
  statusTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
  },
  statusSubtitle: {
    fontSize: moderateScale(12),
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  cardDivider: {
    height: 1,
    marginVertical: moderateScale(12),
  },
  trackOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(9),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  trackOrderText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
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
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(6),
  },
  reorderBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
});
