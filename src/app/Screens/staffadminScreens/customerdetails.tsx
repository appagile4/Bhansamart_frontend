import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import api from "@/store/services/api";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";

type DetailTab = "overview" | "orders" | "products" | "vendors" | "deliveries" | "cod" | "refunds";

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string; id?: string }>();
  const customerId = params.customerId || params.id;

  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [customerData, setCustomerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const loadCustomerDetails = async () => {
    if (!customerId) {
      setError("No Customer ID provided");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await api.get(`/admin/customers/${customerId}`);
      const payload = res.data?.data || res.data;
      setCustomerData(payload);
    } catch (err: any) {
      // Fallback to staff-operations customer route
      try {
        const fallbackRes = await api.get(`/admin/staff-operations/customers/${customerId}`);
        setCustomerData(fallbackRes.data?.data || fallbackRes.data);
      } catch (fallbackErr: any) {
        console.error("[CustomerDetails] Error fetching:", fallbackErr);
        setError(
          fallbackErr.response?.data?.message ||
          fallbackErr.message ||
          "Failed to load customer profile and insights"
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCustomerDetails();
  }, [customerId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomerDetails();
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const customer = customerData?.customer;
  const metrics = customerData?.metrics || {};
  const orders = customerData?.orders || [];
  const mostPurchasedProducts = customerData?.mostPurchasedProducts || [];
  const vendorSpendingSummary = customerData?.vendorSpendingSummary || [];
  const deliveryHistory = customerData?.deliveryHistory || [];
  const codHistory = customerData?.codHistory || [];
  const refunds = customerData?.refunds || [];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Loading customer insights...
        </Text>
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <Ionicons name="alert-circle-outline" size={scale(48)} color="#EF4444" />
        <Text style={[styles.errorTitle, { color: textPrimary }]}>
          {error || "Customer Not Found"}
        </Text>
        <Text style={[styles.errorSubtitle, { color: textSecondary }]}>
          Verify that this customer has purchase history within your authorized scope.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            loadCustomerDetails();
          }}
        >
          <Text style={styles.retryBtnText}>Retry Loading</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: border, marginTop: moderateScale(10) }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retryBtnText, { color: textPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={scale(22)} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: textPrimary }]} numberOfLines={1}>
            {customer.name || "Customer Profile"}
          </Text>
          <Text style={[styles.topBarSubtitle, { color: textSecondary }]}>
            Lifetime Customer Insights & Analytics
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={scale(20)} color={textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />}
      >
        {/* Customer Profile Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.profileRow}>
            {customer.avatar ? (
              <Image source={{ uri: customer.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? "#1E293B" : "#E0F2FE" }]}>
                <Text style={styles.avatarLetter}>
                  {(customer.name || "C")[0].toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ flex: 1, marginLeft: scale(12) }}>
              <View style={styles.nameRow}>
                <Text style={[styles.customerName, { color: textPrimary }]} numberOfLines={1}>
                  {customer.name}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        customer.isActive !== false
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: customer.isActive !== false ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {customer.isActive !== false ? "Active" : "Blocked"}
                  </Text>
                </View>
              </View>

              <Text style={[styles.profileMeta, { color: textSecondary }]}>
                ID: {customer._id}
              </Text>

              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={scale(14)} color="#0284C7" />
                <Text style={[styles.contactText, { color: textPrimary }]}>
                  {customer.email || "No email on record"}
                </Text>
              </View>

              {customer.phone ? (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={scale(14)} color="#10B981" />
                  <Text style={[styles.contactText, { color: textPrimary }]}>
                    {customer.phone}
                  </Text>
                </View>
              ) : null}

              {customer.address ? (
                <View style={styles.contactItem}>
                  <Ionicons name="location-outline" size={scale(14)} color="#F59E0B" />
                  <Text style={[styles.contactText, { color: textSecondary }]} numberOfLines={2}>
                    {customer.address}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Lifetime KPI Metrics Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiBox, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>Total Orders</Text>
            <Text style={[styles.kpiVal, { color: textPrimary }]}>
              {metrics.totalOrders || 0}
            </Text>
            <Text style={[styles.kpiSub, { color: "#10B981" }]}>
              {metrics.completedOrders || 0} Completed
            </Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>Gross Spending</Text>
            <Text style={[styles.kpiVal, { color: "#0284C7" }]}>
              Rs. {Number(metrics.totalCompletedSpending || 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiSub, { color: textSecondary }]}>
              Completed Deliveries
            </Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>Net Spending</Text>
            <Text style={[styles.kpiVal, { color: "#059669" }]}>
              Rs. {Number(metrics.netSpending || 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiSub, { color: "#EF4444" }]}>
              Rs. {Number(metrics.totalRefundedAmount || 0).toLocaleString()} Refunded
            </Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>Last Purchase</Text>
            <Text style={[styles.kpiVal, { color: textPrimary, fontSize: moderateScale(13) }]}>
              {metrics.lastPurchaseDate
                ? new Date(metrics.lastPurchaseDate).toLocaleDateString()
                : "No orders yet"}
            </Text>
            <Text style={[styles.kpiSub, { color: textSecondary }]}>
              {metrics.activeOrders || 0} Active In Progress
            </Text>
          </View>
        </View>

        {/* Tab Filter Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {[
            { key: "overview", label: "Overview", icon: "view-dashboard-outline" },
            { key: "orders", label: `Orders (${orders.length})`, icon: "clipboard-list-outline" },
            { key: "products", label: `Top Items (${mostPurchasedProducts.length})`, icon: "shopping-outline" },
            { key: "vendors", label: `Stores (${vendorSpendingSummary.length})`, icon: "storefront-outline" },
            { key: "deliveries", label: `Riders (${deliveryHistory.length})`, icon: "motorbike" },
            { key: "cod", label: `COD History (${codHistory.length})`, icon: "cash-multiple" },
            { key: "refunds", label: `Refunds (${refunds.length})`, icon: "keyboard-return" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                activeTab === tab.key && styles.tabBtnActive,
                { borderColor: activeTab === tab.key ? "#0284C7" : border },
              ]}
              onPress={() => setActiveTab(tab.key as DetailTab)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={scale(16)}
                color={activeTab === tab.key ? "#FFFFFF" : textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === tab.key ? "#FFFFFF" : textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <View style={{ gap: moderateScale(12) }}>
            {/* Top Purchased Products Teaser */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                  Top Purchased Items
                </Text>
                <TouchableOpacity onPress={() => setActiveTab("products")}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {mostPurchasedProducts.length === 0 ? (
                <Text style={[styles.emptyNote, { color: textSecondary }]}>
                  No items purchased yet.
                </Text>
              ) : (
                mostPurchasedProducts.slice(0, 3).map((item: any, idx: number) => (
                  <View key={item.productId || idx} style={styles.productRow}>
                    <View style={styles.prodInfo}>
                      <Text style={[styles.prodName, { color: textPrimary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.prodSub, { color: textSecondary }]}>
                        {item.totalQuantity} units across {item.orderCount} order(s)
                      </Text>
                    </View>
                    <Text style={[styles.prodAmount, { color: "#0284C7" }]}>
                      Rs. {Number(item.totalSpent || 0).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Favorite Vendors Teaser */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                  Stores Frequented
                </Text>
                <TouchableOpacity onPress={() => setActiveTab("vendors")}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {vendorSpendingSummary.length === 0 ? (
                <Text style={[styles.emptyNote, { color: textSecondary }]}>
                  No store orders recorded yet.
                </Text>
              ) : (
                vendorSpendingSummary.slice(0, 3).map((v: any, idx: number) => (
                  <View key={v.vendorId || idx} style={styles.productRow}>
                    <View style={styles.prodInfo}>
                      <Text style={[styles.prodName, { color: textPrimary }]} numberOfLines={1}>
                        {v.businessName}
                      </Text>
                      <Text style={[styles.prodSub, { color: textSecondary }]}>
                        {v.orderCount} order(s) placed ({v.completedCount} delivered)
                      </Text>
                    </View>
                    <Text style={[styles.prodAmount, { color: "#10B981" }]}>
                      Rs. {Number(v.totalSpent || 0).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Recorded Interests / Search History */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: moderateScale(6) }]}>
                Search History & Interests
              </Text>
              <View style={styles.emptySearchBox}>
                <MaterialCommunityIcons name="magnify" size={scale(24)} color={textSecondary} />
                <Text style={[styles.emptySearchText, { color: textSecondary }]}>
                  No explicit search history or personalized category interests recorded for this customer.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: ORDERS LIST */}
        {activeTab === "orders" && (
          <View style={{ gap: moderateScale(10) }}>
            {orders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Orders Found</Text>
                <Text style={[styles.emptyNote, { color: textSecondary }]}>
                  This customer has not placed any orders within your managed store scope.
                </Text>
              </View>
            ) : (
              orders.map((ord: any) => (
                <View key={ord._id} style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.orderTopRow}>
                    <View>
                      <Text style={[styles.orderNumber, { color: textPrimary }]}>
                        #{ord.orderNumber}
                      </Text>
                      <Text style={[styles.orderDate, { color: textSecondary }]}>
                        {new Date(ord.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <RequestStatusBadge status={ord.orderStatus} type="order" />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.orderDetailRow}>
                    <Text style={[styles.orderLabel, { color: textSecondary }]}>Store</Text>
                    <Text style={[styles.orderVal, { color: textPrimary }]}>
                      {ord.vendor?.businessDetails?.businessName || ord.vendorName || "Store"}
                    </Text>
                  </View>

                  <View style={styles.orderDetailRow}>
                    <Text style={[styles.orderLabel, { color: textSecondary }]}>Items Count</Text>
                    <Text style={[styles.orderVal, { color: textPrimary }]}>
                      {ord.items?.length || ord.totalCount || 0} Item(s)
                    </Text>
                  </View>

                  <View style={styles.orderDetailRow}>
                    <Text style={[styles.orderLabel, { color: textSecondary }]}>Amount</Text>
                    <Text style={[styles.orderValBold, { color: "#0284C7" }]}>
                      Rs. {Number(ord.totalAmount || 0).toLocaleString()} ({ord.paymentMethod})
                    </Text>
                  </View>

                  {ord.assignedDeliveryBoy ? (
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderLabel, { color: textSecondary }]}>Rider</Text>
                      <Text style={[styles.orderVal, { color: "#10B981" }]}>
                        {ord.assignedDeliveryBoy.fullName} ({ord.assignedDeliveryBoy.phone})
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderLabel, { color: textSecondary }]}>Rider</Text>
                      <Text style={[styles.orderVal, { color: "#F59E0B" }]}>
                        Not Assigned
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: MOST PURCHASED PRODUCTS */}
        {activeTab === "products" && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: moderateScale(10) }]}>
              All Purchased Products
            </Text>

            {mostPurchasedProducts.length === 0 ? (
              <Text style={[styles.emptyNote, { color: textSecondary }]}>
                No products found.
              </Text>
            ) : (
              mostPurchasedProducts.map((p: any, idx: number) => (
                <View key={p.productId || idx} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: textPrimary }]}>
                      {p.name}
                    </Text>
                    <Text style={[styles.prodSub, { color: textSecondary }]}>
                      Ordered {p.totalQuantity} times in {p.orderCount} order(s)
                    </Text>
                  </View>
                  <Text style={[styles.prodAmount, { color: "#0284C7" }]}>
                    Rs. {Number(p.totalSpent || 0).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 4: VENDOR SPENDING */}
        {activeTab === "vendors" && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: moderateScale(10) }]}>
              Store-Wise Spending Breakdown
            </Text>

            {vendorSpendingSummary.length === 0 ? (
              <Text style={[styles.emptyNote, { color: textSecondary }]}>
                No store purchase history recorded.
              </Text>
            ) : (
              vendorSpendingSummary.map((v: any, idx: number) => (
                <View key={v.vendorId || idx} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: textPrimary }]}>
                      {v.businessName}
                    </Text>
                    <Text style={[styles.prodSub, { color: textSecondary }]}>
                      {v.orderCount} orders • {v.completedCount} delivered
                    </Text>
                  </View>
                  <Text style={[styles.prodAmount, { color: "#059669" }]}>
                    Rs. {Number(v.totalSpent || 0).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 5: DELIVERIES & RIDERS */}
        {activeTab === "deliveries" && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: moderateScale(10) }]}>
              Delivery Partners Assigned
            </Text>

            {deliveryHistory.length === 0 ? (
              <Text style={[styles.emptyNote, { color: textSecondary }]}>
                No delivery partners recorded.
              </Text>
            ) : (
              deliveryHistory.map((d: any, idx: number) => (
                <View key={d.deliveryBoyId || idx} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: textPrimary }]}>
                      {d.fullName}
                    </Text>
                    <Text style={[styles.prodSub, { color: textSecondary }]}>
                      Phone: {d.phone || "N/A"} • Last: {d.lastDeliveryAt ? new Date(d.lastDeliveryAt).toLocaleDateString() : "Pending"}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                    <Text style={[styles.statusBadgeText, { color: "#0284C7" }]}>
                      {d.deliveriesCount} Deliveries
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 6: COD HISTORY */}
        {activeTab === "cod" && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: moderateScale(10) }]}>
              COD Cash Collection History
            </Text>

            {codHistory.length === 0 ? (
              <Text style={[styles.emptyNote, { color: textSecondary }]}>
                No Cash on Delivery orders placed by this customer.
              </Text>
            ) : (
              codHistory.map((c: any, idx: number) => (
                <View key={c.orderId || idx} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: textPrimary }]}>
                      Order #{c.orderNumber}
                    </Text>
                    <Text style={[styles.prodSub, { color: textSecondary }]}>
                      Collected: Rs. {c.amountCollected} of Rs. {c.amountDue} • Status: {c.status}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: c.vendorConfirmed
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(245, 158, 11, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: c.vendorConfirmed ? "#10B981" : "#F59E0B" },
                      ]}
                    >
                      {c.vendorConfirmed ? "Confirmed" : "Pending"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 7: REFUNDS & RETURNS */}
        {activeTab === "refunds" && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: moderateScale(10) }]}>
              Return & Refund Claims
            </Text>

            {refunds.length === 0 ? (
              <Text style={[styles.emptyNote, { color: textSecondary }]}>
                No return or refund requests recorded for this customer.
              </Text>
            ) : (
              refunds.map((r: any) => (
                <View key={r._id} style={styles.refundCard}>
                  <View style={styles.orderTopRow}>
                    <Text style={[styles.orderNumber, { color: textPrimary }]}>
                      Claim #{r.refundNumber || r._id}
                    </Text>
                    <RequestStatusBadge status={r.status} type="refund" />
                  </View>

                  <Text style={[styles.prodSub, { color: textSecondary, marginTop: moderateScale(4) }]}>
                    Reason: {r.reason || "Return requested"}
                  </Text>

                  <View style={styles.orderDetailRow}>
                    <Text style={[styles.orderLabel, { color: textSecondary }]}>Amount</Text>
                    <Text style={[styles.orderValBold, { color: "#EF4444" }]}>
                      Rs. {Number(r.amount || r.totalAmount || 0).toLocaleString()}
                    </Text>
                  </View>

                  {r.customerPayoutDetails ? (
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderLabel, { color: textSecondary }]}>Payout Method</Text>
                      <Text style={[styles.orderVal, { color: textPrimary }]}>
                        {r.customerPayoutDetails.method || "Direct Payout"} ({r.customerPayoutDetails.upiId || r.customerPayoutDetails.accountNumber || "Masked"})
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: moderateScale(40) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: moderateScale(14),
  },
  errorTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginTop: moderateScale(12),
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: moderateScale(13),
    textAlign: "center",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(16),
    paddingHorizontal: scale(20),
  },
  retryBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(44),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
  },
  topBarCenter: {
    flex: 1,
    marginLeft: scale(12),
  },
  topBarTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  topBarSubtitle: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(2),
  },
  iconBtn: {
    padding: scale(6),
  },
  scrollContent: {
    padding: scale(14),
    gap: moderateScale(12),
  },
  card: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  profileRow: {
    flexDirection: "row",
  },
  avatarImg: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(27),
  },
  avatarPlaceholder: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(27),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#0284C7",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerName: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
    marginLeft: scale(8),
  },
  statusBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  profileMeta: {
    fontSize: moderateScale(11),
    marginVertical: moderateScale(2),
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: moderateScale(4),
  },
  contactText: {
    fontSize: moderateScale(12),
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
  },
  kpiBox: {
    width: "48%",
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(12),
  },
  kpiLabel: {
    fontSize: moderateScale(11),
  },
  kpiVal: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    marginVertical: moderateScale(4),
  },
  kpiSub: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  tabScroll: {
    gap: scale(8),
    paddingVertical: moderateScale(4),
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: "#0284C7",
  },
  tabBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: moderateScale(12),
    color: "#0284C7",
    fontWeight: "600",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  prodInfo: {
    flex: 1,
    paddingRight: scale(10),
  },
  prodName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  prodSub: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(2),
  },
  prodAmount: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  emptyNote: {
    fontSize: moderateScale(12),
    fontStyle: "italic",
    paddingVertical: moderateScale(6),
  },
  emptySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingVertical: moderateScale(10),
  },
  emptySearchText: {
    fontSize: moderateScale(12),
    flex: 1,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(24),
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginTop: moderateScale(8),
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumber: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  orderDate: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(2),
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    marginVertical: moderateScale(8),
  },
  orderDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: moderateScale(3),
  },
  orderLabel: {
    fontSize: moderateScale(12),
  },
  orderVal: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  orderValBold: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  refundCard: {
    paddingVertical: moderateScale(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
});
