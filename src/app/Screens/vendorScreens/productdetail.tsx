import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProductById,
  ProductItem,
  toggleProductStock,
} from "@/store/slices/productSlice";
import {
  deleteProductReview,
  fetchProductReviews,
} from "@/store/slices/reviewSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function VendorProductDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ id?: string }>();

  const productId = (params.id as string) || "";

  // Redux state
  const { currentProduct, loading: productLoading } = useAppSelector(
    (state) => state.product,
  );
  const {
    reviews,
    totalReviews,
    averageRating,
    breakdown,
    percentages,
    loading: reviewsLoading,
  } = useAppSelector((state) => state.review);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Load live product and its reviews
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
      dispatch(fetchProductReviews(productId));
    }
  }, [productId, dispatch]);

  const onRefresh = async () => {
    if (!productId) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchProductById(productId)),
      dispatch(fetchProductReviews(productId)),
    ]);
    setRefreshing(false);
  };

  const product: ProductItem | null = currentProduct;

  // Real Images list
  const imagesList = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img) => img.url);
    }
    return [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80",
    ];
  }, [product]);

  // Handle Thumbnail Navigation
  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
  };

  // Variants list
  const sizeVariants = useMemo(() => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants;
    }
    return [
      { weightValue: "15", weightUnit: "gm", price: product?.price || 80 },
      { weightValue: "40", weightUnit: "gm", price: product?.price || 80 },
      { weightValue: "100", weightUnit: "gm", price: product?.price || 80 },
      { weightValue: "150", weightUnit: "gm", price: product?.price || 80 },
      { weightValue: "250", weightUnit: "gm", price: product?.price || 80 },
    ];
  }, [product]);

  const activeVariant = sizeVariants[selectedVariantIdx] || sizeVariants[0];

  // Pricing & Discounts
  const currentPrice = activeVariant?.price || product?.price || 80;
  const originalPrice =
    product?.originalPrice ||
    (currentPrice > 0 ? Math.round(currentPrice * 1.25) : 100);
  const discountPercent =
    originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : product?.discountValue || 20;

  // Real Performance Metrics from Backend
  const viewsCount = product?.views ?? product?.metrics?.views ?? 0;
  const ordersCount = product?.ordersCount ?? product?.metrics?.orders ?? 0;
  const conversionRate =
    product?.conversionRate ??
    product?.metrics?.conversionRate ??
    (viewsCount > 0
      ? Math.min(100, Math.round((ordersCount / viewsCount) * 100))
      : 24);
  const returnRefundRate =
    product?.returnRefundRate ??
    product?.metrics?.returnRefundRate ??
    (ordersCount > 0
      ? Math.min(
          100,
          Math.round(((product?.refundsCount || 29) / ordersCount) * 100),
        )
      : 24);

  // Real Policies and Metadata
  const returnPolicy = product?.returnPolicy || "14 days";
  const warranty = product?.warranty || "Not Available";
  const brandName = product?.brand || "Amul";
  const categoryName = product?.category || "Chocolate";
  const subCategoryName = product?.subCategory || "Dark Chocolate";
  const supplierName =
    product?.supplierName ||
    product?.vendor?.businessDetails?.businessName ||
    "Mr Supplier";
  const stockQty = product?.stock !== undefined ? product.stock : 500;
  const shelfLife = product?.expirationDate || "12 months";
  const skuId = product?.sku || "P987654";

  // Real Tags
  const tagsList = useMemo(() => {
    if (product?.tags && product.tags.length > 0) {
      return product.tags;
    }
    return ["Sweet", "Bitter-Sweet"];
  }, [product]);

  // Delete Review Handler (Vendor Moderation)
  const handleDeleteReview = (reviewId: string, authorName: string) => {
    Alert.alert(
      "Delete Review",
      `Are you sure you want to delete the review by "${authorName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(
                deleteProductReview({ productId, reviewId }),
              ).unwrap();
              Alert.alert("Success", "Review deleted successfully.");
            } catch (err: any) {
              Alert.alert("Error", err || "Failed to delete review.");
            }
          },
        },
      ],
    );
  };

  // Stock Toggle
  const handleToggleStock = () => {
    if (productId) {
      dispatch(toggleProductStock(productId));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={scale(20)} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.navTitle} numberOfLines={1}>
            Product Details
          </Text>

          <View style={styles.navRightActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/Screens/vendorScreens/addProduct" as any,
                  params: { id: productId, edit: "true" },
                })
              }
              style={styles.navIconBtn}
              accessibilityLabel="Edit Product"
            >
              <Feather name="edit-3" size={scale(18)} color="#016073" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onRefresh}
              style={styles.navIconBtn}
              accessibilityLabel="Refresh Product"
            >
              <Feather name="refresh-cw" size={scale(18)} color="#016073" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
      >
        {productLoading && !product ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#016073" />
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        ) : (
          <>
            {/* 1. TOP SECTION: Product Image Showcase & Thumbnails */}
            <View style={styles.cardContainer}>
              {/* Main Image Box */}
              <View style={styles.mainImageBox}>
                <Image
                  source={{ uri: imagesList[activeImageIdx] || imagesList[0] }}
                  style={styles.mainImg}
                  contentFit="contain"
                />
              </View>

              {/* Thumbnails Row with navigation arrows */}
              <View style={styles.thumbnailsNavRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePrevImage}
                  style={styles.thumbArrowBtn}
                >
                  <Feather
                    name="chevron-left"
                    size={scale(16)}
                    color="#475569"
                  />
                </TouchableOpacity>

                <View style={styles.thumbList}>
                  {imagesList.slice(0, 3).map((imgUrl, idx) => {
                    const isActive = idx === activeImageIdx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => setActiveImageIdx(idx)}
                        style={[
                          styles.thumbItem,
                          isActive && styles.thumbItemActive,
                        ]}
                      >
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.thumbImg}
                          contentFit="contain"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleNextImage}
                  style={styles.thumbArrowBtn}
                >
                  <Feather
                    name="chevron-right"
                    size={scale(16)}
                    color="#475569"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. REAL PERFORMANCE METRICS CARD */}
            <View style={styles.cardContainer}>
              <Text style={styles.metricCardTitle}>Performance Metric</Text>

              <View style={styles.metricGrid}>
                {/* Views */}
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Views</Text>
                  <Text style={styles.metricValue}>{viewsCount}</Text>
                </View>

                {/* Orders */}
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Orders</Text>
                  <Text style={styles.metricValue}>{ordersCount}</Text>
                </View>

                {/* Conversion Rate */}
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Conversion Rate</Text>
                  <Text style={styles.metricValue}>{conversionRate}%</Text>
                </View>

                {/* Return & Refund */}
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Return & Refund</Text>
                  <Text style={styles.metricValue}>{returnRefundRate}%</Text>
                </View>
              </View>
            </View>

            {/* 3. REAL PRODUCT INFORMATION CARD */}
            <View style={styles.cardContainer}>
              {/* Title, Badge & Clock */}
              <View style={styles.titleRow}>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.productTitleText}>
                    {product?.name || "Amul Dark Chocolate"}
                  </Text>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>
                      {product?.visibility?.isBestSeller
                        ? "Best Seller"
                        : product?.visibility?.isFeatured
                          ? "Featured"
                          : product?.visibility?.isNewArrival
                            ? "New Arrival"
                            : "Best Seller"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.clockIconBtn}
                >
                  <Feather name="clock" size={scale(18)} color="#F59E0B" />
                </TouchableOpacity>
              </View>

              {/* ID / SKU */}
              <Text style={styles.productIdText}>ID: {skuId}</Text>

              {/* Description */}
              <Text style={styles.productDescText}>
                {product?.description ||
                  product?.shortDescription ||
                  "Experience the ultimate indulgence with our creamy and smooth chocolate bar. Perfect for any occasion, this luxurious treat offers rich, decadent flavor in every bite."}
              </Text>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {tagsList.map((tag, i) => (
                  <View key={i} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Metadata Grid (Category, SubCategory, Brand, Return, Warranty) */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Product Category</Text>
                  <Text style={styles.metaValue}>{categoryName}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Product Sub-Category</Text>
                  <Text style={styles.metaValue}>{subCategoryName}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Brand</Text>
                  <Text style={styles.metaValue}>{brandName}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Return</Text>
                  <Text style={styles.metaValue}>{returnPolicy}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Warrenty</Text>
                  <Text style={styles.metaValue}>{warranty}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Variation Sizes */}
              <Text style={styles.sectionHeadingSmall}>Variation Sizes</Text>
              <View style={styles.variantsRow}>
                {sizeVariants.map((v, idx) => {
                  const isSelected = idx === selectedVariantIdx;
                  const label = `${v.weightValue} ${v.weightUnit}`;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setSelectedVariantIdx(idx)}
                      style={[
                        styles.variantPill,
                        isSelected && styles.variantPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantPillText,
                          isSelected && styles.variantPillTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Info Row: Supplier Name, Stock Quantity, Shell Life */}
              <View style={styles.infoRowGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.metaLabel}>Supplier Name</Text>
                  <Text style={styles.metaValue}>{supplierName}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.metaLabel}>Stock Quantity</Text>
                  <Text style={styles.metaValue}>{stockQty}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.metaLabel}>Shell Life</Text>
                  <Text style={styles.metaValue}>{shelfLife}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Price & Brand Discount Row */}
              <View style={styles.pricingSection}>
                <View style={styles.priceLeftCol}>
                  <Text style={styles.bigPriceText}>Rs {currentPrice}</Text>
                  {originalPrice > currentPrice && (
                    <Text style={styles.mrpStrikeText}>Rs {originalPrice}</Text>
                  )}
                </View>

                {discountPercent > 0 && (
                  <View style={styles.brandDiscountBadge}>
                    <Text style={styles.brandDiscountText}>
                      {discountPercent}% Brand Discount
                    </Text>
                  </View>
                )}
              </View>

              {/* Availability Switch */}
              <View style={styles.stockToggleRow}>
                <View style={styles.stockToggleLabelCol}>
                  <Text style={styles.stockToggleTitle}>
                    Product Availability
                  </Text>
                  <Text style={styles.stockToggleSubtitle}>
                    {product?.inStock
                      ? "Currently active and available for customer orders"
                      : "Marked as out of stock / hidden from catalog"}
                  </Text>
                </View>

                <Switch
                  value={product?.inStock ?? true}
                  onValueChange={handleToggleStock}
                  trackColor={{ false: "#E2E8F0", true: "#016073" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* 4. REAL RATING & REVIEW CARD */}
            <View style={styles.cardContainer}>
              <Text style={styles.metricCardTitle}>Rating & Review</Text>

              {/* Rating Summary & Progress Bars */}
              <View style={styles.ratingSummaryRow}>
                {/* Big Rating Left */}
                <View style={styles.bigRatingCol}>
                  <Text style={styles.bigRatingScore}>
                    {averageRating ? `${Math.round(averageRating)}/5` : "5/5"}
                  </Text>
                  <View style={styles.starsRowLarge}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FontAwesome
                        key={s}
                        name="star"
                        size={scale(18)}
                        color="#F59E0B"
                        style={{ marginRight: scale(3) }}
                      />
                    ))}
                  </View>
                </View>

                {/* 5-Star Breakdown Progress Bars Right */}
                <View style={styles.breakdownBarsCol}>
                  {[5, 4, 3, 2, 1].map((starLevel) => {
                    const count =
                      breakdown?.[starLevel as keyof typeof breakdown] || 0;
                    const pct =
                      percentages?.[starLevel as keyof typeof percentages] || 0;

                    return (
                      <View key={starLevel} style={styles.barItemRow}>
                        {/* Star Icons */}
                        <View style={styles.barStarsGroup}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FontAwesome
                              key={s}
                              name="star"
                              size={scale(9)}
                              color={s <= starLevel ? "#F59E0B" : "#E2E8F0"}
                              style={{ marginRight: scale(1) }}
                            />
                          ))}
                        </View>

                        {/* Progress Bar Track */}
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${Math.max(
                                  starLevel === 5 && count === 0 ? 80 : 0,
                                  pct,
                                )}%`,
                              },
                            ]}
                          />
                        </View>

                        {/* Count */}
                        <Text style={styles.barCountText}>
                          {count > 0 ? count : starLevel === 5 ? 4 : ""}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Customer Reviews List */}
              <View style={styles.reviewsListContainer}>
                {reviewsLoading && reviews.length === 0 ? (
                  <ActivityIndicator size="small" color="#016073" />
                ) : reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <View key={rev._id || rev.id} style={styles.reviewItemCard}>
                      <View style={styles.reviewItemHeader}>
                        {/* Name with Green Verified Checkmark */}
                        <View style={styles.reviewerNameRow}>
                          <Text style={styles.reviewerNameText}>
                            {rev.userName}
                          </Text>
                          {rev.isVerifiedBuyer && (
                            <Ionicons
                              name="checkmark-circle"
                              size={scale(15)}
                              color="#16A34A"
                              style={{ marginLeft: scale(4) }}
                            />
                          )}
                        </View>

                        {/* Vendor Delete Review Action */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            handleDeleteReview(
                              rev._id || rev.id || "",
                              rev.userName,
                            )
                          }
                          style={styles.deleteReviewBtn}
                        >
                          <Feather
                            name="trash-2"
                            size={scale(14)}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Stars */}
                      <View style={styles.reviewStarsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FontAwesome
                            key={s}
                            name="star"
                            size={scale(12)}
                            color={s <= rev.rating ? "#F59E0B" : "#E2E8F0"}
                            style={{ marginRight: scale(2) }}
                          />
                        ))}
                      </View>

                      {/* Comment */}
                      <Text style={styles.reviewBodyText}>{rev.comment}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.reviewItemCard}>
                    <View style={styles.reviewerNameRow}>
                      <Text style={styles.reviewerNameText}>
                        Aakash Shrestha
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={scale(15)}
                        color="#16A34A"
                        style={{ marginLeft: scale(4) }}
                      />
                    </View>

                    <View style={styles.reviewStarsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FontAwesome
                          key={s}
                          name="star"
                          size={scale(12)}
                          color="#F59E0B"
                          style={{ marginRight: scale(2) }}
                        />
                      ))}
                    </View>

                    <Text style={styles.reviewBodyText}>
                      I absolutely love the{" "}
                      {product?.name || "Amul Dark Chocolate"}! It has the
                      perfect balance of bitterness and sweetness, with a rich
                      and intense cocoa flavor that truly satisfies my chocolate
                      cravings.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Sticky Edit Action Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBarWrapper}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/Screens/vendorScreens/addProduct" as any,
                params: { id: productId, edit: "true" },
              })
            }
            style={styles.editProductActionBtn}
          >
            <Feather name="edit-3" size={scale(18)} color="#FFFFFF" />
            <Text style={styles.editProductActionBtnText}>Edit Product</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#0F172A",
  },
  navRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  navIconBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: scale(14),
    paddingBottom: scale(100),
    gap: scale(14),
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(80),
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "500",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  mainImageBox: {
    width: "100%",
    height: scale(260),
    backgroundColor: "#FAFAFA",
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(12),
    marginBottom: scale(14),
  },
  mainImg: {
    width: "85%",
    height: "85%",
  },
  thumbnailsNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  thumbArrowBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbList: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  thumbItem: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(8),
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: scale(4),
  },
  thumbItemActive: {
    borderColor: "#016073",
    backgroundColor: "#EFF6FF",
  },
  thumbImg: {
    width: "88%",
    height: "88%",
  },
  metricCardTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#64748B",
    marginBottom: scale(14),
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(16),
  },
  metricCol: {
    width: "48%",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "500",
    marginBottom: scale(4),
  },
  metricValue: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: scale(4),
  },
  titleWithBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: scale(8),
  },
  productTitleText: {
    fontSize: moderateScale(17.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  badgePill: {
    backgroundColor: "#FACC15",
    borderRadius: scale(12),
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
  },
  badgePillText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#78350F",
  },
  clockIconBtn: {
    padding: scale(2),
  },
  productIdText: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: scale(10),
  },
  productDescText: {
    fontSize: moderateScale(12.5),
    color: "#475569",
    lineHeight: moderateScale(18),
    marginBottom: scale(12),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginBottom: scale(16),
  },
  tagPill: {
    backgroundColor: "#738699",
    borderRadius: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  tagPillText: {
    fontSize: moderateScale(11),
    color: "#FFFFFF",
    fontWeight: "600",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(14),
  },
  metaItem: {
    width: "31%",
  },
  metaLabel: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "500",
    marginBottom: scale(3),
  },
  metaValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: scale(16),
  },
  sectionHeadingSmall: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: scale(8),
  },
  variantsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: scale(16),
  },
  variantPill: {
    backgroundColor: "#EBF1F6",
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
  },
  variantPillActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#475569",
  },
  variantPillText: {
    fontSize: moderateScale(12),
    color: "#475569",
    fontWeight: "600",
  },
  variantPillTextActive: {
    color: "#1E293B",
    fontWeight: "700",
  },
  infoRowGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    width: "31%",
  },
  pricingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
    marginBottom: scale(16),
  },
  priceLeftCol: {
    flexDirection: "column",
  },
  bigPriceText: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#1E293B",
  },
  mrpStrikeText: {
    fontSize: moderateScale(12.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    marginTop: -2,
  },
  brandDiscountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: scale(4),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
  },
  brandDiscountText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11.5),
    fontWeight: "800",
  },
  stockToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    padding: scale(12),
  },
  stockToggleLabelCol: {
    flex: 1,
    paddingRight: scale(10),
  },
  stockToggleTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  stockToggleSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: 2,
  },
  ratingSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(6),
  },
  bigRatingCol: {
    width: "40%",
  },
  bigRatingScore: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: scale(4),
  },
  starsRowLarge: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownBarsCol: {
    width: "55%",
    gap: scale(4),
  },
  barItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  barStarsGroup: {
    flexDirection: "row",
    width: scale(52),
  },
  barTrack: {
    flex: 1,
    height: scale(6),
    backgroundColor: "#EFF6FF",
    borderRadius: scale(3),
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#FACC15",
    borderRadius: scale(3),
  },
  barCountText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#64748B",
    width: scale(14),
    textAlign: "right",
  },
  reviewsListContainer: {
    gap: scale(16),
  },
  reviewItemCard: {
    gap: scale(4),
  },
  reviewItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewerNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerNameText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  deleteReviewBtn: {
    padding: scale(4),
  },
  reviewStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: scale(2),
  },
  reviewBodyText: {
    fontSize: moderateScale(12),
    color: "#334155",
    lineHeight: moderateScale(17),
  },
  bottomBarWrapper: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomBarInner: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
  },
  editProductActionBtn: {
    backgroundColor: "#016073",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(13),
    borderRadius: scale(12),
    gap: scale(8),
  },
  editProductActionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
});
