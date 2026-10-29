import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/theme";
import { useUnreadNotifications } from "@/utils/notificationSync";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ModernAndroidTabBarProps extends BottomTabBarProps {
  tintColor?: string;
  role?: "admin" | "staff" | "customer" | "delivery" | "vendor";
}

interface TabItemProps {
  route: any;
  descriptor: any;
  isFocused: boolean;
  primaryColor: string;
  inactiveColor: string;
  isDark: boolean;
  cartCount: number;
  role?: string;
  deliveryUnreadCount?: number;
  onPress: () => void;
  onLongPress: () => void;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 180,
  mass: 0.6,
};

function TabItem({
  route,
  descriptor,
  isFocused,
  primaryColor,
  inactiveColor,
  isDark,
  cartCount,
  role,
  deliveryUnreadCount,
  onPress,
  onLongPress,
}: TabItemProps) {
  const options = descriptor?.options || {};
  const progress = useSharedValue(isFocused ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 220 });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0.8, SPRING_CONFIG) }],
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : `${primaryColor}18`,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const renderIcon = (color: string) => {
    const iconSize = 22;

    switch (route.name) {
      case "category":
        return (
          <Ionicons
            name={isFocused ? "grid" : "grid-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "order-again":
        return (
          <Ionicons
            name={isFocused ? "repeat" : "repeat-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "cart":
        return (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={isFocused ? "cart" : "cart-outline"}
              size={iconSize}
              color={color}
            />
            {cartCount > 0 && (
              <View
                style={[
                  styles.cartBadge,
                  {
                    backgroundColor: primaryColor,
                    borderColor: isDark ? "#161F28" : "#FFFFFF",
                  },
                ]}
              >
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </View>
        );
      case "dashboard":
        return (
          <Ionicons
            name={isFocused ? "stats-chart" : "stats-chart-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "order":
        return (
          <Ionicons
            name={isFocused ? "bag-handle" : "bag-handle-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "product":
        return (
          <Ionicons
            name={isFocused ? "cube" : "cube-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "delivery":
        return (
          <Ionicons
            name={isFocused ? "bicycle" : "bicycle-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "transaction":
        return (
          <Ionicons
            name={isFocused ? "card" : "card-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "wallet":
        return (
          <Ionicons
            name={isFocused ? "wallet" : "wallet-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "operations":
        return (
          <MaterialIcons name="assignment" size={iconSize} color={color} />
        );
      case "deliveries":
        return (
          <MaterialIcons name="local-shipping" size={iconSize} color={color} />
        );
      case "vendors":
        return role === "staff" ? (
          <MaterialCommunityIcons
            name={isFocused ? "storefront" : "storefront-outline"}
            size={iconSize}
            color={color}
          />
        ) : (
          <Ionicons
            name={isFocused ? "search" : "search-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "catalog":
        return (
          <View
            style={[
              styles.plusSquareIcon,
              {
                borderColor: color,
                backgroundColor: isFocused ? color : "transparent",
              },
            ]}
          >
            <Ionicons
              name="add"
              size={14}
              color={isFocused ? "#FFFFFF" : color}
            />
          </View>
        );
      case "finance":
        return (
          <Ionicons
            name={isFocused ? "card" : "card-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "notifications":
      case "alerts":
        return (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={isFocused ? "notifications" : "notifications-outline"}
              size={iconSize}
              color={color}
            />
            {role === "delivery" && !!deliveryUnreadCount && deliveryUnreadCount > 0 && (
              <View
                style={[
                  styles.cartBadge,
                  {
                    backgroundColor: "#EF4444",
                    borderColor: isDark ? "#161F28" : "#FFFFFF",
                  },
                ]}
              >
                <Text style={styles.cartBadgeText}>
                  {deliveryUnreadCount > 99 ? "99+" : deliveryUnreadCount}
                </Text>
              </View>
            )}
          </View>
        );
      case "profile":
        return role === "staff" ? (
          <Ionicons
            name={isFocused ? "person-circle" : "person-circle-outline"}
            size={iconSize + 2}
            color={color}
          />
        ) : (
          <Ionicons
            name={isFocused ? "person" : "person-outline"}
            size={iconSize}
            color={color}
          />
        );
      case "index":
      default:
        if (role === "delivery") {
          return (
            <Ionicons
              name={isFocused ? "bicycle" : "bicycle-outline"}
              size={iconSize}
              color={color}
            />
          );
        }
        if (role === "staff") {
          return (
            <MaterialCommunityIcons
              name={isFocused ? "view-dashboard" : "view-dashboard-outline"}
              size={iconSize}
              color={color}
            />
          );
        }
        return (
          <Ionicons
            name={isFocused ? "home" : "home-outline"}
            size={iconSize}
            color={color}
          />
        );
    }
  };

  const activeColor = isFocused ? primaryColor : inactiveColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabContent, animatedContainerStyle]}>
        <Animated.View
          style={[styles.activePillIndicator, animatedPillStyle]}
        />
        {renderIcon(activeColor)}
      </Animated.View>
    </Pressable>
  );
}

export default function ModernAndroidTabBar(props: ModernAndroidTabBarProps) {
  const { state, descriptors, tintColor, role } = props;
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const cartCount = useAppSelector((s) => s.cart?.totalCount || 0);
  const { unreadCount: deliveryUnreadCount } = useUnreadNotifications(
    role === "delivery" ? "delivery" : "customer"
  );

  const primaryColor = tintColor || theme.colors.primary || "#0284C7";
  const inactiveColor = isDark ? "#8E9AA8" : "#94A3B8";
  const barBg = isDark ? "#12181F" : "#FFFFFF";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 22),
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: barBg,
            borderColor,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const descriptor = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            if (props.emitter) {
              const event = props.emitter.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event?.defaultPrevented) {
                if (props.navigateToTab) {
                  props.navigateToTab(route.key);
                } else if ((descriptor as any)?.navigation) {
                  (descriptor as any).navigation.navigate(route.name);
                }
              }
            } else if (props.navigateToTab) {
              props.navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            props.emitter?.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              descriptor={descriptor}
              isFocused={isFocused}
              primaryColor={primaryColor}
              inactiveColor={inactiveColor}
              isDark={isDark}
              cartCount={cartCount}
              role={role}
              deliveryUnreadCount={deliveryUnreadCount}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "92%",
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 8,
    ...Platform.select({
      android: {
        elevation: 12,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 50,
  },
  activePillIndicator: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  plusSquareIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
  },
});
