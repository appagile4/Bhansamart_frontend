import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminTransactions,
  fetchAdminWithdrawals,
  reviewAdminWithdrawal,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function AdminFinanceScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<"withdrawals" | "ledger">("withdrawals");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [payoutReference, setPayoutReference] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [actionLoading, setActionLoading] = useState(false);
  const [txnPage, setTxnPage] = useState(1);
  const [isLoadingMoreTxn, setIsLoadingMoreTxn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { withdrawals, transactions, transactionsTotal, stats, loading } = useAppSelector(
    (state) => state.admin
  );
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "superadmin";

  const loadData = async (fresh = false) => {
    if (fresh) setIsRefreshing(true);
    setTxnPage(1);
    try {
      await Promise.all([
        dispatch(fetchAdminWithdrawals({ status: "ALL" })),
        dispatch(fetchAdminTransactions({ page: 1, limit: 15 })),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const handleLoadMoreTransactions = async () => {
    if (isLoadingMoreTxn || loading) return;
    if (transactions.length >= transactionsTotal && transactionsTotal > 0) return;

    const nextPage = txnPage + 1;
    setIsLoadingMoreTxn(true);
    try {
      await dispatch(
        fetchAdminTransactions({
          page: nextPage,
          limit: 15,
        }),
      ).unwrap();
      setTxnPage(nextPage);
    } catch (err) {
      console.error("Failed to load more transactions", err);
    } finally {
      setIsLoadingMoreTxn(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedWithdrawal) return;

    if (reviewAction === "REJECT" && !rejectionReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for declining this withdrawal.");
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(
        reviewAdminWithdrawal({
          id: selectedWithdrawal._id,
          action: reviewAction,
          payoutReference: payoutReference.trim(),
          reason: rejectionReason.trim(),
        })
      ).unwrap();

      Alert.alert(
        "Settlement Processed",
        `Withdrawal has been marked as ${reviewAction === "APPROVE" ? "SETTLED" : "DECLINED"}.`
      );
      setSelectedWithdrawal(null);
      setPayoutReference("");
      setRejectionReason("");
      loadData();
    } catch (err: any) {
      Alert.alert("Action Failed", err?.message || "Could not process withdrawal decision");
    } finally {
      setActionLoading(false);
    }
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (!isSuperAdmin) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: bg }]}>
        <Feather name="shield-off" size={scale(48)} color="#EF4444" />
        <Text style={[styles.deniedTitle, { color: textPrimary }]}>Superadmin Restricted</Text>
        <Text style={[styles.deniedSub, { color: textSecondary }]}>
          Financial ledgers and withdrawal approvals are strictly reserved for Superadmin.
        </Text>
      </View>
    );
  }

  const fin = stats?.kpi?.finances;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Financial Ledger" subtitle="1.5% Commission & Withdrawals" />
      {/* Financial KPI Banner */}
      <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[styles.kpiHeader, { color: textPrimary }]}>
          Platform 1.5% Commission & Settlement Overview
        </Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>Total Platform Commission</Text>
            <Text style={[styles.kpiVal, { color: "#10B981" }]}>
              NPR {fin?.netCommissionEarned || 0}
            </Text>
          </View>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>Gross Sales Paid</Text>
            <Text style={[styles.kpiVal, { color: textPrimary }]}>
              NPR {fin?.grossTransactions || 0}
            </Text>
          </View>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>Vendor Net Earnings</Text>
            <Text style={[styles.kpiVal, { color: textPrimary }]}>
              NPR {fin?.vendorGrossEarnings || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: cardBg, borderColor: border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "withdrawals" && styles.tabBtnActive]}
          onPress={() => setActiveTab("withdrawals")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "withdrawals" && styles.tabTextActive,
              isDark && activeTab !== "withdrawals" && { color: "#94A3B8" },
            ]}
          >
            Vendor Withdrawals ({withdrawals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "ledger" && styles.tabBtnActive]}
          onPress={() => setActiveTab("ledger")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ledger" && styles.tabTextActive,
              isDark && activeTab !== "ledger" && { color: "#94A3B8" },
            ]}
          >
            Financial Ledger ({transactions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Withdrawals */}
      {activeTab === "withdrawals" && (
        <FlatList
          data={withdrawals}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} colors={["#0284C7"]} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={scale(48)} color="#10B981" />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>All Clear</Text>
                <Text style={[styles.emptySub, { color: textSecondary }]}>
                  No withdrawal requests pending approval.
                </Text>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => {
            const isPending = item.status === "PENDING";
            const isSettled = item.status === "SETTLED";

            return (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={[styles.vendorTitle, { color: textPrimary }]}>
                      {item.vendor?.businessDetails?.businessName || "Vendor Store"}
                    </Text>
                    <Text style={[styles.cardSub, { color: textSecondary }]}>
                      Requested: {new Date(item.createdAt).toLocaleDateString()} &bull; Phone: {item.vendor?.sellerDetails?.sellerPhone}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isSettled
                          ? "rgba(16, 185, 129, 0.2)"
                          : isPending
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: moderateScale(10),
                        fontWeight: "800",
                        color: isSettled ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: border }]} />

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountLabel}>Requested Amount</Text>
                    <Text style={[styles.amountVal, { color: textPrimary }]}>
                      NPR {item.amount}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>Available Wallet</Text>
                    <Text style={[styles.amountVal, { color: "#10B981" }]}>
                      NPR {item.vendor?.wallet?.currentBalance || 0}
                    </Text>
                  </View>
                </View>

                {item.notes ? (
                  <Text style={[styles.notesText, { color: textSecondary }]}>
                    Note: {item.notes}
                  </Text>
                ) : null}

                {isPending && (
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: "#EF4444" }]}
                      onPress={() => {
                        setSelectedWithdrawal(item);
                        setReviewAction("REJECT");
                      }}
                    >
                      <Feather name="x" size={scale(14)} color="#EF4444" />
                      <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: moderateScale(12) }}>
                        Decline
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#10B981", borderColor: "#10B981" }]}
                      onPress={() => {
                        setSelectedWithdrawal(item);
                        setReviewAction("APPROVE");
                      }}
                    >
                      <Feather name="check" size={scale(14)} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: moderateScale(12) }}>
                        Approve & Pay
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Tab 2: Financial Ledger */}
      {activeTab === "ledger" && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} colors={["#0284C7"]} />
          }
          onEndReached={handleLoadMoreTransactions}
          onEndReachedThreshold={0.4}
          ListFooterComponent={() => {
            if (isLoadingMoreTxn) {
              return (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#0284C7" />
                  <Text style={[styles.footerLoaderText, { color: textSecondary }]}>
                    Loading more transactions...
                  </Text>
                </View>
              );
            }
            if (transactions.length > 0 && transactions.length >= transactionsTotal) {
              return (
                <View style={styles.footerEnd}>
                  <View style={[styles.footerLine, { backgroundColor: border }]} />
                  <Text style={[styles.footerEndText, { color: textSecondary }]}>
                    All {transactionsTotal} transactions loaded
                  </Text>
                  <View style={[styles.footerLine, { backgroundColor: border }]} />
                </View>
              );
            }
            return <View style={{ height: scale(24) }} />;
          }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={[styles.txnType, { color: textPrimary }]}>{item.type}</Text>
                  <Text style={[styles.cardSub, { color: textSecondary }]}>
                    {item.vendor?.businessDetails?.businessName || "Store"} &bull; {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txnAmount,
                    { color: item.netAmount >= 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {item.netAmount >= 0 ? `+NPR ${item.netAmount}` : `-NPR ${Math.abs(item.netAmount)}`}
                </Text>
              </View>

              {item.commission ? (
                <View style={styles.commissionRow}>
                  <Text style={{ fontSize: moderateScale(11), color: "#64748B" }}>
                    Platform 1.5% Fee: NPR {item.commission}
                  </Text>
                  <Text style={{ fontSize: moderateScale(11), color: "#64748B" }}>
                    Gross Base: NPR {item.grossAmount}
                  </Text>
                </View>
              ) : null}

              {item.notes ? (
                <Text style={[styles.notesText, { color: textSecondary }]}>{item.notes}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      {/* ── Review Withdrawal Modal ─────────────────────────────────────── */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              {reviewAction === "APPROVE" ? "Approve Withdrawal Payout" : "Decline Withdrawal Request"}
            </Text>
            <Text style={[styles.modalSub, { color: textSecondary }]}>
              Store: {selectedWithdrawal?.vendor?.businessDetails?.businessName} &bull; Amount: NPR {selectedWithdrawal?.amount}
            </Text>

            {reviewAction === "APPROVE" ? (
              <View style={{ marginTop: scale(10) }}>
                <Text style={[styles.inputLabel, { color: textPrimary }]}>
                  Bank / Gateway Transaction Reference
                </Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                  placeholder="e.g. NIMB-TRF-982341 or Khalti Ref"
                  placeholderTextColor="#94A3B8"
                  value={payoutReference}
                  onChangeText={setPayoutReference}
                />
              </View>
            ) : (
              <View style={{ marginTop: scale(10) }}>
                <Text style={[styles.inputLabel, { color: textPrimary }]}>Decline Reason *</Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                  placeholder="Reason for declining withdrawal..."
                  placeholderTextColor="#94A3B8"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                />
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isDark ? "#303B45" : "#E2E8F0" }]}
                onPress={() => setSelectedWithdrawal(null)}
              >
                <Text style={{ color: textPrimary, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: reviewAction === "APPROVE" ? "#10B981" : "#EF4444" },
                ]}
                onPress={handleReviewSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    {reviewAction === "APPROVE" ? "Confirm Payout" : "Confirm Decline"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: scale(20),
  },
  deniedTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginTop: scale(12),
  },
  deniedSub: {
    fontSize: moderateScale(13),
    marginTop: scale(4),
    textAlign: "center",
  },
  kpiCard: {
    padding: scale(14),
    borderBottomWidth: 1,
  },
  kpiHeader: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    marginBottom: scale(8),
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kpiCol: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    fontWeight: "600",
  },
  kpiVal: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    marginTop: scale(2),
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: scale(12),
    paddingTop: scale(8),
    gap: scale(10),
  },
  tabBtn: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: "#0284C7",
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#0284C7",
    fontWeight: "700",
  },
  listContent: {
    padding: scale(12),
    gap: scale(10),
    paddingBottom: scale(40),
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: scale(60),
    gap: scale(6),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  emptySub: {
    fontSize: moderateScale(12),
  },
  card: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  vendorTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  cardSub: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  statusPill: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scale(10),
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountLabel: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
  },
  amountVal: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: scale(2),
  },
  notesText: {
    fontSize: moderateScale(11),
    marginTop: scale(8),
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(12),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  txnType: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  txnAmount: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  commissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(6),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: scale(20),
  },
  modalCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(20),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSub: {
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: scale(4),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: scale(42),
    fontSize: moderateScale(13),
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(16),
  },
  modalBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
  },
  footerLoaderText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(10),
  },
  footerLine: {
    flex: 1,
    height: 1,
  },
  footerEndText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
});
