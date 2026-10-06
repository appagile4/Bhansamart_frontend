import VendorHeader from "@/components/VendorComponent/header";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TransactionItem {
  id: string;
  orderId: string;
  type: "Order Payout" | "Platform Fee" | "Bank Withdrawal";
  amount: number;
  date: string;
  status: "Completed" | "Processing" | "Failed";
  isCredit: boolean;
}

const SAMPLE_TXNS: TransactionItem[] = [
  {
    id: "tx-1",
    orderId: "Order #BM-9480",
    type: "Order Payout",
    amount: 680,
    date: "06 Oct, 11:30 AM",
    status: "Completed",
    isCredit: true,
  },
  {
    id: "tx-2",
    orderId: "Daily Settlement",
    type: "Bank Withdrawal",
    amount: 14500,
    date: "05 Oct, 06:00 PM",
    status: "Completed",
    isCredit: false,
  },
  {
    id: "tx-3",
    orderId: "Order #BM-9479",
    type: "Order Payout",
    amount: 2340,
    date: "05 Oct, 02:15 PM",
    status: "Completed",
    isCredit: true,
  },
  {
    id: "tx-4",
    orderId: "Order #BM-9475",
    type: "Order Payout",
    amount: 1120,
    date: "04 Oct, 08:45 PM",
    status: "Completed",
    isCredit: true,
  },
  {
    id: "tx-5",
    orderId: "Platform Commission (5%)",
    type: "Platform Fee",
    amount: 56,
    date: "04 Oct, 08:45 PM",
    status: "Completed",
    isCredit: false,
  },
];

export default function VendorTransactionScreen() {
  const [transactions, setTransactions] = useState<TransactionItem[]>(SAMPLE_TXNS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const renderTransactionCard = ({ item }: { item: TransactionItem }) => (
    <View style={styles.txnCard}>
      <View style={styles.txnLeft}>
        <View
          style={[
            styles.txnIconWrap,
            { backgroundColor: item.isCredit ? "#F0FDF4" : "#FEF2F2" },
          ]}
        >
          <Feather
            name={item.isCredit ? "arrow-down-left" : "arrow-up-right"}
            size={scale(18)}
            color={item.isCredit ? "#16A34A" : "#DC2626"}
          />
        </View>

        <View>
          <Text style={styles.txnTitle}>{item.orderId}</Text>
          <Text style={styles.txnSubtitle}>
            {item.type} &middot; {item.date}
          </Text>
        </View>
      </View>

      <View style={styles.txnRight}>
        <Text
          style={[
            styles.txnAmount,
            { color: item.isCredit ? "#15803D" : "#0F172A" },
          ]}
        >
          {item.isCredit ? "+" : "-"} NPR {item.amount.toLocaleString()}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Unified Vendor Header */}
      <VendorHeader activeRoute="/VendorMain/transaction" />

      {/* Sub Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance & Payouts</Text>
        <Text style={styles.headerSubtitle}>
          Earnings, settlement history, and bank payouts
        </Text>
      </View>

      {/* Balance Highlight Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.balanceBanner}>
          <View>
            <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
            <Text style={styles.balanceAmount}>NPR 28,450.00</Text>
          </View>

          <TouchableOpacity style={styles.withdrawBtn}>
            <MaterialCommunityIcons
              name="bank-transfer-out"
              size={scale(16)}
              color="#016073"
            />
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.payoutScheduleRow}>
          <Ionicons name="information-circle-outline" size={scale(14)} color="#86C4CB" />
          <Text style={styles.payoutScheduleText}>
            Auto-settlement runs daily at 6:00 PM directly to your registered bank account.
          </Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#016073",
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  bannerContainer: {
    margin: scale(16),
    backgroundColor: "#016073",
    borderRadius: scale(14),
    padding: scale(16),
    shadowColor: "#016073",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: moderateScale(12),
    color: "#86C4CB",
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: scale(2),
  },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    gap: scale(5),
  },
  withdrawBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#016073",
  },
  payoutScheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: moderateScale(14),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  payoutScheduleText: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.8)",
    flex: 1,
    lineHeight: moderateScale(15),
  },
  sectionHeader: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#016073",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(8),
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  txnSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  statusBadge: {
    marginTop: scale(2),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    color: "#15803D",
    fontWeight: "600",
  },
});

