import React, { useState } from "react";
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
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import storage from "@/utils/storage";
import { moderateScale, scale, useTheme } from "@/theme";

export default function AdminLoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter your administrative email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        loginUser({ email: email.trim().toLowerCase(), password })
      ).unwrap();

      const role = result?.user?.role;
      if (role !== "superadmin" && role !== "admin") {
        Alert.alert(
          "Access Denied",
          "This account does not have management or administrative privileges."
        );
        return;
      }

      if (result?.token) {
        await storage.setItem("bhansa_admin_token", result.token);
        router.replace("/AdminMain" as any);
      }
    } catch (err: any) {
      Alert.alert(
        "Authentication Failed",
        err?.message || "Invalid administrative credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? "#0A0F12" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#303B45" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Back & Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace("/(auth)/login" as any)}
          >
            <Feather name="arrow-left" size={scale(20)} color={textSecondary} />
            <Text style={[styles.backText, { color: textSecondary }]}>Customer App</Text>
          </TouchableOpacity>

          {/* Portal Header Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.shieldIconBox}>
              <MaterialCommunityIcons name="shield-crown" size={scale(36)} color="#0284C7" />
            </View>
            <Text style={[styles.title, { color: textPrimary }]}>BhansaMart Portal</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Superadmin & Operations Management Console
            </Text>
          </View>

          {/* Login Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textPrimary }]}>Management Email</Text>
              <View style={[styles.inputBox, { borderColor: border }]}>
                <Feather name="mail" size={scale(18)} color="#94A3B8" />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="superadmin@bhansamart.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textPrimary }]}>Password</Text>
              <View style={[styles.inputBox, { borderColor: border }]}>
                <Feather name="lock" size={scale(18)} color="#94A3B8" />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={scale(18)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleAdminLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                  <Text style={styles.loginBtnText}>Access Console</Text>
                  <Feather name="arrow-right" size={scale(18)} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Security Warning Notice */}
            <View style={styles.securityBox}>
              <Feather name="shield" size={scale(16)} color="#0284C7" />
              <Text style={styles.securityText}>
                No self-service registration. Staff accounts are provisioned exclusively by the platform Superadmin.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
    justifyContent: "center",
    minHeight: "100%",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(24),
  },
  backText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: scale(28),
  },
  shieldIconBox: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(24),
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(14),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: moderateScale(13),
    marginTop: scale(4),
    textAlign: "center",
  },
  card: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: scale(16),
  },
  label: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginBottom: scale(6),
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    height: scale(48),
    gap: scale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
  },
  loginBtn: {
    backgroundColor: "#0284C7",
    borderRadius: scale(10),
    height: scale(48),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(8),
    marginBottom: scale(18),
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    borderRadius: scale(10),
    padding: scale(12),
    gap: scale(10),
  },
  securityText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: "#0369A1",
    lineHeight: scale(16),
  },
});
