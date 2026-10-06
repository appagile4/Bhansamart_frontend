import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuthError,
  forgotPassword,
  resendVerificationOTP,
  verifyEmail,
  verifyResetOTP,
} from "@/store/slices/authSlice";
import { moderateScale, scale } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
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

const OTP_LENGTH = 6;

export default function VerificationScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const emailDisplay = params.email || "";
  const mode = params.mode || "register"; // 'register' or 'reset'

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];

    if (cleanText.length > 1) {
      // Handle paste of 6 digits
      const pastedChars = cleanText.slice(0, OTP_LENGTH).split("");
      pastedChars.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedChars.length, OTP_LENGTH - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto move to next input if digit entered
    if (cleanText && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length < OTP_LENGTH) {
      Alert.alert("Error", `Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }

    if (!emailDisplay) {
      Alert.alert("Error", "Missing email address. Please restart the process.");
      return;
    }

    try {
      if (mode === "reset") {
        // Password Reset OTP verification
        const result = await dispatch(
          verifyResetOTP({ email: emailDisplay, otp: enteredOtp })
        ).unwrap();

        Alert.alert("OTP Verified", "Please enter your new password.", [
          {
            text: "Continue",
            onPress: () =>
              router.push({
                pathname: "/change-password" as any,
                params: { resetToken: result.resetToken, mode: "reset" },
              }),
          },
        ]);
      } else {
        // Account Email Verification
        const result = await dispatch(
          verifyEmail({ email: emailDisplay, otp: enteredOtp })
        ).unwrap();

        Alert.alert(
          "Email Verified!",
          result.message || "Your email has been verified successfully. Please log in.",
          [
            {
              text: "Login Now",
              onPress: () => router.replace("/login" as any),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert("Verification Failed", err || error || "Invalid or expired OTP code.");
    }
  };

  const handleResendCode = async () => {
    if (!emailDisplay) {
      Alert.alert("Error", "Missing email address.");
      return;
    }

    try {
      if (mode === "reset") {
        await dispatch(forgotPassword(emailDisplay)).unwrap();
      } else {
        await dispatch(resendVerificationOTP(emailDisplay)).unwrap();
      }
      Alert.alert("Code Resent", `A new 6-digit verification code has been sent to ${emailDisplay}`);
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to resend verification code. Please try again later.");
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
        <Text style={styles.headerTitle}>Enter Your Verification Code</Text>
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
            We sent a 6-digit code to <Text style={styles.emailHighlight}>{emailDisplay || "your email"}</Text>
            {mode === "reset" ? " to reset your password" : " to verify your account"}.
          </Text>

          {/* 6-Digit OTP Boxes */}
          <View style={styles.otpBoxesRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputsRef.current[index] = ref;
                }}
                value={otp[index]}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                style={[
                  styles.otpBox,
                  otp[index] ? styles.otpBoxFilled : null,
                ]}
              />
            ))}
          </View>

          {/* Request a new one link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResendCode}
            style={styles.resendRow}
          >
            <Text style={styles.resendText}>Request a new code </Text>
            <Feather name="arrow-right" size={scale(13)} color="#008080" />
          </TouchableOpacity>

          {/* Verify Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={isLoading}
            style={[styles.verifyBtn, isLoading && { opacity: 0.8 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify Code</Text>
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
    marginBottom: moderateScale(26),
  },
  emailHighlight: {
    fontWeight: "600",
    color: "#0F172A",
  },
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(18),
    gap: scale(6),
  },
  otpBox: {
    flex: 1,
    height: scale(50),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#0F172A",
  },
  otpBoxFilled: {
    borderColor: "#003844",
    backgroundColor: "#F8FAFC",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(24),
  },
  resendText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#008080",
  },
  verifyBtn: {
    backgroundColor: "#003844",
    height: moderateScale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
