import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PromoCardsSectionProps {
  isGiftSelected?: boolean;
  onSelectGift?: () => void;
  appliedCoupon?: string;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  onSeeAllCoupons?: () => void;
}

const AVAILABLE_COUPONS = [
  { code: "FLAT50", desc: "Flat Rs.50 off on min Rs.500" },
  { code: "WELCOME10", desc: "10% off on your first order" },
  { code: "FREESHIP", desc: "Free Express delivery" },
];

export default function PromoCardsSection({
  isGiftSelected = false,
  onSelectGift,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onSeeAllCoupons,
}: PromoCardsSectionProps) {
  const theme = useTheme();
  const [inputCode, setInputCode] = useState("");

  const handleApplyInput = () => {
    if (!inputCode.trim()) return;
    onApplyCoupon?.(inputCode.trim().toUpperCase());
    setInputCode("");
  };

  return (
    <View style={styles.container}>
      {/* 1. Golden Gift Packaging Card */}
      <View style={styles.giftCard}>
        <View style={styles.giftLeft}>
          <View style={styles.giftIconSquare}>
            <MaterialIcons name="card-giftcard" size={scale(24)} color="#854D0E" />
          </View>
          <View style={styles.giftTextCol}>
            <Text style={styles.giftTitle}>Gift Packaging</Text>
            <Text style={styles.giftSubtitle}>
              Special eco gift bag + customized greeting ribbon for <Text style={styles.giftBold}>Rs.50</Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSelectGift}
          style={[
            styles.selectBtn,
            isGiftSelected && styles.selectBtnActive,
          ]}
        >
          {isGiftSelected && (
            <Ionicons name="checkmark" size={scale(14)} color="#FFFFFF" />
          )}
          <Text
            style={[
              styles.selectBtnText,
              isGiftSelected && styles.selectBtnTextActive,
            ]}
          >
            {isGiftSelected ? "Added" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Coupons & Offers Box */}
      <View style={styles.couponContainer}>
        <View style={styles.couponHeader}>
          <View style={styles.couponHeaderLeft}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={scale(20)} color="#008080" />
            <Text style={styles.couponHeaderTitle}>Coupons & Offers</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAllCoupons}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {appliedCoupon ? (
          <View style={styles.appliedCouponPill}>
            <View style={styles.appliedCouponLeft}>
              <Ionicons name="checkmark-circle" size={scale(18)} color="#16A34A" />
              <View>
                <Text style={styles.appliedCouponCode}>{appliedCoupon} APPLIED</Text>
                <Text style={styles.appliedCouponDesc}>Savings unlocked on this order</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onRemoveCoupon}>
              <Text style={styles.removeCouponText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Input Row */}
            <View style={styles.couponInputWrapper}>
              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="Enter coupon code"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={styles.couponInput}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleApplyInput}
                disabled={!inputCode.trim()}
                style={[
                  styles.applyBtn,
                  !inputCode.trim() && styles.applyBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.applyBtnText,
                    !inputCode.trim() && styles.applyBtnTextDisabled,
                  ]}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Coupon Suggestions */}
            <View style={styles.couponChipsRow}>
              {AVAILABLE_COUPONS.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  activeOpacity={0.75}
                  onPress={() => onApplyCoupon?.(c.code)}
                  style={styles.couponChip}
                >
                  <Text style={styles.couponChipCode}>{c.code}</Text>
                  <Text style={styles.couponChipDesc} numberOfLines={1}>
                    {c.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(14),
  },
  giftCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF9C3",
    borderRadius: scale(14),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#FEF08A",
    marginBottom: moderateScale(10),
  },
  giftLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: scale(10),
    gap: scale(10),
  },
  giftIconSquare: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: "#FDE047",
    alignItems: "center",
    justifyContent: "center",
  },
  giftTextCol: {
    flex: 1,
  },
  giftTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#713F12",
  },
  giftSubtitle: {
    fontSize: moderateScale(11),
    color: "#854D0E",
    marginTop: moderateScale(2),
    lineHeight: moderateScale(15),
  },
  giftBold: {
    fontWeight: "800",
    color: "#713F12",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CA8A04",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
  },
  selectBtnActive: {
    backgroundColor: "#713F12",
    borderColor: "#713F12",
  },
  selectBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#713F12",
  },
  selectBtnTextActive: {
    color: "#FFFFFF",
  },
  couponContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  couponHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  couponHeaderTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  seeAllText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  couponInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(2),
    marginBottom: scale(8),
  },
  couponInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    fontWeight: "600",
    paddingVertical: scale(8),
  },
  applyBtn: {
    backgroundColor: "#003844",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(6),
  },
  applyBtnDisabled: {
    backgroundColor: "#E2E8F0",
  },
  applyBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  applyBtnTextDisabled: {
    color: "#94A3B8",
  },
  couponChipsRow: {
    gap: scale(6),
    marginTop: scale(2),
  },
  couponChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDFA",
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderStyle: "dashed",
  },
  couponChipCode: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#008080",
  },
  couponChipDesc: {
    fontSize: moderateScale(11),
    color: "#0F766E",
    fontWeight: "500",
  },
  appliedCouponPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#DCFCE7",
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  appliedCouponLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  appliedCouponCode: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#166534",
  },
  appliedCouponDesc: {
    fontSize: moderateScale(10.5),
    color: "#15803D",
    marginTop: scale(1),
  },
  removeCouponText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#DC2626",
  },
});
