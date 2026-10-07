/**
 * Centralized BhansaMart Categories and Sub-Categories Configuration
 */

export interface CategoryStructure {
  id: string;
  name: string;
  subCategories: string[];
}

export const APP_CATEGORIES: CategoryStructure[] = [
  {
    id: "grocery-kitchen",
    name: "Grocery & Kitchen",
    subCategories: [
      "Vegetables & Fruits",
      "Atta, Rice & Dal",
      "Oil, Ghee & Masala",
      "Dairy, Bread & Eggs",
      "Bakery & Biscuits",
      "Dry Fruits & Cereals",
      "Chicken, Meat & Fish",
      "Kitchenware & Appliances",
    ],
  },
  {
    id: "snacks-drinks",
    name: "Snacks & Drinks",
    subCategories: [
      "Chips & Namkeen",
      "Sweets & Chocolates",
      "Drinks & Juices",
      "Tea, Coffee & Milk Drinks",
      "Instant Food",
      "Sauce & Spreads",
      "Paan Corner",
      "Ice Cream & More",
    ],
  },
  {
    id: "beauty-personal-care",
    name: "Beauty & Personal Care",
    subCategories: [
      "Bath & Body",
      "Hair",
      "Skin & Faces",
      "Beauty & Cosmetics",
      "Feminine Hygiene",
      "Fragrances & Deodorants",
      "Health & Pharma",
      "Sexual Wellness",
    ],
  },
  {
    id: "school-office-stationery",
    name: "School, Office & Stationery",
    subCategories: [
      "Pens & Pencils",
      "Notebooks & Diaries",
      "Markers & Highlighters",
      "Geometry & Scales",
      "Art & Craft Supplies",
      "Files & Folders",
      "Office & Desk Supplies",
      "Printer Paper & Labels",
    ],
  },
  {
    id: "baby",
    name: "Baby",
    subCategories: [
      "Baby Food",
      "Diapers & Pants",
      "Baby Care",
      "Baby Bath",
      "Baby Feeding",
      "Baby Clothing",
      "Baby Accessories",
    ],
  },
  {
    id: "gifting",
    name: "Gifting",
    subCategories: [
      "Chocolates & Sweets",
      "Men's Wear",
      "Women's Wear",
      "Dresses & Ethnic Wear",
      "Cosmetics & Hampers",
      "Electronics & Gadgets",
      "Toys & Games",
      "Kids & Baby Gifts",
    ],
  },
];

// Flat list of category names
export const CATEGORY_NAMES: string[] = APP_CATEGORIES.map((c) => c.name);

// Category to Sub-categories dictionary
export const SUB_CATEGORY_MAP: Record<string, string[]> = APP_CATEGORIES.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.subCategories;
    return acc;
  },
  {} as Record<string, string[]>
);

// Helper to get subcategories for a given category name
export const getSubCategoriesForCategory = (categoryName: string): string[] => {
  return SUB_CATEGORY_MAP[categoryName] || [];
};
