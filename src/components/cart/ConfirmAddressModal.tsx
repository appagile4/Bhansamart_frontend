import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAddresses,
  setSelectedAddress,
  addAddress,
} from "@/store/slices/addressSlice";
import { CartItem } from "@/store/slices/cartSlice";
import { SavedAddress } from "@/store/services/addressService";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ConfirmAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onProceedToCheckout: (address: SavedAddress) => void;
  cartItems?: CartItem[];
}

export default function ConfirmAddressModal({
  visible,
  onClose,
  onProceedToCheckout,
}: ConfirmAddressModalProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const { user } = useAppSelector((state) => state.auth);
  const {
    addresses,
    selectedAddress,
    activeDisplayLocation,
    latitude,
    longitude,
  } = useAppSelector((state) => state.address);

  // Address form fields
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">("Home");
  const [isDefault, setIsDefault] = useState(true);

  // Mode: null means New Address (selected by default), or string id of an existing saved address
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stable primitive numbers for latitude and longitude
  const selectedSaved = useMemo(() => {
    if (!selectedSavedId) return null;
    return (
      addresses.find(
        (a) => a.id === selectedSavedId || a._id === selectedSavedId
      ) || null
    );
  }, [selectedSavedId, addresses]);

  const targetLat = useMemo(() => {
    if (selectedSaved && selectedSaved.latitude != null) {
      return Number(selectedSaved.latitude);
    }
    const fallback = selectedAddress?.latitude ?? latitude ?? 28.7208;
    return Number(fallback);
  }, [selectedSaved, selectedAddress?.latitude, latitude]);

  const targetLng = useMemo(() => {
    if (selectedSaved && selectedSaved.longitude != null) {
      return Number(selectedSaved.longitude);
    }
    const fallback = selectedAddress?.longitude ?? longitude ?? 77.1042;
    return Number(fallback);
  }, [selectedSaved, selectedAddress?.longitude, longitude]);

  const prevVisibleRef = useRef<boolean>(false);

  // When modal opens, fetch saved addresses and ensure New Address is selected by default
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      dispatch(fetchAddresses());
      // By default it should be selected as a new address
      setSelectedSavedId(null);
      setHouseNo("");
      setLandmark("");
      setStreet(activeDisplayLocation || "");
      setPhone(user?.phone || "");
    }
    prevVisibleRef.current = visible;
  }, [visible, dispatch, activeDisplayLocation, user?.phone]);

  const validSavedAddresses = useMemo(() => {
    return addresses.filter(
      (a) => a.id !== "current-location" && (a as any)._id !== "current-location"
    );
  }, [addresses]);

  // Handle selecting an existing saved address
  const handleSelectSavedAddress = (saved: SavedAddress) => {
    setSelectedSavedId(saved.id || saved._id || null);
    if (saved.phone) setPhone(saved.phone);
    if (saved.houseNo) setHouseNo(saved.houseNo);
    if (saved.street) setStreet(saved.street);
    if (saved.landmark) setLandmark(saved.landmark);
    if (saved.type) setAddressType(saved.type);
  };

  // Handle Primary CTA: "Save Address & Continue"
  const handleSaveAndContinue = async () => {
    // 1. If an existing saved address is selected
    if (selectedSavedId) {
      const chosen = addresses.find(
        (a) => a.id === selectedSavedId || a._id === selectedSavedId
      );
      if (!chosen) {
        Alert.alert("Error", "Please select a valid address.");
        return;
      }

      dispatch(setSelectedAddress(chosen));
      onProceedToCheckout(chosen);
      return;
    }

    // 2. Validate new address form inputs
    if (!houseNo.trim()) {
      Alert.alert(
        "Missing House / Flat Details",
        "Please enter your Flat, House, or Building number to ensure accurate doorstep delivery."
      );
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      Alert.alert(
        "Invalid Phone Number",
        "Please provide a valid 10-digit mobile number for delivery partner coordination."
      );
      return;
    }

    try {
      setIsSaving(true);
      const finalAddressLine = [
        houseNo.trim(),
        landmark.trim(),
        street.trim() || activeDisplayLocation,
      ]
        .filter(Boolean)
        .join(", ");

      const detectedCity = activeDisplayLocation?.includes("Meerut")
        ? "Meerut"
        : activeDisplayLocation?.includes("Delhi")
        ? "New Delhi"
        : "Kathmandu";

      const actionResult = await dispatch(
        addAddress({
          type: addressType,
          houseNo: houseNo.trim(),
          street: street.trim() || activeDisplayLocation,
          landmark: landmark.trim(),
          phone: phone.trim(),
          addressLine: finalAddressLine,
          city: detectedCity,
          isDefault,
          latitude: targetLat,
          longitude: targetLng,
        })
      );

      if (addAddress.fulfilled.match(actionResult)) {
        const createdAddress = actionResult.payload as SavedAddress;
        dispatch(setSelectedAddress(createdAddress));
        onProceedToCheckout(createdAddress);
      } else {
        const errorMsg =
          (actionResult.payload as string) || "Failed to save delivery address.";
        Alert.alert("Address Save Error", errorMsg);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save address.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Background Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        {/* Keyboard Avoiding Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View
            style={[
              styles.sheetContent,
              isDark && { backgroundColor: "#101922" },
            ]}
          >
            {/* Top Sheet Drag Handle & Close */}
            <View style={styles.dragHandleRow}>
              <View
                style={[
                  styles.dragHandle,
                  isDark && { backgroundColor: "#334155" },
                ]}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={styles.closeBtn}
              >
                <Feather
                  name="x"
                  size={scale(18)}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Header */}
            <View style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.titleIconBox,
                    isDark && { backgroundColor: "#15222D" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="map-marker-radius"
                    size={scale(20)}
                    color={isDark ? "#38BDF8" : "#004d5d"}
                  />
                </View>
                <Text
                  style={[styles.modalTitle, isDark && { color: "#F8FAFC" }]}
                >
                  Please Confirm Your Delivery Address
                </Text>
              </View>
              <Text
                style={[styles.modalSubtitle, isDark && { color: "#94A3B8" }]}
              >
                Please enter or select your complete delivery address before
                proceeding.
              </Text>
            </View>

            {/* Scrollable Form Area */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              nestedScrollEnabled={true}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollArea}
            >
              {/* ── 1. Saved Address Quick Selector (If any saved) ───────── */}
              {validSavedAddresses.length > 0 && (
                <View style={styles.savedSection}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      isDark && { color: "#E2E8F0" },
                    ]}
                  >
                    Select from Saved Addresses
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.savedAddressesScroller}
                  >
                    {/* Add New Custom Address Option (Selected by Default) */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedSavedId(null);
                        setHouseNo("");
                        setLandmark("");
                      }}
                      style={[
                        styles.addNewAddressPill,
                        isDark && {
                          backgroundColor: "#15222D",
                          borderColor: "#334155",
                        },
                        !selectedSavedId &&
                          (isDark
                            ? { borderColor: "#38BDF8", backgroundColor: "#0C2330" }
                            : styles.savedAddressPillSelected),
                      ]}
                    >
                      <Feather
                        name="plus"
                        size={scale(16)}
                        color={isDark ? "#38BDF8" : "#004d5d"}
                      />
                      <Text
                        style={[
                          styles.addNewPillText,
                          isDark && { color: "#38BDF8" },
                          !selectedSavedId && { fontWeight: "800" },
                        ]}
                      >
                        New Address
                      </Text>
                    </TouchableOpacity>

                    {validSavedAddresses.map((saved) => {
                      const isSelected =
                        selectedSavedId === saved.id ||
                        selectedSavedId === saved._id;
                      return (
                        <TouchableOpacity
                          key={saved.id || saved._id}
                          activeOpacity={0.8}
                          onPress={() => handleSelectSavedAddress(saved)}
                          style={[
                            styles.savedAddressPill,
                            isDark && {
                              backgroundColor: "#15222D",
                              borderColor: "#334155",
                            },
                            isSelected &&
                              (isDark
                                ? { borderColor: "#38BDF8", backgroundColor: "#0C2330" }
                                : styles.savedAddressPillSelected),
                          ]}
                        >
                          <View style={styles.savedPillHeader}>
                            <MaterialCommunityIcons
                              name={
                                saved.type === "Home"
                                  ? "home"
                                  : saved.type === "Work"
                                  ? "briefcase"
                                  : "map-marker"
                              }
                              size={scale(14)}
                              color={isSelected ? "#004d5d" : "#64748B"}
                            />
                            <Text
                              style={[
                                styles.savedTypeBadge,
                                isSelected && { color: "#004d5d", fontWeight: "700" },
                              ]}
                            >
                              {saved.type || "Home"}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={scale(14)}
                                color="#059669"
                                style={{ marginLeft: "auto" }}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.savedAddressLine,
                              isDark && { color: "#94A3B8" },
                              isSelected && { color: isDark ? "#F8FAFC" : "#0F172A" },
                            ]}
                            numberOfLines={2}
                          >
                            {saved.addressLine ||
                              [saved.houseNo, saved.street, saved.city]
                                .filter(Boolean)
                                .join(", ")}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* ── 2. Complete Address Form Inputs ──────────────────────── */}
              <View style={styles.formContainer}>
                <Text
                  style={[
                    styles.sectionHeading,
                    isDark && { color: "#E2E8F0" },
                  ]}
                >
                  {selectedSavedId
                    ? "Selected Address Details"
                    : "Enter Complete Doorstep Details"}
                </Text>

                {/* Detected Location Reference Box */}
                <View
                  style={[
                    styles.gpsLocationBox,
                    isDark && {
                      backgroundColor: "#15222D",
                      borderColor: "#243545",
                    },
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={scale(17)}
                    color={isDark ? "#38BDF8" : "#004d5d"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.gpsLabel, isDark && { color: "#94A3B8" }]}
                    >
                      Delivery Area
                    </Text>
                    <Text
                      style={[
                        styles.gpsValueText,
                        isDark && { color: "#F8FAFC" },
                      ]}
                      numberOfLines={1}
                    >
                      {activeDisplayLocation}
                    </Text>
                  </View>
                </View>

                {/* Flat / House No / Building */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, isDark && { color: "#E2E8F0" }]}
                  >
                    House / Flat / Floor / Building{" "}
                    <Text style={{ color: "#DC2626" }}>*</Text>
                  </Text>
                  <TextInput
                    value={houseNo}
                    onChangeText={setHouseNo}
                    placeholder="e.g. Flat 402, Royal Heights / House #12"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    style={[
                      styles.textInput,
                      isDark && {
                        backgroundColor: "#15222D",
                        borderColor: "#243545",
                        color: "#F8FAFC",
                      },
                    ]}
                  />
                </View>

                {/* Street / Colony / Locality */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, isDark && { color: "#E2E8F0" }]}
                  >
                    Street / Area / Locality
                  </Text>
                  <TextInput
                    value={street}
                    onChangeText={setStreet}
                    placeholder="e.g. Ganga Nagar Main Road, Sector 3"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    style={[
                      styles.textInput,
                      isDark && {
                        backgroundColor: "#15222D",
                        borderColor: "#243545",
                        color: "#F8FAFC",
                      },
                    ]}
                  />
                </View>

                {/* Landmark (Optional) */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, isDark && { color: "#E2E8F0" }]}
                  >
                    Nearby Landmark (Optional)
                  </Text>
                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="e.g. Near Shiv Mandir / Behind City Hospital"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    style={[
                      styles.textInput,
                      isDark && {
                        backgroundColor: "#15222D",
                        borderColor: "#243545",
                        color: "#F8FAFC",
                      },
                    ]}
                  />
                </View>

                {/* Contact Phone */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, isDark && { color: "#E2E8F0" }]}
                  >
                    Contact Phone Number{" "}
                    <Text style={{ color: "#DC2626" }}>*</Text>
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="e.g. 9801234567"
                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                    style={[
                      styles.textInput,
                      isDark && {
                        backgroundColor: "#15222D",
                        borderColor: "#243545",
                        color: "#F8FAFC",
                      },
                    ]}
                  />
                </View>

                {/* Address Type Selector */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, isDark && { color: "#E2E8F0" }]}
                  >
                    Save Address As
                  </Text>
                  <View style={styles.typePillsRow}>
                    {(["Home", "Work", "Other"] as const).map((type) => {
                      const isSelected = addressType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          activeOpacity={0.8}
                          onPress={() => setAddressType(type)}
                          style={[
                            styles.typePill,
                            isDark && {
                              backgroundColor: "#15222D",
                              borderColor: "#334155",
                            },
                            isSelected &&
                              (isDark
                                ? { backgroundColor: "#0C2330", borderColor: "#38BDF8" }
                                : styles.typePillSelected),
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              type === "Home"
                                ? "home-outline"
                                : type === "Work"
                                ? "briefcase-outline"
                                : "map-marker-outline"
                            }
                            size={scale(16)}
                            color={
                              isSelected
                                ? isDark
                                  ? "#38BDF8"
                                  : "#004d5d"
                                : "#64748B"
                            }
                          />
                          <Text
                            style={[
                              styles.typePillText,
                              isSelected && {
                                color: isDark ? "#38BDF8" : "#004d5d",
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* ── Sticky Primary CTA: Save Address & Continue ──────────── */}
            <View
              style={[
                styles.footerBar,
                isDark && {
                  borderTopColor: "#1E293B",
                  backgroundColor: "#101922",
                },
                { paddingBottom: Math.max(insets.bottom, 16) + moderateScale(4) },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSaveAndContinue}
                disabled={isSaving}
                style={[
                  styles.saveContinueBtn,
                  isSaving && {
                    opacity: 0.75,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnInnerRow}>
                    <Text style={styles.saveContinueText}>
                      {selectedSavedId
                        ? "Deliver to this Address & Continue"
                        : "Save Address & Continue"}
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={scale(17)}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
    paddingTop: moderateScale(10),
    paddingHorizontal: scale(16),
    maxHeight: SCREEN_HEIGHT * 0.88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: scale(4),
  },
  dragHandle: {
    width: scale(38),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: "#CBD5E1",
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: scale(6),
  },
  headerBlock: {
    marginTop: scale(6),
    marginBottom: scale(10),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: scale(3),
  },
  titleIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  modalSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    lineHeight: moderateScale(16),
    marginLeft: scale(40),
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollArea: {
    paddingBottom: moderateScale(20),
    flexGrow: 1,
  },

  savedSection: {
    marginBottom: scale(14),
  },
  sectionHeading: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: scale(8),
  },
  savedAddressesScroller: {
    gap: scale(10),
    paddingRight: scale(12),
  },
  savedAddressPill: {
    width: scale(165),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    padding: scale(10),
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  savedAddressPillSelected: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0D9488",
  },
  savedPillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: scale(4),
  },
  savedTypeBadge: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#475569",
  },
  savedAddressLine: {
    fontSize: moderateScale(11),
    color: "#64748B",
    lineHeight: moderateScale(15),
  },
  addNewAddressPill: {
    width: scale(120),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    padding: scale(10),
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(4),
  },
  addNewPillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#004d5d",
  },
  formContainer: {
    gap: scale(10),
  },
  gpsLocationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    backgroundColor: "#F0FDF4",
    borderRadius: scale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: scale(2),
  },
  gpsLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    color: "#059669",
  },
  gpsValueText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F172A",
  },
  inputGroup: {
    gap: scale(4),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8.5),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  typePillsRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  typePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(5),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: moderateScale(8),
  },
  typePillSelected: {
    backgroundColor: "#F0FDFA",
    borderColor: "#004d5d",
  },
  typePillText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748B",
  },
  footerBar: {
    marginTop: scale(6),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  saveContinueBtn: {
    backgroundColor: "#004d5d",
    borderRadius: scale(12),
    paddingVertical: moderateScale(13),
    alignItems: "center",
    justifyContent: "center",
  },
  btnInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  saveContinueText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
