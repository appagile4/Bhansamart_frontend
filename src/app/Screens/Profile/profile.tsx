import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";

interface MenuItem {
  id: string;
  icon: (color: string) => React.ReactNode;
  iconBg: string;
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
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const wishlistCount = wishlistItems.length;

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
      await Share.share({
        message:
          "Order fresh groceries, snacks and daily essentials with instant delivery on Bhansa Mart! Download now: https://bhansamart.com",
      });
    } catch {
      // ignore
    }
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
          iconBg: "#E0F2FE",
          label: "My profile",
          onPress: () => router.push("/Screens/Profile/myprofile" as any),
        },
        {
          id: "wishlist",
          icon: (color) => (
            <Ionicons name="heart-outline" size={scale(19)} color={color} />
          ),
          iconBg: "#FCE7F3",
          label: "My Wishlist",
          badge:
            wishlistCount > 0
              ? `${wishlistCount} ${wishlistCount === 1 ? "Item" : "Items"}`
              : undefined,
          badgeColor: "#DB2777",
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
          iconBg: "#DCFCE7",
          label: "Your orders",
          badge: "Active Orders",
          badgeColor: "#16A34A",
          onPress: () => router.push("/Screens/Profile/your-orders" as any),
        },
        {
          id: "address-book",
          icon: (color) => (
            <MaterialIcons name="location-on" size={scale(20)} color={color} />
          ),
          iconBg: "#FEF3C7",
          label: "Address Book",
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
          iconBg: "#FEF9C3",
          label: "Loyalty Points",
          badge: "900.55 RP",
          badgeColor: "#CA8A04",
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
          iconBg: "#F3E8FF",
          label: "Collected Coupons",
          badge: "2 Active",
          badgeColor: "#9333EA",
          onPress: () =>
            router.push("/Screens/Profile/collected-coupons" as any),
        },
        {
          id: "refer",
          icon: (color) => (
            <Feather name="gift" size={scale(19)} color={color} />
          ),
          iconBg: "#FCE7F3",
          label: "Refer & Earn",
          badge: "Get Rs.100",
          badgeColor: "#DB2777",
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
          iconBg: "#E0E7FF",
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
          iconBg: "#CCFBF1",
          label: "Help & Support",
          onPress: () => router.push("/Screens/Profile/support" as any),
        },
        {
          id: "share",
          icon: (color) => (
            <Feather name="share-2" size={scale(18)} color={color} />
          ),
          iconBg: "#F1F5F9",
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
          iconBg: "#E2E8F0",
          label: "About Bhansa Mart",
          onPress: () => router.push("/Screens/Profile/about" as any),
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>My Account</Text>
          <View style={{ width: scale(36) }} />
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Scrollable Body Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Hero Card */}
        <View style={styles.userProfileCard}>
          <View style={styles.userProfileRow}>
            {/* Avatar Circle */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#003844", "#005C70"]}
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
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={scale(10)} color="#FFFFFF" />
              </View>
            </View>

            {/* Name & Email / Phone */}
            <View style={styles.userInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.userNameText}>
                  {user?.name || "Customer"}
                </Text>
                <View style={styles.goldMemberPill}>
                  <Text style={styles.goldMemberText}>
                    👑 {user?.role === "admin" ? "Admin" : "Member"}
                  </Text>
                </View>
              </View>
              <Text style={styles.userPhoneText}>
                {user?.email || "user@bhansamart.com"}
              </Text>
            </View>

            {/* Edit Profile Action */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push("/Screens/Profile/myprofile" as any)}
              style={styles.editProfileBtn}
            >
              <Feather name="edit-2" size={scale(15)} color="#004D5D" />
            </TouchableOpacity>
          </View>

          {/* Quick Balance Preview Row inside Profile Card */}
          <View style={styles.walletBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/Screens/Profile/loyalty" as any)}
              style={styles.walletItem}
            >
              <Ionicons name="star" size={scale(16)} color="#F59E0B" />
              <View>
                <Text style={styles.walletValueText}>900.55 RP</Text>
                <Text style={styles.walletSubText}>Reward Points</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.walletDivider} />

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
                <Text style={styles.walletValueText}>2 Coupons</Text>
                <Text style={styles.walletSubText}>Available</Text>
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
            style={styles.quickActionTile}
          >
            <View
              style={[styles.tileIconCircle, { backgroundColor: "#E0F2FE" }]}
            >
              <MaterialIcons
                name="location-on"
                size={scale(22)}
                color="#0284C7"
              />
            </View>
            <Text style={styles.tileLabel}>Address Book</Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/Profile/notifications" as any)}
            style={styles.quickActionTile}
          >
            <View
              style={[styles.tileIconCircle, { backgroundColor: "#DCFCE7" }]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={scale(22)}
                color="#16A34A"
              />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>2</Text>
              </View>
            </View>
            <Text style={styles.tileLabel}>Notifications</Text>
          </TouchableOpacity>

          {/* Reviews */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/Screens/Profile/reviews" as any)}
            style={styles.quickActionTile}
          >
            <View
              style={[styles.tileIconCircle, { backgroundColor: "#FEF3C7" }]}
            >
              <MaterialCommunityIcons
                name="message-draw"
                size={scale(21)}
                color="#D97706"
              />
            </View>
            <Text style={styles.tileLabel}>My Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section Cards */}
        {sections.map((section) => (
          <View key={section.title} style={styles.menuSectionWrapper}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.menuCard}>
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
                        {item.icon("#003844")}
                      </View>

                      {/* Label */}
                      <Text style={styles.menuLabelText}>{item.label}</Text>

                      {/* Optional Badge */}
                      {item.badge && (
                        <View
                          style={[
                            styles.itemBadge,
                            {
                              backgroundColor: `${item.badgeColor || "#008080"}18`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemBadgeText,
                              { color: item.badgeColor || "#008080" },
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
                        color="#94A3B8"
                      />
                    </TouchableOpacity>

                    {!isLast && <View style={styles.rowDivider} />}
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
          style={styles.logoutCard}
        >
          <View style={styles.logoutIconBox}>
            <MaterialIcons name="logout" size={scale(20)} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerAppVersion}>
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
    backgroundColor: "#F8FAFC",
  },
  safeAreaHeader: {
    backgroundColor: "#FFFFFF",
  },
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
    color: "#0F172A",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(60),
    gap: scale(16),
  },
  userProfileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(18),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    borderColor: "#FFFFFF",
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
    color: "#0F172A",
  },
  goldMemberPill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  goldMemberText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#B45309",
  },
  userPhoneText: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "500",
  },
  editProfileBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  walletBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
    color: "#0F172A",
  },
  walletSubText: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontWeight: "500",
  },
  walletDivider: {
    width: 1,
    height: scale(26),
    backgroundColor: "#E2E8F0",
    marginHorizontal: scale(8),
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(10),
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    paddingVertical: scale(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    borderColor: "#FFFFFF",
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
    color: "#1E293B",
  },
  menuSectionWrapper: {
    gap: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginLeft: scale(4),
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#1E293B",
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
    backgroundColor: "#F1F5F9",
    marginLeft: scale(62),
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: scale(14),
    paddingVertical: scale(13),
    borderWidth: 1,
    borderColor: "#FEE2E2",
    gap: scale(8),
    marginTop: scale(4),
  },
  logoutIconBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#DC2626",
  },
  footerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
  },
  footerAppVersion: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    fontWeight: "500",
  },
});
