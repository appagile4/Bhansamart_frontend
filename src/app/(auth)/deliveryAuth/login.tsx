import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginDeliveryPartner } from "@/store/slices/deliverySlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

export default function DeliveryLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector(
    (state) => state.delivery
  );

  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/DeliveryMain" as any);
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      Alert.alert("Required", "Please enter your email or phone number.");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    const isEmail = identifier.includes("@");
    const payload = isEmail
      ? { email: identifier.trim(), password }
      : { phone: identifier.trim(), password };

    try {
      const result = await dispatch(loginDeliveryPartner(payload)).unwrap();
      if (result?.token) {
        router.replace("/DeliveryMain" as any);
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err || "Invalid delivery partner credentials.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
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
              { paddingTop: Math.max(insets.top, moderateScale(16)) + moderateScale(14) },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.backBtn,
                { top: Math.max(insets.top, moderateScale(16)) + moderateScale(4) },
              ]}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(auth)/login" as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={scale(22)} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.brandBadge}>
              <MaterialCommunityIcons
                name="moped"
                size={scale(36)}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.brandTitle}>BhansaMart Delivery</Text>
            <Text style={styles.brandSubtitle}>
              Delivery Partner Portal • Fast, Flexible, Reliable
            </Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Partner Sign In</Text>
            <Text style={styles.cardSubtext}>
              Access your deliveries, live earnings, and dispatch requests
            </Text>

            {/* Email or Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="user"
                  size={scale(18)}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. partner@example.com or 9801234567"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={scale(18)}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your secure password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={scale(18)}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primaryBtnText}>Enter Partner App</Text>
                  <Feather
                    name="arrow-right"
                    size={scale(18)}
                    color="#FFFFFF"
                    style={{ marginLeft: scale(6) }}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Want to deliver with us? </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(auth)/deliveryAuth/register" as any)
                }
              >
                <Text style={styles.switchLink}>Apply & Register</Text>
              </TouchableOpacity>
            </View>

            {/* Switch to Customer Login */}
            <TouchableOpacity
              style={styles.secondaryRoleBtn}
              onPress={() => router.push("/(auth)/login" as any)}
              activeOpacity={0.7}
            >
              <Feather name="shopping-bag" size={scale(16)} color="#0F766E" />
              <Text style={styles.secondaryRoleText}>
                Switch to Customer Store
              </Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(40),
  },
  headerGradient: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(36),
    alignItems: "center",
    borderBottomLeftRadius: scale(28),
    borderBottomRightRadius: scale(28),
  },
  backBtn: {
    position: "absolute",
    left: scale(16),
    top: moderateScale(16),
    padding: scale(6),
  },
  brandBadge: {
    width: scale(68),
    height: scale(68),
    borderRadius: scale(34),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(10),
  },
  brandTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: moderateScale(12),
    color: "#CCFBF1",
    marginTop: moderateScale(4),
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
  cardHeader: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: moderateScale(4),
  },
  cardSubtext: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginBottom: moderateScale(20),
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
    marginBottom: moderateScale(6),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    height: moderateScale(46),
  },
  inputIcon: {
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  eyeBtn: {
    padding: scale(6),
  },
  primaryBtn: {
    backgroundColor: "#0F766E",
    borderRadius: scale(10),
    height: moderateScale(48),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(8),
  },
  disabledBtn: {
    opacity: 0.65,
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(20),
  },
  switchText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  switchLink: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F766E",
  },
  secondaryRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#CCFBF1",
    backgroundColor: "#F0FDFA",
    gap: scale(6),
  },
  secondaryRoleText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#0F766E",
  },
});
