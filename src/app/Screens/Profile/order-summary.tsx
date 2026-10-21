import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  cancelOrderApi,
  requestRefundApi,
} from "@/store/services/orderService";
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
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const isDark = theme.mode === "dark";
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
      const unsubLocation = socketService.onDeliveryLocationUpdate(
        (locData) => {
          if (String(locData?.orderId) === String(activeOrderId)) {
            setLiveRiderLocation({
              latitude: locData.latitude,
              longitude: locData.longitude,
              speed: locData.speed,
              updatedAt: locData.updatedAt || new Date().toISOString(),
            });
          }
        },
      );

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

  const hasClaim = Boolean(
    order?.refundStatus &&
      order.refundStatus !== "NONE" &&
      order.refundStatus !== "NOT_APPLICABLE"
  );

  const activeClaimType =
    order?.refundDetails?.claimType ||
    (order?.refundStatus === "REPLACED" ? "REPLACEMENT" : "REFUND");

  const isReplacementClaim =
    activeClaimType === "REPLACEMENT" || order?.refundStatus === "REPLACED";

  const isReturnClaim =
    activeClaimType === "RETURN" ||
    activeClaimType === "RETURN_REFUND" ||
    activeClaimType === "DEFECTIVE" ||
    activeClaimType === "WRONG_ITEM";

  // Dynamic steps that seamlessly extend to show post-delivery claim stages
  const dynamicSteps = useMemo(() => {
    const steps: { key: string; label: string; icon: any; isError?: boolean }[] = [
      { key: "PLACED", label: "Order Placed", icon: "receipt-outline" },
      { key: "ACCEPTED", label: "Accepted by Store", icon: "storefront-outline" },
      { key: "PREPARING", label: "Preparing Items", icon: "restaurant-outline" },
      { key: "READY_FOR_PICKUP", label: "Ready for Pickup", icon: "bag-check-outline" },
      { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "bicycle-outline" },
      { key: "DELIVERED", label: "Delivered", icon: "checkmark-circle-outline" },
    ];

    if (!hasClaim) {
      return steps;
    }

    if (isReplacementClaim) {
      steps.push(
        {
          key: "CLAIM_REQUESTED",
          label: "Replacement Requested",
          icon: "repeat-outline",
        },
        order?.refundStatus === "REJECTED"
          ? {
              key: "CLAIM_REJECTED",
              label: "Replacement Declined",
              icon: "close-circle-outline",
              isError: true,
            }
          : {
              key: "CLAIM_REVIEW",
              label: "Store Review & Approval",
              icon: "shield-checkmark-outline",
            },
        {
          key: "CLAIM_RESOLVED",
          label: "Replacement Delivered",
          icon: "cube-outline",
        }
      );
    } else if (isReturnClaim) {
      steps.push(
        {
          key: "CLAIM_REQUESTED",
          label: "Return & Refund Requested",
          icon: "swap-horizontal-outline",
        },
        order?.refundStatus === "REJECTED"
          ? {
              key: "CLAIM_REJECTED",
              label: "Return Declined",
              icon: "close-circle-outline",
              isError: true,
            }
          : {
              key: "CLAIM_REVIEW",
              label: "Store Review & Pickup",
              icon: "shield-checkmark-outline",
            },
        {
          key: "CLAIM_RESOLVED",
          label: "Refund Credited to Account",
          icon: "wallet-outline",
        }
      );
    } else {
      steps.push(
        {
          key: "CLAIM_REQUESTED",
          label: "Refund Claim Requested",
          icon: "receipt-outline",
        },
        order?.refundStatus === "REJECTED"
          ? {
              key: "CLAIM_REJECTED",
              label: "Refund Declined",
              icon: "close-circle-outline",
              isError: true,
            }
          : {
              key: "CLAIM_REVIEW",
              label: "Store Verification & Payout",
              icon: "shield-checkmark-outline",
            },
        {
          key: "CLAIM_RESOLVED",
          label: "Refund Credited to Account",
          icon: "wallet-outline",
        }
      );
    }

    return steps;
  }, [hasClaim, isReplacementClaim, isReturnClaim, order?.refundStatus]);

  // Calculate current step index (handles regular delivery steps and post-delivery claim stages)
  const activeStepIndex = useMemo(() => {
    if (hasClaim) {
      switch (order?.refundStatus) {
        case "REQUESTED":
          return 6; // Step 6 (Requested) done, currently at step 7 (Store Review)
        case "APPROVED":
          return 7; // Step 7 (Approved) done, currently at step 8 (Final fulfillment)
        case "REFUNDED":
        case "REPLACED":
        case "PARTIAL_REFUNDED":
          return 8; // All completed
        case "REJECTED":
          return 7; // Rejection step
        default:
          return 6;
      }
    }

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
  }, [currentStatus, hasClaim, order?.refundStatus]);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [claimType, setClaimType] = useState<
    "RETURN" | "DEFECTIVE" | "REPLACEMENT" | "WRONG_ITEM"
  >("RETURN");
  const [refundReason, setRefundReason] = useState("");
  const [refundDescription, setRefundDescription] = useState("");
  const [payoutUpi, setPayoutUpi] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

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

  const handleCancelOrderSubmit = async () => {
    if (!order?._id) return;
    setCancelling(true);
    try {
      await cancelOrderApi(order._id, cancelReason || "Cancelled by customer");
      Alert.alert(
        "Order Cancelled",
        "Your order has been cancelled successfully.",
      );
      setCancelModalVisible(false);
      setCancelReason("");
      dispatch(fetchCustomerOrderById(order._id));
    } catch (err: any) {
      console.log("Cancelllation Failed:", err);

      Alert.alert(
        "Cancellation Failed",
        err?.response?.data?.message ||
          err.message ||
          "Failed to cancel order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitRefundClaim = async () => {
    if (!order?._id) return;
    if (!refundReason.trim()) {
      Alert.alert("Missing Reason", "Please provide a reason for your claim.");
      return;
    }
    setSubmittingRefund(true);
    try {
      await requestRefundApi({
        orderId: order._id,
        claimType,
        reason: refundReason.trim(),
        description: refundDescription.trim(),
        customerPayoutDetails: {
          method: payoutUpi ? "UPI" : "ORIGINAL_PAYMENT",
          upiId: payoutUpi.trim(),
        },
      });
      Alert.alert(
        "Request Submitted",
        `${claimType === "REPLACEMENT" ? "Replacement" : "Refund/Return"} request submitted successfully. Our team will verify and resolve it shortly.`,
      );
      setRefundModalVisible(false);
      setRefundReason("");
      setRefundDescription("");
      dispatch(fetchCustomerOrderById(order._id));
    } catch (err: any) {
      Alert.alert(
        "Submission Failed",
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit request.",
      );
    } finally {
      setSubmittingRefund(false);
    }
  };

  const displayedOrderNumber =
    order?.orderNumber || params.orderNumber || "BM-ORDER";

  return (
    <View style={[styles.root, isDark && { backgroundColor: "#080D0F" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* 1. Header with SafeAreaView for full top status bar coverage */}
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.safeAreaHeader,
          isDark && { backgroundColor: "#080D0F" },
        ]}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/customerMain/home" as any)
            }
            style={styles.backButton}
          >
            <Feather
              name="arrow-left"
              size={scale(22)}
              color={isDark ? "#F8FAFC" : "#1E293B"}
            />
          </TouchableOpacity>
          <Text style={[styles.navTitle, isDark && { color: "#F8FAFC" }]}>
            Live Order Tracking
          </Text>
          <View style={{ width: scale(36) }} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.screenTitle, isDark && { color: "#F8FAFC" }]}>
            Order Details
          </Text>
          <Text
            style={[styles.arrivingSubtext, isDark && { color: "#38BDF8" }]}
          >
            {isRejected
              ? "Order was cancelled"
              : hasClaim
                ? order?.refundStatus === "REQUESTED"
                  ? isReplacementClaim
                    ? "Replacement request under review"
                    : "Return / Refund request under review"
                  : order?.refundStatus === "APPROVED"
                    ? isReplacementClaim
                      ? "Replacement approved by store"
                      : "Claim approved & processing payout"
                    : order?.refundStatus === "REFUNDED" ||
                        order?.refundStatus === "PARTIAL_REFUNDED"
                      ? "Refund credited successfully"
                      : order?.refundStatus === "REPLACED"
                        ? "Replacement order dispatched"
                        : order?.refundStatus === "REJECTED"
                          ? "Claim declined by store"
                          : "Delivered successfully"
                : currentStatus === "DELIVERED"
                  ? "Delivered successfully"
                  : "Arriving in 15-25 mins"}
          </Text>
        </View>

        {/* Items in this order heading */}
        <View style={styles.itemsHeader}>
          <Text
            style={[styles.itemsHeaderText, isDark && { color: "#94A3B8" }]}
          >
            {order?.items?.length || 0} items in this order
          </Text>
        </View>
        <View
          style={[
            styles.headerDivider,
            isDark && { backgroundColor: "#1E252E" },
          ]}
        />
      </SafeAreaView>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Live Real-Time Status Card ─────────────────────────────── */}
        <View
          style={[
            styles.statusCard,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          <View style={styles.statusCardHeader}>
            <View
              style={[
                styles.pulseDot,
                hasClaim &&
                  (order?.refundStatus === "REFUNDED" ||
                  order?.refundStatus === "REPLACED"
                    ? { backgroundColor: "#10B981" }
                    : order?.refundStatus === "REJECTED"
                      ? { backgroundColor: "#EF4444" }
                      : { backgroundColor: "#F59E0B" }),
              ]}
            />
            <Text
              style={[styles.statusCardTitle, isDark && { color: "#F8FAFC" }]}
            >
              {isRejected
                ? "Order Cancelled"
                : hasClaim
                  ? order?.refundStatus === "REQUESTED"
                    ? `Current Status: ${
                        isReplacementClaim
                          ? "Replacement Requested"
                          : "Return / Refund Requested"
                      } (Under Review)`
                    : order?.refundStatus === "APPROVED"
                      ? `Current Status: ${
                          isReplacementClaim
                            ? "Replacement Approved"
                            : "Claim Approved"
                        } (Processing)`
                      : order?.refundStatus === "REFUNDED" ||
                          order?.refundStatus === "PARTIAL_REFUNDED"
                        ? `Current Status: Refund Completed (Rs.${order?.refundDetails?.amount || order?.totalAmount})`
                        : order?.refundStatus === "REPLACED"
                          ? "Current Status: Replacement Delivered"
                          : order?.refundStatus === "REJECTED"
                            ? "Current Status: Claim Declined by Store"
                            : "Current Status: Delivered Successfully"
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
              {dynamicSteps.map((step, idx) => {
                const isStepError = Boolean(step.isError);
                const isCompleted = idx <= activeStepIndex && !isStepError;
                const isCurrent = idx === activeStepIndex;

                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepCircle,
                          isDark &&
                            !isCompleted &&
                            !isCurrent && {
                              backgroundColor: "#1E252E",
                            },
                          isCompleted && styles.stepCircleCompleted,
                          isStepError && {
                            backgroundColor: "#DC2626",
                            borderColor: "#EF4444",
                          },
                          isCurrent &&
                            !isStepError &&
                            (isDark
                              ? {
                                  backgroundColor: "#00687A",
                                  borderWidth: 2,
                                  borderColor: "#38BDF8",
                                }
                              : styles.stepCircleCurrent),
                        ]}
                      >
                        <Ionicons
                          name={isStepError ? "close" : step.icon}
                          size={scale(13)}
                          color={
                            isCompleted || isStepError
                              ? "#FFFFFF"
                              : isDark
                                ? "#64748B"
                                : "#94A3B8"
                          }
                        />
                      </View>
                      {idx < dynamicSteps.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            isDark &&
                              !isCompleted && {
                                backgroundColor: "#1E252E",
                              },
                            isCompleted && styles.stepLineCompleted,
                            isStepError && {
                              backgroundColor: "#EF4444",
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isDark && !isCompleted && { color: "#64748B" },
                          isCompleted && [
                            styles.stepLabelCompleted,
                            isDark && { color: "#F8FAFC" },
                          ],
                          isStepError && {
                            color: "#EF4444",
                            fontWeight: "700",
                          },
                          isCurrent &&
                            !isStepError && [
                              styles.stepLabelCurrent,
                              isDark && { color: "#38BDF8" },
                            ],
                        ]}
                      >
                        {step.label}
                      </Text>
                      {/* Sub-label explaining each post-delivery claim step */}
                      {idx >= 6 && (
                        <Text
                          style={{
                            fontSize: moderateScale(11),
                            color: isDark ? "#94A3B8" : "#64748B",
                            marginTop: scale(2),
                          }}
                        >
                          {idx === 6
                            ? order?.refundDetails?.reason
                              ? `Reason: ${order.refundDetails.reason}`
                              : "Request registered"
                            : idx === 7
                              ? isStepError
                                ? order?.refundDetails?.rejectionReason ||
                                  "Declined by store team"
                                : order?.refundStatus === "REQUESTED"
                                  ? "Store team is reviewing request"
                                  : "Approved by store team"
                              : order?.refundStatus === "REFUNDED" ||
                                  order?.refundStatus === "PARTIAL_REFUNDED"
                                ? `NPR ${order?.refundDetails?.amount || order?.totalAmount} processed`
                                : order?.refundStatus === "REPLACED"
                                  ? "Replacement delivered"
                                  : "Awaiting final settlement"}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Post-Delivery Claim Resolution Details Card ──────────────────── */}
        {hasClaim ? (
          <View
            style={[
              styles.claimCard,
              {
                backgroundColor: isDark ? "#161D24" : "#FFFFFF",
                borderColor:
                  order?.refundStatus === "REFUNDED" ||
                  order?.refundStatus === "REPLACED"
                    ? isDark
                      ? "#065F46"
                      : "#A7F3D0"
                    : order?.refundStatus === "REJECTED"
                      ? isDark
                        ? "#7F1D1D"
                        : "#FECACA"
                      : isDark
                        ? "#78350F"
                        : "#FDE68A",
              },
            ]}
          >
            {/* Header with Type & Status Badges */}
            <View style={styles.claimCardHeader}>
              <View style={styles.claimBadgeRow}>
                <View
                  style={[
                    styles.claimTypeBadge,
                    {
                      backgroundColor: isReplacementClaim
                        ? isDark
                          ? "rgba(56, 189, 248, 0.2)"
                          : "#E0F2FE"
                        : isDark
                          ? "rgba(245, 158, 11, 0.2)"
                          : "#FEF3C7",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.claimTypeBadgeText,
                      {
                        color: isReplacementClaim
                          ? isDark
                            ? "#38BDF8"
                            : "#0284C7"
                          : isDark
                            ? "#FBBF24"
                            : "#D97706",
                      },
                    ]}
                  >
                    {isReplacementClaim
                      ? "🔄 Replacement Demand"
                      : isReturnClaim
                        ? "↩️ Return & Refund Demand"
                        : "💰 Refund Demand"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.claimStatusPill,
                  {
                    backgroundColor:
                      order?.refundStatus === "REFUNDED" ||
                      order?.refundStatus === "REPLACED"
                        ? isDark
                          ? "#064E3B"
                          : "#D1FAE5"
                        : order?.refundStatus === "APPROVED"
                          ? isDark
                            ? "#1E3A8A"
                            : "#DBEAFE"
                          : order?.refundStatus === "REJECTED"
                            ? isDark
                              ? "#7F1D1D"
                              : "#FEE2E2"
                            : isDark
                              ? "#78350F"
                              : "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.claimStatusPillText,
                    {
                      color:
                        order?.refundStatus === "REFUNDED" ||
                        order?.refundStatus === "REPLACED"
                          ? isDark
                            ? "#34D399"
                            : "#059669"
                          : order?.refundStatus === "APPROVED"
                            ? isDark
                              ? "#60A5FA"
                              : "#1D4ED8"
                            : order?.refundStatus === "REJECTED"
                              ? isDark
                                ? "#F87171"
                                : "#DC2626"
                              : isDark
                                ? "#FBBF24"
                                : "#D97706",
                    },
                  ]}
                >
                  {order?.refundStatus === "REFUNDED"
                    ? "REFUND CREDITED"
                    : order?.refundStatus === "REPLACED"
                      ? "REPLACED"
                      : order?.refundStatus === "APPROVED"
                        ? "APPROVED"
                        : order?.refundStatus === "REJECTED"
                          ? "DECLINED"
                          : "UNDER REVIEW"}
                </Text>
              </View>
            </View>

            {/* 3-Stage Progress Bar */}
            <View
              style={[
                styles.claimStageRow,
                { borderColor: isDark ? "#263238" : "#F1F5F9" },
              ]}
            >
              {/* Stage 1: Submitted */}
              <View style={styles.claimStageItem}>
                <View
                  style={[
                    styles.claimStageDot,
                    { backgroundColor: isDark ? "#065F46" : "#10B981" },
                  ]}
                >
                  <Ionicons name="checkmark" size={scale(11)} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.claimStageLabel,
                    { color: isDark ? "#34D399" : "#059669" },
                  ]}
                >
                  1. Requested
                </Text>
              </View>

              <View
                style={[
                  styles.claimStageLine,
                  {
                    backgroundColor:
                      order?.refundStatus !== "REQUESTED"
                        ? order?.refundStatus === "REJECTED"
                          ? "#DC2626"
                          : isDark
                            ? "#065F46"
                            : "#10B981"
                        : isDark
                          ? "#303B45"
                          : "#E2E8F0",
                  },
                ]}
              />

              {/* Stage 2: Store Review */}
              <View style={styles.claimStageItem}>
                <View
                  style={[
                    styles.claimStageDot,
                    {
                      backgroundColor:
                        order?.refundStatus === "REJECTED"
                          ? "#DC2626"
                          : order?.refundStatus === "REQUESTED"
                            ? isDark
                              ? "#FBBF24"
                              : "#D97706"
                            : isDark
                              ? "#065F46"
                              : "#10B981",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      order?.refundStatus === "REJECTED"
                        ? "close"
                        : order?.refundStatus === "REQUESTED"
                          ? "ellipsis-horizontal"
                          : "checkmark"
                    }
                    size={scale(11)}
                    color="#FFFFFF"
                  />
                </View>
                <Text
                  style={[
                    styles.claimStageLabel,
                    {
                      color:
                        order?.refundStatus === "REJECTED"
                          ? "#DC2626"
                          : order?.refundStatus === "REQUESTED"
                            ? isDark
                              ? "#FBBF24"
                              : "#D97706"
                            : isDark
                              ? "#34D399"
                              : "#059669",
                    },
                  ]}
                >
                  2. Store Review
                </Text>
              </View>

              <View
                style={[
                  styles.claimStageLine,
                  {
                    backgroundColor:
                      order?.refundStatus === "REFUNDED" ||
                      order?.refundStatus === "REPLACED"
                        ? isDark
                          ? "#065F46"
                          : "#10B981"
                        : isDark
                          ? "#303B45"
                          : "#E2E8F0",
                  },
                ]}
              />

              {/* Stage 3: Resolved */}
              <View style={styles.claimStageItem}>
                <View
                  style={[
                    styles.claimStageDot,
                    {
                      backgroundColor:
                        order?.refundStatus === "REFUNDED" ||
                        order?.refundStatus === "REPLACED"
                          ? isDark
                            ? "#065F46"
                            : "#10B981"
                          : isDark
                            ? "#1E252E"
                            : "#E2E8F0",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      order?.refundStatus === "REFUNDED" ||
                      order?.refundStatus === "REPLACED"
                        ? "checkmark-done"
                        : "hourglass-outline"
                    }
                    size={scale(11)}
                    color={
                      order?.refundStatus === "REFUNDED" ||
                      order?.refundStatus === "REPLACED"
                        ? "#FFFFFF"
                        : isDark
                          ? "#64748B"
                          : "#94A3B8"
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.claimStageLabel,
                    {
                      color:
                        order?.refundStatus === "REFUNDED" ||
                        order?.refundStatus === "REPLACED"
                          ? isDark
                            ? "#34D399"
                            : "#059669"
                          : isDark
                            ? "#64748B"
                            : "#94A3B8",
                    },
                  ]}
                >
                  {isReplacementClaim ? "3. Replaced" : "3. Credited"}
                </Text>
              </View>
            </View>

            {/* Informative Description */}
            <Text
              style={{
                fontSize: moderateScale(12),
                color: isDark ? "#94A3B8" : "#64748B",
                marginBottom: scale(10),
                lineHeight: scale(17),
              }}
            >
              {order?.refundStatus === "REFUNDED"
                ? `Your refund of NPR ${order?.refundDetails?.amount || order?.totalAmount} has been processed to your payment method.`
                : order?.refundStatus === "REPLACED"
                  ? "Your free replacement items have been confirmed and dispatched by the store."
                  : order?.refundStatus === "APPROVED"
                    ? "Store has accepted your request. Replacement / refund settlement is in final processing."
                    : order?.refundStatus === "REJECTED"
                      ? "Your post-delivery request was reviewed and declined by the store team."
                      : "Your request has been submitted to the store team. They will inspect the claim and update within 24 hours."}
            </Text>

            {/* Claim Key Details Table */}
            <View style={styles.claimInfoGrid}>
              <View style={styles.claimInfoRow}>
                <Text style={styles.claimInfoLabel}>Customer Demand</Text>
                <Text
                  style={[
                    styles.claimInfoValue,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  {isReplacementClaim
                    ? "Replacement with new product"
                    : isReturnClaim
                      ? "Product Return & Full Refund"
                      : "Payment Refund"}
                </Text>
              </View>

              {order?.refundDetails?.reason ? (
                <View style={styles.claimInfoRow}>
                  <Text style={styles.claimInfoLabel}>Reason</Text>
                  <Text
                    style={[
                      styles.claimInfoValue,
                      isDark && { color: "#F8FAFC" },
                    ]}
                  >
                    {order.refundDetails.reason}
                  </Text>
                </View>
              ) : null}

              {order?.refundDetails?.description ? (
                <View style={styles.claimInfoRow}>
                  <Text style={styles.claimInfoLabel}>Details</Text>
                  <Text
                    style={[
                      styles.claimInfoValue,
                      isDark && { color: "#F8FAFC" },
                    ]}
                  >
                    {order.refundDetails.description}
                  </Text>
                </View>
              ) : null}

              {order?.refundDetails?.rejectionReason ? (
                <View style={styles.claimInfoRow}>
                  <Text style={[styles.claimInfoLabel, { color: "#EF4444" }]}>
                    Decline Reason
                  </Text>
                  <Text
                    style={[
                      styles.claimInfoValue,
                      { color: "#EF4444", fontWeight: "700" },
                    ]}
                  >
                    {order.refundDetails.rejectionReason}
                  </Text>
                </View>
              ) : null}

              {order?.refundDetails?.adminNotes ? (
                <View style={styles.claimInfoRow}>
                  <Text style={styles.claimInfoLabel}>Store Note</Text>
                  <Text
                    style={[
                      styles.claimInfoValue,
                      isDark && { color: "#38BDF8" },
                    ]}
                  >
                    {order.refundDetails.adminNotes}
                  </Text>
                </View>
              ) : null}

              {order?.refundDetails?.customerPayoutDetails?.upiId ? (
                <View style={styles.claimInfoRow}>
                  <Text style={styles.claimInfoLabel}>Payout Destination</Text>
                  <Text
                    style={[
                      styles.claimInfoValue,
                      isDark && { color: "#F8FAFC" },
                    ]}
                  >
                    UPI: {order.refundDetails.customerPayoutDetails.upiId}
                  </Text>
                </View>
              ) : null}

              {order?.refundDetails?.refundNumber ? (
                <View style={styles.claimInfoRow}>
                  <Text style={styles.claimInfoLabel}>Claim ID</Text>
                  <Text
                    style={[
                      styles.claimInfoValue,
                      { fontFamily: "monospace", fontSize: moderateScale(11) },
                      isDark && { color: "#F8FAFC" },
                    ]}
                  >
                    {order.refundDetails.refundNumber}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Customer Delivery Verification OTP Card ──────────────────── */}
        {order?.customerDeliveryOtp && currentStatus !== "DELIVERED" ? (
          <View
            style={[
              styles.otpCard,
              isDark && {
                backgroundColor: "#151D24",
                borderColor: "#303B45",
              },
            ]}
          >
            <View style={styles.otpHeaderRow}>
              <View
                style={[
                  styles.otpIconBox,
                  isDark && { backgroundColor: "#1E2E38" },
                ]}
              >
                <Feather
                  name="shield"
                  size={scale(18)}
                  color={isDark ? "#2DD4BF" : "#0F766E"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text
                  style={[styles.otpCardTitle, isDark && { color: "#2DD4BF" }]}
                >
                  Delivery Verification OTP
                </Text>
                <Text
                  style={[styles.otpCardSub, isDark && { color: "#94A3B8" }]}
                >
                  Share this code with your delivery partner at the doorstep
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.otpCodeContainer,
                isDark && {
                  backgroundColor: "#1B252E",
                  borderColor: "#303B45",
                },
              ]}
            >
              <Text
                style={[styles.otpCodeText, isDark && { color: "#2DD4BF" }]}
              >
                {order.customerDeliveryOtp}
              </Text>
            </View>
            <Text
              style={[styles.otpSafetyHint, isDark && { color: "#94A3B8" }]}
            >
              🔒 Do not share this OTP before receiving and checking your
              package.
            </Text>
          </View>
        ) : null}

        {/* ── Assigned Delivery Partner Card ───────────────────────────── */}
        {order?.assignedDeliveryBoy ? (
          <View
            style={[
              styles.partnerCard,
              isDark && {
                backgroundColor: "#151D24",
                borderColor: "#303B45",
              },
            ]}
          >
            <View style={styles.partnerCardTop}>
              <View
                style={[
                  styles.partnerAvatarBox,
                  isDark && { backgroundColor: "#1E2E38" },
                ]}
              >
                <MaterialCommunityIcons
                  name="moped"
                  size={scale(22)}
                  color={isDark ? "#2DD4BF" : "#0F766E"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text
                  style={[
                    styles.partnerRoleLabel,
                    isDark && { color: "#2DD4BF" },
                  ]}
                >
                  DELIVERY PARTNER ASSIGNED
                </Text>
                <Text
                  style={[styles.partnerName, isDark && { color: "#F8FAFC" }]}
                >
                  {order.assignedDeliveryBoy.fullName || "Delivery Partner"}
                </Text>
                <Text
                  style={[
                    styles.partnerVehicle,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  {order.assignedDeliveryBoy.vehicleDetails?.vehicleType ||
                    "Motorcycle"}{" "}
                  • ⭐ 5.0
                </Text>
              </View>
              {order.assignedDeliveryBoy.phone ? (
                <TouchableOpacity
                  style={[
                    styles.partnerCallBtn,
                    isDark && {
                      backgroundColor: "#1E2E38",
                      borderColor: "#303B45",
                    },
                  ]}
                  onPress={() =>
                    Linking.openURL(`tel:${order.assignedDeliveryBoy.phone}`)
                  }
                >
                  <Feather
                    name="phone"
                    size={scale(16)}
                    color={isDark ? "#2DD4BF" : "#0F766E"}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Live GPS Tracker Indicator */}
            {liveRiderLocation || currentStatus === "OUT_FOR_DELIVERY" ? (
              <View
                style={[
                  styles.liveTrackingRow,
                  isDark && {
                    backgroundColor: "rgba(34, 197, 94, 0.16)",
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  },
                ]}
              >
                <View style={styles.liveTrackingDot} />
                <Text
                  style={[
                    styles.liveTrackingText,
                    isDark && { color: "#4ADE80" },
                  ]}
                >
                  {liveRiderLocation
                    ? `Live GPS Active • (${liveRiderLocation.latitude.toFixed(4)}°N, ${liveRiderLocation.longitude.toFixed(4)}°E)`
                    : "Live GPS Active • Rider is on the way"}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Ordered Items List ─────────────────────────────────────── */}
        <View
          style={[
            styles.itemsListCard,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          {order?.items?.map((item, index) => (
            <View
              key={item.productId || index}
              style={[
                styles.itemRow,
                index < (order.items?.length || 0) - 1 && [
                  styles.itemDivider,
                  isDark && { borderBottomColor: "#1E252E" },
                ],
              ]}
            >
              {/* Thumbnail */}
              <View
                style={[
                  styles.imageBox,
                  isDark && { backgroundColor: "#1B252E" },
                ]}
              >
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
                <Text
                  style={[styles.itemName, isDark && { color: "#F8FAFC" }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={[styles.packInfo, isDark && { color: "#94A3B8" }]}>
                  Qty: {item.quantity} &middot; {item.weight || "1 unit"}
                </Text>
              </View>

              {/* Prices on Right */}
              <View style={styles.priceCol}>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <Text
                    style={[
                      styles.strikethroughPrice,
                      isDark && { color: "#64748B" },
                    ]}
                  >
                    Rs.{item.originalPrice * item.quantity}
                  </Text>
                ) : null}
                <Text
                  style={[styles.finalPrice, isDark && { color: "#39D353" }]}
                >
                  Rs.{item.price * item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Bill details Card ───────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          <Text style={[styles.cardTitle, isDark && { color: "#F8FAFC" }]}>
            Bill details
          </Text>
          <View
            style={[
              styles.cardDivider,
              isDark && { backgroundColor: "#1E252E" },
            ]}
          />

          <View style={styles.billRows}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, isDark && { color: "#94A3B8" }]}>
                Item Total
              </Text>
              <Text style={[styles.billValue, isDark && { color: "#F8FAFC" }]}>
                Rs.{order?.itemsTotal || 0}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={[styles.billLabel, isDark && { color: "#94A3B8" }]}>
                Handling charge
              </Text>
              <Text style={[styles.billValue, isDark && { color: "#F8FAFC" }]}>
                Rs.{order?.handlingCharge || 30}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={[styles.billLabel, isDark && { color: "#94A3B8" }]}>
                Delivery charge
              </Text>
              <Text style={[styles.freeValue, isDark && { color: "#39D353" }]}>
                {order?.deliveryCharge === 0
                  ? "FREE"
                  : `Rs.${order?.deliveryCharge}`}
              </Text>
            </View>

            {order?.discount ? (
              <View style={styles.billRow}>
                <Text
                  style={[styles.billLabel, isDark && { color: "#94A3B8" }]}
                >
                  Coupon discount
                </Text>
                <Text
                  style={[styles.discountValue, isDark && { color: "#39D353" }]}
                >
                  -Rs.{order.discount}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.cardDivider,
              isDark && { backgroundColor: "#1E252E" },
            ]}
          />

          {/* Bill Total */}
          <View style={styles.billTotalRow}>
            <Text
              style={[styles.billTotalLabel, isDark && { color: "#F8FAFC" }]}
            >
              Bill Total
            </Text>
            <Text
              style={[styles.billTotalValue, isDark && { color: "#39D353" }]}
            >
              Rs.{order?.totalAmount || 0}
            </Text>
          </View>
        </View>

        {/* ── Order Details Card ─────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          <Text style={[styles.cardTitle, isDark && { color: "#F8FAFC" }]}>
            Order Details
          </Text>
          <View
            style={[
              styles.cardDivider,
              isDark && { backgroundColor: "#1E252E" },
            ]}
          />

          <View style={styles.orderDetailsList}>
            {/* Store Info */}
            <View style={styles.orderDetailItem}>
              <Text
                style={[styles.detailLabel, isDark && { color: "#94A3B8" }]}
              >
                Store / Vendor
              </Text>
              <Text
                style={[styles.detailValueBold, isDark && { color: "#F8FAFC" }]}
              >
                {order?.vendor?.businessDetails?.businessName ||
                  order?.vendor?.sellerDetails?.sellerName ||
                  "BhansaMart Partner Store"}
              </Text>
            </View>

            {/* Order id */}
            <View style={styles.orderDetailItem}>
              <Text
                style={[styles.detailLabel, isDark && { color: "#94A3B8" }]}
              >
                Order ID
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCopyOrderId}
                style={styles.orderIdRow}
              >
                <Text
                  style={[
                    styles.detailValueBold,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  {displayedOrderNumber}
                </Text>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={scale(16)}
                  color={
                    copied
                      ? isDark
                        ? "#39D353"
                        : "#059669"
                      : isDark
                        ? "#94A3B8"
                        : "#475569"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Payment */}
            <View style={styles.orderDetailItem}>
              <Text
                style={[styles.detailLabel, isDark && { color: "#94A3B8" }]}
              >
                Payment Method
              </Text>
              <Text
                style={[styles.detailValue, isDark && { color: "#F8FAFC" }]}
              >
                {order?.paymentMethod || "Cash on delivery"} &middot;{" "}
                <Text
                  style={{
                    color:
                      order?.paymentStatus === "paid"
                        ? isDark
                          ? "#39D353"
                          : "#059669"
                        : "#D97706",
                    fontWeight: "700",
                  }}
                >
                  {order?.paymentStatus === "paid" ? "PAID" : "PENDING"}
                </Text>
              </Text>
            </View>

            {/* Deliver to */}
            <View style={styles.orderDetailItem}>
              <Text
                style={[styles.detailLabel, isDark && { color: "#94A3B8" }]}
              >
                Deliver to
              </Text>
              <Text
                style={[styles.detailValue, isDark && { color: "#F8FAFC" }]}
              >
                {order?.deliveryAddress?.addressLine ||
                  "Baneshwor, Kathmandu, Bagmati, Nepal"}
              </Text>
              <Text
                style={[styles.detailPhone, isDark && { color: "#94A3B8" }]}
              >
                Contact: {order?.deliveryAddress?.phone || "N/A"}
              </Text>
            </View>

            {/* Order placed timestamp */}
            <View style={styles.orderDetailItem}>
              <Text
                style={[styles.detailLabel, isDark && { color: "#94A3B8" }]}
              >
                Placed At
              </Text>
              <Text
                style={[styles.detailValue, isDark && { color: "#F8FAFC" }]}
              >
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
        <View
          style={[
            styles.card,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          <Text style={[styles.cardTitle, isDark && { color: "#F8FAFC" }]}>
            Need help with your order?
          </Text>
          <View
            style={[
              styles.cardDivider,
              isDark && { backgroundColor: "#1E252E" },
            ]}
          />

          <TouchableOpacity activeOpacity={0.7} onPress={handleCallSupport}>
            <Text style={[styles.supportText, isDark && { color: "#94A3B8" }]}>
              For instant customer support, call us at:{" "}
              <Text
                style={[
                  styles.supportPhoneBold,
                  isDark && { color: "#38BDF8" },
                ]}
              >
                015585858
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Order Action Buttons (Cancel / Return / Replacement) ────── */}
        <View
          style={{
            marginHorizontal: scale(16),
            marginVertical: moderateScale(16),
            gap: scale(10),
          }}
        >
          {["PLACED", "ACCEPTED"].includes(currentStatus) && (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { borderColor: "#EF4444" }]}
              onPress={() => setCancelModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="x-circle" size={scale(16)} color="#EF4444" />
              <Text style={[styles.actionBtnOutlineText, { color: "#EF4444" }]}>
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}

          {currentStatus === "DELIVERED" &&
            (!order?.refundStatus ||
              order?.refundStatus === "NONE" ||
              order?.refundStatus === "NOT_APPLICABLE") && (
              <TouchableOpacity
                style={[
                  styles.actionBtnOutline,
                  { borderColor: isDark ? "#38BDF8" : "#0284C7" },
                ]}
                onPress={() => setRefundModalVisible(true)}
                activeOpacity={0.8}
              >
                <Feather
                  name="rotate-ccw"
                  size={scale(16)}
                  color={isDark ? "#38BDF8" : "#0284C7"}
                />
                <Text
                  style={[
                    styles.actionBtnOutlineText,
                    { color: isDark ? "#38BDF8" : "#0284C7" },
                  ]}
                >
                  Request Return, Refund or Replacement
                </Text>
              </TouchableOpacity>
            )}
        </View>

        {/* ── Cancel Order Modal ─────────────────────────────────────── */}
        <Modal
          visible={cancelModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                isDark && {
                  backgroundColor: "#151D24",
                  borderColor: "#303B45",
                },
              ]}
            >
              <Text style={[styles.modalTitle, isDark && { color: "#F8FAFC" }]}>
                Cancel Order
              </Text>
              <Text style={[styles.modalSub, isDark && { color: "#94A3B8" }]}>
                Are you sure you want to cancel Order #{displayedOrderNumber}?
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  isDark && {
                    backgroundColor: "#1B252E",
                    borderColor: "#303B45",
                    color: "#F8FAFC",
                  },
                ]}
                placeholder="Reason for cancellation (optional)"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={cancelReason}
                onChangeText={setCancelReason}
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: isDark ? "#303B45" : "#E2E8F0" },
                  ]}
                  onPress={() => setCancelModalVisible(false)}
                >
                  <Text
                    style={[
                      styles.modalBtnText,
                      { color: isDark ? "#F8FAFC" : "#475569" },
                    ]}
                  >
                    Keep Order
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
                  onPress={handleCancelOrderSubmit}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>
                      Confirm Cancel
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Return / Refund / Replacement Modal ───────────────────── */}
        <Modal
          visible={refundModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRefundModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                isDark && {
                  backgroundColor: "#151D24",
                  borderColor: "#303B45",
                },
              ]}
            >
              <Text style={[styles.modalTitle, isDark && { color: "#F8FAFC" }]}>
                Return, Refund or Replace
              </Text>

              {/* Claim Type Selector */}
              <View
                style={{
                  flexDirection: "row",
                  gap: scale(6),
                  marginVertical: scale(10),
                  flexWrap: "wrap",
                }}
              >
                {(
                  [
                    { id: "RETURN", label: "Return & Refund" },
                    { id: "DEFECTIVE", label: "Defective" },
                    { id: "REPLACEMENT", label: "Replacement" },
                    { id: "WRONG_ITEM", label: "Wrong Item" },
                  ] as const
                ).map((ct) => (
                  <TouchableOpacity
                    key={ct.id}
                    style={[
                      styles.claimTypeChip,
                      claimType === ct.id && styles.claimTypeChipActive,
                      isDark &&
                        claimType !== ct.id && {
                          backgroundColor: "#1B252E",
                          borderColor: "#303B45",
                        },
                    ]}
                    onPress={() => setClaimType(ct.id)}
                  >
                    <Text
                      style={[
                        styles.claimTypeChipText,
                        claimType === ct.id && styles.claimTypeChipTextActive,
                        isDark && claimType !== ct.id && { color: "#94A3B8" },
                      ]}
                    >
                      {ct.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.modalInput,
                  isDark && {
                    backgroundColor: "#1B252E",
                    borderColor: "#303B45",
                    color: "#F8FAFC",
                  },
                ]}
                placeholder="Reason (e.g. Expired, Damaged, Quality)"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={refundReason}
                onChangeText={setRefundReason}
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { height: scale(60) },
                  isDark && {
                    backgroundColor: "#1B252E",
                    borderColor: "#303B45",
                    color: "#F8FAFC",
                  },
                ]}
                placeholder="Description / details (optional)"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                multiline
                value={refundDescription}
                onChangeText={setRefundDescription}
              />

              {claimType !== "REPLACEMENT" && (
                <TextInput
                  style={[
                    styles.modalInput,
                    isDark && {
                      backgroundColor: "#1B252E",
                      borderColor: "#303B45",
                      color: "#F8FAFC",
                    },
                  ]}
                  placeholder="Payout UPI ID (e.g. yourname@esewa)"
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                  value={payoutUpi}
                  onChangeText={setPayoutUpi}
                />
              )}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: isDark ? "#303B45" : "#E2E8F0" },
                  ]}
                  onPress={() => setRefundModalVisible(false)}
                >
                  <Text
                    style={[
                      styles.modalBtnText,
                      { color: isDark ? "#F8FAFC" : "#475569" },
                    ]}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#0284C7" }]}
                  onPress={handleSubmitRefundClaim}
                  disabled={submittingRefund}
                >
                  {submittingRefund ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>
                      Submit Claim
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(10),
    borderWidth: 1.5,
    gap: scale(8),
  },
  actionBtnOutlineText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(18),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1E293B",
  },
  modalSub: {
    fontSize: moderateScale(13),
    color: "#64748B",
    marginTop: scale(4),
    marginBottom: scale(10),
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(13),
    color: "#1E293B",
    marginTop: scale(8),
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(16),
  },
  modalBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
  },
  modalBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  claimTypeChip: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  claimTypeChipActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#0284C7",
  },
  claimTypeChipText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "600",
  },
  claimTypeChipTextActive: {
    color: "#0369A1",
    fontWeight: "700",
  },
  claimCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(14),
    marginBottom: moderateScale(14),
  },
  claimCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  claimBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  claimTypeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  claimTypeBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  claimStatusPill: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  claimStatusPillText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  claimStageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(6),
    marginBottom: scale(12),
    paddingVertical: scale(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  claimStageItem: {
    alignItems: "center",
    flex: 1,
  },
  claimStageDot: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(4),
  },
  claimStageLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    textAlign: "center",
  },
  claimStageLine: {
    height: 2,
    flex: 0.6,
    marginBottom: scale(14),
  },
  claimInfoGrid: {
    gap: scale(8),
  },
  claimInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  claimInfoLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    width: "35%",
  },
  claimInfoValue: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    textAlign: "right",
  },
});
