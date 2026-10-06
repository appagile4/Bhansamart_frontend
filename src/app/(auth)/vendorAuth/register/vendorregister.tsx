import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearVendorError,
  clearVendorSuccess,
  registerVendorAction,
} from "@/store/slices/vendorAuthSlice";
import { moderateScale, scale } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORY_NAMES } from "@/constants/categories";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = CATEGORY_NAMES;

export default function VendorRegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isVendorAuthenticated } = useAppSelector(
    (state) => state.vendorAuth
  );

  // Form Fields
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Grocery");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (isVendorAuthenticated) {
      Alert.alert(
        "Registration Complete",
        "Your vendor account has been created successfully! Welcome to BhansaMart.",
        [
          {
            text: "Proceed",
            onPress: () => {
              router.replace("/customerMain" as any);
            },
          },
        ]
      );
    }
  }, [isVendorAuthenticated, router]);

  useEffect(() => {
    return () => {
      dispatch(clearVendorError());
      dispatch(clearVendorSuccess());
    };
  }, [dispatch]);

  const handleRegister = async () => {
    // Validations
    if (!storeName.trim()) {
      Alert.alert("Required", "Please enter your Store / Business Name.");
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert("Required", "Please enter the Owner / Seller Full Name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your business email address.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please create a password (minimum 6 characters).");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please re-enter.");
      return;
    }
    if (!agreeTerms) {
      Alert.alert(
        "Terms Agreement",
        "Please accept the BhansaMart Vendor Terms & Conditions to proceed."
      );
      return;
    }

    try {
      await dispatch(
        registerVendorAction({
          name: ownerName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          storeName: storeName.trim(),
          category: selectedCategory,
          address: address.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
        })
      ).unwrap();
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err || error || "Could not complete vendor registration."
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={scale(20)} color="#003844" />
        </TouchableOpacity>

        <Text style={styles.topNavTitle}>Vendor Onboarding</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            router.replace("/(auth)/vendorAuth/login/vendorlogin" as any)
          }
          style={styles.loginPill}
        >
          <Text style={styles.loginPillText}>Login</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <LinearGradient
              colors={["#003844", "#005566"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <MaterialCommunityIcons
                name="store-outline"
                size={scale(32)}
                color="#86C4CB"
              />
              <Text style={styles.bannerTitle}>Join BhansaMart as a Seller</Text>
              <Text style={styles.bannerSubtitle}>
                Sell your food & groceries to thousands of local customers with
                fast payouts.
              </Text>
            </LinearGradient>
          </View>

          {/* Section 1: Store Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="storefront"
                size={scale(18)}
                color="#003844"
              />
              <Text style={styles.sectionTitle}>1. Store Information</Text>
            </View>

            {/* Store Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Store / Business Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Feather
                  name="shopping-bag"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="e.g., Organic Farm Grocers"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Primary Store Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Section 2: Owner & Contact */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-tie"
                size={scale(18)}
                color="#003844"
              />
              <Text style={styles.sectionTitle}>2. Seller Contact Details</Text>
            </View>

            {/* Owner Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Owner / Authorized Person Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Feather
                  name="user"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="Full Name"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Business Email Address <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Feather
                  name="mail"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seller@store.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Contact Phone Number <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Feather
                  name="phone"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Mobile / WhatsApp number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>

          {/* Section 3: Store Address */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={scale(18)}
                color="#003844"
              />
              <Text style={styles.sectionTitle}>3. Location & Warehouse</Text>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store / Warehouse Address</Text>
              <View style={styles.inputBox}>
                <Feather
                  name="map-pin"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street / Market / Area"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* City & State Row */}
            <View style={styles.twoColRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Pincode / Postal</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="Pincode"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Security Password */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={scale(18)}
                color="#003844"
              />
              <Text style={styles.sectionTitle}>4. Vendor Security</Text>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Password <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Feather
                  name="lock"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={scale(15)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Confirm Password <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Feather
                  name="check-circle"
                  size={scale(15)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAgreeTerms((prev) => !prev)}
              style={styles.termsRow}
            >
              <View
                style={[styles.checkbox, agreeTerms && styles.checkboxActive]}
              >
                {agreeTerms && (
                  <Ionicons name="checkmark" size={scale(12)} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.termsLabel}>
                I agree to the{" "}
                <Text style={styles.termsBold}>Vendor Terms of Service</Text> &{" "}
                <Text style={styles.termsBold}>Seller Agreement</Text>.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={isLoading}
            style={[styles.submitBtn, isLoading && { opacity: 0.8 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Vendor Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer login link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have a Vendor Account? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.replace("/(auth)/vendorAuth/login/vendorlogin" as any)
              }
            >
              <Text style={styles.footerLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  topNavTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#003844",
  },
  loginPill: {
    backgroundColor: "#E6F4F6",
    paddingVertical: moderateScale(5),
    paddingHorizontal: scale(12),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  loginPillText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#003844",
  },
  scrollContent: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(40),
  },
  headerBanner: {
    borderRadius: scale(14),
    overflow: "hidden",
    marginBottom: moderateScale(16),
  },
  bannerGradient: {
    padding: scale(18),
    borderRadius: scale(14),
  },
  bannerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  bannerSubtitle: {
    fontSize: moderateScale(12),
    color: "#D1E9ED",
    lineHeight: moderateScale(17),
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(14),
    gap: scale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#003844",
  },
  inputGroup: {
    marginBottom: moderateScale(14),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(6),
  },
  reqStar: {
    color: "#EF4444",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: moderateScale(42),
  },
  inputIcon: {
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(12.5),
    color: "#0F172A",
    height: "100%",
  },
  eyeBtn: {
    padding: scale(4),
  },
  categoryScroll: {
    gap: scale(8),
    paddingVertical: moderateScale(4),
  },
  categoryChip: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  categoryChipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#475569",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  twoColRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: moderateScale(4),
    gap: scale(8),
  },
  checkbox: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(4),
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginTop: scale(2),
  },
  checkboxActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  termsLabel: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#64748B",
    lineHeight: moderateScale(16),
  },
  termsBold: {
    color: "#008080",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#003844",
    height: moderateScale(46),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(16),
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(20),
  },
  footerText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  footerLink: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
});
