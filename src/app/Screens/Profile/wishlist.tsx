import { FloatingCartBar } from "@/components/cart";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearWishlist,
  fetchWishlist,
  loadWishlistFromStorage,
  removeFromWishlist,
  WishlistItem,
} from "@/store/slices/wishlistSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - scale(44)) / 2;

export default function WishlistScreen() {
  const router = useRouter();
  const theme = useTheme();
  const primaryColor = theme.colors.primary || "#004D5D";
  const dispatch = useAppDispatch();

  const { items, loading, initialized } = useAppSelector(
    (state) => state.wishlist
  );
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  useEffect(() => {
    if (!initialized) {
      dispatch(loadWishlistFromStorage());
    }
    dispatch(fetchWishlist());
  }, [dispatch, initialized]);

  const handleClearAll = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert(
      "Clear Wishlist",
      "Are you sure you want to remove all items from your wishlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => dispatch(clearWishlist()),
        },
      ]
    );
  }, [dispatch, items.length]);

  const handleRemoveItem = useCallback(
    (productId: string, name: string) => {
      dispatch(removeFromWishlist(productId));
    },
    [dispatch]
  );

  const handleAddAllToCart = useCallback(() => {
    if (items.length === 0) return;
    let addedCount = 0;
    items.forEach((item) => {
      const currentQty = getItemQuantity(item.productId);
      if (currentQty === 0) {
        addToCart({
          id: item.productId,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          imageUrl:
            item.imageUrl ||
            (typeof item.image === "string"
              ? item.image
              : item.image?.uri || ""),
          weight: item.weight || "1 unit",
        });
        addedCount++;
      }
    });

    Alert.alert(
      "Cart Updated",
      addedCount > 0
        ? `Added ${addedCount} wishlist item${addedCount > 1 ? "s" : ""} to your cart!`
        : "All items in your wishlist are already in your cart.",
      [
        { text: "Continue", style: "cancel" },
        {
          text: "View Cart",
          onPress: () => router.push("/customerMain/cart" as any),
        },
      ]
    );
  }, [items, getItemQuantity, addToCart, router]);

  const renderWishlistItem = useCallback(
    ({ item }: { item: WishlistItem }) => {
      const qty = getItemQuantity(item.productId);
      const discountPercent =
        item.discountPct !== undefined && item.discountPct > 0
          ? item.discountPct
          : item.originalPrice && item.originalPrice > item.price
          ? Math.round(
              ((item.originalPrice - item.price) / item.originalPrice) * 100
            )
          : 0;

      const imageSource =
        typeof item.image === "number"
          ? item.image
          : item.imageUrl
          ? { uri: item.imageUrl }
          : typeof item.image === "string" && item.image.startsWith("http")
          ? { uri: item.image }
          : item.image?.uri
          ? { uri: item.image.uri }
          : {
              uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
            };

      const handlePressCard = () => {
        router.push({
          pathname: "/Screens/Product/productdetailscreen" as any,
          params: {
            id: item.productId,
            name: item.name,
            weight: item.weight,
            price: String(item.price),
            originalPrice: String(item.originalPrice || item.price),
            rating: String(item.rating || 4.5),
            category: item.category,
            subCategory: item.subCategory,
            image:
              typeof imageSource === "object" && "uri" in imageSource
                ? (imageSource as any).uri
                : "",
          },
        });
      };

      const handleAddToCart = () => {
        addToCart({
          id: item.productId,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          imageUrl:
            typeof imageSource === "object" && "uri" in imageSource
              ? (imageSource as any).uri
              : "",
          weight: item.weight || "1 unit",
        });
      };

      return (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handlePressCard}
          style={styles.cardContainer}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={imageSource}
              style={styles.productImage}
              contentFit="cover"
              transition={150}
            />

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>
                  {discountPercent}% OFF
                </Text>
              </View>
            )}

            {/* Remove / Heart Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRemoveItem(item.productId, item.name)}
              style={styles.heartBtn}
            >
              <Ionicons name="heart" size={scale(15)} color="#DC2626" />
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View style={styles.cardBody}>
            {/* Title */}
            <Text numberOfLines={2} style={styles.titleText}>
              {item.name}
            </Text>

            {/* Subtitle / Weight */}
            <Text numberOfLines={1} style={styles.weightText}>
              {[item.subCategory || item.category, item.weight || "1 unit"]
                .filter(Boolean)
                .join(" • ")}
            </Text>

            {/* Rating and Veg status */}
            <View style={styles.metaRow}>
              <View style={styles.ratingBox}>
                <FontAwesome
                  name="star"
                  size={scale(9.5)}
                  color="#F59E0B"
                  style={{ marginRight: scale(2) }}
                />
                <Text style={styles.ratingScore}>
                  {Number(item.rating || 4.5).toFixed(1)}
                </Text>
              </View>

              {item.isVeg !== undefined && (
                <View
                  style={[
                    styles.vegTag,
                    {
                      backgroundColor: item.isVeg
                        ? "rgba(22, 163, 74, 0.12)"
                        : "rgba(220, 38, 38, 0.12)",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.isVeg ? "leaf" : "circle"}
                    size={item.isVeg ? scale(9) : scale(6)}
                    color={item.isVeg ? "#16A34A" : "#DC2626"}
                    style={{ marginRight: scale(2) }}
                  />
                  <Text
                    style={[
                      styles.vegTagText,
                      { color: item.isVeg ? "#16A34A" : "#DC2626" },
                    ]}
                  >
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </Text>
                </View>
              )}
            </View>

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>Rs. </Text>
              <Text style={styles.mainPrice}>{item.price}</Text>

              {item.originalPrice && item.originalPrice > item.price ? (
                <Text style={styles.strikePrice}>Rs. {item.originalPrice}</Text>
              ) : null}
            </View>

            {/* Add to Cart or Stepper Button */}
            <View style={styles.actionBtnRow}>
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
                    size={scale(12)}
                    color="#FFFFFF"
                    style={{ marginRight: scale(4) }}
                  />
                  <Text style={styles.addToCartBtnText}>Add to Cart</Text>
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
                    onPress={() => updateQuantity(item.productId, -1)}
                    style={styles.stepperActionBtn}
                  >
                    <Feather name="minus" size={scale(11)} color="#FFFFFF" />
                  </TouchableOpacity>

                  <Text style={styles.stepperCountText}>{qty}</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => updateQuantity(item.productId, 1)}
                    style={styles.stepperActionBtn}
                  >
                    <Feather name="plus" size={scale(11)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      getItemQuantity,
      primaryColor,
      router,
      handleRemoveItem,
      addToCart,
      updateQuantity,
    ]
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.navTitle}>My Wishlist</Text>
            {items.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </Text>
              </View>
            )}
          </View>

          {items.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleClearAll}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: scale(40) }} />
          )}
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* Body Content */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-dislike" size={scale(48)} color="#F43F5E" />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore our wide variety of groceries, snacks, and daily essentials,
            and tap the heart icon on any product to save it here!
          </Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/customerMain/home" as any)}
            style={[styles.exploreBtn, { backgroundColor: primaryColor }]}
          >
            <Feather
              name="compass"
              size={scale(16)}
              color="#FFFFFF"
              style={{ marginRight: scale(6) }}
            />
            <Text style={styles.exploreBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.productId)}
          numColumns={2}
          renderItem={renderWishlistItem}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={styles.listHeaderBox}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>
                  Saved Items ({items.length})
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddAllToCart}
                  style={styles.addAllBtn}
                >
                  <Feather
                    name="shopping-bag"
                    size={scale(12)}
                    color={primaryColor}
                    style={{ marginRight: scale(4) }}
                  />
                  <Text style={[styles.addAllBtnText, { color: primaryColor }]}>
                    Add All to Cart
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar />
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
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#FCE7F3",
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  countBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#DB2777",
  },
  clearBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  clearBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#EF4444",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(100),
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  listHeaderBox: {
    marginBottom: scale(10),
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeaderTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(8),
  },
  addAllBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: scale(125),
    backgroundColor: "#F8FAFC",
    position: "relative",
    borderTopLeftRadius: scale(14),
    borderTopRightRadius: scale(14),
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: scale(6),
    left: scale(6),
    backgroundColor: "#DC2626",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(8),
    zIndex: 5,
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(8.5),
    fontWeight: "800",
  },
  heartBtn: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 5,
  },
  cardBody: {
    padding: scale(8),
  },
  titleText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(2),
    minHeight: scale(28),
  },
  weightText: {
    fontSize: moderateScale(9.5),
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
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#0F172A",
  },
  vegTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
  },
  vegTagText: {
    fontSize: moderateScale(7.5),
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(2),
    marginBottom: scale(6),
  },
  currencySymbol: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#0F172A",
  },
  mainPrice: {
    fontSize: moderateScale(13.5),
    fontWeight: "900",
    color: "#0F172A",
  },
  strikePrice: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginLeft: scale(2),
  },
  actionBtnRow: {
    marginTop: scale(2),
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: scale(28),
    borderRadius: scale(7),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addToCartBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  quantityStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: scale(28),
    borderRadius: scale(7),
    paddingHorizontal: scale(3),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  stepperActionBtn: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(4),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCountText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(32),
    paddingBottom: scale(60),
  },
  emptyIconCircle: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(18),
  },
  emptyTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: scale(8),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(19),
    marginBottom: scale(24),
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
    paddingVertical: scale(13),
    borderRadius: scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
