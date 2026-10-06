import { moderateScale, scale } from "@/theme";
import { Image } from "expo-image";
import {
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
    imageSource: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "kids-backpacks",
  },
  {
    id: "k-feat-3",
    title: "Soft Toys",
    tag: "Featured",
    bgColor: "#EC4899",
    imageSource: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "soft-toys",
  },
  {
    id: "k-feat-4",
    title: "Outfits",
    tag: "Featured",
    bgColor: "#3B82F6",
    imageSource: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "kids-outfits",
  },
  {
    id: "k-feat-5",
    title: "Wooden Toys",
    tag: "Featured",
    bgColor: "#8B5CF6",
    imageSource: require("@/assets/images/Home/kids-playmat-shoes.png"),
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
    imageSource: require("@/assets/images/Home/craft-stationery-flatlay.jpg"),
    category: "chocolate-gifts",
  },
  {
    id: "gift-feat-2",
    title: "KitKat Gift",
    tag: "Featured",
    bgColor: "#DC2626",
    imageSource: require("@/assets/images/Home/craft-stationery-flatlay.jpg"),
    category: "sweet-treats",
  },
  {
    id: "gift-feat-3",
    title: "Dairy Milk",
    tag: "Featured",
    bgColor: "#4C1D95",
    imageSource: require("@/assets/images/Home/craft-stationery-flatlay.jpg"),
    category: "premium-chocolates",
  },
  {
    id: "gift-feat-4",
    title: "Gift Combos",
    tag: "Featured",
    bgColor: "#EA580C",
    imageSource: require("@/assets/images/Home/craft-stationery-flatlay.jpg"),
    category: "gift-combos",
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
    imageSource: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    category: "school-backpacks",
  },
  {
    id: "stat-feat-2",
    title: "Stationery Sets",
    tag: "Featured",
    bgColor: "#10B981",
    imageSource: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    category: "stationery-kits",
  },
  {
    id: "stat-feat-3",
    title: "Water Bottles",
    tag: "Featured",
    bgColor: "#06B6D4",
    imageSource: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    category: "water-bottles",
  },
  {
    id: "stat-feat-4",
    title: "Art & Craft",
    tag: "Featured",
    bgColor: "#F97316",
    imageSource: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    category: "art-craft",
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
    imageSource: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
    category: "skin-care",
  },
  {
    id: "beauty-feat-2",
    title: "Hair Care",
    tag: "Featured",
    bgColor: "#7C3AED",
    imageSource: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
    category: "hair-care",
  },
  {
    id: "beauty-feat-3",
    title: "Oral Care",
    tag: "Featured",
    bgColor: "#0284C7",
    imageSource: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
    category: "oral-care",
  },
  {
    id: "beauty-feat-4",
    title: "Fragrance",
    tag: "Featured",
    bgColor: "#E11D48",
    imageSource: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
    category: "fragrance",
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
    title: "Chips & Crisps",
    tag: "Featured",
    bgColor: "#F97316",
    imageSource: require("@/assets/images/Home/makeup-blush-compact.png"),
    category: "chips-crisps",
  },
  {
    id: "snack-feat-4",
    title: "Juices & Drinks",
    tag: "Featured",
    bgColor: "#16A34A",
    imageSource: require("@/assets/images/Home/fresh-juice-splash.png"),
    category: "juices-beverages",
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
  // Resolve items by explicitly passed items or category lookup
  const displayItems =
    items || CATEGORY_MAP[category.toLowerCase()] || GROCERY_ITEMS;

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
