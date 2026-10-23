import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendAdminTargetedNotification } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";
import {
  fetchStaffNotificationsAdminApi,
  markStaffNotificationReadApi,
} from "@/store/services/adminService";
import socketService from "@/store/services/socketService";

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const { actionLoading } = useAppSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState<"alerts" | "broadcast">("alerts");

  // Operational Alerts State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifRefreshing, setNotifRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const [notifTotal, setNotifTotal] = useState(0);

  // Broadcasts State
  const [audience, setAudience] = useState<"ALL" | "CUSTOMERS" | "VENDORS" | "DELIVERY_BOYS">("ALL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [screenTarget, setScreenTarget] = useState("");

  const audiences = [
    { label: "Everyone (All Users)", value: "ALL", icon: "bullhorn-outline" },
    { label: "Customers Only", value: "CUSTOMERS", icon: "account-group-outline" },
    { label: "Vendors Only", value: "VENDORS", icon: "store-outline" },
    { label: "Delivery Boys Only", value: "DELIVERY_BOYS", icon: "moped" },
  ];

  const notifFilters = [
    { label: "All Alerts", value: "all" },
    { label: "Orders", value: "staff_order" },
    { label: "Withdrawals", value: "staff_withdrawal" },
    { label: "Brands", value: "staff_brand" },
    { label: "Returns / Refunds", value: "staff_refund" },
    { label: "Delivery & COD", value: "staff_cod" },
    { label: "General Alerts", value: "staff_alert" },
  ];

  // Load Operational Notifications
  const loadNotifications = useCallback(
    async (page = 1) => {
      try {
        setNotifLoading(true);
        const params: any = { page, limit: 15 };
        if (typeFilter !== "all") {
          params.type = typeFilter;
        }
        if (unreadOnly) {
          params.unreadOnly = true;
        }
        const res = await fetchStaffNotificationsAdminApi(params);
        if (res?.notifications) {
          setNotifications(res.notifications);
          setNotifPage(res.pagination?.page || 1);
          setNotifTotalPages(res.pagination?.pages || 1);
          setNotifTotal(res.pagination?.total || 0);
        }
      } catch (err) {
        console.error("Failed to load staff notifications", err);
      } finally {
        setNotifLoading(false);
      }
    },
    [typeFilter, unreadOnly]
  );

  useEffect(() => {
    if (activeTab === "alerts") {
      loadNotifications(1);
    }
  }, [activeTab, loadNotifications]);

  // Real-time socket listener
  useEffect(() => {
    const unsubscribe = socketService.onStaffNotification((data: any) => {
      // Prepend to current list
      setNotifications((prev) => [
        {
          _id: `live_${Date.now()}`,
          title: data?.title || "Operational Alert",
          message: data?.message || "New event occurred",
          type: data?.eventType || "staff_alert",
          isRead: false,
          createdAt: new Date().toISOString(),
          data: data?.data,
        },
        ...prev,
      ]);
      setNotifTotal((prev) => prev + 1);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefreshAlerts = async () => {
    setNotifRefreshing(true);
    await loadNotifications(1);
    setNotifRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markStaffNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleNotificationPress = async (item: any) => {
    if (!item.isRead && item._id && !item._id.startsWith("live_")) {
      handleMarkAsRead(item._id);
    }

    const type = item.type;
    if (type === "staff_order") {
      router.navigate("/AdminMain/orders" as any);
    } else if (type === "staff_withdrawal") {
      router.navigate("/Screens/adminScreens/withdrawals" as any);
    } else if (type === "staff_brand") {
      router.navigate("/Screens/adminScreens/brands-review" as any);
    } else if (type === "staff_refund") {
      router.navigate("/Screens/adminScreens/refunds-workflow" as any);
    } else if (type === "staff_cod" || type === "staff_delivery") {
      router.navigate("/Screens/adminScreens/delivery" as any);
    } else if (type === "staff_ticket") {
      router.navigate("/Screens/adminScreens/support-tickets" as any);
    }
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Validation Error", "Please provide both title and notification message body.");
      return;
    }

    Alert.alert(
      "Confirm Targeted Notification",
      `Are you sure you want to broadcast this message to "${audience}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Broadcast Now",
          onPress: async () => {
            try {
              const res = await dispatch(
                sendAdminTargetedNotification({
                  targetAudience: audience,
                  title: title.trim(),
                  body: body.trim(),
                  data: screenTarget.trim() ? { screen: screenTarget.trim() } : {},
                })
              ).unwrap();

              Alert.alert(
                "Broadcast Sent Successfully!",
                `Delivered notification to ${res?.recipientCount || "all active"} accounts via push & socket.`
              );
              setTitle("");
              setBody("");
              setScreenTarget("");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to broadcast notification");
            }
          },
        },
      ]
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "staff_order":
        return { name: "shopping-bag", lib: Feather, color: "#10B981" };
      case "staff_withdrawal":
        return { name: "bank-outline", lib: MaterialCommunityIcons, color: "#F59E0B" };
      case "staff_brand":
        return { name: "tag-outline", lib: MaterialCommunityIcons, color: "#0EA5E9" };
      case "staff_refund":
        return { name: "rotate-ccw", lib: Feather, color: "#EF4444" };
      case "staff_cod":
        return { name: "cash-multiple", lib: MaterialCommunityIcons, color: "#A855F7" };
      case "staff_delivery":
        return { name: "moped", lib: MaterialCommunityIcons, color: "#6366F1" };
      default:
        return { name: "bell", lib: Feather, color: "#10B981" };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader title="Notifications" subtitle="Operational Feeds & App Broadcasts" showBack />

      {/* Top Segmented Navigation Bar */}
      <View style={[styles.segmentBar, { backgroundColor: cardBg, borderColor: border }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "alerts" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("alerts")}
        >
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={scale(16)}
            color={activeTab === "alerts" ? "#10B981" : textSecondary}
          />
          <Text style={[styles.segmentText, { color: activeTab === "alerts" ? "#10B981" : textSecondary }]}>
            Operations Feed ({notifTotal})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "broadcast" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("broadcast")}
        >
          <MaterialCommunityIcons
            name="bullhorn-outline"
            size={scale(16)}
            color={activeTab === "broadcast" ? "#10B981" : textSecondary}
          />
          <Text style={[styles.segmentText, { color: activeTab === "broadcast" ? "#10B981" : textSecondary }]}>
            Send Broadcast
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "alerts" ? (
        <FlatList
          data={notifications}
          keyExtractor={(item, idx) => item._id || item.id || String(idx)}
          refreshControl={<RefreshControl refreshing={notifRefreshing} onRefresh={onRefreshAlerts} tintColor="#10B981" />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Filter Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {notifFilters.map((nf) => {
                  const isSel = typeFilter === nf.value;
                  return (
                    <TouchableOpacity
                      key={nf.value}
                      style={[
                        styles.filterPill,
                        { backgroundColor: cardBg, borderColor: border },
                        isSel && styles.filterPillActive,
                      ]}
                      onPress={() => setTypeFilter(nf.value)}
                    >
                      <Text style={[styles.pillText, { color: isSel ? "#10B981" : textSecondary }]}>
                        {nf.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Unread Only Toggle */}
              <View style={styles.filterMetaRow}>
                <TouchableOpacity
                  style={[
                    styles.unreadTogglePill,
                    { borderColor: border, backgroundColor: cardBg },
                    unreadOnly && { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10B981" },
                  ]}
                  onPress={() => setUnreadOnly(!unreadOnly)}
                >
                  <View style={[styles.unreadDot, { backgroundColor: unreadOnly ? "#10B981" : textSecondary }]} />
                  <Text style={[styles.unreadToggleText, { color: unreadOnly ? "#10B981" : textSecondary }]}>
                    Unread Only
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.metaCountText, { color: textSecondary }]}>
                  {notifications.length} alerts loaded
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => {
            const icon = getNotificationIcon(item.type);
            const IconLib = icon.lib as any;
            const isUnread = !item.isRead;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.notifCard,
                  { backgroundColor: cardBg, borderColor: isUnread ? icon.color : border },
                  isUnread && { borderLeftWidth: scale(4), borderLeftColor: icon.color },
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.notifRow}>
                  <View style={[styles.iconWrap, { backgroundColor: `${icon.color}18` }]}>
                    <IconLib name={icon.name} size={scale(18)} color={icon.color} />
                  </View>

                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={[styles.notifTitle, { color: textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {isUnread && <View style={[styles.activeDot, { backgroundColor: icon.color }]} />}
                    </View>

                    <Text style={[styles.notifMessage, { color: textSecondary }]} numberOfLines={2}>
                      {item.message || item.body}
                    </Text>

                    <View style={styles.notifFooterRow}>
                      <Text style={[styles.notifTime, { color: textSecondary }]}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                      </Text>

                      {isUnread && item._id && !item._id.startsWith("live_") && (
                        <TouchableOpacity
                          style={styles.markReadBtn}
                          onPress={() => handleMarkAsRead(item._id)}
                        >
                          <Text style={styles.markReadText}>Mark read</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            notifLoading ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                  Fetching operational feed...
                </Text>
              </View>
            ) : (
              <View style={styles.centerWrap}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={scale(48)} color={textSecondary} />
                <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                  All caught up! No operational alerts found.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            notifTotalPages > 1 ? (
              <View style={styles.paginationFooter}>
                <TouchableOpacity
                  disabled={notifPage <= 1}
                  onPress={() => loadNotifications(notifPage - 1)}
                  style={[styles.pageBtn, notifPage <= 1 && styles.pageBtnDisabled]}
                >
                  <Feather name="chevron-left" size={scale(16)} color={notifPage <= 1 ? textSecondary : textPrimary} />
                  <Text style={[styles.pageBtnText, { color: notifPage <= 1 ? textSecondary : textPrimary }]}>Prev</Text>
                </TouchableOpacity>
                <Text style={[styles.pageInfoText, { color: textSecondary }]}>
                  Page {notifPage} of {notifTotalPages}
                </Text>
                <TouchableOpacity
                  disabled={notifPage >= notifTotalPages}
                  onPress={() => loadNotifications(notifPage + 1)}
                  style={[styles.pageBtn, notifPage >= notifTotalPages && styles.pageBtnDisabled]}
                >
                  <Text style={[styles.pageBtnText, { color: notifPage >= notifTotalPages ? textSecondary : textPrimary }]}>Next</Text>
                  <Feather name="chevron-right" size={scale(16)} color={notifPage >= notifTotalPages ? textSecondary : textPrimary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      ) : (
        <ScrollView
          style={[styles.container, { backgroundColor: bg }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Audience Selector Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.cardHeader}>
              <Feather name="users" size={scale(18)} color="#10B981" />
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Select Target Audience</Text>
            </View>

            <View style={styles.audienceGrid}>
              {audiences.map((item) => {
                const isSelected = audience === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.audienceOption,
                      { borderColor: isSelected ? "#10B981" : border },
                      isSelected && { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5" },
                    ]}
                    onPress={() => setAudience(item.value as any)}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={scale(22)}
                      color={isSelected ? "#10B981" : textSecondary}
                    />
                    <Text
                      style={[
                        styles.audienceLabel,
                        { color: isSelected ? "#10B981" : textPrimary, fontWeight: isSelected ? "700" : "500" },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Compose Notification Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.cardHeader}>
              <Feather name="edit-3" size={scale(18)} color="#10B981" />
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Notification Content</Text>
            </View>

            <Text style={[styles.inputLabel, { color: textPrimary }]}>Headline / Title *</Text>
            <TextInput
              style={[styles.input, { color: textPrimary, borderColor: border, backgroundColor: bg }]}
              placeholder="e.g. Flash Sale: 20% Off Fresh Vegetables Today!"
              placeholderTextColor={textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(14) }]}>
              Message Body *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { color: textPrimary, borderColor: border, backgroundColor: bg },
              ]}
              placeholder="Write the full broadcast message content..."
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={4}
              value={body}
              onChangeText={setBody}
            />

            <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(14) }]}>
              Deep Link / Target Screen (Optional)
            </Text>
            <TextInput
              style={[styles.input, { color: textPrimary, borderColor: border, backgroundColor: bg }]}
              placeholder="e.g. /(tabs)/home or /Screens/customerScreens/offers"
              placeholderTextColor={textSecondary}
              value={screenTarget}
              onChangeText={setScreenTarget}
            />
          </View>

          {/* Send Broadcast CTA Button */}
          <TouchableOpacity
            style={[styles.sendBtn, actionLoading && styles.btnDisabled]}
            disabled={actionLoading}
            onPress={handleSendBroadcast}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="send" size={scale(18)} color="#FFFFFF" />
                <Text style={styles.sendBtnText}>Broadcast Message Now</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  segmentBar: {
    flexDirection: "row",
    marginHorizontal: scale(16),
    marginTop: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(3),
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  segmentBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  segmentText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  listContent: {
    padding: scale(14),
    paddingBottom: scale(40),
  },
  pillScroll: {
    flexDirection: "row",
    marginBottom: scale(10),
  },
  filterPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(18),
    borderWidth: 1,
    marginRight: scale(8),
  },
  filterPillActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  pillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  filterMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(10),
  },
  unreadTogglePill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    gap: scale(6),
  },
  unreadDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  unreadToggleText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  metaCountText: {
    fontSize: moderateScale(11),
  },
  notifCard: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(10),
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    flex: 1,
  },
  activeDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginLeft: scale(6),
  },
  notifMessage: {
    fontSize: moderateScale(11),
    lineHeight: scale(16),
    marginTop: scale(2),
  },
  notifFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(6),
  },
  notifTime: {
    fontSize: moderateScale(10),
  },
  markReadBtn: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
  },
  markReadText: {
    color: "#10B981",
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  centerWrap: {
    paddingVertical: scale(40),
    alignItems: "center",
  },
  emptyText: {
    fontSize: moderateScale(12),
  },
  paginationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scale(12),
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    padding: scale(6),
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  pageInfoText: {
    fontSize: moderateScale(11),
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: scale(40),
  },
  card: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(16),
    marginBottom: scale(16),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(14),
    gap: scale(8),
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  audienceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  audienceOption: {
    width: "48%",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
  },
  audienceLabel: {
    fontSize: moderateScale(11),
    textAlign: "center",
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: scale(6),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(13),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(13),
    minHeight: scale(80),
    textAlignVertical: "top",
  },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    borderRadius: scale(10),
    paddingVertical: scale(14),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    marginTop: scale(4),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
});
