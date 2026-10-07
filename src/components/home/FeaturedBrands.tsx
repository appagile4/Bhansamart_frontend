import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale } from "@/theme";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface FeaturedBrandItem {
  id: string;
  title: string;
  tag?: string;
  bgColor?: string;
  imageSource: any;
  category?: string;
}

const CARD_WIDTH = scale(135);
const CARD_HEIGHT = scale(175);

// ==========================================
// 1. GROCERY FEATURED BRANDS
// ==========================================
const GROCERY_ITEMS: FeaturedBrandItem[] = [
  {
    id: "g-feat-1",
    title: "Saffola Gold",
    tag: "Featured",
    bgColor: "#E5A922",
    imageSource: require("@/assets/images/Home/saffola-gold-oil.png"),
    category: "oil-ghee-masala",
  },
  {
    id: "g-feat-2",
    title: "Dawaat",
    tag: "Featured",
    bgColor: "#36457E",
    imageSource: require("@/assets/images/Home/daawat-basmati-rice.png"),
    category: "atta-rice-dal",
  },
  {
    id: "g-feat-3",
    title: "Rice",
    tag: "Featured",
    bgColor: "#D87210",
    imageSource: require("@/assets/images/Home/rice-grains-package.png"),
    category: "atta-rice-dal",
  },
  {
    id: "g-feat-4",
    title: "Fresh Meat",
    tag: "Featured",
    bgColor: "#8B2332",
    imageSource: require("@/assets/images/Home/fresh-meat-sausages-tray.png"),
    category: "oil-ghee-masala",
  },
];

// ==========================================
// 2. KIDS FEATURED BRANDS
// ==========================================
const KIDS_ITEMS: FeaturedBrandItem[] = [
  {
    id: "k-feat-1",
    title: "Baby shoes",
    tag: "Featured",
    bgColor: "#008DE4",
    imageSource: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "baby-shoes",
  },
  {
    id: "k-feat-2",
    title: "Backpacks",
    tag: "Featured",
    bgColor: "#F59E0B",
    imageSource: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    category: "kids-backpacks",
  },
  {
    id: "k-feat-3",
    title: "Soft Toys",
    tag: "Featured",
    bgColor: "#EC4899",
    imageSource: require("@/assets/images/Home/plush-bunny-toy.png"),
    category: "soft-toys",
  },
  {
    id: "k-feat-4",
    title: "Baby Wear",
    tag: "Featured",
    bgColor: "#3B82F6",
    imageSource: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    category: "kids-outfits",
  },
  {
    id: "k-feat-5",
    title: "Wooden Toys",
    tag: "Featured",
    bgColor: "#8B5CF6",
    imageSource: require("@/assets/images/Home/wooden-toy-train.png"),
    category: "educational-toys",
  },
];

// ==========================================
// 3. GIFTING / GIFTS FEATURED BRANDS
// ==========================================
const GIFTING_ITEMS: FeaturedBrandItem[] = [
  {
    id: "gift-feat-1",
    title: "Sweet Treats",
    tag: "Featured",
    bgColor: "#C2410C",
    imageSource: require("@/assets/images/Home/prod-munch.png"),
    category: "sweet-treats",
  },
  {
    id: "gift-feat-2",
    title: "KitKat Gift",
    tag: "Featured",
    bgColor: "#DC2626",
    imageSource: require("@/assets/images/Home/prod-kitkat.png"),
    category: "sweet-treats",
  },
  {
    id: "gift-feat-3",
    title: "Dairy Milk",
    tag: "Featured",
    bgColor: "#4C1D95",
    imageSource: require("@/assets/images/Home/prod-dairymilk.png"),
    category: "premium-chocolates",
  },
  {
    id: "gift-feat-4",
    title: "Care Hampers",
    tag: "Featured",
    bgColor: "#EA580C",
    imageSource: require("@/assets/images/Home/gift-basket-care.png"),
    category: "gift-combos",
  },
  {
    id: "gift-feat-5",
    title: "Celebration",
    tag: "Featured",
    bgColor: "#D97706",
    imageSource: require("@/assets/images/Home/gift-flower-bouquet.png"),
    category: "gift-flowers",
  },
];

// ==========================================
// 4. STATIONERY FEATURED BRANDS
// ==========================================
const STATIONERY_ITEMS: FeaturedBrandItem[] = [
  {
    id: "stat-feat-1",
    title: "School Bags",
    tag: "Featured",
    bgColor: "#2563EB",
    imageSource: require("@/assets/images/Home/printed-school-backpack.png"),
    category: "school-backpacks",
  },
  {
    id: "stat-feat-2",
    title: "Notebooks",
    tag: "Featured",
    bgColor: "#10B981",
    imageSource: require("@/assets/images/Home/notebooks-sticky-notes.png"),
    category: "paper-notebooks",
  },
  {
    id: "stat-feat-3",
    title: "Water Bottles",
    tag: "Featured",
    bgColor: "#06B6D4",
    imageSource: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
    category: "water-bottles",
  },
  {
    id: "stat-feat-4",
    title: "Color Pencils",
    tag: "Featured",
    bgColor: "#F97316",
    imageSource: require("@/assets/images/Home/colored-pencils-row.png"),
    category: "art-craft",
  },
  {
    id: "stat-feat-5",
    title: "Writing Pens",
    tag: "Featured",
    bgColor: "#4F46E5",
    imageSource: require("@/assets/images/Home/executive-fountain-pen.png"),
    category: "pens-writing",
  },
];

// ==========================================
// 5. BEAUTY FEATURED BRANDS
// ==========================================
const BEAUTY_ITEMS: FeaturedBrandItem[] = [
  {
    id: "beauty-feat-1",
    title: "Skincare",
    tag: "Featured",
    bgColor: "#DB2777",
    imageSource: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
    category: "skin-care",
  },
  {
    id: "beauty-feat-2",
    title: "Bath & Wash",
    tag: "Featured",
    bgColor: "#7C3AED",
    imageSource: require("@/assets/images/Home/himalaya-baby-wash.png"),
    category: "bath-body",
  },
  {
    id: "beauty-feat-3",
    title: "Oral Care",
    tag: "Featured",
    bgColor: "#0284C7",
    imageSource: require("@/assets/images/Home/toothpaste-colgate.png"),
    category: "oral-care",
  },
  {
    id: "beauty-feat-4",
    title: "Fragrance",
    tag: "Featured",
    bgColor: "#E11D48",
    imageSource: require("@/assets/images/Home/luxury-purple-perfume.png"),
    category: "fragrance",
  },
  {
    id: "beauty-feat-5",
    title: "Makeup",
    tag: "Featured",
    bgColor: "#EC4899",
    imageSource: require("@/assets/images/Home/makeup-blush-compact.png"),
    category: "makeup",
  },
];

// ==========================================
// 6. SNACKS & DRINKS FEATURED BRANDS
// ==========================================
const SNACKS_ITEMS: FeaturedBrandItem[] = [
  {
    id: "snack-feat-1",
    title: "Maggi",
    tag: "Featured",
    bgColor: "#EAB308",
    imageSource: require("@/assets/images/Home/product-maggi.png"),
    category: "instant-noodles",
  },
  {
    id: "snack-feat-2",
    title: "Wai Wai",
    tag: "Featured",
    bgColor: "#DC2626",
    imageSource: require("@/assets/images/Home/product-waiwai.png"),
    category: "instant-noodles",
  },
  {
    id: "snack-feat-3",
    title: "2PM Noodles",
    tag: "Featured",
    bgColor: "#EA580C",
    imageSource: require("@/assets/images/Home/product-2pm.png"),
    category: "instant-food",
  },
  {
    id: "snack-feat-4",
    title: "Juices & Drinks",
    tag: "Featured",
    bgColor: "#16A34A",
    imageSource: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    category: "juices-beverages",
  },
  {
    id: "snack-feat-5",
    title: "Corn Flakes",
    tag: "Featured",
    bgColor: "#F59E0B",
    imageSource: require("@/assets/images/Home/cornflakes-hero.png"),
    category: "cereals-breakfast",
  },
];

const CATEGORY_MAP: Record<string, FeaturedBrandItem[]> = {
  grocery: GROCERY_ITEMS,
  kids: KIDS_ITEMS,
  baby: KIDS_ITEMS,
  gifting: GIFTING_ITEMS,
  gifts: GIFTING_ITEMS,
  gift: GIFTING_ITEMS,
  stationery: STATIONERY_ITEMS,
  school: STATIONERY_ITEMS,
  beauty: BEAUTY_ITEMS,
  snacks: SNACKS_ITEMS,
};

interface FeaturedBrandsProps {
  category?:
    | "grocery"
    | "kids"
    | "gifting"
    | "gifts"
    | "stationery"
    | "beauty"
    | "snacks"
    | string;
  items?: FeaturedBrandItem[];
  onItemPress?: (item: FeaturedBrandItem) => void;
}

export default function FeaturedBrands({
  category = "grocery",
  items,
  onItemPress,
}: FeaturedBrandsProps) {
  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product
  );

  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Resolve items by explicitly passed items or category lookup
  const displayItems =
    items || CATEGORY_MAP[category.toLowerCase()] || GROCERY_ITEMS;

  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3, 4].map((i) => (
            <Animated.View
              key={`feat-skel-${i}`}
              style={[
                styles.cardContainer,
                {
                  backgroundColor: "#E2E8F0",
                  borderRadius: scale(16),
                  opacity: pulseAnim,
                },
              ]}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {displayItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            onPress={() => onItemPress?.(item)}
            style={styles.cardContainer}
          >
            {/* Card Background Graphic Asset */}
            <View style={styles.cardImageWrapper}>
              <Image
                source={item.imageSource}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            </View>

            {/* White Pill Badge in Top Center with "Featured" in Red */}
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{item.tag || "Featured"}</Text>
            </View>

            {/* Bold Brand Title */}
            <Text style={styles.titleText} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: moderateScale(10),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    gap: scale(12),
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageWrapper: {
    ...StyleSheet.absoluteFill,
    borderRadius: scale(16),
    overflow: "hidden",
  },
  badgePill: {
    marginTop: scale(2),
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(10),
    paddingVertical: scale(2.5),
    borderBottomLeftRadius: scale(6),
    borderBottomRightRadius: scale(6),
    borderTopLeftRadius: scale(2),
    borderTopRightRadius: scale(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  badgeText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.2,
  },
  titleText: {
    marginTop: scale(10),
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    paddingHorizontal: scale(4),
    zIndex: 5,
  },
});
