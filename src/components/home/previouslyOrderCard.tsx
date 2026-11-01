import { useProductCartQuantity, useCartActions } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleWishlist } from "@/store/slices/wishlistSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo, useCallback, useMemo } from "react";
import {
  Alert,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { DealProduct } from "./productcard";

export interface PreviouslyOrderCardProps {
  product: DealProduct;
  onPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
  style?: StyleProp<ViewStyle>;
}

export const PreviouslyOrderCard = memo(function PreviouslyOrderCard({
  product,
  onPress,
  onAddPress,
  style,
}: PreviouslyOrderCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { addToCart, updateQuantity } = useCartActions();

  const targetProductId = String(
    product.id || (product as any)._id || (product as any).productId || "",
  ).trim();

  const qty = useProductCartQuantity(targetProductId || product.id);

  // Check if product is wishlisted
  const isWishlisted = useAppSelector((state) => {
    const list = state.wishlist?.items;
    if (!list || list.length === 0) return false;
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const savedId = String(
        it.productId || (it as any).id || (it as any)._id || "",
      ).trim();
      if (
        (savedId.length > 0 && savedId === targetProductId) ||
        (it.name && product.name && it.name === product.name)
      ) {
        return true;
      }
    }
    return false;
  });

  const handleToggleWishlist = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      dispatch(
        toggleWishlist({
          ...product,
          id: targetProductId,
          productId: targetProductId,
        }),
      );
    },
    [dispatch, product, targetProductId],
  );

  const isAvailable = product.isAvailableInLocation !== false;

  const discountPercent =
    product.discountPct !== undefined && product.discountPct > 0
      ? product.discountPct
      : product.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100,
          )
        : 0;

  // Resolve image URI
  const imageSource = useMemo(() => {
    if (
      product.image &&
      typeof product.image === "object" &&
      "uri" in product.image
    ) {
      return (product.image as any).uri;
    }
    if (typeof (product as any).imageUrl === "string" && (product as any).imageUrl) {
      return (product as any).imageUrl;
    }
    if (typeof product.image === "string") {
      return product.image;
    }
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";
  }, [product.image]);

  const handleCardPress = useCallback(() => {
    onPress?.(product);
  }, [onPress, product]);

  const handleQuickAdd = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      if (!isAvailable) {
        Alert.alert(
          "Product Unavailable",
          "This item is currently not deliverable to your active delivery location. Please choose products from nearby stores or change your address.",
        );
        return;
      }

      if (onAddPress) {
        onAddPress(product);
      } else {
        addToCart({
          id: targetProductId || product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice || product.price,
          imageUrl: imageSource,
          weight: product.weight || "1 unit",
        });
      }
    },
    [isAvailable, onAddPress, product, addToCart, targetProductId, imageSource],
  );

  const handleMinus = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      updateQuantity(targetProductId, -1);
    },
    [updateQuantity, targetProductId],
  );

  const handlePlus = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      if (!isAvailable) return;
      updateQuantity(targetProductId, 1);
    },
    [isAvailable, updateQuantity, targetProductId],
  );

  // Check food type for veg indicator
  const isVegetarian = useMemo(() => {
    if (product.isVeg === false) return false;
    if (product.isVeg === true) return true;
    const combined = `${product.name || ""} ${product.subCategory || ""} ${product.category || ""}`.toLowerCase();
    const nonVegKeywords = [
      "chicken", "meat", "fish", "egg", "mutton", "pork", "beef", "seafood", "prawn", "crab", "non-veg", "nonveg"
    ];
    return !nonVegKeywords.some((kw) => combined.includes(kw));
  }, [product.isVeg, product.name, product.subCategory, product.category]);

  const orderFrequencyText = useMemo(() => {
    if (product.tags && product.tags.length > 0) {
      return product.tags[0];
    }
    if (product.ordersCount && product.ordersCount > 1) {
      return `Ordered ${product.ordersCount}x`;
    }
    return "Previously Ordered";
  }, [product.tags, product.ordersCount]);

  const savingsAmount =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      style={[
        styles.cardContainer,
        isDark && {
          backgroundColor: "#151D24",
          borderColor: "#25323E",
        },
        !isAvailable && styles.cardUnavailable,
        style,
      ]}
    >
      {/* 1. Left Thumbnail Container with Badge */}
      <View
        style={[
          styles.imageContainer,
          isDark && { backgroundColor: "#1D2833" },
        ]}
      >
        <Image
          source={{ uri: imageSource }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Subtle Wishlist Heart Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggleWishlist}
          style={[
            styles.wishlistBtn,
            isDark && { backgroundColor: "rgba(15, 23, 32, 0.75)" },
          ]}
        >
          <FontAwesome
            name={isWishlisted ? "heart" : "heart-o"}
            size={scale(11)}
            color={isWishlisted ? "#FF2028" : isDark ? "#E2E8F0" : "#64748B"}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Middle Content Area (Product Info & Pricing) */}
      <View style={styles.contentCol}>
        {/* Row: Reorder Frequency Badge + Veg/Non-Veg Mark */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.orderedPill,
              isDark && { backgroundColor: "#2C1518", borderColor: "#4A1C22" },
            ]}
          >
            <Feather
              name="repeat"
              size={scale(9.5)}
              color={isDark ? "#F87171" : "#DC2626"}
            />
            <Text
              style={[
                styles.orderedPillText,
                isDark && { color: "#F87171" },
              ]}
              numberOfLines={1}
            >
              {orderFrequencyText}
            </Text>
          </View>

          {/* Veg / Non-Veg Indicator */}
          <View
            style={[
              styles.vegIndicator,
              { borderColor: isVegetarian ? "#16A34A" : "#DC2626" },
              isDark && { backgroundColor: "#151D24" },
            ]}
          >
            <View
              style={[
                styles.vegDot,
                { backgroundColor: isVegetarian ? "#16A34A" : "#DC2626" },
              ]}
            />
          </View>
        </View>

        {/* Product Title */}
        <Text
          style={[
            styles.productName,
            isDark && { color: "#F8FAFC" },
          ]}
          numberOfLines={1}
        >
          {product.name}
        </Text>

        {/* Subtitle / Weight / Unit */}
        <Text
          style={[
            styles.weightSubtitle,
            isDark && { color: "#94A3B8" },
          ]}
          numberOfLines={1}
        >
          {[product.weight, product.subCategory || product.category]
            .filter(Boolean)
            .join(" • ")}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text
            style={[
              styles.currentPrice,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            ₹{product.price}
          </Text>

          {product.originalPrice && product.originalPrice > product.price ? (
            <Text
              style={[
                styles.originalPrice,
                isDark && { color: "#64748B" },
              ]}
            >
              ₹{product.originalPrice}
            </Text>
          ) : null}

          {savingsAmount > 0 ? (
            <View
              style={[
                styles.savePill,
                isDark && { backgroundColor: "#062E1A" },
              ]}
            >
              <Text
                style={[
                  styles.saveText,
                  isDark && { color: "#4ADE80" },
                ]}
              >
                Save ₹{savingsAmount}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Out of Delivery Zone Notice */}
        {!isAvailable && (
          <Text
            style={[
              styles.unavailableNotice,
              isDark && { color: "#F87171" },
            ]}
            numberOfLines={1}
          >
            Not deliverable to selected address
          </Text>
        )}
      </View>

      {/* 3. Right Action Column (Reorder Button or Stepper) */}
      <View style={styles.actionCol}>
        {!isAvailable ? (
          <View
            style={[
              styles.unavailableBtn,
              isDark && { backgroundColor: "#202C36", borderColor: "#334155" },
            ]}
          >
            <Text
              style={[
                styles.unavailableBtnText,
                isDark && { color: "#94A3B8" },
              ]}
            >
              Unavailable
            </Text>
          </View>
        ) : qty > 0 ? (
          /* Interactive Counter Stepper */
          <View
            style={[
              styles.stepperContainer,
              isDark && { backgroundColor: "#0D9488" },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMinus}
              style={styles.stepperBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="minus" size={scale(13)} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.stepperQtyText}>{qty}</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePlus}
              style={styles.stepperBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="plus" size={scale(13)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          /* Standard 1-Tap REORDER Button */
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={handleQuickAdd}
            style={[
              styles.reorderBtn,
              isDark && {
                backgroundColor: "#0D262C",
                borderColor: "#2DD4BF",
              },
            ]}
          >
            <Feather
              name="plus"
              size={scale(13)}
              color={isDark ? "#2DD4BF" : "#004d5d"}
            />
            <Text
              style={[
                styles.reorderBtnText,
                isDark && { color: "#2DD4BF" },
              ]}
            >
              REORDER
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default PreviouslyOrderCard;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnavailable: {
    opacity: 0.65,
  },
  imageContainer: {
    width: scale(76),
    height: scale(76),
    borderRadius: scale(10),
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: scale(4),
    left: scale(4),
    backgroundColor: "#FF2028",
    paddingHorizontal: scale(4.5),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
    zIndex: 2,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  wishlistBtn: {
    position: "absolute",
    top: scale(4),
    right: scale(4),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  contentCol: {
    flex: 1,
    marginLeft: scale(12),
    marginRight: scale(8),
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(3),
  },
  orderedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scale(6),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
    borderWidth: 0.5,
    borderColor: "#FECACA",
    gap: scale(3.5),
  },
  orderedPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#DC2626",
    letterSpacing: -0.1,
  },
  vegIndicator: {
    width: scale(12),
    height: scale(12),
    borderWidth: 1,
    borderRadius: scale(2.5),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  vegDot: {
    width: scale(5.5),
    height: scale(5.5),
    borderRadius: scale(3),
  },
  productName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(1.5),
    letterSpacing: -0.2,
  },
  weightSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginBottom: scale(4),
    fontWeight: "400",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  currentPrice: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  originalPrice: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  savePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(5),
    paddingVertical: scale(1),
    borderRadius: scale(4),
  },
  saveText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#16A34A",
  },
  unavailableNotice: {
    fontSize: moderateScale(10),
    color: "#DC2626",
    marginTop: scale(2),
    fontWeight: "600",
  },
  actionCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1.5,
    borderColor: "#004d5d",
    paddingHorizontal: scale(10),
    paddingVertical: scale(6.5),
    borderRadius: scale(8),
    gap: scale(3),
    minWidth: scale(84),
  },
  reorderBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#004d5d",
    letterSpacing: 0.3,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#004d5d",
    borderRadius: scale(8),
    paddingHorizontal: scale(8),
    paddingVertical: scale(5.5),
    minWidth: scale(84),
  },
  stepperBtn: {
    padding: scale(2),
    alignItems: "center",
    justifyContent: "center",
  },
  stepperQtyText: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#FFFFFF",
    minWidth: scale(18),
    textAlign: "center",
  },
  unavailableBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    minWidth: scale(84),
    alignItems: "center",
  },
  unavailableBtnText: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontWeight: "600",
  },
});
