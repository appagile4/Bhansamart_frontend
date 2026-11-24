import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuthError,
  checkCustomerEmail,
  sendCustomerOtp,
  verifyCustomerOtp,
  completeCustomerRegistration,
  customerPasswordLogin,
  customerGoogleAuth,
} from "@/store/slices/authSlice";
import storage from "@/utils/storage";
import { moderateScale, scale } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  // Mode Selection
  // primaryMode: "email" | "google"
  const [primaryMode, setPrimaryMode] = useState<"email" | "google">("email");
  // emailMethod: "otp" | "password"
  const [emailMethod, setEmailMethod] = useState<"otp" | "password">("otp");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Flow State
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputsRef = useRef<any[]>([]);

  // Mandatory New Customer Set Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  // Block Android hardware back while on login
  useEffect(() => {
    const onBackPress = () => true;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => backHandler.remove();
  }, []);

  // Redirect on successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "delivery_boy") {
        router.replace("/DeliveryMain" as any);
      } else {
        router.replace("/customerMain" as any);
      }
    }
  }, [isAuthenticated, user?.role, router]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  // ── Actions ────────────────────────────────────────────────────────

  // 1. Send Email OTP
  const handleSendOtp = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const res = await dispatch(
        sendCustomerOtp({ email: email.trim(), purpose: "login" })
      ).unwrap();

      setOtpSent(true);
      setResendTimer(res?.data?.resendCooldown || 60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 250);
    } catch (err: any) {
      Alert.alert(
        "Failed to Send OTP",
        typeof err === "string" ? err : "Unable to send verification code."
      );
    }
  };

  // 2. Handle OTP digit input
  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nextDigits = [...otpDigits];
    nextDigits[index] = val.slice(-1);
    setOtpDigits(nextDigits);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are entered
    if (val && index === 5 && nextDigits.every((d) => d !== "")) {
      handleVerifyOtp(nextDigits.join(""));
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || otpDigits.join("");
    if (finalCode.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the full 6-digit code.");
      return;
    }

    try {
      const res = await dispatch(
        verifyCustomerOtp({ email: email.trim(), otp: finalCode })
      ).unwrap();

      if (res?.isNewCustomer && res?.requiresPasswordSetup) {
        // New customer: open mandatory password setup modal
        setRegistrationToken(res?.data?.registrationToken);
        setShowPasswordModal(true);
      } else if (res?.data?.token) {
        // Existing customer: auto-login
        router.replace("/customerMain" as any);
      }
    } catch (err: any) {
      Alert.alert(
        "Verification Failed",
        typeof err === "string" ? err : "Invalid or expired verification code."
      );
    }
  };

  // 4. Complete Registration (Mandatory Password Setup)
  const handleCompleteRegistration = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match. Please re-enter.");
      return;
    }
    if (!registrationToken) {
      Alert.alert("Session Expired", "Please verify your email again.");
      setShowPasswordModal(false);
      return;
    }

    try {
      const res = await dispatch(
        completeCustomerRegistration({
          registrationToken,
          password: newPassword,
          confirmPassword,
        })
      ).unwrap();

      setShowPasswordModal(false);
      if (res?.token) {
        router.replace("/customerMain" as any);
      }
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        typeof err === "string" ? err : "Failed to set password."
      );
    }
  };

  // 5. Email & Password Login
  const handlePasswordLogin = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }

    try {
      const result = await dispatch(
        customerPasswordLogin({ email: email.trim(), password })
      ).unwrap();

      if (result?.token) {
        router.replace("/customerMain" as any);
      }
    } catch (err: any) {
      const errMsg = typeof err === "string" ? err : err?.message || "Login failed.";
      if (errMsg.includes("Email OTP") || errMsg.includes("No customer account")) {
        Alert.alert(
          "Password Sign-In",
          errMsg,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Use Email OTP",
              onPress: () => {
                setEmailMethod("otp");
                handleSendOtp();
              },
            },
          ]
        );
      } else {
        Alert.alert("Login Failed", errMsg);
      }
    }
  };

  // 6. Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const redirectUri = Linking.createURL("oauth");
      const clientId = Platform.select({
        ios: "885243883462-efbupk52oumnfo5udjg735rv1nqr197f.apps.googleusercontent.com",
        android:
          "885243883462-eevrcd81b7fpv375elbelgbcotpfklpf.apps.googleusercontent.com",
        default:
          "885243883462-eevrcd81b7fpv375elbelgbcotpfklpf.apps.googleusercontent.com",
      });

      const nonce = Math.random().toString(36).substring(2, 15);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=id_token&scope=${encodeURIComponent(
        "openid profile email"
      )}&nonce=${nonce}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const hashParams = new URLSearchParams(result.url.split("#")[1] || "");
        const parsed = Linking.parse(result.url);
        const idToken =
          hashParams.get("id_token") ||
          (parsed.queryParams?.id_token as string);

        if (idToken) {
          const res = await dispatch(
            customerGoogleAuth({ idToken })
          ).unwrap();
          if (res?.token) {
            router.replace("/customerMain" as any);
          }
        } else {
          Alert.alert("Google Sign-In", "No authentication token was received.");
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Google Sign-In",
        err?.message || "Failed to complete Google authentication."
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Right Skip / Guest Access Button */}
      <View style={styles.topGuestBar}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.replace("/customerMain" as any)}
          style={styles.guestSkipButton}
        >
          <Text style={styles.guestSkipText}>Skip</Text>
          <Feather name="chevron-right" size={scale(15)} color="#008080" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. App Logo & Brand Header */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Home/bhansa-mart-cart-badge.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.brandTitle}>BhansaMart</Text>
            <Text style={styles.brandSubtitle}>
              Fresh food & kitchen essentials in 15 minutes
            </Text>
          </View>

          {/* 2. Primary Method Segment (Email vs Google) */}
          <View style={styles.primarySegmentContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPrimaryMode("email")}
              style={[
                styles.primarySegmentBtn,
                primaryMode === "email" && styles.primarySegmentBtnActive,
              ]}
            >
              <Feather
                name="mail"
                size={scale(14)}
                color={primaryMode === "email" ? "#008080" : "#64748B"}
              />
              <Text
                style={[
                  styles.primarySegmentText,
                  primaryMode === "email" && styles.primarySegmentTextActive,
                ]}
              >
                Continue with Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPrimaryMode("google")}
              style={[
                styles.primarySegmentBtn,
                primaryMode === "google" && styles.primarySegmentBtnActive,
              ]}
            >
              <FontAwesome
                name="google"
                size={scale(14)}
                color={primaryMode === "google" ? "#EA4335" : "#64748B"}
              />
              <Text
                style={[
                  styles.primarySegmentText,
                  primaryMode === "google" && styles.primarySegmentTextActive,
                ]}
              >
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════ 1. GOOGLE MODE ══════════════ */}
          {primaryMode === "google" && (
            <View style={styles.modeCard}>
              <Text style={styles.modeCardDesc}>
                Instant sign-in with your Google account. If you are a new customer, your account will be created automatically without requiring a password.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                style={styles.googleBtn}
              >
                <View style={styles.googleIconContainer}>
                  <FontAwesome name="google" size={scale(17)} color="#EA4335" />
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════ 2. EMAIL MODE ══════════════ */}
          {primaryMode === "email" && (
            <View style={styles.modeCard}>
              {/* Sub-method tabs: Email OTP vs Email & Password */}
              <View style={styles.subTabRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEmailMethod("otp")}
                  style={[
                    styles.subTabBtn,
                    emailMethod === "otp" && styles.subTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      emailMethod === "otp" && styles.subTabTextActive,
                    ]}
                  >
                    Email OTP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setEmailMethod("password")}
                  style={[
                    styles.subTabBtn,
                    emailMethod === "password" && styles.subTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      emailMethod === "password" && styles.subTabTextActive,
                    ]}
                  >
                    Email & Password
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Sub-path A: Email OTP ── */}
              {emailMethod === "otp" && (
                <View>
                  {!otpSent ? (
                    /* Step A1: Enter Email */
                    <View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email address</Text>
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
                            placeholder="name@example.com"
                            placeholderTextColor="#94A3B8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleSendOtp}
                        disabled={isLoading}
                        style={[
                          styles.actionBtn,
                          isLoading && { opacity: 0.8 },
                        ]}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <View style={styles.btnRow}>
                            <Text style={styles.actionBtnText}>
                              Send Verification Code
                            </Text>
                            <Feather
                              name="arrow-right"
                              size={scale(16)}
                              color="#FFFFFF"
                            />
                          </View>
                        )}
                      </TouchableOpacity>

                      <Text style={styles.otpHelperText}>
                        Existing customers log in instantly; new customers will set a password next.
                      </Text>
                    </View>
                  ) : (
                    /* Step A2: Enter 6-digit OTP */
                    <View style={styles.otpSection}>
                      <View style={styles.otpEmailBadge}>
                        <Feather
                          name="shield"
                          size={scale(12)}
                          color="#008080"
                        />
                        <Text style={styles.otpEmailBadgeText}>
                          Code sent to {email}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setOtpSent(false)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.otpChangeEmailText}>Change</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.otpInstruction}>
                        Enter the 6-digit verification code:
                      </Text>

                      {/* 6 Individual Digit Boxes */}
                      <View style={styles.otpDigitsContainer}>
                        {otpDigits.map((digit, idx) => (
                          <TextInput
                            key={idx}
                            ref={(el) => {
                              otpInputsRef.current[idx] = el;
                            }}
                            value={digit}
                            onChangeText={(val) =>
                              handleOtpDigitChange(idx, val)
                            }
                            onKeyPress={({ nativeEvent }) =>
                              handleOtpKeyPress(idx, nativeEvent.key)
                            }
                            keyboardType="number-pad"
                            maxLength={1}
                            style={[
                              styles.otpDigitBox,
                              digit ? styles.otpDigitBoxFilled : null,
                            ]}
                            selectTextOnFocus
                          />
                        ))}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleVerifyOtp()}
                        disabled={isLoading || otpDigits.some((d) => d === "")}
                        style={[
                          styles.actionBtn,
                          (isLoading || otpDigits.some((d) => d === "")) && {
                            opacity: 0.7,
                          },
                        ]}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.actionBtnText}>
                            Verify & Sign In
                          </Text>
                        )}
                      </TouchableOpacity>

                      {/* Resend Timer Row */}
                      <View style={styles.resendRow}>
                        <Text style={styles.resendLabel}>
                          Didn't receive the code?{" "}
                        </Text>
                        <TouchableOpacity
                          disabled={resendTimer > 0 || isLoading}
                          onPress={handleSendOtp}
                        >
                          <Text
                            style={[
                              styles.resendBtnText,
                              resendTimer > 0 && styles.resendBtnDisabled,
                            ]}
                          >
                            {resendTimer > 0
                              ? `Resend in ${resendTimer}s`
                              : "Resend Code"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ── Sub-path B: Email & Password ── */}
              {emailMethod === "password" && (
                <View>
                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email address</Text>
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
                        placeholder="name@example.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TouchableOpacity
                        onPress={() => setEmailMethod("otp")}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.switchOtpLink}>
                          Sign in with OTP?
                        </Text>
                      </TouchableOpacity>
                    </View>
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
                        placeholder="••••••••"
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

                  {/* Remember Me & Forgot Password Row */}
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

                  {/* Login Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handlePasswordLogin}
                    disabled={isLoading}
                    style={[
                      styles.actionBtn,
                      isLoading && { opacity: 0.8 },
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>Sign In</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Delivery Partner Portal Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/deliveryAuth/login" as any)}
            style={styles.deliveryPortalBtn}
          >
            <Feather name="navigation" size={scale(14)} color="#0F766E" />
            <Text style={styles.deliveryPortalText}>
              Deliver with Us? Delivery Partner Portal
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══════════════ MANDATORY NEW CUSTOMER SET PASSWORD MODAL ══════════════ */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {}} // Cannot be dismissed by back button
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.keyIconCircle}>
                  <MaterialCommunityIcons
                    name="key-variant"
                    size={scale(22)}
                    color="#008080"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Set Your Password</Text>
                  <Text style={styles.modalSubtitle}>
                    Mandatory for your new BhansaMart account
                  </Text>
                </View>
              </View>

              <View style={styles.verifiedNoticeBox}>
                <Ionicons
                  name="shield-checkmark"
                  size={scale(16)}
                  color="#15803D"
                />
                <Text style={styles.verifiedNoticeText}>
                  Your email <Text style={{ fontWeight: "700" }}>{email}</Text>{" "}
                  is verified! Set a password so you can sign in anytime using
                  either Email OTP or Password.
                </Text>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputBox}>
                  <Feather
                    name="lock"
                    size={scale(16)}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                  >
                    <Feather
                      name={showNewPassword ? "eye" : "eye-off"}
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
                  <Feather
                    name="lock"
                    size={scale(16)}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
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

              {confirmPassword.length > 0 &&
                newPassword !== confirmPassword && (
                  <Text style={styles.mismatchText}>
                    Passwords do not match.
                  </Text>
                )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCompleteRegistration}
                disabled={
                  isLoading || !newPassword || newPassword !== confirmPassword
                }
                style={[
                  styles.actionBtn,
                  (isLoading ||
                    !newPassword ||
                    newPassword !== confirmPassword) && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    Complete Account Setup
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topGuestBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? moderateScale(48) : moderateScale(18),
    right: scale(18),
    zIndex: 99,
  },
  guestSkipButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    paddingVertical: moderateScale(5),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    gap: scale(2),
  },
  guestSkipText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#008080",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(30),
    paddingBottom: moderateScale(30),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: moderateScale(22),
  },
  logo: {
    width: scale(72),
    height: scale(72),
    marginBottom: moderateScale(6),
  },
  brandTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: moderateScale(2),
  },

  // Primary Segment
  primarySegmentContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: scale(14),
    padding: scale(3),
    marginBottom: moderateScale(16),
  },
  primarySegmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(9),
    borderRadius: scale(11),
    gap: scale(6),
  },
  primarySegmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primarySegmentText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748B",
  },
  primarySegmentTextActive: {
    fontWeight: "700",
    color: "#008080",
  },

  // Mode Card
  modeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(18),
    padding: scale(18),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: moderateScale(14),
  },
  modeCardDesc: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(16),
  },

  // Sub Tabs (OTP vs Password)
  subTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: moderateScale(16),
  },
  subTabBtn: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: scale(14),
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  subTabBtnActive: {
    borderColor: "#008080",
  },
  subTabText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#94A3B8",
  },
  subTabTextActive: {
    fontWeight: "700",
    color: "#008080",
  },

  // Inputs
  inputGroup: {
    marginBottom: moderateScale(13),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(6),
  },
  switchOtpLink: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#008080",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(11),
    paddingHorizontal: scale(11),
    height: moderateScale(46),
  },
  inputIcon: {
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    padding: 0,
  },
  eyeBtn: {
    padding: scale(4),
  },

  // OTP Digit Boxes
  otpSection: {
    alignItems: "center",
  },
  otpEmailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    paddingVertical: moderateScale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(16),
    gap: scale(6),
    marginBottom: moderateScale(10),
  },
  otpEmailBadgeText: {
    fontSize: moderateScale(11.5),
    color: "#0F766E",
    fontWeight: "600",
  },
  otpChangeEmailText: {
    fontSize: moderateScale(11.5),
    color: "#008080",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  otpInstruction: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginBottom: moderateScale(14),
  },
  otpDigitsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(8),
    marginBottom: moderateScale(18),
  },
  otpDigitBox: {
    width: scale(42),
    height: moderateScale(50),
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: scale(10),
    textAlign: "center",
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#008080",
  },
  otpDigitBoxFilled: {
    borderColor: "#008080",
    backgroundColor: "#F0FDFA",
  },
  otpHelperText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textAlign: "center",
    marginTop: moderateScale(10),
  },

  // Options Row
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(4),
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(6),
  },
  checkboxActive: {
    backgroundColor: "#008080",
    borderColor: "#008080",
  },
  rememberText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  forgotText: {
    fontSize: moderateScale(12),
    color: "#008080",
    fontWeight: "600",
  },

  // Action Button
  actionBtn: {
    backgroundColor: "#008080",
    height: moderateScale(46),
    borderRadius: scale(11),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#008080",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },

  // Resend Timer Row
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(12),
  },
  resendLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  resendBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  resendBtnDisabled: {
    color: "#94A3B8",
  },

  // Google Button
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(11),
    height: moderateScale(46),
    gap: scale(10),
  },
  googleIconContainer: {
    width: scale(22),
    alignItems: "center",
  },
  googleBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },

  // Delivery Partner
  deliveryPortalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(6),
    paddingVertical: moderateScale(9),
    borderRadius: scale(10),
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    gap: scale(6),
  },
  deliveryPortalText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F766E",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    paddingHorizontal: scale(18),
  },
  modalContainer: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(22),
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginBottom: moderateScale(12),
  },
  keyIconCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  verifiedNoticeBox: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: scale(10),
    padding: scale(10),
    gap: scale(8),
    marginBottom: moderateScale(14),
  },
  verifiedNoticeText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#166534",
    lineHeight: moderateScale(16),
  },
  mismatchText: {
    fontSize: moderateScale(11.5),
    color: "#DC2626",
    marginBottom: moderateScale(10),
  },
});
