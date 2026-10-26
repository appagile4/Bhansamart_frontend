import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import NotificationItem from "@/components/staffAdminComponent/NotificationItem";
import {
  fetchStaffNotificationsAdminApi,
  markStaffNotificationReadApi,
} from "@/store/services/adminService";
import socketService from "@/store/services/socketService";

export default function StaffAdminNotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await fetchStaffNotificationsAdminApi({
        unreadOnly: unreadOnly || undefined,
        limit: 50,
      });
      if (res?.notifications || res?.data || Array.isArray(res)) {
        setNotifications(res.notifications || res.data || res);
      }
    } catch (e) {
      console.warn("[Notifications] Failed to load notifications", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadNotifications();

    // Listen for live staff notifications via socket
    const unsubscribe = socketService.onStaffNotification((notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [unreadOnly]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (item: any) => {
    if (!item.isRead) {
      try {
        await markStaffNotificationReadApi(item._id || item.id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch (e) {
        // Silent catch
      }
    }

    // Navigate to related workflow if deepLink / type matches
    const type = (item.type || "").toUpperCase();
    if (type.includes("REFUND")) {
      router.push("/Screens/staffadminScreens/ReturnsRefundsScreen" as any);
    } else if (type.includes("TICKET")) {
      router.push("/Screens/staffadminScreens/TicketsScreen" as any);
    } else if (type.includes("BRAND")) {
      router.push("/Screens/staffadminScreens/BrandSubmissionsScreen" as any);
    } else if (type.includes("WITHDRAWAL")) {
      router.push("/Screens/staffadminScreens/WithdrawalsScreen" as any);
    } else if (type.includes("DELIVERY") || type.includes("COD")) {
      router.push("/Screens/staffadminScreens/CODReconciliationScreen" as any);
    } else if (type.includes("ORDER")) {
      router.push("/Screens/staffadminScreens/OrdersScreen" as any);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Notifications"
        subtitle={`${unreadCount} Unread Alerts`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Filter Toggle */}
        <View style={styles.topBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setUnreadOnly(!unreadOnly)}
            style={[
              styles.filterPill,
              {
                backgroundColor: unreadOnly ? "#0284C7" : cardBg,
                borderColor: unreadOnly ? "#0284C7" : border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: unreadOnly ? "#FFFFFF" : textSecondary },
              ]}
            >
              {unreadOnly ? "Showing Unread Only" : "Show All Notifications"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.countText, { color: textSecondary }]}>
            {notifications.length} total
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Syncing operational alerts...
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={() => handleNotificationPress(item)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>All Caught Up</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No operational notifications pending.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(10),
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  filterPill: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  countText: {
    fontSize: moderateScale(11.5),
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: moderateScale(30),
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  emptyBox: {
    padding: scale(24),
    borderRadius: scale(14),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
});
