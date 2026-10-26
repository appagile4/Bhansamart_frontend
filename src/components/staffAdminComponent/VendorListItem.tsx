import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";
import { getStoreCity, getStoreDisplayName, getStoreState } from "@/components/AdminStoreFilterDropdown";

interface VendorListItemProps {
  vendor: any;
  onPress: () => void;
}

export default function VendorListItem({
  vendor,
  onPress,
}: VendorListItemProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const storeName = getStoreDisplayName(vendor);
  const state = getStoreState(vendor);
  const city = getStoreCity(vendor);
  const isOpen = vendor.isStoreOpen ?? true;
  const isVerified =
    vendor.isVerified ||
    vendor.businessDetails?.verificationStatus === "approved" ||
    vendor.status === "approved" ||
    vendor.status === "active";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      <View style={styles.topRow}>
        <View style={styles.storeLeft}>
          <View style={styles.storeIconBox}>
            <MaterialCommunityIcons name="storefront" size={scale(20)} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.storeName, { color: textPrimary }]} numberOfLines={1}>
                {storeName}
              </Text>
              {isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={scale(15)} color="#059669" />
              )}
            </View>

            <View style={styles.locationRow}>
              <Feather name="map-pin" size={scale(11)} color={textSecondary} />
              <Text style={[styles.locationText, { color: textSecondary }]} numberOfLines={1}>
                {[city, state].filter(Boolean).join(", ") || "Nepal"}
              </Text>
            </View>
          </View>
        </View>

        {/* Store Open / Closed Status Pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isOpen ? "#ECFDF5" : "#FEF2F2" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOpen ? "#10B981" : "#EF4444" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOpen ? "#059669" : "#DC2626" },
            ]}
          >
            {isOpen ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      {/* Stats Footnote */}
      <View style={[styles.bottomRow, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: textSecondary }]}>Category</Text>
          <Text style={[styles.metaVal, { color: textPrimary }]}>
            {vendor.businessDetails?.businessType || "Retail"}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: textSecondary }]}>Contact</Text>
          <Text style={[styles.metaVal, { color: textPrimary }]}>
            {vendor.sellerDetails?.phone || vendor.phone || "Available"}
          </Text>
        </View>

        <View style={styles.actionCol}>
          <Text style={styles.viewText}>Manage</Text>
          <Feather name="chevron-right" size={scale(14)} color="#0284C7" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
    marginRight: scale(8),
  },
  storeIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
  },
  storeName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: moderateScale(2),
  },
  locationText: {
    fontSize: moderateScale(11.5),
    fontWeight: "500",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(12),
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(12),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
  },
  metaItem: {
    gap: moderateScale(1),
  },
  metaLabel: {
    fontSize: moderateScale(10),
    fontWeight: "500",
  },
  metaVal: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  actionCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  viewText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0284C7",
  },
});
