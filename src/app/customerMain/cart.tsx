import {
  ActiveCartSection,
  BillDetailsSection,
  BottomCheckoutBar,
  PromoCardsSection,
  RecommendedProduct,
  SavedCartItem,
  SavedItemsSection,
  YouMightLikeSection,
} from "@/components/cart";
import { useCart } from "@/context/cart-context";
import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Available Payment Options
const PAYMENT_OPTIONS = [
  {
    id: "cod",
    name: "Cash on delivery",
    subtitle: "Pay with cash or QR at your doorstep",
    iconName: "cash-multiple",
    iconColor: "#16A34A",
    iconBg: "#DCFCE7",
  },
  {
    id: "esewa",
    name: "eSewa",
    subtitle: "Instant & secure digital wallet",
    iconName: "wallet-outline",
    iconColor: "#059669",
    iconBg: "#D1FAE5",
  },
  {
    id: "khalti",
    name: "Khalti",
    subtitle: "Pay seamlessly with Khalti",
    iconName: "wallet-outline",
    iconColor: "#7C3AED",
    iconBg: "#EDE9FE",
  },
  {
    id: "card",
    name: "Credit / Debit Card",
    subtitle: "Visa, MasterCard & Bank Cards",
    iconName: "credit-card-outline",
    iconColor: "#0284C7",
    iconBg: "#E0F2FE",
  },
];

// Initial data for Saved Items
const INITIAL_SAVED_ITEMS: SavedCartItem[] = [];

// Recommended items
const RECOMMENDED_PRODUCTS: RecommendedProduct[] = [
  {
    id: "rec-1",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    badge: "Bestseller",
    tags: ["280g", "Instant Food"],
    price: 120,
    originalPrice: 140,
    rating: 4.8,
    reviewsCount: 345,
    imageUrl:
      "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
  },
  {
    id: "rec-2",
    name: "Wai Wai Ready To Eat Chicken Masala",
    badge: "Hot Deal",
    tags: ["375g", "Noodles"],
    price: 100,
    originalPrice: 120,
    rating: 4.7,
    reviewsCount: 290,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  },
  {
    id: "rec-3",
    name: "Lay's Classic Salted Potato Chips",
    badge: "Trending",
    tags: ["115g", "Snacks"],
    price: 80,
    originalPrice: 90,
    rating: 4.9,
    reviewsCount: 512,
    imageUrl:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80",
  },
  {
    id: "rec-4",
    name: "Amul Pure Milk Ghee",
    badge: "Top Rated",
    tags: ["500ml", "Dairy"],
    price: 450,
    originalPrice: 490,
    rating: 4.9,
    reviewsCount: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=300&q=80",
  },
];

const GRADIENT_COLORS = ["#003844", "#004d5d", "#016073"] as const;

export default function CartScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCount,
    totalPrice: itemsTotal,
    totalOriginalPrice: originalTotal,
    totalSavings: savedOnItems,
  } = useCart();

  const { activeDisplayLocation, selectedAddress } = useAppSelector(
    (state) => state.address,
  );

  const [savedItems, setSavedItems] =
    useState<SavedCartItem[]>(INITIAL_SAVED_ITEMS);
  const [isGiftPackaging, setIsGiftPackaging] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(
    "FLAT50",
  );
  const [riderTip, setRiderTip] = useState(0);

  // Delivery Address from Redux & Payment state
  const deliveryAddress =
    activeDisplayLocation ||
    selectedAddress?.addressLine ||
    "Home • Kathmandu, Ward 4";
  const [paymentMethod, setPaymentMethod] = useState("Cash on delivery");

  // Coupon calculations
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || itemsTotal === 0) return 0;
    if (appliedCoupon === "FLAT50") return Math.min(50, itemsTotal);
    if (appliedCoupon === "WELCOME10") return Math.round(itemsTotal * 0.1);
    if (appliedCoupon === "FREESHIP") return 40;
    return 30;
  }, [appliedCoupon, itemsTotal]);

  // Overall calculations
  const handlingCharge = cartItems.length > 0 ? 30 : 0;
  const giftCharge = isGiftPackaging ? 50 : 0;
  const deliverySaving = 40; // Delivery is FREE (Worth Rs.40)

  const grandTotal = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return Math.max(
      0,
      itemsTotal + handlingCharge + giftCharge + riderTip - couponDiscount,
    );
  }, [
    itemsTotal,
    handlingCharge,
    giftCharge,
    riderTip,
    couponDiscount,
    cartItems.length,
  ]);

  const totalCalculatedSavings = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return savedOnItems + deliverySaving + couponDiscount;
  }, [savedOnItems, deliverySaving, couponDiscount, cartItems.length]);

  // Cart Handlers
  const handleIncrement = (id: string) => {
    updateQuantity(id, 1);
  };

  const handleDecrement = (id: string) => {
    updateQuantity(id, -1);
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
  };

  const handleSaveForLater = (item: any) => {
    removeFromCart(item.id);
    setSavedItems((prev) => [
      ...prev,
      {
        id: `saved-${Date.now()}-${item.id}`,
        name: item.name,
        packInfo: item.packInfo || item.weight || "Standard Pack",
        price: item.price,
        originalPrice: item.originalPrice || item.price + 30,
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80",
      },
    ]);
  };

  const handleAddToCartFromSaved = (item: SavedCartItem) => {
    setSavedItems((prev) => prev.filter((s) => s.id !== item.id));
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      imageUrl: item.imageUrl,
      weight: item.packInfo,
    });
  };

  const handleRemoveSavedItem = (item: SavedCartItem) => {
    setSavedItems((prev) => prev.filter((s) => s.id !== item.id));
  };

  const handleRemoveAllSaved = () => {
    setSavedItems([]);
  };

  const handleAddToCartFromRecommended = (prod: RecommendedProduct) => {
    addToCart({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      originalPrice: prod.originalPrice,
      imageUrl: prod.imageUrl,
      weight: prod.tags?.[0],
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm shopping on Antigravity E-Commerce! My cart has ${totalCount} items worth Rs.${grandTotal}. Check it out!`,
      });
    } catch (error) {
      console.log("Share error", error);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => clearCart(),
        },
      ],
    );
  };

  const handleApplyCoupon = (code: string) => {
    setAppliedCoupon(code);
    Alert.alert("Coupon Applied", `Coupon '${code}' applied successfully!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(undefined);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Top Header with Gradient Bar */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View>
                <Text style={styles.headerTitle}>Your Cart</Text>
                <Text style={styles.headerSubtitle}>
                  {totalCount} {totalCount === 1 ? "item" : "items"}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {cartItems.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClearCart}
                  style={styles.clearBtn}
                >
                  <Feather name="trash-2" size={scale(15)} color="#FCA5A5" />
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Screen Body */}
      <View style={styles.body}>
        {cartItems.length === 0 && savedItems.length === 0 ? (
          /* Empty Cart State */
          <View style={styles.emptyCartContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={scale(56)} color="#008080" />
            </View>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven't added anything to your cart yet. Explore
              thousands of items with fast delivery!
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/customerMain/home" as any)}
              style={styles.shopNowBtnWrapper}
            >
              <LinearGradient
                colors={GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shopNowBtn}
              >
                <Text style={styles.shopNowBtnText}>Start Shopping</Text>
                <Feather name="arrow-right" size={scale(16)} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Delivery Timeline / Address Bar */}
            <View style={styles.addressBar}>
              <View style={styles.addressBarLeft}>
                <View style={styles.lightningIconBox}>
                  <Ionicons name="flash" size={scale(14)} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliverySpeedText}>
                    Delivery in 10-15 mins
                  </Text>
                  <Text style={styles.deliveryLocationText} numberOfLines={1}>
                    {deliveryAddress}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/Screens/Profile/address" as any)}
              >
                <Text style={styles.changeAddressText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* 1. Active Cart Items */}
            {cartItems.length > 0 && (
              <ActiveCartSection
                items={cartItems}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemove={handleRemove}
                onSaveForLater={handleSaveForLater}
              />
            )}

            {/* 2. Your saved items */}
            {savedItems.length > 0 && (
              <SavedItemsSection
                items={savedItems}
                onRemoveAll={handleRemoveAllSaved}
                onAddToCart={handleAddToCartFromSaved}
                onRemoveItem={handleRemoveSavedItem}
              />
            )}

            {/* 3. Promo Cards (Gift Packaging + Coupons) */}
            <PromoCardsSection
              isGiftSelected={isGiftPackaging}
              onSelectGift={() => setIsGiftPackaging((prev) => !prev)}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              onSeeAllCoupons={() =>
                router.push("/Screens/Profile/collected-coupons" as any)
              }
            />

            {/* 4. You might also like (Recommendations) */}
            <YouMightLikeSection
              products={RECOMMENDED_PRODUCTS}
              onAddToCart={handleAddToCartFromRecommended}
              onSeeAllPress={() =>
                router.push("/Screens/Category/categoryExpand" as any)
              }
            />

            {/* 5. Payment Method Selection Section */}
            {cartItems.length > 0 && (
              <View style={styles.paymentSectionCard}>
                <View style={styles.paymentHeaderRow}>
                  <View style={styles.paymentHeaderLeft}>
                    <View style={styles.paymentHeaderIconBox}>
                      <MaterialCommunityIcons
                        name="credit-card-outline"
                        size={scale(18)}
                        color="#008080"
                      />
                    </View>
                    <View>
                      <Text style={styles.paymentSectionTitle}>
                        Payment Method
                      </Text>
                      <Text style={styles.paymentSectionSubtitle}>
                        Select your preferred payment option
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push("/Screens/Profile/paymentsetting" as any)
                    }
                  >
                    <Text style={styles.managePaymentText}>Manage</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.paymentOptionsList}>
                  {PAYMENT_OPTIONS.map((option) => {
                    const isSelected = paymentMethod === option.name;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        activeOpacity={0.75}
                        onPress={() => setPaymentMethod(option.name)}
                        style={[
                          styles.paymentOptionItem,
                          isSelected && styles.paymentOptionItemSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.paymentOptionIconBox,
                            { backgroundColor: option.iconBg },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={option.iconName as any}
                            size={scale(19)}
                            color={option.iconColor}
                          />
                        </View>

                        <View style={styles.paymentOptionInfo}>
                          <View style={styles.paymentOptionTitleRow}>
                            <Text
                              style={[
                                styles.paymentOptionTitle,
                                isSelected && styles.paymentOptionTitleSelected,
                              ]}
                            >
                              {option.name}
                            </Text>
                            {option.id === "cod" && (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>
                                  POPULAR
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.paymentOptionSub}>
                            {option.subtitle}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 6. Bill details */}
            {cartItems.length > 0 && (
              <BillDetailsSection
                itemsTotal={itemsTotal}
                originalTotal={originalTotal}
                savedOnItems={savedOnItems}
                deliveryCharge={0}
                isDeliveryFree={true}
                handlingCharge={handlingCharge}
                riderTip={riderTip}
                onSelectTip={setRiderTip}
                appliedCouponCode={appliedCoupon}
                couponDiscount={couponDiscount}
                totalSavings={totalCalculatedSavings}
                grandTotal={grandTotal}
                onApplyCouponPress={() =>
                  router.push("/Screens/Profile/collected-coupons" as any)
                }
              />
            )}
          </ScrollView>
        )}

        {/* Sticky Bottom Checkout Bar */}
        {cartItems.length > 0 && (
          <BottomCheckoutBar
            totalCount={totalCount}
            totalPrice={grandTotal}
            onCheckout={() => {
              router.push({
                pathname: "/Screens/Cart/checkout" as any,
                params: {
                  paymentMethod,
                  deliveryAddress,
                },
              });
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeAreaHeader: {
    backgroundColor: "transparent",
  },
  header: {
    height: moderateScale(54),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  backButton: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  clearBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#FCA5A5",
  },
  shareButton: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: scale(14),
    paddingBottom: moderateScale(130),
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addressBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
    marginRight: scale(8),
  },
  lightningIconBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#008080",
    alignItems: "center",
    justifyContent: "center",
  },
  deliverySpeedText: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  deliveryLocationText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  changeAddressText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(30),
  },
  emptyIconCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(18),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: scale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: moderateScale(19),
    marginBottom: moderateScale(22),
  },
  shopNowBtnWrapper: {
    borderRadius: scale(12),
    overflow: "hidden",
  },
  shopNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(24),
    paddingVertical: moderateScale(13),
    borderRadius: scale(12),
    gap: scale(8),
  },
  shopNowBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Payment Section Styles
  paymentSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  paymentHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  paymentHeaderIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  paymentSectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  paymentSectionSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  managePaymentText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  paymentOptionsList: {
    gap: scale(8),
  },
  paymentOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(10),
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  paymentOptionItemSelected: {
    backgroundColor: "#F0FDFA",
    borderColor: "#008080",
  },
  paymentOptionIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  paymentOptionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#334155",
  },
  paymentOptionTitleSelected: {
    color: "#0F172A",
    fontWeight: "800",
  },
  popularBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  popularBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.3,
  },
  paymentOptionSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  radioCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: scale(8),
  },
  radioCircleSelected: {
    borderColor: "#008080",
  },
  radioInner: {
    width: scale(9),
    height: scale(9),
    borderRadius: scale(4.5),
    backgroundColor: "#008080",
  },
});
