import { FloatingCartBar } from "@/components/cart";
import { SellerDetailsModal, SellerInfo } from "@/components/product";
import { useCart } from "@/context/cart-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProductById,
  fetchRelatedProducts,
  ProductItem,
} from "@/store/slices/productSlice";
import { recordProductViewApi } from "@/store/services/productService";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    weight?: string;
    price?: string;
    originalPrice?: string;
    rating?: string;
    image?: string;
    description?: string;
    brand?: string;
    category?: string;
    subCategory?: string;
  }>();

  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isSellerModalVisible, setIsSellerModalVisible] = useState(false);

  // Redux state
  const { currentProduct, relatedProducts, loading } = useAppSelector(
    (state) => state.product
  );

  // 1. Fetch live product data on mount & record view
  useEffect(() => {
    if (params.id) {
      dispatch(fetchProductById(params.id));
      recordProductViewApi(params.id).catch(() => {});
    }
  }, [params.id, dispatch]);

  // 2. Fetch related products for Similar Products / People Also Bought
  useEffect(() => {
    const cat = currentProduct?.category || params.category;
    const subCat = currentProduct?.subCategory || params.subCategory;
    if (cat || subCat) {
      dispatch(
        fetchRelatedProducts({
          category: cat,
          subCategory: subCat,
          limit: 8,
        })
      );
    }
  }, [currentProduct?.category, currentProduct?.subCategory, params.category, params.subCategory, dispatch]);

  // 3. Merge Live Data with Params Fallback
  const product = currentProduct && (currentProduct._id === params.id || currentProduct.id === params.id)
    ? currentProduct
    : null;

  const productId = (product?._id || product?.id || params.id || "prod-detail") as string;
  const productName = product?.name || (params.name as string) || "Fresh Grocery Item";
  const productWeight = product?.unit || (params.weight as string) || "1 pc";
  const productPrice = product ? product.price : params.price ? Number(params.price) : 250;
  const productOriginalPrice = product
    ? product.originalPrice || product.price
    : params.originalPrice
    ? Number(params.originalPrice)
    : productPrice;
  const productBrand = product?.brand || (params.brand as string) || "Bhansa Mart";
  const productCategory = product?.category || (params.category as string) || "Grocery & Kitchen";
  const productSubCategory = product?.subCategory || (params.subCategory as string) || "General";
  const productDescription =
    product?.description ||
    product?.shortDescription ||
    (params.description as string) ||
    "Premium quality product sourced and packaged with optimal care for maximum freshness.";
  const inStock = product ? product.inStock : true;
  const ratingAvg = product?.ratingsAverage || (params.rating ? Number(params.rating) : 4.6);
  const ratingReviewsCount = product?.ratingsCount || 42;

  // 4. Hero Carousel Images List
  const heroImages = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img) => img.url);
    }
    if (params.image) {
      return [params.image as string];
    }
    return [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80",
    ];
  }, [product?.images, params.image]);

  // 5. Discount Percentage
  const discountPercent =
    productOriginalPrice > productPrice
      ? Math.round(
          ((productOriginalPrice - productPrice) / productOriginalPrice) * 100
        )
      : 0;

  // 6. Cart Quantity
  const qtyInCart = getItemQuantity(productId);

  // 7. Seller Info for Modal
  const sellerInfo: SellerInfo = useMemo(() => {
    const vendor = product?.vendor;
    const bizName =
      vendor?.businessDetails?.businessName ||
      vendor?.sellerDetails?.sellerName ||
      product?.supplierName ||
      "Annapurna Daily Essentials Ltd.";
    const city =
      vendor?.businessDetails?.city ||
      vendor?.sellerDetails?.city ||
      "Kathmandu";
    const address =
      vendor?.businessDetails?.registeredAddress || `${city}, Nepal`;

    return {
      name: bizName,
      distance: "1.2 km",
      deliveryTime: "25–30 mins",
      experience: "Verified Seller on BhansaMart",
      rating: ratingAvg,
      ratingCount: `${ratingReviewsCount * 6}+ ratings`,
      stat1Value: "99.4%",
      stat1Label: "Fulfillment",
      stat2Value: `${ratingAvg.toFixed(1)}`,
      stat2Label: "Store Rating",
      stat3Value: "100%",
      stat3Label: "Genuine",
      aboutText: `${bizName} is an authorized top-rated vendor on BhansaMart, committed to high quality sourcing, hygienic packaging, and superfast local delivery.`,
      locationText: address,
      catalogText: `${productCategory} • ${productSubCategory} and everyday groceries`,
    };
  }, [product, productCategory, productSubCategory, ratingAvg, ratingReviewsCount]);

  // 8. Similar Products from Related Catalog
  const similarProducts = useMemo(() => {
    const filtered = relatedProducts.filter(
      (p) => (p._id || p.id) !== productId
    );
    return filtered.slice(0, 6);
  }, [relatedProducts, productId]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${productName} on Bhansa Mart! Price: Rs.${productPrice}`,
      });
    } catch (e) {
      console.log("Share error", e);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      id: productId,
      name: productName,
      price: productPrice,
      originalPrice: productOriginalPrice,
      imageUrl: heroImages[0] || "",
      weight: productWeight,
    });
  };

  const handleProductCardPress = (prod: ProductItem) => {
    const pId = prod._id || prod.id || "";
    const pImg = prod.images && prod.images.length > 0 ? prod.images[0].url : "";
    router.push({
      pathname: "/Screens/Product/productdetailscreen" as any,
      params: {
        id: pId,
        name: prod.name,
        price: String(prod.price),
        originalPrice: String(prod.originalPrice || prod.price),
        rating: String((prod.ratingsAverage || 4.5).toFixed(1)),
        image: pImg,
        weight: prod.unit || "1 pc",
        description: prod.description || "",
        brand: prod.brand || "",
        category: prod.category || "",
        subCategory: prod.subCategory || "",
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Floating Action Bar */}
      <SafeAreaView edges={["top"]} style={styles.topBarContainer}>
        <View style={styles.floatingNavRow}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={styles.iconCircleBtn}
          >
            <Feather name="chevron-down" size={scale(24)} color="#1E293B" />
          </TouchableOpacity>

          {/* Share Button */}
          <View style={styles.rightNavBtns}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShare}
              style={styles.iconCircleBtn}
            >
              <Ionicons
                name="share-social-outline"
                size={scale(19)}
                color="#1E293B"
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Scrollable Product Details Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Hero Product Image Showcase (Paging Carousel) */}
        <View style={styles.heroImageCard}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(page);
            }}
            style={styles.carouselScrollView}
          >
            {heroImages.map((imgUrl, idx) => (
              <View key={idx} style={styles.carouselSlide}>
                <Image
                  source={{ uri: imgUrl }}
                  style={styles.heroImage}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Out of Stock Banner */}
          {!inStock && (
            <View style={styles.outOfStockHeroBadge}>
              <Text style={styles.outOfStockHeroText}>CURRENTLY OUT OF STOCK</Text>
            </View>
          )}

          {/* Pagination dots on bottom right */}
          {heroImages.length > 1 && (
            <View style={styles.paginationRow}>
              {heroImages.map((_, dotIdx) => (
                <View
                  key={dotIdx}
                  style={[
                    styles.dot,
                    activeImageIndex === dotIdx
                      ? styles.dotActive
                      : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* 2. Product Name, Unit & Price Banner */}
        <View style={styles.productInfoSection}>
          <Text style={styles.productTitle}>{productName}</Text>
          <Text style={styles.productWeight}>{productWeight}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>Rs. {productPrice}</Text>
            {productOriginalPrice > productPrice && (
              <Text style={styles.mrpPrice}>MRP Rs. {productOriginalPrice}</Text>
            )}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Store / Seller Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sellerCard}
          onPress={() => setIsSellerModalVisible(true)}
        >
          <View style={styles.sellerLeft}>
            <View style={styles.sellerAvatar}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(20)}
                color="#016073"
              />
            </View>
            <View style={styles.sellerTextGroup}>
              <Text style={styles.sellerName}>{sellerInfo.name}</Text>
              <View style={styles.sellerSubRow}>
                <Text style={styles.sellerLocation}>{sellerInfo.locationText}</Text>
                <Text style={styles.sellerDot}>•</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{ratingAvg.toFixed(1)}</Text>
                  <Ionicons name="star" size={scale(11)} color="#F59E0B" />
                </View>
              </View>
            </View>
          </View>
          <Feather name="chevron-right" size={scale(18)} color="#64748B" />
        </TouchableOpacity>

        {/* 4. Expandable View Product Details */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsDetailsExpanded((prev) => !prev)}
            style={styles.accordionHeader}
          >
            <Text style={styles.accordionTitle}>View product details</Text>
            <Feather
              name={isDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={scale(18)}
              color="#1E293B"
            />
          </TouchableOpacity>

          {isDetailsExpanded && (
            <View style={styles.accordionBody}>
              <Text style={styles.detailsBodyText}>{productDescription}</Text>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailKey}>Category:</Text>
                <Text style={styles.detailVal}>{productCategory}</Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailKey}>Sub-Category:</Text>
                <Text style={styles.detailVal}>{productSubCategory}</Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailKey}>Brand:</Text>
                <Text style={styles.detailVal}>{productBrand}</Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailKey}>Unit / Size:</Text>
                <Text style={styles.detailVal}>{productWeight}</Text>
              </View>
              {product?.sku && (
                <View style={styles.detailItemRow}>
                  <Text style={styles.detailKey}>SKU:</Text>
                  <Text style={styles.detailVal}>{product.sku}</Text>
                </View>
              )}
              <View style={styles.detailItemRow}>
                <Text style={styles.detailKey}>Stock Status:</Text>
                <Text
                  style={[
                    styles.detailVal,
                    { color: inStock ? "#16A34A" : "#DC2626" },
                  ]}
                >
                  {inStock ? "In Stock" : "Out of Stock"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 5. Brand Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.brandCard}
          onPress={() => {}}
        >
          <View style={styles.brandLeft}>
            <View style={styles.brandLogoBox}>
              <Text style={styles.brandLogoText}>
                {productBrand.substring(0, 3).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>{productBrand}</Text>
              <Text style={styles.brandSubtitle}>
                Explore {productBrand} in {productCategory}
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={scale(18)} color="#64748B" />
        </TouchableOpacity>

        {/* 6. Ratings & Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsHeading}>
              Ratings & Reviews ({ratingReviewsCount})
            </Text>
            <View style={styles.ratingSummaryBtn}>
              <Text style={styles.avgRatingText}>{ratingAvg.toFixed(1)}</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name="star"
                    size={scale(12)}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Sample Verified Reviews */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewContentCol}>
              <Text style={styles.reviewQuoteText} numberOfLines={3}>
                Very fresh quality, timely delivery within 30 minutes. Exactly as described in the catalog!
              </Text>
              <View style={styles.reviewUserRow}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={scale(10)}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={styles.reviewerName}>Ramesh S. • Verified Buyer</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Similar Products in Category */}
        {similarProducts.length > 0 && (
          <View style={styles.gridSection}>
            <Text style={styles.gridSectionTitle}>
              Similar Products in {productCategory}
            </Text>
            <View style={styles.productsGrid}>
              {similarProducts.map((item) => {
                const sId = item._id || item.id || "";
                const sQty = getItemQuantity(sId);
                const sImg =
                  item.images && item.images.length > 0
                    ? item.images[0].url
                    : "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80";

                return (
                  <TouchableOpacity
                    key={sId}
                    activeOpacity={0.88}
                    onPress={() => handleProductCardPress(item)}
                    style={styles.productCard}
                  >
                    <View style={styles.gridImageBox}>
                      <Image
                        source={{ uri: sImg }}
                        style={styles.gridProductImg}
                        contentFit="contain"
                      />
                      {sQty === 0 ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() =>
                            addToCart({
                              id: sId,
                              name: item.name,
                              price: item.price,
                              originalPrice: item.originalPrice || item.price,
                              imageUrl: sImg,
                              weight: item.unit || "1 pc",
                            })
                          }
                          style={styles.gridAddBtn}
                        >
                          <Text style={styles.gridAddText}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.gridCounterBox}>
                          <TouchableOpacity
                            onPress={() => updateQuantity(sId, -1)}
                            style={styles.gridCounterBtn}
                          >
                            <Feather name="minus" size={scale(9)} color="#016073" />
                          </TouchableOpacity>
                          <Text style={styles.gridCounterQty}>{sQty}</Text>
                          <TouchableOpacity
                            onPress={() => updateQuantity(sId, 1)}
                            style={styles.gridCounterBtn}
                          >
                            <Feather name="plus" size={scale(9)} color="#016073" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <Text style={styles.gridUnitText}>{item.unit || "1 pc"}</Text>

                    <Text style={styles.gridTitle} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <View style={styles.gridStarRow}>
                      <Ionicons name="star" size={scale(9)} color="#F59E0B" />
                      <Text style={styles.gridRatingText}>
                        {(item.ratingsAverage || 4.5).toFixed(1)}
                      </Text>
                      <Text style={styles.gridReviewsCount}>
                        ({item.ratingsCount || 10})
                      </Text>
                    </View>

                    <View style={styles.gridPriceRow}>
                      <Text style={styles.gridPrice}>Rs. {item.price}</Text>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <Text style={styles.gridOrigPrice}>
                          Rs. {item.originalPrice}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Cart Bar (appears when items are in cart) */}
      <FloatingCartBar
        bottomOffset={Math.max(insets.bottom, scale(12)) + scale(76)}
      />

      {/* 8. Sticky Bottom Purchase Bar */}
      <View
        style={[
          styles.bottomPurchaseBar,
          {
            paddingBottom: Math.max(insets.bottom, scale(12)),
          },
        ]}
      >
        {/* Left Price & Unit Box */}
        <View style={styles.bottomPriceBox}>
          <View style={styles.bottomUnitRow}>
            <Text style={styles.bottomUnitText}>{productWeight}</Text>
            {discountPercent > 0 && (
              <View style={styles.bottomDiscountPill}>
                <Text style={styles.bottomDiscountPillText}>
                  {discountPercent}% OFF
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPriceRow}>
            <Text style={styles.bottomPriceBold}>Rs. {productPrice}</Text>
            {productOriginalPrice > productPrice && (
              <Text style={styles.bottomMrpText}>
                MRP Rs. {productOriginalPrice}
              </Text>
            )}
          </View>
          <Text style={styles.bottomTaxText}>Inclusive of all taxes</Text>
        </View>

        {/* Right Add to Cart / Counter CTA */}
        {!inStock ? (
          <View style={styles.outOfStockBtn}>
            <Text style={styles.outOfStockBtnText}>Out of Stock</Text>
          </View>
        ) : qtyInCart === 0 ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleAddToCart}
            style={styles.bottomAddToCartBtn}
          >
            <Text style={styles.bottomAddToCartText}>Add to cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomCounterContainer}>
            <TouchableOpacity
              onPress={() => updateQuantity(productId, -1)}
              style={styles.bottomCounterBtn}
            >
              <Feather name="minus" size={scale(16)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.bottomCounterQtyText}>{qtyInCart}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(productId, 1)}
              style={styles.bottomCounterBtn}
            >
              <Feather name="plus" size={scale(16)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Seller Details Bottom Sheet Modal */}
      <SellerDetailsModal
        visible={isSellerModalVisible}
        seller={sellerInfo}
        onClose={() => setIsSellerModalVisible(false)}
        onSeeOtherSellers={() => {
          setIsSellerModalVisible(false);
          router.push({
            pathname: "/Screens/Category/categoryExpand" as any,
            params: { category: productCategory },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  floatingNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(8),
  },
  iconCircleBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  rightNavBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: moderateScale(160),
  },
  heroImageCard: {
    width: "100%",
    height: scale(290),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingTop: moderateScale(40),
  },
  carouselScrollView: {
    width: "100%",
    height: "100%",
  },
  carouselSlide: {
    width,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "82%",
    height: "82%",
  },
  outOfStockHeroBadge: {
    position: "absolute",
    top: scale(50),
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  outOfStockHeroText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  paginationRow: {
    position: "absolute",
    bottom: moderateScale(14),
    right: scale(20),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  dotActive: {
    backgroundColor: "#016073",
    width: scale(10),
  },
  dotInactive: {
    backgroundColor: "#CBD5E1",
  },
  productInfoSection: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(14),
    backgroundColor: "#FFFFFF",
  },
  productTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(4),
  },
  productWeight: {
    fontSize: moderateScale(13),
    color: "#64748B",
    marginBottom: moderateScale(10),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  currentPrice: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#0F172A",
  },
  mrpPrice: {
    fontSize: moderateScale(13),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  discountText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#16A34A",
  },
  sellerCard: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sellerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  sellerAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerTextGroup: {
    gap: moderateScale(2),
    maxWidth: width * 0.65,
  },
  sellerName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  sellerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  sellerLocation: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  sellerDot: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  ratingText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F172A",
  },
  accordionCard: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(12),
  },
  accordionTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  accordionBody: {
    paddingHorizontal: scale(14),
    paddingBottom: moderateScale(14),
    gap: moderateScale(8),
  },
  detailsBodyText: {
    fontSize: moderateScale(12.5),
    color: "#475569",
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(4),
  },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailKey: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  detailVal: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#0F172A",
  },
  brandCard: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  brandLogoBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
    backgroundColor: "#016073",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoText: {
    fontSize: moderateScale(10),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  brandTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  brandSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  reviewsSection: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(14),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  reviewsHeading: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  ratingSummaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  avgRatingText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },
  reviewCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    padding: scale(10),
    gap: scale(10),
  },
  reviewContentCol: {
    flex: 1,
  },
  reviewQuoteText: {
    fontSize: moderateScale(11.5),
    color: "#334155",
    lineHeight: moderateScale(16),
    marginBottom: moderateScale(6),
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  reviewerName: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontWeight: "600",
  },
  gridSection: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(16),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  gridSectionTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(12),
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(12),
  },
  productCard: {
    width: "31%",
  },
  gridImageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: scale(4),
    marginBottom: scale(4),
  },
  gridProductImg: {
    width: "82%",
    height: "82%",
  },
  gridAddBtn: {
    position: "absolute",
    bottom: scale(3),
    right: scale(3),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#016073",
    borderRadius: scale(5),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
  },
  gridAddText: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    color: "#016073",
  },
  gridCounterBox: {
    position: "absolute",
    bottom: scale(3),
    right: scale(3),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#016073",
    borderRadius: scale(5),
    paddingHorizontal: scale(2),
    paddingVertical: scale(1),
  },
  gridCounterBtn: {
    padding: scale(1),
  },
  gridCounterQty: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    color: "#016073",
    marginHorizontal: scale(3),
  },
  gridUnitText: {
    fontSize: moderateScale(8.5),
    color: "#64748B",
    fontWeight: "500",
  },
  gridTitle: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: moderateScale(13),
    marginBottom: moderateScale(2),
    minHeight: moderateScale(26),
  },
  gridStarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
    marginBottom: moderateScale(2),
  },
  gridRatingText: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    color: "#475569",
  },
  gridReviewsCount: {
    fontSize: moderateScale(8),
    color: "#94A3B8",
  },
  gridPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  gridPrice: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F172A",
  },
  gridOrigPrice: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  bottomPurchaseBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomPriceBox: {
    borderWidth: 1.2,
    borderStyle: "dashed",
    borderColor: "#016073",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
  },
  bottomUnitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  bottomUnitText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F172A",
  },
  bottomDiscountPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    borderRadius: scale(3),
  },
  bottomDiscountPillText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#16A34A",
  },
  bottomPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: moderateScale(1),
  },
  bottomPriceBold: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  bottomMrpText: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  bottomTaxText: {
    fontSize: moderateScale(8.5),
    color: "#94A3B8",
  },
  bottomAddToCartBtn: {
    backgroundColor: "#016073",
    borderRadius: scale(10),
    paddingHorizontal: scale(36),
    paddingVertical: moderateScale(13),
    alignItems: "center",
    justifyContent: "center",
  },
  bottomAddToCartText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bottomCounterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#016073",
    borderRadius: scale(10),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(10),
    gap: scale(14),
  },
  bottomCounterBtn: {
    padding: scale(4),
  },
  bottomCounterQtyText: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  outOfStockBtn: {
    backgroundColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(28),
    paddingVertical: moderateScale(13),
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#94A3B8",
  },
});
