import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING_H = scale(14);
const GAP = scale(10);
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - GAP * 2) / 3;

export interface NewArrivalDuoCategory {
  id: string;
  title: string;
  imageLeft: any;
  imageRight: any;
  category: string;
  subCategory?: string;
}

// ==========================================
// 1. ALL CATEGORIES NEW ARRIVALS (2x3 Grid)
// ==========================================
const ALL_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "all-arr-1",
    title: "Juices",
    imageLeft: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    imageRight: require("@/assets/images/Home/slice-mango-juice.png"),
    category: "juices-beverages",
    subCategory: "Juices & Drinks",
  },
  {
    id: "all-arr-2",
    title: "Skin Care",
    imageLeft: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
    imageRight: require("@/assets/images/Home/cosmetics-skincare-set.png"),
    category: "beauty",
    subCategory: "Skin & Faces",
  },
  {
    id: "all-arr-3",
    title: "Footwear",
    imageLeft: require("@/assets/images/Home/crochet-baby-booties.png"),
    imageRight: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "kids",
    subCategory: "Footwear",
  },
  {
    id: "all-arr-4",
    title: "Chocolates",
    imageLeft: require("@/assets/images/Home/prod-kitkat.png"),
    imageRight: require("@/assets/images/Home/prod-dairymilk.png"),
    category: "gifting",
    subCategory: "Chocolates",
  },
  {
    id: "all-arr-5",
    title: "Stationery",
    imageLeft: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    imageRight: require("@/assets/images/Home/executive-fountain-pen.png"),
    category: "stationery",
    subCategory: "Writing Essentials",
  },
  {
    id: "all-arr-6",
    title: "Snacks",
    imageLeft: require("@/assets/images/Home/product-maggi.png"),
    imageRight: require("@/assets/images/Home/product-waiwai.png"),
    category: "snacks",
    subCategory: "Instant Food",
  },
];

// ==========================================
// 2. GROCERY NEW ARRIVALS (2x3 Grid)
// ==========================================
const GROCERY_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "g-arr-1",
    title: "Juices",
    imageLeft: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    imageRight: require("@/assets/images/Home/slice-mango-juice.png"),
    category: "grocery",
    subCategory: "juices-beverages",
  },
  {
    id: "g-arr-2",
    title: "Hygiene",
    imageLeft: require("@/assets/images/Home/toothpaste-colgate.png"),
    imageRight: require("@/assets/images/Home/himalaya-baby-wash.png"),
    category: "grocery",
    subCategory: "personal-care",
  },
  {
    id: "g-arr-3",
    title: "Processed",
    imageLeft: require("@/assets/images/Home/bacon-strips-meat.png"),
    imageRight: require("@/assets/images/Home/fresh-meat-sausages-tray.png"),
    category: "grocery",
    subCategory: "meat-seafood",
  },
  {
    id: "g-arr-4",
    title: "Breakfast",
    imageLeft: require("@/assets/images/Home/cornflakes-hero.png"),
    imageRight: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
    category: "grocery",
    subCategory: "cereals-breakfast",
  },
  {
    id: "g-arr-5",
    title: "Oils & Ghee",
    imageLeft: require("@/assets/images/Home/saffola-gold-oil.png"),
    imageRight: require("@/assets/images/Home/daawat-basmati-rice.png"),
    category: "grocery",
    subCategory: "oil-ghee-masala",
  },
  {
    id: "g-arr-6",
    title: "Snacks",
    imageLeft: require("@/assets/images/Home/product-maggi.png"),
    imageRight: require("@/assets/images/Home/product-waiwai.png"),
    category: "grocery",
    subCategory: "snacks-noodles",
  },
];

// ==========================================
// 3. KIDS NEW ARRIVALS (2x3 Grid)
// ==========================================
const KIDS_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "k-arr-1",
    title: "Footwear",
    imageLeft: require("@/assets/images/Home/crochet-baby-booties.png"),
    imageRight: require("@/assets/images/Home/kids-playmat-shoes.png"),
    category: "kids",
    subCategory: "baby-shoes",
  },
  {
    id: "k-arr-2",
    title: "School Bags",
    imageLeft: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    imageRight: require("@/assets/images/Home/giraffe-kids-backpack.png"),
    category: "kids",
    subCategory: "kids-backpacks",
  },
  {
    id: "k-arr-3",
    title: "Soft Toys",
    imageLeft: require("@/assets/images/Home/plush-bunny-toy.png"),
    imageRight: require("@/assets/images/Home/paw-patrol-figurines.png"),
    category: "kids",
    subCategory: "soft-toys",
  },
  {
    id: "k-arr-4",
    title: "Baby Wear",
    imageLeft: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    imageRight: require("@/assets/images/Home/soft-baby-diaper.png"),
    category: "kids",
    subCategory: "kids-outfits",
  },
  {
    id: "k-arr-5",
    title: "Diapers",
    imageLeft: require("@/assets/images/Home/molfix-baby-diaper.png"),
    imageRight: require("@/assets/images/Home/baby-wipes-pack.png"),
    category: "kids",
    subCategory: "baby-diapers",
  },
  {
    id: "k-arr-6",
    title: "Learning",
    imageLeft: require("@/assets/images/Home/baby-rattles.png"),
    imageRight: require("@/assets/images/Home/wooden-toy-train.png"),
    category: "kids",
    subCategory: "educational-toys",
  },
];

// ==========================================
// 4. GIFTING NEW ARRIVALS (2x3 Grid)
// ==========================================
const GIFTING_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "gift-arr-1",
    title: "Chocolates",
    imageLeft: require("@/assets/images/Home/prod-kitkat.png"),
    imageRight: require("@/assets/images/Home/prod-dairymilk.png"),
    category: "gifting",
    subCategory: "sweet-treats",
  },
  {
    id: "gift-arr-2",
    title: "Gift Hampers",
    imageLeft: require("@/assets/images/Home/gift-flower-bouquet.png"),
    imageRight: require("@/assets/images/Home/gift-basket-care.png"),
    category: "gifting",
    subCategory: "chocolate-gifts",
  },
  {
    id: "gift-arr-3",
    title: "Sweet Treats",
    imageLeft: require("@/assets/images/Home/prod-munch.png"),
    imageRight: require("@/assets/images/Home/prod-gems.png"),
    category: "gifting",
    subCategory: "sweet-treats",
  },
  {
    id: "gift-arr-4",
    title: "White Treat",
    imageLeft: require("@/assets/images/Home/prod-milkybar.png"),
    imageRight: require("@/assets/images/Home/prod-nutties.png"),
    category: "gifting",
    subCategory: "sweet-treats",
  },
  {
    id: "gift-arr-5",
    title: "Luxury Sets",
    imageLeft: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    imageRight: require("@/assets/images/Home/luxury-purple-perfume.png"),
    category: "gifting",
    subCategory: "gift-combos",
  },
  {
    id: "gift-arr-6",
    title: "Celebration",
    imageLeft: require("@/assets/images/Home/deals-product-combo.png"),
    imageRight: require("@/assets/images/Home/sweet-tooth-source.png"),
    category: "gifting",
    subCategory: "sweet-treats",
  },
];

// ==========================================
// 5. STATIONERY NEW ARRIVALS (2x3 Grid)
// ==========================================
const STATIONERY_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "stat-arr-1",
    title: "Backpacks",
    imageLeft: require("@/assets/images/Home/printed-school-backpack.png"),
    imageRight: require("@/assets/images/Home/giraffe-kids-backpack.png"),
    category: "stationery",
    subCategory: "school-backpacks",
  },
  {
    id: "stat-arr-2",
    title: "Writing Pens",
    imageLeft: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    imageRight: require("@/assets/images/Home/executive-fountain-pen.png"),
    category: "stationery",
    subCategory: "pens-writing",
  },
  {
    id: "stat-arr-3",
    title: "Bottles & Bags",
    imageLeft: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
    imageRight: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    category: "stationery",
    subCategory: "water-bottles",
  },
  {
    id: "stat-arr-4",
    title: "Art & Drawing",
    imageLeft: require("@/assets/images/Home/colored-pencils-row.png"),
    imageRight: require("@/assets/images/Home/stationery-pen-holder.png"),
    category: "stationery",
    subCategory: "art-craft",
  },
  {
    id: "stat-arr-5",
    title: "Paper & Notes",
    imageLeft: require("@/assets/images/Home/double-a-paper-reams.png"),
    imageRight: require("@/assets/images/Home/notebooks-sticky-notes.png"),
    category: "stationery",
    subCategory: "paper-notebooks",
  },
  {
    id: "stat-arr-6",
    title: "Office Files",
    imageLeft: require("@/assets/images/Home/office-folders-notebooks.jpg"),
    imageRight: require("@/assets/images/Home/office-document-clipboards.png"),
    category: "stationery",
    subCategory: "office-files",
  },
];

// ==========================================
// 6. BEAUTY NEW ARRIVALS (2x3 Grid)
// ==========================================
const BEAUTY_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "b-arr-1",
    title: "Skin Care",
    imageLeft: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
    imageRight: require("@/assets/images/Home/cosmetics-skincare-set.png"),
    category: "beauty",
    subCategory: "skin-care",
  },
  {
    id: "b-arr-2",
    title: "Oral Care",
    imageLeft: require("@/assets/images/Home/toothpaste-colgate.png"),
    imageRight: require("@/assets/images/Home/himalaya-baby-wash.png"),
    category: "beauty",
    subCategory: "oral-care",
  },
  {
    id: "b-arr-3",
    title: "Fragrance & Sets",
    imageLeft: require("@/assets/images/Home/luxury-purple-perfume.png"),
    imageRight: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    category: "beauty",
    subCategory: "bath-body",
  },
  {
    id: "b-arr-4",
    title: "Makeup & Blush",
    imageLeft: require("@/assets/images/Home/makeup-blush-compact.png"),
    imageRight: require("@/assets/images/Home/red-lipstick-tube.png"),
    category: "beauty",
    subCategory: "makeup",
  },
  {
    id: "b-arr-5",
    title: "Beauty Tools",
    imageLeft: require("@/assets/images/Home/makeup-powder-brush.png"),
    imageRight: require("@/assets/images/Home/makeup-brushes-art.png"),
    category: "beauty",
    subCategory: "makeup-tools",
  },
  {
    id: "b-arr-6",
    title: "Beauty Sets",
    imageLeft: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
    imageRight: require("@/assets/images/Home/beauty-skincare-makeup-layout.jpg"),
    category: "beauty",
    subCategory: "bath-body",
  },
];

// ==========================================
// 7. SNACKS NEW ARRIVALS (2x3 Grid)
// ==========================================
const SNACKS_ARRIVALS: NewArrivalDuoCategory[] = [
  {
    id: "sn-arr-1",
    title: "Noodles",
    imageLeft: require("@/assets/images/Home/product-waiwai.png"),
    imageRight: require("@/assets/images/Home/product-maggi.png"),
    category: "snacks",
    subCategory: "snacks-noodles",
  },
  {
    id: "sn-arr-2",
    title: "Spicy Bites",
    imageLeft: require("@/assets/images/Home/product-2pm.png"),
    imageRight: require("@/assets/images/Home/bacon-strips-meat.png"),
    category: "snacks",
    subCategory: "snacks-noodles",
  },
  {
    id: "sn-arr-3",
    title: "Cereals",
    imageLeft: require("@/assets/images/Home/cornflakes-hero.png"),
    imageRight: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
    category: "snacks",
    subCategory: "cereals-breakfast",
  },
  {
    id: "sn-arr-4",
    title: "Juices & Drinks",
    imageLeft: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    imageRight: require("@/assets/images/Home/slice-mango-juice.png"),
    category: "snacks",
    subCategory: "juices-beverages",
  },
  {
    id: "sn-arr-5",
    title: "Chocolates",
    imageLeft: require("@/assets/images/Home/prod-dairymilk.png"),
    imageRight: require("@/assets/images/Home/prod-kitkat.png"),
    category: "snacks",
    subCategory: "sweet-treats",
  },
  {
    id: "sn-arr-6",
    title: "Fruit & Treats",
    imageLeft: require("@/assets/images/Home/mixed-fresh-fruits-bowl.png"),
    imageRight: require("@/assets/images/Home/prod-nutties.png"),
    category: "snacks",
    subCategory: "fresh-fruits",
  },
];

const ARRIVALS_CATEGORY_MAP: Record<string, NewArrivalDuoCategory[]> = {
  all: ALL_ARRIVALS,
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

// ── Animated Skeleton Duo Card Component ─────────────────────────────
function NewArrivalCardSkeleton({ animOpacity }: { animOpacity: Animated.Value }) {
  return (
    <View style={styles.card}>
      {/* Title skeleton */}
      <Animated.View
        style={[
          styles.skeletonBlock,
          {
            width: scale(58),
            height: scale(13),
            borderRadius: scale(4),
            marginBottom: moderateScale(8),
            opacity: animOpacity,
          },
        ]}
      />

      {/* Dual Tile Skeletons */}
      <View style={styles.tilesRow}>
        <Animated.View
          style={[
            styles.tile,
            styles.skeletonBlock,
            { opacity: animOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.tile,
            styles.skeletonBlock,
            { opacity: animOpacity },
          ]}
        />
      </View>
    </View>
  );
}

interface GroceryNewArrivalsProps {
  title?: string;
  category?: "all" | "grocery" | "kids" | "gifting" | "stationery" | "beauty" | "snacks" | string;
  items?: NewArrivalDuoCategory[];
  onCategoryPress?: (item: NewArrivalDuoCategory) => void;
  onSeeAllPress?: () => void;
}

export default function GroceryNewArrivals({
  title = "New Arrivals Await",
  category: propCategory,
  items,
  onCategoryPress,
  onSeeAllPress,
}: GroceryNewArrivalsProps) {
  const router = useRouter();
  const theme = useTheme();
  const { publicProducts, publicLoading, selectedCategory: reduxCategory } =
    useAppSelector((state) => state.product);

  const activeCategory = (propCategory || reduxCategory || "all").toLowerCase().trim();

  // Pulse animation for loading skeletons
  const pulseAnim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
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

  // Compute dynamic new arrival duo cards from MongoDB backend products
  const displayItems = useMemo<NewArrivalDuoCategory[]>(() => {
    if (items && items.length > 0) return items;

    const fallbackList =
      ARRIVALS_CATEGORY_MAP[activeCategory] || ARRIVALS_CATEGORY_MAP.all;

    if (!publicProducts || publicProducts.length === 0) {
      return fallbackList;
    }

    // 1. Filter products where isNewArrival === true (or tags contain 'new' / recently created)
    let newArrivals = publicProducts.filter(
      (p) =>
        p.visibility?.isNewArrival === true ||
        p.tags?.some((t) => t.toLowerCase().includes("new"))
    );

    // If no explicit isNewArrival flag set on backend, fallback to all available products
    if (newArrivals.length === 0) {
      newArrivals = publicProducts;
    }

    // 2. Filter by Category
    if (activeCategory !== "all") {
      newArrivals = newArrivals.filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        const pSub = (p.subCategory || "").toLowerCase();
        return pCat.includes(activeCategory) || pSub.includes(activeCategory);
      });
    }

    // If category has no specific new arrivals, use category fallback
    if (newArrivals.length === 0) {
      return fallbackList;
    }

    // 3. Group into 6 Duo Cards
    const groupedMap: Record<string, any[]> = {};
    newArrivals.forEach((prod) => {
      const groupKey =
        prod.subCategory || prod.category || (activeCategory === "all" ? "Picks" : "Items");
      if (!groupedMap[groupKey]) {
        groupedMap[groupKey] = [];
      }
      groupedMap[groupKey].push(prod);
    });

    const groupKeys = Object.keys(groupedMap);
    const dynamicCards: NewArrivalDuoCategory[] = [];

    // Map each group into duo cards
    groupKeys.forEach((key, idx) => {
      const prodsInGroup = groupedMap[key];
      const p1 = prodsInGroup[0];
      const p2 = prodsInGroup[1] || prodsInGroup[0];

      const img1 =
        p1?.images && p1.images.length > 0
          ? { uri: p1.images[0].url }
          : fallbackList[idx % fallbackList.length]?.imageLeft;

      const img2 =
        p2?.images && p2.images.length > 0
          ? { uri: p2.images[0].url }
          : fallbackList[idx % fallbackList.length]?.imageRight;

      dynamicCards.push({
        id: `dyn-new-arr-${idx}-${key}`,
        title: key.length > 12 ? key.slice(0, 11) + ".." : key,
        imageLeft: img1,
        imageRight: img2,
        category: p1?.category || activeCategory,
        subCategory: key,
      });
    });

    // If we have fewer than 6 duo cards, complement from fallbackList to maintain a perfect 2x3 grid
    if (dynamicCards.length < 6) {
      const needed = 6 - dynamicCards.length;
      const complements = fallbackList.slice(0, needed);
      return [...dynamicCards, ...complements].slice(0, 6);
    }

    return dynamicCards.slice(0, 6);
  }, [items, activeCategory, publicProducts]);

  const handleSeeAll = () => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: "New Arrivals",
          filter: "new_arrival",
          category: activeCategory !== "all" ? activeCategory : undefined,
        },
      });
    }
  };

  // ── 1. Skeleton Loading View ─────────────────────────────────
  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        {/* Section Header Skeleton */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Animated.View
              style={[
                styles.skeletonBlock,
                {
                  width: scale(160),
                  height: scale(20),
                  borderRadius: scale(4),
                  opacity: pulseAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBlock,
                {
                  width: scale(190),
                  height: scale(12),
                  marginTop: scale(5),
                  borderRadius: scale(3),
                  opacity: pulseAnim,
                },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.skeletonBlock,
              {
                width: scale(50),
                height: scale(16),
                borderRadius: scale(4),
                opacity: pulseAnim,
              },
            ]}
          />
        </View>

        {/* 2x3 Skeleton Grid */}
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((skelId) => (
            <NewArrivalCardSkeleton
              key={`new-arr-skel-${skelId}`}
              animOpacity={pulseAnim}
            />
          ))}
        </View>
      </View>
    );
  }

  // ── 2. Live Data View ────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.badgeTitleRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <View style={styles.sparkleBadge}>
              <Text style={styles.sparkleBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            {activeCategory === "all"
              ? "Freshly cataloged essentials across all aisles"
              : `Latest arrivals in ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSeeAll}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
            See all
          </Text>
          <Ionicons
            name="chevron-forward"
            size={scale(13)}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* 2x3 Grid of Duo Category Cards */}
      <View style={styles.grid}>
        {displayItems.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.88}
            onPress={() => onCategoryPress?.(cat)}
            style={styles.card}
          >
            {/* Category Title */}
            <View style={styles.titleWrapper}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {cat.title}
              </Text>
            </View>

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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  titleContainer: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(17.5),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sparkleBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(5.5),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
    borderWidth: 0.8,
    borderColor: "#86EFAC",
  },
  sparkleBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#166534",
    letterSpacing: 0.4,
  },
  sectionSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(2),
    fontWeight: "500",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: scale(2),
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    marginRight: scale(1),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(10),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#134E43",
    borderRadius: moderateScale(14),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(7),
    paddingHorizontal: scale(6),
    alignItems: "center",
    shadowColor: "#064E3B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  titleWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: moderateScale(6),
  },
  cardTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  tilesRow: {
    flexDirection: "row",
    gap: scale(4.5),
    width: "100%",
    justifyContent: "center",
  },
  tile: {
    flex: 1,
    height: moderateScale(50),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(2),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1.5,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});



