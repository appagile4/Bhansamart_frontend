import React from "react";
import { useCart } from "@/context/cart-context";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingCartBarProps {
  bottomOffset?: number;
  onPress?: () => void;
  showDeliveryNotice?: boolean;
}

export default function FloatingCartBar({
  bottomOffset,
  onPress,
  showDeliveryNotice = true,
}: FloatingCartBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    totalCount,
    totalPrice,
    totalOriginalPrice,
    totalSavings,
    cartItems,
  } = useCart();

  if (totalCount === 0) {
    return null;
  }

  // Calculate default bottom position above NativeTabs + Safe Area
  const effectiveBottom =
    bottomOffset !== undefined
      ? bottomOffset
      : Math.max(insets.bottom + scale(14), scale(76));

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/customerMain/cart" as any);
    }
  };

  const previewThumbnails = cartItems.slice(0, 3);
  const freeDeliveryThreshold = 500;
  const isFreeDelivery = totalPrice >= freeDeliveryThreshold;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: effectiveBottom }]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={styles.touchableCard}
      >
        <LinearGradient
          colors={["#003844", "#004D5D", "#016073"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          {/* Top Micro-Banner: Savings / Free Delivery info */}
          {showDeliveryNotice && (
            <View style={styles.topMicroBanner}>
              <View style={styles.microBannerLeft}>
                <Ionicons
                  name={isFreeDelivery ? "checkmark-circle" : "flash"}
                  size={scale(12)}
                  color="#4ADE80"
                />
                <Text style={styles.microBannerText}>
                  {isFreeDelivery
                    ? "Free Delivery unlocked on this order!"
                    : `Add Rs.${freeDeliveryThreshold - totalPrice} more for FREE delivery`}
                </Text>
              </View>
              {totalSavings > 0 && (
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsPillText}>
                    SAVE RS.{totalSavings}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Main Content Bar */}
          <View style={styles.mainBarRow}>
            {/* Left: Overlapping Thumbnails & Cart Badge */}
            <View style={styles.leftGroup}>
              <View style={styles.thumbnailStack}>
                {previewThumbnails.length > 0 ? (
                  previewThumbnails.map((item, index) => (
                    <View
                      key={item.id + index}
                      style={[
                        styles.thumbCircle,
                        {
                          marginLeft: index > 0 ? -scale(14) : 0,
                          zIndex: 4 - index,
                        },
                      ]}
                    >
                      {item.imageUrl ? (
                        <Image
                          source={
                            typeof item.imageUrl === "string"
                              ? { uri: item.imageUrl }
                              : item.imageUrl
                          }
                          style={styles.thumbImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="fast-food-outline"
                          size={scale(14)}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.cartIconCircle}>
                    <Ionicons name="cart" size={scale(18)} color="#FFFFFF" />
                  </View>
                )}

                {/* Overlaid Count Pill */}
                {totalCount > 3 && (
                  <View style={styles.extraCountPill}>
                    <Text style={styles.extraCountText}>
                      +{totalCount - previewThumbnails.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Price & Items Details */}
              <View style={styles.priceDetailsCol}>
                <View style={styles.itemCountBadgeRow}>
                  <View style={styles.greenLiveDot} />
                  <Text style={styles.itemCountBadgeText}>
                    {totalCount} {totalCount === 1 ? "ITEM" : "ITEMS"}
                  </Text>
                </View>

                <View style={styles.pricingRow}>
                  <Text style={styles.mainPriceText}>Rs. {totalPrice}</Text>
                  {totalOriginalPrice > totalPrice && (
                    <Text style={styles.originalStrikedPrice}>
                      Rs. {totalOriginalPrice}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Right: View Cart Button with Shiny Arrow */}
            <View style={styles.ctaButtonWrapper}>
              <LinearGradient
                colors={["#0284C7", "#0369A1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradientBtn}
              >
                <Text style={styles.ctaButtonText}>View Cart</Text>
                <View style={styles.arrowCircle}>
                  <Feather
                    name="chevron-right"
                    size={scale(15)}
                    color="#0369A1"
                  />
                </View>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: scale(12),
    right: scale(12),
    zIndex: 99999,
    elevation: 20,
    shadowColor: "#001824",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  touchableCard: {
    borderRadius: scale(18),
    overflow: "hidden",
  },
  gradientContainer: {
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: scale(14),
    paddingTop: scale(8),
    paddingBottom: scale(10),
  },
  topMicroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: scale(6),
    marginBottom: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
  },
  microBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    flex: 1,
  },
  microBannerText: {
    color: "#E2F1F5",
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  savingsPill: {
    backgroundColor: "rgba(34, 197, 94, 0.22)",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: 0.5,
    borderColor: "#4ADE80",
  },
  savingsPillText: {
    color: "#4ADE80",
    fontSize: moderateScale(10),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  mainBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  thumbnailStack: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  thumbCircle: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#004D5D",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  cartIconCircle: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#005C70",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  extraCountPill: {
    position: "absolute",
    right: -scale(6),
    bottom: -scale(2),
    backgroundColor: "#0F172A",
    borderRadius: scale(8),
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    borderWidth: 1,
    borderColor: "#FFFFFF",
    zIndex: 10,
  },
  extraCountText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontWeight: "700",
  },
  priceDetailsCol: {
    justifyContent: "center",
  },
  itemCountBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
  },
  greenLiveDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#4ADE80",
  },
  itemCountBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#BEE3F8",
    letterSpacing: 0.5,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(6),
    marginTop: scale(1),
  },
  mainPriceText: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  originalStrikedPrice: {
    fontSize: moderateScale(11.5),
    fontWeight: "500",
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  ctaButtonWrapper: {
    borderRadius: scale(12),
    overflow: "hidden",
  },
  ctaGradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: scale(14),
    paddingRight: scale(6),
    paddingVertical: scale(7),
    borderRadius: scale(12),
    gap: scale(8),
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
