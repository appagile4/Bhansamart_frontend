import { useCart } from "@/context/cart-context";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const FLASH_CARD_SVG_PATH =
  "M18 10C55 8 125 8 162 10 170 11 174 17 174 25 176 55 181.003 135.831 160.753 135.509 88.753 136.152 74.289 131.331 74.61 158.652 74.931 176.652 55 172 18 170 10 169 6 164 6 155 4 125 4 55 6 25 6 17 10 11 18 10Z";

const FLASH_ADD_BUTTON_SVG_PATH =
  "M98 141C98.074 140.009 104.503 139.688 109.967 140.331 127.324 140.009 133.753 139.688 147.896 139.688 153.36 140.652 172.967 137.438 174.253 148.688L174.574 158.009C174.896 172.795 158.181 169.259 150.789 169.902 134.717 168.938 118 171 105 170 100 170 81.039 172.795 80.396 159.295L80.396 150.616C80.396 151.259 82.324 140.009 98 141Z";

export interface FlashSaleProduct {
  id: string;
  name: string;
  weightTag: string;
  categoryTag: string;
  image: any;
  stockLeftText?: string;
  stockProgress?: number; // 0 to 1
  rating: number;
  ratingCount: number;
  price: number;
  originalPrice: number;
  optionsText?: string;
}

// ==========================================
// MOCK FALLBACK DATASETS FOR CATEGORIES
// ==========================================
const GROCERY_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-g-capri",
    name: "Capri-Sun Orange Juice Pouch",
    weightTag: "200ml",
    categoryTag: "Beverages",
    image: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.8,
    ratingCount: 220,
    price: 85,
    originalPrice: 110,
    optionsText: "3 options",
  },
  {
    id: "flash-g-maggi",
    name: "Maggi 2-Minute Special Masala Noodles",
    weightTag: "70g",
    categoryTag: "Instant Food",
    image: require("@/assets/images/Home/product-maggi.png"),
    stockLeftText: "Only 4 left in stock !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 540,
    price: 95,
    originalPrice: 120,
    optionsText: "2 options",
  },
  {
    id: "flash-g-doritos",
    name: "2PM Spicy Masala Ready Noodles",
    weightTag: "100g",
    categoryTag: "Snacks",
    image: require("@/assets/images/Home/product-2pm.png"),
    stockLeftText: "Only 2 left !",
    stockProgress: 0.15,
    rating: 4.7,
    ratingCount: 180,
    price: 130,
    originalPrice: 160,
  },
];

const GROCERY_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-g-cornflakes",
    name: "Kellogg's Real Honey Almond Flakes",
    weightTag: "475g",
    categoryTag: "Breakfast",
    image: require("@/assets/images/Home/cornflakes-hero.png"),
    stockLeftText: "Only 5 left !",
    stockProgress: 0.35,
    rating: 4.8,
    ratingCount: 310,
    price: 340,
    originalPrice: 420,
    optionsText: "2 options",
  },
  {
    id: "flash-g-waiwai",
    name: "Wai Wai Quick Roasted Chicken Noodles",
    weightTag: "75g",
    categoryTag: "Instant Noodles",
    image: require("@/assets/images/Home/product-waiwai.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.25,
    rating: 4.7,
    ratingCount: 420,
    price: 145,
    originalPrice: 175,
  },
  {
    id: "flash-g-muesli",
    name: "Kellogg's Crunchy Muesli Fruit Magic",
    weightTag: "500g",
    categoryTag: "Cereals",
    image: require("@/assets/images/Home/kelloggs-combo.png"),
    stockLeftText: "Only 3 left in stock !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 265,
    price: 375,
    originalPrice: 460,
  },
];

const KIDS_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-k-shoes",
    name: "Baby Soft Anti-Slip First Step Shoes",
    weightTag: "1 Pair",
    categoryTag: "Footwear",
    image: require("@/assets/images/Home/kids-playmat-shoes.png"),
    stockLeftText: "Only 3 left !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 312,
    price: 580,
    originalPrice: 799,
  },
  {
    id: "flash-k-bag",
    name: "DeLune Waterproof Cute Bear Backpack",
    weightTag: "Standard",
    categoryTag: "School Bags",
    image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    stockLeftText: "Only 2 left in stock !",
    stockProgress: 0.15,
    rating: 4.8,
    ratingCount: 195,
    price: 1150,
    originalPrice: 1500,
  },
];

const KIDS_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-k-toys",
    name: "Paw Patrol Adventure Figure Playset",
    weightTag: "6 Pcs",
    categoryTag: "Action Toys",
    image: require("@/assets/images/Home/paw-patrol-figurines.png"),
    stockLeftText: "Only 4 left !",
    stockProgress: 0.28,
    rating: 4.7,
    ratingCount: 240,
    price: 680,
    originalPrice: 890,
  },
  {
    id: "flash-k-blanket",
    name: "Baby Hooded Warm Fleece Onesie",
    weightTag: "0-12m",
    categoryTag: "Apparel",
    image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.9,
    ratingCount: 180,
    price: 750,
    originalPrice: 999,
  },
];

const SNACKS_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-sn-maggi",
    name: "Maggi 2-Minute Special Masala Noodles",
    weightTag: "70g",
    categoryTag: "Noodles",
    image: require("@/assets/images/Home/product-maggi.png"),
    stockLeftText: "Only 3 left in stock !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 540,
    price: 95,
    originalPrice: 120,
    optionsText: "2 options",
  },
  {
    id: "flash-sn-capri",
    name: "Capri-Sun Orange Refreshing Juice Pouch",
    weightTag: "200ml",
    categoryTag: "Beverages",
    image: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.8,
    ratingCount: 220,
    price: 85,
    originalPrice: 110,
    optionsText: "3 options",
  },
  {
    id: "flash-sn-2pm",
    name: "2PM Spicy Masala Ready Noodles",
    weightTag: "100g",
    categoryTag: "Instant Noodles",
    image: require("@/assets/images/Home/product-2pm.png"),
    stockLeftText: "Only 2 left !",
    stockProgress: 0.15,
    rating: 4.7,
    ratingCount: 180,
    price: 130,
    originalPrice: 160,
  },
];

const SNACKS_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-sn-cornflakes",
    name: "Kellogg's Real Honey Almond Flakes",
    weightTag: "475g",
    categoryTag: "Cereals",
    image: require("@/assets/images/Home/cornflakes-hero.png"),
    stockLeftText: "Only 5 left !",
    stockProgress: 0.35,
    rating: 4.8,
    ratingCount: 310,
    price: 340,
    originalPrice: 420,
    optionsText: "2 options",
  },
  {
    id: "flash-sn-waiwai",
    name: "Wai Wai Quick Roasted Chicken Noodles",
    weightTag: "75g",
    categoryTag: "Instant Noodles",
    image: require("@/assets/images/Home/product-waiwai.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.25,
    rating: 4.7,
    ratingCount: 420,
    price: 145,
    originalPrice: 175,
  },
  {
    id: "flash-sn-slice",
    name: "Slice Thick Delicious Mango Juice",
    weightTag: "250ml",
    categoryTag: "Drinks",
    image: require("@/assets/images/Home/slice-mango-juice.png"),
    stockLeftText: "Only 4 left !",
    stockProgress: 0.22,
    rating: 4.8,
    ratingCount: 290,
    price: 70,
    originalPrice: 90,
  },
];

const BEAUTY_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-b-wash",
    name: "Himalaya Purifying Gentle Face Wash",
    weightTag: "150ml",
    categoryTag: "Skin Care",
    image: require("@/assets/images/Home/himalaya-baby-wash.png"),
    stockLeftText: "Only 3 left !",
    stockProgress: 0.2,
    rating: 4.8,
    ratingCount: 320,
    price: 190,
    originalPrice: 240,
  },
  {
    id: "flash-b-cream",
    name: "Nivea Soft Light Moisturizing Cream",
    weightTag: "100ml",
    categoryTag: "Face Care",
    image: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.9,
    ratingCount: 410,
    price: 260,
    originalPrice: 320,
  },
];

const BEAUTY_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-b-perfume",
    name: "Luxury Purple Eau De Perfume Spray",
    weightTag: "50ml",
    categoryTag: "Fragrance",
    image: require("@/assets/images/Home/luxury-purple-perfume.png"),
    stockLeftText: "Only 2 left in stock !",
    stockProgress: 0.15,
    rating: 4.9,
    ratingCount: 180,
    price: 890,
    originalPrice: 1250,
  },
  {
    id: "flash-b-paste",
    name: "Colgate Total Advanced Oral Toothpaste",
    weightTag: "120g",
    categoryTag: "Oral Care",
    image: require("@/assets/images/Home/toothpaste-colgate.png"),
    stockLeftText: "Only 4 left !",
    stockProgress: 0.25,
    rating: 4.7,
    ratingCount: 250,
    price: 110,
    originalPrice: 140,
  },
];

const STATIONERY_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-st-pens",
    name: "Executive Black Ballpoint Pens Set",
    weightTag: "5 Pcs",
    categoryTag: "Writing",
    image: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    stockLeftText: "Only 3 left in stock !",
    stockProgress: 0.2,
    rating: 4.8,
    ratingCount: 190,
    price: 120,
    originalPrice: 160,
  },
  {
    id: "flash-st-paper",
    name: "Double A Premium A4 White Paper Ream",
    weightTag: "500 Sheets",
    categoryTag: "Paper",
    image: require("@/assets/images/Home/double-a-paper-reams.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.9,
    ratingCount: 340,
    price: 420,
    originalPrice: 550,
  },
];

const STATIONERY_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-st-pencils",
    name: "Classic Colored Drawing Pencils Set",
    weightTag: "24 Shades",
    categoryTag: "Art & Craft",
    image: require("@/assets/images/Home/colored-pencils-row.png"),
    stockLeftText: "Only 2 left !",
    stockProgress: 0.15,
    rating: 4.7,
    ratingCount: 160,
    price: 240,
    originalPrice: 320,
  },
  {
    id: "flash-st-notes",
    name: "Classmate Spiral Bound Ruled Notebook",
    weightTag: "160 Pages",
    categoryTag: "Notebooks",
    image: require("@/assets/images/Home/notebooks-sticky-notes.png"),
    stockLeftText: "Only 5 left !",
    stockProgress: 0.35,
    rating: 4.8,
    ratingCount: 280,
    price: 95,
    originalPrice: 130,
  },
];

const GIFTING_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-gf-kitkat",
    name: "Nestle KitKat Love Break Chocolate Pack",
    weightTag: "150g",
    categoryTag: "Chocolates",
    image: require("@/assets/images/Home/prod-kitkat.png"),
    stockLeftText: "Only 3 left !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 380,
    price: 220,
    originalPrice: 280,
  },
  {
    id: "flash-gf-silk",
    name: "Cadbury Dairy Milk Silk Chocolate Bar",
    weightTag: "150g",
    categoryTag: "Sweets",
    image: require("@/assets/images/Home/prod-dairymilk.png"),
    stockLeftText: "Only 2 left in stock !",
    stockProgress: 0.15,
    rating: 4.9,
    ratingCount: 460,
    price: 260,
    originalPrice: 320,
  },
];

const GIFTING_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-gf-bouquet",
    name: "Fresh Festive Celebration Flower Bouquet",
    weightTag: "1 Bouquet",
    categoryTag: "Gifts",
    image: require("@/assets/images/Home/gift-flower-bouquet.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.8,
    ratingCount: 190,
    price: 750,
    originalPrice: 999,
  },
  {
    id: "flash-gf-hamper",
    name: "Deluxe Care & Spa Gift Celebration Hamper",
    weightTag: "1 Box",
    categoryTag: "Gift Sets",
    image: require("@/assets/images/Home/gift-basket-care.png"),
    stockLeftText: "Only 2 left !",
    stockProgress: 0.15,
    rating: 4.9,
    ratingCount: 140,
    price: 1250,
    originalPrice: 1650,
  },
];

const FLASH_CATEGORY_MAP: Record<
  string,
  {
    title: string;
    subtitle: string;
    row1: FlashSaleProduct[];
    row2: FlashSaleProduct[];
  }
> = {
  all: {
    title: "Flash Sale & Low Stock Deals",
    subtitle: "Hurry! Limited stock available across all categories.",
    row1: GROCERY_ROW1,
    row2: GROCERY_ROW2,
  },
  grocery: {
    title: "Grocery Flash Sale",
    subtitle: "Hurry! Fresh grocery deals with limited stock remaining.",
    row1: GROCERY_ROW1,
    row2: GROCERY_ROW2,
  },
  kids: {
    title: "Kids & Baby Flash Sale",
    subtitle: "Limited-time deals on baby gear, toys & essentials.",
    row1: KIDS_ROW1,
    row2: KIDS_ROW2,
  },
  baby: {
    title: "Baby Flash Sale",
    subtitle: "Limited-time deals on baby food, diapers, care & essentials.",
    row1: KIDS_ROW1,
    row2: KIDS_ROW2,
  },
  beauty: {
    title: "Beauty & Care Flash Sale",
    subtitle:
      "Unbeatable flash discounts on skincare & cosmetics with low stock.",
    row1: BEAUTY_ROW1,
    row2: BEAUTY_ROW2,
  },
  snacks: {
    title: "Snacks & Drinks Flash Sale",
    subtitle: "Snack more, spend less! Lightning deals on limited snack items.",
    row1: SNACKS_ROW1,
    row2: SNACKS_ROW2,
  },
  gifting: {
    title: "Gifting & Celebration Flash Sale",
    subtitle: "Grab sweet treats & gift hampers before they sell out.",
    row1: GIFTING_ROW1,
    row2: GIFTING_ROW2,
  },
  gifts: {
    title: "Gifting & Celebration Flash Sale",
    subtitle: "Grab sweet treats & gift hampers before they sell out.",
    row1: GIFTING_ROW1,
    row2: GIFTING_ROW2,
  },
  stationery: {
    title: "Stationery & Office Flash Sale",
    subtitle: "Exclusive limited-time discounts on school & desk essentials.",
    row1: STATIONERY_ROW1,
    row2: STATIONERY_ROW2,
  },
  school: {
    title: "Stationery & Office Flash Sale",
    subtitle: "Exclusive limited-time discounts on school & desk essentials.",
    row1: STATIONERY_ROW1,
    row2: STATIONERY_ROW2,
  },
};

// ── Animated Skeleton Card for Flash Sale ─────────────────────────────
function FlashSaleCardSkeleton({
  animOpacity,
}: {
  animOpacity: Animated.Value;
}) {
  return (
    <View style={styles.card}>
      {/* Top Image Canvas Skeleton */}
      <Animated.View
        style={[
          styles.imageBox,
          styles.skeletonBlock,
          {
            opacity: animOpacity,
            backgroundColor: "#FFFFFF",
            borderRadius: scale(14),
          },
        ]}
      />

      {/* Stock Bar Skeleton */}
      <View style={styles.stockContainer}>
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            {
              width: scale(65),
              height: scale(9),
              marginBottom: scale(3),
              opacity: animOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "85%", height: scale(3), opacity: animOpacity },
          ]}
        />
      </View>

      {/* Details Container Skeleton */}
      <View style={styles.detailsContainer}>
        {/* Tags Row Skeleton */}
        <View style={styles.tagsRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              {
                width: scale(38),
                height: scale(14),
                borderRadius: scale(4),
                opacity: animOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              {
                width: scale(48),
                height: scale(14),
                borderRadius: scale(4),
                opacity: animOpacity,
              },
            ]}
          />
        </View>

        {/* Title Skeleton Lines */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            {
              width: "90%",
              height: scale(12),
              marginBottom: scale(4),
              opacity: animOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            {
              width: "65%",
              height: scale(12),
              marginBottom: scale(6),
              opacity: animOpacity,
            },
          ]}
        />

        {/* Rating Stars Skeleton */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            {
              width: scale(60),
              height: scale(11),
              marginBottom: scale(6),
              opacity: animOpacity,
            },
          ]}
        />

        {/* Price Row Skeleton */}
        <View style={styles.priceRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(46), height: scale(15), opacity: animOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(35), height: scale(11), opacity: animOpacity },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

interface GroceryFlashSaleProps {
  category?:
    | "all"
    | "grocery"
    | "kids"
    | "gifting"
    | "stationery"
    | "beauty"
    | "snacks"
    | string;
  title?: string;
  subtitle?: string;
  row1Data?: FlashSaleProduct[];
  row2Data?: FlashSaleProduct[];
  onProductPress?: (product: FlashSaleProduct) => void;
  onAddPress?: (product: FlashSaleProduct) => void;
  onSeeAllPress?: () => void;
}

export default function GroceryFlashSale({
  category = "all",
  title,
  subtitle,
  row1Data,
  row2Data,
  onProductPress,
  onAddPress,
  onSeeAllPress,
}: GroceryFlashSaleProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product,
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
      ]),
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const { displayTitle, displaySubtitle, displayRow1, displayRow2 } =
    useMemo(() => {
      // 1. If explicit row1Data and row2Data are passed
      if (row1Data && row2Data && row1Data.length > 0) {
        return {
          displayTitle: title || "Flash Sale",
          displaySubtitle: subtitle || "Hurry before stock runs out!",
          displayRow1: row1Data,
          displayRow2: row2Data,
        };
      }

      const normalizedCat = (category || "all").toLowerCase().trim();

      // 2. Map & Filter real publicProducts from MongoDB based on low stock
      if (publicProducts && publicProducts.length > 0) {
        let filteredProducts = publicProducts;

        // Filter by category if not 'all'
        if (normalizedCat !== "all") {
          filteredProducts = publicProducts.filter((p) => {
            const prodCat = (p.category || "").toLowerCase();
            const prodSub = (p.subCategory || "").toLowerCase();
            const prodName = (p.name || "").toLowerCase();
            const prodTags = (p.tags || []).join(" ").toLowerCase();
            const text = `${prodName} ${prodCat} ${prodSub} ${prodTags}`;

            if (
              normalizedCat === "snacks" ||
              normalizedCat === "snacks-drinks"
            ) {
              return (
                text.includes("snack") ||
                text.includes("chip") ||
                text.includes("biscuit") ||
                text.includes("cookie") ||
                text.includes("namkeen") ||
                text.includes("noodle") ||
                text.includes("maggi") ||
                text.includes("waiwai") ||
                text.includes("2pm") ||
                text.includes("drink") ||
                text.includes("juice") ||
                text.includes("beverage") ||
                text.includes("cereal") ||
                text.includes("chocolate")
              );
            }

            if (
              normalizedCat === "grocery" ||
              normalizedCat === "grocery-kitchen"
            ) {
              return (
                text.includes("grocery") ||
                text.includes("kitchen") ||
                text.includes("rice") ||
                text.includes("atta") ||
                text.includes("flour") ||
                text.includes("oil") ||
                text.includes("ghee") ||
                text.includes("dal") ||
                text.includes("spice") ||
                text.includes("masala") ||
                text.includes("dairy") ||
                text.includes("paneer") ||
                text.includes("cheese") ||
                text.includes("butter") ||
                text.includes("staple")
              );
            }

            if (
              normalizedCat === "beauty" ||
              normalizedCat === "beauty-personal-care"
            ) {
              return (
                text.includes("beauty") ||
                text.includes("skin") ||
                text.includes("care") ||
                text.includes("hair") ||
                text.includes("shampoo") ||
                text.includes("lotion") ||
                text.includes("cream") ||
                text.includes("soap") ||
                text.includes("wash") ||
                text.includes("makeup") ||
                text.includes("fragrance")
              );
            }

            if (
              normalizedCat === "stationery" ||
              normalizedCat === "office-stationery"
            ) {
              return (
                text.includes("stationery") ||
                text.includes("office") ||
                text.includes("school") ||
                text.includes("pen") ||
                text.includes("pencil") ||
                text.includes("notebook") ||
                text.includes("paper") ||
                text.includes("book") ||
                text.includes("bag")
              );
            }

            if (normalizedCat === "kids" || normalizedCat === "baby") {
              return (
                text.includes("kid") ||
                text.includes("baby") ||
                text.includes("toy") ||
                text.includes("diaper") ||
                text.includes("wipe") ||
                text.includes("shoe") ||
                text.includes("onesie")
              );
            }

            return (
              prodCat.includes(normalizedCat) ||
              prodSub.includes(normalizedCat) ||
              prodName.includes(normalizedCat)
            );
          });
        }

        if (filteredProducts.length > 0) {
          const mappedList: FlashSaleProduct[] = filteredProducts.map((p) => {
            const curPrice = p.price || 0;
            const origPrice =
              p.originalPrice && p.originalPrice > curPrice
                ? p.originalPrice
                : p.discountValue && p.discountValue > 0
                  ? Math.round(curPrice / (1 - p.discountValue / 100))
                  : curPrice;

            const rawStock =
              typeof p.stock === "number" ? p.stock : p.inStock ? 5 : 0;

            const stockLeft = Math.max(rawStock, 1);
            const progress = Math.min(Math.max(stockLeft / 15, 0.15), 0.85);

            const stockLabel =
              stockLeft <= 3
                ? `Only ${stockLeft} left!`
                : stockLeft <= 7
                  ? `Only ${stockLeft} left in stock !`
                  : "Few pieces left !";

            const imgUrl =
              p.images && p.images.length > 0
                ? { uri: p.images[0].url }
                : require("@/assets/images/Home/product-maggi.png");

            return {
              id: p._id || p.id || String(Math.random()),
              name: p.name,
              weightTag: p.unit || "1 unit",
              categoryTag: p.subCategory || p.category || "Flash Deal",
              image: imgUrl,
              stockLeftText: stockLabel,
              stockProgress: progress,
              rating: p.ratingsAverage || 4.7,
              ratingCount: p.ratingsCount || 85,
              price: curPrice,
              originalPrice: origPrice > curPrice ? origPrice : curPrice,
            };
          });

          // Sort by lowest stock progress first (items running out first)
          mappedList.sort(
            (a, b) => (a.stockProgress || 0) - (b.stockProgress || 0),
          );

          const midpoint = Math.ceil(mappedList.length / 2);
          const r1 = mappedList.slice(0, midpoint);
          const r2 = mappedList.slice(midpoint, midpoint * 2);

          const defaultTitle =
            normalizedCat === "all"
              ? "Flash Sale & Low Stock Deals"
              : `${normalizedCat.charAt(0).toUpperCase() + normalizedCat.slice(1)} Flash Sale`;

          const defaultSubtitle =
            normalizedCat === "all"
              ? "Selling fast across all categories! Grab yours before it's gone."
              : `Hurry! Fresh ${normalizedCat} deals with limited stock remaining.`;

          return {
            displayTitle: title || defaultTitle,
            displaySubtitle: subtitle || defaultSubtitle,
            displayRow1: r1.length > 0 ? r1 : GROCERY_ROW1,
            displayRow2: r2.length > 0 ? r2 : r1.length > 0 ? r1 : GROCERY_ROW2,
          };
        }
      }

      // 3. Fallback to category mock configuration
      const catConfig =
        FLASH_CATEGORY_MAP[normalizedCat] || FLASH_CATEGORY_MAP.all;

      return {
        displayTitle: title || catConfig.title,
        displaySubtitle: subtitle || catConfig.subtitle,
        displayRow1: catConfig.row1,
        displayRow2: catConfig.row2,
      };
    }, [publicProducts, category, row1Data, row2Data, title, subtitle]);

  // Extract up to 3 real live thumbnails for the bottom "See all products" banner
  const previewThumbnails = useMemo(() => {
    const combined = [...displayRow1, ...displayRow2];
    if (combined.length > 0) {
      return combined.slice(0, 3).map((p) => p.image);
    }
    return [
      require("@/assets/images/Home/capri-sun-orange-juice.png"),
      require("@/assets/images/Home/product-maggi.png"),
      require("@/assets/images/Home/product-2pm.png"),
    ];
  }, [displayRow1, displayRow2]);

  const handleProductPress = (item: FlashSaleProduct) => {
    if (onProductPress) {
      onProductPress(item);
    } else {
      router.push({
        pathname: "/Screens/Product/productdetailscreen" as any,
        params: {
          id: item.id,
          name: item.name,
          weight: item.weightTag,
          price: String(item.price),
          originalPrice: String(item.originalPrice || item.price),
          category: item.categoryTag,
          image:
            typeof item.image === "object" && "uri" in item.image
              ? (item.image as any).uri
              : "",
        },
      });
    }
  };

  const handleAddPress = (item: FlashSaleProduct) => {
    if (onAddPress) {
      onAddPress(item);
    } else {
      const imgUrl =
        typeof item.image === "object" && item.image && "uri" in item.image
          ? item.image.uri
          : "";
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        imageUrl: imgUrl,
        weight: item.weightTag,
      });
    }
  };

  const handleSeeAllPress = () => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      const normalizedCat = (category || "all").toLowerCase().trim();
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: displayTitle || "Flash Sale & Low Stock Deals",
          category: normalizedCat === "all" ? "all" : normalizedCat,
          filter: "flash-sale",
          minDiscount: "20",
        },
      });
    }
  };

  const renderProductCard = (item: FlashSaleProduct) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.9}
      onPress={() => handleProductPress(item)}
      style={styles.card}
    >
      {/* Product Image Container with Custom SVG Path Background */}
      <View style={styles.imageBox}>
        {/* Main Card Background SVG */}
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 186 180"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Path d={FLASH_CARD_SVG_PATH} fill="#FFFFFF" />
        </Svg>

        {/* Product Image inside the SVG Canvas */}
        <View style={styles.imageInnerWrapper}>
          <Image
            source={item.image}
            style={styles.productImage}
            contentFit="contain"
            transition={150}
          />
        </View>

        {/* Custom SVG Path ADD Button in the Matching Cutout */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => handleAddPress(item)}
          style={styles.svgAddButtonWrapper}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="78 138 98 36"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Path
              d={FLASH_ADD_BUTTON_SVG_PATH}
              fill="#FFFFFF"
              stroke="#43784A"
              strokeWidth={1.5}
            />
          </Svg>
          <Text style={styles.addButtonText}>ADD</Text>
          {item.optionsText ? (
            <Text style={styles.optionsText}>{item.optionsText}</Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Stock Warning Progress Indicator */}
      {item.stockLeftText ? (
        <View style={styles.stockContainer}>
          <Text style={styles.stockText}>{item.stockLeftText}</Text>
          <View style={styles.stockProgressBarBg}>
            <View
              style={[
                styles.stockProgressBarFill,
                { width: `${(item.stockProgress || 0.4) * 100}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{item.weightTag}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Ratings */}
        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4].map((star) => (
              <Ionicons
                key={star}
                name="star"
                size={moderateScale(12.5)}
                color="#F59E0B"
              />
            ))}
            <Ionicons
              name="star-half"
              size={moderateScale(12.5)}
              color="#F59E0B"
            />
          </View>
          <Text style={styles.ratingCount}>({item.ratingCount})</Text>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>Rs. {item.price}</Text>
          <Text style={styles.originalPrice}>Rs. {item.originalPrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── 1. Skeleton Loading View ─────────────────────────────────
  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.peachCard}>
          {/* Header Title & Subtitle Skeletons */}
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              {
                width: scale(180),
                height: scale(22),
                marginBottom: scale(6),
                opacity: pulseAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              {
                width: scale(230),
                height: scale(13),
                marginBottom: moderateScale(16),
                opacity: pulseAnim,
              },
            ]}
          />

          {/* Row 1 Skeletons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {[1, 2, 3].map((item) => (
              <FlashSaleCardSkeleton
                key={`skel-row1-${item}`}
                animOpacity={pulseAnim}
              />
            ))}
          </ScrollView>

          {/* Row 2 Skeletons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { marginTop: scale(14) },
            ]}
          >
            {[1, 2, 3].map((item) => (
              <FlashSaleCardSkeleton
                key={`skel-row2-${item}`}
                animOpacity={pulseAnim}
              />
            ))}
          </ScrollView>

          {/* Bottom See All Banner Skeleton */}
          <Animated.View
            style={[
              styles.seeAllBanner,
              styles.skeletonBlock,
              { opacity: pulseAnim, height: scale(46) },
            ]}
          />
        </View>
      </View>
    );
  }

  // ── 2. Live Product Data View ─────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <View style={styles.peachCard}>
        {/* Header Title & Subtitle */}
        <Text style={styles.mainHeader}>{displayTitle}</Text>
        <Text style={styles.subHeader}>{displaySubtitle}</Text>

        {/* Row 1 Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayRow1.map(renderProductCard)}
        </ScrollView>

        {/* Row 2 Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { marginTop: scale(14) },
          ]}
        >
          {displayRow2.map(renderProductCard)}
        </ScrollView>

        {/* Bottom See All Banner with 3 Overlapping Preview Avatars matching Deals of the Day */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSeeAllPress}
          style={styles.seeAllBanner}
        >
          {/* 3 Real Live Product Overlapping Thumbnail Avatars */}
          <View style={styles.avatarGroup}>
            {previewThumbnails.map((imgSrc, idx) => (
              <View
                key={`flash-thumb-${idx}`}
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

          <Text style={styles.seeAllBannerText}>See all products</Text>
          <Ionicons
            name="caret-forward"
            size={moderateScale(15)}
            color="#284860"
            style={styles.seeAllArrow}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: scale(14),
    marginVertical: moderateScale(14),
  },
  peachCard: {
    backgroundColor: "#FCEEE7",
    borderRadius: scale(16),
    paddingVertical: moderateScale(18),
    paddingHorizontal: scale(12),
  },
  mainHeader: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#E2583E",
    letterSpacing: -0.4,
    marginBottom: scale(2),
  },
  subHeader: {
    fontSize: moderateScale(13),
    color: "#2C3E50",
    fontWeight: "500",
    marginBottom: moderateScale(16),
  },
  scrollContent: {
    gap: scale(10),
  },
  card: {
    width: scale(145),
  },
  imageBox: {
    width: scale(145),
    height: scale(140),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageInnerWrapper: {
    width: "74%",
    height: "68%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(-28),
    marginRight: scale(-4),
    zIndex: 2,
  },
  productImage: {
    width: "100%",
    height: "80%",
  },
  svgAddButtonWrapper: {
    position: "absolute",
    bottom: scale(2),
    right: scale(4),
    width: scale(72),
    height: scale(30),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  addButtonText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#3F784C",
    marginTop: scale(-1),
  },
  optionsText: {
    fontSize: moderateScale(7.5),
    color: "#556987",
    fontWeight: "600",
    marginTop: scale(-1),
  },
  stockContainer: {
    marginTop: scale(12),
    marginBottom: scale(4),
  },
  stockText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#222222",
    marginBottom: scale(2),
  },
  stockProgressBarBg: {
    width: "85%",
    height: scale(2.5),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(2),
    overflow: "hidden",
  },
  stockProgressBarFill: {
    height: "100%",
    backgroundColor: "#E2583E",
    borderRadius: scale(2),
  },
  detailsContainer: {
    marginTop: scale(2),
  },
  tagsRow: {
    flexDirection: "row",
    gap: scale(4),
    marginBottom: scale(4),
  },
  tagPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  tagText: {
    fontSize: moderateScale(9.5),
    fontWeight: "600",
    color: "#475569",
  },
  productTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: moderateScale(16),
    minHeight: moderateScale(32),
    marginBottom: scale(3),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: scale(3),
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },
  ratingCount: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  currentPrice: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  originalPrice: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  seeAllBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    marginTop: moderateScale(18),
    gap: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F2D8CB",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FCEEE7",
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
  seeAllBannerText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1E3A5F",
    letterSpacing: 0.2,
  },
  seeAllArrow: {
    marginLeft: scale(2),
  },

  // ── Skeleton Styles ──────────────────────────────────────────
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
  skeletonLine: {
    borderRadius: scale(4),
  },
});
