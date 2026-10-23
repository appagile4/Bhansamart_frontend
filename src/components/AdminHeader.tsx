import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/store/hooks";
import AdminSideMenu from "./AdminSideMenu";
import { moderateScale, scale, useTheme } from "@/theme";
import { fetchStaffNotificationsAdminApi } from "@/store/services/adminService";
import socketService from "@/store/services/socketService";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function AdminHeader({
  title = "BhansaMart Console",
  subtitle,
  showBack = false,
}: AdminHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = user?.role === "superadmin";

  const [menuVisible, setMenuVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const res = await fetchStaffNotificationsAdminApi({ unreadOnly: true, limit: 1 });
        if (isMounted && res?.pagination?.total !== undefined) {
          setUnreadCount(res.pagination.total);
        }
      } catch (err) {
        // Silent catch for background unread fetch
      }
    };
    loadUnread();

    // Listen for live staff notifications
    const unsubscribe = socketService.onStaffNotification(() => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const bg = isDark ? "#121A20" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <>
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: bg }]}>
        <View style={[styles.headerContainer, { borderBottomColor: border }]}>
          {/* Left Button (Menu or Back) */}
          <View style={styles.leftRow}>
            {showBack ? (
              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: border }]}
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={scale(18)} color={textPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: border }]}
                onPress={() => setMenuVisible(true)}
              >
                <Feather name="menu" size={scale(18)} color={textPrimary} />
              </TouchableOpacity>
            )}

            <View style={{ marginLeft: scale(10), flex: 1 }}>
              <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.headerSubtitle, { color: textSecondary }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : (
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: isSuperadmin
                        ? (isDark ? "rgba(168, 85, 247, 0.15)" : "#F3E8FF")
                        : (isDark ? "rgba(2, 132, 199, 0.15)" : "#E0F2FE"),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: isSuperadmin ? (isDark ? "#C084FC" : "#7E22CE") : (isDark ? "#38BDF8" : "#0284C7") },
                    ]}
                  >
                    {isSuperadmin ? "★ SUPERADMIN" : "OPERATIONS ADMIN"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Action Buttons */}
          <View style={styles.rightActionsRow}>
            {/* Notification Bell with Badge */}
            <TouchableOpacity
              style={[styles.bellBtn, { borderColor: border }]}
              onPress={() => router.navigate("/Screens/adminScreens/notifications" as any)}
            >
              <Feather name="bell" size={scale(17)} color={textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              style={[
                styles.profileBtn,
                {
                  backgroundColor: isSuperadmin
                    ? (isDark ? "rgba(168, 85, 247, 0.2)" : "#F3E8FF")
                    : (isDark ? "rgba(2, 132, 199, 0.2)" : "#E0F2FE"),
                  borderColor: border,
                },
              ]}
              onPress={() => router.navigate("/AdminMain/profile" as any)}
            >
              <MaterialCommunityIcons
                name={isSuperadmin ? "shield-crown-outline" : "shield-account-outline"}
                size={scale(18)}
                color={isSuperadmin ? "#A855F7" : "#0284C7"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Side Menu Drawer */}
      <AdminSideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: scale(10),
  },
  rightActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  iconBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -scale(3),
    right: -scale(3),
    backgroundColor: "#EF4444",
    borderRadius: scale(9),
    minWidth: scale(18),
    height: scale(18),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(3),
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontWeight: "900",
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "900",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(1),
  },
  roleBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(1),
    borderRadius: scale(4),
    alignSelf: "flex-start",
    marginTop: scale(2),
  },
  roleBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  profileBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

