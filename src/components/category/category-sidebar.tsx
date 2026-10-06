import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface CategoryItem {
  id: string;
  name: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg?: string;
  subcategories: string[];
}

interface CategorySidebarProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (category: CategoryItem) => void;
}

export default function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((item) => {
          const isSelected = item.id === selectedCategoryId;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => onSelectCategory(item)}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardActive,
              ]}
            >
              {/* Active Indicator Bar on Left */}
              {isSelected && <View style={styles.activeBar} />}

              {/* Category Icon */}
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: item.iconBg || "#F1F5F9" },
                  isSelected && styles.iconBoxActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={item.iconName || "food-apple-outline"}
                  size={scale(24)}
                  color={isSelected ? "#0B4D58" : "#475569"}
                />
              </View>

              {/* Category Title */}
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameActive,
                ]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: scale(88),
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
  },
  scrollContent: {
    paddingVertical: moderateScale(8),
  },
  categoryCard: {
    alignItems: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: scale(4),
    position: "relative",
  },
  categoryCardActive: {
    backgroundColor: "#ffffff",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: moderateScale(8),
    bottom: moderateScale(8),
    width: scale(3.5),
    backgroundColor: "#0B4D58",
    borderTopRightRadius: scale(3),
    borderBottomRightRadius: scale(3),
  },
  iconBox: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(6),
  },
  iconBoxActive: {
    backgroundColor: "#E6F4EA",
  },
  categoryName: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: moderateScale(13),
    paddingHorizontal: scale(2),
  },
  categoryNameActive: {
    color: "#0B4D58",
    fontWeight: "800",
  },
});
