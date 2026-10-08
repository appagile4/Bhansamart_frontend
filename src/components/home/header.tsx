import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryScroller from "./category-scroller";
import SearchBar from "./search-bar";

interface HeaderProps {
  storeName?: string;
  location?: string;
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
  onLocationPress?: () => void;
  onStorePress?: () => void;
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onVoicePress?: () => void;
}

export default function Header({
  storeName = "Delivery Address",
  location = "",
  selectedCategory = "all",
  onSelectCategory,
  onLocationPress,
  onStorePress,
  onProfilePress,
  onSearchPress,
  onVoicePress,
}: HeaderProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [searchValue, setSearchValue] = useState("");

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    onSelectCategory?.(id);
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push("/search" as any);
    }
  };

  const handleVoicePress = () => {
    if (onVoicePress) {
      onVoicePress();
    } else {
      router.push("/search" as any);
    }
  };

  return (
    <LinearGradient
      colors={["#003844", "#004d5d", "#016073"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Top Header Row (Store Info, Location, Store & Profile Icons) */}
        <View style={styles.topRow}>
          {/* Left Store & Location Info */}
          <View style={styles.locationContainer}>
            <Text style={styles.storeName}>{storeName}</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onLocationPress}
              style={styles.locationButton}
            >
              <Ionicons
                name="location-sharp"
                size={scale(14)}
                color="#38BDF8"
                style={{ marginRight: scale(4) }}
              />
              <Text numberOfLines={1} style={styles.locationText}>
                {location}
              </Text>
              <Feather
                name="chevron-down"
                size={scale(15)}
                color="#ffffff"
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Right Action Icons (Storefront & User Profile Avatar) */}
          <View style={styles.actionsContainer}>
            {/* Storefront Icon */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onStorePress}
              style={styles.storeButton}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(24)}
                color="#ffffff"
              />
            </TouchableOpacity>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onProfilePress}
              style={styles.profileAvatar}
            >
              <Ionicons name="person" size={scale(18)} color="#003844" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar Component */}
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          onSearchPress={handleSearchPress}
          onPress={handleSearchPress}
          onVoicePress={handleVoicePress}
        />

        {/* Category Horizontal Scroller Component */}
        <CategoryScroller
          selectedCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* 3-Part Promotional Brand Banner at Bottom of Header */}
        <View style={styles.bannerRow}>
          {/* Left Vegetable / Food Graphic (Independent Style) */}
          <Image
            source={require("@/assets/images/Home/fresh-cauliflower.png")}
            style={styles.bannerLeftImg}
            contentFit="contain"
          />

          {/* Center Brand Logo + Tagline */}
          <View style={styles.bannerCenterContent}>
            <Image
              source={require("@/assets/images/Home/bhansa-mart-banner-logo.png")}
              style={styles.bannerCenterLogo}
              contentFit="contain"
            />
            <Text style={styles.bannerTagline}>
              Simplifying Your Kitchen Needs.
            </Text>
          </View>

          {/* Right Cheese / Food Graphic (Independent Style) */}
          <Image
            source={require("@/assets/images/Home/swiss-cheese-wedge.png")}
            style={styles.bannerRightImg}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    width: "100%",
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  safeArea: {
    paddingBottom: moderateScale(10),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(4),
  },
  locationContainer: {
    flex: 1,
    paddingRight: scale(12),
  },
  storeName: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
    marginBottom: moderateScale(2),
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: moderateScale(13),
    color: "#e2f1f5",
    fontWeight: "500",
    maxWidth: "85%",
  },
  chevronIcon: {
    marginLeft: scale(3),
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  storeButton: {
    width: scale(38),
    height: scale(38),
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(8),
    marginTop: moderateScale(4),
    minHeight: scale(88),
    position: "relative",
    overflow: "hidden",
  },
  bannerLeftImg: {
    position: "absolute",
    left: -scale(70),
    bottom: -scale(70),
    width: scale(222),
    height: scale(222),
    opacity: 0.1,
    transform: [{ rotate: "45deg" }],
  },
  bannerCenterContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(4),
    zIndex: 2,
  },
  bannerCenterLogo: {
    width: scale(190),
    height: scale(60),
  },
  bannerTagline: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#ffffff",
    marginTop: moderateScale(-8),
    textAlign: "center",
    letterSpacing: 0.3,
  },
  bannerRightImg: {
    position: "absolute",
    right: -scale(40),
    top: -scale(36),
    width: scale(162),
    height: scale(162),
    opacity: 0.1,
  },
});
