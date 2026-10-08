import { Image } from "expo-image";
import { FloatingCartBar } from "@/components/cart";
import { FilterModal, FilterState } from "@/components/category";
import {
  APP_CATEGORIES,
  CATEGORY_NAMES,
  getSubCategoriesForCategory,
} from "@/constants/categories";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCategoryProducts, ProductItem } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface CategoryExpandProductCardProps {
  product: ProductItem;
  quantity: number;
  onPress: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem, imgUrl: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

const CategoryExpandProductCard = memo(function CategoryExpandProductCard({
  product,
  quantity,
  onPress,
  onAddToCart,
  onUpdateQuantity,
}: CategoryExpandProductCardProps) {
  const prodId = product._id || product.id || "";
  const imgUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80";

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  const handlePress = useCallback(() => {
    onPress(product);
  }, [onPress, product]);

  const handleAdd = useCallback(() => {
    onAddToCart(product, imgUrl);
  }, [onAddToCart, product, imgUrl]);

  const handleMinus = useCallback(() => {
    onUpdateQuantity(prodId, -1);
  }, [onUpdateQuantity, prodId]);

  const handlePlus = useCallback(() => {
    onUpdateQuantity(prodId, 1);
  }, [onUpdateQuantity, prodId]);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.productCard}
    >
      {/* Image Box */}
      <View style={styles.cardImageBox}>
        <Image
          source={{ uri: imgUrl }}
          style={styles.productImg}
          contentFit="contain"
          transition={100}
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              {discountPercent}% OFF
            </Text>
          </View>
        )}

        {/* Out of Stock Overlay / Badge */}
        {!product.inStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>
              OUT OF STOCK
            </Text>
          </View>
        )}

        {/* ADD / Quantity Counter Overlay */}
        {product.inStock &&
          (quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAdd}
              style={styles.addBtnOverlay}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.counterOverlay}>
              <TouchableOpacity
                onPress={handleMinus}
                style={styles.counterActionBtn}
              >
                <Feather
                  name="minus"
                  size={scale(11)}
                  color="#016073"
                />
              </TouchableOpacity>
              <Text style={styles.counterQtyText}>{quantity}</Text>
              <TouchableOpacity
                onPress={handlePlus}
                style={styles.counterActionBtn}
              >
                <Feather
                  name="plus"
                  size={scale(11)}
                  color="#016073"
                />
              </TouchableOpacity>
            </View>
          ))}
      </View>

      {/* Weight Tag */}
      <View style={styles.weightTagPill}>
        <Text style={styles.weightTagText}>
          {product.unit || "1 pc"}
        </Text>
      </View>

      {/* Product Name */}
      <Text numberOfLines={2} style={styles.productNameText}>
        {product.name}
      </Text>

      {/* Star Rating */}
      <View style={styles.starRatingRow}>
        <View style={styles.starsGroup}>
          <FontAwesome
            name="star"
            size={scale(9.5)}
            color="#EAB308"
            style={{ marginRight: scale(2) }}
          />
          <Text style={styles.ratingScoreText}>
            {(product.ratingsAverage || 4.5).toFixed(1)}
          </Text>
        </View>
        <Text style={styles.reviewsCountText}>
          ({product.ratingsCount || 12})
        </Text>
      </View>

      {/* Pricing Row */}
      <View style={styles.pricingRow}>
        <Text style={styles.currentPriceText}>
          Rs. {product.price}
        </Text>
        {product.originalPrice &&
        product.originalPrice > product.price ? (
          <Text style={styles.mrpText}>
            Rs. {product.originalPrice}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

function CategoryProductSkeleton({ animOpacity }: { animOpacity: Animated.Value }) {
  return (
    <View style={styles.productCard}>
      {/* Image Skeleton */}
      <Animated.View
        style={[
          styles.cardImageBox,
          styles.skeletonBlock,
          { opacity: animOpacity },
        ]}
      />
      {/* Weight pill skeleton */}
      <Animated.View
        style={[
          styles.skeletonBlock,
          {
            width: scale(45),
            height: scale(14),
            borderRadius: scale(4),
            marginBottom: scale(5),
            opacity: animOpacity,
          },
        ]}
      />
      {/* Title skeleton lines */}
      <Animated.View
        style={[
          styles.skeletonBlock,
          {
            width: "90%",
            height: scale(13),
            marginBottom: scale(4),
            borderRadius: scale(3),
            opacity: animOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonBlock,
          {
            width: "60%",
            height: scale(13),
            marginBottom: scale(6),
            borderRadius: scale(3),
            opacity: animOpacity,
          },
        ]}
      />
      {/* Rating row skeleton */}
      <Animated.View
        style={[
          styles.skeletonBlock,
          {
            width: scale(70),
            height: scale(12),
            marginBottom: scale(6),
            borderRadius: scale(3),
            opacity: animOpacity,
          },
        ]}
      />
      {/* Price and Add button row skeleton */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: scale(2),
        }}
      >
        <Animated.View
          style={[
            styles.skeletonBlock,
            {
              width: scale(55),
              height: scale(16),
              borderRadius: scale(3),
              opacity: animOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBlock,
            {
              width: scale(48),
              height: scale(22),
              borderRadius: scale(5),
              opacity: animOpacity,
            },
          ]}
        />
      </View>
    </View>
  );
}

const SUBCATEGORY_IMAGES: Record<string, string> = {
  // Grocery & Kitchen
  "Vegetables & Fruits":
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80",
  "Atta, Rice & Dal":
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80",
  "Oil, Ghee & Masala":
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80",
  "Dairy, Bread & Eggs":
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80",
  "Bakery & Biscuits":
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
  "Dry Fruits & Cereals":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
  "Chicken, Meat & Fish":
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80",
  "Kitchenware & Appliances":
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80",

  // Snacks & Drinks
  "Chips, Nachos & Popcorn":
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80",
  "Namkeen & Roasted Snacks":
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80",
  "Biscuits, Cookies & Wafers":
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
  "Chocolates, Candies & Toffees":
    "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=80",
  "Dry Fruits, Nuts & Seeds":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
  "Snack Bars & Healthy Bites":
    "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&q=80",
  "Instant Noodles & Pasta":
    "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  "Cold Drinks, Juices & Ice Cream":
    "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80",

  // Beauty & Personal Care
  "Bath & Body":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80",
  "Hair":
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80",
  "Skin & Faces":
    "https://images.unsplash.com/photo-1556228722-d0b5ed7cd88c?w=300&q=80",
  "Beauty & Cosmetics":
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&q=80",
  "Feminine Hygiene":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
  "Fragrances & Deodorants":
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&q=80",
  "Health & Pharma":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
  "Sexual Wellness":
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80",

  // School, Office & Stationery
  "Pens & Pencils":
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300&q=80",
  "Notebooks & Diaries":
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80",
  "Markers & Highlighters":
    "https://images.unsplash.com/photo-1585336261026-7fcfbdfa95b8?w=300&q=80",
  "Geometry & Scales":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80",
  "Art & Craft Supplies":
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=80",
  "Files & Folders":
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80",
  "Office & Desk Supplies":
    "https://images.unsplash.com/photo-1507842229451-79b1be886a20?w=300&q=80",
  "Printer Paper & Labels":
    "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&q=80",

  // Baby
  "Baby Food":
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&q=80",
  "Diapers & Pants":
    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&q=80",
  "Baby Care":
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80",
  "Baby Bath":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
  "Baby Feeding":
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&q=80",
  "Baby Clothing":
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&q=80",
  "Baby Accessories":
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80",

  // Gifting
  "Chocolates & Sweets":
    "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=80",
  "Men's Wear":
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=300&q=80",
  "Women's Wear":
    "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=300&q=80",
  "Dresses & Ethnic Wear":
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80",
  "Cosmetics & Hampers":
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&q=80",
  "Electronics & Gadgets":
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80",
  "Toys & Games":
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=300&q=80",
  "Kids & Baby Gifts":
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80",
};

export default function CategoryExpandScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

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

  const params = useLocalSearchParams<{
    title?: string;
    category?: string;
    subCategory?: string;
  }>();

  // Helper to normalize strings (removes hyphens, spaces, ampersands, punctuation, case)
  const normalize = (str?: string) =>
    (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const reduxCategory = useAppSelector((state) => state.product.selectedCategory);

  // 1. Resolve parent category
  const parentCategory = useMemo(() => {
    // A. Direct exact match in CATEGORY_NAMES
    if (params.category && CATEGORY_NAMES.includes(params.category)) {
      return params.category;
    }

    // B. Check category ID match (e.g. 'snacks-drinks', 'beauty-personal-care', 'school-office-stationery', 'grocery-kitchen')
    if (params.category) {
      const catById = APP_CATEGORIES.find(
        (c) =>
          c.id === params.category ||
          normalize(c.id) === normalize(params.category) ||
          normalize(c.name) === normalize(params.category)
      );
      if (catById) return catById.name;
    }

    // C. Search across params (category, subCategory, title) against category names and subcategories
    const targets = [
      params.category,
      params.subCategory,
      params.title,
    ].filter(Boolean) as string[];

    for (const target of targets) {
      const normTarget = normalize(target);
      if (!normTarget) continue;

      // Check category names / IDs
      for (const cat of APP_CATEGORIES) {
        if (
          normalize(cat.name) === normTarget ||
          normalize(cat.id) === normTarget
        ) {
          return cat.name;
        }
      }

      // Check subcategory names
      for (const cat of APP_CATEGORIES) {
        if (
          cat.subCategories.some(
            (s) =>
              normalize(s) === normTarget ||
              normalize(s).includes(normTarget) ||
              normTarget.includes(normalize(s))
          )
        ) {
          return cat.name;
        }
      }

      // Semantic keyword domain mappings
      if (
        normTarget.includes("baby") ||
        normTarget.includes("infant") ||
        normTarget.includes("toddler") ||
        normTarget.includes("diaper") ||
        normTarget.includes("teether") ||
        normTarget.includes("rattle") ||
        normTarget.includes("feeder") ||
        normTarget.includes("onesie") ||
        normTarget.includes("romper") ||
        normTarget.includes("kid") ||
        normTarget.includes("winter")
      ) {
        return "Baby";
      }

      if (
        normTarget.includes("beauty") ||
        normTarget.includes("personal") ||
        normTarget.includes("care") ||
        normTarget.includes("skin") ||
        normTarget.includes("face") ||
        normTarget.includes("bath") ||
        normTarget.includes("wash") ||
        normTarget.includes("hair") ||
        normTarget.includes("makeup") ||
        normTarget.includes("cosmetic") ||
        normTarget.includes("blush") ||
        normTarget.includes("lipstick") ||
        normTarget.includes("oral") ||
        normTarget.includes("paste") ||
        normTarget.includes("perfume") ||
        normTarget.includes("fragrance") ||
        normTarget.includes("shampoo") ||
        normTarget.includes("lotion") ||
        normTarget.includes("cream") ||
        normTarget.includes("hygiene") ||
        normTarget.includes("pharma") ||
        normTarget.includes("wellness")
      ) {
        return "Beauty & Personal Care";
      }

      if (
        normTarget.includes("station") ||
        normTarget.includes("pen") ||
        normTarget.includes("pencil") ||
        normTarget.includes("school") ||
        normTarget.includes("office") ||
        normTarget.includes("book") ||
        normTarget.includes("notebook") ||
        normTarget.includes("paper") ||
        normTarget.includes("art") ||
        normTarget.includes("craft") ||
        normTarget.includes("desk") ||
        normTarget.includes("folder") ||
        normTarget.includes("file")
      ) {
        return "School, Office & Stationery";
      }

      if (
        normTarget.includes("gift") ||
        normTarget.includes("hamper") ||
        normTarget.includes("mens-wear") ||
        normTarget.includes("womens-wear") ||
        normTarget.includes("dress") ||
        normTarget.includes("ethnic") ||
        normTarget.includes("gadget") ||
        normTarget.includes("earbud")
      ) {
        return "Gifting";
      }

      if (
        normTarget.includes("snack") ||
        normTarget.includes("drink") ||
        normTarget.includes("juice") ||
        normTarget.includes("sweet") ||
        normTarget.includes("chocolate") ||
        normTarget.includes("biscuit") ||
        normTarget.includes("chips") ||
        normTarget.includes("beverage") ||
        normTarget.includes("noodle") ||
        normTarget.includes("maggi") ||
        normTarget.includes("waiwai") ||
        normTarget.includes("pasta") ||
        normTarget.includes("cereal") ||
        normTarget.includes("namkeen") ||
        normTarget.includes("candy") ||
        normTarget.includes("icecream") ||
        normTarget.includes("sauce")
      ) {
        return "Snacks & Drinks";
      }

      if (
        normTarget.includes("groc") ||
        normTarget.includes("fruit") ||
        normTarget.includes("veg") ||
        normTarget.includes("rice") ||
        normTarget.includes("atta") ||
        normTarget.includes("dal") ||
        normTarget.includes("oil") ||
        normTarget.includes("ghee") ||
        normTarget.includes("dairy") ||
        normTarget.includes("bread") ||
        normTarget.includes("egg") ||
        normTarget.includes("meat") ||
        normTarget.includes("fish") ||
        normTarget.includes("chicken") ||
        normTarget.includes("kitchen") ||
        normTarget.includes("spice") ||
        normTarget.includes("masala")
      ) {
        return "Grocery & Kitchen";
      }
    }

    // D. Use active Redux category if available
    if (reduxCategory && reduxCategory !== "all") {
      const normRedux = normalize(reduxCategory);
      if (normRedux.includes("gift")) return "Gifting";
      if (normRedux.includes("baby") || normRedux.includes("kid")) return "Baby";
      if (normRedux.includes("beauty")) return "Beauty & Personal Care";
      if (normRedux.includes("station")) return "School, Office & Stationery";
      if (normRedux.includes("snack")) return "Snacks & Drinks";
      if (normRedux.includes("groc")) return "Grocery & Kitchen";
    }

    return "Grocery & Kitchen";
  }, [params.category, params.title, params.subCategory, reduxCategory]);

  // 2. Resolve initial subcategory selection
  const initialSubcategory = useMemo(() => {
    if (params.subCategory === "all" || params.category === "all") {
      return "all";
    }
    const validSubs = getSubCategoriesForCategory(parentCategory);

    const subTargets = [
      params.subCategory,
      params.title,
      params.category,
    ].filter(Boolean) as string[];

    for (const target of subTargets) {
      if (
        target === "all" ||
        target === parentCategory ||
        normalize(target) === normalize(parentCategory)
      ) {
        continue;
      }
      const normTarget = normalize(target);
      if (!normTarget) continue;

      // Direct exact or partial string matching
      const match = validSubs.find(
        (s) =>
          normalize(s) === normTarget ||
          normalize(s).includes(normTarget) ||
          normTarget.includes(normalize(s))
      );
      if (match) return match;

      // Gifting domain subcategory mappings
      if (parentCategory === "Gifting" || normTarget.includes("gift")) {
        if (normTarget.includes("men") || normTarget.includes("shirt") || normTarget.includes("polo") || normTarget.includes("chino") || normTarget.includes("trouser")) {
          const sub = validSubs.find((s) => s.includes("Men"));
          if (sub) return sub;
        }
        if (normTarget.includes("women") || normTarget.includes("kurti") || normTarget.includes("shawl") || normTarget.includes("stole") || normTarget.includes("pashmina")) {
          const sub = validSubs.find((s) => s.includes("Women"));
          if (sub) return sub;
        }
        if (normTarget.includes("dress") || normTarget.includes("gown") || normTarget.includes("anarkali") || normTarget.includes("ethnic") || normTarget.includes("suit")) {
          const sub = validSubs.find((s) => s.includes("Dresses"));
          if (sub) return sub;
        }
        if (normTarget.includes("cosmetic") || normTarget.includes("hamper") || normTarget.includes("spa") || normTarget.includes("glow") || normTarget.includes("flower")) {
          const sub = validSubs.find((s) => s.includes("Cosmetics") || s.includes("Hampers"));
          if (sub) return sub;
        }
        if (normTarget.includes("elect") || normTarget.includes("gadget") || normTarget.includes("earbud") || normTarget.includes("watch") || normTarget.includes("headphone") || normTarget.includes("speaker")) {
          const sub = validSubs.find((s) => s.includes("Electronics"));
          if (sub) return sub;
        }
        if (normTarget.includes("toy") || normTarget.includes("game") || normTarget.includes("chess") || normTarget.includes("rc") || normTarget.includes("truck")) {
          const sub = validSubs.find((s) => s.includes("Toys"));
          if (sub) return sub;
        }
        if (normTarget.includes("choco") || normTarget.includes("sweet") || normTarget.includes("cadbury") || normTarget.includes("silk") || normTarget.includes("praline") || normTarget.includes("kitkat")) {
          const sub = validSubs.find((s) => s.includes("Chocolates"));
          if (sub) return sub;
        }
        if (normTarget.includes("kid") || normTarget.includes("walker") || normTarget.includes("newborn")) {
          const sub = validSubs.find((s) => s.includes("Kids"));
          if (sub) return sub;
        }
      }

      // School, Office & Stationery domain subcategory mappings
      if (
        parentCategory === "School, Office & Stationery" ||
        normTarget.includes("station") ||
        normTarget.includes("school") ||
        normTarget.includes("office")
      ) {
        if (normTarget.includes("pen") || normTarget.includes("pencil") || normTarget.includes("ballpoint") || normTarget.includes("gel") || normTarget.includes("fountain") || normTarget.includes("eraser") || normTarget.includes("sharpener") || normTarget.includes("writing")) {
          const sub = validSubs.find((s) => s.includes("Pens"));
          if (sub) return sub;
        }
        if (normTarget.includes("notebook") || normTarget.includes("diary") || normTarget.includes("planner") || normTarget.includes("register") || normTarget.includes("spiral") || normTarget.includes("notepad")) {
          const sub = validSubs.find((s) => s.includes("Notebooks"));
          if (sub) return sub;
        }
        if (normTarget.includes("marker") || normTarget.includes("highlighter") || normTarget.includes("whiteboard") || normTarget.includes("permanent")) {
          const sub = validSubs.find((s) => s.includes("Markers"));
          if (sub) return sub;
        }
        if (normTarget.includes("geometry") || normTarget.includes("scale") || normTarget.includes("ruler") || normTarget.includes("compass") || normTarget.includes("protractor")) {
          const sub = validSubs.find((s) => s.includes("Geometry"));
          if (sub) return sub;
        }
        if (normTarget.includes("art") || normTarget.includes("craft") || normTarget.includes("drawing") || normTarget.includes("sketch") || normTarget.includes("crayon") || normTarget.includes("color pencil") || normTarget.includes("paint") || normTarget.includes("acrylic") || normTarget.includes("pastel")) {
          const sub = validSubs.find((s) => s.includes("Art"));
          if (sub) return sub;
        }
        if (normTarget.includes("file") || normTarget.includes("folder") || normTarget.includes("envelope") || normTarget.includes("clipboard") || normTarget.includes("document")) {
          const sub = validSubs.find((s) => s.includes("Files"));
          if (sub) return sub;
        }
        if (normTarget.includes("stapler") || normTarget.includes("staple") || normTarget.includes("desk") || normTarget.includes("clip") || normTarget.includes("glue") || normTarget.includes("adhesive") || normTarget.includes("calculator") || normTarget.includes("organizer")) {
          const sub = validSubs.find((s) => s.includes("Office & Desk"));
          if (sub) return sub;
        }
        if (normTarget.includes("printer") || normTarget.includes("paper") || normTarget.includes("copier") || normTarget.includes("double a") || normTarget.includes("a4") || normTarget.includes("sticky") || normTarget.includes("label") || normTarget.includes("sticker")) {
          const sub = validSubs.find((s) => s.includes("Printer"));
          if (sub) return sub;
        }
      }

      // Snacks & Drinks domain subcategory mappings
      if (
        parentCategory === "Snacks & Drinks" ||
        normTarget.includes("snack") ||
        normTarget.includes("drink") ||
        normTarget.includes("munch")
      ) {
        if (normTarget.includes("chip") || normTarget.includes("nacho") || normTarget.includes("popcorn") || normTarget.includes("crisp") || normTarget.includes("salted")) {
          const sub = validSubs.find((s) => s.includes("Chips"));
          if (sub) return sub;
        }
        if (normTarget.includes("namkeen") || normTarget.includes("bhujia") || normTarget.includes("sev") || normTarget.includes("makhana") || normTarget.includes("roast") || normTarget.includes("mixture")) {
          const sub = validSubs.find((s) => s.includes("Namkeen"));
          if (sub) return sub;
        }
        if (normTarget.includes("biscuit") || normTarget.includes("cookie") || normTarget.includes("cracker") || normTarget.includes("bakery") || normTarget.includes("wafer")) {
          const sub = validSubs.find((s) => s.includes("Biscuits"));
          if (sub) return sub;
        }
        if (normTarget.includes("choco") || normTarget.includes("candy") || normTarget.includes("toffee") || normTarget.includes("eclair") || normTarget.includes("caramel") || normTarget.includes("gems")) {
          const sub = validSubs.find((s) => s.includes("Chocolates"));
          if (sub) return sub;
        }
        if (normTarget.includes("dry") || normTarget.includes("fruit") || normTarget.includes("almond") || normTarget.includes("cashew") || normTarget.includes("nut") || normTarget.includes("seed")) {
          const sub = validSubs.find((s) => s.includes("Dry Fruits"));
          if (sub) return sub;
        }
        if (normTarget.includes("bar") || normTarget.includes("granola") || normTarget.includes("protein") || normTarget.includes("energy") || normTarget.includes("healthy")) {
          const sub = validSubs.find((s) => s.includes("Snack Bars"));
          if (sub) return sub;
        }
        if (normTarget.includes("noodle") || normTarget.includes("maggi") || normTarget.includes("waiwai") || normTarget.includes("pasta") || normTarget.includes("macaroni") || normTarget.includes("instant")) {
          const sub = validSubs.find((s) => s.includes("Instant Noodles"));
          if (sub) return sub;
        }
        if (normTarget.includes("drink") || normTarget.includes("juice") || normTarget.includes("ice") || normTarget.includes("cream") || normTarget.includes("soda") || normTarget.includes("beverage")) {
          const sub = validSubs.find((s) => s.includes("Cold Drinks"));
          if (sub) return sub;
        }
      }

      // Baby domain subcategory mappings
      if (parentCategory === "Baby" || normTarget.includes("baby") || normTarget.includes("infant") || normTarget.includes("kid") || normTarget.includes("winter")) {
        if (normTarget.includes("food") || normTarget.includes("cerelac") || normTarget.includes("puree")) {
          const sub = validSubs.find((s) => s.includes("Food"));
          if (sub) return sub;
        }
        if (normTarget.includes("diaper") || normTarget.includes("pant") || normTarget.includes("molfix") || normTarget.includes("pampers")) {
          const sub = validSubs.find((s) => s.includes("Diapers"));
          if (sub) return sub;
        }
        if (normTarget.includes("bath") || normTarget.includes("wash") || normTarget.includes("shampoo")) {
          const sub = validSubs.find((s) => s.includes("Bath"));
          if (sub) return sub;
        }
        if (normTarget.includes("feed") || normTarget.includes("bottle") || normTarget.includes("spoon") || normTarget.includes("bib")) {
          const sub = validSubs.find((s) => s.includes("Feeding"));
          if (sub) return sub;
        }
        if (normTarget.includes("cloth") || normTarget.includes("wear") || normTarget.includes("onesie") || normTarget.includes("romper") || normTarget.includes("towel") || normTarget.includes("shoe") || normTarget.includes("bootie") || normTarget.includes("sock") || normTarget.includes("cap")) {
          const sub = validSubs.find((s) => s.includes("Clothing"));
          if (sub) return sub;
        }
        if (normTarget.includes("access") || normTarget.includes("teether") || normTarget.includes("rattle") || normTarget.includes("toy") || normTarget.includes("pacifier")) {
          const sub = validSubs.find((s) => s.includes("Accessories"));
          if (sub) return sub;
        }
        if (normTarget.includes("care") || normTarget.includes("lotion") || normTarget.includes("cream") || normTarget.includes("rash") || normTarget.includes("health") || normTarget.includes("hygiene")) {
          const sub = validSubs.find((s) => s.includes("Care"));
          if (sub) return sub;
        }
      }

      // Domain semantic subcategory mapping
      if (normTarget.includes("skin") || normTarget.includes("face") || normTarget.includes("lotion") || normTarget.includes("cream")) {
        const sub = validSubs.find((s) => s.includes("Skin"));
        if (sub) return sub;
      }
      if (normTarget.includes("bath") || normTarget.includes("wash") || normTarget.includes("oral") || normTarget.includes("toothpaste") || normTarget.includes("perfume") || normTarget.includes("fragrance")) {
        const sub = validSubs.find((s) => s.includes("Bath"));
        if (sub) return sub;
      }
      if (normTarget.includes("makeup") || normTarget.includes("cosmetic") || normTarget.includes("blush") || normTarget.includes("lipstick")) {
        const sub = validSubs.find((s) => s.includes("Beauty") || s.includes("Cosmetics"));
        if (sub) return sub;
      }
      if (normTarget.includes("hair") || normTarget.includes("shampoo")) {
        const sub = validSubs.find((s) => s.includes("Hair"));
        if (sub) return sub;
      }
      if (normTarget.includes("baby") || normTarget.includes("diaper") || normTarget.includes("kid") || normTarget.includes("toy")) {
        const sub = validSubs.find((s) => s.includes("Baby"));
        if (sub) return sub;
      }
      if (normTarget.includes("pen") || normTarget.includes("pencil") || normTarget.includes("writing")) {
        const sub = validSubs.find((s) => s.includes("Writing"));
        if (sub) return sub;
      }
      if (normTarget.includes("school") || normTarget.includes("bag") || normTarget.includes("bottle")) {
        const sub = validSubs.find((s) => s.includes("School"));
        if (sub) return sub;
      }
      if (normTarget.includes("office") || normTarget.includes("paper") || normTarget.includes("notebook") || normTarget.includes("file")) {
        const sub = validSubs.find((s) => s.includes("Office"));
        if (sub) return sub;
      }
      if (normTarget.includes("art") || normTarget.includes("craft") || normTarget.includes("color")) {
        const sub = validSubs.find((s) => s.includes("Art"));
        if (sub) return sub;
      }
      if (normTarget.includes("noodle") || normTarget.includes("maggi") || normTarget.includes("waiwai") || normTarget.includes("pasta") || normTarget.includes("instant")) {
        const sub = validSubs.find((s) => s.includes("Instant"));
        if (sub) return sub;
      }
      if (normTarget.includes("choc") || normTarget.includes("sweet") || normTarget.includes("candy")) {
        const sub = validSubs.find((s) => s.includes("Sweet"));
        if (sub) return sub;
      }
      if (normTarget.includes("juice") || normTarget.includes("drink")) {
        const sub = validSubs.find((s) => s.includes("Drink") || s.includes("Juice"));
        if (sub) return sub;
      }
      if (normTarget.includes("tea") || normTarget.includes("coffee")) {
        const sub = validSubs.find((s) => s.includes("Tea"));
        if (sub) return sub;
      }
      if (normTarget.includes("chip") || normTarget.includes("namkeen")) {
        const sub = validSubs.find((s) => s.includes("Chip"));
        if (sub) return sub;
      }
      if (normTarget.includes("oil") || normTarget.includes("ghee") || normTarget.includes("masala")) {
        const sub = validSubs.find((s) => s.includes("Oil"));
        if (sub) return sub;
      }
      if (normTarget.includes("rice") || normTarget.includes("atta") || normTarget.includes("dal")) {
        const sub = validSubs.find((s) => s.includes("Atta") || s.includes("Rice"));
        if (sub) return sub;
      }
      if (normTarget.includes("dairy") || normTarget.includes("milk") || normTarget.includes("butter") || normTarget.includes("paneer") || normTarget.includes("cheese")) {
        const sub = validSubs.find((s) => s.includes("Dairy"));
        if (sub) return sub;
      }
      if (normTarget.includes("meat") || normTarget.includes("chicken") || normTarget.includes("fish")) {
        const sub = validSubs.find((s) => s.includes("Chicken") || s.includes("Meat"));
        if (sub) return sub;
      }
      if (normTarget.includes("veg") || normTarget.includes("fruit")) {
        const sub = validSubs.find((s) => s.includes("Vegetable"));
        if (sub) return sub;
      }

      // Check partial token matches
      const tokenMatch = validSubs.find((s) => {
        const words = s.toLowerCase().split(/[\s,&]+/);
        return words.some((w) => w.length > 2 && normTarget.includes(w));
      });
      if (tokenMatch) return tokenMatch;
    }

    return "all";
  }, [params.subCategory, params.title, params.category, parentCategory]);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string>(initialSubcategory);

  // Sync selected subcategory if navigation params change
  useEffect(() => {
    setSelectedSubcategory(initialSubcategory);
  }, [initialSubcategory]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [refreshing, setRefreshing] = useState(false);

  // In-Screen Dropdown Search Bar State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState<FilterState>({
    sortBy: "popularity",
    priceRange: "all",
    selectedBrands: [],
    minDiscount: 0,
    inStockOnly: false,
  });

  // 3. Subcategories list for sidebar rail
  const subcategoryList = useMemo(() => {
    const list = getSubCategoriesForCategory(parentCategory);
    return [
      {
        id: "all",
        name: "All",
        imageUrl:
          SUBCATEGORY_IMAGES[list[0]] ||
          "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80",
      },
      ...list.map((sub) => ({
        id: sub,
        name: sub,
        imageUrl:
          SUBCATEGORY_IMAGES[sub] ||
          "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80",
      })),
    ];
  }, [parentCategory]);

  // Redux Category Products State (Isolated from global home store catalog)
  const {
    categoryProducts,
    categoryLoading,
    categoryLoadingMore,
    categoryHasMore,
    categoryCurrentPage,
  } = useAppSelector((state) => state.product);

  // 4. Fetch Products from Redux / Backend API
  const loadProducts = useCallback(
    async (page = 1) => {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (filters.priceRange === "under200") {
        maxPrice = 200;
      } else if (filters.priceRange === "200to500") {
        minPrice = 200;
        maxPrice = 500;
      } else if (filters.priceRange === "above500") {
        minPrice = 500;
      }

      await dispatch(
        fetchCategoryProducts({
          category: parentCategory,
          subCategory:
            selectedSubcategory === "all" ? undefined : selectedSubcategory,
          sortBy: (filters.sortBy as any) || (sortBy as any) || "popularity",
          minPrice,
          maxPrice,
          inStockOnly: filters.inStockOnly,
          page,
          limit: 20,
        })
      );
    },
    [dispatch, parentCategory, selectedSubcategory, filters, sortBy]
  );

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts(1);
    setRefreshing(false);
  }, [loadProducts]);

  const handleEndReached = useCallback(() => {
    if (!categoryLoading && !categoryLoadingMore && categoryHasMore) {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (filters.priceRange === "under200") {
        maxPrice = 200;
      } else if (filters.priceRange === "200to500") {
        minPrice = 200;
        maxPrice = 500;
      } else if (filters.priceRange === "above500") {
        minPrice = 500;
      }

      dispatch(
        fetchCategoryProducts({
          category: parentCategory,
          subCategory:
            selectedSubcategory === "all" ? undefined : selectedSubcategory,
          sortBy: (filters.sortBy as any) || (sortBy as any) || "popularity",
          minPrice,
          maxPrice,
          inStockOnly: filters.inStockOnly,
          page: (categoryCurrentPage || 1) + 1,
          limit: 20,
        })
      );
    }
  }, [
    dispatch,
    categoryLoading,
    categoryLoadingMore,
    categoryHasMore,
    categoryCurrentPage,
    parentCategory,
    selectedSubcategory,
    filters,
    sortBy,
  ]);

  const handleProductPress = useCallback((prod: ProductItem) => {
    const prodId = prod._id || prod.id || "";
    const imgUrl =
      prod.images && prod.images.length > 0 ? prod.images[0].url : "";

    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: prodId,
        name: prod.name,
        price: String(prod.price),
        originalPrice: String(prod.originalPrice || prod.price),
        rating: String((prod.ratingsAverage || 4.5).toFixed(1)),
        image: imgUrl,
        weight: prod.unit || "1 pc",
        description: prod.description || "",
        brand: prod.brand || "",
        category: prod.category || "",
        subCategory: prod.subCategory || "",
      },
    });
  }, [router]);

  const handleAddToCart = useCallback(
    (product: ProductItem, imgUrl: string) => {
      const prodId = product._id || product.id || "";
      addToCart({
        id: prodId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        imageUrl: imgUrl,
        weight: product.unit || "1 pc",
      });
    },
    [addToCart]
  );

  const handleUpdateQuantity = useCallback(
    (id: string, delta: number) => {
      updateQuantity(id, delta);
    },
    [updateQuantity]
  );

  // Filter products by in-screen search query
  const displayedProducts = useMemo(() => {
    if (!searchQuery.trim()) return categoryProducts;
    const q = searchQuery.trim().toLowerCase();
    return (categoryProducts || []).filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const brandMatch = p.brand?.toLowerCase().includes(q);
      const subCatMatch = p.subCategory?.toLowerCase().includes(q);
      const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q));
      return Boolean(nameMatch || brandMatch || subCatMatch || tagMatch);
    });
  }, [categoryProducts, searchQuery]);

  const keyExtractor = useCallback(
    (item: ProductItem) => item._id || item.id || "",
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductItem }) => {
      const prodId = item._id || item.id || "";
      const qty = getItemQuantity(prodId);
      return (
        <CategoryExpandProductCard
          product={item}
          quantity={qty}
          onPress={handleProductPress}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
        />
      );
    },
    [getItemQuantity, handleProductPress, handleAddToCart, handleUpdateQuantity]
  );

  const renderFooter = useCallback(() => {
    if (categoryLoadingMore) {
      return (
        <View style={{ paddingVertical: scale(16), alignItems: "center" }}>
          <ActivityIndicator size="small" color="#016073" />
        </View>
      );
    }
    return <View style={{ height: scale(40) }} />;
  }, [categoryLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (categoryLoading && (!categoryProducts || categoryProducts.length === 0)) {
      return (
        <View style={styles.productsGrid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <CategoryProductSkeleton
              key={`cat-skel-${item}`}
              animOpacity={pulseAnim}
            />
          ))}
        </View>
      );
    }
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={scale(44)} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Matching Products</Text>
          <Text style={styles.emptySubtitle}>
            No products found matching "{searchQuery.trim()}" in this category.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={scale(44)} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No Products Found</Text>
        <Text style={styles.emptySubtitle}>
          No items match this category or filter right now. Check back soon!
        </Text>
      </View>
    );
  }, [categoryLoading, categoryProducts, pulseAnim, searchQuery]);

  const handleSortPress = useCallback(() => {
    Alert.alert("Sort Products", "Choose sorting option", [
      {
        text: "Popularity",
        onPress: () => {
          setSortBy("popularity");
          setFilters((prev) => ({ ...prev, sortBy: "popularity" }));
        },
      },
      {
        text: "Price: Low to High",
        onPress: () => {
          setSortBy("price_asc");
          setFilters((prev) => ({ ...prev, sortBy: "price_asc" }));
        },
      },
      {
        text: "Price: High to Low",
        onPress: () => {
          setSortBy("price_desc");
          setFilters((prev) => ({ ...prev, sortBy: "price_desc" }));
        },
      },
      {
        text: "Customer Rating",
        onPress: () => {
          setSortBy("rating");
          setFilters((prev) => ({ ...prev, sortBy: "rating" }));
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Floating Cart Bar */}
      <FloatingCartBar bottomOffset={scale(16)} />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.navIconBtn}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.titleColumn}>
            <Text numberOfLines={1} style={styles.navTitle}>
              {selectedSubcategory !== "all"
                ? selectedSubcategory
                : parentCategory}
            </Text>
            <Text numberOfLines={1} style={styles.navSubtitle}>
              {parentCategory}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setIsSearchOpen((prev) => {
                const nextState = !prev;
                if (!nextState) setSearchQuery("");
                return nextState;
              });
            }}
            style={[
              styles.navIconBtn,
              isSearchOpen && styles.navIconBtnActive,
            ]}
          >
            <Feather
              name={isSearchOpen ? "x" : "search"}
              size={scale(20)}
              color={isSearchOpen ? "#016073" : "#1E293B"}
            />
          </TouchableOpacity>
        </View>

        {/* Dropdown In-Screen Search Bar */}
        {isSearchOpen && (
          <View style={styles.dropdownSearchContainer}>
            <View style={styles.dropdownSearchInputWrapper}>
              <Feather
                name="search"
                size={scale(16)}
                color="#64748B"
                style={styles.dropdownSearchIcon}
              />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder={`Search in ${
                  selectedSubcategory !== "all"
                    ? selectedSubcategory
                    : parentCategory
                }...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchBtn}
                >
                  <Feather name="x" size={scale(15)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Master-Detail Layout */}
      <View style={styles.contentLayout}>
        {/* Left Vertical Subcategory Rail */}
        <View style={styles.sidebarContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarScroll}
          >
            {subcategoryList.map((sub) => {
              const isActive = sub.id === selectedSubcategory;
              return (
                <TouchableOpacity
                  key={sub.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSubcategory(sub.id)}
                  style={[
                    styles.sidebarItem,
                    isActive && styles.sidebarItemActive,
                  ]}
                >
                  {/* Right Active Indicator Bar */}
                  {isActive && <View style={styles.activeRightBar} />}

                  {/* Circular Avatar Icon */}
                  <View
                    style={[
                      styles.subAvatarCircle,
                      isActive
                        ? styles.subAvatarCircleActive
                        : styles.subAvatarCircleInactive,
                    ]}
                  >
                    <Image
                      source={{ uri: sub.imageUrl }}
                      style={styles.subAvatarImg}
                      contentFit="cover"
                    />
                  </View>

                  {/* Subcategory Label */}
                  <Text
                    style={[
                      styles.subNameText,
                      isActive && styles.subNameTextActive,
                    ]}
                    numberOfLines={2}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Product Grid Area */}
        <View style={styles.rightProductArea}>
          {/* Top Filter and Sort Control Row */}
          <View style={styles.controlsRow}>
            {/* Filters Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsFilterModalVisible(true)}
              style={styles.controlPillBtn}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={scale(15)}
                color="#016073"
              />
              <Text style={styles.controlPillText}>Filters</Text>
              <Feather name="chevron-down" size={scale(13)} color="#64748B" />
            </TouchableOpacity>

            {/* Sort Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleSortPress}
              style={styles.controlPillBtn}
            >
              <MaterialCommunityIcons
                name="swap-vertical"
                size={scale(16)}
                color="#016073"
              />
              <Text style={styles.controlPillText}>
                {sortBy === "price_asc"
                  ? "Price: Low to High"
                  : sortBy === "price_desc"
                  ? "Price: High to Low"
                  : sortBy === "rating"
                  ? "Top Rated"
                  : "Sort"}
              </Text>
              <Feather name="chevron-down" size={scale(13)} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Virtualized Product Grid List */}
          <FlatList
            data={displayedProducts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={4}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === "android"}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridScrollContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#016073"]}
                tintColor="#016073"
              />
            }
          />
        </View>
      </View>

      {/* Filter Bottom Sheet Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={(newFilters: FilterState) => {
          setFilters(newFilters);
          setIsFilterModalVisible(false);
        }}
        onResetFilters={() => {
          setFilters({
            sortBy: "popularity",
            priceRange: "all",
            selectedBrands: [],
            minDiscount: 0,
            inStockOnly: false,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaHeader: {
    backgroundColor: "#FFFFFF",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
  },
  navIconBtn: {
    width: scale(36),
    height: scale(36),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(18),
    backgroundColor: "#F8FAFC",
  },
  navIconBtnActive: {
    backgroundColor: "#E0F2FE",
  },
  dropdownSearchContainer: {
    paddingHorizontal: scale(14),
    paddingBottom: scale(10),
    paddingTop: scale(2),
  },
  dropdownSearchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(12),
    paddingHorizontal: scale(10),
    height: scale(40),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownSearchIcon: {
    marginRight: scale(6),
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: scale(4),
  },
  titleColumn: {
    flex: 1,
    marginLeft: scale(10),
  },
  navTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#0F172A",
  },
  navSubtitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  contentLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarContainer: {
    width: scale(88),
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
  },
  sidebarScroll: {
    paddingVertical: scale(6),
    paddingBottom: scale(150),
  },
  sidebarItem: {
    alignItems: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(4),
    position: "relative",
  },
  sidebarItemActive: {
    backgroundColor: "#EFF6FF",
  },
  activeRightBar: {
    position: "absolute",
    right: 0,
    top: scale(8),
    bottom: scale(8),
    width: scale(3.5),
    backgroundColor: "#016073",
    borderTopLeftRadius: scale(3),
    borderBottomLeftRadius: scale(3),
  },
  subAvatarCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(5),
    overflow: "hidden",
  },
  subAvatarCircleActive: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1.8,
    borderColor: "#016073",
  },
  subAvatarCircleInactive: {
    backgroundColor: "#F1F5F9",
  },
  subAvatarImg: {
    width: "100%",
    height: "100%",
  },
  subNameText: {
    fontSize: moderateScale(10),
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
    lineHeight: moderateScale(13),
  },
  subNameTextActive: {
    color: "#016073",
    fontWeight: "700",
  },
  rightProductArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    gap: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  controlPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: scale(9),
    paddingVertical: scale(5),
    borderRadius: scale(8),
    gap: scale(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  controlPillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#334155",
  },
  gridScrollContent: {
    paddingHorizontal: scale(10),
    paddingTop: scale(10),
    paddingBottom: scale(140),
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(14),
  },
  productCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
  },
  cardImageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(6),
    marginBottom: scale(6),
    overflow: "hidden",
  },
  productImg: {
    width: "86%",
    height: "86%",
  },
  discountBadge: {
    position: "absolute",
    top: scale(6),
    left: scale(6),
    backgroundColor: "#EF4444",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(8.5),
    fontWeight: "800",
  },
  outOfStockBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(4),
  },
  addBtnOverlay: {
    position: "absolute",
    bottom: scale(6),
    right: scale(6),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#016073",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    color: "#016073",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  counterOverlay: {
    position: "absolute",
    bottom: scale(6),
    right: scale(6),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#016073",
    borderRadius: scale(8),
    paddingHorizontal: scale(4),
    paddingVertical: scale(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  counterActionBtn: {
    padding: scale(2),
  },
  counterQtyText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#016073",
    marginHorizontal: scale(4),
  },
  weightTagPill: {
    backgroundColor: "#F1F5F9",
    alignSelf: "flex-start",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginBottom: scale(3),
  },
  weightTagText: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "600",
  },
  productNameText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: moderateScale(15),
    marginBottom: scale(3),
    minHeight: scale(30),
  },
  starRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(3),
  },
  starsGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingScoreText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#475569",
    marginRight: scale(3),
  },
  reviewsCountText: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
  },
  currentPriceText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  mrpText: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: moderateScale(16),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});
