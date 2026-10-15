import { FloatingCartBar } from "@/components/cart";
import {
  BabyCategories,
  BeautyPersonalCare,
  CurvedPromoScroller,
  DealProduct,
  DealsOfTheDays,
  FastSales,
  FeaturedBrands,
  GiftingCategories,
  GroceryFlashSale,
  GroceryKitchen,
  Header,
  InstantFrozenFood,
  KidsWinterEssentials,
  NearbyStoresModal,
  NewArrivals,
  ProductCard,
  SchoolOfficeStationery,
  SelectLocationModal,
  SnacksDrinks,
  SubCategories,
  SweetTooth,
  TopDeals,
} from "@/components/home";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import socketService from "@/store/services/socketService";
import {
  fetchAddresses,
  setUserCoordinates,
} from "@/store/slices/addressSlice";
import {
  fetchPublicProducts,
  setSelectedCategory,
} from "@/store/slices/productSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_SIZE = 12;
const INITIAL_VISIBLE_SECTIONS = 3;
const SECTIONS_BATCH_SIZE = 2;

const normalizeDealProduct = (p: any): DealProduct => {
  const curPrice = Number(p.price) || 0;
  const origPrice =
    p.originalPrice && Number(p.originalPrice) > curPrice
      ? Number(p.originalPrice)
      : curPrice;
  const disc =
    origPrice > curPrice
      ? Math.round(((origPrice - curPrice) / origPrice) * 100)
      : p.discountValue || 0;
  const imgUrl =
    p.images && p.images.length > 0
      ? p.images[0].url
      : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80";

  return {
    id: String(p._id || p.id),
    name: p.name || "Product",
    weight: p.unit || "1 unit",
    category: p.category || "Grocery",
    subCategory: p.subCategory || "",
    rating: p.ratingsAverage || 4.5,
    reviewsCount: p.ratingsCount || 20,
    price: curPrice,
    originalPrice: origPrice,
    image: { uri: imgUrl },
    discountPct: disc,
    ordersCount: p.ordersCount || 10,
    tags: p.tags || [],
  };
};

export default function HomeScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const numColumns = isTablet ? 3 : 2;

  const gridCardWidth = useMemo(() => {
    const horizontalPadding = scale(16);
    const gridGap = scale(12);
    return Math.floor(
      (windowWidth - horizontalPadding * 2 - gridGap * (numColumns - 1)) / numColumns
    );
  }, [windowWidth, numColumns]);

  const dispatch = useAppDispatch();
  const { addToCart } = useCart();

  // Fine-grained selectors to prevent re-renders on unrelated slice updates
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const selectedCategory = useAppSelector(
    (state) => state.product?.selectedCategory || "all",
  );
  const activeDisplayLocation = useAppSelector(
    (state) => state.address?.activeDisplayLocation,
  );
  const customerLat = useAppSelector((state) => state.address?.latitude);
  const customerLng = useAppSelector((state) => state.address?.longitude);
  const isOutsideDeliveryZone = useAppSelector(
    (state) => state.product?.isOutsideDeliveryZone,
  );
  const eligibleVendorsCount = useAppSelector(
    (state) => state.product?.eligibleVendorsCount,
  );

  // Redux Pagination & Product Catalog Selectors
  const publicProducts = useAppSelector(
    (state) => state.product?.publicProducts || [],
  );
  const publicTotal = useAppSelector(
    (state) => state.product?.publicTotal || 0,
  );
  const publicLoading = useAppSelector((state) => state.product?.publicLoading);
  const publicLoadingMore = useAppSelector(
    (state) => state.product?.publicLoadingMore,
  );
  const publicHasMore = useAppSelector((state) => state.product?.publicHasMore);
  const publicCurrentPage = useAppSelector(
    (state) => state.product?.publicCurrentPage || 1,
  );

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isNearbyStoresModalVisible, setIsNearbyStoresModalVisible] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Progressive section-by-section component pagination
  const [visibleSectionsCount, setVisibleSectionsCount] = useState(INITIAL_VISIBLE_SECTIONS);
  const isSectionLoadingRef = useRef(false);
  const totalSectionsRef = useRef(0);

  // Reset visible component sections when active category changes
  useEffect(() => {
    setVisibleSectionsCount(INITIAL_VISIBLE_SECTIONS);
    isSectionLoadingRef.current = false;
  }, [selectedCategory]);

  // Concurrency guard to strictly prevent duplicate API requests
  const isFetchingMoreRef = useRef(false);

  // Sync ref with Redux loading state
  useEffect(() => {
    if (!publicLoadingMore) {
      isFetchingMoreRef.current = false;
    }
  }, [publicLoadingMore]);

  // ── Auto-Detect Live Device GPS on Startup ─────────────────────────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!isMounted) return;
          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            let readable = "Current Location";
            if (geocode && geocode.length > 0) {
              const g = geocode[0];
              const parts = [
                g.name,
                g.street,
                g.subregion || g.district,
                g.city,
              ].filter(Boolean);
              readable = parts.join(", ") || "Current Location";
            }
            dispatch(
              setUserCoordinates({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                addressLine: readable,
              }),
            );
          } catch {
            dispatch(
              setUserCoordinates({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              }),
            );
          }
        }
      } catch (err) {
        console.warn("[HomeScreen Auto GPS]", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // ── 1. Initial Load & Category/Location Change (Page 1) ─────────────
  useEffect(() => {
    isFetchingMoreRef.current = false;
    dispatch(
      fetchPublicProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        lat: customerLat || undefined,
        lng: customerLng || undefined,
        page: 1,
        limit: PAGE_SIZE,
      }),
    );
  }, [dispatch, selectedCategory, customerLat, customerLng]);

  // ── 2. Infinite Scroll: Fetch Next Batch of Records ──────────────────
  const handleLoadMore = useCallback(() => {
    if (
      isOutsideDeliveryZone ||
      publicLoading ||
      publicLoadingMore ||
      !publicHasMore ||
      isFetchingMoreRef.current
    ) {
      return;
    }

    isFetchingMoreRef.current = true;
    const nextPage = publicCurrentPage + 1;

    dispatch(
      fetchPublicProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        lat: customerLat || undefined,
        lng: customerLng || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      }),
    );
  }, [
    isOutsideDeliveryZone,
    publicLoading,
    publicLoadingMore,
    publicHasMore,
    publicCurrentPage,
    selectedCategory,
    customerLat,
    customerLng,
    dispatch,
  ]);

  // ── 3. Scroll Listener: Progressively Reveal Components Then Stream Products ─
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      // Trigger threshold: 220px before bottom for seamless progressive loading
      const threshold = 220;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - threshold;

      if (isCloseToBottom) {
        const total = totalSectionsRef.current;
        if (visibleSectionsCount < total) {
          if (!isSectionLoadingRef.current) {
            isSectionLoadingRef.current = true;
            setTimeout(() => {
              setVisibleSectionsCount((prev) =>
                Math.min(total, prev + SECTIONS_BATCH_SIZE),
              );
              isSectionLoadingRef.current = false;
            }, 100);
          }
        } else {
          handleLoadMore();
        }
      }
    },
    [visibleSectionsCount, handleLoadMore],
  );

  // ── 4. Pull to Refresh ───────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    isFetchingMoreRef.current = false;
    isSectionLoadingRef.current = false;
    setVisibleSectionsCount(INITIAL_VISIBLE_SECTIONS);
    await dispatch(
      fetchPublicProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        lat: customerLat || undefined,
        lng: customerLng || undefined,
        page: 1,
        limit: PAGE_SIZE,
      }),
    );
    setRefreshing(false);
  }, [dispatch, selectedCategory, customerLat, customerLng]);

  // ── Real-Time Socket Connection & Radius Change Listeners ──────────────
  useEffect(() => {
    socketService.connect(false).then(() => {
      if (customerLat && customerLng) {
        socketService.emitCustomerLocation(customerLat, customerLng);
      }
    });

    // When any vendor updates their delivery radius, refresh product availability from page 1
    const unsubRadius = socketService.onDeliveryRadiusUpdated(() => {
      isFetchingMoreRef.current = false;
      dispatch(
        fetchPublicProducts({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          lat: customerLat || undefined,
          lng: customerLng || undefined,
          page: 1,
          limit: PAGE_SIZE,
        }),
      );
    });

    // When any vendor opens or closes their store, refresh product availability from page 1
    const unsubAvail = socketService.onVendorAvailabilityChanged(() => {
      isFetchingMoreRef.current = false;
      dispatch(
        fetchPublicProducts({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          lat: customerLat || undefined,
          lng: customerLng || undefined,
          page: 1,
          limit: PAGE_SIZE,
        }),
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
    [activeDisplayLocation],
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      { backgroundColor: isDark ? "#080D0F" : theme.colors.background },
    ],
    [isDark, theme.colors.background],
  );

  // ── Memoized Navigation & Action Callbacks ──────────────────────────
  const handleSelectCategory = useCallback(
    (catId: string) => {
      dispatch(setSelectedCategory(catId));
    },
    [dispatch],
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
    [],
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
    [addToCart],
  );

  const handleNavigateCategoryExpand = useCallback(
    (params: { category: string; subCategory?: string; title?: string }) => {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params,
      });
    },
    [],
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
    [],
  );

  const handlePromoPress = useCallback((promo: any) => {
    console.log("Promo clicked:", promo.title);
  }, []);

  // ── Memoized Category-Specific Sections Array (for progressive pagination) ──
  const categorySections = useMemo((): React.ReactNode[] => {
    switch (selectedCategory) {
      case "all":
        return [
          <FastSales
            key="all-fast-sales"
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
          />,
          <DealsOfTheDays
            key="all-deals-of-the-days"
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
          />,
          <TopDeals
            key="all-top-deals-1"
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
          />,
          <CurvedPromoScroller key="all-curved-promo" onPromoPress={handlePromoPress} />,
          <GroceryKitchen
            key="all-grocery-kitchen"
            onItemPress={(item) => handleCategoryPress(item.name, item.id)}
          />,
          <GroceryFlashSale
            key="all-grocery-flash-sale"
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
          />,
          <NewArrivals
            key="all-new-arrivals"
            category={selectedCategory}
            onCategoryPress={(cat) =>
              handleCategoryPress(cat.title, cat.category)
            }
          />,
          <SnacksDrinks
            key="all-snacks-drinks"
            onItemPress={(item) => handleCategoryPress(item.name, item.id)}
          />,
          <SweetTooth
            key="all-sweet-tooth"
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
          />,
          <BeautyPersonalCare
            key="all-beauty-personal-care"
            onItemPress={(item) => handleCategoryPress(item.name, item.id)}
          />,
          <TopDeals
            key="all-top-deals-2"
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
          />,
          <SchoolOfficeStationery
            key="all-school-office-stationery"
            onItemPress={(item) => handleCategoryPress(item.name, item.id)}
          />,
          <KidsWinterEssentials
            key="all-kids-winter-essentials"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <InstantFrozenFood
            key="all-instant-frozen-food"
            onProductPress={handleProductPress}
            onAddPress={handleAddToCart}
            onSeeAllPress={() =>
              handleNavigateSeeAll({
                title: "Instant & Frozen Food",
                filter: "instant-frozen",
                minDiscount: "30",
              })
            }
          />,
          <SubCategories
            key="all-sub-categories"
            category="grocery"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
        ];

      case "grocery":
        return [
          <FeaturedBrands
            key="grocery-featured-brands"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <TopDeals
            key="grocery-top-deals-1"
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
          />,
          <CurvedPromoScroller key="grocery-curved-promo" onPromoPress={handlePromoPress} />,
          <SubCategories
            key="grocery-sub-categories"
            category="grocery"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
          <NewArrivals
            key="grocery-new-arrivals"
            category="grocery"
            onCategoryPress={(cat) =>
              handleCategoryPress(cat.title, cat.category)
            }
          />,
          <GroceryFlashSale
            key="grocery-flash-sale"
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
          />,
          <TopDeals
            key="grocery-top-deals-2"
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
          />,
        ];

      case "snacks":
        return [
          <FeaturedBrands
            key="snacks-featured-brands"
            category="snacks"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <TopDeals
            key="snacks-top-deals"
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
          />,
          <SubCategories
            key="snacks-sub-categories"
            category="snacks"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
          <SnacksDrinks
            key="snacks-drinks"
            onItemPress={(item) =>
              handleCategoryPress(item.name, item.subCategory)
            }
          />,
          <NewArrivals
            key="snacks-new-arrivals"
            category="snacks"
            onCategoryPress={(cat) =>
              handleCategoryPress(cat.title, cat.category)
            }
          />,
          <GroceryFlashSale
            key="snacks-flash-sale"
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
          />,
          <SweetTooth
            key="snacks-sweet-tooth"
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
          />,
        ];

      case "beauty":
        return [
          <FeaturedBrands
            key="beauty-featured-brands"
            category="beauty"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <TopDeals
            key="beauty-top-deals"
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
          />,
          <SubCategories
            key="beauty-sub-categories"
            category="beauty"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
          <BeautyPersonalCare
            key="beauty-personal-care"
            onItemPress={(item) => handleCategoryPress(item.name, item.id)}
          />,
          <NewArrivals
            key="beauty-new-arrivals"
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
          />,
          <GroceryFlashSale
            key="beauty-flash-sale"
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
          />,
        ];

      case "stationery":
        return [
          <FeaturedBrands
            key="stationery-featured-brands"
            category="stationery"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <SchoolOfficeStationery
            key="stationery-school-office"
            onItemPress={(item) =>
              handleCategoryPress(item.name, item.subCategory)
            }
          />,
          <TopDeals
            key="stationery-top-deals"
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
          />,
          <SubCategories
            key="stationery-sub-categories"
            category="stationery"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
          <NewArrivals
            key="stationery-new-arrivals"
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
          />,
          <GroceryFlashSale
            key="stationery-flash-sale"
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
          />,
        ];

      case "baby":
      case "kids":
        return [
          <FeaturedBrands
            key="baby-featured-brands"
            category="baby"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <BabyCategories
            key="baby-categories"
            onItemPress={(item) =>
              handleCategoryPress(item.name, item.subCategory)
            }
          />,
          <KidsWinterEssentials
            key="baby-kids-winter"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <TopDeals
            key="baby-top-deals"
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
          />,
          <SubCategories
            key="baby-sub-categories"
            category="baby"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
          <NewArrivals
            key="baby-new-arrivals"
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
          />,
          <GroceryFlashSale
            key="baby-flash-sale"
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
          />,
        ];

      case "gifting":
        return [
          <FeaturedBrands
            key="gifting-featured-brands"
            category="gifting"
            onItemPress={(item) =>
              handleCategoryPress(item.title, item.category)
            }
          />,
          <GiftingCategories
            key="gifting-categories"
            onItemPress={(item) =>
              handleCategoryPress(item.name, item.subCategory)
            }
          />,
          <TopDeals
            key="gifting-top-deals"
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
          />,
          <SubCategories
            key="gifting-sub-categories"
            category="gifting"
            onItemPress={(section, item) =>
              handleCategoryPress(item.title, item.id)
            }
          />,
          <NewArrivals
            key="gifting-new-arrivals"
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
          />,
          <GroceryFlashSale
            key="gifting-flash-sale"
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
          />,
          <CurvedPromoScroller key="gifting-curved-promo" onPromoPress={handlePromoPress} />,
          <SweetTooth
            key="gifting-sweet-tooth"
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
          />,
        ];

      default:
        return [];
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

  // Keep totalSectionsRef synchronized with current category sections count
  useEffect(() => {
    totalSectionsRef.current = categorySections.length;
  }, [categorySections.length]);

  const visibleSections = useMemo(
    () => categorySections.slice(0, visibleSectionsCount),
    [categorySections, visibleSectionsCount],
  );

  const hasMoreSections = visibleSectionsCount < categorySections.length;

  return (
    <View style={containerStyle}>
      <FloatingCartBar />

      {/* Scrollable Home Screen Body with Infinite Scrolling */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[isDark ? "#39D353" : "#008080"]}
            tintColor={isDark ? "#39D353" : "#008080"}
          />
        }
      >
        <StatusBar style={isDark ? "light" : "dark"} />

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
          <View
            style={[
              styles.outsideZoneBanner,
              isDark && {
                backgroundColor: "#151D24",
                borderColor: "#FF2028",
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={[
                styles.outsideZoneIconBox,
                isDark && { backgroundColor: "rgba(255, 32, 40, 0.15)" },
              ]}
            >
              <Feather
                name="map-pin"
                size={scale(20)}
                color={isDark ? "#FF2028" : "#DC2626"}
              />
            </View>
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text
                style={[
                  styles.outsideZoneTitle,
                  isDark && { color: "#FF2028" },
                ]}
              >
                Delivery Unavailable at this Location
              </Text>
              <Text
                style={[
                  styles.outsideZoneSub,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                None of our active partner stores currently deliver to this
                selected area.
              </Text>
              <TouchableOpacity
                style={[
                  styles.changeLocBtn,
                  isDark && { backgroundColor: "#FF2028" },
                ]}
                activeOpacity={0.7}
                onPress={handleOpenLocationModal}
              >
                <Feather name="navigation" size={scale(13)} color="#FFFFFF" />
                <Text style={styles.changeLocBtnText}>
                  Change Delivery Address
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.deliveryAvailableBadge,
              isDark && {
                backgroundColor: "#151D24",
                borderWidth: 1,
                borderColor: "#303B45",
              },
            ]}
          >
            <View
              style={[
                styles.activeDot,
                isDark && { backgroundColor: "#39D353" },
              ]}
            />
            <Text
              style={[
                styles.deliveryAvailableText,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              ⚡ Delivering within 15-25 mins from{" "}
              <Text
                style={{
                  fontWeight: "700",
                  color: isDark ? "#5BB74A" : "#065F46",
                }}
              >
                {eligibleVendorsCount > 0
                  ? `${eligibleVendorsCount} nearby stores`
                  : "partner stores"}
              </Text>
            </Text>
          </View>
        )}

        {/* ── Progressively Rendered Category Components ── */}
        {!isOutsideDeliveryZone && (
          <>
            {visibleSections.map((sectionNode) => sectionNode)}

            {/* Section Pagination Loader (shows when user reaches bottom of current sections) */}
            {hasMoreSections && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#39D353" : "#008080"}
                />
                <Text
                  style={[
                    styles.loadingMoreText,
                    isDark && { color: "#39D353" },
                  ]}
                >
                  Loading more recommendations...
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── Paginated Infinite Stream of Nearby Products ──────────── */}
        {!isOutsideDeliveryZone &&
          !hasMoreSections &&
          publicProducts.length > 0 && (
            <View style={styles.streamSection}>
              <View style={styles.streamHeader}>
                <View>
                  <Text
                    style={[
                      styles.streamTitle,
                      isDark && { color: "#F8FAFC" },
                    ]}
                  >
                    {selectedCategory === "all"
                      ? "All Products Near You"
                      : "More in this Category"}
                  </Text>
                  <Text
                    style={[
                      styles.streamSub,
                      isDark && { color: "#A8B2BE" },
                    ]}
                  >
                    Showing {publicProducts.length} of {publicTotal} products from
                    nearby stores
                  </Text>
                </View>
              </View>

              <View style={styles.streamGrid}>
                {publicProducts.map((prod, idx) => (
                  <ProductCard
                    key={prod._id || prod.id || idx}
                    product={normalizeDealProduct(prod)}
                    cardWidth={gridCardWidth}
                    onPress={handleProductPress}
                    onAddPress={handleAddToCart}
                  />
                ))}
              </View>
            </View>
          )}

        {/* Infinite Scroll Activity Indicator */}
        {!hasMoreSections && publicLoadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator
              size="small"
              color={isDark ? "#39D353" : "#008080"}
            />
            <Text
              style={[
                styles.loadingMoreText,
                isDark && { color: "#39D353" },
              ]}
            >
              Loading more products...
            </Text>
          </View>
        )}

        {/* End of List Confirmation Badge */}
        {!hasMoreSections &&
          !publicHasMore &&
          publicProducts.length > 0 &&
          !isOutsideDeliveryZone && (
            <View style={styles.endOfListContainer}>
              <View
                style={[
                  styles.endOfListLine,
                  isDark && { backgroundColor: "#303B45" },
                ]}
              />
              <Text
                style={[
                  styles.endOfListText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                ✓ You've viewed all available products from nearby stores
              </Text>
              <View
                style={[
                  styles.endOfListLine,
                  isDark && { backgroundColor: "#303B45" },
                ]}
              />
            </View>
          )}
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
  streamSection: {
    marginTop: moderateScale(18),
    paddingHorizontal: scale(16),
  },
  streamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  streamTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#0F172A",
  },
  streamSub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  streamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(12),
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(18),
    gap: scale(8),
  },
  loadingMoreText: {
    fontSize: moderateScale(12.5),
    color: "#008080",
    fontWeight: "600",
  },
  endOfListContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(20),
    paddingHorizontal: scale(20),
    gap: scale(10),
  },
  endOfListLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  endOfListText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
  },
});
