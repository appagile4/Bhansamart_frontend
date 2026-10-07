import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPublicProducts } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const { publicProducts } = useAppSelector((state) => state.product);

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

  const handleProductPress = (product: DealProduct) => {
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
  };

  const handleSeeMorePress = (product: DealProduct) => {
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
  };

  const handleSeeAllPress = () => {
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
  };

  if (displayProducts.length === 0) {
    return null;
  }

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
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={handleProductPress}
            onSeeMorePress={handleSeeMorePress}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: scale(10) }} />}
      />

      {/* See All Products Bottom Bar */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSeeAllPress}
        style={styles.seeAllBar}
      >
        <Image
          source={require("@/assets/images/Home/see-all-thumb.png")}
          style={styles.seeAllThumb}
          contentFit="contain"
        />
        <Text style={styles.seeAllText}>See all products</Text>
        <Ionicons name="caret-forward" size={scale(14)} color="#1E3A5F" />
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
    marginTop: moderateScale(6),
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    gap: scale(10),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  seeAllThumb: {
    width: scale(60),
    height: scale(26),
  },
  seeAllText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1E3A5F",
    letterSpacing: 0.2,
  },
});
