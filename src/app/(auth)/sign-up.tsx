import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthError, registerUser } from "@/store/slices/authSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTHS = [
  { label: "Jan", value: "01" },
  { label: "Feb", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Apr", value: "04" },
  { label: "May", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Aug", value: "08" },
  { label: "Sep", value: "09" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];
const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const YEARS = Array.from({ length: 60 }, (_, i) => String(2015 - i));
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Picker Modal State
  const [pickerType, setPickerType] = useState<
    "month" | "day" | "year" | "gender" | null
  >(null);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (!selectedMonth || !selectedDay || !selectedYear) {
      Alert.alert("Error", "Please select your complete date of birth.");
      return;
    }
    if (!selectedGender) {
      Alert.alert("Error", "Please select your gender.");
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert(
        "Error",
        "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.",
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    const monthObj = MONTHS.find((m) => m.label === selectedMonth);
    const monthNum = monthObj ? monthObj.value : "01";
    const formattedDOB = `${selectedYear}-${monthNum}-${selectedDay}`;

    try {
      await dispatch(
        registerUser({
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
          dateOfBirth: formattedDOB,
          gender: selectedGender,
          password,
          confirmPassword,
        }),
      ).unwrap();

      // Auto-login: Seamlessly navigate directly to the main app!
      router.replace("/customerMain" as any);
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err || error || "Failed to create account.",
      );
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert(
      "Google Sign-Up",
      "Google Sign-Up is coming soon in the next update!",
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={scale(20)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create an account</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address (e.g. Kathmandu, Nepal)"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Date of Birth Dropdowns */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of birth</Text>
            <View style={styles.dobRow}>
              {/* Month */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPickerType("month")}
                style={styles.dobPickerBox}
              >
                <Text
                  style={[
                    styles.pickerValueText,
                    !selectedMonth && styles.pickerPlaceholderText,
                  ]}
                >
                  {selectedMonth || "Month"}
                </Text>
                <Feather name="chevron-down" size={scale(14)} color="#94A3B8" />
              </TouchableOpacity>

              {/* Day */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPickerType("day")}
                style={styles.dobPickerBox}
              >
                <Text
                  style={[
                    styles.pickerValueText,
                    !selectedDay && styles.pickerPlaceholderText,
                  ]}
                >
                  {selectedDay || "Day"}
                </Text>
                <Feather name="chevron-down" size={scale(14)} color="#94A3B8" />
              </TouchableOpacity>

              {/* Year */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPickerType("year")}
                style={styles.dobPickerBox}
              >
                <Text
                  style={[
                    styles.pickerValueText,
                    !selectedYear && styles.pickerPlaceholderText,
                  ]}
                >
                  {selectedYear || "Year"}
                </Text>
                <Feather name="chevron-down" size={scale(14)} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Gender Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPickerType("gender")}
              style={styles.dropdownBox}
            >
              <Text
                style={[
                  styles.pickerValueText,
                  !selectedGender && styles.pickerPlaceholderText,
                ]}
              >
                {selectedGender || "Select Gender"}
              </Text>
              <Feather name="chevron-down" size={scale(16)} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password (min 8 chars)"
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
                  size={scale(16)}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConfirmPassword}
                style={styles.textInput}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={scale(16)}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSignUp}
            disabled={isLoading}
            style={[styles.signUpBtn, isLoading && { opacity: 0.8 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signUpBtnText}>Sign up</Text>
            )}
          </TouchableOpacity>

          {/* Social Sign Up Section */}
          <Text style={styles.socialPromptText}>or create an account with</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogleSignUp}
            style={styles.googleBtn}
          >
            <FontAwesome name="google" size={scale(18)} color="#EA4335" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Footer: Already have account */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an Account? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/login" as any)}
            >
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selection Modal for Month, Day, Year, Gender */}
      <Modal
        visible={pickerType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerType(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerType(null)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {pickerType ? pickerType.toUpperCase() : ""}
              </Text>
              <TouchableOpacity onPress={() => setPickerType(null)}>
                <Feather name="x" size={scale(18)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalOptionsList}
              showsVerticalScrollIndicator={false}
            >
              {pickerType === "month" &&
                MONTHS.map((m) => (
                  <TouchableOpacity
                    key={m.label}
                    onPress={() => {
                      setSelectedMonth(m.label);
                      setPickerType(null);
                    }}
                    style={[
                      styles.modalOptionItem,
                      selectedMonth === m.label && styles.modalOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedMonth === m.label &&
                          styles.modalOptionTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}

              {pickerType === "day" &&
                DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      setSelectedDay(d);
                      setPickerType(null);
                    }}
                    style={[
                      styles.modalOptionItem,
                      selectedDay === d && styles.modalOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedDay === d && styles.modalOptionTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}

              {pickerType === "year" &&
                YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => {
                      setSelectedYear(y);
                      setPickerType(null);
                    }}
                    style={[
                      styles.modalOptionItem,
                      selectedYear === y && styles.modalOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedYear === y && styles.modalOptionTextActive,
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}

              {pickerType === "gender" &&
                GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      setSelectedGender(g);
                      setPickerType(null);
                    }}
                    style={[
                      styles.modalOptionItem,
                      selectedGender === g && styles.modalOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedGender === g && styles.modalOptionTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(18),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    padding: scale(4),
    marginRight: scale(10),
  },
  headerTitle: {
    fontSize: moderateScale(15.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  inputGroup: {
    marginBottom: moderateScale(14),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
    marginBottom: scale(5),
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    height: "100%",
  },
  eyeBtn: {
    padding: scale(4),
  },
  dobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(8),
  },
  dobPickerBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: moderateScale(42),
  },
  dropdownBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
  },
  pickerValueText: {
    fontSize: moderateScale(12.5),
    color: "#0F172A",
  },
  pickerPlaceholderText: {
    color: "#94A3B8",
  },
  signUpBtn: {
    backgroundColor: "#003844",
    height: moderateScale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(6),
  },
  signUpBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  socialPromptText: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    textAlign: "center",
    marginVertical: moderateScale(14),
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: moderateScale(42),
    borderRadius: scale(8),
    gap: scale(10),
  },
  googleBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(20),
  },
  footerText: {
    fontSize: moderateScale(12),
    color: "#475569",
  },
  signInLink: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(24),
  },
  modalCard: {
    width: "100%",
    maxHeight: scale(360),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    overflow: "hidden",
    paddingVertical: moderateScale(12),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  modalOptionsList: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(6),
  },
  modalOptionItem: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(6),
  },
  modalOptionActive: {
    backgroundColor: "#F0FDFA",
  },
  modalOptionText: {
    fontSize: moderateScale(13),
    color: "#334155",
  },
  modalOptionTextActive: {
    fontWeight: "700",
    color: "#008080",
  },
});
