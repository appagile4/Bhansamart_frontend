import VendorHeader from "@/components/VendorComponent/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchVendorProducts,
  toggleProductStock,
} from "@/store/slices/productSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface VendorProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  inStock: boolean;
  stockCount: number;
  image?: string;
}

import { CATEGORY_NAMES } from "@/constants/categories";

const SAMPLE_PRODUCTS: VendorProduct[] = [
  {
    id: "1",
    name: "Basmati Rice Super Fine",
    category: "Grocery & Kitchen",
    price: 1850,
    originalPrice: 2000,
    unit: "25 kg Bag",
    inStock: true,
    stockCount: 45,
  },
  {
    id: "2",
    name: "Mustard Oil Pure Kachi Ghani",
    category: "Grocery & Kitchen",
    price: 280,
    originalPrice: 310,
    unit: "1 Litre Bottle",
    inStock: true,
    stockCount: 120,
  },
  {
    id: "3",
    name: "Potato Chips & Classic Salted",
    category: "Snacks & Drinks",
    price: 60,
    originalPrice: 70,
    unit: "150 g Pack",
    inStock: true,
    stockCount: 80,
  },
  {
    id: "4",
    name: "Herbal Green Tea & Fresh Mint",
    category: "Snacks & Drinks",
    price: 250,
    originalPrice: 280,
    unit: "100 g Box",
    inStock: true,
    stockCount: 35,
  },
  {
    id: "5",
    name: "Moisturizing Body Wash & Soap",
    category: "Beauty & Personal Care",
    price: 320,
    originalPrice: 350,
    unit: "250 ml Bottle",
    inStock: true,
    stockCount: 40,
  },
  {
    id: "6",
    name: "School Notebooks & Pen Set",
    category: "School, Office & Stationery",
    price: 180,
    originalPrice: 200,
    unit: "Pack of 5",
    inStock: true,
    stockCount: 60,
  },
];

const CATEGORIES = ["All", ...CATEGORY_NAMES];

type SortOption = "default" | "price_asc" | "price_desc" | "alpha";

interface SortItem {
  id: SortOption;
  label: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FLOATING_BTN_WIDTH = scale(115);
const FLOATING_BTN_HEIGHT = scale(48);

const SORT_OPTIONS: SortItem[] = [
  { id: "default", label: "Default" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "alpha", label: "Alphabetic Order" },
];

export default function VendorProductScreen() {
  const dispatch = useAppDispatch();
  const { products: reduxProducts, loading: reduxLoading } = useAppSelector(
    (state) => state.product,
  );

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Vendor Products on mount
  useEffect(() => {
    dispatch(fetchVendorProducts());
  }, [dispatch]);

  // Merge Redux Products with sample fallback
  const products: VendorProduct[] = useMemo(() => {
    if (reduxProducts && reduxProducts.length > 0) {
      return reduxProducts.map((p) => ({
        id: p._id || p.id || "",
        name: p.name,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        unit: p.unit || "1 kg",
        inStock: p.inStock,
        stockCount: p.stock || 0,
        image: p.images?.[0]?.url || "",
      }));
    }
    return SAMPLE_PRODUCTS;
  }, [reduxProducts]);

  // Draggable Floating "Add +" Button
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - FLOATING_BTN_WIDTH - scale(8),
      y: SCREEN_HEIGHT - FLOATING_BTN_HEIGHT - scale(170),
    }),
  ).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: () => {
          // @ts-ignore
          pan.setOffset({ x: pan.x._value, y: pan.y._value });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          pan.flattenOffset();
          // If tap without moving, navigate to add product
          if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
            router.push("/Screens/vendorScreens/addProduct" as any);
          } else {
            // Bounds clamping (expanded right-side area)
            // @ts-ignore
            const curX = pan.x._value;
            // @ts-ignore
            const curY = pan.y._value;

            const minX = scale(4);
            const maxX = SCREEN_WIDTH - FLOATING_BTN_WIDTH + scale(4); // Extended right side area
            const minY = scale(60);
            const maxY = SCREEN_HEIGHT - FLOATING_BTN_HEIGHT - scale(90);

            const targetX = Math.min(Math.max(curX, minX), maxX);
            const targetY = Math.min(Math.max(curY, minY), maxY);

            Animated.spring(pan, {
              toValue: { x: targetX, y: targetY },
              useNativeDriver: false,
              friction: 6,
              tension: 40,
            }).start();
          }
        },
      }),
    [pan],
  );

  // View Mode: Grid vs List
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Sort State & Dropdown
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter Modal State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStockStatus, setFilterStockStatus] = useState<
    "all" | "in_stock" | "out_of_stock"
  >("all");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchVendorProducts());
    setRefreshing(false);
  };

  const toggleStock = (id: string) => {
    dispatch(toggleProductStock(id));
  };

  // Count active filters applied
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterStockStatus !== "all") count++;
    if (filterMinPrice.trim() || filterMaxPrice.trim()) count++;
    if (filterCategory !== "All") count++;
    return count;
  }, [filterStockStatus, filterMinPrice, filterMaxPrice, filterCategory]);

  const handleResetFilters = () => {
    setFilterStockStatus("all");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setFilterCategory("All");
  };

  // Processed and Filtered + Sorted Products List
  const processedProducts = useMemo(() => {
    let result = [...products];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    // 2. Horizontal category chip filter
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 3. Modal Category Filter
    if (filterCategory !== "All") {
      result = result.filter((p) => p.category === filterCategory);
    }

    // 4. Stock Status Filter
    if (filterStockStatus === "in_stock") {
      result = result.filter((p) => p.inStock);
    } else if (filterStockStatus === "out_of_stock") {
      result = result.filter((p) => !p.inStock);
    }

    // 5. Price Range Filter
    const minP = parseFloat(filterMinPrice);
    const maxP = parseFloat(filterMaxPrice);
    if (!isNaN(minP)) {
      result = result.filter((p) => p.price >= minP);
    }
    if (!isNaN(maxP)) {
      result = result.filter((p) => p.price <= maxP);
    }

    // 6. Sorting
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "alpha":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "default":
      default:
        // natural default
        break;
    }

    return result;
  }, [
    products,
    searchQuery,
    selectedCategory,
    filterCategory,
    filterStockStatus,
    filterMinPrice,
    filterMaxPrice,
    sortBy,
  ]);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === sortBy)?.label || "Default";

  // Handle Product Card Press
  const handleProductPress = (item: VendorProduct) => {
    router.push({
      pathname: "/Screens/vendorScreens/productdetail" as any,
      params: { id: item.id },
    });
  };

  // List View Card
  const renderListItem = ({ item }: { item: VendorProduct }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => handleProductPress(item)}
      style={styles.productCardList}
    >
      <View style={styles.productTopRow}>
        <View style={styles.productIconBox}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.cardImage}
              contentFit="cover"
            />
          ) : (
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={scale(24)}
              color="#016073"
            />
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>
            {item.category} &middot; {item.unit}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>NPR {item.price}</Text>
            {item.originalPrice ? (
              <Text style={styles.strikePrice}>NPR {item.originalPrice}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.productBottomRow}>
        <View style={styles.stockStatusWrap}>
          <View
            style={[
              styles.stockDot,
              { backgroundColor: item.inStock ? "#16A34A" : "#DC2626" },
            ]}
          />
          <Text
            style={[
              styles.stockStatusText,
              { color: item.inStock ? "#15803D" : "#991B1B" },
            ]}
          >
            {item.inStock ? `In Stock (${item.stockCount})` : "Out of Stock"}
          </Text>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Available</Text>
          <Switch
            value={item.inStock}
            onValueChange={() => toggleStock(item.id)}
            trackColor={{ false: "#E2E8F0", true: "#016073" }}
            thumbColor={item.inStock ? "#F1F5F9" : "#F1F5F9"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Grid View Card
  const renderGridItem = ({ item }: { item: VendorProduct }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => handleProductPress(item)}
      style={styles.productCardGrid}
    >
      <View style={styles.gridIconBox}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.gridCardImage}
            contentFit="cover"
          />
        ) : (
          <MaterialCommunityIcons
            name="food-apple-outline"
            size={scale(32)}
            color="#016073"
          />
        )}
        <View
          style={[
            styles.gridStockBadge,
            { backgroundColor: item.inStock ? "#DCFCE7" : "#FEE2E2" },
          ]}
        >
          <Text
            style={[
              styles.gridStockBadgeText,
              { color: item.inStock ? "#15803D" : "#991B1B" },
            ]}
          >
            {item.inStock ? `${item.stockCount}` : "Out"}
          </Text>
        </View>
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.gridUnit} numberOfLines={1}>
          {item.unit}
        </Text>

        <View style={styles.gridPriceRow}>
          <Text style={styles.gridPrice}>NPR {item.price}</Text>
          {item.originalPrice ? (
            <Text style={styles.gridStrikePrice}>NPR {item.originalPrice}</Text>
          ) : null}
        </View>

        <View style={styles.gridSwitchRow}>
          <Text
            style={[
              styles.gridAvailabilityText,
              { color: item.inStock ? "#15803D" : "#94A3B8" },
            ]}
          >
            {item.inStock ? "Active" : "Disabled"}
          </Text>
          <Switch
            value={item.inStock}
            onValueChange={() => toggleStock(item.id)}
            trackColor={{ false: "#E2E8F0", true: "#016073" }}
            thumbColor={item.inStock ? "#86C4CB" : "#F1F5F9"}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Unified Vendor Header */}
      <VendorHeader activeRoute="/VendorMain/product" />

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          placeholder="Search products, category, or SKU..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips Carousel */}
      <View style={styles.categoriesRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c}
          contentContainerStyle={{
            gap: scale(8),
            paddingHorizontal: scale(16),
          }}
          renderItem={({ item: cat }) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                style={[styles.catChip, isSelected && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.catChipText,
                    isSelected && styles.catChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* CONTROLS BAR: Sort Dropdown, Filter Button & Grid/List Toggle */}
      <View style={styles.controlsBar}>
        {/* Left: Sort By Dropdown Trigger */}
        <View style={{ position: "relative", zIndex: 100 }}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowSortDropdown((prev) => !prev)}
            style={[
              styles.sortDropdownTrigger,
              showSortDropdown && styles.sortDropdownTriggerActive,
            ]}
          >
            <Text style={styles.sortPrefixText}>
              Sort By:{" "}
              <Text style={styles.sortCurrentText}>{currentSortLabel}</Text>
            </Text>
            <Feather
              name="chevron-down"
              size={scale(15)}
              color="#475569"
              style={{
                transform: [{ rotate: showSortDropdown ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {/* Inline Sort Dropdown Menu matching uploaded image */}
          {showSortDropdown && (
            <View style={styles.sortDropdownMenu}>
              {SORT_OPTIONS.map((opt, idx) => {
                const isSelected = sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSortBy(opt.id);
                      setShowSortDropdown(false);
                    }}
                    style={[
                      styles.sortOptionItem,
                      idx !== SORT_OPTIONS.length - 1 &&
                        styles.sortOptionDivider,
                      isSelected && styles.sortOptionItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        isSelected && styles.sortOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={scale(15)}
                        color="#016073"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Right: Filter Button & View Mode (Grid / List) Toggle */}
        <View style={styles.rightControls}>
          {/* Filter Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowFilterModal(true)}
            style={[
              styles.filterBtn,
              activeFiltersCount > 0 && styles.filterBtnActive,
            ]}
          >
            <Feather
              name="sliders"
              size={scale(14)}
              color={activeFiltersCount > 0 ? "#016073" : "#475569"}
            />
            <Text
              style={[
                styles.filterBtnText,
                activeFiltersCount > 0 && styles.filterBtnTextActive,
              ]}
            >
              Filter
            </Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Grid / List Switcher */}
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode("list")}
              style={[
                styles.viewToggleBtn,
                viewMode === "list" && styles.viewToggleBtnActive,
              ]}
              accessibilityLabel="List View"
            >
              <Feather
                name="list"
                size={scale(16)}
                color={viewMode === "list" ? "#016073" : "#94A3B8"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode("grid")}
              style={[
                styles.viewToggleBtn,
                viewMode === "grid" && styles.viewToggleBtnActive,
              ]}
              accessibilityLabel="Grid View"
            >
              <Feather
                name="grid"
                size={scale(15)}
                color={viewMode === "grid" ? "#016073" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Backdrop to close sort dropdown when clicking outside */}
      {showSortDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowSortDropdown(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Products List (Dynamic Grid or List based on viewMode) */}
      <FlatList
        key={viewMode === "grid" ? "grid-mode" : "list-mode"}
        numColumns={viewMode === "grid" ? 2 : 1}
        data={processedProducts}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        contentContainerStyle={[
          styles.listContent,
          viewMode === "grid" && { paddingHorizontal: scale(10) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant"
              size={scale(48)}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query, sort, or active filters.
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                onPress={handleResetFilters}
                style={styles.clearFilterBtn}
              >
                <Text style={styles.clearFilterBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* FILTER MODAL */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Feather name="sliders" size={scale(18)} color="#016073" />
                <Text style={styles.modalTitle}>Filter Products</Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              {/* 1. Availability / Stock Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Stock Availability
                </Text>
                <View style={styles.chipsRowWrap}>
                  {[
                    { id: "all", label: "All Items" },
                    { id: "in_stock", label: "In Stock Only" },
                    { id: "out_of_stock", label: "Out of Stock" },
                  ].map((st) => {
                    const isSelected = filterStockStatus === st.id;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        onPress={() => setFilterStockStatus(st.id as any)}
                        style={[
                          styles.modalChip,
                          isSelected && styles.modalChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            isSelected && styles.modalChipTextActive,
                          ]}
                        >
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range (NPR)</Text>
                <View style={styles.priceInputsRow}>
                  <View style={styles.priceInputBox}>
                    <Text style={styles.priceInputPrefix}>Min</Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={filterMinPrice}
                      onChangeText={setFilterMinPrice}
                      style={styles.priceTextInput}
                    />
                  </View>

                  <Text style={styles.priceDash}>–</Text>

                  <View style={styles.priceInputBox}>
                    <Text style={styles.priceInputPrefix}>Max</Text>
                    <TextInput
                      placeholder="5000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={filterMaxPrice}
                      onChangeText={setFilterMaxPrice}
                      style={styles.priceTextInput}
                    />
                  </View>
                </View>

                {/* Quick Price Range Chips */}
                <View style={[styles.chipsRowWrap, { marginTop: scale(8) }]}>
                  {[
                    { label: "Under 500", min: "", max: "500" },
                    { label: "500 – 1500", min: "500", max: "1500" },
                    { label: "Above 1500", min: "1500", max: "" },
                  ].map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setFilterMinPrice(p.min);
                        setFilterMaxPrice(p.max);
                      }}
                      style={styles.quickPriceChip}
                    >
                      <Text style={styles.quickPriceChipText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <View style={styles.chipsRowWrap}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = filterCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setFilterCategory(cat)}
                        style={[
                          styles.modalChip,
                          isSelected && styles.modalChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            isSelected && styles.modalChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleResetFilters}
                style={styles.modalResetBtn}
              >
                <Text style={styles.modalResetBtnText}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalApplyBtn}
              >
                <Text style={styles.modalApplyBtnText}>
                  Show {processedProducts.length} Results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Draggable Floating "Add +" Button */}
      <Animated.View
        style={[
          styles.floatingAddBtnContainer,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.floatingAddBtn}>
          <View style={styles.floatingAddIconWrap}>
            <Feather name="plus" size={scale(17)} color="#016073" />
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#016073",
  },
  headerSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(2),
  },
  addProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#016073",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(8),
    gap: scale(4),
  },
  addProductBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    paddingHorizontal: scale(12),
    height: moderateScale(40),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  categoriesRow: {
    paddingVertical: moderateScale(10),
  },
  catChip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5.5),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catChipActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  catChipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#64748B",
  },
  catChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* CONTROLS BAR */
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(10),
    zIndex: 90,
  },
  sortDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6.5),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(6),
  },
  sortDropdownTriggerActive: {
    borderColor: "#016073",
    backgroundColor: "#F8FAFC",
  },
  sortPrefixText: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "500",
  },
  sortCurrentText: {
    fontWeight: "700",
    color: "#016073",
  },
  sortDropdownMenu: {
    position: "absolute",
    top: moderateScale(38),
    left: 0,
    width: scale(185),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  sortOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(10),
  },
  sortOptionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sortOptionItemSelected: {
    backgroundColor: "#F0F9FA",
  },
  sortOptionText: {
    fontSize: moderateScale(12.5),
    color: "#334155",
    fontWeight: "500",
  },
  sortOptionTextSelected: {
    color: "#016073",
    fontWeight: "700",
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6.5),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(5),
  },
  filterBtnActive: {
    borderColor: "#016073",
    backgroundColor: "#E6F4F6",
  },
  filterBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#475569",
  },
  filterBtnTextActive: {
    color: "#016073",
    fontWeight: "700",
  },
  filterBadge: {
    backgroundColor: "#016073",
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  viewToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: scale(2),
  },
  viewToggleBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleBtnActive: {
    backgroundColor: "#E6F4F6",
  },

  /* LIST VIEW CARD */
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  productCardList: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: scale(14),
    gap: moderateScale(10),
  },
  productTopRow: {
    flexDirection: "row",
    gap: scale(12),
    alignItems: "center",
  },
  productIconBox: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(8),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(8),
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  productCategory: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(3),
  },
  priceText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#016073",
  },
  strikePrice: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  productBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: moderateScale(8),
  },
  stockStatusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  stockDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  stockStatusText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  switchLabel: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "600",
  },

  /* GRID VIEW CARD */
  gridRow: {
    justifyContent: "space-between",
    paddingHorizontal: scale(6),
  },
  productCardGrid: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    margin: scale(5),
    overflow: "hidden",
  },
  gridIconBox: {
    width: "100%",
    height: scale(95),
    backgroundColor: "#F0F9FA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  gridCardImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(10),
  },
  gridStockBadge: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  gridStockBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  gridContent: {
    padding: scale(10),
  },
  gridTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
    height: moderateScale(34),
  },
  gridUnit: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  gridPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(6),
  },
  gridPrice: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#016073",
  },
  gridStrikePrice: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  gridSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: moderateScale(8),
    paddingTop: moderateScale(4),
  },
  gridAvailabilityText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#64748B",
    marginTop: moderateScale(10),
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textAlign: "center",
    marginTop: scale(4),
    paddingHorizontal: scale(20),
  },
  clearFilterBtn: {
    marginTop: moderateScale(14),
    backgroundColor: "#016073",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(7),
    borderRadius: scale(8),
  },
  clearFilterBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* FILTER MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  filterModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: "82%",
    paddingBottom: moderateScale(20),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#016073",
  },
  modalCloseBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    paddingHorizontal: scale(18),
    paddingVertical: moderateScale(14),
    gap: moderateScale(16),
  },
  filterSection: {
    gap: moderateScale(8),
  },
  filterSectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  chipsRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  modalChip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6.5),
    borderRadius: scale(20),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalChipActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  modalChipText: {
    fontSize: moderateScale(12),
    color: "#475569",
    fontWeight: "600",
  },
  modalChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  priceInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  priceInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: moderateScale(40),
  },
  priceInputPrefix: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "600",
    marginRight: scale(6),
  },
  priceTextInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    fontWeight: "700",
  },
  priceDash: {
    fontSize: moderateScale(16),
    color: "#94A3B8",
    fontWeight: "700",
  },
  quickPriceChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
  },
  quickPriceChipText: {
    fontSize: moderateScale(11),
    color: "#475569",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: scale(12),
  },
  modalResetBtn: {
    paddingHorizontal: scale(16),
    height: moderateScale(44),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  modalResetBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#475569",
  },
  modalApplyBtn: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: scale(8),
    backgroundColor: "#016073",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#016073",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  modalApplyBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  floatingAddBtnContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 12,
  },
  floatingAddBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#016073",
    padding: scale(6),
    borderRadius: scale(35),
    gap: scale(6),
    shadowColor: "#016073",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  floatingAddIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(35),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  floatingAddBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
