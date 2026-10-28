import AdminHeader from "@/components/AdminHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import storage from "@/utils/storage";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Appearance,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

type ThemeMode = "system" | "dark" | "light";

interface NotificationSettings {
  master: boolean;
  orders: boolean;
  vendors: boolean;
  payments: boolean;
  refunds: boolean;
  delivery: boolean;
  sound: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  master: true,
  orders: true,
  vendors: true,
  payments: true,
  refunds: true,
  delivery: true,
  sound: true,
};

export default function AdminProfileScreen() {
  const theme = useTheme();
  const systemScheme = useColorScheme();
  const isDark = theme.mode === "dark";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = user?.role === "superadmin";

  // Appearance / Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATIONS,
  );

  // Load persisted theme and notification preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = await storage.getItem("bhansa_admin_theme_mode");
        if (
          savedTheme === "system" ||
          savedTheme === "dark" ||
          savedTheme === "light"
        ) {
          setThemeMode(savedTheme);
          if (savedTheme === "system") {
            Appearance.setColorScheme("auto");
          } else {
            Appearance.setColorScheme(savedTheme);
          }
        }

        const savedNotifs = await storage.getItem("bhansa_admin_notifications");
        if (savedNotifs) {
          try {
            const parsed = JSON.parse(savedNotifs);
            setNotifications((prev) => ({ ...prev, ...parsed }));
          } catch {
            // fallback
          }
        }
      } catch (err) {
        console.error("Failed to load admin profile preferences", err);
      }
    };

    loadPreferences();
  }, []);

  // Theme change handler
  const handleSelectTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await storage.setItem("bhansa_admin_theme_mode", mode);
      if (mode === "system") {
        Appearance.setColorScheme("auto");
      } else {
        Appearance.setColorScheme(mode);
      }
    } catch (err) {
      console.error("Failed to persist theme mode", err);
    }
  };

  // Toggle Dark Mode directly
  const handleToggleDarkMode = async (enableDark: boolean) => {
    const newMode: ThemeMode = enableDark ? "dark" : "light";
    await handleSelectTheme(newMode);
  };

  // Notification toggle handlers
  const handleToggleNotification = async (key: keyof NotificationSettings) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key],
    };

    // If master is turned off, sub-items can still be toggled, but if sub-item is toggled on, ensure master is on
    if (key !== "master" && !notifications[key] && !notifications.master) {
      updated.master = true;
    }

    setNotifications(updated);
    try {
      await storage.setItem(
        "bhansa_admin_notifications",
        JSON.stringify(updated),
      );
    } catch (err) {
      console.error("Failed to persist notification settings", err);
    }
  };

  const handleToggleMasterNotifications = async (val: boolean) => {
    const updated: NotificationSettings = {
      master: val,
      orders: val,
      vendors: val,
      payments: val,
      refunds: val,
      delivery: val,
      sound: val ? notifications.sound : false,
    };
    setNotifications(updated);
    try {
      await storage.setItem(
        "bhansa_admin_notifications",
        JSON.stringify(updated),
      );
    } catch (err) {
      console.error("Failed to persist master notification setting", err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to exit the BhansaMart Administrative Console?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.removeItem("bhansa_admin_token");
              await storage.removeItem("bhansa_token");
              dispatch(logoutUser());
              router.replace("/(auth)/admin-login" as any);
            } catch {
              router.replace("/(auth)/admin-login" as any);
            }
          },
        },
      ],
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const userInitials = (user?.name || "Admin")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Admin Profile"
        subtitle="Account, Notifications & Appearance"
      />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. HEADER PROFILE IDENTITY CARD ─── */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isSuperadmin
                    ? isDark
                      ? "rgba(168, 85, 247, 0.2)"
                      : "#F3E8FF"
                    : isDark
                      ? "rgba(2, 132, 199, 0.2)"
                      : "#E0F2FE",
                  borderColor: isSuperadmin ? "#C084FC" : "#38BDF8",
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: isSuperadmin
                      ? isDark
                        ? "#C084FC"
                        : "#7E22CE"
                      : isDark
                        ? "#38BDF8"
                        : "#0284C7",
                  },
                ]}
              >
                {userInitials}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: scale(14) }}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: textPrimary }]}>
                  {user?.name || "BhansaMart Administrator"}
                </Text>
              </View>

              {/* Role Badge */}
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: isSuperadmin
                      ? isDark
                        ? "rgba(168, 85, 247, 0.15)"
                        : "#F3E8FF"
                      : isDark
                        ? "rgba(2, 132, 199, 0.15)"
                        : "#E0F2FE",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isSuperadmin ? "shield-crown" : "shield-account"}
                  size={scale(13)}
                  color={
                    isSuperadmin
                      ? isDark
                        ? "#C084FC"
                        : "#7E22CE"
                      : isDark
                        ? "#38BDF8"
                        : "#0284C7"
                  }
                />
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color: isSuperadmin
                        ? isDark
                          ? "#C084FC"
                          : "#7E22CE"
                        : isDark
                          ? "#38BDF8"
                          : "#0284C7",
                    },
                  ]}
                >
                  {isSuperadmin
                    ? "SUPERADMIN • PLATFORM OWNER"
                    : "STAFF ADMIN • SCOPED"}
                </Text>
              </View>

              <Text style={[styles.emailText, { color: textSecondary }]}>
                {user?.email || "admin@bhansamart.com"}
              </Text>
              {user?.phone ? (
                <Text style={[styles.phoneText, { color: textSecondary }]}>
                  Phone: {user.phone}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Identity Details */}
          <View style={[styles.metaStrip, { borderTopColor: border }]}>
            <View style={styles.metaCol}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>
                Account ID
              </Text>
              <Text style={[styles.metaVal, { color: textPrimary }]}>
                #{user?._id ? user._id.slice(-8).toUpperCase() : "ROOT-001"}
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>
                Status
              </Text>
              <Text style={[styles.metaVal, { color: "#10B981" }]}>
                Active Session
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={[styles.metaKey, { color: textSecondary }]}>
                Security
              </Text>
              <Text style={[styles.metaVal, { color: textPrimary }]}>
                JWT Verified
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 2. APPEARANCE & THEME SETTINGS ─── */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Feather
              name={isDark ? "moon" : "sun"}
              size={scale(18)}
              color="#10B981"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Appearance & Theme
              </Text>
              <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
                Choose your preferred display mode or use system default
              </Text>
            </View>
          </View>

          {/* Three Option Segmented Mode Cards */}
          <View style={styles.themeOptionsGrid}>
            {[
              {
                id: "system",
                title: "System Default",
                desc: `Auto (${systemScheme === "dark" ? "Dark" : "Light"})`,
                icon: "smartphone",
                isDefault: true,
              },
              {
                id: "light",
                title: "Light Mode",
                desc: "Bright & Clean",
                icon: "sun",
              },
              {
                id: "dark",
                title: "Dark Mode",
                desc: "High Contrast",
                icon: "moon",
              },
            ].map((opt) => {
              const isSelected = themeMode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.themeOptionCard,
                    {
                      borderColor: isSelected ? "#10B981" : border,
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(16, 185, 129, 0.15)"
                          : "#ECFDF5"
                        : bg,
                    },
                  ]}
                  onPress={() => handleSelectTheme(opt.id as ThemeMode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeOptionTop}>
                    <Feather
                      name={opt.icon as any}
                      size={scale(16)}
                      color={isSelected ? "#10B981" : textSecondary}
                    />
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={scale(16)}
                      color={isSelected ? "#10B981" : textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.themeOptionTitle,
                      {
                        color: isSelected ? "#10B981" : textPrimary,
                        fontWeight: isSelected ? "800" : "600",
                      },
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={[styles.themeOptionDesc, { color: textSecondary }]}
                  >
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Direct Dark Mode Quick Switch */}
          <View style={[styles.switchRow, { borderTopColor: border }]}>
            <View style={styles.switchLabelWrap}>
              <View style={styles.switchIconTitleRow}>
                <Ionicons
                  name={isDark ? "moon-outline" : "sunny-outline"}
                  size={scale(16)}
                  color={isDark ? "#A855F7" : "#F59E0B"}
                />
                <Text style={[styles.switchTitle, { color: textPrimary }]}>
                  Dark Mode
                </Text>
              </View>
              <Text style={[styles.switchSubtitle, { color: textSecondary }]}>
                {themeMode === "system"
                  ? "Currently following device settings (Default Mode ON)"
                  : isDark
                    ? "Dark mode active"
                    : "Light mode active"}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={handleToggleDarkMode}
              trackColor={{
                false: isDark ? "#334155" : "#E2E8F0",
                true: "#10B981",
              }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            />
          </View>
        </View>

        {/* ─── 3. NOTIFICATION CONTROLS ─── */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Feather name="bell" size={scale(18)} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Notification Controls
              </Text>
              <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
                Turn on or off live push & in-app alerts by category
              </Text>
            </View>
          </View>

          {/* Master Notification Switch */}
          <View
            style={[
              styles.masterNotifBox,
              {
                backgroundColor: notifications.master
                  ? isDark
                    ? "rgba(16, 185, 129, 0.12)"
                    : "#ECFDF5"
                  : bg,
                borderColor: notifications.master ? "#10B981" : border,
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: scale(10) }}>
              <View style={styles.masterTitleRow}>
                <Ionicons
                  name={
                    notifications.master ? "notifications" : "notifications-off"
                  }
                  size={scale(18)}
                  color={notifications.master ? "#10B981" : textSecondary}
                />
                <Text style={[styles.masterTitle, { color: textPrimary }]}>
                  All Notifications
                </Text>
              </View>
              <Text style={[styles.masterSubtitle, { color: textSecondary }]}>
                {notifications.master
                  ? "Receiving real-time alerts across all administrative operations"
                  : "All alerts paused. Toggle on to resume operational notifications"}
              </Text>
            </View>

            <Switch
              value={notifications.master}
              onValueChange={handleToggleMasterNotifications}
              trackColor={{
                false: isDark ? "#334155" : "#E2E8F0",
                true: "#10B981",
              }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            />
          </View>

          {/* Individual Category Switches */}
          <View style={styles.notifList}>
            {[
              {
                key: "orders",
                title: "Order Notifications",
                desc: "New order placed, delivery dispatch, and cancellation alerts",
                icon: "shopping-bag",
                color: "#10B981",
              },
              {
                key: "vendors",
                title: "Vendor & Store Alerts",
                desc: "Store onboarding, document verification, and catalog updates",
                icon: "storefront-outline",
                color: "#0EA5E9",
                isIonicons: true,
              },
              {
                key: "payments",
                title: "Payment & Payout Alerts",
                desc: "Vendor withdrawal requests, gateway settlements, and COD payouts",
                icon: "cash-outline",
                color: "#A855F7",
                isIonicons: true,
              },
              {
                key: "refunds",
                title: "Return & Refund Alerts",
                desc: "Customer return claims, warehouse inspections, and refund approvals",
                icon: "repeat",
                color: "#F59E0B",
              },
              {
                key: "delivery",
                title: "Delivery & COD Cash Alerts",
                desc: "Rider cash custody, delivery boy online status, and cash mismatch disputes",
                icon: "moped",
                color: "#6366F1",
                isMaterial: true,
              },
              {
                key: "sound",
                title: "Alert Sound & Vibration",
                desc: "Play sound chime and haptic feedback on urgent events",
                icon: "volume-2",
                color: "#10B981",
              },
            ].map((item, idx) => {
              const isEnabled = Boolean(
                notifications[item.key as keyof NotificationSettings],
              );
              return (
                <View
                  key={item.key}
                  style={[
                    styles.notifItemRow,
                    idx < 5 && {
                      borderBottomColor: border,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.notifIconWrap,
                      {
                        backgroundColor: isEnabled
                          ? `${item.color}18`
                          : isDark
                            ? "#1E293B"
                            : "#F1F5F9",
                      },
                    ]}
                  >
                    {item.isMaterial ? (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={scale(16)}
                        color={isEnabled ? item.color : textSecondary}
                      />
                    ) : item.isIonicons ? (
                      <Ionicons
                        name={item.icon as any}
                        size={scale(16)}
                        color={isEnabled ? item.color : textSecondary}
                      />
                    ) : (
                      <Feather
                        name={item.icon as any}
                        size={scale(16)}
                        color={isEnabled ? item.color : textSecondary}
                      />
                    )}
                  </View>

                  <View style={styles.notifTextWrap}>
                    <Text
                      style={[styles.notifItemTitle, { color: textPrimary }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.notifItemDesc, { color: textSecondary }]}
                    >
                      {item.desc}
                    </Text>
                  </View>

                  <Switch
                    value={isEnabled}
                    onValueChange={() =>
                      handleToggleNotification(
                        item.key as keyof NotificationSettings,
                      )
                    }
                    trackColor={{
                      false: isDark ? "#334155" : "#E2E8F0",
                      true: item.color,
                    }}
                    thumbColor={
                      Platform.OS === "android" ? "#FFFFFF" : undefined
                    }
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── 4. PERMISSIONS / SCOPE CARD ─── */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Feather name="shield" size={scale(18)} color="#10B981" />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Administrative Authorization
            </Text>
          </View>

          {isSuperadmin ? (
            <View
              style={[
                styles.scopeBanner,
                { backgroundColor: "rgba(16, 185, 129, 0.1)" },
              ]}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={scale(20)}
                color="#10B981"
              />
              <View style={{ flex: 1, marginLeft: scale(8) }}>
                <Text style={styles.scopeBannerTitle}>
                  Unrestricted Global Access
                </Text>
                <Text style={styles.scopeBannerDesc}>
                  Full platform control over all vendor stores, customers,
                  delivery riders, central treasury bank details, and the fixed
                  1.5% commission engine.
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View
                style={[
                  styles.scopeBanner,
                  { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={scale(20)}
                  color="#3B82F6"
                />
                <View style={{ flex: 1, marginLeft: scale(8) }}>
                  <Text style={[styles.scopeBannerTitle, { color: "#3B82F6" }]}>
                    Scoped Vendor Management
                  </Text>
                  <Text style={styles.scopeBannerDesc}>
                    Assigned to {user?.assignedVendors?.length || 0} designated
                    vendor stores. Financial withdrawals and treasury accounts
                    are restricted.
                  </Text>
                </View>
              </View>

              <View style={styles.permList}>
                {[
                  {
                    name: "Manage Assigned Vendors",
                    granted: user?.adminPermissions?.canManageVendors !== false,
                  },
                  {
                    name: "Edit Product Listings",
                    granted: user?.adminPermissions?.canEditProducts !== false,
                  },
                  {
                    name: "Support Ticket Resolution",
                    granted: user?.adminPermissions?.canManageTickets !== false,
                  },
                  {
                    name: "View Orders & Analytics",
                    granted: user?.adminPermissions?.canViewOrders !== false,
                  },
                  { name: "Financial Treasury & Payouts", granted: false },
                ].map((p, idx) => (
                  <View
                    key={idx}
                    style={[styles.permRow, { borderBottomColor: border }]}
                  >
                    <Text style={[styles.permName, { color: textPrimary }]}>
                      {p.name}
                    </Text>
                    <View
                      style={[
                        styles.permBadge,
                        {
                          backgroundColor: p.granted
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.permBadgeText,
                          { color: p.granted ? "#10B981" : "#EF4444" },
                        ]}
                      >
                        {p.granted ? "Granted" : "Restricted"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ─── 5. SYSTEM STATUS CARD ─── */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Feather name="server" size={scale(18)} color="#10B981" />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              System & Platform Status
            </Text>
          </View>

          <View style={[styles.statusItemRow, { borderBottomColor: border }]}>
            <Text style={[styles.statusLabel, { color: textSecondary }]}>
              Online Payment Platform Fee
            </Text>
            <Text style={[styles.statusValue, { color: "#10B981" }]}>
              1.5% (COD is 0%)
            </Text>
          </View>

          <View style={[styles.statusItemRow, { borderBottomColor: border }]}>
            <Text style={[styles.statusLabel, { color: textSecondary }]}>
              Real-time Socket.IO
            </Text>
            <View style={styles.liveIndicator}>
              <View style={styles.pulseDot} />
              <Text style={[styles.statusValue, { color: "#10B981" }]}>
                Connected
              </Text>
            </View>
          </View>

          <View style={[styles.statusItemRow, { borderBottomColor: border }]}>
            <Text style={[styles.statusLabel, { color: textSecondary }]}>
              App Version
            </Text>
            <Text style={[styles.statusValue, { color: textPrimary }]}>
              v1.0.0 (Production)
            </Text>
          </View>

          <View style={styles.statusItemRow}>
            <Text style={[styles.statusLabel, { color: textSecondary }]}>
              Console Interface
            </Text>
            <Text style={[styles.statusValue, { color: textPrimary }]}>
              Responsive NativeTabs
            </Text>
          </View>
        </View>

        {/* ─── 6. LOGOUT ACTION BUTTON ─── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={scale(18)} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Log Out from Console</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: scale(16),
    gap: scale(14),
    paddingBottom: scale(100),
  },

  // Profile Card
  profileCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(16),
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: moderateScale(22),
    fontWeight: "900",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    marginTop: scale(4),
  },
  roleBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emailText: {
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },
  phoneText: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  metaStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  metaCol: {
    alignItems: "flex-start",
  },
  metaKey: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaVal: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(2),
  },

  // Base Card
  card: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(16),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(10),
    marginBottom: scale(12),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },

  // Appearance Theme Grid
  themeOptionsGrid: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(12),
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(10),
    justifyContent: "space-between",
    minHeight: scale(72),
  },
  themeOptionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(6),
  },
  themeOptionTitle: {
    fontSize: moderateScale(11),
    marginBottom: scale(1),
  },
  themeOptionDesc: {
    fontSize: moderateScale(9.5),
  },

  // Direct Switch Row
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  switchLabelWrap: {
    flex: 1,
    marginRight: scale(10),
  },
  switchIconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  switchTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  switchSubtitle: {
    fontSize: moderateScale(10.5),
    marginTop: scale(2),
  },

  // Master Notification Box
  masterNotifBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(12),
  },
  masterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  masterTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  masterSubtitle: {
    fontSize: moderateScale(10.5),
    marginTop: scale(3),
    lineHeight: scale(15),
  },

  // Notification List
  notifList: {
    gap: scale(2),
  },
  notifItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(10),
    gap: scale(10),
  },
  notifIconWrap: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  notifTextWrap: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  notifItemDesc: {
    fontSize: moderateScale(10.5),
    marginTop: scale(2),
    lineHeight: scale(14),
  },

  // Scope Banner
  scopeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(12),
    borderRadius: scale(8),
  },
  scopeBannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#10B981",
  },
  scopeBannerDesc: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    marginTop: scale(2),
    lineHeight: scale(16),
  },
  permList: {
    marginTop: scale(10),
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(8),
    borderBottomWidth: 1,
  },
  permName: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  permBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  permBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },

  // Status Rows
  statusItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(10),
    borderBottomWidth: 1,
  },
  statusLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  statusValue: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  pulseDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
  },

  // Logout Button
  logoutButton: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: scale(10),
    marginTop: scale(6),
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
});
