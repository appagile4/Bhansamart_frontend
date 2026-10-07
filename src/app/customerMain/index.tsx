import { FloatingCartBar } from "@/components/cart";
import {
  BeautyPersonalCare,
  CurvedPromoScroller,
  DealsOfTheDays,
  FastSales,
  FeaturedBrands,
  GroceryFlashSale,
  GroceryKitchen,
  Header,
  InstantFrozenFood,
  KidsWinterEssentials,
  NewArrivals,
  SchoolOfficeStationery,
  SelectLocationModal,
  SnacksDrinks,
  SubCategories,
  SweetTooth,
  TopDeals,
} from "@/components/home";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPublicProducts } from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    dispatch(fetchPublicProducts());
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/login" as any);
    }
  }, [isInitialized, isAuthenticated]);

  // By default, category slider is on "all"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(
    "Baneshwor, Kathmandu, Bagmati, Nepal",
  );

  const handleCategoryPress = (categoryName: string, categoryId?: string) => {
    router.push({
      pathname: "/Screens/Category/categoryExpand" as any,
      params: {
        title: categoryName.replace("\n", " "),
        category: categoryId || categoryName.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  };

  const handleProductPress = (prod: any) => {
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: prod.id || "prod-item",
        name: prod.name || prod.title || "Product",
        price: prod.price || 100,
        originalPrice: prod.originalPrice || prod.oldPrice || prod.price || 120,
        image: prod.imageUrl || prod.image || "",
        weight: prod.weight || prod.volume || "1 unit",
      },
    });
  };

  const handleAddToCart = (prod: any) => {
    addToCart({
      id: prod.id || `item-${Date.now()}`,
      name: prod.name || prod.title || "Product",
      price:
        typeof prod.price === "number" ? prod.price : Number(prod.price) || 100,
      originalPrice: prod.originalPrice
        ? Number(prod.originalPrice)
        : undefined,
      imageUrl: prod.imageUrl || prod.image || "",
      weight: prod.weight || prod.volume || "1 unit",
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FloatingCartBar />
      {/* Scrollable Home Screen Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StatusBar style="dark" />

        {/* Top Header with Gradient, Store Location, SearchBar & Category Scroller */}
        <Header
          storeName="Bhansa Mart"
          location={currentLocation}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
          }}
          onLocationPress={() => setIsLocationModalVisible(true)}
          onStorePress={() => console.log("Store icon pressed")}
          onProfilePress={() => router.push("/Screens/Profile/profile" as any)}
          onSearchPress={() => router.push("/search" as any)}
          onVoicePress={() => router.push("/search" as any)}
        />

        {/* ======================================================== */}
        {/* 1. BY DEFAULT & WHEN CATEGORY SLIDER IS ON "ALL"        */}
        {/* ======================================================== */}
        {selectedCategory === "all" && (
          <>
            {/* 2. Fast Flash Sale Banner & Quick Categories */}
            <FastSales
              onBannerPress={() =>
                router.push({
                  pathname: "/Screens/Category/categoryExpand" as any,
                  params: {
                    category: "Snacks & Drinks",
                    title: "Flash Sale",
                  },
                })
              }
              onCategoryPress={(cat: any) =>
                router.push({
                  pathname: "/Screens/Category/categoryExpand" as any,
                  params: {
                    category: cat.category || "Snacks & Drinks",
                    subCategory: cat.subCategory || cat.name,
                    title: cat.name || cat.title || "Flash Sale",
                  },
                })
              }
            />

            {/* 4. Deals of the Day Triple Showcase Grid */}
            <DealsOfTheDays
              onProductPress={(deal) =>
                router.push({
                  pathname: "/Screens/Product/productdetailscreen" as any,
                  params: {
                    id: deal.id,
                    name: deal.name,
                    price: deal.price,
                    originalPrice: deal.originalPrice,
                    weight: deal.weight,
                    category: deal.category,
                    image:
                      typeof deal.image === "object" && "uri" in deal.image
                        ? (deal.image as any).uri
                        : "",
                  },
                })
              }
              onSeeMorePress={(deal) =>
                router.push({
                  pathname: "/Screens/Category/categoryExpand" as any,
                  params: {
                    category: deal.category || "Grocery & Kitchen",
                    subCategory: (deal as any).subCategory || deal.category,
                    title: deal.name,
                  },
                })
              }
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Deals of the Day",
                    filter: "deals",
                    minDiscount: "40",
                  },
                })
              }
            />

            {/* 5. Top Deals Single-Row Trending Carousel */}
            <TopDeals
              title="Top Deals & Trending Picks"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Top Deals & Trending Picks",
                    filter: "trending",
                    minDiscount: "50",
                  },
                })
              }
            />

            {/* 6. Fluid Curved Promo Banner Carousel */}
            <CurvedPromoScroller
              onPromoPress={(promo) =>
                console.log("Promo clicked:", promo.title)
              }
            />

            {/* 7. Grocery & Kitchen Category Grid */}
            <GroceryKitchen
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />

            {/* 8. Live Grocery Flash Sale (Peach Alert Card + Stock Bars) */}
            <GroceryFlashSale
              category="grocery"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Grocery Flash Sale", "grocery-flash-sale")
              }
            />
            {/* 3. New Arrivals (2x3 Dual Product Green Tiles) */}
            <NewArrivals
              category="grocery"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />

            {/* 9. Snacks & Cold Drinks Category Grid */}
            <SnacksDrinks
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />

            {/* 10. Sweet Tooth Chocolate Delights Slider */}
            <SweetTooth
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Sweet Tooth", "sweet-tooth")
              }
            />

            {/* 11. Beauty & Personal Care Category Grid */}
            <BeautyPersonalCare
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />

            {/* 12. Double-Row Super Deals ("Find Your Favorites") */}
            <TopDeals
              title="Find Your Favorites"
              isDoubleRow={true}
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Find Your Favorites", "favorites")
              }
            />

            {/* 13. School & Office Stationery Category Grid */}
            <SchoolOfficeStationery
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />

            {/* 14. Kids Winter Essentials (3 Icy Blue Category Cards) */}
            <KidsWinterEssentials
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 15. Instant & Frozen Food Product Showcase */}
            <InstantFrozenFood
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Instant & Frozen Food", "instant-frozen")
              }
            />

            {/* 16. Comprehensive Multi-Section Catalog Explorer */}
            <SubCategories
              category="grocery"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
          </>
        )}

        {/* ======================================================== */}
        {/* 2. SPECIFIC CATEGORY FILTER VIEWS                        */}
        {/* ======================================================== */}
        {selectedCategory === "grocery" && (
          <>
            {/* 1. Featured Brands Carousel */}
            <FeaturedBrands
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 2. Creamy Delights for Every Bite */}
            <TopDeals
              title="Creamy Delights for Every Bite"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Creamy Delights", "creamy-delights")
              }
            />

            {/* 3. Curved Promo Banner Carousel */}
            <CurvedPromoScroller
              onPromoPress={(promo) =>
                console.log("Promo clicked:", promo.title)
              }
            />

            {/* 4. 8-Section Comprehensive Grocery Catalog Grid */}
            <SubCategories
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />

            {/* 5. New Arrivals (2x3 Green Duo Category Tiles) */}
            <NewArrivals
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />

            {/* 6. Grocery Flash Sale (Peach Alert Banner + Stock Bars) */}
            <GroceryFlashSale
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Grocery Flash Sale", "grocery-flash-sale")
              }
            />

            {/* 7. Find Your Favorites (Double-Row Deals + See all products) */}
            <TopDeals
              title="Find Your Favorites"
              isDoubleRow={true}
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Find Your Favorites", "favorites")
              }
            />
          </>
        )}

        {selectedCategory === "snacks" && (
          <>
            <FeaturedBrands
              category="snacks"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <TopDeals
              category="snacks"
              title="Top Snack Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() => handleCategoryPress("Snack Deals", "snacks")}
            />

            <SubCategories
              category="snacks"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
            <SnacksDrinks
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />
            <NewArrivals
              category="snacks"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />
            <GroceryFlashSale
              category="snacks"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Snacks Flash Sale", "snacks-flash-sale")
              }
            />

            <SweetTooth
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Sweet Tooth", "sweet-tooth")
              }
            />
          </>
        )}

        {selectedCategory === "beauty" && (
          <>
            <FeaturedBrands
              category="beauty"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <TopDeals
              category="beauty"
              title="Beauty & Care Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Beauty Deals", "beauty")
              }
            />

            <SubCategories
              category="beauty"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
            <BeautyPersonalCare
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />
            <NewArrivals
              category="beauty"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />
            <GroceryFlashSale
              category="beauty"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Beauty Flash Sale", "beauty-flash-sale")
              }
            />
          </>
        )}

        {selectedCategory === "stationery" && (
          <>
            {/* Featured Stationery Brands */}
            <FeaturedBrands
              category="stationery"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <SchoolOfficeStationery
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />
            <TopDeals
              category="stationery"
              title="Top Stationery Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Stationery Deals", "stationery")
              }
            />

            <SubCategories
              category="stationery"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />

            <NewArrivals
              category="stationery"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />
            <GroceryFlashSale
              category="stationery"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress(
                  "Stationery Flash Sale",
                  "stationery-flash-sale",
                )
              }
            />
          </>
        )}

        {selectedCategory === "kids" && (
          <>
            {/* 1. Kids Featured Brands */}
            <FeaturedBrands
              category="kids"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 4. Winter Essentials (3 Icy Blue Category Cards) */}
            <KidsWinterEssentials
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 2. Kids Top Deals */}
            <TopDeals
              category="kids"
              title="Top Kids Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() => handleCategoryPress("Kids Deals", "kids")}
            />

            {/* 6. Multi-Section Kids Sub-Categories Catalog (6 Sections) */}
            <SubCategories
              category="kids"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />

            {/* 3. New Arrivals (Kids Duo Cards) */}
            <NewArrivals
              category="kids"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />

            {/* 5. Kids Flash Sale */}
            <GroceryFlashSale
              category="kids"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Kids Flash Sale", "kids-flash-sale")
              }
            />
          </>
        )}

        {selectedCategory === "gifting" && (
          <>
            {/* Featured Gifting Brands */}
            <FeaturedBrands
              category="gifting"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <TopDeals
              category="gifting"
              title="Delightful Gift Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() => handleCategoryPress("Gift Deals", "gifting")}
            />
            <NewArrivals
              category="gifting"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />
            <GroceryFlashSale
              category="gifting"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleCategoryPress("Gifting Flash Sale", "gifting-flash-sale")
              }
            />
            <SubCategories
              category="gifting"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
            <CurvedPromoScroller
              onPromoPress={(promo) =>
                console.log("Promo clicked:", promo.title)
              }
            />
            <SweetTooth
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleCategoryPress("Sweet Tooth", "sweet-tooth")
              }
            />
            <BeautyPersonalCare
              onItemPress={(item) => handleCategoryPress(item.name, item.id)}
            />
          </>
        )}
      </ScrollView>

      {/* Select Location Bottom Sheet Modal */}
      <SelectLocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectLocation={(loc) => {
          setCurrentLocation(`${loc.title}, ${loc.address}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(180),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1E293B",
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#008080",
  },
});
