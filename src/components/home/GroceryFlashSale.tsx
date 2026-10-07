import { moderateScale, scale } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const FLASH_CARD_SVG_PATH =
  "M18 10C55 8 125 8 162 10 170 11 174 17 174 25 176 55 181.003 135.831 163.967 135.831 88.753 136.152 74.289 131.331 74.61 158.652 74.931 176.652 55 172 18 170 10 169 6 164 6 155 4 125 4 55 6 25 6 17 10 11 18 10Z";

export interface FlashSaleProduct {
  id: string;
  name: string;
  weightTag: string;
  categoryTag: string;
  image: any;
  stockLeftText?: string;
  stockProgress?: number; // 0 to 1
  rating: number;
  ratingCount: number;
  price: number;
  originalPrice: number;
  optionsText?: string;
}

// ==========================================
// 1. GROCERY FLASH SALE
// ==========================================
const GROCERY_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-g-capri",
    name: "Capri-Sun Orange Juice Pouch",
    weightTag: "200ml",
    categoryTag: "Beverage",
    image: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.35,
    rating: 4.8,
    ratingCount: 194,
    price: 85,
    originalPrice: 110,
    optionsText: "2 options",
  },
  {
    id: "flash-g-oil",
    name: "Saffola Gold Blended Cooking Oil",
    weightTag: "1L",
    categoryTag: "Cooking Oil",
    image: require("@/assets/images/Home/saffola-gold-oil.png"),
    stockLeftText: "Only 4 left !",
    stockProgress: 0.25,
    rating: 4.7,
    ratingCount: 312,
    price: 290,
    originalPrice: 350,
  },
  {
    id: "flash-g-rice",
    name: "Daawat Rozana Super Basmati Rice",
    weightTag: "5kg",
    categoryTag: "Rice & Grains",
    image: require("@/assets/images/Home/daawat-basmati-rice.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.4,
    rating: 4.9,
    ratingCount: 428,
    price: 650,
    originalPrice: 800,
  },
  {
    id: "flash-g-bacon",
    name: "Fresh Gourmet Bacon Meat Strips",
    weightTag: "250g",
    categoryTag: "Meat & Poultry",
    image: require("@/assets/images/Home/bacon-strips-meat.png"),
    stockLeftText: "Almost gone !",
    stockProgress: 0.2,
    rating: 4.6,
    ratingCount: 88,
    price: 320,
    originalPrice: 420,
  },
];

const GROCERY_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-g-maggi",
    name: "Maggi Masala 2-Minute Instant Noodles",
    weightTag: "70g",
    categoryTag: "Noodles",
    image: require("@/assets/images/Home/product-maggi.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.5,
    rating: 4.8,
    ratingCount: 512,
    price: 100,
    originalPrice: 120,
    optionsText: "3 options",
  },
  {
    id: "flash-g-cornflakes",
    name: "Kellogg's Original Crispy Corn Flakes",
    weightTag: "475g",
    categoryTag: "Cereals",
    image: require("@/assets/images/Home/cornflakes-hero.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.6,
    ratingCount: 165,
    price: 280,
    originalPrice: 350,
  },
  {
    id: "flash-g-slice",
    name: "Slice Thick Mango Juice Drink",
    weightTag: "1.2L",
    categoryTag: "Beverage",
    image: require("@/assets/images/Home/slice-mango-juice.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.45,
    rating: 4.7,
    ratingCount: 220,
    price: 160,
    originalPrice: 200,
  },
  {
    id: "flash-g-cheese",
    name: "Swiss Gourmet Creamy Cheese Wedge",
    weightTag: "200g",
    categoryTag: "Dairy",
    image: require("@/assets/images/Home/swiss-cheese-wedge.png"),
    stockLeftText: "Only 3 left !",
    stockProgress: 0.25,
    rating: 4.5,
    ratingCount: 94,
    price: 240,
    originalPrice: 300,
  },
];

// ==========================================
// 2. KIDS FLASH SALE
// ==========================================
const KIDS_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-k-molfix",
    name: "Molfix Extra Absorbent Baby Diapers",
    weightTag: "Mega Pack",
    categoryTag: "Diapers",
    image: require("@/assets/images/Home/molfix-baby-diaper.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.9,
    ratingCount: 380,
    price: 850,
    originalPrice: 1100,
    optionsText: "4 sizes",
  },
  {
    id: "flash-k-onesie",
    name: "Cute Bear Hooded Fleece Winter Onesie",
    weightTag: "6-12M",
    categoryTag: "Baby Wear",
    image: require("@/assets/images/Home/baby-winter-hooded-onesie.png"),
    stockLeftText: "Limited stock !",
    stockProgress: 0.2,
    rating: 4.8,
    ratingCount: 142,
    price: 750,
    originalPrice: 999,
  },
  {
    id: "flash-k-giraffe",
    name: "Giraffe Toddler School Bag Backpack",
    weightTag: "Toddler",
    categoryTag: "Backpacks",
    image: require("@/assets/images/Home/giraffe-kids-backpack.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.4,
    rating: 4.7,
    ratingCount: 95,
    price: 490,
    originalPrice: 650,
  },
  {
    id: "flash-k-rattles",
    name: "Soft Grip Sensory Baby Rattles Duo",
    weightTag: "Set of 2",
    categoryTag: "Toys",
    image: require("@/assets/images/Home/baby-rattles.png"),
    stockLeftText: "Almost gone !",
    stockProgress: 0.25,
    rating: 4.6,
    ratingCount: 110,
    price: 199,
    originalPrice: 299,
  },
];

const KIDS_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-k-paw",
    name: "Paw Patrol Puppies Hero Figurines",
    weightTag: "6 Pack",
    categoryTag: "Toys",
    image: require("@/assets/images/Home/paw-patrol-figurines.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.35,
    rating: 4.8,
    ratingCount: 215,
    price: 550,
    originalPrice: 750,
  },
  {
    id: "flash-k-wipes",
    name: "Gentle Skin Purified Baby Wet Wipes",
    weightTag: "80 Wipes",
    categoryTag: "Baby Care",
    image: require("@/assets/images/Home/baby-wipes-pack.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.6,
    rating: 4.7,
    ratingCount: 340,
    price: 180,
    originalPrice: 250,
  },
  {
    id: "flash-k-pinkbag",
    name: "Pink Cartoon Ergonomic School Bag",
    weightTag: "Large",
    categoryTag: "Backpacks",
    image: require("@/assets/images/Home/pink-cartoon-backpack.png"),
    stockLeftText: "Only 5 left !",
    stockProgress: 0.3,
    rating: 4.8,
    ratingCount: 180,
    price: 690,
    originalPrice: 890,
  },
  {
    id: "flash-k-bottle",
    name: "Kids Sipper Straw Insulated Water Bottle",
    weightTag: "500ml",
    categoryTag: "School",
    image: require("@/assets/images/Home/kids-water-bottle-sipper.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.45,
    rating: 4.6,
    ratingCount: 125,
    price: 350,
    originalPrice: 480,
  },
];

// ==========================================
// 3. GIFTING FLASH SALE
// ==========================================
const GIFTING_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-g-dairymilk",
    name: "Cadbury Dairy Milk Silk Chocolate Bar",
    weightTag: "150g",
    categoryTag: "Chocolates",
    image: require("@/assets/images/Home/prod-dairymilk.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.9,
    ratingCount: 620,
    price: 175,
    originalPrice: 220,
  },
  {
    id: "flash-g-giftset",
    name: "Luxury Pink Skincare & Cosmetics Gift Set",
    weightTag: "5-in-1",
    categoryTag: "Gift Hampers",
    image: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    stockLeftText: "Only 2 left !",
    stockProgress: 0.15,
    rating: 4.9,
    ratingCount: 98,
    price: 1450,
    originalPrice: 1999,
  },
  {
    id: "flash-g-bouquet",
    name: "Romantic Elegance Floral Gift Bouquet",
    weightTag: "Deluxe",
    categoryTag: "Flowers",
    image: require("@/assets/images/Home/gift-flower-bouquet.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.25,
    rating: 4.8,
    ratingCount: 145,
    price: 890,
    originalPrice: 1200,
  },
  {
    id: "flash-g-kitkat",
    name: "Nestlé KitKat 4-Finger Crispy Wafers",
    weightTag: "45g",
    categoryTag: "Chocolates",
    image: require("@/assets/images/Home/prod-kitkat.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.5,
    rating: 4.7,
    ratingCount: 310,
    price: 60,
    originalPrice: 80,
  },
];

const GIFTING_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-g-perfume",
    name: "Belle Luxury Purple Eau De Parfum",
    weightTag: "100ml",
    categoryTag: "Fragrance",
    image: require("@/assets/images/Home/luxury-purple-perfume.png"),
    stockLeftText: "Almost gone !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 160,
    price: 1250,
    originalPrice: 1700,
  },
  {
    id: "flash-g-basket",
    name: "Grooming & Bath Deluxe Gift Basket",
    weightTag: "Deluxe",
    categoryTag: "Gift Hampers",
    image: require("@/assets/images/Home/gift-basket-care.png"),
    stockLeftText: "Only 3 left !",
    stockProgress: 0.3,
    rating: 4.8,
    ratingCount: 74,
    price: 1100,
    originalPrice: 1500,
  },
  {
    id: "flash-g-nutties",
    name: "Cadbury Nutties Milk Chocolate Balls",
    weightTag: "30g",
    categoryTag: "Sweets",
    image: require("@/assets/images/Home/prod-nutties.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.4,
    rating: 4.6,
    ratingCount: 220,
    price: 95,
    originalPrice: 125,
  },
  {
    id: "flash-g-gems",
    name: "Cadbury Gems Colorful Candy Surprise",
    weightTag: "25g",
    categoryTag: "Candy",
    image: require("@/assets/images/Home/prod-gems.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.55,
    rating: 4.7,
    ratingCount: 190,
    price: 40,
    originalPrice: 50,
  },
];

// ==========================================
// 4. STATIONERY FLASH SALE
// ==========================================
const STATIONERY_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-s-paper",
    name: "Double A Premium A4 Multipurpose Paper",
    weightTag: "500 Shts",
    categoryTag: "Paper",
    image: require("@/assets/images/Home/double-a-paper-reams.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.4,
    rating: 4.9,
    ratingCount: 460,
    price: 420,
    originalPrice: 550,
  },
  {
    id: "flash-s-pen",
    name: "Executive Metallic Nib Fountain Pen",
    weightTag: "Fine Nib",
    categoryTag: "Pens",
    image: require("@/assets/images/Home/executive-fountain-pen.png"),
    stockLeftText: "Only 3 left !",
    stockProgress: 0.25,
    rating: 4.8,
    ratingCount: 112,
    price: 350,
    originalPrice: 499,
  },
  {
    id: "flash-s-holder",
    name: "Metal Mesh Desk Pen & Pencil Holder",
    weightTag: "1 Unit",
    categoryTag: "Desk Org",
    image: require("@/assets/images/Home/stationery-pen-holder.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.5,
    rating: 4.6,
    ratingCount: 88,
    price: 140,
    originalPrice: 200,
  },
  {
    id: "flash-s-backpack",
    name: "Graphic Printed Student School Backpack",
    weightTag: "Ergonomic",
    categoryTag: "Bags",
    image: require("@/assets/images/Home/printed-school-backpack.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.7,
    ratingCount: 135,
    price: 850,
    originalPrice: 1150,
  },
];

const STATIONERY_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-s-pencils",
    name: "Artist Grade Soft Colored Pencils Set",
    weightTag: "24 Pack",
    categoryTag: "Art & Craft",
    image: require("@/assets/images/Home/colored-pencils-row.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.35,
    rating: 4.8,
    ratingCount: 175,
    price: 210,
    originalPrice: 290,
  },
  {
    id: "flash-s-ballpens",
    name: "Executive Smooth Black Ballpoint Pens",
    weightTag: "Pack of 5",
    categoryTag: "Pens",
    image: require("@/assets/images/Home/black-ballpoint-pens.jpg"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.45,
    rating: 4.7,
    ratingCount: 280,
    price: 120,
    originalPrice: 160,
  },
  {
    id: "flash-s-clipboard",
    name: "Sturdy Office Document Clipboards Set",
    weightTag: "3 Pack",
    categoryTag: "Office",
    image: require("@/assets/images/Home/office-document-clipboards.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.3,
    rating: 4.6,
    ratingCount: 92,
    price: 275,
    originalPrice: 380,
  },
  {
    id: "flash-s-sticky",
    name: "Multicolor Sticky Notes & Index Tabs",
    weightTag: "Assorted",
    categoryTag: "Notes",
    image: require("@/assets/images/Home/notebooks-sticky-notes.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.6,
    rating: 4.8,
    ratingCount: 210,
    price: 90,
    originalPrice: 130,
  },
];

// ==========================================
// 5. BEAUTY FLASH SALE
// ==========================================
const BEAUTY_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-b-perfume",
    name: "Belle Luxury Purple Eau De Parfum",
    weightTag: "100ml",
    categoryTag: "Fragrance",
    image: require("@/assets/images/Home/luxury-purple-perfume.png"),
    stockLeftText: "Almost gone !",
    stockProgress: 0.2,
    rating: 4.9,
    ratingCount: 230,
    price: 1299,
    originalPrice: 1799,
  },
  {
    id: "flash-b-creams",
    name: "Hydrating Day & Night Face Cream Jars",
    weightTag: "3-Piece",
    categoryTag: "Skincare",
    image: require("@/assets/images/Home/skincare-cream-jars-bottles.png"),
    stockLeftText: "Only 4 left !",
    stockProgress: 0.3,
    rating: 4.8,
    ratingCount: 165,
    price: 680,
    originalPrice: 920,
  },
  {
    id: "flash-b-lipstick",
    name: "Velvet Matte Moisture Red Lipstick",
    weightTag: "4.5g",
    categoryTag: "Makeup",
    image: require("@/assets/images/Home/red-lipstick-tube.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.4,
    rating: 4.7,
    ratingCount: 310,
    price: 320,
    originalPrice: 450,
  },
  {
    id: "flash-b-blush",
    name: "Silky Smooth Compact Blush & Mirror",
    weightTag: "12g",
    categoryTag: "Makeup",
    image: require("@/assets/images/Home/makeup-blush-compact.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.25,
    rating: 4.6,
    ratingCount: 140,
    price: 290,
    originalPrice: 400,
  },
];

const BEAUTY_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-b-giftset",
    name: "Complete Skincare & Cosmetics Gift Set",
    weightTag: "Deluxe",
    categoryTag: "Skincare",
    image: require("@/assets/images/Home/skincare-cosmetics-gift-set.png"),
    stockLeftText: "Almost sold out !",
    stockProgress: 0.15,
    rating: 4.9,
    ratingCount: 180,
    price: 1350,
    originalPrice: 1850,
  },
  {
    id: "flash-b-colgate",
    name: "Colgate Max Fresh Cooling Toothpaste",
    weightTag: "150g",
    categoryTag: "Oral Care",
    image: require("@/assets/images/Home/toothpaste-colgate.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.55,
    rating: 4.8,
    ratingCount: 420,
    price: 115,
    originalPrice: 150,
  },
  {
    id: "flash-b-wash",
    name: "Himalaya Gentle Refreshing Body Wash",
    weightTag: "400ml",
    categoryTag: "Bath & Body",
    image: require("@/assets/images/Home/himalaya-baby-wash.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.35,
    rating: 4.7,
    ratingCount: 290,
    price: 260,
    originalPrice: 340,
  },
  {
    id: "flash-b-brush",
    name: "Soft Bristle Professional Powder Brush",
    weightTag: "1 Unit",
    categoryTag: "Tools",
    image: require("@/assets/images/Home/makeup-powder-brush.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.5,
    rating: 4.6,
    ratingCount: 95,
    price: 180,
    originalPrice: 250,
  },
];

// ==========================================
// 6. SNACKS FLASH SALE
// ==========================================
const SNACKS_ROW1: FlashSaleProduct[] = [
  {
    id: "flash-sn-waiwai",
    name: "Wai Wai Quick Chicken Masala Noodles",
    weightTag: "75g",
    categoryTag: "Noodles",
    image: require("@/assets/images/Home/product-waiwai.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.4,
    rating: 4.8,
    ratingCount: 680,
    price: 25,
    originalPrice: 30,
  },
  {
    id: "flash-sn-capri",
    name: "Capri-Sun Orange Refreshing Drink",
    weightTag: "200ml",
    categoryTag: "Juices",
    image: require("@/assets/images/Home/capri-sun-orange-juice.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.3,
    rating: 4.7,
    ratingCount: 240,
    price: 80,
    originalPrice: 100,
  },
  {
    id: "flash-sn-2pm",
    name: "2pm Hot & Spicy Fire Instant Noodles",
    weightTag: "100g",
    categoryTag: "Noodles",
    image: require("@/assets/images/Home/product-2pm.png"),
    stockLeftText: "Hot item !",
    stockProgress: 0.25,
    rating: 4.8,
    ratingCount: 390,
    price: 65,
    originalPrice: 80,
  },
  {
    id: "flash-sn-bacon",
    name: "Crispy Savory Smoked Bacon Strips",
    weightTag: "200g",
    categoryTag: "Quick Bites",
    image: require("@/assets/images/Home/bacon-strips-meat.png"),
    stockLeftText: "Limited stock !",
    stockProgress: 0.2,
    rating: 4.6,
    ratingCount: 115,
    price: 290,
    originalPrice: 380,
  },
];

const SNACKS_ROW2: FlashSaleProduct[] = [
  {
    id: "flash-sn-maggi",
    name: "Maggi Masala 2-Minute Instant Noodles",
    weightTag: "70g",
    categoryTag: "Noodles",
    image: require("@/assets/images/Home/product-maggi.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.5,
    rating: 4.9,
    ratingCount: 750,
    price: 100,
    originalPrice: 120,
  },
  {
    id: "flash-sn-slice",
    name: "Slice Sweet Mango Beverage Bottle",
    weightTag: "1.2L",
    categoryTag: "Juices",
    image: require("@/assets/images/Home/slice-mango-juice.png"),
    stockLeftText: "Selling fast !",
    stockProgress: 0.45,
    rating: 4.7,
    ratingCount: 310,
    price: 155,
    originalPrice: 195,
  },
  {
    id: "flash-sn-munch",
    name: "Nestlé Munch Crunchy Chocolate Bar",
    weightTag: "30g",
    categoryTag: "Chocolates",
    image: require("@/assets/images/Home/prod-munch.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.6,
    rating: 4.8,
    ratingCount: 420,
    price: 20,
    originalPrice: 25,
  },
  {
    id: "flash-sn-cereal",
    name: "Rainbow Fruit Loops Breakfast Bowl",
    weightTag: "375g",
    categoryTag: "Cereals",
    image: require("@/assets/images/Home/rainbow-fruit-cereal-bowl.png"),
    stockLeftText: "Few pieces left !",
    stockProgress: 0.35,
    rating: 4.7,
    ratingCount: 160,
    price: 240,
    originalPrice: 320,
  },
];

const FLASH_CATEGORY_MAP: Record<
  string,
  {
    title: string;
    subtitle: string;
    row1: FlashSaleProduct[];
    row2: FlashSaleProduct[];
  }
> = {
  grocery: {
    title: "Grocery Flash Sale",
    subtitle: "Hurry! Fresh grocery deals that disappear in a flash.",
    row1: GROCERY_ROW1,
    row2: GROCERY_ROW2,
  },
  kids: {
    title: "Kids & Baby Flash Sale",
    subtitle: "Limited-time deals on baby gear, toys & essentials.",
    row1: KIDS_ROW1,
    row2: KIDS_ROW2,
  },
  baby: {
    title: "Kids & Baby Flash Sale",
    subtitle: "Limited-time deals on baby gear, toys & essentials.",
    row1: KIDS_ROW1,
    row2: KIDS_ROW2,
  },
  gifting: {
    title: "Gifting & Celebration Flash Sale",
    subtitle: "Grab sweet treats & gift hampers before they sell out.",
    row1: GIFTING_ROW1,
    row2: GIFTING_ROW2,
  },
  gifts: {
    title: "Gifting & Celebration Flash Sale",
    subtitle: "Grab sweet treats & gift hampers before they sell out.",
    row1: GIFTING_ROW1,
    row2: GIFTING_ROW2,
  },
  gift: {
    title: "Gifting & Celebration Flash Sale",
    subtitle: "Grab sweet treats & gift hampers before they sell out.",
    row1: GIFTING_ROW1,
    row2: GIFTING_ROW2,
  },
  stationery: {
    title: "Stationery & Office Flash Sale",
    subtitle: "Exclusive limited-time discounts on school & desk essentials.",
    row1: STATIONERY_ROW1,
    row2: STATIONERY_ROW2,
  },
  school: {
    title: "Stationery & Office Flash Sale",
    subtitle: "Exclusive limited-time discounts on school & desk essentials.",
    row1: STATIONERY_ROW1,
    row2: STATIONERY_ROW2,
  },
  beauty: {
    title: "Beauty & Care Flash Sale",
    subtitle: "Unbeatable flash discounts on skincare, cosmetics & fragrances.",
    row1: BEAUTY_ROW1,
    row2: BEAUTY_ROW2,
  },
  snacks: {
    title: "Snacks & Drinks Flash Sale",
    subtitle: "Snack more, spend less! Lightning deals on your favorites.",
    row1: SNACKS_ROW1,
    row2: SNACKS_ROW2,
  },
};

interface GroceryFlashSaleProps {
  category?:
    | "grocery"
    | "kids"
    | "gifting"
    | "stationery"
    | "beauty"
    | "snacks"
    | string;
  title?: string;
  subtitle?: string;
  row1Data?: FlashSaleProduct[];
  row2Data?: FlashSaleProduct[];
  onProductPress?: (product: FlashSaleProduct) => void;
  onAddPress?: (product: FlashSaleProduct) => void;
  onSeeAllPress?: () => void;
}

export default function GroceryFlashSale({
  category = "grocery",
  title,
  subtitle,
  row1Data,
  row2Data,
  onProductPress,
  onAddPress,
  onSeeAllPress,
}: GroceryFlashSaleProps) {
  const catConfig =
    FLASH_CATEGORY_MAP[category.toLowerCase()] || FLASH_CATEGORY_MAP.grocery;

  const displayTitle = title || catConfig.title;
  const displaySubtitle = subtitle || catConfig.subtitle;
  const displayRow1 = row1Data || catConfig.row1;
  const displayRow2 = row2Data || catConfig.row2;

  const renderProductCard = (item: FlashSaleProduct) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.9}
      onPress={() => onProductPress?.(item)}
      style={styles.card}
    >
      {/* Product Image Container with Custom SVG Path Background */}
      <View style={styles.imageBox}>
        {/* Custom SVG Path Canvas */}
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 186 180"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Path d={FLASH_CARD_SVG_PATH} fill="#FFFFFF" />
        </Svg>

        {/* Product Image inside the SVG Canvas */}
        <View style={styles.imageInnerWrapper}>
          <Image
            source={item.image}
            style={styles.productImage}
            contentFit="contain"
            transition={150}
          />
        </View>

        {/* ADD Button in the Left Bottom Corner of the SVG */}
        <View style={styles.addButtonWrapperLeft}>
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

      {/* Stock Warning Progress Indicator */}
      {item.stockLeftText ? (
        <View style={styles.stockContainer}>
          <Text style={styles.stockText}>{item.stockLeftText}</Text>
          <View style={styles.stockProgressBarBg}>
            <View
              style={[
                styles.stockProgressBarFill,
                { width: `${(item.stockProgress || 0.4) * 100}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{item.weightTag}</Text>
          </View>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{item.categoryTag}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Ratings */}
        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4].map((star) => (
              <Ionicons
                key={star}
                name="star"
                size={moderateScale(12.5)}
                color="#F59E0B"
              />
            ))}
            <Ionicons
              name="star-half"
              size={moderateScale(12.5)}
              color="#F59E0B"
            />
          </View>
          <Text style={styles.ratingCount}>({item.ratingCount})</Text>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>Rs. {item.price}</Text>
          <Text style={styles.originalPrice}>Rs. {item.originalPrice}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.peachCard}>
        {/* Header Title & Subtitle */}
        <Text style={styles.mainHeader}>{displayTitle}</Text>
        <Text style={styles.subHeader}>{displaySubtitle}</Text>

        {/* Row 1 Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayRow1.map(renderProductCard)}
        </ScrollView>

        {/* Row 2 Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { marginTop: scale(14) },
          ]}
        >
          {displayRow2.map(renderProductCard)}
        </ScrollView>

        {/* Bottom See All Banner (White Container) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onSeeAllPress}
          style={styles.seeAllBanner}
        >
          <Image
            source={require("@/assets/images/Home/see-all-thumb.png")}
            style={styles.seeAllThumbImage}
            contentFit="contain"
          />
          <Text style={styles.seeAllBannerText}>See all products</Text>
          <Ionicons
            name="caret-forward"
            size={moderateScale(15)}
            color="#284860"
            style={styles.seeAllArrow}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: scale(14),
    marginVertical: moderateScale(14),
  },
  peachCard: {
    backgroundColor: "#FCEEE7",
    borderRadius: scale(16),
    paddingVertical: moderateScale(18),
    paddingHorizontal: scale(12),
  },
  mainHeader: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#E2583E",
    letterSpacing: -0.4,
    marginBottom: scale(2),
  },
  subHeader: {
    fontSize: moderateScale(13),
    color: "#2C3E50",
    fontWeight: "500",
    marginBottom: moderateScale(16),
  },
  scrollContent: {
    gap: scale(10),
  },
  card: {
    width: scale(145),
  },
  imageBox: {
    width: scale(145),
    height: scale(140),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageInnerWrapper: {
    width: "74%",
    height: "68%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(-8),
    marginRight: scale(-4),
    zIndex: 2,
  },
  productImage: {
    width: "90%",
    height: "90%",
  },
  addButtonWrapperLeft: {
    position: "absolute",
    bottom: scale(4),
    left: scale(66),
    alignItems: "flex-end",
    zIndex: 10,
  },
  addButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#43784A",
    paddingHorizontal: scale(14),
    paddingVertical: scale(3.5),
    borderRadius: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#3F784C",
  },
  optionsText: {
    fontSize: moderateScale(8.5),
    color: "#556987",
    fontWeight: "600",
    marginTop: scale(1),
  },
  stockContainer: {
    marginTop: scale(12),
    marginBottom: scale(4),
  },
  stockText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    color: "#222222",
    marginBottom: scale(2),
  },
  stockProgressBarBg: {
    width: "85%",
    height: scale(2.5),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(2),
    overflow: "hidden",
  },
  stockProgressBarFill: {
    height: "100%",
    backgroundColor: "#E2583E",
    borderRadius: scale(2),
  },
  detailsContainer: {
    marginTop: scale(2),
  },
  tagsRow: {
    flexDirection: "row",
    gap: scale(4),
    marginBottom: scale(4),
  },
  tagPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  tagText: {
    fontSize: moderateScale(9.5),
    fontWeight: "600",
    color: "#475569",
  },
  productTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: moderateScale(16),
    minHeight: moderateScale(32),
    marginBottom: scale(3),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: scale(3),
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(1),
  },
  ratingCount: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  currentPrice: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  originalPrice: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  seeAllBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    marginTop: moderateScale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  seeAllThumbImage: {
    width: scale(60),
    height: scale(32),
    marginRight: scale(10),
  },
  seeAllBannerText: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#284860",
    letterSpacing: -0.2,
  },
  seeAllArrow: {
    marginLeft: scale(4),
  },
});
