import { moderateScale, scale, useTheme } from "@/theme";
import { useUnreadNotifications } from "@/utils/notificationSync";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoryScroller from "./category-scroller";
import SearchBar from "./search-bar";

// ── Static Constant Gradients & Points (Avoid recreating arrays/objects per frame) ──
const DARK_GRADIENT_COLORS: readonly [string, string, ...string[]] = [
  "#003C3A",
  "#061A19",
  "#080D0F",
];
const LIGHT_GRADIENT_COLORS: readonly [string, string, ...string[]] = [
  "#003844",
  "#004d5d",
  "#016073",
];
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 0, y: 1 } as const;

// ── Static Image Assets ─────────────────────────────────────────────────────────────
const BANNER_LEFT_IMG = require("@/assets/images/Home/fresh-cauliflower.png");
const BANNER_CENTER_LOGO = require("@/assets/images/Home/bhansa-mart-banner-logo.png");
const BANNER_RIGHT_IMG = require("@/assets/images/Home/swiss-cheese-wedge.png");

interface HeaderProps {
  storeName?: string;
  location?: string;
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
  onLocationPress?: () => void;
  onStorePress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onVoicePress?: () => void;
}

// ── Memoized Notification Bell Button ───────────────────────────────────────────────
// Isolates real-time unreadCount changes so the entire Header doesn't re-render
const NotificationBellButton = memo(function NotificationBellButton({
  isDark,
  onPress,
}: {
  isDark: boolean;
  onPress: () => void;
}) {
  const { unreadCount } = useUnreadNotifications("customer");

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.notifButton,
        isDark && {
          backgroundColor: "#151D24",
          borderRadius: scale(19),
          borderWidth: 1,
          borderColor: "#303B45",
        },
      ]}
      accessibilityLabel="Notifications"
    >
      <Feather
        name="bell"
        size={scale(19)}
        color={isDark ? "#F8FAFC" : "#ffffff"}
      />
      {unreadCount > 0 && (
        <View style={styles.notifBadge} pointerEvents="none">
          <Text style={styles.notifBadgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ── Memoized Static Promotional Banner ──────────────────────────────────────────────
// Pure visual decoration: cached in memory, zero layout recalculations on scroll
const HeaderBanner = memo(function HeaderBanner() {
  return (
    <View style={styles.bannerRow} pointerEvents="none">
      {/* Left Vegetable / Food Graphic (Independent Style) */}
      <Image
        source={BANNER_LEFT_IMG}
        style={styles.bannerLeftImg}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey="home-header-cauliflower"
        transition={null}
      />

      {/* Center Brand Logo + Tagline */}
      <View style={styles.bannerCenterContent}>
        <Image
          source={BANNER_CENTER_LOGO}
          style={styles.bannerCenterLogo}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey="home-header-logo"
          transition={null}
        />
        <Text style={styles.bannerTagline}>
          Simplifying Your Kitchen Needs.
        </Text>
      </View>

      {/* Right Cheese / Food Graphic (Independent Style) */}
      <Image
        source={BANNER_RIGHT_IMG}
        style={styles.bannerRightImg}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey="home-header-cheese"
        transition={null}
      />
    </View>
  );
});

function Header({
  storeName = "Delivery Address",
  location = "",
  selectedCategory = "all",
  onSelectCategory,
  onLocationPress,
  onStorePress,
  onNotificationPress,
  onProfilePress,
  onSearchPress,
  onVoicePress,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const [searchValue, setSearchValue] = useState("");

  const handleNotificationPress = useCallback(() => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/Screens/Profile/notifications" as any);
    }
  }, [onNotificationPress, router]);

  const handleCategorySelect = useCallback(
    (id: string) => {
      onSelectCategory?.(id);
    },
    [onSelectCategory]
  );

  const handleSearchPress = useCallback(() => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push("/search" as any);
    }
  }, [onSearchPress, router]);

  const handleVoicePress = useCallback(() => {
    if (onVoicePress) {
      onVoicePress();
    } else {
      router.push("/search" as any);
    }
  }, [onVoicePress, router]);

  const safeAreaStyle = useMemo(
    () => [styles.safeArea, { paddingTop: insets.top }],
    [insets.top]
  );

  return (
    <LinearGradient
      colors={isDark ? DARK_GRADIENT_COLORS : LIGHT_GRADIENT_COLORS}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.gradientContainer}
    >
      <View style={safeAreaStyle}>
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
                color={isDark ? "#19A9FF" : "#38BDF8"}
                style={{ marginRight: scale(4) }}
              />
              <Text
                numberOfLines={1}
                style={[styles.locationText, isDark && { color: "#F8FAFC" }]}
              >
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
              style={[
                styles.storeButton,
                isDark && {
                  backgroundColor: "#151D24",
                  borderRadius: scale(19),
                  borderWidth: 1,
                  borderColor: "#303B45",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(22)}
                color={isDark ? "#F8FAFC" : "#ffffff"}
              />
            </TouchableOpacity>

            {/* Notification Bell Icon with Live Badge (Isolated memoized component) */}
            <NotificationBellButton
              isDark={isDark}
              onPress={handleNotificationPress}
            />

            {/* Profile Avatar Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onProfilePress}
              style={[
                styles.profileAvatar,
                isDark && {
                  backgroundColor: "#151D24",
                  borderWidth: 1,
                  borderColor: "#303B45",
                },
              ]}
            >
              <Ionicons
                name="person"
                size={scale(18)}
                color={isDark ? "#FFFFFF" : "#003844"}
              />
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
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* 3-Part Promotional Brand Banner at Bottom of Header */}
        <HeaderBanner />
      </View>
    </LinearGradient>
  );
}

// ── Precise Equality Check to Avoid Unnecessary Re-renders on Scroll ────────────────
function areHeaderPropsEqual(prev: HeaderProps, next: HeaderProps) {
  return (
    prev.storeName === next.storeName &&
    prev.location === next.location &&
    prev.selectedCategory === next.selectedCategory &&
    prev.onSelectCategory === next.onSelectCategory &&
    prev.onLocationPress === next.onLocationPress &&
    prev.onStorePress === next.onStorePress &&
    prev.onNotificationPress === next.onNotificationPress &&
    prev.onProfilePress === next.onProfilePress &&
    prev.onSearchPress === next.onSearchPress &&
    prev.onVoicePress === next.onVoicePress
  );
}

export default memo(Header, areHeaderPropsEqual);

const styles = StyleSheet.create({
  gradientContainer: {
    width: "100%",
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
  notifButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -scale(2),
    right: -scale(3),
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(3),
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: scale(9),
    fontWeight: "800",
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
