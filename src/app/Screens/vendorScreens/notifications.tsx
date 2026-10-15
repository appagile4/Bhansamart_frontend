import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  VendorNotificationRecord,
} from "@/store/slices/vendorFinanceSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

type NotifFilter = "ALL" | "UNREAD" | "ORDERS" | "FINANCE";

export default function VendorNotificationsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, notificationsLoading, unreadCount } = useAppSelector(
    (state) => state.vendorFinance,
  );

  const [activeFilter, setActiveFilter] = useState<NotifFilter>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchNotifications()).finally(() => {
      setRefreshing(false);
    });
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotificationPress = (item: VendorNotificationRecord) => {
    if (!item) return;
    if (!item.isRead && item._id) {
      dispatch(markNotificationAsRead(item._id));
    }
    const typeStr = item.type || "";
    if (item.order) {
      router.push("/VendorMain/order" as any);
    } else if (typeStr.includes("COD")) {
      router.push("/Screens/vendorScreens/cod-handover" as any);
    } else if (typeStr.includes("WITHDRAWAL") || typeStr.includes("PAYMENT")) {
      router.push("/VendorMain/transaction" as any);
    }
  };

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((n) => {
        if (!n) return false;
        const typeStr = n.type || "";
        if (activeFilter === "UNREAD") return !n.isRead;
        if (activeFilter === "ORDERS") return typeStr.includes("ORDER");
        if (activeFilter === "FINANCE")
          return (
            typeStr.includes("COD") ||
            typeStr.includes("WITHDRAWAL") ||
            typeStr.includes("PAYMENT")
          );
        return true;
      })
    : [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return { icon: "shopping-bag", color: "#2563EB", bg: "#EFF6FF" };
      case "ORDER_ACCEPTED":
      case "ORDER_PREPARING":
        return { icon: "clock", color: "#D97706", bg: "#FFFBEB" };
      case "ORDER_PICKED_UP":
      case "ORDER_OUT_FOR_DELIVERY":
        return { icon: "truck", color: "#7C3AED", bg: "#F5F3FF" };
      case "ORDER_DELIVERED":
        return { icon: "check-circle", color: "#059669", bg: "#ECFDF5" };
      case "ORDER_CANCELLED":
        return { icon: "x-circle", color: "#DC2626", bg: "#FEF2F2" };
      case "COD_COLLECTED":
        return { icon: "dollar-sign", color: "#D97706", bg: "#FEF9C3" };
      case "COD_SUBMITTED":
        return { icon: "check", color: "#16A34A", bg: "#DCFCE7" };
      case "WITHDRAWAL_UPDATE":
        return { icon: "credit-card", color: "#016073", bg: "#E6F4F6" };
      default:
        return { icon: "bell", color: "#64748B", bg: "#F1F5F9" };
    }
  };

  const renderItem = ({ item }: { item: VendorNotificationRecord }) => {
    const iconConfig = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
          <Feather
            name={iconConfig.icon as any}
            size={scale(18)}
            color={iconConfig.color}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text
              style={[styles.cardTitle, !item.isRead && styles.unreadTitle]}
            >
              {item.title}
            </Text>
            <Text style={styles.cardTime}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now"}
            </Text>
          </View>

          <Text style={styles.cardMsg}>{item.message}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Sub Header & Mark All as Read */}
      <View style={styles.topBar}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/VendorMain/dashboard" as any);
              }
            }}
            style={{ paddingRight: scale(4) }}
            accessibilityLabel="Go Back"
          >
            <Feather name="arrow-left" size={scale(20)} color="#016073" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Inbox & Activity</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead}>
            <Text style={styles.markAllBtn}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { key: "ALL", label: "All" },
            { key: "UNREAD", label: "Unread" },
            { key: "ORDERS", label: "Orders" },
            { key: "FINANCE", label: "Finances & COD" },
          ] as { key: NotifFilter; label: string }[]
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => setActiveFilter(tab.key)}
            style={[
              styles.filterChip,
              activeFilter === tab.key && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === tab.key && styles.filterChipTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(n) => n._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
        ListEmptyComponent={
          notificationsLoading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="small" color="#016073" />
              <Text style={styles.emptyText}>Loading notifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="notifications-off-outline"
                size={scale(40)}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You're all caught up! New orders and payment updates will appear
                here.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topBarTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  unreadCountBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  unreadCountBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  markAllBtn: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#016073",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    gap: scale(8),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterChip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5),
    borderRadius: scale(18),
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#016073",
  },
  filterChipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContainer: {
    padding: scale(16),
    gap: scale(10),
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: scale(14),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    position: "relative",
  },
  unreadCard: {
    backgroundColor: "#F8FCFD",
    borderColor: "#E0F2FE",
  },
  iconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(2),
  },
  cardTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    marginRight: scale(8),
  },
  unreadTitle: {
    fontWeight: "800",
    color: "#016073",
  },
  cardTime: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
  },
  cardMsg: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    lineHeight: scale(16),
  },
  unreadIndicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#016073",
    position: "absolute",
    top: scale(14),
    right: scale(14),
  },
  emptyWrap: {
    paddingVertical: scale(60),
    alignItems: "center",
    paddingHorizontal: scale(30),
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#475569",
    marginTop: scale(6),
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textAlign: "center",
  },
});
