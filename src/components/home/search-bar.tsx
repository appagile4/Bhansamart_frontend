import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onSearchPress?: () => void;
  onVoicePress?: () => void;
  onPress?: () => void;
  readOnly?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search "Product"',
  onSearchPress,
  onVoicePress,
  onPress,
  readOnly = false,
}: SearchBarProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (onSearchPress) {
      onSearchPress();
    } else {
      router.push("/search" as any);
    }
  };

  const handleVoice = () => {
    if (onVoicePress) {
      onVoicePress();
    } else {
      router.push("/search" as any);
    }
  };

  const searchContainerStyle = [
    styles.container,
    isDark && {
      backgroundColor: "#1B252E",
      borderWidth: 1,
      borderColor: "#303B45",
      shadowOpacity: 0.2,
    },
  ];

  const searchInputStyle = [
    styles.input,
    isDark && {
      color: "#F8FAFC",
    },
  ];

  const searchDividerStyle = [
    styles.divider,
    isDark && {
      backgroundColor: "#303B45",
    },
  ];

  const iconColor = isDark ? "#A8B2BE" : "#555555";
  const micColor = isDark ? "#FFFFFF" : "#222222";
  const placeholderColor = isDark ? "#A8B2BE" : "#888888";

  // If readOnly or onPress is explicitly provided, clicking anywhere routes to search
  if (readOnly || onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={searchContainerStyle}
      >
        {/* Left Search Icon */}
        <View style={styles.iconButton}>
          <Feather name="search" size={scale(20)} color={iconColor} />
        </View>

        {/* Search Placeholder / Text Display */}
        <View style={styles.inputContainer}>
          <TextInput
            style={searchInputStyle}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            editable={false}
            pointerEvents="none"
            value={value}
          />
        </View>

        {/* Subtle Vertical Divider */}
        <View style={searchDividerStyle} />

        {/* Right Voice/Mic Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleVoice}
          style={styles.iconButton}
        >
          <Feather name="mic" size={scale(19)} color={micColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={searchContainerStyle}>
      {/* Left Search Icon */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.iconButton}
      >
        <Feather name="search" size={scale(20)} color={iconColor} />
      </TouchableOpacity>

      {/* Search Input Field */}
      <TextInput
        style={searchInputStyle}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onFocus={handlePress}
        onSubmitEditing={handlePress}
      />

      {/* Subtle Vertical Divider */}
      <View style={searchDividerStyle} />

      {/* Right Voice/Mic Icon */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleVoice}
        style={styles.iconButton}
      >
        <Feather name="mic" size={scale(19)} color={micColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    height: scale(48),
    paddingHorizontal: scale(12),
    marginHorizontal: scale(16),
    marginVertical: moderateScale(10),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  iconButton: {
    padding: scale(4),
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flex: 1,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#1e293b",
    paddingHorizontal: scale(8),
    paddingVertical: 0,
    fontWeight: "400",
  },
  divider: {
    width: 1,
    height: scale(22),
    backgroundColor: "#e2e8f0",
    marginHorizontal: scale(6),
  },
});
