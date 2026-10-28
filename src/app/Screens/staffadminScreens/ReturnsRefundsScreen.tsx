import React, { useEffect, useState, useMemo } from "react";
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
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";
import { fetchRefundsQueueAdminApi } from "@/store/services/adminService";

export default function StaffAdminReturnsRefundsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);

  const loadRefunds = async () => {
    try {
      const res = await fetchRefundsQueueAdminApi({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res?.refunds || res?.data || Array.isArray(res)) {
        setRefunds(res.refunds || res.data || res);
      }
    } catch (e) {
      console.warn("[Refunds] Failed to load refunds queue", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadRefunds();
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRefunds();
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const orderNum = (r.orderNumber || r.order?.orderNumber || "").toLowerCase();
      const refNum = (r.refundNumber || "").toLowerCase();
      const custName = (r.customer?.name || "").toLowerCase();
      const vendorName = (
        r.vendor?.businessDetails?.businessName ||
        r.vendor?.businessName ||
        ""
      ).toLowerCase();
      return (
        orderNum.includes(q) ||
        refNum.includes(q) ||
        custName.includes(q) ||
        vendorName.includes(q)
      );
    });
  }, [refunds, searchQuery]);

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderItem = ({ item }: { item: any }) => {
    const isCod =
      item.isVendorFunded ||
      (item.originalPaymentMethod || "").toLowerCase().includes("cash");

    const orderNum = item.orderNumber || item.order?.orderNumber || "BM-ORDER";
    const custName = item.customer?.name || "Customer";
    const vendorName =
      item.vendor?.businessDetails?.businessName ||
      item.vendor?.businessName ||
      "Assigned Store";

    const productName =
      item.items?.[0]?.name ||
      item.order?.items?.[0]?.name ||
      "Purchased Product";
    const productQty = item.items?.[0]?.quantity || 1;

    return (
      <View
        style={[
          styles.refundCard,
          { backgroundColor: cardBg, borderColor: border },
        ]}
      >
        {/* Top Header: Claim ID & Status Badge */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.refundNum, { color: "#0284C7" }]}>
              {item.refundNumber || "REF-CLAIM"}
            </Text>
            <Text style={[styles.orderSub, { color: textSecondary }]}>
              Order #{orderNum}
            </Text>
          </View>
          <RequestStatusBadge status={item.status || "REQUESTED"} />
        </View>

        {/* Store & Customer Scope */}
        <View style={styles.scopeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.scopeLabel, { color: textSecondary }]}>STORE</Text>
            <Text style={[styles.scopeValue, { color: textPrimary }]} numberOfLines={1}>
              {vendorName}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.scopeLabel, { color: textSecondary }]}>CUSTOMER</Text>
            <Text style={[styles.scopeValue, { color: textPrimary }]} numberOfLines={1}>
              {custName}
            </Text>
          </View>
        </View>

        {/* Product Details & Amount */}
        <View style={[styles.productBox, { backgroundColor: isDark ? "#10161C" : "#F1F5F9" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={1}>
              {productName} &times; {productQty}
            </Text>
            <Text style={[styles.claimTypeLabel, { color: textSecondary }]}>
              Type: <Text style={{ fontWeight: "700", color: "#0284C7" }}>{item.claimType || "RETURN"}</Text>
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.amountLabel, { color: textSecondary }]}>REFUND AMOUNT</Text>
            <Text style={styles.amountValue}>NPR {item.amount || 0}</Text>
          </View>
        </View>

        {/* Payment & Refund Handler Distinction */}
        <View style={[styles.handlerPill, { backgroundColor: isCod ? (isDark ? "rgba(217, 119, 6, 0.15)" : "#FEF3C7") : (isDark ? "rgba(2, 132, 199, 0.15)" : "#E0F2FE") }]}>
          <MaterialCommunityIcons
            name={isCod ? "cash-multiple" : "shield-check"}
            size={scale(16)}
            color={isCod ? "#D97706" : "#0284C7"}
          />
          <Text
            style={[
              styles.handlerText,
              { color: isCod ? (isDark ? "#FBBF24" : "#B45309") : (isDark ? "#38BDF8" : "#0369A1") },
            ]}
          >
            {isCod
              ? `COD \u2022 Vendor-Managed Direct Settlement: ${item.status === "COMPLETED" ? "Vendor Confirmed Paid" : "Pending Vendor Payment"}`
              : `ONLINE \u2022 Super Admin Platform Refund: ${item.status === "COMPLETED" ? "Super Admin Completed" : "Pending Super Admin Processing"}`}
          </Text>
        </View>

        {/* View Details Button (Strictly Read-Only) */}
        <TouchableOpacity
          style={[styles.viewLogBtn, { borderColor: border }]}
          activeOpacity={0.7}
          onPress={() => setSelectedRefund(item)}
        >
          <Feather name="eye" size={scale(14)} color={textPrimary} />
          <Text style={[styles.viewLogBtnText, { color: textPrimary }]}>
            View Read-Only Audit Log
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StaffAdminHeader title="Refund & Returns Logs" showBack />

      {/* Staff Admin Notice Banner */}
      <View style={[styles.noticeBanner, { backgroundColor: isDark ? "rgba(2, 132, 199, 0.15)" : "#E0F2FE", borderColor: "#38BDF8" }]}>
        <Ionicons name="information-circle" size={scale(18)} color="#0284C7" />
        <Text style={[styles.noticeText, { color: isDark ? "#E0F2FE" : "#0369A1" }]}>
          Staff Admin Read-Only Monitor. Super Admin processes online refunds; Vendors settle COD claims directly. Staff Admins have zero operational or financial authority.
        </Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {["ALL", "REQUESTED", "APPROVED", "COMPLETED", "REJECTED"].map((st) => (
          <TouchableOpacity
            key={st}
            style={[
              styles.filterChip,
              statusFilter === st && styles.filterChipActive,
              isDark && statusFilter !== st && { backgroundColor: "#151D24", borderColor: "#263238" },
            ]}
            onPress={() => setStatusFilter(st)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === st && styles.filterChipTextActive,
                isDark && statusFilter !== st && { color: "#94A3B8" },
              ]}
            >
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Input */}
      <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor: border }]}>
        <Feather name="search" size={scale(16)} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Search by Order #, Claim #, Store, Customer..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={scale(16)} color={textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Refunds List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            Loading refund logs...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRefunds}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0284C7"]} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Feather name="inbox" size={scale(40)} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No refund requests match your filter.
              </Text>
            </View>
          }
        />
      )}

      {/* ── READ-ONLY AUDIT DETAIL MODAL ── */}
      {selectedRefund && (
        <Modal
          visible={!!selectedRefund}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedRefund(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalTitle, { color: textPrimary }]}>
                      Claim Audit #{selectedRefund.refundNumber}
                    </Text>
                    <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>
                      Order #{selectedRefund.orderNumber || selectedRefund.order?.orderNumber}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRefund(null)}>
                    <Feather name="x" size={scale(20)} color={textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Status & Amount */}
                <View style={[styles.modalBox, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: moderateScale(13), fontWeight: "700", color: textPrimary }}>
                      Refund Status
                    </Text>
                    <RequestStatusBadge status={selectedRefund.status} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: scale(8) }}>
                    <Text style={{ fontSize: moderateScale(13), fontWeight: "700", color: textPrimary }}>
                      Refund Amount
                    </Text>
                    <Text style={{ fontSize: moderateScale(15), fontWeight: "900", color: "#0284C7" }}>
                      NPR {selectedRefund.amount || 0}
                    </Text>
                  </View>
                </View>

                {/* Handler Details: COD vs Online */}
                <View style={[styles.modalBox, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                  <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: textPrimary, marginBottom: scale(6), textTransform: "uppercase" }}>
                    Refund Payout Accountability
                  </Text>
                  {selectedRefund.isVendorFunded || (selectedRefund.originalPaymentMethod || "").toLowerCase().includes("cash") ? (
                    <View style={{ gap: scale(4) }}>
                      <Text style={{ fontSize: moderateScale(12), color: "#D97706", fontWeight: "700" }}>
                        Handler: Responsible Vendor (Cash on Delivery)
                      </Text>
                      <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>
                        Vendor Status: {selectedRefund.vendorPaymentDetails?.confirmedByVendor ? "Vendor Confirmed Paid" : "Pending Vendor Action"}
                      </Text>
                      {selectedRefund.vendorPaymentDetails?.transactionReference ? (
                        <Text style={{ fontSize: moderateScale(11), color: textPrimary, fontWeight: "600" }}>
                          Vendor Payment Ref: {selectedRefund.vendorPaymentDetails.transactionReference}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={{ gap: scale(4) }}>
                      <Text style={{ fontSize: moderateScale(12), color: "#0284C7", fontWeight: "700" }}>
                        Handler: Super Admin (Online Gateway Reversal)
                      </Text>
                      <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>
                        Super Admin Status: {selectedRefund.status}
                      </Text>
                      {selectedRefund.customerPayoutDetails?.payoutReference ? (
                        <Text style={{ fontSize: moderateScale(11), color: textPrimary, fontWeight: "600" }}>
                          Gateway Ref: {selectedRefund.customerPayoutDetails.payoutReference}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Inspection Report */}
                {selectedRefund.inspection && (
                  <View style={[styles.modalBox, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                    <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: textPrimary, marginBottom: scale(4), textTransform: "uppercase" }}>
                      Return Inspection Result
                    </Text>
                    <Text style={{ fontSize: moderateScale(12), color: textPrimary }}>
                      Condition: <Text style={{ fontWeight: "800", color: "#0284C7" }}>{selectedRefund.inspection.condition || "Inspected"}</Text>
                    </Text>
                    <Text style={{ fontSize: moderateScale(11), color: textSecondary, marginTop: scale(2) }}>
                      Verdict: {selectedRefund.inspection.result || "PENDING"} \u2022 Collected: {selectedRefund.inspection.quantityCollected || 1}
                    </Text>
                    {selectedRefund.inspection.notes ? (
                      <Text style={{ fontSize: moderateScale(11), color: textSecondary, marginTop: scale(4) }}>
                        Notes: {selectedRefund.inspection.notes}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Customer Claim Reason */}
                <View style={[styles.modalBox, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                  <Text style={{ fontSize: moderateScale(12), fontWeight: "800", color: textPrimary, marginBottom: scale(4), textTransform: "uppercase" }}>
                    Customer Reason
                  </Text>
                  <Text style={{ fontSize: moderateScale(12), color: textPrimary, fontWeight: "600" }}>
                    {selectedRefund.reason}
                  </Text>
                  {selectedRefund.description ? (
                    <Text style={{ fontSize: moderateScale(11), color: textSecondary, marginTop: scale(4) }}>
                      {selectedRefund.description}
                    </Text>
                  ) : null}
                </View>

                {/* Read-Only Notice */}
                <View style={{ padding: scale(10), borderRadius: scale(8), backgroundColor: isDark ? "#1A232C" : "#F1F5F9", marginVertical: scale(10) }}>
                  <Text style={{ fontSize: moderateScale(11), color: textSecondary, textAlign: "center" }}>
                    Staff Admin accounts have read-only audit permissions. All operational actions must be performed by Super Admin or the responsible Vendor.
                  </Text>
                </View>

                <TouchableOpacity
                  style={{ paddingVertical: scale(12), borderRadius: scale(8), backgroundColor: "#0284C7", alignItems: "center" }}
                  onPress={() => setSelectedRefund(null)}
                >
                  <Text style={{ fontSize: moderateScale(13), fontWeight: "800", color: "#FFFFFF" }}>
                    Close Log
                  </Text>
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
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    marginHorizontal: scale(14),
    marginTop: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: scale(8),
  },
  noticeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    flex: 1,
  },
  filterBar: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  filterChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(14),
    paddingHorizontal: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    height: scale(42),
    gap: scale(8),
    marginBottom: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  listContent: {
    paddingHorizontal: scale(14),
    paddingBottom: scale(24),
    gap: scale(12),
  },
  refundCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: scale(10),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refundNum: {
    fontSize: moderateScale(14),
    fontWeight: "900",
  },
  orderSub: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginTop: scale(2),
  },
  scopeRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  scopeLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scopeValue: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(2),
  },
  productBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(8),
  },
  productName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  claimTypeLabel: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  amountLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  amountValue: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    color: "#0284C7",
    marginTop: scale(2),
  },
  handlerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    gap: scale(6),
  },
  handlerText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    flex: 1,
  },
  viewLogBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  viewLogBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(40),
    gap: scale(8),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  emptyText: {
    fontSize: moderateScale(13),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(16),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(12),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "900",
  },
  modalBox: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(10),
    marginBottom: scale(10),
  },
});
