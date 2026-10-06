import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfferDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    pointsCost?: string;
    description?: string;
    validTill?: string;
    imageUrl?: string;
  }>();

  const title = params.title || "FREE WAI WAI FOR 500 POINTS!";
  const pointsCost = params.pointsCost ? Number(params.pointsCost) : 500;
  const validTill = params.validTill || "Jul 04, 2025";
  const supportPhone = "015585858";

  const [isRedeemed, setIsRedeemed] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title} - Redeem ${pointsCost} points on Bhansa Mart and enjoy rewards! Valid till ${validTill}.`,
      });
    } catch {
      // ignore
    }
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${supportPhone}`).catch(() => {
      Alert.alert("Contact Support", `Call us at: ${supportPhone}`);
    });
  };

  const handleRedeemNow = () => {
    Alert.alert(
      "Confirm Redemption",
      `Are you sure you want to redeem ${pointsCost} RP for "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem Now",
          style: "default",
          onPress: () => {
            setIsRedeemed(true);
            Alert.alert(
              "Congratulations! 🎉",
              `You have successfully redeemed ${title}. The voucher has been applied to your account!`,
              [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 1. Header with SafeAreaView */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.navIconButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.navTitle}>Offer details</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShare}
            style={styles.navIconButton}
          >
            <Feather name="share-2" size={scale(20)} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Scrollable Body Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Blue Hero Banner Card */}
        <View style={styles.heroBanner}>
          <View style={styles.heroInnerOverlay}>
            <Ionicons name="gift-outline" size={scale(48)} color="rgba(255,255,255,0.4)" />
          </View>
        </View>

        {/* Offer Header Row: Avatar + Title + Points Badge */}
        <View style={styles.offerHeaderSection}>
          <View style={styles.topInfoRow}>
            {/* Store / Reward Avatar Icon */}
            <View style={styles.avatarCircle}>
              <Ionicons name="cart" size={scale(20)} color="#008080" />
            </View>

            {/* Title & Points Pill */}
            <View style={styles.titleWrapper}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.mainTitle}>{title}</Text>
                <View style={styles.pointsPill}>
                  <Ionicons name="ribbon-outline" size={scale(12)} color="#475569" />
                  <Text style={styles.pointsPillText}>{pointsCost} RP</Text>
                </View>
              </View>

              {/* Valid Till */}
              <View style={styles.validityRow}>
                <Text style={styles.validityLabel}>Valid till : </Text>
                <Text style={styles.validityDate}>{validTill}</Text>
              </View>
            </View>
          </View>

          {/* Subheading */}
          <Text style={styles.subheading}>
            Redeem {pointsCost} points and enjoy your favorite snack for free!
          </Text>

          {/* Body Description */}
          <Text style={styles.bodyParagraph}>
            Satisfy your cravings with Wai Wai—absolutely free! Redeem{" "}
            {pointsCost} points to enjoy this delicious snack that you love. It's
            our way of saying thank you for being a valued customer.
          </Text>

          <Text style={styles.bodyParagraph}>
            Add it to your cart now and let us handle the rest. Don't wait too
            long—rewards like this don't last forever. Treat yourself today and
            make your points work for you!
          </Text>

          {/* Support Phone Row */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCallSupport}
            style={styles.supportRow}
          >
            <Text style={styles.supportText}>
              For support, contact us at:{" "}
              <Text style={styles.supportHighlight}>{supportPhone}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 3. Sticky Bottom Action Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBarContainer}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomPriceLabel}>Redeem point</Text>
            <Text style={styles.bottomPriceValue}>RS.{pointsCost}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRedeemNow}
            disabled={isRedeemed}
            style={[styles.redeemButton, isRedeemed && styles.redeemButtonDisabled]}
          >
            <Text style={styles.redeemButtonText}>
              {isRedeemed ? "Redeemed" : "Redeem Now"}
            </Text>
            {!isRedeemed && (
              <Feather name="chevron-right" size={scale(16)} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeAreaHeader: {
    backgroundColor: "#FFFFFF",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  navIconButton: {
    width: scale(36),
    height: scale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "600",
    color: "#0F172A",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(100),
  },
  heroBanner: {
    width: "100%",
    height: scale(190),
    backgroundColor: "#3B82F6",
    borderRadius: scale(16),
    overflow: "hidden",
    marginBottom: scale(16),
  },
  heroInnerOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  offerHeaderSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: scale(12),
  },
  avatarCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
    marginTop: scale(2),
  },
  titleWrapper: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: scale(4),
  },
  mainTitle: {
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: moderateScale(20),
    marginRight: scale(8),
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    gap: scale(3),
  },
  pointsPillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#334155",
  },
  validityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(2),
  },
  validityLabel: {
    fontSize: moderateScale(12),
    color: "#16A34A",
    fontWeight: "500",
  },
  validityDate: {
    fontSize: moderateScale(12),
    color: "#16A34A",
    fontWeight: "600",
  },
  subheading: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: moderateScale(20),
    marginTop: scale(14),
    marginBottom: scale(12),
  },
  bodyParagraph: {
    fontSize: moderateScale(13),
    color: "#334155",
    lineHeight: moderateScale(19),
    marginBottom: scale(10),
  },
  supportRow: {
    marginTop: scale(10),
    paddingTop: scale(8),
  },
  supportText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  supportHighlight: {
    color: "#0F172A",
    fontWeight: "700",
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
  },
  bottomPriceCol: {
    justifyContent: "center",
  },
  bottomPriceLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "500",
    marginBottom: scale(2),
  },
  bottomPriceValue: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#0F172A",
  },
  redeemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#064E3B",
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    gap: scale(6),
  },
  redeemButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
