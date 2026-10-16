import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BillDetailsSectionProps {
  itemsTotal: number;
  originalTotal: number;
  savedOnItems: number;
  deliveryCharge: number;
  isDeliveryFree?: boolean;
  handlingCharge: number;
  riderTip?: number;
  onSelectTip?: (tip: number) => void;
  appliedCouponCode?: string;
  couponDiscount?: number;
  totalSavings: number;
  grandTotal: number;
  onApplyCouponPress?: () => void;
}

const TIP_OPTIONS = [0, 20, 30, 50];

export default function BillDetailsSection({
  itemsTotal,
  originalTotal,
  savedOnItems,
  deliveryCharge,
  isDeliveryFree = true,
  handlingCharge,
  riderTip = 0,
  onSelectTip,
  appliedCouponCode,
  couponDiscount = 0,
  totalSavings,
  grandTotal,
  onApplyCouponPress,
}: BillDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  return (
    <View style={styles.container}>
      {/* 1. Rider Tip Appreciate Section */}
      <View
        style={[
          styles.tipCard,
          isDark && { backgroundColor: "#101922", borderColor: "#1E2A38" },
        ]}
      >
        <View style={styles.tipHeaderRow}>
          <View
            style={[
              styles.tipIconBox,
              isDark && { backgroundColor: "#351419" },
            ]}
          >
            <Ionicons name="heart" size={scale(16)} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.tipTitle,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Say thanks to your Delivery Hero
            </Text>
            <Text
              style={[
                styles.tipSubtitle,
                isDark && { color: "#94A3B8" },
              ]}
            >
              100% of this tip goes directly to your rider
            </Text>
          </View>
        </View>

        <View style={styles.tipChipsRow}>
          {TIP_OPTIONS.map((tip) => {
            const isSelected = riderTip === tip;
            return (
              <TouchableOpacity
                key={tip}
                activeOpacity={0.75}
                onPress={() => onSelectTip?.(tip)}
                style={[
                  styles.tipChip,
                  isDark && {
                    backgroundColor: "#15222D",
                    borderColor: "#243545",
                  },
                  isSelected &&
                    (isDark
                      ? {
                          backgroundColor: "#016073",
                          borderColor: "#016073",
                        }
                      : styles.tipChipActive),
                ]}
              >
                <Text
                  style={[
                    styles.tipChipText,
                    isDark && { color: "#94A3B8" },
                    isSelected && styles.tipChipTextActive,
                  ]}
                >
                  {tip === 0 ? "No tip" : `+Rs.${tip}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Bill Summary Card */}
      <View
        style={[
          styles.billCard,
          isDark && { backgroundColor: "#101922", borderColor: "#1E2A38" },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            isDark && { color: "#F8FAFC" },
          ]}
        >
          Bill details
        </Text>

        <View style={styles.rowsList}>
          {/* Items Total */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather
                name="file-text"
                size={scale(15)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.rowLabel,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                Items total
              </Text>
              {savedOnItems > 0 && (
                <View
                  style={[
                    styles.savedBadge,
                    isDark && { backgroundColor: "#0A2818" },
                  ]}
                >
                  <Text
                    style={[
                      styles.savedBadgeText,
                      isDark && { color: "#4ADE80" },
                    ]}
                  >
                    Saved Rs.{savedOnItems}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.rowRight}>
              {originalTotal > itemsTotal && (
                <Text
                  style={[
                    styles.strikethroughPrice,
                    isDark && { color: "#64748B" },
                  ]}
                >
                  Rs.{originalTotal}
                </Text>
              )}
              <Text
                style={[
                  styles.rowValue,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                Rs.{itemsTotal}
              </Text>
            </View>
          </View>

          {/* Delivery Charge */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather
                name="truck"
                size={scale(15)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.rowLabel,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                Delivery charge
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.strikethroughPrice,
                  isDark && { color: "#64748B" },
                ]}
              >
                Rs.40
              </Text>
              <Text
                style={[
                  styles.freeText,
                  isDark && { color: "#4ADE80" },
                ]}
              >
                FREE
              </Text>
            </View>
          </View>

          {/* Handling Charge */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather
                name="shield"
                size={scale(15)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.rowLabel,
                  isDark && { color: "#94A3B8" },
                ]}
              >
                Handling & packaging
              </Text>
            </View>
            <Text
              style={[
                styles.rowValue,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Rs.{handlingCharge}
            </Text>
          </View>

          {/* Rider Tip */}
          {riderTip > 0 && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="heart-outline"
                  size={scale(15)}
                  color="#EF4444"
                />
                <Text
                  style={[
                    styles.rowLabel,
                    isDark && { color: "#94A3B8" },
                  ]}
                >
                  Delivery tip
                </Text>
              </View>
              <Text
                style={[
                  styles.rowValue,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                Rs.{riderTip}
              </Text>
            </View>
          )}

          {/* Applied Coupon Discount */}
          {couponDiscount > 0 && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather
                  name="tag"
                  size={scale(15)}
                  color={isDark ? "#4ADE80" : "#16A34A"}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    {
                      color: isDark ? "#4ADE80" : "#16A34A",
                      fontWeight: "700",
                    },
                  ]}
                >
                  Coupon discount ({appliedCouponCode})
                </Text>
              </View>
              <Text
                style={[
                  styles.rowValue,
                  { color: isDark ? "#4ADE80" : "#16A34A" },
                ]}
              >
                -Rs.{couponDiscount}
              </Text>
            </View>
          )}

          {/* Coupon Code Tap Row */}
          {!appliedCouponCode && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onApplyCouponPress}
              style={[
                styles.couponTapRow,
                isDark && {
                  backgroundColor: "#122A26",
                  borderColor: "#1A4D45",
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <Feather
                  name="percent"
                  size={scale(15)}
                  color={isDark ? "#38BDF8" : "#008080"}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    {
                      color: isDark ? "#38BDF8" : "#008080",
                      fontWeight: "600",
                    },
                  ]}
                >
                  Apply discount coupon
                </Text>
              </View>
              <View style={styles.couponRight}>
                <Text
                  style={[
                    styles.couponText,
                    isDark && { color: "#38BDF8" },
                  ]}
                >
                  Select
                </Text>
                <Feather
                  name="chevron-right"
                  size={scale(15)}
                  color={isDark ? "#38BDF8" : "#008080"}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={[
            styles.divider,
            isDark && { backgroundColor: "#1E2A38" },
          ]}
        />

        {/* Grand Total Row */}
        <View style={styles.grandTotalRow}>
          <View>
            <Text
              style={[
                styles.grandTotalLabel,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              To Pay
            </Text>
            <Text
              style={[
                styles.taxInclusiveText,
                isDark && { color: "#64748B" },
              ]}
            >
              Inclusive of all taxes
            </Text>
          </View>
          <Text
            style={[
              styles.grandTotalValue,
              isDark && { color: "#38BDF8" },
            ]}
          >
            Rs.{grandTotal}
          </Text>
        </View>

        {/* Total Savings Highlight Banner */}
        {totalSavings > 0 && (
          <LinearGradient
            colors={
              isDark
                ? ["#0A2818", "#071B11"]
                : ["#DCFCE7", "#F0FDF4"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.savingsBox,
              isDark && { borderColor: "#14532D" },
            ]}
          >
            <View style={styles.savingsTopRow}>
              <View style={styles.savingsTitleRow}>
                <Ionicons
                  name="sparkles"
                  size={scale(16)}
                  color={isDark ? "#4ADE80" : "#16A34A"}
                />
                <Text
                  style={[
                    styles.savingsLabel,
                    isDark && { color: "#4ADE80" },
                  ]}
                >
                  Your total savings
                </Text>
              </View>
              <Text
                style={[
                  styles.savingsValue,
                  isDark && { color: "#4ADE80" },
                ]}
              >
                Rs.{totalSavings}
              </Text>
            </View>
            <Text
              style={[
                styles.savingsSubtext,
                isDark && { color: "#86EFAC" },
              ]}
            >
              Includes free delivery & item discounts
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* 3. Safety & Cancellation Note */}
      <View
        style={[
          styles.policyCard,
          isDark && {
            backgroundColor: "#10232B",
            borderColor: "#1A3644",
          },
        ]}
      >
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={scale(18)}
          color={isDark ? "#38BDF8" : "#0F766E"}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.policyTitle,
              isDark && { color: "#38BDF8" },
            ]}
          >
            Cancellation & Quality Guarantee
          </Text>
          <Text
            style={[
              styles.policyText,
              isDark && { color: "#94A3B8" },
            ]}
          >
            Orders cannot be cancelled once packed. 100% replacement / instant
            refund guaranteed if quality is not met.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(16),
  },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(14),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginBottom: scale(12),
  },
  tipIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  tipSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  tipChipsRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  tipChip: {
    flex: 1,
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  tipChipActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  tipChipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#475569",
  },
  tipChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(12),
  },
  rowsList: {
    gap: moderateScale(10),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  rowLabel: {
    fontSize: moderateScale(13),
    color: "#475569",
    fontWeight: "500",
  },
  savedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(6),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
  },
  savedBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#16A34A",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  strikethroughPrice: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  rowValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  freeText: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#16A34A",
  },
  couponTapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDFA",
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#CCFBF1",
    marginTop: scale(2),
  },
  couponRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  couponText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(12),
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  grandTotalLabel: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  taxInclusiveText: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    marginTop: scale(1),
  },
  grandTotalValue: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#003844",
  },
  savingsBox: {
    borderRadius: scale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  savingsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savingsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  savingsLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#15803D",
  },
  savingsValue: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#15803D",
  },
  savingsSubtext: {
    fontSize: moderateScale(10.5),
    color: "#166534",
    marginTop: scale(2),
  },
  policyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(10),
    backgroundColor: "#F0FDFA",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#CCFBF1",
    marginTop: moderateScale(12),
  },
  policyTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F766E",
  },
  policyText: {
    fontSize: moderateScale(10.5),
    color: "#115E59",
    marginTop: scale(2),
    lineHeight: moderateScale(15),
  },
});
