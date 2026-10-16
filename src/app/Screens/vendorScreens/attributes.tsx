import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme, scale, moderateScale } from "@/theme";
import { CATEGORY_NAMES } from "@/constants/categories";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrands,
  fetchAttributes,
  fetchMyBrandRequests,
} from "@/store/slices/brandSlice";
import AddBrandModal from "@/components/VendorComponent/AddBrandModal";
import AddAttributeModal from "@/components/VendorComponent/AddAttributeModal";

type TabType = "brands" | "attributes" | "requests";

export default function VendorAttributesScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ tab?: string }>();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const dispatch = useAppDispatch();
  const {
    brands,
    attributes,
    brandRequests,
    loading,
    totalBrands,
    totalPages,
    currentPage,
    totalRequests,
    requestsTotalPages,
    requestsCurrentPage,
  } = useAppSelector((state) => state.brand);

  // Active tab: 'brands' (default) | 'attributes' | 'requests'
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.tab as TabType) || "brands"
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [showCategoryFilterModal, setShowCategoryFilterModal] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [isAddAttributeModalOpen, setIsAddAttributeModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.tab && ["brands", "attributes", "requests"].includes(searchParams.tab)) {
      setActiveTab(searchParams.tab as TabType);
    }
  }, [searchParams.tab]);

  // Load data based on active tab & filters
  const loadData = useCallback(async () => {
    const catFilter = selectedCategory === "All Categories" ? undefined : selectedCategory;
    const qFilter = searchQuery.trim() || undefined;

    if (activeTab === "brands") {
      await dispatch(
        fetchBrands({
          category: catFilter,
          search: qFilter,
          page,
          limit: 15,
        })
      );
    } else if (activeTab === "attributes") {
      await dispatch(
        fetchAttributes({
          category: catFilter,
          search: qFilter,
        })
      );
    } else if (activeTab === "requests") {
      await dispatch(
        fetchMyBrandRequests({
          page,
          limit: 15,
        })
      );
    }
  }, [activeTab, selectedCategory, searchQuery, page, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (activeTab === "brands" ? totalPages : requestsTotalPages)) {
      setPage(newPage);
    }
  };

  const dynamicStyles = {
    screenBg: {
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
    },
    cardBg: {
      backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
      borderColor: isDark ? "#334155" : "#E2E8F0",
    },
    textPrimary: {
      color: isDark ? "#F8FAFC" : "#0F172A",
    },
    textSecondary: {
      color: isDark ? "#94A3B8" : "#64748B",
    },
    inputBox: {
      backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
      borderColor: isDark ? "#334155" : "#CBD5E1",
      color: isDark ? "#F8FAFC" : "#0F172A",
    },
    tableHeaderRow: {
      backgroundColor: isDark ? "#1A2234" : "#F1F5F9",
      borderColor: isDark ? "#334155" : "#E2E8F0",
    },
    tableRow: {
      borderBottomColor: isDark ? "#334155" : "#F1F5F9",
    },
    tag: {
      backgroundColor: isDark ? "#334155" : "#F1F5F9",
      color: isDark ? "#CBD5E1" : "#475569",
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.screenBg]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Header */}
      <View style={[styles.topHeader, dynamicStyles.cardBg]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather
              name="arrow-left"
              size={scale(22)}
              color={isDark ? "#F8FAFC" : "#0F172A"}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>
              Brands & Attributes
            </Text>
            <Text style={[styles.headerSubtitle, dynamicStyles.textSecondary]}>
              Manage product brands, categories and attributes
            </Text>
          </View>
        </View>

        {/* Top right quick actions */}
        <TouchableOpacity
          onPress={() => router.push("/Screens/vendorScreens/addProduct" as any)}
          style={styles.quickAddProductBtn}
        >
          <Feather name="plus" size={scale(16)} color="#016073" />
          <Text style={styles.quickAddProductText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#016073"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Navigation Tabs (matching Figma layout) */}
        <View style={[styles.tabsCard, dynamicStyles.cardBg]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            <TouchableOpacity
              onPress={() => {
                setActiveTab("brands");
                setPage(1);
              }}
              style={[
                styles.tabItem,
                activeTab === "brands" && styles.tabItemActive,
              ]}
            >
              <Feather
                name="tag"
                size={scale(15)}
                color={activeTab === "brands" ? "#016073" : isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "brands"
                    ? styles.tabTextActive
                    : dynamicStyles.textSecondary,
                ]}
              >
                Brands ({totalBrands || brands.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab("attributes");
                setPage(1);
              }}
              style={[
                styles.tabItem,
                activeTab === "attributes" && styles.tabItemActive,
              ]}
            >
              <Feather
                name="sliders"
                size={scale(15)}
                color={activeTab === "attributes" ? "#016073" : isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "attributes"
                    ? styles.tabTextActive
                    : dynamicStyles.textSecondary,
                ]}
              >
                Attributes ({attributes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab("requests");
                setPage(1);
              }}
              style={[
                styles.tabItem,
                activeTab === "requests" && styles.tabItemActive,
              ]}
            >
              <Feather
                name="clock"
                size={scale(15)}
                color={activeTab === "requests" ? "#016073" : isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "requests"
                    ? styles.tabTextActive
                    : dynamicStyles.textSecondary,
                ]}
              >
                My Brand Requests ({totalRequests || brandRequests.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Toolbar: Search, Category Filter, and Add Button */}
        <View style={styles.toolbarRow}>
          {/* Search bar */}
          <View style={[styles.searchBox, dynamicStyles.inputBox]}>
            <Feather
              name="search"
              size={scale(16)}
              color={isDark ? "#64748B" : "#94A3B8"}
            />
            <TextInput
              style={[styles.searchInput, { color: isDark ? "#F8FAFC" : "#0F172A" }]}
              placeholder={
                activeTab === "brands"
                  ? "Search brand name..."
                  : activeTab === "attributes"
                  ? "Search attribute..."
                  : "Search requests..."
              }
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setPage(1);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
              >
                <Feather
                  name="x-circle"
                  size={scale(16)}
                  color={isDark ? "#64748B" : "#94A3B8"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Button */}
          {activeTab !== "requests" && (
            <TouchableOpacity
              onPress={() => setShowCategoryFilterModal(!showCategoryFilterModal)}
              style={[styles.filterDropdown, dynamicStyles.cardBg]}
            >
              <Feather name="filter" size={scale(14)} color="#016073" />
              <Text
                style={[styles.filterDropdownText, dynamicStyles.textPrimary]}
                numberOfLines={1}
              >
                {selectedCategory}
              </Text>
              <Feather
                name="chevron-down"
                size={scale(14)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </TouchableOpacity>
          )}

          {/* Action Button: + Add Brand or + Add Attribute */}
          {activeTab === "brands" || activeTab === "requests" ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsAddBrandModalOpen(true)}
              style={styles.primaryAddBtn}
            >
              <Feather name="plus" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.primaryAddBtnText}>Add Brand</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsAddAttributeModalOpen(true)}
              style={styles.primaryAddBtn}
            >
              <Feather name="plus" size={scale(16)} color="#FFFFFF" />
              <Text style={styles.primaryAddBtnText}>Add Attribute</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills Drawer (if open) */}
        {showCategoryFilterModal && activeTab !== "requests" && (
          <View style={[styles.categoryDrawer, dynamicStyles.cardBg]}>
            <Text style={[styles.drawerTitle, dynamicStyles.textSecondary]}>
              Filter by Category:
            </Text>
            <View style={styles.drawerTags}>
              {["All Categories", ...CATEGORY_NAMES].map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryFilterModal(false);
                      setPage(1);
                    }}
                    style={[
                      styles.drawerTagPill,
                      isSelected
                        ? styles.drawerTagPillActive
                        : { backgroundColor: isDark ? "#334155" : "#F1F5F9" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.drawerTagText,
                        isSelected
                          ? styles.drawerTagTextActive
                          : dynamicStyles.textSecondary,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= TAB 1: BRANDS ================= */}
        {activeTab === "brands" && (
          <View style={[styles.tableCard, dynamicStyles.cardBg]}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeaderRow, dynamicStyles.tableHeaderRow]}>
              <View style={[styles.colBrand, { flex: 2 }]}>
                <Text style={[styles.thText, dynamicStyles.textSecondary]}>
                  Brand Names
                </Text>
              </View>
              <View style={[styles.colCategories, { flex: 2 }]}>
                <Text style={[styles.thText, dynamicStyles.textSecondary]}>
                  Categories
                </Text>
              </View>
              <View style={[styles.colAction, { flex: 1, alignItems: "flex-end" }]}>
                <Text style={[styles.thText, dynamicStyles.textSecondary]}>
                  Action
                </Text>
              </View>
            </View>

            {/* Loading State */}
            {loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator size="large" color="#016073" />
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                  Loading brands...
                </Text>
              </View>
            ) : brands.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name="tag-off-outline"
                  size={scale(48)}
                  color={isDark ? "#475569" : "#CBD5E1"}
                />
                <Text style={[styles.emptyTitle, dynamicStyles.textPrimary]}>
                  No Brands Found
                </Text>
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                  No approved brands found for the selected filter.
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddBrandModalOpen(true)}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>+ Submit New Brand</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Brand Items Table Rows
              brands.map((b) => (
                <View key={b._id} style={[styles.tableRow, dynamicStyles.tableRow]}>
                  {/* Brand Column (Logo + Name) */}
                  <View style={[styles.colBrand, { flex: 2 }]}>
                    <View style={styles.brandInfoRow}>
                      <View style={styles.brandLogoBox}>
                        {b.logo ? (
                          <Image
                            source={{
                              uri:
                                typeof b.logo === "string"
                                  ? b.logo
                                  : (b.logo as any)?.url || "",
                            }}
                            style={styles.brandLogo}
                            contentFit="contain"
                          />
                        ) : (
                          <Feather name="tag" size={scale(16)} color="#016073" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.brandNameText, dynamicStyles.textPrimary]}
                          numberOfLines={1}
                        >
                          {b.name}
                        </Text>
                        {b.description ? (
                          <Text
                            style={[styles.brandDescText, dynamicStyles.textSecondary]}
                            numberOfLines={1}
                          >
                            {b.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Categories Column */}
                  <View style={[styles.colCategories, { flex: 2 }]}>
                    <View style={styles.categoriesWrap}>
                      {b.categories && b.categories.length > 0 ? (
                        b.categories.map((c, i) => (
                          <View
                            key={i}
                            style={[styles.categoryBadge, dynamicStyles.tag]}
                          >
                            <Text
                              style={[
                                styles.categoryBadgeText,
                                { color: dynamicStyles.tag.color },
                              ]}
                            >
                              {c}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.categoryBadgeText, dynamicStyles.textSecondary]}>
                          General
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Action Column */}
                  <View style={[styles.colAction, { flex: 1, alignItems: "flex-end" }]}>
                    <View style={styles.approvedPill}>
                      <Feather name="check" size={scale(11)} color="#10B981" />
                      <Text style={styles.approvedPillText}>Available</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  style={[
                    styles.pageBtn,
                    page <= 1 && styles.pageBtnDisabled,
                  ]}
                >
                  <Feather
                    name="chevron-left"
                    size={scale(14)}
                    color={page <= 1 ? "#94A3B8" : dynamicStyles.textPrimary.color}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      { color: page <= 1 ? "#94A3B8" : dynamicStyles.textPrimary.color },
                    ]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageNumbersRow}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => handlePageChange(p)}
                      style={[
                        styles.pageNumberBtn,
                        page === p && styles.pageNumberBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          page === p
                            ? styles.pageNumberTextActive
                            : dynamicStyles.textSecondary,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  style={[
                    styles.pageBtn,
                    page >= totalPages && styles.pageBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      {
                        color:
                          page >= totalPages ? "#94A3B8" : dynamicStyles.textPrimary.color,
                      },
                    ]}
                  >
                    Next
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={scale(14)}
                    color={page >= totalPages ? "#94A3B8" : dynamicStyles.textPrimary.color}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 2: ATTRIBUTES ================= */}
        {activeTab === "attributes" && (
          <View style={[styles.tableCard, dynamicStyles.cardBg]}>
            {loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator size="large" color="#016073" />
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                  Loading attributes...
                </Text>
              </View>
            ) : attributes.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name="tune-vertical"
                  size={scale(48)}
                  color={isDark ? "#475569" : "#CBD5E1"}
                />
                <Text style={[styles.emptyTitle, dynamicStyles.textPrimary]}>
                  No Attributes Found
                </Text>
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                  Add product attributes (like Color, Weight, Size) for your categories.
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddAttributeModalOpen(true)}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>+ Add First Attribute</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.attributeList}>
                {attributes.map((attr) => (
                  <View
                    key={attr._id}
                    style={[styles.attributeCard, dynamicStyles.tableRow]}
                  >
                    <View style={styles.attributeCardHeader}>
                      <View style={styles.attributeTitleRow}>
                        <View style={styles.attrIconBox}>
                          <Feather name="sliders" size={scale(16)} color="#016073" />
                        </View>
                        <View>
                          <Text
                            style={[styles.attrNameText, dynamicStyles.textPrimary]}
                          >
                            {attr.name}
                          </Text>
                          <Text style={[styles.attrSubText, dynamicStyles.textSecondary]}>
                            Categories: {attr.categories.join(", ")}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    </View>

                    {/* Value chips */}
                    <View style={styles.attrValuesRow}>
                      {attr.values.map((val, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.attrValueChip,
                            { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.attrValueChipText,
                              dynamicStyles.textPrimary,
                            ]}
                          >
                            {val}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 3: BRAND REQUESTS ================= */}
        {activeTab === "requests" && (
          <View style={[styles.tableCard, dynamicStyles.cardBg]}>
            {loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator size="large" color="#016073" />
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                  Loading requests...
                </Text>
              </View>
            ) : brandRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={scale(48)}
                  color={isDark ? "#475569" : "#CBD5E1"}
                />
                <Text style={[styles.emptyTitle, dynamicStyles.textPrimary]}>
                  No Brand Requests
                </Text>
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                  You haven't submitted any brand approval requests yet.
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddBrandModalOpen(true)}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>+ Submit Brand Request</Text>
                </TouchableOpacity>
              </View>
            ) : (
              brandRequests.map((req) => {
                const isPending = req.status === "PENDING";
                const isApproved = req.status === "APPROVED";
                const isRejected = req.status === "REJECTED";

                return (
                  <View
                    key={req._id}
                    style={[styles.requestCard, dynamicStyles.tableRow]}
                  >
                    <View style={styles.requestCardHeader}>
                      <View style={styles.brandInfoRow}>
                        <View style={styles.brandLogoBox}>
                          {req.logo ? (
                            <Image
                              source={{
                                uri:
                                  typeof req.logo === "string"
                                    ? req.logo
                                    : (req.logo as any)?.url || "",
                              }}
                              style={styles.brandLogo}
                              contentFit="contain"
                            />
                          ) : (
                            <Feather name="tag" size={scale(16)} color="#016073" />
                          )}
                        </View>
                        <View>
                          <Text
                            style={[styles.brandNameText, dynamicStyles.textPrimary]}
                          >
                            {req.name}
                          </Text>
                          <Text
                            style={[styles.brandDescText, dynamicStyles.textSecondary]}
                          >
                            Submitted:{" "}
                            {req.createdAt
                              ? new Date(req.createdAt).toLocaleDateString()
                              : "Recently"}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          isPending && styles.statusBadgePending,
                          isApproved && styles.statusBadgeApproved,
                          isRejected && styles.statusBadgeRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isPending && styles.statusBadgeTextPending,
                            isApproved && styles.statusBadgeTextApproved,
                            isRejected && styles.statusBadgeTextRejected,
                          ]}
                        >
                          {req.status}
                        </Text>
                      </View>
                    </View>

                    {/* Categories */}
                    <View style={styles.requestCategoriesRow}>
                      <Text style={[styles.requestCatLabel, dynamicStyles.textSecondary]}>
                        Categories:
                      </Text>
                      {req.categories.map((c, i) => (
                        <View
                          key={i}
                          style={[styles.categoryBadge, dynamicStyles.tag]}
                        >
                          <Text
                            style={[
                              styles.categoryBadgeText,
                              { color: dynamicStyles.tag.color },
                            ]}
                          >
                            {c}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Rejection reason if applicable */}
                    {isRejected && req.rejectionReason ? (
                      <View style={styles.rejectionBox}>
                        <Feather name="alert-circle" size={scale(13)} color="#EF4444" />
                        <Text style={styles.rejectionText}>
                          Reason: {req.rejectionReason}
                        </Text>
                      </View>
                    ) : null}

                    {/* Pending hint */}
                    {isPending && (
                      <Text style={[styles.pendingHint, dynamicStyles.textSecondary]}>
                        This brand will become selectable for your products once reviewed and approved by the platform admin.
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Brand Modal */}
      <AddBrandModal
        visible={isAddBrandModalOpen}
        onClose={() => setIsAddBrandModalOpen(false)}
        initialCategory={selectedCategory === "All Categories" ? undefined : selectedCategory}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Add Attribute Modal */}
      <AddAttributeModal
        visible={isAddAttributeModalOpen}
        onClose={() => setIsAddAttributeModalOpen(false)}
        initialCategory={selectedCategory === "All Categories" ? undefined : selectedCategory}
        onSuccess={() => {
          loadData();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  backButton: {
    padding: scale(6),
    borderRadius: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  quickAddProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    backgroundColor: "rgba(1, 96, 115, 0.1)",
  },
  quickAddProductText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#016073",
  },
  scrollContent: {
    padding: scale(16),
    gap: scale(14),
  },
  tabsCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: scale(6),
  },
  tabsContainer: {
    flexDirection: "row",
    gap: scale(6),
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  tabItemActive: {
    backgroundColor: "rgba(1, 96, 115, 0.12)",
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#016073",
    fontWeight: "700",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flexWrap: "wrap",
  },
  searchBox: {
    flex: 1,
    minWidth: scale(180),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(8) : scale(4),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
  },
  filterDropdownText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    maxWidth: scale(120),
  },
  primaryAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
  },
  primaryAddBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  categoryDrawer: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: scale(12),
    gap: scale(8),
  },
  drawerTitle: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  drawerTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  drawerTagPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
  },
  drawerTagPillActive: {
    backgroundColor: "#016073",
  },
  drawerTagText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  drawerTagTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tableCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  tableHeaderRow: {
    paddingVertical: scale(10),
  },
  thText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colBrand: {
    justifyContent: "center",
  },
  colCategories: {
    justifyContent: "center",
  },
  colAction: {
    justifyContent: "center",
  },
  brandInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  brandLogoBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  brandLogo: {
    width: scale(28),
    height: scale(28),
  },
  brandNameText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  brandDescText: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(4),
  },
  categoryBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  categoryBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "500",
  },
  approvedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  approvedPillText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#10B981",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.15)",
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  pageNumbersRow: {
    flexDirection: "row",
    gap: scale(6),
  },
  pageNumberBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    justifyContent: "center",
    alignItems: "center",
  },
  pageNumberBtnActive: {
    backgroundColor: "#016073",
  },
  pageNumberText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  pageNumberTextActive: {
    color: "#FFFFFF",
  },
  emptyBox: {
    paddingVertical: scale(40),
    paddingHorizontal: scale(20),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginTop: scale(6),
  },
  emptyText: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  emptyActionBtn: {
    marginTop: scale(10),
    backgroundColor: "#016073",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  emptyActionBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  attributeList: {
    padding: scale(12),
    gap: scale(10),
  },
  attributeCard: {
    borderRadius: moderateScale(10),
    padding: scale(12),
    gap: scale(10),
  },
  attributeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attributeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  attrIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    backgroundColor: "rgba(1, 96, 115, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  attrNameText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  attrSubText: {
    fontSize: moderateScale(11),
    marginTop: scale(1),
  },
  activePill: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(10),
  },
  activePillText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#10B981",
  },
  attrValuesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  attrValueChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(14),
  },
  attrValueChipText: {
    fontSize: moderateScale(11),
    fontWeight: "500",
  },
  requestCard: {
    padding: scale(14),
    gap: scale(10),
  },
  requestCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  statusBadgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  statusBadgeApproved: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  statusBadgeRejected: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  statusBadgeTextPending: {
    color: "#F59E0B",
  },
  statusBadgeTextApproved: {
    color: "#10B981",
  },
  statusBadgeTextRejected: {
    color: "#EF4444",
  },
  requestCategoriesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: scale(6),
  },
  requestCatLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  rejectionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    padding: scale(8),
    borderRadius: moderateScale(6),
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  rejectionText: {
    fontSize: moderateScale(11),
    color: "#EF4444",
  },
  pendingHint: {
    fontSize: moderateScale(11),
    fontStyle: "italic",
    lineHeight: scale(15),
  },
});
