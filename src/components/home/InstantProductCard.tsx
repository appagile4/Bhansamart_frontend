import { Image } from "expo-image";
import { useProductCartQuantity, useCartActions } from "@/context/cart-context";
import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface InstantProductItem {
  id: string;
  weight: string;
  category: string;
  name: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  priceDrop?: boolean;
  image: ImageSourcePropType | { uri: string };
  optionsText?: string;
}

export interface InstantProductCardProps {
  product: InstantProductItem;
  onPress?: (product: InstantProductItem) => void;
  onAddPress?: (product: InstantProductItem) => void;
}

const InstantProductCard = React.memo(function InstantProductCard({
  product,
  onPress,
  onAddPress,
}: InstantProductCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const { addToCart, updateQuantity } = useCartActions();
  const targetId = String(product.id || (product as any)._id || "").trim();
  const qty = useProductCartQuantity(targetId);

  const handleAdd = () => {
    if (onAddPress) {
      onAddPress(product);
    } else {
      let imgUrl = "";
      if (typeof (product as any).imageUrl === "string" && (product as any).imageUrl) {
        imgUrl = (product as any).imageUrl;
      } else if (typeof product.image === "string") {
        imgUrl = product.image;
      } else if (
        product.image &&
        typeof product.image === "object" &&
        "uri" in product.image
      ) {
        imgUrl = (product.image as any).uri;
      }
      addToCart({
        id: targetId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: imgUrl,
        weight: product.weight,
      });
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    } else {
      router.push({
        pathname: "/Screens/Product/productdetailscreen" as any,
        params: {
          name: product.name,
          weight: product.weight,
          price: product.price,
          originalPrice: product.originalPrice,
        },
      });
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons
          key={`star-${i}`}
          name="star"
          size={scale(10)}
          color="#F59E0B"
        />
      );
    }
    if (hasHalf) {
      stars.push(
        <Ionicons
          key="star-half"
          name="star-half"
          size={scale(10)}
          color="#F59E0B"
        />
      );
    }
    while (stars.length < 5) {
      stars.push(
        <Ionicons
          key={`star-empty-${stars.length}`}
          name="star-outline"
          size={scale(10)}
          color="#F59E0B"
        />
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.cardContainer}
    >
      {/* Top Image Container with Soft Cyan/Mint Background & ADD Button */}
      <View style={styles.imageBox}>
        <Image
          source={product.image as any}
          style={styles.productImage}
          contentFit="contain"
        />

        {/* ADD Capsule Button or Stepper */}
        {qty === 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAdd}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>ADD</Text>
            {product.optionsText ? (
              <Text style={styles.optionsText}>{product.optionsText}</Text>
            ) : null}
          </TouchableOpacity>
        ) : (
          <View style={styles.stepperBox}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateQuantity(targetId, -1)}
              style={styles.stepperAction}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="remove" size={scale(12)} color="#004D5D" />
            </TouchableOpacity>
            <Text style={styles.stepperQtyText}>{qty}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateQuantity(targetId, 1)}
              style={styles.stepperAction}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={scale(12)} color="#004D5D" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content Body */}
      <View style={styles.content}>
        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.weight}</Text>
          </View>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.category}</Text>
          </View>
        </View>

        {/* Product Title */}
        <Text
          style={[styles.productTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={3}
        >
          {product.name}
        </Text>

        {/* Rating Stars & Count */}
        <View style={styles.ratingRow}>
          <View style={styles.starsGroup}>{renderStars(product.rating)}</View>
          <Text style={styles.ratingCount}>({product.reviewsCount})</Text>
        </View>

        {/* Price Drop if present */}
        {product.priceDrop ? (
          <Text style={styles.priceDropText}>Price Drop</Text>
        ) : null}

        {/* Pricing */}
        <View style={styles.priceRow}>
          <Text
            style={[styles.currentPrice, { color: theme.colors.textPrimary }]}
          >
            Rs. {product.price}
          </Text>
          <Text style={styles.originalPrice}>Rs. {product.originalPrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default InstantProductCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: "31%",
    marginBottom: moderateScale(16),
  },
  imageBox: {
    width: "100%",
    aspectRatio: 0.95,
    backgroundColor: "#DBF4F6",
    borderRadius: scale(14),
    padding: scale(6),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  productImage: {
    width: "88%",
    height: "88%",
  },
  addBtn: {
    position: "absolute",
    bottom: -scale(1),
    right: -scale(1),
    backgroundColor: "#ffffff",
    borderWidth: 1.2,
    borderColor: "#4A7C59",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stepperBox: {
    position: "absolute",
    bottom: -scale(1),
    right: -scale(1),
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#004D5D",
    borderRadius: scale(8),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stepperAction: {
    paddingHorizontal: scale(3),
    paddingVertical: scale(1),
  },
  stepperQtyText: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#004D5D",
    marginHorizontal: scale(4),
  },
  addBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#4A7C59",
    letterSpacing: 0.3,
  },
  optionsText: {
    fontSize: moderateScale(7.5),
    color: "#64748B",
    marginTop: -2,
  },
  content: {
    paddingTop: moderateScale(6),
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginBottom: moderateScale(4),
  },
  tagBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  tagText: {
    fontSize: moderateScale(9),
    color: "#64748B",
    fontWeight: "500",
  },
  productTitle: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    lineHeight: moderateScale(15),
    minHeight: scale(44),
    marginBottom: moderateScale(2),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    marginBottom: moderateScale(2),
  },
  starsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },
  ratingCount: {
    fontSize: moderateScale(9.5),
    color: "#64748B",
    fontWeight: "500",
  },
  priceDropText: {
    fontSize: moderateScale(9.5),
    color: "#DC2626",
    fontWeight: "600",
    marginTop: moderateScale(1),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
    marginTop: moderateScale(1),
  },
  currentPrice: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
});
