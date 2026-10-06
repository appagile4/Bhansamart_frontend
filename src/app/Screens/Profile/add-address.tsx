import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AddAddressScreen() {
  const theme = useTheme();

  // Selected address state
  const [currentArea, setCurrentArea] = useState("Baneshwor chok");
  const [currentCity, setCurrentCity] = useState("Baneshwor, kathmandu");
  const [searchQuery, setSearchQuery] = useState("");

  // Bottom Sheet Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">(
    "Home"
  );
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState("9868686868");

  // Pan Responder for Gesture Drag-to-Close
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openBottomSheet = () => {
    setIsModalVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 25,
      mass: 0.9,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.6) {
          closeBottomSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleSaveAddress = () => {
    if (!houseNo) {
      Alert.alert("Required", "Please enter flat / house / building details");
      return;
    }
    Alert.alert("Success", "Address saved successfully!", [
      {
        text: "OK",
        onPress: () => {
          closeBottomSheet();
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "#ffffff" }]}
    >
      <StatusBar style="dark" />

      {/* Top Navbar Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add address</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={scale(18)} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for a new area, street name..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Location Disabled Alert Bar */}
      <View style={styles.locationAlertBar}>
        <View style={styles.locationAlertLeft}>
          <MaterialCommunityIcons
            name="map-marker-off-outline"
            size={scale(24)}
            color="#1E293B"
          />
          <View style={styles.locationAlertTextCol}>
            <Text style={styles.locationAlertTitle}>
              Device Location not enabled
            </Text>
            <Text style={styles.locationAlertSubtitle}>
              Enable for a better delivery exprience
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => Alert.alert("Location", "Requesting device GPS...")}
          style={styles.enableBtn}
        >
          <Text style={styles.enableBtnText}>Enable</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Map View Area */}
      <View style={styles.mapContainer}>
        <Image
          source={require("@/assets/images/Home/ktm-map.png")}
          style={styles.mapImage}
          contentFit="contain"
        />

        {/* Centered Location Pin on Map */}
        <View style={styles.centerPinWrapper} pointerEvents="none">
          <Ionicons name="location" size={scale(36)} color="#003844" />
        </View>

        {/* "Use current location" Capsule Floating Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setCurrentArea("Baneshwor chok");
            setCurrentCity("Baneshwor, kathmandu");
          }}
          style={styles.currentLocationBtn}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={scale(18)}
            color="#2D6A4F"
          />
          <Text style={styles.currentLocationText}>Use current location</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Delivery Summary Box */}
      <View style={styles.bottomDeliveryContainer}>
        <Text style={styles.deliverHeading}>Deliver your order to</Text>

        {/* Selected Location Pill */}
        <View style={styles.locationCard}>
          <View style={styles.locationPinBox}>
            <Ionicons name="location-outline" size={scale(22)} color="#1E293B" />
          </View>
          <View style={styles.locationTexts}>
            <Text style={styles.areaTitle}>{currentArea}</Text>
            <Text style={styles.citySubtitle}>{currentCity}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openBottomSheet}
            style={styles.changeBtn}
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* "Add more address details" Large CTA Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={openBottomSheet}
          style={styles.addDetailsBtn}
        >
          <Text style={styles.addDetailsBtnText}>Add more address details</Text>
          <Ionicons name="caret-forward" size={scale(14)} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* FULL SCREEN BOTTOM SHEET MODAL WITH GESTURE CLOSE */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBottomSheet}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop Tap to Close */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeBottomSheet}
            style={StyleSheet.absoluteFill}
          />

          {/* Draggable Bottom Sheet */}
          <Animated.View
            style={[
              styles.bottomSheetContainer,
              { transform: [{ translateY }] },
            ]}
          >
            {/* Gesture Handle Bar */}
            <View {...panResponder.panHandlers} style={styles.dragHandleBox}>
              <View style={styles.dragPill} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetScrollContent}
              >
                {/* Modal Title */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Enter Address Details</Text>
                  <TouchableOpacity
                    onPress={closeBottomSheet}
                    style={styles.sheetCloseBtn}
                  >
                    <Feather name="x" size={scale(20)} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Selected Location Pill in Sheet */}
                <View style={styles.sheetLocationPreview}>
                  <Ionicons
                    name="location"
                    size={scale(18)}
                    color="#2D6A4F"
                  />
                  <View style={{ flex: 1, marginLeft: scale(8) }}>
                    <Text style={styles.sheetAreaText}>{currentArea}</Text>
                    <Text style={styles.sheetCityText}>{currentCity}</Text>
                  </View>
                </View>

                {/* Address Type Selector (Home, Work, Other) */}
                <Text style={styles.inputLabel}>Save address as</Text>
                <View style={styles.typeSelectorRow}>
                  {(["Home", "Work", "Other"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.8}
                      onPress={() => setAddressType(type)}
                      style={[
                        styles.typeBadge,
                        addressType === type && styles.typeBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          addressType === type && styles.typeBadgeTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Flat / Building Input */}
                <Text style={styles.inputLabel}>
                  House / Flat / Floor / Building Name *
                </Text>
                <TextInput
                  value={houseNo}
                  onChangeText={setHouseNo}
                  placeholder="e.g. Floor 5, Sunrise Apartment"
                  placeholderTextColor="#94A3B8"
                  style={styles.sheetInput}
                />

                {/* Landmark Input */}
                <Text style={styles.inputLabel}>Nearby Landmark (Optional)</Text>
                <TextInput
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Near Big Mart / Main Chowk"
                  placeholderTextColor="#94A3B8"
                  style={styles.sheetInput}
                />

                {/* Phone Number */}
                <Text style={styles.inputLabel}>Contact Phone Number *</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. 9868686868"
                  placeholderTextColor="#94A3B8"
                  style={styles.sheetInput}
                />

                {/* Save Address Button */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleSaveAddress}
                  style={styles.sheetSaveBtn}
                >
                  <Text style={styles.sheetSaveBtnText}>Save Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: scale(4),
    marginRight: scale(14),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    backgroundColor: "#ffffff",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(10) : scale(6),
    gap: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    color: "#1E293B",
  },
  locationAlertBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  locationAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: scale(10),
  },
  locationAlertTextCol: {
    flex: 1,
  },
  locationAlertTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  locationAlertSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  enableBtn: {
    backgroundColor: "#003844",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  enableBtnText: {
    color: "#ffffff",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  centerPinWrapper: {
    position: "absolute",
    top: "40%",
    left: "46%",
  },
  currentLocationBtn: {
    position: "absolute",
    bottom: scale(14),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: scale(16),
    paddingVertical: scale(9),
    borderRadius: scale(10),
    gap: scale(8),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currentLocationText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#2D6A4F",
  },
  bottomDeliveryContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(20),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  deliverHeading: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(10),
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4FBEA",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: moderateScale(12),
  },
  locationPinBox: {
    marginRight: scale(10),
  },
  locationTexts: {
    flex: 1,
  },
  areaTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  citySubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  changeBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
  },
  changeBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
  },
  addDetailsBtn: {
    backgroundColor: "#003844",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(13),
    borderRadius: scale(10),
    gap: scale(6),
  },
  addDetailsBtnText: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  // Full screen bottom sheet modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.65,
    paddingTop: moderateScale(8),
  },
  dragHandleBox: {
    width: "100%",
    alignItems: "center",
    paddingVertical: moderateScale(8),
  },
  dragPill: {
    width: scale(44),
    height: scale(5),
    borderRadius: scale(3),
    backgroundColor: "#CBD5E1",
  },
  sheetScrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: moderateScale(30),
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  sheetTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#1E293B",
  },
  sheetCloseBtn: {
    padding: scale(4),
  },
  sheetLocationPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(10),
    padding: scale(10),
    marginBottom: moderateScale(16),
  },
  sheetAreaText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  sheetCityText: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  inputLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#334155",
    marginBottom: moderateScale(6),
    marginTop: moderateScale(4),
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: moderateScale(14),
  },
  typeBadge: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(7),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#ffffff",
  },
  typeBadgeActive: {
    borderColor: "#003844",
    backgroundColor: "#003844",
  },
  typeBadgeText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#475569",
  },
  typeBadgeTextActive: {
    color: "#ffffff",
  },
  sheetInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(10) : scale(7),
    fontSize: moderateScale(13.5),
    color: "#1E293B",
    marginBottom: moderateScale(12),
  },
  sheetSaveBtn: {
    backgroundColor: "#003844",
    paddingVertical: moderateScale(14),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(10),
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  sheetSaveBtnText: {
    color: "#ffffff",
    fontSize: moderateScale(15),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
