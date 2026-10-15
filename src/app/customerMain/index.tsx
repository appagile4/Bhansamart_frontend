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
  NearbyStoresModal,
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
import socketService from "@/store/services/socketService";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();

  // Fine-grained selectors to prevent re-renders on unrelated slice updates
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const selectedCategory = useAppSelector(
    (state) => state.product?.selectedCategory || "all"
  );
  const activeDisplayLocation = useAppSelector(
    (state) => state.address?.activeDisplayLocation
  );
  const customerLat = useAppSelector((state) => state.address?.latitude);
  const customerLng = useAppSelector((state) => state.address?.longitude);
  const isOutsideDeliveryZone = useAppSelector(
    (state) => state.product?.isOutsideDeliveryZone
  );
  const eligibleVendorsCount = useAppSelector(
    (state) => state.product?.eligibleVendorsCount
  );

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isNearbyStoresModalVisible, setIsNearbyStoresModalVisible] = useState(false);

  // ── Data Fetching Effects with Location-Based Delivery Radius Filtering ─
  useEffect(() => {
    dispatch(
      fetchPublicProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        lat: customerLat || undefined,
        lng: customerLng || undefined,
        limit: 50,
      })
    );
  }, [dispatch, selectedCategory, customerLat, customerLng]);

  // ── Real-Time Socket Connection & Radius Change Listeners ──────────────
  useEffect(() => {
    socketService.connect(false).then(() => {
      if (customerLat && customerLng) {
        socketService.emitCustomerLocation(customerLat, customerLng);
      }
    });

    // When any vendor updates their delivery radius, refresh product availability
    const unsubRadius = socketService.onDeliveryRadiusUpdated(() => {
      dispatch(
        fetchPublicProducts({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          lat: customerLat || undefined,
          lng: customerLng || undefined,
          limit: 50,
        })
      );
    });

    // When any vendor opens or closes their store, refresh product availability
    const unsubAvail = socketService.onVendorAvailabilityChanged(() => {
      dispatch(
        fetchPublicProducts({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          lat: customerLat || undefined,
          lng: customerLng || undefined,
          limit: 50,
        })
      );
    });

    return () => {
      unsubRadius();
      unsubAvail();
    };
  }, [dispatch, selectedCategory, customerLat, customerLng]);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/(auth)/login" as any);
    }
  }, [isInitialized, isAuthenticated]);

  // ── Memoized Values ─────────────────────────────────────────────────
  const displayLocation = useMemo(
    () => activeDisplayLocation || "Baneshwor, Kathmandu, Bagmati, Nepal",
    [activeDisplayLocation]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: theme.colors.background }],
    [theme.colors.background]
  );

  // ── Memoized Navigation & Action Callbacks ──────────────────────────
  const handleSelectCategory = useCallback(
    (catId: string) => {
      dispatch(setSelectedCategory(catId));
    },
    [dispatch]
  );

  const handleOpenLocationModal = useCallback(() => {
    setIsLocationModalVisible(true);
  }, []);

  const handleCloseLocationModal = useCallback(() => {
    setIsLocationModalVisible(false);
  }, []);

  const handleProfilePress = useCallback(() => {
    router.push("/Screens/Profile/profile" as any);
  }, []);

  const handleSearchPress = useCallback(() => {
    router.push("/search" as any);
  }, []);

  const handleVoicePress = useCallback(() => {
    router.push("/search" as any);
  }, []);

  const handleStorePress = useCallback(() => {
    setIsNearbyStoresModalVisible(true);
  }, []);

  const handleCloseNearbyStoresModal = useCallback(() => {
    setIsNearbyStoresModalVisible(false);
  }, []);

  const handleCategoryPress = useCallback(
    (categoryName: string, categoryId?: string) => {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params: {
          title: categoryName.replace("\n", " "),
          category:
            categoryId || categoryName.toLowerCase().replace(/\s+/g, "-"),
        },
      });
    },
    []
  );

  const handleProductPress = useCallback((prod: any) => {
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
  }, []);

  const handleDealsOfTheDaysProductPress = useCallback((deal: any) => {
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
    });
  }, []);

  const handleAddToCart = useCallback(
    (prod: any) => {
      addToCart({
        id: prod.id || `item-${Date.now()}`,
        name: prod.name || prod.title || "Product",
        price:
          typeof prod.price === "number"
            ? prod.price
            : Number(prod.price) || 100,
        originalPrice: prod.originalPrice
          ? Number(prod.originalPrice)
          : undefined,
        imageUrl: prod.imageUrl || prod.image || "",
        weight: prod.weight || prod.volume || "1 unit",
      });
    },
    [addToCart]
  );

  const handleNavigateCategoryExpand = useCallback(
    (params: { category: string; subCategory?: string; title?: string }) => {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params,
      });
    },
    []
  );

  const handleNavigateSeeAll = useCallback(
    (params: {
      title: string;
      filter?: string;
      category?: string;
      minDiscount?: string;
    }) => {
      router.push({
        pathname: "/Screens/Product/seeAllProductScreen" as any,
        params,
      });
    },
    []
  );

  const handlePromoPress = useCallback((promo: any) => {
    console.log("Promo clicked:", promo.title);
  }, []);

  // ── Memoized Category-Specific Views ─────────────────────────────────
  const categoryContent = useMemo(() => {
    switch (selectedCategory) {
      case "all":
        return (
          <>
            {/* 2. Fast Flash Sale Banner & Quick Categories */}
            <FastSales
              onBannerPress={() =>
                handleNavigateCategoryExpand({
                  category: "Snacks & Drinks",
                  title: "Flash Sale",
                })
              }
              onCategoryPress={(cat: any) =>
                handleNavigateCategoryExpand({
                  category: cat.category || "Snacks & Drinks",
                  subCategory: cat.subCategory || cat.name,
                  title: cat.name || cat.title || "Flash Sale",
                })
              }
            />

            {/* 4. Deals of the Day Triple Showcase Grid */}
            <DealsOfTheDays
              onProductPress={handleDealsOfTheDaysProductPress}
              onSeeMorePress={(deal: any) =>
                handleNavigateCategoryExpand({
                  category: deal.category || "Grocery & Kitchen",
                  subCategory: deal.subCategory || deal.category,
                  title: deal.name,
                })
              }
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Deals of the Day",
                  filter: "deals",
                  minDiscount: "40",
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
                handleNavigateSeeAll({
                  title: "Top Deals & Trending Picks",
                  filter: "trending",
                  minDiscount: "50",
                })
              }
            />

            {/* 6. Fluid Curved Promo Banner Carousel */}
            <CurvedPromoScroller onPromoPress={handlePromoPress} />

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
                handleNavigateSeeAll({
                  title: "Flash Sale & Low Stock Deals",
                  category: "all",
                  filter: "flash-sale",
                  minDiscount: "20",
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
                handleNavigateSeeAll({
                  title: "Sweet Tooth Delights",
                  filter: "sweet-tooth",
                  minDiscount: "30",
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
                handleNavigateSeeAll({
                  title: "Find Your Favorites",
                  filter: "favorites",
                  minDiscount: "40",
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
                handleNavigateSeeAll({
                  title: "Instant & Frozen Food",
                  filter: "instant-frozen",
                  minDiscount: "30",
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
        );

      case "grocery":
        return (
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
                handleNavigateSeeAll({
                  title: "Creamy Delights",
                  category: "grocery-kitchen",
                  filter: "creamy-delights",
                  minDiscount: "20",
                })
              }
            />

            {/* 3. Curved Promo Banner Carousel */}
            <CurvedPromoScroller onPromoPress={handlePromoPress} />

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
                handleNavigateSeeAll({
                  title: "Grocery Flash Sale",
                  category: "grocery-kitchen",
                  filter: "grocery-flash-sale",
                  minDiscount: "30",
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
                handleNavigateSeeAll({
                  title: "Find Your Favorites",
                  category: "grocery-kitchen",
                  filter: "favorites",
                  minDiscount: "30",
                })
              }
            />
          </>
        );

      case "snacks":
        return (
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
                handleNavigateSeeAll({
                  title: "Top Snack Deals",
                  category: "snacks-drinks",
                  filter: "deals",
                  minDiscount: "20",
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
                handleNavigateSeeAll({
                  title: "Snacks & Drinks Flash Sale",
                  category: "snacks-drinks",
                  filter: "snacks-flash-sale",
                  minDiscount: "20",
                })
              }
            />
            <SweetTooth
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Sweet Tooth Delights",
                  filter: "sweet-tooth",
                  minDiscount: "30",
                })
              }
            />
          </>
        );

      case "beauty":
        return (
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
                handleNavigateSeeAll({
                  title: "Beauty & Care Deals",
                  category: "beauty-personal-care",
                  filter: "deals",
                  minDiscount: "25",
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
                handleNavigateSeeAll({
                  title: "Beauty New Arrivals",
                  category: "beauty-personal-care",
                  filter: "new_arrival",
                })
              }
            />
            <GroceryFlashSale
              category="beauty"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Beauty & Care Flash Sale",
                  category: "beauty-personal-care",
                  filter: "beauty-flash-sale",
                  minDiscount: "20",
                })
              }
            />
          </>
        );

      case "stationery":
        return (
          <>
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
                handleNavigateSeeAll({
                  title: "Stationery Deals",
                  category: "office-stationery",
                  filter: "deals",
                  minDiscount: "20",
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
                handleNavigateSeeAll({
                  title: "Stationery New Arrivals",
                  category: "office-stationery",
                  filter: "new_arrival",
                })
              }
            />
            <GroceryFlashSale
              category="stationery"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Stationery & Office Flash Sale",
                  category: "office-stationery",
                  filter: "stationery-flash-sale",
                  minDiscount: "20",
                })
              }
            />
          </>
        );

      case "baby":
      case "kids":
        return (
          <>
            <FeaturedBrands
              category="baby"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <BabyCategories
              onItemPress={(item) =>
                handleCategoryPress(item.name, item.subCategory)
              }
            />
            <KidsWinterEssentials
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <TopDeals
              category="baby"
              title="Top Baby Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Baby Deals & Picks",
                  category: "baby",
                  filter: "deals",
                  minDiscount: "20",
                })
              }
            />
            <SubCategories
              category="baby"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
            <NewArrivals
              category="baby"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Baby New Arrivals",
                  category: "baby",
                  filter: "new_arrival",
                })
              }
            />
            <GroceryFlashSale
              category="baby"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Baby Flash Sale",
                  category: "baby",
                  filter: "baby-flash-sale",
                  minDiscount: "20",
                })
              }
            />
          </>
        );

      case "gifting":
        return (
          <>
            <FeaturedBrands
              category="gifting"
              onItemPress={(item) =>
                handleCategoryPress(item.title, item.category)
              }
            />
            <GiftingCategories
              onItemPress={(item) =>
                handleCategoryPress(item.name, item.subCategory)
              }
            />
            <TopDeals
              category="gifting"
              title="Delightful Gift Deals"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Gift & Celebration Deals",
                  category: "gifting",
                  filter: "deals",
                  minDiscount: "20",
                })
              }
            />
            <SubCategories
              category="gifting"
              onItemPress={(section, item) =>
                handleCategoryPress(item.title, item.id)
              }
            />
            <NewArrivals
              category="gifting"
              onCategoryPress={(cat) =>
                handleCategoryPress(cat.title, cat.category)
              }
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Gifting New Arrivals",
                  category: "gifting",
                  filter: "new_arrival",
                })
              }
            />
            <GroceryFlashSale
              category="gifting"
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Gifting Flash Sale",
                  category: "gifting",
                  filter: "gifting-flash-sale",
                  minDiscount: "20",
                })
              }
            />
            <CurvedPromoScroller onPromoPress={handlePromoPress} />
            <SweetTooth
              onProductPress={handleProductPress}
              onAddPress={handleAddToCart}
              onSeeMorePress={(prod) => handleCategoryPress(prod.name, prod.id)}
              onSeeAllPress={() =>
                handleNavigateSeeAll({
                  title: "Sweet Tooth Delights",
                  category: "gifting",
                  filter: "sweet-tooth",
                  minDiscount: "30",
                })
              }
            />
          </>
        );

      default:
        return null;
    }
  }, [
    selectedCategory,
    handleProductPress,
    handleDealsOfTheDaysProductPress,
    handleAddToCart,
    handleCategoryPress,
    handleNavigateCategoryExpand,
    handleNavigateSeeAll,
    handlePromoPress,
  ]);

  return (
    <View style={containerStyle}>
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
          onSelectCategory={handleSelectCategory}
          onLocationPress={handleOpenLocationModal}
          onStorePress={handleStorePress}
          onProfilePress={handleProfilePress}
          onSearchPress={handleSearchPress}
          onVoicePress={handleVoicePress}
        />

        {/* ── Delivery Zone Availability Indicator ────────────────────── */}
        {isOutsideDeliveryZone ? (
          <View style={styles.outsideZoneBanner}>
            <View style={styles.outsideZoneIconBox}>
              <Feather name="map-pin" size={scale(20)} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.outsideZoneTitle}>Delivery Unavailable at this Location</Text>
              <Text style={styles.outsideZoneSub}>
                None of our active partner stores currently deliver to this selected area.
              </Text>
              <TouchableOpacity
                style={styles.changeLocBtn}
                activeOpacity={0.7}
                onPress={handleOpenLocationModal}
              >
                <Feather name="navigation" size={scale(13)} color="#FFFFFF" />
                <Text style={styles.changeLocBtnText}>Change Delivery Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.deliveryAvailableBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.deliveryAvailableText}>
              ⚡ Delivering within 15-25 mins from{" "}
              <Text style={{ fontWeight: "700" }}>
                {eligibleVendorsCount > 0 ? `${eligibleVendorsCount} nearby stores` : "partner stores"}
              </Text>
            </Text>
          </View>
        )}

        {/* Dynamically Memoized Category Content */}
        {!isOutsideDeliveryZone && categoryContent}
      </ScrollView>

      {/* Select Location Bottom Sheet Modal */}
      <SelectLocationModal
        visible={isLocationModalVisible}
        onClose={handleCloseLocationModal}
      />

      {/* Nearest Stores with Distance Modal */}
      <NearbyStoresModal
        visible={isNearbyStoresModalVisible}
        onClose={handleCloseNearbyStoresModal}
        customerLat={customerLat ?? undefined}
        customerLng={customerLng ?? undefined}
        customerAddress={displayLocation}
        onChangeLocation={handleOpenLocationModal}
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
  deliveryAvailableBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4EA",
    marginHorizontal: scale(16),
    marginTop: moderateScale(8),
    marginBottom: moderateScale(4),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
    gap: scale(8),
  },
  activeDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
  },
  deliveryAvailableText: {
    fontSize: moderateScale(11.5),
    color: "#065F46",
    fontWeight: "500",
  },
  outsideZoneBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    padding: scale(14),
    borderRadius: scale(12),
  },
  outsideZoneIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  outsideZoneTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#991B1B",
  },
  outsideZoneSub: {
    fontSize: moderateScale(11.5),
    color: "#7F1D1D",
    marginTop: moderateScale(3),
    lineHeight: moderateScale(16),
  },
  changeLocBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#DC2626",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
    gap: scale(6),
    marginTop: moderateScale(8),
  },
  changeLocBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11.5),
    fontWeight: "700",
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
