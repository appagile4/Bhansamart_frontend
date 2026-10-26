import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { fetchStaffNotificationsAdminApi } from "@/store/services/adminService";
import socketService from "@/store/services/socketService";

interface StaffAdminHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onRefresh?: () => void;
  rightElement?: React.ReactNode;
}

export default function StaffAdminHeader({
  title = "Staff Console",
  subtitle,
  showBack = false,
  onRefresh,
  rightElement,
}: StaffAdminHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const user = useAppSelector((state) => state.auth.user);

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
        // Silent catch
      }
    };
    loadUnread();

    const unsubscribe = socketService.onStaffNotification(() => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const headerBg = isDark ? "#0A0F12" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const assignedCount = user?.assignedVendors?.length || 0;

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: headerBg }]}>
      <View style={[styles.headerContainer, { borderBottomColor: border }]}>
        {/* Left: Back / Staff Identity */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.actionBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={scale(18)} color={textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPill}>
              <View style={styles.avatarIconBox}>
                <MaterialCommunityIcons name="account-tie" size={scale(18)} color="#0284C7" />
              </View>
            </View>
          )}

          <View style={{ gap: moderateScale(1) }}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, { color: textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Staff Admin</Text>
              </View>
            </View>
            <Text style={[styles.subtitleText, { color: textSecondary }]} numberOfLines={1}>
              {subtitle || `${assignedCount} Assigned ${assignedCount === 1 ? "Store" : "Stores"}`}
            </Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightSection}>
          {rightElement}

          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              style={[styles.actionBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={scale(16)} color={textSecondary} />
            </TouchableOpacity>
          )}

          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => router.push("/Screens/staffadminScreens/NotificationsScreen" as any)}
            style={[styles.actionBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={scale(17)} color={textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badgeIndicator}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  headerContainer: {
    height: moderateScale(54),
    paddingHorizontal: scale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  avatarPill: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  titleText: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  roleBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(1.5),
    borderRadius: scale(6),
  },
  roleBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#0369A1",
  },
  subtitleText: {
    fontSize: moderateScale(11.5),
    fontWeight: "500",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  actionBtn: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeIndicator: {
    position: "absolute",
    top: -scale(3),
    right: -scale(3),
    backgroundColor: "#EF4444",
    borderRadius: scale(8),
    minWidth: scale(16),
    height: scale(16),
    paddingHorizontal: scale(3),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(8.5),
    fontWeight: "800",
  },
});
