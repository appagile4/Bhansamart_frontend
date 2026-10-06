import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface SweetToothItem {
  id: string;
  weight: string;
  category?: string;
  name: string;
  rating?: number;
  reviewsCount?: number;
  price: number;
  originalPrice: number;
  optionsText?: string;
  image: ImageSourcePropType | { uri: string };
}

export interface SweetToothProductCardProps {
  product: SweetToothItem;
  onPress?: (product: SweetToothItem) => void;
  onAddPress?: (product: SweetToothItem) => void;
  onSeeMorePress?: (product: SweetToothItem) => void;
}

export function SweetToothProductCard({
  product,
  onPress,
  onAddPress,
  onSeeMorePress,
}: SweetToothProductCardProps) {
  const theme = useTheme();

  const renderStars = (rating: number = 4.5) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons
          key={`star-${i}`}
          name="star"
          size={scale(10)}
          color="#F59E0B"
        />
      );
    }
    if (hasHalf) {
      stars.push(
        <Ionicons
          key="star-half"
          name="star-half"
          size={scale(10)}
          color="#F59E0B"
        />
      );
    }
    while (stars.length < 5) {
      stars.push(
        <Ionicons
          key={`star-empty-${stars.length}`}
          name="star-outline"
          size={scale(10)}
          color="#F59E0B"
        />
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress?.(product)}
      style={styles.cardContainer}
    >
      {/* Top Image Container with Soft Cyan/Mint Background & ADD Button */}
      <View style={styles.imageBox}>
        <Image
          source={product.image}
          style={styles.productImage}
          contentFit="contain"
        />

        {/* ADD Capsule Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onAddPress?.(product)}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>ADD</Text>
          {product.optionsText ? (
            <Text style={styles.optionsText}>{product.optionsText}</Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Content Body */}
      <View style={styles.content}>
        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.weight}</Text>
          </View>
          {product.category ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{product.category}</Text>
            </View>
          ) : null}
        </View>

        {/* Product Title */}
        <Text
          style={[styles.productTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={3}
        >
          {product.name}
        </Text>

        {/* Rating Stars & Count */}
        <View style={styles.ratingRow}>
          <View style={styles.starsGroup}>
            {renderStars(product.rating ?? 4.5)}
          </View>
          <Text style={styles.ratingCount}>
            ({product.reviewsCount ?? 142})
          </Text>
        </View>

        {/* Pricing */}
        <View style={styles.priceRow}>
          <Text
            style={[styles.currentPrice, { color: theme.colors.textPrimary }]}
          >
            Rs. {product.price}
          </Text>
          <Text style={styles.originalPrice}>Rs. {product.originalPrice}</Text>
        </View>

        {/* "See more like this" button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSeeMorePress?.(product)}
          style={styles.seeMoreBtn}
        >
          <Text style={styles.seeMoreBtnText}>See more like this</Text>
          <View style={styles.seeMoreArrowBox}>
            <Ionicons name="caret-forward" size={scale(8.5)} color="#047857" />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface SweetToothProps {
  title?: string;
  products?: SweetToothItem[];
  onProductPress?: (product: SweetToothItem) => void;
  onAddPress?: (product: SweetToothItem) => void;
  onSeeMorePress?: (product: SweetToothItem) => void;
  onSeeAllPress?: () => void;
}

const DEFAULT_SWEET_TOOTH: SweetToothItem[] = [
  {
    id: "kitkat",
    weight: "38.5 g",
    name: "Nestle KitKat Love\nBreak, 4 Fingers Wafer\nChocolate ...",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    optionsText: "3 options",
    image: require("@/assets/images/Home/prod-kitkat.png"),
  },
  {
    id: "munch",
    weight: "38.5 g",
    name: "Nestle Munch Max,\nChocolate Coated,\nCrunchy Wafer Bar",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-munch.png"),
  },
  {
    id: "milkybar",
    weight: "42 g",
    category: "Milk chocolate",
    name: "Milky bar Treat\n\n",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-milkybar.png"),
  },
  {
    id: "gems",
    weight: "2kg",
    category: "Milk Chocolate",
    name: "Cadbury Gems Duo\nPack Chocolate\n",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-gems.png"),
  },
  {
    id: "dairymilk",
    weight: "42 g",
    category: "Milk chocolate",
    name: "Cadbury Diary Milk\nChocolate Bar\n",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-dairymilk.png"),
  },
  {
    id: "nutties",
    weight: "2kg",
    category: "3 x 30 g",
    name: "Cadbury Nuttiest\nChocolate Pack -\nPack of 3",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    optionsText: "4 options",
    image: require("@/assets/images/Home/prod-nutties.png"),
  },
];

export default function SweetTooth({
  title = "Sweet Tooth",
  products = DEFAULT_SWEET_TOOTH,
  onProductPress,
  onAddPress,
  onSeeMorePress,
  onSeeAllPress,
}: SweetToothProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
      >
        {title}
      </Text>

      {/* 3-Column Grid */}
      <View style={styles.grid}>
        {products.map((product) => (
          <SweetToothProductCard
            key={product.id}
            product={product}
            onPress={onProductPress}
            onAddPress={onAddPress}
            onSeeMorePress={onSeeMorePress}
          />
        ))}
      </View>

      {/* Bottom "See all products" Bar */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSeeAllPress}
        style={styles.seeAllBar}
      >
        <Image
          source={require("@/assets/images/Home/see-all-thumb.png")}
          style={styles.seeAllThumb}
          contentFit="contain"
        />
        <Text style={styles.seeAllText}>See all products</Text>
        <Ionicons name="caret-forward" size={scale(14)} color="#1E3A5F" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginBottom: moderateScale(12),
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardContainer: {
    width: "31%",
    marginBottom: moderateScale(16),
  },
  imageBox: {
    width: "100%",
    aspectRatio: 0.95,
    backgroundColor: "#DBF4F6",
    borderRadius: scale(14),
    padding: scale(6),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  productImage: {
    width: "88%",
    height: "88%",
  },
  addBtn: {
    position: "absolute",
    bottom: -scale(1),
    right: -scale(1),
    backgroundColor: "#ffffff",
    borderWidth: 1.2,
    borderColor: "#4A7C59",
    borderRadius: scale(8),
    paddingHorizontal: scale(9),
    paddingVertical: scale(2.5),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#4A7C59",
    letterSpacing: 0.3,
  },
  optionsText: {
    fontSize: moderateScale(7),
    color: "#64748B",
    marginTop: -2,
  },
  content: {
    paddingTop: moderateScale(6),
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginBottom: moderateScale(4),
    flexWrap: "wrap",
  },
  tagBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  tagText: {
    fontSize: moderateScale(8.5),
    color: "#64748B",
    fontWeight: "500",
  },
  productTitle: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    lineHeight: moderateScale(14.5),
    minHeight: scale(42),
    marginBottom: moderateScale(2),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    marginBottom: moderateScale(2),
  },
  starsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(0.5),
  },
  ratingCount: {
    fontSize: moderateScale(9),
    color: "#64748B",
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
    marginTop: moderateScale(1),
    marginBottom: moderateScale(5),
  },
  currentPrice: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    paddingVertical: scale(3.5),
    paddingLeft: scale(5),
    paddingRight: scale(4),
    borderRadius: scale(5),
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginTop: moderateScale(2),
  },
  seeMoreBtnText: {
    fontSize: moderateScale(8.5),
    color: "#065F46",
    fontWeight: "600",
  },
  seeMoreArrowBox: {
    borderLeftWidth: 1,
    borderLeftColor: "#A7F3D0",
    paddingLeft: scale(3),
    marginLeft: scale(2),
  },
  seeAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBF4F6",
    marginTop: moderateScale(6),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    gap: scale(10),
  },
  seeAllThumb: {
    width: scale(60),
    height: scale(26),
  },
  seeAllText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1E3A5F",
    letterSpacing: 0.2,
  },
});
