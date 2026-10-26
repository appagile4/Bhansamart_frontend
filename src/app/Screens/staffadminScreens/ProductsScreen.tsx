import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import AdminStoreFilterDropdown, {
  getStoreDisplayName,
} from "@/components/AdminStoreFilterDropdown";
import {
  fetchStaffAssignedVendorsApi,
  fetchVendorProductsAnalyticsApi,
} from "@/store/services/adminService";

const resolveProductImageUrl = (item: any): string => {
  if (!item) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80";
  const first = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  if (typeof first === "string" && first.trim()) return first.trim();
  if (first && typeof first === "object") {
    if (typeof first.url === "string" && first.url.trim()) return first.url.trim();
    if (typeof first.uri === "string" && first.uri.trim()) return first.uri.trim();
    if (typeof first.secure_url === "string" && first.secure_url.trim()) return first.secure_url.trim();
  }
  if (typeof item.imageUrl === "string" && item.imageUrl.trim()) return item.imageUrl.trim();
  if (typeof item.image === "string" && item.image.trim()) return item.image.trim();
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80";
};

export default function StaffAdminProductsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors) {
        setAssignedVendors(res.vendors);
      }
    } catch (e) {
      console.warn("[Products] Error loading vendors", e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetchVendorProductsAnalyticsApi({
        vendorId: selectedVendorId !== "all" ? selectedVendorId : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      if (res?.products || res?.data?.products) {
        setProducts(res.products || res.data.products);
      }
    } catch (e) {
      console.warn("[Products] Error loading products", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadProducts();
  }, [selectedVendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock || p.quantity || 0);
      if (stockFilter === "IN_STOCK" && stock <= 5) return false;
      if (stockFilter === "LOW_STOCK" && (stock <= 0 || stock > 5)) return false;
      if (stockFilter === "OUT_OF_STOCK" && stock > 0) return false;
      return true;
    });
  }, [products, stockFilter]);

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Assigned Catalog"
        subtitle={`${products.length} Products`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Store Filter */}
        <AdminStoreFilterDropdown
          vendors={assignedVendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(id) => setSelectedVendorId(id)}
          title="Assigned Store Scope"
        />

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
          <Feather name="search" size={scale(16)} color={textSecondary} />
          <TextInput
            placeholder="Search products by title..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadProducts}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                loadProducts();
              }}
            >
              <Ionicons name="close-circle" size={scale(16)} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stock Status Filter Pills */}
        <View style={styles.pillsRow}>
          {(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const).map((sf) => {
            const isSelected = stockFilter === sf;
            const label =
              sf === "ALL"
                ? "All"
                : sf === "IN_STOCK"
                ? "In Stock"
                : sf === "LOW_STOCK"
                ? "Low Stock (≤5)"
                : "Out of Stock";

            return (
              <TouchableOpacity
                key={sf}
                onPress={() => setStockFilter(sf)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? "#0284C7" : cardBg,
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading products...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              const stock = Number(item.stock || item.quantity || 0);
              const storeName =
                item.vendor?.businessDetails?.businessName ||
                item.vendorName ||
                "Assigned Store";

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedProduct(item)}
                  style={[styles.productCard, { backgroundColor: cardBg, borderColor: border }]}
                >
                  <Image
                    source={{
                      uri: resolveProductImageUrl(item),
                    }}
                    style={styles.productImg}
                    contentFit="cover"
                  />

                  <View style={styles.productInfo}>
                    <View style={styles.productTitleRow}>
                      <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={1}>
                        {item.name || item.title || "Product"}
                      </Text>
                    </View>

                    <Text style={[styles.storeNameText, { color: textSecondary }]} numberOfLines={1}>
                      Store: {storeName}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={[styles.priceText, { color: "#0284C7" }]}>
                        Rs. {Number(item.price || item.finalPrice || 0).toLocaleString()}
                      </Text>

                      <View
                        style={[
                          styles.stockBadge,
                          {
                            backgroundColor:
                              stock > 5
                                ? "#ECFDF5"
                                : stock > 0
                                ? "#FFFBEB"
                                : "#FEF2F2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stockText,
                            {
                              color:
                                stock > 5
                                  ? "#059669"
                                  : stock > 0
                                  ? "#D97706"
                                  : "#DC2626",
                            },
                          ]}
                        >
                          {stock > 0 ? `${stock} in stock` : "Out of stock"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="cube-off-outline" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Products</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No items matched your search and filter criteria.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          visible={!!selectedProduct}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedProduct(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]} numberOfLines={1}>
                  Product Inspection
                </Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{
                    uri: resolveProductImageUrl(selectedProduct),
                  }}
                  style={styles.modalImg}
                  contentFit="cover"
                />

                <Text style={[styles.modalProductName, { color: textPrimary }]}>
                  {selectedProduct.name || selectedProduct.title}
                </Text>

                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: textSecondary }]}>Store</Text>
                  <Text style={[styles.modalVal, { color: textPrimary }]}>
                    {selectedProduct.vendor?.businessDetails?.businessName ||
                      selectedProduct.vendorName ||
                      "Assigned Store"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: textSecondary }]}>Price</Text>
                  <Text style={[styles.modalVal, { color: "#0284C7" }]}>
                    Rs. {Number(selectedProduct.price || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: textSecondary }]}>Inventory Stock</Text>
                  <Text style={[styles.modalVal, { color: textPrimary }]}>
                    {selectedProduct.stock || selectedProduct.quantity || 0} units
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: textSecondary }]}>Units Sold</Text>
                  <Text style={[styles.modalVal, { color: textPrimary }]}>
                    {selectedProduct.salesCount || selectedProduct.unitsSold || 0} units
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: textSecondary }]}>Category</Text>
                  <Text style={[styles.modalVal, { color: textPrimary }]}>
                    {selectedProduct.category?.name || selectedProduct.category || "General"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Text style={styles.closeBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(10),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    gap: scale(8),
    marginVertical: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginBottom: moderateScale(12),
  },
  filterPill: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11),
  },
  listContent: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(12),
  },
  productImg: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(8),
  },
  productInfo: {
    flex: 1,
    gap: moderateScale(2),
  },
  productTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  storeNameText: {
    fontSize: moderateScale(11),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(4),
  },
  priceText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  stockBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
  },
  stockText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  emptyBox: {
    padding: scale(24),
    borderRadius: scale(14),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(16),
    maxHeight: "80%",
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
  },
  modalImg: {
    width: "100%",
    height: scale(160),
    borderRadius: scale(12),
    marginBottom: moderateScale(12),
  },
  modalProductName: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    marginBottom: moderateScale(12),
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalLabel: {
    fontSize: moderateScale(12),
  },
  modalVal: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: moderateScale(16),
    marginBottom: moderateScale(20),
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
