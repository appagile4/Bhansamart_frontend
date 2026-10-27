import AdminHeader from "@/components/AdminHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminNotificationHistoryApi,
  fetchStaffNotificationsAdminApi,
  markStaffNotificationReadApi,
  searchNotificationRecipientsApi,
} from "@/store/services/adminService";
import socketService from "@/store/services/socketService";
import { sendAdminTargetedNotification } from "@/store/slices/adminSlice";
import { decrementUnread, setUnread } from "@/utils/notificationSync";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AudienceType =
  | "ALL"
  | "CUSTOMERS"
  | "VENDORS"
  | "DELIVERY_BOYS"
  | "ADMIN_STAFF"
  | "SPECIFIC";
type SpecificRole = "customer" | "vendor" | "delivery_boy" | "admin";

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const { actionLoading } = useAppSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState<
    "alerts" | "broadcast" | "history"
  >("alerts");

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
  const [audience, setAudience] = useState<AudienceType>("ALL");
  const [targetRole, setTargetRole] = useState<SpecificRole>("customer");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [screenTarget, setScreenTarget] = useState("");

  // Broadcast History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySearch, setHistorySearch] = useState("");

  // Detail Modal State
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(
    null,
  );

  const audiences: { label: string; value: AudienceType; icon: any }[] = [
    { label: "Everyone (All Users)", value: "ALL", icon: "bullhorn-outline" },
    {
      label: "Customers Only",
      value: "CUSTOMERS",
      icon: "account-group-outline",
    },
    { label: "Vendors Only", value: "VENDORS", icon: "storefront-outline" },
    { label: "Delivery Boys Only", value: "DELIVERY_BOYS", icon: "moped" },
    {
      label: "Staff Admins Only",
      value: "ADMIN_STAFF",
      icon: "shield-account-outline",
    },
    {
      label: "Specific User",
      value: "SPECIFIC",
      icon: "account-search-outline",
    },
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
          setNotifPage(res.page || res.pagination?.page || 1);
          setNotifTotalPages(res.totalPages || res.pagination?.pages || 1);
          setNotifTotal(res.total || res.pagination?.total || 0);
          if (res.unreadCount !== undefined) {
            setUnread("admin", res.unreadCount);
          }
        }
      } catch (err) {
        console.error("Failed to load staff notifications", err);
      } finally {
        setNotifLoading(false);
      }
    },
    [typeFilter, unreadOnly],
  );

  // Load Broadcast History
  const loadBroadcastHistory = useCallback(
    async (page = 1, search = historySearch) => {
      try {
        setHistoryLoading(true);
        const params: any = { page, limit: 15 };
        if (search.trim()) {
          params.search = search.trim();
        }
        const res = await fetchAdminNotificationHistoryApi(params);
        if (res?.data?.history) {
          setHistoryList(res.data.history);
          setHistoryPage(res.data.page || 1);
          setHistoryTotalPages(res.data.pages || 1);
          setHistoryTotal(res.data.total || 0);
        }
      } catch (err) {
        console.error("Failed to load broadcast history", err);
      } finally {
        setHistoryLoading(false);
      }
    },
    [historySearch],
  );

  useEffect(() => {
    if (activeTab === "alerts") {
      loadNotifications(1);
    } else if (activeTab === "history") {
      loadBroadcastHistory(1);
    }
  }, [activeTab, loadNotifications, loadBroadcastHistory]);

  // Real-time socket listener
  useEffect(() => {
    const unsubscribe = socketService.onStaffNotification((data: any) => {
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

  const onRefreshHistory = async () => {
    setHistoryRefreshing(true);
    await loadBroadcastHistory(1);
    setHistoryRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markStaffNotificationReadApi(id);
      decrementUnread("admin");
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id || n.id === id ? { ...n, isRead: true } : n,
        ),
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

  // Debounced search for specific recipient
  useEffect(() => {
    if (audience !== "SPECIFIC") {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchNotificationRecipientsApi({
          role: targetRole,
          q: searchQuery.trim(),
        });
        if (res?.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.warn("[Search Recipients Error]:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [audience, targetRole, searchQuery]);

  // Debounced history search
  useEffect(() => {
    if (activeTab !== "history") return;
    const timer = setTimeout(() => {
      loadBroadcastHistory(1, historySearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [historySearch, activeTab, loadBroadcastHistory]);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert(
        "Validation Error",
        "Please provide both headline/title and message body.",
      );
      return;
    }

    if (audience === "SPECIFIC" && !selectedRecipient) {
      Alert.alert(
        "Target Required",
        "Please search and select a specific recipient to dispatch this notification.",
      );
      return;
    }

    const audienceLabel =
      audience === "SPECIFIC"
        ? `${selectedRecipient.name} (${selectedRecipient.role?.toUpperCase()})`
        : audiences.find((a) => a.value === audience)?.label || audience;

    Alert.alert(
      "Confirm Notification Dispatch",
      `Are you sure you want to send this notification to "${audienceLabel}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Now",
          onPress: async () => {
            try {
              const res = await dispatch(
                sendAdminTargetedNotification({
                  targetAudience: audience,
                  targetRole: audience === "SPECIFIC" ? targetRole : undefined,
                  targetId:
                    audience === "SPECIFIC"
                      ? selectedRecipient.id || selectedRecipient._id
                      : undefined,
                  title: title.trim(),
                  body: body.trim(),
                  deepLink: screenTarget.trim() || undefined,
                  data: screenTarget.trim()
                    ? { screen: screenTarget.trim() }
                    : {},
                }),
              ).unwrap();

              Alert.alert(
                "Dispatched Successfully!",
                `Delivered notification to ${res?.recipientCount ?? "all active"} account(s) via real-time socket and in-app feed.`,
                [
                  {
                    text: "View in History",
                    onPress: () => {
                      setActiveTab("history");
                      loadBroadcastHistory(1);
                    },
                  },
                  { text: "OK" },
                ],
              );
              setTitle("");
              setBody("");
              setScreenTarget("");
              setSelectedRecipient(null);
              setSearchQuery("");
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Failed to broadcast notification",
              );
            }
          },
        },
      ],
    );
  };

  const handleReuseHistoryTemplate = (item: any) => {
    setTitle(item.title || "");
    setBody(item.body || "");
    setScreenTarget(item.deepLink || "");
    if (item.targetAudience) {
      const matched = audiences.find((a) => a.value === item.targetAudience);
      if (matched) {
        setAudience(matched.value);
      }
    }
    setSelectedHistoryItem(null);
    setActiveTab("broadcast");
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
        return {
          name: "bank-outline",
          lib: MaterialCommunityIcons,
          color: "#F59E0B",
        };
      case "staff_brand":
        return {
          name: "tag-outline",
          lib: MaterialCommunityIcons,
          color: "#0EA5E9",
        };
      case "staff_refund":
        return { name: "rotate-ccw", lib: Feather, color: "#EF4444" };
      case "staff_cod":
        return {
          name: "cash-multiple",
          lib: MaterialCommunityIcons,
          color: "#A855F7",
        };
      case "staff_delivery":
        return { name: "moped", lib: MaterialCommunityIcons, color: "#6366F1" };
      default:
        return { name: "bell", lib: Feather, color: "#10B981" };
    }
  };

  const getAudienceBadgeInfo = (aud: string) => {
    switch (aud) {
      case "CUSTOMERS":
        return {
          label: "CUSTOMERS",
          color: "#0284C7",
          icon: "account-group-outline",
        };
      case "VENDORS":
      case "ASSIGNED_VENDORS":
        return {
          label: "VENDORS",
          color: "#F59E0B",
          icon: "storefront-outline",
        };
      case "DELIVERY_BOYS":
        return { label: "DELIVERY BOYS", color: "#10B981", icon: "moped" };
      case "ADMIN_STAFF":
        return {
          label: "STAFF ADMIN",
          color: "#6366F1",
          icon: "shield-account-outline",
        };
      case "SPECIFIC":
        return {
          label: "DIRECT USER",
          color: "#EC4899",
          icon: "account-outline",
        };
      default:
        return {
          label: "ALL USERS",
          color: "#10B981",
          icon: "bullhorn-outline",
        };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Notifications"
        subtitle="Operational Feeds & App Broadcasts"
        showBack
      />

      {/* Top Segmented Navigation Bar (3 Tabs) */}
      <View
        style={[
          styles.segmentBar,
          { backgroundColor: cardBg, borderColor: border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "alerts" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("alerts")}
        >
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={scale(15)}
            color={activeTab === "alerts" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "alerts" ? "#10B981" : textSecondary },
            ]}
            numberOfLines={1}
          >
            Alerts ({notifTotal})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "broadcast" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("broadcast")}
        >
          <MaterialCommunityIcons
            name="bullhorn-outline"
            size={scale(15)}
            color={activeTab === "broadcast" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "broadcast" ? "#10B981" : textSecondary },
            ]}
            numberOfLines={1}
          >
            Broadcast
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "history" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("history")}
        >
          <MaterialCommunityIcons
            name="history"
            size={scale(15)}
            color={activeTab === "history" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "history" ? "#10B981" : textSecondary },
            ]}
            numberOfLines={1}
          >
            History ({historyTotal})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: OPERATIONS FEED */}
      {activeTab === "alerts" && (
        <FlatList
          data={notifications}
          keyExtractor={(item, idx) => item._id || item.id || String(idx)}
          refreshControl={
            <RefreshControl
              refreshing={notifRefreshing}
              onRefresh={onRefreshAlerts}
              tintColor="#10B981"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillScroll}
              >
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
                      <Text
                        style={[
                          styles.pillText,
                          { color: isSel ? "#10B981" : textSecondary },
                        ]}
                      >
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
                    unreadOnly && {
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      borderColor: "#10B981",
                    },
                  ]}
                  onPress={() => setUnreadOnly(!unreadOnly)}
                >
                  <View
                    style={[
                      styles.unreadDot,
                      {
                        backgroundColor: unreadOnly ? "#10B981" : textSecondary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.unreadToggleText,
                      { color: unreadOnly ? "#10B981" : textSecondary },
                    ]}
                  >
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
                  {
                    backgroundColor: cardBg,
                    borderColor: isUnread ? icon.color : border,
                  },
                  isUnread && {
                    borderLeftWidth: scale(4),
                    borderLeftColor: icon.color,
                  },
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.notifRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: `${icon.color}18` },
                    ]}
                  >
                    <IconLib
                      name={icon.name}
                      size={scale(18)}
                      color={icon.color}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <View style={styles.notifHeaderRow}>
                      <Text
                        style={[styles.notifTitle, { color: textPrimary }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {isUnread && (
                        <View
                          style={[
                            styles.activeDot,
                            { backgroundColor: icon.color },
                          ]}
                        />
                      )}
                    </View>

                    <Text
                      style={[styles.notifMessage, { color: textSecondary }]}
                      numberOfLines={2}
                    >
                      {item.message || item.body}
                    </Text>

                    <View style={styles.notifFooterRow}>
                      <Text
                        style={[styles.notifTime, { color: textSecondary }]}
                      >
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </Text>

                      {isUnread &&
                        item._id &&
                        !item._id.startsWith("live_") && (
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
                <Text
                  style={[
                    styles.emptyText,
                    { color: textSecondary, marginTop: scale(10) },
                  ]}
                >
                  Fetching operational feed...
                </Text>
              </View>
            ) : (
              <View style={styles.centerWrap}>
                <MaterialCommunityIcons
                  name="bell-sleep-outline"
                  size={scale(48)}
                  color={textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: textSecondary, marginTop: scale(10) },
                  ]}
                >
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
                  style={[
                    styles.pageBtn,
                    notifPage <= 1 && styles.pageBtnDisabled,
                  ]}
                >
                  <Feather
                    name="chevron-left"
                    size={scale(16)}
                    color={notifPage <= 1 ? textSecondary : textPrimary}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      { color: notifPage <= 1 ? textSecondary : textPrimary },
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.pageInfoText, { color: textSecondary }]}>
                  Page {notifPage} of {notifTotalPages}
                </Text>
                <TouchableOpacity
                  disabled={notifPage >= notifTotalPages}
                  onPress={() => loadNotifications(notifPage + 1)}
                  style={[
                    styles.pageBtn,
                    notifPage >= notifTotalPages && styles.pageBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      {
                        color:
                          notifPage >= notifTotalPages
                            ? textSecondary
                            : textPrimary,
                      },
                    ]}
                  >
                    Next
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={scale(16)}
                    color={
                      notifPage >= notifTotalPages ? textSecondary : textPrimary
                    }
                  />
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
      )}

      {/* TAB 2: COMPOSE BROADCAST WITH KEYBOARD AVOIDING VIEW */}
      {activeTab === "broadcast" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={[styles.container, { backgroundColor: bg }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Audience Selector Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Feather name="users" size={scale(18)} color="#10B981" />
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  Select Target Audience
                </Text>
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
                        isSelected && {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.15)"
                            : "#ECFDF5",
                        },
                      ]}
                      onPress={() => {
                        setAudience(item.value);
                        if (item.value !== "SPECIFIC") {
                          setSelectedRecipient(null);
                          setSearchQuery("");
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={scale(22)}
                        color={isSelected ? "#10B981" : textSecondary}
                      />
                      <Text
                        style={[
                          styles.audienceLabel,
                          {
                            color: isSelected ? "#10B981" : textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Specific Recipient Picker Card */}
            {audience === "SPECIFIC" && (
              <View
                style={[
                  styles.card,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Feather name="user-check" size={scale(18)} color="#10B981" />
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>
                    Pick Specific Recipient
                  </Text>
                </View>

                {/* Target Role Selector Tabs */}
                <View
                  style={[styles.specificRoleTabs, { borderColor: border }]}
                >
                  {(
                    [
                      {
                        role: "customer",
                        label: "Customer",
                        icon: "account-outline",
                      },
                      {
                        role: "vendor",
                        label: "Vendor",
                        icon: "storefront-outline",
                      },
                      {
                        role: "delivery_boy",
                        label: "Delivery Boy",
                        icon: "moped",
                      },
                      {
                        role: "admin",
                        label: "Staff Admin",
                        icon: "shield-account-outline",
                      },
                    ] as const
                  ).map((r) => {
                    const isActive = targetRole === r.role;
                    return (
                      <TouchableOpacity
                        key={r.role}
                        style={[
                          styles.specificRoleBtn,
                          isActive && { backgroundColor: "#10B981" },
                        ]}
                        onPress={() => {
                          setTargetRole(r.role);
                          setSelectedRecipient(null);
                          setSearchQuery("");
                        }}
                      >
                        <MaterialCommunityIcons
                          name={r.icon as any}
                          size={scale(14)}
                          color={isActive ? "#FFFFFF" : textSecondary}
                        />
                        <Text
                          style={[
                            styles.specificRoleText,
                            { color: isActive ? "#FFFFFF" : textSecondary },
                          ]}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selected Recipient Card */}
                {selectedRecipient ? (
                  <View
                    style={[
                      styles.recipientCard,
                      {
                        borderColor: "#10B981",
                        backgroundColor: isDark
                          ? "rgba(16, 185, 129, 0.08)"
                          : "#F0FDF4",
                      },
                    ]}
                  >
                    <View style={styles.recipientAvatarBox}>
                      <MaterialCommunityIcons
                        name={
                          targetRole === "vendor"
                            ? "storefront"
                            : targetRole === "delivery_boy"
                              ? "moped"
                              : targetRole === "admin"
                                ? "shield-account"
                                : "account"
                        }
                        size={scale(22)}
                        color="#10B981"
                      />
                    </View>
                    <View style={styles.recipientInfo}>
                      <Text
                        style={[styles.recipientName, { color: textPrimary }]}
                      >
                        {selectedRecipient.name}
                      </Text>
                      <Text
                        style={[
                          styles.recipientContact,
                          { color: textSecondary },
                        ]}
                      >
                        {selectedRecipient.phone ||
                          selectedRecipient.email ||
                          "No direct phone"}
                      </Text>
                      <View style={styles.recipientBadge}>
                        <Text style={styles.recipientBadgeText}>
                          {targetRole.toUpperCase().replace("_", " ")}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.clearRecipientBtn}
                      onPress={() => {
                        setSelectedRecipient(null);
                        setSearchQuery("");
                      }}
                    >
                      <Feather name="x" size={scale(18)} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Search Box and Live Results */
                  <View style={{ marginTop: scale(10) }}>
                    <Text style={[styles.inputLabel, { color: textPrimary }]}>
                      Search {targetRole.replace("_", " ")} by name, phone or
                      email
                    </Text>
                    <View
                      style={[
                        styles.searchBox,
                        { borderColor: border, backgroundColor: bg },
                      ]}
                    >
                      <Feather
                        name="search"
                        size={scale(16)}
                        color={textSecondary}
                      />
                      <TextInput
                        style={[styles.searchInput, { color: textPrimary }]}
                        placeholder={`Type to search ${targetRole.replace("_", " ")}...`}
                        placeholderTextColor={textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchLoading && (
                        <ActivityIndicator size="small" color="#10B981" />
                      )}
                    </View>

                    {/* Dropdown Results */}
                    {searchResults.length > 0 && (
                      <View
                        style={[
                          styles.resultsDropdown,
                          { backgroundColor: cardBg, borderColor: border },
                        ]}
                      >
                        {searchResults.map((item) => (
                          <TouchableOpacity
                            key={item.id || item._id}
                            style={[
                              styles.resultItem,
                              { borderBottomColor: border },
                            ]}
                            onPress={() => {
                              setSelectedRecipient(item);
                              setSearchResults([]);
                            }}
                          >
                            <View style={styles.resultItemLeft}>
                              <MaterialCommunityIcons
                                name={
                                  targetRole === "vendor"
                                    ? "storefront-outline"
                                    : targetRole === "delivery_boy"
                                      ? "moped"
                                      : targetRole === "admin"
                                        ? "shield-account-outline"
                                        : "account-outline"
                                }
                                size={scale(18)}
                                color="#10B981"
                              />
                              <View style={{ marginLeft: scale(8) }}>
                                <Text
                                  style={[
                                    styles.resultName,
                                    { color: textPrimary },
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.resultSub,
                                    { color: textSecondary },
                                  ]}
                                >
                                  {item.phone ||
                                    item.email ||
                                    "No contact info"}
                                </Text>
                              </View>
                            </View>
                            <Feather
                              name="check-circle"
                              size={scale(16)}
                              color="#10B981"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {searchQuery.trim().length > 0 &&
                      !searchLoading &&
                      searchResults.length === 0 && (
                        <Text
                          style={[
                            styles.noResultText,
                            { color: textSecondary },
                          ]}
                        >
                          No matching {targetRole.replace("_", " ")}s found.
                        </Text>
                      )}
                  </View>
                )}
              </View>
            )}

            {/* Compose Notification Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Feather name="edit-3" size={scale(18)} color="#10B981" />
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  Notification Content
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary }]}>
                Headline / Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textPrimary,
                    borderColor: border,
                    backgroundColor: bg,
                  },
                ]}
                placeholder="e.g. Flash Sale: 20% Off Fresh Vegetables Today!"
                placeholderTextColor={textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(14) },
                ]}
              >
                Message Body *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: textPrimary,
                    borderColor: border,
                    backgroundColor: bg,
                  },
                ]}
                placeholder="Write the full broadcast message content..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={4}
                value={body}
                onChangeText={setBody}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(14) },
                ]}
              >
                Deep Link / Target Screen (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textPrimary,
                    borderColor: border,
                    backgroundColor: bg,
                  },
                ]}
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
        </KeyboardAvoidingView>
      )}

      {/* TAB 3: BROADCAST HISTORY */}
      {activeTab === "history" && (
        <FlatList
          data={historyList}
          keyExtractor={(item, idx) => item._id || item.id || String(idx)}
          refreshControl={
            <RefreshControl
              refreshing={historyRefreshing}
              onRefresh={onRefreshHistory}
              tintColor="#10B981"
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={{ marginBottom: scale(12) }}>
              {/* Search History */}
              <View
                style={[
                  styles.searchBox,
                  { borderColor: border, backgroundColor: cardBg },
                ]}
              >
                <Feather name="search" size={scale(16)} color={textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: textPrimary }]}
                  placeholder="Search history by title, content or admin..."
                  placeholderTextColor={textSecondary}
                  value={historySearch}
                  onChangeText={setHistorySearch}
                />
                {historySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setHistorySearch("")}>
                    <Feather name="x" size={scale(16)} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.historyMetaRow}>
                <Text style={[styles.metaCountText, { color: textSecondary }]}>
                  {historyTotal} broadcast(s) dispatched
                </Text>
                <Text style={[styles.metaHintText, { color: "#10B981" }]}>
                  Tap any card for full details
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getAudienceBadgeInfo(item.targetAudience);

            return (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.historyCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
                onPress={() => setSelectedHistoryItem(item)}
              >
                {/* Header: Audience badge + Timestamp */}
                <View style={styles.historyCardHeader}>
                  <View
                    style={[
                      styles.audienceBadge,
                      {
                        backgroundColor: `${badge.color}15`,
                        borderColor: `${badge.color}40`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={badge.icon as any}
                      size={scale(12)}
                      color={badge.color}
                    />
                    <Text
                      style={[styles.audienceBadgeText, { color: badge.color }]}
                    >
                      {badge.label}
                    </Text>
                  </View>

                  <Text
                    style={[styles.historyTimeText, { color: textSecondary }]}
                  >
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent"}
                  </Text>
                </View>

                {/* Title */}
                <Text
                  style={[styles.historyTitle, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                {/* Message Body snippet */}
                <Text
                  style={[styles.historySnippet, { color: textSecondary }]}
                  numberOfLines={2}
                >
                  {item.body}
                </Text>

                {/* Footer Metrics */}
                <View style={styles.historyFooter}>
                  <View style={styles.historyMetricItem}>
                    <MaterialCommunityIcons
                      name="account-multiple-check-outline"
                      size={scale(14)}
                      color="#10B981"
                    />
                    <Text
                      style={[styles.historyMetricText, { color: textPrimary }]}
                    >
                      {item.recipientCount ?? 1}{" "}
                      {item.recipientCount === 1 ? "recipient" : "recipients"}
                    </Text>
                  </View>

                  {item.senderName && (
                    <View style={styles.historyMetricItem}>
                      <Feather
                        name="user"
                        size={scale(12)}
                        color={textSecondary}
                      />
                      <Text
                        style={[
                          styles.historySenderText,
                          { color: textSecondary },
                        ]}
                      >
                        By {item.senderName}
                      </Text>
                    </View>
                  )}

                  <Feather
                    name="chevron-right"
                    size={scale(16)}
                    color={textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            historyLoading ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text
                  style={[
                    styles.emptyText,
                    { color: textSecondary, marginTop: scale(10) },
                  ]}
                >
                  Loading broadcast history...
                </Text>
              </View>
            ) : (
              <View style={styles.centerWrap}>
                <MaterialCommunityIcons
                  name="history"
                  size={scale(48)}
                  color={textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: textSecondary, marginTop: scale(10) },
                  ]}
                >
                  {historySearch
                    ? "No matching broadcasts found."
                    : "No broadcasts have been sent yet."}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            historyTotalPages > 1 ? (
              <View style={styles.paginationFooter}>
                <TouchableOpacity
                  disabled={historyPage <= 1}
                  onPress={() => loadBroadcastHistory(historyPage - 1)}
                  style={[
                    styles.pageBtn,
                    historyPage <= 1 && styles.pageBtnDisabled,
                  ]}
                >
                  <Feather
                    name="chevron-left"
                    size={scale(16)}
                    color={historyPage <= 1 ? textSecondary : textPrimary}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      { color: historyPage <= 1 ? textSecondary : textPrimary },
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.pageInfoText, { color: textSecondary }]}>
                  Page {historyPage} of {historyTotalPages}
                </Text>
                <TouchableOpacity
                  disabled={historyPage >= historyTotalPages}
                  onPress={() => loadBroadcastHistory(historyPage + 1)}
                  style={[
                    styles.pageBtn,
                    historyPage >= historyTotalPages && styles.pageBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      {
                        color:
                          historyPage >= historyTotalPages
                            ? textSecondary
                            : textPrimary,
                      },
                    ]}
                  >
                    Next
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={scale(16)}
                    color={
                      historyPage >= historyTotalPages
                        ? textSecondary
                        : textPrimary
                    }
                  />
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
      )}

      {/* DETAIL MODAL: VIEW FULL BROADCAST CONTENT */}
      <Modal
        visible={!!selectedHistoryItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedHistoryItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scale(8),
                }}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="bullhorn-outline"
                    size={scale(20)}
                    color="#10B981"
                  />
                </View>
                <View>
                  <Text
                    style={[styles.modalHeaderTitle, { color: textPrimary }]}
                  >
                    Broadcast Details
                  </Text>
                  <Text
                    style={[styles.modalHeaderSub, { color: textSecondary }]}
                  >
                    Dispatched Notification Record
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedHistoryItem(null)}
              >
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              {selectedHistoryItem && (
                <>
                  {/* Title Banner */}
                  <View
                    style={[
                      styles.detailSection,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailSectionLabel,
                        { color: textSecondary },
                      ]}
                    >
                      HEADLINE / TITLE
                    </Text>
                    <Text
                      style={[styles.detailTitleText, { color: textPrimary }]}
                    >
                      {selectedHistoryItem.title}
                    </Text>
                  </View>

                  {/* Message Body Box */}
                  <View
                    style={[
                      styles.detailSection,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailSectionLabel,
                        { color: textSecondary },
                      ]}
                    >
                      MESSAGE BODY
                    </Text>
                    <Text
                      style={[styles.detailBodyText, { color: textPrimary }]}
                    >
                      {selectedHistoryItem.body}
                    </Text>
                  </View>

                  {/* Target Audience & Metrics Row */}
                  <View style={styles.detailGridRow}>
                    <View
                      style={[
                        styles.detailGridCard,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailSectionLabel,
                          { color: textSecondary },
                        ]}
                      >
                        AUDIENCE
                      </Text>
                      {(() => {
                        const badge = getAudienceBadgeInfo(
                          selectedHistoryItem.targetAudience,
                        );
                        return (
                          <View
                            style={[
                              styles.audienceBadge,
                              {
                                backgroundColor: `${badge.color}15`,
                                borderColor: `${badge.color}40`,
                                alignSelf: "flex-start",
                                marginTop: scale(4),
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={badge.icon as any}
                              size={scale(12)}
                              color={badge.color}
                            />
                            <Text
                              style={[
                                styles.audienceBadgeText,
                                { color: badge.color },
                              ]}
                            >
                              {badge.label}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>

                    <View
                      style={[
                        styles.detailGridCard,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailSectionLabel,
                          { color: textSecondary },
                        ]}
                      >
                        RECIPIENTS
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: scale(6),
                          marginTop: scale(4),
                        }}
                      >
                        <MaterialCommunityIcons
                          name="account-check"
                          size={scale(16)}
                          color="#10B981"
                        />
                        <Text
                          style={[
                            styles.detailMetricValue,
                            { color: textPrimary },
                          ]}
                        >
                          {selectedHistoryItem.recipientCount ?? 1} Accounts
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Specific Recipient details if targeted */}
                  {selectedHistoryItem.recipientName && (
                    <View
                      style={[
                        styles.detailSection,
                        {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.06)"
                            : "#F0FDF4",
                          borderColor: "#10B981",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailSectionLabel,
                          { color: "#10B981" },
                        ]}
                      >
                        TARGET RECIPIENT
                      </Text>
                      <Text
                        style={[
                          styles.detailRecipientText,
                          { color: textPrimary },
                        ]}
                      >
                        👤 {selectedHistoryItem.recipientName}
                      </Text>
                    </View>
                  )}

                  {/* Deep Link / Target Screen */}
                  {selectedHistoryItem.deepLink ? (
                    <View
                      style={[
                        styles.detailSection,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "#F8FAFC",
                          borderColor: border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailSectionLabel,
                          { color: textSecondary },
                        ]}
                      >
                        DEEP LINK / TARGET SCREEN
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: scale(6),
                          marginTop: scale(2),
                        }}
                      >
                        <Feather
                          name="link-2"
                          size={scale(14)}
                          color="#10B981"
                        />
                        <Text
                          style={[
                            styles.detailDeepLinkText,
                            { color: "#10B981" },
                          ]}
                        >
                          {selectedHistoryItem.deepLink}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Sender & Timestamp Information */}
                  <View
                    style={[
                      styles.detailSection,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailSectionLabel,
                        { color: textSecondary },
                      ]}
                    >
                      DISPATCH METADATA
                    </Text>
                    <View style={styles.metaInfoRow}>
                      <Text
                        style={[styles.metaInfoKey, { color: textSecondary }]}
                      >
                        Sender:
                      </Text>
                      <Text
                        style={[styles.metaInfoVal, { color: textPrimary }]}
                      >
                        {selectedHistoryItem.senderName || "Administrator"} (
                        {selectedHistoryItem.senderRole || "admin"})
                      </Text>
                    </View>
                    <View style={styles.metaInfoRow}>
                      <Text
                        style={[styles.metaInfoKey, { color: textSecondary }]}
                      >
                        Sent On:
                      </Text>
                      <Text
                        style={[styles.metaInfoVal, { color: textPrimary }]}
                      >
                        {selectedHistoryItem.createdAt
                          ? new Date(
                              selectedHistoryItem.createdAt,
                            ).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </Text>
                    </View>
                    <View style={styles.metaInfoRow}>
                      <Text
                        style={[styles.metaInfoKey, { color: textSecondary }]}
                      >
                        Channels:
                      </Text>
                      <Text style={[styles.metaInfoVal, { color: "#10B981" }]}>
                        In-App Tray • Socket Live • Mobile Push
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={[styles.modalActionsRow, { borderTopColor: border }]}>
              <TouchableOpacity
                style={[
                  styles.modalReuseBtn,
                  {
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    borderColor: "#10B981",
                  },
                ]}
                onPress={() => handleReuseHistoryTemplate(selectedHistoryItem)}
              >
                <Feather name="copy" size={scale(15)} color="#10B981" />
                <Text style={styles.modalReuseBtnText}>Reuse Template</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalCloseActionBtn,
                  { backgroundColor: isDark ? "#263238" : "#E2E8F0" },
                ]}
                onPress={() => setSelectedHistoryItem(null)}
              >
                <Text
                  style={[styles.modalCloseActionText, { color: textPrimary }]}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: scale(4),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  segmentBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  segmentText: {
    fontSize: moderateScale(11),
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
  metaHintText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
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
  specificRoleTabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: scale(8),
    overflow: "hidden",
    marginBottom: scale(12),
  },
  specificRoleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(8),
    gap: scale(4),
  },
  specificRoleText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
    marginTop: scale(6),
  },
  recipientAvatarBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  recipientContact: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  recipientBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginTop: scale(4),
  },
  recipientBadgeText: {
    color: "#10B981",
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  clearRecipientBtn: {
    padding: scale(6),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: scale(9),
    fontSize: moderateScale(12),
  },
  resultsDropdown: {
    borderWidth: 1,
    borderRadius: scale(8),
    marginTop: scale(6),
    maxHeight: scale(180),
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  resultName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  resultSub: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  noResultText: {
    fontSize: moderateScale(11),
    textAlign: "center",
    paddingVertical: scale(10),
  },
  // Broadcast History Styles
  historyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(8),
    paddingHorizontal: scale(2),
  },
  historyCard: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(14),
    marginBottom: scale(10),
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(6),
  },
  audienceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    borderWidth: 1,
    borderRadius: scale(6),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
  },
  audienceBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  historyTimeText: {
    fontSize: moderateScale(10),
  },
  historyTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    marginBottom: scale(4),
  },
  historySnippet: {
    fontSize: moderateScale(11),
    lineHeight: scale(16),
    marginBottom: scale(8),
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scale(6),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.2)",
  },
  historyMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  historyMetricText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  historySenderText: {
    fontSize: moderateScale(10),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: "85%",
    paddingTop: scale(16),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingBottom: scale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.25)",
  },
  modalHeaderTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalHeaderSub: {
    fontSize: moderateScale(11),
  },
  modalCloseBtn: {
    padding: scale(4),
  },
  modalBody: {
    padding: scale(16),
    paddingBottom: scale(24),
  },
  detailSection: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(10),
  },
  detailSectionLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: scale(4),
  },
  detailTitleText: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    lineHeight: scale(20),
  },
  detailBodyText: {
    fontSize: moderateScale(13),
    lineHeight: scale(20),
  },
  detailGridRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(10),
  },
  detailGridCard: {
    flex: 1,
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(12),
  },
  detailMetricValue: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  detailRecipientText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginTop: scale(2),
  },
  detailDeepLinkText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  metaInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(3),
  },
  metaInfoKey: {
    fontSize: moderateScale(11),
  },
  metaInfoVal: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  modalActionsRow: {
    flexDirection: "row",
    padding: scale(16),
    gap: scale(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalReuseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(6),
  },
  modalReuseBtnText: {
    color: "#10B981",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  modalCloseActionBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseActionText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
