import { FloatingCartBar } from "@/components/cart";
import { SelectLocationModal } from "@/components/home";
import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPublicProducts } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - scale(38)) / 2;

// Top 9 curated bestselling products across all categories with highest sales
const TOP_9_BESTSELLERS: DealProduct[] = [
  {
    id: "top-sale-1",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    category: "Grocery & Kitchen",
    subCategory: "Instant Food",
    weight: "280g (Pack of 4)",
    price: 120,
    originalPrice: 140,
    discountPct: 14,
    rating: 4.9,
    reviewsCount: 1250,
    ordersCount: 4500,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80",
    },
    tags: ["Bestseller", "Instant Food"],
  },
  {
    id: "top-sale-2",
    name: "Fortune Sunlite Refined Sunflower Oil",
    category: "Grocery & Kitchen",
    subCategory: "Oil, Ghee & Masala",
    weight: "1 Litre Pouch",
    price: 185,
    originalPrice: 220,
    discountPct: 16,
    rating: 4.8,
    reviewsCount: 980,
    ordersCount: 3800,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    },
    tags: ["Cooking Oil", "Popular"],
  },
  {
    id: "top-sale-3",
    name: "Amul Pure Cow Milk Desi Ghee",
    category: "Grocery & Kitchen",
    subCategory: "Oil, Ghee & Masala",
    weight: "1 Litre Tin",
    price: 590,
    originalPrice: 650,
    discountPct: 9,
    rating: 4.9,
    reviewsCount: 890,
    ordersCount: 3200,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&q=80",
    },
    tags: ["Pure Ghee", "Top Rated"],
  },
  {
    id: "top-sale-4",
    name: "Wai Wai Ready To Eat Chicken Masala Noodles",
    category: "Snacks & Drinks",
    subCategory: "Instant Noodles",
    weight: "375g (Pack of 5)",
    price: 110,
    originalPrice: 130,
    discountPct: 15,
    rating: 4.8,
    reviewsCount: 870,
    ordersCount: 2950,
    isVeg: false,
    image: {
      uri: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
    },
    tags: ["Non-Veg", "Snacks"],
  },
  {
    id: "top-sale-5",
    name: "Aashirvaad Superior MP Sharbati Atta",
    category: "Grocery & Kitchen",
    subCategory: "Atta, Rice & Dal",
    weight: "5 kg Bag",
    price: 325,
    originalPrice: 375,
    discountPct: 13,
    rating: 4.9,
    reviewsCount: 840,
    ordersCount: 2800,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    },
    tags: ["Fresh Atta", "Staple"],
  },
  {
    id: "top-sale-6",
    name: "Lay's Spanish Tomato Tango Potato Chips",
    category: "Snacks & Drinks",
    subCategory: "Chips & Namkeen",
    weight: "115g Pack",
    price: 50,
    originalPrice: 60,
    discountPct: 17,
    rating: 4.7,
    reviewsCount: 790,
    ordersCount: 2600,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
    },
    tags: ["Crispy", "Trending"],
  },
  {
    id: "top-sale-7",
    name: "Dettol Original Liquid Handwash Refill",
    category: "Beauty & Personal Care",
    subCategory: "Bath & Body",
    weight: "750 ml Refill",
    price: 135,
    originalPrice: 160,
    discountPct: 16,
    rating: 4.9,
    reviewsCount: 750,
    ordersCount: 2450,
    isVeg: undefined,
    image: {
      uri: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
    },
    tags: ["Hygiene", "Protection"],
  },
  {
    id: "top-sale-8",
    name: "Tata Tea Gold Pure Darjeeling Long Leaf",
    category: "Grocery & Kitchen",
    subCategory: "Tea & Coffee",
    weight: "500g Pouch",
    price: 290,
    originalPrice: 340,
    discountPct: 15,
    rating: 4.8,
    reviewsCount: 710,
    ordersCount: 2300,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80",
    },
    tags: ["Rich Aroma", "Premium"],
  },
  {
    id: "top-sale-9",
    name: "Cadbury Dairy Milk Silk Chocolate Bar",
    category: "Snacks & Drinks",
    subCategory: "Chocolates & Candies",
    weight: "150g Bar",
    price: 175,
    originalPrice: 195,
    discountPct: 10,
    rating: 4.9,
    reviewsCount: 690,
    ordersCount: 2150,
    isVeg: true,
    image: {
      uri: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80",
    },
    tags: ["Smooth Silk", "Sweet Cravings"],
  },
];

export default function OrderAgainScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const { activeDisplayLocation } = useAppSelector((state) => state.address);
  const currentLocation =
    activeDisplayLocation || "Baneshwor, Kathmandu, Bagmati, Nepal";

  // Fetch live bestsellers from backend on mount
  useEffect(() => {
    dispatch(
      fetchPublicProducts({
        sortBy: "popularity",
        limit: 9,
      }),
    );
  }, [dispatch]);

  // Live products from Redux state
  const { publicProducts } = useAppSelector((state) => state.product);

  // Top 9 products normalized for ProductCard
  const topProducts: DealProduct[] = useMemo(() => {
    if (publicProducts && publicProducts.length >= 9) {
      return publicProducts.slice(0, 9).map((prod, index) => {
        const pId = String(prod._id || prod.id || `live-${index}`);
        const pImg =
          prod.images && prod.images.length > 0
            ? { uri: prod.images[0].url }
            : TOP_9_BESTSELLERS[index]?.image || {
                uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80",
              };
        const pOrigPrice =
          Number(prod.originalPrice) || Number(prod.price) || 200;
        const pPrice = Number(prod.price) || 150;
        const discount =
          pOrigPrice > pPrice
            ? Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100)
            : 0;

        return {
          id: pId,
          name: prod.name,
          category: prod.category || "Grocery",
          subCategory: prod.subCategory || "",
          weight: prod.unit || "1 unit",
          price: pPrice,
          originalPrice: pOrigPrice,
          discountPct: discount,
          rating: prod.ratingsAverage || 4.8,
          reviewsCount: prod.ratingsCount || 250,
          ordersCount: prod.ordersCount || 1000,
          image: pImg,
          tags: prod.tags && prod.tags.length > 0 ? prod.tags : ["Top Sale"],
        };
      });
    }
    return TOP_9_BESTSELLERS;
  }, [publicProducts]);

  // Filtered products based on search bar input
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return topProducts;
    const query = searchQuery.toLowerCase().trim();
    return topProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query)),
    );
  }, [topProducts, searchQuery]);

  const handleProductPress = (product: DealProduct) => {
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: product.id,
        name: product.name,
        price: String(product.price),
        originalPrice: String(product.originalPrice || product.price),
        category: product.category,
        subCategory: product.subCategory,
        weight: product.weight,
        rating: String(product.rating),
        image:
          typeof product.image === "object" && "uri" in product.image
            ? (product.image as any).uri
            : "",
      },
    });
  };

  const handleAddToCart = (product: DealProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl:
        typeof product.image === "object" && "uri" in product.image
          ? (product.image as any).uri
          : "",
      weight: product.weight,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* 1. Top Cyan/Blue Gradient Header with Safe Area */}
      <LinearGradient
        colors={["#003844", "#004d5d", "#016073"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Store Info & Location Row */}
          <View style={styles.topRow}>
            <View style={styles.locationCol}>
              <Text style={styles.storeName}>Delivery Address</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsLocationModalVisible(true)}
                style={styles.locationButton}
              >
                <Text style={styles.locationText} numberOfLines={1}>
                  {currentLocation}
                </Text>
                <Feather name="chevron-down" size={scale(14)} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/Screens/Profile/profile" as any)}
              style={styles.profileBtn}
            >
              <Ionicons name="person" size={scale(17)} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchBarContainer}>
            <Feather name="search" size={scale(18)} color="#64748B" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search top bestselling products..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearchQuery("")}
                style={styles.micBtn}
              >
                <Feather name="x" size={scale(16)} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.7} style={styles.micBtn}>
                <Feather name="mic" size={scale(17)} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Reordering Illustration & Hero Banner Section */}
        <View style={styles.illustrationSection}>
          <View style={styles.bagIllustrationWrapper}>
            <View style={styles.cloudLeft} />
            <View style={styles.cloudRight} />

            <View style={styles.groceryBag}>
              <MaterialCommunityIcons
                name="shopping"
                size={scale(64)}
                color="#D97706"
              />
              <View style={styles.foodBadges}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={scale(22)}
                  color="#DC2626"
                />
                <MaterialCommunityIcons
                  name="bottle-soda-classic"
                  size={scale(22)}
                  color="#0284C7"
                />
                <MaterialCommunityIcons
                  name="carrot"
                  size={scale(22)}
                  color="#EA580C"
                />
              </View>
            </View>
          </View>

          <Text style={styles.reorderingTitle}>Reordering Will Be Easy</Text>
          <Text style={styles.reorderingSubtitle}>
            Items you order most frequently show up here so you can reorder with
            one tap.
          </Text>
        </View>

        {/* 3. Top 9 Most Sold Products Section (Using ProductCard) */}
        <View style={styles.bestsellersSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.bestsellersTitle}>Best sellers</Text>
              <Text style={styles.bestsellersSubtitle}>
                Highest selling items across all categories
              </Text>
            </View>
          </View>

          {/* 2-Column Responsive Grid with ProductCard */}
          <View style={styles.productsGrid}>
            {filteredProducts.map((item) => (
              <View key={item.id} style={styles.productCardWrapper}>
                <ProductCard
                  product={item}
                  cardWidth={CARD_WIDTH}
                  onPress={handleProductPress}
                  onAddPress={handleAddToCart}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 4. Floating Cart Sticker Bar (Only shows when items in cart) */}
      <FloatingCartBar />

      {/* 5. Select Location Bottom Sheet Modal */}
      <SelectLocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  gradientHeader: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(14),
    borderBottomLeftRadius: scale(18),
    borderBottomRightRadius: scale(18),
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
    paddingTop: moderateScale(4),
  },
  locationCol: {
    flex: 1,
    marginRight: scale(12),
  },
  storeName: {
    fontSize: moderateScale(15),
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: moderateScale(2),
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  locationText: {
    fontSize: moderateScale(12.5),
    color: "#E0F2FE",
    fontWeight: "500",
    maxWidth: "85%",
  },
  profileBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: moderateScale(44),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    color: "#1E293B",
    marginLeft: scale(8),
    paddingVertical: 0,
  },
  micBtn: {
    padding: scale(4),
  },
  scrollContent: {
    paddingBottom: moderateScale(120),
  },
  illustrationSection: {
    alignItems: "center",
    paddingHorizontal: scale(24),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(14),
    backgroundColor: "#FFFFFF",
    marginBottom: scale(8),
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  bagIllustrationWrapper: {
    width: scale(140),
    height: scale(95),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: moderateScale(10),
  },
  cloudLeft: {
    position: "absolute",
    top: scale(8),
    left: scale(-8),
    width: scale(36),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: "#F1F5F9",
    opacity: 0.8,
  },
  cloudRight: {
    position: "absolute",
    top: scale(20),
    right: scale(-8),
    width: scale(44),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "#F1F5F9",
    opacity: 0.8,
  },
  groceryBag: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  foodBadges: {
    position: "absolute",
    bottom: scale(4),
    flexDirection: "row",
    gap: scale(2),
  },
  reorderingTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(4),
    textAlign: "center",
  },
  reorderingSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(17),
  },
  bestsellersSection: {
    paddingHorizontal: scale(14),
    paddingTop: scale(8),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(12),
    paddingHorizontal: scale(2),
  },
  bestsellersTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  bestsellersSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "500",
    marginTop: scale(1),
  },
  topRankPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(10),
    gap: scale(3),
  },
  topRankText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#DC2626",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(12),
  },
  productCardWrapper: {
    width: CARD_WIDTH,
  },
});
