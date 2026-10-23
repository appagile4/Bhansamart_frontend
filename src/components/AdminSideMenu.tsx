import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import storage from "@/utils/storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, scale(320));

interface AdminSideMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  superadminOnly?: boolean;
  badge?: string;
}

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/AdminMain",
  },
  {
    id: "vendors",
    label: "Vendors & KYC",
    icon: "storefront-outline",
    route: "/AdminMain/vendors",
  },
  {
    id: "admins",
    label: "Staff Admins",
    icon: "account-cog-outline",
    route: "/Screens/adminScreens/admins",
    superadminOnly: true,
  },
  {
    id: "catalog",
    label: "Catalog & Products",
    icon: "package-variant-closed",
    route: "/AdminMain/catalog",
  },
  {
    id: "vendor-analytics",
    label: "Vendor Sales Analytics",
    icon: "chart-line",
    route: "/Screens/adminScreens/vendor-analytics",
  },
  {
    id: "refunds-workflow",
    label: "Returns & Refund Claims",
    icon: "keyboard-return",
    route: "/Screens/adminScreens/refunds-workflow",
  },
  {
    id: "brands-review",
    label: "Brand Review Queue",
    icon: "certificate-outline",
    route: "/Screens/adminScreens/brands-review",
  },
  {
    id: "withdrawals",
    label: "Withdrawal Requests",
    icon: "cash-fast",
    route: "/Screens/adminScreens/withdrawals",
  },
  {
    id: "finance",
    label: "Financial Ledger (1.5%)",
    icon: "cash-register",
    route: "/AdminMain/finance",
    superadminOnly: true,
  },
  {
    id: "bank-config",
    label: "Platform Bank & Limits",
    icon: "bank-outline",
    route: "/Screens/adminScreens/bank-config",
    superadminOnly: true,
  },
  {
    id: "customers",
    label: "Customer Directory",
    icon: "account-group-outline",
    route: "/Screens/adminScreens/customers",
  },
  {
    id: "delivery",
    label: "Delivery Partners & COD",
    icon: "moped-outline",
    route: "/Screens/adminScreens/delivery",
  },
  {
    id: "tickets",
    label: "Support Tickets",
    icon: "ticket-confirmation-outline",
    route: "/Screens/adminScreens/tickets",
  },
  {
    id: "notifications",
    label: "Broadcast Notifications",
    icon: "bell-badge-outline",
    route: "/Screens/adminScreens/notifications",
  },
  {
    id: "map",
    label: "Live Fleet Radar",
    icon: "map-marker-radius-outline",
    route: "/Screens/adminScreens/map",
  },
  {
    id: "audit",
    label: "Audit Logs",
    icon: "shield-check-outline",
    route: "/Screens/adminScreens/audit-logs",
    superadminOnly: true,
  },
  {
    id: "profile",
    label: "Admin Profile & System",
    icon: "account-circle-outline",
    route: "/AdminMain/profile",
  },
];

export default function AdminSideMenu({
  visible,
  onClose,
}: AdminSideMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = user?.role === "superadmin";

  const [mounted, setMounted] = useState(visible);

  // Animated Values for smooth sliding and backdrop fading
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Watch visible prop
  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Open: Slide smoothly from Left to Right (-DRAWER_WIDTH to 0)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      // Close: Slide smoothly from Right to Left (0 to -DRAWER_WIDTH)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [visible]);

  // Smoothly close drawer and trigger action
  const handleAnimatedClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
      if (callback) {
        callback();
      }
    });
  };

  const handleNavigate = (route: string) => {
    const isCurrentPage =
      pathname === route ||
      (route === "/AdminMain" &&
        (pathname === "/AdminMain" ||
          pathname === "/AdminMain/" ||
          pathname === "/AdminMain/index"));

    if (isCurrentPage) {
      handleAnimatedClose();
      return;
    }

    handleAnimatedClose(() => {
      setTimeout(() => {
        try {
          router.navigate(route as any);
        } catch {
          router.push(route as any);
        }
      }, 50);
    });
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of the BhansaMart Management Portal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            handleAnimatedClose(async () => {
              await storage.removeItem("bhansa_admin_token");
              await storage.removeItem("bhansa_token");
              dispatch(logoutUser());
              router.replace("/(auth)/admin-login" as any);
            });
          },
        },
      ],
    );
  };

  const bg = isDark ? "#0D1318" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const userInitials = (user?.name || "Admin")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleItems = ADMIN_MENU_ITEMS.filter(
    (item) => !item.superadminOnly || isSuperadmin,
  );

  if (!mounted && !visible) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={() => handleAnimatedClose()}
    >
      <View style={styles.rootOverlay}>
        {/* Animated Fade Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={() => handleAnimatedClose()}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Animated Slide Drawer: Smooth Left to Right / Right to Left */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              backgroundColor: bg,
              width: DRAWER_WIDTH,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView edges={["top", "bottom"]} style={styles.safeContainer}>
            {/* Drawer Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: border }]}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={scale(20)}
                    color="#0284C7"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: scale(10) }}>
                  <Text style={[styles.brandName, { color: textPrimary }]}>
                    BhansaMart Console
                  </Text>
                  <Text style={[styles.brandTagline, { color: textSecondary }]}>
                    Central Control Portal
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { borderColor: border }]}
                  onPress={() => handleAnimatedClose()}
                >
                  <Feather name="x" size={scale(18)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Admin Profile Mini Card */}
              <TouchableOpacity
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: isDark ? "#151D24" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
                onPress={() => handleNavigate("/AdminMain/profile")}
              >
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
                <View style={{ flex: 1, marginLeft: scale(10) }}>
                  <Text
                    style={[styles.profileName, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {user?.name || "Administrator"}
                  </Text>
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
                      {isSuperadmin ? "★ SUPERADMIN" : "OPERATIONS ADMIN"}
                    </Text>
                  </View>
                </View>
                <Feather
                  name="chevron-right"
                  size={scale(16)}
                  color={textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Navigation Items List */}
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.sectionHeading, { color: textSecondary }]}>
                Navigation Menu
              </Text>

              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.route ||
                  (item.route === "/AdminMain" &&
                    (pathname === "/AdminMain" ||
                      pathname === "/AdminMain/index"));
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.navItem,
                      isActive && {
                        backgroundColor: isDark
                          ? "rgba(2, 132, 199, 0.15)"
                          : "#E0F2FE",
                      },
                    ]}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={scale(20)}
                      color={isActive ? "#0284C7" : textSecondary}
                    />
                    <Text
                      style={[
                        styles.navLabel,
                        { color: isActive ? "#0284C7" : textPrimary },
                        isActive && { fontWeight: "800" },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {item.superadminOnly && (
                      <View style={styles.crownPill}>
                        <MaterialCommunityIcons
                          name="crown"
                          size={scale(11)}
                          color="#A855F7"
                        />
                      </View>
                    )}

                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Drawer Footer with Logout Button */}
            <View style={[styles.drawerFooter, { borderTopColor: border }]}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Feather name="log-out" size={scale(16)} color="#FFFFFF" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rootOverlay: {
    flex: 1,
    position: "relative",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  drawerContainer: {
    height: "100%",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  safeContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: scale(16),
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(14),
  },
  logoBadge: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(8),
    backgroundColor: "rgba(2, 132, 199, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: moderateScale(15),
    fontWeight: "900",
  },
  brandTagline: {
    fontSize: moderateScale(11),
  },
  closeBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  avatarCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: moderateScale(13),
    fontWeight: "900",
  },
  profileName: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  roleBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    alignSelf: "flex-start",
    marginTop: scale(2),
  },
  roleBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    padding: scale(14),
    gap: scale(4),
  },
  sectionHeading: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: scale(8),
    paddingHorizontal: scale(8),
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(8),
    gap: scale(12),
  },
  navLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    flex: 1,
  },
  crownPill: {
    padding: scale(3),
    borderRadius: scale(4),
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
  activeIndicator: {
    width: scale(4),
    height: scale(16),
    borderRadius: scale(2),
    backgroundColor: "#0284C7",
  },
  drawerFooter: {
    padding: scale(16),
    borderTopWidth: 1,
  },
  logoutBtn: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: scale(12),
    borderRadius: scale(8),
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
});
