import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface CategoryProduct {
  id: string;
  name: string;
  weight: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  imageUrl: string;
}

interface CategoryProductCardProps {
  product: CategoryProduct;
  onAddToCart?: (product: CategoryProduct) => void;
}

function CategoryProductCardComponent({
  product,
  onAddToCart,
}: CategoryProductCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const [quantity, setQuantity] = useState(0);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        name: product.name,
        weight: product.weight,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.imageUrl,
      },
    });
  }, [router, product]);

  const handleIncrement = useCallback(
    (e: any) => {
      e.stopPropagation?.();
      setQuantity((q) => q + 1);
      onAddToCart?.(product);
    },
    [onAddToCart, product]
  );

  const handleDecrement = useCallback((e: any) => {
    e.stopPropagation?.();
    setQuantity((q) => Math.max(0, q - 1));
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.card}
    >
      {/* Top Image Container */}
      <View style={styles.imageBox}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImg}
          contentFit="contain"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Floating Add or Stepper Button */}
        {quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleIncrement}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDecrement}
              style={styles.stepBtn}
            >
              <Feather name="minus" size={scale(12)} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.stepCount}>{quantity}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleIncrement}
              style={styles.stepBtn}
            >
              <Feather name="plus" size={scale(12)} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Weight Unit */}
        <Text style={styles.weightText}>{product.weight}</Text>

        {/* Product Title */}
        <Text style={styles.titleText} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating Row */}
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name="star"
                size={scale(9)}
                color="#F59E0B"
              />
            ))}
          </View>
          <Text style={styles.reviewsCount}>({product.reviewsCount})</Text>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>Rs. {product.price}</Text>
          {product.originalPrice > product.price && (
            <Text style={styles.origPriceText}>
              Rs.{product.originalPrice}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    marginBottom: moderateScale(10),
  },
  imageBox: {
    width: "100%",
    height: scale(110),
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(6),
  },
  productImg: {
    width: "82%",
    height: "82%",
  },
  discountBadge: {
    position: "absolute",
    top: scale(6),
    left: scale(6),
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    color: "#16A34A",
  },
  addBtn: {
    position: "absolute",
    bottom: scale(6),
    right: scale(6),
    backgroundColor: "#ffffff",
    borderWidth: 1.2,
    borderColor: "#2D6A4F",
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addBtnText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#2D6A4F",
  },
  stepperContainer: {
    position: "absolute",
    bottom: scale(6),
    right: scale(6),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#047857",
    borderRadius: scale(6),
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    gap: scale(6),
  },
  stepBtn: {
    padding: scale(2),
  },
  stepCount: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#ffffff",
    minWidth: scale(10),
    textAlign: "center",
  },
  content: {
    padding: scale(8),
  },
  weightText: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: moderateScale(2),
  },
  titleText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(14.5),
    minHeight: moderateScale(29),
    marginBottom: moderateScale(4),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginBottom: moderateScale(4),
  },
  stars: {
    flexDirection: "row",
    gap: scale(1),
  },
  reviewsCount: {
    fontSize: moderateScale(8.5),
    color: "#94A3B8",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  priceText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#1E293B",
  },
  origPriceText: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
});

const CategoryProductCard = memo(CategoryProductCardComponent);
export default CategoryProductCard;
