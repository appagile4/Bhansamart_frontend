import { moderateScale, scale, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface DealProduct {
  id: string;
  name: string;
  tags: string[];
  image: any;
  rating: number;
  ratingCount: number;
  price: number;
  originalPrice: number;
  optionsText?: string;
  category?: string;
  badge?: string;
}

// ==========================================
// 1. GROCERY TOP DEALS (8 Items for 2x4 Grid)
// ==========================================
const GROCERY_DEALS: DealProduct[] = [
  {
    id: "deal-g-1",
    name: "Maggi Masala - 2 Minutes Instant Noodles",
    tags: ["70g", "Noodles"],
    image: require("@/assets/images/Home/product-maggi.png"),
    rating: 4.8,
    ratingCount: 345,
    price: 100,
    originalPrice: 120,
    optionsText: "2 options",
    category: "instant-noodles",
    badge: "17% OFF",
  },
  {
    id: "deal-g-2",
    name: "Wai Wai Ready To Eat Chicken Noodles",
    tags: ["75g", "Snacks"],
    image: require("@/assets/images/Home/product-waiwai.png"),
    rating: 4.7,
    ratingCount: 280,
    price: 150,
    originalPrice: 170,
    optionsText: "3 options",
    category: "instant-noodles",
    badge: "12% OFF",
  },
  {
    id: "deal-g-3",
    name: "2pm Ready To Eat Spicy Masala Noodles",
    tags: ["100g", "Extra Spicy"],
    image: require("@/assets/images/Home/product-2pm.png"),
    rating: 4.9,
    ratingCount: 195,
    price: 200,
    originalPrice: 240,
    category: "instant-noodles",
    badge: "16% OFF",
  },
  {
    id: "deal-g-4",
    name: "Kellogg's Honey & Almond Corn Flakes",
    tags: ["475g", "Breakfast"],
    image: require("@/assets/images/Home/cornflakes-hero.png"),
    rating: 4.8,
    ratingCount: 420,
    price: 350,
    originalPrice: 420,
    optionsText: "2 options",
    category: "cereals-breakfast",
    badge: "20% OFF",
  },
  {
    id: "deal-g-5",
    name: "Saffola Gold Pro Healthy Cooking Oil",
    tags: ["1 Litre", "Blended Oil"],
    image: require("@/assets/images/Home/saffola-gold-oil.png"),
    rating: 4.9,
    ratingCount: 512,
    price: 450,
    originalPrice: 520,
    category: "oil-ghee-masala",
    badge: "13% OFF",
  },
  {
    id: "deal-g-6",
    name: "Daawat Rozana Super Fine Basmati Rice",
    tags: ["1kg", "Basmati"],
    image: require("@/assets/images/Home/daawat-basmati-rice.png"),
    rating: 4.6,
    ratingCount: 168,
    price: 280,
    originalPrice: 320,
    category: "atta-rice-dal",
    badge: "12% OFF",
  },
  {
    id: "deal-g-7",
    name: "Kellogg's Crunchy Muesli Fruit & Nut",
    tags: ["500g", "Breakfast"],
    image: require("@/assets/images/Home/kelloggs-combo.png"),
    rating: 4.8,
    ratingCount: 230,
    price: 380,
    originalPrice: 460,
    category: "cereals-breakfast",
    badge: "18% OFF",
  },
  {
    id: "deal-g-8",
    name: "Fresh Himalayan Farm Choice Meat",
    tags: ["500g", "Fresh Cut"],
    image: require("@/assets/images/Home/fresh-meat-sausages-tray.png"),
    rating: 4.9,
    ratingCount: 310,
    price: 420,
    originalPrice: 499,
    category: "fresh-meat",
    badge: "15% OFF",
  },
];

// ==========================================
// 2. KIDS TOP DEALS (8 Items for 2x4 Grid)
// ==========================================
const KIDS_DEALS: DealProduct[] = [
  {
    id: "deal-k-1",
    name: "Baby Walkers Soft Breathable Shoes",
    tags: ["1 Pair", "0-12m"],
    image: require("@/assets/images/Home/kids-playmat-shoes.png"),
    rating: 4.9,
    ratingCount: 389,
    price: 650,
    originalPrice: 899,
    optionsText: "4 sizes",
    category: "baby-shoes",
    badge: "28% OFF",
  },
  {
    id: "deal-k-2",
    name: "DeLune Kids Waterproof Backpack",
    tags: ["Ergonomic", "School"],
    image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    rating: 4.8,
    ratingCount: 245,
    price: 1250,
    originalPrice: 1600,
    optionsText: "2 colors",
    category: "kids-backpacks",
    badge: "22% OFF",
  },
  {
    id: "deal-k-3",
    name: "Cute Plush Fluffy Teddy Bear Toy",
    tags: ["30 cm", "Soft Plush"],
    image: require("@/assets/images/Home/paw-patrol-figurines.png"),
    rating: 4.7,
    ratingCount: 198,
    price: 450,
    originalPrice: 600,
    category: "soft-toys",
    badge: "25% OFF",
  },
  {
    id: "deal-k-4",
    name: "Handcrafted Solid Wood Express Train",
    tags: ["Non-toxic", "Wooden"],
    image: require("@/assets/images/Home/wooden-toy-train.png"),
    rating: 4.9,
    ratingCount: 165,
    price: 799,
    originalPrice: 1100,
    category: "educational-toys",
    badge: "27% OFF",
  },
  {
    id: "deal-k-5",
    name: "Kids Warm Fleece Bunny Hood Outfit",
    tags: ["1-2 yrs", "Fleece"],
    image: require("@/assets/images/Home/molfix-baby-diaper.png"),
    rating: 4.8,
    ratingCount: 220,
    price: 890,
    originalPrice: 1200,
    optionsText: "3 colors",
    category: "kids-outfits",
    badge: "26% OFF",
  },
  {
    id: "deal-k-6",
    name: "Pampers Premium Care Ultra Dry Diapers",
    tags: ["44 pcs", "Size M"],
    image: require("@/assets/images/Home/baby-wipes-pack.png"),
    rating: 4.9,
    ratingCount: 512,
    price: 950,
    originalPrice: 1150,
    category: "baby-diapers",
    badge: "17% OFF",
  },
  {
    id: "deal-k-7",
    name: "Gentle Pure Water Baby Wipes Pack",
    tags: ["80 Wipes", "Hypoallergenic"],
    image: require("@/assets/images/Home/happy-smiling-baby.png"),
    rating: 4.8,
    ratingCount: 310,
    price: 240,
    originalPrice: 320,
    category: "baby-wipes",
    badge: "25% OFF",
  },
  {
    id: "deal-k-8",
    name: "Kids Insulated Cartoon Water Bottle",
    tags: ["500ml", "BPA Free"],
    image: require("@/assets/images/Home/chocapic-cereal-box.png"),
    rating: 4.8,
    ratingCount: 180,
    price: 399,
    originalPrice: 550,
    category: "water-bottles",
    badge: "27% OFF",
  },
];

// ==========================================
// 3. GIFTING TOP DEALS
// ==========================================
const GIFTING_DEALS: DealProduct[] = [
  {
    id: "deal-gift-1",
    name: "Nestle KitKat Celebration Festive Pack",
    tags: ["128g", "Special Edition"],
    image: require("@/assets/images/Home/prod-kitkat.png"),
    rating: 4.9,
    ratingCount: 420,
    price: 299,
    originalPrice: 400,
    optionsText: "3 options",
    category: "sweet-treats",
    badge: "25% OFF",
  },
  {
    id: "deal-gift-2",
    name: "Cadbury Dairy Milk Silk Festive Box",
    tags: ["150g", "Silk Bar"],
    image: require("@/assets/images/Home/prod-dairymilk.png"),
    rating: 4.8,
    ratingCount: 350,
    price: 350,
    originalPrice: 450,
    optionsText: "2 options",
    category: "premium-chocolates",
    badge: "22% OFF",
  },
  {
    id: "deal-gift-3",
    name: "Deluxe Assorted Sweet & Chocolate Hamper",
    tags: ["250g", "Gift Box"],
    image: require("@/assets/images/Home/sweet-tooth-source.png"),
    rating: 4.9,
    ratingCount: 190,
    price: 499,
    originalPrice: 699,
    category: "chocolate-gifts",
    badge: "29% OFF",
  },
  {
    id: "deal-gift-4",
    name: "Nestle Munch Max Crunchy Chocolate Pack",
    tags: ["120g", "Crispy Wafer"],
    image: require("@/assets/images/Home/prod-munch.png"),
    rating: 4.6,
    ratingCount: 160,
    price: 180,
    originalPrice: 240,
    category: "sweet-treats",
    badge: "25% OFF",
  },
  {
    id: "deal-gift-5",
    name: "Cadbury Gems Colorful Party Surprise",
    tags: ["150g", "Gems"],
    image: require("@/assets/images/Home/prod-gems.png"),
    rating: 4.7,
    ratingCount: 130,
    price: 150,
    originalPrice: 200,
    category: "sweet-treats",
    badge: "25% OFF",
  },
  {
    id: "deal-gift-6",
    name: "Festive Celebration Breakfast Combo",
    tags: ["Combo Pack", "Special"],
    image: require("@/assets/images/Home/deals-product-combo.png"),
    rating: 4.8,
    ratingCount: 215,
    price: 599,
    originalPrice: 850,
    category: "gift-combos",
    badge: "30% OFF",
  },
  {
    id: "deal-gift-7",
    name: "Nestle Milkybar Creamy White Treats",
    tags: ["100g", "White Chocolate"],
    image: require("@/assets/images/Home/prod-milkybar.png"),
    rating: 4.7,
    ratingCount: 175,
    price: 160,
    originalPrice: 220,
    category: "sweet-treats",
    badge: "27% OFF",
  },
  {
    id: "deal-gift-8",
    name: "Cadbury Nutties Rich Chocolate Bites",
    tags: ["80g", "Chocolate Nuts"],
    image: require("@/assets/images/Home/prod-nutties.png"),
    rating: 4.8,
    ratingCount: 190,
    price: 190,
    originalPrice: 250,
    category: "sweet-treats",
    badge: "24% OFF",
  },
];

// ==========================================
// 4. STATIONERY TOP DEALS
// ==========================================
const STATIONERY_DEALS: DealProduct[] = [
  {
    id: "deal-stat-1",
    name: "DeLune Kids Multi-Compartment School Backpack",
    tags: ["Waterproof", "Ergonomic"],
    image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    rating: 4.8,
    ratingCount: 230,
    price: 1299,
    originalPrice: 1750,
    optionsText: "2 colors",
    category: "school-backpacks",
    badge: "26% OFF",
  },
  {
    id: "deal-stat-2",
    name: "Kids Creative Rhythm & Early Learning Set",
    tags: ["Wooden", "Early Edu"],
    image: require("@/assets/images/Home/baby-rattles.png"),
    rating: 4.7,
    ratingCount: 145,
    price: 340,
    originalPrice: 450,
    category: "stationery-kits",
    badge: "24% OFF",
  },
  {
    id: "deal-stat-3",
    name: "Insulated Leakproof School Water Bottle",
    tags: ["500ml", "BPA Free"],
    image: require("@/assets/images/Home/chocapic-cereal-box.png"),
    rating: 4.8,
    ratingCount: 310,
    price: 399,
    originalPrice: 550,
    optionsText: "4 prints",
    category: "water-bottles",
    badge: "27% OFF",
  },
  {
    id: "deal-stat-4",
    name: "Educational Brain Teaser Jigsaw Puzzle",
    tags: ["24 pcs", "Non-toxic"],
    image: require("@/assets/images/Home/plush-bunny-toy.png"),
    rating: 4.6,
    ratingCount: 95,
    price: 299,
    originalPrice: 420,
    category: "art-craft",
    badge: "28% OFF",
  },
  {
    id: "deal-stat-5",
    name: "Solid Wooden Toy Building Blocks Set",
    tags: ["12 Pcs", "Learning"],
    image: require("@/assets/images/Home/wooden-toy-train.png"),
    rating: 4.9,
    ratingCount: 155,
    price: 499,
    originalPrice: 650,
    category: "educational-toys",
    badge: "23% OFF",
  },
  {
    id: "deal-stat-6",
    name: "High Performance Geometry & Math Set",
    tags: ["Metal Case", "Student"],
    image: require("@/assets/images/Home/baby-rattles.png"),
    rating: 4.7,
    ratingCount: 180,
    price: 220,
    originalPrice: 300,
    category: "stationery-kits",
    badge: "26% OFF",
  },
];

// ==========================================
// 5. BEAUTY TOP DEALS
// ==========================================
const BEAUTY_DEALS: DealProduct[] = [
  {
    id: "deal-b-1",
    name: "Hydrating Gentle Daily Nourishing Lotion",
    tags: ["200ml", "Moisturizing"],
    image: require("@/assets/images/Home/pampers-baby-diaper.png"),
    rating: 4.8,
    ratingCount: 340,
    price: 320,
    originalPrice: 420,
    optionsText: "2 sizes",
    category: "skin-care",
    badge: "24% OFF",
  },
  {
    id: "deal-b-2",
    name: "Fresh Herbal Fluoride-Free Toothpaste",
    tags: ["150g", "Herbal Mint"],
    image: require("@/assets/images/Home/baby-lotion-pump-pink.png"),
    rating: 4.7,
    ratingCount: 185,
    price: 180,
    originalPrice: 240,
    category: "oral-care",
    badge: "25% OFF",
  },
  {
    id: "deal-b-3",
    name: "Nourishing 2-in-1 Body Wash & Shampoo",
    tags: ["250ml", "Tear Free"],
    image: require("@/assets/images/Home/baby-care-lotion-bottle.png"),
    rating: 4.9,
    ratingCount: 290,
    price: 390,
    originalPrice: 490,
    category: "bath-body",
    badge: "20% OFF",
  },
  {
    id: "deal-b-4",
    name: "Ultra-Soft Pure Cotton Face Care Set",
    tags: ["3 Pcs", "100% Cotton"],
    image: require("@/assets/images/Home/printed-school-backpack.png"),
    rating: 4.7,
    ratingCount: 120,
    price: 260,
    originalPrice: 350,
    category: "hygiene-care",
    badge: "26% OFF",
  },
  {
    id: "deal-b-5",
    name: "Gentle Clean Soft Baby Care Wipes",
    tags: ["80 Wipes", "Gentle"],
    image: require("@/assets/images/Home/happy-smiling-baby.png"),
    rating: 4.8,
    ratingCount: 250,
    price: 210,
    originalPrice: 280,
    category: "skin-care",
    badge: "25% OFF",
  },
  {
    id: "deal-b-6",
    name: "Organic Natural Baby Soap Bar",
    tags: ["100g", "Herbal"],
    image: require("@/assets/images/Home/pampers-baby-diaper.png"),
    rating: 4.9,
    ratingCount: 190,
    price: 150,
    originalPrice: 199,
    category: "bath-body",
    badge: "25% OFF",
  },
];

// ==========================================
// 6. SNACKS TOP DEALS
// ==========================================
const SNACKS_DEALS: DealProduct[] = [
  {
    id: "deal-sn-1",
    name: "Wai Wai Roasted Instant Masala Noodles",
    tags: ["75g", "Ready to Eat"],
    image: require("@/assets/images/Home/product-waiwai.png"),
    rating: 4.8,
    ratingCount: 390,
    price: 150,
    originalPrice: 170,
    optionsText: "2 flavors",
    category: "snacks-noodles",
    badge: "12% OFF",
  },
  {
    id: "deal-sn-2",
    name: "Maggi Masala 2-Minute Quick Noodles",
    tags: ["70g", "Classic"],
    image: require("@/assets/images/Home/product-maggi.png"),
    rating: 4.9,
    ratingCount: 520,
    price: 100,
    originalPrice: 120,
    category: "snacks-noodles",
    badge: "17% OFF",
  },
  {
    id: "deal-sn-3",
    name: "2pm Hot & Spicy Korean Style Noodles",
    tags: ["100g", "Spicy"],
    image: require("@/assets/images/Home/product-2pm.png"),
    rating: 4.7,
    ratingCount: 230,
    price: 200,
    originalPrice: 240,
    category: "snacks-noodles",
    badge: "16% OFF",
  },
  {
    id: "deal-sn-4",
    name: "Crunchy Rainbow Fruit & Grain Cereals",
    tags: ["350g", "Crispy"],
    image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    rating: 4.8,
    ratingCount: 310,
    price: 320,
    originalPrice: 400,
    category: "cereals-breakfast",
    badge: "20% OFF",
  },
  {
    id: "deal-sn-5",
    name: "Pure Natural Tropical Mixed Fruit Juice",
    tags: ["1 Litre", "Sugar Free"],
    image: require("@/assets/images/Home/fresh-juice-splash.png"),
    rating: 4.8,
    ratingCount: 275,
    price: 250,
    originalPrice: 320,
    category: "juices-beverages",
    badge: "22% OFF",
  },
  {
    id: "deal-sn-6",
    name: "Fresh Hand-Picked Fruit Salad Bowl",
    tags: ["500g", "Organic"],
    image: require("@/assets/images/Home/baby-wash-duo-bottles.png"),
    rating: 4.9,
    ratingCount: 190,
    price: 280,
    originalPrice: 360,
    category: "fresh-fruits",
    badge: "22% OFF",
  },
  {
    id: "deal-sn-7",
    name: "Cadbury Dairy Milk Silk Chocolate Bar",
    tags: ["50g", "Silk"],
    image: require("@/assets/images/Home/prod-dairymilk.png"),
    rating: 4.8,
    ratingCount: 320,
    price: 250,
    originalPrice: 300,
    category: "sweet-treats",
    badge: "17% OFF",
  },
  {
    id: "deal-sn-8",
    name: "Nestle KitKat 4-Fingers Crisp Wafer",
    tags: ["38.5g", "Chocolate"],
    image: require("@/assets/images/Home/prod-kitkat.png"),
    rating: 4.9,
    ratingCount: 410,
    price: 120,
    originalPrice: 150,
    category: "sweet-treats",
    badge: "20% OFF",
  },
];

const DEALS_CATEGORY_MAP: Record<string, DealProduct[]> = {
  grocery: GROCERY_DEALS,
  kids: KIDS_DEALS,
  baby: KIDS_DEALS,
  gifting: GIFTING_DEALS,
  gifts: GIFTING_DEALS,
  gift: GIFTING_DEALS,
  stationery: STATIONERY_DEALS,
  school: STATIONERY_DEALS,
  beauty: BEAUTY_DEALS,
  snacks: SNACKS_DEALS,
};

interface TopDealsProps {
  title?: string;
  category?: "grocery" | "kids" | "gifting" | "stationery" | "beauty" | "snacks" | string;
  isDoubleRow?: boolean;
  showBanner?: boolean;
  items?: DealProduct[];
  onProductPress?: (product: DealProduct) => void;
  onAddPress?: (product: DealProduct) => void;
  onSeeMorePress?: (product: DealProduct) => void;
  onSeeAllPress?: () => void;
}

export default function TopDeals({
  title = "Top Deals",
  category = "grocery",
  isDoubleRow = true,
  showBanner = true,
  items,
  onProductPress,
  onAddPress,
  onSeeMorePress,
  onSeeAllPress,
}: TopDealsProps) {
  const allItems = items || DEALS_CATEGORY_MAP[category.toLowerCase()] || GROCERY_DEALS;

  // Chunk items into pairs for the two-row layout
  const columns: DealProduct[][] = [];
  if (isDoubleRow) {
    for (let i = 0; i < allItems.length; i += 2) {
      columns.push(allItems.slice(i, i + 2));
    }
  } else {
    allItems.forEach((item) => columns.push([item]));
  }

  const renderCard = (item: DealProduct) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.9}
      onPress={() => onProductPress?.(item)}
      style={styles.card}
    >
      {/* Product Image Area */}
      <View style={styles.imageBox}>
        {/* Discount Badge if available */}
        {item.badge ? (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : null}

        <Image
          source={item.image}
          style={styles.productImage}
          contentFit="contain"
          transition={150}
        />

        {/* Floating Green ADD Button */}
        <View style={styles.addButtonWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onAddPress?.(item)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
          {item.optionsText ? (
            <Text style={styles.optionsText}>{item.optionsText}</Text>
          ) : null}
        </View>
      </View>

      {/* Product Info Section */}
      <View style={styles.detailsContainer}>
        {/* Tags Row */}
        <View style={styles.tagsRow}>
          {item.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Product Title */}
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Star Rating Row */}
        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4].map((star) => (
              <Ionicons
                key={star}
                name="star"
                size={moderateScale(12)}
                color="#F59E0B"
              />
            ))}
            <Ionicons
              name="star-half"
              size={moderateScale(12)}
              color="#F59E0B"
            />
          </View>
          <Text style={styles.ratingCount}>({item.ratingCount})</Text>
        </View>

        {/* Pricing Row */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>Rs. {item.price}</Text>
          {item.originalPrice ? (
            <Text style={styles.originalPrice}>Rs. {item.originalPrice}</Text>
          ) : null}
        </View>

        {/* "See more like this" Pill Action Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onSeeMorePress?.(item)}
          style={styles.seeMoreButton}
        >
          <Text style={styles.seeMoreText}>See more like this</Text>
          <View style={styles.seeMoreDivider} />
          <Ionicons
            name="caret-forward"
            size={moderateScale(11)}
            color="#047857"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Section Title Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Synchronous 2-Row Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {columns.map((column, colIdx) => (
          <View key={`col-${colIdx}`} style={styles.columnContainer}>
            {column.map(renderCard)}
          </View>
        ))}
      </ScrollView>

      {/* Bottom "See all products" Thumbnail Banner */}
      {showBanner && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onSeeAllPress}
          style={styles.bannerContainer}
        >
          <Image
            source={require("@/assets/images/Home/see-all-thumb.png")}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>See all products</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={moderateScale(18)}
            color="#FFFFFF"
            style={styles.bannerChevron}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(14),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#059669",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    gap: scale(12),
  },
  columnContainer: {
    gap: moderateScale(12),
  },
  card: {
    width: scale(146),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageBox: {
    width: "100%",
    height: moderateScale(114),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: moderateScale(6),
    left: scale(6),
    backgroundColor: "#DC2626",
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    zIndex: 5,
  },
  badgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  productImage: {
    width: "76%",
    height: "76%",
  },
  addButtonWrapper: {
    position: "absolute",
    right: scale(6),
    bottom: moderateScale(6),
    alignItems: "center",
    zIndex: 6,
  },
  addButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    elevation: 2,
  },
  addButtonText: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#059669",
  },
  optionsText: {
    fontSize: moderateScale(8.5),
    color: "#64748B",
    marginTop: moderateScale(1.5),
    fontWeight: "600",
  },
  detailsContainer: {
    padding: scale(8),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(4),
    marginBottom: moderateScale(4),
  },
  tagPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: scale(5),
    paddingVertical: moderateScale(1.5),
    borderRadius: moderateScale(4),
  },
  tagText: {
    fontSize: moderateScale(9.5),
    color: "#475569",
    fontWeight: "600",
  },
  productName: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: moderateScale(16),
    minHeight: moderateScale(32),
    marginBottom: moderateScale(4),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginBottom: moderateScale(4),
  },
  starsContainer: {
    flexDirection: "row",
    gap: scale(0.5),
  },
  ratingCount: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginBottom: moderateScale(6),
  },
  currentPrice: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
  },
  originalPrice: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    paddingVertical: moderateScale(3.5),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(5),
    borderWidth: 0.5,
    borderColor: "#A7F3D0",
  },
  seeMoreText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#047857",
  },
  seeMoreDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#A7F3D0",
    marginHorizontal: scale(3),
  },
  bannerContainer: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(12),
    height: moderateScale(44),
    borderRadius: moderateScale(10),
    overflow: "hidden",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    backgroundColor: "#059669",
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.4,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  bannerChevron: {
    marginLeft: scale(6),
  },
});

