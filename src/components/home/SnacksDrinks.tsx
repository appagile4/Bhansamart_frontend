import CategoryCard, {
  CategoryGridItem,
} from "@/components/home/category-card";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SnacksDrinksProps {
  onItemPress?: (item: CategoryGridItem) => void;
}

const SNACKS_ITEMS: CategoryGridItem[] = [
  {
    id: "chips-namkeen",
    name: "Chips &\nNamkeen",
    imageUrl:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "sweets-chocolates",
    name: "Sweets &\nChocolates",
    imageUrl:
      "https://images.unsplash.com/photo-1548741487-18d16a1a083c?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "drinks-juices",
    name: "Drinks &\nJuices",
    imageUrl:
      "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "tea-coffee-milk",
    name: "Tea, Coffee &\nMilk Drinks",
    imageUrl:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "instant-food",
    name: "Instant\nFood",
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "sauce-spreads",
    name: "Sauce &\nSpreads",
    imageUrl:
      "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "paan-corner",
    name: "Paan\ncorner",
    imageUrl:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "ice-cream-more",
    name: "Ice Cream &\nMore",
    imageUrl:
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&auto=format&fit=crop&q=80",
  },
];

export default function SnacksDrinks({ onItemPress }: SnacksDrinksProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
      >
        Snacks & Drinks
      </Text>

      {/* 4x2 Grid */}
      <View style={styles.gridContainer}>
        {SNACKS_ITEMS.map((item) => (
          <CategoryCard key={item.id} item={item} onPress={onItemPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginBottom: moderateScale(12),
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
