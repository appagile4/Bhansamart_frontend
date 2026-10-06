import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomCheckoutBarProps {
  totalCount?: number;
  totalPrice?: number;
  paymentMethod?: string;
  deliveryAddress?: string;
  onSelectPaymentMethod?: () => void;
  onSelectAddress?: () => void;
  onCheckout?: () => void;
}

const GRADIENT_COLORS = ["#003844", "#004d5d", "#016073"] as const;

export default function BottomCheckoutBar({
  totalCount = 1,
  totalPrice = 0,
  paymentMethod = "Cash on delivery",
  deliveryAddress = "Home • Kathmandu, Ward 4",
  onSelectPaymentMethod,
  onSelectAddress,
  onCheckout,
}: BottomCheckoutBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, scale(12)),
        },
      ]}
    >
      {/* Top Quick Bar (Address & Payment Preview) */}
      <View style={styles.topInfoRow}>
        {/* Address Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSelectAddress}
          style={styles.infoPill}
        >
          <Ionicons name="location-sharp" size={scale(13)} color="#008080" />
          <Text style={styles.infoPillText} numberOfLines={1}>
            {deliveryAddress}
          </Text>
          <Feather name="chevron-down" size={scale(12)} color="#94A3B8" />
        </TouchableOpacity>

        {/* Payment Method Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSelectPaymentMethod}
          style={styles.infoPill}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={scale(14)}
            color="#16A34A"
          />
          <Text style={styles.infoPillText} numberOfLines={1}>
            {paymentMethod}
          </Text>
          <Feather name="chevron-down" size={scale(12)} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Main Action Row */}
      <View style={styles.mainActionRow}>
        {/* Left Total Info */}
        <View style={styles.totalCol}>
          <Text style={styles.totalPriceText}>Rs.{totalPrice}</Text>
          <Text style={styles.totalCountText}>
            {totalCount} {totalCount === 1 ? "item" : "items"} in cart
          </Text>
        </View>

        {/* Right Checkout CTA with Linear Gradient */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCheckout}
          style={styles.checkoutBtnWrapper}
        >
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutBtn}
          >
            <View style={styles.checkoutBtnLeft}>
              <Text style={styles.checkoutText}>Proceed to Pay</Text>
            </View>
            <Feather name="arrow-right" size={scale(16)} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  topInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(8),
    marginBottom: moderateScale(10),
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: scale(8),
    paddingVertical: scale(5),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(4),
  },
  infoPillText: {
    flex: 1,
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#334155",
  },
  mainActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalCol: {
    justifyContent: "center",
  },
  totalPriceText: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#0F172A",
  },
  totalCountText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "500",
    marginTop: scale(1),
  },
  checkoutBtnWrapper: {
    borderRadius: scale(12),
    overflow: "hidden",
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(22),
    paddingVertical: moderateScale(13),
    borderRadius: scale(12),
    gap: scale(8),
  },
  checkoutBtnLeft: {
    justifyContent: "center",
  },
  checkoutText: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
