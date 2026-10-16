import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchRewardsWallet,
  fetchRewardTransactions,
} from "@/store/slices/referralSlice";
import { RewardTransactionItem } from "@/store/services/referralService";
import { moderateScale, scale, useTheme } from "@/theme";
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
  isDark,
}: {
  item: RewardTransactionItem;
  isDark: boolean;
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

  const iconWrapBg = isCredit
    ? isDark
      ? "rgba(34, 197, 94, 0.18)"
      : "#DCFCE7"
    : isReversal
    ? isDark
      ? "rgba(239, 68, 68, 0.18)"
      : "#FEF2F2"
    : isDark
    ? "rgba(59, 130, 246, 0.18)"
    : "#EFF6FF";

  const iconColor = isCredit
    ? isDark
      ? "#4ADE80"
      : "#15803D"
    : isReversal
    ? isDark
      ? "#F87171"
      : "#DC2626"
    : isDark
    ? "#60A5FA"
    : "#1D4ED8";

  return (
    <View
      style={[
        styles.txnCard,
        {
          backgroundColor: isDark ? "#151D24" : "#FFFFFF",
          borderColor: isDark ? "#303B45" : "#F1F5F9",
        },
      ]}
    >
      <View style={styles.txnLeft}>
        <View style={[styles.txnIconWrap, { backgroundColor: iconWrapBg }]}>
          {isCredit ? (
            <Feather name="arrow-down-left" size={scale(18)} color={iconColor} />
          ) : isReversal ? (
            <Feather name="rotate-ccw" size={scale(18)} color={iconColor} />
          ) : (
            <Feather name="arrow-up-right" size={scale(18)} color={iconColor} />
          )}
        </View>

        <View style={styles.txnInfo}>
          <Text
            style={[
              styles.txnReason,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
            numberOfLines={1}
          >
            {item.reason}
          </Text>
          <Text
            style={[
              styles.txnDate,
              { color: isDark ? "#A8B2BE" : "#64748B" },
            ]}
          >
            {dateFormatted}
          </Text>
        </View>
      </View>

      <View style={styles.txnRight}>
        <Text
          style={[
            styles.txnPoints,
            {
              color: isCredit
                ? isDark
                  ? "#4ADE80"
                  : "#15803D"
                : isDark
                ? "#F87171"
                : "#DC2626",
            },
          ]}
        >
          {isCredit ? "+" : "-"}
          {item.points} Pts
        </Text>
        <Text
          style={[
            styles.balanceAfterText,
            { color: isDark ? "#64748B" : "#94A3B8" },
          ]}
        >
          Bal: {item.balanceAfter} Pts
        </Text>
      </View>
    </View>
  );
});

export default function LoyaltyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const {
    wallet,
    walletLoading,
    transactions,
    transactionsTotal,
    transactionsPage,
    transactionsTotalPages,
  } = useAppSelector((state) => state.referral);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchRewardsWallet());
    dispatch(fetchRewardTransactions({ page: 1, limit: 15 }));
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchRewardsWallet()),
      dispatch(fetchRewardTransactions({ page: 1, limit: 15 })),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (transactionsPage < transactionsTotalPages) {
      dispatch(
        fetchRewardTransactions({
          page: transactionsPage + 1,
          limit: 15,
        })
      );
    }
  }, [dispatch, transactionsPage, transactionsTotalPages]);

  const renderHeader = () => {
    const available = wallet?.availablePoints ?? 0;
    const pending = (wallet as any)?.pendingPoints ?? 0;
    const totalEarned = wallet?.lifetimeEarned ?? available;

    return (
      <View style={styles.headerContainer}>
        {/* Hero Card */}
        <View
          style={[
            styles.heroCard,
            isDark && { backgroundColor: "#003844", shadowColor: "#000" },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="star" size={scale(20)} color="#FBBF24" />
            </View>
            <View style={styles.pointsPill}>
              <Text style={styles.pointsPillText}>Bhansa Rewards</Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>Available Balance</Text>
          <Text style={styles.heroPointsVal}>{available} Pts</Text>

          {/* Stats Bar */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Lifetime Earned</Text>
              <Text style={styles.heroStatVal}>{totalEarned} Pts</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Pending Verification</Text>
              <Text style={styles.heroStatVal}>{pending} Pts</Text>
            </View>
          </View>

          {/* Earn More CTA */}
          <TouchableOpacity
            style={[
              styles.earnMoreBtn,
              isDark && { backgroundColor: "#39D353" },
            ]}
            onPress={() =>
              router.push("/Screens/Profile/refer-and-earned" as any)
            }
            activeOpacity={0.85}
          >
            <Feather
              name="gift"
              size={scale(16)}
              color={isDark ? "#080D0F" : "#016073"}
            />
            <Text
              style={[
                styles.earnMoreBtnText,
                isDark && { color: "#080D0F", fontWeight: "800" },
              ]}
            >
              Earn More Points via Referrals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            Transaction History
          </Text>
          <Text
            style={[
              styles.sectionCount,
              { color: isDark ? "#A8B2BE" : "#64748B" },
            ]}
          >
            {transactionsTotal} records
          </Text>
        </View>
      </View>
    );
  };

  const rootBg = isDark ? "#080D0F" : "#F8FAFC";
  const navBg = isDark ? "#080D0F" : "#FFFFFF";
  const navBorder = isDark ? "#1E252E" : "#F1F5F9";
  const navTitle = isDark ? "#F8FAFC" : "#0F172A";
  const navSub = isDark ? "#A8B2BE" : "#64748B";
  const btnBg = isDark ? "#151D24" : "#E6F4F6";
  const backIcon = isDark ? "#F8FAFC" : "#016073";
  const shareIcon = isDark ? "#39D353" : "#016073";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: rootBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Navbar */}
      <View
        style={[
          styles.topNav,
          { backgroundColor: navBg, borderBottomColor: navBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: btnBg }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={scale(20)} color={backIcon} />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text style={[styles.navTitle, { color: navTitle }]}>
            Rewards Wallet
          </Text>
          <Text style={[styles.navSub, { color: navSub }]}>
            Points Balance & Transaction Ledger
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.referNavBtn, { backgroundColor: btnBg }]}
          onPress={() =>
            router.push("/Screens/Profile/refer-and-earned" as any)
          }
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={scale(16)} color={shareIcon} />
        </TouchableOpacity>
      </View>

      {walletLoading && !wallet ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#39D353" : "#016073"}
          />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? "#A8B2BE" : "#64748B" },
            ]}
          >
            Loading rewards wallet...
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id || item.idempotencyKey}
          renderItem={({ item }) => (
            <TransactionCard item={item} isDark={isDark} />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? "#39D353" : "#016073"]}
              tintColor={isDark ? "#39D353" : "#016073"}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={scale(48)}
                color={isDark ? "#64748B" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? "#F8FAFC" : "#0F172A" },
                ]}
              >
                No Transactions Recorded
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDark ? "#A8B2BE" : "#64748B" },
                ]}
              >
                Invite your friends or participate in loyalty campaigns to earn bonus points!
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyActionBtn,
                  isDark && { backgroundColor: "#39D353" },
                ]}
                onPress={() =>
                  router.push("/Screens/Profile/refer-and-earned" as any)
                }
                activeOpacity={0.8}
              >
                <Feather
                  name="gift"
                  size={scale(16)}
                  color={isDark ? "#080D0F" : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.emptyActionBtnText,
                    isDark && { color: "#080D0F", fontWeight: "800" },
                  ]}
                >
                  Invite & Earn Points
                </Text>
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
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    gap: scale(12),
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: "center",
    justifyContent: "center",
  },
  topNavCenter: {
    flex: 1,
  },
  navTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  navSub: {
    fontSize: moderateScale(11),
    marginTop: scale(1),
  },
  referNavBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
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
  },
  sectionCount: {
    fontSize: moderateScale(11.5),
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(12),
    borderRadius: scale(10),
    marginBottom: moderateScale(8),
    borderWidth: 1,
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
  },
  txnDate: {
    fontSize: moderateScale(10.5),
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
    marginTop: moderateScale(10),
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
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
