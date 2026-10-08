import { FloatingCartBar } from "@/components/cart";
import ProductCard, { DealProduct } from "@/components/home/productcard";
import { useCart } from "@/context/cart-context";
import { getAllProductsApi } from "@/store/services/productService";
import { ProductItem } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
const RECENT_SEARCHES_STORAGE_KEY = "bhansa_recent_searches";

const DEFAULT_TRENDING = [
  { id: "t1", title: "Noodles", icon: "food" },
  { id: "t2", title: "Biscuits", icon: "cookie" },
  { id: "t3", title: "Chips", icon: "food-fork-drink" },
  { id: "t4", title: "Cold Drinks", icon: "bottle-soda-classic" },
  { id: "t5", title: "Tea & Coffee", icon: "coffee" },
  { id: "t6", title: "Dairy", icon: "cup" },
];

const INITIAL_RECENT_SEARCHES = [
  { id: "1", label: "Maggi", iconType: "search" },
  { id: "2", label: "Wai Wai", iconType: "brand" },
  { id: "3", label: "Chips", iconType: "search" },
  { id: "4", label: "Coke", iconType: "brand" },
];

/**
 * Normalizes backend ProductItem into DealProduct format for ProductCard
 */
function normalizeToDealProduct(prod: ProductItem, index = 0): DealProduct {
  const pId = String(prod._id || prod.id || `prod-${index}`);
  const pImg =
    prod.images && prod.images.length > 0
      ? { uri: prod.images[0].url }
      : {
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
    reviewsCount: prod.ratingsCount || 120,
    ordersCount: prod.ordersCount || 500,
    image: pImg,
    images: prod.images,
    tags: prod.tags && prod.tags.length > 0 ? prod.tags : [prod.category || "Top Pick"],
  };
}

export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addToCart } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");

  // Search Results & Loading
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Discovery / Default Products (loaded on mount when query is empty)
  const [discoveryProducts, setDiscoveryProducts] = useState<ProductItem[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);

  // Search Debounce Ref
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Load Persisted Recent Searches on Mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load recent searches:", err);
      }
    };
    loadRecentSearches();
  }, []);

  // 2. Save Recent Search Term
  const saveRecentSearchTerm = useCallback(async (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.label.toLowerCase() !== cleanTerm.toLowerCase()
      );
      const updated = [
        {
          id: String(Date.now()),
          label: cleanTerm,
          iconType: "search",
        },
        ...filtered,
      ].slice(0, 8); // Keep top 8

      AsyncStorage.setItem(
        RECENT_SEARCHES_STORAGE_KEY,
        JSON.stringify(updated)
      ).catch(() => {});

      return updated;
    });
  }, []);

  // 3. Clear Recent Searches
  const handleClearRecent = useCallback(async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear recent searches:", err);
    }
  }, []);

  // 4. Fetch Initial Discovery Products on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchDiscovery = async () => {
      try {
        setIsDiscoveryLoading(true);
        const res = await getAllProductsApi({ limit: 30, sortBy: "popularity" });
        if (isMounted && res?.products) {
          setDiscoveryProducts(res.products);
        }
      } catch (err) {
        console.warn("Failed to load discovery products:", err);
      } finally {
        if (isMounted) setIsDiscoveryLoading(false);
      }
    };
    fetchDiscovery();
    return () => {
      isMounted = false;
    };
  }, []);

  // 5. Live Search API Execution (Across all categories)
  const executeSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        setIsSearching(false);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await getAllProductsApi({
          search: trimmed,
          limit: 50,
        });

        if (response?.products) {
          setSearchResults(response.products);
          saveRecentSearchTerm(trimmed);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        console.error("Search error:", err);
        setSearchError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch search results. Please try again."
        );
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [saveRecentSearchTerm]
  );

  // 6. Handle Search Input Changes with Debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setActiveCategoryFilter("All");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(text);
    }, 350);
  };

  // 7. Extract Available Categories from Search Results
  const resultCategories = useMemo(() => {
    if (searchResults.length === 0) return ["All"];
    const cats = new Set<string>();
    searchResults.forEach((item) => {
      if (item.category && item.category.trim()) {
        cats.add(item.category.trim());
      }
    });
    return ["All", ...Array.from(cats)];
  }, [searchResults]);

  // 8. Filter Search Results by Active Category Tab
  const filteredSearchResults: DealProduct[] = useMemo(() => {
    const list =
      activeCategoryFilter === "All"
        ? searchResults
        : searchResults.filter(
            (p) =>
              p.category?.toLowerCase() === activeCategoryFilter.toLowerCase()
          );

    return list.map((item, idx) => normalizeToDealProduct(item, idx));
  }, [searchResults, activeCategoryFilter]);

  // 9. Discovery Shelves Grouped by Category
  const discoveryShelves = useMemo(() => {
    if (discoveryProducts.length === 0) return [];

    const grouped: { [cat: string]: ProductItem[] } = {};
    discoveryProducts.forEach((p) => {
      const cat = p.category || "Popular Items";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    return Object.keys(grouped).map((catName) => ({
      title: catName,
      items: grouped[catName].slice(0, 6).map((item, idx) => normalizeToDealProduct(item, idx)),
    }));
  }, [discoveryProducts]);

  // 10. Product Card Press Handler
  const handleProductPress = (product: DealProduct) => {
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: product.id,
        name: product.name,
        price: String(product.price),
        originalPrice: String(product.originalPrice),
        rating: String(product.rating),
        category: product.category,
        subCategory: product.subCategory,
        weight: product.weight,
        image: typeof product.image === "object" && (product.image as any)?.uri
          ? (product.image as any).uri
          : undefined,
      },
    });
  };

  // 11. Add to Cart Handler
  const handleAddToCart = (product: DealProduct) => {
    const imgUri =
      typeof product.image === "object" && (product.image as any)?.uri
        ? (product.image as any).uri
        : "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80";

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: imgUri,
      weight: product.weight,
    });
  };

  // 12. Voice Search Simulation / Handler
  const handleVoiceSearch = () => {
    Alert.alert(
      "Voice Search",
      "Say a product name or category (e.g. 'Noodles', 'Milk', 'Chips')",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Search 'Maggi'",
          onPress: () => {
            setSearchQuery("Maggi");
            executeSearch("Maggi");
          },
        },
        {
          text: "Search 'Noodles'",
          onPress: () => {
            setSearchQuery("Noodles");
            executeSearch("Noodles");
          },
        },
      ]
    );
  };

  const isQueryActive = searchQuery.trim().length > 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Floating Cart Bar */}
      <FloatingCartBar bottomOffset={scale(16)} />

      {/* 1. Sky Blue Gradient Top Header with SearchBar */}
      <LinearGradient
        colors={["#003844", "#004d5d", "#016073"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.searchBarWrapper}>
            {/* Back Arrow */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.searchIconBtn}
            >
              <Feather name="arrow-left" size={scale(20)} color="#1E293B" />
            </TouchableOpacity>

            {/* TextInput for Real Product Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search in all categories (e.g. Noodles, Tea)"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={() => executeSearch(searchQuery)}
              returnKeyType="search"
              autoFocus={true}
            />

            {/* Clear button if text exists */}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                style={styles.clearBtn}
              >
                <Feather name="x" size={scale(16)} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Subtle Divider */}
            <View style={styles.searchDivider} />

            {/* Microphone Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleVoiceSearch}
              style={styles.searchIconBtn}
            >
              <Feather name="mic" size={scale(19)} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 2. Scrollable Body Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ======================================================== */}
        {/* A. SEARCH MODE (When User Has Typed a Search Query)      */}
        {/* ======================================================== */}
        {isQueryActive ? (
          <View style={styles.resultsContainer}>
            {/* Search Header Row */}
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsCountText}>
                {isSearching
                  ? "Searching all categories..."
                  : `Found ${searchResults.length} product${
                      searchResults.length === 1 ? "" : "s"
                    } for "${searchQuery.trim()}"`}
              </Text>
            </View>

            {/* Category Filter Pills (if multiple categories found) */}
            {!isSearching && resultCategories.length > 2 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPillsScroll}
              >
                {resultCategories.map((cat) => {
                  const isSelected = activeCategoryFilter === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.75}
                      onPress={() => setActiveCategoryFilter(cat)}
                      style={[
                        styles.catPill,
                        isSelected && styles.catPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          isSelected && styles.catPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Loading Indicator */}
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#004d5d" />
                <Text style={styles.loadingText}>
                  Searching products across all categories...
                </Text>
              </View>
            ) : searchError ? (
              <View style={styles.emptyContainer}>
                <Feather name="alert-circle" size={scale(48)} color="#EF4444" />
                <Text style={styles.emptyTitle}>Search Error</Text>
                <Text style={styles.emptySubtitle}>{searchError}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => executeSearch(searchQuery)}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryBtnText}>Retry Search</Text>
                </TouchableOpacity>
              </View>
            ) : filteredSearchResults.length > 0 ? (
              /* 2-Column Responsive Real Product Grid */
              <View style={styles.productsGrid}>
                {filteredSearchResults.map((prod) => (
                  <View key={prod.id} style={styles.productCardWrapper}>
                    <ProductCard
                      product={prod}
                      cardWidth={CARD_WIDTH}
                      onPress={handleProductPress}
                      onAddPress={handleAddToCart}
                    />
                  </View>
                ))}
              </View>
            ) : (
              /* Empty State */
              <View style={styles.emptyContainer}>
                <Feather name="search" size={scale(48)} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptySubtitle}>
                  We couldn't find any products matching "{searchQuery.trim()}".
                  Try searching with different keywords or browse categories.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* ======================================================== */
          /* B. DISCOVERY / DEFAULT MODE (When Search Query is Empty)  */
          /* ======================================================== */
          <>
            {/* Section 1: Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Recent searches</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleClearRecent}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal Recent Search Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {recentSearches.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        setSearchQuery(chip.label);
                        executeSearch(chip.label);
                      }}
                      style={styles.chipPill}
                    >
                      <Feather
                        name="search"
                        size={scale(13)}
                        color="#64748B"
                        style={styles.chipIcon}
                      />
                      <Text style={styles.chipLabel}>{chip.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section 2: Trending Searches */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>Trending in categories</Text>

              <View style={styles.trendingWrap}>
                {DEFAULT_TRENDING.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSearchQuery(item.title);
                      executeSearch(item.title);
                    }}
                    style={styles.trendingPill}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={scale(16)}
                      color="#004d5d"
                    />
                    <Text style={styles.trendingPillText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section 3: Popular Category Shelves with Real Products */}
            {isDiscoveryLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#004d5d" />
                <Text style={styles.loadingText}>Loading popular products...</Text>
              </View>
            ) : (
              discoveryShelves.map((shelf) => (
                <View key={shelf.title} style={styles.shelfContainer}>
                  <View style={styles.shelfHeaderRow}>
                    <Text style={styles.shelfTitle}>{shelf.title}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSearchQuery(shelf.title);
                        executeSearch(shelf.title);
                      }}
                    >
                      <Text style={styles.seeAllText}>See all</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.productsGrid}>
                    {shelf.items.map((prod) => (
                      <View key={prod.id} style={styles.productCardWrapper}>
                        <ProductCard
                          product={prod}
                          cardWidth={CARD_WIDTH}
                          onPress={handleProductPress}
                          onAddPress={handleAddToCart}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  gradientHeader: {
    paddingBottom: scale(12),
    borderBottomLeftRadius: scale(16),
    borderBottomRightRadius: scale(16),
  },
  safeArea: {
    paddingHorizontal: scale(16),
    paddingTop: scale(8),
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    height: scale(46),
    paddingHorizontal: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIconBtn: {
    padding: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    padding: scale(4),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    color: "#0F172A",
    paddingHorizontal: scale(8),
    paddingVertical: 0,
  },
  searchDivider: {
    width: 1,
    height: scale(20),
    backgroundColor: "#E2E8F0",
    marginHorizontal: scale(4),
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: scale(14),
    paddingBottom: scale(140),
    gap: scale(18),
  },
  resultsContainer: {
    gap: scale(12),
  },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsCountText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#334155",
  },
  categoryPillsScroll: {
    flexDirection: "row",
    gap: scale(8),
    paddingVertical: scale(2),
  },
  catPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catPillActive: {
    backgroundColor: "#004d5d",
    borderColor: "#004d5d",
  },
  catPillText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#475569",
  },
  catPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(50),
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
    gap: scale(10),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  retryBtn: {
    marginTop: scale(10),
    backgroundColor: "#004d5d",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  sectionContainer: {
    gap: scale(10),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  clearText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#DC2626",
  },
  chipsScroll: {
    flexDirection: "row",
    gap: scale(8),
    paddingVertical: scale(2),
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(7),
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  chipIcon: {
    marginRight: scale(5),
  },
  chipLabel: {
    fontSize: moderateScale(12.5),
    color: "#334155",
    fontWeight: "500",
  },
  trendingWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  trendingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F1",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(10),
    gap: scale(6),
  },
  trendingPillText: {
    fontSize: moderateScale(12.5),
    color: "#003844",
    fontWeight: "600",
  },
  shelfContainer: {
    gap: scale(10),
  },
  shelfHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shelfTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#0F172A",
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#004d5d",
  },
});
