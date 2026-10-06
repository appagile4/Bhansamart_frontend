import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  changePassword,
  clearAuthError,
  resetPassword,
} from "@/store/slices/authSlice";
import { moderateScale, scale } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const params = useLocalSearchParams<{ resetToken?: string; mode?: string }>();
  const isResetMode = params.mode === "reset" || !!params.resetToken;
  const resetToken = params.resetToken || "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleChangePassword = async () => {
    if (!isResetMode && !currentPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert(
        "Error",
        "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      if (isResetMode) {
        // Reset password via resetToken
        if (!resetToken) {
          Alert.alert(
            "Error",
            "Missing reset token. Please request a new password reset OTP.",
          );
          return;
        }

        const result = await dispatch(
          resetPassword({
            resetToken,
            password,
            confirmPassword,
          }),
        ).unwrap();
      } else {
        // Logged-in change password
        const result = await dispatch(
          changePassword({
            currentPassword,
            newPassword: password,
            confirmPassword,
          }),
        ).unwrap();

        Alert.alert(
          "Password Updated",
          result.message || "Your password was updated successfully.",
          [
            {
              text: "Done",
              onPress: () => router.back(),
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err || error || "Failed to update password.");
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
        <Text style={styles.headerTitle}>
          {isResetMode ? "Create New Password" : "Change Password"}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Current Password (Only when logged-in changing password) */}
          {!isResetMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter your current password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showCurrentPassword}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showCurrentPassword ? "eye" : "eye-off"}
                    size={scale(16)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password (min 8 chars)"
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

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
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

          {/* Change Password Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleChangePassword}
            disabled={isLoading}
            style={[styles.changeBtn, isLoading && { opacity: 0.8 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.changeBtnText}>
                {isResetMode ? "Reset Password" : "Change Password"}
              </Text>
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
  inputGroup: {
    marginBottom: moderateScale(18),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
    marginBottom: scale(6),
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
  changeBtn: {
    backgroundColor: "#003844",
    height: moderateScale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(12),
  },
  changeBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
