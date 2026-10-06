import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface CheckoutItem {
  id: string;
  name: string;
  packInfo: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
}

const CHECKOUT_ITEMS: CheckoutItem[] = [
  {
    id: "item-1",
    name: "Lorem ipsum dolor sit aet, consectetur adi",
    packInfo: "1 Pack(10 pieces)",
    price: 400,
    originalPrice: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=200&q=80",
  },
  {
    id: "item-2",
    name: "Lorem ipsum dolor sit at, consectetur adip elit. ctet ur adip elit",
    packInfo: "1 * 20 packs",
    price: 400,
    originalPrice: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80",
  },
  {
    id: "item-3",
    name: "Lorem ipsum dolor sit aet, consectetur adi",
    packInfo: "1 * 20 packs",
    price: 400,
    originalPrice: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80",
  },
  {
    id: "item-4",
    name: "Lorem ipsum dolor sit at, consectetur adip elit. ctet ur adip elit",
    packInfo: "1 Pack(10 pieces)",
    price: 400,
    originalPrice: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [orderId] = useState("ODR999999999");
  const [copied, setCopied] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Floor 5, Building name, land mark, Baneshwor, kathmandu"
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash on delivery");

  const handleCopyOrderId = () => {
    setCopied(true);
    Alert.alert("Copied", `Order ID ${orderId} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmOrder = () => {
    Alert.alert(
      "Order Confirmed!",
      `Your order ${orderId} has been placed successfully for Rs.800. It will arrive within 24 hours.`,
      [
        {
          text: "View Orders",
          onPress: () => router.replace("/customerMain" as any),
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header with SafeAreaView for full status-bar coverage */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Title and Subtitle Block */}
        <View style={styles.titleSection}>
          <Text style={styles.checkoutTitle}>checkout</Text>
          <Text style={styles.arrivingSubtext}>Arriving within 24 hr</Text>
        </View>

        {/* 4 items in this order header */}
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsHeaderText}>
            {CHECKOUT_ITEMS.length} items in this order
          </Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* Main Scrollable Content */}
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ordered Items List */}
          <View style={styles.itemsList}>
            {CHECKOUT_ITEMS.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index < CHECKOUT_ITEMS.length - 1 && styles.itemDivider,
                ]}
              >
                {/* Thumbnail */}
                <View style={styles.imageBox}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                </View>

                {/* Details */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.packInfo}>{item.packInfo}</Text>
                </View>

                {/* Pricing on Right */}
                <View style={styles.itemPriceCol}>
                  <Text style={styles.strikethroughPrice}>
                    Rs.{item.originalPrice}
                  </Text>
                  <Text style={styles.finalPrice}>Rs.{item.price}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Bill details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bill details</Text>
            <View style={styles.cardDivider} />

            <View style={styles.billRows}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>MRP</Text>
                <Text style={styles.billValue}>Rs.1000</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Product discount</Text>
                <Text style={styles.discountValue}>-250</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item total</Text>
                <Text style={styles.billValue}>Rs.750</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Handeling charge</Text>
                <Text style={styles.billValue}>Rs.50</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery charge</Text>
                <Text style={styles.freeValue}>free</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Coupon code</Text>
                <Text style={styles.discountValue}>-250</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Bill Total Row */}
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>Bill total</Text>
              <Text style={styles.billTotalValue}>Rs.800</Text>
            </View>
          </View>

          {/* Order details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order details</Text>
            <View style={styles.cardDivider} />

            <View style={styles.orderDetailsList}>
              {/* Order ID */}
              <View style={styles.orderDetailItem}>
                <Text style={styles.detailLabel}>Order id</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCopyOrderId}
                  style={styles.orderIdRow}
                >
                  <Text style={styles.detailValueBold}>{orderId}</Text>
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={scale(16)}
                    color={copied ? "#059669" : "#475569"}
                  />
                </TouchableOpacity>
              </View>

              {/* Payment */}
              <View style={styles.orderDetailItem}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>Pay on delivery</Text>
              </View>

              {/* Deliver To */}
              <View style={styles.orderDetailItem}>
                <View style={styles.deliverToHeader}>
                  <Text style={styles.detailLabel}>Deliver to</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push("/Screens/Profile/address" as any)
                    }
                  >
                    <Feather name="edit-3" size={scale(15)} color="#475569" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailValue}>{deliveryAddress}</Text>
              </View>

              {/* Order Placed */}
              <View style={styles.orderDetailItem}>
                <Text style={styles.detailLabel}>Order placed</Text>
                <Text style={styles.detailValue}>Placed today, 10:00 AM</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Confirmation Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, scale(12)),
            },
          ]}
        >
          {/* Left Payment info */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push("/Screens/Profile/paymentsetting" as any)
            }
            style={styles.paymentLeft}
          >
            <MaterialCommunityIcons
              name="cash-multiple"
              size={scale(20)}
              color="#64748B"
            />
            <View>
              <Text style={styles.payUsingLabel}>Pay using</Text>
              <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
            </View>
          </TouchableOpacity>

          {/* Right Confirm Order CTA Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConfirmOrder}
            style={styles.confirmOrderBtn}
          >
            <View style={styles.btnPriceCol}>
              <Text style={styles.btnPriceText}>Rs.5500</Text>
              <Text style={styles.btnTotalLabel}>Total</Text>
            </View>

            <View style={styles.btnActionCol}>
              <Text style={styles.confirmOrderText}>Confirm Order</Text>
              <Ionicons
                name="caret-forward"
                size={scale(14)}
                color="#ffffff"
                style={{ marginLeft: scale(2) }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeAreaHeader: {
    backgroundColor: "#ffffff",
  },
  navBar: {
    height: moderateScale(40),
    paddingHorizontal: scale(16),
    justifyContent: "center",
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
  },
  titleSection: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(4),
  },
  checkoutTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  arrivingSubtext: {
    fontSize: moderateScale(13),
    color: "#0284C7",
    fontWeight: "600",
    marginTop: moderateScale(2),
  },
  itemsHeader: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
    paddingBottom: moderateScale(10),
  },
  itemsHeaderText: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: scale(16),
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(24),
    gap: moderateScale(16),
  },
  itemsList: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  imageBox: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
    padding: scale(3),
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    flex: 1,
    paddingRight: scale(8),
  },
  itemName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(2),
  },
  packInfo: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  itemPriceCol: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: scale(6),
  },
  strikethroughPrice: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  finalPrice: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(8),
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
  billRows: {
    gap: moderateScale(8),
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  billLabel: {
    fontSize: moderateScale(13),
    color: "#475569",
    fontWeight: "500",
  },
  billValue: {
    fontSize: moderateScale(13),
    color: "#1E293B",
    fontWeight: "600",
  },
  discountValue: {
    fontSize: moderateScale(13),
    color: "#2563EB",
    fontWeight: "600",
  },
  freeValue: {
    fontSize: moderateScale(13),
    color: "#059669",
    fontWeight: "600",
  },
  billTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(2),
  },
  billTotalLabel: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
  },
  billTotalValue: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  orderDetailsList: {
    gap: moderateScale(12),
  },
  orderDetailItem: {
    gap: moderateScale(2),
  },
  detailLabel: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "500",
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  detailValueBold: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  detailValue: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
  },
  deliverToHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(2),
  },
  bottomBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  payUsingLabel: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    fontWeight: "500",
  },
  paymentMethodText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  confirmOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B4D58",
    borderRadius: scale(10),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(8),
    gap: scale(12),
  },
  btnPriceCol: {
    alignItems: "flex-start",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.25)",
    paddingRight: scale(10),
  },
  btnPriceText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#ffffff",
  },
  btnTotalLabel: {
    fontSize: moderateScale(9.5),
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
  },
  btnActionCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  confirmOrderText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#ffffff",
  },
});
