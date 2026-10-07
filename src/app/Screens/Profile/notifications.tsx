import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface NotificationItem {
  id: string;
  type: "order" | "offer" | "reward" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  route?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "order",
    title: "Order Delivered! 📦",
    message:
      "Your order #BM-992817 with 3 items has been delivered successfully to Baneshwor. Enjoy your fresh groceries!",
    timestamp: "10 mins ago",
    read: false,
    route: "/Screens/Profile/your-orders",
  },
  {
    id: "notif-2",
    type: "offer",
    title: "20% Flash Coupon Added 🎉",
    message:
      "Exclusive voucher: Get 20% OFF on all Snacks & Juices orders above Rs.999. Valid till midnight!",
    timestamp: "2 hours ago",
    read: false,
    route: "/Screens/Profile/collected-coupons",
  },
  {
    id: "notif-3",
    type: "reward",
    title: "Loyalty Points Credited 🌟",
    message:
      "You earned +50.00 Reward Points (RP) from your previous order. Check your balance now.",
    timestamp: "Yesterday",
    read: true,
    route: "/Screens/Profile/loyalty",
  },
  {
    id: "notif-4",
    type: "order",
    title: "Order Out for Delivery 🚴",
    message:
      "Rider Bijay is on the way with your order #BM-992817. Delivery expected within 15 minutes.",
    timestamp: "Yesterday",
    read: true,
    route: "/Screens/Profile/your-orders",
  },
  {
    id: "notif-5",
    type: "offer",
    title: "Weekend Grocery Bonanza 🍎",
    message:
      "Fresh farm vegetables and seasonal fruits at up to 30% discount this Saturday and Sunday.",
    timestamp: "3 days ago",
    read: true,
    route: "/Screens/Category/categoryExpand",
  },
  {
    id: "notif-6",
    type: "system",
    title: "Account Security Verified 🔒",
    message:
      "Your mobile number 9860412256 and login credentials were verified successfully.",
    timestamp: "5 days ago",
    read: true,
  },
];

const getIconForType = (type: NotificationItem["type"]) => {
  switch (type) {
    case "order":
      return {
        icon: <Ionicons name="cube-outline" size={scale(20)} color="#0284C7" />,
        bg: "#E0F2FE",
      };
    case "offer":
      return {
        icon: (
          <MaterialCommunityIcons
            name="ticket-percent-outline"
            size={scale(20)}
            color="#16A34A"
          />
        ),
        bg: "#DCFCE7",
      };
    case "reward":
      return {
        icon: <Ionicons name="star-outline" size={scale(20)} color="#D97706" />,
        bg: "#FEF3C7",
      };
    case "system":
    default:
      return {
        icon: (
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={scale(20)}
            color="#7C3AED"
          />
        ),
        bg: "#EDE9FE",
      };
  }
};

const NotificationCardItem = React.memo(function NotificationCardItem({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) {
  const iconConfig = getIconForType(item.type);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(item)}
      style={[
        styles.notificationCard,
        !item.read && styles.notificationCardUnread,
      ]}
    >
      {/* Left Icon Container */}
      <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
        {iconConfig.icon}
      </View>

      {/* Content Column */}
      <View style={styles.cardContentCol}>
        <View style={styles.cardHeaderRow}>
          <Text
            style={[
              styles.itemTitle,
              !item.read && styles.itemTitleUnread,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.itemMessageText}>{item.message}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.timestampText}>{item.timestamp}</Text>
          {item.route && (
            <View style={styles.actionPrompt}>
              <Text style={styles.actionPromptText}>View Details</Text>
              <Feather name="chevron-right" size={scale(13)} color="#008080" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "order" | "offer" | "reward"
  >("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    Alert.alert("All Read", "All notifications marked as read.");
  };

  const handleNotificationPress = useCallback((item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    if (item.route) {
      router.push(item.route as any);
    } else {
      Alert.alert(item.title, item.message);
    }
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotificationCardItem
        item={item}
        onPress={handleNotificationPress}
      />
    ),
    [handleNotificationPress]
  );

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

          <View style={styles.titleWrapper}>
            <Text style={styles.navTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllRead}
              style={styles.markAllBtn}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: scale(36) }} />
          )}
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {[
          { key: "all", label: "All" },
          { key: "order", label: "Orders" },
          { key: "offer", label: "Offers" },
          { key: "reward", label: "Rewards" },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(tab.key as any)}
              style={[
                styles.tabPill,
                isActive && styles.tabPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  isActive && styles.tabPillTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-sleep-outline"
              size={scale(60)}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You are all caught up! We will alert you when you have updates or
              discounts.
            </Text>
          </View>
        }
      />
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
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#0F172A",
  },
  headerBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  markAllBtn: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(6),
  },
  markAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#008080",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  filterTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    gap: scale(8),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabPill: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabPillActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  tabPillText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#64748B",
  },
  tabPillTextActive: {
    color: "#16A34A",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(40),
    gap: scale(10),
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: scale(12),
  },
  notificationCardUnread: {
    backgroundColor: "#FFFFFF",
    borderColor: "#BFDBFE",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(2),
  },
  cardContentCol: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(4),
  },
  itemTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: "700",
    color: "#0F172A",
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#2563EB",
    marginLeft: scale(6),
  },
  itemMessageText: {
    fontSize: moderateScale(12.5),
    color: "#475569",
    lineHeight: moderateScale(18),
    marginBottom: scale(8),
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timestampText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    fontWeight: "500",
  },
  actionPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  actionPromptText: {
    fontSize: moderateScale(11.5),
    color: "#008080",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(80),
    gap: scale(10),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
});
