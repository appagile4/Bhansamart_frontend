import { FloatingCartBar } from "@/components/cart";
import { SelectLocationModal } from "@/components/home";
import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useCartActions } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerOrders, OrderItem } from "@/store/slices/orderSlice";
import { fetchPublicProducts } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
const CARD_WIDTH = (width - scale(38)) / 2;

export default function OrderAgainScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart } = useCartActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { activeDisplayLocation } = useAppSelector((state) => state.address);
  const currentLocation =
    activeDisplayLocation || "Sector 24, Rohini, Delhi, India";

  // Redux state
  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product
  );
  const { customerOrders, customerLoading } = useAppSelector(
    (state) => state.order
  );

  // Fetch real data from backend
  const loadData = useCallback(async () => {
    try {
      await Promise.allSettled([
        dispatch(
          fetchPublicProducts({
            sortBy: "popularity",
            limit: 30,
          })
        ),
        dispatch(fetchCustomerOrders({ page: 1, limit: 30 })),
      ]);
    } catch (e) {
      console.warn("Failed to load order-again data:", e);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 1. Previously ordered products extracted from customer's actual order history
  const previousOrderedProducts: DealProduct[] = useMemo(() => {
    if (!customerOrders || customerOrders.length === 0) return [];

    const itemMap = new Map<
      string,
      { item: OrderItem; count: number; lastOrderedAt?: string }
    >();

    for (const order of customerOrders) {
      if (!order.items || !Array.isArray(order.items)) continue;
      for (const item of order.items) {
        const id = String(
          item.productId || item.product || item._id || item.name
        );
        if (itemMap.has(id)) {
          const entry = itemMap.get(id)!;
          entry.count += item.quantity || 1;
        } else {
          itemMap.set(id, {
            item,
            count: item.quantity || 1,
            lastOrderedAt: order.createdAt,
          });
        }
      }
    }

    return Array.from(itemMap.values()).map(({ item, count }) => {
      const pId = String(
        item.productId || item.product || item._id || item.name
      );
      const pPrice = Number(item.price) || 0;
      const pOrigPrice = Number(item.originalPrice) || pPrice;
      const discount =
        pOrigPrice > pPrice
          ? Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100)
          : 0;

      return {
        id: pId,
        name: item.name || "Product",
        category: item.category || "Grocery",
        weight: item.weight || "1 unit",
        price: pPrice,
        originalPrice: pOrigPrice,
        discountPct: discount,
        rating: 4.8,
        reviewsCount: 150,
        ordersCount: count,
        image: item.imageUrl
          ? { uri: item.imageUrl }
          : {
              uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
            },
        tags: [`Ordered ${count}x`],
      };
    });
  }, [customerOrders]);

  // 2. Real live bestselling products fetched from MongoDB backend
  const liveBestsellers: DealProduct[] = useMemo(() => {
    if (!publicProducts || publicProducts.length === 0) return [];

    return publicProducts.map((prod) => {
      const pId = String(prod._id || prod.id);
      const imgUrl =
        prod.images && prod.images.length > 0 && prod.images[0].url
          ? prod.images[0].url
          : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";

      const pPrice = Number(prod.price) || 0;
      const pOrigPrice = Number(prod.originalPrice) || pPrice;
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
        reviewsCount: prod.ratingsCount || 0,
        ordersCount: prod.ordersCount || 0,
        image: { uri: imgUrl },
        images: prod.images,
        tags:
          prod.tags && prod.tags.length > 0
            ? prod.tags
            : prod.visibility?.isBestSeller
            ? ["Bestseller"]
            : ["Popular"],
      };
    });
  }, [publicProducts]);

  // Search filtering
  const filteredPastProducts = useMemo(() => {
    if (!searchQuery.trim()) return previousOrderedProducts;
    const query = searchQuery.toLowerCase().trim();
    return previousOrderedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query))
    );
  }, [previousOrderedProducts, searchQuery]);

  const filteredBestsellers = useMemo(() => {
    if (!searchQuery.trim()) return liveBestsellers;
    const query = searchQuery.toLowerCase().trim();
    return liveBestsellers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query))
    );
  }, [liveBestsellers, searchQuery]);

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

  const handleAddToCart = (product: any) => {
    const targetId = String(
      product.id || product._id || product.productId || ""
    ).trim() || `item-${Date.now()}`;
    let imgUrl = "";
    if (typeof product.imageUrl === "string" && product.imageUrl) {
      imgUrl = product.imageUrl;
    } else if (typeof product.image === "string" && product.image) {
      imgUrl = product.image;
    } else if (
      product.image &&
      typeof product.image === "object" &&
      "uri" in product.image
    ) {
      imgUrl = product.image.uri;
    }
    addToCart({
      id: targetId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: imgUrl,
      weight: product.weight || "1 unit",
    });
  };

  const hasPastOrders = previousOrderedProducts.length > 0;
  const isDark = theme.mode === "dark";

  return (
    <View style={[styles.root, isDark && { backgroundColor: "#0A0F14" }]}>
      <StatusBar style="light" />

      {/* 1. Top Cyan/Blue Gradient Header with Safe Area */}
      <LinearGradient
        colors={
          isDark
            ? ["#071418", "#0B2129", "#0F2E3A"]
            : ["#003844", "#004d5d", "#016073"]
        }
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
                <Text
                  style={[
                    styles.locationText,
                    isDark && { color: "#BAE6FD" },
                  ]}
                  numberOfLines={1}
                >
                  {currentLocation}
                </Text>
                <Feather
                  name="chevron-down"
                  size={scale(14)}
                  color={isDark ? "#BAE6FD" : "#ffffff"}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/Screens/Profile/profile" as any)}
              style={[
                styles.profileBtn,
                isDark && {
                  backgroundColor: "#15222D",
                  borderColor: "#243545",
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={scale(17)}
                color={isDark ? "#E2E8F0" : "#1E293B"}
              />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View
            style={[
              styles.searchBarContainer,
              isDark && {
                backgroundColor: "#15222D",
                borderColor: "#243545",
                borderWidth: 1,
              },
            ]}
          >
            <Feather
              name="search"
              size={scale(18)}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products to order again..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              style={[styles.searchInput, isDark && { color: "#F8FAFC" }]}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearchQuery("")}
                style={styles.micBtn}
              >
                <Feather
                  name="x"
                  size={scale(16)}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.7} style={styles.micBtn}>
                <Feather
                  name="mic"
                  size={scale(17)}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDark ? "#38BDF8" : "#003844"]}
            tintColor={isDark ? "#38BDF8" : "#003844"}
          />
        }
      >
        {/* Previously Ordered Items Section (When Customer Has Past Orders) */}
        {hasPastOrders ? (
          <View style={styles.bestsellersSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.bestsellersTitle,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  Previously Ordered
                </Text>
                <Text
                  style={[
                    styles.bestsellersSubtitle,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Quickly reorder items from your past deliveries
                </Text>
              </View>
              <View
                style={[
                  styles.topRankPill,
                  isDark && {
                    backgroundColor: "#351419",
                    borderColor: "#5C1D24",
                    borderWidth: 1,
                  },
                ]}
              >
                <Feather
                  name="repeat"
                  size={scale(12)}
                  color={isDark ? "#F87171" : "#DC2626"}
                />
                <Text
                  style={[
                    styles.topRankText,
                    isDark && { color: "#F87171" },
                  ]}
                >
                  {previousOrderedProducts.length} Items
                </Text>
              </View>
            </View>

            {filteredPastProducts.length > 0 ? (
              <View style={styles.productsGrid}>
                {filteredPastProducts.map((item) => (
                  <View
                    key={`past-${item.id}`}
                    style={styles.productCardWrapper}
                  >
                    <ProductCard
                      product={item}
                      cardWidth={CARD_WIDTH}
                      onPress={handleProductPress}
                      onAddPress={handleAddToCart}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noSearchBox}>
                <Text
                  style={[
                    styles.noSearchText,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  No past items match "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Reordering Illustration & Hero Banner Section (Shown when no past orders) */
          <View
            style={[
              styles.illustrationSection,
              isDark && {
                backgroundColor: "#101922",
                borderColor: "#1E2A38",
              },
            ]}
          >
            <View style={styles.bagIllustrationWrapper}>
              <View
                style={[
                  styles.cloudLeft,
                  isDark && { backgroundColor: "#1E2A38" },
                ]}
              />
              <View
                style={[
                  styles.cloudRight,
                  isDark && { backgroundColor: "#1E2A38" },
                ]}
              />

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

            <Text
              style={[
                styles.reorderingTitle,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Reordering Will Be Easy
            </Text>
            <Text
              style={[
                styles.reorderingSubtitle,
                isDark && { color: "#94A3B8" },
              ]}
            >
              Items you order most frequently will show up here for fast 1-tap
              reordering. Explore our popular store products below to get
              started!
            </Text>
          </View>
        )}

        {/* 3. Live Store Bestsellers Section (Real Products from Backend) */}
        <View style={styles.bestsellersSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text
                style={[
                  styles.bestsellersTitle,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                {hasPastOrders ? "Popular Products" : "Best sellers"}
              </Text>
              <Text
                style={[
                  styles.bestsellersSubtitle,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                {hasPastOrders
                  ? "Explore trending essentials from nearby stores"
                  : "Highest selling items across all categories"}
              </Text>
            </View>
            {liveBestsellers.length > 0 && (
              <View
                style={[
                  styles.topRankPill,
                  {
                    backgroundColor: isDark ? "#0A2818" : "#DCFCE7",
                    borderColor: isDark ? "#14532D" : "transparent",
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={scale(12)}
                  color={isDark ? "#4ADE80" : "#16A34A"}
                />
                <Text
                  style={[
                    styles.topRankText,
                    { color: isDark ? "#4ADE80" : "#16A34A" },
                  ]}
                >
                  {liveBestsellers.length} Live
                </Text>
              </View>
            )}
          </View>

          {/* Loading Indicator */}
          {publicLoading && liveBestsellers.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={isDark ? "#38BDF8" : "#003844"}
              />
              <Text
                style={[
                  styles.loadingText,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                Loading fresh products from store...
              </Text>
            </View>
          ) : filteredBestsellers.length > 0 ? (
            /* 2-Column Responsive Grid with ProductCard */
            <View style={styles.productsGrid}>
              {filteredBestsellers.map((item) => (
                <View
                  key={`best-${item.id}`}
                  style={styles.productCardWrapper}
                >
                  <ProductCard
                    product={item}
                    cardWidth={CARD_WIDTH}
                    onPress={handleProductPress}
                    onAddPress={handleAddToCart}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noSearchBox}>
              <MaterialCommunityIcons
                name="package-variant"
                size={scale(40)}
                color={isDark ? "#475569" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.noSearchText,
                  isDark && { color: "#64748B" },
                ]}
              >
                {searchQuery.trim()
                  ? `No products found matching "${searchQuery}"`
                  : "No store products currently available."}
              </Text>
            </View>
          )}
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
    marginBottom: scale(14),
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
    gap: scale(4),
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
  loadingContainer: {
    paddingVertical: scale(40),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    fontWeight: "500",
  },
  noSearchBox: {
    paddingVertical: scale(30),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  noSearchText: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
  },
});
