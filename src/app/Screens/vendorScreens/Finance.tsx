import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCodDueRiders,
  fetchDashboardStats,
  fetchTransactions,
  requestWithdrawal,
  VendorTransactionRecord,
} from "@/store/slices/vendorFinanceSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FinanceTab = "overview" | "withdrawals" | "settlements" | "delivery_boy";

// ── Transaction Item Component ─────────────────────────────────────────
const TransactionRow = memo(function TransactionRow({
  txn,
}: {
  txn: VendorTransactionRecord;
}) {
  const isWithdrawal = txn.type === "WITHDRAWAL";
  const isSettled = txn.status === "SETTLED" || txn.status === "COMPLETED";
  const isPending = txn.status === "PENDING" || txn.status === "SUBMITTED";
  const isCodCustody = txn.status === "CASH_IN_CUSTODY";

  let statusBg = "#EFF6FF";
  let statusColor = "#1D4ED8";
  let statusText: string = String(txn.status || "");

  if (isSettled) {
    statusBg = "#DCFCE7";
    statusColor = "#15803D";
    statusText = "Settled";
  } else if (isPending) {
    statusBg = "#FEF3C7";
    statusColor = "#B45309";
    statusText = "Pending Approval";
  } else if (isCodCustody) {
    statusBg = "#F3E8FF";
    statusColor = "#7E22CE";
    statusText = "With Rider (COD)";
  } else if (txn.status === "FAILED") {
    statusBg = "#FEF2F2";
    statusColor = "#DC2626";
    statusText = "Rejected / Failed";
  }

  const dateStr = txn.createdAt
    ? new Date(txn.createdAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <View style={styles.txnCard}>
      <View style={styles.txnLeft}>
        <View
          style={[
            styles.txnIconWrap,
            {
              backgroundColor: isWithdrawal
                ? "#FEF2F2"
                : isCodCustody
                ? "#F3E8FF"
                : "#DCFCE7",
            },
          ]}
        >
          {isWithdrawal ? (
            <Feather name="arrow-up-right" size={scale(18)} color="#DC2626" />
          ) : isCodCustody ? (
            <Ionicons name="bicycle-outline" size={scale(18)} color="#7E22CE" />
          ) : (
            <Feather name="arrow-down-left" size={scale(18)} color="#15803D" />
          )}
        </View>

        <View style={styles.txnDetails}>
          <Text style={styles.txnTitle} numberOfLines={1}>
            {isWithdrawal
              ? "Withdrawal Payout"
              : txn.type === "COD_COLLECTION"
              ? "COD Delivery Collection"
              : txn.type === "COD_HANDOVER"
              ? "COD Store Handover"
              : txn.type === "REFUND_DEDUCTION"
              ? "Customer Refund Deduction"
              : txn.type === "COMMISSION_REVERSAL"
              ? "1.5% Commission Reversal"
              : txn.type === "COMMISSION_DEDUCTION"
              ? "1.5% Superadmin Commission"
              : txn.type === "RECOVERY_ADJUSTMENT"
              ? "Deficit Recovery Offset"
              : "Store Order Settlement"}
          </Text>
          <Text style={styles.txnSub} numberOfLines={1}>
            {txn.notes || (txn.order?.orderNumber ? `Order #${txn.order.orderNumber}` : dateStr)}
          </Text>
          {txn.commission > 0 && (
            <Text style={{ fontSize: scale(10), color: "#64748B", marginTop: scale(2) }}>
              Gross: NPR {txn.grossAmount} &bull; Admin Fee (1.5%): NPR {txn.commission}
            </Text>
          )}
          <Text style={styles.txnDate}>{dateStr}</Text>
        </View>
      </View>

      <View style={styles.txnRight}>
        <Text
          style={[
            styles.txnAmount,
            {
              color:
                isWithdrawal ||
                txn.type === "REFUND_DEDUCTION" ||
                txn.type === "COMMISSION_DEDUCTION"
                  ? "#DC2626"
                  : "#016073",
            },
          ]}
        >
          {isWithdrawal ||
          txn.type === "REFUND_DEDUCTION" ||
          txn.type === "COMMISSION_DEDUCTION"
            ? "-"
            : "+"}NPR {Math.abs(txn.netAmount || txn.amount || 0).toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ── Main Finance & Expense Screen ──────────────────────────────────────
export default function Finance() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useLocalSearchParams<{ tab?: string }>();

  const {
    metrics,
    transactions,
    codDueRiders,
    dashboardLoading,
    transactionsLoading,
    actionLoading,
  } = useAppSelector((state) => state.vendorFinance);

  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Withdrawal Request Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  // Sync route query param tab if present
  useEffect(() => {
    if (searchParams.tab) {
      const t = searchParams.tab.toLowerCase();
      if (t === "withdrawals" || t === "withdrawal" || t === "payouts") {
        setActiveTab("withdrawals");
      } else if (t === "settlements" || t === "settled") {
        setActiveTab("settlements");
      } else if (t === "delivery" || t === "delivery_boy" || t === "cod") {
        setActiveTab("delivery_boy");
      }
    }
  }, [searchParams.tab]);

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchDashboardStats()),
      dispatch(fetchTransactions(undefined)),
      dispatch(fetchCodDueRiders()),
    ]);
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Derived Transactions for Specific Tabs ──
  const withdrawalTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === "WITHDRAWAL");
  }, [transactions]);

  const settledTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.type === "ORDER_EARNING" ||
        t.status === "SETTLED" ||
        t.status === "COMPLETED"
    );
  }, [transactions]);

  const pendingWithdrawalSum = useMemo(() => {
    return withdrawalTransactions
      .filter((t) => t.status === "PENDING" || t.status === "SUBMITTED")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [withdrawalTransactions]);

  const settledWithdrawalSum = useMemo(() => {
    return withdrawalTransactions
      .filter((t) => t.status === "SETTLED" || t.status === "COMPLETED")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [withdrawalTransactions]);

  // ── Handle Request Withdrawal ──
  const handleSubmitWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    const available = metrics?.availableWithdrawalBalance || 0;

    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to withdraw.");
      return;
    }
    if (amt < 100) {
      Alert.alert("Minimum Amount", "Minimum withdrawal payout is NPR 100.");
      return;
    }
    if (amt > available) {
      Alert.alert(
        "Insufficient Balance",
        `You can only withdraw up to your available balance of NPR ${available.toLocaleString()}.`
      );
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      const res = await dispatch(
        requestWithdrawal({
          amount: amt,
          notes: withdrawNotes.trim() || undefined,
        })
      );

      if (requestWithdrawal.fulfilled.match(res)) {
        Alert.alert(
          "Payout Requested",
          `Your withdrawal request of NPR ${amt.toLocaleString()} has been submitted successfully for admin disbursement.`
        );
        setWithdrawModalVisible(false);
        setWithdrawAmount("");
        setWithdrawNotes("");
        loadData();
      } else {
        Alert.alert(
          "Request Failed",
          (res.payload as string) || "Could not submit withdrawal request."
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit request.");
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text style={styles.navTitle}>Finance & Expense</Text>
          <Text style={styles.navSub}>Payouts, Settlements & Rider Cash</Text>
        </View>
        <TouchableOpacity
          style={styles.payoutActionBtn}
          activeOpacity={0.8}
          onPress={() => setWithdrawModalVisible(true)}
        >
          <Feather name="plus" size={scale(14)} color="#FFFFFF" />
          <Text style={styles.payoutActionBtnText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
          />
        }
      >
        {/* ── HERO CARDS: METRICS OVERVIEW ── */}
        <View style={styles.heroGrid}>
          {/* Main Available Withdrawal Balance Card */}
          <View style={styles.heroCardPrimary}>
            <View style={styles.heroCardTop}>
              <View style={styles.heroCardIcon}>
                <Ionicons name="wallet-outline" size={scale(22)} color="#FFFFFF" />
              </View>
              <View style={styles.readyPill}>
                <Text style={styles.readyPillText}>Ready for Payout</Text>
              </View>
            </View>
            <Text style={styles.heroLabel}>Available Balance</Text>
            <Text style={styles.heroBalance}>
              NPR {(metrics?.availableWithdrawalBalance || 0).toLocaleString()}
            </Text>

            <TouchableOpacity
              style={styles.withdrawBtn}
              activeOpacity={0.85}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <Feather name="arrow-up-right" size={scale(15)} color="#016073" />
              <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
            </TouchableOpacity>
          </View>

          {/* 3 Secondary Financial Metrics */}
          <View style={styles.metricsRow}>
            {/* Settled Amount */}
            <View style={[styles.miniMetricCard, { borderLeftColor: "#16A34A" }]}>
              <View style={styles.miniMetricHeader}>
                <Feather name="check-circle" size={scale(14)} color="#16A34A" />
                <Text style={styles.miniMetricTitle}>Settled Lifetime</Text>
              </View>
              <Text style={[styles.miniMetricVal, { color: "#16A34A" }]}>
                NPR {(metrics?.totalEarned || 0).toLocaleString()}
              </Text>
              <Text style={styles.miniMetricSub}>Total Credited</Text>
            </View>

            {/* Pending Settlement */}
            <View style={[styles.miniMetricCard, { borderLeftColor: "#D97706" }]}>
              <View style={styles.miniMetricHeader}>
                <Feather name="clock" size={scale(14)} color="#D97706" />
                <Text style={styles.miniMetricTitle}>Pending Settlement</Text>
              </View>
              <Text style={[styles.miniMetricVal, { color: "#D97706" }]}>
                NPR {(metrics?.pendingSettlement || 0).toLocaleString()}
              </Text>
              <Text style={styles.miniMetricSub}>In Processing Window</Text>
            </View>
          </View>

          {/* Delivery Boy Cash in Custody Hero Alert */}
          <View style={styles.riderCustodyBanner}>
            <View style={styles.riderCustodyLeft}>
              <View style={styles.riderCustodyIcon}>
                <Ionicons name="bicycle" size={scale(20)} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.riderCustodyTitle}>
                  Delivery Boy Cash in Custody
                </Text>
                <Text style={styles.riderCustodySub}>
                  COD cash collected from customers awaiting store handover
                </Text>
              </View>
            </View>
            <View style={styles.riderCustodyRight}>
              <Text style={styles.riderCustodyAmount}>
                NPR {(metrics?.codCashWithDeliveryBoys || 0).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.riderHandoverPill}
                activeOpacity={0.7}
                onPress={() => router.push("/Screens/vendorScreens/cod-handover" as any)}
              >
                <Text style={styles.riderHandoverText}>Accept Cash Handover &rarr;</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── TABS NAVIGATION ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "overview" && styles.tabBtnTextActive,
              ]}
            >
              All Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "withdrawals" && styles.tabBtnActive]}
            onPress={() => setActiveTab("withdrawals")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "withdrawals" && styles.tabBtnTextActive,
              ]}
            >
              Withdrawals ({withdrawalTransactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "settlements" && styles.tabBtnActive]}
            onPress={() => setActiveTab("settlements")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "settlements" && styles.tabBtnTextActive,
              ]}
            >
              Settled Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "delivery_boy" && styles.tabBtnActive]}
            onPress={() => setActiveTab("delivery_boy")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "delivery_boy" && styles.tabBtnTextActive,
              ]}
            >
              Rider COD ({codDueRiders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: ALL OVERVIEW ── */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Financial Records</Text>
              <Text style={styles.sectionCount}>
                {transactions.length} records
              </Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="receipt-outline" size={scale(40)} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Transactions Recorded</Text>
                <Text style={styles.emptySub}>
                  When customers order or when you submit payout requests, your ledgers will appear here.
                </Text>
              </View>
            ) : (
              transactions.map((item) => (
                <TransactionRow key={item._id} txn={item} />
              ))
            )}
          </View>
        )}

        {/* ── TAB 2: WITHDRAWALS ── */}
        {activeTab === "withdrawals" && (
          <View style={styles.tabContent}>
            {/* Withdrawal Status Breakdown Strip */}
            <View style={styles.withdrawSummaryStrip}>
              <View style={styles.withdrawSummaryBox}>
                <Text style={styles.withdrawSummaryLabel}>Pending Payouts</Text>
                <Text style={[styles.withdrawSummaryVal, { color: "#D97706" }]}>
                  NPR {pendingWithdrawalSum.toLocaleString()}
                </Text>
              </View>
              <View style={styles.withdrawSummaryDivider} />
              <View style={styles.withdrawSummaryBox}>
                <Text style={styles.withdrawSummaryLabel}>Completed Payouts</Text>
                <Text style={[styles.withdrawSummaryVal, { color: "#16A34A" }]}>
                  NPR {settledWithdrawalSum.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Withdrawal History</Text>
              <TouchableOpacity
                onPress={() => setWithdrawModalVisible(true)}
                style={styles.newRequestBtn}
              >
                <Feather name="plus-circle" size={scale(13)} color="#016073" />
                <Text style={styles.newRequestBtnText}>New Request</Text>
              </TouchableOpacity>
            </View>

            {withdrawalTransactions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="dollar-sign" size={scale(40)} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Withdrawal Requests</Text>
                <Text style={styles.emptySub}>
                  You have not submitted any payout requests yet. When you request a payout from your available balance, it will be listed here.
                </Text>
              </View>
            ) : (
              withdrawalTransactions.map((item) => (
                <TransactionRow key={item._id} txn={item} />
              ))
            )}
          </View>
        )}

        {/* ── TAB 3: SETTLEMENTS ── */}
        {activeTab === "settlements" && (
          <View style={styles.tabContent}>
            <View style={styles.settlementExplainer}>
              <Ionicons name="information-circle-outline" size={scale(18)} color="#016073" />
              <Text style={styles.settlementExplainerText}>
                Settled orders represent revenue from successfully completed customer orders that have been credited to your store after deduction of standard platform commission.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Settled Store Earnings</Text>
              <Text style={styles.sectionCount}>
                {settledTransactions.length} settled
              </Text>
            </View>

            {settledTransactions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="check-square" size={scale(40)} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Settled Orders Yet</Text>
                <Text style={styles.emptySub}>
                  Orders that are delivered and completed will be settled into your balance and displayed here.
                </Text>
              </View>
            ) : (
              settledTransactions.map((item) => (
                <TransactionRow key={item._id} txn={item} />
              ))
            )}
          </View>
        )}

        {/* ── TAB 4: DELIVERY BOY COD & FLOW ── */}
        {activeTab === "delivery_boy" && (
          <View style={styles.tabContent}>
            {/* Step-by-step Flow Explainer: How COD cash goes from Customer -> Delivery Boy -> Vendor Store */}
            <View style={styles.workflowCard}>
              <Text style={styles.workflowHeading}>
                How Delivery Boy Cash Reaches You
              </Text>

              <View style={styles.workflowStep}>
                <View style={styles.workflowStepNum}>
                  <Text style={styles.workflowStepNumText}>1</Text>
                </View>
                <View style={styles.workflowStepInfo}>
                  <Text style={styles.workflowStepTitle}>Customer Pays at Doorstep</Text>
                  <Text style={styles.workflowStepDesc}>
                    When an order is Cash on Delivery, the assigned delivery partner collects the exact cash amount upon delivery.
                  </Text>
                </View>
              </View>

              <View style={styles.workflowStep}>
                <View style={styles.workflowStepNum}>
                  <Text style={styles.workflowStepNumText}>2</Text>
                </View>
                <View style={styles.workflowStepInfo}>
                  <Text style={styles.workflowStepTitle}>Cash Stored in Rider Custody</Text>
                  <Text style={styles.workflowStepDesc}>
                    The money is logged under the rider’s custody balance specifically owed to your store.
                  </Text>
                </View>
              </View>

              <View style={styles.workflowStep}>
                <View style={styles.workflowStepNum}>
                  <Text style={styles.workflowStepNumText}>3</Text>
                </View>
                <View style={styles.workflowStepInfo}>
                  <Text style={styles.workflowStepTitle}>Physical or QR Store Handover</Text>
                  <Text style={styles.workflowStepDesc}>
                    The rider visits your store to hand over the cash. Confirm the receipt in-app to settle the rider’s balance.
                  </Text>
                </View>
              </View>
            </View>

            {/* List of Riders with Cash in Custody */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riders with Store Cash</Text>
              <TouchableOpacity
                onPress={() => router.push("/Screens/vendorScreens/cod-handover" as any)}
                style={styles.handoverScreenBtn}
              >
                <Text style={styles.handoverScreenBtnText}>Open Handover Screen</Text>
              </TouchableOpacity>
            </View>

            {codDueRiders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="checkmark-circle-outline" size={scale(40)} color="#16A34A" />
                <Text style={styles.emptyTitle}>All Delivery Cash Settle Up!</Text>
                <Text style={styles.emptySub}>
                  No delivery boys currently hold uncollected cash for your store. All collected COD orders are balanced.
                </Text>
              </View>
            ) : (
              codDueRiders.map((item) => (
                <View key={item.deliveryBoy?._id} style={styles.riderDueCard}>
                  <View style={styles.riderDueTop}>
                    <View style={styles.riderAvatar}>
                      <Ionicons name="person" size={scale(20)} color="#016073" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.riderName}>
                        {item.deliveryBoy?.fullName || "Delivery Partner"}
                      </Text>
                      <Text style={styles.riderPhone}>
                        {item.deliveryBoy?.phone || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.riderDueAmountBox}>
                      <Text style={styles.riderDueAmount}>
                        NPR {item.totalDue?.toLocaleString()}
                      </Text>
                      <Text style={styles.riderDueOrdersCount}>
                        {item.ordersCount || 1} COD Orders
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.receiveCashBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push("/Screens/vendorScreens/cod-handover" as any)
                    }
                  >
                    <Ionicons name="cash-outline" size={scale(16)} color="#FFFFFF" />
                    <Text style={styles.receiveCashBtnText}>
                      Accept & Confirm Cash Receipt
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── WITHDRAWAL REQUEST MODAL ── */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setWithdrawModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Request Payout</Text>
                    <Text style={styles.modalSub}>
                      Withdraw funds directly to your bank account / UPI
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setWithdrawModalVisible(false)}
                  >
                    <Feather name="x" size={scale(18)} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Available Balance Prompt */}
                <View style={styles.modalBalanceBox}>
                  <Text style={styles.modalBalanceLabel}>Available Balance</Text>
                  <Text style={styles.modalBalanceVal}>
                    NPR {(metrics?.availableWithdrawalBalance || 0).toLocaleString()}
                  </Text>
                </View>

                {/* Amount Input */}
                <Text style={styles.inputLabel}>Withdrawal Amount (NPR)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />

                {/* Quick Amount Chips */}
                <View style={styles.amountChipsRow}>
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.amountChip}
                      onPress={() => setWithdrawAmount(String(amt))}
                    >
                      <Text style={styles.amountChipText}>NPR {amt}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.amountChip, styles.amountChipMax]}
                    onPress={() =>
                      setWithdrawAmount(
                        String(metrics?.availableWithdrawalBalance || 0)
                      )
                    }
                  >
                    <Text style={styles.amountChipMaxText}>Max</Text>
                  </TouchableOpacity>
                </View>

                {/* Notes Input */}
                <Text style={[styles.inputLabel, { marginTop: scale(12) }]}>
                  Notes / Reference (Optional)
                </Text>
                <TextInput
                  style={[styles.textInput, { height: scale(64) }]}
                  placeholder="e.g. Weekly settlement or specific account"
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={withdrawNotes}
                  onChangeText={setWithdrawNotes}
                />

                {/* Submit Action */}
                <TouchableOpacity
                  style={[
                    styles.submitWithdrawBtn,
                    submittingWithdrawal && { opacity: 0.7 },
                  ]}
                  disabled={submittingWithdrawal}
                  onPress={handleSubmitWithdrawal}
                >
                  {submittingWithdrawal ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={scale(18)} color="#FFFFFF" />
                      <Text style={styles.submitWithdrawBtnText}>
                        Confirm Withdrawal Request
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
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
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: scale(10),
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  topNavCenter: {
    flex: 1,
  },
  navTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  navSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  payoutActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#016073",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(20),
  },
  payoutActionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  heroGrid: {
    gap: scale(12),
    marginBottom: moderateScale(16),
  },
  heroCardPrimary: {
    backgroundColor: "#016073",
    borderRadius: scale(14),
    padding: scale(18),
    shadowColor: "#016073",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCardIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  readyPill: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
  },
  readyPillText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  heroLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginTop: scale(12),
  },
  heroBalance: {
    color: "#FFFFFF",
    fontSize: moderateScale(28),
    fontWeight: "900",
    marginTop: scale(2),
    letterSpacing: -0.5,
  },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#FFFFFF",
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
    marginTop: moderateScale(14),
  },
  withdrawBtnText: {
    color: "#016073",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  metricsRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  miniMetricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    padding: scale(12),
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  miniMetricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
  },
  miniMetricTitle: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#475569",
  },
  miniMetricVal: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    marginTop: scale(4),
  },
  miniMetricSub: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    marginTop: scale(2),
  },
  riderCustodyBanner: {
    backgroundColor: "#F5F3FF",
    borderRadius: scale(12),
    padding: scale(14),
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    gap: scale(10),
  },
  riderCustodyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  riderCustodyIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  riderCustodyTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#5B21B6",
  },
  riderCustodySub: {
    fontSize: moderateScale(11),
    color: "#6D28D9",
    marginTop: scale(1),
  },
  riderCustodyRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EDE9FE",
    paddingTop: scale(8),
  },
  riderCustodyAmount: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    color: "#5B21B6",
  },
  riderHandoverPill: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5),
    borderRadius: scale(14),
  },
  riderHandoverText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: scale(3),
    borderRadius: scale(10),
    marginBottom: moderateScale(14),
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: moderateScale(7),
    borderRadius: scale(8),
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#016073",
    fontWeight: "800",
  },
  tabContent: {
    gap: scale(10),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionCount: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: scale(10),
  },
  txnIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  txnDetails: {
    flex: 1,
  },
  txnTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  txnSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  txnDate: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  txnRight: {
    alignItems: "flex-end",
    gap: scale(4),
  },
  txnAmount: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: scale(7),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  withdrawSummaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: moderateScale(6),
  },
  withdrawSummaryBox: {
    flex: 1,
    alignItems: "center",
  },
  withdrawSummaryLabel: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  withdrawSummaryVal: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    marginTop: scale(2),
  },
  withdrawSummaryDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#E2E8F0",
  },
  newRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  newRequestBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#016073",
  },
  settlementExplainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E6F4F6",
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#86C4CB",
    gap: scale(8),
    marginBottom: moderateScale(6),
  },
  settlementExplainerText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#016073",
    lineHeight: scale(16),
  },
  workflowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: scale(12),
    marginBottom: moderateScale(6),
  },
  workflowHeading: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  workflowStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(10),
  },
  workflowStepNum: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "#016073",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(1),
  },
  workflowStepNumText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  workflowStepInfo: {
    flex: 1,
  },
  workflowStepTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  workflowStepDesc: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
    lineHeight: scale(15),
  },
  handoverScreenBtn: {
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(8),
  },
  handoverScreenBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
  riderDueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: scale(10),
  },
  riderDueTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  riderAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  riderPhone: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  riderDueAmountBox: {
    alignItems: "flex-end",
  },
  riderDueAmount: {
    fontSize: moderateScale(14.5),
    fontWeight: "900",
    color: "#7C3AED",
  },
  riderDueOrdersCount: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  receiveCashBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#016073",
    paddingVertical: moderateScale(9),
    borderRadius: scale(8),
    gap: scale(6),
  },
  receiveCashBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(40),
    paddingHorizontal: scale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
    marginTop: moderateScale(10),
  },
  emptySub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    textAlign: "center",
    marginTop: scale(4),
    lineHeight: scale(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    padding: scale(20),
    paddingBottom: Platform.OS === "ios" ? moderateScale(34) : moderateScale(20),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  modalCloseBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBalanceBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E6F4F6",
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#86C4CB",
    marginBottom: moderateScale(14),
  },
  modalBalanceLabel: {
    fontSize: moderateScale(12),
    color: "#016073",
    fontWeight: "600",
  },
  modalBalanceVal: {
    fontSize: moderateScale(15),
    color: "#016073",
    fontWeight: "900",
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#334155",
    marginBottom: scale(6),
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  amountChipsRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: moderateScale(8),
  },
  amountChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  amountChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#475569",
  },
  amountChipMax: {
    backgroundColor: "#E6F4F6",
    borderColor: "#86C4CB",
  },
  amountChipMaxText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#016073",
  },
  submitWithdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#016073",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    gap: scale(6),
    marginTop: moderateScale(18),
  },
  submitWithdrawBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
});
