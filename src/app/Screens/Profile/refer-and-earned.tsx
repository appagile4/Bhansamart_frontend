import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyReferral } from "@/store/slices/referralSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReferAndEarnScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const { summary, summaryLoading } = useAppSelector(
    (state) => state.referral
  );

  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchMyReferral());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyReferral());
    setRefreshing(false);
  };

  const referralCode = summary?.referralCode || "";
  const referrerReward = summary?.campaign?.referrerRewardPoints || 100;
  const friendReward = summary?.campaign?.newCustomerRewardPoints || 50;

  // Deep link format: dc://(auth)/sign-up?referralCode=XXXXXX
  const deepLink = `dc://(auth)/sign-up?referralCode=${referralCode}`;
  const webLink = `https://bhansamart.com/refer?code=${referralCode}`;

  const handleCopyCode = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    Alert.alert(
      "Copied to Clipboard",
      `Referral code "${referralCode}" has been copied. Share it with your friends!`
    );
  };

  const handleShare = async () => {
    if (!referralCode) return;
    const shareMessage =
      `Join me on Bhansa Mart for instant, fresh grocery delivery! 🛒\n\n` +
      `Use my referral code "${referralCode}" during sign up to get ${friendReward} FREE reward points!\n\n` +
      `Download or open the app: ${deepLink}\n` +
      `Or visit: ${webLink}`;

    try {
      await Share.share({
        message: shareMessage,
        title: "Join Bhansa Mart and Get Free Reward Points!",
      });
    } catch (shareErr: any) {
      console.error("[Share Error]:", shareErr);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.root,
        isDark && { backgroundColor: "#080D0F" },
      ]}
      edges={["top"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Header */}
      <View
        style={[
          styles.topNav,
          isDark && {
            backgroundColor: "#080D0F",
            borderBottomColor: "#1E252E",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            isDark && { backgroundColor: "#1E2E38" },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-left"
            size={scale(20)}
            color={isDark ? "#38BDF8" : "#016073"}
          />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text
            style={[
              styles.navTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            Refer & Earn
          </Text>
          <Text
            style={[
              styles.navSub,
              isDark && { color: "#94A3B8" },
            ]}
          >
            Invite Friends & Earn Free Points
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.historyNavBtn,
            isDark && { backgroundColor: "#1E2E38" },
          ]}
          onPress={() => router.push("/Screens/Profile/my-referrals" as any)}
          activeOpacity={0.7}
        >
          <Feather
            name="users"
            size={scale(16)}
            color={isDark ? "#38BDF8" : "#016073"}
          />
        </TouchableOpacity>
      </View>

      {summaryLoading && !summary ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#39D353" : "#016073"}
          />
          <Text
            style={[
              styles.loadingText,
              isDark && { color: "#94A3B8" },
            ]}
          >
            Loading referral program...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? "#39D353" : "#016073"]}
              tintColor={isDark ? "#39D353" : "#016073"}
            />
          }
        >
          {/* Hero Banner Card */}
          <View
            style={[
              styles.heroCard,
              isDark && {
                backgroundColor: "#151D24",
                borderColor: "#303B45",
              },
            ]}
          >
            <View
              style={[
                styles.heroIconCircle,
                isDark && { backgroundColor: "#1E2E38" },
              ]}
            >
              <Ionicons
                name="gift"
                size={scale(32)}
                color={isDark ? "#38BDF8" : "#016073"}
              />
            </View>
            <Text
              style={[
                styles.heroTitle,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Invite Friends & Get Rewards
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                isDark && { color: "#94A3B8" },
              ]}
            >
              Give friends{" "}
              <Text
                style={[
                  styles.boldText,
                  isDark && { color: "#38BDF8" },
                ]}
              >
                {friendReward} points
              </Text>{" "}
              when they sign up, and you’ll get{" "}
              <Text
                style={[
                  styles.boldText,
                  isDark && { color: "#38BDF8" },
                ]}
              >
                {referrerReward} points
              </Text>{" "}
              credited directly to your wallet!
            </Text>

            {/* Referral Code Box */}
            <View
              style={[
                styles.codeContainer,
                isDark && {
                  backgroundColor: "#1B252E",
                  borderColor: "#303B45",
                },
              ]}
            >
              <View style={styles.codeTextCol}>
                <Text
                  style={[
                    styles.codeSubLabel,
                    isDark && { color: "#38BDF8" },
                  ]}
                >
                  YOUR UNIQUE REFERRAL CODE
                </Text>
                <Text
                  style={[
                    styles.codeDisplay,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  {referralCode || "LOADING..."}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.copyBtn,
                  isDark && {
                    backgroundColor: "#1E2E38",
                    borderColor: "#303B45",
                  },
                  copied && styles.copyBtnSuccess,
                ]}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Feather
                  name={copied ? "check" : "copy"}
                  size={scale(16)}
                  color={
                    copied
                      ? "#FFFFFF"
                      : isDark
                      ? "#38BDF8"
                      : "#016073"
                  }
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    isDark && !copied && { color: "#38BDF8" },
                    copied && styles.copyBtnTextSuccess,
                  ]}
                >
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Share Invitation Button */}
            <TouchableOpacity
              style={[
                styles.shareBtn,
                isDark && { backgroundColor: "#00687A" },
              ]}
              activeOpacity={0.85}
              onPress={handleShare}
            >
              <Feather name="share-2" size={scale(18)} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share Invitation Link</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Action Navigation Bar */}
          <View style={styles.quickNavRow}>
            <TouchableOpacity
              style={[
                styles.quickNavCard,
                isDark && {
                  backgroundColor: "#151D24",
                  borderColor: "#303B45",
                },
              ]}
              onPress={() => router.push("/Screens/Profile/my-referrals" as any)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickNavIconWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(2, 132, 199, 0.18)"
                      : "#E6F4F6",
                  },
                ]}
              >
                <Feather
                  name="users"
                  size={scale(16)}
                  color={isDark ? "#38BDF8" : "#016073"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.quickNavTitle,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  My Referrals
                </Text>
                <Text
                  style={[
                    styles.quickNavSub,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  View invited friends list
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={scale(16)}
                color={isDark ? "#64748B" : "#94A3B8"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickNavCard,
                isDark && {
                  backgroundColor: "#151D24",
                  borderColor: "#303B45",
                },
              ]}
              onPress={() => router.push("/Screens/Profile/loyalty" as any)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickNavIconWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(245, 158, 11, 0.18)"
                      : "#FEF3C7",
                  },
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={scale(16)}
                  color={isDark ? "#FBBF24" : "#B45309"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.quickNavTitle,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  Points Wallet
                </Text>
                <Text
                  style={[
                    styles.quickNavSub,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  {summary?.rewardPointsBalance || 0} Points Available
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={scale(16)}
                color={isDark ? "#64748B" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>

          {/* Real Metrics Grid */}
          <View style={styles.statsSection}>
            <Text
              style={[
                styles.sectionHeader,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Your Referral Progress
            </Text>
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  isDark && {
                    backgroundColor: "#151D24",
                    borderColor: "#303B45",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statIconWrap,
                    {
                      backgroundColor: isDark
                        ? "rgba(2, 132, 199, 0.18)"
                        : "#E6F4F6",
                    },
                  ]}
                >
                  <Feather
                    name="user-plus"
                    size={scale(15)}
                    color={isDark ? "#38BDF8" : "#016073"}
                  />
                </View>
                <Text
                  style={[
                    styles.statVal,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  {summary?.totalInvited || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Total Invited
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  isDark && {
                    backgroundColor: "#151D24",
                    borderColor: "#303B45",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statIconWrap,
                    {
                      backgroundColor: isDark
                        ? "rgba(34, 197, 94, 0.18)"
                        : "#DCFCE7",
                    },
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={scale(15)}
                    color={isDark ? "#4ADE80" : "#15803D"}
                  />
                </View>
                <Text
                  style={[
                    styles.statVal,
                    { color: isDark ? "#4ADE80" : "#15803D" },
                  ]}
                >
                  {summary?.successfulReferrals || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Successful
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  isDark && {
                    backgroundColor: "#151D24",
                    borderColor: "#303B45",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statIconWrap,
                    {
                      backgroundColor: isDark
                        ? "rgba(245, 158, 11, 0.18)"
                        : "#FEF3C7",
                    },
                  ]}
                >
                  <Feather
                    name="clock"
                    size={scale(15)}
                    color={isDark ? "#FBBF24" : "#B45309"}
                  />
                </View>
                <Text
                  style={[
                    styles.statVal,
                    { color: isDark ? "#FBBF24" : "#B45309" },
                  ]}
                >
                  {summary?.pendingReferrals || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Pending
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  isDark && {
                    backgroundColor: "#151D24",
                    borderColor: "#303B45",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statIconWrap,
                    {
                      backgroundColor: isDark
                        ? "rgba(168, 85, 247, 0.18)"
                        : "#F3E8FF",
                    },
                  ]}
                >
                  <Ionicons
                    name="star-outline"
                    size={scale(15)}
                    color={isDark ? "#C084FC" : "#7E22CE"}
                  />
                </View>
                <Text
                  style={[
                    styles.statVal,
                    { color: isDark ? "#C084FC" : "#7E22CE" },
                  ]}
                >
                  {summary?.totalPointsEarned || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Points Earned
                </Text>
              </View>
            </View>
          </View>

          {/* Step-by-Step How It Works */}
          <View
            style={[
              styles.howItWorksCard,
              isDark && {
                backgroundColor: "#151D24",
                borderColor: "#303B45",
              },
            ]}
          >
            <Text
              style={[
                styles.sectionHeader,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              How It Works
            </Text>

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepBadge,
                  isDark && { backgroundColor: "#004D5D" },
                ]}
              >
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  Share your unique link or code
                </Text>
                <Text
                  style={[
                    styles.stepSub,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Send your referral invitation to friends and family via WhatsApp, SMS, or social apps.
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepBadge,
                  isDark && { backgroundColor: "#004D5D" },
                ]}
              >
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  Friend signs up with your code
                </Text>
                <Text
                  style={[
                    styles.stepSub,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  When your friend creates an account, they instantly receive {friendReward} welcome reward points.
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepBadge,
                  isDark && { backgroundColor: "#004D5D" },
                ]}
              >
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    isDark && { color: "#F8FAFC" },
                  ]}
                >
                  You earn {referrerReward} points
                </Text>
                <Text
                  style={[
                    styles.stepSub,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Your wallet is credited atomically with {referrerReward} points. Use points for store rewards and discounts!
                </Text>
              </View>
            </View>
          </View>

          {/* Terms & Conditions Accordion / Box */}
          <View
            style={[
              styles.termsCard,
              isDark && {
                backgroundColor: "#1B252E",
                borderColor: "#303B45",
              },
            ]}
          >
            <View style={styles.termsHeaderRow}>
              <Feather
                name="shield"
                size={scale(16)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.termsHeading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                Terms & Conditions
              </Text>
            </View>
            <Text
              style={[
                styles.termsText,
                isDark && { color: "#94A3B8" },
              ]}
            >
              • Both the referrer and referred customer receive points upon successful, verified account registration.
            </Text>
            <Text
              style={[
                styles.termsText,
                isDark && { color: "#94A3B8" },
              ]}
            >
              • Referral rewards are strictly limited to one welcome attribution per newly registered customer account.
            </Text>
            <Text
              style={[
                styles.termsText,
                isDark && { color: "#94A3B8" },
              ]}
            >
              • Self-referrals and duplicate accounts are strictly prohibited and automatically detected by our anti-abuse system.
            </Text>
            <Text
              style={[
                styles.termsText,
                isDark && { color: "#94A3B8" },
              ]}
            >
              • Reward points are non-transferable and can be redeemed for promotional discounts and perks on Bhansa Mart.
            </Text>
          </View>
        </ScrollView>
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
  historyNavBtn: {
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
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
    gap: scale(14),
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(18),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroIconCircle: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(29),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(12),
  },
  heroTitle: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    marginTop: moderateScale(6),
    lineHeight: scale(18),
    paddingHorizontal: scale(10),
  },
  boldText: {
    fontWeight: "800",
    color: "#016073",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: "#86C4CB",
    borderStyle: "dashed",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(12),
    width: "100%",
    marginTop: moderateScale(16),
  },
  codeTextCol: {
    flex: 1,
  },
  codeSubLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#016073",
    letterSpacing: 0.8,
  },
  codeDisplay: {
    fontSize: moderateScale(20),
    fontWeight: "900",
    color: "#0F172A",
    marginTop: scale(2),
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#86C4CB",
  },
  copyBtnSuccess: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  copyBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#016073",
  },
  copyBtnTextSuccess: {
    color: "#FFFFFF",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    backgroundColor: "#016073",
    width: "100%",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    marginTop: moderateScale(14),
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  quickNavRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  quickNavCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: scale(8),
  },
  quickNavIconWrap: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  quickNavTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  quickNavSub: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: scale(1),
  },
  statsSection: {
    gap: scale(10),
  },
  sectionHeader: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  statsGrid: {
    flexDirection: "row",
    gap: scale(8),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(10),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statIconWrap: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(4),
  },
  statVal: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    marginTop: scale(2),
    fontWeight: "600",
    textAlign: "center",
  },
  howItWorksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: scale(14),
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
  },
  stepBadge: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: "#016073",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(2),
  },
  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
  },
  stepSub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(2),
    lineHeight: scale(16),
  },
  termsCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: scale(12),
    padding: scale(14),
    gap: scale(6),
    borderWidth: 1,
    borderColor: "transparent",
  },
  termsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(4),
  },
  termsHeading: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#475569",
  },
  termsText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    lineHeight: scale(15),
  },
});
