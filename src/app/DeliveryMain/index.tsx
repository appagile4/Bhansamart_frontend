import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/store/services/socketService";
import {
  acceptOfferedOrder,
  cancelOrderDelivery,
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
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import deliveryService from "@/store/services/deliveryService";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  KeyboardAvoidingView,
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
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const CANCELLATION_REASONS = [
  {
    id: "CUSTOMER_UNAVAILABLE",
    label: "Customer Not Available / Phone Unreachable",
    icon: "phone-off" as const,
    description:
      "Door locked, or customer not answering phone after multiple calls.",
  },
  {
    id: "CUSTOMER_CANCELLED",
    label: "Customer Cancelled / Refused Delivery",
    icon: "x-circle" as const,
    description:
      "Customer explicitly refused to take delivery or cancelled on spot.",
  },
  {
    id: "WRONG_PRODUCT",
    label: "Product Wrong / Missing / Damaged",
    icon: "alert-triangle" as const,
    description:
      "Items in package do not match order, or items are leaking/damaged.",
  },
  {
    id: "ADDRESS_UNREACHABLE",
    label: "Address Incorrect / Road Inaccessible",
    icon: "map-pin" as const,
    description:
      "Could not find destination address or access route is blocked.",
  },
  {
    id: "OTHER",
    label: "Other Operational Issue",
    icon: "info" as const,
    description: "Vehicle breakdown, extreme weather, or emergency.",
  },
];

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  // Payment mode for COD delivery at customer location: "CASH" (physical) or "DIRECT_QR" (vendor store QR)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<
    "CASH" | "DIRECT_QR"
  >("CASH");

  // Countdown timer for incoming offer
  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef<any>(null);

  // Google Map ref & coordinates for offer modal
  const mapRef = useRef<MapView | null>(null);

  // Delivery Cancellation / Return to Vendor Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("CUSTOMER_UNAVAILABLE");
  const [cancelNotes, setCancelNotes] = useState("");

  // Live Navigation Google Map Modal State
  const [navMapModal, setNavMapModal] = useState<{
    visible: boolean;
    targetType: "STORE" | "CUSTOMER" | null;
    targetName: string;
    targetAddress: string;
    targetCoord: { latitude: number; longitude: number };
  }>({
    visible: false,
    targetType: null,
    targetName: "",
    targetAddress: "",
    targetCoord: { latitude: 27.7172, longitude: 85.324 },
  });
  const navMapRef = useRef<MapView | null>(null);

  // Live GPS Coordinates Fix
  const [liveCoordinates, setLiveCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Delivery partner's current coordinate (prefers live high-accuracy GPS)
  const partnerCoord = useMemo(() => {
    if (liveCoordinates) {
      return { latitude: liveCoordinates.latitude, longitude: liveCoordinates.longitude };
    }
    let lat = 27.705;
    let lng = 85.315;
    if (
      partner?.currentLocation?.coordinates &&
      Array.isArray(partner.currentLocation.coordinates)
    ) {
      lng = Number(partner.currentLocation.coordinates[0]) || 85.315;
      lat = Number(partner.currentLocation.coordinates[1]) || 27.705;
    }
    return { latitude: lat, longitude: lng };
  }, [liveCoordinates, partner]);

  // Compute bounding region for navigation modal
  const navMapRegion = useMemo(() => {
    const lat1 = partnerCoord.latitude;
    const lng1 = partnerCoord.longitude;
    const lat2 = navMapModal.targetCoord.latitude;
    const lng2 = navMapModal.targetCoord.longitude;

    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLng = Math.min(lng1, lng2);
    const maxLng = Math.max(lng1, lng2);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
    };
  }, [partnerCoord, navMapModal.targetCoord]);

  // Map coordinates calculation for order offer
  const mapData = useMemo(() => {
    if (!offeredAssignment) return null;

    // Delivery boy / His location
    let boyLat = 27.705;
    let boyLng = 85.315;
    if (
      offeredAssignment.partnerLocation &&
      Array.isArray(offeredAssignment.partnerLocation)
    ) {
      boyLng = Number(offeredAssignment.partnerLocation[0]) || 85.315;
      boyLat = Number(offeredAssignment.partnerLocation[1]) || 27.705;
    } else if (
      partner?.currentLocation?.coordinates &&
      Array.isArray(partner.currentLocation.coordinates)
    ) {
      boyLng = Number(partner.currentLocation.coordinates[0]) || 85.315;
      boyLat = Number(partner.currentLocation.coordinates[1]) || 27.705;
    }

    // Store location
    let storeLat = 27.7172;
    let storeLng = 85.324;
    if (
      offeredAssignment.pickup?.coordinates &&
      Array.isArray(offeredAssignment.pickup.coordinates)
    ) {
      storeLng = Number(offeredAssignment.pickup.coordinates[0]) || 85.324;
      storeLat = Number(offeredAssignment.pickup.coordinates[1]) || 27.7172;
    }

    // Customer / Delivery location
    let dropLat = 27.7272;
    let dropLng = 85.334;
    if (
      offeredAssignment.drop?.coordinates &&
      Array.isArray(offeredAssignment.drop.coordinates)
    ) {
      dropLng = Number(offeredAssignment.drop.coordinates[0]) || 85.334;
      dropLat = Number(offeredAssignment.drop.coordinates[1]) || 27.7272;
    }

    const partnerCoord = { latitude: boyLat, longitude: boyLng };
    const storeCoord = { latitude: storeLat, longitude: storeLng };
    const dropCoord = { latitude: dropLat, longitude: dropLng };

    // Bounding region
    const minLat = Math.min(boyLat, storeLat, dropLat);
    const maxLat = Math.max(boyLat, storeLat, dropLat);
    const minLng = Math.min(boyLng, storeLng, dropLng);
    const maxLng = Math.max(boyLng, storeLng, dropLng);

    const latDelta = Math.max((maxLat - minLat) * 1.6, 0.025);
    const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.025);

    const initialRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };

    return {
      partnerCoord,
      storeCoord,
      dropCoord,
      initialRegion,
      allCoords: [partnerCoord, storeCoord, dropCoord],
      leg1Coords: [partnerCoord, storeCoord],
      leg2Coords: [storeCoord, dropCoord],
    };
  }, [offeredAssignment, partner]);

  // Auto-fit map to show partner, store, and drop markers
  const onMapReady = () => {
    if (mapRef.current && mapData?.allCoords?.length) {
      mapRef.current.fitToCoordinates(mapData.allCoords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (offeredAssignment && mapRef.current && mapData?.allCoords?.length) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(mapData.allCoords, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [offeredAssignment, mapData]);

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

  // ── Continuous Real-Time GPS Tracking (Foreground & Background Active) ──
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let fallbackInterval: any = null;
    let isTrackingActive = true;

    const sendLocationUpdate = (latitude: number, longitude: number, heading = 0, speed = 0) => {
      setLiveCoordinates({ latitude, longitude });
      // 1. Emit via real-time WebSocket for instant proximity matching
      socketService.emitDeliveryLocation(latitude, longitude, heading, speed);
      // 2. Persist in MongoDB database via location controller
      deliveryService.updateLocation({ latitude, longitude, heading, speed }).catch(() => {});
    };

    const startLiveTracking = async () => {
      if (availability !== "ONLINE" && availability !== "BUSY") {
        return;
      }

      try {
        // Request foreground high-accuracy GPS permission
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus === "granted") {
          // Attempt background permission for continuous tracking when app is minimized
          try {
            await Location.requestBackgroundPermissionsAsync();
          } catch (bgErr) {
            console.log("Background location permission skipped/optional:", bgErr);
          }

          // Fetch initial instant fix
          try {
            const initialFix = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            if (initialFix?.coords && isTrackingActive) {
              sendLocationUpdate(
                initialFix.coords.latitude,
                initialFix.coords.longitude,
                initialFix.coords.heading || 0,
                initialFix.coords.speed || 0
              );
            }
          } catch (initErr) {
            console.log("Initial GPS fix warning:", initErr);
          }

          // Start continuous high-accuracy watcher (every 5 seconds / 5 meters)
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 5,
            },
            (loc) => {
              if (isTrackingActive && loc?.coords) {
                sendLocationUpdate(
                  loc.coords.latitude,
                  loc.coords.longitude,
                  loc.coords.heading || 0,
                  loc.coords.speed || 0
                );
              }
            }
          );
        }
      } catch (err) {
        console.warn("GPS Location tracking initialization error:", err);
      }

      // Continuous heartbeat beacon (ensures location stays fresh in database even if static or running in background)
      fallbackInterval = setInterval(async () => {
        if (!isTrackingActive || (availability !== "ONLINE" && availability !== "BUSY")) return;

        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc?.coords) {
            sendLocationUpdate(
              loc.coords.latitude,
              loc.coords.longitude,
              loc.coords.heading || 0,
              loc.coords.speed || 0
            );
            return;
          }
        } catch (_) {}

        // Fallback to active coordinates heartbeat
        const baseLat = liveCoordinates?.latitude || partner?.currentLocation?.coordinates?.[1] || 27.7172;
        const baseLng = liveCoordinates?.longitude || partner?.currentLocation?.coordinates?.[0] || 85.3240;
        sendLocationUpdate(baseLat, baseLng, 0, 0);
      }, 10000);
    };

    startLiveTracking();

    // AppState change listener: updates continue when app transitions between active and background
    const appStateSub = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" || nextAppState === "background") {
        if (availability === "ONLINE" || availability === "BUSY") {
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            .then((loc) => {
              if (loc?.coords) {
                sendLocationUpdate(
                  loc.coords.latitude,
                  loc.coords.longitude,
                  loc.coords.heading || 0,
                  loc.coords.speed || 0
                );
              }
            })
            .catch(() => {});
        }
      }
    });

    return () => {
      isTrackingActive = false;
      if (locationSubscription) locationSubscription.remove();
      if (fallbackInterval) clearInterval(fallbackInterval);
      appStateSub.remove();
    };
  }, [availability, partner]);

  // Availability Toggle
  const handleToggleAvailability = async () => {
    const nextStatus = availability === "ONLINE" ? "OFFLINE" : "ONLINE";

    if (nextStatus === "ONLINE") {
      if (partner?.approvalStatus !== "APPROVED") {
        Alert.alert(
          "Approval Required",
          `Your partner profile is currently '${partner?.approvalStatus || "PENDING_APPROVAL"}'. Admin must review and approve your account before you can go online.`,
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
          ],
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
          ],
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
      await dispatch(
        acceptOfferedOrder(offeredAssignment.assignmentId),
      ).unwrap();
      dispatch(fetchActiveAssignment());
    } catch (err: any) {
      Alert.alert(
        "Offer Expired",
        err ||
          "This order offer has expired or was assigned to another partner.",
      );
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
        }),
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
      Alert.alert(
        "Arrived at Store",
        "Ask the vendor staff for the 4-digit Pickup OTP.",
      );
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update store arrival.");
    }
  };

  // Verify Pickup OTP
  const handleVerifyPickupOtp = async () => {
    if (!pickupOtpInput.trim() || !activeOrder) {
      Alert.alert(
        "Required",
        "Please enter the Pickup OTP given by the vendor.",
      );
      return;
    }
    try {
      await dispatch(
        verifyOrderPickupOtp({
          orderId: activeOrder._id,
          otp: pickupOtpInput.trim(),
        }),
      ).unwrap();
      setPickupOtpInput("");
      dispatch(fetchActiveAssignment());
      Alert.alert(
        "Pickup Confirmed!",
        "Order package received. You are now out for delivery.",
      );
    } catch (err: any) {
      Alert.alert(
        "Verification Failed",
        err || "Invalid Pickup OTP. Check with the vendor.",
      );
    }
  };

  // Customer Arrival
  const handleArriveAtCustomer = async () => {
    if (!activeOrder) return;
    try {
      await dispatch(markOrderArrivedCustomer(activeOrder._id)).unwrap();
      dispatch(fetchActiveAssignment());
      Alert.alert(
        "Arrived at Customer",
        "Ask the customer for their 4-digit Delivery OTP.",
      );
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update customer arrival.");
    }
  };

  // Verify Customer Delivery OTP
  const handleVerifyDeliveryOtp = async () => {
    if (!deliveryOtpInput.trim() || !activeOrder) {
      Alert.alert(
        "Required",
        "Please enter the Delivery OTP provided by the customer.",
      );
      return;
    }

    const isCod = activeOrder.paymentMethod === "Cash on delivery";
    const paymentMode = isCod ? selectedPaymentMode : undefined;

    try {
      const res = await dispatch(
        verifyOrderDeliveryOtp({
          orderId: activeOrder._id,
          otp: deliveryOtpInput.trim(),
          paymentMode,
        }),
      ).unwrap();
      setDeliveryOtpInput("");
      dispatch(fetchActiveAssignment());

      const paymentMsg =
        paymentMode === "DIRECT_QR"
          ? `Online payment of ₹${activeOrder.totalAmount} was paid directly to the Store QR.`
          : isCod
            ? `Collected ₹${activeOrder.totalAmount} physical cash (custody).`
            : "Prepaid order delivered.";

      Alert.alert(
        "Order Delivered!",
        `Congratulations! Delivery completed successfully.\n${paymentMsg}\nEarnings credited to your wallet: ₹${res.earnings?.totalEarnings || 60}`,
      );
    } catch (err: any) {
      Alert.alert(
        "Verification Failed",
        err || "Invalid Delivery OTP. Check with the customer.",
      );
    }
  };

  const handleOpenStoreNavigation = () => {
    if (!activeOrder) return;
    const storeLat =
      Number(activeOrder.vendor?.shippingLocations?.latitude) || 27.7172;
    const storeLng =
      Number(activeOrder.vendor?.shippingLocations?.longitude) || 85.324;
    setNavMapModal({
      visible: true,
      targetType: "STORE",
      targetName: activeOrder.vendor?.name || "Grocery Store Pickup",
      targetAddress: activeOrder.vendor?.address || "Store Warehouse",
      targetCoord: { latitude: storeLat, longitude: storeLng },
    });
  };

  const handleOpenCustomerNavigation = () => {
    if (!activeOrder) return;
    const dropLat =
      Number(activeOrder.deliveryLocation?.coordinates?.[1]) || 27.7272;
    const dropLng =
      Number(activeOrder.deliveryLocation?.coordinates?.[0]) || 85.334;
    setNavMapModal({
      visible: true,
      targetType: "CUSTOMER",
      targetName: activeOrder.customerName || "Customer Delivery",
      targetAddress:
        activeOrder.deliveryAddress?.addressLine || "Delivery Destination",
      targetCoord: { latitude: dropLat, longitude: dropLng },
    });
  };

  const handleOpenExternalNavigation = (
    address: string,
    coord?: { latitude: number; longitude: number },
  ) => {
    let url = "";
    if (coord && coord.latitude && coord.longitude) {
      url =
        Platform.select({
          ios: `maps:0,0?q=${coord.latitude},${coord.longitude}`,
          android: `google.navigation:q=${coord.latitude},${coord.longitude}`,
          default: `https://www.google.com/maps/dir/?api=1&destination=${coord.latitude},${coord.longitude}`,
        }) ||
        `https://www.google.com/maps/dir/?api=1&destination=${coord.latitude},${coord.longitude}`;
    } else {
      url =
        Platform.select({
          ios: `maps:0,0?q=${encodeURIComponent(address)}`,
          android: `geo:0,0?q=${encodeURIComponent(address)}`,
          default: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
        }) || `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert("Navigation", "Could not open map app on this device.");
    });
  };

  const openNavigation = (address: string) => {
    handleOpenExternalNavigation(address);
  };

  const handleConfirmCancelDelivery = async () => {
    if (!activeOrder) return;

    const currentAttempt = (activeOrder.deliveryCancellationCount || 0) + 1;
    const isPermanent = currentAttempt >= 3;

    Alert.alert(
      isPermanent ? "Permanent Order Cancellation" : "Return Order to Store?",
      isPermanent
        ? "This is the 3rd failed delivery attempt. The order will be PERMANENTLY CANCELLED in the system, returned to vendor inventory, and customer will be refunded/notified."
        : `This will mark cancellation attempt ${currentAttempt} of 3. You will return the package back to the store. The system will then dispatch the order to the next nearest delivery partner.`,
      [
        { text: "Dismiss", style: "cancel" },
        {
          text: isPermanent
            ? "Confirm Permanent Cancel"
            : "Return & Re-Dispatch",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await dispatch(
                cancelOrderDelivery({
                  orderId: activeOrder._id,
                  reason: cancelReason,
                  notes: cancelNotes.trim(),
                }),
              ).unwrap();

              setCancelModalVisible(false);
              setCancelNotes("");
              dispatch(fetchActiveAssignment());

              if (res.orderCancelled) {
                Alert.alert(
                  "Order Cancelled",
                  `Maximum 3 delivery attempts reached. Order #${activeOrder.orderNumber} is now permanently cancelled. Please return items to the store.`,
                );
              } else {
                Alert.alert(
                  "Delivery Returned",
                  `Package marked returned to vendor (Attempt ${res.deliveryCancellationCount} of 3). System is dispatching to the next nearest partner.`,
                );
              }
            } catch (err: any) {
              Alert.alert("Action Failed", err || "Failed to cancel delivery.");
            }
          },
        },
      ],
    );
  };

  const dialPhone = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[""] as any}>
      <StatusBar style="light" />

      {/* Top Header Card */}
      <LinearGradient
        colors={["#0F766E", "#0D9488", "#115E59"]}
        style={[
          styles.headerGradient,
          { paddingTop: Math.max(insets.top, moderateScale(14)) + moderateScale(8) },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity
              style={styles.headerAvatarContainer}
              onPress={() => router.push("/DeliveryMain/profile" as any)}
              activeOpacity={0.8}
            >
              {partner?.profilePhoto?.url || partner?.user?.avatar ? (
                <Image
                  source={{ uri: partner.profilePhoto?.url || partner.user?.avatar }}
                  style={styles.headerAvatarImg}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarLetter}>
                    {partner?.fullName?.charAt(0) || "P"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ marginLeft: scale(10), flex: 1 }}>
              <Text style={styles.partnerGreeting} numberOfLines={1}>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              <Text style={styles.alertBannerTitle}>
                Account Pending Approval
              </Text>
              <Text style={styles.alertBannerSub}>
                Upload all 4 documents and complete the ₹1,000 security deposit
                to activate your account.
              </Text>
            </View>
            <Feather name="chevron-right" size={scale(18)} color="#92400E" />
          </TouchableOpacity>
        )}

        {/* COD Cash in Hand Alert Banner */}
        {Number(partner?.codCashInCustody || 0) > 0 && (
          <TouchableOpacity
            style={styles.codAlertBanner}
            onPress={() => router.push("/DeliveryMain/wallet" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.codAlertIconBox}>
              <MaterialCommunityIcons
                name="hand-coin"
                size={scale(20)}
                color="#D97706"
              />
            </View>
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.codAlertTitle}>
                ₹{Number(partner?.codCashInCustody || 0).toFixed(2)} COD Cash in
                Hand
              </Text>
              <Text style={styles.codAlertSub}>
                Cash collected from customers. Tap to view vendor store
                breakdown & submit cash.
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
                <Text style={styles.activeOrderBadge}>
                  ACTIVE DELIVERY IN PROGRESS
                </Text>
                <Text style={styles.orderNumberText}>
                  Order #{activeOrder.orderNumber}
                </Text>
              </View>
              <View style={styles.earningsPill}>
                <Text style={styles.earningsPillText}>
                  Earn ₹{activeOrder.estimatedEarnings || 60}
                </Text>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.orderProgressRow}>
              <View style={[styles.progressDot, styles.progressDotActive]}>
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
                <Text style={styles.locationTitle}>
                  {activeOrder.vendor?.name || "Grocery Store"}
                </Text>
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
                  onPress={handleOpenStoreNavigation}
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
                    <Text style={styles.stagePrimaryBtnText}>
                      I Have Arrived at Store
                    </Text>
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
                          <Text style={styles.otpSubmitBtnText}>
                            Verify & Take
                          </Text>
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
                <Text style={styles.locationTypeLabel}>
                  DELIVER TO CUSTOMER
                </Text>
                <Text style={styles.locationTitle}>
                  {activeOrder.customerName || "Customer"}
                </Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {activeOrder.deliveryAddress?.addressLine ||
                    "Delivery Address"}
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
                  onPress={handleOpenCustomerNavigation}
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
                    style={[
                      styles.stagePrimaryBtn,
                      { backgroundColor: "#2563EB" },
                    ]}
                    onPress={handleArriveAtCustomer}
                    activeOpacity={0.85}
                  >
                    <Feather name="map-pin" size={scale(16)} color="#FFFFFF" />
                    <Text style={styles.stagePrimaryBtnText}>
                      I Have Reached Customer Door
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.otpVerifyContainer}>
                    {/* COD Payment Method Selector & Store QR Display */}
                    {activeOrder.paymentMethod === "Cash on delivery" ? (
                      <View style={styles.paymentMethodSelectionBox}>
                        <Text style={styles.paymentSelectionTitle}>
                          Payment Collection Option:
                        </Text>
                        <View style={styles.paymentToggleRow}>
                          {/* Option 1: Cash */}
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSelectedPaymentMode("CASH")}
                            style={[
                              styles.paymentOptionBtn,
                              selectedPaymentMode === "CASH" &&
                                styles.paymentOptionBtnActiveCash,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="cash-multiple"
                              size={scale(18)}
                              color={
                                selectedPaymentMode === "CASH"
                                  ? "#15803D"
                                  : "#64748B"
                              }
                            />
                            <View style={{ marginLeft: scale(6), flex: 1 }}>
                              <Text
                                style={[
                                  styles.paymentOptionBtnText,
                                  selectedPaymentMode === "CASH" &&
                                    styles.paymentOptionBtnTextActiveCash,
                                ]}
                              >
                                1. Cash Payment
                              </Text>
                              <Text style={styles.paymentOptionSubText}>
                                Collect ₹{activeOrder.totalAmount}
                              </Text>
                            </View>
                            {selectedPaymentMode === "CASH" && (
                              <Ionicons
                                name="checkmark-circle"
                                size={scale(16)}
                                color="#15803D"
                              />
                            )}
                          </TouchableOpacity>

                          {/* Option 2: Online Payment / Vendor Store QR */}
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSelectedPaymentMode("DIRECT_QR")}
                            style={[
                              styles.paymentOptionBtn,
                              selectedPaymentMode === "DIRECT_QR" &&
                                styles.paymentOptionBtnActiveQr,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="qrcode-scan"
                              size={scale(18)}
                              color={
                                selectedPaymentMode === "DIRECT_QR"
                                  ? "#0F766E"
                                  : "#64748B"
                              }
                            />
                            <View style={{ marginLeft: scale(6), flex: 1 }}>
                              <Text
                                style={[
                                  styles.paymentOptionBtnText,
                                  selectedPaymentMode === "DIRECT_QR" &&
                                    styles.paymentOptionBtnTextActiveQr,
                                ]}
                              >
                                2. Online (Store QR)
                              </Text>
                              <Text style={styles.paymentOptionSubText}>
                                Direct to Vendor
                              </Text>
                            </View>
                            {selectedPaymentMode === "DIRECT_QR" && (
                              <Ionicons
                                name="checkmark-circle"
                                size={scale(16)}
                                color="#0F766E"
                              />
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* Detail Card based on selected option */}
                        {selectedPaymentMode === "CASH" ? (
                          <View style={styles.cashNoticeBox}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: scale(6),
                              }}
                            >
                              <Feather
                                name="dollar-sign"
                                size={scale(15)}
                                color="#15803D"
                              />
                              <Text style={styles.cashNoticeTitle}>
                                Physical Cash Collection: ₹
                                {activeOrder.totalAmount}
                              </Text>
                            </View>
                            <Text style={styles.cashNoticeText}>
                              Collect physical cash from the customer. You must
                              submit this collected cash at the vendor store
                              counter.
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.qrDisplayCard}>
                            <View style={styles.qrHeaderRow}>
                              <MaterialCommunityIcons
                                name="storefront-outline"
                                size={scale(16)}
                                color="#0F766E"
                              />
                              <Text
                                style={styles.qrStoreTitle}
                                numberOfLines={1}
                              >
                                {activeOrder.vendor?.name || "Store"} Payment QR
                              </Text>
                            </View>
                            <Text style={styles.qrExplainer}>
                              Customer scans this QR code to pay directly to the
                              vendor's bank/UPI account. This will not be added
                              to rider cash custody or vendor app wallet.
                            </Text>

                            {/* QR Code Preview Box */}
                            <View style={styles.qrImageContainer}>
                              {activeOrder.vendor?.paymentSettings
                                ?.qrCodeUrl ? (
                                <Image
                                  source={{
                                    uri: activeOrder.vendor.paymentSettings
                                      .qrCodeUrl,
                                  }}
                                  style={styles.qrCodeImage}
                                  contentFit="contain"
                                />
                              ) : activeOrder.vendor?.paymentSettings?.upiId ? (
                                <Image
                                  source={{
                                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                      `upi://pay?pa=${activeOrder.vendor.paymentSettings.upiId}&pn=${encodeURIComponent(
                                        activeOrder.vendor?.paymentSettings
                                          ?.accountName ||
                                          activeOrder.vendor?.name ||
                                          "Store",
                                      )}&am=${activeOrder.totalAmount}&cu=INR`,
                                    )}`,
                                  }}
                                  style={styles.qrCodeImage}
                                  contentFit="contain"
                                />
                              ) : (
                                <View style={styles.qrPlaceholderBox}>
                                  <MaterialCommunityIcons
                                    name="qrcode"
                                    size={scale(50)}
                                    color="#94A3B8"
                                  />
                                  <Text style={styles.qrPlaceholderText}>
                                    No QR/UPI uploaded by store. Please collect
                                    cash.
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Store UPI & Account Details */}
                            {activeOrder.vendor?.paymentSettings?.upiId ? (
                              <View style={styles.upiDetailsPill}>
                                <Text style={styles.upiPillLabel}>
                                  Store UPI:
                                </Text>
                                <Text
                                  style={styles.upiPillValue}
                                  numberOfLines={1}
                                >
                                  {activeOrder.vendor.paymentSettings.upiId}
                                </Text>
                              </View>
                            ) : null}

                            <View style={styles.qrAmountRow}>
                              <Text style={styles.qrAmountLabel}>
                                Total Bill Amount:
                              </Text>
                              <Text style={styles.qrAmountValue}>
                                ₹{activeOrder.totalAmount}
                              </Text>
                            </View>

                            <Text style={styles.qrVerifyNotice}>
                              ⚠️ Verify the payment success message on
                              customer's screen before entering the Delivery
                              OTP.
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.prepaidNoticeBox}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: scale(6),
                          }}
                        >
                          <Ionicons
                            name="checkmark-done-circle"
                            size={scale(16)}
                            color="#15803D"
                          />
                          <Text style={styles.prepaidNoticeTitle}>
                            Prepaid Online Order
                          </Text>
                        </View>
                        <Text style={styles.prepaidNoticeText}>
                          This order was already paid online by the customer. No
                          cash collection required.
                        </Text>
                      </View>
                    )}

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

            {/* Delivery Cancellation / Return Package to Store Action */}
            <TouchableOpacity
              style={styles.cancelDeliveryActionBtn}
              onPress={() => setCancelModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="alert-triangle" size={scale(14)} color="#DC2626" />
              <Text style={styles.cancelDeliveryActionText}>
                Cancel Delivery / Return to Store
              </Text>
              {(activeOrder.deliveryCancellationCount || 0) > 0 && (
                <View style={styles.attemptsWarningBadge}>
                  <Text style={styles.attemptsWarningText}>
                    Attempt {activeOrder.deliveryCancellationCount}/3
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
    </KeyboardAvoidingView>

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
                <Ionicons
                  name="timer-outline"
                  size={scale(18)}
                  color="#EF4444"
                />
                <Text style={styles.timerText}>{timeLeft}s left</Text>
              </View>
              <View style={styles.earningsBanner}>
                <Text style={styles.earningsAmount}>
                  ₹{offeredAssignment?.estimatedEarnings || 60}
                </Text>
                <Text style={styles.earningsLabel}>Estimated Pay</Text>
              </View>
            </View>

            <Text style={styles.newOrderAlertTitle}>
              New Grocery Order Request!
            </Text>
            <Text style={styles.orderNumberBadge}>
              Order #{offeredAssignment?.orderNumber} •{" "}
              {offeredAssignment?.itemsCount || 1} Item(s)
            </Text>

            {/* Interactive Live Route Map (Store, Partner Location & Delivery Location) */}
            {mapData && (
              <View style={styles.offerMapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.offerMapView}
                  provider={
                    Platform.OS === "android"
                      ? PROVIDER_GOOGLE
                      : PROVIDER_DEFAULT
                  }
                  initialRegion={mapData.initialRegion}
                  onMapReady={onMapReady}
                  showsCompass={false}
                  toolbarEnabled={false}
                  rotateEnabled={false}
                >
                  {/* Partner Current Location Marker */}
                  <Marker
                    coordinate={mapData.partnerCoord}
                    title="My Location"
                    description="Your current position"
                  >
                    <View style={styles.partnerMarkerPin}>
                      <Text style={styles.markerEmoji}>🛵</Text>
                    </View>
                  </Marker>

                  {/* Store Pickup Location Marker */}
                  <Marker
                    coordinate={mapData.storeCoord}
                    title={
                      offeredAssignment?.pickup?.storeName || "Store Pickup"
                    }
                    description={
                      offeredAssignment?.pickup?.address || "Pickup warehouse"
                    }
                  >
                    <View style={styles.storeMarkerPin}>
                      <Text style={styles.markerEmoji}>🏬</Text>
                    </View>
                  </Marker>

                  {/* Customer Drop Location Marker */}
                  <Marker
                    coordinate={mapData.dropCoord}
                    title={
                      offeredAssignment?.drop?.customerName || "Customer Drop"
                    }
                    description={
                      offeredAssignment?.drop?.address || "Delivery destination"
                    }
                  >
                    <View style={styles.customerMarkerPin}>
                      <Text style={styles.markerEmoji}>🏠</Text>
                    </View>
                  </Marker>

                  {/* Line 1: Partner -> Store Pickup (dashed teal) */}
                  <Polyline
                    coordinates={mapData.leg1Coords}
                    strokeColor="#0F766E"
                    strokeWidth={3}
                    lineDashPattern={[6, 4]}
                  />

                  {/* Line 2: Store -> Customer Drop (solid blue) */}
                  <Polyline
                    coordinates={mapData.leg2Coords}
                    strokeColor="#2563EB"
                    strokeWidth={3.5}
                  />
                </MapView>

                {/* Floating Way Route Legend Overlay */}
                <View style={styles.mapRouteOverlay}>
                  <View style={styles.mapRouteStep}>
                    <Text style={styles.mapRouteIcon}>🛵</Text>
                    <Text style={styles.mapRouteStepText}>You</Text>
                  </View>
                  <Feather
                    name="arrow-right"
                    size={scale(12)}
                    color="#0F766E"
                  />
                  <View style={styles.mapRouteStep}>
                    <Text style={styles.mapRouteIcon}>🏬</Text>
                    <Text style={styles.mapRouteStepText}>Store</Text>
                  </View>
                  <Feather
                    name="arrow-right"
                    size={scale(12)}
                    color="#2563EB"
                  />
                  <View style={styles.mapRouteStep}>
                    <Text style={styles.mapRouteIcon}>🏠</Text>
                    <Text style={styles.mapRouteStepText}>Drop</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Pickup Details */}
            <View style={styles.offerLocationRow}>
              <View style={styles.offerDotStore} />
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <View style={styles.locationTitleRow}>
                  <Text style={styles.offerLocationLabel}>PICKUP FROM</Text>
                  {offeredAssignment?.pickup?.distanceKm ? (
                    <Text style={styles.distanceBadgeText}>
                      ~{offeredAssignment.pickup.distanceKm} km away
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.offerLocationName}>
                  {offeredAssignment?.pickup?.storeName || "Store"}
                </Text>
                <Text style={styles.offerLocationAddress} numberOfLines={1}>
                  {offeredAssignment?.pickup?.address}
                </Text>
              </View>
            </View>

            {/* Drop Details */}
            <View style={styles.offerLocationRow}>
              <View style={styles.offerDotCustomer} />
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.offerLocationLabel}>DELIVER TO</Text>
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

      {/* ── LIVE NAVIGATION GOOGLE MAP MODAL ──────────── */}
      <Modal
        visible={navMapModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setNavMapModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.navMapCard}>
            {/* Modal Header */}
            <View style={styles.navMapHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.navMapTypeBadge}>
                  <Text style={styles.navMapTypeBadgeText}>
                    {navMapModal.targetType === "STORE"
                      ? "🏬 PICKUP NAVIGATION"
                      : "🏠 CUSTOMER DROP NAVIGATION"}
                  </Text>
                </View>
                <Text style={styles.navMapTitle}>{navMapModal.targetName}</Text>
                <Text style={styles.navMapAddress} numberOfLines={1}>
                  {navMapModal.targetAddress}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.navMapCloseBtn}
                onPress={() =>
                  setNavMapModal((prev) => ({ ...prev, visible: false }))
                }
              >
                <Ionicons name="close" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Embedded Live Route Map */}
            <View style={styles.navMapContainer}>
              <MapView
                ref={navMapRef}
                style={styles.navMapView}
                provider={
                  Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
                }
                initialRegion={navMapRegion}
                showsCompass={true}
              >
                {/* Rider Current Location */}
                <Marker
                  coordinate={partnerCoord}
                  title="My Location"
                  description="Your current position"
                >
                  <View style={styles.partnerMarkerPin}>
                    <Text style={styles.markerEmoji}>🛵</Text>
                  </View>
                </Marker>

                {/* Target Destination */}
                <Marker
                  coordinate={navMapModal.targetCoord}
                  title={navMapModal.targetName}
                  description={navMapModal.targetAddress}
                >
                  <View
                    style={
                      navMapModal.targetType === "STORE"
                        ? styles.storeMarkerPin
                        : styles.customerMarkerPin
                    }
                  >
                    <Text style={styles.markerEmoji}>
                      {navMapModal.targetType === "STORE" ? "🏬" : "🏠"}
                    </Text>
                  </View>
                </Marker>

                {/* Connecting Route Way */}
                <Polyline
                  coordinates={[partnerCoord, navMapModal.targetCoord]}
                  strokeColor={
                    navMapModal.targetType === "STORE" ? "#0F766E" : "#2563EB"
                  }
                  strokeWidth={4}
                  lineDashPattern={[6, 4]}
                />
              </MapView>

              {/* Waypoint pill overlay */}
              <View style={styles.navMapRoutePill}>
                <Text style={styles.navMapRoutePillText}>
                  🛵 You ➔{" "}
                  {navMapModal.targetType === "STORE"
                    ? "🏬 Store"
                    : "🏠 Customer"}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.navMapActionRow}>
              <TouchableOpacity
                style={styles.navMapExternalBtn}
                onPress={() =>
                  handleOpenExternalNavigation(
                    navMapModal.targetAddress,
                    navMapModal.targetCoord,
                  )
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="google-maps"
                  size={scale(18)}
                  color="#FFFFFF"
                />
                <Text style={styles.navMapExternalBtnText}>
                  Open Turn-by-Turn GPS
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DELIVERY CANCELLATION / RETURN TO STORE MODAL ──────────── */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.cancelModalCard}>
            {/* Header */}
            <View style={styles.cancelModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelModalTitle}>
                  Cancel Delivery & Return
                </Text>
                <Text style={styles.cancelModalSubtitle}>
                  Order #{activeOrder?.orderNumber} • Select valid cancellation
                  reason
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelModalCloseBtn}
                onPress={() => setCancelModalVisible(false)}
              >
                <Ionicons name="close" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Attempt notice box */}
            <View style={styles.attemptNoticeBox}>
              <Ionicons
                name="information-circle"
                size={scale(18)}
                color="#D97706"
              />
              <View style={{ flex: 1, marginLeft: scale(8) }}>
                <Text style={styles.attemptNoticeTitle}>
                  Delivery Cancellation Attempt{" "}
                  {(activeOrder?.deliveryCancellationCount || 0) + 1} of 3
                </Text>
                <Text style={styles.attemptNoticeDesc}>
                  {(activeOrder?.deliveryCancellationCount || 0) + 1 >= 3
                    ? "Warning: Reaching 3 failed delivery cancellations will PERMANENTLY cancel this order in the system."
                    : "You will return the package back to the store. The system will then dispatch the order to the next nearest delivery partner."}
                </Text>
              </View>
            </View>

            {/* Reasons List */}
            <ScrollView
              style={styles.reasonsList}
              showsVerticalScrollIndicator={false}
            >
              {CANCELLATION_REASONS.map((reason) => {
                const isSelected = cancelReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonOptionCard,
                      isSelected && styles.reasonOptionCardSelected,
                    ]}
                    onPress={() => setCancelReason(reason.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.reasonRadioCircle,
                        isSelected && styles.reasonRadioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.reasonRadioInner} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text
                        style={[
                          styles.reasonLabel,
                          isSelected && styles.reasonLabelSelected,
                        ]}
                      >
                        {reason.label}
                      </Text>
                      <Text style={styles.reasonDescription}>
                        {reason.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Optional notes */}
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>
                  Additional Notes (Optional):
                </Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. Called customer 4 times, no response..."
                  placeholderTextColor="#94A3B8"
                  value={cancelNotes}
                  onChangeText={setCancelNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            {/* Confirm Actions */}
            <View style={styles.cancelModalActionsRow}>
              <TouchableOpacity
                style={styles.cancelModalDismissBtn}
                onPress={() => setCancelModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalDismissText}>Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelModalConfirmBtn,
                  actionLoading && { opacity: 0.6 },
                ]}
                onPress={handleConfirmCancelDelivery}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.cancelModalConfirmText}>
                    {(activeOrder?.deliveryCancellationCount || 0) + 1 >= 3
                      ? "Confirm Permanent Cancel"
                      : "Return to Store & Re-Dispatch"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  headerAvatarContainer: {
    marginRight: scale(4),
  },
  headerAvatarImg: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerAvatarPlaceholder: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerAvatarLetter: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#FFFFFF",
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
  codAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: moderateScale(16),
  },
  codAlertIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  codAlertTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#92400E",
  },
  codAlertSub: {
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
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distanceBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#0F766E",
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
  offerMapContainer: {
    width: "100%",
    height: scale(190),
    borderRadius: scale(14),
    overflow: "hidden",
    marginVertical: moderateScale(12),
    position: "relative",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  offerMapView: {
    width: "100%",
    height: "100%",
  },
  partnerMarkerPin: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  storeMarkerPin: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  customerMarkerPin: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  markerEmoji: {
    fontSize: moderateScale(14),
  },
  mapRouteOverlay: {
    position: "absolute",
    top: moderateScale(8),
    left: scale(8),
    right: scale(8),
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: scale(8),
    paddingVertical: moderateScale(5),
    paddingHorizontal: scale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  mapRouteStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  mapRouteIcon: {
    fontSize: moderateScale(12),
  },
  mapRouteStepText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#1E293B",
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
  cancelDeliveryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: scale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(14),
    marginTop: moderateScale(14),
    gap: scale(6),
  },
  cancelDeliveryActionText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#DC2626",
  },
  attemptsWarningBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    marginLeft: scale(4),
  },
  attemptsWarningText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#991B1B",
  },
  navMapCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(18),
    paddingBottom: moderateScale(28),
    maxHeight: "92%",
  },
  navMapHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  navMapTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
    marginBottom: moderateScale(4),
  },
  navMapTypeBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#0F766E",
  },
  navMapTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  navMapAddress: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  navMapCloseBtn: {
    padding: scale(6),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
  },
  navMapContainer: {
    width: "100%",
    height: scale(240),
    borderRadius: scale(14),
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: moderateScale(14),
  },
  navMapView: {
    width: "100%",
    height: "100%",
  },
  navMapRoutePill: {
    position: "absolute",
    bottom: moderateScale(10),
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
  },
  navMapRoutePillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  navMapActionRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  navMapExternalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    gap: scale(6),
  },
  navMapExternalBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(18),
    paddingBottom: moderateScale(28),
    maxHeight: "92%",
  },
  cancelModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  cancelModalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#0F172A",
  },
  cancelModalSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  cancelModalCloseBtn: {
    padding: scale(6),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
  },
  attemptNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: scale(10),
    padding: scale(10),
    marginBottom: moderateScale(12),
  },
  attemptNoticeTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#B45309",
  },
  attemptNoticeDesc: {
    fontSize: moderateScale(11),
    color: "#92400E",
    marginTop: moderateScale(2),
    lineHeight: moderateScale(15),
  },
  reasonsList: {
    maxHeight: scale(260),
    marginBottom: moderateScale(10),
  },
  reasonOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: moderateScale(8),
  },
  reasonOptionCardSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  reasonRadioCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  reasonRadioCircleSelected: {
    borderColor: "#EF4444",
  },
  reasonRadioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#EF4444",
  },
  reasonLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  reasonLabelSelected: {
    color: "#DC2626",
  },
  reasonDescription: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  notesContainer: {
    marginTop: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  notesLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#475569",
    marginBottom: moderateScale(4),
  },
  notesInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: moderateScale(12),
    color: "#0F172A",
    minHeight: scale(45),
    textAlignVertical: "top",
  },
  cancelModalActionsRow: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: moderateScale(10),
  },
  cancelModalDismissBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
  },
  cancelModalDismissText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#64748B",
  },
  cancelModalConfirmBtn: {
    flex: 2,
    backgroundColor: "#DC2626",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
  },
  cancelModalConfirmText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  paymentMethodSelectionBox: {
    marginBottom: moderateScale(12),
  },
  paymentSelectionTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#0F766E",
    marginBottom: moderateScale(8),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentToggleRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: moderateScale(10),
  },
  paymentOptionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(10),
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  paymentOptionBtnActiveCash: {
    backgroundColor: "#F0FDF4",
    borderColor: "#16A34A",
  },
  paymentOptionBtnActiveQr: {
    backgroundColor: "#E6F4F6",
    borderColor: "#016073",
  },
  paymentOptionBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#475569",
  },
  paymentOptionBtnTextActiveCash: {
    color: "#15803D",
  },
  paymentOptionBtnTextActiveQr: {
    color: "#016073",
  },
  paymentOptionSubText: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: scale(1),
  },
  cashNoticeBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: scale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: moderateScale(10),
  },
  cashNoticeTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#15803D",
  },
  cashNoticeText: {
    fontSize: moderateScale(11),
    color: "#166534",
    marginTop: scale(3),
    lineHeight: scale(15),
  },
  qrDisplayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1.5,
    borderColor: "#016073",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  qrHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  qrStoreTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#016073",
  },
  qrExplainer: {
    fontSize: moderateScale(10.5),
    color: "#475569",
    textAlign: "center",
    marginTop: scale(4),
    marginBottom: scale(8),
    lineHeight: scale(14),
  },
  qrImageContainer: {
    width: scale(160),
    height: scale(160),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: scale(4),
  },
  qrCodeImage: {
    width: "100%",
    height: "100%",
  },
  qrPlaceholderBox: {
    alignItems: "center",
    paddingHorizontal: scale(10),
  },
  qrPlaceholderText: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    textAlign: "center",
    marginTop: scale(4),
  },
  upiDetailsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    marginTop: scale(8),
  },
  upiPillLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#475569",
  },
  upiPillValue: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#0F172A",
  },
  qrAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(8),
  },
  qrAmountLabel: {
    fontSize: moderateScale(12),
    color: "#475569",
    fontWeight: "600",
  },
  qrAmountValue: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F766E",
  },
  qrVerifyNotice: {
    fontSize: moderateScale(10),
    color: "#D97706",
    fontWeight: "600",
    marginTop: scale(8),
    textAlign: "center",
  },
  prepaidNoticeBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: scale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: moderateScale(10),
  },
  prepaidNoticeTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#15803D",
  },
  prepaidNoticeText: {
    fontSize: moderateScale(11),
    color: "#166534",
    marginTop: scale(2),
  },
});
