import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleWishlist } from "@/store/slices/wishlistSlice";
import { moderateScale, scale, useTheme, verticalScale } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DealProduct } from "./productcard";

export interface CompactProductCardProps {
  product: DealProduct;
  cardWidth?: number;
  onPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
}

export const CompactProductCard = memo(function CompactProductCard({
  product,
  cardWidth,
  onPress,
  onAddPress,
}: CompactProductCardProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();

  const isWishlisted = useAppSelector((state) =>
    state.wishlist.items.some(
      (item) => String(item.productId) === String(product.id)
    )
  );

  const handleWishlistPress = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      dispatch(
        toggleWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          weight: product.weight,
          category: product.category,
          subCategory: product.subCategory,
          rating: product.rating,
          reviewsCount: product.reviewsCount,
        })
      );
    },
    [dispatch, product]
  );

  const handleCardPress = useCallback(() => {
    onPress?.(product);
  }, [onPress, product]);

  const handleQuickAdd = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      if (onAddPress) {
        onAddPress(product);
      } else {
        const imgUrl =
          typeof product.image === "object" && product.image && "uri" in product.image
            ? (product.image as any).uri
            : "";
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          imageUrl: imgUrl,
          weight: product.weight,
        });
      }
    },
    [addToCart, onAddPress, product]
  );

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      style={[
        styles.card,
        cardWidth ? { width: cardWidth } : undefined,
        isDark && {
          backgroundColor: "#151D24",
          borderColor: "#303B45",
        },
      ]}
    >
      {/* Product Image Box */}
      <View
        style={[
          styles.imageContainer,
          isDark && { backgroundColor: "#1B252E" },
        ]}
      >
        <Image
          source={product.image}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />

        {/* Wishlist Button at Top-Right Corner */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleWishlistPress}
          style={[
            styles.wishlistBtn,
            isDark && {
              backgroundColor: "rgba(21, 29, 36, 0.88)",
              borderColor: "#303B45",
            },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={scale(13)}
            color={isWishlisted ? "#EF4444" : isDark ? "#A8B2BE" : "#64748B"}
          />
        </TouchableOpacity>
      </View>

      {/* Details: Name and Price */}
      <View style={styles.details}>
        {/* Product Name */}
        <Text
          style={[styles.name, isDark && { color: "#F8FAFC" }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {/* Price Row with Quick Add Button */}
        <View style={styles.priceRow}>
          <View style={styles.priceTextGroup}>
            <Text
              style={[styles.price, isDark && { color: "#F8FAFC" }]}
              numberOfLines={1}
            >
              Rs. {product.price}
            </Text>
            {hasDiscount ? (
              <Text
                style={[
                  styles.originalPrice,
                  isDark && { color: "#64748B" },
                ]}
                numberOfLines={1}
              >
                Rs. {product.originalPrice}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleQuickAdd}
            style={[
              styles.addBtn,
              isDark && {
                backgroundColor: "rgba(57, 211, 83, 0.15)",
                borderColor: "#39D353",
              },
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name="add"
              size={scale(14)}
              color={isDark ? "#39D353" : "#059669"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default CompactProductCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: verticalScale(10),
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(6),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  wishlistBtn: {
    position: "absolute",
    top: scale(5),
    right: scale(5),
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 10,
  },
  details: {
    paddingHorizontal: scale(6),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(8),
    justifyContent: "space-between",
  },
  name: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(13.5),
    minHeight: verticalScale(27),
    marginBottom: verticalScale(4),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: verticalScale(2),
  },
  priceTextGroup: {
    flex: 1,
    flexDirection: "column",
    paddingRight: scale(3),
  },
  price: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  originalPrice: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginTop: verticalScale(1),
  },
  addBtn: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    borderWidth: 1,
    borderColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
});
