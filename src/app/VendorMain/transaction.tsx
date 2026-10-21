import VendorHeader from "@/components/VendorComponent/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTransactions,
  requestWithdrawal,
  VendorTransactionRecord,
} from "@/store/slices/vendorFinanceSlice";
import { moderateScale, scale } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterTab = "ALL" | "SETTLED" | "PENDING" | "WITHDRAWAL" | "COD";

export default function VendorTransactionScreen() {
  const dispatch = useAppDispatch();
  const { vendorDetails } = useAppSelector((state) => state.vendorAuth);
  const {
    metrics,
    transactions,
    transactionsLoading,
    actionLoading,
    unreadCount,
  } = useAppSelector((state) => state.vendorFinance);

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNotes, setWithdrawNotes] = useState("");

  const loadData = () => {
    let typeParam: string | undefined;
    let statusParam: string | undefined;

    if (activeTab === "SETTLED") {
      typeParam = "ORDER_EARNING";
      statusParam = "SETTLED";
    } else if (activeTab === "PENDING") {
      statusParam = "PENDING";
    } else if (activeTab === "WITHDRAWAL") {
      typeParam = "WITHDRAWAL";
    } else if (activeTab === "COD") {
      typeParam = undefined; // Filter COD types client/server
    }

    dispatch(fetchTransactions({ type: typeParam, status: statusParam }));
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchTransactions()).finally(() => {
      setRefreshing(false);
    });
  };

  // Filter transactions based on tab
  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "SETTLED") return t.type === "ORDER_EARNING" && t.status === "SETTLED";
    if (activeTab === "PENDING") return t.status === "PENDING" || t.status === "CASH_IN_CUSTODY";
    if (activeTab === "WITHDRAWAL") return t.type === "WITHDRAWAL";
    if (activeTab === "COD") return t.type === "COD_COLLECTION" || t.type === "COD_HANDOVER";
    return true;
  });

  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid withdrawal amount.");
      return;
    }

    if (amt < 100) {
      Alert.alert("Minimum Limit", "Minimum withdrawal amount is NPR 100.");
      return;
    }

    if (amt > metrics.availableWithdrawalBalance) {
      Alert.alert(
        "Insufficient Balance",
        `Your withdrawable balance is NPR ${metrics.availableWithdrawalBalance.toLocaleString()}.`
      );
      return;
    }

    try {
      await dispatch(
        requestWithdrawal({
          amount: amt,
          notes: withdrawNotes.trim() || undefined,
        })
      ).unwrap();

      setWithdrawModalVisible(false);
      setWithdrawAmount("");
      setWithdrawNotes("");
      loadData();

      Alert.alert(
        "Withdrawal Requested",
        `Withdrawal of NPR ${amt.toLocaleString()} has been queued for daily bank settlement.`
      );
    } catch (err: any) {
      Alert.alert("Withdrawal Failed", err || "Failed to process withdrawal request.");
    }
  };

  const renderTransactionCard = ({ item }: { item: VendorTransactionRecord }) => {
    const isDirectQr = item.type === "DIRECT_QR_PAYMENT";
    const isCredit =
      item.type === "ORDER_EARNING" ||
      item.type === "COD_HANDOVER" ||
      item.type === "COMMISSION_REVERSAL";
    const isCodCustody = item.type === "COD_COLLECTION";
    const isRefundOrDeduction =
      item.type === "REFUND_DEDUCTION" ||
      item.type === "COMMISSION_DEDUCTION" ||
      item.type === "RECOVERY_ADJUSTMENT";

    let iconName: any = isCredit ? "arrow-down-left" : "arrow-up-right";
    let iconColor = isCredit ? "#16A34A" : "#DC2626";
    let iconBg = isCredit ? "#F0FDF4" : "#FEF2F2";

    if (isDirectQr) {
      iconName = "check-circle";
      iconColor = "#0284C7";
      iconBg = "#F0F9FF";
    } else if (isCodCustody) {
      iconName = "clock";
      iconColor = "#D97706";
      iconBg = "#FFFBEB";
    } else if (item.type === "REFUND_DEDUCTION") {
      iconName = "rotate-ccw";
      iconColor = "#DC2626";
      iconBg = "#FEF2F2";
    } else if (item.type === "COMMISSION_REVERSAL") {
      iconName = "refresh-cw";
      iconColor = "#16A34A";
      iconBg = "#F0FDF4";
    } else if (item.type === "COMMISSION_DEDUCTION") {
      iconName = "percent";
      iconColor = "#EA580C";
      iconBg = "#FFF7ED";
    } else if (item.type === "RECOVERY_ADJUSTMENT") {
      iconName = "shield-alert";
      iconColor = "#7C3AED";
      iconBg = "#F5F3FF";
    }

    const typeLabel =
      item.type === "ORDER_EARNING"
        ? "Order Settlement"
        : item.type === "COD_COLLECTION"
        ? "COD in Rider Custody"
        : item.type === "COD_HANDOVER"
        ? "COD Store Handover"
        : item.type === "WITHDRAWAL"
        ? "Bank Withdrawal"
        : item.type === "DIRECT_QR_PAYMENT"
        ? "Direct Store QR Paid"
        : item.type === "REFUND_DEDUCTION"
        ? "Customer Refund Deduction"
        : item.type === "COMMISSION_REVERSAL"
        ? "Commission Reversal (+1.5%)"
        : item.type === "COMMISSION_DEDUCTION"
        ? "Platform Commission (-1.5%)"
        : item.type === "RECOVERY_ADJUSTMENT"
        ? "Deficit Recovery Offset"
        : "Platform Fee";

    return (
      <View style={styles.txnCard}>
        <View style={styles.txnLeft}>
          <View style={[styles.txnIconWrap, { backgroundColor: iconBg }]}>
            <Feather name={iconName} size={scale(18)} color={iconColor} />
          </View>

          <View style={{ flex: 1, paddingRight: scale(8) }}>
            <Text style={styles.txnTitle} numberOfLines={1}>
              {item.order?.orderNumber
                ? `Order #${item.order.orderNumber}`
                : item.notes || typeLabel}
            </Text>
            <Text style={styles.txnSubtitle} numberOfLines={1}>
              {typeLabel} &middot; {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </Text>
            {item.grossAmount > 0 && item.commission > 0 && (
              <Text style={styles.txnBreakdown}>
                Gross: NPR {item.grossAmount} &middot; Superadmin Fee (1.5%): NPR {item.commission}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.txnRight}>
          <Text
            style={[
              styles.txnAmount,
              {
                color: isDirectQr
                  ? "#0284C7"
                  : isCodCustody
                  ? "#D97706"
                  : isCredit
                  ? "#15803D"
                  : "#DC2626",
              },
            ]}
          >
            {isCodCustody ? "" : isDirectQr ? "✓ " : isCredit ? "+" : "-"} NPR {Math.abs(item.amount).toLocaleString()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.status === "SETTLED" && { backgroundColor: "#DCFCE7" },
              item.status === "COMPLETED" && { backgroundColor: "#DCFCE7" },
              item.status === "DIRECT_SETTLED" && { backgroundColor: "#E0F2FE" },
              item.status === "CASH_IN_CUSTODY" && { backgroundColor: "#FEF9C3" },
              item.status === "PENDING" && { backgroundColor: "#EFF6FF" },
              item.status === "RECOVERED" && { backgroundColor: "#F3E8FF" },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === "SETTLED" && { color: "#15803D" },
                item.status === "COMPLETED" && { color: "#15803D" },
                item.status === "DIRECT_SETTLED" && { color: "#0369A1" },
                item.status === "CASH_IN_CUSTODY" && { color: "#854D0E" },
                item.status === "PENDING" && { color: "#1D4ED8" },
                item.status === "RECOVERED" && { color: "#7E22CE" },
              ]}
            >
              {item.status === "CASH_IN_CUSTODY"
                ? "In Custody"
                : item.status === "DIRECT_SETTLED"
                ? "Direct Paid"
                : item.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const bankAccountMasked = vendorDetails?.bankDetails?.accountNumber
    ? `****${vendorDetails.bankDetails.accountNumber.slice(-4)}`
    : "Not Configured";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Unified Vendor Header */}
      <VendorHeader
        activeRoute="/VendorMain/transaction"
        unreadCount={unreadCount}
      />

      {/* Sub Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance & Payouts</Text>
        <Text style={styles.headerSubtitle}>
          Real-time earnings, COD cash tracking, and bank withdrawals
        </Text>
      </View>

      {/* Balance Highlight Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.balanceBanner}>
          <View>
            <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
            <Text style={styles.balanceAmount}>
              NPR {(metrics.availableWithdrawalBalance || 0).toLocaleString()}
            </Text>
            <Text style={styles.balancePendingSub}>
              Pending Settlement: NPR {(metrics.pendingSettlement || 0).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.withdrawBtn}
            activeOpacity={0.8}
            onPress={() => setWithdrawModalVisible(true)}
          >
            <MaterialCommunityIcons
              name="bank-transfer-out"
              size={scale(16)}
              color="#FFFFFF"
            />
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* COD In Custody Alert Pill */}
        {metrics.codCashWithDeliveryBoys > 0 && (
          <View style={styles.codAlertBanner}>
            <MaterialCommunityIcons name="hand-coin" size={scale(16)} color="#854D0E" />
            <Text style={styles.codAlertText}>
              NPR {metrics.codCashWithDeliveryBoys.toLocaleString()} Cash on Delivery currently with riders.
            </Text>
          </View>
        )}

        {/* Pending Recovery Deficit Alert Pill */}
        {(metrics.pendingRecoveries || 0) > 0 && (
          <View style={[styles.codAlertBanner, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={scale(16)} color="#DC2626" />
            <Text style={[styles.codAlertText, { color: "#991B1B" }]}>
              NPR {(metrics.pendingRecoveries || 0).toLocaleString()} Pending Recovery Deficit: Deducted automatically from future payouts due to post-withdrawal refund.
            </Text>
          </View>
        )}

        <View style={styles.payoutScheduleRow}>
          <Ionicons name="information-circle-outline" size={scale(14)} color="#86C4CB" />
          <Text style={styles.payoutScheduleText}>
            Payouts sent to registered bank ({vendorDetails?.bankDetails?.bankName || "Bank"} A/C {bankAccountMasked}).
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(
          [
            { key: "ALL", label: "All" },
            { key: "SETTLED", label: "Settled" },
            { key: "PENDING", label: "Pending" },
            { key: "WITHDRAWAL", label: "Payouts" },
            { key: "COD", label: "COD" },
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === tab.key && styles.tabBtnTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(t) => t._id}
        renderItem={renderTransactionCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
        ListEmptyComponent={
          transactionsLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#016073" />
              <Text style={styles.emptyText}>Loading transactions...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={scale(32)} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions found for this filter.</Text>
            </View>
          )
        }
      />

      {/* ── WITHDRAWAL MODAL ────────────────────────────────────────── */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Payout</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Feather name="x" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBalanceBox}>
              <Text style={styles.modalBalanceLabel}>Available Withdrawable Balance:</Text>
              <Text style={styles.modalBalanceVal}>
                NPR {(metrics.availableWithdrawalBalance || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.modalBankBox}>
              <Text style={styles.modalBankLabel}>Payout Destination:</Text>
              <Text style={styles.modalBankVal}>
                {vendorDetails?.bankDetails?.bankName || "Bank"} &bull; A/C: {bankAccountMasked}
              </Text>
              <Text style={styles.modalBankSub}>
                Holder: {vendorDetails?.bankDetails?.accountHolderName || vendorDetails?.businessDetails?.businessName || "Store"}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Withdrawal Amount (NPR):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <Text style={styles.inputLabel}>Remarks / Reference (Optional):</Text>
            <TextInput
              style={[styles.textInput, { height: scale(60) }]}
              placeholder="e.g. Weekly settlement"
              multiline
              value={withdrawNotes}
              onChangeText={setWithdrawNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleWithdrawSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#016073",
  },
  headerSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(2),
  },
  bannerContainer: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(12),
    gap: scale(8),
  },
  balanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#016073",
    borderRadius: scale(14),
    padding: scale(16),
  },
  balanceLabel: {
    fontSize: moderateScale(11),
    color: "#86C4CB",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: scale(2),
  },
  balancePendingSub: {
    fontSize: moderateScale(10.5),
    color: "#E2E8F0",
    marginTop: scale(3),
  },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#008080",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    gap: scale(6),
  },
  withdrawBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  codAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#FDE047",
    gap: scale(8),
  },
  codAlertText: {
    fontSize: moderateScale(11.5),
    color: "#854D0E",
    fontWeight: "600",
    flex: 1,
  },
  payoutScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(4),
  },
  payoutScheduleText: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
    gap: scale(6),
  },
  tabBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(20),
    backgroundColor: "#E2E8F0",
  },
  tabBtnActive: {
    backgroundColor: "#016073",
  },
  tabBtnText: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(25),
    gap: scale(8),
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  txnIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: "center",
    justifyContent: "center",
  },
  txnTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  txnSubtitle: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  txnBreakdown: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
    marginTop: scale(2),
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
    marginTop: scale(3),
  },
  statusBadgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  emptyContainer: {
    paddingVertical: scale(40),
    alignItems: "center",
    gap: scale(8),
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: moderateScale(12.5),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(18),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(18),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: scale(10),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#016073",
  },
  modalBalanceBox: {
    backgroundColor: "#F0FDF4",
    padding: scale(10),
    borderRadius: scale(8),
    marginTop: scale(12),
  },
  modalBalanceLabel: {
    fontSize: moderateScale(11),
    color: "#15803D",
  },
  modalBalanceVal: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#15803D",
    marginTop: scale(2),
  },
  modalBankBox: {
    backgroundColor: "#F8FAFC",
    padding: scale(10),
    borderRadius: scale(8),
    marginTop: scale(8),
  },
  modalBankLabel: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  modalBankVal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: scale(2),
  },
  modalBankSub: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#334155",
    marginTop: scale(12),
    marginBottom: scale(4),
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: scale(16),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: scale(10),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: moderateScale(12.5),
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: scale(10),
    borderRadius: scale(8),
    backgroundColor: "#016073",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(12.5),
  },
});
