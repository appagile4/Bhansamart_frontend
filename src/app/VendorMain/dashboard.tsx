import VendorHeader from "@/components/VendorComponent/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/store/services/socketService";
import {
  fetchVendorOrders,
  updateVendorOrderStatus,
} from "@/store/slices/orderSlice";
import {
  dismissNewOrderAlert,
  fetchDashboardStats,
  onCodUpdated,
  onNotificationReceived,
  onWalletUpdated,
  setNewOrderAlert,
} from "@/store/slices/vendorFinanceSlice";
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
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
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
    (state) => state.vendorAuth,
  );
  const {
    metrics,
    recentOrders,
    recentNotifications,
    unreadCount,
    dashboardLoading,
    newOrderAlert,
    error,
  } = useAppSelector((state) => state.vendorFinance);

  const [refreshing, setRefreshing] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [processingOrderAction, setProcessingOrderAction] = useState(false);

  // 1. Initial Load & Background Refresh
  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  // 2. Real-time Socket Subscriptions for Incoming Orders, Notifications & Finances
  useEffect(() => {
    let cleanupNewOrder: (() => void) | undefined;
    let cleanupStatus: (() => void) | undefined;
    let cleanupNotif: (() => void) | undefined;
    let cleanupCod: (() => void) | undefined;
    let cleanupWallet: (() => void) | undefined;

    const setupSocket = async () => {
      await socketService.connect("vendor");
      const vId = vendorDetails?._id || vendorUser?._id;
      if (vId) {
        socketService.subscribeToVendorOrders(vId.toString());
      }

      cleanupNewOrder = socketService.onNewVendorOrder((order) => {
        dispatch(setNewOrderAlert(order));
        dispatch(fetchDashboardStats());
        dispatch(fetchVendorOrders());
      });

      cleanupStatus = socketService.onOrderStatusUpdated(() => {
        dispatch(fetchDashboardStats());
        dispatch(fetchVendorOrders());
      });

      cleanupNotif = socketService.onVendorNotification((notif) => {
        dispatch(onNotificationReceived(notif));
        dispatch(fetchDashboardStats());
      });

      cleanupCod = socketService.onVendorCodUpdate((codData) => {
        dispatch(onCodUpdated(codData));
        dispatch(fetchDashboardStats());
      });

      cleanupWallet = socketService.onVendorWalletUpdate((walletData) => {
        dispatch(onWalletUpdated(walletData));
        dispatch(fetchDashboardStats());
      });
    };

    setupSocket();

    return () => {
      cleanupNewOrder?.();
      cleanupStatus?.();
      cleanupNotif?.();
      cleanupCod?.();
      cleanupWallet?.();
    };
  }, [dispatch, vendorDetails?._id, vendorUser?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchDashboardStats()),
      dispatch(fetchVendorOrders()),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  // Quick Action: Accept Incoming Order from Popup
  const handleAcceptNewOrder = async (orderId: string) => {
    try {
      setProcessingOrderAction(true);
      await dispatch(
        updateVendorOrderStatus({ orderId, status: "ACCEPTED" }),
      ).unwrap();
      dispatch(dismissNewOrderAlert());
      dispatch(fetchDashboardStats());
      dispatch(fetchVendorOrders());
      Alert.alert(
        "Order Accepted",
        "Order accepted successfully! Nearest delivery partner is being dispatched.",
      );
    } catch (err: any) {
      Alert.alert("Action Failed", err?.message || "Failed to accept order");
    } finally {
      setProcessingOrderAction(false);
    }
  };

  // Quick Action: Reject Incoming Order from Popup
  const handleRejectNewOrder = async (orderId: string) => {
    Alert.alert(
      "Decline Order",
      "Are you sure you want to decline this customer order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingOrderAction(true);
              await dispatch(
                updateVendorOrderStatus({
                  orderId,
                  status: "REJECTED",
                  reason: "Store busy / out of stock",
                }),
              ).unwrap();
              dispatch(dismissNewOrderAlert());
              dispatch(fetchDashboardStats());
              dispatch(fetchVendorOrders());
            } catch (err: any) {
              Alert.alert(
                "Action Failed",
                err?.message || "Failed to decline order",
              );
            } finally {
              setProcessingOrderAction(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Standard Unified Vendor Header with live unread badge */}
      <VendorHeader
        unreadCount={unreadCount}
        onPressNotification={() =>
          router.push("/Screens/vendorScreens/notifications" as any)
        }
      />

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
            {isStoreOpen
              ? "Store is Open & Accepting Orders"
              : "Store is Currently Closed"}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
          />
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
            Track real-time orders, monitor COD cash submissions and manage bank
            payouts.
          </Text>
        </LinearGradient>

        {/* Financial Highlights Bar */}
        <View style={styles.financeBanner}>
          <TouchableOpacity
            style={styles.financeCard}
            activeOpacity={0.8}
            onPress={() => router.push("/VendorMain/transaction" as any)}
          >
            <View style={styles.financeCardHeader}>
              <Text style={styles.financeCardLabel}>Withdrawable Balance</Text>
              <Feather name="arrow-up-right" size={scale(14)} color="#15803D" />
            </View>
            <Text style={styles.financeCardValue}>
              NPR {(metrics.availableWithdrawalBalance || 0).toLocaleString()}
            </Text>
            <Text style={styles.financeCardSub}>
              Settled & ready for bank payout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.financeCard,
              { backgroundColor: "#FEF9C3", borderColor: "#FDE047" },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/vendorScreens/cod-handover" as any)}
          >
            <View style={styles.financeCardHeader}>
              <Text style={[styles.financeCardLabel, { color: "#854D0E" }]}>
                COD Cash with Riders
              </Text>
              <MaterialCommunityIcons
                name="hand-coin-outline"
                size={scale(16)}
                color="#854D0E"
              />
            </View>
            <Text style={[styles.financeCardValue, { color: "#854D0E" }]}>
              NPR {(metrics.codCashWithDeliveryBoys || 0).toLocaleString()}
            </Text>
            <Text style={[styles.financeCardSub, { color: "#A16207" }]}>
              Tap to verify & confirm handover
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Metrics Grid */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>Live Operations Overview</Text>
          {dashboardLoading && (
            <ActivityIndicator size="small" color="#016073" />
          )}
        </View>

        <View style={styles.metricsGrid}>
          {/* Card 1: Total Sales */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#ECFDF5" }]}>
              <FontAwesome5
                name="money-bill-wave"
                size={scale(14)}
                color="#059669"
              />
            </View>
            <Text style={styles.metricValue}>
              NPR {(metrics.totalSales || 0).toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Total Delivered Sales</Text>
          </View>

          {/* Card 2: Total Orders */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#EFF6FF" }]}>
              <Feather name="shopping-bag" size={scale(15)} color="#2563EB" />
            </View>
            <Text style={styles.metricValue}>{metrics.totalOrders} Orders</Text>
            <Text style={styles.metricLabel}>Lifetime Orders</Text>
          </View>

          {/* Card 3: Pending Orders */}
          <TouchableOpacity
            style={[
              styles.metricCard,
              metrics.pendingOrders > 0 && {
                borderColor: "#F59E0B",
                borderWidth: 1.5,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push("/VendorMain/order" as any)}
          >
            <View style={[styles.metricIcon, { backgroundColor: "#FFFBEB" }]}>
              <Feather name="clock" size={scale(15)} color="#D97706" />
            </View>
            <Text style={[styles.metricValue, { color: "#D97706" }]}>
              {metrics.pendingOrders} Pending
            </Text>
            <Text style={styles.metricLabel}>Needs Acceptance</Text>
          </TouchableOpacity>

          {/* Card 4: In Processing / Dispatched */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.7}
            onPress={() => router.push("/VendorMain/order" as any)}
          >
            <View style={[styles.metricIcon, { backgroundColor: "#F5F3FF" }]}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={scale(16)}
                color="#7C3AED"
              />
            </View>
            <Text style={styles.metricValue}>
              {metrics.processingOrders} Active
            </Text>
            <Text style={styles.metricLabel}>Preparing / Dispatched</Text>
          </TouchableOpacity>

          {/* Card 5: Completed */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons
                name="checkmark-done-circle"
                size={scale(16)}
                color="#10B981"
              />
            </View>
            <Text style={styles.metricValue}>
              {metrics.completedOrders} Delivered
            </Text>
            <Text style={styles.metricLabel}>Successfully Handed Over</Text>
          </View>

          {/* Card 6: Cancelled / Rejected */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="x-circle" size={scale(15)} color="#EF4444" />
            </View>
            <Text style={styles.metricValue}>
              {metrics.cancelledOrders} Cancelled
            </Text>
            <Text style={styles.metricLabel}>Declined / Cancelled</Text>
          </View>
        </View>

        {/* Quick Operations */}
        <Text style={styles.sectionHeading}>Store Management Shortcuts</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/VendorMain/order" as any)}
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
              <Text style={styles.actionBtnText}>
                Live Orders{" "}
                {metrics.pendingOrders > 0 ? `(${metrics.pendingOrders})` : ""}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/vendorScreens/cod-handover" as any)}
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={["#FEF9C3", "#FFFBEB"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="hand-coin"
                size={scale(22)}
                color="#854D0E"
              />
              <Text style={[styles.actionBtnText, { color: "#854D0E" }]}>
                COD Handover
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/vendorScreens/payment-qr" as any)}
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={["#E6F4F6", "#F0F9FA"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={scale(22)}
                color="#016073"
              />
              <Text style={styles.actionBtnText}>Payment QR</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/VendorMain/transaction" as any)}
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={["#E6F4F6", "#F0F9FA"]}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={scale(22)}
                color="#016073"
              />
              <Text style={styles.actionBtnText}>Withdraw</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Orders List */}
        <View style={styles.recentOrdersCard}>
          <View style={styles.recentOrdersHeader}>
            <Text style={styles.recentOrdersTitle}>Recent Customer Orders</Text>
            <TouchableOpacity
              onPress={() => router.push("/VendorMain/order" as any)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={{ paddingVertical: scale(25), alignItems: "center" }}>
              <Feather name="inbox" size={scale(28)} color="#CBD5E1" />
              <Text
                style={{
                  color: "#94A3B8",
                  fontSize: scale(13),
                  marginTop: scale(6),
                }}
              >
                No customer orders received yet.
              </Text>
            </View>
          ) : (
            recentOrders.filter(Boolean).map((ord, idx) => (
              <TouchableOpacity
                key={String(ord?._id || idx)}
                activeOpacity={0.7}
                onPress={() => router.push("/VendorMain/order" as any)}
                style={[
                  styles.orderItem,
                  idx === recentOrders.length - 1
                    ? { borderBottomWidth: 0 }
                    : undefined,
                ]}
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconBox}>
                    <Feather
                      name={
                        ord?.orderStatus === "DELIVERED" ? "check" : "package"
                      }
                      size={scale(16)}
                      color={
                        ord?.orderStatus === "DELIVERED" ? "#059669" : "#016073"
                      }
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: scale(10) }}>
                    <Text style={styles.orderId}>
                      {String(ord?.orderNumber || "ORDER")}
                    </Text>
                    <Text style={styles.orderSub} numberOfLines={1}>
                      {ord?.totalCount || ord?.items?.length || 1} Items
                      &middot; {ord?.customer?.name || "Customer"} &middot;{" "}
                      {ord?.paymentMethod || "COD"}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>NPR {ord.totalAmount}</Text>
                  <View
                    style={[
                      styles.prepBadge,
                      ord.orderStatus === "DELIVERED" && {
                        backgroundColor: "#ECFDF5",
                      },
                      ord.orderStatus === "PLACED" && {
                        backgroundColor: "#EFF6FF",
                      },
                      ord.orderStatus === "CANCELLED" && {
                        backgroundColor: "#FEF2F2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.prepBadgeText,
                        ord.orderStatus === "DELIVERED" && { color: "#059669" },
                        ord.orderStatus === "PLACED" && { color: "#1D4ED8" },
                        ord.orderStatus === "CANCELLED" && { color: "#DC2626" },
                      ]}
                    >
                      {ord.orderStatus}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Notifications Snippet */}
        {Array.isArray(recentNotifications) &&
          recentNotifications.filter(Boolean).length > 0 && (
            <View style={styles.recentOrdersCard}>
              <View style={styles.recentOrdersHeader}>
                <Text style={styles.recentOrdersTitle}>
                  Recent Notifications
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push("/Screens/vendorScreens/notifications" as any)
                  }
                >
                  <Text style={styles.viewAllText}>
                    View All ({unreadCount || 0} new)
                  </Text>
                </TouchableOpacity>
              </View>

              {recentNotifications
                .filter(Boolean)
                .slice(0, 3)
                .map((notif, idx) => {
                  if (!notif) return null;
                  const notifId = notif._id
                    ? String(notif._id)
                    : `notif-${idx}`;
                  const isUnread = Boolean(!notif.isRead);

                  return (
                    <TouchableOpacity
                      key={notifId}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push("/Screens/vendorScreens/notifications" as any)
                      }
                      style={[
                        styles.notifItem,
                        idx === Math.min(recentNotifications.length, 3) - 1
                          ? { borderBottomWidth: 0 }
                          : undefined,
                      ]}
                    >
                      <View
                        style={[
                          styles.notifDot,
                          { backgroundColor: isUnread ? "#016073" : "#CBD5E1" },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.notifTitle,
                            isUnread ? { fontWeight: "700" } : undefined,
                          ]}
                        >
                          {String(notif.title || "Notification")}
                        </Text>
                        <Text style={styles.notifMsg} numberOfLines={2}>
                          {String(notif.message || "")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>
          )}
      </ScrollView>

      {/* ── REAL-TIME NEW ORDER POPUP MODAL ───────────────────────────── */}
      <Modal
        visible={Boolean(newOrderAlert)}
        transparent
        animationType="slide"
        onRequestClose={() => dispatch(dismissNewOrderAlert())}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.alertIconCircle}>
                <Ionicons
                  name="notifications"
                  size={scale(24)}
                  color="#016073"
                />
              </View>
              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <Text style={styles.modalAlertBadge}>NEW ORDER RECEIVED!</Text>
                <Text style={styles.modalOrderNumber}>
                  #{newOrderAlert?.orderNumber || "ORDER"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => dispatch(dismissNewOrderAlert())}
                style={styles.closeModalBtn}
              >
                <Feather name="x" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Order Details */}
            <View style={styles.modalBody}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailVal}>
                  {newOrderAlert?.customerName ||
                    newOrderAlert?.customer?.name ||
                    "Customer"}
                </Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailVal}>
                  {newOrderAlert?.customerPhone ||
                    newOrderAlert?.deliveryAddress?.phone ||
                    "N/A"}
                </Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text
                  style={[
                    styles.detailVal,
                    {
                      color: "#016073",
                      fontWeight: "800",
                      fontSize: scale(15),
                    },
                  ]}
                >
                  NPR {newOrderAlert?.totalAmount}
                </Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.detailLabel}>Payment Method:</Text>
                <Text style={styles.detailVal}>
                  {newOrderAlert?.paymentMethod || "Cash on delivery"}
                </Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.detailLabel}>Order Time:</Text>
                <Text style={styles.detailVal}>
                  {newOrderAlert?.time || new Date().toLocaleTimeString()}
                </Text>
              </View>

              {/* Items Summary */}
              {newOrderAlert?.items && (
                <View style={styles.modalItemsBox}>
                  <Text style={styles.itemsBoxTitle}>
                    Items (
                    {newOrderAlert.totalCount || newOrderAlert.items.length}):
                  </Text>
                  {newOrderAlert.items.slice(0, 3).map((it: any, i: number) => (
                    <Text key={i} style={styles.itemRowText} numberOfLines={1}>
                      &bull; {it.name} &times; {it.quantity}
                    </Text>
                  ))}
                  {newOrderAlert.items.length > 3 && (
                    <Text style={styles.itemRowMore}>
                      +{newOrderAlert.items.length - 3} more items...
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.rejectBtn]}
                onPress={() => handleRejectNewOrder(newOrderAlert?._id)}
                disabled={processingOrderAction}
              >
                <Feather name="x" size={scale(16)} color="#DC2626" />
                <Text style={styles.rejectBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.acceptBtn]}
                onPress={() => handleAcceptNewOrder(newOrderAlert?._id)}
                disabled={processingOrderAction}
              >
                {processingOrderAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={scale(16)} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Accept Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
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
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: moderateScale(30),
  },
  banner: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(14),
    borderRadius: scale(14),
    padding: scale(16),
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  welcomeSubtitle: {
    fontSize: moderateScale(10),
    letterSpacing: 1,
    color: "#86C4CB",
    fontWeight: "800",
  },
  welcomeTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: scale(2),
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(4),
    borderRadius: scale(20),
    gap: scale(4),
  },
  verifiedText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  bannerMeta: {
    color: "#E2E8F0",
    fontSize: moderateScale(12),
    marginTop: scale(10),
    lineHeight: scale(16),
  },
  financeBanner: {
    flexDirection: "row",
    marginHorizontal: scale(16),
    marginTop: moderateScale(12),
    gap: scale(10),
  },
  financeCard: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: scale(12),
    padding: scale(12),
  },
  financeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  financeCardLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#15803D",
  },
  financeCardValue: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#15803D",
    marginTop: scale(4),
  },
  financeCardSub: {
    fontSize: moderateScale(9.5),
    color: "#16A34A",
    marginTop: scale(2),
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(18),
    marginBottom: moderateScale(8),
  },
  sectionHeading: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: scale(12),
    gap: scale(8),
  },
  metricCard: {
    width: (SCREEN_WIDTH - scale(40)) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(8),
  },
  metricValue: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  metricLabel: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    gap: scale(8),
  },
  actionBtn: {
    flex: 1,
    borderRadius: scale(10),
    overflow: "hidden",
  },
  actionGradient: {
    paddingVertical: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(10),
    gap: scale(4),
  },
  actionBtnText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#016073",
    textAlign: "center",
  },
  recentOrdersCard: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(16),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  recentOrdersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  recentOrdersTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  viewAllText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#016073",
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  orderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  orderIconBox: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  orderId: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  orderSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
  },
  prepBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
    backgroundColor: "#F1F5F9",
    marginTop: scale(3),
  },
  prepBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#475569",
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  notifDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  notifTitle: {
    fontSize: moderateScale(12),
    color: "#0F172A",
  },
  notifMsg: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(18),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(18),
    padding: scale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: scale(12),
  },
  alertIconCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAlertBadge: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  modalOrderNumber: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
    marginTop: scale(1),
  },
  closeModalBtn: {
    padding: scale(4),
  },
  modalBody: {
    paddingVertical: scale(12),
    gap: scale(8),
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  detailVal: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#0F172A",
  },
  modalItemsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(8),
    padding: scale(10),
    marginTop: scale(6),
  },
  itemsBoxTitle: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#475569",
    marginBottom: scale(4),
  },
  itemRowText: {
    fontSize: moderateScale(11.5),
    color: "#334155",
    lineHeight: scale(16),
  },
  itemRowMore: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontStyle: "italic",
    marginTop: scale(2),
  },
  modalActions: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: scale(6),
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    gap: scale(6),
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
  },
  rejectBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#DC2626",
  },
  acceptBtn: {
    backgroundColor: "#016073",
  },
  acceptBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
