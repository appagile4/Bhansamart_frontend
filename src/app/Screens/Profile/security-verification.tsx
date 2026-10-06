import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VerificationStep = "choose_method" | "enter_otp";

export default function SecurityVerificationScreen() {
  const theme = useTheme();
  const [step, setStep] = useState<VerificationStep>("choose_method");
  const [otp, setOtp] = useState<string[]>(["7", "2", "5", "5", "0"]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    Alert.alert("Success", "Email verified and updated successfully!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "#ffffff" }]}
    >
      <StatusBar style="dark" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (step === "enter_otp") {
              setStep("choose_method");
            } else {
              router.back();
            }
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Security verification</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {step === "choose_method" ? (
          /* STEP 1: CHOOSE VERIFICATION METHOD */
          <View style={styles.stepContainer}>
            {/* Top Shield Icon with Checkmark */}
            <View style={styles.shieldWrapper}>
              <View style={styles.shieldCircle}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={scale(72)}
                  color="#8A9BA8"
                />
              </View>
            </View>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              Please choose a way to verify, and we'll send you a otp to a mail.
            </Text>

            {/* Verify through Email Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setStep("enter_otp")}
              style={styles.methodCard}
            >
              <View style={styles.methodLeft}>
                <Feather name="mail" size={scale(22)} color="#334155" />
                <Text style={styles.methodText}>Verify through Email</Text>
              </View>
              <Feather name="chevron-right" size={scale(20)} color="#2D6A4F" />
            </TouchableOpacity>
          </View>
        ) : (
          /* STEP 2: ENTER OTP */
          <View style={styles.stepContainer}>
            {/* Notification sentence */}
            <Text style={styles.otpHeading}>
              We sent an email to <Text style={styles.emailHighlight}>email@gmail.com</Text> with a link to change your password
            </Text>

            {/* 5-Digit OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpBox}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Request a new one link */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Alert.alert("OTP Resent", "A new OTP has been sent.")}
              style={styles.resendRow}
            >
              <Text style={styles.resendText}>Request a new one</Text>
              <Feather name="arrow-right" size={scale(16)} color="#0E7490" />
            </TouchableOpacity>

            {/* Verify Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleVerifyOtp}
              style={styles.verifyBtn}
            >
              <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: scale(4),
    marginRight: scale(14),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(24),
  },
  stepContainer: {
    flex: 1,
  },
  // Step 1 styles
  shieldWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(30),
    marginBottom: moderateScale(30),
  },
  shieldCircle: {
    width: scale(125),
    height: scale(125),
    borderRadius: scale(62.5),
    backgroundColor: "#DCE5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    fontSize: moderateScale(14),
    color: "#475569",
    textAlign: "center",
    lineHeight: moderateScale(20),
    paddingHorizontal: scale(10),
    marginBottom: moderateScale(36),
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    paddingVertical: moderateScale(16),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  methodText: {
    fontSize: moderateScale(14.5),
    fontWeight: "600",
    color: "#334155",
  },
  // Step 2 styles
  otpHeading: {
    fontSize: moderateScale(14),
    color: "#1E293B",
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  emailHighlight: {
    fontWeight: "600",
    color: "#0284C7",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
    gap: scale(8),
  },
  otpBox: {
    flex: 1,
    height: scale(52),
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: moderateScale(28),
  },
  resendText: {
    fontSize: moderateScale(13.5),
    color: "#0891B2",
    fontWeight: "600",
  },
  verifyBtn: {
    backgroundColor: "#003844",
    paddingVertical: moderateScale(14),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  verifyBtnText: {
    color: "#ffffff",
    fontSize: moderateScale(15.5),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
