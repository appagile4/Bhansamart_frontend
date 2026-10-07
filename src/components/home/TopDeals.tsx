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
        };
      });

      // Filter: discount > 50% AND ordersCount > 100
      const matchedDeals = allDeals.filter(
        (p) => p.discountPct > 50 && p.ordersCount > 100
      );

      if (matchedDeals.length > 0) {
        return matchedDeals;
      }

      // Fallback: top trending products sorted by orders and discount
      return allDeals
        .sort(
          (a, b) =>
            b.ordersCount - a.ordersCount || b.discountPct - a.discountPct
        )
        .slice(0, 12);
    }

    return [];
  }, [items, publicProducts]);

  const allItems = displayItems;

  // Extract up to 3 real live thumbnails for the bottom "See all products" banner
  const previewThumbnails = useMemo(() => {
    if (allItems && allItems.length > 0) {
      return allItems.slice(0, 3).map((p) => p.image);
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
    allItems.forEach((item) => columns.push([item]));
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
            {previewThumbnails.map((imgSrc, idx) => (
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
