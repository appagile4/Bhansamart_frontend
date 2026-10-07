import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export { DealProduct };

interface TopDealsProps {
  title?: string;
  category?: string;
  isDoubleRow?: boolean;
  showBanner?: boolean;
  items?: DealProduct[];
  onProductPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
  onSeeAllPress?: () => void;
}

// ── Animated Skeleton Card for Top Deals ─────────────────────────────
function TopDealCardSkeleton({ animOpacity }: { animOpacity: Animated.Value }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const dynamicWidth =
    windowWidth >= 768
      ? Math.min(Math.round(windowWidth * 0.2), 175)
      : windowWidth < 360
      ? Math.round(windowWidth * 0.42)
      : Math.min(Math.max(Math.round(windowWidth * 0.38), 138), 158);

  const dynamicImageHeight = Math.min(
    Math.max(Math.round(dynamicWidth * 0.7), scale(95)),
    Math.round(windowHeight * 0.17)
  );

  return (
    <View style={[styles.cardContainer, { width: dynamicWidth }]}>
      {/* Top Image Box Skeleton */}
      <Animated.View
        style={[
          styles.cardImageWrapper,
          styles.skeletonBlock,
          { height: dynamicImageHeight, opacity: animOpacity },
        ]}
      />

      {/* Details Container Skeleton */}
      <View style={styles.cardDetails}>
        {/* Title Skeleton Lines */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "85%", height: scale(14), marginBottom: scale(5), opacity: animOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "55%", height: scale(11), marginBottom: scale(7), opacity: animOpacity },
          ]}
        />

        {/* Rating & Veg Badge Row Skeleton */}
        <View style={styles.metaRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(65), height: scale(12), opacity: animOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              { width: scale(45), height: scale(16), borderRadius: scale(8), opacity: animOpacity },
            ]}
          />
        </View>

        {/* Price Row Skeleton */}
        <View style={styles.priceRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(55), height: scale(18), opacity: animOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(38), height: scale(12), opacity: animOpacity },
            ]}
          />
        </View>

        {/* Trust Badges Skeleton */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            { width: "100%", height: scale(22), borderRadius: scale(5), marginVertical: scale(6), opacity: animOpacity },
          ]}
        />

        {/* Add to Cart Button Skeleton */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.addToCartBtnSkeleton,
            { opacity: animOpacity },
          ]}
        />
      </View>
    </View>
  );
}

// ── Curated High Quality Fallback Deals by Domain ─────────────────────
const DEFAULT_CREAMY_DEALS: DealProduct[] = [
  {
    id: "swiss-cheese-1",
    weight: "200 g",
    category: "Dairy & Breakfast",
    subCategory: "Cheese & Butter",
    name: "Amul Fresh Swiss Cheese Block, Rich & Creamy",
    rating: 4.8,
    reviewsCount: 145,
    price: 180,
    originalPrice: 240,
    discountPct: 25,
    ordersCount: 320,
    isVeg: true,
    image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
  },
  {
    id: "saffola-butter-1",
    weight: "500 g",
    category: "Dairy & Breakfast",
    subCategory: "Butter & Spreads",
    name: "Amul Pasteurized Salted Butter Delicious Spread",
    rating: 4.9,
    reviewsCount: 420,
    price: 275,
    originalPrice: 310,
    discountPct: 11,
    ordersCount: 580,
    isVeg: true,
    image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
  },
  {
    id: "fresh-paneer-1",
    weight: "200 g",
    category: "Dairy & Breakfast",
    subCategory: "Paneer & Curd",
    name: "Mother Dairy Malai Fresh Paneer Cube Pack",
    rating: 4.7,
    reviewsCount: 198,
    price: 95,
    originalPrice: 120,
    discountPct: 21,
    ordersCount: 410,
    isVeg: true,
    image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
  },
  {
    id: "fresh-cream-1",
    weight: "250 ml",
    category: "Dairy & Breakfast",
    subCategory: "Cream & Milk",
    name: "Amul Fresh Low Fat Cream Carton Pack",
    rating: 4.8,
    reviewsCount: 164,
    price: 65,
    originalPrice: 85,
    discountPct: 24,
    ordersCount: 290,
    isVeg: true,
    image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
  },
];

const DEFAULT_GROCERY_DEALS: DealProduct[] = [
  {
    id: "daawat-rice-1",
    weight: "1 kg",
    category: "Grocery & Kitchen",
    subCategory: "Rice & Grains",
    name: "Daawat Traditional Basmati Rice Long Grain",
    rating: 4.8,
    reviewsCount: 380,
    price: 195,
    originalPrice: 260,
    discountPct: 25,
    ordersCount: 650,
    isVeg: true,
    image: require("@/assets/images/Home/daawat-basmati-rice.png"),
  },
  {
    id: "saffola-oil-1",
    weight: "1 L",
    category: "Grocery & Kitchen",
    subCategory: "Cooking Oil & Ghee",
    name: "Saffola Gold Pro Healthy Blend Refined Cooking Oil",
    rating: 4.9,
    reviewsCount: 512,
    price: 165,
    originalPrice: 210,
    discountPct: 21,
    ordersCount: 780,
    isVeg: true,
    image: require("@/assets/images/Home/saffola-gold-oil.png"),
  },
  {
    id: "fresh-cauli-1",
    weight: "1 pc",
    category: "Grocery & Kitchen",
    subCategory: "Fresh Farm Veggies",
    name: "Farm Fresh Crisp Cauliflower Handpicked",
    rating: 4.6,
    reviewsCount: 130,
    price: 45,
    originalPrice: 65,
    discountPct: 31,
    ordersCount: 310,
    isVeg: true,
    image: require("@/assets/images/Home/fresh-cauliflower.png"),
  },
  {
    id: "rice-grains-1",
    weight: "5 kg",
    category: "Grocery & Kitchen",
    subCategory: "Atta, Rice & Dal",
    name: "Fortune Everyday Super Basmati Rice Value Pack",
    rating: 4.7,
    reviewsCount: 290,
    price: 340,
    originalPrice: 450,
    discountPct: 24,
    ordersCount: 420,
    isVeg: true,
    image: require("@/assets/images/Home/rice-grains-package.png"),
  },
];

const DEFAULT_SNACK_DEALS: DealProduct[] = [
  {
    id: "maggi-deal-1",
    weight: "280 g",
    category: "Snacks & Drinks",
    subCategory: "Noodles & Pasta",
    name: "Maggi Masala 2-Minute Instant Noodles 4-Pack",
    rating: 4.8,
    reviewsCount: 450,
    price: 55,
    originalPrice: 60,
    discountPct: 8,
    ordersCount: 920,
    isVeg: true,
    image: require("@/assets/images/Home/product-maggi.png"),
  },
  {
    id: "cornflakes-deal-1",
    weight: "475 g",
    category: "Snacks & Drinks",
    subCategory: "Breakfast Cereals",
    name: "Kellogg's Real Almond & Honey Corn Flakes Box",
    rating: 4.7,
    reviewsCount: 220,
    price: 240,
    originalPrice: 320,
    discountPct: 25,
    ordersCount: 340,
    isVeg: true,
    image: require("@/assets/images/Home/cornflakes-hero.png"),
  },
  {
    id: "waiwai-deal-1",
    weight: "350 g",
    category: "Snacks & Drinks",
    subCategory: "Instant Food",
    name: "Wai Wai Quick Masala Delight Instant Noodles",
    rating: 4.6,
    reviewsCount: 310,
    price: 90,
    originalPrice: 120,
    discountPct: 25,
    ordersCount: 540,
    isVeg: true,
    image: require("@/assets/images/Home/product-waiwai.png"),
  },
];

const DEFAULT_BEAUTY_DEALS: DealProduct[] = [
  {
    id: "beauty-cream-1",
    weight: "50 g",
    category: "Beauty & Personal Care",
    subCategory: "Skincare",
    name: "Hydrating Day & Night Face Glow Cream",
    rating: 4.8,
    reviewsCount: 320,
    price: 349,
    originalPrice: 499,
    discountPct: 30,
    ordersCount: 650,
    image: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
  },
  {
    id: "beauty-perfume-1",
    weight: "100 ml",
    category: "Beauty & Personal Care",
    subCategory: "Fragrances",
    name: "Luxury Purple Eau De Parfum Long Lasting",
    rating: 4.9,
    reviewsCount: 410,
    price: 799,
    originalPrice: 1299,
    discountPct: 38,
    ordersCount: 820,
    image: require("@/assets/images/Home/luxury-purple-perfume.png"),
  },
  {
    id: "beauty-makeup-1",
    weight: "15 g",
    category: "Beauty & Personal Care",
    subCategory: "Cosmetics",
    name: "Velvet Matte Compact Powder & Blush",
    rating: 4.7,
    reviewsCount: 280,
    price: 299,
    originalPrice: 450,
    discountPct: 33,
    ordersCount: 490,
    image: require("@/assets/images/Home/makeup-blush-compact.png"),
  },
];

const DEFAULT_STATIONERY_DEALS: DealProduct[] = [
  {
    id: "stat-pen-1",
    weight: "1 pc",
    category: "Stationery",
    subCategory: "Pens & Writing",
    name: "Executive Gold Trim Fountain Pen",
    rating: 4.9,
    reviewsCount: 260,
    price: 199,
    originalPrice: 299,
    discountPct: 33,
    ordersCount: 580,
    image: require("@/assets/images/Home/executive-fountain-pen.png"),
  },
  {
    id: "stat-pencils-1",
    weight: "24 shades",
    category: "Stationery",
    subCategory: "Art & Craft",
    name: "Premium Soft Lead Colored Pencils Set",
    rating: 4.8,
    reviewsCount: 340,
    price: 249,
    originalPrice: 350,
    discountPct: 29,
    ordersCount: 620,
    image: require("@/assets/images/Home/colored-pencils-row.png"),
  },
  {
    id: "stat-notes-1",
    weight: "300 sheets",
    category: "Stationery",
    subCategory: "Notebooks & Paper",
    name: "Pastel Sticky Notes & Spiral Notepad Combo",
    rating: 4.7,
    reviewsCount: 190,
    price: 149,
    originalPrice: 220,
    discountPct: 32,
    ordersCount: 430,
    image: require("@/assets/images/Home/notebooks-sticky-notes.png"),
  },
];

const DEFAULT_KIDS_DEALS: DealProduct[] = [
  {
    id: "kids-bag-1",
    weight: "1 pc",
    category: "Kids & Toys",
    subCategory: "School Bags",
    name: "Pink Cartoon Cute School Backpack",
    rating: 4.9,
    reviewsCount: 450,
    price: 499,
    originalPrice: 799,
    discountPct: 38,
    ordersCount: 780,
    image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
  },
  {
    id: "kids-toy-1",
    weight: "1 pc",
    category: "Kids & Toys",
    subCategory: "Soft Toys",
    name: "Super Soft Plush Bunny Toy for Kids",
    rating: 4.8,
    reviewsCount: 310,
    price: 349,
    originalPrice: 550,
    discountPct: 37,
    ordersCount: 620,
    image: require("@/assets/images/Home/plush-bunny-toy.png"),
  },
  {
    id: "kids-bottle-1",
    weight: "600 ml",
    category: "Kids & Toys",
    subCategory: "Bottles & Sippers",
    name: "BPA-Free Kids Sipper Water Bottle",
    rating: 4.7,
    reviewsCount: 220,
    price: 199,
    originalPrice: 299,
    discountPct: 33,
    ordersCount: 510,
    image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
  },
];

const DEFAULT_GIFTING_DEALS: DealProduct[] = [
  {
    id: "gift-hamper-1",
    weight: "1 hamper",
    category: "Gifting",
    subCategory: "Gift Hampers",
    name: "Luxury Celebration Gift Hamper Basket",
    rating: 4.9,
    reviewsCount: 520,
    price: 899,
    originalPrice: 1499,
    discountPct: 40,
    ordersCount: 940,
    image: require("@/assets/images/Home/gift-basket-care.png"),
  },
  {
    id: "gift-flowers-1",
    weight: "1 bouquet",
    category: "Gifting",
    subCategory: "Flowers & Cards",
    name: "Fresh Red Rose Flower Bouquet Arrangement",
    rating: 4.8,
    reviewsCount: 380,
    price: 499,
    originalPrice: 750,
    discountPct: 33,
    ordersCount: 690,
    image: require("@/assets/images/Home/gift-flower-bouquet.png"),
  },
  {
    id: "gift-choc-1",
    weight: "350 g",
    category: "Gifting",
    subCategory: "Chocolates",
    name: "Cadbury Dairy Milk Celebrations Gift Box",
    rating: 4.9,
    reviewsCount: 670,
    price: 350,
    originalPrice: 500,
    discountPct: 30,
    ordersCount: 1120,
    image: require("@/assets/images/Home/prod-dairymilk.png"),
  },
];

export default function TopDeals({
  title = "Top Deals & Trending Picks",
  category = "grocery",
  isDoubleRow = true,
  showBanner = true,
  items,
  onProductPress,
  onAddPress,
  onSeeMorePress,
  onSeeAllPress,
}: TopDealsProps) {
  const router = useRouter();
  const theme = useTheme();
  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product
  );

  // Smooth Pulse Animation for Skeletons
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

  // Live Products Mapping & Filtering from MongoDB
  const displayItems = useMemo(() => {
    // 1. If explicit items prop is passed
    if (items && items.length > 0) {
      return items;
    }

    const titleLower = (title || "").toLowerCase();
    const catLower = (category || "").toLowerCase();

    // 2. Map from live MongoDB publicProducts
    if (publicProducts && publicProducts.length > 0) {
      const allDeals = publicProducts.map((p) => {
        const curPrice = p.price || 0;
        const origPrice =
          p.originalPrice && p.originalPrice > curPrice
            ? p.originalPrice
            : p.discountValue && p.discountValue > 0
            ? Math.round(curPrice / (1 - p.discountValue / 100))
            : curPrice;

        const calculatedDisc =
          origPrice > curPrice
            ? Math.round(((origPrice - curPrice) / origPrice) * 100)
            : 0;

        const discountPct = Math.max(
          p.discountValue ? Number(p.discountValue) : 0,
          calculatedDisc
        );

        const ordersCount =
          p.ordersCount ?? (p.metrics?.orders ?? p.ratingsCount ?? 110);

        const imgUrl =
          p.images && p.images.length > 0
            ? p.images[0].url
            : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80";

        return {
          id: p._id || p.id || String(Math.random()),
          name: p.name,
          weight: p.unit || "1 unit",
          category: p.category || "Grocery",
          subCategory: p.subCategory || "",
          rating: p.ratingsAverage || 4.5,
          reviewsCount: p.ratingsCount || 45,
          price: curPrice,
          originalPrice: origPrice > curPrice ? origPrice : curPrice,
          image: { uri: imgUrl },
          discountPct,
          ordersCount,
          isVeg: true,
          tags: p.tags || [],
        };
      });

      // A. Creamy Delights specific filter (Dairy, Butter, Cheese, Milk, Paneer, Cream, Ghee, Yogurt)
      if (titleLower.includes("creamy") || catLower.includes("creamy")) {
        const creamyMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          return (
            text.includes("cream") ||
            text.includes("butter") ||
            text.includes("cheese") ||
            text.includes("paneer") ||
            text.includes("milk") ||
            text.includes("curd") ||
            text.includes("yogurt") ||
            text.includes("ghee") ||
            text.includes("dairy") ||
            text.includes("mayo") ||
            text.includes("lassi") ||
            text.includes("spread") ||
            text.includes("condensed")
          );
        });

        if (creamyMatches.length > 0) {
          return creamyMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_CREAMY_DEALS;
      }

      // B. Grocery & Kitchen Filter
      if (catLower === "grocery" || catLower === "grocery-kitchen" || catLower === "groceries") {
        const groceryMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          const isNonGrocery =
            text.includes("stationery") ||
            text.includes("notebook") ||
            text.includes("pen") ||
            text.includes("pencil") ||
            text.includes("lipstick") ||
            text.includes("makeup") ||
            text.includes("skincare") ||
            text.includes("diaper") ||
            text.includes("toy");

          const isGrocery =
            text.includes("grocery") ||
            text.includes("kitchen") ||
            text.includes("food") ||
            text.includes("dairy") ||
            text.includes("rice") ||
            text.includes("atta") ||
            text.includes("flour") ||
            text.includes("oil") ||
            text.includes("ghee") ||
            text.includes("dal") ||
            text.includes("pulse") ||
            text.includes("spice") ||
            text.includes("masala") ||
            text.includes("salt") ||
            text.includes("sugar") ||
            text.includes("tea") ||
            text.includes("coffee") ||
            text.includes("grain") ||
            text.includes("staple") ||
            text.includes("noodle") ||
            text.includes("pasta") ||
            text.includes("paneer") ||
            text.includes("butter") ||
            text.includes("cheese") ||
            text.includes("veg") ||
            text.includes("fruit");

          return isGrocery && !isNonGrocery;
        });

        if (groceryMatches.length > 0) {
          return groceryMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_GROCERY_DEALS;
      }

      // C. Snacks Filter
      if (catLower === "snacks" || catLower === "snacks-drinks") {
        const snackMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          return (
            text.includes("snack") ||
            text.includes("chip") ||
            text.includes("biscuit") ||
            text.includes("cookie") ||
            text.includes("namkeen") ||
            text.includes("drink") ||
            text.includes("juice") ||
            text.includes("cereal") ||
            text.includes("noodle")
          );
        });
        if (snackMatches.length > 0) {
          return snackMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_SNACK_DEALS;
      }

      // D. Beauty Filter
      if (catLower === "beauty" || catLower === "beauty-personal-care") {
        const beautyMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          return (
            text.includes("beauty") ||
            text.includes("skin") ||
            text.includes("care") ||
            text.includes("hair") ||
            text.includes("shampoo") ||
            text.includes("lotion") ||
            text.includes("cream") ||
            text.includes("soap") ||
            text.includes("wash")
          );
        });
        if (beautyMatches.length > 0) {
          return beautyMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_BEAUTY_DEALS;
      }

      // E. Stationery Filter
      if (catLower === "stationery" || catLower === "office-stationery") {
        const statMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          return (
            text.includes("stationery") ||
            text.includes("office") ||
            text.includes("school") ||
            text.includes("pen") ||
            text.includes("pencil") ||
            text.includes("notebook") ||
            text.includes("paper")
          );
        });
        if (statMatches.length > 0) {
          return statMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_STATIONERY_DEALS;
      }

      // F. Baby & Kids Filter
      if (catLower === "baby" || catLower === "kids" || catLower === "baby-kids") {
        const kidsMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          return (
            text.includes("kid") ||
            text.includes("baby") ||
            text.includes("toy") ||
            text.includes("diaper") ||
            text.includes("wipe")
          );
        });
        if (kidsMatches.length > 0) {
          return kidsMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_KIDS_DEALS;
      }

      // G. Gifting Filter
      if (catLower === "gifting" || catLower === "gifts") {
        const giftMatches = allDeals.filter((p) => {
          const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
          return (
            text.includes("gift") ||
            text.includes("hamper") ||
            text.includes("combo") ||
            text.includes("chocolate") ||
            text.includes("flower") ||
            text.includes("sweet") ||
            text.includes("men") ||
            text.includes("women") ||
            text.includes("dress") ||
            text.includes("electronic") ||
            text.includes("toy")
          );
        });
        if (giftMatches.length > 0) {
          return giftMatches.sort(
            (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
          );
        }
        return DEFAULT_GIFTING_DEALS;
      }

      // H. Default Top Deals
      const matchedDeals = allDeals.filter(
        (p) => p.discountPct >= 15 && p.ordersCount > 50
      );

      if (matchedDeals.length > 0) {
        return matchedDeals.sort(
          (a, b) => b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
        );
      }

      return allDeals
        .sort(
          (a, b) =>
            b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
        )
        .slice(0, 12);
    }

    // Fallback if no publicProducts loaded yet
    if (titleLower.includes("creamy") || catLower.includes("creamy")) {
      return DEFAULT_CREAMY_DEALS;
    }
    if (catLower === "grocery" || catLower === "grocery-kitchen") {
      return DEFAULT_GROCERY_DEALS;
    }
    if (catLower === "snacks") {
      return DEFAULT_SNACK_DEALS;
    }
    if (catLower === "beauty" || catLower === "beauty-personal-care") {
      return DEFAULT_BEAUTY_DEALS;
    }
    if (catLower === "stationery" || catLower === "office-stationery") {
      return DEFAULT_STATIONERY_DEALS;
    }
    if (catLower === "baby" || catLower === "kids" || catLower === "baby-kids") {
      return DEFAULT_KIDS_DEALS;
    }
    if (catLower === "gifting" || catLower === "gifts") {
      return DEFAULT_GIFTING_DEALS;
    }

    return DEFAULT_GROCERY_DEALS;
  }, [items, publicProducts, category, title]);

  const allItems = displayItems;

  // Extract up to 3 real live thumbnails for the bottom "See all products" banner
  const previewThumbnails = useMemo(() => {
    if (allItems && allItems.length > 0) {
      return allItems.slice(0, 3).map((p: DealProduct) => p.image);
    }
    return [
      require("@/assets/images/Home/product-maggi.png"),
      require("@/assets/images/Home/product-waiwai.png"),
      require("@/assets/images/Home/product-2pm.png"),
    ];
  }, [allItems]);

  // Chunk items into columns (supports double-row or single-row carousel)
  const columns: DealProduct[][] = [];
  if (isDoubleRow) {
    for (let i = 0; i < allItems.length; i += 2) {
      columns.push(allItems.slice(i, i + 2));
    }
  } else {
    allItems.forEach((item: DealProduct) => columns.push([item]));
  }

  const handleSeeAll = () => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: title || "Top Deals & Trending Picks",
          filter: "trending",
          minDiscount: "50",
        },
      });
    }
  };

  const handleProductPress = (product: DealProduct) => {
    if (onProductPress) {
      onProductPress(product);
    } else {
      router.push({
        pathname: "/Screens/Product/productdetailscreen" as any,
        params: {
          id: product.id,
          name: product.name,
          weight: product.weight,
          price: String(product.price),
          originalPrice: String(product.originalPrice || product.price),
          category: product.category,
          subCategory: product.subCategory,
          image:
            typeof product.image === "object" && "uri" in product.image
              ? (product.image as any).uri
              : "",
        },
      });
    }
  };

  // ── 1. Skeleton Loading View ─────────────────────────────────
  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    const skeletonColumns = isDoubleRow ? [[1, 2], [3, 4], [5, 6]] : [[1], [2], [3], [4]];

    return (
      <View style={styles.container}>
        {/* Section Title Header */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.seeAllText}>See all</Text>
        </View>

        {/* Skeleton Horizontal Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {skeletonColumns.map((col, cIdx) => (
            <View key={`skel-col-${cIdx}`} style={styles.columnContainer}>
              {col.map((item) => (
                <TopDealCardSkeleton
                  key={`skel-item-${item}`}
                  animOpacity={pulseAnim}
                />
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Bottom See All Bar Skeleton */}
        {showBanner && (
          <Animated.View
            style={[
              styles.seeAllBar,
              styles.skeletonBlock,
              { opacity: pulseAnim, height: scale(46) },
            ]}
          />
        )}
      </View>
    );
  }

  // ── 2. If no items available and not loading, gracefully return null ──
  if (allItems.length === 0) {
    return null;
  }

  // ── 3. Live Product Data View ───────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Section Title Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
          <Text style={styles.seeAllHeaderBtnText}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Synchronous Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {columns.map((column, colIdx) => (
          <View key={`col-${colIdx}`} style={styles.columnContainer}>
            {column.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={handleProductPress}
                onAddPress={onAddPress}
                onSeeMorePress={onSeeMorePress}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom "See all products" Bar with 3 Real Live Overlapping Product Thumbnails */}
      {showBanner && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSeeAll}
          style={styles.seeAllBar}
        >
          {/* 3 Real Live Product Overlapping Thumbnail Avatars */}
          <View style={styles.avatarGroup}>
            {previewThumbnails.map((imgSrc: any, idx: number) => (
              <View
                key={`top-thumb-${idx}`}
                style={[
                  styles.avatarCircle,
                  idx > 0 && { marginLeft: -scale(10) },
                  { zIndex: 10 - idx },
                ]}
              >
                <Image
                  source={imgSrc}
                  style={styles.avatarImg}
                  contentFit="contain"
                />
              </View>
            ))}
          </View>

          <Text style={styles.seeAllText}>See all products</Text>
          <Ionicons name="caret-forward" size={scale(15)} color="#1E3A5F" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    marginBottom: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  seeAllHeaderBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#059669",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    gap: scale(10),
  },
  columnContainer: {
    gap: moderateScale(10),
  },
  seeAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(14),
    gap: scale(10),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarImg: {
    width: "88%",
    height: "88%",
  },
  seeAllText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1E3A5F",
    letterSpacing: 0.2,
  },

  // ── Skeleton Styles ──────────────────────────────────────────
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImageWrapper: {
    width: "100%",
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
  },
  cardDetails: {
    padding: scale(8),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(5),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(3),
    marginBottom: moderateScale(2),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
  skeletonLine: {
    borderRadius: scale(4),
  },
  addToCartBtnSkeleton: {
    height: scale(30),
    borderRadius: scale(8),
  },
});
