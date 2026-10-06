import { Image } from "expo-image";
import { FloatingCartBar } from "@/components/cart";
import { SelectLocationModal } from "@/components/home";
import { useCart } from "@/context/cart-context";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface BestsellerProduct {
  id: string;
  name: string;
  badge?: string;
  optionsText?: string;
  tags?: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
}

const BESTSELLER_PRODUCTS: BestsellerProduct[] = [
  {
    id: "bs-1",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    badge: "Few pieces left",
    optionsText: "3 options",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    id: "bs-2",
    name: "Wai Wai Ready To Eat Chicken Masala Flavored Noodles",
    badge: "Few pieces left",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "bs-3",
    name: "2pm Ready To Eat Chicken Masala Flavored Noodles",
    badge: "Few pieces left",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80",
  },
  {
    id: "bs-4",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    badge: "Few pieces left",
    optionsText: "3 options",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    id: "bs-5",
    name: "Wai Wai Ready To Eat Chicken Masala Flavored Noodles",
    badge: "Few pieces left",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "bs-6",
    name: "2pm Ready To Eat Chicken Masala Flavored Noodles",
    badge: "Few pieces left",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80",
  },
  {
    id: "bs-7",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    badge: "Few pieces left",
    optionsText: "3 options",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    id: "bs-8",
    name: "Wai Wai Ready To Eat Chicken Masala Flavored Noodles",
    badge: "Few pieces left",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "bs-9",
    name: "2pm Ready To Eat Chicken Masala Flavored Noodles",
    badge: "Few pieces left",
    tags: ["1kg", "cornflakes"],
    price: 300,
    originalPrice: 400,
    rating: 5,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80",
  },
];

export default function OrderAgainScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(
    "Baneshwor, Kathmandu, Bagmati, Nepal",
  );

  const handleProductPress = (product: BestsellerProduct) => {
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.imageUrl,
      },
    });
  };

  const { addToCart } = useCart();

  const handleAddToCart = (product: BestsellerProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FloatingCartBar />

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
              <Text style={styles.storeName}>Bhansa Mart</Text>
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
              placeholder='Search "Product"'
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            <TouchableOpacity activeOpacity={0.7} style={styles.micBtn}>
              <Feather name="mic" size={scale(17)} color="#64748B" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Reordering Illustration & Text Section */}
        <View style={styles.illustrationSection}>
          {/* Grocery Bag Illustration Container */}
          <View style={styles.bagIllustrationWrapper}>
            {/* Soft background clouds / glow */}
            <View style={styles.cloudLeft} />
            <View style={styles.cloudRight} />

            {/* Grocery items representation */}
            <View style={styles.groceryBag}>
              <MaterialCommunityIcons
                name="shopping"
                size={scale(70)}
                color="#D97706"
              />
              <View style={styles.foodBadges}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={scale(24)}
                  color="#DC2626"
                />
                <MaterialCommunityIcons
                  name="bottle-soda-classic"
                  size={scale(24)}
                  color="#0284C7"
                />
                <MaterialCommunityIcons
                  name="carrot"
                  size={scale(24)}
                  color="#EA580C"
                />
              </View>
            </View>
          </View>

          <Text style={styles.reorderingTitle}>Reordering will be easy</Text>
          <Text style={styles.reorderingSubtitle}>
            Item you order will show up here so you can buy them again easily
          </Text>
        </View>

        {/* 3. Bestsellers Section */}
        <View style={styles.bestsellersSection}>
          <Text style={styles.bestsellersTitle}>Bestsellers</Text>

          {/* 3-Column Product Grid */}
          <View style={styles.productsGrid}>
            {BESTSELLER_PRODUCTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                onPress={() => handleProductPress(item)}
                style={styles.productCard}
              >
                {/* Image Box with ADD pill */}
                <View style={styles.gridImageBox}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleAddToCart(item)}
                    style={styles.addBtn}
                  >
                    <Text style={styles.addBtnText}>ADD</Text>
                    {item.optionsText ? (
                      <Text style={styles.optionsSubtext}>
                        {item.optionsText}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* Few pieces left Badge */}
                {item.badge ? (
                  <Text style={styles.badgeText}>{item.badge}</Text>
                ) : (
                  <View style={{ height: moderateScale(12) }} />
                )}

                {/* Tag Pills */}
                <View style={styles.tagsRow}>
                  {item.tags?.map((t, i) => (
                    <View key={i} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{t}</Text>
                    </View>
                  ))}
                </View>

                {/* Product Name */}
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>

                {/* Star Ratings */}
                <View style={styles.ratingRow}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name="star"
                        size={scale(9.5)}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewsCount}>({item.reviewsCount})</Text>
                </View>

                {/* Price Row */}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>Rs. {item.price}</Text>
                  <Text style={styles.origPrice}>Rs.{item.originalPrice}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Select Location Bottom Sheet Modal */}
      <SelectLocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectLocation={(loc) =>
          setCurrentLocation(`${loc.title}, ${loc.address}`)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    fontSize: moderateScale(11),
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
    marginBottom: moderateScale(2),
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  locationText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#ffffff",
    maxWidth: "88%",
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
    paddingBottom: moderateScale(240),
  },
  illustrationSection: {
    alignItems: "center",
    paddingHorizontal: scale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(16),
  },
  bagIllustrationWrapper: {
    width: scale(160),
    height: scale(110),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: moderateScale(14),
  },
  cloudLeft: {
    position: "absolute",
    top: scale(10),
    left: scale(-10),
    width: scale(40),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: "#F1F5F9",
    opacity: 0.8,
  },
  cloudRight: {
    position: "absolute",
    top: scale(25),
    right: scale(-10),
    width: scale(50),
    height: scale(24),
    borderRadius: scale(12),
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
    bottom: scale(6),
    flexDirection: "row",
    gap: scale(2),
  },
  reorderingTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(6),
    textAlign: "center",
  },
  reorderingSubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  bestsellersSection: {
    paddingHorizontal: scale(14),
    marginTop: moderateScale(12),
  },
  bestsellersTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(14),
    paddingHorizontal: scale(2),
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(8),
  },
  productCard: {
    width: "31%",
    marginBottom: moderateScale(14),
  },
  gridImageBox: {
    width: "100%",
    height: scale(88),
    backgroundColor: "#E0F2FE",
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(4),
  },
  productImage: {
    width: "80%",
    height: "80%",
  },
  addBtn: {
    position: "absolute",
    bottom: scale(3),
    right: scale(3),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#2D6A4F",
    borderRadius: scale(5),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addBtnText: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    color: "#2D6A4F",
  },
  optionsSubtext: {
    fontSize: moderateScale(6.5),
    color: "#64748B",
    fontWeight: "500",
  },
  badgeText: {
    fontSize: moderateScale(8.5),
    color: "#DC2626",
    fontWeight: "600",
    marginTop: moderateScale(3),
    marginBottom: moderateScale(1),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(2),
    marginBottom: moderateScale(2),
  },
  tagPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    borderRadius: scale(3),
  },
  tagPillText: {
    fontSize: moderateScale(8),
    color: "#64748B",
    fontWeight: "600",
  },
  productName: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(13.5),
    marginBottom: moderateScale(2),
    minHeight: moderateScale(27),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    marginBottom: moderateScale(2),
  },
  stars: {
    flexDirection: "row",
    gap: scale(1),
  },
  reviewsCount: {
    fontSize: moderateScale(8.5),
    color: "#94A3B8",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  price: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#1E293B",
  },
  origPrice: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
});
