import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from "@/store/slices/referralSlice";
import { CustomerNotificationItem } from "@/store/services/referralService";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useState } from "react";
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

// ── Notification Item Row ──────────────────────────────────────────────
const NotificationRow = memo(function NotificationRow({
  item,
  onPress,
}: {
  item: CustomerNotificationItem;
  onPress: (item: CustomerNotificationItem) => void;
}) {
  const isReferralReward =
    item.type === "referral_reward" || item.type === "referral_success";
  const isWelcomeReward = item.type === "welcome_reward";
  const isReward = item.type === "reward" || isReferralReward || isWelcomeReward;
  const isOrder = item.type === "order";

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
      style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      <View
        style={[
          styles.notifIconWrap,
          {
            backgroundColor: isReferralReward
              ? "#E6F4F6"
              : isWelcomeReward
              ? "#DCFCE7"
              : isOrder
              ? "#FEF3C7"
              : "#F1F5F9",
          },
        ]}
      >
        {isReferralReward ? (
          <Feather name="gift" size={scale(18)} color="#016073" />
        ) : isWelcomeReward ? (
          <Ionicons name="sparkles" size={scale(18)} color="#15803D" />
        ) : isOrder ? (
          <Feather name="package" size={scale(18)} color="#B45309" />
        ) : (
          <Feather name="bell" size={scale(18)} color="#64748B" />
        )}
      </View>

      <View style={styles.notifContent}>
        <View style={styles.notifTopRow}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.notifMessage} numberOfLines={3}>
          {item.message}
        </Text>

        <Text style={styles.notifTime}>{dateFormatted}</Text>
      </View>
    </TouchableOpacity>
  );
});

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    notifications,
    unreadNotificationsCount,
    notificationsLoading,
  } = useAppSelector((state) => state.referral);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchCustomerNotifications({ page: 1, limit: 30 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCustomerNotifications({ page: 1, limit: 30 }));
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: CustomerNotificationItem) => {
    if (!item.isRead) {
      dispatch(markCustomerNotificationRead(item._id));
    }

    // Contextual routing based on notification type
    if (
      item.type === "referral_reward" ||
      item.type === "referral_success" ||
      item.type === "welcome_reward" ||
      item.type === "reward"
    ) {
      router.push("/Screens/Profile/loyalty" as any);
    } else if (item.type === "order") {
      router.push("/Screens/Profile/your-orders" as any);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadNotificationsCount === 0) return;
    dispatch(markAllCustomerNotificationsRead());
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text style={styles.navTitle}>Notifications</Text>
          <Text style={styles.navSub}>
            {unreadNotificationsCount > 0
              ? `${unreadNotificationsCount} unread update${unreadNotificationsCount === 1 ? "" : "s"}`
              : "All caught up"}
          </Text>
        </View>

        {unreadNotificationsCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllBtnText}>Read All</Text>
          </TouchableOpacity>
        )}
      </View>

      {notificationsLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#016073" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={handleNotificationPress} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#016073"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={scale(40)} color="#016073" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySubtitle}>
                You will receive updates here about order status, referral rewards, and special promotions.
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
  notifTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
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
