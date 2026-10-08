import { moderateScale, scale } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomCheckoutBarProps {
  totalCount?: number;
  totalPrice?: number;
  onCheckout?: () => void;
}

const GRADIENT_COLORS = ["#003844", "#004d5d", "#016073"] as const;

export default function BottomCheckoutBar({
  totalCount = 1,
  totalPrice = 0,
  onCheckout,
}: BottomCheckoutBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, scale(12)),
        },
      ]}
    >
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
    paddingTop: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
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
