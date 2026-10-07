import { FloatingCartBar } from "@/components/cart";
import { FilterModal, FilterState } from "@/components/category";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPublicProducts, ProductItem } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

function SeeAllProductSkeleton({ animOpacity }: { animOpacity: Animated.Value }) {
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
            width: scale(50),
            height: scale(14),
            borderRadius: scale(4),
            marginBottom: scale(6),
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
            height: scale(14),
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
            height: scale(14),
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
            width: scale(75),
            height: scale(12),
            marginBottom: scale(8),
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
              width: scale(60),
              height: scale(18),
              borderRadius: scale(3),
              opacity: animOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBlock,
            {
              width: scale(50),
              height: scale(24),
              borderRadius: scale(6),
              opacity: animOpacity,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function SeeAllProductScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  const params = useLocalSearchParams<{
    title?: string;
    filter?: string;
    category?: string;
    minDiscount?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [activePill, setActivePill] = useState<string>(
    params.minDiscount ? "40_discount" : "all"
  );
  const [sortBy, setSortBy] = useState<string>("discount_desc");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    sortBy: "popularity",
    priceRange: "all",
    selectedBrands: [],
    minDiscount: params.minDiscount ? Number(params.minDiscount) : 0,
    inStockOnly: false,
  });

  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product
  );

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

  const loadProducts = useCallback(async () => {
    await dispatch(fetchPublicProducts());
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Filtered & Sorted Product List
  const filteredProducts = useMemo(() => {
    if (!publicProducts || publicProducts.length === 0) return [];

    let list = publicProducts.map((p) => {
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

      return {
        ...p,
        calculatedOrigPrice: origPrice,
        calculatedDiscountPct: discountPct,
      };
    });

    // 1. Category or Specific Collection Filter
    if (params.category && params.category !== "all") {
      const catTarget = params.category.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matched = list.filter((p) => {
        const cat = (p.category || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const sub = (p.subCategory || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const isGroceryMatch =
          (catTarget.includes("grocery") || catTarget.includes("kitchen")) &&
          (cat.includes("grocery") || cat.includes("kitchen") || cat.includes("dairy") || cat.includes("staple") || cat.includes("food"));
        const isSnacksMatch =
          (catTarget.includes("snack") || catTarget.includes("drink")) &&
          (cat.includes("snack") || cat.includes("drink") || sub.includes("snack") || sub.includes("noodle") || sub.includes("juice") || sub.includes("cereal") || sub.includes("sweet"));
        const isBeautyMatch =
          (catTarget.includes("beauty") || catTarget.includes("personal") || catTarget.includes("care")) &&
          (cat.includes("beauty") || cat.includes("care") || cat.includes("skin") || sub.includes("hair") || sub.includes("oral"));
        const isStationeryMatch =
          (catTarget.includes("stationery") || catTarget.includes("school") || catTarget.includes("office")) &&
          (cat.includes("stationery") || cat.includes("office") || cat.includes("school") || sub.includes("pen") || sub.includes("pencil") || sub.includes("notebook") || sub.includes("diary") || sub.includes("marker") || sub.includes("geometry") || sub.includes("craft") || sub.includes("folder") || sub.includes("desk") || sub.includes("paper") || sub.includes("sticky"));
        const isKidsMatch =
          (catTarget.includes("kid") || catTarget.includes("baby")) &&
          (cat.includes("kid") || cat.includes("baby") || sub.includes("toy") || sub.includes("diaper"));
        const isGiftingMatch =
          (catTarget.includes("gift") || catTarget.includes("celebration")) &&
          (cat.includes("gift") || sub.includes("men") || sub.includes("women") || sub.includes("dress") || sub.includes("choc") || sub.includes("hamper") || sub.includes("elect") || sub.includes("toy"));

        return (
          cat.includes(catTarget) ||
          sub.includes(catTarget) ||
          isGroceryMatch ||
          isSnacksMatch ||
          isBeautyMatch ||
          isStationeryMatch ||
          isKidsMatch ||
          isGiftingMatch
        );
      });
      if (matched.length > 0) list = matched;
    } else if (params.filter === "sweet-tooth") {
      const matched = list.filter((p) => {
        const text = `${p.name} ${p.category} ${p.subCategory}`.toLowerCase();
        return (
          text.includes("choc") ||
          text.includes("sweet") ||
          text.includes("candy") ||
          text.includes("wafer") ||
          text.includes("kitkat") ||
          text.includes("munch") ||
          text.includes("gems") ||
          text.includes("dairymilk") ||
          text.includes("nutties")
        );
      });
      if (matched.length > 0) list = matched;
    } else if (params.filter === "instant-frozen") {
      const matched = list.filter((p) => {
        const text = `${p.name} ${p.category} ${p.subCategory}`.toLowerCase();
        return (
          text.includes("instant") ||
          text.includes("noodle") ||
          text.includes("maggi") ||
          text.includes("waiwai") ||
          text.includes("frozen") ||
          text.includes("cereal")
        );
      });
      if (matched.length > 0) list = matched;
    } else if (params.filter === "creamy-delights") {
      const matched = list.filter((p) => {
        const text = `${p.name} ${p.category} ${p.subCategory} ${(p.tags || []).join(" ")}`.toLowerCase();
        return (
          text.includes("cream") ||
          text.includes("butter") ||
          text.includes("cheese") ||
          text.includes("paneer") ||
          text.includes("milk") ||
          text.includes("curd") ||
          text.includes("yogurt") ||
          text.includes("ghee") ||
          text.includes("dairy") ||
          text.includes("mayo")
        );
      });
      if (matched.length > 0) list = matched;
    } else if (params.filter?.includes("flash") || params.filter === "flash-sale") {
      let matched = list;
      if (params.category && params.category !== "all") {
        const catTarget = params.category.toLowerCase().replace(/[^a-z0-9]/g, "");
        matched = list.filter((p) => {
          const cat = (p.category || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const sub = (p.subCategory || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return cat.includes(catTarget) || sub.includes(catTarget);
        });
      }
      if (matched.length > 0) list = matched;
    }

    // 2. Search Query Filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.subCategory?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }

    // 3. Quick Pill Filter
    if (activePill === "40_discount") {
      list = list.filter((p) => p.calculatedDiscountPct >= 40);
    } else if (activePill === "under200") {
      list = list.filter((p) => p.price <= 200);
    } else if (activePill === "under500") {
      list = list.filter((p) => p.price <= 500);
    } else if (activePill === "top_rated") {
      list = list.filter((p) => (p.ratingsAverage || 4.5) >= 4.5);
    } else if (activePill === "in_stock") {
      list = list.filter((p) => p.inStock);
    }

    // 4. Modal Filters
    if (filters.minDiscount > 0) {
      list = list.filter(
        (p) => p.calculatedDiscountPct >= filters.minDiscount
      );
    }
    if (filters.priceRange === "under200") {
      list = list.filter((p) => p.price <= 200);
    } else if (filters.priceRange === "200to500") {
      list = list.filter((p) => p.price >= 200 && p.price <= 500);
    } else if (filters.priceRange === "above500") {
      list = list.filter((p) => p.price > 500);
    }
    if (filters.inStockOnly) {
      list = list.filter((p) => p.inStock);
    }
    if (filters.selectedBrands.length > 0) {
      list = list.filter(
        (p) => p.brand && filters.selectedBrands.includes(p.brand)
      );
    }

    // 4. Sorting
    const activeSort = filters.sortBy || sortBy;
    if (activeSort === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (activeSort === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (activeSort === "rating") {
      list.sort(
        (a, b) => (b.ratingsAverage || 4.5) - (a.ratingsAverage || 4.5)
      );
    } else if (activeSort === "discount_desc") {
      list.sort(
        (a, b) => b.calculatedDiscountPct - a.calculatedDiscountPct
      );
    }

    return list;
  }, [publicProducts, searchQuery, activePill, filters, sortBy]);

  const handleProductPress = (prod: ProductItem) => {
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
  };

  const handleSortPress = () => {
    Alert.alert("Sort Products", "Choose sorting criteria", [
      {
        text: "Discount: High to Low",
        onPress: () => setSortBy("discount_desc"),
      },
      {
        text: "Price: Low to High",
        onPress: () => setSortBy("price_asc"),
      },
      {
        text: "Price: High to Low",
        onPress: () => setSortBy("price_desc"),
      },
      {
        text: "Customer Rating",
        onPress: () => setSortBy("rating"),
      },
      {
        text: "Popularity",
        onPress: () => setSortBy("popularity"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Floating Cart Bar */}
      <FloatingCartBar bottomOffset={scale(16)} />

      {/* Top Header */}
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        {/* Navigation Bar */}
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
              {params.title || "Deals of the Day"}
            </Text>
            <Text style={styles.navSubtitle}>
              {filteredProducts.length} items available
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsFilterModalVisible(true)}
            style={styles.navIconBtn}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={scale(20)}
              color="#016073"
            />
          </TouchableOpacity>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Feather
            name="search"
            size={scale(18)}
            color="#64748B"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search deals, brands or groceries...'
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearchQuery("")}
              style={styles.clearBtn}
            >
              <Feather name="x" size={scale(16)} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Pills Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {[
            { id: "all", label: "All Items" },
            { id: "40_discount", label: "🔥 40%+ OFF" },
            { id: "under200", label: "Under Rs. 200" },
            { id: "under500", label: "Under Rs. 500" },
            { id: "top_rated", label: "⭐ 4.5+ Rated" },
            { id: "in_stock", label: "In Stock" },
          ].map((pill) => {
            const isActive = activePill === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                activeOpacity={0.8}
                onPress={() =>
                  setActivePill(activePill === pill.id ? "all" : pill.id)
                }
                style={[
                  styles.pillBtn,
                  isActive && styles.pillBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive && styles.pillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort and Count Sub-Header */}
        <View style={styles.subControlsRow}>
          <Text style={styles.countText}>
            Showing <Text style={{ fontWeight: "700" }}>{filteredProducts.length}</Text> products
          </Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSortPress}
            style={styles.sortBtn}
          >
            <MaterialCommunityIcons
              name="swap-vertical"
              size={scale(16)}
              color="#016073"
            />
            <Text style={styles.sortBtnText}>
              {sortBy === "price_asc"
                ? "Price: Low to High"
                : sortBy === "price_desc"
                ? "Price: High to Low"
                : sortBy === "rating"
                ? "Top Rated"
                : sortBy === "discount_desc"
                ? "Best Discounts"
                : "Popularity"}
            </Text>
            <Feather name="chevron-down" size={scale(12)} color="#64748B" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Products Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
      >
        {publicLoading && (!publicProducts || publicProducts.length === 0) ? (
          <View style={styles.productsGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <SeeAllProductSkeleton
                key={`see-all-skel-${item}`}
                animOpacity={pulseAnim}
              />
            ))}
          </View>
        ) : filteredProducts.length > 0 ? (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => {
              const prodId = product._id || product.id || "";
              const qty = getItemQuantity(prodId);
              const imgUrl =
                product.images && product.images.length > 0
                  ? product.images[0].url
                  : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80";

              const discountPercent = product.calculatedDiscountPct || 0;

              return (
                <TouchableOpacity
                  key={prodId}
                  activeOpacity={0.88}
                  onPress={() => handleProductPress(product)}
                  style={styles.productCard}
                >
                  {/* Image Box */}
                  <View style={styles.cardImageBox}>
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.productImg}
                      contentFit="contain"
                    />

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>
                          {discountPercent}% OFF
                        </Text>
                      </View>
                    )}

                    {/* Out of Stock Overlay */}
                    {!product.inStock && (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                      </View>
                    )}

                    {/* ADD / Quantity Counter Overlay */}
                    {product.inStock &&
                      (qty === 0 ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            addToCart({
                              id: prodId,
                              name: product.name,
                              price: product.price,
                              originalPrice:
                                product.originalPrice || product.price,
                              imageUrl: imgUrl,
                              weight: product.unit || "1 pc",
                            })
                          }
                          style={styles.addBtnOverlay}
                        >
                          <Text style={styles.addBtnText}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.counterOverlay}>
                          <TouchableOpacity
                            onPress={() => updateQuantity(prodId, -1)}
                            style={styles.counterActionBtn}
                          >
                            <Feather
                              name="minus"
                              size={scale(11)}
                              color="#016073"
                            />
                          </TouchableOpacity>
                          <Text style={styles.counterQtyText}>{qty}</Text>
                          <TouchableOpacity
                            onPress={() => updateQuantity(prodId, 1)}
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
                      ({product.ratingsCount || 24})
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
            })}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Feather name="inbox" size={scale(48)} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or removing filter constraints.
            </Text>
          </View>
        )}
      </ScrollView>

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
    backgroundColor: "#F8FAFC",
  },
  headerSafeArea: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
  },
  navIconBtn: {
    width: scale(38),
    height: scale(38),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(19),
    backgroundColor: "#F1F5F9",
  },
  titleColumn: {
    flex: 1,
    marginLeft: scale(12),
  },
  navTitle: {
    fontSize: moderateScale(16.5),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  navSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: scale(12),
    height: scale(42),
    marginHorizontal: scale(14),
    marginVertical: scale(6),
    paddingHorizontal: scale(10),
  },
  searchIcon: {
    marginRight: scale(6),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    color: "#0F172A",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: scale(4),
  },
  pillsScroll: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    gap: scale(8),
  },
  pillBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillBtnActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#016073",
  },
  pillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#475569",
  },
  pillTextActive: {
    color: "#016073",
    fontWeight: "700",
  },
  subControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  countText: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#F8FAFC",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sortBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#016073",
  },
  gridScrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: scale(14),
    paddingBottom: scale(160),
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(14),
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(8),
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImageBox: {
    width: "100%",
    aspectRatio: 1.05,
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(6),
    marginBottom: scale(6),
    overflow: "hidden",
  },
  productImg: {
    width: "88%",
    height: "88%",
  },
  discountBadge: {
    position: "absolute",
    top: scale(6),
    left: scale(6),
    backgroundColor: "#DC2626",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  outOfStockBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  addBtnOverlay: {
    position: "absolute",
    bottom: scale(6),
    right: scale(6),
    backgroundColor: "#016073",
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: scale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11.5),
    fontWeight: "800",
  },
  counterOverlay: {
    position: "absolute",
    bottom: scale(6),
    right: scale(6),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(6),
    borderWidth: 1.2,
    borderColor: "#016073",
    overflow: "hidden",
  },
  counterActionBtn: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(4),
  },
  counterQtyText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
    paddingHorizontal: scale(4),
  },
  weightTagPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginBottom: scale(4),
  },
  weightTagText: {
    fontSize: moderateScale(9.5),
    fontWeight: "600",
    color: "#64748B",
  },
  productNameText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: moderateScale(16),
    minHeight: scale(32),
    marginBottom: scale(4),
  },
  starRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginBottom: scale(6),
  },
  starsGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingScoreText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#1E293B",
  },
  reviewsCountText: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(5),
  },
  currentPriceText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#016073",
  },
  mrpText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(80),
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13.5),
    color: "#64748B",
    fontWeight: "500",
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: moderateScale(12.5),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: scale(30),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});
