import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const DEFAULT_RECENT_LOCATIONS: LocationItem[] = [
  {
    id: "loc-1",
    title: "Baneshwor",
    address: "Kathmandu, Bagmati, Nepal",
  },
  {
    id: "loc-2",
    title: "Koteshwor",
    address: "Kathmandu, Bagmati, Nepal",
  },
  {
    id: "loc-3",
    title: "Pulchowk",
    address: "Lalitpur, Bagmati, Nepal",
  },
];

export default function SelectLocationModal({
  visible,
  onClose,
  onSelectLocation,
  onEnableLocation,
}: SelectLocationModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  const filteredLocations = DEFAULT_RECENT_LOCATIONS.filter(
    (loc) =>
      loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEnableLocation = () => {
    setIsLocationEnabled(true);
    onEnableLocation?.();
  };

  const handleUseCurrentLocation = () => {
    const currentLoc: LocationItem = {
      id: "loc-current",
      title: "Current Location",
      address: "Baneshwor, Kathmandu, Bagmati, Nepal",
    };
    onSelectLocation?.(currentLoc);
    onClose();
  };

  const handleAddNewAddress = () => {
    onClose();
    router.push("/Screens/Profile/add-address" as any);
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
            {!isLocationEnabled && (
              <View style={styles.noticeBanner}>
                {/* Slashed Location Pin Icon */}
                <View style={styles.noticeIconWrap}>
                  <MaterialCommunityIcons
                    name="map-marker-off-outline"
                    size={scale(24)}
                    color="#1E293B"
                  />
                </View>

                {/* Text Description */}
                <View style={styles.noticeTextGroup}>
                  <Text style={styles.noticeTitle}>
                    Device Location not enabled
                  </Text>
                  <Text style={styles.noticeSubtitle}>
                    Enable for a better delivery exprience
                  </Text>
                </View>

                {/* Enable Green Pill Button */}
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
            <Text style={styles.mainTitle}>Select Location</Text>

            {/* 3. Search Bar Input */}
            <View style={styles.searchBarContainer}>
              <Feather name="search" size={scale(18)} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for area, street name...."
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
                style={styles.actionRow}
              >
                <View style={styles.actionLeft}>
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={scale(20)}
                    color="#265935"
                  />
                  <Text style={styles.actionText}>Use current location</Text>
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
                  <Text style={styles.actionText}>Add New address</Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={scale(18)}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* 5. Recently Searched Locations Section */}
            <Text style={styles.recentSectionTitle}>
              Recently Searched Locations
            </Text>

            {/* Location Cards */}
            {filteredLocations.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => {
                  onSelectLocation?.(item);
                  onClose();
                }}
                style={styles.locationCard}
              >
                {/* Location Icon Badge */}
                <View style={styles.locationIconBadge}>
                  <Ionicons
                    name="location-sharp"
                    size={scale(20)}
                    color="#265935"
                  />
                </View>

                {/* Location Text Group */}
                <View style={styles.locationTextGroup}>
                  <Text style={styles.locationName}>{item.title}</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>

                {/* Chevron */}
                <Feather
                  name="chevron-right"
                  size={scale(18)}
                  color="#64748B"
                />
              </TouchableOpacity>
            ))}
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
    backgroundColor: "#265935",
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
  mainTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: scale(12),
    letterSpacing: -0.3,
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
    color: "#265935",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: scale(44),
  },
  recentSectionTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#64748B",
    marginBottom: scale(10),
  },
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: scale(12),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(10),
  },
  locationIconBadge: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(10),
    backgroundColor: "#EBF3EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  locationTextGroup: {
    flex: 1,
  },
  locationName: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(2),
  },
  locationAddress: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "400",
  },
});
