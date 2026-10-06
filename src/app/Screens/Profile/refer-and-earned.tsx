import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RewardCard {
  id: string;
  title: string;
  pointsText: string;
  costPoints: number;
  gradientColors: [string, string, ...string[]];
  textColor?: string;
  alignImage: "left" | "right";
  imageUrl: string;
}

const REWARD_CARDS: RewardCard[] = [
  {
    id: "rew-1",
    title: "Snickers",
    pointsText: "100 point / piece",
    costPoints: 100,
    gradientColors: ["#8B4513", "#A0522D", "#6F3714"],
    textColor: "#6F3714",
    alignImage: "right",
    imageUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&q=80",
  },
  {
    id: "rew-2",
    title: "Hand sanitizer",
    pointsText: "100 point /Kg",
    costPoints: 100,
    gradientColors: ["#1B4332", "#2D6A4F", "#40916C"],
    textColor: "#2D6A4F",
    alignImage: "left",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
  },
  {
    id: "rew-3",
    title: "Upto 50% OFF",
    pointsText: "100 point /Kg",
    costPoints: 100,
    gradientColors: ["#A21CAF", "#C026D3", "#7E22CE"],
    textColor: "#A21CAF",
    alignImage: "right",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    id: "rew-4",
    title: "Hand sanitizer",
    pointsText: "100 point /Kg",
    costPoints: 100,
    gradientColors: ["#1B4332", "#2D6A4F", "#40916C"],
    textColor: "#2D6A4F",
    alignImage: "left",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
  },
];

export default function ReferAndEarnedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [userPoints, setUserPoints] = useState(50);

  const handleRedeem = (reward: RewardCard) => {
    if (userPoints >= reward.costPoints) {
      Alert.alert(
        "Confirm Redemption",
        `Redeem ${reward.title} for ${reward.costPoints} points?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Redeem",
            onPress: () => {
              setUserPoints((prev) => prev - reward.costPoints);
              Alert.alert("Success", `You redeemed ${reward.title}!`);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Insufficient Points",
        `You currently have ${userPoints} points. You need ${
          reward.costPoints - userPoints
        } more points to redeem ${reward.title}. Share your referral link to earn points!`,
        [
          { text: "OK", style: "cancel" },
          {
            text: "Invite Friends",
            onPress: () => {
              Alert.alert(
                "Referral Code",
                "Your referral link: https://ecommerce.app/refer/BHANSA50"
              );
            },
          },
        ]
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
          <Text style={styles.navTitle}>Refer and Earned</Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Points Section */}
        <View style={styles.heroSection}>
          <Text style={styles.youHaveText}>You have</Text>
          <Text style={styles.pointsNumber}>{userPoints} Points</Text>

          <Text style={styles.descriptionParagraph}>
            Gorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            vulputate libero et velit interdum, ac aliquet odio mattis. Class
            aptent taciti sociosqu ad litora torquent per conubia nostra, per
            inceptos himenaeos.
          </Text>
        </View>

        {/* Reward Redeem Cards List */}
        <View style={styles.rewardsList}>
          {REWARD_CARDS.map((reward, index) => {
            const isImageLeft = reward.alignImage === "left";
            return (
              <LinearGradient
                key={`${reward.id}-${index}`}
                colors={reward.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rewardCard}
              >
                {/* Organic wavy decorative circle */}
                <View style={styles.decorCircle} />

                <View
                  style={[
                    styles.cardInnerRow,
                    isImageLeft && styles.cardInnerRowReverse,
                  ]}
                >
                  {/* Text Column */}
                  <View
                    style={[
                      styles.textCol,
                      isImageLeft && { alignItems: "flex-end" },
                    ]}
                  >
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardSubtitle}>
                      {reward.pointsText}
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleRedeem(reward)}
                      style={styles.redeemBtn}
                    >
                      <Text
                        style={[
                          styles.redeemBtnText,
                          { color: reward.textColor || "#1E293B" },
                        ]}
                      >
                        Redeem
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Product Image Column */}
                  <View style={styles.imageCol}>
                    <Image
                      source={{ uri: reward.imageUrl }}
                      style={styles.rewardImage}
                      contentFit="contain"
                    />
                  </View>
                </View>
              </LinearGradient>
            );
          })}
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
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: scale(8),
    marginBottom: moderateScale(24),
  },
  youHaveText: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(2),
  },
  pointsNumber: {
    fontSize: moderateScale(30),
    fontWeight: "800",
    color: "#2563EB",
    marginBottom: moderateScale(14),
  },
  descriptionParagraph: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(19),
    paddingHorizontal: scale(6),
  },
  rewardsList: {
    gap: moderateScale(14),
  },
  rewardCard: {
    borderRadius: scale(16),
    padding: scale(16),
    minHeight: scale(115),
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  decorCircle: {
    position: "absolute",
    width: scale(200),
    height: scale(200),
    borderRadius: scale(100),
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    top: -scale(60),
    right: -scale(40),
  },
  cardInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInnerRowReverse: {
    flexDirection: "row-reverse",
  },
  textCol: {
    flex: 1,
    gap: moderateScale(4),
  },
  rewardTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#ffffff",
  },
  rewardSubtitle: {
    fontSize: moderateScale(12.5),
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: moderateScale(6),
  },
  redeemBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  redeemBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
  },
  imageCol: {
    width: scale(110),
    height: scale(80),
    alignItems: "center",
    justifyContent: "center",
  },
  rewardImage: {
    width: "100%",
    height: "100%",
  },
});
