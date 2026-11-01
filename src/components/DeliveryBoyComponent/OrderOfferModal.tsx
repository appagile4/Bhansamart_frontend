import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  acceptOfferedOrder,
  clearIncomingOffer,
  fetchActiveAssignment,
  rejectOfferedOrder,
} from "@/store/slices/deliverySlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const isValidCoord = (lat?: any, lng?: any): boolean => {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180 &&
    (nLat !== 0 || nLng !== 0)
  );
};

export const OrderOfferModal = memo(function OrderOfferModal() {
  const dispatch = useAppDispatch();
  const { offeredAssignment, partner, actionLoading } = useAppSelector(
    (state) => state.delivery
  );

  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);

  // Synchronize countdown timer whenever an incoming offer is received or updated
  useEffect(() => {
    if (offeredAssignment) {
      const initialSeconds = Math.max(
        1,
        Number(offeredAssignment.timeoutSeconds) || 60
      );
      setTimeLeft(initialSeconds);

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
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [offeredAssignment, dispatch]);

  // Compute safe coordinates and map region
  const mapData = useMemo(() => {
    if (!offeredAssignment) return null;

    // 1. Partner Coordinates
    let boyLat = 29.0032;
    let boyLng = 77.7578;
    if (
      Array.isArray(offeredAssignment.partnerLocation) &&
      isValidCoord(offeredAssignment.partnerLocation[1], offeredAssignment.partnerLocation[0])
    ) {
      boyLng = Number(offeredAssignment.partnerLocation[0]);
      boyLat = Number(offeredAssignment.partnerLocation[1]);
    } else if (
      Array.isArray(partner?.currentLocation?.coordinates) &&
      isValidCoord(partner.currentLocation.coordinates[1], partner.currentLocation.coordinates[0])
    ) {
      boyLng = Number(partner.currentLocation.coordinates[0]);
      boyLat = Number(partner.currentLocation.coordinates[1]);
    }

    // 2. Store Coordinates
    let storeLat = 29.0032;
    let storeLng = 77.7578;
    if (
      Array.isArray(offeredAssignment.pickup?.coordinates) &&
      isValidCoord(offeredAssignment.pickup.coordinates[1], offeredAssignment.pickup.coordinates[0])
    ) {
      storeLng = Number(offeredAssignment.pickup.coordinates[0]);
      storeLat = Number(offeredAssignment.pickup.coordinates[1]);
    }

    // 3. Drop Coordinates
    let dropLat = 29.006;
    let dropLng = 77.76;
    if (
      Array.isArray(offeredAssignment.drop?.coordinates) &&
      isValidCoord(offeredAssignment.drop.coordinates[1], offeredAssignment.drop.coordinates[0])
    ) {
      dropLng = Number(offeredAssignment.drop.coordinates[0]);
      dropLat = Number(offeredAssignment.drop.coordinates[1]);
    }

    const partnerCoord = { latitude: boyLat, longitude: boyLng };
    const storeCoord = { latitude: storeLat, longitude: storeLng };
    const dropCoord = { latitude: dropLat, longitude: dropLng };

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

  // Handle Accept
  const handleAccept = useCallback(async () => {
    if (!offeredAssignment) return;
    try {
      await dispatch(acceptOfferedOrder(offeredAssignment.assignmentId)).unwrap();
      dispatch(fetchActiveAssignment());
    } catch (err: any) {
      Alert.alert(
        "Offer Expired",
        err || "This delivery request has expired or was reassigned to another nearby partner."
      );
    }
  }, [offeredAssignment, dispatch]);

  // Handle Decline
  const handleDecline = useCallback(async () => {
    if (!offeredAssignment) return;
    try {
      await dispatch(
        rejectOfferedOrder({
          assignmentId: offeredAssignment.assignmentId,
          reason: "Delivery partner declined",
        })
      );
    } catch (_) {}
    dispatch(clearIncomingOffer());
  }, [offeredAssignment, dispatch]);

  const onMapReady = useCallback(() => {
    if (mapRef.current && mapData?.allCoords?.length) {
      try {
        mapRef.current.fitToCoordinates(mapData.allCoords, {
          edgePadding: { top: 35, right: 35, bottom: 35, left: 35 },
          animated: true,
        });
      } catch (_) {}
    }
  }, [mapData]);

  if (!offeredAssignment) return null;

  const estimatedEarnings = offeredAssignment.estimatedEarnings || 60;
  const storeName = offeredAssignment.pickup?.storeName || "Partner Store";
  const storeAddress = offeredAssignment.pickup?.address || "Pickup Warehouse";
  const storeDistance = offeredAssignment.pickup?.distanceKm || offeredAssignment.estimatedDistanceKm || null;
  const customerName = offeredAssignment.drop?.customerName || "Customer";
  const dropAddress = offeredAssignment.drop?.address || "Delivery destination";
  const itemsCount = offeredAssignment.itemsCount || 1;
  const orderNumber = offeredAssignment.orderNumber || "BM-ORDER";

  return (
    <Modal
      visible={!!offeredAssignment}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleDecline}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cardContainer}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header: Timer Badge + Estimated Pay */}
            <View style={styles.headerRow}>
              <View style={styles.timerBadge}>
                <Ionicons name="timer-outline" size={scale(18)} color="#DC2626" />
                <Text style={styles.timerText}>{timeLeft}s remaining</Text>
              </View>
              <View style={styles.earningsWrap}>
                <Text style={styles.earningsAmount}>₹{estimatedEarnings}</Text>
                <Text style={styles.earningsLabel}>Estimated Pay</Text>
              </View>
            </View>

            {/* Title & Order Badge */}
            <Text style={styles.title}>New Delivery Request! 🛵</Text>
            <View style={styles.orderBadgeRow}>
              <View style={styles.orderNumberTag}>
                <Text style={styles.orderNumberText}>Order #{orderNumber}</Text>
              </View>
              <Text style={styles.itemsCountText}>{itemsCount} Item(s)</Text>
              {offeredAssignment.tier ? (
                <View style={styles.tierTag}>
                  <Text style={styles.tierTagText}>{offeredAssignment.tier.replace("_", " ")}</Text>
                </View>
              ) : null}
            </View>

            {/* Interactive Route Map (Platform !== 'web') */}
            {Platform.OS !== "web" && mapData ? (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.mapView}
                  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                  initialRegion={mapData.initialRegion}
                  onMapReady={onMapReady}
                  showsCompass={false}
                  toolbarEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker coordinate={mapData.partnerCoord} title="My Location">
                    <View style={styles.partnerPin}>
                      <Text style={styles.pinEmoji}>🛵</Text>
                    </View>
                  </Marker>
                  <Marker coordinate={mapData.storeCoord} title={storeName} description={storeAddress}>
                    <View style={styles.storePin}>
                      <Text style={styles.pinEmoji}>🏬</Text>
                    </View>
                  </Marker>
                  <Marker coordinate={mapData.dropCoord} title={customerName} description={dropAddress}>
                    <View style={styles.customerPin}>
                      <Text style={styles.pinEmoji}>🏠</Text>
                    </View>
                  </Marker>
                  <Polyline
                    coordinates={mapData.leg1Coords}
                    strokeColor="#0F766E"
                    strokeWidth={3}
                    lineDashPattern={[6, 4]}
                  />
                  <Polyline
                    coordinates={mapData.leg2Coords}
                    strokeColor="#2563EB"
                    strokeWidth={3.5}
                  />
                </MapView>
                <View style={styles.mapLegendOverlay}>
                  <Text style={styles.mapLegendItem}>🛵 You</Text>
                  <Feather name="arrow-right" size={scale(11)} color="#0F766E" />
                  <Text style={styles.mapLegendItem}>🏬 Store</Text>
                  <Feather name="arrow-right" size={scale(11)} color="#2563EB" />
                  <Text style={styles.mapLegendItem}>🏠 Drop</Text>
                </View>
              </View>
            ) : null}

            {/* Pickup Location Info */}
            <View style={styles.locationRow}>
              <View style={styles.pickupDot} />
              <View style={styles.locationDetails}>
                <View style={styles.locationHeaderLine}>
                  <Text style={styles.locationCategoryLabel}>PICKUP STORE</Text>
                  {storeDistance ? (
                    <Text style={styles.distanceBadge}>~{storeDistance} km away</Text>
                  ) : null}
                </View>
                <Text style={styles.locationName} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {storeAddress}
                </Text>
              </View>
            </View>

            {/* Drop Location Info */}
            <View style={styles.locationRow}>
              <View style={styles.dropDot} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationCategoryLabel}>DELIVER TO</Text>
                <Text style={styles.locationName} numberOfLines={1}>
                  {customerName}
                </Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {dropAddress}
                </Text>
              </View>
            </View>

            {/* Action Buttons: Decline / Accept */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
                activeOpacity={0.85}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={scale(18)} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(26),
    borderTopRightRadius: scale(26),
    maxHeight: SCREEN_HEIGHT * 0.92,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  scrollContent: {
    padding: scale(20),
    paddingBottom: Platform.OS === "ios" ? moderateScale(36) : moderateScale(26),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(20),
    gap: scale(5),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  timerText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#DC2626",
  },
  earningsWrap: {
    alignItems: "flex-end",
  },
  earningsAmount: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#059669",
  },
  earningsLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#64748B",
  },
  title: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(6),
  },
  orderBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: moderateScale(14),
  },
  orderNumberTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  orderNumberText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#334155",
  },
  itemsCountText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
  },
  tierTag: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
  },
  tierTagText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#0369A1",
    textTransform: "uppercase",
  },
  mapContainer: {
    width: "100%",
    height: scale(175),
    borderRadius: scale(14),
    overflow: "hidden",
    marginVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  partnerPin: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  storePin: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  customerPin: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  pinEmoji: {
    fontSize: scale(13),
  },
  mapLegendOverlay: {
    position: "absolute",
    bottom: scale(6),
    left: scale(8),
    right: scale(8),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: moderateScale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mapLegendItem: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#334155",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(12),
  },
  pickupDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: "#0F766E",
    marginTop: moderateScale(4),
  },
  dropDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: "#2563EB",
    marginTop: moderateScale(4),
  },
  locationDetails: {
    flex: 1,
    marginLeft: scale(10),
  },
  locationHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationCategoryLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  distanceBadge: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#0F766E",
  },
  locationName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: moderateScale(1),
  },
  locationAddress: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginTop: moderateScale(14),
  },
  declineButton: {
    flex: 1,
    height: scale(46),
    backgroundColor: "#F1F5F9",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  declineButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#64748B",
  },
  acceptButton: {
    flex: 2,
    height: scale(46),
    backgroundColor: "#0F766E",
    borderRadius: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    elevation: 3,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  acceptButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

export default OrderOfferModal;
