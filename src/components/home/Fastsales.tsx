import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface FlashSaleCategory {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  discount: string;
  image?: ImageSourcePropType;
}

export type FlashSaleItem = FlashSaleCategory;

export interface FastSalesProps {
  saleTitle?: string;
  onItemPress?: (item: FlashSaleItem) => void;
  onCategoryPress?: (category: FlashSaleCategory) => void;
  onBannerPress?: () => void;
}

const DEFAULT_SALE_ITEMS: FlashSaleItem[] = [
  {
    id: "chips",
    name: "Chips",
    category: "Snacks & Drinks",
    subCategory: "Chips & Namkeen",
    discount: "10% OFF",
    image: require("@/assets/images/Home/gift-basket-care.png"),
  },
  {
    id: "beauty",
    name: "Beauty",
    category: "Beauty & Personal Care",
    subCategory: "Beauty & Cosmetics",
    discount: "25% OFF",
    image: require("@/assets/images/Home/desk-crayons-markers-holder.png"),
  },
  {
    id: "drinks",
    name: "Drinks & Juice",
    category: "Snacks & Drinks",
    subCategory: "Drinks & Juices",
    discount: "15% OFF",
    image: require("@/assets/images/Home/stationery-organizer-basket.png"),
  },
];

export default function FastSales({
  saleTitle = "Winter Sale",
  onItemPress,
  onCategoryPress,
  onBannerPress,
}: FastSalesProps) {
  const theme = useTheme();
  const router = useRouter();
  const { publicProducts } = useAppSelector((state) => state.product);

  // Compute live discount percentages dynamically from backend products if available
  const saleItems = useMemo(() => {
    return DEFAULT_SALE_ITEMS.map((item) => {
      if (publicProducts && publicProducts.length > 0) {
        const matchingProds = publicProducts.filter(
          (p) =>
            p.subCategory?.toLowerCase() === item.subCategory.toLowerCase() ||
            p.category?.toLowerCase() === item.category.toLowerCase()
        );

        let maxDisc = 0;
        matchingProds.forEach((p) => {
          const cur = p.price || 0;
          const orig =
            p.originalPrice && p.originalPrice > cur
              ? p.originalPrice
              : p.discountValue && p.discountValue > 0
              ? Math.round(cur / (1 - p.discountValue / 100))
              : cur;

          const disc =
            orig > cur ? Math.round(((orig - cur) / orig) * 100) : 0;
          const finalDisc = Math.max(p.discountValue || 0, disc);
          if (finalDisc > maxDisc) maxDisc = finalDisc;
        });

        if (maxDisc > 0) {
          return {
            ...item,
            discount: `${maxDisc}% OFF`,
          };
        }
      }
      return item;
    });
  }, [publicProducts]);

  const handleBannerPress = () => {
    if (onBannerPress) {
      onBannerPress();
    } else {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params: {
          category: "Snacks & Drinks",
          subCategory: "all",
          title: "Flash Sale",
        },
      });
    }
  };

  const handleItemPress = (item: FlashSaleItem) => {
    if (onItemPress) {
      onItemPress(item);
    }
    if (onCategoryPress) {
      onCategoryPress(item);
    }
    if (!onItemPress && !onCategoryPress) {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params: {
          category: item.category,
          subCategory: item.subCategory,
          title: item.subCategory,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Flash Sale Header Banner Image with Centered Pill Text */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleBannerPress}
        style={styles.bannerHeaderContainer}
      >
        <Image
          source={require("@/assets/images/Home/flash-sale-title.png")}
          style={styles.bannerLogo}
          contentFit="contain"
        />
        {/* Winter Sale Pill Text positioned right in the green oval */}
        <View style={styles.salePill}>
          <Text style={styles.salePillText}>{saleTitle}</Text>
        </View>
      </TouchableOpacity>

      {/* 3 Categories / Basket Row */}
      <View style={styles.itemsRow}>
        {saleItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => handleItemPress(item)}
            style={styles.itemCard}
          >
            {/* Basket Image */}
            <View style={styles.imageWrapper}>
              <Image
                source={item.image}
                style={styles.basketImage}
                contentFit="contain"
              />
              {/* Discount Badge on the basket's dark green label */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{item.discount}</Text>
              </View>
            </View>

            {/* Label Underneath */}
            <Text
              style={[styles.itemName, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: scale(14),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(14),
    alignItems: "center",
  },
  bannerHeaderContainer: {
    width: scale(290),
    height: scale(92),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: moderateScale(4),
  },
  bannerLogo: {
    width: "100%",
    height: "100%",
  },
  salePill: {
    position: "absolute",
    bottom: scale(1.5),
    width: scale(106),
    height: scale(25),
    alignItems: "center",
    justifyContent: "center",
  },
  salePillText: {
    color: "#ffffff",
    fontSize: moderateScale(14),
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  itemsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginTop: moderateScale(4),
    gap: scale(8),
  },
  itemCard: {
    flex: 1,
    alignItems: "center",
  },
  imageWrapper: {
    width: "100%",
    height: scale(115),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  basketImage: {
    width: 200,
    height: 400,
  },
  discountBadge: {
    position: "absolute",
    bottom: scale(38),
    alignSelf: "center",
    paddingHorizontal: scale(4),
  },
  discountText: {
    color: "#ffffff",
    fontSize: moderateScale(11),
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  itemName: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    marginTop: moderateScale(9),
    textAlign: "center",
  },
});
