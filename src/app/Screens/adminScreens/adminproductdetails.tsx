import { useAppDispatch } from "@/store/hooks";
import api from "@/store/services/api";
import { moderateAdminProduct } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AdminProductDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const params = useLocalSearchParams();
  const productId = (params.id as string) || "";
  const initialDataRaw = params.productData as string;

  let initialProduct = null;
  if (initialDataRaw) {
    try {
      initialProduct = JSON.parse(initialDataRaw);
    } catch (e) {
      // ignore
    }
  }

  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState<boolean>(!initialProduct);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const fetchProductDetails = async () => {
    if (!productId) return;
    try {
      const res = await api.get(`/admin/products/${productId}`);
      if (res.data?.data) {
        setProduct(res.data.data);
      }
    } catch (err: any) {
      // Fallback to standard product route if needed
      try {
        const fallbackRes = await api.get(`/products/${productId}`);
        if (fallbackRes.data?.data || fallbackRes.data?.product) {
          setProduct(fallbackRes.data?.data || fallbackRes.data?.product);
        }
      } catch (fallbackErr: any) {
        if (!product) {
          Alert.alert(
            "Error",
            err?.response?.data?.message || "Failed to load product details",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const handleToggleProductStatus = async () => {
    if (!product) return;
    const currentActive =
      product.isActive !== false && product.status !== "Not Active";
    const nextStatus = !currentActive;

    Alert.alert(
      "Moderate Product Listing",
      `Are you sure you want to ${nextStatus ? "ACTIVATE / APPROVE" : "SUSPEND / HIDE"} listing for "${product.name || product.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: nextStatus ? "Activate Listing" : "Suspend Listing",
          style: nextStatus ? "default" : "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await dispatch(
                moderateAdminProduct({
                  id: product._id,
                  payload: { isActive: nextStatus },
                }),
              ).unwrap();

              setProduct((prev: any) => ({
                ...prev,
                isActive: nextStatus,
                status: nextStatus ? "Active" : "Not Active",
              }));

              Alert.alert(
                "Success",
                `Product is now ${nextStatus ? "Active & Visible" : "Suspended from Customer App"}.`,
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Failed to update product status",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (loading && !product) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Loading product details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: bg }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={scale(48)}
          color="#EF4444"
        />
        <Text
          style={[
            styles.loadingText,
            { color: textPrimary, fontWeight: "700" },
          ]}
        >
          Product not found
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Extract images
  const imagesList: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img: any) => {
      if (typeof img === "string") imagesList.push(img);
      else if (img?.url) imagesList.push(img.url);
    });
  } else if (product.image) {
    imagesList.push(product.image);
  } else if (product.imageUrl) {
    imagesList.push(product.imageUrl);
  }

  const primaryImage = imagesList[selectedImageIndex] || imagesList[0] || null;

  const vendorName =
    product.vendor?.businessDetails?.businessName ||
    product.vendor?.storeName ||
    product.vendor?.name ||
    product.storeName ||
    product.supplierName ||
    "Direct Store";

  const vendorId = product.vendor?._id || product.vendor?.id || product.vendor;

  const purchases =
    product.ordersCount ?? product.purchaseCount ?? product.salesCount ?? 0;
  const isProductActive =
    product.isActive !== false && product.status !== "Not Active";
  const commissionEst = Math.round((product.price || 0) * 0.015);
  const vendorPayoutEst = (product.price || 0) - commissionEst;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["top", "left", "right"]}
    >
      {/* Top Header */}
      <View
        style={[
          styles.topHeader,
          { backgroundColor: cardBg, borderBottomColor: border },
        ]}
      >
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={scale(20)} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text
            style={[styles.headerTitle, { color: textPrimary }]}
            numberOfLines={1}
          >
            Product Details
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Admin Moderation & Insights
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerIconButton, { borderColor: border }]}
          onPress={fetchProductDetails}
        >
          <Feather name="refresh-cw" size={scale(16)} color={textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scale(80) + Math.max(insets.bottom, scale(16)) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchProductDetails}
            tintColor="#10B981"
          />
        }
      >
        {/* Main Image & Gallery */}
        <View
          style={[
            styles.imageHeroCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          {primaryImage ? (
            <View style={styles.mainImgWrap}>
              <Image
                source={{ uri: primaryImage }}
                style={styles.mainImg}
                contentFit="contain"
              />
              {primaryImage.includes("cloudinary.com") && (
                <View style={styles.cloudinaryBadge}>
                  <MaterialCommunityIcons
                    name="cloud-check"
                    size={scale(12)}
                    color="#10B981"
                  />
                  <Text style={styles.cloudinaryBadgeText}>Cloudinary</Text>
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.noImgBox,
                { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
              ]}
            >
              <MaterialCommunityIcons
                name="image-off-outline"
                size={scale(48)}
                color="#94A3B8"
              />
              <Text
                style={{
                  fontSize: moderateScale(12),
                  color: "#94A3B8",
                  marginTop: scale(6),
                }}
              >
                No product photo available
              </Text>
            </View>
          )}

          {/* Thumbnails Row */}
          {imagesList.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbsScroll}
            >
              <View style={styles.thumbsRow}>
                {imagesList.map((imgUri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedImageIndex(idx)}
                    style={[
                      styles.thumbBtn,
                      {
                        borderColor:
                          selectedImageIndex === idx ? "#10B981" : border,
                        borderWidth: selectedImageIndex === idx ? 2 : 1,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: imgUri }}
                      style={styles.thumbImg}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Title, Brand & Status Card */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.titleStatusRow}>
            <View style={{ flex: 1, marginRight: scale(10) }}>
              <Text style={[styles.productName, { color: textPrimary }]}>
                {product.name || product.title}
              </Text>
              <View style={styles.skuBrandRow}>
                {product.brand ? (
                  <View
                    style={[
                      styles.brandPill,
                      { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                    ]}
                  >
                    <Text
                      style={[styles.brandPillText, { color: textPrimary }]}
                    >
                      {product.brand}
                    </Text>
                  </View>
                ) : null}
                {product.sku ? (
                  <Text style={[styles.skuText, { color: textSecondary }]}>
                    SKU: {product.sku}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isProductActive
                    ? isDark
                      ? "rgba(16, 185, 129, 0.15)"
                      : "#ECFDF5"
                    : isDark
                      ? "rgba(239, 68, 68, 0.15)"
                      : "#FEF2F2",
                  borderColor: isProductActive ? "#10B981" : "#EF4444",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isProductActive ? "#10B981" : "#EF4444" },
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isProductActive ? "#10B981" : "#EF4444" },
                ]}
              >
                {isProductActive ? "Active" : "Suspended"}
              </Text>
            </View>
          </View>

          {/* Pricing & Discount */}
          <View style={[styles.priceStrip, { borderTopColor: border }]}>
            <View>
              <Text style={[styles.priceLabel, { color: textSecondary }]}>
                Selling Price
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: scale(8),
                }}
              >
                <Text style={styles.mainPriceText}>
                  ₹{product.price?.toLocaleString("en-IN")}
                </Text>
                {product.originalPrice &&
                product.originalPrice > product.price ? (
                  <Text style={[styles.mrpCrossText, { color: textSecondary }]}>
                    ₹{product.originalPrice?.toLocaleString("en-IN")}
                  </Text>
                ) : null}
              </View>
            </View>

            {product.discount || product.discountValue ? (
              <View style={styles.discountBadge}>
                <Feather name="percent" size={scale(12)} color="#FFFFFF" />
                <Text style={styles.discountBadgeText}>
                  {product.discount || product.discountValue}% OFF
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Commercial & Operational KPI Grid */}
        <View style={styles.kpiGrid}>
          {/* Total Purchases / Units Sold */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.kpiIconWrap,
                { backgroundColor: isDark ? "#064E3B30" : "#ECFDF5" },
              ]}
            >
              <MaterialCommunityIcons
                name="shopping-outline"
                size={scale(20)}
                color="#10B981"
              />
            </View>
            <Text style={styles.kpiValue}>{purchases}</Text>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>
              Total Purchases
            </Text>
          </View>

          {/* Stock In Inventory */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.kpiIconWrap,
                {
                  backgroundColor:
                    product.stock > 10
                      ? isDark
                        ? "#0284C720"
                        : "#E0F2FE"
                      : isDark
                        ? "#EF444420"
                        : "#FEE2E2",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={scale(20)}
                color={product.stock > 10 ? "#0284C7" : "#EF4444"}
              />
            </View>
            <Text
              style={[
                styles.kpiValue,
                { color: product.stock > 0 ? textPrimary : "#EF4444" },
              ]}
            >
              {product.stock ?? 0}
            </Text>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>
              {product.stock > 0 ? "Units in Stock" : "Out of Stock"}
            </Text>
          </View>

          {/* Customer Views */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.kpiIconWrap,
                { backgroundColor: isDark ? "#7C3AED20" : "#F3E8FF" },
              ]}
            >
              <Feather name="eye" size={scale(18)} color="#8B5CF6" />
            </View>
            <Text style={styles.kpiValue}>{product.views || 0}</Text>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>
              Customer Views
            </Text>
          </View>

          {/* Refunds / Returns */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View
              style={[
                styles.kpiIconWrap,
                { backgroundColor: isDark ? "#F59E0B20" : "#FEF3C7" },
              ]}
            >
              <MaterialCommunityIcons
                name="cash-refund"
                size={scale(20)}
                color="#F59E0B"
              />
            </View>
            <Text style={styles.kpiValue}>{product.refundsCount || 0}</Text>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>
              Refunds / Returns
            </Text>
          </View>
        </View>

        {/* Platform 1.5% Fee & Economics Box */}
        <View
          style={[
            styles.financeCard,
            {
              backgroundColor: isDark ? "#0B1520" : "#F0FDF4",
              borderColor: "#86EFAC",
            },
          ]}
        >
          <View style={styles.financeHeaderRow}>
            <MaterialCommunityIcons
              name="calculator-variant-outline"
              size={scale(18)}
              color="#10B981"
            />
            <Text style={[styles.financeTitle, { color: textPrimary }]}>
              Platform Fee & Payout Split
            </Text>
          </View>
          <View style={styles.financeSplitRow}>
            <View>
              <Text style={[styles.financeSubLabel, { color: textSecondary }]}>
                Platform Comm. (1.5%)
              </Text>
              <Text style={styles.financeGreen}>₹{commissionEst}</Text>
            </View>
            <View style={styles.financeDivider} />
            <View>
              <Text style={[styles.financeSubLabel, { color: textSecondary }]}>
                Est. Vendor Payout
              </Text>
              <Text style={[styles.financeSubValue, { color: textPrimary }]}>
                ₹{vendorPayoutEst}
              </Text>
            </View>
            <View style={styles.financeDivider} />
            <View>
              <Text style={[styles.financeSubLabel, { color: textSecondary }]}>
                Unit Packaging
              </Text>
              <Text style={[styles.financeSubValue, { color: textPrimary }]}>
                {product.unit || "1 unit"}
              </Text>
            </View>
          </View>
        </View>

        {/* Vendor & Store Information Card */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scale(6),
              }}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(18)}
                color="#0284C7"
              />
              <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                Store & Vendor Info
              </Text>
            </View>
            {vendorId ? (
              <TouchableOpacity
                style={styles.viewVendorLink}
                onPress={() => {
                  router.push({
                    pathname: "/Screens/adminScreens/vendorDetails" as any,
                    params: { id: vendorId },
                  });
                }}
              >
                <Text style={styles.viewVendorText}>View Vendor</Text>
                <Feather
                  name="chevron-right"
                  size={scale(14)}
                  color="#0284C7"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.vendorInfoContent}>
            <Text style={[styles.vendorStoreTitle, { color: textPrimary }]}>
              {vendorName}
            </Text>
            <View style={styles.vendorMetaRow}>
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <Feather name="tag" size={scale(11)} color={textSecondary} />
                <Text style={[styles.metaChipText, { color: textSecondary }]}>
                  Category: {product.category}
                </Text>
              </View>
              {product.subCategory ? (
                <View
                  style={[
                    styles.metaChip,
                    { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="subdirectory-arrow-right"
                    size={scale(11)}
                    color={textSecondary}
                  />
                  <Text style={[styles.metaChipText, { color: textSecondary }]}>
                    {product.subCategory}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Description & Details */}
        {(product.description || product.shortDescription) && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Text
              style={[
                styles.sectionHeading,
                { color: textPrimary, marginBottom: scale(8) },
              ]}
            >
              Description
            </Text>
            {product.shortDescription ? (
              <Text style={[styles.shortDescText, { color: textSecondary }]}>
                {product.shortDescription}
              </Text>
            ) : null}
            {product.description ? (
              <Text style={[styles.fullDescText, { color: textPrimary }]}>
                {product.description}
              </Text>
            ) : null}
          </View>
        )}

        {/* Variants (If any) */}
        {Array.isArray(product.variants) && product.variants.length > 0 && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Text
              style={[
                styles.sectionHeading,
                { color: textPrimary, marginBottom: scale(8) },
              ]}
            >
              Product Variants ({product.variants.length})
            </Text>
            <View style={styles.variantsList}>
              {product.variants.map((v: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.variantRow,
                    {
                      backgroundColor: isDark ? "#10161C" : "#F8FAFC",
                      borderColor: border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.variantType, { color: textPrimary }]}>
                      {v.type || "Variant"}{" "}
                      {v.weightValue
                        ? `(${v.weightValue} ${v.weightUnit || ""})`
                        : ""}
                    </Text>
                    {v.sku ? (
                      <Text style={[styles.skuText, { color: textSecondary }]}>
                        SKU: {v.sku}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.variantPrice}>
                      ₹{v.price?.toLocaleString("en-IN")}
                    </Text>
                    <Text
                      style={[
                        styles.variantStock,
                        { color: v.stock > 0 ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {v.stock > 0 ? `${v.stock} in stock` : "Out"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Floating Moderation Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: cardBg,
            borderTopColor: border,
            paddingBottom: Math.max(insets.bottom, scale(12)),
          },
        ]}
      >
        <View style={styles.bottomStatusCol}>
          <Text style={[styles.bottomStatusLabel, { color: textSecondary }]}>
            Moderation Status
          </Text>
          <Text
            style={[
              styles.bottomStatusValue,
              { color: isProductActive ? "#10B981" : "#EF4444" },
            ]}
          >
            {isProductActive ? "Listing Active" : "Listing Suspended"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.moderationBtn,
            {
              backgroundColor: isProductActive ? "#EF4444" : "#10B981",
              opacity: actionLoading ? 0.6 : 1,
            },
          ]}
          onPress={handleToggleProductStatus}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather
                name={isProductActive ? "slash" : "check-circle"}
                size={scale(16)}
                color="#FFFFFF"
              />
              <Text style={styles.moderationBtnText}>
                {isProductActive ? "Suspend Product" : "Approve & Activate"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(20),
  },
  loadingText: {
    fontSize: moderateScale(14),
    marginTop: scale(10),
  },
  backBtn: {
    marginTop: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    backgroundColor: "#10B981",
    borderRadius: scale(8),
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    gap: scale(10),
  },
  headerIconButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: scale(100),
    gap: scale(14),
  },
  imageHeroCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(12),
    alignItems: "center",
  },
  mainImgWrap: {
    width: "100%",
    height: scale(220),
    borderRadius: scale(12),
    overflow: "hidden",
    position: "relative",
  },
  mainImg: {
    width: "100%",
    height: "100%",
  },
  cloudinaryBadge: {
    position: "absolute",
    bottom: scale(10),
    right: scale(10),
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  cloudinaryBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#10B981",
  },
  noImgBox: {
    width: "100%",
    height: scale(180),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  thumbsScroll: {
    marginTop: scale(10),
    width: "100%",
  },
  thumbsRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  thumbBtn: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(8),
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  sectionCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(14),
  },
  titleStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  productName: {
    fontSize: moderateScale(17),
    fontWeight: "900",
    lineHeight: scale(22),
  },
  skuBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(6),
    flexWrap: "wrap",
  },
  brandPill: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  brandPillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  skuText: {
    fontSize: moderateScale(11),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  statusDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  priceStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  mainPriceText: {
    fontSize: moderateScale(20),
    fontWeight: "900",
    color: "#10B981",
  },
  mrpCrossText: {
    fontSize: moderateScale(14),
    textDecorationLine: "line-through",
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    backgroundColor: "#EF4444",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
  },
  kpiCard: {
    flex: 1,
    minWidth: "46%",
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  kpiIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(8),
  },
  kpiValue: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#10B981",
  },
  kpiLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginTop: scale(2),
  },
  financeCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
  },
  financeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(8),
  },
  financeTitle: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  financeSplitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  financeSubLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  financeGreen: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#10B981",
    marginTop: scale(2),
  },
  financeSubValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginTop: scale(2),
  },
  financeDivider: {
    width: 1,
    height: scale(24),
    backgroundColor: "#CBD5E1",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  viewVendorLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  viewVendorText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0284C7",
  },
  vendorInfoContent: {
    marginTop: scale(8),
  },
  vendorStoreTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  vendorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(6),
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  metaChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  shortDescText: {
    fontSize: moderateScale(12),
    fontStyle: "italic",
    marginBottom: scale(6),
  },
  fullDescText: {
    fontSize: moderateScale(13),
    lineHeight: scale(18),
  },
  variantsList: {
    gap: scale(8),
  },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  variantType: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  variantPrice: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#10B981",
  },
  variantStock: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginTop: scale(2),
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderTopWidth: 1,
  },
  bottomStatusCol: {
    flex: 1,
  },
  bottomStatusLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  bottomStatusValue: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    marginTop: scale(2),
  },
  moderationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(10),
  },
  moderationBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
});
