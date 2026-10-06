import CategoryCard, {
  CategoryGridItem,
} from "@/components/home/category-card";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BeautyPersonalCareProps {
  onItemPress?: (item: CategoryGridItem) => void;
}

const BEAUTY_ITEMS: CategoryGridItem[] = [
  {
    id: "bath-body",
    name: "Bath & body",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "hair",
    name: "Hair",
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "skin-faces",
    name: "Skin & Faces",
    imageUrl:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "beauty-cosmetics",
    name: "Beauty &\nCosmetics",
    imageUrl:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "feminine-hygiene",
    name: "Feminine\nHygiene",
    imageUrl:
      "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "baby-care",
    name: "Baby Care",
    imageUrl:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "health-pharma",
    name: "Health &\nPharma",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "sexual-wellness",
    name: "Sexual\nWellness",
    imageUrl:
      "https://images.unsplash.com/photo-1608248597359-00e9a3b60dc4?w=300&auto=format&fit=crop&q=80",
  },
];

export default function BeautyPersonalCare({
  onItemPress,
}: BeautyPersonalCareProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
      >
        Beauty & Personal Care
      </Text>

      {/* 4x2 Grid */}
      <View style={styles.gridContainer}>
        {BEAUTY_ITEMS.map((item) => (
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
