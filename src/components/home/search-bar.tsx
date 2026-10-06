import { moderateScale, scale } from "@/theme";
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

  // If readOnly or onPress is explicitly provided, clicking anywhere routes to search
  if (readOnly || onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.container}
      >
        {/* Left Search Icon */}
        <View style={styles.iconButton}>
          <Feather name="search" size={scale(20)} color="#555555" />
        </View>

        {/* Search Placeholder / Text Display */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#888888"
            editable={false}
            pointerEvents="none"
            value={value}
          />
        </View>

        {/* Subtle Vertical Divider */}
        <View style={styles.divider} />

        {/* Right Voice/Mic Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleVoice}
          style={styles.iconButton}
        >
          <Feather name="mic" size={scale(19)} color="#222222" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left Search Icon */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.iconButton}
      >
        <Feather name="search" size={scale(20)} color="#555555" />
      </TouchableOpacity>

      {/* Search Input Field */}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onFocus={handlePress}
        onSubmitEditing={handlePress}
      />

      {/* Subtle Vertical Divider */}
      <View style={styles.divider} />

      {/* Right Voice/Mic Icon */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleVoice}
        style={styles.iconButton}
      >
        <Feather name="mic" size={scale(19)} color="#222222" />
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
