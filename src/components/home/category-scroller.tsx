import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedCategory as setReduxCategory } from "@/store/slices/productSlice";
import { moderateScale, scale } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface CategoryItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", label: "All", icon: "cart-outline" },
  { id: "grocery", label: "Grocery", icon: "shopping-outline" },
  { id: "beauty", label: "Beauty", icon: "lipstick" },
  { id: "kids", label: "Kids", icon: "teddy-bear" },
  { id: "gifting", label: "Gifting", icon: "gift-outline" },
  { id: "stationery", label: "Stationery", icon: "book-open-outline" },
  { id: "snacks", label: "Snacks", icon: "cookie-outline" },
];

interface CategoryScrollerProps {
  categories?: CategoryItem[];
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
}

export default function CategoryScroller({
  categories = CATEGORIES,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
}: CategoryScrollerProps) {
  const dispatch = useAppDispatch();
  const reduxCategory = useAppSelector((state) => state.product.selectedCategory);
  const activeCategory = propSelectedCategory ?? reduxCategory ?? "all";

  const handleSelect = (id: string) => {
    dispatch(setReduxCategory(id));
    onSelectCategory?.(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((item) => {
          const isSelected = item.id === activeCategory;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => handleSelect(item.id)}
              style={styles.categoryItem}
            >
              {/* Golden Yellow Line-Art Icon */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={scale(32)}
                  color="#ffd215"
                />
              </View>

              {/* Category Label + Active Underline */}
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected ? styles.selectedLabel : styles.unselectedLabel,
                  ]}
                >
                  {item.label}
                </Text>

                {/* Yellow Underline Indicator Bar */}
                {isSelected && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(2),
    paddingBottom: moderateScale(4),
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    alignItems: "center",
  },
  categoryItem: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scale(11),
    minWidth: scale(48),
  },
  iconContainer: {
    height: scale(38),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingBottom: moderateScale(4),
  },
  categoryLabel: {
    fontSize: moderateScale(13.5),
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  selectedLabel: {
    color: "#ffd215",
    fontWeight: "700",
  },
  unselectedLabel: {
    color: "#ffffff",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: scale(2.5),
    borderRadius: scale(1.5),
    backgroundColor: "#ffd215",
  },
});
