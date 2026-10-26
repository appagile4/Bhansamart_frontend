import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useTheme } from "@/theme";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useAppSelector } from "@/store/hooks";

interface ModernAndroidTabBarProps extends BottomTabBarProps {
  tintColor?: string;
  role?: "admin" | "staff" | "customer" | "delivery" | "vendor";
}

export default function ModernAndroidTabBar(props: ModernAndroidTabBarProps) {
  const { state, descriptors, tintColor, role } = props;
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  // Cart count for customer badge
  const cartItems = useAppSelector((s) => s.cart?.items || []);
  const cartCount = cartItems.reduce(
    (sum: number, item: any) => sum + (item.quantity || 1),
    0
  );

  const primaryColor =
    tintColor || theme.colors.primary || "#0284C7";
  const inactiveColor = isDark ? "#64748B" : "#94A3B8";
  const barBg = isDark ? "#121920" : "#FFFFFF";
  const borderColor = isDark ? "#1E293B" : "#F1F5F9";

  const renderTabIcon = (
    routeName: string,
    isFocused: boolean,
    color: string
  ) => {
    switch (routeName) {
      // ── Customer Main Routes ──
      case "category":
        return (
          <Ionicons
            name={isFocused ? "grid" : "grid-outline"}
            size={24}
            color={color}
          />
        );
      case "order-again":
        return (
          <Ionicons
            name={isFocused ? "repeat" : "repeat-outline"}
            size={24}
            color={color}
          />
        );
      case "cart":
        return (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={isFocused ? "cart" : "cart-outline"}
              size={24}
              color={color}
            />
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: primaryColor }]}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </View>
        );

      // ── Vendor Main Routes ──
      case "dashboard":
        return (
          <Ionicons
            name={isFocused ? "stats-chart" : "stats-chart-outline"}
            size={24}
            color={color}
          />
        );
      case "order":
        return (
          <Ionicons
            name={isFocused ? "bag-handle" : "bag-handle-outline"}
            size={24}
            color={color}
          />
        );
      case "product":
        return (
          <Ionicons
            name={isFocused ? "cube" : "cube-outline"}
            size={24}
            color={color}
          />
        );
      case "delivery":
        return (
          <Ionicons
            name={isFocused ? "bicycle" : "bicycle-outline"}
            size={24}
            color={color}
          />
        );
      case "transaction":
        return (
          <Ionicons
            name={isFocused ? "card" : "card-outline"}
            size={24}
            color={color}
          />
        );

      // ── Delivery Boy Routes ──
      case "wallet":
        return (
          <Ionicons
            name={isFocused ? "wallet" : "wallet-outline"}
            size={24}
            color={color}
          />
        );

      // ── StaffAdmin Specific Routes ──
      case "operations":
        return (
          <MaterialIcons
            name="assignment"
            size={24}
            color={color}
          />
        );
      case "deliveries":
        return (
          <MaterialIcons
            name="local-shipping"
            size={24}
            color={color}
          />
        );

      // ── Admin & StaffAdmin Routes ──
      case "vendors":
        if (role === "staff") {
          return (
            <MaterialCommunityIcons
              name={isFocused ? "storefront" : "storefront-outline"}
              size={24}
              color={color}
            />
          );
        }
        return (
          <Ionicons
            name={isFocused ? "search" : "search-outline"}
            size={24}
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
              size={16}
              color={isFocused ? "#FFFFFF" : color}
            />
          </View>
        );
      case "finance":
        return (
          <Ionicons
            name={isFocused ? "notifications" : "notifications-outline"}
            size={24}
            color={color}
          />
        );
      case "profile":
        if (role === "staff") {
          return (
            <Ionicons
              name={isFocused ? "person-circle" : "person-circle-outline"}
              size={25}
              color={color}
            />
          );
        }
        return (
          <Ionicons
            name={isFocused ? "person" : "person-outline"}
            size={24}
            color={color}
          />
        );

      // ── Default / Home Index ──
      case "index":
      default:
        if (role === "delivery") {
          return (
            <Ionicons
              name={isFocused ? "bicycle" : "bicycle-outline"}
              size={24}
              color={color}
            />
          );
        }
        if (role === "staff") {
          return (
            <MaterialCommunityIcons
              name={isFocused ? "view-dashboard" : "view-dashboard-outline"}
              size={24}
              color={color}
            />
          );
        }
        return (
          <Ionicons
            name={isFocused ? "home" : "home-outline"}
            size={24}
            color={color}
          />
        );
    }
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: barBg,
          borderTopColor: borderColor,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const descriptor = descriptors[route.key];
        const options = descriptor?.options || {};
        const isFocused = state.index === index;
        const color = isFocused ? primaryColor : inactiveColor;

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
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            {renderTabIcon(route.name, isFocused, color)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth || 1,
    paddingTop: 8,
    minHeight: 56,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  plusSquareIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
  },
});
