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
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";
import deliveryService from "@/store/services/deliveryService";
import socketService from "@/store/services/socketService";
import { decrementUnread, setUnread, useUnreadNotifications } from "@/utils/notificationSync";

export interface DeliveryNotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  category: "delivery" | "payments" | "account" | "announcements" | "system";
  data?: any;
  isRead: boolean;
  createdAt: string;
}

type CategoryTab = "ALL" | "DELIVERY" | "PAYMENTS" | "ACCOUNT" | "ANNOUNCEMENTS";

interface VisualConfig {
  iconFamily: "ionicons" | "feather" | "mci" | "fa5";
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

const VISUAL_CONFIGS: Record<string, VisualConfig> = {
  delivery_request_received: {
    iconFamily: "ionicons",
    iconName: "bicycle",
    iconColorLight: "#0F766E",
    iconColorDark: "#2DD4BF",
    bgLight: "#CCFBF1",
    bgDark: "rgba(15, 118, 110, 0.25)",
    badgeLabel: "Delivery Offer",
    badgeBgLight: "#CCFBF1",
    badgeBgDark: "rgba(15, 118, 110, 0.2)",
    badgeColorLight: "#0F766E",
    badgeColorDark: "#2DD4BF",
  },
  delivery_request_expired: {
    iconFamily: "feather",
    iconName: "clock",
    iconColorLight: "#D97706",
    iconColorDark: "#FBBF24",
    bgLight: "#FEF3C7",
    bgDark: "rgba(217, 119, 6, 0.2)",
    badgeLabel: "Offer Expired",
    badgeBgLight: "#FEF3C7",
    badgeBgDark: "rgba(217, 119, 6, 0.15)",
    badgeColorLight: "#D97706",
    badgeColorDark: "#FBBF24",
  },
  delivery_assignment_confirmed: {
    iconFamily: "feather",
    iconName: "check-circle",
    iconColorLight: "#0D9488",
    iconColorDark: "#34D399",
    bgLight: "#D1FAE5",
    bgDark: "rgba(13, 148, 136, 0.2)",
    badgeLabel: "Confirmed",
    badgeBgLight: "#D1FAE5",
    badgeBgDark: "rgba(13, 148, 136, 0.15)",
    badgeColorLight: "#0D9488",
    badgeColorDark: "#34D399",
  },
  delivery_pickup_reminder: {
    iconFamily: "feather",
    iconName: "map-pin",
    iconColorLight: "#2563EB",
    iconColorDark: "#60A5FA",
    bgLight: "#DBEAFE",
    bgDark: "rgba(37, 99, 235, 0.2)",
    badgeLabel: "Store Pickup",
    badgeBgLight: "#DBEAFE",
    badgeBgDark: "rgba(37, 99, 235, 0.15)",
    badgeColorLight: "#2563EB",
    badgeColorDark: "#60A5FA",
  },
  delivery_handover_otp_available: {
    iconFamily: "feather",
    iconName: "key",
    iconColorLight: "#4F46E5",
    iconColorDark: "#818CF8",
    bgLight: "#E0E7FF",
    bgDark: "rgba(79, 70, 229, 0.2)",
    badgeLabel: "Pickup OTP",
    badgeBgLight: "#E0E7FF",
    badgeBgDark: "rgba(79, 70, 229, 0.15)",
    badgeColorLight: "#4F46E5",
    badgeColorDark: "#818CF8",
  },
  delivery_out_for_delivery: {
    iconFamily: "feather",
    iconName: "package",
    iconColorLight: "#0284C7",
    iconColorDark: "#38BDF8",
    bgLight: "#E0F2FE",
    bgDark: "rgba(2, 132, 199, 0.2)",
    badgeLabel: "In Transit",
    badgeBgLight: "#E0F2FE",
    badgeBgDark: "rgba(2, 132, 199, 0.15)",
    badgeColorLight: "#0284C7",
    badgeColorDark: "#38BDF8",
  },
  delivery_completed: {
    iconFamily: "ionicons",
    iconName: "checkmark-done-circle",
    iconColorLight: "#16A34A",
    iconColorDark: "#4ADE80",
    bgLight: "#DCFCE7",
    bgDark: "rgba(22, 163, 74, 0.2)",
    badgeLabel: "Delivered",
    badgeBgLight: "#DCFCE7",
    badgeBgDark: "rgba(22, 163, 74, 0.15)",
    badgeColorLight: "#16A34A",
    badgeColorDark: "#4ADE80",
  },
  delivery_cancelled: {
    iconFamily: "feather",
    iconName: "x-circle",
    iconColorLight: "#DC2626",
    iconColorDark: "#F87171",
    bgLight: "#FEE2E2",
    bgDark: "rgba(220, 38, 38, 0.2)",
    badgeLabel: "Cancelled",
    badgeBgLight: "#FEE2E2",
    badgeBgDark: "rgba(220, 38, 38, 0.15)",
    badgeColorLight: "#DC2626",
    badgeColorDark: "#F87171",
  },
  delivery_earnings_updated: {
    iconFamily: "ionicons",
    iconName: "wallet",
    iconColorLight: "#15803D",
    iconColorDark: "#4ADE80",
    bgLight: "#DCFCE7",
    bgDark: "rgba(21, 128, 61, 0.2)",
    badgeLabel: "Earnings",
    badgeBgLight: "#DCFCE7",
    badgeBgDark: "rgba(21, 128, 61, 0.15)",
    badgeColorLight: "#15803D",
    badgeColorDark: "#4ADE80",
  },
  delivery_payout_updated: {
    iconFamily: "feather",
    iconName: "dollar-sign",
    iconColorLight: "#059669",
    iconColorDark: "#10B981",
    bgLight: "#D1FAE5",
    bgDark: "rgba(5, 150, 105, 0.2)",
    badgeLabel: "Payout",
    badgeBgLight: "#D1FAE5",
    badgeBgDark: "rgba(5, 150, 105, 0.15)",
    badgeColorLight: "#059669",
    badgeColorDark: "#10B981",
  },
  delivery_account_verification_updated: {
    iconFamily: "feather",
    iconName: "shield",
    iconColorLight: "#D97706",
    iconColorDark: "#FBBF24",
    bgLight: "#FEF3C7",
    bgDark: "rgba(217, 119, 6, 0.2)",
    badgeLabel: "KYC Account",
    badgeBgLight: "#FEF3C7",
    badgeBgDark: "rgba(217, 119, 6, 0.15)",
    badgeColorLight: "#D97706",
    badgeColorDark: "#FBBF24",
  },
  delivery_portal_announcement: {
    iconFamily: "ionicons",
    iconName: "megaphone",
    iconColorLight: "#7C3AED",
    iconColorDark: "#A78BFA",
    bgLight: "#EDE9FE",
    bgDark: "rgba(124, 58, 237, 0.2)",
    badgeLabel: "Announcement",
    badgeBgLight: "#EDE9FE",
    badgeBgDark: "rgba(124, 58, 237, 0.15)",
    badgeColorLight: "#7C3AED",
    badgeColorDark: "#A78BFA",
  },
  system: {
    iconFamily: "feather",
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

const DEFAULT_CONFIG = VISUAL_CONFIGS.system;

// ── Notification Row ───────────────────────────────────────────────────
const DeliveryNotificationRow = memo(
  function DeliveryNotificationRow({
    item,
    isDark,
    onPress,
  }: {
    item: DeliveryNotificationItem;
    isDark: boolean;
    onPress: (item: DeliveryNotificationItem) => void;
  }) {
    const visual = VISUAL_CONFIGS[item.type] || DEFAULT_CONFIG;

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
                  backgroundColor: "rgba(15, 118, 110, 0.15)",
                  borderColor: "rgba(45, 212, 191, 0.4)",
                  borderWidth: 1.5,
                }
              : styles.notifCardUnread),
        ]}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
      >
        {/* Leading Category Icon */}
        <View
          style={[
            styles.notifIconWrap,
            {
              backgroundColor: isDark ? visual.bgDark : visual.bgLight,
            },
          ]}
        >
          {visual.iconFamily === "ionicons" ? (
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

        {/* Text Content */}
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
                  isDark && { backgroundColor: "#2DD4BF" },
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

          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.notifTime,
                isDark && { color: "#64748B" },
              ]}
            >
              {dateFormatted}
            </Text>
            <View style={styles.tapActionWrap}>
              <Text
                style={[
                  styles.tapActionText,
                  isDark && { color: "#2DD4BF" },
                ]}
              >
                View
              </Text>
              <Feather
                name="chevron-right"
                size={scale(12)}
                color={isDark ? "#2DD4BF" : "#0F766E"}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item._id === next.item._id &&
    prev.item.isRead === next.item.isRead &&
    prev.isDark === next.isDark
);

export default function DeliveryNotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const { unreadCount, refresh: refreshUnread } = useUnreadNotifications("delivery");

  const [notifications, setNotifications] = useState<DeliveryNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTab>("ALL");

  // Fetch notifications
  const loadNotifications = useCallback(
    async (targetPage = 1, shouldAppend = false, category = activeTab) => {
      try {
        if (targetPage === 1 && !shouldAppend) {
          setLoading(true);
        } else if (targetPage > 1) {
          setLoadingMore(true);
        }

        const categoryParam = category === "ALL" ? undefined : category.toLowerCase();
        const res = await deliveryService.getNotifications(targetPage, 25, categoryParam);

        if (res && res.data) {
          setNotifications((prev) => {
            if (shouldAppend) {
              const existingIds = new Set(prev.map((n) => n._id));
              const uniqueNew = res.data.filter((n: any) => !existingIds.has(n._id));
              return [...prev, ...uniqueNew];
            }
            return res.data;
          });
          setHasMore(targetPage < (res.totalPages || 1));
          setPage(targetPage);
        }
      } catch (err) {
        console.warn("[DeliveryNotifications] Load error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  // Initial load
  useEffect(() => {
    loadNotifications(1, false, activeTab);
  }, [loadNotifications, activeTab]);

  // Real-time socket sync
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    socketService.connect("delivery").then(() => {
      unsubscribe = socketService.onDeliveryNotification((notif) => {
        // Prepend or reload
        if (notif && notif._id) {
          setNotifications((prev) => {
            const exists = prev.some((n) => n._id === notif._id);
            if (exists) return prev;
            return [notif, ...prev];
          });
        } else {
          loadNotifications(1, false, activeTab);
        }
        refreshUnread();
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [loadNotifications, activeTab, refreshUnread]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(1, false, activeTab);
    refreshUnread();
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      loadNotifications(page + 1, true, activeTab);
    }
  };

  // Contextual routing on tap
  const handlePress = async (item: DeliveryNotificationItem) => {
    if (!item.isRead) {
      // Optimistic read status update
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      deliveryService.markNotificationRead(item._id).catch(() => {});
      decrementUnread("delivery");
    }

    const type = item.type;
    const cat = item.category;

    if (
      cat === "delivery" ||
      type.startsWith("delivery_request") ||
      type.startsWith("delivery_assignment") ||
      type.startsWith("delivery_pickup") ||
      type.startsWith("delivery_handover") ||
      type.startsWith("delivery_out") ||
      type.startsWith("delivery_completed") ||
      type.startsWith("delivery_cancelled")
    ) {
      router.push("/DeliveryMain" as any);
    } else if (cat === "payments" || type.includes("earnings") || type.includes("payout")) {
      router.push("/DeliveryMain/wallet" as any);
    } else if (cat === "account" || type.includes("verification") || type.includes("account")) {
      router.push("/DeliveryMain/profile" as any);
    } else {
      // Stay on notifications
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread("delivery", 0);
      const catParam = activeTab === "ALL" ? undefined : activeTab.toLowerCase();
      await deliveryService.markAllNotificationsRead(catParam);
    } catch (err) {
      console.warn("[Mark All Read Error]:", err);
    }
  };

  const filterTabs: { key: CategoryTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "DELIVERY", label: "Delivery" },
    { key: "PAYMENTS", label: "Earnings" },
    { key: "ACCOUNT", label: "KYC & Account" },
    { key: "ANNOUNCEMENTS", label: "Notices" },
  ];

  return (
    <SafeAreaView
      style={[
        styles.root,
        isDark && { backgroundColor: "#080D0F" },
      ]}
      edges={["top"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Header */}
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
            color={isDark ? "#2DD4BF" : "#0F766E"}
          />
        </TouchableOpacity>

        <View style={styles.topNavCenter}>
          <Text
            style={[
              styles.navTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            Rider Notifications
          </Text>
          <Text
            style={[
              styles.navSub,
              isDark && { color: "#94A3B8" },
            ]}
          >
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
              : "All caught up"}
          </Text>
        </View>

        {unreadCount > 0 && (
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
                isDark && { color: "#2DD4BF" },
              ]}
            >
              Read All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips Bar */}
      <View
        style={[
          styles.filterRow,
          isDark && {
            backgroundColor: "#080D0F",
            borderBottomColor: "#1E252E",
          },
        ]}
      >
        <FlatList
          horizontal
          data={filterTabs}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterListContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isDark && { backgroundColor: "#151D24" },
                  isActive &&
                    (isDark
                      ? { backgroundColor: "#2DD4BF" }
                      : styles.filterChipActive),
                ]}
                onPress={() => setActiveTab(item.key)}
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
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#2DD4BF" : "#0F766E"}
          />
          <Text
            style={[
              styles.loadingText,
              isDark && { color: "#94A3B8" },
            ]}
          >
            Loading rider notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <DeliveryNotificationRow
              item={item}
              isDark={isDark}
              onPress={handlePress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? "#2DD4BF" : "#0F766E"]}
              tintColor={isDark ? "#2DD4BF" : "#0F766E"}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#2DD4BF" : "#0F766E"}
                />
              </View>
            ) : undefined
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
                  color={isDark ? "#2DD4BF" : "#0F766E"}
                />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                No Notifications
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                {activeTab === "ALL"
                  ? "You will receive delivery offers, earnings credits, and portal updates here."
                  : `No updates in the ${activeTab.toLowerCase()} category yet.`}
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
    backgroundColor: "#CCFBF1",
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
    backgroundColor: "#CCFBF1",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(12),
  },
  markAllBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#0F766E",
  },
  filterRow: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterListContent: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#0F766E",
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
    backgroundColor: "#F0FDFA",
    borderColor: "#5EEAD4",
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
    backgroundColor: "#0F766E",
    marginLeft: scale(6),
  },
  notifMessage: {
    fontSize: moderateScale(12),
    color: "#475569",
    marginTop: scale(4),
    lineHeight: scale(17),
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(6),
  },
  notifTime: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
  },
  tapActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  tapActionText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#0F766E",
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
    backgroundColor: "#CCFBF1",
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
  footerLoader: {
    paddingVertical: moderateScale(16),
    alignItems: "center",
  },
});
