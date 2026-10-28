import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AdminHeader from "@/components/AdminHeader";
import AdminStoreFilterDropdown from "@/components/AdminStoreFilterDropdown";
import { moderateScale, scale, useTheme } from "@/theme";
import api from "@/store/services/api";
import {
  fetchStaffAssignedVendorsApi,
  fetchVendorProductsAnalyticsApi,
  fetchVendorSalesAnalyticsApi,
} from "@/store/services/adminService";

export default function VendorAnalyticsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "7d" | "30d" | "monthly" | "all">("all");

  // Summary Metrics
  const [summary, setSummary] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // Product Analytics Table
  const [products, setProducts] = useState<any[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);

  // Load Assigned Vendors
  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors && res.vendors.length > 0) {
        setAssignedVendors(res.vendors);
      } else {
        const fallback = await api.get("/admin/vendors?limit=100");
        if (fallback.data?.vendors) {
          setAssignedVendors(fallback.data.vendors);
        }
      }
    } catch (err) {
      console.error("Failed to load assigned vendors", err);
      try {
        const fallback = await api.get("/admin/vendors?limit=100");
        if (fallback.data?.vendors) {
          setAssignedVendors(fallback.data.vendors);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  // Load Sales Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { range: timeRange };
      if (selectedVendorId !== "all") {
        params.vendorId = selectedVendorId;
      }
      const res = await fetchVendorSalesAnalyticsApi(params);
      if (res?.analytics) {
        setSummary(res.analytics.summary || null);
        setCategoryBreakdown(res.analytics.categoryBreakdown || []);
        setTopProducts(res.analytics.topSellingProducts || []);
      }
    } catch (err) {
      console.error("Failed to load vendor analytics", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVendorId, timeRange]);

  // Load Product Performance Table
  const loadProductPerformance = useCallback(
    async (page = 1, search = productSearch) => {
      try {
        setProductLoading(true);
        const params: any = {
          page,
          limit: 10,
          search: search.trim() || undefined,
        };
        if (selectedVendorId !== "all") {
          params.vendorId = selectedVendorId;
        }
        const res = await fetchVendorProductsAnalyticsApi(params);
        if (res?.products) {
          setProducts(res.products);
          setProductPage(res.pagination?.page || 1);
          setProductTotalPages(res.pagination?.pages || 1);
          setProductTotal(res.pagination?.total || 0);
        }
      } catch (err) {
        console.error("Failed to load product performance", err);
      } finally {
        setProductLoading(false);
      }
    },
    [selectedVendorId, productSearch]
  );

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadProductPerformance(1);
  }, [loadAnalytics, loadProductPerformance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendors(), loadAnalytics(), loadProductPerformance(1)]);
    setRefreshing(false);
  };

  // Theme Colors
  const bg = isDark ? "#0A0F12" : "#F8FAFC";
  const cardBg = isDark ? "#141D22" : "#FFFFFF";
  const border = isDark ? "#24323B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const timeRanges = [
    { label: "All Time", value: "all" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "Monthly", value: "monthly" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Vendor Analytics"
        subtitle="Operational Sales & Product Insights"
        showBack
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Scoped Stores Filter & Dropdown */}
        <AdminStoreFilterDropdown
          vendors={assignedVendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={(vId) => setSelectedVendorId(vId)}
          title="Assigned Store Scope"
        />

        {/* Timeframe Selector */}
        <View style={[styles.timeframeRow, { backgroundColor: cardBg, borderColor: border }]}>
          {timeRanges.map((tr) => {
            const isActive = timeRange === tr.value;
            return (
              <TouchableOpacity
                key={tr.value}
                style={[styles.timeframeBtn, isActive && styles.timeframeBtnActive]}
                onPress={() => setTimeRange(tr.value as any)}
              >
                <Text style={[styles.timeframeText, { color: isActive ? "#10B981" : textSecondary }]}>
                  {tr.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading Indicator */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={[styles.loaderText, { color: textSecondary }]}>Aggregating operational analytics...</Text>
          </View>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Gross Sales */}
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.kpiIconWrap}>
                  <MaterialCommunityIcons name="cash-multiple" size={scale(18)} color="#10B981" />
                </View>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Gross Sales</Text>
                <Text style={[styles.kpiValue, { color: textPrimary }]}>
                  NPR {(summary?.grossSales || 0).toLocaleString()}
                </Text>
                <Text style={[styles.kpiSub, { color: textSecondary }]}>
                  {summary?.orderCount || summary?.totalOrders || 0} total orders
                </Text>
              </View>

              {/* Net Sales */}
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(14, 165, 233, 0.12)" }]}>
                  <MaterialCommunityIcons name="chart-line" size={scale(18)} color="#0EA5E9" />
                </View>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Net Realized</Text>
                <Text style={[styles.kpiValue, { color: textPrimary }]}>
                  NPR {(summary?.netSales || 0).toLocaleString()}
                </Text>
                <Text style={[styles.kpiSub, { color: "#10B981" }]}>
                  {summary?.completedOrders || 0} delivered
                </Text>
              </View>

              {/* COD vs Prepaid */}
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                  <MaterialCommunityIcons name="bank-transfer" size={scale(18)} color="#F59E0B" />
                </View>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Payment Split</Text>
                <Text style={[styles.kpiValue, { color: textPrimary, fontSize: moderateScale(13) }]} numberOfLines={1}>
                  COD: NPR {(summary?.codSales || 0).toLocaleString()}
                </Text>
                <Text style={[styles.kpiSub, { color: textSecondary }]} numberOfLines={1}>
                  Online: NPR {(summary?.onlineSales || 0).toLocaleString()}
                </Text>
              </View>

              {/* Returns & Cancellations */}
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                  <MaterialCommunityIcons name="keyboard-return" size={scale(18)} color="#EF4444" />
                </View>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Return / Cancel</Text>
                <Text style={[styles.kpiValue, { color: "#EF4444" }]}>
                  {summary?.returnedOrders || 0} returns
                </Text>
                <Text style={[styles.kpiSub, { color: textSecondary }]}>
                  {summary?.cancelledOrders || 0} cancelled ({summary?.returnRefundRate || 0}%)
                </Text>
              </View>
            </View>

            {/* Top Selling Products Preview */}
            {topProducts.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="trophy-outline" size={scale(18)} color="#F59E0B" />
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>Top Selling Products</Text>
                </View>
                {topProducts.map((p, idx) => (
                  <View key={p.productId || idx} style={[styles.topProdRow, { borderBottomColor: border }]}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.topProdName, { color: textPrimary }]} numberOfLines={1}>
                        {p.name || "Product"}
                      </Text>
                      <Text style={[styles.topProdSub, { color: textSecondary }]}>
                        {p.unitsSold || 0} units sold &bull; NPR {(p.revenue || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Category Distribution */}
            {categoryBreakdown.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="shape-outline" size={scale(18)} color="#10B981" />
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>Sales by Category</Text>
                </View>
                {categoryBreakdown.map((cat, idx) => (
                  <View key={cat.category || idx} style={[styles.catRow, { borderBottomColor: border }]}>
                    <Text style={[styles.catName, { color: textPrimary }]}>{cat.category || "General"}</Text>
                    <View style={styles.catStatsRow}>
                      <Text style={[styles.catUnits, { color: textSecondary }]}>{cat.unitsSold || 0} sold</Text>
                      <Text style={[styles.catRevenue, { color: "#10B981" }]}>
                        NPR {(cat.revenue || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Product Performance Table Section */}
            <View style={[styles.tableCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.tableHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="cube-scan" size={scale(18)} color="#0EA5E9" />
                  <Text style={[styles.cardTitle, { color: textPrimary, marginLeft: scale(8) }]}>
                    Product Catalog Performance ({productTotal})
                  </Text>
                </View>
              </View>

              {/* Table Search Input */}
              <View style={[styles.searchBox, { borderColor: border, backgroundColor: bg }]}>
                <Feather name="search" size={scale(15)} color={textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: textPrimary }]}
                  placeholder="Filter product SKU, name or title..."
                  placeholderTextColor={textSecondary}
                  value={productSearch}
                  onChangeText={(txt) => {
                    setProductSearch(txt);
                    loadProductPerformance(1, txt);
                  }}
                />
                {productSearch.length > 0 && (
                  <TouchableOpacity onPress={() => { setProductSearch(""); loadProductPerformance(1, ""); }}>
                    <Feather name="x" size={scale(15)} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {productLoading ? (
                <View style={{ paddingVertical: scale(20) }}>
                  <ActivityIndicator size="small" color="#10B981" />
                </View>
              ) : products.length === 0 ? (
                <View style={styles.emptyTable}>
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    No products found for selected vendor scope.
                  </Text>
                </View>
              ) : (
                <View style={styles.tableWrap}>
                  {products.map((item, idx) => (
                    <View
                      key={item._id || item.id || idx}
                      style={[styles.prodItemRow, { borderBottomColor: border }]}
                    >
                      <View style={{ flex: 1, marginRight: scale(8) }}>
                        <Text style={[styles.prodItemTitle, { color: textPrimary }]} numberOfLines={2}>
                          {item.title || item.name}
                        </Text>
                        <Text style={[styles.prodItemSub, { color: textSecondary }]}>
                          SKU: {item.sku || "N/A"} &bull; Stock: {item.stock ?? 0} &bull; Price: NPR {item.price?.toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.prodItemMetrics}>
                        <View style={styles.metricBadge}>
                          <Text style={styles.metricBadgeLabel}>Sold</Text>
                          <Text style={styles.metricBadgeVal}>{item.unitsSold || 0}</Text>
                        </View>
                        <View style={[styles.metricBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                          <Text style={[styles.metricBadgeLabel, { color: "#10B981" }]}>Gross</Text>
                          <Text style={[styles.metricBadgeVal, { color: "#10B981" }]}>
                            NPR {(item.grossSales || 0).toLocaleString()}
                          </Text>
                        </View>
                        <View style={[styles.metricBadge, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                          <Text style={[styles.metricBadgeLabel, { color: "#EF4444" }]}>Returned</Text>
                          <Text style={[styles.metricBadgeVal, { color: "#EF4444" }]}>
                            {item.returnedUnits || 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Table Pagination */}
              {productTotalPages > 1 && (
                <View style={[styles.paginationRow, { borderTopColor: border }]}>
                  <TouchableOpacity
                    disabled={productPage <= 1}
                    onPress={() => loadProductPerformance(productPage - 1)}
                    style={[styles.pageBtn, productPage <= 1 && styles.pageBtnDisabled]}
                  >
                    <Feather name="chevron-left" size={scale(16)} color={productPage <= 1 ? textSecondary : textPrimary} />
                    <Text style={[styles.pageBtnText, { color: productPage <= 1 ? textSecondary : textPrimary }]}>
                      Prev
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.pageInfoText, { color: textSecondary }]}>
                    Page {productPage} of {productTotalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={productPage >= productTotalPages}
                    onPress={() => loadProductPerformance(productPage + 1)}
                    style={[styles.pageBtn, productPage >= productTotalPages && styles.pageBtnDisabled]}
                  >
                    <Text style={[styles.pageBtnText, { color: productPage >= productTotalPages ? textSecondary : textPrimary }]}>
                      Next
                    </Text>
                    <Feather name="chevron-right" size={scale(16)} color={productPage >= productTotalPages ? textSecondary : textPrimary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(14),
    paddingBottom: scale(40),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    marginLeft: scale(6),
  },
  pillScroll: {
    flexDirection: "row",
    marginBottom: scale(12),
  },
  filterPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(18),
    borderWidth: 1,
    marginRight: scale(8),
  },
  filterPillActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  pillText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  timeframeRow: {
    flexDirection: "row",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(3),
    marginBottom: scale(14),
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: scale(6),
    alignItems: "center",
    borderRadius: scale(7),
  },
  timeframeBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  timeframeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  loaderWrap: {
    paddingVertical: scale(50),
    alignItems: "center",
  },
  loaderText: {
    fontSize: moderateScale(12),
    marginTop: scale(10),
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    marginBottom: scale(14),
  },
  kpiCard: {
    width: "48%",
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  kpiIconWrap: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(6),
  },
  kpiLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  kpiValue: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    marginVertical: scale(2),
  },
  kpiSub: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(14),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(10),
  },
  cardTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    marginLeft: scale(6),
  },
  topProdRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(8),
    borderBottomWidth: 0.8,
  },
  rankBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: moderateScale(10),
    fontWeight: "900",
    color: "#F59E0B",
  },
  topProdName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  topProdSub: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(8),
    borderBottomWidth: 0.8,
  },
  catName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  catStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  catUnits: {
    fontSize: moderateScale(11),
  },
  catRevenue: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  tableCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(10),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    marginBottom: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12),
    marginLeft: scale(6),
    padding: 0,
  },
  tableWrap: {
    marginTop: scale(4),
  },
  prodItemRow: {
    paddingVertical: scale(10),
    borderBottomWidth: 0.8,
  },
  prodItemTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  prodItemSub: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  prodItemMetrics: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: scale(6),
  },
  metricBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.12)",
    borderRadius: scale(6),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  metricBadgeLabel: {
    fontSize: moderateScale(9),
    fontWeight: "600",
    color: "#64748B",
  },
  metricBadgeVal: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyTable: {
    paddingVertical: scale(20),
    alignItems: "center",
  },
  emptyText: {
    fontSize: moderateScale(11),
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scale(10),
    marginTop: scale(6),
    borderTopWidth: 0.8,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  pageInfoText: {
    fontSize: moderateScale(11),
  },
});
