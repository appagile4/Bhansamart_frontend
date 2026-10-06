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
const GAP = scale(10);
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 0.96;

export interface KidsSubCategoryItem {
  id: string;
  title: string;
  category: string;
  image: any;
}

export interface KidsCatalogSection {
  id: string;
  title: string;
  items: KidsSubCategoryItem[];
}

const KIDS_CATALOG_SECTIONS: KidsCatalogSection[] = [
  {
    id: "baby-care-essentials",
    title: "Baby Care Essentials",
    items: [
      {
        id: "diapers",
        title: "Diapers",
        category: "baby-diapers",
        image: require("@/assets/images/Home/molfix-baby-diaper.png"),
      },
      {
        id: "wipes",
        title: "Wipes",
        category: "baby-wipes",
        image: require("@/assets/images/Home/baby-wipes-pack.png"),
      },
      {
        id: "baby-wash",
        title: "Baby wash",
        category: "baby-wash",
        image: require("@/assets/images/Home/baby-wash-duo-bottles.png"),
      },
    ],
  },
  {
    id: "snacks-beverages",
    title: "Snacks & Beverages",
    items: [
      {
        id: "healthy-cereal",
        title: "Chocapic",
        category: "kids-cereals",
        image: require("@/assets/images/Home/chocapic-cereal-box.png"),
      },
      {
        id: "juices",
        title: "Juices",
        category: "kids-juices",
        image: require("@/assets/images/Home/fresh-juice-splash.png"),
      },
      {
        id: "cereals",
        title: "Fruit cereals",
        category: "kids-cereals",
        image: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
      },
    ],
  },
  {
    id: "health-hygiene",
    title: "Health & Hygiene",
    items: [
      {
        id: "shampoo-soap",
        title: "Gentle wash",
        category: "kids-shampoo-soap",
        image: require("@/assets/images/Home/himalaya-baby-wash.png"),
      },
      {
        id: "lotions",
        title: "Pump lotion",
        category: "kids-lotions",
        image: require("@/assets/images/Home/baby-lotion-pump-pink.png"),
      },
      {
        id: "baby-care",
        title: "Baby care",
        category: "kids-care",
        image: require("@/assets/images/Home/baby-care-lotion-bottle.png"),
      },
    ],
  },
  {
    id: "toys-games",
    title: "Toys & Games",
    items: [
      {
        id: "educational-toys",
        title: "Rattles",
        category: "educational-toys",
        image: require("@/assets/images/Home/baby-rattles.png"),
      },
      {
        id: "soft-plush",
        title: "Plush bunny",
        category: "soft-toys",
        image: require("@/assets/images/Home/plush-bunny-toy.png"),
      },
      {
        id: "action-toys",
        title: "Figurines",
        category: "kids-toys",
        image: require("@/assets/images/Home/paw-patrol-figurines.png"),
      },
    ],
  },
  {
    id: "clothing-accessories",
    title: "Clothing & Accessories",
    items: [
      {
        id: "hooded-onesie",
        title: "Warm onesie",
        category: "kids-outfits",
        image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
      },
      {
        id: "baby-booties",
        title: "Booties",
        category: "kids-shoes",
        image: require("@/assets/images/Home/crochet-baby-booties.png"),
      },
      {
        id: "playmat",
        title: "Play mat",
        category: "kids-accessories",
        image: require("@/assets/images/Home/kids-playmat-shoes.png"),
      },
    ],
  },
  {
    id: "school-essentials",
    title: "School Essentials",
    items: [
      {
        id: "giraffe-bag",
        title: "Giraffe bag",
        category: "kids-backpacks",
        image: require("@/assets/images/Home/giraffe-kids-backpack.png"),
      },
      {
        id: "backpacks",
        title: "Cartoon bag",
        category: "kids-backpacks",
        image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
      },
      {
        id: "water-bottles",
        title: "Water bottle",
        category: "kids-water-bottles",
        image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
      },
    ],
  },
];

interface KidsSubCategoriesProps {
  sections?: KidsCatalogSection[];
  onItemPress?: (section: KidsCatalogSection, item: KidsSubCategoryItem) => void;
}

export default function KidsSubCategories({
  sections = KIDS_CATALOG_SECTIONS,
  onItemPress,
}: KidsSubCategoriesProps) {
  return (
    <View style={styles.container}>
      {sections.map((section) => (
        <View key={section.id} style={styles.sectionContainer}>
          {/* Section Header Title */}
          <Text style={styles.sectionTitle}>{section.title}</Text>

          {/* 3-Column Items Row */}
          <View style={styles.itemsRow}>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.82}
                onPress={() => onItemPress?.(section, item)}
                style={styles.itemWrapper}
              >
                {/* Light Sky Blue Box */}
                <View style={styles.cardBox}>
                  <Image
                    source={
                      typeof item.image === "string"
                        ? { uri: item.image }
                        : item.image
                    }
                    style={styles.productImage}
                    contentFit="contain"
                    transition={200}
                  />
                </View>

                {/* Sub-label Below */}
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CONTAINER_PADDING,
    marginVertical: moderateScale(10),
  },
  sectionContainer: {
    marginBottom: moderateScale(18),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(10),
    letterSpacing: -0.2,
  },
  itemsRow: {
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
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    padding: scale(8),
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  itemTitle: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    textTransform: "none",
  },
});

