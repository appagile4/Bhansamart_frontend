import { Image } from "expo-image";
import InstantProductCard, {
  InstantProductItem,
} from "@/components/home/InstantProductCard";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export { InstantProductItem };

interface InstantFrozenFoodProps {
  title?: string;
  products?: InstantProductItem[];
  onProductPress?: (product: InstantProductItem) => void;
  onAddPress?: (product: InstantProductItem) => void;
  onSeeAllPress?: () => void;
}

const DEFAULT_INSTANT_PRODUCTS: InstantProductItem[] = [
  {
    id: "maggi-1",
    weight: "2kg",
    category: "cornflakes",
    name: "Maggi Masala - 2\nMinutes Instant\nNoodles",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    optionsText: "3 options",
    image: require("@/assets/images/Home/product-maggi.png"),
  },
  {
    id: "waiwai-1",
    weight: "2kg",
    category: "cornflakes",
    name: "Wai Wai Ready To Eat\nChicken Masala\nFlavored Noodles",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/product-waiwai.png"),
  },
  {
    id: "2pm-1",
    weight: "2kg",
    category: "cornflakes",
    name: "2pm  Ready To Eat\nChicken Masala\nFlavored Noodles",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    priceDrop: true,
    image: require("@/assets/images/Home/product-2pm.png"),
  },
  {
    id: "maggi-2",
    weight: "2kg",
    category: "cornflakes",
    name: "Maggi Masala - 2\nMinutes Instant\nNoodles",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    optionsText: "3 options",
    image: require("@/assets/images/Home/product-maggi.png"),
  },
  {
    id: "waiwai-2",
    weight: "2kg",
    category: "cornflakes",
    name: "Wai Wai Ready To Eat\nChicken Masala\nFlavored Noodles",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/product-waiwai.png"),
  },
  {
    id: "2pm-2",
    weight: "2kg",
    category: "cornflakes",
    name: "2pm  Ready To Eat\nChicken Masala\nFlavored Noodles",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    priceDrop: true,
    image: require("@/assets/images/Home/product-2pm.png"),
  },
];

export default function InstantFrozenFood({
  title = "Instant & Frozen Food",
  products = DEFAULT_INSTANT_PRODUCTS,
  onProductPress,
  onAddPress,
  onSeeAllPress,
}: InstantFrozenFoodProps) {
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
          <InstantProductCard
            key={product.id}
            product={product}
            onPress={onProductPress}
            onAddPress={onAddPress}
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
    marginBottom: moderateScale(10),
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
  seeAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBF4F6",
    marginTop: moderateScale(4),
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
