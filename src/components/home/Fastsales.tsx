import { moderateScale, scale, useTheme } from "@/theme";
import { Image } from "expo-image";
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

const SALE_ITEMS: FlashSaleItem[] = [
  {
    id: "chips",
    name: "Chips",
    discount: "10% OFF",
    image: require("@/assets/images/Home/gift-basket-care.png"),
  },
  {
    id: "beauty",
    name: "Beauty",
    discount: "25% OFF",
    image: require("@/assets/images/Home/desk-crayons-markers-holder.png"),
  },
  {
    id: "drinks",
    name: "Drinks & Juice",
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

  const handleItemPress = (item: FlashSaleItem) => {
    onItemPress?.(item);
    onCategoryPress?.(item);
  };

  return (
    <View style={styles.container}>
      {/* Flash Sale Header Banner Image with Centered Pill Text */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onBannerPress}
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
        {SALE_ITEMS.map((item) => (
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
