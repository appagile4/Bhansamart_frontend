import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthError, loginUser } from "@/store/slices/authSlice";
import { moderateScale, scale } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Prevent back navigation on Android while on Login screen
  useEffect(() => {
    const onBackPress = () => {
      return true; // Blocks going back
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/customerMain" as any);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }

    try {
      const result = await dispatch(
        loginUser({ email: email.trim(), password }),
      ).unwrap();

      if (result?.token) {
        router.replace("/customerMain" as any);
      }
    } catch (err: any) {
      if (err?.raw?.data?.isEmailVerified === false) {
      } else {
        Alert.alert(
          "Login Failed",
          err?.message || error || "Invalid credentials.",
        );
      }
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Google Sign-In",
      "Google Sign-In is coming soon in the next update!",
    );
  };

  const handleVendorPress = () => {
    router.push("/(auth)/vendorAuth/login/vendorlogin" as any);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Right Glass Mirror Vendor Button */}
      <View style={styles.vendorGlassWrapper}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleVendorPress}
          style={styles.vendorGlassButton}
        >
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0.85)",
              "rgba(255, 255, 255, 0.45)",
              "rgba(0, 56, 68, 0.08)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vendorGlassGradient}
          >
            {/* Mirror Glass Sheen Overlay */}

            <View style={styles.vendorIconBadge}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(15)}
                color="#003844"
              />
            </View>
            <Text style={styles.vendorText}>Vendor</Text>
            <Feather
              name="chevron-right"
              size={scale(13)}
              color="#005B66"
              style={{ marginLeft: -scale(2) }}
            />
          </LinearGradient>
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
          {/* 1. App Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Home/bhansa-mart-cart-badge.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* 2. Input Fields */}
          <View style={styles.formContainer}>
            {/* Email Address */}
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
                  placeholder="Email address"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Password */}
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
                  placeholder="Password"
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
                  style={[styles.checkbox, rememberMe && styles.checkboxActive]}
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
                <Text style={styles.forgotText}>Forget password ?</Text>
              </TouchableOpacity>
            </View>

            {/* Terms of Service & Privacy Policy */}
            <Text style={styles.termsText}>
              By continuing you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Services</Text> &{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginBtn, isLoading && { opacity: 0.8 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Or Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign in with Google */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
              style={styles.googleBtn}
            >
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
              <View style={styles.googleIconContainer}>
                <FontAwesome name="google" size={scale(17)} color="#EA4335" />
              </View>
            </TouchableOpacity>

            {/* Footer: Sign up link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have Account? </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/sign-up" as any)}
              >
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Decorative Bottom Corner Wave Accent */}
      <View style={styles.bottomCornerWave} pointerEvents="none" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(30),
  },
  logo: {
    width: scale(380),
    height: scale(210),
  },
  formContainer: {
    width: "100%",
    marginTop: -scale(50),
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
    borderColor: "#E2E8F0",
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
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(2),
    marginBottom: moderateScale(12),
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
  termsText: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(15),
    marginBottom: moderateScale(18),
  },
  termsLink: {
    color: "#008080",
    fontWeight: "600",
  },
  loginBtn: {
    backgroundColor: "#003844",
    height: moderateScale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: moderateScale(16),
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
    fontWeight: "500",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: moderateScale(44),
    borderRadius: scale(8),
    gap: scale(8),
  },
  googleBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
  },
  googleIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(22),
  },
  footerText: {
    fontSize: moderateScale(12),
    color: "#475569",
  },
  signUpLink: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  bottomCornerWave: {
    position: "absolute",
    bottom: -scale(30),
    left: -scale(30),
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    backgroundColor: "#86C4CB",
    opacity: 0.55,
    transform: [{ scaleX: 1.4 }, { scaleY: 0.9 }],
  },
  vendorGlassWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? moderateScale(44) : moderateScale(18),
    right: scale(18),
    zIndex: 99,
    // Glass shadow & glow
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  vendorGlassButton: {
    borderRadius: scale(22),
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    overflow: "hidden",
  },
  vendorGlassGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(22),
    gap: scale(6),
  },
  vendorSheenHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
  },
  vendorIconBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "rgba(0, 56, 68, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#003844",
    letterSpacing: 0.3,
  },
});
