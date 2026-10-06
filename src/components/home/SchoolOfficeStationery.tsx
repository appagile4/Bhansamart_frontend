import CategoryCard, {
  CategoryGridItem,
} from "@/components/home/category-card";
import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SchoolOfficeStationeryProps {
  onItemPress?: (item: CategoryGridItem) => void;
}

const STATIONERY_ITEMS: CategoryGridItem[] = [
  {
    id: "writing-essentials",
    name: "Writing\nEssentials",
    imageUrl:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "school-supplies",
    name: "School Supplies",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "office-supplies",
    name: "Office Supplies",
    imageUrl:
      "https://images.unsplash.com/photo-1507842229451-79b1be886a20?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "art-craft-hobby",
    name: "Art, Craft &\nHobby",
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&auto=format&fit=crop&q=80",
  },
];

export default function SchoolOfficeStationery({
  onItemPress,
}: SchoolOfficeStationeryProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
      >
        School, Office & Stationery
      </Text>

      {/* 4 Items in 1 Row */}
      <View style={styles.gridContainer}>
        {STATIONERY_ITEMS.map((item) => (
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
