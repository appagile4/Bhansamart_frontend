import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CouponItem {
  id: string;
  code: string;
  discount: string;
  condition: string;
  maxDiscount: string;
  validTill: string;
  type: "recently" | "expiring";
  terms: string;
}

const COUPONS_DATA: CouponItem[] = [
  {
    id: "coupon-1",
    code: "SAVE20",
    discount: "20% OFF",
    condition: "Min. spend Rs.999, Get upto Rs.150 OFF",
    maxDiscount: "Rs.150",
    validTill: "Nov 02 2025",
    type: "recently",
    terms:
      "Valid on all grocery and fresh items. Maximum discount Rs.150. Cannot be combined with other offers.",
  },
  {
    id: "coupon-2",
    code: "SUPER20",
    discount: "20% OFF",
    condition: "Min. spend Rs.999, Get upto Rs.150 OFF",
    maxDiscount: "Rs.150",
    validTill: "Aug 28 2025",
    type: "recently",
    terms:
      "Applicable once per user on carts above Rs.999. Valid till August 28, 2025.",
  },
  {
    id: "coupon-3",
    code: "FLASH15",
    discount: "15% OFF",
    condition: "Min. spend Rs.499, Get upto Rs.100 OFF",
    maxDiscount: "Rs.100",
    validTill: "Tomorrow 11:59 PM",
    type: "expiring",
    terms:
      "Flash coupon expiring soon. Applicable on all daily essentials with minimum order Rs.499.",
  },
  {
    id: "coupon-4",
    code: "WEEKEND50",
    discount: "Rs.50 OFF",
    condition: "Min. spend Rs.350, Flat Rs.50 OFF",
    maxDiscount: "Rs.50",
    validTill: "In 2 days",
    type: "expiring",
    terms:
      "Weekend special voucher. Get flat Rs.50 off on minimum purchase of Rs.350.",
  },
];

export default function CollectedCouponScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<"recently" | "expiring">("recently");

  const filteredCoupons = COUPONS_DATA.filter((c) => c.type === activeTab);

  const handleUseNow = (coupon: CouponItem) => {
    Alert.alert(
      "Coupon Applied!",
      `Coupon "${coupon.code}" (${coupon.discount}) has been copied and selected for your next order.`,
      [
        {
          text: "Go to Shop",
          onPress: () => router.push("/customerMain/(tabs)/home" as any),
        },
        {
          text: "View Cart",
          onPress: () => router.push("/customerMain/cart" as any),
        },
      ]
    );
  };

  const handleShowTerms = (coupon: CouponItem) => {
    Alert.alert(
      `Terms & Conditions (${coupon.code})`,
      `${coupon.condition}\n\n${coupon.terms}\n\nValid till: ${coupon.validTill}`,
      [{ text: "Got it", style: "default" }]
    );
  };

  const renderCouponCard = ({ item }: { item: CouponItem }) => (
    <View style={styles.couponCard}>
      {/* Upper Content Box */}
      <View style={styles.cardTopContent}>
        {/* Top Header Row: Icon + Discount + T&C */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.discountBadgeGroup}>
            <View style={styles.couponIconBox}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={scale(16)}
                color="#64748B"
              />
            </View>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleShowTerms(item)}
            style={styles.tcBadge}
          >
            <Text style={styles.tcText}>T&C</Text>
          </TouchableOpacity>
        </View>

        {/* Condition Text */}
        <Text style={styles.conditionText}>{item.condition}</Text>

        {/* Validity Text */}
        <Text style={styles.validityText}>Valid till :  {item.validTill}</Text>
      </View>

      {/* Ticket Cutout Notch and Dashed Divider */}
      <View style={styles.dividerWrapper}>
        <View style={styles.notchLeft} />
        <View style={styles.dashedLine} />
        <View style={styles.notchRight} />
      </View>

      {/* Bottom CTA Box */}
      <View style={styles.cardBottomContent}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUseNow(item)}
          style={styles.useNowButton}
        >
          <Text style={styles.useNowText}>Use Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <Feather name="arrow-left" size={scale(22)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Collected coupon</Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Filter Pills Container */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("recently")}
          style={[
            styles.tabPill,
            activeTab === "recently" ? styles.tabPillActive : styles.tabPillInactive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "recently" ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Recently Collected
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("expiring")}
          style={[
            styles.tabPill,
            activeTab === "expiring" ? styles.tabPillActive : styles.tabPillInactive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "expiring" ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Expiring
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Coupons List */}
      <FlatList
        data={filteredCoupons}
        keyExtractor={(item) => item.id}
        renderItem={renderCouponCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={scale(56)}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No coupons found</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any coupons in this tab right now.
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8),
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
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: scale(14),
    paddingBottom: scale(10),
    gap: scale(10),
    backgroundColor: "#FFFFFF",
  },
  tabPill: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#4ADE80",
  },
  tabPillInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#16A34A",
  },
  tabTextInactive: {
    color: "#64748B",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(40),
    gap: scale(16),
  },
  couponCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  cardTopContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(14),
    paddingBottom: scale(12),
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(10),
  },
  discountBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  couponIconBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  discountText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#16A34A",
  },
  tcBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    borderWidth: 0.5,
    borderColor: "#BBF7D0",
  },
  tcText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#16A34A",
  },
  conditionText: {
    fontSize: moderateScale(13.5),
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: moderateScale(19),
    marginBottom: scale(8),
  },
  validityText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "500",
  },
  dividerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(16),
    position: "relative",
    justifyContent: "center",
  },
  notchLeft: {
    position: "absolute",
    left: -scale(9),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 2,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginHorizontal: scale(14),
  },
  notchRight: {
    position: "absolute",
    right: -scale(9),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 2,
  },
  cardBottomContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(4),
    paddingBottom: scale(14),
  },
  useNowButton: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: scale(8),
    paddingVertical: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  useNowText: {
    color: "#16A34A",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(10),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
});
