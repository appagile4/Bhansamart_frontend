import CategoryCard, {
  CategoryGridItem,
} from "@/components/home/category-card";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface GroceryKitchenProps {
  onItemPress?: (item: CategoryGridItem) => void;
}

const GROCERY_ITEMS: CategoryGridItem[] = [
  {
    id: "veg-fruits",
    name: "Vegetables &\nFruits",
    imageUrl:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "atta-rice-dal",
    name: "Atta, Rice &\nDal",
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "oil-ghee-masala",
    name: "Oil, Ghee &\nMasala",
    imageUrl:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread &\nEggs",
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "bakery-biscuits",
    name: "Bakery &\nBiscuits",
    imageUrl:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "dry-fruits-cereals",
    name: "Dry Fruits &\nCereals",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "chicken-meat-fish",
    name: "Chicken, Meat &\nFish",
    imageUrl:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "kitchenware-appliances",
    name: "Kitchenware &\nAppliances",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&auto=format&fit=crop&q=80",
  },
];

export default function GroceryKitchen({ onItemPress }: GroceryKitchenProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
      >
        Grocery & Kitchen
      </Text>

      {/* 4x2 Grid */}
      <View style={styles.gridContainer}>
        {GROCERY_ITEMS.map((item) => (
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
