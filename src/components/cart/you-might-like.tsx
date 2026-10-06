import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface RecommendedProduct {
  id: string;
  name: string;
  badge?: string;
  tags?: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
}

interface YouMightLikeSectionProps {
  products: RecommendedProduct[];
  onAddToCart?: (product: RecommendedProduct) => void;
  onSeeAllPress?: () => void;
}

export default function YouMightLikeSection({
  products,
  onAddToCart,
  onSeeAllPress,
}: YouMightLikeSectionProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>You might also like</Text>

      {/* Grid of Recommended Products */}
      <View style={styles.grid}>
        {products.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/Screens/Product/productdetailscreen" as any,
                params: {
                  name: item.name,
                  price: item.price,
                  originalPrice: item.originalPrice,
                  image: item.imageUrl,
                },
              })
            }
            style={styles.productCard}
          >
            {/* Image Box with ADD pill floating */}
            <View style={styles.imageContainer}>
              <Image
                source={
                  typeof item.imageUrl === "string"
                    ? { uri: item.imageUrl }
                    : item.imageUrl
                }
                style={styles.productImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onAddToCart?.(item)}
                style={styles.addPill}
              >
                <Text style={styles.addPillText}>ADD</Text>
              </TouchableOpacity>
            </View>

            {/* Badge (e.g. Few pieces left) */}
            {item.badge ? (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : (
              <View style={{ height: moderateScale(14) }} />
            )}

            {/* Tags (e.g., 1kg, cornflakes) */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.map((tag, i) => (
                  <View key={i} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Title */}
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>

            {/* Star Ratings */}
            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={scale(10)}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.reviewsCount}>({item.reviewsCount})</Text>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>Rs. {item.price}</Text>
              <Text style={styles.origPrice}>Rs.{item.originalPrice}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* See all products CTA Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSeeAllPress}
        style={styles.seeAllBanner}
      >
        <View style={styles.avatarGroup}>
          <View style={[styles.avatarCircle, { zIndex: 3, left: 0 }]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=100&q=80",
              }}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.avatarCircle, { zIndex: 2, left: scale(14) }]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&q=80",
              }}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.avatarCircle, { zIndex: 1, left: scale(28) }]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80",
              }}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.seeAllTextRow}>
          <Text style={styles.seeAllText}>See all products</Text>
          <Feather name="chevron-right" size={scale(16)} color="#0E4A56" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(12),
    paddingHorizontal: scale(4),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scale(8),
  },
  productCard: {
    width: "31%",
    marginBottom: moderateScale(10),
  },
  imageContainer: {
    width: "100%",
    height: scale(88),
    backgroundColor: "#E0F2FE",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(4),
  },
  productImage: {
    width: "80%",
    height: "80%",
  },
  addPill: {
    position: "absolute",
    bottom: scale(4),
    right: scale(4),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#2D6A4F",
    borderRadius: scale(6),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addPillText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#2D6A4F",
  },
  badgeContainer: {
    marginTop: moderateScale(4),
    marginBottom: moderateScale(2),
  },
  badgeText: {
    fontSize: moderateScale(9),
    color: "#DC2626",
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(3),
    marginBottom: moderateScale(3),
  },
  tagPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    borderRadius: scale(3),
  },
  tagText: {
    fontSize: moderateScale(8.5),
    color: "#64748B",
    fontWeight: "600",
  },
  productName: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(14),
    marginBottom: moderateScale(3),
    minHeight: moderateScale(28),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    marginBottom: moderateScale(2),
  },
  stars: {
    flexDirection: "row",
    gap: scale(1),
  },
  reviewsCount: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  price: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  origPrice: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  seeAllBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0F2FE",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8),
    marginTop: moderateScale(6),
  },
  avatarGroup: {
    width: scale(60),
    height: scale(26),
    position: "relative",
  },
  avatarCircle: {
    position: "absolute",
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: "#ffffff",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  seeAllTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0E4A56",
  },
});
