import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_PADDING = scale(16);
const GAP = scale(10);
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * 3) / 4;

export interface GiftingCategoryItem {
  id: string;
  name: string;
  subCategory: string;
  image: any;
  bgColor: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const GIFTING_SUBCATEGORIES: GiftingCategoryItem[] = [
  {
    id: "g-chocolates",
    name: "Chocolates &\nSweets",
    subCategory: "Chocolates & Sweets",
    image: require("@/assets/images/Home/prod-dairymilk.png"),
    bgColor: "#FEF3C7",
    iconName: "candy-outline",
  },
  {
    id: "g-mens-wear",
    name: "Men's\nWear",
    subCategory: "Men's Wear",
    image: require("@/assets/images/Home/deals-product-combo.png"),
    bgColor: "#E0F2FE",
    iconName: "tshirt-crew-outline",
  },
  {
    id: "g-womens-wear",
    name: "Women's\nWear",
    subCategory: "Women's Wear",
    image: require("@/assets/images/Home/floral-lace-pattern.png"),
    bgColor: "#FCE7F3",
    iconName: "hanger",
  },
  {
    id: "g-dresses",
    name: "Dresses &\nEthnic",
    subCategory: "Dresses & Ethnic Wear",
    image: require("@/assets/images/Home/floral-lace-pattern.png"),
    bgColor: "#EDE9FE",
    iconName: "party-popper",
  },
  {
    id: "g-cosmetics-hampers",
    name: "Cosmetics &\nHampers",
    subCategory: "Cosmetics & Hampers",
    image: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    bgColor: "#FFE4E6",
    iconName: "gift-outline",
  },
  {
    id: "g-electronics",
    name: "Electronics &\nGadgets",
    subCategory: "Electronics & Gadgets",
    image: require("@/assets/images/Home/deals-product-combo.png"),
    bgColor: "#E0E7FF",
    iconName: "cellphone-link",
  },
  {
    id: "g-toys-games",
    name: "Toys &\nGames",
    subCategory: "Toys & Games",
    image: require("@/assets/images/Home/wooden-toy-train.png"),
    bgColor: "#DCFCE7",
    iconName: "gamepad-variant-outline",
  },
  {
    id: "g-kids-gifts",
    name: "Kids &\nBaby Gifts",
    subCategory: "Kids & Baby Gifts",
    image: require("@/assets/images/Home/plush-bunny-toy.png"),
    bgColor: "#FFEDD5",
    iconName: "teddy-bear",
  },
];

interface GiftingCategoriesProps {
  title?: string;
  onItemPress?: (item: GiftingCategoryItem) => void;
}

export default function GiftingCategories({
  title = "Gifting & Celebrations",
  onItemPress,
}: GiftingCategoriesProps) {
  const theme = useTheme();
  const router = useRouter();
  const { publicProducts, publicLoading } = useAppSelector(
    (state) => state.product
  );

  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const handlePress = (item: GiftingCategoryItem) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params: {
          title: item.name.replace("\n", " "),
          category: "gifting",
          subCategory: item.subCategory,
        },
      });
    }
  };

  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.skeletonBlock,
            {
              width: scale(180),
              height: scale(20),
              borderRadius: scale(5),
              marginBottom: moderateScale(14),
              opacity: pulseAnim,
            },
          ]}
        />
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={`gifting-skel-${i}`} style={styles.itemWrapper}>
              <Animated.View
                style={[
                  styles.cardBox,
                  styles.skeletonBlock,
                  { opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.skeletonBlock,
                  {
                    width: scale(50),
                    height: scale(12),
                    borderRadius: scale(3),
                    marginTop: scale(6),
                    opacity: pulseAnim,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          <View style={styles.badgeContainer}>
            <MaterialCommunityIcons
              name="gift-outline"
              size={scale(13)}
              color="#DC2626"
            />
            <Text style={styles.badgeText}>Special</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/Screens/Category/categoryExpand" as any,
              params: {
                category: "Gifting",
                subCategory: "all",
                title: "All Gifting",
              },
            })
          }
        >
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {GIFTING_SUBCATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.82}
            style={styles.itemWrapper}
            onPress={() => handlePress(item)}
          >
            <View style={[styles.cardBox, { backgroundColor: item.bgColor }]}>
              {item.image ? (
                <Image
                  source={item.image}
                  style={styles.image}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <MaterialCommunityIcons
                  name={item.iconName || "gift-outline"}
                  size={scale(28)}
                  color="#475569"
                />
              )}
            </View>
            <Text
              style={[styles.name, { color: theme.colors.textPrimary }]}
              numberOfLines={2}
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
    paddingHorizontal: CONTAINER_PADDING,
    marginVertical: moderateScale(10),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(10),
    gap: scale(2),
  },
  badgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#DC2626",
  },
  seeAllText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(14),
  },
  itemWrapper: {
    width: CARD_WIDTH,
    alignItems: "center",
  },
  cardBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  image: {
    width: "82%",
    height: "82%",
  },
  name: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    textAlign: "center",
    marginTop: moderateScale(5),
    lineHeight: moderateScale(13),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});
