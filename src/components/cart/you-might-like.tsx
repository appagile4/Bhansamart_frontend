import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface RecommendedProduct {
  id: string;
  name: string;
  badge?: string;
  tags?: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  imageUrl?: string;
  image?: any;
  weight?: string;
  category?: string;
  subCategory?: string;
  discountPct?: number;
  isVeg?: boolean;
}

interface YouMightLikeSectionProps {
  products?: (RecommendedProduct | DealProduct | any)[];
  onAddToCart?: (product: any) => void;
  onSeeAllPress?: () => void;
  onProductPress?: (product: any) => void;
}

// ── Fallback items if no products provided ───────────────────────────
const DEFAULT_FALLBACK_ITEMS: RecommendedProduct[] = [
  {
    id: "rec-1",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    badge: "Bestseller",
    tags: ["280g", "Instant Food"],
    price: 120,
    originalPrice: 140,
    rating: 4.8,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
    weight: "280g",
    category: "Grocery",
  },
  {
    id: "rec-2",
    name: "Wai Wai Ready To Eat Chicken Masala",
    badge: "Hot Deal",
    tags: ["375g", "Noodles"],
    price: 100,
    originalPrice: 120,
    rating: 4.7,
    reviewsCount: 290,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
    weight: "375g",
    category: "Grocery",
  },
  {
    id: "rec-3",
    name: "Lay's Classic Salted Potato Chips",
    badge: "Trending",
    tags: ["115g", "Snacks"],
    price: 80,
    originalPrice: 90,
    rating: 4.9,
    reviewsCount: 512,
    imageUrl:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80",
    weight: "115g",
    category: "Snacks",
  },
  {
    id: "rec-4",
    name: "Amul Pure Milk Ghee",
    badge: "Top Rated",
    tags: ["500ml", "Dairy"],
    price: 450,
    originalPrice: 490,
    rating: 4.9,
    reviewsCount: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=300&q=80",
    weight: "500ml",
    category: "Grocery",
  },
];

// Helper to normalize any item into DealProduct format for ProductCard
function mapToDealProduct(item: any): DealProduct {
  const rawImage =
    item.image ||
    item.imageUrl ||
    (Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : null) ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80";

  const imageSrc =
    typeof rawImage === "string" ? { uri: rawImage } : rawImage;

  const imagesList =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images.map((img: any) =>
          typeof img === "string" ? { uri: img } : img
        )
      : [imageSrc];

  const price = Number(item.price) || 0;
  const originalPrice = Number(
    item.originalPrice || item.mrp || item.price || 0
  );

  return {
    id: String(item.id || item._id || `rec-${Math.random()}`),
    name: item.name || item.title || "Product",
    weight:
      item.weight ||
      (Array.isArray(item.tags) && item.tags.length > 0
        ? item.tags[0]
        : "1 unit"),
    category: item.category || "Grocery",
    subCategory: item.subCategory || item.badge || "",
    price,
    originalPrice: originalPrice > price ? originalPrice : price,
    discountPct:
      item.discountPct !== undefined
        ? item.discountPct
        : originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0,
    rating: Number(item.rating || item.avgRating || 4.8),
    reviewsCount: Number(item.reviewsCount || item.numReviews || 120),
    image: imageSrc,
    images: imagesList,
    imageCount: imagesList.length,
    isVeg: item.isVeg !== undefined ? item.isVeg : true,
    tags: Array.isArray(item.tags)
      ? item.tags
      : item.tag
      ? [item.tag]
      : item.badge
      ? [item.badge]
      : [],
    priceDropText: item.priceDropText,
    unitPriceText: item.unitPriceText,
  };
}

export default function YouMightLikeSection({
  products,
  onAddToCart,
  onSeeAllPress,
  onProductPress,
}: YouMightLikeSectionProps) {
  const router = useRouter();
  const theme = useTheme();

  // Also query public products from Redux as optional live pool
  const reduxPublicProducts = useAppSelector(
    (state) => state.product?.publicProducts
  );

  // Normalize list of products into DealProduct format
  const normalizedProducts: DealProduct[] = useMemo(() => {
    let sourceList: any[] = [];

    if (products && products.length > 0) {
      sourceList = products;
    } else if (reduxPublicProducts && reduxPublicProducts.length > 0) {
      sourceList = reduxPublicProducts.slice(0, 10);
    } else {
      sourceList = DEFAULT_FALLBACK_ITEMS;
    }

    return sourceList.map(mapToDealProduct);
  }, [products, reduxPublicProducts]);

  // Handle product click
  const handleProductPress = (product: DealProduct) => {
    if (onProductPress) {
      onProductPress(product);
      return;
    }
    const rawImage =
      typeof product.image === "object" && (product.image as any)?.uri
        ? (product.image as any).uri
        : product.image;

    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: rawImage,
        category: product.category,
        weight: product.weight,
      },
    });
  };

  // Extract thumbnail previews for the "See all products" bottom banner
  const previewThumbnails = useMemo(() => {
    return normalizedProducts
      .slice(0, 3)
      .map((p) => p.image)
      .filter(Boolean);
  }, [normalizedProducts]);

  return (
    <View style={styles.container}>
      {/* Section Title & Header Action */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>You might also like</Text>
        {onSeeAllPress && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAllPress}>
            <Text style={styles.seeAllHeaderBtnText}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Scroll of ProductCards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {normalizedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={handleProductPress}
            onAddPress={() => onAddToCart?.(product)}
          />
        ))}
      </ScrollView>

      {/* See all products CTA Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSeeAllPress}
        style={styles.seeAllBanner}
      >
        <View style={styles.avatarGroup}>
          {previewThumbnails.map((imgSrc, idx) => (
            <View
              key={`rec-thumb-${idx}`}
              style={[
                styles.avatarCircle,
                { zIndex: 10 - idx, left: scale(idx * 16) },
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

        <View style={styles.seeAllTextRow}>
          <Text style={styles.seeAllText}>See all products</Text>
          <Feather name="chevron-right" size={scale(16)} color="#0E4A56" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: scale(16),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  seeAllHeaderBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#059669",
  },
  scrollContent: {
    paddingHorizontal: scale(12),
    gap: scale(10),
    paddingBottom: moderateScale(8),
  },
  seeAllBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0F2FE",
    borderRadius: scale(12),
    marginHorizontal: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(9),
    marginTop: moderateScale(6),
  },
  avatarGroup: {
    width: scale(65),
    height: scale(26),
    position: "relative",
  },
  avatarCircle: {
    position: "absolute",
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    borderWidth: 1.5,
    borderColor: "#ffffff",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  seeAllTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0E4A56",
  },
});
