import { moderateScale, scale } from "@/theme";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_PADDING = scale(16);
const GAP = scale(12);
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 0.95;

export interface WinterEssentialItem {
  id: string;
  title: string;
  category: string;
  image: any;
}

const WINTER_ITEMS: WinterEssentialItem[] = [
  {
    id: "we-1",
    title: "Baby Clothing &\nWarm Wear",
    category: "Baby Clothing",
    image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
  },
  {
    id: "we-2",
    title: "Diapers &\nPants Care",
    category: "Diapers & Pants",
    image: require("@/assets/images/Home/pampers-baby-diaper.png"),
  },
  {
    id: "we-3",
    title: "Baby Care &\nLotions",
    category: "Baby Care",
    image: require("@/assets/images/Home/baby-care-lotion-bottle.png"),
  },
];

interface KidsWinterEssentialsProps {
  title?: string;
  items?: WinterEssentialItem[];
  onItemPress?: (item: WinterEssentialItem) => void;
}

export default function KidsWinterEssentials({
  title = "Winter Essentials",
  items = WINTER_ITEMS,
  onItemPress,
}: KidsWinterEssentialsProps) {
  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>{title}</Text>

      {/* 3-Cards Row */}
      <View style={styles.row}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.82}
            onPress={() => onItemPress?.(item)}
            style={styles.itemWrapper}
          >
            {/* Card Graphic Container */}
            <View style={styles.cardBox}>
              <Image
                source={typeof item.image === "string" ? { uri: item.image } : item.image}
                style={styles.cardImage}
                contentFit="contain"
                transition={200}
              />
            </View>

            {/* Title Underneath */}
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
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
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(12),
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: GAP,
  },
  itemWrapper: {
    width: CARD_WIDTH,
    alignItems: "center",
  },
  cardBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#E0F2FE",
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(8),
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  itemTitle: {
    marginTop: moderateScale(8),
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    lineHeight: moderateScale(16),
  },
});

