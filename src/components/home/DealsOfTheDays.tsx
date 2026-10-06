import { Image } from "expo-image";
import ProductCard, { DealProduct } from "@/components/home/productcard";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export { DealProduct };

interface DealsOfTheDaysProps {
  title?: string;
  products?: DealProduct[];
  onProductPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
  onSeeAllPress?: () => void;
}

const DEFAULT_DEALS: DealProduct[] = [
  {
    id: "deal-1",
    weight: "2kg",
    category: "cornflakes",
    name: "Cornflakes classic\nNuts",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    priceDropText: "Price Drop",
    image: require("@/assets/images/Home/deals-product-combo.png"),
  },
  {
    id: "deal-2",
    weight: "2kg",
    category: "cornflakes",
    name: "Cornflakes classic\nNuts",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    priceDropText: "Price Drop",
    image: require("@/assets/images/Home/deals-product-combo.png"),
  },
  {
    id: "deal-3",
    weight: "2kg",
    category: "cornflakes",
    name: "Cornflakes classic\nNuts",
    rating: 4.5,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    priceDropText: "Price Drop",
    image: require("@/assets/images/Home/deals-product-combo.png"),
  },
];

export default function DealsOfTheDays({
  title = "DEALS OF THE DAY",
  products = DEFAULT_DEALS,
  onProductPress,
  onSeeMorePress,
  onSeeAllPress,
}: DealsOfTheDaysProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header with Side Lines */}
      <View style={styles.headerRow}>
        <View style={styles.headerLine} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Horizontal Carousel of Deals */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={onProductPress}
            onSeeMorePress={onSeeMorePress}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: scale(10) }} />}
      />

      {/* See All Products Bottom Bar */}
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
    marginVertical: moderateScale(10),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(16),
    marginBottom: moderateScale(14),
    gap: scale(12),
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#D1D5DB",
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: "900",
    color: "#2C6E49",
    fontStyle: "italic",
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(12),
  },
  seeAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: scale(16),
    marginTop: moderateScale(6),
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    gap: scale(10),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
