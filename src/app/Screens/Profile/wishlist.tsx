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
import React, { memo, useCallback, useEffect, useMemo } from "react";
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

interface WishlistItemCardProps {
  item: WishlistItem;
  quantity: number;
  primaryColor: string;
  isDark: boolean;
  onPress: (item: WishlistItem, imgUrl: string) => void;
  onRemove: (productId: string, name: string) => void;
  onAddToCart: (item: WishlistItem, imgUrl: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
}

const WishlistItemCard = memo(
  function WishlistItemCard({
    item,
    quantity,
    primaryColor,
    isDark,
    onPress,
    onRemove,
    onAddToCart,
    onUpdateQuantity,
  }: WishlistItemCardProps) {
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

    const imgUri =
      typeof imageSource === "object" && "uri" in imageSource
        ? (imageSource as any).uri
        : "";

    const handlePress = useCallback(() => {
      onPress(item, imgUri);
    }, [onPress, item, imgUri]);

    const handleAdd = useCallback(() => {
      onAddToCart(item, imgUri);
    }, [onAddToCart, item, imgUri]);

    const handleMinus = useCallback(() => {
      onUpdateQuantity(item.productId, -1);
    }, [onUpdateQuantity, item.productId]);

    const handlePlus = useCallback(() => {
      onUpdateQuantity(item.productId, 1);
    }, [onUpdateQuantity, item.productId]);

    const handleRemove = useCallback(() => {
      onRemove(item.productId, item.name);
    }, [onRemove, item.productId, item.name]);

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? "#151D24" : "#FFFFFF",
            borderColor: isDark ? "#303B45" : "#E2E8F0",
          },
        ]}
      >
        {/* Image Container */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: isDark ? "#1B252E" : "#F8FAFC" },
          ]}
        >
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
            onPress={handleRemove}
            style={[
              styles.heartBtn,
              { backgroundColor: isDark ? "#151D24" : "#FFFFFF" },
            ]}
          >
            <Ionicons name="heart" size={scale(15)} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.cardBody}>
          {/* Title */}
          <Text
            numberOfLines={2}
            style={[
              styles.titleText,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            {item.name}
          </Text>

          {/* Subtitle / Weight */}
          <Text
            numberOfLines={1}
            style={[
              styles.weightText,
              { color: isDark ? "#A8B2BE" : "#64748B" },
            ]}
          >
            {[item.subCategory || item.category, item.weight || "1 unit"]
              .filter(Boolean)
              .join(" • ")}
          </Text>

          {/* Rating and Veg status */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.ratingBox,
                {
                  backgroundColor: isDark ? "#1B252E" : "#F8FAFC",
                  borderColor: isDark ? "#303B45" : "#E2E8F0",
                },
              ]}
            >
              <FontAwesome
                name="star"
                size={scale(9.5)}
                color="#F59E0B"
                style={{ marginRight: scale(2) }}
              />
              <Text
                style={[
                  styles.ratingScore,
                  { color: isDark ? "#F8FAFC" : "#0F172A" },
                ]}
              >
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
            <Text
              style={[
                styles.currencySymbol,
                { color: isDark ? "#39D353" : "#0F172A" },
              ]}
            >
              Rs.{" "}
            </Text>
            <Text
              style={[
                styles.mainPrice,
                { color: isDark ? "#39D353" : "#0F172A" },
              ]}
            >
              {item.price}
            </Text>

            {item.originalPrice && item.originalPrice > item.price ? (
              <Text style={styles.strikePrice}>Rs. {item.originalPrice}</Text>
            ) : null}
          </View>

          {/* Add to Cart or Stepper Button */}
          <View style={styles.actionBtnRow}>
            {quantity === 0 ? (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleAdd}
                style={[
                  styles.addToCartBtn,
                  {
                    backgroundColor: isDark ? "#39D353" : primaryColor,
                    shadowColor: isDark ? "#39D353" : primaryColor,
                  },
                ]}
              >
                <Feather
                  name="shopping-cart"
                  size={scale(12)}
                  color={isDark ? "#080D0F" : "#FFFFFF"}
                  style={{ marginRight: scale(4) }}
                />
                <Text
                  style={[
                    styles.addToCartBtnText,
                    { color: isDark ? "#080D0F" : "#FFFFFF" },
                  ]}
                >
                  Add to Cart
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.quantityStepperRow,
                  {
                    backgroundColor: isDark ? "#39D353" : primaryColor,
                    shadowColor: isDark ? "#39D353" : primaryColor,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleMinus}
                  style={styles.stepperActionBtn}
                >
                  <Feather
                    name="minus"
                    size={scale(11)}
                    color={isDark ? "#080D0F" : "#FFFFFF"}
                  />
                </TouchableOpacity>

                <Text
                  style={[
                    styles.stepperCountText,
                    { color: isDark ? "#080D0F" : "#FFFFFF" },
                  ]}
                >
                  {quantity}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePlus}
                  style={styles.stepperActionBtn}
                >
                  <Feather
                    name="plus"
                    size={scale(11)}
                    color={isDark ? "#080D0F" : "#FFFFFF"}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.productId === nextProps.item.productId &&
      prevProps.quantity === nextProps.quantity &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.primaryColor === nextProps.primaryColor &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.onPress === nextProps.onPress &&
      prevProps.onRemove === nextProps.onRemove &&
      prevProps.onAddToCart === nextProps.onAddToCart &&
      prevProps.onUpdateQuantity === nextProps.onUpdateQuantity
    );
  }
);

export default function WishlistScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const primaryColor = theme.colors.primary || "#004D5D";
  const dispatch = useAppDispatch();

  const { items } = useAppSelector((state) => state.wishlist);
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  useEffect(() => {
    dispatch(loadWishlistFromStorage());
    dispatch(fetchWishlist());
  }, [dispatch]);

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
    (productId: string) => {
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

  const keyExtractor = useCallback(
    (item: WishlistItem) => String(item.productId),
    []
  );

  const handlePressWishlistProduct = useCallback(
    (item: WishlistItem, imgUrl: string) => {
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
          image: imgUrl,
        },
      });
    },
    [router]
  );

  const handleAddToCartWishlist = useCallback(
    (item: WishlistItem, imgUrl: string) => {
      addToCart({
        id: item.productId,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        imageUrl: imgUrl,
        weight: item.weight || "1 unit",
      });
    },
    [addToCart]
  );

  const handleUpdateQuantityWishlist = useCallback(
    (productId: string, delta: number) => {
      updateQuantity(productId, delta);
    },
    [updateQuantity]
  );

  const renderWishlistItem = useCallback(
    ({ item }: { item: WishlistItem }) => {
      const qty = getItemQuantity(item.productId);
      return (
        <WishlistItemCard
          item={item}
          quantity={qty}
          primaryColor={primaryColor}
          isDark={isDark}
          onPress={handlePressWishlistProduct}
          onRemove={handleRemoveItem}
          onAddToCart={handleAddToCartWishlist}
          onUpdateQuantity={handleUpdateQuantityWishlist}
        />
      );
    },
    [
      getItemQuantity,
      primaryColor,
      isDark,
      handlePressWishlistProduct,
      handleRemoveItem,
      handleAddToCartWishlist,
      handleUpdateQuantityWishlist,
    ]
  );

  const rootBg = isDark ? "#080D0F" : "#F8FAFC";
  const headerBg = isDark ? "#080D0F" : "#FFFFFF";
  const navTitleColor = isDark ? "#F8FAFC" : "#0F172A";
  const backBtnColor = isDark ? "#F8FAFC" : "#1E293B";
  const backBtnBg = isDark ? "#151D24" : "#F1F5F9";
  const dividerColor = isDark ? "#1E252E" : "#F1F5F9";

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <SafeAreaView
        edges={["top"]}
        style={[styles.safeAreaHeader, { backgroundColor: headerBg }]}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: backBtnBg }]}
          >
            <Feather name="arrow-left" size={scale(22)} color={backBtnColor} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.navTitle, { color: navTitleColor }]}>
              My Wishlist
            </Text>
            {items.length > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(219, 39, 119, 0.18)"
                      : "#FCE7F3",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: isDark ? "#F472B6" : "#DB2777" },
                  ]}
                >
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
              <Text
                style={[
                  styles.clearBtnText,
                  { color: isDark ? "#F87171" : "#EF4444" },
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: scale(40) }} />
          )}
        </View>
        <View
          style={[styles.headerDivider, { backgroundColor: dividerColor }]}
        />
      </SafeAreaView>

      {/* Body Content */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              {
                backgroundColor: isDark
                  ? "rgba(244, 63, 94, 0.16)"
                  : "#FFE4E6",
              },
            ]}
          >
            <Ionicons name="heart-dislike" size={scale(48)} color="#F43F5E" />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            Your Wishlist is Empty
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: isDark ? "#A8B2BE" : "#64748B" },
            ]}
          >
            Explore our wide variety of groceries, snacks, and daily essentials,
            and tap the heart icon on any product to save it here!
          </Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/customerMain/home" as any)}
            style={[
              styles.exploreBtn,
              { backgroundColor: isDark ? "#39D353" : primaryColor },
            ]}
          >
            <Feather
              name="compass"
              size={scale(16)}
              color={isDark ? "#080D0F" : "#FFFFFF"}
              style={{ marginRight: scale(6) }}
            />
            <Text
              style={[
                styles.exploreBtnText,
                { color: isDark ? "#080D0F" : "#FFFFFF" },
              ]}
            >
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          numColumns={2}
          renderItem={renderWishlistItem}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={styles.listHeaderBox}>
              <View style={styles.listHeaderRow}>
                <Text
                  style={[
                    styles.listHeaderTitle,
                    { color: isDark ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Saved Items ({items.length})
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddAllToCart}
                  style={[
                    styles.addAllBtn,
                    {
                      backgroundColor: isDark ? "#1E2E38" : "#E6F4F6",
                    },
                  ]}
                >
                  <Feather
                    name="shopping-bag"
                    size={scale(12)}
                    color={isDark ? "#39D353" : primaryColor}
                    style={{ marginRight: scale(4) }}
                  />
                  <Text
                    style={[
                      styles.addAllBtnText,
                      { color: isDark ? "#39D353" : primaryColor },
                    ]}
                  >
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
  },
  safeAreaHeader: {},
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
  },
  countBadge: {
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  countBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  clearBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  clearBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
  },
  headerDivider: {
    height: 1,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addAllBtn: {
    flexDirection: "row",
    alignItems: "center",
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
    borderRadius: scale(14),
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: scale(125),
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
    marginBottom: scale(2),
    minHeight: scale(28),
  },
  weightText: {
    fontSize: moderateScale(9.5),
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
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  ratingScore: {
    fontSize: moderateScale(10),
    fontWeight: "700",
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
  },
  mainPrice: {
    fontSize: moderateScale(13.5),
    fontWeight: "900",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(18),
  },
  emptyTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    marginBottom: scale(8),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
