import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export type InstantProductItem = DealProduct;
export { DealProduct };

export interface InstantFrozenFoodProps {
  title?: string;
  products?: DealProduct[];
  onProductPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
  onSeeAllPress?: () => void;
}

// ── Curated Instant Delivery & Ready-to-Cook / Frozen Foods ───────────
const DEFAULT_INSTANT_PRODUCTS: DealProduct[] = [
  {
    id: "maggi-masala",
    weight: "280 g",
    category: "Instant Noodles",
    name: "Maggi Masala - 2\nMinutes Instant\nNoodles 4-Pack",
    rating: 4.8,
    reviewsCount: 245,
    price: 120,
    originalPrice: 150,
    image: require("@/assets/images/Home/product-maggi.png"),
  },
  {
    id: "waiwai-chicken",
    weight: "375 g",
    category: "Instant Noodles",
    name: "Wai Wai Quick Ready\nTo Eat Chicken\nMasala Noodles",
    rating: 4.9,
    reviewsCount: 312,
    price: 100,
    originalPrice: 125,
    image: require("@/assets/images/Home/product-waiwai.png"),
  },
  {
    id: "2pm-spicy",
    weight: "300 g",
    category: "Instant Noodles",
    name: "2PM Akabare Spicy\nChicken Masala\nInstant Noodles",
    rating: 4.7,
    reviewsCount: 184,
    price: 130,
    originalPrice: 160,
    image: require("@/assets/images/Home/product-2pm.png"),
  },
  {
    id: "frozen-sausages",
    weight: "500 g",
    category: "Frozen & Ready Meat",
    name: "Farm Fresh Chicken\nSausages & Meat\nTray Pack",
    rating: 4.8,
    reviewsCount: 156,
    price: 340,
    originalPrice: 420,
    image: require("@/assets/images/Home/fresh-meat-sausages-tray.png"),
  },
  {
    id: "instant-pasta",
    weight: "250 g",
    category: "Instant Pasta",
    name: "Cheesy Cream Pasta\nQuick Ready 5-Min\nTreat",
    rating: 4.6,
    reviewsCount: 98,
    price: 180,
    originalPrice: 220,
    image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
  },
  {
    id: "instant-cereal",
    weight: "400 g",
    category: "Instant Breakfast",
    name: "Kellogg's Crunchy\nInstant Corn Flakes\nBreakfast Pack",
    rating: 4.7,
    reviewsCount: 178,
    price: 280,
    originalPrice: 350,
    image: require("@/assets/images/Home/kelloggs-combo.png"),
  },
];

// ── Animated Skeleton Card for 3-Column Grid ─────────────────────────
function ProductCardGridSkeleton({
  cardWidth,
  animOpacity,
}: {
  cardWidth: number;
  animOpacity: Animated.Value;
}) {
  const imageHeight = Math.round(cardWidth * 0.95);

  return (
    <View style={[styles.skeletonCard, { width: cardWidth }]}>
      {/* Image Skeleton Box */}
      <Animated.View
        style={[
          styles.skeletonBlock,
          styles.skeletonImageBox,
          { height: imageHeight, opacity: animOpacity },
        ]}
      />

      {/* Details Box */}
      <View style={styles.skeletonDetails}>
        {/* Weight Tag */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: scale(45), height: scale(14), marginBottom: scale(6), opacity: animOpacity },
          ]}
        />

        {/* Title Lines */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "90%", height: scale(12), marginBottom: scale(4), opacity: animOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "60%", height: scale(12), marginBottom: scale(8), opacity: animOpacity },
          ]}
        />

        {/* Rating Line */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: scale(60), height: scale(11), marginBottom: scale(8), opacity: animOpacity },
          ]}
        />

        {/* Price & Add Row */}
        <View style={styles.skeletonPriceRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(45), height: scale(16), opacity: animOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              { width: scale(38), height: scale(22), borderRadius: scale(6), opacity: animOpacity },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function InstantFrozenFoodComponent({
  title = "Instant & Frozen Food",
  products,
  onProductPress,
  onAddPress,
  onSeeMorePress,
  onSeeAllPress,
}: InstantFrozenFoodProps) {
  const router = useRouter();
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
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

  // Dynamic 3-column card width calculation with gutters
  const cardWidth = useMemo(() => {
    const horizontalPadding = scale(32); // 16 on each side
    const gapTotal = scale(20); // total gap between columns
    return Math.floor((windowWidth - horizontalPadding - gapTotal) / 3);
  }, [windowWidth]);

  // Strict Instant & Quick Meal Filter
  const displayProducts = useMemo(() => {
    // 1. If explicit custom products prop passed, use it
    if (products && products.length > 0) {
      return products;
    }

    // 2. Extract instant & frozen delivery products from live Redux catalog
    if (publicProducts && publicProducts.length > 0) {
      const instantMatches = publicProducts
        .filter((p) => {
          const cat = (p.category || "").toLowerCase();
          const sub = (p.subCategory || "").toLowerCase();
          const name = (p.name || "").toLowerCase();
          const tags = (p.tags || []).map((t: string) => t.toLowerCase());

          // Match instant, noodles, pasta, frozen categories
          const isInstantCat =
            cat.includes("instant") ||
            cat.includes("frozen") ||
            sub.includes("instant") ||
            sub.includes("noodle") ||
            sub.includes("pasta") ||
            sub.includes("frozen") ||
            sub.includes("ready");

          // Match instant meal keywords (maggi, waiwai, 2pm, noodles, pasta, chicken sausages, nuggets, ramen, soup)
          const isInstantKeyword =
            name.includes("maggi") ||
            name.includes("wai wai") ||
            name.includes("waiwai") ||
            name.includes("2pm") ||
            name.includes("noodle") ||
            name.includes("pasta") ||
            name.includes("macaroni") ||
            name.includes("ramen") ||
            name.includes("chowmein") ||
            name.includes("soup") ||
            name.includes("sausage") ||
            name.includes("nugget") ||
            name.includes("frozen") ||
            name.includes("ready to eat") ||
            name.includes("ready to cook") ||
            name.includes("popcorn") ||
            name.includes("cereal") ||
            name.includes("oats") ||
            name.includes("cornflakes") ||
            name.includes("flakes");

          const isInstantTag = tags.some(
            (t) =>
              t.includes("instant") ||
              t.includes("noodle") ||
              t.includes("pasta") ||
              t.includes("frozen") ||
              t.includes("quick")
          );

          return isInstantCat || isInstantKeyword || isInstantTag;
        })
        .map((p) => {
          const curPrice = p.price || 0;
          const origPrice = p.originalPrice || curPrice;
          const imgUrl =
            p.images && p.images.length > 0
              ? { uri: p.images[0].url }
              : require("@/assets/images/Home/product-maggi.png");

          return {
            id: p._id || p.id || `instant-${Math.random()}`,
            name: p.name,
            weight: p.unit || "1 pc",
            category: p.subCategory || p.category || "Instant Food",
            subCategory: p.subCategory || "Instant Food",
            rating: p.ratingsAverage || 4.7,
            reviewsCount: p.ratingsCount || 120,
            price: curPrice,
            originalPrice: origPrice,
            image: imgUrl,
            discountPct:
              origPrice > curPrice
                ? Math.round(((origPrice - curPrice) / origPrice) * 100)
                : undefined,
          };
        });

      if (instantMatches.length >= 3) {
        return instantMatches.slice(0, 6);
      }
    }

    // 3. Fallback to curated instant food catalog
    return DEFAULT_INSTANT_PRODUCTS;
  }, [products, publicProducts]);

  // 3 Overlapping Preview Avatars matching DealsOfTheDays
  const previewThumbnails = useMemo(() => {
    if (displayProducts && displayProducts.length > 0) {
      return displayProducts.slice(0, 3).map((p) => p.image);
    }
    return [
      require("@/assets/images/Home/product-maggi.png"),
      require("@/assets/images/Home/product-waiwai.png"),
      require("@/assets/images/Home/product-2pm.png"),
    ];
  }, [displayProducts]);

  const handleSeeAllPress = useCallback(() => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: title || "Instant & Frozen Food",
          filter: "instant-frozen",
          minDiscount: "30",
        },
      });
    }
  }, [onSeeAllPress, router, title]);

  // ── Skeleton View While Loading Backend Products ──────────────────
  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        {/* Section Header with Side Lines */}
        <View style={styles.headerRow}>
          <View style={styles.headerLine} />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            {title}
          </Text>
          <View style={styles.headerLine} />
        </View>

        {/* 3-Column Grid of 6 Skeletons */}
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCardGridSkeleton
              key={`instant-skel-${i}`}
              cardWidth={cardWidth}
              animOpacity={pulseAnim}
            />
          ))}
        </View>

        {/* Bottom See All Bar Skeleton */}
        <Animated.View
          style={[
            styles.seeAllBar,
            styles.skeletonBlock,
            { opacity: pulseAnim, height: scale(46), marginTop: moderateScale(14) },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header with Side Lines matching DealsOfTheDays */}
      <View style={styles.headerRow}>
        <View style={styles.headerLine} />
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          {title}
        </Text>
        <View style={styles.headerLine} />
      </View>

      {/* 3-Column Product Cards Grid */}
      <View style={styles.grid}>
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cardWidth={cardWidth}
            onPress={onProductPress}
            onAddPress={onAddPress}
            onSeeMorePress={onSeeMorePress}
          />
        ))}
      </View>

      {/* See All Products Bottom Bar with 3 Real Product Images matching DealsOfTheDays */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSeeAllPress}
        style={styles.seeAllBar}
      >
        {/* 3 Real Product Overlapping Thumbnail Avatars */}
        <View style={styles.avatarGroup}>
          {previewThumbnails.map((imgSrc, idx) => (
            <View
              key={`thumb-${idx}`}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
    gap: scale(12),
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#D1D5DB",
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(12),
  },
  seeAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBF4F6",
    marginTop: moderateScale(14),
    paddingVertical: scale(11),
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
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: scale(8),
  },
  skeletonImageBox: {
    width: "100%",
    borderTopLeftRadius: scale(14),
    borderTopRightRadius: scale(14),
  },
  skeletonDetails: {
    padding: scale(8),
  },
  skeletonPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(2),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
  skeletonLine: {
    borderRadius: scale(4),
  },
});

export default memo(InstantFrozenFoodComponent);
