import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCodCustodySummary,
  fetchDepositStatus,
  fetchEarningsSummary,
  paySecurityDeposit,
} from "@/store/slices/deliverySlice";
import deliveryService from "@/store/services/deliveryService";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeliveryWalletScreen() {
  const dispatch = useAppDispatch();
  const {
    earnings,
    codCustody,
    securityDeposit,
    actionLoading,
    availability,
    activeOrder,
  } = useAppSelector((state) => state.delivery);

  const [activeTab, setActiveTab] = useState<"EARNINGS" | "COD_CUSTODY">("EARNINGS");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchEarningsSummary()),
      dispatch(fetchDepositStatus()),
      dispatch(fetchCodCustodySummary()),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleVendorOrders = (vendorId: string) => {
    setExpandedVendors((prev) => ({
      ...prev,
      [vendorId]: !prev[vendorId],
    }));
  };

  const dialPhone = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

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
  const hasCashInCustody = Number(codCustody.currentCashInCustody || 0) > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header Banner */}
      <LinearGradient
        colors={
          activeTab === "EARNINGS"
            ? ["#0F766E", "#0D9488", "#115E59"]
            : ["#B45309", "#D97706", "#78350F"]
        }
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>
          {activeTab === "EARNINGS"
            ? "Earnings & Deposit Wallet"
            : "COD Cash Custody Wallet"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === "EARNINGS"
            ? "Separated Ledgers • Transparent Pay & Escrow"
            : "Physical Cash Collected • Due Handover to Store Counters"}
        </Text>

        {/* Big Balance Card */}
        {activeTab === "EARNINGS" ? (
          <View style={styles.walletBalanceCard}>
            <Text style={styles.balanceLabel}>WITHDRAWABLE EARNINGS</Text>
            <Text style={styles.balanceValue}>
              ₹{earnings.wallet.currentBalance.toFixed(2)}
            </Text>
            <Text style={styles.lifetimeEarned}>
              Lifetime Earned: ₹{earnings.wallet.totalEarned.toFixed(2)}
            </Text>
          </View>
        ) : (
          <View style={[styles.walletBalanceCard, { backgroundColor: "rgba(0,0,0,0.22)" }]}>
            <Text style={styles.balanceLabel}>PHYSICAL CASH IN HAND (TO RETURN)</Text>
            <Text style={[styles.balanceValue, { color: "#FEF08A" }]}>
              ₹{Number(codCustody.currentCashInCustody || 0).toFixed(2)}
            </Text>
            <Text style={styles.lifetimeEarned}>
              Lifetime Collected: ₹{Number(codCustody.totalCashCollected || 0).toFixed(2)} • Handed Over: ₹{Number(codCustody.totalCashSubmitted || 0).toFixed(2)}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "EARNINGS" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("EARNINGS")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="wallet-outline"
            size={scale(16)}
            color={activeTab === "EARNINGS" ? "#0F766E" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "EARNINGS" && styles.tabTextActive,
            ]}
          >
            Earnings & Pay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "COD_CUSTODY" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("COD_CUSTODY")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={scale(16)}
            color={activeTab === "COD_CUSTODY" ? "#D97706" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "COD_CUSTODY" && styles.tabTextActiveOrange,
            ]}
          >
            COD Cash Custody
          </Text>
          {hasCashInCustody && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                ₹{codCustody.currentCashInCustody}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "EARNINGS" ? (
          <>
            {/* Banner if Cash In Custody is pending */}
            {hasCashInCustody && (
              <TouchableOpacity
                style={styles.custodyAlertBanner}
                onPress={() => setActiveTab("COD_CUSTODY")}
                activeOpacity={0.85}
              >
                <View style={styles.custodyAlertIcon}>
                  <MaterialCommunityIcons
                    name="hand-coin"
                    size={scale(20)}
                    color="#D97706"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: scale(10) }}>
                  <Text style={styles.custodyAlertTitle}>
                    ₹{codCustody.currentCashInCustody} COD Cash in Hand
                  </Text>
                  <Text style={styles.custodyAlertSub}>
                    Collected from customers. Tap to view vendor store breakdown & deposit receipts.
                  </Text>
                </View>
                <Feather name="chevron-right" size={scale(18)} color="#92400E" />
              </TouchableOpacity>
            )}

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
                    securityDeposit.status === "REFUND_REQUESTED" &&
                      styles.statusChipRefund,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      isDepositPaid && styles.statusChipPaidText,
                      securityDeposit.status === "REFUND_REQUESTED" &&
                        styles.statusChipRefundText,
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
                      <Feather
                        name="credit-card"
                        size={scale(16)}
                        color="#FFFFFF"
                      />
                      <Text style={styles.payDepositBtnText}>
                        Pay ₹1,000 Security Deposit
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.paidDepositRow}>
                  <View style={styles.paidCheckRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={scale(18)}
                      color="#10B981"
                    />
                    <Text style={styles.paidDepositText}>
                      Deposit Paid & Active (₹1,000)
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.refundBtn}
                    onPress={handleRefundRequest}
                    disabled={
                      refundLoading ||
                      securityDeposit.status === "REFUND_REQUESTED"
                    }
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
                    <Feather
                      name="arrow-down-left"
                      size={scale(18)}
                      color="#059669"
                    />
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
          </>
        ) : (
          /* ── COD CASH CUSTODY TAB ───────────────────────────────────────── */
          <>
            {/* 3 Quick COD Metrics */}
            <View style={styles.custodyMetricsRow}>
              <View style={[styles.custodyMetricBox, { borderColor: "#FCD34D" }]}>
                <Text style={styles.custodyMetricLabel}>CASH IN HAND</Text>
                <Text style={[styles.custodyMetricValue, { color: "#D97706" }]}>
                  ₹{Number(codCustody.currentCashInCustody || 0)}
                </Text>
                <Text style={styles.custodyMetricSub}>Due to Stores</Text>
              </View>

              <View style={[styles.custodyMetricBox, { borderColor: "#A7F3D0" }]}>
                <Text style={styles.custodyMetricLabel}>RETURNED</Text>
                <Text style={[styles.custodyMetricValue, { color: "#059669" }]}>
                  ₹{Number(codCustody.totalCashSubmitted || 0)}
                </Text>
                <Text style={styles.custodyMetricSub}>Handed Over</Text>
              </View>

              <View style={[styles.custodyMetricBox, { borderColor: "#BFDBFE" }]}>
                <Text style={styles.custodyMetricLabel}>COLLECTED</Text>
                <Text style={[styles.custodyMetricValue, { color: "#2563EB" }]}>
                  ₹{Number(codCustody.totalCashCollected || 0)}
                </Text>
                <Text style={styles.custodyMetricSub}>Lifetime COD</Text>
              </View>
            </View>

            {/* Section 1: Konsa Vendor Ka Hai (Store-wise breakdown) */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Konsa Vendor Ka Hai</Text>
                <Text style={styles.sectionSubtitle}>
                  Store-by-store collected cash & pending return status
                </Text>
              </View>
            </View>

            {codCustody.vendorBreakdown && codCustody.vendorBreakdown.length > 0 ? (
              codCustody.vendorBreakdown.map((v) => {
                const isPending = Number(v.pendingHandover || 0) > 0;
                const isExpanded = expandedVendors[v.vendorId];

                return (
                  <View key={v.vendorId} style={styles.vendorCustodyCard}>
                    {/* Top Row: Store Details + Status */}
                    <View style={styles.vendorCardHeader}>
                      <View style={styles.vendorIconBox}>
                        <MaterialCommunityIcons
                          name="storefront-outline"
                          size={scale(22)}
                          color="#0F766E"
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: scale(10) }}>
                        <Text style={styles.vendorStoreName}>{v.storeName}</Text>
                        {v.storeAddress ? (
                          <Text style={styles.vendorAddress} numberOfLines={1}>
                            <Feather name="map-pin" size={scale(10)} color="#64748B" />{" "}
                            {v.storeAddress}
                          </Text>
                        ) : null}
                      </View>

                      {v.storePhone ? (
                        <TouchableOpacity
                          style={styles.callStoreBtn}
                          onPress={() => dialPhone(v.storePhone)}
                          activeOpacity={0.8}
                        >
                          <Feather name="phone-call" size={scale(14)} color="#0F766E" />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Pending Handover Badge */}
                    <View
                      style={[
                        styles.handoverStatusBanner,
                        isPending
                          ? styles.handoverPendingBanner
                          : styles.handoverClearedBanner,
                      ]}
                    >
                      <View style={styles.handoverStatusRow}>
                        <Feather
                          name={isPending ? "alert-circle" : "check-circle"}
                          size={scale(14)}
                          color={isPending ? "#D97706" : "#059669"}
                        />
                        <Text
                          style={[
                            styles.handoverStatusText,
                            isPending
                              ? styles.handoverPendingText
                              : styles.handoverClearedText,
                          ]}
                        >
                          {isPending
                            ? `₹${v.pendingHandover} Due to return at store counter`
                            : "All cash returned & verified by vendor"}
                        </Text>
                      </View>
                    </View>

                    {/* Detailed Stats for this Vendor */}
                    <View style={styles.vendorStatsGrid}>
                      <View style={styles.vendorStatItem}>
                        <Text style={styles.vendorStatSmallLabel}>Total Cash Collected</Text>
                        <Text style={styles.vendorStatBigValue}>
                          ₹{v.totalCollected}
                        </Text>
                        <Text style={styles.vendorStatOrderCount}>
                          {v.orders?.length || 0} COD orders
                        </Text>
                      </View>

                      <View style={styles.vendorStatDivider} />

                      <View style={styles.vendorStatItem}>
                        <Text style={styles.vendorStatSmallLabel}>Wapse Kar Diya</Text>
                        <Text
                          style={[
                            styles.vendorStatBigValue,
                            { color: "#059669" },
                          ]}
                        >
                          ₹{v.totalSubmitted}
                        </Text>
                        <Text style={styles.vendorStatOrderCount}>
                          {v.submittedOrdersCount || 0} submitted
                        </Text>
                      </View>

                      <View style={styles.vendorStatDivider} />

                      <View style={styles.vendorStatItem}>
                        <Text style={styles.vendorStatSmallLabel}>Pending Wapse</Text>
                        <Text
                          style={[
                            styles.vendorStatBigValue,
                            { color: isPending ? "#DC2626" : "#059669" },
                          ]}
                        >
                          ₹{v.pendingHandover}
                        </Text>
                        <Text style={styles.vendorStatOrderCount}>
                          {v.pendingOrdersCount || 0} pending
                        </Text>
                      </View>
                    </View>

                    {/* Toggle Order Details */}
                    {v.orders && v.orders.length > 0 && (
                      <>
                        <TouchableOpacity
                          style={styles.toggleOrdersBtn}
                          onPress={() => toggleVendorOrders(v.vendorId)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.toggleOrdersBtnText}>
                            {isExpanded
                              ? "Hide Order Details"
                              : `View ${v.orders.length} Collected Orders`}
                          </Text>
                          <Feather
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={scale(14)}
                            color="#0F766E"
                          />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.vendorOrdersList}>
                            {v.orders.map((ord: any) => (
                              <View key={ord._id} style={styles.vendorOrderItem}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.vendorOrderNumber}>
                                    Order #{ord.orderNumber}
                                  </Text>
                                  <Text style={styles.vendorOrderDate}>
                                    Collected:{" "}
                                    {new Date(
                                      ord.collectedAt || Date.now()
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Text>
                                </View>

                                <View style={{ alignItems: "flex-end" }}>
                                  <Text style={styles.vendorOrderAmount}>
                                    ₹{ord.amount}
                                  </Text>
                                  <View
                                    style={[
                                      styles.orderSubmittedChip,
                                      ord.isSubmitted
                                        ? styles.orderSubmittedChipYes
                                        : styles.orderSubmittedChipNo,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.orderSubmittedChipText,
                                        ord.isSubmitted
                                          ? styles.orderSubmittedChipTextYes
                                          : styles.orderSubmittedChipTextNo,
                                      ]}
                                    >
                                      {ord.isSubmitted
                                        ? "Wapse Done ✅"
                                        : "In Hand ⚠️"}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyTxCard}>
                <MaterialCommunityIcons
                  name="hand-coin-outline"
                  size={scale(40)}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTxText}>No COD Cash in Hand</Text>
                <Text style={styles.emptyTxSub}>
                  When you deliver Cash on Delivery orders, vendor-wise cash collections will be tracked here.
                </Text>
              </View>
            )}

            {/* Section 2: Kitna Wapse Kar Diya (Handover Receipts) */}
            <View style={[styles.sectionHeaderRow, { marginTop: moderateScale(20) }]}>
              <View>
                <Text style={styles.sectionTitle}>Kitna Wapse Kar Diya Hai</Text>
                <Text style={styles.sectionSubtitle}>
                  Verified counter receipts confirmed by store owners
                </Text>
              </View>
            </View>

            {codCustody.handovers && codCustody.handovers.length > 0 ? (
              codCustody.handovers.map((h: any) => (
                <View key={h._id || h.receiptNumber} style={styles.receiptCard}>
                  <View style={styles.receiptTopRow}>
                    <View style={styles.receiptIconBox}>
                      <MaterialCommunityIcons
                        name="receipt"
                        size={scale(20)}
                        color="#059669"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={styles.receiptNumber}>
                        Receipt #{h.receiptNumber || "COD-RECEIPT"}
                      </Text>
                      <Text style={styles.receiptStoreName}>
                        Store: {h.vendor?.businessDetails?.businessName || "Vendor Counter"}
                      </Text>
                      <Text style={styles.receiptDate}>
                        {new Date(h.verifiedAt || h.createdAt).toLocaleDateString(
                          [],
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.receiptSubmittedAmount}>
                        -₹{h.amountSubmitted}
                      </Text>
                      <View style={styles.receiptVerifiedBadge}>
                        <Feather name="check" size={scale(10)} color="#065F46" />
                        <Text style={styles.receiptVerifiedText}>CONFIRMED</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptBottomRow}>
                    <Text style={styles.receiptBalanceText}>
                      Remaining Due Balance: ₹{h.remainingBalance || 0}
                    </Text>
                    <Text style={styles.receiptPaymentMode}>
                      Mode: {h.paymentMode || "PHYSICAL_CASH"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyTxCard}>
                <Feather name="file-text" size={scale(36)} color="#94A3B8" />
                <Text style={styles.emptyTxText}>No Handover Receipts Yet</Text>
                <Text style={styles.emptyTxSub}>
                  When you submit cash to the vendor's store counter, they will confirm handover and issue a verified digital receipt.
                </Text>
              </View>
            )}
          </>
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
    paddingBottom: moderateScale(24),
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
    marginBottom: moderateScale(14),
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: scale(12),
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    padding: scale(4),
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    gap: scale(6),
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#0F766E",
  },
  tabTextActiveOrange: {
    color: "#D97706",
  },
  tabBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(10),
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  custodyAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    marginBottom: moderateScale(16),
  },
  custodyAlertIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  custodyAlertTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#92400E",
  },
  custodyAlertSub: {
    fontSize: moderateScale(10),
    color: "#B45309",
    marginTop: moderateScale(2),
  },
  statsGrid: {
    flexDirection: "row",
    gap: scale(12),
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
  sectionHeaderRow: {
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(2),
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

  /* COD Custody Styles */
  custodyMetricsRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: moderateScale(16),
  },
  custodyMetricBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  custodyMetricLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.3,
  },
  custodyMetricValue: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    marginVertical: moderateScale(2),
  },
  custodyMetricSub: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
  },
  vendorCustodyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vendorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorStoreName: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  vendorAddress: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  callStoreBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  handoverStatusBanner: {
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    marginVertical: moderateScale(10),
  },
  handoverPendingBanner: {
    backgroundColor: "#FEF3C7",
  },
  handoverClearedBanner: {
    backgroundColor: "#ECFDF5",
  },
  handoverStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  handoverStatusText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  handoverPendingText: {
    color: "#B45309",
  },
  handoverClearedText: {
    color: "#065F46",
  },
  vendorStatsGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    padding: scale(10),
    alignItems: "center",
  },
  vendorStatItem: {
    flex: 1,
    alignItems: "center",
  },
  vendorStatDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#CBD5E1",
  },
  vendorStatSmallLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  vendorStatBigValue: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#0F172A",
    marginVertical: moderateScale(2),
  },
  vendorStatOrderCount: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
  },
  toggleOrdersBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(10),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: scale(4),
  },
  toggleOrdersBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F766E",
  },
  vendorOrdersList: {
    marginTop: moderateScale(10),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(8),
    padding: scale(8),
  },
  vendorOrderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  vendorOrderNumber: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F172A",
  },
  vendorOrderDate: {
    fontSize: moderateScale(9),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  vendorOrderAmount: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#0F172A",
  },
  orderSubmittedChip: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
    marginTop: moderateScale(2),
  },
  orderSubmittedChipYes: {
    backgroundColor: "#ECFDF5",
  },
  orderSubmittedChipNo: {
    backgroundColor: "#FEF3C7",
  },
  orderSubmittedChipText: {
    fontSize: moderateScale(8),
    fontWeight: "800",
  },
  orderSubmittedChipTextYes: {
    color: "#059669",
  },
  orderSubmittedChipTextNo: {
    color: "#B45309",
  },

  /* Handover Receipts */
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptNumber: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#0F172A",
  },
  receiptStoreName: {
    fontSize: moderateScale(11),
    color: "#475569",
    marginTop: moderateScale(1),
  },
  receiptDate: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    marginTop: moderateScale(1),
  },
  receiptSubmittedAmount: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    color: "#059669",
  },
  receiptVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    backgroundColor: "#D1FAE5",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
    marginTop: moderateScale(2),
  },
  receiptVerifiedText: {
    fontSize: moderateScale(8),
    fontWeight: "800",
    color: "#065F46",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
  receiptBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptBalanceText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#64748B",
  },
  receiptPaymentMode: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
  },
});
