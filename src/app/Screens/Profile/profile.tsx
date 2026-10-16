import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAddresses } from "@/store/slices/addressSlice";
import { fetchUserProfile, logoutUser } from "@/store/slices/authSlice";
import { fetchCustomerOrders } from "@/store/slices/orderSlice";
import {
  fetchCustomerNotifications,
  fetchMyReferral,
  fetchRewardsWallet,
} from "@/store/slices/referralSlice";

interface MenuItem {
  id: string;
  icon: (color: string) => React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  // Redux state selectors (Live data from backend)
  const { user } = useAppSelector((state) => state.auth);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const wishlistCount = wishlistItems.length;

  const { customerOrders } = useAppSelector((state) => state.order);
  const { addresses } = useAppSelector((state) => state.address);
  const { wallet, summary, unreadNotificationsCount } = useAppSelector(
    (state) => state.referral,
  );

  const [refreshing, setRefreshing] = useState(false);

  // Authoritative live calculations
  const availablePoints = wallet?.availablePoints ?? user?.rewardPoints ?? 0;

  const activeOrdersCount = customerOrders.filter((o) =>
    [
      "PLACED",
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
    ].includes(o.orderStatus),
  ).length;

  const referrerBonus = summary?.campaign?.referrerRewardPoints;

  // Concurrent loader for real backend data
  const loadProfileData = useCallback(async () => {
    try {
      await Promise.allSettled([
        dispatch(fetchUserProfile()),
        dispatch(fetchRewardsWallet()),
        dispatch(fetchMyReferral()),
        dispatch(fetchCustomerNotifications({ page: 1, limit: 10 })),
        dispatch(fetchCustomerOrders({ page: 1, limit: 20 })),
        dispatch(fetchAddresses()),
      ]);
    } catch (e) {
      console.warn("Failed to refresh profile backend data:", e);
    }
  }, [dispatch]);

  // Initial load
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Refresh whenever screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData]),
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await dispatch(logoutUser());
            try {
              if (router.canDismiss()) {
                router.dismissAll();
              }
            } catch {
              // ignore
            }
            router.replace("/(auth)/login" as any);
          },
        },
      ],
    );
  };

  const handleShareApp = async () => {
    try {
      const shareMessage = summary?.referralCode
        ? `Order fresh groceries, snacks and daily essentials with instant delivery on Bhansa Mart! Use my invite code ${summary.referralCode} to get reward points on signup: https://bhansamart.com`
        : "Order fresh groceries, snacks and daily essentials with instant delivery on Bhansa Mart! Download now: https://bhansamart.com";

      await Share.share({
        message: shareMessage,
      });
    } catch {
      // ignore
    }
  };

  // Color tokens
  const colors = {
    rootBg: isDark ? "#080D0F" : "#F8FAFC",
    headerBg: isDark ? "#080D0F" : "#FFFFFF",
    navTitle: isDark ? "#F8FAFC" : "#0F172A",
    backIcon: isDark ? "#F8FAFC" : "#1E293B",
    headerDivider: isDark ? "#1E252E" : "#F1F5F9",
    cardBg: isDark ? "#151D24" : "#FFFFFF",
    cardBorder: isDark ? "#303B45" : "#E2E8F0",
    textPrimary: isDark ? "#F8FAFC" : "#0F172A",
    textSecondary: isDark ? "#A8B2BE" : "#64748B",
    goldPillBg: isDark ? "rgba(245, 158, 11, 0.16)" : "#FEF3C7",
    goldPillText: isDark ? "#FBBF24" : "#B45309",
    editBtnBg: isDark ? "#1E2E38" : "#E6F4F6",
    editBtnIcon: isDark ? "#39D353" : "#004D5D",
    walletBarBg: isDark ? "#1B252E" : "#F8FAFC",
    walletBarBorder: isDark ? "#303B45" : "#F1F5F9",
    walletDivider: isDark ? "#303B45" : "#E2E8F0",
    sectionTitle: isDark ? "#94A3B8" : "#64748B",
    menuLabelText: isDark ? "#F8FAFC" : "#1E293B",
    chevron: isDark ? "#64748B" : "#94A3B8",
    rowDivider: isDark ? "#1E252E" : "#F1F5F9",
    logoutBg: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
    logoutBorder: isDark ? "rgba(239, 68, 68, 0.25)" : "#FEE2E2",
    logoutIconBox: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
    logoutText: isDark ? "#F87171" : "#DC2626",
    footerText: isDark ? "#64748B" : "#94A3B8",
    refreshColor: isDark ? "#39D353" : "#003844",
  };

  const sections: MenuSection[] = [
    {
      title: "YOUR INFORMATION",
      items: [
        {
          id: "my-profile",
          icon: (color) => (
            <Feather name="user" size={scale(19)} color={color} />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "My profile",
          onPress: () => router.push("/Screens/Profile/myprofile" as any),
        },
        {
          id: "wishlist",
          icon: (color) => (
            <Ionicons name="heart" size={scale(19)} color={color} />
          ),
          iconBg: isDark ? "rgba(244, 63, 94, 0.16)" : "#FFE4E6",
          iconColor: isDark ? "#FB7185" : "#E11D48",
          label: "My Wishlist",
          badge:
            wishlistCount > 0
              ? `${wishlistCount} ${wishlistCount === 1 ? "Item" : "Items"}`
              : undefined,
          badgeColor: isDark ? "#56d37c" : "#56d37c",
          onPress: () => router.push("/Screens/Profile/wishlist" as any),
        },
        {
          id: "orders",
          icon: (color) => (
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={scale(20)}
              color={color}
            />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Your orders",
          badge:
            activeOrdersCount > 0
              ? `${activeOrdersCount} Active`
              : customerOrders.length > 0
                ? `${customerOrders.length} Total`
                : undefined,
          badgeColor:
            activeOrdersCount > 0
              ? isDark
                ? "#4ADE80"
                : "#16A34A"
              : isDark
                ? "#94A3B8"
                : "#64748B",
          onPress: () => router.push("/Screens/Profile/your-orders" as any),
        },
        {
          id: "address-book",
          icon: (color) => (
            <MaterialIcons name="location-on" size={scale(20)} color={color} />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Address Book",
          badge: addresses.length > 0 ? `${addresses.length} Saved` : undefined,
          badgeColor: isDark ? "#56d37c" : "#56d37c",
          onPress: () => router.push("/Screens/Profile/address" as any),
        },
      ],
    },
    {
      title: "PAYMENTS & REWARDS",
      items: [
        {
          id: "loyalty",
          icon: (color) => (
            <Ionicons name="star" size={scale(19)} color={color} />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Loyalty Points",
          badge: `${availablePoints} Pts`,
          badgeColor: isDark ? "#56d37c" : "#56d37c",
          onPress: () => router.push("/Screens/Profile/loyalty" as any),
        },
        {
          id: "coupons",
          icon: (color) => (
            <MaterialCommunityIcons
              name="ticket-percent"
              size={scale(20)}
              color={color}
            />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Collected Coupons",
          badge: undefined,
          badgeColor: isDark ? "#56d37c" : "#56d37c",
          onPress: () =>
            router.push("/Screens/Profile/collected-coupons" as any),
        },
        {
          id: "refer",
          icon: (color) => (
            <Feather name="gift" size={scale(19)} color={color} />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Refer & Earn",
          badge: referrerBonus ? `Get ${referrerBonus} Pts` : undefined,
          badgeColor: isDark ? "#56d37c" : "#56d37c",
          onPress: () =>
            router.push("/Screens/Profile/refer-and-earned" as any),
        },
        {
          id: "payment-settings",
          icon: (color) => (
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={scale(20)}
              color={color}
            />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Payment Settings",
          onPress: () => router.push("/Screens/Profile/paymentsetting" as any),
        },
      ],
    },
    {
      title: "HELP & LEGAL",
      items: [
        {
          id: "support",
          icon: (color) => (
            <Ionicons name="headset" size={scale(19)} color={color} />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "Help & Support",
          onPress: () => router.push("/Screens/Profile/support" as any),
        },
        {
          id: "share",
          icon: (color) => (
            <Feather name="share-2" size={scale(18)} color={color} />
          ),
          iconBg: isDark ? "rgba(148, 163, 184, 0.16)" : "#F1F5F9",
          iconColor: isDark ? "#CBD5E1" : "#475569",
          label: "Share the App",
          onPress: handleShareApp,
        },
        {
          id: "about",
          icon: (color) => (
            <Ionicons
              name="information-circle-outline"
              size={scale(20)}
              color={color}
            />
          ),
          iconBg: isDark ? "rgba(100, 116, 139, 0.16)" : "#E2E8F0",
          iconColor: isDark ? "#94A3B8" : "#475569",
          label: "About Bhansa Mart",
          onPress: () => router.push("/Screens/Profile/about" as any),
        },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.rootBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView
        edges={["top"]}
        style={[styles.safeAreaHeader, { backgroundColor: colors.headerBg }]}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather
              name="arrow-left"
              size={scale(22)}
              color={colors.backIcon}
            />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.navTitle }]}>
            My Account
          </Text>
          <View style={{ width: scale(36) }} />
        </View>
        <View
          style={[
            styles.headerDivider,
            { backgroundColor: colors.headerDivider },
          ]}
        />
      </SafeAreaView>

      {/* 2. Scrollable Body Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.refreshColor]}
            tintColor={colors.refreshColor}
          />
        }
      >
        {/* User Profile Hero Card */}
        <View
          style={[
            styles.userProfileCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.userProfileRow}>
            {/* Avatar Circle */}
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={
                    isDark ? ["#014c5c", "#003844"] : ["#003844", "#005C70"]
                  }
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarInitials}>
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "BM"}
                  </Text>
                </LinearGradient>
              )}
              {Boolean(user?.isEmailVerified) && (
                <View
                  style={[styles.verifiedBadge, { borderColor: colors.cardBg }]}
                >
                  <Ionicons name="checkmark" size={scale(10)} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Name & Email / Phone */}
            <View style={styles.userInfoCol}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.userNameText, { color: colors.textPrimary }]}
                >
                  {user?.name || "Customer"}
                </Text>
                <View
                  style={[
                    styles.goldMemberPill,
                    { backgroundColor: colors.goldPillBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.goldMemberText,
                      { color: colors.goldPillText },
                    ]}
                  >
                    👑{" "}
                    {user?.role === "admin"
                      ? "Admin"
                      : user?.role === "vendor"
                        ? "Vendor"
                        : "Member"}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.userPhoneText, { color: colors.textSecondary }]}
              >
                {user?.phone
                  ? user.phone
                  : user?.email || "No contact info registered"}
              </Text>
            </View>

            {/* Edit Profile Action */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push("/Screens/Profile/myprofile" as any)}
              style={[
                styles.editProfileBtn,
                { backgroundColor: colors.editBtnBg },
              ]}
            >
              <Feather
                name="edit-2"
                size={scale(15)}
                color={colors.editBtnIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Balance Preview Row inside Profile Card */}
          <View
            style={[
              styles.walletBar,
              {
                backgroundColor: colors.walletBarBg,
                borderColor: colors.walletBarBorder,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/Screens/Profile/loyalty" as any)}
              style={styles.walletItem}
            >
              <Ionicons name="star" size={scale(16)} color="#F59E0B" />
              <View>
                <Text
                  style={[
                    styles.walletValueText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {availablePoints} RP
                </Text>
                <Text
                  style={[
                    styles.walletSubText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Reward Points
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={[
                styles.walletDivider,
                { backgroundColor: colors.walletDivider },
              ]}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push("/Screens/Profile/collected-coupons" as any)
              }
              style={styles.walletItem}
            >
              <MaterialCommunityIcons
                name="ticket-percent"
                size={scale(18)}
                color="#10B981"
              />
              <View>
                <Text
                  style={[
                    styles.walletValueText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Discounts
                </Text>
                <Text
                  style={[
                    styles.walletSubText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Collected Coupons
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 Quick Action Tiles */}
        <View style={styles.quickActionsContainer}>
          {/* Address */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/Profile/address" as any)}
            style={[
              styles.quickActionTile,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.tileIconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(2, 132, 199, 0.18)"
                    : "#E0F2FE",
                },
              ]}
            >
              <MaterialIcons
                name="location-on"
                size={scale(22)}
                color={isDark ? "#38BDF8" : "#0284C7"}
              />
              {addresses.length > 0 && (
                <View
                  style={[
                    styles.notifBadge,
                    {
                      backgroundColor: isDark ? "#0284C7" : "#0284C7",
                      borderColor: colors.cardBg,
                    },
                  ]}
                >
                  <Text style={styles.notifBadgeText}>{addresses.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tileLabel, { color: colors.menuLabelText }]}>
              Address Book
            </Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/Profile/notifications" as any)}
            style={[
              styles.quickActionTile,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.tileIconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(22, 163, 74, 0.18)"
                    : "#DCFCE7",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={scale(22)}
                color={isDark ? "#4ADE80" : "#16A34A"}
              />
              {unreadNotificationsCount > 0 && (
                <View
                  style={[styles.notifBadge, { borderColor: colors.cardBg }]}
                >
                  <Text style={styles.notifBadgeText}>
                    {unreadNotificationsCount > 99
                      ? "99+"
                      : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tileLabel, { color: colors.menuLabelText }]}>
              Notifications
            </Text>
          </TouchableOpacity>

          {/* Reviews */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/Profile/reviews" as any)}
            style={[
              styles.quickActionTile,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.tileIconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(217, 119, 6, 0.18)"
                    : "#FEF3C7",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="message-draw"
                size={scale(21)}
                color={isDark ? "#FBBF24" : "#D97706"}
              />
            </View>
            <Text style={[styles.tileLabel, { color: colors.menuLabelText }]}>
              My Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section Cards */}
        {sections.map((section) => (
          <View key={section.title} style={styles.menuSectionWrapper}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
              {section.title}
            </Text>

            <View
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;
                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={item.onPress}
                      style={styles.menuRow}
                    >
                      {/* Icon */}
                      <View
                        style={[
                          styles.menuIconBox,
                          { backgroundColor: item.iconBg },
                        ]}
                      >
                        {item.icon(item.iconColor)}
                      </View>

                      {/* Label */}
                      <Text
                        style={[
                          styles.menuLabelText,
                          { color: colors.menuLabelText },
                        ]}
                      >
                        {item.label}
                      </Text>

                      {/* Optional Badge */}
                      {item.badge && (
                        <View
                          style={[
                            styles.itemBadge,
                            {
                              backgroundColor: isDark
                                ? `${item.badgeColor || "#39D353"}28`
                                : `${item.badgeColor || "#008080"}18`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemBadgeText,
                              {
                                color:
                                  item.badgeColor ||
                                  (isDark ? "#39D353" : "#008080"),
                              },
                            ]}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      )}

                      {/* Right Chevron */}
                      <Feather
                        name="chevron-right"
                        size={scale(18)}
                        color={colors.chevron}
                      />
                    </TouchableOpacity>

                    {!isLast && (
                      <View
                        style={[
                          styles.rowDivider,
                          { backgroundColor: colors.rowDivider },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[
            styles.logoutCard,
            {
              backgroundColor: colors.logoutBg,
              borderColor: colors.logoutBorder,
            },
          ]}
        >
          <View
            style={[
              styles.logoutIconBox,
              { backgroundColor: colors.logoutIconBox },
            ]}
          >
            <MaterialIcons
              name="logout"
              size={scale(20)}
              color={colors.logoutText}
            />
          </View>
          <Text style={[styles.logoutText, { color: colors.logoutText }]}>
            Log Out
          </Text>
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerAppVersion, { color: colors.footerText }]}>
            Bhansa Mart v1.2.0 • Simplifying Your Kitchen Needs
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeAreaHeader: {},
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  headerDivider: {
    height: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(60),
    gap: scale(16),
  },
  userProfileCard: {
    borderRadius: scale(18),
    padding: scale(16),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  userProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(14),
  },
  avatarContainer: {
    position: "relative",
    marginRight: scale(14),
  },
  avatarImage: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
  },
  avatarGradient: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -scale(1),
    right: -scale(1),
    backgroundColor: "#16A34A",
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  userInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(2),
  },
  userNameText: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  goldMemberPill: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  goldMemberText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  userPhoneText: {
    fontSize: moderateScale(13),
    fontWeight: "500",
  },
  editProfileBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  walletBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(12),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderWidth: 1,
  },
  walletItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  walletValueText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  walletSubText: {
    fontSize: moderateScale(10.5),
    fontWeight: "500",
  },
  walletDivider: {
    width: 1,
    height: scale(26),
    marginHorizontal: scale(8),
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(10),
  },
  quickActionTile: {
    flex: 1,
    borderRadius: scale(14),
    paddingVertical: scale(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tileIconCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(6),
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -scale(2),
    right: -scale(2),
    backgroundColor: "#EF4444",
    borderRadius: scale(8),
    minWidth: scale(16),
    height: scale(16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingHorizontal: scale(3),
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  tileLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  menuSectionWrapper: {
    gap: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    letterSpacing: 0.5,
    marginLeft: scale(4),
  },
  menuCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
  },
  menuIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  menuLabelText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  itemBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(8),
    marginRight: scale(8),
  },
  itemBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  rowDivider: {
    height: 1,
    marginLeft: scale(62),
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(14),
    paddingVertical: scale(13),
    borderWidth: 1,
    gap: scale(8),
    marginTop: scale(4),
  },
  logoutIconBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  footerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
  },
  footerAppVersion: {
    fontSize: moderateScale(11),
    fontWeight: "500",
  },
});
