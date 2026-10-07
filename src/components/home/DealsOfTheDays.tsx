import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPublicProducts } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export { DealProduct };

interface DealsOfTheDaysProps {
  title?: string;
  products?: DealProduct[];
  onProductPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
  onSeeAllPress?: () => void;
}

// ── Animated Skeleton Card Component ─────────────────────────────
function DealCardSkeleton({ animOpacity }: { animOpacity: Animated.Value }) {
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
      {/* Top Image Box */}
      <Animated.View
        style={[
          styles.cardImageWrapper,
          styles.skeletonBlock,
          { height: dynamicImageHeight, opacity: animOpacity },
        ]}
      />

      {/* Card Details Body */}
      <View style={styles.cardDetails}>
        {/* Title Skeleton Line */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "85%", height: scale(16), marginBottom: scale(6), opacity: animOpacity },
          ]}
        />

        {/* Subtitle Skeleton */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            styles.skeletonLine,
            { width: "55%", height: scale(12), marginBottom: scale(10), opacity: animOpacity },
          ]}
        />

        {/* Rating & Veg Badge Row Skeleton */}
        <View style={styles.metaRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(80), height: scale(14), opacity: animOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              { width: scale(65), height: scale(18), borderRadius: scale(10), opacity: animOpacity },
            ]}
          />
        </View>

        {/* Price Row Skeleton */}
        <View style={styles.priceRow}>
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(65), height: scale(22), opacity: animOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBlock,
              styles.skeletonLine,
              { width: scale(45), height: scale(14), opacity: animOpacity },
            ]}
          />
        </View>

        {/* Trust Badges Divider Skeleton */}
        <Animated.View
          style={[
            styles.skeletonBlock,
            { width: "100%", height: scale(26), borderRadius: scale(6), marginVertical: scale(8), opacity: animOpacity },
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

export default function DealsOfTheDays({
  title = "DEALS OF THE DAY",
  products,
  onProductPress,
  onSeeMorePress,
  onSeeAllPress,
}: DealsOfTheDaysProps) {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
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

  // Automatically fetch products on mount if not loaded
  useEffect(() => {
    if (!publicProducts || publicProducts.length === 0) {
      dispatch(fetchPublicProducts());
    }
  }, [dispatch, publicProducts]);

  const displayProducts = useMemo(() => {
    // 1. If explicit products prop is passed
    if (products && products.length > 0) {
      const filtered = products.filter((p) => {
        const orig = p.originalPrice || p.price;
        const cur = p.price;
        const disc = orig > cur ? Math.round(((orig - cur) / orig) * 100) : 0;
        return disc >= 40;
      });
      return filtered.length > 0 ? filtered : products;
    }

    // 2. Map & Filter real publicProducts from MongoDB
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

        const imgUrl =
          p.images && p.images.length > 0
            ? p.images[0].url
            : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80";

        return {
          id: p._id || p.id || String(Math.random()),
          weight: p.unit || "1 unit",
          category: p.category || "Grocery",
          subCategory: p.subCategory || "",
          name: p.name,
          rating: p.ratingsAverage || 4.5,
          reviewsCount: p.ratingsCount || 45,
          price: curPrice,
          originalPrice: origPrice > curPrice ? origPrice : curPrice,
          priceDropText: `${discountPct}% OFF`,
          image: { uri: imgUrl },
          discountPct,
        };
      });

      // Filter products with >= 40% discount
      const dealsOver40 = allDeals.filter((item) => item.discountPct >= 40);

      // If >= 40% discount products exist, show them; otherwise fallback to top discounted products
      if (dealsOver40.length > 0) {
        return dealsOver40;
      }

      // Sort by highest discount
      return allDeals.sort((a, b) => b.discountPct - a.discountPct).slice(0, 10);
    }

    return [];
  }, [products, publicProducts]);

  // Extract first 3 real product images for the bottom "See all products" bar
  const previewThumbnails = useMemo(() => {
    if (displayProducts && displayProducts.length > 0) {
      return displayProducts.slice(0, 3).map((p) => p.image);
    }
    if (publicProducts && publicProducts.length > 0) {
      return publicProducts
        .slice(0, 3)
        .map((p) =>
          p.images && p.images.length > 0
            ? { uri: p.images[0].url }
            : require("@/assets/images/Home/product-maggi.png")
        );
    }
    return [
      require("@/assets/images/Home/product-maggi.png"),
      require("@/assets/images/Home/product-waiwai.png"),
      require("@/assets/images/Home/product-2pm.png"),
    ];
  }, [displayProducts, publicProducts]);

  const handleProductPress = React.useCallback(
    (product: DealProduct) => {
      if (onProductPress) {
        onProductPress(product);
      } else {
        router.push({
          pathname: "/Screens/Product/productdetailscreen" as any,
          params: {
            id: product.id,
            name: product.name,
            price: String(product.price),
            originalPrice: String(product.originalPrice),
            image:
              typeof product.image === "object" && "uri" in product.image
                ? (product.image as any).uri
                : "",
            weight: product.weight,
            category: product.category,
          },
        });
      }
    },
    [onProductPress, router]
  );

  const handleSeeMorePress = React.useCallback(
    (product: DealProduct) => {
      if (onSeeMorePress) {
        onSeeMorePress(product);
      } else {
        router.push({
          pathname: "/Screens/Category/categoryExpand" as any,
          params: {
            category: product.category || "Grocery & Kitchen",
            subCategory: (product as any).subCategory || product.category,
            title: product.name,
          },
        });
      }
    },
    [onSeeMorePress, router]
  );

  const handleSeeAllPress = React.useCallback(() => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params: {
          title: "Deals of the Day",
          filter: "deals",
          minDiscount: "40",
        },
      });
    }
  }, [onSeeAllPress, router]);

  const renderProductItem = React.useCallback(
    ({ item }: { item: DealProduct }) => (
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onSeeMorePress={handleSeeMorePress}
      />
    ),
    [handleProductPress, handleSeeMorePress]
  );

  // ── 1. Skeleton Loading View when fetching from backend ──────────
  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        {/* Section Header with Side Lines */}
        <View style={styles.headerRow}>
          <View style={styles.headerLine} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Skeleton Cards Carousel */}
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => <DealCardSkeleton animOpacity={pulseAnim} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: scale(12) }} />}
        />

        {/* Bottom See All Bar Skeleton */}
        <Animated.View
          style={[
            styles.seeAllBar,
            styles.skeletonBlock,
            { opacity: pulseAnim, height: scale(46) },
          ]}
        />
      </View>
    );
  }

  // ── 2. If no products available and not loading, gracefully return null ──
  if (displayProducts.length === 0) {
    return null;
  }

  // ── 3. Live Product Data View ──────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Section Header with Side Lines */}
      <View style={styles.headerRow}>
        <View style={styles.headerLine} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Horizontal Carousel of Deals */}
      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={3}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: scale(12) }} />}
      />

      {/* See All Products Bottom Bar with 3 Real Product Images */}
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
    marginVertical: moderateScale(10),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(16),
    marginBottom: moderateScale(14),
    gap: scale(12),
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#D1D5DB",
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: "900",
    color: "#2C6E49",
    fontStyle: "italic",
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(12),
  },
  seeAllBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: scale(16),
    marginTop: moderateScale(8),
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
    borderRadius: scale(14),
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImageWrapper: {
    width: "100%",
    borderTopLeftRadius: scale(14),
    borderTopRightRadius: scale(14),
  },
  cardDetails: {
    padding: scale(10),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(7),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
    marginBottom: moderateScale(2),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
  skeletonLine: {
    borderRadius: scale(4),
  },
  addToCartBtnSkeleton: {
    height: scale(36),
    borderRadius: scale(10),
  },
});
