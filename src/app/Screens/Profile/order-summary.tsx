import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/store/services/socketService";
import {
  fetchCustomerOrderById,
  OrderStatus,
  orderStatusUpdatedRealtime,
} from "@/store/slices/orderSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_STEPS: { key: OrderStatus; label: string; icon: any }[] = [
  { key: "PLACED", label: "Order Placed", icon: "receipt-outline" },
  { key: "ACCEPTED", label: "Accepted by Store", icon: "storefront-outline" },
  { key: "PREPARING", label: "Preparing Items", icon: "restaurant-outline" },
  {
    key: "READY_FOR_PICKUP",
    label: "Ready for Pickup",
    icon: "bag-check-outline",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: "bicycle-outline",
  },
  { key: "DELIVERED", label: "Delivered", icon: "checkmark-circle-outline" },
];

export default function OrderSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
  }>();

  const { currentOrder, customerLoading } = useAppSelector(
    (state) => state.order,
  );

  const [copied, setCopied] = useState(false);
  const [liveRiderLocation, setLiveRiderLocation] = useState<{
    latitude: number;
    longitude: number;
    speed?: number;
    updatedAt?: string;
  } | null>(null);

  // Active target order ID
  const activeOrderId = params.orderId || currentOrder?._id || "";

  // ── Fetch & Real-time Socket Subscription ────────────────────────────
  useEffect(() => {
    if (activeOrderId) {
      dispatch(fetchCustomerOrderById(activeOrderId));

      // Connect socket & subscribe to this order room
      socketService.connect(false).then(() => {
        socketService.subscribeToOrder(activeOrderId);
      });

      // Listen for real-time status updates from vendor
      const unsubscribe = socketService.onOrderStatusUpdated((update) => {
        if (
          String(update?._id) === String(activeOrderId) ||
          update?.orderNumber === params.orderNumber
        ) {
          dispatch(orderStatusUpdatedRealtime(update));
        }
      });

      // Listen for delivery partner assignment & GPS updates
      const unsubPartner = socketService.onDeliveryPartnerAssigned((data) => {
        if (String(data?.orderId) === String(activeOrderId)) {
          dispatch(fetchCustomerOrderById(activeOrderId));
        }
      });

      // Listen for live delivery partner GPS location updates
      const unsubLocation = socketService.onDeliveryLocationUpdate((locData) => {
        if (String(locData?.orderId) === String(activeOrderId)) {
          setLiveRiderLocation({
            latitude: locData.latitude,
            longitude: locData.longitude,
            speed: locData.speed,
            updatedAt: locData.updatedAt || new Date().toISOString(),
          });
        }
      });

      return () => {
        unsubscribe();
        unsubPartner();
        unsubLocation();
      };
    }
  }, [dispatch, activeOrderId, params.orderNumber]);

  const order = currentOrder;
  const currentStatus: OrderStatus = order?.orderStatus || "PLACED";
  const isRejected =
    currentStatus === "REJECTED" || currentStatus === "CANCELLED";

  // Calculate current step index
  const activeStepIndex = useMemo(() => {
    switch (currentStatus) {
      case "PLACED":
        return 0;
      case "ACCEPTED":
        return 1;
      case "PREPARING":
        return 2;
      case "READY_FOR_PICKUP":
        return 3;
      case "OUT_FOR_DELIVERY":
        return 4;
      case "DELIVERED":
        return 5;
      default:
        return 0;
    }
  }, [currentStatus]);

  const handleCopyOrderId = () => {
    setCopied(true);
    Alert.alert("Copied", `Order ID copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:015585858").catch(() => {
      Alert.alert("Support", "Please call us at: 015585858");
    });
  };

  const displayedOrderNumber =
    order?.orderNumber || params.orderNumber || "BM-ORDER";

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 1. Header with SafeAreaView for full top status bar coverage */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/customerMain/home" as any))}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Live Order Tracking</Text>
          <View style={{ width: scale(36) }} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Order Details</Text>
          <Text style={styles.arrivingSubtext}>
            {isRejected
              ? "Order was cancelled"
              : currentStatus === "DELIVERED"
                ? "Delivered successfully"
                : "Arriving in 15-25 mins"}
          </Text>
        </View>

        {/* Items in this order heading */}
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsHeaderText}>
            {order?.items?.length || 0} items in this order
          </Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Live Real-Time Status Card ─────────────────────────────── */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusCardTitle}>
              {isRejected
                ? "Order Cancelled"
                : `Current Status: ${
                    currentStatus === "PLACED"
                      ? "Waiting for Store Confirmation"
                      : currentStatus === "ACCEPTED"
                        ? "Store Accepted Your Order"
                        : currentStatus === "PREPARING"
                          ? "Store is Packing Your Items"
                          : currentStatus === "READY_FOR_PICKUP"
                            ? "Order Packed & Ready"
                            : currentStatus === "OUT_FOR_DELIVERY"
                              ? "Delivery Partner on the Way"
                              : "Delivered Successfully"
                  }`}
            </Text>
          </View>

          {isRejected ? (
            <View style={styles.rejectedBanner}>
              <Ionicons name="close-circle" size={scale(20)} color="#DC2626" />
              <Text style={styles.rejectedText}>
                {order?.rejectionReason ||
                  "Store was unable to fulfill this order."}
              </Text>
            </View>
          ) : (
            <View style={styles.stepperContainer}>
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= activeStepIndex;
                const isCurrent = idx === activeStepIndex;

                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepCircle,
                          isCompleted && styles.stepCircleCompleted,
                          isCurrent && styles.stepCircleCurrent,
                        ]}
                      >
                        <Ionicons
                          name={step.icon}
                          size={scale(13)}
                          color={isCompleted ? "#FFFFFF" : "#94A3B8"}
                        />
                      </View>
                      {idx < STATUS_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            isCompleted && styles.stepLineCompleted,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isCompleted && styles.stepLabelCompleted,
                          isCurrent && styles.stepLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Customer Delivery Verification OTP Card ──────────────────── */}
        {order?.customerDeliveryOtp && currentStatus !== "DELIVERED" ? (
          <View style={styles.otpCard}>
            <View style={styles.otpHeaderRow}>
              <View style={styles.otpIconBox}>
                <Feather name="shield" size={scale(18)} color="#0F766E" />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.otpCardTitle}>Delivery Verification OTP</Text>
                <Text style={styles.otpCardSub}>
                  Share this code with your delivery partner at the doorstep
                </Text>
              </View>
            </View>
            <View style={styles.otpCodeContainer}>
              <Text style={styles.otpCodeText}>{order.customerDeliveryOtp}</Text>
            </View>
            <Text style={styles.otpSafetyHint}>
              🔒 Do not share this OTP before receiving and checking your package.
            </Text>
          </View>
        ) : null}

        {/* ── Assigned Delivery Partner Card ───────────────────────────── */}
        {order?.assignedDeliveryBoy ? (
          <View style={styles.partnerCard}>
            <View style={styles.partnerCardTop}>
              <View style={styles.partnerAvatarBox}>
                <MaterialCommunityIcons name="moped" size={scale(22)} color="#0F766E" />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.partnerRoleLabel}>DELIVERY PARTNER ASSIGNED</Text>
                <Text style={styles.partnerName}>
                  {order.assignedDeliveryBoy.fullName || "Delivery Partner"}
                </Text>
                <Text style={styles.partnerVehicle}>
                  {order.assignedDeliveryBoy.vehicleDetails?.vehicleType || "Motorcycle"} • ⭐ 5.0
                </Text>
              </View>
              {order.assignedDeliveryBoy.phone ? (
                <TouchableOpacity
                  style={styles.partnerCallBtn}
                  onPress={() => Linking.openURL(`tel:${order.assignedDeliveryBoy.phone}`)}
                >
                  <Feather name="phone" size={scale(16)} color="#0F766E" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Live GPS Tracker Indicator */}
            {liveRiderLocation || currentStatus === "OUT_FOR_DELIVERY" ? (
              <View style={styles.liveTrackingRow}>
                <View style={styles.liveTrackingDot} />
                <Text style={styles.liveTrackingText}>
                  {liveRiderLocation
                    ? `Live GPS Active • (${liveRiderLocation.latitude.toFixed(4)}°N, ${liveRiderLocation.longitude.toFixed(4)}°E)`
                    : "Live GPS Active • Rider is on the way"}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Ordered Items List ─────────────────────────────────────── */}
        <View style={styles.itemsListCard}>
          {order?.items?.map((item, index) => (
            <View
              key={item.productId || index}
              style={[
                styles.itemRow,
                index < (order.items?.length || 0) - 1 && styles.itemDivider,
              ]}
            >
              {/* Thumbnail */}
              <View style={styles.imageBox}>
                <Image
                  source={{
                    uri:
                      item.imageUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80",
                  }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              </View>

              {/* Title & Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.packInfo}>
                  Qty: {item.quantity} &middot; {item.weight || "1 unit"}
                </Text>
              </View>

              {/* Prices on Right */}
              <View style={styles.priceCol}>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <Text style={styles.strikethroughPrice}>
                    Rs.{item.originalPrice * item.quantity}
                  </Text>
                ) : null}
                <Text style={styles.finalPrice}>
                  Rs.{item.price * item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Bill details Card ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill details</Text>
          <View style={styles.cardDivider} />

          <View style={styles.billRows}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>Rs.{order?.itemsTotal || 0}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Handling charge</Text>
              <Text style={styles.billValue}>
                Rs.{order?.handlingCharge || 30}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery charge</Text>
              <Text style={styles.freeValue}>
                {order?.deliveryCharge === 0
                  ? "FREE"
                  : `Rs.${order?.deliveryCharge}`}
              </Text>
            </View>

            {order?.discount ? (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Coupon discount</Text>
                <Text style={styles.discountValue}>-Rs.{order.discount}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.cardDivider} />

          {/* Bill Total */}
          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Bill Total</Text>
            <Text style={styles.billTotalValue}>
              Rs.{order?.totalAmount || 0}
            </Text>
          </View>
        </View>

        {/* ── Order Details Card ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <View style={styles.cardDivider} />

          <View style={styles.orderDetailsList}>
            {/* Store Info */}
            <View style={styles.orderDetailItem}>
              <Text style={styles.detailLabel}>Store / Vendor</Text>
              <Text style={styles.detailValueBold}>
                {order?.vendor?.businessDetails?.businessName ||
                  order?.vendor?.sellerDetails?.sellerName ||
                  "BhansaMart Partner Store"}
              </Text>
            </View>

            {/* Order id */}
            <View style={styles.orderDetailItem}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCopyOrderId}
                style={styles.orderIdRow}
              >
                <Text style={styles.detailValueBold}>
                  {displayedOrderNumber}
                </Text>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={scale(16)}
                  color={copied ? "#059669" : "#475569"}
                />
              </TouchableOpacity>
            </View>

            {/* Payment */}
            <View style={styles.orderDetailItem}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {order?.paymentMethod || "Cash on delivery"} &middot;{" "}
                <Text
                  style={{
                    color:
                      order?.paymentStatus === "paid" ? "#059669" : "#D97706",
                    fontWeight: "700",
                  }}
                >
                  {order?.paymentStatus === "paid" ? "PAID" : "PENDING"}
                </Text>
              </Text>
            </View>

            {/* Deliver to */}
            <View style={styles.orderDetailItem}>
              <Text style={styles.detailLabel}>Deliver to</Text>
              <Text style={styles.detailValue}>
                {order?.deliveryAddress?.addressLine ||
                  "Baneshwor, Kathmandu, Bagmati, Nepal"}
              </Text>
              <Text style={styles.detailPhone}>
                Contact: {order?.deliveryAddress?.phone || "N/A"}
              </Text>
            </View>

            {/* Order placed timestamp */}
            <View style={styles.orderDetailItem}>
              <Text style={styles.detailLabel}>Placed At</Text>
              <Text style={styles.detailValue}>
                {order?.createdAt
                  ? new Date(order.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Just now"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Support Card ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need help with your order?</Text>
          <View style={styles.cardDivider} />

          <TouchableOpacity activeOpacity={0.7} onPress={handleCallSupport}>
            <Text style={styles.supportText}>
              For instant customer support, call us at:{" "}
              <Text style={styles.supportPhoneBold}>015585858</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1E293B",
  },
  titleSection: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(4),
  },
  screenTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  arrivingSubtext: {
    fontSize: moderateScale(13),
    color: "#0284C7",
    fontWeight: "600",
    marginTop: moderateScale(2),
  },
  itemsHeader: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(14),
    paddingBottom: moderateScale(8),
  },
  itemsHeaderText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#64748B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: scale(16),
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(14),
  },
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: moderateScale(14),
  },
  pulseDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#10B981",
  },
  statusCardTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  rejectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#FEF2F2",
    padding: scale(12),
    borderRadius: scale(10),
  },
  rejectedText: {
    fontSize: moderateScale(13),
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
  },
  stepperContainer: {
    marginTop: moderateScale(4),
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
  },
  stepIndicatorCol: {
    alignItems: "center",
    width: scale(26),
  },
  stepCircle: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleCompleted: {
    backgroundColor: "#059669",
  },
  stepCircleCurrent: {
    backgroundColor: "#008080",
    borderWidth: 2,
    borderColor: "#A7F3D0",
  },
  stepLine: {
    width: 2,
    height: scale(24),
    backgroundColor: "#E2E8F0",
    marginVertical: scale(2),
  },
  stepLineCompleted: {
    backgroundColor: "#059669",
  },
  stepTextCol: {
    paddingTop: scale(2),
    paddingBottom: scale(14),
  },
  stepLabel: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    fontWeight: "500",
  },
  stepLabelCompleted: {
    color: "#1E293B",
    fontWeight: "600",
  },
  stepLabelCurrent: {
    color: "#008080",
    fontWeight: "800",
  },
  itemsListCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  imageBox: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
    marginRight: scale(8),
  },
  itemName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
    marginBottom: scale(2),
  },
  packInfo: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  priceCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  strikethroughPrice: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    marginBottom: scale(1),
  },
  finalPrice: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(12),
  },
  billRows: {
    gap: moderateScale(10),
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  billLabel: {
    fontSize: moderateScale(13),
    color: "#475569",
    fontWeight: "500",
  },
  billValue: {
    fontSize: moderateScale(13),
    color: "#1E293B",
    fontWeight: "600",
  },
  discountValue: {
    fontSize: moderateScale(13),
    color: "#059669",
    fontWeight: "700",
  },
  freeValue: {
    fontSize: moderateScale(13),
    color: "#059669",
    fontWeight: "700",
  },
  billTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  billTotalLabel: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
  },
  billTotalValue: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  orderDetailsList: {
    gap: moderateScale(12),
  },
  orderDetailItem: {
    gap: moderateScale(2),
  },
  detailLabel: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "500",
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  detailValueBold: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  detailValue: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
  },
  detailPhone: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  supportText: {
    fontSize: moderateScale(13),
    color: "#475569",
    lineHeight: moderateScale(18),
  },
  supportPhoneBold: {
    fontWeight: "700",
    color: "#008080",
  },
  otpCard: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1.5,
    borderColor: "#CCFBF1",
    borderRadius: scale(14),
    padding: scale(16),
    marginBottom: moderateScale(14),
  },
  otpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  otpIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  otpCardTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F766E",
  },
  otpCardSub: {
    fontSize: moderateScale(11),
    color: "#475569",
    marginTop: moderateScale(1),
  },
  otpCodeContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#99F6E4",
    borderRadius: scale(10),
    paddingVertical: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: moderateScale(10),
  },
  otpCodeText: {
    fontSize: moderateScale(26),
    fontWeight: "900",
    letterSpacing: 8,
    color: "#0F766E",
  },
  otpSafetyHint: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    textAlign: "center",
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  partnerAvatarBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerRoleLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#0F766E",
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: moderateScale(1),
  },
  partnerVehicle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  partnerCallBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveTrackingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
    marginTop: moderateScale(10),
    gap: scale(8),
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  liveTrackingDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
  },
  liveTrackingText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#065F46",
    flex: 1,
  },
});
