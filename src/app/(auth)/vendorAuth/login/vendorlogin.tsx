import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearVendorError,
  clearVendorSuccess,
  loginVendorPasswordAction,
  resetOtpState,
  sendVendorOtpAction,
  verifyVendorOtpAction,
} from "@/store/slices/vendorAuthSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

type LoginMode = "password" | "otp";

export default function VendorLoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    isLoading,
    error,
    successMessage,
    isVendorAuthenticated,
    vendorUser,
    vendorDetails,
    otpSent,
    otpEmail,
  } = useAppSelector((state) => state.vendorAuth);

  const [mode, setMode] = useState<LoginMode>("password");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // When vendor is authenticated, route based on approval status
  useEffect(() => {
    if (isVendorAuthenticated) {
      const status = vendorDetails?.status || vendorUser?.status || "active";

      if (status === "pending" || status === "draft") {
        router.replace({
          pathname: "/(auth)/vendorAuth/registrationProcess" as any,
          params: { step: "6" },
        });
      } else if (status === "approved" || status === "active") {
        router.replace("/VendorMain/dashboard" as any);
      }
    }
  }, [isVendorAuthenticated, vendorUser, vendorDetails, router]);

  // Clear errors when unmounting or switching tabs
  useEffect(() => {
    return () => {
      dispatch(clearVendorError());
      dispatch(clearVendorSuccess());
    };
  }, [dispatch]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval: any = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendActive(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendTimer]);

  // Handle Password Login
  const handlePasswordLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your vendor email address.");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    try {
      const result = await dispatch(
        loginVendorPasswordAction({ email: email.trim(), password }),
      ).unwrap();

      if (result?.token) {
        // Handled in useEffect
      }
    } catch (err: any) {
      Alert.alert(
        "Login Failed",
        err || error || "Could not log in as Vendor.",
      );
    }
  };

  // Handle Send OTP
  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your vendor email address.");
      return;
    }

    try {
      const result = await dispatch(
        sendVendorOtpAction({ email: email.trim() }),
      ).unwrap();

      Alert.alert(
        "OTP Sent",
        result?.message || `A 6-digit login code was sent to ${email.trim()}`,
      );
      setResendTimer(60);
      setIsResendActive(false);
      setOtpCode(["", "", "", "", "", ""]);
    } catch (err: any) {
      Alert.alert("Request Failed", err || error || "Failed to send OTP.");
    }
  };

  // Handle Verify OTP Login
  const handleVerifyOTP = async () => {
    const fullCode = otpCode.join("");
    if (fullCode.length !== 6) {
      Alert.alert(
        "Incomplete OTP",
        "Please enter all 6 digits of the OTP code.",
      );
      return;
    }

    const targetEmail = otpEmail || email.trim();

    try {
      await dispatch(
        verifyVendorOtpAction({
          email: targetEmail,
          otp: fullCode,
        }),
      ).unwrap();
    } catch (err: any) {
      Alert.alert("Verification Failed", err || error || "Invalid OTP code.");
    }
  };

  // Handle OTP individual digit change
  const handleOtpDigitChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    const newOtp = [...otpCode];

    if (cleaned.length > 1) {
      // User pasted full OTP
      const pastedDigits = cleaned.slice(0, 6).split("");
      pastedDigits.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtpCode(newOtp);
      otpInputRefs.current[Math.min(pastedDigits.length - 1, 5)]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtpCode(newOtp);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace("/(auth)/login" as any)}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={scale(20)} color="#003844" />
        </TouchableOpacity>

        {/* Switch back to customer app pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace("/(auth)/login" as any)}
          style={styles.customerSwitchPill}
        >
          <Feather name="user" size={scale(13)} color="#003844" />
          <Text style={styles.customerSwitchText}>Customer App</Text>
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
          {/* 1. App Logo & Vendor Badge */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Home/bhansa-mart-cart-badge.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <View style={styles.vendorBadgeContainer}>
              <LinearGradient
                colors={["#003844", "#005b6e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.vendorBadgeGradient}
              >
                <MaterialCommunityIcons
                  name="storefront"
                  size={scale(14)}
                  color="#86C4CB"
                />
                <Text style={styles.vendorBadgeText}>VENDOR PORTAL</Text>
              </LinearGradient>
            </View>
            <Text style={styles.headerSubtitle}>
              Manage your products, orders & store catalog
            </Text>
          </View>

          {/* 2. Login Mode Tabs (Password vs OTP) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMode("password");
                dispatch(clearVendorError());
              }}
              style={[
                styles.tabButton,
                mode === "password" && styles.tabButtonActive,
              ]}
            >
              <Feather
                name="lock"
                size={scale(14)}
                color={mode === "password" ? "#003844" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  mode === "password" && styles.tabButtonTextActive,
                ]}
              >
                Password Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMode("otp");
                dispatch(clearVendorError());
              }}
              style={[
                styles.tabButton,
                mode === "otp" && styles.tabButtonActive,
              ]}
            >
              <Feather
                name="smartphone"
                size={scale(14)}
                color={mode === "otp" ? "#003844" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  mode === "otp" && styles.tabButtonTextActive,
                ]}
              >
                OTP Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. Form Content Based on Mode */}
          <View style={styles.formContainer}>
            {mode === "password" ? (
              /* PASSWORD LOGIN FORM */
              <>
                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vendor Email Address</Text>
                  <View style={styles.inputBox}>
                    <Feather
                      name="mail"
                      size={scale(16)}
                      color="#94A3B8"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="vendor@store.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputBox}>
                    <Feather
                      name="lock"
                      size={scale(16)}
                      color="#94A3B8"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter vendor password"
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

                {/* Options Row */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setRememberMe((prev) => !prev)}
                    style={styles.rememberRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxActive,
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons
                          name="checkmark"
                          size={scale(12)}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("/reset-password" as any)}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePasswordLogin}
                  disabled={isLoading}
                  style={[styles.primaryBtn, isLoading && { opacity: 0.8 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      Login to Vendor Portal
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* OTP LOGIN FORM */
              <>
                {!otpSent ? (
                  /* Step A: Request OTP */
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Registered Vendor Email
                      </Text>
                      <View style={styles.inputBox}>
                        <Feather
                          name="mail"
                          size={scale(16)}
                          color="#94A3B8"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder="vendor@store.com"
                          placeholderTextColor="#94A3B8"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={styles.textInput}
                        />
                      </View>
                      <Text style={styles.helperText}>
                        We will send a 6-digit one-time code to your registered
                        email.
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSendOTP}
                      disabled={isLoading}
                      style={[styles.primaryBtn, isLoading && { opacity: 0.8 }]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          Send Login OTP
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Step B: Verify OTP */
                  <>
                    <View style={styles.otpHeaderBox}>
                      <Text style={styles.otpHeaderTitle}>
                        Enter Verification Code
                      </Text>
                      <Text style={styles.otpHeaderSubtitle}>
                        6-digit code sent to{" "}
                        <Text style={styles.boldEmail}>
                          {otpEmail || email}
                        </Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => dispatch(resetOtpState())}
                        style={styles.changeEmailBtn}
                      >
                        <Text style={styles.changeEmailText}>Change Email</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 6 Digit OTP Inputs */}
                    <View style={styles.otpInputContainer}>
                      {otpCode.map((digit, idx) => (
                        <TextInput
                          key={idx}
                          ref={(ref) => {
                            otpInputRefs.current[idx] = ref;
                          }}
                          value={digit}
                          onChangeText={(text) =>
                            handleOtpDigitChange(text, idx)
                          }
                          onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[
                            styles.otpBox,
                            digit ? styles.otpBoxFilled : null,
                          ]}
                          selectTextOnFocus
                        />
                      ))}
                    </View>

                    {/* Resend Timer */}
                    <View style={styles.resendRow}>
                      {resendTimer > 0 ? (
                        <Text style={styles.timerText}>
                          Resend code in{" "}
                          <Text style={styles.boldTimer}>{resendTimer}s</Text>
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={handleSendOTP}
                          disabled={isLoading}
                          style={styles.resendBtn}
                        >
                          <Text style={styles.resendBtnText}>Resend OTP</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleVerifyOTP}
                      disabled={isLoading}
                      style={[styles.primaryBtn, isLoading && { opacity: 0.8 }]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          Verify & Login
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>Seller Community</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Vendor Registration Link */}
            <View style={styles.registerCard}>
              <Text style={styles.registerCardTitle}>
                Want to sell on BhansaMart?
              </Text>
              <Text style={styles.registerCardSubtitle}>
                Expand your grocery or restaurant business to thousands of
                customers.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push("/(auth)/vendorAuth/registrationProcess" as any)
                }
                style={styles.registerBtn}
              >
                <MaterialCommunityIcons
                  name="storefront-plus-outline"
                  size={scale(18)}
                  color="#003844"
                />
                <Text style={styles.registerBtnText}>
                  Start Seller Onboarding
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(6),
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  customerSwitchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F6",
    paddingVertical: moderateScale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#86C4CB",
    gap: scale(6),
  },
  customerSwitchText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#003844",
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingBottom: moderateScale(40),
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(5),
    marginBottom: moderateScale(20),
  },
  logo: {
    width: scale(300),
    height: scale(140),
  },
  vendorBadgeContainer: {
    marginTop: -moderateScale(15),
    marginBottom: moderateScale(6),
    borderRadius: scale(14),
    overflow: "hidden",
  },
  vendorBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(4),
    paddingHorizontal: scale(12),
    borderRadius: scale(14),
    gap: scale(6),
  },
  vendorBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    marginTop: moderateScale(4),
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(10),
    padding: scale(4),
    marginBottom: moderateScale(20),
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
    gap: scale(6),
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#003844",
    fontWeight: "700",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  inputLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: moderateScale(6),
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(44),
  },
  inputIcon: {
    marginRight: scale(8),
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
  helperText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: moderateScale(6),
    lineHeight: moderateScale(16),
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(2),
    marginBottom: moderateScale(16),
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
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
  },
  checkboxActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  rememberText: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    fontWeight: "500",
  },
  forgotText: {
    fontSize: moderateScale(11.5),
    color: "#008080",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#003844",
    height: moderateScale(46),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  otpHeaderBox: {
    alignItems: "center",
    marginBottom: moderateScale(18),
  },
  otpHeaderTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#003844",
    marginBottom: moderateScale(4),
  },
  otpHeaderSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
  },
  boldEmail: {
    fontWeight: "700",
    color: "#0F172A",
  },
  changeEmailBtn: {
    marginTop: moderateScale(6),
  },
  changeEmailText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#008080",
    textDecorationLine: "underline",
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: moderateScale(16),
    paddingHorizontal: scale(8),
  },
  otpBox: {
    width: scale(42),
    height: moderateScale(48),
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    textAlign: "center",
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#003844",
    backgroundColor: "#F8FAFC",
  },
  otpBoxFilled: {
    borderColor: "#003844",
    backgroundColor: "#FFFFFF",
  },
  resendRow: {
    alignItems: "center",
    marginBottom: moderateScale(18),
  },
  timerText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  boldTimer: {
    fontWeight: "700",
    color: "#003844",
  },
  resendBtn: {
    paddingVertical: moderateScale(4),
    paddingHorizontal: scale(10),
  },
  resendBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#008080",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: moderateScale(22),
    gap: scale(10),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  registerCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
  },
  registerCardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#003844",
    marginBottom: moderateScale(4),
  },
  registerCardSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    textAlign: "center",
    marginBottom: moderateScale(14),
    lineHeight: moderateScale(16),
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#003844",
    height: moderateScale(40),
    borderRadius: scale(8),
    width: "100%",
    gap: scale(8),
  },
  registerBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#003844",
  },
});
