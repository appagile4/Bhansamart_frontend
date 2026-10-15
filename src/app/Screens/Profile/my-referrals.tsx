import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyReferralsHistory } from "@/store/slices/referralSlice";
import { ReferredHistoryItem } from "@/store/services/referralService";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
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

const ReferralItemCard = memo(function ReferralItemCard({
  item,
}: {
  item: ReferredHistoryItem;
}) {
  const isRewarded = item.status === "REWARDED";
  const isPending = item.status === "PENDING";
  const isRejected = item.status === "REJECTED";

  let statusBg = "#EFF6FF";
  let statusColor = "#1D4ED8";
  let statusText = "Pending Verification";

  if (isRewarded) {
    statusBg = "#DCFCE7";
    statusColor = "#15803D";
    statusText = "Rewarded";
  } else if (isPending) {
    statusBg = "#FEF3C7";
    statusColor = "#B45309";
    statusText = "Pending";
  } else if (isRejected) {
    statusBg = "#FEF2F2";
    statusColor = "#DC2626";
    statusText = "Ineligible";
  }

  const dateFormatted = item.registrationDate
    ? new Date(item.registrationDate).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatarWrap}>
          <Feather name="user" size={scale(18)} color="#016073" />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.referredName}>{item.referredName}</Text>
          <Text style={styles.dateText}>Joined {dateFormatted}</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text
          style={[
            styles.pointsEarned,
            { color: isRewarded ? "#15803D" : "#64748B" },
          ]}
        >
          {isRewarded ? `+${item.pointsEarned} Pts` : `${item.expectedPoints} Pts`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default function MyReferralsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    history,
    historyTotal,
    historyPage,
    historyTotalPages,
    historyLoading,
  } = useAppSelector((state) => state.referral);

  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(
    (page = 1) => {
      dispatch(fetchMyReferralsHistory({ page, limit: 20 }));
    },
    [dispatch]
  );

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyReferralsHistory({ page: 1, limit: 20 }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (historyLoading || historyPage >= historyTotalPages) return;
    loadHistory(historyPage + 1);
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
          <Text style={styles.navTitle}>My Referrals</Text>
          <Text style={styles.navSub}>Invited Friends & Rewarded Points</Text>
        </View>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{historyTotal}</Text>
        </View>
      </View>

      {historyLoading && history.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#016073" />
          <Text style={styles.loadingText}>Loading referral history...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ReferralItemCard item={item} />}
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
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={scale(40)} color="#016073" />
              </View>
              <Text style={styles.emptyTitle}>No Referrals Yet</Text>
              <Text style={styles.emptySubtitle}>
                Invite your friends with your unique code and start earning 100 reward points for every friend who signs up!
              </Text>
              <TouchableOpacity
                style={styles.inviteNowBtn}
                onPress={() => router.push("/Screens/Profile/refer-and-earned" as any)}
                activeOpacity={0.8}
              >
                <Feather name="share-2" size={scale(16)} color="#FFFFFF" />
                <Text style={styles.inviteNowBtnText}>Invite Friends Now</Text>
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
  badgeWrap: {
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  badgeText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#016073",
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: scale(14),
    borderRadius: scale(12),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: scale(10),
  },
  avatarWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  infoCol: {
    flex: 1,
  },
  referredName: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  dateText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  cardRight: {
    alignItems: "flex-end",
    gap: scale(4),
  },
  pointsEarned: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(2.5),
    borderRadius: scale(6),
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(60),
    paddingHorizontal: scale(24),
  },
  emptyIconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(6),
  },
  emptySubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    lineHeight: scale(18),
    marginBottom: moderateScale(20),
  },
  inviteNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(11),
    borderRadius: scale(10),
  },
  inviteNowBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
});
