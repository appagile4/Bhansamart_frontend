import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchVendorProducts,
  toggleProductStock,
  updateProduct,
} from "@/store/slices/productSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StockFilterType = "all" | "low_stock" | "out_of_stock" | "in_stock";

interface StockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  inStock: boolean;
  stockCount: number;
  reorderLevel: number;
  sku?: string;
  image?: string;
}

// ── Memoized Product Stock Card ───────────────────────────────────────
const StockItemCard = memo(function StockItemCard({
  item,
  onQuickAdjust,
  onToggleStock,
  onOpenEditModal,
  loadingActionId,
}: {
  item: StockProduct;
  onQuickAdjust: (id: string, delta: number) => void;
  onToggleStock: (id: string) => void;
  onOpenEditModal: (item: StockProduct) => void;
  loadingActionId: string | null;
}) {
  const isUpdating = loadingActionId === item.id;
  const isOutOfStock = item.stockCount <= 0 || !item.inStock;
  const isLowStock =
    !isOutOfStock && item.stockCount <= (item.reorderLevel || 5);

  const statusBadge = useMemo(() => {
    if (isOutOfStock) {
      return {
        label: "Out of Stock",
        bg: "#FEF2F2",
        text: "#DC2626",
        border: "#FECACA",
        icon: "alert-circle" as const,
      };
    }
    if (isLowStock) {
      return {
        label: `Low Stock (${item.stockCount} left)`,
        bg: "#FFFBEB",
        text: "#D97706",
        border: "#FDE68A",
        icon: "alert-triangle" as const,
      };
    }
    return {
      label: `In Stock (${item.stockCount})`,
      bg: "#F0FDF4",
      text: "#16A34A",
      border: "#BBF7D0",
      icon: "check-circle" as const,
    };
  }, [isOutOfStock, isLowStock, item.stockCount]);

  return (
    <View style={styles.card}>
      <View style={styles.cardMainRow}>
        {/* Thumbnail */}
        <View style={styles.imageBox}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <MaterialCommunityIcons
              name="package-variant"
              size={scale(28)}
              color="#94A3B8"
            />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.categoryText}>
            {item.category} {item.unit ? `\u2022 ${item.unit}` : ""}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>NPR {item.price}</Text>
            {item.sku ? (
              <Text style={styles.skuText}>SKU: {item.sku}</Text>
            ) : null}
          </View>
        </View>

        {/* Active Toggle Switch */}
        <View style={styles.switchCol}>
          <Text
            style={[
              styles.switchLabel,
              { color: item.inStock ? "#15803D" : "#94A3B8" },
            ]}
          >
            {item.inStock ? "Active" : "Disabled"}
          </Text>
          <Switch
            value={item.inStock}
            onValueChange={() => onToggleStock(item.id)}
            trackColor={{ false: "#E2E8F0", true: "#86C4CB" }}
            thumbColor={item.inStock ? "#016073" : "#FFFFFF"}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Stock Controls & Badge Row */}
      <View style={styles.cardBottomRow}>
        {/* Status Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onOpenEditModal(item)}
          style={[
            styles.statusPill,
            { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
          ]}
        >
          <Feather
            name={statusBadge.icon}
            size={scale(12)}
            color={statusBadge.text}
          />
          <Text style={[styles.statusPillText, { color: statusBadge.text }]}>
            {statusBadge.label}
          </Text>
        </TouchableOpacity>

        {/* Quick Stock Adjust Buttons */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[
              styles.stepBtn,
              (item.stockCount <= 0 || isUpdating) && styles.stepBtnDisabled,
            ]}
            onPress={() => onQuickAdjust(item.id, -1)}
            disabled={item.stockCount <= 0 || isUpdating}
          >
            <Feather
              name="minus"
              size={scale(14)}
              color={item.stockCount <= 0 ? "#CBD5E1" : "#016073"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stockCountBox}
            activeOpacity={0.7}
            onPress={() => onOpenEditModal(item)}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#016073" />
            ) : (
              <Text style={styles.stockCountText}>{item.stockCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepBtn, isUpdating && styles.stepBtnDisabled]}
            onPress={() => onQuickAdjust(item.id, 1)}
            disabled={isUpdating}
          >
            <Feather name="plus" size={scale(14)} color="#016073" />
          </TouchableOpacity>

          {/* Quick Edit Icon */}
          <TouchableOpacity
            style={styles.editIconBtn}
            activeOpacity={0.7}
            onPress={() => onOpenEditModal(item)}
          >
            <Feather name="edit-2" size={scale(13)} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default function VendorStocksScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { filter } = useLocalSearchParams<{ filter?: string }>();

  const { products: reduxProducts, loading } = useAppSelector(
    (state) => state.product,
  );

  const [activeTab, setActiveTab] = useState<StockFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Edit Stock Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<StockProduct | null>(null);
  const [newStockVal, setNewStockVal] = useState("");
  const [newReorderLevel, setNewReorderLevel] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  // Synchronize incoming route param with activeTab
  useEffect(() => {
    if (filter) {
      const lower = filter.toLowerCase().trim();
      if (lower === "low_stock") {
        setActiveTab("low_stock");
      } else if (lower === "out_of_stock") {
        setActiveTab("out_of_stock");
      } else if (lower === "in_stock") {
        setActiveTab("in_stock");
      } else {
        setActiveTab("all");
      }
    }
  }, [filter]);

  // Fetch Vendor Products on mount
  useEffect(() => {
    dispatch(fetchVendorProducts());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    await dispatch(fetchVendorProducts());
  }, [dispatch]);

  // Normalize products
  const products: StockProduct[] = useMemo(() => {
    if (reduxProducts && reduxProducts.length > 0) {
      return reduxProducts.map((p: any) => ({
        id: p._id || p.id || "",
        name: p.name || "Untitled Product",
        category: p.category || "General",
        price: Number(p.price) || 0,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        unit: p.unit || "1 unit",
        inStock: p.inStock !== false,
        stockCount: typeof p.stock === "number" ? p.stock : 0,
        reorderLevel: typeof p.reorderLevel === "number" ? p.reorderLevel : 5,
        sku: p.sku || "",
        image: p.images?.[0]?.url || "",
      }));
    }
    return [];
  }, [reduxProducts]);

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const isOut = p.stockCount <= 0 || !p.inStock;
      const isLow = !isOut && p.stockCount <= (p.reorderLevel || 5);

      if (isOut) {
        outOfStock++;
      } else if (isLow) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isOut = p.stockCount <= 0 || !p.inStock;
      const isLow = !isOut && p.stockCount <= (p.reorderLevel || 5);

      // 1. Tab Filter
      if (activeTab === "low_stock" && !isLow) return false;
      if (activeTab === "out_of_stock" && !isOut) return false;
      if (activeTab === "in_stock" && (isOut || isLow)) return false;

      // 2. Category Filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        return matchesName || matchesCategory || matchesSku;
      }

      return true;
    });
  }, [products, activeTab, selectedCategory, searchQuery]);

  // Quick Delta Adjustment (-1 or +1)
  const handleQuickAdjust = useCallback(
    async (id: string, delta: number) => {
      const target = products.find((p) => p.id === id);
      if (!target) return;

      const updatedCount = Math.max(0, target.stockCount + delta);
      try {
        setLoadingActionId(id);
        await dispatch(
          updateProduct({
            id,
            data: {
              stock: updatedCount,
              inStock: updatedCount > 0,
            },
          }),
        ).unwrap();
      } catch (err: any) {
        Alert.alert("Update Failed", err || "Could not adjust stock level.");
      } finally {
        setLoadingActionId(null);
      }
    },
    [products, dispatch],
  );

  // Toggle inStock Active
  const handleToggleStock = useCallback(
    async (id: string) => {
      try {
        setLoadingActionId(id);
        await dispatch(toggleProductStock(id)).unwrap();
      } catch (err: any) {
        Alert.alert("Update Failed", err || "Could not toggle stock state.");
      } finally {
        setLoadingActionId(null);
      }
    },
    [dispatch],
  );

  // Open Direct Edit Modal
  const handleOpenEditModal = useCallback((item: StockProduct) => {
    setEditingItem(item);
    setNewStockVal(String(item.stockCount));
    setNewReorderLevel(String(item.reorderLevel || 5));
    setModalVisible(true);
  }, []);

  // Save Modal Stock Update
  const handleSaveModalStock = async () => {
    if (!editingItem) return;

    const parsedStock = parseInt(newStockVal.trim(), 10);
    const parsedReorder = parseInt(newReorderLevel.trim(), 10);

    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert("Invalid Stock", "Please enter a valid stock number \u2265 0.");
      return;
    }

    try {
      setModalSaving(true);
      await dispatch(
        updateProduct({
          id: editingItem.id,
          data: {
            stock: parsedStock,
            reorderLevel: isNaN(parsedReorder) ? 5 : parsedReorder,
            inStock: parsedStock > 0,
          },
        }),
      ).unwrap();

      setModalVisible(false);
      Alert.alert(
        "Stock Updated",
        `Inventory for "${editingItem.name}" updated to ${parsedStock} units.`,
      );
    } catch (err: any) {
      Alert.alert("Save Failed", err || "Failed to update product stock.");
    } finally {
      setModalSaving(false);
    }
  };

  const keyExtractor = useCallback((item: StockProduct) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: StockProduct }) => (
      <StockItemCard
        item={item}
        onQuickAdjust={handleQuickAdjust}
        onToggleStock={handleToggleStock}
        onOpenEditModal={handleOpenEditModal}
        loadingActionId={loadingActionId}
      />
    ),
    [handleQuickAdjust, handleToggleStock, handleOpenEditModal, loadingActionId],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Screen Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Go Back"
          >
            <Feather name="arrow-left" size={scale(20)} color="#016073" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Stock & Inventory Overview</Text>
            <Text style={styles.headerSub}>
              Track real-time inventory and reorder alerts
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/Screens/vendorScreens/addProduct" as any)}
          style={styles.addBtn}
        >
          <Feather name="plus" size={scale(16)} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Summary Cards */}
      <View style={styles.kpiContainer}>
        {/* Total Tracked */}
        <TouchableOpacity
          style={[styles.kpiCard, activeTab === "all" && styles.kpiCardActive]}
          activeOpacity={0.7}
          onPress={() => setActiveTab("all")}
        >
          <Text style={styles.kpiVal}>{metrics.total}</Text>
          <Text style={styles.kpiLabel}>Total Items</Text>
        </TouchableOpacity>

        {/* Healthy Stock */}
        <TouchableOpacity
          style={[styles.kpiCard, activeTab === "in_stock" && styles.kpiCardActive]}
          activeOpacity={0.7}
          onPress={() => setActiveTab("in_stock")}
        >
          <Text style={[styles.kpiVal, { color: "#16A34A" }]}>
            {metrics.inStock}
          </Text>
          <Text style={styles.kpiLabel}>In Stock</Text>
        </TouchableOpacity>

        {/* Low Stock Alerts */}
        <TouchableOpacity
          style={[
            styles.kpiCard,
            activeTab === "low_stock" && styles.kpiCardActive,
            metrics.lowStock > 0 && { borderColor: "#F59E0B" },
          ]}
          activeOpacity={0.7}
          onPress={() => setActiveTab("low_stock")}
        >
          <Text style={[styles.kpiVal, { color: "#D97706" }]}>
            {metrics.lowStock}
          </Text>
          <Text style={styles.kpiLabel}>Low Stock</Text>
        </TouchableOpacity>

        {/* Out of Stock */}
        <TouchableOpacity
          style={[
            styles.kpiCard,
            activeTab === "out_of_stock" && styles.kpiCardActive,
            metrics.outOfStock > 0 && { borderColor: "#EF4444" },
          ]}
          activeOpacity={0.7}
          onPress={() => setActiveTab("out_of_stock")}
        >
          <Text style={[styles.kpiVal, { color: "#DC2626" }]}>
            {metrics.outOfStock}
          </Text>
          <Text style={styles.kpiLabel}>Out of Stock</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          placeholder="Search by product name, SKU, or category..."
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

      {/* Category Pills Scroller */}
      {categoriesList.length > 2 && (
        <View style={styles.categoriesRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categoriesList}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoryPillsList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Product Stock List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={scale(56)}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Stock Items Found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "low_stock"
                ? "No products are currently running low on stock."
                : activeTab === "out_of_stock"
                ? "All products currently have stock available."
                : "No products matched your search or category filter."}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/Screens/vendorScreens/addProduct" as any)
              }
            >
              <Feather name="plus-circle" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Add New Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Direct Stock Level Adjustment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Adjust Stock Level</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={scale(20)} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {editingItem && (
                  <>
                    <View style={styles.modalProductInfo}>
                      <Text style={styles.modalProductName} numberOfLines={2}>
                        {editingItem.name}
                      </Text>
                      <Text style={styles.modalProductSub}>
                        {editingItem.category} &middot; NPR {editingItem.price} /{" "}
                        {editingItem.unit}
                      </Text>
                    </View>

                    {/* Quick Restock Preset Chips */}
                    <Text style={styles.modalSectionLabel}>
                      Quick Restock Chips
                    </Text>
                    <View style={styles.presetChipsRow}>
                      {[5, 10, 25, 50, 100].map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={styles.presetChip}
                          onPress={() => {
                            const cur = parseInt(newStockVal, 10) || 0;
                            setNewStockVal(String(cur + amt));
                          }}
                        >
                          <Text style={styles.presetChipText}>+{amt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Exact Stock Input */}
                    <Text style={styles.modalInputLabel}>Total Units in Stock</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={newStockVal}
                      onChangeText={setNewStockVal}
                      placeholder="e.g. 50"
                    />

                    {/* Reorder Alert Level */}
                    <Text style={styles.modalInputLabel}>
                      Low Stock Alert Threshold
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={newReorderLevel}
                      onChangeText={setNewReorderLevel}
                      placeholder="e.g. 5"
                    />

                    {/* Save Button */}
                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      activeOpacity={0.8}
                      onPress={handleSaveModalStock}
                      disabled={modalSaving}
                    >
                      {modalSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="check" size={scale(16)} color="#FFFFFF" />
                          <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#016073",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(8),
  },
  addBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  kpiContainer: {
    flexDirection: "row",
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(12),
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(6),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  kpiCardActive: {
    borderColor: "#016073",
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
  },
  kpiVal: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  kpiLabel: {
    fontSize: moderateScale(10),
    color: "#64748B",
    fontWeight: "600",
    marginTop: scale(2),
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(16),
    marginTop: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? moderateScale(10) : moderateScale(6),
    borderRadius: scale(10),
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
    marginTop: moderateScale(10),
  },
  categoryPillsList: {
    paddingHorizontal: scale(16),
    gap: scale(6),
  },
  categoryChip: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5.5),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  categoryChipText: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: scale(12),
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  imageBox: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  infoCol: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: scale(18),
  },
  categoryText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(3),
  },
  priceText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#016073",
  },
  skuText: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
  },
  switchCol: {
    alignItems: "center",
  },
  switchLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    marginBottom: scale(2),
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  stepBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BCE1E6",
  },
  stepBtnDisabled: {
    opacity: 0.4,
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  stockCountBox: {
    minWidth: scale(36),
    height: scale(28),
    paddingHorizontal: scale(6),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stockCountText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
  },
  editIconBtn: {
    width: scale(28),
    height: scale(28),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: scale(4),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(40),
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#334155",
    marginTop: scale(4),
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: scale(24),
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
    marginTop: scale(12),
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(20),
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  modalProductInfo: {
    backgroundColor: "#F8FAFC",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: moderateScale(12),
  },
  modalProductName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  modalProductSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  modalSectionLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#64748B",
    marginBottom: moderateScale(6),
  },
  presetChipsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: moderateScale(14),
  },
  presetChip: {
    flex: 1,
    paddingVertical: moderateScale(6),
    backgroundColor: "#E6F4F6",
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BCE1E6",
  },
  presetChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#016073",
  },
  modalInputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#334155",
    marginBottom: scale(4),
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(14),
    color: "#0F172A",
    marginBottom: moderateScale(12),
  },
  modalSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    paddingVertical: moderateScale(12),
    borderRadius: scale(8),
    marginTop: scale(6),
  },
  modalSaveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
});
