import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  getNearbyStoresApi,
  NearbyStore,
} from "@/store/services/vendorService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NearbyStoresModalProps {
  visible: boolean;
  onClose: () => void;
  customerLat?: number | null;
  customerLng?: number | null;
  customerAddress?: string;
  onChangeLocation?: () => void;
  onSelectStore?: (store: NearbyStore) => void;
}

export default function NearbyStoresModal({
  visible,
  onClose,
  customerLat,
  customerLng,
  customerAddress,
  onChangeLocation,
  onSelectStore,
}: NearbyStoresModalProps) {
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "deliverable" | "open">("all");
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Determine effective coordinates: customerLat/customerLng or fallback liveCoords
  const effectiveLat = customerLat || liveCoords?.lat;
  const effectiveLng = customerLng || liveCoords?.lng;

  // Fetch nearby stores when visible
  useEffect(() => {
    if (!visible) return;

    const loadStores = async () => {
      setLoading(true);
      setErrorMessage(null);

      let targetLat = customerLat;
      let targetLng = customerLng;

      // If coordinates not provided in props, try getting device location
      if (!targetLat || !targetLng) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            targetLat = loc.coords.latitude;
            targetLng = loc.coords.longitude;
            setLiveCoords({ lat: targetLat, lng: targetLng });
          }
        } catch (locErr) {
          console.warn("[NearbyStoresModal] Location lookup error:", locErr);
        }
      }

      if (!targetLat || !targetLng) {
        setLoading(false);
        setErrorMessage("Please set your delivery location to view nearest stores.");
        return;
      }

      try {
        const response = await getNearbyStoresApi(targetLat, targetLng, true);
        if (response.success && Array.isArray(response.data)) {
          setStores(response.data);
        } else {
          setStores([]);
        }
      } catch (err: any) {
        console.error("[NearbyStoresModal] Failed to fetch nearby stores:", err);
        setErrorMessage(
          err.response?.data?.message || err.message || "Failed to load nearby stores."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [visible, customerLat, customerLng]);

  // Filtered store list
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // Search filter
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName = store.storeName?.toLowerCase().includes(q);
        const matchAddr = store.shippingLocations?.warehouseAddress
          ?.toLowerCase()
          .includes(q);
        const matchCat = store.businessDetails?.categories?.some((c) =>
          c.toLowerCase().includes(q)
        );
        if (!matchName && !matchAddr && !matchCat) return false;
      }

      // Tab filter
      if (activeFilter === "deliverable") {
        return store.isWithinRadius && store.isStoreOpen !== false;
      }
      if (activeFilter === "open") {
        return store.isStoreOpen !== false;
      }
      return true;
    });
  }, [stores, searchQuery, activeFilter]);

  const handleRefresh = async () => {
    if (!effectiveLat || !effectiveLng) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await getNearbyStoresApi(effectiveLat, effectiveLng, true);
      if (response.success && Array.isArray(response.data)) {
        setStores(response.data);
      }
    } catch (err: any) {
      setErrorMessage("Failed to refresh stores.");
    } finally {
      setLoading(false);
    }
  };

  const deliverableCount = useMemo(
    () => stores.filter((s) => s.isWithinRadius && s.isStoreOpen !== false).length,
    [stores]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouch} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetCard}>
          {/* Pull Handle */}
          <View style={styles.pullHandle} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.headerTitle}>Nearest Stores</Text>
                {stores.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{stores.length}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSub}>
                Calculated by distance from your current location
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.refreshButton}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Feather
                name="refresh-cw"
                size={scale(18)}
                color={loading ? "#94A3B8" : "#008080"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={scale(22)} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Customer Current Coordinates & Location Banner */}
          <View style={styles.locationBanner}>
            <View style={styles.locationBannerIconBox}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={scale(20)}
                color="#008080"
              />
            </View>
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>YOUR LOCATION:</Text>
                {effectiveLat && effectiveLng ? (
                  <Text style={styles.coordValue}>
                    {effectiveLat.toFixed(4)}° N, {effectiveLng.toFixed(4)}° E
                  </Text>
                ) : (
                  <Text style={styles.coordValue}>GPS not set</Text>
                )}
              </View>
              <Text style={styles.addressText} numberOfLines={1}>
                {customerAddress || "Baneshwor, Kathmandu, Bagmati, Nepal"}
              </Text>
            </View>
            {onChangeLocation && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onChangeLocation();
                }}
                style={styles.changeLocBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.changeLocBtnText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={scale(16)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search store name, area or category..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={scale(16)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "all" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("all")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === "all" && styles.filterChipTextActive,
                ]}
              >
                All Nearby ({stores.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "deliverable" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("deliverable")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === "deliverable" && styles.filterChipTextActive,
                ]}
              >
                ⚡ Delivering to Me ({deliverableCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "open" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("open")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === "open" && styles.filterChipTextActive,
                ]}
              >
                Open Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stores List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#008080" />
                <Text style={styles.loadingText}>Calculating distance to nearby stores...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons
                  name="map-marker-alert-outline"
                  size={scale(36)}
                  color="#DC2626"
                />
                <Text style={styles.errorTitle}>Location Required</Text>
                <Text style={styles.errorSub}>{errorMessage}</Text>
                {onChangeLocation && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onChangeLocation();
                    }}
                    style={styles.retryButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.retryButtonText}>Set Delivery Location</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : filteredStores.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name="storefront-remove-outline"
                  size={scale(44)}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTitle}>No Stores Found</Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? "No partner stores match your search criteria."
                    : "No partner stores found within range of your current location."}
                </Text>
                {onChangeLocation && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onChangeLocation();
                    }}
                    style={styles.retryButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.retryButtonText}>Change Delivery Address</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredStores.map((store, index) => {
                const distanceText =
                  store.distanceKm != null
                    ? `${store.distanceKm.toFixed(1)} km away`
                    : "Distance unavailable";

                const estDeliveryMins =
                  store.distanceKm != null
                    ? `${10 + Math.round(store.distanceKm * 2)}-${
                        15 + Math.round(store.distanceKm * 3)
                      } mins`
                    : "20-30 mins";

                const isDeliverable =
                  store.isWithinRadius && store.isStoreOpen !== false;

                return (
                  <TouchableOpacity
                    key={store._id || index}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (onSelectStore) {
                        onSelectStore(store);
                      }
                      onClose();
                    }}
                    style={[
                      styles.storeCard,
                      isDeliverable ? styles.storeCardDeliverable : styles.storeCardOutside,
                    ]}
                  >
                    {/* Top Row: Store Name & Distance Pill */}
                    <View style={styles.storeTopRow}>
                      <View style={styles.storeIconWrap}>
                        <MaterialCommunityIcons
                          name="storefront"
                          size={scale(22)}
                          color="#008080"
                        />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: scale(10) }}>
                        <Text style={styles.storeNameText} numberOfLines={1}>
                          {store.storeName}
                        </Text>
                        <View style={styles.statusDotRow}>
                          <View
                            style={[
                              styles.liveDot,
                              {
                                backgroundColor:
                                  store.isStoreOpen !== false ? "#10B981" : "#94A3B8",
                              },
                            ]}
                          />
                          <Text style={styles.liveDotText}>
                            {store.isStoreOpen !== false ? "Open Now" : "Closed"}
                          </Text>
                          <Text style={styles.dotDivider}>•</Text>
                          <Text style={styles.etaText}>⚡ {estDeliveryMins}</Text>
                        </View>
                      </View>

                      {/* Distance Badge */}
                      <View style={styles.distanceBadge}>
                        <MaterialCommunityIcons
                          name="map-marker-distance"
                          size={scale(14)}
                          color="#008080"
                        />
                        <Text style={styles.distanceBadgeText}>{distanceText}</Text>
                      </View>
                    </View>

                    {/* Store Address */}
                    <View style={styles.addressRow}>
                      <Feather
                        name="map-pin"
                        size={scale(12)}
                        color="#64748B"
                        style={{ marginTop: scale(2) }}
                      />
                      <Text style={styles.storeAddressText} numberOfLines={2}>
                        {store.shippingLocations?.warehouseAddress ||
                          store.sellerDetails?.address ||
                          "Local Warehouse"}
                        {store.shippingLocations?.city
                          ? `, ${store.shippingLocations.city}`
                          : ""}
                        {store.shippingLocations?.pincode
                          ? ` - ${store.shippingLocations.pincode}`
                          : ""}
                      </Text>
                    </View>

                    {/* Bottom Status & Radius Info */}
                    <View style={styles.storeBottomRow}>
                      {isDeliverable ? (
                        <View style={styles.deliverableTag}>
                          <Ionicons
                            name="checkmark-circle"
                            size={scale(14)}
                            color="#047857"
                          />
                          <Text style={styles.deliverableTagText}>
                            Delivering to your location
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.outsideTag}>
                          <MaterialCommunityIcons
                            name="map-marker-radius"
                            size={scale(14)}
                            color="#B45309"
                          />
                          <Text style={styles.outsideTagText}>
                            Beyond Delivery Radius (Max {store.deliveryRadiusKm || 5} km)
                          </Text>
                        </View>
                      )}

                      <View style={styles.radiusPill}>
                        <Text style={styles.radiusPillText}>
                          Max {store.deliveryRadiusKm || 5} km
                        </Text>
                      </View>
                    </View>

                    {/* Category Tags if available */}
                    {store.businessDetails?.categories &&
                      store.businessDetails.categories.length > 0 && (
                        <View style={styles.catTagsRow}>
                          {store.businessDetails.categories.slice(0, 3).map((cat, cIdx) => (
                            <View key={cIdx} style={styles.catTag}>
                              <Text style={styles.catTagText}>{cat}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: scale(10),
    paddingBottom: Platform.OS === "ios" ? scale(35) : scale(20),
    paddingHorizontal: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  pullHandle: {
    width: scale(38),
    height: scale(4.5),
    backgroundColor: "#CBD5E1",
    borderRadius: scale(3),
    alignSelf: "center",
    marginBottom: scale(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(10),
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  countBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#0284C7",
  },
  headerSub: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  refreshButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E6F4EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(6),
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: scale(10),
    marginBottom: scale(10),
  },
  locationBannerIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E6F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  coordLabel: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#008080",
    letterSpacing: 0.5,
  },
  coordValue: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F172A",
  },
  addressText: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    marginTop: scale(2),
  },
  changeLocBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  changeLocBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#008080",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: scale(12),
    height: scale(42),
    marginBottom: scale(10),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  filterRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(12),
  },
  filterChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#008080",
    borderColor: "#008080",
  },
  filterChipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: scale(30),
  },
  centerBox: {
    paddingVertical: scale(40),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "500",
  },
  errorBox: {
    paddingVertical: scale(30),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(20),
  },
  errorTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#991B1B",
    marginTop: scale(8),
  },
  errorSub: {
    fontSize: moderateScale(12),
    color: "#7F1D1D",
    textAlign: "center",
    marginTop: scale(4),
  },
  emptyBox: {
    paddingVertical: scale(35),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#334155",
    marginTop: scale(8),
  },
  emptySub: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    marginTop: scale(4),
  },
  retryButton: {
    marginTop: scale(14),
    backgroundColor: "#008080",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  storeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    borderWidth: 1.5,
    padding: scale(12),
    marginBottom: scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storeCardDeliverable: {
    borderColor: "#E2E8F0",
  },
  storeCardOutside: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFDFD",
  },
  storeTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeIconWrap: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(10),
    backgroundColor: "#E6F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  storeNameText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(3),
    gap: scale(5),
  },
  liveDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  liveDotText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#475569",
  },
  dotDivider: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
  },
  etaText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#059669",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    gap: scale(4),
  },
  distanceBadgeText: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#0F766E",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: scale(8),
    gap: scale(5),
    paddingHorizontal: scale(2),
  },
  storeAddressText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#64748B",
    lineHeight: moderateScale(16),
  },
  storeBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  deliverableTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#ECFDF5",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  deliverableTagText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#065F46",
  },
  outsideTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  outsideTagText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#92400E",
  },
  radiusPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  radiusPillText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#64748B",
  },
  catTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginTop: scale(8),
  },
  catTag: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  catTagText: {
    fontSize: moderateScale(10),
    color: "#475569",
    fontWeight: "500",
  },
});
