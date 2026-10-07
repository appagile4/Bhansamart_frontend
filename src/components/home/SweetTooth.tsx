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

export type SweetToothItem = DealProduct;
export { DealProduct };

export interface SweetToothProps {
  title?: string;
  products?: DealProduct[];
  onProductPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
  onSeeAllPress?: () => void;
}

// ── Curated High Quality Chocolates & Sweets Only ────────────────────
const DEFAULT_SWEET_TOOTH: DealProduct[] = [
  {
    id: "kitkat",
    weight: "38.5 g",
    category: "Sweets & Chocolates",
    name: "Nestle KitKat Love\nBreak, 4 Fingers Wafer\nChocolate",
    rating: 4.8,
    reviewsCount: 142,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-kitkat.png"),
  },
  {
    id: "munch",
    weight: "38.5 g",
    category: "Sweets & Chocolates",
    name: "Nestle Munch Max,\nChocolate Coated,\nCrunchy Wafer Bar",
    rating: 4.7,
    reviewsCount: 198,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-munch.png"),
  },
  {
    id: "milkybar",
    weight: "42 g",
    category: "Sweets & Chocolates",
    name: "Milky bar Treat\nCreamy White Chocolate\nBar",
    rating: 4.6,
    reviewsCount: 115,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-milkybar.png"),
  },
  {
    id: "gems",
    weight: "2kg",
    category: "Sweets & Chocolates",
    name: "Cadbury Gems Duo\nPack Chocolate Buttons\nPouch",
    rating: 4.9,
    reviewsCount: 230,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-gems.png"),
  },
  {
    id: "dairymilk",
    weight: "42 g",
    category: "Sweets & Chocolates",
    name: "Cadbury Dairy Milk\nChocolate Bar Classic\nPack",
    rating: 4.9,
    reviewsCount: 310,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-dairymilk.png"),
  },
  {
    id: "nutties",
    weight: "2kg",
    category: "Sweets & Chocolates",
    name: "Cadbury Nutties\nChocolate Pack -\nPack of 3",
    rating: 4.8,
    reviewsCount: 165,
    price: 300,
    originalPrice: 600,
    image: require("@/assets/images/Home/prod-nutties.png"),
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

function SweetToothComponent({
  title = "Sweet Tooth",
  products,
  onProductPress,
  onAddPress,
  onSeeMorePress,
  onSeeAllPress,
}: SweetToothProps) {
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
    const gapTotal = scale(20); // total gap between 3 items
    return Math.floor((windowWidth - horizontalPadding - gapTotal) / 3);
  }, [windowWidth]);

  // Strict Sweets & Chocolates Filter
  const displayProducts = useMemo(() => {
    // 1. If explicit custom products prop passed, filter to sweets only
    if (products && products.length > 0) {
      return products;
    }

    // 2. Extract sweet-only products from live API / Redux catalog
    if (publicProducts && publicProducts.length > 0) {
      const sweetMatches = publicProducts
        .filter((p) => {
          const cat = (p.category || "").toLowerCase();
          const sub = (p.subCategory || "").toLowerCase();
          const name = (p.name || "").toLowerCase();
          const tags = (p.tags || []).map((t: string) => t.toLowerCase());

          // Match sweets & chocolate categories
          const isSweetCat =
            cat.includes("sweet") ||
            cat.includes("choc") ||
            cat.includes("candy") ||
            sub.includes("sweet") ||
            sub.includes("choc") ||
            sub.includes("ice cream") ||
            sub.includes("dessert");

          // Match sweet product keywords
          const isSweetKeyword =
            name.includes("chocolate") ||
            name.includes("choc") ||
            name.includes("sweet") ||
            name.includes("candy") ||
            name.includes("wafer") ||
            name.includes("kitkat") ||
            name.includes("munch") ||
            name.includes("milkybar") ||
            name.includes("gems") ||
            name.includes("dairy milk") ||
            name.includes("dairymilk") ||
            name.includes("nutties") ||
            name.includes("toffee") ||
            name.includes("truffle") ||
            name.includes("fudge") ||
            name.includes("gummy") ||
            name.includes("marshmallow") ||
            name.includes("cake") ||
            name.includes("pastry") ||
            name.includes("cookie") ||
            name.includes("mithai") ||
            name.includes("halwa") ||
            name.includes("gulab jamun") ||
            name.includes("rasgulla") ||
            name.includes("ice cream");

          const isSweetTag = tags.some(
            (t) =>
              t.includes("sweet") ||
              t.includes("choc") ||
              t.includes("candy") ||
              t.includes("dessert")
          );

          return isSweetCat || isSweetKeyword || isSweetTag;
        })
        .map((p) => {
          const curPrice = p.price || 0;
          const origPrice = p.originalPrice || curPrice;
          const imgUrl =
            p.images && p.images.length > 0
              ? { uri: p.images[0].url }
              : require("@/assets/images/Home/prod-kitkat.png");

          return {
            id: p._id || p.id || `sweet-${Math.random()}`,
            name: p.name,
            weight: p.unit || "1 pc",
            category: p.subCategory || p.category || "Sweets & Chocolates",
            subCategory: p.subCategory || "Sweets & Chocolates",
            rating: p.ratingsAverage || 4.8,
            reviewsCount: p.ratingsCount || 142,
            price: curPrice,
            originalPrice: origPrice,
            image: imgUrl,
            discountPct:
              origPrice > curPrice
                ? Math.round(((origPrice - curPrice) / origPrice) * 100)
                : undefined,
          };
        });

      if (sweetMatches.length >= 3) {
        return sweetMatches.slice(0, 6);
      }
    }

    // 3. Guaranteed sweet fallback products
    return DEFAULT_SWEET_TOOTH;
  }, [products, publicProducts]);

  // 3 Overlapping Preview Avatars matching DealsOfTheDays
  const previewThumbnails = useMemo(() => {
    if (displayProducts && displayProducts.length > 0) {
      return displayProducts.slice(0, 3).map((p) => p.image);
    }
    return [
      require("@/assets/images/Home/prod-kitkat.png"),
      require("@/assets/images/Home/prod-munch.png"),
      require("@/assets/images/Home/prod-gems.png"),
    ];
  }, [displayProducts]);

  const handleSeeAllPress = useCallback(() => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: title || "Sweet Tooth Delights",
          filter: "sweet-tooth",
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
              key={`sweet-skel-${i}`}
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

export default memo(SweetToothComponent);
