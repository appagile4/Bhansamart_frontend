import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
  id: string;
  status: "placed" | "cancelled" | "delivered";
  statusText: string;
  amount: number;
  time: string;
  isActive?: boolean;
  productImages: string[];
}

const ORDERS_LIST: OrderItem[] = [
  {
    id: "ord-1",
    status: "placed",
    statusText: "Order placed",
    amount: 999,
    time: "Today, 10:00 am",
    isActive: true,
    productImages: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80",
      "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=200&q=80",
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
  {
    id: "ord-2",
    status: "cancelled",
    statusText: "Order cancelled",
    amount: 999,
    time: "Today, 10:00 am",
    isActive: false,
    productImages: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80",
      "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=200&q=80",
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
];

export default function YourOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleOrderSummary = (order: OrderItem) => {
    router.push("/Screens/Profile/order-summary" as any);
  };

  const handleReorder = (order: OrderItem) => {
    Alert.alert(
      "Reorder",
      `Would you like to re-order items from ${order.id}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reorder Now",
          onPress: () => router.push("/customerMain/cart" as any),
        },
      ]
    );
  };

  const handleMoreOptions = (order: OrderItem) => {
    Alert.alert("Order Options", `Order ID: ${order.id}`, [
      { text: "View Details", onPress: () => handleOrderSummary(order) },
      { text: "Download Invoice", onPress: () => Alert.alert("Invoice downloaded") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Your order</Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Orders Cards List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ORDERS_LIST.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            {/* Top Order Status Row */}
            <View style={styles.cardHeaderRow}>
              {/* Left Icon */}
              <View
                style={[
                  styles.statusIconBox,
                  order.status === "cancelled"
                    ? styles.statusIconCancelled
                    : styles.statusIconPlaced,
                ]}
              >
                {order.status === "cancelled" ? (
                  <Feather name="x" size={scale(22)} color="#EF4444" />
                ) : (
                  <MaterialCommunityIcons
                    name="shopping"
                    size={scale(26)}
                    color="#D97706"
                  />
                )}
              </View>

              {/* Middle Title & Subtitle */}
              <View style={styles.statusTextCol}>
                <Text style={styles.statusTitle}>{order.statusText}</Text>
                <Text style={styles.statusSubtitle}>
                  Rs.{order.amount} • {order.time}
                </Text>
              </View>

              {/* Right Active Badge or More Options */}
              {order.isActive ? (
                <View style={styles.activeBadgeContainer}>
                  <View style={styles.blueDot} />
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleMoreOptions(order)}
                  style={styles.moreBtn}
                >
                  <Feather
                    name="more-vertical"
                    size={scale(20)}
                    color="#64748B"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Products Thumbnails Preview Row */}
            <View style={styles.productsThumbRow}>
              {order.productImages.map((imgUrl, i) => (
                <View key={i} style={styles.thumbSquare}>
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.thumbImage}
                    contentFit="contain"
                  />
                </View>
              ))}
            </View>

            <View style={styles.cardDivider} />

            {/* Bottom Action CTA Button */}
            {order.status === "placed" ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleOrderSummary(order)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Order summary</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleReorder(order)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Reorder</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeAreaHeader: {
    backgroundColor: "#ffffff",
  },
  navBar: {
    height: moderateScale(48),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    marginRight: scale(6),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    padding: scale(16),
    gap: moderateScale(16),
  },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingTop: moderateScale(14),
    paddingHorizontal: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  statusIconBox: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  statusIconPlaced: {
    backgroundColor: "#FEF3C7",
  },
  statusIconCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusTextCol: {
    flex: 1,
    gap: moderateScale(3),
  },
  statusTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  statusSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "500",
  },
  activeBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  blueDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#2563EB",
  },
  activePill: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
  },
  activePillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#2563EB",
  },
  moreBtn: {
    padding: scale(4),
  },
  productsThumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginBottom: moderateScale(14),
  },
  thumbSquare: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    padding: scale(3),
  },
  thumbImage: {
    width: "82%",
    height: "82%",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: scale(-14),
  },
  actionButton: {
    paddingVertical: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#65A30D",
  },
});
