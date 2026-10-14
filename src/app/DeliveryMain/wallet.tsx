import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchDepositStatus,
  fetchEarningsSummary,
  paySecurityDeposit,
} from "@/store/slices/deliverySlice";
import deliveryService from "@/store/services/deliveryService";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeliveryWalletScreen() {
  const dispatch = useAppDispatch();
  const { earnings, securityDeposit, actionLoading, availability, activeOrder } =
    useAppSelector((state) => state.delivery);

  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchEarningsSummary());
    dispatch(fetchDepositStatus());
  }, [dispatch]);

  const handlePayDeposit = async () => {
    try {
      await dispatch(paySecurityDeposit()).unwrap();
      dispatch(fetchDepositStatus());
      Alert.alert(
        "Deposit Paid Successfully!",
        "Your ₹1,000 security deposit has been confirmed and logged in the Security Deposit Ledger."
      );
    } catch (err: any) {
      Alert.alert("Deposit Error", err || "Failed to process security deposit.");
    }
  };

  const handleRefundRequest = async () => {
    if (availability === "ONLINE") {
      Alert.alert(
        "Action Required",
        "Please toggle your availability switch to OFFLINE before requesting a deposit refund."
      );
      return;
    }
    if (activeOrder) {
      Alert.alert(
        "Active Delivery",
        "Cannot request deposit refund while fulfilling an active delivery order."
      );
      return;
    }

    Alert.alert(
      "Confirm Deposit Refund",
      "Are you sure you want to request a refund of your ₹1,000 security deposit? Your delivery partner account will be paused.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Refund",
          style: "destructive",
          onPress: async () => {
            try {
              setRefundLoading(true);
              await deliveryService.requestDepositRefund("Voluntary partner offboarding");
              dispatch(fetchDepositStatus());
              Alert.alert(
                "Refund Requested",
                "Your ₹1,000 security deposit refund request is logged and submitted for admin review."
              );
            } catch (err: any) {
              Alert.alert("Refund Error", err.message || "Failed to submit refund request.");
            } finally {
              setRefundLoading(false);
            }
          },
        },
      ]
    );
  };

  const isDepositPaid = securityDeposit.status === "PAID";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header Banner */}
      <LinearGradient
        colors={["#0F766E", "#0D9488", "#115E59"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Earnings & Deposit Wallet</Text>
        <Text style={styles.headerSubtitle}>
          Separated Ledgers • Transparent Pay & Escrow
        </Text>

        {/* Big Balance Card */}
        <View style={styles.walletBalanceCard}>
          <Text style={styles.balanceLabel}>WITHDRAWABLE EARNINGS</Text>
          <Text style={styles.balanceValue}>
            ₹{earnings.wallet.currentBalance.toFixed(2)}
          </Text>
          <Text style={styles.lifetimeEarned}>
            Lifetime Earned: ₹{earnings.wallet.totalEarned.toFixed(2)}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statIconBox}>
              <Feather name="calendar" size={scale(16)} color="#0F766E" />
            </View>
            <Text style={styles.statLabel}>Today's Pay</Text>
            <Text style={styles.statValue}>₹{earnings.today.earnings}</Text>
            <Text style={styles.statSub}>
              {earnings.today.deliveriesCount} deliveries
            </Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: "#DBEAFE" }]}>
              <Feather name="trending-up" size={scale(16)} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>₹{earnings.week.earnings}</Text>
            <Text style={styles.statSub}>
              {earnings.week.deliveriesCount} deliveries
            </Text>
          </View>
        </View>

        {/* ── MANDATORY ₹1,000 SECURITY DEPOSIT LEDGER CARD ──────────── */}
        <View style={styles.depositCard}>
          <View style={styles.depositHeaderRow}>
            <View style={styles.depositBadgeIcon}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={scale(22)}
                color="#0F766E"
              />
            </View>
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.depositTitle}>Security Deposit Ledger</Text>
              <Text style={styles.depositSub}>
                Mandatory ₹1,000 Escrow Deposit
              </Text>
            </View>
            <View
              style={[
                styles.statusChip,
                isDepositPaid && styles.statusChipPaid,
                securityDeposit.status === "REFUND_REQUESTED" && styles.statusChipRefund,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  isDepositPaid && styles.statusChipPaidText,
                  securityDeposit.status === "REFUND_REQUESTED" && styles.statusChipRefundText,
                ]}
              >
                {securityDeposit.status}
              </Text>
            </View>
          </View>

          <Text style={styles.depositDescription}>
            In accordance with platform policy, a ₹1,000 security deposit is kept in a separate ledger. It is 100% refundable upon voluntary offboarding.
          </Text>

          {!isDepositPaid ? (
            <TouchableOpacity
              style={styles.payDepositBtn}
              onPress={handlePayDeposit}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Feather name="credit-card" size={scale(16)} color="#FFFFFF" />
                  <Text style={styles.payDepositBtnText}>
                    Pay ₹1,000 Security Deposit
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.paidDepositRow}>
              <View style={styles.paidCheckRow}>
                <Ionicons name="checkmark-circle" size={scale(18)} color="#10B981" />
                <Text style={styles.paidDepositText}>Deposit Paid & Active (₹1,000)</Text>
              </View>

              <TouchableOpacity
                style={styles.refundBtn}
                onPress={handleRefundRequest}
                disabled={refundLoading || securityDeposit.status === "REFUND_REQUESTED"}
              >
                <Text style={styles.refundBtnText}>Request Refund</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── DELIVERY EARNINGS TRANSACTIONS ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Delivery Earnings Ledger</Text>
        <Text style={styles.sectionSubtitle}>
          ₹40 Base Pay + Distance Pay per delivered grocery order
        </Text>

        {earnings.transactions && earnings.transactions.length > 0 ? (
          earnings.transactions.map((tx: any) => (
            <View key={tx._id} style={styles.txCard}>
              <View style={styles.txIconBox}>
                <Feather name="arrow-down-left" size={scale(18)} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.txOrderNumber}>
                  Order #{tx.order?.orderNumber || "COMPLETED"}
                </Text>
                <Text style={styles.txDetails}>
                  Base ₹{tx.basePay} • Distance ₹{tx.distancePay}
                  {tx.customerTip > 0 ? ` • Tip ₹${tx.customerTip}` : ""}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={styles.txAmount}>+₹{tx.totalEarnings}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyTxCard}>
            <Feather name="inbox" size={scale(36)} color="#94A3B8" />
            <Text style={styles.emptyTxText}>No delivery earnings yet.</Text>
            <Text style={styles.emptyTxSub}>
              Accept and fulfill orders from the Dashboard to build your ledger.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(30),
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    color: "#CCFBF1",
    marginTop: moderateScale(2),
    marginBottom: moderateScale(16),
  },
  walletBalanceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: scale(14),
    padding: scale(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  balanceLabel: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#CCFBF1",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: moderateScale(28),
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: moderateScale(4),
  },
  lifetimeEarned: {
    fontSize: moderateScale(11),
    color: "#E6FFFA",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  statsGrid: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: -moderateScale(12),
    marginBottom: moderateScale(16),
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(8),
  },
  statLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
  },
  statValue: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: moderateScale(2),
  },
  statSub: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
  },
  depositCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1.5,
    borderColor: "#CCFBF1",
    marginBottom: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  depositHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  depositBadgeIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  depositTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
  },
  depositSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  statusChip: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
  },
  statusChipPaid: {
    backgroundColor: "#ECFDF5",
  },
  statusChipRefund: {
    backgroundColor: "#FEE2E2",
  },
  statusChipText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#B45309",
  },
  statusChipPaidText: {
    color: "#059669",
  },
  statusChipRefundText: {
    color: "#DC2626",
  },
  depositDescription: {
    fontSize: moderateScale(11),
    color: "#475569",
    lineHeight: moderateScale(16),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  payDepositBtn: {
    backgroundColor: "#0F766E",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  payDepositBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paidDepositRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDFA",
    padding: scale(10),
    borderRadius: scale(8),
  },
  paidCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  paidDepositText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#065F46",
  },
  refundBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(4),
  },
  refundBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#DC2626",
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginBottom: moderateScale(12),
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: moderateScale(8),
  },
  txIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  txOrderNumber: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  txDetails: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  txDate: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    marginTop: moderateScale(2),
  },
  txAmount: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#059669",
  },
  emptyTxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    paddingVertical: moderateScale(30),
    paddingHorizontal: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTxText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: moderateScale(8),
  },
  emptyTxSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    textAlign: "center",
    marginTop: moderateScale(4),
  },
});
