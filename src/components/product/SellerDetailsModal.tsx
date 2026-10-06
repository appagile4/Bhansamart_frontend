import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface SellerInfo {
  name: string;
  distance?: string;
  deliveryTime?: string;
  experience?: string;
  rating?: number;
  ratingCount?: string;
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  stat3Value?: string;
  stat3Label?: string;
  aboutText?: string;
  locationText?: string;
  catalogText?: string;
}

interface SellerDetailsModalProps {
  visible: boolean;
  seller?: SellerInfo;
  onClose: () => void;
  onSeeOtherSellers?: () => void;
}

const DEFAULT_SELLER: SellerInfo = {
  name: "Urban Oasis Goods Pvt. Ltd.",
  distance: "1.4 km",
  deliveryTime: "30–35 mins",
  experience: "4 Years with Bhansamart",
  rating: 4.8,
  ratingCount: "12.4k ratings",
  stat1Value: "12",
  stat1Label: "Bhansamart",
  stat2Value: "12",
  stat2Label: "Bhansamart",
  stat3Value: "12",
  stat3Label: "Bhansamart",
  aboutText:
    "The voucher is caNorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.pped",
  locationText: "The voucher is caNorem ipsum dolor sit amet",
  catalogText: "The voucher is caNorem ipsum dolor sit amet",
};

export default function SellerDetailsModal({
  visible,
  seller = DEFAULT_SELLER,
  onClose,
  onSeeOtherSellers,
}: SellerDetailsModalProps) {
  const theme = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);

  const data = { ...DEFAULT_SELLER, ...seller };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Tap backdrop to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouch} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Card */}
        <View style={styles.sheetCard}>
          {/* Top Pull Handle */}
          <View style={styles.pullHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* 1. Store Header Row */}
            <View style={styles.headerRow}>
              {/* Left Store Icon Badge */}
              <View style={styles.storeIconBox}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={scale(22)}
                  color="#FFFFFF"
                />
              </View>

              {/* Store Title */}
              <Text style={styles.storeName} numberOfLines={2}>
                {data.name}
              </Text>

              {/* Wishlist Heart Icon Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsFavorite((prev) => !prev)}
                style={styles.heartBtn}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={scale(24)}
                  color={isFavorite ? "#EF4444" : "#1E293B"}
                />
              </TouchableOpacity>
            </View>

            {/* 2. Metrics & Rating Row */}
            <View style={styles.metricsRow}>
              {/* Left Column Info List */}
              <View style={styles.metricsLeft}>
                <View style={styles.metricItem}>
                  <Ionicons
                    name="location-outline"
                    size={scale(15)}
                    color="#64748B"
                  />
                  <Text style={styles.metricText}>{data.distance}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Ionicons
                    name="time-outline"
                    size={scale(15)}
                    color="#64748B"
                  />
                  <Text style={styles.metricText}>{data.deliveryTime}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Ionicons
                    name="time-outline"
                    size={scale(15)}
                    color="#64748B"
                  />
                  <Text style={styles.metricText}>{data.experience}</Text>
                </View>
              </View>

              {/* Right Column Rating Pill & Count */}
              <View style={styles.metricsRight}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingValueText}>
                    {data.rating?.toFixed(1)}
                  </Text>
                  <Ionicons
                    name="star"
                    size={scale(12)}
                    color="#FFFFFF"
                    style={styles.ratingStar}
                  />
                </View>
                <Text style={styles.ratingCountText}>{data.ratingCount}</Text>
              </View>
            </View>

            {/* 3. 3-Column Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{data.stat1Value}</Text>
                <Text style={styles.statLabel}>{data.stat1Label}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{data.stat2Value}</Text>
                <Text style={styles.statLabel}>{data.stat2Label}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{data.stat3Value}</Text>
                <Text style={styles.statLabel}>{data.stat3Label}</Text>
              </View>
            </View>

            {/* 4. About Seller Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>About Seller</Text>
              <Text style={styles.sectionBodyText}>{data.aboutText}</Text>
            </View>

            <View style={styles.thinDivider} />

            {/* 5. Location Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>Location</Text>
              <Text style={styles.sectionBodyText}>{data.locationText}</Text>
            </View>

            <View style={styles.thinDivider} />

            {/* 6. Product Catalog Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>Product Catalog</Text>
              <Text style={styles.sectionBodyText}>{data.catalogText}</Text>
            </View>

            {/* 7. Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onSeeOtherSellers?.();
              }}
              style={styles.seeOtherButton}
            >
              <Text style={styles.seeOtherButtonText}>See other sellers</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: scale(10),
    paddingBottom: scale(24),
    paddingHorizontal: scale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  pullHandle: {
    width: scale(38),
    height: scale(4.5),
    backgroundColor: "#CBD5E1",
    borderRadius: scale(3),
    alignSelf: "center",
    marginBottom: scale(14),
  },
  scrollContent: {
    paddingBottom: scale(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(14),
  },
  storeIconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    backgroundColor: "#104E5B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  storeName: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.2,
  },
  heartBtn: {
    padding: scale(4),
    marginLeft: scale(8),
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(16),
  },
  metricsLeft: {
    gap: scale(6),
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  metricText: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "500",
  },
  metricsRight: {
    alignItems: "flex-end",
  },
  ratingBadge: {
    backgroundColor: "#16A34A",
    borderRadius: scale(6),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3.5),
    gap: scale(3),
  },
  ratingValueText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  ratingStar: {
    marginLeft: scale(1),
  },
  ratingCountText: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    fontWeight: "500",
    marginTop: scale(4),
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingVertical: scale(12),
    marginBottom: scale(16),
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: scale(2),
  },
  statDivider: {
    width: 1,
    height: scale(22),
    backgroundColor: "#F1F5F9",
  },
  sectionContainer: {
    marginVertical: scale(2),
  },
  sectionHeading: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: scale(5),
    letterSpacing: -0.2,
  },
  sectionBodyText: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    lineHeight: moderateScale(18),
    fontWeight: "400",
  },
  thinDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: scale(12),
  },
  seeOtherButton: {
    borderWidth: 1.5,
    borderColor: "#104E5B",
    borderRadius: scale(10),
    paddingVertical: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(16),
    marginBottom: scale(8),
    backgroundColor: "#FFFFFF",
  },
  seeOtherButtonText: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#104E5B",
  },
});
