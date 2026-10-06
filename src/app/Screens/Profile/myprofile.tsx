import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
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

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  changePassword,
  removeAvatarImage,
  updateUserProfile,
  uploadAvatarImage,
} from "@/store/slices/authSlice";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const GRADIENT_COLORS = ["#003844", "#004d5d", "#016073"] as const;

export default function MyProfileDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  // Profile Avatar state
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.avatar || null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isImagePickerModalOpen, setIsImagePickerModalOpen] = useState(false);

  // Field Values populated from Redux Auth state
  const [fullName, setFullName] = useState(user?.name || "Customer");
  const mobileNumber = "+977-9860412256"; // Non-editable per requirement
  const [email, setEmail] = useState(user?.email || "user@bhansamart.com");
  const [gender, setGender] = useState(user?.gender || "Male");

  // Date of birth state using real Date object
  const [birthDate, setBirthDate] = useState<Date>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : new Date(2000, 0, 1)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [iosTempDate, setIosTempDate] = useState<Date>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : new Date(2000, 0, 1)
  );

  // Draft inputs for expandable editing
  const [draftName, setDraftName] = useState(user?.name || "");
  const [draftEmail, setDraftEmail] = useState(user?.email || "");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Accordion expanded sections: 'name' | 'password' | 'email' | 'gender'
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Sync state when Redux user updates
  useEffect(() => {
    if (user) {
      if (user.avatar !== undefined) setProfileImage(user.avatar || null);
      if (user.name) {
        setFullName(user.name);
        setDraftName(user.name);
      }
      if (user.email) {
        setEmail(user.email);
        setDraftEmail(user.email);
      }
      if (user.gender) setGender(user.gender);
      if (user.dateOfBirth) {
        const d = new Date(user.dateOfBirth);
        setBirthDate(d);
        setIosTempDate(d);
      }
    }
  }, [user]);

  const toggleSection = (sectionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  };

  // Gallery picker -> Upload to Cloudinary & MongoDB
  const pickImageFromGallery = async () => {
    setIsImagePickerModalOpen(false);
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to select a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setProfileImage(localUri);
        setIsUploadingAvatar(true);

        try {
          const uploadRes = await dispatch(uploadAvatarImage(localUri)).unwrap();
          if (uploadRes?.avatar) {
            setProfileImage(uploadRes.avatar);
          }
          Alert.alert("Success", "Profile photo uploaded to Cloudinary successfully!");
        } catch (uploadErr: any) {
          Alert.alert("Upload Failed", uploadErr || "Failed to upload image to Cloudinary.");
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.log("Image picker error", error);
      Alert.alert("Error", "Could not select image. Please try again.");
    }
  };

  // Camera picker -> Upload to Cloudinary & MongoDB
  const takePhotoWithCamera = async () => {
    setIsImagePickerModalOpen(false);
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to capture a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setProfileImage(localUri);
        setIsUploadingAvatar(true);

        try {
          const uploadRes = await dispatch(uploadAvatarImage(localUri)).unwrap();
          if (uploadRes?.avatar) {
            setProfileImage(uploadRes.avatar);
          }
          Alert.alert("Success", "Profile photo captured and uploaded to Cloudinary!");
        } catch (uploadErr: any) {
          Alert.alert("Upload Failed", uploadErr || "Failed to upload image to Cloudinary.");
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.log("Camera error", error);
      Alert.alert("Error", "Could not capture image. Please try again.");
    }
  };

  // Remove photo from Cloudinary and MongoDB
  const removePhoto = async () => {
    setIsImagePickerModalOpen(false);
    try {
      setIsUploadingAvatar(true);
      await dispatch(removeAvatarImage()).unwrap();
      setProfileImage(null);
      Alert.alert("Success", "Profile photo removed successfully!");
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to remove photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save Full Name to MongoDB
  const handleSaveName = async () => {
    if (!draftName.trim()) {
      Alert.alert("Error", "Full Name cannot be empty.");
      return;
    }

    try {
      await dispatch(updateUserProfile({ name: draftName.trim() })).unwrap();
      setFullName(draftName.trim());
      toggleSection("name");
      Alert.alert("Success", "Name updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update name.");
    }
  };

  // Save Password to MongoDB
  const handleSavePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Alert.alert(
        "Error",
        "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const res = await dispatch(
        changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        })
      ).unwrap();

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toggleSection("password");
      Alert.alert("Success", res.message || "Password updated securely!");
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update password.");
    }
  };

  const handleVerifyEmail = () => {
    if (!draftEmail.trim() || !draftEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    setEmail(draftEmail);
    toggleSection("email");
    router.push({
      pathname: "/Screens/Profile/security-verification" as any,
      params: { type: "email", value: draftEmail },
    });
  };

  // Save Gender to MongoDB
  const handleSelectGender = async (val: string) => {
    try {
      await dispatch(updateUserProfile({ gender: val })).unwrap();
      setGender(val);
      toggleSection("gender");
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update gender.");
    }
  };

  // Date picker handlers
  const handleOpenDatePicker = () => {
    if (Platform.OS === "ios") {
      setIosTempDate(birthDate);
    }
    setShowDatePicker(true);
  };

  const handleDateChange = async (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        setBirthDate(selectedDate);
        try {
          await dispatch(
            updateUserProfile({ dateOfBirth: selectedDate.toISOString() })
          ).unwrap();
        } catch (err: any) {
          Alert.alert("Error", err || "Failed to update date of birth.");
        }
      }
    } else {
      if (selectedDate) {
        setIosTempDate(selectedDate);
      }
    }
  };

  const handleDateDismiss = () => {
    setShowDatePicker(false);
  };

  const handleConfirmIosDate = async () => {
    setBirthDate(iosTempDate);
    setShowDatePicker(false);
    try {
      await dispatch(
        updateUserProfile({ dateOfBirth: iosTempDate.toISOString() })
      ).unwrap();
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to update date of birth.");
    }
  };

  const formattedDob = `${birthDate.getDate().toString().padStart(2, "0")} ${
    MONTH_NAMES[birthDate.getMonth()]
  } ${birthDate.getFullYear()}`;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* 1. Header Hero with Linear Gradient */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.safeHero}>
          {/* Top Nav Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={scale(22)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Edit Profile</Text>
            <View style={{ width: scale(38) }} />
          </View>

          {/* Avatar Hero Container */}
          <View style={styles.heroContent}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarOuterRing}>
                {isUploadingAvatar ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  </View>
                ) : profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Edit Camera Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsImagePickerModalOpen(true)}
                style={styles.cameraBadgeContainer}
              >
                <LinearGradient
                  colors={["#008080", "#004d5d"]}
                  style={styles.cameraBadge}
                >
                  <Ionicons name="camera" size={scale(15)} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroUserName}>{fullName}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedMemberBadge}>
                <Ionicons name="shield-checkmark" size={scale(13)} color="#F59E0B" />
                <Text style={styles.verifiedMemberText}>Verified Account</Text>
              </View>
            </View>
          </View>

          {/* Decorative Background Circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </SafeAreaView>
      </LinearGradient>

      {/* 2. Scrollable Profile Information Cards */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section: Personal Info */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionSubtitle}>Manage your basic profile details</Text>
        </View>

        <View style={styles.card}>
          {/* Full Name */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleSection("name")}
              style={styles.fieldRow}
            >
              <View style={styles.fieldLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#E0F2FE" }]}>
                  <Feather name="user" size={scale(17)} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {fullName}
                  </Text>
                </View>
              </View>

              <View style={styles.fieldAction}>
                <Text style={styles.editActionText}>
                  {expandedSection === "name" ? "Close" : "Edit"}
                </Text>
                <Feather
                  name={
                    expandedSection === "name"
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={scale(16)}
                  color="#008080"
                />
              </View>
            </TouchableOpacity>

            {/* Dropdown Edit Full Name */}
            {expandedSection === "name" && (
              <View style={styles.dropdownContent}>
                <Text style={styles.inputSubLabel}>Enter your updated full name</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    placeholder="Enter full name"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSaveName}
                  disabled={isLoading}
                  style={styles.actionGradientBtnWrapper}
                >
                  <LinearGradient
                    colors={GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtn}
                  >
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.dividerLine} />

          {/* Gender */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleSection("gender")}
              style={styles.fieldRow}
            >
              <View style={styles.fieldLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#F3E8FF" }]}>
                  <Ionicons name="male-female-outline" size={scale(17)} color="#9333EA" />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <Text style={styles.fieldValue}>{gender}</Text>
                </View>
              </View>

              <View style={styles.fieldAction}>
                <Text style={styles.editActionText}>
                  {expandedSection === "gender" ? "Close" : "Change"}
                </Text>
                <Feather
                  name={
                    expandedSection === "gender"
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={scale(16)}
                  color="#008080"
                />
              </View>
            </TouchableOpacity>

            {/* Dropdown Select Gender */}
            {expandedSection === "gender" && (
              <View style={styles.dropdownContent}>
                <Text style={styles.inputSubLabel}>Select your gender</Text>
                <View style={styles.genderOptionsGrid}>
                  {["Male", "Female", "Other", "Prefer not to say"].map(
                    (opt) => {
                      const isSelected = gender === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          activeOpacity={0.75}
                          onPress={() => handleSelectGender(opt)}
                          style={[
                            styles.genderOptionPill,
                            isSelected && styles.genderOptionPillActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleActive,
                            ]}
                          >
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.genderOptionText,
                              isSelected && styles.genderOptionTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={styles.dividerLine} />

          {/* Date of Birth with DateTimePicker */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenDatePicker}
              style={styles.fieldRow}
            >
              <View style={styles.fieldLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                  <Feather name="calendar" size={scale(17)} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  <Text style={styles.fieldValue}>{formattedDob}</Text>
                </View>
              </View>

              <View style={styles.fieldAction}>
                <Text style={styles.editActionText}>Select</Text>
                <Feather name="calendar" size={scale(16)} color="#008080" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Contact & Security */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contact & Security</Text>
          <Text style={styles.sectionSubtitle}>Primary contact info and authentication</Text>
        </View>

        <View style={styles.card}>
          {/* Mobile no. (Non-editable per requirement) */}
          <View style={styles.fieldBlock}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
                  <Feather name="phone" size={scale(17)} color="#16A34A" />
                </View>
                <View>
                  <View style={styles.lockedLabelContainer}>
                    <Text style={styles.fieldLabel}>Mobile Number</Text>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={scale(12)} color="#16A34A" />
                      <Text style={styles.verifiedTagText}>Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.lockedValueText}>{mobileNumber}</Text>
                  <Text style={styles.lockedNoteText}>Non-editable • Linked for OTP security</Text>
                </View>
              </View>

              <View style={styles.lockIconBox}>
                <Feather name="lock" size={scale(15)} color="#94A3B8" />
              </View>
            </View>
          </View>

          <View style={styles.dividerLine} />

          {/* Email */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleSection("email")}
              style={styles.fieldRow}
            >
              <View style={styles.fieldLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#FFEDD5" }]}>
                  <Feather name="mail" size={scale(17)} color="#EA580C" />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <View style={styles.fieldAction}>
                <Text style={styles.editActionText}>
                  {expandedSection === "email" ? "Close" : "Change"}
                </Text>
                <Feather
                  name={
                    expandedSection === "email"
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={scale(16)}
                  color="#008080"
                />
              </View>
            </TouchableOpacity>

            {/* Dropdown Edit Email */}
            {expandedSection === "email" && (
              <View style={styles.dropdownContent}>
                <Text style={styles.inputSubLabel}>Enter new email address</Text>
                <View style={styles.emailInputWrapper}>
                  <TextInput
                    value={draftEmail}
                    onChangeText={setDraftEmail}
                    placeholder="Enter email address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleVerifyEmail}
                    style={styles.actionGradientBtnWrapper}
                  >
                    <LinearGradient
                      colors={GRADIENT_COLORS}
                      style={styles.verifyActionBtn}
                    >
                      <Text style={styles.verifyActionBtnText}>Verify OTP</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.dividerLine} />

          {/* Password */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleSection("password")}
              style={styles.fieldRow}
            >
              <View style={styles.fieldLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#F1F5F9" }]}>
                  <Feather name="shield" size={scale(17)} color="#475569" />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Account Password</Text>
                  <Text style={styles.fieldValue}>••••••••••••</Text>
                </View>
              </View>

              <View style={styles.fieldAction}>
                <Text style={styles.editActionText}>
                  {expandedSection === "password" ? "Close" : "Update"}
                </Text>
                <Feather
                  name={
                    expandedSection === "password"
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={scale(16)}
                  color="#008080"
                />
              </View>
            </TouchableOpacity>

            {/* Dropdown Change Password */}
            {expandedSection === "password" && (
              <View style={styles.dropdownContent}>
                <Text style={styles.inputSubLabel}>Change your account password</Text>

                <View style={styles.passwordInputBox}>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Current Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showCurrentPass}
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPass((p) => !p)}
                  >
                    <Feather
                      name={showCurrentPass ? "eye-off" : "eye"}
                      size={scale(16)}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>

                <View style={[styles.passwordInputBox, { marginTop: scale(8) }]}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New Password (min 8 chars)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPass}
                    style={styles.textInput}
                  />
                  <TouchableOpacity onPress={() => setShowNewPass((p) => !p)}>
                    <Feather
                      name={showNewPass ? "eye-off" : "eye"}
                      size={scale(16)}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>

                <View style={[styles.passwordInputBox, { marginTop: scale(8) }]}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPass}
                    style={styles.textInput}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSavePassword}
                  disabled={isLoading}
                  style={styles.actionGradientBtnWrapper}
                >
                  <LinearGradient
                    colors={GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtn}
                  >
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Security Note Banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="information-circle-outline" size={scale(18)} color="#008080" />
          <Text style={styles.securityBannerText}>
            Your personal information is encrypted with 256-bit SSL for maximum privacy and safety.
          </Text>
        </View>
      </ScrollView>

      {/* 3. Android / iOS DateTimePicker Integration */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          minimumDate={new Date(1920, 0, 1)}
          onChange={handleDateChange}
        />
      )}

      {/* iOS Modal DatePicker */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalCard}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosModalTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={handleConfirmIosDate}>
                  <Text style={styles.iosModalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={iosTempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={handleDateChange}
                textColor="#0F172A"
                style={{ height: scale(200) }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* 4. Custom Image Picker Bottom Modal */}
      <Modal
        visible={isImagePickerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImagePickerModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsImagePickerModalOpen(false)}
        >
          <View style={styles.bottomSheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            <Text style={styles.sheetSubtitle}>Choose how you want to update your avatar</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={pickImageFromGallery}
              style={styles.sheetOption}
            >
              <View style={[styles.sheetOptionIconBox, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="images-outline" size={scale(20)} color="#0284C7" />
              </View>
              <View style={styles.sheetOptionTextBox}>
                <Text style={styles.sheetOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.sheetOptionSub}>Select an existing photo from library</Text>
              </View>
              <Feather name="chevron-right" size={scale(18)} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={takePhotoWithCamera}
              style={styles.sheetOption}
            >
              <View style={[styles.sheetOptionIconBox, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="camera-outline" size={scale(20)} color="#16A34A" />
              </View>
              <View style={styles.sheetOptionTextBox}>
                <Text style={styles.sheetOptionTitle}>Take a Photo</Text>
                <Text style={styles.sheetOptionSub}>Use your camera to click a new picture</Text>
              </View>
              <Feather name="chevron-right" size={scale(18)} color="#94A3B8" />
            </TouchableOpacity>

            {profileImage && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={removePhoto}
                style={[styles.sheetOption, { borderBottomWidth: 0 }]}
              >
                <View style={[styles.sheetOptionIconBox, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="trash-2" size={scale(18)} color="#EF4444" />
                </View>
                <View style={styles.sheetOptionTextBox}>
                  <Text style={[styles.sheetOptionTitle, { color: "#EF4444" }]}>Remove Photo</Text>
                  <Text style={styles.sheetOptionSub}>Reset to default initials</Text>
                </View>
                <Feather name="chevron-right" size={scale(18)} color="#94A3B8" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsImagePickerModalOpen(false)}
              style={styles.sheetCancelButton}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  heroGradient: {
    borderBottomLeftRadius: scale(28),
    borderBottomRightRadius: scale(28),
    overflow: "hidden",
    paddingBottom: moderateScale(22),
    position: "relative",
  },
  safeHero: {
    position: "relative",
  },
  decorCircle1: {
    position: "absolute",
    top: -scale(40),
    right: -scale(40),
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -scale(20),
    left: -scale(30),
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: moderateScale(6),
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: moderateScale(10),
  },
  avatarOuterRing: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: "#003844",
  },
  avatarImg: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
  },
  avatarPlaceholder: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: "#004d5d",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: moderateScale(28),
    fontWeight: "800",
  },
  cameraBadgeContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraBadge: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroUserName: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: moderateScale(4),
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  verifiedMemberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: scale(10),
    paddingVertical: scale(3.5),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  verifiedMemberText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(60),
  },
  sectionHeader: {
    marginBottom: moderateScale(8),
    marginTop: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(1),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
    marginBottom: moderateScale(14),
  },
  fieldBlock: {
    paddingHorizontal: scale(14),
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(14),
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  iconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: moderateScale(13.5),
    fontWeight: "600",
    color: "#1E293B",
  },
  fieldValue: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    fontWeight: "500",
    marginTop: scale(2),
  },
  fieldAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  editActionText: {
    fontSize: moderateScale(12.5),
    color: "#008080",
    fontWeight: "700",
  },
  lockedLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    gap: scale(3),
  },
  verifiedTagText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#16A34A",
  },
  lockedValueText: {
    fontSize: moderateScale(13),
    color: "#334155",
    fontWeight: "700",
    marginTop: scale(2),
  },
  lockedNoteText: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    marginTop: scale(2),
  },
  lockIconBox: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: scale(50),
  },
  dropdownContent: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputSubLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: scale(8),
  },
  inputBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(10) : scale(6),
  },
  passwordInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(10) : scale(6),
    justifyContent: "space-between",
  },
  emailInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: Platform.OS === "ios" ? scale(6) : scale(3),
    gap: scale(8),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    color: "#0F172A",
  },
  actionGradientBtnWrapper: {
    borderRadius: scale(8),
    overflow: "hidden",
  },
  verifyActionBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  verifyActionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  saveBtn: {
    paddingVertical: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(10),
    borderRadius: scale(8),
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  genderOptionsGrid: {
    gap: scale(8),
  },
  genderOptionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(10),
  },
  genderOptionPillActive: {
    borderColor: "#008080",
    backgroundColor: "#F0FDF4",
  },
  radioCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#008080",
  },
  radioDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#008080",
  },
  genderOptionText: {
    fontSize: moderateScale(13),
    color: "#334155",
    fontWeight: "500",
  },
  genderOptionTextActive: {
    color: "#008080",
    fontWeight: "700",
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    backgroundColor: "#F0FDFA",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#CCFBF1",
    marginTop: scale(4),
  },
  securityBannerText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#0F766E",
    fontWeight: "500",
    lineHeight: scale(16),
  },
  // iOS DateTimePicker Modal
  iosModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  iosModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingBottom: scale(30),
    paddingTop: scale(16),
  },
  iosModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iosModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#0F172A",
  },
  iosModalCancelText: {
    fontSize: moderateScale(14),
    color: "#64748B",
    fontWeight: "600",
  },
  iosModalDoneText: {
    fontSize: moderateScale(14),
    color: "#008080",
    fontWeight: "700",
  },
  // Image picker sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: scale(20),
    paddingTop: scale(12),
    paddingBottom: scale(34),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: scale(36),
    height: scale(4),
    backgroundColor: "#CBD5E1",
    borderRadius: scale(2),
    alignSelf: "center",
    marginBottom: scale(14),
  },
  sheetTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    marginTop: scale(2),
    marginBottom: scale(16),
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(14),
  },
  sheetOptionIconBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionTextBox: {
    flex: 1,
  },
  sheetOptionTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  sheetOptionSub: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  sheetCancelButton: {
    marginTop: scale(16),
    paddingVertical: scale(12),
    backgroundColor: "#F1F5F9",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#475569",
  },
});
