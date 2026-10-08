import { FloatingCartBar } from "@/components/cart";
import {
  BabyCategories,
  BeautyPersonalCare,
  CurvedPromoScroller,
  DealsOfTheDays,
  FastSales,
  FeaturedBrands,
  GiftingCategories,
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
import { fetchAddresses } from "@/store/slices/addressSlice";
import {
  fetchPublicProducts,
  setSelectedCategory,
} from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const selectedCategory = useAppSelector(
    (state) => state.product.selectedCategory || "all",
  );
  const { activeDisplayLocation } = useAppSelector((state) => state.address);

  useEffect(() => {
    dispatch(
      fetchPublicProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 50,
      })
    );
  }, [dispatch, selectedCategory]);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/login" as any);
    }
  }, [isInitialized, isAuthenticated]);

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const displayLocation =
    activeDisplayLocation || "Baneshwor, Kathmandu, Bagmati, Nepal";

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
          storeName="Delivery Address"
          location={displayLocation}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            dispatch(setSelectedCategory(catId));
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

            {/* 5. Top Deals Double-Row Trending Carousel */}
            <TopDeals
              title="Top Deals & Trending Picks"
              isDoubleRow={true}
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
              category={selectedCategory}
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Flash Sale & Low Stock Deals",
                    category: "all",
                    filter: "flash-sale",
                    minDiscount: "20",
                  },
                })
              }
            />
            {/* 3. New Arrivals (2x3 Dual Product Green Tiles) */}
            <NewArrivals
              category={selectedCategory}
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
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Sweet Tooth Delights",
                    filter: "sweet-tooth",
                    minDiscount: "30",
                  },
                })
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
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Find Your Favorites",
                    filter: "favorites",
                    minDiscount: "40",
                  },
                })
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
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Instant & Frozen Food",
                    filter: "instant-frozen",
                    minDiscount: "30",
                  },
                })
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
              category="grocery"
              title="Creamy Delights for Every Bite"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Creamy Delights",
                    category: "grocery-kitchen",
                    filter: "creamy-delights",
                    minDiscount: "20",
                  },
                })
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
              category="grocery"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />

            {/* 5. New Arrivals (2x3 Green Duo Category Tiles) */}
            <NewArrivals
              category="grocery"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
            />

            {/* 6. Grocery Flash Sale (Peach Alert Banner + Stock Bars) */}
            <GroceryFlashSale
              category="grocery"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Grocery Flash Sale",
                    category: "grocery-kitchen",
                    filter: "grocery-flash-sale",
                    minDiscount: "30",
                  },
                })
              }
            />

            {/* 7. Find Your Favorites (Double-Row Deals + See all products) */}
            <TopDeals
              category="grocery"
              title="Find Your Favorites"
              isDoubleRow={true}
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Find Your Favorites",
                    category: "grocery-kitchen",
                    filter: "favorites",
                    minDiscount: "30",
                  },
                })
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
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Top Snack Deals",
                    category: "snacks-drinks",
                    filter: "deals",
                    minDiscount: "20",
                  },
                })
              }
            />

            <SubCategories
              category="snacks"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
            <SnacksDrinks
              onItemPress={(item) =>
                handleCategoryPress(item.name, item.subCategory)
              }
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
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Snacks & Drinks Flash Sale",
                    category: "snacks-drinks",
                    filter: "snacks-flash-sale",
                    minDiscount: "20",
                  },
                })
              }
            />

            <SweetTooth
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Sweet Tooth Delights",
                    filter: "sweet-tooth",
                    minDiscount: "30",
                  },
                })
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
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Beauty & Care Deals",
                    category: "beauty-personal-care",
                    filter: "deals",
                    minDiscount: "25",
                  },
                })
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
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Beauty New Arrivals",
                    category: "beauty-personal-care",
                    filter: "new_arrival",
                  },
                })
              }
            />
            <GroceryFlashSale
              category="beauty"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Beauty & Care Flash Sale",
                    category: "beauty-personal-care",
                    filter: "beauty-flash-sale",
                    minDiscount: "20",
                  },
                })
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
              onItemPress={(item) =>
                handleCategoryPress(item.name, item.subCategory)
              }
            />
            <TopDeals
              category="stationery"
              title="Top Stationery Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Stationery Deals",
                    category: "office-stationery",
                    filter: "deals",
                    minDiscount: "20",
                  },
                })
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
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Stationery New Arrivals",
                    category: "office-stationery",
                    filter: "new_arrival",
                  },
                })
              }
            />
            <GroceryFlashSale
              category="stationery"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Stationery & Office Flash Sale",
                    category: "office-stationery",
                    filter: "stationery-flash-sale",
                    minDiscount: "20",
                  },
                })
              }
            />
          </>
        )}

        {(selectedCategory === "baby" || selectedCategory === "kids") && (
          <>
            {/* 1. Baby Featured Brands */}
            <FeaturedBrands
              category="baby"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 2. Baby Essentials 7 Subcategories Grid */}
            <BabyCategories
              onItemPress={(item) =>
                handleCategoryPress(item.name, item.subCategory)
              }
            />

            {/* 3. Winter Essentials Cards */}
            <KidsWinterEssentials
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 4. Baby Top Deals */}
            <TopDeals
              category="baby"
              title="Top Baby Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Baby Deals & Picks",
                    category: "baby",
                    filter: "deals",
                    minDiscount: "20",
                  },
                })
              }
            />

            {/* 5. Baby Subcategories Catalog (7 Sections) */}
            <SubCategories
              category="baby"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />

            {/* 6. Baby New Arrivals (Duo Cards) */}
            <NewArrivals
              category="baby"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Baby New Arrivals",
                    category: "baby",
                    filter: "new_arrival",
                  },
                })
              }
            />

            {/* 7. Baby Flash Sale */}
            <GroceryFlashSale
              category="baby"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Baby Flash Sale",
                    category: "baby",
                    filter: "baby-flash-sale",
                    minDiscount: "20",
                  },
                })
              }
            />
          </>
        )}

        {selectedCategory === "gifting" && (
          <>
            {/* 1. Featured Gifting Brands */}
            <FeaturedBrands
              category="gifting"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />

            {/* 2. Gifting 8 Subcategories Grid */}
            <GiftingCategories
              onItemPress={(item) =>
                handleCategoryPress(item.name, item.subCategory)
              }
            />

            {/* 3. Top Gifting Deals */}
            <TopDeals
              category="gifting"
              title="Delightful Gift Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Gift & Celebration Deals",
                    category: "gifting",
                    filter: "deals",
                    minDiscount: "20",
                  },
                })
              }
            />

            {/* 4. Gifting Subcategories Catalog (8 Sections) */}
            <SubCategories
              category="gifting"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />

            {/* 5. Gifting New Arrivals */}
            <NewArrivals
              category="gifting"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Gifting New Arrivals",
                    category: "gifting",
                    filter: "new_arrival",
                  },
                })
              }
            />

            {/* 6. Gifting Flash Sale */}
            <GroceryFlashSale
              category="gifting"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Gifting Flash Sale",
                    category: "gifting",
                    filter: "gifting-flash-sale",
                    minDiscount: "20",
                  },
                })
              }
            />

            {/* 7. Promotional Banner & Sweet Delights */}
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
                router.push({
                  pathname: "/Screens/Product/seeAllProductScreen" as any,
                  params: {
                    title: "Sweet Tooth Delights",
                    category: "gifting",
                    filter: "sweet-tooth",
                    minDiscount: "30",
                  },
                })
              }
            />
          </>
        )}
      </ScrollView>

      {/* Select Location Bottom Sheet Modal */}
      <SelectLocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
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
