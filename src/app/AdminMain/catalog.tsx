import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  fetchAdminProducts,
  moderateAdminProduct,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function AdminCatalogScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<"categories" | "products">("categories");

  // Category State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [parentCatId, setParentCatId] = useState<string>("");
  const [catLevel, setCatLevel] = useState<number>(0);
  const [catActive, setCatActive] = useState<boolean>(true);

  // Products State
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null);

  const { categories, products, productsTotal, loading, actionLoading } = useAppSelector(
    (state) => state.admin
  );

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminProducts({ limit: 50 }));
  }, [dispatch]);

  const onRefresh = () => {
    if (activeTab === "categories") {
      dispatch(fetchAdminCategories());
    } else {
      dispatch(fetchAdminProducts({ search: productSearch.trim() || undefined, limit: 50 }));
    }
  };

  const handleOpenAddCategory = (parent?: any) => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDesc("");
    setCategorySlug("");
    if (parent) {
      setParentCatId(parent._id);
      setCatLevel(1);
    } else {
      setParentCatId("");
      setCatLevel(0);
    }
    setCatActive(true);
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCategoryName(cat.name || "");
    setCategoryDesc(cat.description || "");
    setCategorySlug(cat.slug || "");
    setParentCatId(cat.parentCategory?._id || cat.parentCategory || "");
    setCatLevel(cat.level || 0);
    setCatActive(cat.isActive !== false);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Validation Error", "Category name is required.");
      return;
    }
    const payload: any = {
      name: categoryName.trim(),
      description: categoryDesc.trim(),
      slug: categorySlug.trim() || undefined,
      level: catLevel,
      parentCategory: catLevel === 1 && parentCatId ? parentCatId : null,
      isActive: catActive,
    };

    try {
      if (editingCategory) {
        await dispatch(updateAdminCategory({ id: editingCategory._id, payload })).unwrap();
        Alert.alert("Success", "Category updated successfully!");
      } else {
        await dispatch(createAdminCategory(payload)).unwrap();
        Alert.alert("Success", "Category created successfully!");
      }
      setShowCategoryModal(false);
      dispatch(fetchAdminCategories());
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save category");
    }
  };

  const handleToggleProductStatus = async (product: any) => {
    const nextStatus = !product.isActive;
    Alert.alert(
      "Moderate Product",
      `Are you sure you want to ${nextStatus ? "ENABLE" : "DISABLE"} listing for "${product.title || product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await dispatch(
              moderateAdminProduct({
                id: product._id,
                payload: { isActive: nextStatus },
              })
            );
            dispatch(fetchAdminProducts({ search: productSearch.trim() || undefined, limit: 50 }));
          },
        },
      ]
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderCategoryItem = ({ item }: { item: any }) => {
    const subcategories = (categories.subs || []).filter(
      (s: any) => (s.parentCategory?._id || s.parentCategory) === item._id
    );

    return (
      <View style={[styles.catCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.catCardHeader}>
          <View style={styles.catInfoRow}>
            <View style={[styles.catIconWrap, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
              <MaterialCommunityIcons name="folder-outline" size={scale(20)} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.catTitleWrap}>
                <Text style={[styles.catName, { color: textPrimary }]}>{item.name}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: item.isActive !== false ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)" },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.isActive !== false ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {item.isActive !== false ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.catSlug, { color: textSecondary }]}>Slug: /{item.slug}</Text>
              {item.description ? (
                <Text style={[styles.catDesc, { color: textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.catActionButtons}>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: "#10B981" }]}
              onPress={() => handleOpenAddCategory(item)}
            >
              <Feather name="plus" size={scale(13)} color="#FFFFFF" />
              <Text style={styles.smallBtnText}>Subcat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]}
              onPress={() => handleOpenEditCategory(item)}
            >
              <Feather name="edit-2" size={scale(13)} color={isDark ? "#FFFFFF" : "#0F172A"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subcategories list */}
        {subcategories.length > 0 && (
          <View style={[styles.subsWrap, { borderTopColor: border }]}>
            <Text style={[styles.subsHeader, { color: textSecondary }]}>
              Subcategories ({subcategories.length})
            </Text>
            {subcategories.map((sub: any) => (
              <View key={sub._id} style={[styles.subItemRow, { backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subName, { color: textPrimary }]}>{sub.name}</Text>
                  <Text style={[styles.catSlug, { color: textSecondary }]}>/{sub.slug}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.editIconBtn, { borderColor: border }]}
                  onPress={() => handleOpenEditCategory(sub)}
                >
                  <Feather name="edit-3" size={scale(12)} color="#10B981" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderProductItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.prodCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.prodRow}>
          <View style={[styles.prodImgPlaceholder, { backgroundColor: isDark ? "#1E293B" : "#E2E8F0" }]}>
            <MaterialCommunityIcons name="cube-outline" size={scale(24)} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginLeft: scale(12) }}>
            <Text style={[styles.prodTitle, { color: textPrimary }]} numberOfLines={2}>
              {item.title || item.name}
            </Text>
            <Text style={[styles.vendorLabel, { color: textSecondary }]}>
              Store: {item.vendor?.storeName || item.storeName || "Unknown Vendor"}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>₹{item.price?.toLocaleString("en-IN")}</Text>
              {item.mrp ? (
                <Text style={[styles.mrpText, { color: textSecondary }]}>
                  ₹{item.mrp?.toLocaleString("en-IN")}
                </Text>
              ) : null}
              <Text style={[styles.stockBadge, { color: item.stock > 0 ? "#10B981" : "#EF4444" }]}>
                {item.stock > 0 ? `${item.stock} in stock` : "Out of Stock"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.prodFooter, { borderTopColor: border }]}>
          <View style={styles.statusWrap}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isActive !== false ? "#10B981" : "#EF4444" },
              ]}
            />
            <Text style={[styles.statusText, { color: item.isActive !== false ? "#10B981" : "#EF4444" }]}>
              {item.isActive !== false ? "Active Listing" : "Suspended / Hidden"}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionPill,
              { backgroundColor: item.isActive !== false ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)" },
            ]}
            onPress={() => handleToggleProductStatus(item)}
          >
            <Feather
              name={item.isActive !== false ? "slash" : "check"}
              size={scale(13)}
              color={item.isActive !== false ? "#EF4444" : "#10B981"}
            />
            <Text
              style={[
                styles.actionPillText,
                { color: item.isActive !== false ? "#EF4444" : "#10B981" },
              ]}
            >
              {item.isActive !== false ? "Deactivate" : "Approve Listing"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Catalog & Products" subtitle="Categories & Moderation" />
      {/* Top Segmented Bar */}
      <View style={[styles.segmentBar, { backgroundColor: cardBg, borderColor: border }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "categories" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("categories")}
        >
          <MaterialCommunityIcons
            name="shape-outline"
            size={scale(16)}
            color={activeTab === "categories" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "categories" ? "#10B981" : textSecondary },
            ]}
          >
            Categories & Subcategories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "products" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("products")}
        >
          <MaterialCommunityIcons
            name="cube-scan"
            size={scale(16)}
            color={activeTab === "products" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "products" ? "#10B981" : textSecondary },
            ]}
          >
            Product Moderation ({productsTotal})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {activeTab === "categories" ? (
        <View style={{ flex: 1 }}>
          <View style={styles.actionHeader}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Catalog Hierarchy ({categories.root?.length || 0} Root Categories)
            </Text>
            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={() => handleOpenAddCategory()}
            >
              <Feather name="plus-circle" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.addCategoryBtnText}>New Category</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories.root || []}
            keyExtractor={(item) => item._id}
            renderItem={renderCategoryItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="shape-outline" size={scale(48)} color="#64748B" />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>No categories configured yet.</Text>
                </View>
              ) : null
            }
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.productSearchWrap, { backgroundColor: cardBg, borderColor: border }]}>
            <Feather name="search" size={scale(16)} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search products by title or sku..."
              placeholderTextColor="#94A3B8"
              value={productSearch}
              onChangeText={setProductSearch}
              onSubmitEditing={() => dispatch(fetchAdminProducts({ search: productSearch.trim() || undefined, limit: 50 }))}
              returnKeyType="search"
            />
            {productSearch ? (
              <TouchableOpacity
                onPress={() => {
                  setProductSearch("");
                  dispatch(fetchAdminProducts({ limit: 50 }));
                }}
              >
                <Feather name="x" size={scale(16)} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={renderProductItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="package-variant" size={scale(48)} color="#64748B" />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>No products found.</Text>
                </View>
              ) : null
            }
          />
        </View>
      )}

      {/* Category Creation / Edit Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                {editingCategory ? "Edit Category" : catLevel === 1 ? "Add Subcategory" : "Create Root Category"}
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Category Name *</Text>
              <TextInput
                style={[styles.textInput, { color: textPrimary, borderColor: border }]}
                placeholder="e.g. Dairy & Bakery"
                placeholderTextColor="#94A3B8"
                value={categoryName}
                onChangeText={setCategoryName}
              />

              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Custom URL Slug (Optional)</Text>
              <TextInput
                style={[styles.textInput, { color: textPrimary, borderColor: border }]}
                placeholder="e.g. dairy-bakery"
                placeholderTextColor="#94A3B8"
                value={categorySlug}
                onChangeText={setCategorySlug}
              />

              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { color: textPrimary, borderColor: border }]}
                placeholder="Describe this category..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={categoryDesc}
                onChangeText={setCategoryDesc}
              />

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: textPrimary }]}>Is Active</Text>
                <Switch
                  value={catActive}
                  onValueChange={setCatActive}
                  trackColor={{ false: "#767577", true: "#10B981" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleSaveCategory}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(8),
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: scale(8),
  },
  segmentBtnActive: {
    borderBottomColor: "#10B981",
  },
  segmentText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: scale(14),
    paddingBottom: scale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  addCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#10B981",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  addCategoryBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  listContent: {
    padding: scale(16),
    gap: scale(12),
  },
  catCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  catCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  catInfoRow: {
    flexDirection: "row",
    gap: scale(10),
    flex: 1,
  },
  catIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  catTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flexWrap: "wrap",
  },
  catName: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  catSlug: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  catDesc: {
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },
  catActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(6),
  },
  smallBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  subsWrap: {
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: 1,
  },
  subsHeader: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: scale(6),
    letterSpacing: 0.5,
  },
  subItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(8),
    borderRadius: scale(6),
    marginBottom: scale(4),
  },
  subName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  editIconBtn: {
    padding: scale(4),
    borderRadius: scale(4),
    borderWidth: 1,
  },
  productSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  prodCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  prodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  prodImgPlaceholder: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  prodTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  vendorLabel: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(4),
  },
  priceText: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    color: "#10B981",
  },
  mrpText: {
    fontSize: moderateScale(12),
    textDecorationLine: "line-through",
  },
  stockBadge: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginLeft: "auto",
  },
  prodFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: 1,
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  statusDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(20),
  },
  actionPillText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(10),
  },
  emptyText: {
    fontSize: moderateScale(13),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: scale(18),
  },
  modalContent: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(18),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    fontSize: moderateScale(13),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    fontSize: moderateScale(13),
    height: scale(60),
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(14),
  },
  switchLabel: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#10B981",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: scale(20),
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
});
