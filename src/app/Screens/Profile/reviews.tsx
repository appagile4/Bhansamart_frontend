import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ReviewItem {
  id: string;
  name: string;
  packInfo: string;
  status: "pending" | "reviewed";
  imageUrl: string;
}

const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Borem ipsum dolor sit\naet, consectetur adi",
    packInfo: "1 Pack(10 pieces",
    status: "pending",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "rev-2",
    name: "Borem ipsum dolor sit\naet, consectetur adi",
    packInfo: "1 Pack(10 pieces",
    status: "pending",
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=80",
  },
];

export default function MyReviewsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");

  const filteredItems = SAMPLE_REVIEWS.filter(
    (item) => item.status === activeTab
  );

  const handleReviewNow = (item: ReviewItem) => {
    Alert.alert("Write Review", `Leave a review for ${item.name.replace(/\n/g, " ")}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "#ffffff" }]}
    >
      <StatusBar style="dark" />

      {/* Top Navbar Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Reviews</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tab Pills Row (Pending / Reviewed) */}
        <View style={styles.tabsRow}>
          {/* Pending Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("pending")}
            style={[
              styles.tabPill,
              activeTab === "pending"
                ? styles.tabPillPendingActive
                : styles.tabPillInactive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending"
                  ? styles.tabTextPendingActive
                  : styles.tabTextInactive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>

          {/* Reviewed Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("reviewed")}
            style={[
              styles.tabPill,
              activeTab === "reviewed"
                ? styles.tabPillReviewedActive
                : styles.tabPillInactive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reviewed"
                  ? styles.tabTextReviewedActive
                  : styles.tabTextInactive,
              ]}
            >
              Reviewed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reviews List */}
        <View style={styles.listContainer}>
          {filteredItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.reviewRow,
                index < filteredItems.length - 1 && styles.rowDivider,
              ]}
            >
              {/* Product Thumbnail Box */}
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              </View>

              {/* Title & Pack Info Column */}
              <View style={styles.infoCol}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.packInfoText}>{item.packInfo}</Text>
              </View>

              {/* "Review Now" Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleReviewNow(item)}
                style={styles.reviewBtn}
              >
                <Text style={styles.reviewBtnText}>Review Now</Text>
              </TouchableOpacity>
            </View>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No {activeTab} reviews found.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: scale(4),
    marginRight: scale(14),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  tabsRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: moderateScale(16),
  },
  tabPill: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1.2,
  },
  tabText: {
    fontSize: moderateScale(13),
  },
  tabPillPendingActive: {
    borderColor: "#4A7C59",
    backgroundColor: "#F4FBEA",
  },
  tabTextPendingActive: {
    color: "#2D6A4F",
    fontWeight: "700",
    fontSize: moderateScale(13),
  },
  tabPillReviewedActive: {
    borderColor: "#003844",
    backgroundColor: "#003844",
  },
  tabTextReviewedActive: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: moderateScale(13),
  },
  tabPillInactive: {
    borderColor: "#CBD5E1",
    backgroundColor: "#ffffff",
  },
  tabTextInactive: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: moderateScale(13),
  },
  listContainer: {
    backgroundColor: "#ffffff",
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(14),
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  imageBox: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(10),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    padding: scale(4),
    marginRight: scale(12),
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  infoCol: {
    flex: 1,
    marginRight: scale(8),
  },
  productName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#334155",
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(3),
  },
  packInfoText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  reviewBtn: {
    backgroundColor: "#2D6A4F",
    paddingHorizontal: scale(14),
    paddingVertical: scale(7),
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  reviewBtnText: {
    color: "#ffffff",
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: "#94A3B8",
  },
});
