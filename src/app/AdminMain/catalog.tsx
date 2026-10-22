import { ALL_CATEGORY_SECTIONS } from "@/app/customerMain/category";
import AdminHeader from "@/components/AdminHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import api from "@/store/services/api";
import {
  createAdminCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  moderateAdminProduct,
  updateAdminCategory,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AdminCatalogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<"categories" | "products">(
    "categories",
  );

  // Category State
  const [catSearch, setCatSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [parentCatId, setParentCatId] = useState<string>("");
  const [catLevel, setCatLevel] = useState<number>(0);
  const [catActive, setCatActive] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Products Pagination State
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState<number>(1);
  const [loadingMoreProducts, setLoadingMoreProducts] =
    useState<boolean>(false);
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(
    null,
  );

  const { categories, products, productsTotal, loading, actionLoading } =
    useAppSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminProducts({ page: 1, limit: 15 }));
  }, [dispatch]);

  const onRefresh = () => {
    if (activeTab === "categories") {
      dispatch(fetchAdminCategories());
    } else {
      setProductPage(1);
      dispatch(
        fetchAdminProducts({
          page: 1,
          limit: 15,
          search: productSearch.trim() || undefined,
        }),
      );
    }
  };

  const handleLoadMoreProducts = async () => {
    if (loadingMoreProducts || loading) return;
    if (products.length >= productsTotal && productsTotal > 0) return;

    const nextPage = productPage + 1;
    setLoadingMoreProducts(true);
    try {
      await dispatch(
        fetchAdminProducts({
          page: nextPage,
          limit: 15,
          search: productSearch.trim() || undefined,
        }),
      ).unwrap();
      setProductPage(nextPage);
    } catch (err) {
      console.error("Failed to load more products", err);
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleOpenAddCategory = (parent?: any) => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDesc("");
    setCategorySlug("");
    setCategoryImage("");
    if (parent) {
      setParentCatId(parent._id || parent.id || "");
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
    setCategorySlug(cat.slug || cat.id || "");
    setCategoryImage(cat.image || cat.imageUrl || "");
    setParentCatId(cat.parentCategory?._id || cat.parentCategory || "");
    setCatLevel(cat.level || (cat.parentCategory ? 1 : 0));
    setCatActive(cat.isActive !== false);
    setShowCategoryModal(true);
  };

  const handlePickImageFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to select a category image.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingImage(true);

      const filename = asset.uri.split("/").pop() || `cat_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : "jpg";
      const mimeType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";

      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as any);

      const res = await api.post("/admin/categories/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setCategoryImage(uploadedUrl);
        Alert.alert(
          "Cloudinary Upload Success",
          "Image uploaded to Cloudinary! The URL is now stored and ready to save.",
        );
      } else {
        throw new Error("No URL returned from Cloudinary upload");
      }
    } catch (err: any) {
      console.error("[Category Upload Error]", err);
      Alert.alert(
        "Upload Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to upload image to Cloudinary.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveCategory = async () => {
    const name = categoryName.trim();
    const slug = categorySlug.trim();
    const desc = categoryDesc.trim();
    const image = categoryImage.trim();

    if (!name) {
      Alert.alert(
        "Missing Required Field",
        "Category Name is required. Please fill this field.",
      );
      return;
    }
    if (!slug) {
      Alert.alert(
        "Missing Required Field",
        "Category Slug is required. Please fill this field.",
      );
      return;
    }
    if (!desc) {
      Alert.alert(
        "Missing Required Field",
        "Category Description is required. Please fill this field.",
      );
      return;
    }
    if (!image) {
      Alert.alert(
        "Missing Required Field",
        "Category Image URL is required. Please fill this field.",
      );
      return;
    }
    if (catLevel === 1 && !parentCatId) {
      Alert.alert(
        "Missing Required Field",
        "Parent Category is required for a subcategory.",
      );
      return;
    }

    const payload: any = {
      name,
      description: desc,
      slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      image,
      level: catLevel,
      parentCategory: catLevel === 1 && parentCatId ? parentCatId : null,
      isActive: catActive,
    };

    try {
      if (editingCategory) {
        const targetId =
          editingCategory._id || editingCategory.id || editingCategory.slug;
        await dispatch(updateAdminCategory({ id: targetId, payload })).unwrap();
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

  const handleToggleCategoryActive = (cat: any) => {
    const currentActive = cat.isActive !== false;
    const nextActive = !currentActive;
    const catName = cat.name || cat.title || "Category";

    Alert.alert(
      `${nextActive ? "Activate" : "Deactivate"} Category`,
      `Are you sure you want to ${nextActive ? "ACTIVATE" : "DEACTIVATE"} "${catName}"? ${
        !nextActive && (cat.level === 0 || !cat.parentCategory)
          ? "Its subcategories will also be hidden from customer app."
          : ""
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: nextActive ? "Activate" : "Deactivate",
          style: nextActive ? "default" : "destructive",
          onPress: async () => {
            try {
              const targetId = cat._id || cat.id || cat.slug;
              await dispatch(
                updateAdminCategory({
                  id: targetId,
                  payload: { isActive: nextActive },
                }),
              ).unwrap();
              Alert.alert(
                "Success",
                `"${catName}" is now ${nextActive ? "Active" : "Deactivated"}.`,
              );
              dispatch(fetchAdminCategories());
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Failed to update category status",
              );
            }
          },
        },
      ],
    );
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
              }),
            );
            dispatch(
              fetchAdminProducts({
                page: 1,
                limit: Math.max(15, productPage * 15),
                search: productSearch.trim() || undefined,
              }),
            );
          },
        },
      ],
    );
  };

  // Combine CustomerMain categories and subcategories with Database categories
  const unifiedCategories = useMemo(() => {
    const list: any[] = ALL_CATEGORY_SECTIONS.map((sec) => {
      // Find matching DB root category if exists
      const dbRoot = (categories.root || []).find(
        (c: any) =>
          c.slug === sec.id || c.name.toLowerCase() === sec.title.toLowerCase(),
      );

      // Subcategories from CustomerMain
      const customerSubs = sec.items.map((it) => {
        const cleanName = it.name.replace(/\n/g, " ");
        const dbSub = (categories.subs || []).find(
          (s: any) =>
            s.slug === it.id ||
            s.name.toLowerCase() === cleanName.toLowerCase(),
        );

        return {
          _id: dbSub?._id || `cust-sub-${it.id}`,
          id: it.id,
          name: cleanName,
          slug: dbSub?.slug || `${sec.id}/${it.id}`,
          imageUrl: it.imageUrl,
          parentCategory: dbRoot?._id || sec.id,
          level: 1,
          isActive: dbSub ? dbSub.isActive !== false : true,
          isCustomerCategory: true,
        };
      });

      // Extra custom DB subcategories under this parent
      if (dbRoot) {
        const extraDbSubs = (categories.subs || []).filter((s: any) => {
          const parentId = s.parentCategory?._id || s.parentCategory;
          if (parentId !== dbRoot._id) return false;
          return !customerSubs.some(
            (cs) =>
              cs.name.toLowerCase() === s.name.toLowerCase() ||
              cs.slug === s.slug,
          );
        });
        extraDbSubs.forEach((s: any) => {
          customerSubs.push({
            ...s,
            isCustomerCategory: false,
          });
        });
      }

      return {
        _id: dbRoot?._id || `cust-root-${sec.id}`,
        id: sec.id,
        name: sec.title,
        slug: dbRoot?.slug || sec.id,
        description: dbRoot?.description || "Customer Category",
        imageUrl: sec.items[0]?.imageUrl || "",
        level: 0,
        subcategories: customerSubs,
        isActive: dbRoot ? dbRoot.isActive !== false : true,
        isCustomerCategory: true,
      };
    });

    // Add any extra custom DB root categories
    (categories.root || []).forEach((dbCat: any) => {
      const alreadyIncluded = list.some(
        (c) =>
          c.slug === dbCat.slug ||
          c.name.toLowerCase() === dbCat.name.toLowerCase(),
      );
      if (!alreadyIncluded) {
        const dbSubs = (categories.subs || []).filter(
          (s: any) => (s.parentCategory?._id || s.parentCategory) === dbCat._id,
        );
        list.push({
          ...dbCat,
          subcategories: dbSubs,
          isCustomerCategory: false,
        });
      }
    });

    // Filter by search query if any
    const query = catSearch.trim().toLowerCase();
    if (!query) return list;

    return list
      .map((cat) => {
        const rootMatches =
          cat.name.toLowerCase().includes(query) ||
          cat.slug.toLowerCase().includes(query);
        if (rootMatches) return cat;

        const matchingSubs = (cat.subcategories || []).filter(
          (sub: any) =>
            sub.name.toLowerCase().includes(query) ||
            (sub.slug && sub.slug.toLowerCase().includes(query)),
        );

        if (matchingSubs.length > 0) {
          return {
            ...cat,
            subcategories: matchingSubs,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [categories, catSearch]);

  const totalSubcategoriesCount = useMemo(() => {
    return unifiedCategories.reduce(
      (acc, c) => acc + (c.subcategories?.length || 0),
      0,
    );
  }, [unifiedCategories]);

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const [allExpanded, setAllExpanded] = useState(true);

  const toggleAllCollapse = () => {
    if (allExpanded) {
      // Collapse all
      const collapsed: Record<string, boolean> = {};
      unifiedCategories.forEach((c) => {
        collapsed[c.id || c._id] = true;
      });
      setCollapsedCategories(collapsed);
      setAllExpanded(false);
    } else {
      // Expand all
      setCollapsedCategories({});
      setAllExpanded(true);
    }
  };

  const renderCategorySection = ({ item }: { item: any }) => {
    const isCollapsed = !!collapsedCategories[item.id || item._id];
    const subList = item.subcategories || [];
    const isCatActive = item.isActive !== false;

    return (
      <View
        style={[
          styles.catCard,
          {
            backgroundColor: cardBg,
            borderColor: isCatActive ? border : isDark ? "#451A1A" : "#FEE2E2",
            opacity: isCatActive ? 1 : 0.92,
          },
        ]}
      >
        {/* Top Header Row (Clickable to collapse/expand) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleCategoryCollapse(item.id || item._id)}
          style={styles.catHeaderTouchable}
        >
          <View style={styles.catIdentityRow}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.catThumbImage}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.catIconWrap,
                  {
                    backgroundColor: isCatActive
                      ? isDark
                        ? "#064E3B"
                        : "#ECFDF5"
                      : isDark
                        ? "#3F1D1D"
                        : "#FEF2F2",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={scale(22)}
                  color={isCatActive ? "#10B981" : "#EF4444"}
                />
              </View>
            )}

            <View style={styles.catTextWrap}>
              <View style={styles.catTitleRow}>
                <Text
                  style={[
                    styles.catName,
                    {
                      color: textPrimary,
                      textDecorationLine: isCatActive ? "none" : "line-through",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>

              <View style={styles.catMetaRow}>
                <View
                  style={[
                    styles.slugPill,
                    { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                  ]}
                >
                  <Text style={[styles.slugPillText, { color: textSecondary }]}>
                    /{item.slug}
                  </Text>
                </View>
                <View
                  style={[
                    styles.subCountChip,
                    { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                  ]}
                >
                  <Feather
                    name="layers"
                    size={scale(10)}
                    color={textSecondary}
                  />
                  <Text style={[styles.subCountText, { color: textSecondary }]}>
                    {subList.length} subcategories
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Chevron & Status Indicator */}
          <View style={styles.headerRightWrap}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isCatActive
                    ? isDark
                      ? "rgba(16, 185, 129, 0.15)"
                      : "#ECFDF5"
                    : isDark
                      ? "rgba(239, 68, 68, 0.15)"
                      : "#FEF2F2",
                  borderColor: isCatActive ? "#10B981" : "#EF4444",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isCatActive ? "#10B981" : "#EF4444" },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: isCatActive ? "#10B981" : "#EF4444" },
                ]}
              >
                {isCatActive ? "Active" : "Inactive"}
              </Text>
            </View>

            <View
              style={[
                styles.chevronBubble,
                { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
              ]}
            >
              <Feather
                name={isCollapsed ? "chevron-down" : "chevron-up"}
                size={scale(15)}
                color={textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Toolbar Row (Separate from header, no touch conflict) */}
        <View style={[styles.catActionBar, { borderTopColor: border }]}>
          {/* Quick Active / Deactivate Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.actionButtonPill,
              {
                backgroundColor: isCatActive
                  ? isDark
                    ? "rgba(239, 68, 68, 0.1)"
                    : "#FEF2F2"
                  : isDark
                    ? "rgba(16, 185, 129, 0.1)"
                    : "#ECFDF5",
                borderColor: isCatActive ? "#FCA5A5" : "#6EE7B7",
              },
            ]}
            onPress={() => handleToggleCategoryActive(item)}
          >
            <Feather
              name={isCatActive ? "slash" : "check"}
              size={scale(12)}
              color={isCatActive ? "#EF4444" : "#10B981"}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: isCatActive ? "#EF4444" : "#10B981" },
              ]}
            >
              {isCatActive ? "Deactivate" : "Activate"}
            </Text>
          </TouchableOpacity>

          {/* Edit Category Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.actionButtonPill,
              {
                backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                borderColor: border,
              },
            ]}
            onPress={() => handleOpenEditCategory(item)}
          >
            <Feather name="edit-2" size={scale(12)} color={textPrimary} />
            <Text style={[styles.actionButtonText, { color: textPrimary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          {/* Add Subcategory Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.actionButtonPill,
              { backgroundColor: "#10B981", borderColor: "#10B981" },
            ]}
            onPress={() => handleOpenAddCategory(item)}
          >
            <Feather name="plus" size={scale(12)} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
              + Subcategory
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subcategories list when not collapsed */}
        {!isCollapsed && (
          <View style={[styles.subsWrap, { borderTopColor: border }]}>
            <View style={styles.subsHeaderRow}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scale(6),
                }}
              >
                <MaterialCommunityIcons
                  name="subdirectory-arrow-right"
                  size={scale(16)}
                  color="#10B981"
                />
                <Text style={[styles.subsHeader, { color: textPrimary }]}>
                  Customer Subcategories
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isDark ? "#1E293B" : "#E2E8F0" },
                  ]}
                >
                  <Text
                    style={[styles.countBadgeText, { color: textSecondary }]}
                  >
                    {subList.length}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenAddCategory(item)}
                style={styles.addSubQuickBtn}
              >
                <Feather name="plus" size={scale(12)} color="#10B981" />
                <Text style={styles.addSubQuickText}>New</Text>
              </TouchableOpacity>
            </View>

            {subList.length === 0 ? (
              <View
                style={[
                  styles.emptySubsBox,
                  {
                    backgroundColor: isDark ? "#10161C" : "#F8FAFC",
                    borderColor: border,
                  },
                ]}
              >
                <Feather name="inbox" size={scale(20)} color={textSecondary} />
                <Text style={[styles.emptySubsText, { color: textSecondary }]}>
                  No subcategories under {item.name}.
                </Text>
              </View>
            ) : (
              <View style={styles.subGrid}>
                {subList.map((sub: any, idx: number) => {
                  const isSubActive = sub.isActive !== false;
                  return (
                    <View
                      key={sub._id || sub.id || idx}
                      style={[
                        styles.subCard,
                        {
                          backgroundColor: isDark ? "#10161C" : "#F8FAFC",
                          borderColor: isSubActive
                            ? border
                            : isDark
                              ? "#451A1A"
                              : "#FEE2E2",
                          opacity: isSubActive ? 1 : 0.88,
                        },
                      ]}
                    >
                      {/* Left: Thumbnail */}
                      <View style={styles.subThumbWrap}>
                        {sub.imageUrl ? (
                          <Image
                            source={{ uri: sub.imageUrl }}
                            style={styles.subThumbImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.subPlaceholderBox,
                              {
                                backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="folder-outline"
                              size={scale(18)}
                              color="#94A3B8"
                            />
                          </View>
                        )}
                      </View>

                      {/* Center: Info */}
                      <View style={styles.subInfoWrap}>
                        <Text
                          style={[
                            styles.subName,
                            {
                              color: textPrimary,
                              textDecorationLine: isSubActive
                                ? "none"
                                : "line-through",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {sub.name}
                        </Text>
                        <View style={styles.subSlugRow}>
                          <Text
                            style={[
                              styles.subSlugText,
                              { color: textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            /{sub.slug || sub.id}
                          </Text>
                        </View>
                      </View>

                      {/* Right: Actions */}
                      <View style={styles.subActionsWrap}>
                        {/* Status Toggle Button */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={[
                            styles.subStatusBtn,
                            {
                              backgroundColor: isSubActive
                                ? isDark
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : "#ECFDF5"
                                : isDark
                                  ? "rgba(239, 68, 68, 0.12)"
                                  : "#FEF2F2",
                              borderColor: isSubActive ? "#10B981" : "#EF4444",
                            },
                          ]}
                          onPress={() => handleToggleCategoryActive(sub)}
                        >
                          <View
                            style={[
                              styles.miniDot,
                              {
                                backgroundColor: isSubActive
                                  ? "#10B981"
                                  : "#EF4444",
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.subStatusBtnText,
                              { color: isSubActive ? "#10B981" : "#EF4444" },
                            ]}
                          >
                            {isSubActive ? "Active" : "Inactive"}
                          </Text>
                        </TouchableOpacity>

                        {/* Edit Button */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={[
                            styles.subEditBtn,
                            {
                              borderColor: border,
                              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                            },
                          ]}
                          onPress={() => handleOpenEditCategory(sub)}
                        >
                          <Feather
                            name="edit-2"
                            size={scale(12)}
                            color={textPrimary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const isProdActive =
      item.isActive !== false && item.status !== "Not Active";

    // Extract product image
    const productImg =
      (Array.isArray(item.images) && item.images.length > 0
        ? typeof item.images[0] === "string"
          ? item.images[0]
          : item.images[0]?.url
        : null) ||
      item.image ||
      item.imageUrl ||
      null;

    const vendorName =
      item.vendor?.businessDetails?.businessName ||
      item.vendor?.storeName ||
      item.vendor?.name ||
      item.storeName ||
      item.supplierName ||
      "Direct Store";

    const purchases =
      item.ordersCount ?? item.purchaseCount ?? item.salesCount ?? 0;

    return (
      <View
        style={[
          styles.prodCard,
          {
            backgroundColor: cardBg,
            borderColor: isProdActive ? border : isDark ? "#451A1A" : "#FEE2E2",
            opacity: isProdActive ? 1 : 0.9,
          },
        ]}
      >
        {/* Main Product Info (Tappable to view full details screen) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            router.push({
              pathname: "/Screens/adminScreens/adminproductdetails" as any,
              params: {
                id: item._id,
                productData: JSON.stringify(item),
              },
            });
          }}
          style={styles.prodRowTouchable}
        >
          {/* Left: Product Thumbnail */}
          <View style={styles.prodImgContainer}>
            {productImg ? (
              <Image
                source={{ uri: productImg }}
                style={styles.prodThumbImg}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.prodImgPlaceholder,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <MaterialCommunityIcons
                  name="cube-outline"
                  size={scale(26)}
                  color="#10B981"
                />
              </View>
            )}
            {productImg?.includes("cloudinary.com") && (
              <View style={styles.cloudinaryMiniTag}>
                <Feather name="cloud" size={scale(8)} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Right: Info */}
          <View style={styles.prodInfoCol}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={[styles.prodTitle, { color: textPrimary }]}
                numberOfLines={2}
              >
                {item.name || item.title}
              </Text>
              <Feather
                name="chevron-right"
                size={scale(16)}
                color={textSecondary}
                style={{ marginTop: scale(2) }}
              />
            </View>

            {/* Vendor Name */}
            <View style={styles.vendorRow}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(13)}
                color="#0284C7"
              />
              <Text
                style={[styles.vendorLabel, { color: textSecondary }]}
                numberOfLines={1}
              >
                {vendorName}
              </Text>
            </View>

            {/* Price, MRP, & Purchase Count */}
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>
                ₹{item.price?.toLocaleString("en-IN")}
              </Text>
              {item.originalPrice && item.originalPrice > item.price ? (
                <Text style={[styles.mrpText, { color: textSecondary }]}>
                  ₹{item.originalPrice?.toLocaleString("en-IN")}
                </Text>
              ) : item.mrp ? (
                <Text style={[styles.mrpText, { color: textSecondary }]}>
                  ₹{item.mrp?.toLocaleString("en-IN")}
                </Text>
              ) : null}

              {/* Number of Purchases Badge */}
              <View
                style={[
                  styles.purchaseBadge,
                  { backgroundColor: isDark ? "#064E3B30" : "#ECFDF5" },
                ]}
              >
                <MaterialCommunityIcons
                  name="shopping-outline"
                  size={scale(11)}
                  color="#10B981"
                />
                <Text style={styles.purchaseBadgeText}>{purchases} Sold</Text>
              </View>
            </View>

            {/* Category Tag & Stock Status */}
            <View style={styles.stockCategoryRow}>
              <View
                style={[
                  styles.catTag,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <Text
                  style={[styles.catTagText, { color: textSecondary }]}
                  numberOfLines={1}
                >
                  {item.category || "General"}
                </Text>
              </View>

              <Text
                style={[
                  styles.stockBadge,
                  { color: item.stock > 0 ? "#10B981" : "#EF4444" },
                ]}
              >
                {item.stock > 0 ? `${item.stock} in stock` : "Out of Stock"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Footer with Status & Moderation Action */}
        <View style={[styles.prodFooter, { borderTopColor: border }]}>
          <View style={styles.statusWrap}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isProdActive ? "#10B981" : "#EF4444" },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isProdActive ? "#10B981" : "#EF4444" },
              ]}
            >
              {isProdActive ? "Active Listing" : "Suspended / Hidden"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.actionPill,
              {
                backgroundColor: isProdActive
                  ? isDark
                    ? "rgba(239, 68, 68, 0.12)"
                    : "#FEF2F2"
                  : isDark
                    ? "rgba(16, 185, 129, 0.12)"
                    : "#ECFDF5",
                borderColor: isProdActive ? "#EF4444" : "#10B981",
                borderWidth: 1,
              },
            ]}
            onPress={() => handleToggleProductStatus(item)}
          >
            <Feather
              name={isProdActive ? "slash" : "check"}
              size={scale(12)}
              color={isProdActive ? "#EF4444" : "#10B981"}
            />
            <Text
              style={[
                styles.actionPillText,
                { color: isProdActive ? "#EF4444" : "#10B981" },
              ]}
            >
              {isProdActive ? "Suspend" : "Approve Listing"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader
        title="Catalog & Products"
        subtitle="Categories & Moderation"
      />
      {/* Top Segmented Bar */}
      <View style={styles.segmentContainer}>
        <View
          style={[
            styles.segmentTrack,
            {
              backgroundColor: isDark ? "#111827" : "#E2E8F0",
              borderColor: border,
            },
          ]}
        >
          {/* Categories Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentItem,
              activeTab === "categories" && [
                styles.segmentItemActive,
                {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  shadowColor: isDark ? "#000000" : "#64748B",
                },
              ],
            ]}
            onPress={() => setActiveTab("categories")}
          >
            <View
              style={[
                styles.segmentIconWrap,
                activeTab === "categories"
                  ? { backgroundColor: "rgba(16, 185, 129, 0.15)" }
                  : { backgroundColor: "transparent" },
              ]}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={scale(16)}
                color={activeTab === "categories" ? "#10B981" : textSecondary}
              />
            </View>
            <Text
              style={[
                styles.segmentLabel,
                {
                  color:
                    activeTab === "categories" ? textPrimary : textSecondary,
                  fontWeight: activeTab === "categories" ? "800" : "600",
                },
              ]}
              numberOfLines={1}
            >
              Categories
            </Text>
            {unifiedCategories.length > 0 && (
              <View
                style={[
                  styles.segmentCountBadge,
                  activeTab === "categories"
                    ? styles.segmentCountBadgeActive
                    : [
                        styles.segmentCountBadgeInactive,
                        { backgroundColor: isDark ? "#374151" : "#CBD5E1" },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountBadgeText,
                    activeTab === "categories"
                      ? styles.segmentCountBadgeTextActive
                      : { color: isDark ? "#9CA3AF" : "#475569" },
                  ]}
                >
                  {unifiedCategories.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Products Moderation Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentItem,
              activeTab === "products" && [
                styles.segmentItemActive,
                {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  shadowColor: isDark ? "#000000" : "#64748B",
                },
              ],
            ]}
            onPress={() => setActiveTab("products")}
          >
            <View
              style={[
                styles.segmentIconWrap,
                activeTab === "products"
                  ? { backgroundColor: "rgba(16, 185, 129, 0.15)" }
                  : { backgroundColor: "transparent" },
              ]}
            >
              <MaterialCommunityIcons
                name="cube-scan"
                size={scale(16)}
                color={activeTab === "products" ? "#10B981" : textSecondary}
              />
            </View>
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: activeTab === "products" ? textPrimary : textSecondary,
                  fontWeight: activeTab === "products" ? "800" : "600",
                },
              ]}
              numberOfLines={1}
            >
              Product
            </Text>
            {productsTotal > 0 && (
              <View
                style={[
                  styles.segmentCountBadge,
                  activeTab === "products"
                    ? styles.segmentCountBadgeActive
                    : [
                        styles.segmentCountBadgeInactive,
                        { backgroundColor: isDark ? "#374151" : "#CBD5E1" },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountBadgeText,
                    activeTab === "products"
                      ? styles.segmentCountBadgeTextActive
                      : { color: isDark ? "#9CA3AF" : "#475569" },
                  ]}
                >
                  {productsTotal}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeTab === "categories" ? (
        <View style={{ flex: 1 }}>
          {/* Category Search & Add Bar */}
          <View style={styles.categorySearchRow}>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Feather name="search" size={scale(16)} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, { color: textPrimary }]}
                placeholder="Search categories or subcategories..."
                placeholderTextColor="#94A3B8"
                value={catSearch}
                onChangeText={setCatSearch}
              />
              {catSearch.length > 0 && (
                <TouchableOpacity onPress={() => setCatSearch("")}>
                  <Feather name="x" size={scale(16)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={() => handleOpenAddCategory()}
            >
              <Feather name="plus-circle" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.addCategoryBtnText}>New Category</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Category Summary Bar */}
          <View style={styles.catStatsRow}>
            <View style={{ flexDirection: "row", gap: scale(8) }}>
              <View
                style={[
                  styles.catStatPill,
                  {
                    backgroundColor: isDark ? "#16202A" : "#FFFFFF",
                    borderColor: border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shape"
                  size={scale(14)}
                  color="#10B981"
                />
                <Text style={[styles.catStatText, { color: textPrimary }]}>
                  {unifiedCategories.length} Root Categories
                </Text>
              </View>
              <View
                style={[
                  styles.catStatPill,
                  {
                    backgroundColor: isDark ? "#16202A" : "#FFFFFF",
                    borderColor: border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="layers-outline"
                  size={scale(14)}
                  color="#0284C7"
                />
                <Text style={[styles.catStatText, { color: textPrimary }]}>
                  {totalSubcategoriesCount} Subcategories
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={toggleAllCollapse}
              style={styles.toggleAllBtn}
            >
              <Text style={styles.toggleAllBtnText}>
                {allExpanded ? "Collapse All" : "Expand All"}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={unifiedCategories}
            keyExtractor={(item) => item._id || item.id}
            renderItem={renderCategorySection}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={onRefresh}
                tintColor="#10B981"
              />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="shape-outline"
                    size={scale(48)}
                    color="#64748B"
                  />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    No categories match your search.
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.productSearchWrap,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Feather name="search" size={scale(16)} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search products by title or sku..."
              placeholderTextColor="#94A3B8"
              value={productSearch}
              onChangeText={setProductSearch}
              onSubmitEditing={() => {
                setProductPage(1);
                dispatch(
                  fetchAdminProducts({
                    page: 1,
                    limit: 15,
                    search: productSearch.trim() || undefined,
                  }),
                );
              }}
              returnKeyType="search"
            />
            {productSearch ? (
              <TouchableOpacity
                onPress={() => {
                  setProductSearch("");
                  setProductPage(1);
                  dispatch(fetchAdminProducts({ page: 1, limit: 15 }));
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
              <RefreshControl
                refreshing={loading && productPage === 1}
                onRefresh={onRefresh}
                tintColor="#10B981"
              />
            }
            onEndReached={handleLoadMoreProducts}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMoreProducts ? (
                <View style={styles.loadMoreFooter}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={[styles.loadMoreText, { color: textSecondary }]}>
                    Loading more products...
                  </Text>
                </View>
              ) : products.length > 0 && products.length >= productsTotal ? (
                <View style={styles.endOfListFooter}>
                  <Text
                    style={[styles.endOfListText, { color: textSecondary }]}
                  >
                    All {productsTotal} products loaded
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={scale(48)}
                    color="#64748B"
                  />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    No products found.
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}

      {/* Category Creation / Edit Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  {editingCategory
                    ? "Edit Category"
                    : catLevel === 1
                      ? "Add Subcategory"
                      : "Create Root Category"}
                </Text>
                <Text
                  style={{
                    fontSize: moderateScale(11),
                    color: "#EF4444",
                    fontWeight: "600",
                    marginTop: scale(2),
                  }}
                >
                  * All fields below are compulsory
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                Category Name{" "}
                <Text style={{ color: "#EF4444" }}>* (Compulsory)</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: textPrimary, borderColor: border },
                ]}
                placeholder="e.g. Dairy & Bakery"
                placeholderTextColor="#94A3B8"
                value={categoryName}
                onChangeText={(val) => {
                  setCategoryName(val);
                  if (!editingCategory) {
                    setCategorySlug(
                      val.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    );
                  }
                }}
              />

              {/* URL Slug */}
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                Custom URL Slug{" "}
                <Text style={{ color: "#EF4444" }}>* (Compulsory)</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: textPrimary, borderColor: border },
                ]}
                placeholder="e.g. dairy-bakery"
                placeholderTextColor="#94A3B8"
                value={categorySlug}
                onChangeText={setCategorySlug}
              />

              {/* Category Image URL & Gallery Upload */}
              <View style={{ marginTop: scale(10) }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: textSecondary, marginTop: 0, marginBottom: 0 },
                    ]}
                  >
                    Category Image{" "}
                    <Text style={{ color: "#EF4444" }}>* (Compulsory)</Text>
                  </Text>

                  {/* Pick from Gallery Button */}
                  <TouchableOpacity
                    style={[
                      styles.galleryPickBtn,
                      uploadingImage && { opacity: 0.7 },
                    ]}
                    onPress={handlePickImageFromGallery}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Feather name="image" size={scale(13)} color="#FFFFFF" />
                    )}
                    <Text style={styles.galleryPickBtnText}>
                      {uploadingImage
                        ? "Uploading to Cloudinary..."
                        : "Choose from Gallery"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.inputWithClear,
                    {
                      borderColor: border,
                      backgroundColor: isDark ? "#10161C" : "#FFFFFF",
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.textInputInside, { color: textPrimary }]}
                    placeholder="Paste image URL or pick from gallery..."
                    placeholderTextColor="#94A3B8"
                    value={categoryImage}
                    onChangeText={setCategoryImage}
                    autoCapitalize="none"
                  />
                  {categoryImage.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setCategoryImage("")}
                      style={{ padding: scale(4) }}
                    >
                      <Feather
                        name="x-circle"
                        size={scale(16)}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: moderateScale(10),
                    color: textSecondary,
                    marginTop: scale(3),
                  }}
                >
                  * Pick from gallery to auto-upload to Cloudinary, or paste any
                  image URL.
                </Text>
              </View>

              {/* Live Image Preview */}
              <View style={styles.modalImgPreviewWrap}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: scale(6),
                  }}
                >
                  <Text
                    style={[
                      styles.previewLabel,
                      { color: textSecondary, marginBottom: 0 },
                    ]}
                  >
                    Image Live Preview:
                  </Text>
                  {categoryImage.includes("cloudinary.com") && (
                    <View style={styles.cloudinaryBadge}>
                      <MaterialCommunityIcons
                        name="cloud-check"
                        size={scale(13)}
                        color="#10B981"
                      />
                      <Text style={styles.cloudinaryBadgeText}>
                        Cloudinary Hosted
                      </Text>
                    </View>
                  )}
                </View>

                {uploadingImage ? (
                  <View
                    style={[
                      styles.modalImgPlaceholder,
                      {
                        borderColor: "#10B981",
                        backgroundColor: isDark ? "#064E3B15" : "#ECFDF5",
                      },
                    ]}
                  >
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text
                      style={{
                        fontSize: moderateScale(12),
                        color: "#10B981",
                        fontWeight: "700",
                        marginTop: scale(8),
                      }}
                    >
                      Uploading to Cloudinary...
                    </Text>
                  </View>
                ) : categoryImage.trim().length > 5 ? (
                  <View style={[styles.modalImgBox, { borderColor: border }]}>
                    <Image
                      source={{ uri: categoryImage.trim() }}
                      style={styles.modalImgPreview}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handlePickImageFromGallery}
                    style={[
                      styles.modalImgPlaceholder,
                      {
                        borderColor: border,
                        backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="image-plus"
                      size={scale(26)}
                      color="#94A3B8"
                    />
                    <Text
                      style={{
                        fontSize: moderateScale(11),
                        color: "#94A3B8",
                        marginTop: scale(4),
                      }}
                    >
                      Tap to pick from gallery or enter URL above
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                Description{" "}
                <Text style={{ color: "#EF4444" }}>* (Compulsory)</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { color: textPrimary, borderColor: border },
                ]}
                placeholder="Describe this category..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={categoryDesc}
                onChangeText={setCategoryDesc}
              />

              {/* Parent Category if Level 1 */}
              {catLevel === 1 && (
                <View style={{ marginTop: scale(10) }}>
                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                    Parent Category{" "}
                    <Text style={{ color: "#EF4444" }}>* (Compulsory)</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: scale(4) }}
                  >
                    <View style={{ flexDirection: "row", gap: scale(8) }}>
                      {unifiedCategories.map((rootCat) => {
                        const rootId = rootCat._id || rootCat.id;
                        const isSelected = parentCatId === rootId;
                        return (
                          <TouchableOpacity
                            key={rootId}
                            onPress={() => setParentCatId(rootId)}
                            style={[
                              styles.parentPill,
                              {
                                backgroundColor: isSelected
                                  ? "#10B981"
                                  : isDark
                                    ? "#1E293B"
                                    : "#F1F5F9",
                                borderColor: isSelected ? "#10B981" : border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.parentPillText,
                                { color: isSelected ? "#FFFFFF" : textPrimary },
                              ]}
                            >
                              {rootCat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Status Switch */}
              <View style={[styles.switchRow, { borderColor: border }]}>
                <View>
                  <Text style={[styles.switchLabel, { color: textPrimary }]}>
                    Category Status
                  </Text>
                  <Text
                    style={{
                      fontSize: moderateScale(11),
                      color: catActive ? "#10B981" : "#EF4444",
                      fontWeight: "700",
                    }}
                  >
                    {catActive
                      ? "Active (Visible in customer app)"
                      : "Deactivated (Hidden from customer app)"}
                  </Text>
                </View>
                <Switch
                  value={catActive}
                  onValueChange={setCatActive}
                  trackColor={{ false: "#767577", true: "#10B981" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Submit Button */}
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
  segmentContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(10),
    paddingBottom: scale(6),
  },
  segmentTrack: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(12),
    padding: scale(4),
    borderWidth: 1,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(8),
    borderRadius: scale(9),
    gap: scale(6),
  },
  segmentItemActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentIconWrap: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLabel: {
    fontSize: moderateScale(12.5),
  },
  segmentCountBadge: {
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(10),
    minWidth: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  segmentCountBadgeActive: {
    backgroundColor: "#10B981",
  },
  segmentCountBadgeInactive: {},
  segmentCountBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  segmentCountBadgeTextActive: {
    color: "#FFFFFF",
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
    borderRadius: scale(16),
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  catHeaderTouchable: {
    padding: scale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: scale(8),
  },
  catThumbImage: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(10),
  },
  catIconWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  catTextWrap: {
    flex: 1,
    marginLeft: scale(12),
  },
  catTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  catName: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  catMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(4),
    flexWrap: "wrap",
  },
  slugPill: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  slugPillText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  subCountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  headerRightWrap: {
    alignItems: "flex-end",
    gap: scale(6),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  chevronBubble: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  catActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: scale(8),
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderTopWidth: 1,
  },
  actionButtonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  subsWrap: {
    paddingHorizontal: scale(14),
    paddingBottom: scale(14),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  subsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  subsHeader: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  countBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(1.5),
    borderRadius: scale(10),
  },
  countBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  addSubQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  addSubQuickText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#10B981",
  },
  emptySubsBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(20),
    borderRadius: scale(10),
    borderWidth: 1,
    borderStyle: "dashed",
    gap: scale(6),
  },
  emptySubsText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  subGrid: {
    gap: scale(8),
  },
  subCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  subThumbWrap: {
    marginRight: scale(10),
  },
  subThumbImage: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
  },
  subPlaceholderBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  subInfoWrap: {
    flex: 1,
    justifyContent: "center",
  },
  subName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  subSlugRow: {
    marginTop: scale(2),
  },
  subSlugText: {
    fontSize: moderateScale(11),
  },
  subActionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  subStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(7),
    paddingVertical: scale(5),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  miniDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  subStatusBtnText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  subEditBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: scale(14),
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  prodRowTouchable: {
    flexDirection: "row",
    padding: scale(12),
  },
  prodImgContainer: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(12),
    overflow: "hidden",
    position: "relative",
  },
  prodThumbImg: {
    width: "100%",
    height: "100%",
  },
  prodImgPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cloudinaryMiniTag: {
    position: "absolute",
    bottom: scale(3),
    right: scale(3),
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderRadius: scale(3),
    padding: scale(2),
  },
  prodInfoCol: {
    flex: 1,
    marginLeft: scale(12),
    justifyContent: "center",
  },
  prodTitle: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: "800",
    lineHeight: scale(18),
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: scale(3),
  },
  vendorLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(5),
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#10B981",
  },
  mrpText: {
    fontSize: moderateScale(12),
    textDecorationLine: "line-through",
  },
  purchaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  purchaseBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#10B981",
  },
  stockCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(5),
  },
  catTag: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    maxWidth: "55%",
  },
  catTagText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  stockBadge: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  prodFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
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
  subCountBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  subCountText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  chevronWrap: {
    padding: scale(4),
    marginLeft: scale(2),
  },
  categorySearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginHorizontal: scale(16),
    marginTop: scale(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    gap: scale(8),
  },
  catStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: scale(16),
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  catStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  catStatText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  toggleAllBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  toggleAllBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#10B981",
  },
  activeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  activeToggleBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  miniBadge: {
    paddingHorizontal: scale(5),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
  },
  miniBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  miniActiveToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    paddingHorizontal: scale(6),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  miniActiveToggleText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  modalImgPreviewWrap: {
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  previewLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: scale(6),
  },
  modalImgBox: {
    width: "100%",
    height: scale(120),
    borderRadius: scale(10),
    borderWidth: 1,
    overflow: "hidden",
  },
  modalImgPreview: {
    width: "100%",
    height: "100%",
  },
  modalImgPlaceholder: {
    width: "100%",
    height: scale(80),
    borderRadius: scale(10),
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  parentPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  parentPillText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  galleryPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#0284C7",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(6),
  },
  galleryPickBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  inputWithClear: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(2),
    marginTop: scale(6),
  },
  textInputInside: {
    flex: 1,
    paddingVertical: scale(7),
    fontSize: moderateScale(13),
  },
  cloudinaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  cloudinaryBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#10B981",
  },
  loadMoreFooter: {
    paddingVertical: scale(16),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
  },
  loadMoreText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  endOfListFooter: {
    paddingVertical: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  endOfListText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
});
