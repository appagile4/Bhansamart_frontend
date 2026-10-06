import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ReviewItem {
  id: string;
  quote: string;
  rating: number;
  author: string;
  images: string[];
}

const REVIEWS_DATA: ReviewItem[] = [
  {
    id: "rev-1",
    quote:
      "This is 💯 one hundred percent the best lip mask duo ever !!! The scent is delicious and it's so smooth from the scrub ...",
    rating: 5,
    author: "Rizan D.",
    images: [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
  {
    id: "rev-2",
    quote:
      "This is 💯 one hundred percent the best lip mask duo ever !!! The scent is delicious and it's so smooth from the scrub ...",
    rating: 5,
    author: "Rizan D.",
    images: [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
  {
    id: "rev-3",
    quote:
      "This is 💯 one hundred percent the best lip mask duo ever !!! The scent is delicious and it's so smooth from the scrub ...",
    rating: 5,
    author: "Rizan D.",
    images: [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
  {
    id: "rev-4",
    quote:
      "This is 💯 one hundred percent the best lip mask duo ever !!! The scent is delicious and it's so smooth from the scrub ...",
    rating: 5,
    author: "Rizan D.",
    images: [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
  {
    id: "rev-5",
    quote:
      "This is 💯 one hundred percent the best lip mask duo ever !!! The scent is delicious and it's so smooth from the scrub ...",
    rating: 5,
    author: "Rizan D.",
    images: [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=200&q=80",
    ],
  },
];

const RATING_BREAKDOWN = [
  { star: 5, percentage: 70 },
  { star: 4, percentage: 45 },
  { star: 3, percentage: 45 },
  { star: 2, percentage: 10 },
  { star: 1, percentage: 10 },
];

export default function RatingsReviewsScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header with SafeAreaView for notch coverage */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Ratings & Reviews</Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Rating Summary Breakdown Hero */}
        <View style={styles.ratingHero}>
          {/* Left Score Column */}
          <View style={styles.ratingHeroLeft}>
            <Text style={styles.bigRatingNumber}>4.5</Text>
            <View style={styles.heroStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name="star"
                  size={scale(16)}
                  color="#F59E0B"
                />
              ))}
            </View>
          </View>

          {/* Right Progress Bars Column */}
          <View style={styles.ratingHeroRight}>
            {RATING_BREAKDOWN.map((item) => (
              <View key={item.star} style={styles.progressRow}>
                {/* Track */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.starIndexText}>{item.star}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Section Heading */}
        <Text style={styles.sectionHeading}>What people say about us</Text>

        {/* 3. Review Items List */}
        <View style={styles.reviewsList}>
          {REVIEWS_DATA.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* Left Quote & Author */}
              <View style={styles.reviewContentCol}>
                <Text style={styles.reviewQuoteText} numberOfLines={4}>
                  {review.quote}
                </Text>
                <View style={styles.reviewUserRow}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name="star"
                        size={scale(12)}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewerName}>{review.author}</Text>
                </View>
              </View>

              {/* Right Review Images */}
              <View style={styles.reviewPhotosRow}>
                {review.images.map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: img }}
                    style={styles.reviewThumbnail}
                    contentFit="contain"
                  />
                ))}
              </View>
            </View>
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
    fontSize: moderateScale(17),
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
  ratingHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(26),
    gap: scale(16),
  },
  ratingHeroLeft: {
    alignItems: "flex-start",
  },
  bigRatingNumber: {
    fontSize: moderateScale(38),
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: moderateScale(44),
  },
  heroStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    marginTop: moderateScale(4),
  },
  ratingHeroRight: {
    flex: 1,
    gap: moderateScale(6),
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  progressBarTrack: {
    flex: 1,
    height: scale(6),
    backgroundColor: "#E2E8F0",
    borderRadius: scale(3),
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: scale(3),
  },
  starIndexText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "600",
    width: scale(10),
    textAlign: "right",
  },
  sectionHeading: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(16),
  },
  reviewsList: {
    gap: moderateScale(12),
  },
  reviewCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    padding: scale(14),
    gap: scale(12),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reviewContentCol: {
    flex: 1,
  },
  reviewQuoteText: {
    fontSize: moderateScale(12),
    color: "#334155",
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(8),
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },
  reviewerName: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "600",
  },
  reviewPhotosRow: {
    flexDirection: "row",
    gap: scale(6),
  },
  reviewThumbnail: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    backgroundColor: "#E2E8F0",
  },
});
