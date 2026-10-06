import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RedeemItem {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  imageUrl: string;
}

const REDEEM_ITEMS: RedeemItem[] = [
  {
    id: "item-1",
    title: "FREE WAI WAI FOR 500 POINTS!",
    pointsCost: 500,
    description: "Redeem 500 points and enjoy your favorite snack for free!",
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "item-2",
    title: "FREE WAI WAI FOR 500 POINTS!",
    pointsCost: 500,
    description: "Redeem 500 points and enjoy your favorite snack for free!",
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "item-3",
    title: "FREE WAI WAI FOR 500 POINTS!",
    pointsCost: 500,
    description: "Redeem 500 points and enjoy your favorite snack for free!",
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "item-4",
    title: "FREE WAI WAI FOR 500 POINTS!",
    pointsCost: 500,
    description: "Redeem 500 points and enjoy your favorite snack for free!",
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
];

export default function LoyaltyScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [points, setPoints] = useState(900.55);

  const handleRedeem = (item: RedeemItem) => {
    if (points >= item.pointsCost) {
      Alert.alert(
        "Redeem Reward",
        `Would you like to redeem "${item.title}" for ${item.pointsCost} RP?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Redeem Now",
            onPress: () => {
              setPoints((p) => Number((p - item.pointsCost).toFixed(2)));
              Alert.alert(
                "Redemption Successful!",
                `You have redeemed ${item.title}. The free item has been added to your rewards wallet!`
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Insufficient Points",
        `You need ${item.pointsCost} points to redeem this item. Keep shopping to earn more points!`
      );
    }
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
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Loyalty</Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Points Hero Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsTopRow}>
            <View>
              <Text style={styles.yourPointsLabel}>Your Points</Text>
              <Text style={styles.pointsValueText}>{points.toFixed(2)}</Text>
            </View>

            {/* Blue Ribbon/Medal Badge */}
            <View style={styles.ribbonBadge}>
              <Ionicons name="ribbon-outline" size={scale(24)} color="#ffffff" />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.earnSubtitle}>Earn points on every purchase</Text>

          {/* View points history link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Points History",
                "+150.00 pts - Order #ODR999999999\n+250.55 pts - Order #ODR888888888\n+500.00 pts - Signup Bonus"
              )
            }
            style={styles.historyLinkRow}
          >
            <Text style={styles.historyLinkText}>View points history</Text>
            <Feather name="arrow-right" size={scale(16)} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionTitle}>Redeem points</Text>

        {/* 2-Column Grid of Loyalty Redeem Cards */}
        <View style={styles.grid}>
          {REDEEM_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/Screens/Profile/offer-details" as any,
                  params: {
                    id: item.id,
                    title: item.title,
                    pointsCost: String(item.pointsCost),
                    description: item.description,
                    imageUrl: item.imageUrl,
                  },
                })
              }
              style={styles.card}
            >
              {/* Product Thumbnail Container */}
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productImage}
                  contentFit="contain"
                />

                {/* Points Cost Pill Badge */}
                <View style={styles.pointsPill}>
                  <Ionicons
                    name="ribbon-outline"
                    size={scale(11)}
                    color="#1E293B"
                  />
                  <Text style={styles.pointsPillText}>
                    {item.pointsCost} RP
                  </Text>
                </View>
              </View>

              {/* Card Body Text */}
              <View style={styles.cardBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeAreaHeader: {
    backgroundColor: "#ffffff",
  },
  navBar: {
    height: moderateScale(48),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    marginRight: scale(6),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  pointsCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: moderateScale(22),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  yourPointsLabel: {
    fontSize: moderateScale(13),
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: moderateScale(2),
  },
  pointsValueText: {
    fontSize: moderateScale(26),
    fontWeight: "900",
    color: "#1E293B",
  },
  ribbonBadge: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: scale(5),
    backgroundColor: "#E2E8F0",
    borderRadius: scale(2.5),
    overflow: "hidden",
    marginBottom: moderateScale(10),
  },
  progressFill: {
    width: "25%",
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: scale(2.5),
  },
  earnSubtitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: moderateScale(14),
  },
  historyLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  historyLinkText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#2563EB",
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(14),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(10),
  },
  card: {
    width: "48%",
    marginBottom: moderateScale(12),
  },
  imageBox: {
    width: "100%",
    height: scale(115),
    backgroundColor: "#E0F2FE",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(6),
  },
  productImage: {
    width: "80%",
    height: "80%",
  },
  pointsPill: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    gap: scale(2),
  },
  pointsPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  cardBody: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: scale(2),
  },
  itemTitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: moderateScale(13.5),
    marginBottom: moderateScale(2),
  },
  itemDescription: {
    fontSize: moderateScale(10),
    color: "#475569",
    lineHeight: moderateScale(13),
  },
});
