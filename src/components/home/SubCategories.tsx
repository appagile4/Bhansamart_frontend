import { useAppSelector } from "@/store/hooks";
import { moderateScale, scale, useTheme } from "@/theme";
import { Image } from "expo-image";
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
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 0.95;

export interface SubCategoryItem {
  id: string;
  title: string;
  category?: string;
  image: any;
}

export interface CatalogSectionData {
  id: string;
  title: string;
  items: SubCategoryItem[];
}

// ==========================================
// 1. GROCERY CATALOG SECTIONS
// ==========================================
const GROCERY_SECTIONS: CatalogSectionData[] = [
  {
    id: "g-sec-veg-fruits",
    title: "Vegetables & Fruits",
    items: [
      {
        id: "fresh-fruits",
        title: "Fresh fruits",
        category: "fresh-fruits",
        image: require("@/assets/images/Home/mixed-fresh-fruits-bowl.png"),
      },
      {
        id: "tropical-juices",
        title: "Juices",
        category: "juices-beverages",
        image: require("@/assets/images/Home/fresh-juice-splash.png"),
      },
      {
        id: "fresh-veggies",
        title: "Cauliflower",
        category: "fresh-vegetables",
        image: require("@/assets/images/Home/fresh-cauliflower.png"),
      },
    ],
  },
  {
    id: "g-sec-atta-rice",
    title: "Atta, Rice & Oil",
    items: [
      {
        id: "basmati-rice",
        title: "Basmati rice",
        category: "atta-rice-dal",
        image: require("@/assets/images/Home/daawat-basmati-rice.png"),
      },
      {
        id: "healthy-oil",
        title: "Cooking oil",
        category: "oil-ghee-masala",
        image: require("@/assets/images/Home/saffola-gold-oil.png"),
      },
      {
        id: "grains-pulses",
        title: "Rice & dal",
        category: "atta-rice-dal",
        image: require("@/assets/images/Home/rice-grains-package.png"),
      },
    ],
  },
  {
    id: "g-sec-breakfast",
    title: "Breakfast & Cereals",
    items: [
      {
        id: "corn-flakes",
        title: "Corn flakes",
        category: "cereals-breakfast",
        image: require("@/assets/images/Home/cornflakes-hero.png"),
      },
      {
        id: "muesli-crunch",
        title: "Muesli",
        category: "cereals-breakfast",
        image: require("@/assets/images/Home/kelloggs-combo.png"),
      },
      {
        id: "rainbow-cereals",
        title: "Fruit cereals",
        category: "cereals-breakfast",
        image: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
      },
    ],
  },
  {
    id: "g-sec-instant",
    title: "Instant & Ready Foods",
    items: [
      {
        id: "maggi-instant",
        title: "Maggi noodles",
        category: "instant-noodles",
        image: require("@/assets/images/Home/product-maggi.png"),
      },
      {
        id: "waiwai-instant",
        title: "Wai Wai noodles",
        category: "instant-noodles",
        image: require("@/assets/images/Home/product-waiwai.png"),
      },
      {
        id: "spicy-2pm",
        title: "2pm spicy",
        category: "instant-noodles",
        image: require("@/assets/images/Home/product-2pm.png"),
      },
    ],
  },
  {
    id: "g-sec-dairy-meat",
    title: "Dairy & Fresh Meat",
    items: [
      {
        id: "swiss-cheese",
        title: "Swiss cheese",
        category: "dairy-cheese",
        image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
      },
      {
        id: "fresh-meat",
        title: "Fresh meat",
        category: "meat-fish",
        image: require("@/assets/images/Home/fresh-meat-sausages-tray.png"),
      },
      {
        id: "sweet-treat",
        title: "Dairy sweet",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-milkybar.png"),
      },
    ],
  },
];

// ==========================================
// 2. BABY & KIDS CATALOG SECTIONS (7 Subcategories)
// ==========================================
const BABY_SECTIONS: CatalogSectionData[] = [
  {
    id: "b-sec-food",
    title: "Baby Food & Cereals",
    items: [
      {
        id: "baby-cereal",
        title: "Cerelac wheat",
        category: "Baby Food",
        image: require("@/assets/images/Home/chocapic-cereal-box.png"),
      },
      {
        id: "fruit-puree",
        title: "Fruit puree",
        category: "Baby Food",
        image: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
      },
      {
        id: "baby-juice",
        title: "Apple juice",
        category: "Baby Food",
        image: require("@/assets/images/Home/fresh-juice-splash.png"),
      },
    ],
  },
  {
    id: "b-sec-diapers",
    title: "Diapers & Pants",
    items: [
      {
        id: "molfix-diapers",
        title: "Molfix diapers",
        category: "Diapers & Pants",
        image: require("@/assets/images/Home/molfix-baby-diaper.png"),
      },
      {
        id: "baby-wipes",
        title: "Baby wipes",
        category: "Diapers & Pants",
        image: require("@/assets/images/Home/baby-wipes-pack.png"),
      },
      {
        id: "pampers-pants",
        title: "Pampers pants",
        category: "Diapers & Pants",
        image: require("@/assets/images/Home/pampers-baby-diaper.png"),
      },
    ],
  },
  {
    id: "b-sec-care",
    title: "Baby Care & Skin",
    items: [
      {
        id: "baby-lotion-b",
        title: "Nourish lotion",
        category: "Baby Care",
        image: require("@/assets/images/Home/baby-lotion-pump-pink.png"),
      },
      {
        id: "rash-cream-b",
        title: "Rash cream",
        category: "Baby Care",
        image: require("@/assets/images/Home/baby-care-lotion-bottle.png"),
      },
      {
        id: "baby-oil-b",
        title: "Baby massage oil",
        category: "Baby Care",
        image: require("@/assets/images/Home/baby-wash-duo-bottles.png"),
      },
    ],
  },
  {
    id: "b-sec-bath",
    title: "Baby Bath & Shampoo",
    items: [
      {
        id: "baby-wash-b",
        title: "Gentle wash",
        category: "Baby Bath",
        image: require("@/assets/images/Home/himalaya-baby-wash.png"),
      },
      {
        id: "baby-shampoo-b",
        title: "Tear-free shampoo",
        category: "Baby Bath",
        image: require("@/assets/images/Home/baby-wash-duo-bottles.png"),
      },
      {
        id: "bath-sponge-b",
        title: "Soft sponge",
        category: "Baby Bath",
        image: require("@/assets/images/Home/plush-bunny-toy.png"),
      },
    ],
  },
  {
    id: "b-sec-feeding",
    title: "Baby Feeding & Bottles",
    items: [
      {
        id: "feeder-bottle-b",
        title: "Feeding bottle",
        category: "Baby Feeding",
        image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
      },
      {
        id: "silicone-bibs-b",
        title: "Silicone bib",
        category: "Baby Feeding",
        image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
      },
      {
        id: "baby-spoons-b",
        title: "Soft spoons",
        category: "Baby Feeding",
        image: require("@/assets/images/Home/kids-playmat-shoes.png"),
      },
    ],
  },
  {
    id: "b-sec-clothing",
    title: "Baby Clothing & Wear",
    items: [
      {
        id: "baby-romper-b",
        title: "Cotton romper",
        category: "Baby Clothing",
        image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
      },
      {
        id: "baby-booties-b",
        title: "Crochet booties",
        category: "Baby Clothing",
        image: require("@/assets/images/Home/crochet-baby-booties.png"),
      },
      {
        id: "baby-towel-b",
        title: "Hooded wrap",
        category: "Baby Clothing",
        image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
      },
    ],
  },
  {
    id: "b-sec-accessories",
    title: "Baby Accessories & Toys",
    items: [
      {
        id: "teether-ring-b",
        title: "Silicone teether",
        category: "Baby Accessories",
        image: require("@/assets/images/Home/baby-rattles.png"),
      },
      {
        id: "plush-rattles-b",
        title: "Soft rattles",
        category: "Baby Accessories",
        image: require("@/assets/images/Home/plush-bunny-toy.png"),
      },
      {
        id: "wooden-train-b",
        title: "Play train",
        category: "Baby Accessories",
        image: require("@/assets/images/Home/wooden-toy-train.png"),
      },
    ],
  },
];

const KIDS_SECTIONS = BABY_SECTIONS;

// ==========================================
// 3. GIFTING CATALOG SECTIONS
// ==========================================
const GIFTING_SECTIONS: CatalogSectionData[] = [
  {
    id: "gift-sec-chocolates",
    title: "Chocolates & Sweet Hampers",
    items: [
      {
        id: "kitkat-gift",
        title: "KitKat pack",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-kitkat.png"),
      },
      {
        id: "silk-box",
        title: "Dairy Milk box",
        category: "premium-chocolates",
        image: require("@/assets/images/Home/prod-dairymilk.png"),
      },
      {
        id: "sweet-hamper",
        title: "Sweet hamper",
        category: "chocolate-gifts",
        image: require("@/assets/images/Home/sweet-tooth-source.png"),
      },
    ],
  },
  {
    id: "gift-sec-treats",
    title: "Party & Festive Treats",
    items: [
      {
        id: "munch-crunch",
        title: "Munch pack",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-munch.png"),
      },
      {
        id: "gems-party",
        title: "Gems surprise",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-gems.png"),
      },
      {
        id: "milkybar-white",
        title: "Milkybar treat",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-milkybar.png"),
      },
    ],
  },
  {
    id: "gift-sec-combos",
    title: "Gift Combos & Packs",
    items: [
      {
        id: "breakfast-gift",
        title: "Festive combo",
        category: "gift-combos",
        image: require("@/assets/images/Home/deals-product-combo.png"),
      },
      {
        id: "flower-bouquet-gift",
        title: "Flower bouquet",
        category: "gift-flowers",
        image: require("@/assets/images/Home/gift-flower-bouquet.png"),
      },
      {
        id: "deluxe-care-box",
        title: "Care hamper",
        category: "care-gifts",
        image: require("@/assets/images/Home/gift-basket-care.png"),
      },
    ],
  },
];

// ==========================================
// 4. STATIONERY CATALOG SECTIONS
// ==========================================
const STATIONERY_SECTIONS: CatalogSectionData[] = [
  {
    id: "stat-sec-bags",
    title: "School Bags & Storage",
    items: [
      {
        id: "printed-bag",
        title: "School bag",
        category: "school-backpacks",
        image: require("@/assets/images/Home/printed-school-backpack.png"),
      },
      {
        id: "water-bottle-stat",
        title: "Water bottle",
        category: "water-bottles",
        image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
      },
      {
        id: "cartoon-bag-stat",
        title: "Cartoon bag",
        category: "school-backpacks",
        image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
      },
    ],
  },
  {
    id: "stat-sec-writing",
    title: "Pens & Writing Supplies",
    items: [
      {
        id: "ballpoint-pens",
        title: "Ballpoint pens",
        category: "pens-writing",
        image: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
      },
      {
        id: "fountain-pen",
        title: "Executive pen",
        category: "pens-writing",
        image: require("@/assets/images/Home/executive-fountain-pen.png"),
      },
      {
        id: "pen-holder",
        title: "Pen holder",
        category: "desk-accessories",
        image: require("@/assets/images/Home/stationery-pen-holder.png"),
      },
    ],
  },
  {
    id: "stat-sec-craft",
    title: "Art, Craft & Paper",
    items: [
      {
        id: "colored-pencils",
        title: "Colored pencils",
        category: "art-craft",
        image: require("@/assets/images/Home/colored-pencils-row.png"),
      },
      {
        id: "paper-reams",
        title: "Double A paper",
        category: "paper-notebooks",
        image: require("@/assets/images/Home/double-a-paper-reams.png"),
      },
      {
        id: "desk-organizer",
        title: "Desk organizer",
        category: "desk-accessories",
        image: require("@/assets/images/Home/stationery-organizer-basket.png"),
      },
    ],
  },
  {
    id: "stat-sec-notebooks",
    title: "Notebooks & Office Files",
    items: [
      {
        id: "sticky-notes",
        title: "Sticky notes",
        category: "paper-notebooks",
        image: require("@/assets/images/Home/notebooks-sticky-notes.png"),
      },
      {
        id: "office-folders",
        title: "Office folders",
        category: "office-files",
        image: require("@/assets/images/Home/office-folders-notebooks.jpg"),
      },
      {
        id: "clipboards",
        title: "Clipboards",
        category: "office-files",
        image: require("@/assets/images/Home/office-document-clipboards.png"),
      },
    ],
  },
];

// ==========================================
// 5. BEAUTY CATALOG SECTIONS
// ==========================================
const BEAUTY_SECTIONS: CatalogSectionData[] = [
  {
    id: "b-sec-skincare",
    title: "Skin & Personal Care",
    items: [
      {
        id: "skincare-creams",
        title: "Face creams",
        category: "skin-care",
        image: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
      },
      {
        id: "cosmetics-set",
        title: "Cosmetics set",
        category: "skin-care",
        image: require("@/assets/images/Home/cosmetics-skincare-set.png"),
      },
      {
        id: "beauty-flatlay",
        title: "Beauty kit",
        category: "skin-care",
        image: require("@/assets/images/Home/beauty-cosmetics-flatlay.jpg"),
      },
    ],
  },
  {
    id: "b-sec-makeup",
    title: "Makeup & Beauty",
    items: [
      {
        id: "compact-blush",
        title: "Blush powder",
        category: "makeup",
        image: require("@/assets/images/Home/makeup-blush-compact.png"),
      },
      {
        id: "red-lipstick",
        title: "Red lipstick",
        category: "makeup",
        image: require("@/assets/images/Home/red-lipstick-tube.png"),
      },
      {
        id: "powder-brush",
        title: "Powder brush",
        category: "makeup-tools",
        image: require("@/assets/images/Home/makeup-powder-brush.png"),
      },
    ],
  },
  {
    id: "b-sec-bath",
    title: "Bath & Oral Hygiene",
    items: [
      {
        id: "herbal-paste",
        title: "Toothpaste",
        category: "oral-care",
        image: require("@/assets/images/Home/toothpaste-colgate.png"),
      },
      {
        id: "body-wash",
        title: "Body wash",
        category: "bath-body",
        image: require("@/assets/images/Home/himalaya-baby-wash.png"),
      },
      {
        id: "makeup-layout",
        title: "Care products",
        category: "bath-body",
        image: require("@/assets/images/Home/beauty-skincare-makeup-layout.jpg"),
      },
    ],
  },
];

// ==========================================
// 6. SNACKS CATALOG SECTIONS
// ==========================================
const SNACKS_SECTIONS: CatalogSectionData[] = [
  {
    id: "sn-sec-noodles",
    title: "Noodles & Quick Bites",
    items: [
      {
        id: "waiwai-sn",
        title: "Wai Wai noodles",
        category: "snacks-noodles",
        image: require("@/assets/images/Home/product-waiwai.png"),
      },
      {
        id: "maggi-sn",
        title: "Maggi noodles",
        category: "snacks-noodles",
        image: require("@/assets/images/Home/product-maggi.png"),
      },
      {
        id: "2pm-sn",
        title: "2pm spicy",
        category: "snacks-noodles",
        image: require("@/assets/images/Home/product-2pm.png"),
      },
    ],
  },
  {
    id: "sn-sec-breakfast",
    title: "Cereals & Beverages",
    items: [
      {
        id: "cornflakes-sn",
        title: "Corn flakes",
        category: "cereals-breakfast",
        image: require("@/assets/images/Home/cornflakes-hero.png"),
      },
      {
        id: "fruit-cereals-sn",
        title: "Fruit cereals",
        category: "cereals-breakfast",
        image: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
      },
      {
        id: "tropical-juice-sn",
        title: "Fruit juices",
        category: "juices-beverages",
        image: require("@/assets/images/Home/fresh-juice-splash.png"),
      },
    ],
  },
  {
    id: "sn-sec-sweets",
    title: "Chocolates & Sweets",
    items: [
      {
        id: "silk-sn",
        title: "Dairy Milk",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-dairymilk.png"),
      },
      {
        id: "kitkat-sn",
        title: "KitKat bar",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-kitkat.png"),
      },
      {
        id: "nutties-sn",
        title: "Nutties bites",
        category: "sweet-treats",
        image: require("@/assets/images/Home/prod-nutties.png"),
      },
    ],
  },
];

const CATALOG_CATEGORY_MAP: Record<string, CatalogSectionData[]> = {
  grocery: GROCERY_SECTIONS,
  kids: KIDS_SECTIONS,
  baby: KIDS_SECTIONS,
  gifting: GIFTING_SECTIONS,
  gifts: GIFTING_SECTIONS,
  gift: GIFTING_SECTIONS,
  stationery: STATIONERY_SECTIONS,
  school: STATIONERY_SECTIONS,
  beauty: BEAUTY_SECTIONS,
  snacks: SNACKS_SECTIONS,
};

interface GrocerySubCategoriesProps {
  category?: "grocery" | "kids" | "gifting" | "stationery" | "beauty" | "snacks" | string;
  sections?: CatalogSectionData[];
  onItemPress?: (section: CatalogSectionData, item: SubCategoryItem) => void;
}

export default function GrocerySubCategories({
  category = "grocery",
  sections,
  onItemPress,
}: GrocerySubCategoriesProps) {
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

  const displaySections =
    sections || CATALOG_CATEGORY_MAP[category.toLowerCase()] || GROCERY_SECTIONS;

  if (publicLoading && (!publicProducts || publicProducts.length === 0)) {
    return (
      <View style={styles.container}>
        {[1, 2].map((sec) => (
          <View key={`sub-skel-sec-${sec}`} style={styles.sectionContainer}>
            <Animated.View
              style={[
                styles.skeletonBlock,
                {
                  width: scale(140),
                  height: scale(16),
                  borderRadius: scale(4),
                  marginBottom: moderateScale(10),
                  opacity: pulseAnim,
                },
              ]}
            />
            <View style={styles.itemsRow}>
              {[1, 2, 3].map((item) => (
                <View key={`sub-skel-item-${sec}-${item}`} style={styles.itemWrapper}>
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
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {displaySections.map((section) => (
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
                {/* Soft Rounded Card Box */}
                <View style={styles.cardBox}>
                  <Image
                    source={item.image}
                    style={styles.productImage}
                    contentFit="contain"
                    transition={150}
                  />
                </View>

                {/* Sub-label Underneath */}
                <Text style={styles.itemTitle} numberOfLines={2}>
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
    lineHeight: moderateScale(16),
  },
  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },
});

