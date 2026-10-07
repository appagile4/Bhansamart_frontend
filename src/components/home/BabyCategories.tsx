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

export interface BabyCategoryItem {
  id: string;
  name: string;
  subCategory: string;
  image: any;
  bgColor: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const BABY_SUBCATEGORIES: BabyCategoryItem[] = [
  {
    id: "baby-food",
    name: "Baby Food",
    subCategory: "Baby Food",
    image: require("@/assets/images/Home/chocapic-cereal-box.png"),
    bgColor: "#FEF3C7",
    iconName: "baby-bottle-outline",
  },
  {
    id: "diapers-pants",
    name: "Diapers &\nPants",
    subCategory: "Diapers & Pants",
    image: require("@/assets/images/Home/molfix-baby-diaper.png"),
    bgColor: "#E0F2FE",
    iconName: "human-baby-changing-table",
  },
  {
    id: "baby-care",
    name: "Baby Care",
    subCategory: "Baby Care",
    image: require("@/assets/images/Home/baby-care-lotion-bottle.png"),
    bgColor: "#FCE7F3",
    iconName: "heart-pulse",
  },
  {
    id: "baby-bath",
    name: "Baby Bath",
    subCategory: "Baby Bath",
    image: require("@/assets/images/Home/himalaya-baby-wash.png"),
    bgColor: "#EDE9FE",
    iconName: "shower-head",
  },
  {
    id: "baby-feeding",
    name: "Baby\nFeeding",
    subCategory: "Baby Feeding",
    image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
    bgColor: "#D1FAE5",
    iconName: "baby-bottle",
  },
  {
    id: "baby-clothing",
    name: "Baby\nClothing",
    subCategory: "Baby Clothing",
    image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    bgColor: "#FFEDD5",
    iconName: "tshirt-crew-outline",
  },
  {
    id: "baby-accessories",
    name: "Baby\nAccessories",
    subCategory: "Baby Accessories",
    image: require("@/assets/images/Home/baby-rattles.png"),
    bgColor: "#F1F5F9",
    iconName: "toy-brick-outline",
  },
];

interface BabyCategoriesProps {
  title?: string;
  onItemPress?: (item: BabyCategoryItem) => void;
}

export default function BabyCategories({
  title = "Baby Essentials",
  onItemPress,
}: BabyCategoriesProps) {
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

  const handlePress = (item: BabyCategoryItem) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      router.push({
        pathname: "/Screens/Category/categoryExpand" as any,
        params: {
          title: item.name.replace("\n", " "),
          category: "baby",
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
              width: scale(160),
              height: scale(20),
              borderRadius: scale(5),
              marginBottom: moderateScale(14),
              opacity: pulseAnim,
            },
          ]}
        />
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={`baby-skel-${i}`} style={styles.itemWrapper}>
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
                    width: "70%",
                    height: scale(10),
                    marginTop: scale(6),
                    borderRadius: scale(3),
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
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
      </View>

      {/* 4-Columns Grid */}
      <View style={styles.gridContainer}>
        {BABY_SUBCATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.82}
            onPress={() => handlePress(item)}
            style={styles.itemWrapper}
          >
            {/* Rounded Colored Card Box */}
            <View style={[styles.cardBox, { backgroundColor: item.bgColor }]}>
              <Image
                source={
                  typeof item.image === "string" ? { uri: item.image } : item.image
                }
                style={styles.productImage}
                contentFit="contain"
                transition={150}
              />
            </View>

            {/* Label Underneath */}
            <Text
              style={[styles.itemTitle, { color: theme.colors.textPrimary }]}
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
    marginVertical: moderateScale(14),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  itemWrapper: {
    width: CARD_WIDTH,
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  cardBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(6),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: "88%",
    height: "88%",
  },
  itemTitle: {
    marginTop: moderateScale(5),
    fontSize: moderateScale(11),
    fontWeight: "700",
    textAlign: "center",
    lineHeight: moderateScale(14),
    minHeight: scale(28),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});
