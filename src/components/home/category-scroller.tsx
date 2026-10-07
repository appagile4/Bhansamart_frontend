import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedCategory as setReduxCategory } from "@/store/slices/productSlice";
import { moderateScale, scale } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  { id: "baby", label: "Baby", icon: "baby-carriage" },
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

interface CategoryButtonProps {
  item: CategoryItem;
  isSelected: boolean;
  onPress: (id: string, layoutX: number, layoutWidth: number) => void;
}

// ── Memoized & Smoothly Animated Category Tab Button ──────────────────
const CategoryButton = memo(function CategoryButton({
  item,
  isSelected,
  onPress,
}: CategoryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1.08 : 1)).current;
  const underlineAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const layoutRef = useRef({ x: 0, width: 0 });

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.08 : 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(underlineAnim, {
        toValue: isSelected ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected, scaleAnim, underlineAnim]);

  const handlePress = useCallback(() => {
    onPress(item.id, layoutRef.current.x, layoutRef.current.width);
  }, [item.id, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={handlePress}
      onLayout={(e) => {
        layoutRef.current = {
          x: e.nativeEvent.layout.x,
          width: e.nativeEvent.layout.width,
        };
      }}
      style={styles.categoryItem}
    >
      {/* Icon with smooth spring bounce animation */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={scale(32)}
          color={isSelected ? "#ffd215" : "rgba(255, 210, 21, 0.85)"}
        />
      </Animated.View>

      {/* Category Label + Smooth Animated Underline */}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.categoryLabel,
            isSelected ? styles.selectedLabel : styles.unselectedLabel,
          ]}
        >
          {item.label}
        </Text>

        {/* Yellow Underline Indicator Bar with Smooth Scale Animation */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{ scaleX: underlineAnim }],
              opacity: underlineAnim,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
});

export default function CategoryScroller({
  categories = CATEGORIES,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
}: CategoryScrollerProps) {
  const dispatch = useAppDispatch();
  const reduxCategory = useAppSelector(
    (state) => state.product.selectedCategory
  );
  const activeCategory = propSelectedCategory ?? reduxCategory ?? "all";
  const scrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();

  const handleSelect = useCallback(
    (id: string, layoutX: number, layoutWidth: number) => {
      dispatch(setReduxCategory(id));
      onSelectCategory?.(id);

      // Smoothly auto-center the active category in the horizontal viewport
      if (layoutWidth > 0 && scrollRef.current) {
        const scrollToX = Math.max(
          0,
          layoutX - screenWidth / 2 + layoutWidth / 2 + scale(14)
        );
        scrollRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    },
    [dispatch, onSelectCategory, screenWidth]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((item) => (
          <CategoryButton
            key={item.id}
            item={item}
            isSelected={item.id === activeCategory}
            onPress={handleSelect}
          />
        ))}
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
