import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/store/services/socketService";
import {
  acceptOfferedOrder,
  clearIncomingOffer,
  fetchActiveAssignment,
  fetchDeliveryProfile,
  markOrderArrivedCustomer,
  markOrderArrivedStore,
  rejectOfferedOrder,
  togglePartnerAvailability,
  verifyOrderDeliveryOtp,
  verifyOrderPickupOtp,
} from "@/store/slices/deliverySlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    partner,
    availability,
    canGoOnline,
    documentsVerified,
    securityDeposit,
    activeOrder,
    offeredAssignment,
    actionLoading,
  } = useAppSelector((state) => state.delivery);

  // OTP inputs
  const [pickupOtpInput, setPickupOtpInput] = useState("");
  const [deliveryOtpInput, setDeliveryOtpInput] = useState("");

  // Countdown timer for incoming offer
  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    dispatch(fetchDeliveryProfile());
    dispatch(fetchActiveAssignment());
  }, [dispatch]);

  // Handle offer countdown timer
  useEffect(() => {
    if (offeredAssignment) {
      setTimeLeft(offeredAssignment.timeoutSeconds || 45);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            dispatch(clearIncomingOffer());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [offeredAssignment, dispatch]);

  // Periodic GPS Location Beacon when Online
  useEffect(() => {
    if (availability === "ONLINE" || availability === "BUSY") {
      const gpsInterval = setInterval(() => {
        // Emit coordinates (Kathmandu central with subtle jitter for simulation)
        const lat = 27.7172 + (Math.random() - 0.5) * 0.005;
        const lng = 85.324 + (Math.random() - 0.5) * 0.005;
        socketService.emitDeliveryLocation(lat, lng, 0, 20);
      }, 10000);

      return () => clearInterval(gpsInterval);
    }
  }, [availability]);

  // Availability Toggle
  const handleToggleAvailability = async () => {
    const nextStatus = availability === "ONLINE" ? "OFFLINE" : "ONLINE";

    if (nextStatus === "ONLINE") {
      if (partner?.approvalStatus !== "APPROVED") {
        Alert.alert(
          "Approval Required",
          `Your partner profile is currently '${partner?.approvalStatus || "PENDING_APPROVAL"}'. Admin must review and approve your account before you can go online.`
        );
        return;
      }
      if (securityDeposit.status !== "PAID") {
        Alert.alert(
          "Security Deposit Required",
          "You must pay the mandatory ₹1,000 security deposit before you can go online to receive orders.",
          [
            {
              text: "Go to Earnings & Deposit",
              onPress: () => router.push("/DeliveryMain/wallet" as any),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }
      if (!documentsVerified) {
        Alert.alert(
          "Documents Pending",
          "All 4 documents (PAN, Aadhaar, License, RC) must be verified before going online.",
          [
            {
              text: "View KYC Documents",
              onPress: () => router.push("/DeliveryMain/profile" as any),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }
    }

    try {
      await dispatch(togglePartnerAvailability(nextStatus)).unwrap();
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update availability.");
    }
  };

  // Accept Offer
  const handleAcceptOffer = async () => {
    if (!offeredAssignment) return;
    try {
      await dispatch(acceptOfferedOrder(offeredAssignment.assignmentId)).unwrap();
      dispatch(fetchActiveAssignment());
    } catch (err: any) {
      Alert.alert("Offer Expired", err || "This order offer has expired or was assigned to another partner.");
    }
  };

  // Reject Offer
  const handleRejectOffer = async () => {
    if (!offeredAssignment) return;
    try {
      await dispatch(
        rejectOfferedOrder({
          assignmentId: offeredAssignment.assignmentId,
          reason: "Delivery partner declined",
        })
      );
    } catch (err) {
      dispatch(clearIncomingOffer());
    }
  };

  // Store Arrival
  const handleArriveAtStore = async () => {
    if (!activeOrder) return;
    try {
      await dispatch(markOrderArrivedStore(activeOrder._id)).unwrap();
      dispatch(fetchActiveAssignment());
      Alert.alert("Arrived at Store", "Ask the vendor staff for the 4-digit Pickup OTP.");
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update store arrival.");
    }
  };

  // Verify Pickup OTP
  const handleVerifyPickupOtp = async () => {
    if (!pickupOtpInput.trim() || !activeOrder) {
      Alert.alert("Required", "Please enter the Pickup OTP given by the vendor.");
      return;
    }
    try {
      await dispatch(
        verifyOrderPickupOtp({ orderId: activeOrder._id, otp: pickupOtpInput.trim() })
      ).unwrap();
      setPickupOtpInput("");
      dispatch(fetchActiveAssignment());
      Alert.alert("Pickup Confirmed!", "Order package received. You are now out for delivery.");
    } catch (err: any) {
      Alert.alert("Verification Failed", err || "Invalid Pickup OTP. Check with the vendor.");
    }
  };

  // Customer Arrival
  const handleArriveAtCustomer = async () => {
    if (!activeOrder) return;
    try {
      await dispatch(markOrderArrivedCustomer(activeOrder._id)).unwrap();
      dispatch(fetchActiveAssignment());
      Alert.alert("Arrived at Customer", "Ask the customer for their 4-digit Delivery OTP.");
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update customer arrival.");
    }
  };

  // Verify Customer Delivery OTP
  const handleVerifyDeliveryOtp = async () => {
    if (!deliveryOtpInput.trim() || !activeOrder) {
      Alert.alert("Required", "Please enter the Delivery OTP provided by the customer.");
      return;
    }
    try {
      const res = await dispatch(
        verifyOrderDeliveryOtp({ orderId: activeOrder._id, otp: deliveryOtpInput.trim() })
      ).unwrap();
      setDeliveryOtpInput("");
      dispatch(fetchActiveAssignment());
      Alert.alert(
        "Order Delivered!",
        `Congratulations! Delivery completed successfully.\nEarnings credited: ₹${res.earnings?.totalEarnings || 60}`
      );
    } catch (err: any) {
      Alert.alert("Verification Failed", err || "Invalid Delivery OTP. Check with the customer.");
    }
  };

  const openNavigation = (address: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
      default: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
    });
    if (url) Linking.openURL(url);
  };

  const dialPhone = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      {/* Top Header Card */}
      <LinearGradient
        colors={["#0F766E", "#0D9488", "#115E59"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.partnerGreeting}>
              Hello, {partner?.fullName?.split(" ")[0] || "Partner"} 👋
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.vehicleBadge}>
                <MaterialCommunityIcons
                  name="moped"
                  size={scale(13)}
                  color="#CCFBF1"
                />
                <Text style={styles.vehicleBadgeText}>
                  {partner?.vehicleDetails?.vehicleType || "Motorcycle"}
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={scale(12)} color="#FBBF24" />
                <Text style={styles.ratingText}>5.0</Text>
              </View>
            </View>
          </View>

          {/* Online / Offline Switch */}
          <View style={styles.toggleWrapper}>
            <Text
              style={[
                styles.toggleStatusLabel,
                availability === "ONLINE" && styles.onlineLabel,
                availability === "BUSY" && styles.busyLabel,
              ]}
            >
              {availability}
            </Text>
            <Switch
              value={availability === "ONLINE" || availability === "BUSY"}
              onValueChange={handleToggleAvailability}
              disabled={actionLoading || availability === "BUSY"}
              trackColor={{ false: "#64748B", true: "#10B981" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Onboarding Alert Banner if not fully approved or deposit unpaid */}
        {partner?.approvalStatus !== "APPROVED" && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push("/DeliveryMain/profile" as any)}
            activeOpacity={0.85}
          >
            <Feather name="alert-circle" size={scale(20)} color="#D97706" />
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.alertBannerTitle}>Account Pending Approval</Text>
              <Text style={styles.alertBannerSub}>
                Upload all 4 documents and complete the ₹1,000 security deposit to activate your account.
              </Text>
            </View>
            <Feather name="chevron-right" size={scale(18)} color="#92400E" />
          </TouchableOpacity>
        )}

        {/* ── ACTIVE ORDER CARD ────────────────────────────────────────── */}
        {activeOrder ? (
          <View style={styles.activeOrderCard}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.activeOrderBadge}>ACTIVE DELIVERY IN PROGRESS</Text>
                <Text style={styles.orderNumberText}>Order #{activeOrder.orderNumber}</Text>
              </View>
              <View style={styles.earningsPill}>
                <Text style={styles.earningsPillText}>
                  Earn ₹{activeOrder.estimatedEarnings || 60}
                </Text>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.orderProgressRow}>
              <View
                style={[
                  styles.progressDot,
                  styles.progressDotActive,
                ]}
              >
                <Feather name="check" size={scale(12)} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.progressBar,
                  activeOrder.pickedUpAt && styles.progressBarActive,
                ]}
              />
              <View
                style={[
                  styles.progressDot,
                  activeOrder.pickedUpAt && styles.progressDotActive,
                ]}
              >
                <Feather
                  name={activeOrder.pickedUpAt ? "check" : "package"}
                  size={scale(12)}
                  color={activeOrder.pickedUpAt ? "#FFFFFF" : "#64748B"}
                />
              </View>
              <View
                style={[
                  styles.progressBar,
                  activeOrder.deliveredAt && styles.progressBarActive,
                ]}
              />
              <View style={styles.progressDot}>
                <Feather name="home" size={scale(12)} color="#64748B" />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 1: Store Pickup */}
            <View style={styles.locationSection}>
              <View style={styles.locationIconBoxStore}>
                <Feather name="shopping-bag" size={scale(18)} color="#0F766E" />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.locationTypeLabel}>PICKUP FROM STORE</Text>
                <Text style={styles.locationTitle}>{activeOrder.vendor?.name || "Grocery Store"}</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {activeOrder.vendor?.address || "Store Address"}
                </Text>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => dialPhone(activeOrder.vendor?.phone)}
                >
                  <Feather name="phone" size={scale(16)} color="#0F766E" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => openNavigation(activeOrder.vendor?.address)}
                >
                  <Feather name="navigation" size={scale(16)} color="#0F766E" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stage Actions: Pickup OTP flow */}
            {!activeOrder.pickedUpAt ? (
              <View style={styles.stageActionBox}>
                {!activeOrder.arrivedAtStoreAt ? (
                  <TouchableOpacity
                    style={styles.stagePrimaryBtn}
                    onPress={handleArriveAtStore}
                    activeOpacity={0.85}
                  >
                    <Feather name="map-pin" size={scale(16)} color="#FFFFFF" />
                    <Text style={styles.stagePrimaryBtnText}>I Have Arrived at Store</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.otpVerifyContainer}>
                    <Text style={styles.otpPromptTitle}>
                      Enter 4-Digit Pickup OTP from Vendor:
                    </Text>
                    <View style={styles.otpInputRow}>
                      <TextInput
                        style={styles.otpInput}
                        placeholder="e.g. 1234"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={pickupOtpInput}
                        onChangeText={setPickupOtpInput}
                      />
                      <TouchableOpacity
                        style={[
                          styles.otpSubmitBtn,
                          !pickupOtpInput && { opacity: 0.6 },
                        ]}
                        onPress={handleVerifyPickupOtp}
                        disabled={!pickupOtpInput || actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.otpSubmitBtnText}>Verify & Take</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.divider} />

            {/* Section 2: Customer Delivery */}
            <View style={styles.locationSection}>
              <View style={styles.locationIconBoxCustomer}>
                <Feather name="user" size={scale(18)} color="#2563EB" />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.locationTypeLabel}>DELIVER TO CUSTOMER</Text>
                <Text style={styles.locationTitle}>{activeOrder.customerName || "Customer"}</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {activeOrder.deliveryAddress?.addressLine || "Delivery Address"}
                </Text>
                <Text style={styles.paymentMethodBadge}>
                  {activeOrder.paymentMethod === "Cash on delivery"
                    ? `💵 Collect Cash: ₹${activeOrder.totalAmount}`
                    : "✅ Paid Online"}
                </Text>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => dialPhone(activeOrder.customerPhone)}
                >
                  <Feather name="phone" size={scale(16)} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() =>
                    openNavigation(activeOrder.deliveryAddress?.addressLine)
                  }
                >
                  <Feather name="navigation" size={scale(16)} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stage Actions: Customer Delivery OTP flow */}
            {activeOrder.pickedUpAt ? (
              <View style={styles.stageActionBox}>
                {!activeOrder.arrivedAtCustomerAt ? (
                  <TouchableOpacity
                    style={[styles.stagePrimaryBtn, { backgroundColor: "#2563EB" }]}
                    onPress={handleArriveAtCustomer}
                    activeOpacity={0.85}
                  >
                    <Feather name="map-pin" size={scale(16)} color="#FFFFFF" />
                    <Text style={styles.stagePrimaryBtnText}>I Have Reached Customer Door</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.otpVerifyContainer}>
                    <Text style={styles.otpPromptTitle}>
                      Enter 4-Digit Delivery OTP from Customer:
                    </Text>
                    <View style={styles.otpInputRow}>
                      <TextInput
                        style={styles.otpInput}
                        placeholder="e.g. 5678"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={deliveryOtpInput}
                        onChangeText={setDeliveryOtpInput}
                      />
                      <TouchableOpacity
                        style={[
                          styles.otpSubmitBtn,
                          { backgroundColor: "#10B981" },
                          !deliveryOtpInput && { opacity: 0.6 },
                        ]}
                        onPress={handleVerifyDeliveryOtp}
                        disabled={!deliveryOtpInput || actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.otpSubmitBtnText}>Complete</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : (
          /* Idle / Radar Card when no active orders */
          <View style={styles.idleCard}>
            <View
              style={[
                styles.radarCircle,
                availability === "ONLINE" && styles.radarCircleActive,
              ]}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={scale(48)}
                color={availability === "ONLINE" ? "#0F766E" : "#94A3B8"}
              />
            </View>
            <Text style={styles.idleTitle}>
              {availability === "ONLINE"
                ? "You Are Online & Searching"
                : "You Are Currently Offline"}
            </Text>
            <Text style={styles.idleSubtitle}>
              {availability === "ONLINE"
                ? "Incoming orders from nearby stores in Kathmandu will appear here in real-time."
                : "Turn your availability switch ON at the top right to start receiving order dispatches."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── REAL-TIME ORDER OFFER MODAL (45-second timer) ──────────── */}
      <Modal
        visible={!!offeredAssignment}
        transparent
        animationType="slide"
        onRequestClose={handleRejectOffer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.offerCard}>
            {/* Timer Header */}
            <View style={styles.offerTimerRow}>
              <View style={styles.timerBadge}>
                <Ionicons name="timer-outline" size={scale(18)} color="#EF4444" />
                <Text style={styles.timerText}>{timeLeft}s left</Text>
              </View>
              <View style={styles.earningsBanner}>
                <Text style={styles.earningsAmount}>
                  ₹{offeredAssignment?.estimatedEarnings || 60}
                </Text>
                <Text style={styles.earningsLabel}>Estimated Pay</Text>
              </View>
            </View>

            <Text style={styles.newOrderAlertTitle}>New Grocery Order Request!</Text>
            <Text style={styles.orderNumberBadge}>
              Order #{offeredAssignment?.orderNumber} • {offeredAssignment?.itemsCount || 1} Item(s)
            </Text>

            {/* Pickup */}
            <View style={styles.offerLocationRow}>
              <View style={styles.offerDotStore} />
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.offerLocationLabel}>PICKUP</Text>
                <Text style={styles.offerLocationName}>
                  {offeredAssignment?.pickup?.storeName || "Store"}
                </Text>
                <Text style={styles.offerLocationAddress} numberOfLines={1}>
                  {offeredAssignment?.pickup?.address}
                </Text>
              </View>
            </View>

            {/* Drop */}
            <View style={styles.offerLocationRow}>
              <View style={styles.offerDotCustomer} />
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.offerLocationLabel}>DELIVERY TO</Text>
                <Text style={styles.offerLocationName}>
                  {offeredAssignment?.drop?.customerName || "Customer"}
                </Text>
                <Text style={styles.offerLocationAddress} numberOfLines={1}>
                  {offeredAssignment?.drop?.address}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleRejectOffer}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAcceptOffer}
                activeOpacity={0.85}
              >
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  headerGradient: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(18),
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerGreeting: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: moderateScale(4),
  },
  vehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
    gap: scale(4),
  },
  vehicleBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#CCFBF1",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
    gap: scale(3),
  },
  ratingText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  toggleWrapper: {
    alignItems: "center",
  },
  toggleStatusLabel: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#CBD5E1",
    marginBottom: moderateScale(2),
  },
  onlineLabel: {
    color: "#6EE7B7",
  },
  busyLabel: {
    color: "#FBBF24",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: moderateScale(16),
  },
  alertBannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#92400E",
  },
  alertBannerSub: {
    fontSize: moderateScale(11),
    color: "#B45309",
    marginTop: moderateScale(2),
  },
  activeOrderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  orderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeOrderBadge: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#0F766E",
    letterSpacing: 0.5,
  },
  orderNumberText: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    marginTop: moderateScale(2),
  },
  earningsPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
  },
  earningsPillText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#059669",
  },
  orderProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: moderateScale(14),
  },
  progressDot: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: {
    backgroundColor: "#0F766E",
  },
  progressBar: {
    flex: 1,
    height: scale(3),
    backgroundColor: "#E2E8F0",
    marginHorizontal: scale(6),
  },
  progressBarActive: {
    backgroundColor: "#0F766E",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(12),
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationIconBoxStore: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  locationIconBoxCustomer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTypeLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  locationTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  locationAddress: {
    fontSize: moderateScale(11),
    color: "#475569",
    marginTop: moderateScale(2),
  },
  paymentMethodBadge: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#D97706",
    marginTop: moderateScale(4),
  },
  locationActions: {
    flexDirection: "row",
    gap: scale(8),
    marginLeft: scale(8),
  },
  actionCircleBtn: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stageActionBox: {
    marginTop: moderateScale(12),
  },
  stagePrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    gap: scale(6),
  },
  stagePrimaryBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  otpVerifyContainer: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderRadius: scale(10),
    padding: scale(12),
  },
  otpPromptTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F766E",
    marginBottom: moderateScale(8),
  },
  otpInputRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  otpInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    fontSize: moderateScale(15),
    fontWeight: "800",
    letterSpacing: 2,
    color: "#0F172A",
    height: moderateScale(42),
  },
  otpSubmitBtn: {
    backgroundColor: "#0F766E",
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  otpSubmitBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  idleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    paddingVertical: moderateScale(40),
    paddingHorizontal: scale(20),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: moderateScale(20),
  },
  radarCircle: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(16),
  },
  radarCircleActive: {
    backgroundColor: "#CCFBF1",
  },
  idleTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: moderateScale(6),
  },
  idleSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(20),
    paddingBottom: moderateScale(34),
  },
  offerTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(20),
    gap: scale(4),
  },
  timerText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#DC2626",
  },
  earningsBanner: {
    alignItems: "flex-end",
  },
  earningsAmount: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#059669",
  },
  earningsLabel: {
    fontSize: moderateScale(10),
    color: "#64748B",
  },
  newOrderAlertTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#0F172A",
  },
  orderNumberBadge: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginBottom: moderateScale(16),
  },
  offerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  offerDotStore: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: "#0F766E",
  },
  offerDotCustomer: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: "#2563EB",
  },
  offerLocationLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#94A3B8",
  },
  offerLocationName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  offerLocationAddress: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: moderateScale(16),
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
  },
  rejectBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#64748B",
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: "#0F766E",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
  },
  acceptBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
