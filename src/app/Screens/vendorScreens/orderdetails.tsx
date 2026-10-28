import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/store/services/socketService";
import {
  fetchCustomerOrderById,
  orderStatusUpdatedRealtime,
  updateVendorOrderStatus,
  OrderRecord,
} from "@/store/slices/orderSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { vendorAcknowledgeClaimApi, vendorDirectRefundPayoutApi } from "@/store/services/orderService";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PLACED":
    case "New":
    case "Pending":
      return {
        label: "Pending Acceptance",
        bg: "#EFF6FF",
        text: "#1D4ED8",
        border: "#BFDBFE",
        icon: "clock" as const,
      };
    case "ACCEPTED":
    case "PREPARING":
    case "Preparing":
      return {
        label: "Preparing Order",
        bg: "#FFFBEB",
        text: "#B45309",
        border: "#FDE68A",
        icon: "tool" as const,
      };
    case "READY_FOR_PICKUP":
    case "Ready":
      return {
        label: "Ready for Pickup",
        bg: "#F0FDF4",
        text: "#15803D",
        border: "#BBF7D0",
        icon: "package" as const,
      };
    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for Delivery",
        bg: "#F5F3FF",
        text: "#7C3AED",
        border: "#DDD6FE",
        icon: "truck" as const,
      };
    case "DELIVERED":
    case "Delivered":
    case "Completed":
      return {
        label: "Delivered",
        bg: "#ECFDF5",
        text: "#059669",
        border: "#A7F3D0",
        icon: "check-circle" as const,
      };
    case "REJECTED":
    case "CANCELLED":
    case "Cancelled":
      return {
        label: "Cancelled / Declined",
        bg: "#FEF2F2",
        text: "#B91C1C",
        border: "#FECACA",
        icon: "x-circle" as const,
      };
    default:
      return {
        label: status,
        bg: "#F1F5F9",
        text: "#475569",
        border: "#CBD5E1",
        icon: "info" as const,
      };
  }
};

const TIMELINE_STEPS = [
  { key: "PLACED", label: "Order Placed" },
  { key: "ACCEPTED", label: "Store Accepted" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function VendorOrderDetailsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orderId, orderNumber } = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
  }>();

  const { vendorOrders, currentOrder, actionLoading } = useAppSelector(
    (state) => state.order,
  );

  const [refreshing, setRefreshing] = useState(false);
  const [acknowledgingClaim, setAcknowledgingClaim] = useState(false);
  const [codRefundModalVisible, setCodRefundModalVisible] = useState(false);
  const [codRefundMethod, setCodRefundMethod] = useState<"BANK_TRANSFER" | "UPI" | "CASH">("BANK_TRANSFER");
  const [codTxRef, setCodTxRef] = useState("");
  const [codNotes, setCodNotes] = useState("");
  const [submittingCodRefund, setSubmittingCodRefund] = useState(false);

  // 1. Resolve Order from Redux or fetch from API
  const order: OrderRecord | null = useMemo(() => {
    // Check currentOrder if it matches
    if (
      currentOrder &&
      (String(currentOrder._id) === String(orderId) ||
        currentOrder.orderNumber === orderNumber)
    ) {
      return currentOrder;
    }
    // Check vendorOrders in Redux
    const found = vendorOrders.find(
      (o) =>
        String(o._id) === String(orderId) || o.orderNumber === orderNumber,
    );
    if (found) return found;

    return currentOrder;
  }, [currentOrder, vendorOrders, orderId, orderNumber]);

  // Load fresh details from API
  const loadOrderDetails = useCallback(async () => {
    const idToFetch = orderId || order?._id;
    if (idToFetch) {
      try {
        await dispatch(fetchCustomerOrderById(idToFetch)).unwrap();
      } catch (err) {
        console.warn("[VendorOrderDetails] Failed to refresh order:", err);
      }
    }
  }, [dispatch, orderId, order?._id]);

  useEffect(() => {
    loadOrderDetails();

    // Listen for real-time status updates
    const unsubscribeStatus = socketService.onOrderStatusUpdated((update) => {
      if (
        order &&
        (String(update._id) === String(order._id) ||
          update.orderNumber === order.orderNumber)
      ) {
        dispatch(orderStatusUpdatedRealtime(update));
      }
    });

    return () => {
      unsubscribeStatus();
    };
  }, [loadOrderDetails, order, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  // ── Handle Vendor Status Updates ────────────────────────────────────
  const handleAcknowledgeClaim = async (refundId: string) => {
    setAcknowledgingClaim(true);
    try {
      await vendorAcknowledgeClaimApi(refundId, { notes: "Store acknowledged claim and initiated resolution." });
      Alert.alert("Claim Acknowledged", "You have acknowledged this return claim. Please proceed with planned customer refund or replacement.");
      if (orderId) dispatch(fetchCustomerOrderById(orderId));
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to acknowledge claim");
    } finally {
      setAcknowledgingClaim(false);
    }
  };

  const handleCompleteCodRefund = async (refundId: string) => {
    if (!codTxRef.trim()) {
      Alert.alert("Transaction Reference Required", "Please enter the UTR or Bank/UPI payment reference number.");
      return;
    }
    setSubmittingCodRefund(true);
    try {
      await vendorDirectRefundPayoutApi(refundId, {
        transactionReference: codTxRef.trim(),
        paymentMethod: codRefundMethod,
        notes: codNotes.trim(),
      });
      Alert.alert("Refund Completed", "Direct customer refund has been recorded and marked as completed.");
      setCodRefundModalVisible(false);
      setCodTxRef("");
      setCodNotes("");
      if (orderId) dispatch(fetchCustomerOrderById(orderId));
    } catch (err: any) {
      Alert.alert("Failed to Submit Refund", err?.response?.data?.message || err.message || "Failed to complete refund.");
    } finally {
      setSubmittingCodRefund(false);
    }
  };

  const handleUpdateStatus = async (
    newStatus: string,
    rejectionReason?: string,
  ) => {
    if (!order?._id) return;

    try {
      const result = await dispatch(
        updateVendorOrderStatus({
          orderId: order._id,
          status: newStatus,
          reason: rejectionReason,
        }),
      );

      if (updateVendorOrderStatus.fulfilled.match(result)) {
        Alert.alert(
          "Status Updated",
          `Order status successfully changed to ${newStatus.replace(/_/g, " ")}.`,
        );
        loadOrderDetails();
      } else {
        Alert.alert(
          "Update Failed",
          (result.payload as string) || "Could not update order status.",
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update order status.");
    }
  };

  const handlePhoneCall = (phone?: string) => {
    if (!phone || phone === "N/A") {
      Alert.alert("No Phone Number", "Phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar style="dark" />
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={scale(20)} color="#016073" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Order Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#016073" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadge(order.orderStatus);
  const formattedTime = order.createdAt
    ? new Date(order.createdAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  const customerName =
    order.customer?.name || (order as any).customerName || "Customer";
  const customerPhone =
    order.customer?.phone ||
    order.deliveryAddress?.phone ||
    (order as any).customerPhone ||
    "N/A";
  const customerEmail =
    order.customer?.email || (order as any).customerEmail || "";
  const addressLine =
    order.deliveryAddress?.addressLine || (order as any).address || "Kathmandu";
  const addressCity = order.deliveryAddress?.city || "";
  const addressLandmark = order.deliveryAddress?.landmark || "";

  const rider = order.assignedDeliveryBoy;
  const pickupOtp =
    order.vendorPickupOtp || (order as any).pickupOtp?.displayCode;

  // Determine current timeline active step index
  const activeStepIdx = useMemo(() => {
    switch (order.orderStatus) {
      case "PLACED":
        return 0;
      case "ACCEPTED":
      case "PREPARING":
        return 1;
      case "READY_FOR_PICKUP":
        return 2;
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return -1;
    }
  }, [order.orderStatus]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.navSub}>{formattedTime}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
          ]}
        >
          <Feather
            name={statusBadge.icon}
            size={scale(12)}
            color={statusBadge.text}
          />
          <Text style={[styles.statusPillText, { color: statusBadge.text }]}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
      >
        {/* PICKUP OTP VERIFICATION BANNER */}
        {pickupOtp &&
          (order.orderStatus === "READY_FOR_PICKUP" ||
            order.orderStatus === "ACCEPTED" ||
            order.orderStatus === "PREPARING") && (
            <View style={styles.otpBanner}>
              <View style={styles.otpLeft}>
                <Ionicons name="key-outline" size={scale(24)} color="#016073" />
                <View style={{ flex: 1, marginLeft: scale(10) }}>
                  <Text style={styles.otpBannerTitle}>Store Pickup OTP</Text>
                  <Text style={styles.otpBannerSub}>
                    Rider must verify this code before taking package
                  </Text>
                </View>
              </View>
              <View style={styles.otpCodeBox}>
                <Text style={styles.otpCodeText}>{pickupOtp}</Text>
              </View>
            </View>
          )}

        {/* REJECTION REASON NOTICE */}
        {(order.orderStatus === "REJECTED" ||
          order.orderStatus === "CANCELLED") && (
          <View style={styles.cancelBanner}>
            <Ionicons name="alert-circle" size={scale(20)} color="#DC2626" />
            <View style={{ flex: 1, marginLeft: scale(8) }}>
              <Text style={styles.cancelBannerTitle}>Order Cancelled</Text>
              <Text style={styles.cancelBannerSub}>
                Reason: {order.rejectionReason || "Declined by store."}
              </Text>
            </View>
          </View>
        )}

        {/* CUSTOMER & DELIVERY ADDRESS CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Customer Information</Text>
            {customerPhone !== "N/A" && (
              <TouchableOpacity
                style={styles.callPill}
                activeOpacity={0.7}
                onPress={() => handlePhoneCall(customerPhone)}
              >
                <Feather name="phone-call" size={scale(12)} color="#016073" />
                <Text style={styles.callPillText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person-circle-outline" size={scale(18)} color="#64748B" />
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerPhone}>{customerPhone}</Text>
              {customerEmail ? (
                <Text style={styles.customerEmail}>{customerEmail}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={scale(18)} color="#64748B" />
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.addressTitle}>Delivery Destination</Text>
              <Text style={styles.addressLine}>{addressLine}</Text>
              {addressCity ? (
                <Text style={styles.addressSub}>{addressCity}</Text>
              ) : null}
              {addressLandmark ? (
                <Text style={styles.addressSub}>
                  Landmark: {addressLandmark}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── CUSTOMER RETURN / REFUND / EXCHANGE CLAIM CARD ── */}
        {order.refundDetails && (
          <View style={[styles.card, { borderColor: "#0284C7", borderWidth: 1.5, backgroundColor: "#F0F9FF" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scale(8) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                <MaterialCommunityIcons name="keyboard-return" size={scale(20)} color="#0284C7" />
                <Text style={[styles.cardHeading, { color: "#0369A1", marginBottom: 0 }]}>
                  Customer {order.refundDetails.claimType || "Return"} Claim
                </Text>
              </View>
              <View style={{ paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(4), backgroundColor: "#E0F2FE" }}>
                <Text style={{ fontSize: moderateScale(11), fontWeight: "800", color: "#0284C7" }}>
                  {order.refundDetails.status || "REQUESTED"}
                </Text>
              </View>
            </View>

            <View style={{ gap: scale(6), marginBottom: scale(10) }}>
              <Text style={{ fontSize: moderateScale(13), fontWeight: "700", color: "#0F172A" }}>
                Claim Reason: {order.refundDetails.reason || "Customer requested return"}
              </Text>
              {order.refundDetails.description ? (
                <Text style={{ fontSize: moderateScale(12), color: "#475569" }}>
                  Note: {order.refundDetails.description}
                </Text>
              ) : null}
              <Text style={{ fontSize: moderateScale(13), fontWeight: "800", color: "#0284C7" }}>
                Eligible Refund Amount: NPR {order.refundDetails.amount || order.totalAmount}
              </Text>
            </View>

            {/* Return Pickup Status & Inspection Report */}
            {order.refundDetails.pickup && order.refundDetails.pickup.status !== "NOT_REQUIRED" && (
              <View style={{ padding: scale(10), borderRadius: scale(8), backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#BAE6FD", marginBottom: scale(10) }}>
                <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: "#0369A1", marginBottom: scale(4) }}>
                  Reverse Pickup & Inspection
                </Text>
                <Text style={{ fontSize: moderateScale(12), color: "#334155" }}>
                  Pickup Status: <Text style={{ fontWeight: "700" }}>{order.refundDetails.pickup.status}</Text>
                </Text>
                {order.refundDetails.inspection?.condition ? (
                  <View style={{ marginTop: scale(4) }}>
                    <Text style={{ fontSize: moderateScale(12), color: "#334155" }}>
                      Product Condition: <Text style={{ fontWeight: "700", color: "#0284C7" }}>{order.refundDetails.inspection.condition}</Text>
                    </Text>
                    {order.refundDetails.inspection.notes ? (
                      <Text style={{ fontSize: moderateScale(11), color: "#64748B" }}>
                        Inspector Notes: {order.refundDetails.inspection.notes}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Return Pickup Deduction in Vendor Wallet */}
                {order.refundDetails.pickup.isPickupChargeDebited && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4), marginTop: scale(6) }}>
                    <Ionicons name="receipt-outline" size={scale(14)} color="#15803D" />
                    <Text style={{ fontSize: moderateScale(11), color: "#15803D", fontWeight: "700" }}>
                      NPR {order.refundDetails.pickup.pickupCharge || 50} Return Pickup Fee debited from Wallet (Ref: {order.refundDetails.pickup.pickupChargeTxRef})
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Refund Responsibility Section */}
            {order.paymentMethod?.toLowerCase().includes("cash") ? (
              // COD ORDER: Responsible Vendor Pays Customer Directly
              <View style={{ padding: scale(10), borderRadius: scale(8), backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(4) }}>
                  <Ionicons name="information-circle" size={scale(16)} color="#B45309" />
                  <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: "#B45309" }}>
                    COD Order: Store Direct Refund Required
                  </Text>
                </View>
                <Text style={{ fontSize: moderateScale(11), color: "#78350F", marginBottom: scale(8) }}>
                  You received physical cash for this order. Please refund the customer directly from your business account.
                </Text>

                {/* Customer Payout Destination */}
                {order.refundDetails.customerPayoutDetails && (
                  <View style={{ backgroundColor: "#FFFFFF", padding: scale(8), borderRadius: scale(6), marginBottom: scale(10) }}>
                    <Text style={{ fontSize: moderateScale(11), fontWeight: "700", color: "#334155" }}>
                      Customer Destination:
                    </Text>
                    {order.refundDetails.customerPayoutDetails.upiId ? (
                      <Text style={{ fontSize: moderateScale(12), color: "#0284C7", fontWeight: "700" }}>
                        UPI / eSewa: {order.refundDetails.customerPayoutDetails.upiId}
                      </Text>
                    ) : null}
                    {order.refundDetails.customerPayoutDetails.accountNumber ? (
                      <Text style={{ fontSize: moderateScale(11), color: "#475569" }}>
                        Bank: {order.refundDetails.customerPayoutDetails.bankName} | A/C: {order.refundDetails.customerPayoutDetails.accountNumber} | Name: {order.refundDetails.customerPayoutDetails.accountHolderName}
                      </Text>
                    ) : null}
                  </View>
                )}

                {order.refundDetails.status !== "COMPLETED" ? (
                  <View style={{ flexDirection: "row", gap: scale(8) }}>
                    {order.refundDetails.status === "REQUESTED" || order.refundDetails.status === "VENDOR_REVIEW" ? (
                      <TouchableOpacity
                        style={{ flex: 1, paddingVertical: scale(8), borderRadius: scale(6), backgroundColor: "#0284C7", alignItems: "center" }}
                        disabled={acknowledgingClaim}
                        onPress={() => handleAcknowledgeClaim(order.refundDetails._id)}
                      >
                        {acknowledgingClaim ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: "#FFFFFF" }}>
                            Acknowledge Claim
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={{ flex: 1, paddingVertical: scale(8), borderRadius: scale(6), backgroundColor: "#15803D", alignItems: "center" }}
                      onPress={() => setCodRefundModalVisible(true)}
                    >
                      <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: "#FFFFFF" }}>
                        Record Direct Payout
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                    <Ionicons name="checkmark-circle" size={scale(18)} color="#15803D" />
                    <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: "#15803D" }}>
                      Refund Completed (Ref: {order.refundDetails.vendorPaymentDetails?.transactionReference || "Direct Store Payment"})
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // ONLINE PAYMENT ORDER: Managed by Super Admin
              <View style={{ padding: scale(10), borderRadius: scale(8), backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#CBD5E1" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(4) }}>
                  <MaterialCommunityIcons name="shield-check" size={scale(16)} color="#0284C7" />
                  <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: "#0F172A" }}>
                    Online Payment: Managed by Super Admin
                  </Text>
                </View>
                <Text style={{ fontSize: moderateScale(11), color: "#475569", marginBottom: scale(6) }}>
                  This refund is executed directly by BhansaMart Super Admin. Vendors cannot issue online refunds.
                </Text>
                <Text style={{ fontSize: moderateScale(11), color: "#0284C7", fontWeight: "700" }}>
                  Super Admin Payout Status: {order.refundDetails.status}
                </Text>
                {order.refundDetails.customerPayoutDetails?.payoutReference ? (
                  <Text style={{ fontSize: moderateScale(11), color: "#334155" }}>
                    Reference: {order.refundDetails.customerPayoutDetails.payoutReference}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* ASSIGNED DELIVERY PARTNER CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Partner Dispatch</Text>

          {rider ? (
            <View style={styles.riderRow}>
              <View style={styles.riderAvatar}>
                <Ionicons name="bicycle" size={scale(24)} color="#016073" />
              </View>

              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <Text style={styles.riderName}>
                  {rider.fullName || rider.name || "Delivery Partner"}
                </Text>
                <Text style={styles.riderVehicle}>
                  {rider.vehicleDetails?.vehicleType || "Motorcycle"}{" "}
                  {rider.vehicleDetails?.registrationNumber
                    ? `\u2022 ${rider.vehicleDetails.registrationNumber}`
                    : ""}
                </Text>
                {rider.metrics?.completedDeliveries !== undefined ? (
                  <Text style={styles.riderStats}>
                    {rider.metrics.completedDeliveries} completed deliveries
                  </Text>
                ) : null}
              </View>

              {rider.phone ? (
                <TouchableOpacity
                  style={styles.callPill}
                  activeOpacity={0.7}
                  onPress={() => handlePhoneCall(rider.phone)}
                >
                  <Feather name="phone-call" size={scale(12)} color="#016073" />
                  <Text style={styles.callPillText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.searchingRiderBox}>
              <MaterialCommunityIcons
                name="radar"
                size={scale(24)}
                color="#0284C7"
              />
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.searchingRiderTitle}>
                  Dispatch in Progress
                </Text>
                <Text style={styles.searchingRiderSub}>
                  Nearby delivery partners are notified to pick up this package.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ORDER ITEMS LIST */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>
              Ordered Items ({order.items?.length || 0})
            </Text>
            <Text style={styles.itemsTotalLabel}>
              Total Units: {order.totalCount || order.items?.length || 1}
            </Text>
          </View>

          {order.items && order.items.length > 0 ? (
            order.items.map((it, idx) => (
              <View
                key={idx}
                style={[
                  styles.itemRow,
                  idx === order.items.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.itemImageWrap}>
                  {it.imageUrl ? (
                    <Image
                      source={{ uri: it.imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={scale(22)}
                      color="#94A3B8"
                    />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.name}
                  </Text>
                  <Text style={styles.itemWeight}>
                    {it.weight || "1 unit"}{" "}
                    {it.category ? `\u2022 ${it.category}` : ""}
                  </Text>
                  <Text style={styles.itemRate}>
                    NPR {it.price} &times; {it.quantity}
                  </Text>
                </View>

                <Text style={styles.itemSubtotal}>
                  NPR {Number(it.price) * Number(it.quantity)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items data available.</Text>
          )}
        </View>

        {/* BILL & PAYMENT BREAKDOWN */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Payment & Bill Breakdown</Text>

          {/* Payment Method Badge */}
          <View style={styles.paymentMethodRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
              <MaterialCommunityIcons
                name={
                  order.paymentMethod?.toLowerCase().includes("cash")
                    ? "cash"
                    : "credit-card-outline"
                }
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod || "Cash on delivery"}
              </Text>
            </View>

            <View
              style={[
                styles.paymentStatusBadge,
                order.paymentStatus === "PAID"
                  ? styles.paidBadge
                  : styles.unpaidBadge,
              ]}
            >
              <Text
                style={[
                  styles.paymentStatusText,
                  order.paymentStatus === "PAID"
                    ? styles.paidText
                    : styles.unpaidText,
                ]}
              >
                {order.paymentStatus || "PENDING"}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billVal}>
              NPR {order.itemsTotal || order.totalAmount}
            </Text>
          </View>

          {order.deliveryCharge ? (
            <View style={styles.billLine}>
              <Text style={styles.billLabel}>Delivery Charge</Text>
              <Text style={styles.billVal}>NPR {order.deliveryCharge}</Text>
            </View>
          ) : null}

          {order.handlingCharge ? (
            <View style={styles.billLine}>
              <Text style={styles.billLabel}>Packaging & Handling</Text>
              <Text style={styles.billVal}>NPR {order.handlingCharge}</Text>
            </View>
          ) : null}

          {order.discount ? (
            <View style={styles.billLine}>
              <Text style={[styles.billLabel, { color: "#16A34A" }]}>
                Discount Applied
              </Text>
              <Text style={[styles.billVal, { color: "#16A34A" }]}>
                -NPR {order.discount}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>NPR {order.totalAmount}</Text>
          </View>
        </View>

        {/* ORDER PROGRESS TIMELINE */}
        {activeStepIdx !== -1 && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Order Progress</Text>
            <View style={styles.timelineList}>
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = idx <= activeStepIdx;
                const isCurrent = idx === activeStepIdx;
                return (
                  <View key={step.key} style={styles.timelineRow}>
                    <View style={styles.timelineLineCol}>
                      <View
                        style={[
                          styles.timelineDot,
                          isPassed && styles.timelineDotPassed,
                          isCurrent && styles.timelineDotCurrent,
                        ]}
                      >
                        {isPassed && (
                          <Feather name="check" size={scale(10)} color="#FFFFFF" />
                        )}
                      </View>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.timelineBar,
                            idx < activeStepIdx && styles.timelineBarPassed,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineInfo}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          isPassed && styles.timelineLabelPassed,
                          isCurrent && styles.timelineLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* STICKY BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        {order.orderStatus === "PLACED" && (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              disabled={actionLoading}
              onPress={() => {
                Alert.alert(
                  "Decline Order",
                  "Select a reason to decline this order:",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Items Out of Stock",
                      style: "destructive",
                      onPress: () =>
                        handleUpdateStatus("REJECTED", "Items Out of Stock"),
                    },
                    {
                      text: "Store Busy / Closing",
                      style: "destructive",
                      onPress: () =>
                        handleUpdateStatus("REJECTED", "Store Busy"),
                    },
                  ],
                );
              }}
            >
              <Feather name="x" size={scale(16)} color="#DC2626" />
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              disabled={actionLoading}
              onPress={() => handleUpdateStatus("ACCEPTED")}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={scale(16)} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Accept Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {(order.orderStatus === "ACCEPTED" ||
          order.orderStatus === "PREPARING") && (
          <TouchableOpacity
            style={[styles.btn, styles.readyBtn]}
            disabled={actionLoading}
            onPress={() => handleUpdateStatus("READY_FOR_PICKUP")}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-all"
                  size={scale(18)}
                  color="#FFFFFF"
                />
                <Text style={styles.readyBtnText}>
                  Mark Order Ready for Pickup
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {order.orderStatus === "READY_FOR_PICKUP" && (
          <View style={styles.readyBanner}>
            <Ionicons name="time" size={scale(18)} color="#15803D" />
            <Text style={styles.readyBannerText}>
              Ready for Pickup &middot; Waiting for Rider
            </Text>
          </View>
        )}

        {order.orderStatus === "OUT_FOR_DELIVERY" && (
          <View style={styles.outForDeliveryBanner}>
            <Ionicons name="bicycle" size={scale(18)} color="#7C3AED" />
            <Text style={styles.outForDeliveryBannerText}>
              Out for Delivery &middot; En route to customer
            </Text>
          </View>
        )}

        {order.orderStatus === "DELIVERED" && (
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-done-circle" size={scale(20)} color="#16A34A" />
            <Text style={styles.deliveredBannerText}>
              Order Completed & Delivered
            </Text>
          </View>
        )}

        {(order.orderStatus === "REJECTED" ||
          order.orderStatus === "CANCELLED") && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={scale(20)} color="#DC2626" />
            <Text style={styles.cancelledBannerText}>
              Order Declined / Cancelled
            </Text>
          </View>
        )}
      </View>

      {/* ── VENDOR COD DIRECT PAYOUT MODAL ── */}
      {order.refundDetails && (
        <Modal
          visible={codRefundModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCodRefundModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { padding: scale(16) }]}>
              <Text style={{ fontSize: moderateScale(15), fontWeight: "800", color: "#0F172A", marginBottom: scale(4) }}>
                Record COD Direct Customer Refund
              </Text>
              <Text style={{ fontSize: moderateScale(12), color: "#64748B", marginBottom: scale(12) }}>
                Enter the payment reference / UTR for refunding NPR {order.refundDetails.amount || order.totalAmount} to customer.
              </Text>

              {/* Payment Method Selector */}
              <View style={{ flexDirection: "row", gap: scale(6), marginBottom: scale(10) }}>
                {(["UPI", "BANK_TRANSFER", "CASH"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={{
                      flex: 1,
                      paddingVertical: scale(6),
                      borderRadius: scale(6),
                      borderWidth: 1,
                      borderColor: codRefundMethod === m ? "#15803D" : "#CBD5E1",
                      backgroundColor: codRefundMethod === m ? "#15803D" : "transparent",
                      alignItems: "center",
                    }}
                    onPress={() => setCodRefundMethod(m)}
                  >
                    <Text style={{ fontSize: moderateScale(11), fontWeight: "800", color: codRefundMethod === m ? "#FFFFFF" : "#475569" }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  borderRadius: scale(8),
                  padding: scale(10),
                  fontSize: moderateScale(13),
                  color: "#0F172A",
                  marginBottom: scale(8),
                }}
                placeholder="Payment Reference / UTR Number *"
                placeholderTextColor="#94A3B8"
                value={codTxRef}
                onChangeText={setCodTxRef}
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  borderRadius: scale(8),
                  padding: scale(10),
                  fontSize: moderateScale(13),
                  color: "#0F172A",
                  marginBottom: scale(14),
                }}
                placeholder="Notes / Comments (Optional)"
                placeholderTextColor="#94A3B8"
                value={codNotes}
                onChangeText={setCodNotes}
              />

              <View style={{ flexDirection: "row", gap: scale(8) }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: scale(10), borderRadius: scale(8), backgroundColor: "#E2E8F0", alignItems: "center" }}
                  onPress={() => setCodRefundModalVisible(false)}
                >
                  <Text style={{ fontSize: moderateScale(13), fontWeight: "700", color: "#475569" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: scale(10), borderRadius: scale(8), backgroundColor: "#15803D", alignItems: "center" }}
                  disabled={submittingCodRefund}
                  onPress={() => handleCompleteCodRefund(order.refundDetails._id)}
                >
                  {submittingCodRefund ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontSize: moderateScale(13), fontWeight: "800", color: "#FFFFFF" }}>
                      Confirm & Mark Paid
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(16),
  },
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(10),
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  navSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
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
  scrollContent: {
    padding: scale(16),
    gap: scale(12),
    paddingBottom: moderateScale(110),
  },
  otpBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E6F4F6",
    padding: scale(14),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: "#016073",
  },
  otpLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  otpBannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#016073",
  },
  otpBannerSub: {
    fontSize: moderateScale(11),
    color: "#475569",
    marginTop: scale(2),
  },
  otpCodeBox: {
    backgroundColor: "#016073",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
  },
  otpCodeText: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  cancelBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelBannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#DC2626",
  },
  cancelBannerSub: {
    fontSize: moderateScale(11.5),
    color: "#991B1B",
    marginTop: scale(1),
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  cardHeading: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(8),
  },
  callPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
  },
  callPillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  customerName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  customerPhone: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(1),
  },
  customerEmail: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  addressTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#334155",
  },
  addressLine: {
    fontSize: moderateScale(12.5),
    color: "#0F172A",
    marginTop: scale(2),
    lineHeight: scale(17),
  },
  addressSub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatar: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  riderVehicle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(1),
  },
  riderStats: {
    fontSize: moderateScale(11),
    color: "#16A34A",
    fontWeight: "600",
    marginTop: scale(1),
  },
  searchingRiderBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  searchingRiderTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0284C7",
  },
  searchingRiderSub: {
    fontSize: moderateScale(11),
    color: "#0369A1",
    marginTop: scale(1),
  },
  itemsTotalLabel: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(10),
  },
  itemImageWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(6),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  itemWeight: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  itemRate: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  itemSubtotal: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#016073",
  },
  noItemsText: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    fontStyle: "italic",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentMethodText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#334155",
  },
  paymentStatusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  paymentStatusText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  paidBadge: {
    backgroundColor: "#DCFCE7",
  },
  paidText: {
    color: "#15803D",
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  unpaidBadge: {
    backgroundColor: "#FEF3C7",
  },
  unpaidText: {
    color: "#B45309",
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  billLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  billLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  billVal: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#0F172A",
  },
  totalLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(8),
    marginTop: moderateScale(4),
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalLabel: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  totalVal: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    color: "#016073",
  },
  timelineList: {
    paddingTop: moderateScale(4),
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: scale(36),
  },
  timelineLineCol: {
    alignItems: "center",
    width: scale(20),
  },
  timelineDot: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotPassed: {
    backgroundColor: "#016073",
  },
  timelineDotCurrent: {
    backgroundColor: "#016073",
    borderWidth: 2,
    borderColor: "#86C4CB",
  },
  timelineBar: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  timelineBarPassed: {
    backgroundColor: "#016073",
  },
  timelineInfo: {
    flex: 1,
    marginLeft: scale(10),
    justifyContent: "center",
    paddingBottom: scale(10),
  },
  timelineLabel: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    fontWeight: "500",
  },
  timelineLabelPassed: {
    color: "#334155",
    fontWeight: "600",
  },
  timelineLabelCurrent: {
    color: "#016073",
    fontWeight: "800",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: Platform.OS === "ios" ? moderateScale(24) : moderateScale(14),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(11),
    borderRadius: scale(8),
    gap: scale(6),
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectBtnText: {
    color: "#DC2626",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: "#016073",
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  readyBtn: {
    backgroundColor: "#16A34A",
  },
  readyBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  readyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#F0FDF4",
    paddingVertical: moderateScale(11),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  readyBannerText: {
    color: "#15803D",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  outForDeliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#F5F3FF",
    paddingVertical: moderateScale(11),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  outForDeliveryBannerText: {
    color: "#7C3AED",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#ECFDF5",
    paddingVertical: moderateScale(11),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  deliveredBannerText: {
    color: "#059669",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#FEF2F2",
    paddingVertical: moderateScale(11),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelledBannerText: {
    color: "#DC2626",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
