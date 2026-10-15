import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchRewardsWallet,
  fetchRewardTransactions,
} from "@/store/slices/referralSlice";
import { RewardTransactionItem } from "@/store/services/referralService";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Transaction Item Card ──────────────────────────────────────────────
const TransactionCard = memo(function TransactionCard({
  item,
}: {
  item: RewardTransactionItem;
}) {
  const isCredit = item.type === "CREDIT";
  const isReversal = item.type === "REVERSAL";

  const dateFormatted = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString([], {
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
              backgroundColor: isCredit
                ? "#DCFCE7"
                : isReversal
                ? "#FEF2F2"
                : "#EFF6FF",
            },
          ]}
        >
          {isCredit ? (
            <Feather name="arrow-down-left" size={scale(18)} color="#15803D" />
          ) : isReversal ? (
            <Feather name="rotate-ccw" size={scale(18)} color="#DC2626" />
          ) : (
            <Feather name="arrow-up-right" size={scale(18)} color="#1D4ED8" />
          )}
        </View>

        <View style={styles.txnInfo}>
          <Text style={styles.txnReason} numberOfLines={1}>
            {item.reason}
          </Text>
          <Text style={styles.txnDate}>{dateFormatted}</Text>
        </View>
      </View>

      <View style={styles.txnRight}>
        <Text
          style={[
            styles.txnPoints,
            { color: isCredit ? "#15803D" : "#DC2626" },
          ]}
        >
          {isCredit ? "+" : "-"}
          {item.points} Pts
        </Text>
        <Text style={styles.balanceAfterText}>
          Bal: {item.balanceAfter} Pts
        </Text>
      </View>
    </View>
  );
});

export default function LoyaltyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    wallet,
    walletLoading,
    transactions,
    transactionsTotal,
    transactionsPage,
    transactionsTotalPages,
    transactionsLoading,
  } = useAppSelector((state) => state.referral);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchRewardsWallet());
    dispatch(fetchRewardTransactions({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchRewardsWallet()),
      dispatch(fetchRewardTransactions({ page: 1, limit: 20 })),
    ]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (transactionsLoading || transactionsPage >= transactionsTotalPages) return;
    dispatch(
      fetchRewardTransactions({
        page: transactionsPage + 1,
        limit: 20,
      })
    );
  };

  const availablePoints = wallet?.availablePoints || 0;
  const lifetimeEarned = wallet?.lifetimeEarned || availablePoints;
  const lifetimeRedeemed = wallet?.lifetimeRedeemed || 0;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Points Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="sparkles" size={scale(20)} color="#FFFFFF" />
          </View>
          <View style={styles.pointsPill}>
            <Text style={styles.pointsPillText}>Authoritative Ledger</Text>
          </View>
        </View>

        <Text style={styles.heroLabel}>Available Reward Points</Text>
        <Text style={styles.heroPointsVal}>{availablePoints.toLocaleString()}</Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Lifetime Earned</Text>
            <Text style={styles.heroStatVal}>+{lifetimeEarned.toLocaleString()}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Redeemed</Text>
            <Text style={styles.heroStatVal}>{lifetimeRedeemed.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.earnMoreBtn}
          onPress={() => router.push("/Screens/Profile/refer-and-earned" as any)}
          activeOpacity={0.85}
        >
          <Feather name="gift" size={scale(16)} color="#016073" />
          <Text style={styles.earnMoreBtnText}>Earn More Points via Referrals</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions Section Title */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Points Ledger History</Text>
        <Text style={styles.sectionCount}>
          {transactionsTotal} transaction{transactionsTotal === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
  );

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
          <Text style={styles.navTitle}>Rewards Wallet</Text>
          <Text style={styles.navSub}>Points Balance & Transaction Ledger</Text>
        </View>
        <TouchableOpacity
          style={styles.referNavBtn}
          onPress={() => router.push("/Screens/Profile/refer-and-earned" as any)}
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={scale(16)} color="#016073" />
        </TouchableOpacity>
      </View>

      {walletLoading && !wallet ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#016073" />
          <Text style={styles.loadingText}>Loading rewards wallet...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id || item.idempotencyKey}
          renderItem={({ item }) => <TransactionCard item={item} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#016073"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={scale(48)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Transactions Recorded</Text>
              <Text style={styles.emptySubtitle}>
                Invite your friends or participate in loyalty campaigns to earn bonus points!
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push("/Screens/Profile/refer-and-earned" as any)}
                activeOpacity={0.8}
              >
                <Feather name="gift" size={scale(16)} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Invite & Earn Points</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    gap: scale(12),
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
  referNavBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    color: "#64748B",
  },
  listContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  headerContainer: {
    marginBottom: moderateScale(12),
  },
  heroCard: {
    backgroundColor: "#016073",
    borderRadius: scale(16),
    padding: scale(18),
    shadowColor: "#016073",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: moderateScale(16),
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIconCircle: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsPill: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
  },
  pointsPillText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  heroLabel: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginTop: moderateScale(12),
  },
  heroPointsVal: {
    color: "#FFFFFF",
    fontSize: moderateScale(32),
    fontWeight: "900",
    marginTop: scale(2),
    letterSpacing: -0.5,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: scale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(12),
    marginTop: moderateScale(14),
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatLabel: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  heroStatVal: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginTop: scale(2),
  },
  heroStatDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  earnMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#FFFFFF",
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
    marginTop: moderateScale(14),
  },
  earnMoreBtnText: {
    color: "#016073",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },
  sectionTitle: {
    fontSize: moderateScale(14.5),
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
    marginBottom: moderateScale(8),
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
  txnInfo: {
    flex: 1,
  },
  txnReason: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  txnDate: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  txnRight: {
    alignItems: "flex-end",
    gap: scale(2),
  },
  txnPoints: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  balanceAfterText: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(50),
    paddingHorizontal: scale(24),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
    marginTop: moderateScale(10),
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    textAlign: "center",
    marginTop: scale(4),
    lineHeight: scale(16),
    marginBottom: moderateScale(18),
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    paddingHorizontal: scale(18),
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12.5),
    fontWeight: "800",
  },
});
