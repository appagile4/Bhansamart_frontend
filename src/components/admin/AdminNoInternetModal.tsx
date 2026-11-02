import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAdminNetworkError } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { usePathname, useSegments } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminNoInternetModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const segments = useSegments();
  const pathname = usePathname();

  const { user } = useAppSelector((state) => state.auth);
  const { isNetworkError } = useAppSelector((state) => state.admin);

  const [isRetrying, setIsRetrying] = useState(false);

  const netInfo = useNetInfo();

  // Check if current active route belongs to the Superadmin / Admin panel
  const isAdminRoute = useMemo(() => {
    const seg0 = segments[0] as string | undefined;
    const seg1 = segments[1] as string | undefined;

    if (seg0 === "AdminMain" || seg0 === "StaffAdminMain") return true;
    if (
      seg0 === "Screens" &&
      (seg1 === "adminScreens" || seg1 === "staffadminScreens")
    ) {
      return true;
    }
    if (
      pathname &&
      (pathname.includes("/AdminMain") ||
        pathname.includes("/adminScreens") ||
        pathname.includes("/StaffAdminMain") ||
        pathname.includes("/staffadminScreens"))
    ) {
      return true;
    }

    // Fallback: If user is logged in as superadmin or admin, protect their session
    if (user?.role === "superadmin" || user?.role === "admin") {
      // Do not block auth login routes
      if (seg0 === "(auth)") return false;
      return true;
    }

    return false;
  }, [segments, pathname, user]);

  const isOffline =
    netInfo.isConnected === false ||
    (netInfo.isConnected === true && netInfo.isInternetReachable === false) ||
    isNetworkError === true;

  // Auto-clear network error when connection is restored
  useEffect(() => {
    if (
      netInfo.isConnected &&
      netInfo.isInternetReachable !== false &&
      isNetworkError
    ) {
      dispatch(setAdminNetworkError(false));
    }
  }, [netInfo.isConnected, netInfo.isInternetReachable, isNetworkError, dispatch]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const state = await NetInfo.fetch();
      const connected =
        state.isConnected !== false && state.isInternetReachable !== false;
      if (connected) {
        dispatch(setAdminNetworkError(false));
      }
    } catch {
      // keep offline state
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isAdminRoute || !isOffline) {
    return null;
  }

  const bg = isDark ? "#0A0F14" : "#F8FAFC";
  const cardBg = isDark ? "#121922" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={[styles.container, { backgroundColor: bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        {/* Minimal Admin Offline Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, scale(14)) + scale(6),
              backgroundColor: cardBg,
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.15)"
                    : "#FEE2E2",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="wifi-off"
                size={scale(16)}
                color="#EF4444"
              />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>
                BhansaMart Console
              </Text>
              <Text style={[styles.headerSub, { color: textSecondary }]}>
                Offline Mode
              </Text>
            </View>
          </View>
        </View>

        {/* Center Content */}
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + scale(40) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lottieContainer}>
            <LottieView
              source={require("@/assets/images/no_Internet.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={[styles.title, { color: textPrimary }]}>
            No Internet Connection
          </Text>

          <Text style={[styles.description, { color: textSecondary }]}>
            Your device is not connected to the internet. Please check your Wi-Fi
            or mobile data settings to manage stores, orders, and real-time
            operations.
          </Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="refresh-cw" size={scale(17)} color="#FFFFFF" />
            )}
            <Text style={styles.retryBtnText}>
              {isRetrying ? "Checking connection..." : "Try Again"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  badge: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(28),
  },
  lottieContainer: {
    width: scale(270),
    height: scale(270),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(8),
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: scale(8),
    letterSpacing: -0.3,
  },
  description: {
    fontSize: moderateScale(13),
    textAlign: "center",
    lineHeight: scale(19),
    marginBottom: scale(26),
    maxWidth: scale(320),
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284C7",
    paddingHorizontal: scale(26),
    paddingVertical: scale(13),
    borderRadius: scale(14),
    gap: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: "#0284C7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
