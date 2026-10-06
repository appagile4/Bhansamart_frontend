import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface DealProduct {
  id: string;
  weight: string;
  category: string;
  name: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  priceDropText?: string;
  image: ImageSourcePropType;
}

export interface ProductCardProps {
  product: DealProduct;
  onPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
}

export default function ProductCard({
  product,
  onPress,
  onSeeMorePress,
}: ProductCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    } else {
      router.push({
        pathname: "/Screens/Product/productdetailscreen" as any,
        params: {
          name: product.name,
          weight: product.weight,
          price: product.price,
          originalPrice: product.originalPrice,
        },
      });
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons
          key={`star-${i}`}
          name="star"
          size={scale(10.5)}
          color="#F59E0B"
        />
      );
    }
    if (hasHalf) {
      stars.push(
        <Ionicons
          key="star-half"
          name="star-half"
          size={scale(10.5)}
          color="#F59E0B"
        />
      );
    }
    while (stars.length < 5) {
      stars.push(
        <Ionicons
          key={`star-empty-${stars.length}`}
          name="star-outline"
          size={scale(10.5)}
          color="#F59E0B"
        />
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.cardContainer}
    >
      {/* Top Product Image Banner */}
      <View style={styles.cardImageWrapper}>
        <Image
          source={product.image}
          style={styles.cardImage}
          contentFit="contain"
        />
      </View>

      {/* Card Content */}
      <View style={styles.cardDetails}>
        {/* Tag Badges: weight & category */}
        <View style={styles.tagsRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.weight}</Text>
          </View>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.category}</Text>
          </View>
        </View>

        {/* Product Name */}
        <Text
          style={[styles.productTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {/* Rating Stars & Count */}
        <View style={styles.ratingRow}>
          <View style={styles.starsGroup}>{renderStars(product.rating)}</View>
          <Text style={styles.ratingCount}>({product.reviewsCount})</Text>
        </View>

        {/* Price Drop Label */}
        <Text style={styles.priceDropText}>
          {product.priceDropText || "Price Drop"}
        </Text>

        {/* Pricing Row */}
        <View style={styles.priceRow}>
          <Text
            style={[styles.currentPrice, { color: theme.colors.textPrimary }]}
          >
            Rs. {product.price}
          </Text>
          <Text style={styles.originalPrice}>Rs. {product.originalPrice}</Text>
        </View>

        {/* See more like this Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSeeMorePress?.(product)}
          style={styles.seeMoreBtn}
        >
          <Text style={styles.seeMoreBtnText}>See more like this</Text>
          <View style={styles.seeMoreArrowBox}>
            <Ionicons name="caret-forward" size={scale(10)} color="#047857" />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: scale(145),
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  cardImageWrapper: {
    width: "100%",
    height: scale(105),
    backgroundColor: "#E0F2FE",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardDetails: {
    padding: scale(8),
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: moderateScale(4),
  },
  tagBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  tagText: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "500",
  },
  productTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    lineHeight: moderateScale(15),
    minHeight: scale(30),
    marginBottom: moderateScale(3),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginBottom: moderateScale(2),
  },
  starsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },
  ratingCount: {
    fontSize: moderateScale(10),
    color: "#64748B",
    fontWeight: "500",
  },
  priceDropText: {
    fontSize: moderateScale(10),
    color: "#DC2626",
    fontWeight: "600",
    marginTop: moderateScale(1),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(6),
  },
  currentPrice: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    paddingVertical: scale(4),
    paddingLeft: scale(6),
    paddingRight: scale(5),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  seeMoreBtnText: {
    fontSize: moderateScale(9.5),
    color: "#065F46",
    fontWeight: "600",
  },
  seeMoreArrowBox: {
    borderLeftWidth: 1,
    borderLeftColor: "#A7F3D0",
    paddingLeft: scale(4),
    marginLeft: scale(3),
  },
});
