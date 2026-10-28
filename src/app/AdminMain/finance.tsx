import React, { useEffect, useMemo, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminDashboardStats,
  fetchAdminTransactions,
  fetchAdminWithdrawals,
  reviewAdminWithdrawal,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

type WithdrawalFilter = "ALL" | "PENDING" | "SETTLED" | "REJECTED";
type LedgerFilter = "ALL" | "COD_FLOW" | "ORDER_EARNING" | "REFUNDS" | "WITHDRAWALS";

export default function AdminFinanceScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<"withdrawals" | "ledger">("withdrawals");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [withdrawalFilter, setWithdrawalFilter] = useState<WithdrawalFilter>("ALL");
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("ALL");
  const [search, setSearch] = useState("");

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
        dispatch(fetchAdminDashboardStats()),
        dispatch(fetchAdminWithdrawals({ status: "ALL" })),
        dispatch(
          fetchAdminTransactions({
            page: 1,
            limit: 15,
            search: search.trim() || undefined,
          })
        ),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const handleSearchSubmit = () => {
    setTxnPage(1);
    dispatch(
      fetchAdminTransactions({
        page: 1,
        limit: 15,
        search: search.trim() || undefined,
      })
    );
  };

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
          search: search.trim() || undefined,
        })
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
      loadData(true);
    } catch (err: any) {
      Alert.alert("Action Failed", err?.message || "Could not process withdrawal decision");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    return (withdrawals || []).filter((w: any) => {
      const st = (w.status || "PENDING").toUpperCase();
      if (withdrawalFilter === "PENDING") return st === "PENDING" || st === "SUBMITTED";
      if (withdrawalFilter === "SETTLED") return st === "SETTLED" || st === "COMPLETED";
      if (withdrawalFilter === "REJECTED") return st === "REJECTED" || st === "FAILED" || st === "DECLINED";
      return true;
    });
  }, [withdrawals, withdrawalFilter]);

  // Filtered transactions for active ledger sub-tab
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx: any) => {
      const type = (tx.type || "").toUpperCase();
      if (ledgerFilter === "COD_FLOW") {
        return (
          type.includes("COD") ||
          type.includes("DIRECT_QR") ||
          (tx.paymentMethod || "").toLowerCase().includes("cash")
        );
      }
      if (ledgerFilter === "ORDER_EARNING") {
        return type === "ORDER_EARNING";
      }
      if (ledgerFilter === "REFUNDS") {
        return type.includes("REFUND") || type.includes("REVERSAL") || type.includes("RECOVERY");
      }
      if (ledgerFilter === "WITHDRAWALS") {
        return type.includes("WITHDRAWAL");
      }
      return true;
    });
  }, [transactions, ledgerFilter]);

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
          Financial ledgers and withdrawal settlements are strictly reserved for Superadmin.
        </Text>
      </View>
    );
  }

  const fin = stats?.kpi?.finances;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader
        title="Finance & Settlement"
        subtitle="1.5% Online Fee & 0% COD Transparent Accounting"
      />

      {/* ══ TOP TRANSPARENT FINANCIAL KPI BANNER ══ */}
      <View style={[styles.kpiContainer, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.kpiTitleRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
            <MaterialCommunityIcons name="shield-check" size={scale(18)} color="#10B981" />
            <Text style={[styles.kpiTitle, { color: textPrimary }]}>
              Verified Platform Financial Summary
            </Text>
          </View>
          <TouchableOpacity onPress={() => loadData(true)} activeOpacity={0.7}>
            <Feather name="rotate-cw" size={scale(14)} color="#0284C7" />
          </TouchableOpacity>
        </View>

        <View style={styles.kpiGrid}>
          {/* Card 1: Platform Commission */}
          <LinearGradient
            colors={isDark ? (["#1E1B4B", "#0F172A"] as const) : (["#F5F3FF", "#EDE9FE"] as const)}
            style={[styles.kpiBox, { borderColor: isDark ? "#4338CA" : "#DDD6FE" }]}
          >
            <View style={styles.kpiBoxHeader}>
              <Text style={[styles.kpiMiniLabel, { color: isDark ? "#C4B5FD" : "#6D28D9" }]}>
                PLATFORM COMMISSION
              </Text>
              <MaterialCommunityIcons name="percent" size={scale(16)} color="#A855F7" />
            </View>
            <Text style={[styles.kpiLargeVal, { color: "#A855F7" }]}>
              NPR {(fin?.netCommissionEarned || 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiSubText, { color: isDark ? "#A78BFA" : "#7C3AED" }]}>
              Fixed 1.5% online (0% on COD)
            </Text>
          </LinearGradient>

          {/* Card 2: Total Gross Sales */}
          <LinearGradient
            colors={isDark ? (["#082F49", "#0F172A"] as const) : (["#F0F9FF", "#E0F2FE"] as const)}
            style={[styles.kpiBox, { borderColor: isDark ? "#0369A1" : "#BAE6FD" }]}
          >
            <View style={styles.kpiBoxHeader}>
              <Text style={[styles.kpiMiniLabel, { color: isDark ? "#BAE6FD" : "#0369A1" }]}>
                GROSS SALES PROCESSED
              </Text>
              <MaterialCommunityIcons name="cash-multiple" size={scale(16)} color="#0284C7" />
            </View>
            <Text style={[styles.kpiLargeVal, { color: textPrimary }]}>
              NPR {(fin?.grossTransactions || 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiSubText, { color: textSecondary }]}>
              Across prepaid & COD orders
            </Text>
          </LinearGradient>

          {/* Card 3: Vendor Wallet Balance */}
          <LinearGradient
            colors={isDark ? (["#064E3B", "#0F172A"] as const) : (["#ECFDF5", "#D1FAE5"] as const)}
            style={[styles.kpiBox, { borderColor: isDark ? "#059669" : "#A7F3D0" }]}
          >
            <View style={styles.kpiBoxHeader}>
              <Text style={[styles.kpiMiniLabel, { color: isDark ? "#A7F3D0" : "#047857" }]}>
                TOTAL VENDOR WALLETS
              </Text>
              <MaterialCommunityIcons name="wallet-outline" size={scale(16)} color="#10B981" />
            </View>
            <Text style={[styles.kpiLargeVal, { color: "#10B981" }]}>
              NPR {(fin?.vendorWalletBalances || 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiSubText, { color: textSecondary }]}>
              Current withdrawable custody
            </Text>
          </LinearGradient>

          {/* Card 4: Total Payouts Settled */}
          <LinearGradient
            colors={isDark ? (["#451A03", "#0F172A"] as const) : (["#FFFBEB", "#FEF3C7"] as const)}
            style={[styles.kpiBox, { borderColor: isDark ? "#D97706" : "#FDE68A" }]}
          >
            <View style={styles.kpiBoxHeader}>
              <Text style={[styles.kpiMiniLabel, { color: isDark ? "#FDE68A" : "#B45309" }]}>
                PAYOUTS DISBURSED
              </Text>
              <MaterialCommunityIcons name="bank-check" size={scale(16)} color="#F59E0B" />
            </View>
            <Text style={[styles.kpiLargeVal, { color: "#F59E0B" }]}>
              NPR {(fin?.totalWithdrawalsPaid || 0).toLocaleString()}
            </Text>
            <Text style={[styles.kpiSubText, { color: textSecondary }]}>
              Settled to vendor bank A/Cs
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* ══ PRIMARY TABS: WITHDRAWALS & FINANCIAL LEDGER ══ */}
      <View style={[styles.tabBar, { backgroundColor: cardBg, borderColor: border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "withdrawals" && styles.tabBtnActive]}
          onPress={() => setActiveTab("withdrawals")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
            <MaterialCommunityIcons
              name="bank-transfer"
              size={scale(16)}
              color={activeTab === "withdrawals" ? "#0284C7" : textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "withdrawals" && styles.tabTextActive,
                activeTab !== "withdrawals" && { color: textSecondary },
              ]}
            >
              Vendor Payouts ({withdrawals.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "ledger" && styles.tabBtnActive]}
          onPress={() => setActiveTab("ledger")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
            <MaterialCommunityIcons
              name="book-open-outline"
              size={scale(16)}
              color={activeTab === "ledger" ? "#0284C7" : textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "ledger" && styles.tabTextActive,
                activeTab !== "ledger" && { color: textSecondary },
              ]}
            >
              Financial Ledger ({transactionsTotal || transactions.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ══ TAB 1: VENDOR WITHDRAWALS & PAYOUT DECISIONS ══ */}
      {activeTab === "withdrawals" && (
        <View style={{ flex: 1 }}>
          {/* Sub-Filter Chips & View Switcher for Withdrawals */}
          <View style={[styles.subFilterRow, { borderBottomColor: border, backgroundColor: cardBg }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: scale(8), flexGrow: 1 }}>
              {(
                [
                  { id: "ALL", label: `All (${withdrawals.length})` },
                  {
                    id: "PENDING",
                    label: `Pending Approval (${withdrawals.filter((w) => w.status === "PENDING").length})`,
                  },
                  {
                    id: "SETTLED",
                    label: `Settled (${withdrawals.filter((w) => w.status === "SETTLED").length})`,
                  },
                  {
                    id: "REJECTED",
                    label: `Declined (${withdrawals.filter((w) => w.status === "REJECTED" || w.status === "FAILED").length})`,
                  },
                ] as const
              ).map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.filterChip,
                    withdrawalFilter === f.id && styles.filterChipActive,
                    withdrawalFilter !== f.id && { backgroundColor: isDark ? "#1E252E" : "#F1F5F9" },
                  ]}
                  onPress={() => setWithdrawalFilter(f.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      withdrawalFilter === f.id && styles.filterChipTextActive,
                      withdrawalFilter !== f.id && { color: textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* View Mode Toggle: Grid vs List */}
            <View style={[styles.viewToggle, { backgroundColor: isDark ? "#1E252E" : "#F1F5F9", borderColor: border }]}>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === "list" && styles.viewToggleBtnActive]}
                onPress={() => setViewMode("list")}
                activeOpacity={0.7}
              >
                <Feather name="list" size={scale(15)} color={viewMode === "list" ? "#FFFFFF" : textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === "grid" && styles.viewToggleBtnActive]}
                onPress={() => setViewMode("grid")}
                activeOpacity={0.7}
              >
                <Feather name="grid" size={scale(15)} color={viewMode === "grid" ? "#FFFFFF" : textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            key={`withdrawals_${viewMode}`}
            data={filteredWithdrawals}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.listContent,
              viewMode === "grid" && styles.gridListContent,
            ]}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} colors={["#0284C7"]} />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={scale(48)} color="#10B981" />
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Requests in this Queue</Text>
                  <Text style={[styles.emptySub, { color: textSecondary }]}>
                    All vendor payout requests under selected filter are clear.
                  </Text>
                </View>
              ) : undefined
            }
            renderItem={({ item }) => {
              const isPending = item.status === "PENDING" || item.status === "SUBMITTED";
              const isSettled = item.status === "SETTLED" || item.status === "COMPLETED";
              const isDeclined = item.status === "REJECTED" || item.status === "FAILED";

              const storeName =
                item.vendor?.businessDetails?.businessName ||
                item.vendor?.brandDetails?.brandName ||
                item.vendor?.sellerDetails?.sellerName ||
                "Registered Store";

              const sellerPhone =
                item.vendor?.sellerDetails?.sellerPhone ||
                item.vendor?.businessDetails?.businessPhone ||
                item.vendor?.phone ||
                "No phone";

              const bank = item.vendor?.bankDetails || {};
              const bankName = bank.bankName || "Direct Bank Settlement";
              const accNumber = bank.accountNumber || "Not recorded";
              const accHolder = bank.accountHolderName || storeName;
              const branch = bank.branch || bank.ifscCode || "Head Branch";
              const availableWallet = item.vendor?.wallet?.currentBalance || 0;

              // ─── GRID VIEW CARD FOR WITHDRAWAL ───
              if (viewMode === "grid") {
                return (
                  <View style={[styles.withdrawalGridCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.gridCardHeader}>
                      <Text style={[styles.gridStoreTitle, { color: textPrimary }]} numberOfLines={1}>
                        {storeName}
                      </Text>
                      <View
                        style={[
                          styles.gridStatusPill,
                          {
                            backgroundColor: isSettled
                              ? "rgba(16, 185, 129, 0.15)"
                              : isPending
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gridStatusText,
                            {
                              color: isSettled ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.status || "PENDING"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.gridStatLabel}>REQUESTED PAYOUT</Text>
                    <Text style={[styles.gridPayoutAmount, { color: textPrimary }]} numberOfLines={1}>
                      NPR {(item.amount || 0).toLocaleString()}
                    </Text>

                    <View style={styles.gridBankRow}>
                      <MaterialCommunityIcons name="bank-outline" size={scale(11)} color="#0284C7" />
                      <Text style={[styles.gridBankText, { color: textSecondary }]} numberOfLines={1}>
                        {bankName}
                      </Text>
                    </View>
                    <Text style={[styles.gridAccSub, { color: textSecondary }]} numberOfLines={1}>
                      A/C: {accNumber}
                    </Text>

                    <View style={[styles.gridDivider, { backgroundColor: border }]} />

                    {isPending ? (
                      <TouchableOpacity
                        style={styles.gridReviewBtn}
                        onPress={() => {
                          setSelectedWithdrawal(item);
                          setReviewAction("APPROVE");
                        }}
                      >
                        <Text style={styles.gridReviewBtnText}>Review & Settle</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.gridSettledWrap}>
                        <MaterialCommunityIcons
                          name={isSettled ? "check-circle" : "close-circle"}
                          size={scale(11)}
                          color={isSettled ? "#10B981" : "#EF4444"}
                        />
                        <Text
                          style={[styles.gridSettledText, { color: isSettled ? "#10B981" : "#EF4444" }]}
                          numberOfLines={1}
                        >
                          {isSettled ? (item.payoutReference ? `Ref: ${item.payoutReference}` : "Completed") : "Declined"}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }

              return (
                <View style={[styles.cardDetailed, { backgroundColor: cardBg, borderColor: border }]}>
                  {/* Card Header: Store & Status Pill */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, marginRight: scale(8) }}>
                      <Text style={[styles.vendorTitle, { color: textPrimary }]} numberOfLines={1}>
                        {storeName}
                      </Text>
                      <Text style={[styles.cardSub, { color: textSecondary }]}>
                        Seller: {item.vendor?.sellerDetails?.sellerName || "Store Owner"} &bull; {sellerPhone}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isSettled
                            ? "rgba(16, 185, 129, 0.15)"
                            : isPending
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isSettled ? "#10B981" : isPending ? "#F59E0B" : "#EF4444",
                          },
                        ]}
                      >
                        {item.status || "PENDING"}
                      </Text>
                    </View>
                  </View>

                  {/* Transparent Bank Account Credentials Box */}
                  <View
                    style={[
                      styles.bankCredsBox,
                      {
                        backgroundColor: isDark ? "#121A21" : "#F8FAFC",
                        borderColor: border,
                      },
                    ]}
                  >
                    <View style={styles.bankHeaderRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                        <MaterialCommunityIcons name="bank" size={scale(15)} color="#0284C7" />
                        <Text style={[styles.bankNameText, { color: textPrimary }]}>{bankName}</Text>
                      </View>
                      <Text style={[styles.branchText, { color: textSecondary }]}>{branch}</Text>
                    </View>

                    <View style={styles.bankFieldsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.miniFieldLabel, { color: textSecondary }]}>ACCOUNT NUMBER</Text>
                        <Text style={[styles.miniFieldValue, { color: textPrimary }]}>{accNumber}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.miniFieldLabel, { color: textSecondary }]}>BENEFICIARY HOLDER</Text>
                        <Text style={[styles.miniFieldValue, { color: textPrimary }]} numberOfLines={1}>
                          {accHolder}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Financial Amounts Row */}
                  <View style={[styles.amountsGrid, { borderTopColor: border }]}>
                    <View>
                      <Text style={[styles.amountLabel, { color: textSecondary }]}>REQUESTED PAYOUT</Text>
                      <Text style={[styles.amountValLarge, { color: textPrimary }]}>
                        NPR {(item.amount || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.amountLabel, { color: textSecondary }]}>AVAILABLE WALLET</Text>
                      <Text style={[styles.amountValLarge, { color: "#10B981" }]}>
                        NPR {availableWallet.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Notes / Settlement References */}
                  {item.bankReference || item.payoutReference ? (
                    <View style={[styles.auditRow, { backgroundColor: "rgba(16, 185, 129, 0.08)" }]}>
                      <Feather name="check-circle" size={scale(13)} color="#10B981" />
                      <Text style={[styles.auditText, { color: "#10B981" }]}>
                        UTR / Bank Ref: {item.payoutReference || item.bankReference}
                      </Text>
                    </View>
                  ) : null}

                  {isDeclined && item.rejectionReason ? (
                    <View style={[styles.auditRow, { backgroundColor: "rgba(239, 68, 68, 0.08)" }]}>
                      <Feather name="alert-circle" size={scale(13)} color="#EF4444" />
                      <Text style={[styles.auditText, { color: "#EF4444" }]}>
                        Decline Reason: {item.rejectionReason}
                      </Text>
                    </View>
                  ) : null}

                  {item.notes ? (
                    <Text style={[styles.notesBubble, { color: textSecondary }]}>
                      &bull; {item.notes}
                    </Text>
                  ) : null}

                  {/* Superadmin Action Buttons for PENDING */}
                  {isPending && (
                    <View style={styles.actionsBtnRow}>
                      <TouchableOpacity
                        style={[styles.declineBtn, { borderColor: "#EF4444" }]}
                        onPress={() => {
                          setSelectedWithdrawal(item);
                          setReviewAction("REJECT");
                        }}
                      >
                        <Feather name="x" size={scale(14)} color="#EF4444" />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => {
                          setSelectedWithdrawal(item);
                          setReviewAction("APPROVE");
                        }}
                      >
                        <Feather name="check" size={scale(14)} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>Approve & Transfer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ══ TAB 2: FINANCIAL LEDGER & 100% TRANSPARENT ACCOUNTING ══ */}
      {activeTab === "ledger" && (
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={[styles.searchBoxWrap, { backgroundColor: cardBg, borderColor: border }]}>
            <TouchableOpacity onPress={handleSearchSubmit}>
              <Feather name="search" size={scale(16)} color="#94A3B8" />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search by order #, notes or payment method..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={(txt) => {
                setSearch(txt);
                if (txt === "") {
                  setTxnPage(1);
                  loadData(true);
                }
              }}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                  setTxnPage(1);
                  loadData(true);
                }}
              >
                <Feather name="x" size={scale(16)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Sub-Filter Chips & View Switcher for Ledger */}
          <View style={[styles.subFilterRow, { borderBottomColor: border, backgroundColor: cardBg }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: scale(8), flexGrow: 1 }}>
              {(
                [
                  { id: "ALL", label: `All Transactions (${transactions.length})` },
                  { id: "COD_FLOW", label: "Cash on Delivery Flow (0% Fee)" },
                  { id: "ORDER_EARNING", label: "Product Sale Credits" },
                  { id: "REFUNDS", label: "Refunds & Reversals" },
                  { id: "WITHDRAWALS", label: "Bank Payouts" },
                ] as const
              ).map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.filterChip,
                    ledgerFilter === f.id && styles.filterChipActive,
                    ledgerFilter !== f.id && { backgroundColor: isDark ? "#1E252E" : "#F1F5F9" },
                  ]}
                  onPress={() => setLedgerFilter(f.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      ledgerFilter === f.id && styles.filterChipTextActive,
                      ledgerFilter !== f.id && { color: textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* View Mode Toggle: Grid vs List */}
            <View style={[styles.viewToggle, { backgroundColor: isDark ? "#1E252E" : "#F1F5F9", borderColor: border }]}>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === "list" && styles.viewToggleBtnActive]}
                onPress={() => setViewMode("list")}
                activeOpacity={0.7}
              >
                <Feather name="list" size={scale(15)} color={viewMode === "list" ? "#FFFFFF" : textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === "grid" && styles.viewToggleBtnActive]}
                onPress={() => setViewMode("grid")}
                activeOpacity={0.7}
              >
                <Feather name="grid" size={scale(15)} color={viewMode === "grid" ? "#FFFFFF" : textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            key={`ledger_${viewMode}`}
            data={filteredTransactions}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
            keyExtractor={(item, idx) => item._id || String(idx)}
            contentContainerStyle={[
              styles.listContent,
              viewMode === "grid" && styles.gridListContent,
            ]}
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
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={scale(48)} color="#64748B" />
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Ledger Records Found</Text>
                  <Text style={[styles.emptySub, { color: textSecondary }]}>
                    No financial ledger events match the selected criteria.
                  </Text>
                </View>
              ) : undefined
            }
            renderItem={({ item }) => {
              const type = (item.type || "").toUpperCase();
              const paymentMethod = (item.paymentMethod || "").toLowerCase();
              const isCod =
                type.includes("COD") ||
                type.includes("DIRECT_QR") ||
                paymentMethod.includes("cash") ||
                paymentMethod.includes("cod");

              const isRefund =
                type.includes("REFUND") || type.includes("REVERSAL") || type.includes("RECOVERY");
              const isPayout = type.includes("WITHDRAWAL");
              const isDeliveredSale = type === "ORDER_EARNING";

              // Explicit Friendly Label & Colors
              let typeLabel = item.type;
              let badgeBg = isDark ? "#1E252E" : "#F1F5F9";
              let badgeColor = textSecondary;
              let iconName: any = "swap-horizontal";

              if (type === "COD_COLLECTION") {
                typeLabel = "COD Cash Collected (Rider Custody)";
                badgeBg = "rgba(245, 158, 11, 0.15)";
                badgeColor = "#F59E0B";
                iconName = "hand-coin";
              } else if (type === "COD_HANDOVER") {
                typeLabel = "COD Cash Handed Over to Store";
                badgeBg = "rgba(16, 185, 129, 0.15)";
                badgeColor = "#10B981";
                iconName = "store-check-outline";
              } else if (type === "ORDER_EARNING") {
                typeLabel = isCod ? "COD Store Sale Earning" : "Online Prepaid Store Sale";
                badgeBg = "rgba(2, 132, 199, 0.15)";
                badgeColor = "#0284C7";
                iconName = "cart-arrow-down";
              } else if (type === "VENDOR_DIRECT_REFUND") {
                typeLabel = "Direct Store Customer Refund";
                badgeBg = "rgba(239, 68, 68, 0.15)";
                badgeColor = "#EF4444";
                iconName = "cash-refund";
              } else if (type.includes("WITHDRAWAL")) {
                typeLabel = "Vendor Bank Withdrawal Payout";
                badgeBg = "rgba(168, 85, 247, 0.15)";
                badgeColor = "#A855F7";
                iconName = "bank-transfer";
              }

              // Real visible cash amount (gross cash transacted)
              const displayCashAmount = item.grossAmount || item.amount || item.netAmount || 0;
              const commissionCut = isCod ? 0 : item.commission || 0;
              const vendorCredit = isCod ? displayCashAmount : item.netAmount || displayCashAmount - commissionCut;

              const storeName =
                item.vendor?.businessDetails?.businessName ||
                item.vendor?.sellerDetails?.sellerName ||
                "Store";

              const orderNumber = item.order?.orderNumber || item.orderNumber || null;
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) +
                  " at " +
                  new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Recent";

              // ─── GRID VIEW CARD FOR LEDGER TRANSACTION ───
              if (viewMode === "grid") {
                return (
                  <View style={[styles.ledgerGridCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.gridCardHeader}>
                      <View style={[styles.typeBadgePill, { backgroundColor: badgeBg }]}>
                        <MaterialCommunityIcons name={iconName} size={scale(11)} color={badgeColor} />
                        <Text style={[styles.typeBadgeText, { color: badgeColor, fontSize: moderateScale(9) }]} numberOfLines={1}>
                          {isCod ? "COD Flow" : typeLabel.slice(0, 12)}
                        </Text>
                      </View>
                      <Text style={[styles.paymentMethodTag, { color: isCod ? "#10B981" : "#0284C7", fontSize: moderateScale(9) }]}>
                        {isCod ? "0% COD" : "1.5% Fee"}
                      </Text>
                    </View>

                    <Text style={styles.gridStatLabel}>CASH TRANSACTED</Text>
                    <Text
                      style={[
                        styles.gridPayoutAmount,
                        { color: isRefund ? "#EF4444" : isPayout ? "#A855F7" : "#10B981" },
                      ]}
                      numberOfLines={1}
                    >
                      {isRefund ? "-" : "+"} NPR {displayCashAmount.toLocaleString()}
                    </Text>

                    <View style={styles.gridNetRow}>
                      <Text style={styles.gridStatLabel}>NET VENDOR:</Text>
                      <Text style={[styles.gridNetVal, { color: textPrimary }]} numberOfLines={1}>
                        NPR {vendorCredit.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[styles.gridDivider, { backgroundColor: border }]} />

                    <Text style={[styles.gridStoreTitle, { color: textPrimary }]} numberOfLines={1}>
                      {storeName}
                    </Text>
                    {orderNumber ? (
                      <Text style={[styles.gridAccSub, { color: "#0284C7" }]} numberOfLines={1}>
                        Order #{orderNumber}
                      </Text>
                    ) : (
                      <Text style={[styles.gridAccSub, { color: textSecondary }]} numberOfLines={1}>
                        {dateStr.split(" at ")[0]}
                      </Text>
                    )}
                  </View>
                );
              }

              return (
                <View style={[styles.cardDetailed, { backgroundColor: cardBg, borderColor: border }]}>
                  {/* Top Transaction Row: Type Badge, Icon, and Cash Amount */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, marginRight: scale(8) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), flexWrap: "wrap" }}>
                        <View style={[styles.typeBadgePill, { backgroundColor: badgeBg }]}>
                          <MaterialCommunityIcons name={iconName} size={scale(13)} color={badgeColor} />
                          <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{typeLabel}</Text>
                        </View>
                      </View>
                      <Text style={[styles.cardSub, { color: textSecondary, marginTop: scale(4) }]}>
                        Store: <Text style={{ color: textPrimary, fontWeight: "700" }}>{storeName}</Text> &bull; {dateStr}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={[
                          styles.grossCashAmount,
                          {
                            color: isRefund ? "#EF4444" : isPayout ? "#A855F7" : "#10B981",
                          },
                        ]}
                      >
                        {isRefund ? "-" : "+"} NPR {displayCashAmount.toLocaleString()}
                      </Text>
                      <Text style={[styles.paymentMethodTag, { color: isCod ? "#10B981" : "#0284C7" }]}>
                        {isCod ? "● COD (0% Cut)" : `💳 ${item.paymentMethod || "Prepaid"}`}
                      </Text>
                    </View>
                  </View>

                  {/* Order Context if linked */}
                  {orderNumber ? (
                    <View
                      style={[
                        styles.orderLinkRow,
                        { backgroundColor: isDark ? "#121A21" : "#F8FAFC", borderColor: border },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                        <Feather name="file-text" size={scale(13)} color="#0284C7" />
                        <Text style={[styles.orderLinkText, { color: textPrimary }]}>
                          Linked Order #{orderNumber}
                        </Text>
                      </View>
                      {item.order?.paymentMethod ? (
                        <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>
                          Paid via {item.order.paymentMethod}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* 100% Transparent Financial Split Box */}
                  <View style={[styles.transparentAccountingBox, { borderTopColor: border }]}>
                    <View style={styles.accountingCol}>
                      <Text style={[styles.acctLabel, { color: textSecondary }]}>GROSS CASH</Text>
                      <Text style={[styles.acctVal, { color: textPrimary }]}>
                        NPR {displayCashAmount.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.accountingCol}>
                      <Text style={[styles.acctLabel, { color: textSecondary }]}>PLATFORM FEE</Text>
                      <Text style={[styles.acctVal, { color: isCod ? "#10B981" : "#A855F7" }]}>
                        {isCod ? "NPR 0 (0% COD)" : `- NPR ${commissionCut.toLocaleString()}`}
                      </Text>
                    </View>

                    <View style={[styles.accountingCol, { alignItems: "flex-end" }]}>
                      <Text style={[styles.acctLabel, { color: textSecondary }]}>
                        {isCod ? "NET VENDOR CASH" : "NET VENDOR CREDIT"}
                      </Text>
                      <Text style={[styles.acctVal, { color: "#10B981", fontWeight: "800" }]}>
                        + NPR {vendorCredit.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Settlement & Custody Status Bar */}
                  <View style={[styles.ledgerFooterRow, { borderTopColor: border }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                      <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>Status:</Text>
                      <View
                        style={[
                          styles.statusBadgeSmall,
                          {
                            backgroundColor:
                              item.status === "SETTLED" || item.status === "COMPLETED"
                                ? "rgba(16, 185, 129, 0.15)"
                                : item.status === "CASH_IN_CUSTODY"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(2, 132, 199, 0.15)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeSmallText,
                            {
                              color:
                                item.status === "SETTLED" || item.status === "COMPLETED"
                                  ? "#10B981"
                                  : item.status === "CASH_IN_CUSTODY"
                                  ? "#F59E0B"
                                  : "#0284C7",
                            },
                          ]}
                        >
                          {item.status || "SETTLED"}
                        </Text>
                      </View>
                    </View>

                    {item.deliveryBoy?.name ? (
                      <Text style={{ fontSize: moderateScale(10.5), color: textSecondary }}>
                        Rider: {item.deliveryBoy.name}
                      </Text>
                    ) : null}
                  </View>

                  {item.notes ? (
                    <Text style={[styles.notesBubble, { color: textSecondary }]}>
                      &bull; {item.notes}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ══ DECISION MODAL: APPROVE / DECLINE WITHDRAWAL ══ */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                <MaterialCommunityIcons
                  name={reviewAction === "APPROVE" ? "bank-transfer-out" : "cancel"}
                  size={scale(22)}
                  color={reviewAction === "APPROVE" ? "#10B981" : "#EF4444"}
                />
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  {reviewAction === "APPROVE" ? "Approve & Transfer Payout" : "Decline Withdrawal Request"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedWithdrawal(null)}>
                <Feather name="x" size={scale(18)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Vendor Bank Credentials Summary Inside Modal */}
            <View
              style={[
                styles.modalBankBox,
                { backgroundColor: isDark ? "#121A21" : "#F8FAFC", borderColor: border },
              ]}
            >
              <Text style={[styles.modalBankStoreName, { color: textPrimary }]}>
                {selectedWithdrawal?.vendor?.businessDetails?.businessName || "Store"}
              </Text>
              <Text style={{ fontSize: moderateScale(11), color: textSecondary, marginTop: scale(2) }}>
                Payout Target: {selectedWithdrawal?.vendor?.bankDetails?.bankName || "Registered Bank Account"}
              </Text>
              <Text style={{ fontSize: moderateScale(11), color: textSecondary }}>
                A/C: {selectedWithdrawal?.vendor?.bankDetails?.accountNumber || "N/A"} &bull; Holder:{" "}
                {selectedWithdrawal?.vendor?.bankDetails?.accountHolderName || "Store Owner"}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: scale(8), borderTopWidth: 1, borderTopColor: border, paddingTop: scale(6) }}>
                <Text style={{ fontSize: moderateScale(12), color: textSecondary }}>Requested Amount:</Text>
                <Text style={{ fontSize: moderateScale(14), fontWeight: "800", color: "#10B981" }}>
                  NPR {(selectedWithdrawal?.amount || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {reviewAction === "APPROVE" ? (
              <View style={{ marginTop: scale(12) }}>
                <Text style={[styles.inputLabel, { color: textPrimary }]}>
                  Bank / Gateway Transaction Reference UTR *
                </Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                  placeholder="e.g. NIMB-TRF-982341 or Khalti / eSewa Ref ID"
                  placeholderTextColor="#94A3B8"
                  value={payoutReference}
                  onChangeText={setPayoutReference}
                />
              </View>
            ) : (
              <View style={{ marginTop: scale(12) }}>
                <Text style={[styles.inputLabel, { color: textPrimary }]}>Decline Reason *</Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                  placeholder="Reason for declining this payout..."
                  placeholderTextColor="#94A3B8"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                />
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { borderColor: border }]}
                onPress={() => setSelectedWithdrawal(null)}
              >
                <Text style={{ color: textPrimary, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  { backgroundColor: reviewAction === "APPROVE" ? "#10B981" : "#EF4444" },
                ]}
                onPress={handleReviewSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    {reviewAction === "APPROVE" ? "Confirm Settlement" : "Confirm Decline"}
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
  kpiContainer: {
    padding: scale(12),
    borderBottomWidth: 1,
    gap: scale(10),
  },
  kpiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  kpiBox: {
    width: "48.5%",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(10),
  },
  kpiBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kpiMiniLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  kpiLargeVal: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: scale(4),
  },
  kpiSubText: {
    fontSize: moderateScale(10),
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
  },
  tabTextActive: {
    color: "#0284C7",
    fontWeight: "800",
  },
  subFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    gap: scale(8),
  },
  viewToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(2),
  },
  viewToggleBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(5),
    borderRadius: scale(6),
  },
  viewToggleBtnActive: {
    backgroundColor: "#0284C7",
  },
  gridRow: {
    justifyContent: "space-between",
    gap: scale(10),
  },
  gridListContent: {
    padding: scale(12),
    paddingBottom: scale(90),
  },
  withdrawalGridCard: {
    flex: 1,
    maxWidth: "48.5%",
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(10),
  },
  ledgerGridCard: {
    flex: 1,
    maxWidth: "48.5%",
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(10),
  },
  gridCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  gridStoreTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    flex: 1,
    marginRight: scale(4),
  },
  gridStatusPill: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2.5),
    borderRadius: scale(10),
  },
  gridStatusText: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
  },
  gridStatLabel: {
    fontSize: moderateScale(8),
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  gridPayoutAmount: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    marginTop: scale(2),
    marginBottom: scale(4),
  },
  gridBankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: scale(2),
  },
  gridBankText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  gridAccSub: {
    fontSize: moderateScale(9.5),
    marginTop: scale(2),
  },
  gridDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scale(8),
  },
  gridReviewBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: scale(6),
    borderRadius: scale(6),
    alignItems: "center",
  },
  gridReviewBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  gridSettledWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingVertical: scale(4),
  },
  gridSettledText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  gridNetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: scale(2),
  },
  gridNetVal: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  filterChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(14),
  },
  filterChipActive: {
    backgroundColor: "#0284C7",
  },
  filterChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  searchBoxWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(12),
    marginTop: scale(10),
    paddingHorizontal: scale(10),
    height: scale(38),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12.5),
  },
  listContent: {
    padding: scale(12),
    gap: scale(10),
    paddingBottom: scale(90),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  emptySub: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  cardDetailed: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    gap: scale(8),
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  statusPillText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  bankCredsBox: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(9),
    gap: scale(6),
  },
  bankHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankNameText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  branchText: {
    fontSize: moderateScale(10.5),
    fontStyle: "italic",
  },
  bankFieldsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniFieldLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  miniFieldValue: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    marginTop: scale(1),
  },
  amountsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: scale(8),
  },
  amountLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  amountValLarge: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: scale(1),
  },
  auditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    padding: scale(7),
    borderRadius: scale(6),
  },
  auditText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  notesBubble: {
    fontSize: moderateScale(10.5),
    fontStyle: "italic",
  },
  actionsBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(8),
    marginTop: scale(4),
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  declineBtnText: {
    color: "#EF4444",
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#10B981",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  typeBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  typeBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  grossCashAmount: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  paymentMethodTag: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    marginTop: scale(2),
  },
  orderLinkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: scale(6),
    borderWidth: 1,
    paddingHorizontal: scale(8),
    paddingVertical: scale(5),
  },
  orderLinkText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  transparentAccountingBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: scale(8),
  },
  accountingCol: {
    flex: 1,
  },
  acctLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  acctVal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(2),
  },
  ledgerFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: scale(6),
  },
  statusBadgeSmall: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  statusBadgeSmallText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: scale(16),
  },
  modalCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(18),
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  modalBankBox: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
  },
  modalBankStoreName: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    marginBottom: scale(4),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: scale(40),
    fontSize: moderateScale(12.5),
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(16),
  },
  modalBtnCancel: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  modalBtnConfirm: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
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
    paddingVertical: scale(14),
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
