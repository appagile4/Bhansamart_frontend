import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutVendorAction } from "@/store/slices/vendorAuthSlice";
import { moderateScale, scale } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
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
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

export interface VendorSideMenuProps {
  visible: boolean;
  onClose: () => void;
  activeRoute?: string;
}

interface MenuItem {
  id: string;
  title: string;
  iconName: string;
  iconType: "feather" | "mci" | "ionicons" | "simple";
  route?: string;
  hasDropdown?: boolean;
  subItems?: { id: string; title: string; route?: string }[];
}

const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    iconName: "home",
    iconType: "feather",
    route: "/VendorMain/dashboard",
  },
  {
    id: "orders",
    title: "Order Management",
    iconName: "shopping-cart",
    iconType: "feather",
    route: "/VendorMain/order",
    hasDropdown: true,
    subItems: [
      { id: "all_orders", title: "All Orders", route: "/VendorMain/order" },
      { id: "pending_orders", title: "Pending Orders", route: "/VendorMain/order" },
      { id: "completed_orders", title: "Completed Orders", route: "/VendorMain/order" },
    ],
  },
  {
    id: "products",
    title: "Product Management",
    iconName: "package",
    iconType: "feather",
    route: "/VendorMain/product",
    hasDropdown: true,
    subItems: [
      { id: "product_list", title: "Product List", route: "/VendorMain/product" },
      { id: "add_product", title: "Add New Product", route: "/VendorMain/product" },
      { id: "categories", title: "Categories", route: "/VendorMain/product" },
    ],
  },
  {
    id: "transactions",
    title: "Transaction",
    iconName: "dollar-sign",
    iconType: "feather",
    route: "/VendorMain/transaction",
  },
  {
    id: "delivery",
    title: "Delivery Management",
    iconName: "truck",
    iconType: "feather",
    route: "/VendorMain/delivery",
    hasDropdown: true,
    subItems: [
      { id: "active_riders", title: "Active Dispatches", route: "/VendorMain/delivery" },
      { id: "delivery_history", title: "Delivery History", route: "/VendorMain/delivery" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Management",
    iconName: "bottle-tonic-outline",
    iconType: "mci",
    hasDropdown: true,
    subItems: [
      { id: "stock_alert", title: "Low Stock Alerts", route: "/VendorMain/product" },
      { id: "bulk_update", title: "Stock Overview", route: "/VendorMain/product" },
    ],
  },
  {
    id: "attribute",
    title: "Attribute",
    iconName: "credit-card",
    iconType: "feather",
  },
  {
    id: "customer",
    title: "Customer",
    iconName: "user",
    iconType: "feather",
  },
  {
    id: "finance",
    title: "Finance & Expense",
    iconName: "trending-up",
    iconType: "feather",
    route: "/VendorMain/transaction",
    hasDropdown: true,
    subItems: [
      { id: "payouts", title: "Bank Settlements", route: "/VendorMain/transaction" },
      { id: "earnings", title: "Earnings Ledger", route: "/VendorMain/transaction" },
    ],
  },
  {
    id: "referral",
    title: "Referral & Rewards",
    iconName: "gift",
    iconType: "feather",
    hasDropdown: true,
  },
  {
    id: "reports",
    title: "Reports",
    iconName: "bar-chart-2",
    iconType: "feather",
    hasDropdown: true,
  },
];

const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: "notification",
    title: "Notification",
    iconName: "bell",
    iconType: "feather",
  },
  {
    id: "settings",
    title: "Settings",
    iconName: "settings",
    iconType: "feather",
    hasDropdown: true,
    subItems: [
      { id: "store_settings", title: "Store Profile", route: "/VendorMain/dashboard" },
      { id: "bank_settings", title: "Bank Account", route: "/VendorMain/transaction" },
    ],
  },
];

export default function VendorSideMenu({
  visible,
  onClose,
  activeRoute,
}: VendorSideMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { vendorUser, vendorDetails } = useAppSelector(
    (state) => state.vendorAuth
  );

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    orders: false,
    products: false,
  });

  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (route?: string) => {
    if (route) {
      handleClose();
      setTimeout(() => {
        router.push(route as any);
      }, 150);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Vendor Logout",
      "Are you sure you want to log out of your vendor account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            handleClose();
            await dispatch(logoutVendorAction());
            router.replace("/(auth)/vendorAuth/login/vendorlogin" as any);
          },
        },
      ]
    );
  };

  const isCurrentActive = (item: MenuItem) => {
    const current = activeRoute || pathname;
    if (item.route && current.includes(item.route)) return true;
    return false;
  };

  const renderIcon = (item: MenuItem, isActive: boolean) => {
    const color = isActive ? "#016073" : "#475569";
    const size = scale(18);

    switch (item.iconType) {
      case "feather":
        return <Feather name={item.iconName as any} size={size} color={color} />;
      case "mci":
        return (
          <MaterialCommunityIcons
            name={item.iconName as any}
            size={size}
            color={color}
          />
        );
      case "ionicons":
        return <Ionicons name={item.iconName as any} size={size} color={color} />;
      default:
        return <Feather name="circle" size={size} color={color} />;
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = isCurrentActive(item);
    const isExpanded = !!expandedItems[item.id];

    return (
      <View key={item.id} style={styles.menuItemWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (item.hasDropdown) {
              toggleExpand(item.id);
            } else if (item.route) {
              handleNavigate(item.route);
            }
          }}
          style={[styles.menuItemRow, isActive && styles.menuItemActive]}
        >
          <View style={styles.menuItemLeft}>
            {renderIcon(item, isActive)}
            <Text
              style={[
                styles.menuItemTitle,
                isActive && styles.menuItemTitleActive,
              ]}
            >
              {item.title}
            </Text>
          </View>

          {item.hasDropdown && (
            <Feather
              name={isExpanded ? "chevron-down" : "chevron-down"}
              size={scale(16)}
              color={isActive ? "#016073" : "#64748B"}
              style={{
                transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
              }}
            />
          )}
        </TouchableOpacity>

        {/* Sub Items Dropdown */}
        {item.hasDropdown && isExpanded && item.subItems && (
          <View style={styles.subItemsContainer}>
            {item.subItems.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                activeOpacity={0.7}
                onPress={() => handleNavigate(sub.route || item.route)}
                style={styles.subItemRow}
              >
                <View style={styles.subItemBullet} />
                <Text style={styles.subItemTitle}>{sub.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Background Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
            {/* Top Logo & Close / 3-Dots Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.logoRow}>
                <Image
                  source={require("@/assets/images/Home/bhansa-mart-cart-badge.png")}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                style={styles.headerMoreBtn}
              >
                <Feather name="more-vertical" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Menu Sections */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* MAIN SECTION */}
              <Text style={styles.sectionHeader}>MAIN</Text>
              <View style={styles.itemsGroup}>
                {MAIN_MENU_ITEMS.map(renderMenuItem)}
              </View>

              {/* SETTINGS SECTION */}
              <Text style={[styles.sectionHeader, { marginTop: moderateScale(16) }]}>
                SETTINGS
              </Text>
              <View style={styles.itemsGroup}>
                {SETTINGS_MENU_ITEMS.map(renderMenuItem)}
              </View>

              {/* LOGOUT BUTTON */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogout}
                style={styles.logoutRow}
              >
                <Feather name="log-out" size={scale(18)} color="#DC2626" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  drawerContent: {
    width: MENU_WIDTH,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: scale(110),
    height: scale(46),
  },
  headerMoreBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(30),
  },
  sectionHeader: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: moderateScale(8),
    paddingHorizontal: scale(8),
  },
  itemsGroup: {
    gap: scale(2),
  },
  menuItemWrapper: {
    marginBottom: scale(2),
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(10.5),
    borderRadius: scale(8),
  },
  menuItemActive: {
    backgroundColor: "#EFF6FF",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  menuItemTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "500",
    color: "#334155",
  },
  menuItemTitleActive: {
    color: "#016073",
    fontWeight: "700",
  },
  subItemsContainer: {
    paddingLeft: scale(42),
    paddingVertical: moderateScale(4),
    gap: moderateScale(6),
  },
  subItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    gap: scale(8),
  },
  subItemBullet: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: "#94A3B8",
  },
  subItemTitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    fontWeight: "500",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginTop: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(12),
    borderRadius: scale(8),
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#DC2626",
  },
});
