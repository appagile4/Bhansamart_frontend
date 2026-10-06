import { moderateScale, scale, useTheme } from "@/theme";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING_H = scale(16);
const GAP = scale(10);
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - GAP * 2) / 3;

export interface NewArrivalDuoCategory {
  id: string;
  title: string;
  imageLeft: any;
  imageRight: any;
  category: string;
}

// ==========================================
// 1. GROCERY NEW ARRIVALS (2x3 Grid)
// ==========================================
const GROCERY_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "g-arr-1",
    title: "Juices",
    imageLeft: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    imageRight: require("@/assets/images/Home/slice-mango-juice.png"),
    category: "juices-beverages",
  },
  {
    id: "g-arr-2",
    title: "Hygiene",
    imageLeft: require("@/assets/images/Home/toothpaste-colgate.png"),
    imageRight: require("@/assets/images/Home/himalaya-baby-wash.png"),
    category: "personal-care",
  },
  {
    id: "g-arr-3",
    title: "Processed",
    imageLeft: require("@/assets/images/Home/bacon-strips-meat.png"),
    imageRight: require("@/assets/images/Home/fresh-meat-sausages-tray.png"),
    category: "meat-seafood",
  },
  {
    id: "g-arr-4",
    title: "Breakfast",
    imageLeft: require("@/assets/images/Home/cornflakes-hero.png"),
    imageRight: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
    category: "cereals-breakfast",
  },
  {
    id: "g-arr-5",
    title: "Oils & Ghee",
    imageLeft: require("@/assets/images/Home/saffola-gold-oil.png"),
    imageRight: require("@/assets/images/Home/daawat-basmati-rice.png"),
    category: "oil-ghee-masala",
  },
  {
    id: "g-arr-6",
    title: "Snacks",
    imageLeft: require("@/assets/images/Home/product-maggi.png"),
    imageRight: require("@/assets/images/Home/product-waiwai.png"),
    category: "snacks-noodles",
  },
];

// ==========================================
// 2. KIDS NEW ARRIVALS (2x3 Grid)
// ==========================================
const KIDS_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "k-arr-1",
    title: "Footwear",
    imageLeft: require("@/assets/images/Home/crochet-baby-booties.png"),
    imageRight: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "baby-shoes",
  },
  {
    id: "k-arr-2",
    title: "School Bags",
    imageLeft: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    imageRight: require("@/assets/images/Home/giraffe-kids-backpack.png"),
    category: "kids-backpacks",
  },
  {
    id: "k-arr-3",
    title: "Soft Toys",
    imageLeft: require("@/assets/images/Home/plush-bunny-toy.png"),
    imageRight: require("@/assets/images/Home/paw-patrol-figurines.png"),
    category: "soft-toys",
  },
  {
    id: "k-arr-4",
    title: "Baby Wear",
    imageLeft: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    imageRight: require("@/assets/images/Home/soft-baby-diaper.png"),
    category: "kids-outfits",
  },
  {
    id: "k-arr-5",
    title: "Diapers",
    imageLeft: require("@/assets/images/Home/molfix-baby-diaper.png"),
    imageRight: require("@/assets/images/Home/baby-wipes-pack.png"),
    category: "baby-diapers",
  },
  {
    id: "k-arr-6",
    title: "Learning",
    imageLeft: require("@/assets/images/Home/baby-rattles.png"),
    imageRight: require("@/assets/images/Home/wooden-toy-train.png"),
    category: "educational-toys",
  },
];

// ==========================================
// 3. GIFTING NEW ARRIVALS (2x3 Grid)
// ==========================================
const GIFTING_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "gift-arr-1",
    title: "Chocolates",
    imageLeft: require("@/assets/images/Home/prod-kitkat.png"),
    imageRight: require("@/assets/images/Home/prod-dairymilk.png"),
    category: "sweet-treats",
  },
  {
    id: "gift-arr-2",
    title: "Gift Hampers",
    imageLeft: require("@/assets/images/Home/gift-flower-bouquet.png"),
    imageRight: require("@/assets/images/Home/gift-basket-care.png"),
    category: "chocolate-gifts",
  },
  {
    id: "gift-arr-3",
    title: "Sweet Treats",
    imageLeft: require("@/assets/images/Home/prod-munch.png"),
    imageRight: require("@/assets/images/Home/prod-gems.png"),
    category: "sweet-treats",
  },
  {
    id: "gift-arr-4",
    title: "White Treat",
    imageLeft: require("@/assets/images/Home/prod-milkybar.png"),
    imageRight: require("@/assets/images/Home/prod-nutties.png"),
    category: "sweet-treats",
  },
  {
    id: "gift-arr-5",
    title: "Luxury Sets",
    imageLeft: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    imageRight: require("@/assets/images/Home/luxury-purple-perfume.png"),
    category: "gift-combos",
  },
  {
    id: "gift-arr-6",
    title: "Celebration",
    imageLeft: require("@/assets/images/Home/deals-product-combo.png"),
    imageRight: require("@/assets/images/Home/sweet-tooth-source.png"),
    category: "sweet-treats",
  },
];

// ==========================================
// 4. STATIONERY NEW ARRIVALS (2x3 Grid)
// ==========================================
const STATIONERY_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "stat-arr-1",
    title: "Backpacks",
    imageLeft: require("@/assets/images/Home/printed-school-backpack.png"),
    imageRight: require("@/assets/images/Home/giraffe-kids-backpack.png"),
    category: "school-backpacks",
  },
  {
    id: "stat-arr-2",
    title: "Writing Pens",
    imageLeft: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    imageRight: require("@/assets/images/Home/executive-fountain-pen.png"),
    category: "pens-writing",
  },
  {
    id: "stat-arr-3",
    title: "Bottles & Bags",
    imageLeft: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
    imageRight: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    category: "water-bottles",
  },
  {
    id: "stat-arr-4",
    title: "Art & Drawing",
    imageLeft: require("@/assets/images/Home/colored-pencils-row.png"),
    imageRight: require("@/assets/images/Home/stationery-pen-holder.png"),
    category: "art-craft",
  },
  {
    id: "stat-arr-5",
    title: "Paper & Notes",
    imageLeft: require("@/assets/images/Home/double-a-paper-reams.png"),
    imageRight: require("@/assets/images/Home/notebooks-sticky-notes.png"),
    category: "paper-notebooks",
  },
  {
    id: "stat-arr-6",
    title: "Office Files",
    imageLeft: require("@/assets/images/Home/office-folders-notebooks.jpg"),
    imageRight: require("@/assets/images/Home/office-document-clipboards.png"),
    category: "office-files",
  },
];

// ==========================================
// 5. BEAUTY NEW ARRIVALS (2x3 Grid)
// ==========================================
const BEAUTY_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "b-arr-1",
    title: "Skin Care",
    imageLeft: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
    imageRight: require("@/assets/images/Home/cosmetics-skincare-set.png"),
    category: "skin-care",
  },
  {
    id: "b-arr-2",
    title: "Oral Care",
    imageLeft: require("@/assets/images/Home/toothpaste-colgate.png"),
    imageRight: require("@/assets/images/Home/himalaya-baby-wash.png"),
    category: "oral-care",
  },
  {
    id: "b-arr-3",
    title: "Fragrance & Sets",
    imageLeft: require("@/assets/images/Home/luxury-purple-perfume.png"),
    imageRight: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    category: "bath-body",
  },
  {
    id: "b-arr-4",
    title: "Makeup & Blush",
    imageLeft: require("@/assets/images/Home/makeup-blush-compact.png"),
    imageRight: require("@/assets/images/Home/red-lipstick-tube.png"),
    category: "makeup",
  },
  {
    id: "b-arr-5",
    title: "Beauty Tools",
    imageLeft: require("@/assets/images/Home/makeup-powder-brush.png"),
    imageRight: require("@/assets/images/Home/makeup-brushes-art.png"),
    category: "makeup-tools",
  },
  {
    id: "b-arr-6",
    title: "Beauty Sets",
    imageLeft: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
    imageRight: require("@/assets/images/Home/beauty-skincare-makeup-layout.jpg"),
    category: "bath-body",
  },
];

// ==========================================
// 6. SNACKS NEW ARRIVALS (2x3 Grid)
// ==========================================
const SNACKS_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "sn-arr-1",
    title: "Noodles",
    imageLeft: require("@/assets/images/Home/product-waiwai.png"),
    imageRight: require("@/assets/images/Home/product-maggi.png"),
    category: "snacks-noodles",
  },
  {
    id: "sn-arr-2",
    title: "Spicy Bites",
    imageLeft: require("@/assets/images/Home/product-2pm.png"),
    imageRight: require("@/assets/images/Home/bacon-strips-meat.png"),
    category: "snacks-noodles",
  },
  {
    id: "sn-arr-3",
    title: "Cereals",
    imageLeft: require("@/assets/images/Home/cornflakes-hero.png"),
    imageRight: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
    category: "cereals-breakfast",
  },
  {
    id: "sn-arr-4",
    title: "Juices & Drinks",
    imageLeft: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    imageRight: require("@/assets/images/Home/slice-mango-juice.png"),
    category: "juices-beverages",
  },
  {
    id: "sn-arr-5",
    title: "Chocolates",
    imageLeft: require("@/assets/images/Home/prod-dairymilk.png"),
    imageRight: require("@/assets/images/Home/prod-kitkat.png"),
    category: "sweet-treats",
  },
  {
    id: "sn-arr-6",
    title: "Fruit & Treats",
    imageLeft: require("@/assets/images/Home/mixed-fresh-fruits-bowl.png"),
    imageRight: require("@/assets/images/Home/prod-nutties.png"),
    category: "fresh-fruits",
  },
];

const ARRIVALS_CATEGORY_MAP: Record<string, NewArrivalDuoCategory[]> = {
  grocery: GROCERY_ARRIVALS,
  kids: KIDS_ARRIVALS,
  baby: KIDS_ARRIVALS,
  gifting: GIFTING_ARRIVALS,
  gifts: GIFTING_ARRIVALS,
  gift: GIFTING_ARRIVALS,
  stationery: STATIONERY_ARRIVALS,
  school: STATIONERY_ARRIVALS,
  beauty: BEAUTY_ARRIVALS,
  snacks: SNACKS_ARRIVALS,
};

interface GroceryNewArrivalsProps {
  title?: string;
  category?: "grocery" | "kids" | "gifting" | "stationery" | "beauty" | "snacks" | string;
  items?: NewArrivalDuoCategory[];
  onCategoryPress?: (item: NewArrivalDuoCategory) => void;
}

export default function GroceryNewArrivals({
  title = "New Arrivals Await",
  category = "grocery",
  items,
  onCategoryPress,
}: GroceryNewArrivalsProps) {
  const displayItems =
    items || ARRIVALS_CATEGORY_MAP[category.toLowerCase()] || GROCERY_ARRIVALS;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.sectionTitle}>{title}</Text>

      {/* 2x3 Grid of Duo Category Cards */}
      <View style={styles.grid}>
        {displayItems.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.85}
            onPress={() => onCategoryPress?.(cat)}
            style={styles.card}
          >
            {/* Category Title */}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {cat.title}
            </Text>

            {/* Dual Product Tiles */}
            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Image
                  source={cat.imageLeft}
                  style={styles.tileImage}
                  contentFit="contain"
                  transition={150}
                />
              </View>
              <View style={styles.tile}>
                <Image
                  source={cat.imageRight}
                  style={styles.tileImage}
                  contentFit="contain"
                  transition={150}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING_H,
    marginVertical: moderateScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(12),
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(12),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#164E43",
    borderRadius: moderateScale(12),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(6),
    paddingHorizontal: scale(5),
    alignItems: "center",
    shadowColor: "#164E43",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: moderateScale(6),
    textAlign: "center",
    letterSpacing: 0.1,
  },
  tilesRow: {
    flexDirection: "row",
    gap: scale(4),
    width: "100%",
    justifyContent: "center",
  },
  tile: {
    flex: 1,
    height: moderateScale(48),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(2),
    overflow: "hidden",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
});

