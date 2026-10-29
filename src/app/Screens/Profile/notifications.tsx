import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from "@/store/slices/referralSlice";
import { CustomerNotificationItem } from "@/store/services/referralService";
import socketService from "@/store/services/socketService";
import { decrementUnread, setUnread } from "@/utils/notificationSync";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Notification Visual Configuration ──────────────────────────────────
interface VisualConfig {
  iconType: "feather" | "ionicons";
  iconName: string;
  iconColorLight: string;
  iconColorDark: string;
  bgLight: string;
  bgDark: string;
  badgeLabel: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeColorLight: string;
  badgeColorDark: string;
}

const NOTIFICATION_CONFIGS: Record<string, VisualConfig> = {
  order: {
    iconType: "feather",
    iconName: "package",
    iconColorLight: "#B45309",
    iconColorDark: "#FBBF24",
    bgLight: "#FEF3C7",
    bgDark: "rgba(245, 158, 11, 0.18)",
    badgeLabel: "Order",
    badgeBgLight: "#FEF3C7",
    badgeBgDark: "rgba(245, 158, 11, 0.2)",
    badgeColorLight: "#B45309",
    badgeColorDark: "#FBBF24",
  },
  refund: {
    iconType: "feather",
    iconName: "refresh-cw",
    iconColorLight: "#059669",
    iconColorDark: "#34D399",
    bgLight: "#D1FAE5",
    bgDark: "rgba(16, 185, 129, 0.18)",
    badgeLabel: "Refund",
    badgeBgLight: "#D1FAE5",
    badgeBgDark: "rgba(16, 185, 129, 0.2)",
    badgeColorLight: "#059669",
    badgeColorDark: "#34D399",
  },
  referral_reward: {
    iconType: "feather",
    iconName: "gift",
    iconColorLight: "#016073",
    iconColorDark: "#38BDF8",
    bgLight: "#E6F4F6",
    bgDark: "rgba(2, 132, 199, 0.18)",
    badgeLabel: "Referral",
    badgeBgLight: "#E6F4F6",
    badgeBgDark: "rgba(2, 132, 199, 0.2)",
    badgeColorLight: "#016073",
    badgeColorDark: "#38BDF8",
  },
  referral_success: {
    iconType: "feather",
    iconName: "users",
    iconColorLight: "#016073",
    iconColorDark: "#38BDF8",
    bgLight: "#E6F4F6",
    bgDark: "rgba(2, 132, 199, 0.18)",
    badgeLabel: "Referral",
    badgeBgLight: "#E6F4F6",
    badgeBgDark: "rgba(2, 132, 199, 0.2)",
    badgeColorLight: "#016073",
    badgeColorDark: "#38BDF8",
  },
  welcome_reward: {
    iconType: "ionicons",
    iconName: "sparkles",
    iconColorLight: "#15803D",
    iconColorDark: "#4ADE80",
    bgLight: "#DCFCE7",
    bgDark: "rgba(34, 197, 94, 0.18)",
    badgeLabel: "Welcome",
    badgeBgLight: "#DCFCE7",
    badgeBgDark: "rgba(34, 197, 94, 0.2)",
    badgeColorLight: "#15803D",
    badgeColorDark: "#4ADE80",
  },
  reward: {
    iconType: "ionicons",
    iconName: "sparkles",
    iconColorLight: "#15803D",
    iconColorDark: "#4ADE80",
    bgLight: "#DCFCE7",
    bgDark: "rgba(34, 197, 94, 0.18)",
    badgeLabel: "Reward",
    badgeBgLight: "#DCFCE7",
    badgeBgDark: "rgba(34, 197, 94, 0.2)",
    badgeColorLight: "#15803D",
    badgeColorDark: "#4ADE80",
  },
  offer: {
    iconType: "ionicons",
    iconName: "pricetag-outline",
    iconColorLight: "#E11D48",
    iconColorDark: "#FB7185",
    bgLight: "#FFE4E6",
    bgDark: "rgba(244, 63, 94, 0.18)",
    badgeLabel: "Offer",
    badgeBgLight: "#FFE4E6",
    badgeBgDark: "rgba(244, 63, 94, 0.2)",
    badgeColorLight: "#E11D48",
    badgeColorDark: "#FB7185",
  },
  announcement: {
    iconType: "feather",
    iconName: "volume-2",
    iconColorLight: "#7C3AED",
    iconColorDark: "#A78BFA",
    bgLight: "#EDE9FE",
    bgDark: "rgba(139, 92, 246, 0.18)",
    badgeLabel: "Notice",
    badgeBgLight: "#EDE9FE",
    badgeBgDark: "rgba(139, 92, 246, 0.2)",
    badgeColorLight: "#7C3AED",
    badgeColorDark: "#A78BFA",
  },
  broadcast: {
    iconType: "feather",
    iconName: "send",
    iconColorLight: "#2563EB",
    iconColorDark: "#60A5FA",
    bgLight: "#DBEAFE",
    bgDark: "rgba(37, 99, 235, 0.18)",
    badgeLabel: "Broadcast",
    badgeBgLight: "#DBEAFE",
    badgeBgDark: "rgba(37, 99, 235, 0.2)",
    badgeColorLight: "#2563EB",
    badgeColorDark: "#60A5FA",
  },
  system: {
    iconType: "feather",
    iconName: "bell",
    iconColorLight: "#64748B",
    iconColorDark: "#94A3B8",
    bgLight: "#F1F5F9",
    bgDark: "#1E2E38",
    badgeLabel: "System",
    badgeBgLight: "#F1F5F9",
    badgeBgDark: "#1E2E38",
    badgeColorLight: "#64748B",
    badgeColorDark: "#94A3B8",
  },
};

const DEFAULT_CONFIG: VisualConfig = NOTIFICATION_CONFIGS.system;

type FilterType = "ALL" | "ORDER" | "REWARD" | "OFFER";

// ── Notification Item Row ──────────────────────────────────────────────
const NotificationRow = memo(
  function NotificationRow({
    item,
    isDark,
    onPress,
  }: {
    item: CustomerNotificationItem;
    isDark: boolean;
    onPress: (item: CustomerNotificationItem) => void;
  }) {
    const visual = NOTIFICATION_CONFIGS[item.type] || DEFAULT_CONFIG;

    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Recently";

    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          isDark && {
            backgroundColor: "#151D24",
            borderColor: "#303B45",
          },
          !item.isRead &&
            (isDark
              ? {
                  backgroundColor: "rgba(2, 132, 199, 0.12)",
                  borderColor: "rgba(56, 189, 248, 0.4)",
                  borderWidth: 1.5,
                }
              : styles.notifCardUnread),
        ]}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
      >
        <View
          style={[
            styles.notifIconWrap,
            {
              backgroundColor: isDark ? visual.bgDark : visual.bgLight,
            },
          ]}
        >
          {visual.iconType === "ionicons" ? (
            <Ionicons
              name={visual.iconName as any}
              size={scale(18)}
              color={isDark ? visual.iconColorDark : visual.iconColorLight}
            />
          ) : (
            <Feather
              name={visual.iconName as any}
              size={scale(18)}
              color={isDark ? visual.iconColorDark : visual.iconColorLight}
            />
          )}
        </View>

        <View style={styles.notifContent}>
          <View style={styles.notifTopRow}>
            <View style={styles.titleWithBadge}>
              <Text
                style={[
                  styles.notifTitle,
                  isDark && { color: "#F8FAFC" },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: isDark
                      ? visual.badgeBgDark
                      : visual.badgeBgLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    {
                      color: isDark
                        ? visual.badgeColorDark
                        : visual.badgeColorLight,
                    },
                  ]}
                >
                  {visual.badgeLabel}
                </Text>
              </View>
            </View>
            {!item.isRead && (
              <View
                style={[
                  styles.unreadDot,
                  isDark && { backgroundColor: "#38BDF8" },
                ]}
              />
            )}
          </View>

          <Text
            style={[
              styles.notifMessage,
              isDark && { color: "#A8B2BE" },
            ]}
            numberOfLines={3}
          >
            {item.message}
          </Text>

          <Text
            style={[
              styles.notifTime,
              isDark && { color: "#64748B" },
            ]}
          >
            {dateFormatted}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item._id === next.item._id &&
    prev.item.isRead === next.item.isRead &&
    prev.isDark === next.isDark
);

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const {
    notifications,
    unreadNotificationsCount,
    notificationsLoading,
  } = useAppSelector((state) => state.referral);

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const loadData = useCallback(() => {
    dispatch(fetchCustomerNotifications({ page: 1, limit: 50 }));
  }, [dispatch]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time socket sync: refresh in-app customer notification list automatically
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    socketService.connect("customer").then(() => {
      unsubscribe = socketService.onCustomerNotification((notif) => {
        if (notif && !notif.type?.startsWith("staff_")) {
          loadData();
        }
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCustomerNotifications({ page: 1, limit: 50 }));
    setRefreshing(false);
  };

  // Strictly filter to customer-related notifications only
  const customerNotifications = useMemo(() => {
    return (notifications || []).filter((item) => {
      if (!item) return false;
      const type = item.type || "";
      // Exclude any staff, vendor, or delivery partner operational notifications
      if (
        type.startsWith("staff_") ||
        type.startsWith("vendor_") ||
        type.startsWith("delivery_")
      ) {
        return false;
      }
      return true;
    });
  }, [notifications]);

  // Client-side category filtering
  const filteredNotifications = useMemo(() => {
    return customerNotifications.filter((item) => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "ORDER") {
        return (
          item.type === "order" ||
          item.type === "refund" ||
          item.category === "orders" ||
          item.category === "refunds"
        );
      }
      if (activeFilter === "REWARD") {
        return (
          item.type === "referral_reward" ||
          item.type === "referral_success" ||
          item.type === "welcome_reward" ||
          item.type === "reward"
        );
      }
      if (activeFilter === "OFFER") {
        return (
          item.type === "offer" ||
          item.type === "announcement" ||
          item.type === "broadcast" ||
          item.type === "system"
        );
      }
      return true;
    });
  }, [customerNotifications, activeFilter]);

  // Customer-accurate unread count
  const customerUnreadCount = useMemo(() => {
    return customerNotifications.filter((n) => !n.isRead).length;
  }, [customerNotifications]);

  const handleNotificationPress = async (item: CustomerNotificationItem) => {
    if (!item.isRead) {
      dispatch(markCustomerNotificationRead(item._id));
      decrementUnread("customer");
    }

    // Contextual routing based on customer notification type
    const type = item.type;
    if (
      type === "referral_reward" ||
      type === "referral_success" ||
      type === "welcome_reward" ||
      type === "reward"
    ) {
      router.push("/Screens/Profile/loyalty" as any);
    } else if (type === "order" || type === "refund") {
      router.push("/Screens/Profile/your-orders" as any);
    } else if (type === "offer" || type === "announcement" || type === "broadcast") {
      router.push("/customerMain/index" as any);
    }
  };

  const handleMarkAllRead = () => {
    if (customerUnreadCount === 0) return;
    dispatch(markAllCustomerNotificationsRead());
    setUnread("customer", 0);
  };

  return (
    <SafeAreaView
      style={[
        styles.root,
        isDark && { backgroundColor: "#080D0F" },
      ]}
      edges={["top"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Navigation */}
      <View
        style={[
          styles.topNav,
          isDark && {
            backgroundColor: "#080D0F",
            borderBottomColor: "#1E252E",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            isDark && { backgroundColor: "#1E2E38" },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-left"
            size={scale(20)}
            color={isDark ? "#38BDF8" : "#016073"}
          />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text
            style={[
              styles.navTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            Notifications
          </Text>
          <Text
            style={[
              styles.navSub,
              isDark && { color: "#94A3B8" },
            ]}
          >
            {customerUnreadCount > 0
              ? `${customerUnreadCount} unread update${customerUnreadCount === 1 ? "" : "s"}`
              : "All caught up"}
          </Text>
        </View>

        {customerUnreadCount > 0 && (
          <TouchableOpacity
            style={[
              styles.markAllBtn,
              isDark && { backgroundColor: "#1E2E38" },
            ]}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.markAllBtnText,
                isDark && { color: "#38BDF8" },
              ]}
            >
              Read All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <View
        style={[
          styles.filterRow,
          isDark && {
            backgroundColor: "#080D0F",
            borderBottomColor: "#1E252E",
          },
        ]}
      >
        {(
          [
            { key: "ALL", label: "All" },
            { key: "ORDER", label: "Orders" },
            { key: "REWARD", label: "Rewards" },
            { key: "OFFER", label: "Offers" },
          ] as const
        ).map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                isDark && { backgroundColor: "#151D24" },
                isActive &&
                  (isDark
                    ? { backgroundColor: "#38BDF8" }
                    : styles.filterChipActive),
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isDark && { color: "#94A3B8" },
                  isActive &&
                    (isDark
                      ? { color: "#080D0F", fontWeight: "800" }
                      : styles.filterChipTextActive),
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Notification List */}
      {notificationsLoading && customerNotifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#39D353" : "#016073"}
          />
          <Text
            style={[
              styles.loadingText,
              isDark && { color: "#94A3B8" },
            ]}
          >
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              isDark={isDark}
              onPress={handleNotificationPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? "#39D353" : "#016073"]}
              tintColor={isDark ? "#39D353" : "#016073"}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  isDark && { backgroundColor: "#1E2E38" },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={scale(38)}
                  color={isDark ? "#38BDF8" : "#016073"}
                />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                {activeFilter === "ALL"
                  ? "No Notifications Yet"
                  : `No ${activeFilter === "ORDER" ? "Orders" : activeFilter === "REWARD" ? "Rewards" : "Offers"} Notifications`}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                {activeFilter === "ALL"
                  ? "You will receive updates here about order status, referral rewards, and special promotions."
                  : "Check back later for updates in this category."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(12),
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  topNavCenter: {
    flex: 1,
  },
  navTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  navSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  markAllBtn: {
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(12),
  },
  markAllBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#016073",
  },
  filterChipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    color: "#64748B",
  },
  listContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: scale(14),
    borderRadius: scale(12),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: scale(12),
  },
  notifCardUnread: {
    backgroundColor: "#F8FCFC",
    borderColor: "#86C4CB",
    borderWidth: 1.5,
  },
  notifIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(2),
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: scale(6),
  },
  notifTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
  },
  categoryBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#016073",
    marginLeft: scale(6),
  },
  notifMessage: {
    fontSize: moderateScale(12),
    color: "#475569",
    marginTop: scale(4),
    lineHeight: scale(17),
  },
  notifTime: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    marginTop: scale(6),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
    paddingHorizontal: scale(24),
  },
  emptyIconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(6),
  },
  emptySubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    lineHeight: scale(18),
  },
});
