import { useCart } from "@/context/cart-context";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export interface DealProduct {
  id: string;
  weight: string;
  category: string;
  subCategory?: string;
  name: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  priceDropText?: string;
  image: ImageSourcePropType;
  discountPct?: number;
  isVeg?: boolean;
  unitPriceText?: string;
  ordersCount?: number;
  tags?: string[];
}

export interface ProductCardProps {
  product: DealProduct;
  cardWidth?: number;
  onPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
}

function ProductCardComponent({
  product,
  cardWidth,
  onPress,
  onAddPress,
  onSeeMorePress,
}: ProductCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const primaryColor = theme.colors.primary || "#004d5d";
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const qty = getItemQuantity(product.id);

  // ── Extra Compact Dynamic Sizing Calculation ─────────────────────────
  const dynamicWidth = useMemo(() => {
    if (cardWidth) return cardWidth;
    if (windowWidth >= 768) {
      // Tablets: sleek compact card size
      return Math.min(Math.round(windowWidth * 0.2), 175);
    }
    if (windowWidth < 360) {
      // Small screen devices
      return Math.round(windowWidth * 0.42);
    }
    // Standard smartphones: compact ~38% of screen width (around 140-158px)
    return Math.min(Math.max(Math.round(windowWidth * 0.38), 138), 158);
  }, [cardWidth, windowWidth]);

  const dynamicImageHeight = useMemo(() => {
    const calculated = Math.round(dynamicWidth * 0.7);
    const maxHeight = Math.round(windowHeight * 0.17);
    const minHeight = scale(95);
    return Math.min(Math.max(calculated, minHeight), maxHeight);
  }, [dynamicWidth, windowHeight]);

  const discountPercent =
    product.discountPct !== undefined
      ? product.discountPct
      : product.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100,
          )
        : 0;

  // Derive subcategory / flavor or weight string
  const subtitleText = [
    product.subCategory || product.category || "Grocery",
    product.weight || "1 unit",
  ]
    .filter(Boolean)
    .join(" | ");

  // Derive unit price text (e.g. Save Rs. 20)
  const unitPrice =
    product.unitPriceText ||
    (product.originalPrice && product.originalPrice > product.price
      ? `Save Rs. ${product.originalPrice - product.price}`
      : undefined);

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    } else {
      router.push({
        pathname: "/Screens/Product/productdetailscreen" as any,
        params: {
          id: product.id,
          name: product.name,
          weight: product.weight,
          price: String(product.price),
          originalPrice: String(product.originalPrice || product.price),
          category: product.category,
          subCategory: product.subCategory,
          image:
            typeof product.image === "object" && "uri" in product.image
              ? (product.image as any).uri
              : "",
        },
      });
    }
  };

  const handleAddToCart = () => {
    if (onAddPress) {
      onAddPress(product);
    } else {
      const imgUrl =
        typeof product.image === "object" && "uri" in product.image
          ? (product.image as any).uri
          : "";
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        imageUrl: imgUrl,
        weight: product.weight || "1 pc",
      });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={[styles.cardContainer, { width: dynamicWidth }]}
    >
      {/* 1. Hero Product Image Area */}
      <View style={[styles.imageContainer, { height: dynamicImageHeight }]}>
        <Image
          source={product.image}
          style={styles.productImage}
          contentFit="cover"
          transition={150}
        />

        {/* Top-Left Discount Badge */}
        {discountPercent > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: "red" }]}>
            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Top-Right Heart / Wishlist Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsWishlisted(!isWishlisted)}
          style={styles.wishlistBtn}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={scale(13)}
            color={isWishlisted ? "#DC2626" : "#1E293B"}
          />
        </TouchableOpacity>

        {/* Bottom-Right Dot Pagination Indicator */}
        <View style={styles.dotsIndicator}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* 2. Product Details Body */}
      <View style={styles.bodyContent}>
        {/* Title */}
        <Text numberOfLines={1} style={styles.titleText}>
          {product.name}
        </Text>

        {/* Subtitle / Weight & Variant */}
        <Text numberOfLines={1} style={styles.subtitleText}>
          {subtitleText}
        </Text>

        {/* Rating and Vegetarian Tag Row */}
        <View style={styles.metaRow}>
          {/* Star Rating */}
          <View style={styles.ratingBox}>
            <FontAwesome
              name="star"
              size={scale(9.5)}
              color={primaryColor}
              style={{ marginRight: scale(2) }}
            />
            <Text style={styles.ratingScore}>
              {Number(product.rating || 4.5).toFixed(1)}
            </Text>
            <Text style={styles.ratingCountText}>
              ({product.reviewsCount || 142})
            </Text>
          </View>

          {/* Vegetarian Badge */}
          <View
            style={[styles.vegBadge, { backgroundColor: `${primaryColor}15` }]}
          >
            <MaterialCommunityIcons
              name="leaf"
              size={scale(9.5)}
              color={primaryColor}
              style={{ marginRight: scale(1.5) }}
            />
            <Text style={[styles.vegBadgeText, { color: primaryColor }]}>
              Veg
            </Text>
          </View>
        </View>

        {/* Pricing Row */}
        <View style={styles.pricingRow}>
          <Text style={styles.currencySymbol}>Rs. </Text>
          <Text style={styles.mainPrice}>{product.price}</Text>

          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.strikePrice}>Rs. {product.originalPrice}</Text>
          ) : null}
        </View>

        {/* Unit Price / Savings Note */}
        {unitPrice ? (
          <Text numberOfLines={1} style={styles.unitPriceText}>
            ({unitPrice})
          </Text>
        ) : null}

        {/* Full-Width Add to Cart Button */}
        {qty === 0 ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleAddToCart}
            style={[
              styles.addToCartBtn,
              {
                backgroundColor: primaryColor,
                shadowColor: primaryColor,
              },
            ]}
          >
            <Feather
              name="shopping-cart"
              size={scale(11.5)}
              color="#FFFFFF"
              style={{ marginRight: scale(4) }}
            />
            <Text style={styles.addToCartBtnText}>Add</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.quantityStepperRow,
              {
                backgroundColor: primaryColor,
                shadowColor: primaryColor,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateQuantity(product.id, -1)}
              style={styles.stepperActionBtn}
            >
              <Feather name="minus" size={scale(11)} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.stepperCountText}>{qty}</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateQuantity(product.id, 1)}
              style={styles.stepperActionBtn}
            >
              <Feather name="plus" size={scale(11)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: scale(6),
    left: scale(6),
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(10),
    zIndex: 5,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  wishlistBtn: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 5,
  },
  dotsIndicator: {
    position: "absolute",
    bottom: scale(5),
    right: scale(6),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    borderRadius: scale(8),
    gap: scale(2.5),
    zIndex: 5,
  },
  dot: {
    width: scale(3.5),
    height: scale(3.5),
    borderRadius: scale(1.75),
    backgroundColor: "#CBD5E1",
  },
  activeDot: {
    backgroundColor: "#1E293B",
  },
  bodyContent: {
    padding: scale(8),
  },
  titleText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
    marginBottom: scale(1.5),
  },
  subtitleText: {
    fontSize: moderateScale(10),
    color: "#64748B",
    fontWeight: "500",
    marginBottom: scale(4),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(5),
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingScore: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#0F172A",
    marginRight: scale(2),
  },
  ratingCountText: {
    fontSize: moderateScale(9),
    color: "#64748B",
    fontWeight: "500",
  },
  vegBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1.5),
    borderRadius: scale(6),
  },
  vegBadgeText: {
    fontSize: moderateScale(8),
    fontWeight: "700",
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(2),
    marginBottom: scale(1.5),
  },
  currencySymbol: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  mainPrice: {
    fontSize: moderateScale(14.5),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  strikePrice: {
    fontSize: moderateScale(9.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginLeft: scale(2),
  },
  discountHighlight: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    marginLeft: scale(2),
  },
  unitPriceText: {
    fontSize: moderateScale(8.5),
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: scale(5),
  },
  trustBadgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(3.5),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: scale(6),
  },
  trustBadgeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  trustBadgeTextBox: {
    flex: 1,
  },
  trustBadgeHeading: {
    fontSize: moderateScale(8),
    fontWeight: "700",
    color: "#1E293B",
  },
  trustBadgeSub: {
    fontSize: moderateScale(7),
    color: "#64748B",
    fontWeight: "500",
  },
  trustDivider: {
    width: 1,
    height: scale(14),
    backgroundColor: "#E2E8F0",
    marginHorizontal: scale(2),
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: scale(30),
    borderRadius: scale(8),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addToCartBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  quantityStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: scale(30),
    borderRadius: scale(8),
    paddingHorizontal: scale(3),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  stepperActionBtn: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(5),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCountText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10.5),
    fontWeight: "800",
  },
});

const ProductCard = memo(ProductCardComponent);
export default ProductCard;
