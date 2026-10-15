import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerDeliveryPartner } from "@/store/slices/deliverySlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const VEHICLE_OPTIONS = [
  { key: "Motorcycle", label: "Motorcycle", icon: "motorbike" },
  { key: "Scooter", label: "Scooter", icon: "moped" },
  { key: "Electric Bike", label: "Electric Bike", icon: "bicycle-electric" },
  { key: "Bicycle", label: "Bicycle", icon: "bicycle" },
];

export default function DeliveryRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.delivery);

  // Form step
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Personal & Account
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serviceCity, setServiceCity] = useState("Kathmandu");
  const [serviceArea, setServiceArea] = useState("Thamel / Central Kathmandu");

  // Step 2: Vehicle & Payout Details
  const [vehicleType, setVehicleType] = useState("Motorcycle");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  const handleNextStep = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      Alert.alert("Missing Fields", "Please fill in all personal and account details.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password Weak", "Password must be at least 6 characters long.");
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      password,
      serviceCity,
      serviceArea,
      vehicleDetails: {
        vehicleType,
        registrationNumber: registrationNumber.trim(),
        licenseNumber: licenseNumber.trim(),
      },
      bankDetails: {
        accountHolderName: accountHolderName.trim() || name.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim(),
      },
    };

    try {
      const result = await dispatch(registerDeliveryPartner(payload)).unwrap();
      if (result?.token) {
        Alert.alert(
          "Welcome to the Team!",
          "Account created. You can now complete your document uploads and security deposit to begin receiving deliveries.",
          [
            {
              text: "Continue to Dashboard",
              onPress: () => router.replace("/DeliveryMain" as any),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert("Registration Error", err || "Failed to create partner account.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, moderateScale(20)) + moderateScale(20) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Banner */}
          <LinearGradient
            colors={["#0F766E", "#0D9488", "#14B8A6"]}
            style={[
              styles.headerGradient,
              { paddingTop: Math.max(insets.top, moderateScale(16)) + moderateScale(10) },
            ]}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (step === 2) {
                  setStep(1);
                } else if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(auth)/deliveryAuth/login" as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={scale(22)} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Become a Delivery Partner</Text>
            <Text style={styles.headerSub}>
              Earn flexible pay on every grocery order delivered
            </Text>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepDot,
                  styles.activeStepDot,
                ]}
              >
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <View
                style={[
                  styles.stepBar,
                  step === 2 && styles.activeStepBar,
                ]}
              />
              <View
                style={[
                  styles.stepDot,
                  step === 2 && styles.activeStepDot,
                ]}
              >
                <Text style={styles.stepDotText}>2</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Form Container */}
          <View style={styles.formCard}>
            {step === 1 ? (
              <>
                <Text style={styles.sectionHeader}>Personal & Account Details</Text>
                <Text style={styles.sectionSub}>Step 1 of 2</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter full legal name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 9841234567"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. partner@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Delivery Service City</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Kathmandu"
                    placeholderTextColor="#94A3B8"
                    value={serviceCity}
                    onChangeText={setServiceCity}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleNextStep}
                  activeOpacity={0.85}
                >
                  <View style={styles.btnRow}>
                    <Text style={styles.primaryBtnText}>Next: Vehicle & Bank</Text>
                    <Feather
                      name="arrow-right"
                      size={scale(18)}
                      color="#FFFFFF"
                      style={{ marginLeft: scale(6) }}
                    />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionHeader}>Vehicle & Payout Setup</Text>
                <Text style={styles.sectionSub}>Step 2 of 2</Text>

                {/* Vehicle Selection */}
                <Text style={styles.inputLabel}>Select Vehicle Type</Text>
                <View style={styles.vehicleGrid}>
                  {VEHICLE_OPTIONS.map((v) => {
                    const isSelected = vehicleType === v.key;
                    return (
                      <TouchableOpacity
                        key={v.key}
                        style={[
                          styles.vehicleCard,
                          isSelected && styles.vehicleCardActive,
                        ]}
                        onPress={() => setVehicleType(v.key)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={v.icon as any}
                          size={scale(24)}
                          color={isSelected ? "#0F766E" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.vehicleLabel,
                            isSelected && styles.vehicleLabelActive,
                          ]}
                        >
                          {v.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vehicle Registration No.</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. BA 2 PA 1234"
                    placeholderTextColor="#94A3B8"
                    value={registrationNumber}
                    onChangeText={setRegistrationNumber}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Driving License Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. DL-01-2022-XXXX"
                    placeholderTextColor="#94A3B8"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Payout Info */}
                <View style={styles.divider} />
                <Text style={styles.sectionHeaderSmall}>Bank Payout Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank Account Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter account number"
                    placeholderTextColor="#94A3B8"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>IFSC / Bank Code</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. HDFC0001234"
                    placeholderTextColor="#94A3B8"
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>UPI ID (Instant Payouts)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. partner@upi"
                    placeholderTextColor="#94A3B8"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                  />
                </View>

                {/* Submit Application */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      Submit Application
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Back to Login */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already registered? </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(auth)/deliveryAuth/login" as any)
                }
              >
                <Text style={styles.loginLink}>Sign In Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(40),
  },
  headerGradient: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(32),
    borderBottomLeftRadius: scale(28),
    borderBottomRightRadius: scale(28),
  },
  backBtn: {
    marginBottom: moderateScale(12),
    padding: scale(4),
    alignSelf: "flex-start",
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: moderateScale(12),
    color: "#CCFBF1",
    marginTop: moderateScale(4),
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(16),
  },
  stepDot: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeStepDot: {
    backgroundColor: "#FFFFFF",
  },
  stepDotText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F766E",
  },
  stepBar: {
    width: scale(60),
    height: scale(3),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: scale(8),
    borderRadius: scale(2),
  },
  activeStepBar: {
    backgroundColor: "#FFFFFF",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(16),
    marginTop: -moderateScale(16),
    borderRadius: scale(20),
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginBottom: moderateScale(16),
  },
  sectionHeaderSmall: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: moderateScale(12),
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: moderateScale(16),
  },
  inputGroup: {
    marginBottom: moderateScale(14),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
    marginBottom: moderateScale(5),
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    height: moderateScale(44),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    marginBottom: moderateScale(14),
  },
  vehicleCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingVertical: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(4),
  },
  vehicleCardActive: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },
  vehicleLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748B",
  },
  vehicleLabelActive: {
    color: "#0F766E",
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: "#0F766E",
    borderRadius: scale(10),
    height: moderateScale(46),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(10),
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(20),
  },
  footerText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  loginLink: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F766E",
  },
});
