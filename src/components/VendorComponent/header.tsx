import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import VendorSideMenu from "./vendorSideMenu";

export interface VendorHeaderProps {
  title?: string;
  subtitle?: string;
  showMenu?: boolean;
  showNotification?: boolean;
  showProfile?: boolean;
  unreadCount?: number;
  onPressMenu?: () => void;
  onPressNotification?: () => void;
  onPressProfile?: () => void;
  activeRoute?: string;
  style?: ViewStyle;
}

export default function VendorHeader({
  title,
  subtitle,
  showMenu = true,
  showNotification = true,
  showProfile = true,
  unreadCount = 2,
  onPressMenu,
  onPressNotification,
  onPressProfile,
  activeRoute,
  style,
}: VendorHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { vendorUser, vendorDetails } = useAppSelector(
    (state) => state.vendorAuth,
  );

  const [menuVisible, setMenuVisible] = useState(false);

  const defaultTitle =
    title ||
    vendorDetails?.businessDetails?.businessName ||
    vendorUser?.name ||
    "Bhansa Seller";

  const defaultSubtitle =
    subtitle || (vendorUser?.email ? "Vendor Store" : "Seller Portal");

  const avatarUri =
    vendorDetails?.brandDetails?.brandLogo ||
    vendorDetails?.kycDetails?.avatarUrl ||
    vendorUser?.avatar;

  const getInitials = (name: string) => {
    if (!name) return "V";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleMenuPress = () => {
    if (onPressMenu) {
      onPressMenu();
    } else {
      setMenuVisible(true);
    }
  };

  const handleNotificationPress = () => {
    if (onPressNotification) {
      onPressNotification();
    }
  };

  const handleProfilePress = () => {
    if (onPressProfile) {
      onPressProfile();
    } else {
      // Default: opens side menu to profile/settings
      setMenuVisible(true);
    }
  };

  return (
    <>
      <View style={[styles.headerContainer, style]}>
        {/* 1. Left Side: Menu Icon Button */}
        {showMenu ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleMenuPress}
            style={styles.iconButton}
            accessibilityLabel="Open Menu"
          >
            <Feather name="menu" size={scale(20)} color="#016073" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {/* 2. Middle: Title & Store Subtitle / Status */}
        <View style={styles.centerContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {defaultTitle}
            </Text>
            <MaterialCommunityIcons
              name="check-decagram"
              size={scale(14)}
              color="#008080"
              style={styles.verifiedIcon}
            />
          </View>

          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {defaultSubtitle}
            </Text>
          </View>
        </View>

        {/* 3. Right Side: Notifications & Profile Avatar */}
        <View style={styles.rightContainer}>
          {showNotification && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNotificationPress}
              style={styles.iconButton}
              accessibilityLabel="Notifications"
            >
              <Feather name="bell" size={scale(19)} color="#016073" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showProfile && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleProfilePress}
              style={styles.profileWrapper}
              accessibilityLabel="Vendor Profile"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {getInitials(defaultTitle)}
                  </Text>
                </View>
              )}
              <View style={styles.profileStatusDot} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Built-in Vendor Side Menu Drawer */}
      <VendorSideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        activeRoute={activeRoute || pathname}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(12),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconPlaceholder: {
    width: scale(38),
  },
  centerContainer: {
    flex: 1,
    marginHorizontal: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  headerTitle: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#016073",
    maxWidth: scale(170),
  },
  verifiedIcon: {
    marginTop: scale(1),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginTop: scale(1.5),
  },
  onlineDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#16A34A",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  badge: {
    position: "absolute",
    top: -scale(2),
    right: -scale(2),
    backgroundColor: "#EF4444",
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(3),
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileWrapper: {
    position: "relative",
  },
  avatarImage: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#016073",
  },
  avatarFallback: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#016073",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#86C4CB",
  },
  avatarFallbackText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileStatusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#16A34A",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});
