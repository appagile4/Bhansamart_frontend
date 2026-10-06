import { Image } from "expo-image";
import { FloatingCartBar } from "@/components/cart";
import { useCart } from "@/context/cart-context";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProductItem {
  id: string;
  name: string;
  weight: string;
  tag: string;
  stockTag: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
}

interface ShelfCategory {
  id: string;
  title: string;
  products: ProductItem[];
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    weight: "1kg",
    tag: "cornflakes",
    stockTag: "Few pieces left !",
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 140,
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    id: "p2",
    name: "Wai Wai Ready To Eat Chicken Masala Flavored Noodles",
    weight: "1kg",
    tag: "cornflakes",
    stockTag: "Few pieces left !",
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 112,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "p3",
    name: "2pm Ready To Eat Chicken Masala Flavored Noodles",
    weight: "1kg",
    tag: "cornflakes",
    stockTag: "Few pieces left !",
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 96,
    imageUrl:
      "https://images.unsplash.com/photo-1552611052-33e04de081de?w=300&q=80",
  },
];

const SHELF_SECTIONS: ShelfCategory[] = [
  {
    id: "chips-crisps",
    title: "Chips & Crisps",
    products: DEFAULT_PRODUCTS,
  },
  {
    id: "bread-pav",
    title: "Bread & pav",
    products: DEFAULT_PRODUCTS,
  },
  {
    id: "soft-drinks",
    title: "Soft drinks",
    products: DEFAULT_PRODUCTS,
  },
];

const TRENDING_GRID = [
  {
    id: "t1",
    title: "Biscuits",
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&q=80",
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&q=80",
    ],
  },
  {
    id: "t2",
    title: "Wai Wai",
    images: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&q=80",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&q=80",
    ],
  },
  {
    id: "t3",
    title: "2PM",
    images: [
      "https://images.unsplash.com/photo-1552611052-33e04de081de?w=150&q=80",
      "https://images.unsplash.com/photo-1552611052-33e04de081de?w=150&q=80",
    ],
  },
  {
    id: "t4",
    title: "Biscuits",
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&q=80",
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&q=80",
    ],
  },
  {
    id: "t5",
    title: "Wai Wai",
    images: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&q=80",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&q=80",
    ],
  },
  {
    id: "t6",
    title: "2PM",
    images: [
      "https://images.unsplash.com/photo-1552611052-33e04de081de?w=150&q=80",
      "https://images.unsplash.com/photo-1552611052-33e04de081de?w=150&q=80",
    ],
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([
    { id: "1", label: "coke", iconType: "search" },
    { id: "2", label: "cadbury", iconType: "brand" },
    { id: "3", label: "mars", iconType: "brand" },
    { id: "4", label: "nestle kitkat", iconType: "brand" },
  ]);

  const [continueBrowsing, setContinueBrowsing] = useState([
    {
      id: "cb-1",
      title: "Bath & body",
      subtitle: "5 products",
      image1:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80",
      image2:
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=150&q=80",
    },
    {
      id: "cb-2",
      title: "Bath & body",
      subtitle: "5 products",
      image1:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80",
      image2:
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=150&q=80",
    },
  ]);

  const { addToCart, updateQuantity } = useCart();
  const [cartCounts, setCartCounts] = useState<{ [id: string]: number }>({});

  const handleAddToCart = (product: ProductItem) => {
    setCartCounts((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: product.imageUrl,
      weight: product.weight,
    });
  };

  const handleIncrement = (product: ProductItem) => {
    setCartCounts((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
    updateQuantity(product.id, 1);
  };

  const handleDecrement = (product: ProductItem) => {
    setCartCounts((prev) => {
      const current = prev[product.id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return { ...prev, [product.id]: current - 1 };
    });
    updateQuantity(product.id, -1);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const handleDismissBrowsing = (id: string) => {
    setContinueBrowsing((prev) => prev.filter((item) => item.id !== id));
  };

  const handleVoiceSearch = () => {
    Alert.alert(
      "Voice Search",
      "Listening for voice command... Say 'Noodles', 'Juices', or 'Biscuits'",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Simulate 'Wai Wai'",
          onPress: () => setSearchQuery("Wai Wai"),
        },
      ],
    );
  };

  const handleProductPress = (product: ProductItem) => {
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: product.id,
        name: product.name,
        price: String(product.price),
        originalPrice: String(product.originalPrice),
        rating: String(product.rating),
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
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

            {/* TextInput */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Chips , Juices"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            {/* Clear button if text exists */}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearchQuery("")}
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
      >
        {/* Section 1: Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Recent searches</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleClearRecent}>
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
                  onPress={() => setSearchQuery(chip.label)}
                  style={styles.chipPill}
                >
                  {chip.iconType === "search" ? (
                    <Feather
                      name="search"
                      size={scale(14)}
                      color="#64748B"
                      style={styles.chipIcon}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="candy-outline"
                      size={scale(15)}
                      color="#DC2626"
                      style={styles.chipIcon}
                    />
                  )}
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section 2: Continue browsing for */}
        {continueBrowsing.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Continue browsing for</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.browsingScroll}
            >
              {continueBrowsing.map((item) => (
                <View key={item.id} style={styles.browsingCard}>
                  {/* Close Dismiss Button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDismissBrowsing(item.id)}
                    style={styles.browsingCloseBtn}
                  >
                    <Feather name="x" size={scale(14)} color="#475569" />
                  </TouchableOpacity>

                  {/* Dual Product Thumbnail Preview */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push("/customerMain/category" as any)}
                    style={styles.browsingImageBox}
                  >
                    <Image
                      source={{ uri: item.image1 }}
                      style={styles.browsingThumb}
                      contentFit="contain"
                    />
                    <Image
                      source={{ uri: item.image2 }}
                      style={styles.browsingThumb}
                      contentFit="contain"
                    />
                  </TouchableOpacity>

                  {/* Info */}
                  <Text style={styles.browsingTitle}>{item.title}</Text>
                  <Text style={styles.browsingSubtitle}>{item.subtitle}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section 3: Trending now */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Trending now</Text>

          <View style={styles.trendingGrid}>
            {TRENDING_GRID.map((tItem) => (
              <TouchableOpacity
                key={tItem.id}
                activeOpacity={0.85}
                onPress={() => setSearchQuery(tItem.title)}
                style={styles.trendingCard}
              >
                {/* Green Header */}
                <View style={styles.trendingHeader}>
                  <Text style={styles.trendingTitle}>{tItem.title}</Text>
                </View>

                {/* Bottom Image Thumbnails Box */}
                <View style={styles.trendingThumbRow}>
                  {tItem.images.map((imgUri, idx) => (
                    <View key={idx} style={styles.trendingThumbBox}>
                      <Image
                        source={{ uri: imgUri }}
                        style={styles.trendingImage}
                        contentFit="contain"
                      />
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 4: Category Shelves (Chips & Crisps, Bread & pav, Soft drinks) */}
        {SHELF_SECTIONS.map((section) => (
          <View key={section.id} style={styles.shelfSection}>
            <Text style={styles.shelfTitle}>{section.title}</Text>

            {/* 3-Column Product Shelf */}
            <View style={styles.shelfRow}>
              {section.products.map((product) => {
                const count = cartCounts[product.id] || 0;
                return (
                  <TouchableOpacity
                    key={product.id}
                    activeOpacity={0.88}
                    onPress={() => handleProductPress(product)}
                    style={styles.shelfCard}
                  >
                    {/* Image Container with Mint Background */}
                    <View style={styles.productImageBox}>
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productImage}
                        contentFit="contain"
                      />

                      {/* ADD Button Overlay */}
                      {count === 0 ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleAddToCart(product)}
                          style={styles.addBtnOverlay}
                        >
                          <Text style={styles.addBtnText}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.counterOverlay}>
                          <TouchableOpacity
                            onPress={() => handleDecrement(product)}
                            style={styles.counterActionBtn}
                          >
                            <Feather
                              name="minus"
                              size={scale(10)}
                              color="#15803D"
                            />
                          </TouchableOpacity>
                          <Text style={styles.counterText}>{count}</Text>
                          <TouchableOpacity
                            onPress={() => handleIncrement(product)}
                            style={styles.counterActionBtn}
                          >
                            <Feather
                              name="plus"
                              size={scale(10)}
                              color="#15803D"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Stock Alert */}
                    <Text style={styles.stockAlertText}>
                      {product.stockTag}
                    </Text>

                    {/* Tags Row */}
                    <View style={styles.tagPillRow}>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>{product.weight}</Text>
                      </View>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>{product.tag}</Text>
                      </View>
                    </View>

                    {/* Product Name */}
                    <Text numberOfLines={2} style={styles.productTitleText}>
                      {product.name}
                    </Text>

                    {/* Star Rating */}
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome
                          key={star}
                          name="star"
                          size={scale(10)}
                          color="#EAB308"
                          style={{ marginRight: scale(1) }}
                        />
                      ))}
                      <Text style={styles.reviewsCountText}>
                        ({product.reviewsCount})
                      </Text>
                    </View>

                    {/* Price & Struck MRP */}
                    <View style={styles.priceRow}>
                      <Text style={styles.currentPriceText}>
                        Rs. {product.price}
                      </Text>
                      <Text style={styles.originalPriceText}>
                        Rs. {product.originalPrice}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom "See all products >" Pill Banner */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/customerMain/category" as any)}
              style={styles.seeAllBanner}
            >
              <View style={styles.avatarGroup}>
                <Image
                  source={{ uri: DEFAULT_PRODUCTS[0].imageUrl }}
                  style={styles.avatarIcon}
                 contentFit="contain"/>
                <Image
                  source={{ uri: DEFAULT_PRODUCTS[1].imageUrl }}
                  style={[styles.avatarIcon, { marginLeft: -scale(8) }]}
                 contentFit="contain"/>
                <Image
                  source={{ uri: DEFAULT_PRODUCTS[2].imageUrl }}
                  style={[styles.avatarIcon, { marginLeft: -scale(8) }]}
                 contentFit="contain"/>
              </View>
              <Text style={styles.seeAllText}>See all products</Text>
              <Feather name="chevron-right" size={scale(16)} color="#0369A1" />
            </TouchableOpacity>
          </View>
        ))}
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
    fontSize: moderateScale(14),
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
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(140),
    gap: scale(20),
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
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#0F172A",
  },
  clearText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#16A34A",
  },
  chipsScroll: {
    flexDirection: "row",
    gap: scale(10),
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  chipIcon: {
    marginRight: scale(6),
  },
  chipLabel: {
    fontSize: moderateScale(13),
    color: "#334155",
    fontWeight: "500",
  },
  browsingScroll: {
    flexDirection: "row",
    gap: scale(12),
    paddingVertical: scale(4),
  },
  browsingCard: {
    width: scale(130),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: scale(8),
    position: "relative",
  },
  browsingCloseBtn: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "rgba(241, 245, 249, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  browsingImageBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: scale(10),
    height: scale(80),
    marginBottom: scale(8),
    gap: scale(4),
  },
  browsingThumb: {
    width: scale(38),
    height: scale(56),
  },
  browsingTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#0F172A",
  },
  browsingSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  trendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(10),
  },
  trendingCard: {
    width: "31%",
    backgroundColor: "#48BB78",
    borderRadius: scale(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendingHeader: {
    paddingVertical: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  trendingTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  trendingThumbRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(4),
    marginBottom: scale(4),
    borderRadius: scale(8),
    padding: scale(4),
    justifyContent: "space-around",
    alignItems: "center",
    height: scale(50),
  },
  trendingThumbBox: {
    width: "46%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  trendingImage: {
    width: "100%",
    height: "100%",
  },
  shelfSection: {
    gap: scale(12),
  },
  shelfTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#0F172A",
  },
  shelfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shelfCard: {
    width: "31.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(6),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productImageBox: {
    width: "100%",
    height: scale(95),
    backgroundColor: "#E0F2FE",
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: scale(6),
  },
  productImage: {
    width: "80%",
    height: "80%",
  },
  addBtnOverlay: {
    position: "absolute",
    bottom: scale(4),
    right: scale(4),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: scale(6),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    color: "#16A34A",
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  counterOverlay: {
    position: "absolute",
    bottom: scale(4),
    right: scale(4),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: scale(6),
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
  },
  counterActionBtn: {
    padding: scale(2),
  },
  counterText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#15803D",
    marginHorizontal: scale(4),
  },
  stockAlertText: {
    fontSize: moderateScale(9),
    color: "#64748B",
    marginBottom: scale(3),
  },
  tagPillRow: {
    flexDirection: "row",
    gap: scale(3),
    marginBottom: scale(4),
  },
  tagPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  tagPillText: {
    fontSize: moderateScale(8.5),
    color: "#64748B",
    fontWeight: "500",
  },
  productTitleText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: moderateScale(14),
    marginBottom: scale(4),
    minHeight: scale(28),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(4),
  },
  reviewsCountText: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    marginLeft: scale(2),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  currentPriceText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  originalPriceText: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  seeAllBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2FE",
    borderRadius: scale(10),
    paddingVertical: scale(10),
    gap: scale(6),
    marginTop: scale(4),
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarIcon: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#0369A1",
  },
});
