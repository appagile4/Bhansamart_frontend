import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthError, forgotPassword } from "@/store/slices/authSlice";
import { moderateScale, scale } from "@/theme";
import { Feather } from "@expo/vector-icons";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleSend = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      const result = await dispatch(forgotPassword(email.trim())).unwrap();

      Alert.alert(
        "Verification Code Sent",
        result.response.message || "If an account exists with this email, a verification code has been sent.",
        [
          {
            text: "Enter OTP",
            onPress: () =>
              router.push({
                pathname: "/verification" as any,
                params: { email: email.trim(), mode: "reset" },
              }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err || error || "Failed to send reset code.");
    }
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
        <Text style={styles.headerTitle}>Reset Password</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Subtitle Description */}
          <Text style={styles.descriptionText}>
            Enter your email, and we'll send you a 6-digit verification code to reset your password.
          </Text>

          {/* Email Input */}
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

          {/* Send Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={isLoading}
            style={[styles.sendBtn, isLoading && { opacity: 0.8 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Send Code</Text>
            )}
          </TouchableOpacity>
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
    paddingTop: moderateScale(20),
  },
  descriptionText: {
    fontSize: moderateScale(12.5),
    color: "#334155",
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(22),
  },
  inputGroup: {
    marginBottom: moderateScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
    marginBottom: scale(6),
  },
  inputBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    justifyContent: "center",
  },
  textInput: {
    fontSize: moderateScale(13),
    color: "#0F172A",
    height: "100%",
  },
  sendBtn: {
    backgroundColor: "#003844",
    height: moderateScale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(8),
  },
  sendBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
