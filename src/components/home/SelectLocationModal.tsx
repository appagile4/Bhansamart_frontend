import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAddresses,
  setSelectedAddress,
} from "@/store/slices/addressSlice";
import { SavedAddress } from "@/store/services/addressService";
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

  const { addresses, selectedAddress, loading } = useAppSelector(
    (state) => state.address
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      dispatch(fetchAddresses());
      Location.getForegroundPermissionsAsync().then(({ status }) => {
        setIsLocationEnabled(status === "granted");
      });
    }
  }, [visible, dispatch]);

  const handleEnableLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setIsLocationEnabled(true);
        handleUseCurrentLocation();
      } else {
        setIsLocationEnabled(false);
      }
    } catch {
      setIsLocationEnabled(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocationEnabled(false);
        Alert.alert(
          "Permission Denied",
          "Please enable location permission in settings."
        );
        return;
      }
      setIsLocationEnabled(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const results = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      let area = "Current Location";
      let fullAddress = "Kathmandu, Bagmati, Nepal";

      if (results && results.length > 0) {
        const item = results[0];
        area = item.name || item.street || item.district || item.subregion || "Current Location";
        fullAddress = [
          item.city || item.subregion || "Kathmandu",
          item.country || "Nepal",
        ]
          .filter(Boolean)
          .join(", ");
      }

      const formattedLocation = `${area}, ${fullAddress}`;

      dispatch(
        setSelectedAddress({
          id: "current-location",
          type: "Other",
          addressLine: formattedLocation,
          phone: "",
        })
      );

      const currentLocItem: LocationItem = {
        id: "loc-current",
        title: area,
        address: formattedLocation,
      };

      onSelectLocation?.(currentLocItem);
      onClose();
    } catch (e) {
      console.log("Current location error:", e);
      Alert.alert("Location", "Could not fetch current GPS coordinates.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleAddNewAddress = () => {
    onClose();
    router.push("/Screens/Profile/add-address" as any);
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    dispatch(setSelectedAddress(addr));
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
      addr.type.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getAddressBg = (type: string) => {
    switch (type) {
      case "Work":
        return "#E0F2FE";
      case "Other":
        return "#EDE9FE";
      default:
        return "#F4FBEA";
    }
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
        <View style={styles.sheetCard}>
          {/* Top Pull Handle */}
          <View style={styles.pullHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Device Location Not Enabled Notice Banner */}
            {isLocationEnabled === false && (
              <View style={styles.noticeBanner}>
                <View style={styles.noticeIconWrap}>
                  <MaterialCommunityIcons
                    name="map-marker-off-outline"
                    size={scale(24)}
                    color="#1E293B"
                  />
                </View>

                <View style={styles.noticeTextGroup}>
                  <Text style={styles.noticeTitle}>
                    Device Location not enabled
                  </Text>
                  <Text style={styles.noticeSubtitle}>
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
              <Text style={styles.mainTitle}>Select Delivery Location</Text>
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
            <View style={styles.searchBarContainer}>
              <Feather name="search" size={scale(18)} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area, landmark, saved address..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={scale(18)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* 4. Action Card (Use Current Location & Add New Address) */}
            <View style={styles.actionCard}>
              {/* Use current location row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
                style={styles.actionRow}
              >
                <View style={styles.actionLeft}>
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#265935" />
                  ) : (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={scale(20)}
                      color="#265935"
                    />
                  )}
                  <Text style={styles.actionText}>
                    {isLocating ? "Fetching GPS location..." : "Use current location"}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={scale(18)}
                  color="#64748B"
                />
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.actionDivider} />

              {/* Add New address row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddNewAddress}
                style={styles.actionRow}
              >
                <View style={styles.actionLeft}>
                  <Feather name="plus" size={scale(20)} color="#265935" />
                  <Text style={styles.actionText}>Add new address</Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={scale(18)}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* 5. Saved Addresses Section */}
            <Text style={styles.recentSectionTitle}>Your Saved Addresses</Text>

            {loading && addresses.length === 0 ? (
              <View style={{ paddingVertical: scale(20), alignItems: "center" }}>
                <ActivityIndicator size="small" color="#008080" />
              </View>
            ) : filteredAddresses.length > 0 ? (
              filteredAddresses.map((item) => {
                const isSelected =
                  selectedAddress?.id === item.id ||
                  selectedAddress?._id === item.id ||
                  (selectedAddress?.id && selectedAddress?.id === item._id);

                return (
                  <TouchableOpacity
                    key={item.id || item._id}
                    activeOpacity={0.75}
                    onPress={() => handleSelectSavedAddress(item)}
                    style={[
                      styles.locationCard,
                      isSelected && styles.locationCardSelected,
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
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                        <Text style={styles.locationName}>{item.type}</Text>
                        {item.isDefault && (
                          <View style={styles.defaultPill}>
                            <Text style={styles.defaultPillText}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.locationAddress} numberOfLines={2}>
                        {item.addressLine}
                      </Text>
                    </View>

                    {/* Checkmark or Chevron */}
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
                        color="#64748B"
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noSavedBox}>
                <Text style={styles.noSavedText}>No saved addresses found</Text>
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
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  actionText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#2D6A4F",
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
    marginBottom: scale(10),
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
