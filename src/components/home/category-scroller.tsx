import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedCategory as setReduxCategory } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Platform,
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
const CategoryButton = memo(
  function CategoryButton({ item, isSelected, onPress }: CategoryButtonProps) {
    const theme = useTheme();
    const isDark = theme.mode === "dark";
    const scaleAnim = useRef(new Animated.Value(isSelected ? 1.08 : 1)).current;
    const underlineAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
    const layoutRef = useRef({ x: 0, width: 0 });
    const isFirstMount = useRef(true);

    useEffect(() => {
      // Skip animation on initial mount to prevent jank while loading
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: isSelected ? 1.08 : 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(underlineAnim, {
          toValue: isSelected ? 1 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isSelected, scaleAnim, underlineAnim]);

    const handlePress = useCallback(() => {
      onPress(item.id, layoutRef.current.x, layoutRef.current.width);
    }, [item.id, onPress]);

    const itemColor = useMemo(() => {
      if (item.id === "beauty") return "#FF4F81"; // Beauty: Pink #FF4F81
      if (item.id === "baby" || item.id === "kids") return "#FF8C32"; // Baby: Orange #FF8C32
      if (item.id === "gifting") return "#AD70FF"; // Gifting: Purple #AD70FF
      if (isSelected) return isDark ? "#39D353" : "#ffd215"; // Primary brand: Emerald Green #39D353
      return isDark ? "#A8B2BE" : "rgba(255, 210, 21, 0.85)";
    }, [item.id, isSelected, isDark]);

    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={handlePress}
        onLayout={(e) => {
          if (layoutRef.current.width === 0) {
            layoutRef.current = {
              x: e.nativeEvent.layout.x,
              width: e.nativeEvent.layout.width,
            };
          }
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
            color={itemColor}
          />
        </Animated.View>

        {/* Category Label + Smooth Animated Underline */}
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.categoryLabel,
              isSelected
                ? { color: itemColor, fontWeight: "700" }
                : { color: isDark ? "#A8B2BE" : "#ffffff" },
            ]}
          >
            {item.label}
          </Text>

          {/* Underline Indicator Bar with Smooth Scale Animation */}
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: itemColor,
                transform: [{ scaleX: underlineAnim }],
                opacity: underlineAnim,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.item.id === next.item.id &&
    prev.item.label === next.item.label &&
    prev.item.icon === next.item.icon &&
    prev.onPress === next.onPress
);

function CategoryScroller({
  categories = CATEGORIES,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
}: CategoryScrollerProps) {
  const dispatch = useAppDispatch();
  const reduxCategory = useAppSelector(
    (state) => state.product.selectedCategory
  );
  const activeCategory = propSelectedCategory ?? reduxCategory ?? "all";
  const scrollRef = useRef<any>(null);
  const { width: screenWidth } = useWindowDimensions();
  const screenWidthRef = useRef(screenWidth);
  screenWidthRef.current = screenWidth;

  const handleSelect = useCallback(
    (id: string, layoutX: number, layoutWidth: number) => {
      dispatch(setReduxCategory(id));
      onSelectCategory?.(id);

      // Smoothly auto-center the active category in the horizontal viewport
      if (layoutWidth > 0 && scrollRef.current) {
        const scrollToX = Math.max(
          0,
          layoutX - screenWidthRef.current / 2 + layoutWidth / 2 + scale(14)
        );
        scrollRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    },
    [dispatch, onSelectCategory]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        scrollEventThrottle={16}
        decelerationRate={Platform.OS === "android" ? 0.985 : "normal"}
        overScrollMode="never"
        bounces={Platform.OS === "ios"}
        alwaysBounceHorizontal={false}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
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

function areCategoryScrollerPropsEqual(
  prev: CategoryScrollerProps,
  next: CategoryScrollerProps
) {
  return (
    prev.selectedCategory === next.selectedCategory &&
    prev.onSelectCategory === next.onSelectCategory &&
    prev.categories === next.categories
  );
}

export default memo(CategoryScroller, areCategoryScrollerPropsEqual);

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
