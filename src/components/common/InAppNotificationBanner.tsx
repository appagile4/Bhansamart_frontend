import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";
import { navigateFromNotificationData, NotificationPayloadData } from "@/utils/notificationRouter";

export interface InAppBannerMessage {
  id?: string;
  title: string;
  body: string;
  data?: NotificationPayloadData;
}

interface InAppNotificationBannerProps {
  message: InAppBannerMessage | null;
  onDismiss: () => void;
  durationMs?: number; // Default 3000ms (3 seconds)
}

export default function InAppNotificationBanner({
  message,
  onDismiss,
  durationMs = 3000,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const translateY = useRef(new Animated.Value(-160)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentNotif, setCurrentNotif] = useState<InAppBannerMessage | null>(null);

  // Pan Responder for swipe-up dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20) {
          dismissBanner();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const dismissBanner = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    Animated.timing(translateY, {
      toValue: -160,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotif(null);
      onDismiss();
    });
  };

  useEffect(() => {
    if (message) {
      setCurrentNotif(message);

      // Slide down
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Clear any previous timer
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Stay for 3 seconds, then slide up
      hideTimerRef.current = setTimeout(() => {
        dismissBanner();
      }, durationMs);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [message]);

  if (!currentNotif) return null;

  const getIcon = () => {
    const type = String(currentNotif.data?.type || "").toUpperCase();
    if (type.includes("ORDER")) {
      return { lib: Feather, name: "shopping-bag", color: "#0284C7", bg: "rgba(2, 132, 199, 0.15)" };
    }
    if (type.includes("DELIVERY")) {
      return { lib: MaterialCommunityIcons, name: "moped", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" };
    }
    if (type.includes("BROADCAST") || type.includes("ANNOUNCEMENT")) {
      return { lib: MaterialCommunityIcons, name: "bullhorn", color: "#EC4899", bg: "rgba(236, 72, 153, 0.15)" };
    }
    return { lib: Feather, name: "bell", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
  };

  const iconInfo = getIcon();
  const IconComponent: any = iconInfo.lib;

  const handleBannerPress = () => {
    dismissBanner();
    navigateFromNotificationData(currentNotif.data);
  };

  const topOffset = Platform.OS === "android" ? Math.max(insets.top, 12) : insets.top;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleBannerPress}
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? "#1A2228" : "#FFFFFF",
            borderColor: isDark ? "#2C3943" : "#E2E8F0",
            shadowColor: isDark ? "#000000" : "#64748B",
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconInfo.bg }]}>
          <IconComponent name={iconInfo.name} size={scale(20)} color={iconInfo.color} />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
              {currentNotif.title}
            </Text>
            <Text style={[styles.timeAgo, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              now
            </Text>
          </View>
          <Text numberOfLines={2} style={[styles.body, { color: isDark ? "#94A3B8" : "#475569" }]}>
            {currentNotif.body}
          </Text>
        </View>

        <TouchableOpacity onPress={dismissBanner} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={scale(16)} color={isDark ? "#94A3B8" : "#64748B"} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: scale(14),
    right: scale(14),
    zIndex: 99999,
    elevation: 99999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(14),
    borderWidth: 1,
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
  },
  textWrap: {
    flex: 1,
    marginRight: scale(8),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(2),
  },
  title: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    flex: 1,
    marginRight: scale(6),
  },
  timeAgo: {
    fontSize: moderateScale(10),
    fontWeight: "500",
  },
  body: {
    fontSize: moderateScale(11),
    lineHeight: scale(16),
  },
  closeBtn: {
    padding: scale(4),
  },
});
