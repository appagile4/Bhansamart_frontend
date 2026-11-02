import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { SavedAddress } from "@/store/services/addressService";
import {
  detectCurrentLocation,
  fetchAddresses,
  formatGeocodedAddress,
  setSelectedAddress,
  setUserCoordinates,
} from "@/store/slices/addressSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface LocationItem {
  id: string;
  title: string;
  address: string;
}

export interface SearchPlaceResult {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface SelectLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation?: (location: LocationItem) => void;
  onEnableLocation?: () => void;
}

export default function SelectLocationModal({
  visible,
  onClose,
  onSelectLocation,
  onEnableLocation,
}: SelectLocationModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    addresses,
    selectedAddress,
    selectedAddressId,
    selectedLocationType,
    currentGpsLocation,
    activeDisplayLocation,
    permissionStatus,
    isLocationLoading,
    loading,
  } = useAppSelector((state) => state.address);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeResults, setPlaceResults] = useState<SearchPlaceResult[]>([]);

  useEffect(() => {
    if (visible) {
      dispatch(fetchAddresses());
    }
  }, [visible, dispatch]);

  // Real-time Place Geocoding Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setPlaceResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const geoResults = await Location.geocodeAsync(trimmed);
        if (geoResults && geoResults.length > 0) {
          const topResults = geoResults.slice(0, 5);
          const resolved: SearchPlaceResult[] = await Promise.all(
            topResults.map(async (pos, idx) => {
              try {
                const rev = await Location.reverseGeocodeAsync({
                  latitude: pos.latitude,
                  longitude: pos.longitude,
                });
                if (rev && rev.length > 0) {
                  const item = rev[0];
                  const area =
                    item.name && item.name !== item.streetNumber && item.name !== item.city
                      ? item.name
                      : item.street || item.subregion || item.city || trimmed;
                  const formatted = formatGeocodedAddress(item);
                  return {
                    id: `place-${idx}-${pos.latitude.toFixed(4)}-${pos.longitude.toFixed(4)}`,
                    title: area,
                    address: formatted,
                    latitude: pos.latitude,
                    longitude: pos.longitude,
                  };
                }
              } catch {}
              return {
                id: `place-${idx}-${pos.latitude.toFixed(4)}-${pos.longitude.toFixed(4)}`,
                title: trimmed,
                address: `${trimmed} (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`,
                latitude: pos.latitude,
                longitude: pos.longitude,
              };
            })
          );
          setPlaceResults(resolved);
        } else {
          setPlaceResults([]);
        }
      } catch (err) {
        setPlaceResults([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleEnableLocation = async () => {
    try {
      const resultAction = await dispatch(
        detectCurrentLocation({
          forceGpsAsActive: true,
          promptIfUndetermined: true,
        }),
      );
      if (detectCurrentLocation.fulfilled.match(resultAction)) {
        onSelectLocation?.({
          id: "current-location",
          title: "Current Location",
          address: resultAction.payload.readableAddress,
        });
        onClose();
      } else if (detectCurrentLocation.rejected.match(resultAction)) {
        const err = resultAction.payload as any;
        Alert.alert(
          "Location Access",
          err?.message ||
            "Location permission was not granted. You can select a saved address below.",
          [{ text: "OK" }],
        );
      }
    } catch {
      Alert.alert("Location", "Could not enable location access.");
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const resultAction = await dispatch(
        detectCurrentLocation({
          forceGpsAsActive: true,
          promptIfUndetermined: true,
        }),
      );
      if (detectCurrentLocation.fulfilled.match(resultAction)) {
        onSelectLocation?.({
          id: "current-location",
          title: "Current Location",
          address: resultAction.payload.readableAddress,
        });
        onClose();
      } else if (detectCurrentLocation.rejected.match(resultAction)) {
        const err = resultAction.payload as any;
        Alert.alert(
          "Location Access",
          err?.message ||
            "Could not detect GPS location. Please check your settings or select a saved address.",
          [{ text: "OK" }],
        );
      }
    } catch (e) {
      Alert.alert("Location", "Could not fetch current GPS coordinates.");
    }
  };

  const handleAddNewAddress = () => {
    onClose();
    router.push("/Screens/Profile/add-address" as any);
  };

  const handleSelectPlace = (place: SearchPlaceResult) => {
    dispatch(
      setUserCoordinates({
        latitude: place.latitude,
        longitude: place.longitude,
        addressLine: place.address,
      }),
    );
    onSelectLocation?.({
      id: place.id,
      title: place.title,
      address: place.address,
    });
    onClose();
  };

  const handleSelectSavedAddress = async (addr: SavedAddress) => {
    let lat = addr.latitude;
    let lng = addr.longitude;

    // If saved address coordinates are missing, resolve them automatically
    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      try {
        const queries = [
          addr.addressLine,
          [addr.houseNo, addr.street, addr.city].filter(Boolean).join(", "),
          [addr.street, addr.city].filter(Boolean).join(", "),
          addr.city,
        ].filter((q): q is string => Boolean(q && q.trim().length > 0));

        for (const q of queries) {
          try {
            const geo = await Location.geocodeAsync(q);
            if (geo && geo.length > 0) {
              lat = geo[0].latitude;
              lng = geo[0].longitude;
              break;
            }
          } catch {}
        }
      } catch (e) {
        console.warn("Geocode saved address fallback failed:", e);
      }
    }

    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      const lower = (addr.addressLine + " " + (addr.city || "")).toLowerCase();
      if (lower.includes("dwarka") || lower.includes("dawarka")) {
        lat = 28.5921;
        lng = 77.0460;
      } else if (lower.includes("rohini")) {
        lat = 28.7212;
        lng = 77.1038;
      } else if (lower.includes("meerut")) {
        lat = 28.9845;
        lng = 77.7064;
      } else if (lower.includes("delhi")) {
        lat = 28.6139;
        lng = 77.2090;
      } else if (lower.includes("kathmandu")) {
        lat = 27.7172;
        lng = 85.3240;
      }
    }

    const addrWithCoords: SavedAddress = {
      ...addr,
      latitude: lat != null ? Number(lat) : undefined,
      longitude: lng != null ? Number(lng) : undefined,
    };

    dispatch(setSelectedAddress(addrWithCoords));
    onSelectLocation?.({
      id: addr.id || addr._id || "",
      title: addr.type,
      address: addr.addressLine,
    });
    onClose();
  };

  const filteredAddresses = addresses.filter(
    (addr) =>
      addr.addressLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "Work":
        return <Feather name="briefcase" size={scale(18)} color="#0284C7" />;
      case "Other":
        return <Feather name="map-pin" size={scale(18)} color="#7C3AED" />;
      default:
        return <Feather name="home" size={scale(18)} color="#2D6A4F" />;
    }
  };

  const isDark = theme.mode === "dark";

  const getAddressBg = (type: string) => {
    if (isDark) {
      switch (type) {
        case "Work":
          return "#132D42";
        case "Other":
          return "#2A1E45";
        default:
          return "#133123";
      }
    }
    switch (type) {
      case "Work":
        return "#E0F2FE";
      case "Other":
        return "#EDE9FE";
      default:
        return "#F4FBEA";
    }
  };

  const renderSavedAddressCard = (item: SavedAddress) => {
    const isSelected =
      selectedLocationType === "saved_address" &&
      (selectedAddress?.id === item.id ||
        selectedAddress?._id === item.id ||
        selectedAddressId === item.id ||
        selectedAddressId === item._id ||
        (selectedAddress?.id && selectedAddress?.id === item._id));

    return (
      <TouchableOpacity
        key={item.id || item._id}
        activeOpacity={0.75}
        onPress={() => handleSelectSavedAddress(item)}
        style={[
          styles.locationCard,
          isDark && {
            backgroundColor: "#1A242F",
            borderColor: "#2B3A4A",
          },
          isSelected && styles.locationCardSelected,
          isSelected &&
            isDark && {
              backgroundColor: "#122A26",
              borderColor: "#008080",
            },
        ]}
      >
        {/* Location Icon Badge */}
        <View
          style={[
            styles.locationIconBadge,
            { backgroundColor: getAddressBg(item.type) },
          ]}
        >
          {getAddressIcon(item.type)}
        </View>

        {/* Location Text Group */}
        <View style={styles.locationTextGroup}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: scale(6),
            }}
          >
            <Text
              style={[
                styles.locationName,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              {item.type}
            </Text>
            {item.isDefault && (
              <View style={styles.defaultPill}>
                <Text style={styles.defaultPillText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.locationAddress,
              isDark && { color: "#94A3B8" },
            ]}
            numberOfLines={2}
          >
            {item.addressLine}
          </Text>
        </View>

        {/* Checkmark or Chevron */}
        <View style={styles.locationRightAction}>
          {isSelected ? (
            <Ionicons
              name="checkmark-circle"
              size={scale(22)}
              color="#008080"
            />
          ) : (
            <Feather
              name="chevron-right"
              size={scale(18)}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop touch to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouch} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Card */}
        <View
          style={[styles.sheetCard, isDark && { backgroundColor: "#111820" }]}
        >
          {/* Top Pull Handle */}
          <View
            style={[
              styles.pullHandle,
              isDark && { backgroundColor: "#334155" },
            ]}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Device Location Not Enabled Notice Banner */}
            {permissionStatus === "denied" && (
              <View
                style={[
                  styles.noticeBanner,
                  isDark && {
                    backgroundColor: "#1A242F",
                    borderColor: "#2B3A4A",
                  },
                ]}
              >
                <View style={styles.noticeIconWrap}>
                  <MaterialCommunityIcons
                    name="map-marker-off-outline"
                    size={scale(24)}
                    color={isDark ? "#94A3B8" : "#1E293B"}
                  />
                </View>

                <View style={styles.noticeTextGroup}>
                  <Text
                    style={[styles.noticeTitle, isDark && { color: "#F8FAFC" }]}
                  >
                    Device Location not enabled
                  </Text>
                  <Text
                    style={[
                      styles.noticeSubtitle,
                      isDark && { color: "#94A3B8" },
                    ]}
                  >
                    Enable for precise delivery address
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleEnableLocation}
                  style={styles.enableButton}
                >
                  <Text style={styles.enableButtonText}>Enable</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Select Location Header */}
            <View style={styles.headerRow}>
              <Text style={[styles.mainTitle, isDark && { color: "#F8FAFC" }]}>
                Select Delivery Location
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push("/Screens/Profile/address" as any);
                }}
              >
                <Text style={styles.manageLinkText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Search Bar Input */}
            <View
              style={[
                styles.searchBarContainer,
                isDark && {
                  backgroundColor: "#1A242F",
                  borderColor: "#2B3A4A",
                },
              ]}
            >
              <Feather
                name="search"
                size={scale(18)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <TextInput
                style={[styles.searchInput, isDark && { color: "#F8FAFC" }]}
                placeholder="Search area, landmark, city, address..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {isSearchingPlaces && (
                <ActivityIndicator
                  size="small"
                  color="#008080"
                  style={{ marginRight: scale(4) }}
                />
              )}
              {searchQuery.length > 0 && !isSearchingPlaces && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={scale(18)}
                    color={isDark ? "#94A3B8" : "#94A3B8"}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* When user is actively searching: Show Place Results + Matching Saved */}
            {searchQuery.trim().length >= 2 ? (
              <View>
                {/* 1. Searching places indicator */}
                {isSearchingPlaces && (
                  <View
                    style={{
                      paddingVertical: scale(14),
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: scale(8),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: moderateScale(13),
                        color: isDark ? "#94A3B8" : "#64748B",
                      }}
                    >
                      Searching places for "{searchQuery}"...
                    </Text>
                  </View>
                )}

                {/* 2. Place Search Results */}
                {placeResults.length > 0 && (
                  <View style={{ marginBottom: scale(14) }}>
                    <Text
                      style={[
                        styles.recentSectionTitle,
                        isDark && { color: "#94A3B8" },
                      ]}
                    >
                      Places & Locations
                    </Text>
                    {placeResults.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        activeOpacity={0.75}
                        onPress={() => handleSelectPlace(place)}
                        style={[
                          styles.locationCard,
                          isDark && {
                            backgroundColor: "#1A242F",
                            borderColor: "#2B3A4A",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.locationIconBadge,
                            {
                              backgroundColor: isDark ? "#122A26" : "#E0F2FE",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="map-marker-radius-outline"
                            size={scale(20)}
                            color={isDark ? "#2DD4BF" : "#008080"}
                          />
                        </View>

                        <View style={styles.locationTextGroup}>
                          <Text
                            style={[
                              styles.locationName,
                              isDark && { color: "#F8FAFC" },
                            ]}
                          >
                            {place.title}
                          </Text>
                          <Text
                            style={[
                              styles.locationAddress,
                              isDark && { color: "#94A3B8" },
                            ]}
                            numberOfLines={2}
                          >
                            {place.address}
                          </Text>
                        </View>

                        <View style={styles.locationRightAction}>
                          <Feather
                            name="arrow-up-right"
                            size={scale(18)}
                            color={isDark ? "#94A3B8" : "#64748B"}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 3. Matching Saved Addresses */}
                {filteredAddresses.length > 0 && (
                  <View style={{ marginBottom: scale(14) }}>
                    <Text
                      style={[
                        styles.recentSectionTitle,
                        isDark && { color: "#94A3B8" },
                      ]}
                    >
                      Matching Saved Addresses
                    </Text>
                    {filteredAddresses.map((item) => renderSavedAddressCard(item))}
                  </View>
                )}

                {/* 4. Empty Result */}
                {placeResults.length === 0 &&
                  filteredAddresses.length === 0 &&
                  !isSearchingPlaces && (
                    <View style={styles.noSavedBox}>
                      <Text
                        style={[
                          styles.noSavedText,
                          isDark && { color: "#64748B" },
                        ]}
                      >
                        No places or saved addresses found for "{searchQuery}"
                      </Text>
                    </View>
                  )}
              </View>
            ) : (
              /* When Not Searching: Show Action Card & All Saved Addresses */
              <View>
                {/* 4. Action Card (Use Current Location & Add New Address) */}
                <View
                  style={[
                    styles.actionCard,
                    isDark && {
                      backgroundColor: "#1A242F",
                      borderColor: "#2B3A4A",
                    },
                  ]}
                >
                  {/* Use current location row */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleUseCurrentLocation}
                    disabled={isLocationLoading}
                    style={[
                      styles.actionRow,
                      selectedLocationType === "current_location" && {
                        backgroundColor: isDark ? "#0D261C" : "#F0FDF4",
                      },
                    ]}
                  >
                    <View style={styles.actionLeft}>
                      {isLocationLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#4ADE80" : "#265935"}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="crosshairs-gps"
                          size={scale(20)}
                          color={isDark ? "#4ADE80" : "#265935"}
                        />
                      )}
                      <View style={styles.actionTextWrap}>
                        <Text
                          style={[
                            styles.actionText,
                            isDark && { color: "#4ADE80" },
                          ]}
                        >
                          {isLocationLoading
                            ? "Detecting GPS location..."
                            : "Use current location"}
                        </Text>
                        {(currentGpsLocation || activeDisplayLocation) && (
                          <Text
                            style={[
                              styles.currentLocationSub,
                              isDark && { color: "#94A3B8" },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {currentGpsLocation || activeDisplayLocation}
                          </Text>
                        )}
                      </View>
                    </View>
                    {selectedLocationType === "current_location" ? (
                      <View style={styles.actionRightIcon}>
                        <Ionicons
                          name="checkmark-circle"
                          size={scale(20)}
                          color="#008080"
                        />
                      </View>
                    ) : (
                      <View style={styles.actionRightIcon}>
                        <Feather
                          name="chevron-right"
                          size={scale(18)}
                          color={isDark ? "#94A3B8" : "#64748B"}
                        />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View
                    style={[
                      styles.actionDivider,
                      isDark && { backgroundColor: "#2B3A4A" },
                    ]}
                  />

                  {/* Add New address row */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleAddNewAddress}
                    style={styles.actionRow}
                  >
                    <View style={styles.actionLeft}>
                      <Feather
                        name="plus"
                        size={scale(20)}
                        color={isDark ? "#4ADE80" : "#265935"}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          isDark && { color: "#4ADE80" },
                        ]}
                      >
                        Add new address
                      </Text>
                    </View>
                    <View style={styles.actionRightIcon}>
                      <Feather
                        name="chevron-right"
                        size={scale(18)}
                        color={isDark ? "#94A3B8" : "#64748B"}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* 5. Saved Addresses Section */}
                <Text
                  style={[
                    styles.recentSectionTitle,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Your Saved Addresses
                </Text>

                {loading && addresses.length === 0 ? (
                  <View
                    style={{
                      paddingVertical: scale(20),
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator size="small" color="#008080" />
                  </View>
                ) : addresses.length > 0 ? (
                  addresses.map((item) => renderSavedAddressCard(item))
                ) : (
                  <View style={styles.noSavedBox}>
                    <Text
                      style={[
                        styles.noSavedText,
                        isDark && { color: "#64748B" },
                      ]}
                    >
                      No saved addresses found
                    </Text>
                  </View>
                )}
              </View>
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
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: scale(10),
    paddingBottom: scale(30),
    paddingHorizontal: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  pullHandle: {
    width: scale(38),
    height: scale(4.5),
    backgroundColor: "#CBD5E1",
    borderRadius: scale(3),
    alignSelf: "center",
    marginBottom: scale(14),
  },
  scrollContent: {
    paddingBottom: scale(20),
  },
  noticeBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    paddingVertical: scale(11),
    paddingHorizontal: scale(12),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: scale(16),
  },
  noticeIconWrap: {
    marginRight: scale(10),
  },
  noticeTextGroup: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(1.5),
  },
  noticeSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "400",
  },
  enableButton: {
    backgroundColor: "#008080",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    marginLeft: scale(8),
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  mainTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  manageLinkText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#008080",
  },
  searchBarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(Platform.OS === "ios" ? 11 : 8),
    gap: scale(10),
    marginBottom: scale(14),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    color: "#0F172A",
    padding: 0,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: scale(18),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(13),
    paddingHorizontal: scale(14),
    width: "100%",
  },
  actionLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginRight: scale(12),
  },
  actionTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  actionRightIcon: {
    flexShrink: 0,
    width: scale(24),
    height: scale(24),
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#2D6A4F",
  },
  currentLocationSub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(2),
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: scale(44),
  },
  recentSectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#475569",
    marginBottom: scale(10),
  },
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
    width: "100%",
  },
  locationCardSelected: {
    borderColor: "#008080",
    backgroundColor: "#FAFFFD",
  },
  locationIconBadge: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  locationTextGroup: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: scale(10),
  },
  locationRightAction: {
    flexShrink: 0,
    width: scale(24),
    height: scale(24),
    alignItems: "center",
    justifyContent: "center",
  },
  locationName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(2),
  },
  defaultPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(5),
    paddingVertical: scale(1),
    borderRadius: scale(4),
  },
  defaultPillText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#15803D",
  },
  locationAddress: {
    fontSize: moderateScale(12),
    color: "#64748B",
    lineHeight: moderateScale(16),
  },
  noSavedBox: {
    paddingVertical: scale(20),
    alignItems: "center",
  },
  noSavedText: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    fontWeight: "500",
  },
});
