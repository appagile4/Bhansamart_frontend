import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createProduct,
  fetchProductById,
  updateProduct,
} from "@/store/slices/productSlice";
import { fetchBrands, fetchAttributes } from "@/store/slices/brandSlice";
import { fetchBrandsApi, BrandItem } from "@/store/services/brandService";
import AddBrandModal from "@/components/VendorComponent/AddBrandModal";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORY_NAMES, SUB_CATEGORY_MAP } from "@/constants/categories";

interface ProductVariant {
  id: string;
  type: string;
  weightUnit: string;
  weightValue: string;
  color: string;
}

const CATEGORY_OPTIONS = CATEGORY_NAMES;

const SUPPLIER_OPTIONS = [
  "Bhansa Direct Wholesalers",
  "Himalayan Organic Farms",
  "Valley Agro Suppliers",
  "Nepal Agri Distributors",
  "Kathmandu Grocery Hub",
];

const BRAND_OPTIONS = [
  "Bhansa Mart Choice",
  "Himalayan Gold",
  "Organic Valley",
  "Annapurna",
  "Dhara Pure",
  "Tata Tea & Salt",
  "Generic / Store Brand",
];

const DEFAULT_CATEGORY_BRANDS: Record<
  string,
  Array<{ _id: string; name: string; description: string; logo: string; categories: string[]; status: "APPROVED"; slug: string }>
> = {
  "Grocery & Kitchen": [
    { _id: "cat_gk_amul", name: "Amul", slug: "amul", description: "The Taste of India - Dairy products and staples", logo: "https://logo.clearbit.com/amul.com", categories: ["Grocery & Kitchen", "Snacks & Drinks"], status: "APPROVED" },
    { _id: "cat_gk_nestle", name: "Nestle", slug: "nestle", description: "Good food, Good life - Nutrition, health and wellness", logo: "https://logo.clearbit.com/nestle.com", categories: ["Grocery & Kitchen", "Snacks & Drinks", "Baby"], status: "APPROVED" },
    { _id: "cat_gk_tata", name: "Tata Sampann", slug: "tata-sampann", description: "Wholesome natural food products by Tata", logo: "https://logo.clearbit.com/tataconsumer.com", categories: ["Grocery & Kitchen"], status: "APPROVED" },
    { _id: "cat_gk_dabur", name: "Dabur", slug: "dabur", description: "Science-based Ayurvedic healthcare and nutrition", logo: "https://logo.clearbit.com/dabur.com", categories: ["Grocery & Kitchen", "Beauty & Personal Care"], status: "APPROVED" },
    { _id: "cat_gk_everest", name: "Everest", slug: "everest", description: "India's leading spice manufacturer", logo: "https://logo.clearbit.com/everestspices.com", categories: ["Grocery & Kitchen"], status: "APPROVED" },
    { _id: "cat_gk_fortune", name: "Fortune", slug: "fortune", description: "Cooking oils, basmati rice, atta, and pulses", logo: "https://logo.clearbit.com/fortunefoods.com", categories: ["Grocery & Kitchen"], status: "APPROVED" },
    { _id: "cat_gk_aashirvaad", name: "Aashirvaad", slug: "aashirvaad", description: "Whole wheat atta and kitchen staples", logo: "https://logo.clearbit.com/itcportal.com", categories: ["Grocery & Kitchen"], status: "APPROVED" },
  ],
  "Snacks & Drinks": [
    { _id: "cat_sd_lays", name: "Lay's", slug: "lays", description: "Crispy potato chips in diverse delicious flavors", logo: "https://logo.clearbit.com/lays.com", categories: ["Snacks & Drinks"], status: "APPROVED" },
    { _id: "cat_sd_haldiram", name: "Haldiram's", slug: "haldirams", description: "Traditional Indian sweets and savories", logo: "https://logo.clearbit.com/haldirams.com", categories: ["Snacks & Drinks"], status: "APPROVED" },
    { _id: "cat_sd_cadbury", name: "Cadbury", slug: "cadbury", description: "Iconic chocolates and confectionery", logo: "https://logo.clearbit.com/cadbury.co.uk", categories: ["Snacks & Drinks", "Gifting"], status: "APPROVED" },
    { _id: "cat_sd_cocacola", name: "Coca-Cola", slug: "coca-cola", description: "Refreshing sparkling beverages", logo: "https://logo.clearbit.com/coca-cola.com", categories: ["Snacks & Drinks"], status: "APPROVED" },
    { _id: "cat_sd_pepsi", name: "Pepsi", slug: "pepsi", description: "Cold drinks and refreshments", logo: "https://logo.clearbit.com/pepsi.com", categories: ["Snacks & Drinks"], status: "APPROVED" },
    { _id: "cat_sd_amul", name: "Amul", slug: "amul", description: "Milkshakes, ice creams and beverages", logo: "https://logo.clearbit.com/amul.com", categories: ["Grocery & Kitchen", "Snacks & Drinks"], status: "APPROVED" },
  ],
  "Beauty & Personal Care": [
    { _id: "cat_bp_nivea", name: "Nivea", slug: "nivea", description: "Skincare, body lotions and personal care", logo: "https://logo.clearbit.com/nivea.com", categories: ["Beauty & Personal Care"], status: "APPROVED" },
    { _id: "cat_bp_loreal", name: "L'Oreal", slug: "loreal", description: "Hair care, skin care and beauty products", logo: "https://logo.clearbit.com/loreal.com", categories: ["Beauty & Personal Care"], status: "APPROVED" },
    { _id: "cat_bp_himalaya", name: "Himalaya", slug: "himalaya", description: "Herbal personal care and wellness", logo: "https://logo.clearbit.com/himalayawellness.com", categories: ["Beauty & Personal Care", "Baby"], status: "APPROVED" },
    { _id: "cat_bp_dettol", name: "Dettol", slug: "dettol", description: "Antiseptic liquids, soaps and sanitization", logo: "https://logo.clearbit.com/dettol.co.uk", categories: ["Beauty & Personal Care"], status: "APPROVED" },
    { _id: "cat_bp_dabur", name: "Dabur", slug: "dabur", description: "Ayurvedic personal care and oral wellness", logo: "https://logo.clearbit.com/dabur.com", categories: ["Grocery & Kitchen", "Beauty & Personal Care"], status: "APPROVED" },
  ],
  "Baby": [
    { _id: "cat_bb_pampers", name: "Pampers", slug: "pampers", description: "Baby diapers and gentle wipes", logo: "https://logo.clearbit.com/pampers.com", categories: ["Baby"], status: "APPROVED" },
    { _id: "cat_bb_johnson", name: "Johnson's Baby", slug: "johnsons-baby", description: "Gentle baby skin and bath essentials", logo: "https://logo.clearbit.com/johnsonsbaby.com", categories: ["Baby"], status: "APPROVED" },
    { _id: "cat_bb_himalaya", name: "Himalaya", slug: "himalaya", description: "Baby wellness and gentle creams", logo: "https://logo.clearbit.com/himalayawellness.com", categories: ["Beauty & Personal Care", "Baby"], status: "APPROVED" },
    { _id: "cat_bb_nestle", name: "Nestle", slug: "nestle", description: "Infant nutrition and cereals", logo: "https://logo.clearbit.com/nestle.com", categories: ["Grocery & Kitchen", "Snacks & Drinks", "Baby"], status: "APPROVED" },
  ],
  "School, Office & Stationery": [
    { _id: "cat_so_classmate", name: "Classmate", slug: "classmate", description: "Notebooks, pens and school stationery", logo: "https://logo.clearbit.com/classmateshop.com", categories: ["School, Office & Stationery"], status: "APPROVED" },
    { _id: "cat_so_camlin", name: "Camlin", slug: "camlin", description: "Pencils, geometry boxes, and colors", logo: "https://logo.clearbit.com/kokuyocamlin.com", categories: ["School, Office & Stationery"], status: "APPROVED" },
    { _id: "cat_so_faber", name: "Faber-Castell", slug: "faber-castell", description: "Art supplies, highlighters and markers", logo: "https://logo.clearbit.com/faber-castell.com", categories: ["School, Office & Stationery"], status: "APPROVED" },
  ],
};

const DISCOUNT_CATEGORIES = [
  "No Discount",
  "Flat Amount Discount",
  "Percentage Discount",
  "Flash Deal Special",
  "Seasonal Harvest Discount",
];

const WEIGHT_UNITS = ["kg", "g", "Ltr", "ml", "Pcs", "Pack", "Box"];

export default function AddProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; edit?: string }>();
  const productId = (params.id as string) || "";
  const isEditMode = Boolean(productId);

  const dispatch = useAppDispatch();
  const { currentProduct, createLoading } = useAppSelector(
    (state) => state.product,
  );
  const {
    brands: categoryBrands,
    attributes: categoryAttributes,
    loading: brandsLoading,
  } = useAppSelector((state) => state.brand);

  // 1. General Information
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Grocery & Kitchen");
  const [subCategory, setSubCategory] = useState(
    SUB_CATEGORY_MAP["Grocery & Kitchen"][0],
  );
  const [supplierName, setSupplierName] = useState(SUPPLIER_OPTIONS[0]);
  const [expirationDate, setExpirationDate] = useState("");
  const [brand, setBrand] = useState("Generic / Store Brand");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isAddBrandModalVisible, setIsAddBrandModalVisible] = useState(false);
  const [isBrandPickerOpen, setIsBrandPickerOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string[]>
  >({});

  const [categoryBrandsList, setCategoryBrandsList] = useState<BrandItem[]>([]);
  const [isCategoryBrandsLoading, setIsCategoryBrandsLoading] = useState(false);

  // Directly load approved brands for the target category
  const loadBrandsForCategory = useCallback(
    async (catName: string) => {
      if (!catName) return;
      try {
        setIsCategoryBrandsLoading(true);
        const res = await fetchBrandsApi({ category: catName, limit: 100 });
        const items: BrandItem[] = res?.brands || res?.data || [];
        setCategoryBrandsList(items);
      } catch (err) {
        console.warn("[AddProduct] Error loading brands for category:", err);
      } finally {
        setIsCategoryBrandsLoading(false);
      }
    },
    [],
  );

  // Fetch brands and attributes whenever selected category changes
  useEffect(() => {
    if (category) {
      loadBrandsForCategory(category);
      dispatch(fetchBrands({ category, limit: 100 }));
      dispatch(fetchAttributes({ category }));
    }
  }, [category, loadBrandsForCategory, dispatch]);

  // Derived list of brands matching current category and optional search query
  const activeCategoryBrands = useMemo(() => {
    const apiList =
      categoryBrandsList && categoryBrandsList.length > 0
        ? categoryBrandsList
        : categoryBrands || [];

    const fallbackList = DEFAULT_CATEGORY_BRANDS[category] || [];

    // Merge API brands with curated presets, prioritizing real DB records
    const seenNames = new Set<string>();
    const merged: BrandItem[] = [];

    apiList.forEach((item) => {
      if (item && item.name) {
        seenNames.add(item.name.toLowerCase().trim());
        merged.push(item);
      }
    });

    fallbackList.forEach((item) => {
      if (item && item.name && !seenNames.has(item.name.toLowerCase().trim())) {
        seenNames.add(item.name.toLowerCase().trim());
        merged.push(item as unknown as BrandItem);
      }
    });

    const normCategory = (category || "").toLowerCase().trim();

    return merged.filter((b) => {
      if (b.name === "Generic / Store Brand") return false;

      // Category check
      const matchesCategory =
        !b.categories ||
        b.categories.length === 0 ||
        b.categories.some((c) => {
          const normC = c.toLowerCase().trim();
          return (
            normC === normCategory ||
            normC.includes(normCategory) ||
            normCategory.includes(normC)
          );
        });

      if (!matchesCategory) return false;

      // Search query check
      if (brandSearchQuery.trim()) {
        return b.name
          .toLowerCase()
          .includes(brandSearchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [categoryBrandsList, categoryBrands, category, brandSearchQuery]);

  // 2. Pricing
  const [basePrice, setBasePrice] = useState("");
  const [discountCategory, setDiscountCategory] = useState(
    DISCOUNT_CATEGORIES[0],
  );
  const [discountValue, setDiscountValue] = useState("");

  // 3. Variations
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: "1",
      type: "Standard",
      weightUnit: "kg",
      weightValue: "1",
      color: "Natural",
    },
  ]);

  // 4. Inventory
  const [sku, setSku] = useState(
    "BM-GROC-" + Math.floor(1000 + Math.random() * 9000),
  );
  const [stockQuantity, setStockQuantity] = useState("50");
  const [reorderLevel, setReorderLevel] = useState("10");

  // 5. Status & Visibility
  const [status, setStatus] = useState<"active" | "not_active" | "schedule">(
    "active",
  );
  const [visibility, setVisibility] = useState({
    featured: false,
    bestSellers: true,
    newArrivals: true,
  });

  // 6. Product Tags
  const [tags, setTags] = useState<string[]>(["Fresh", "Organic", "Pantry"]);
  const [newTagInput, setNewTagInput] = useState("");

  // 7. Photos / Uploads
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Fetch product on edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      dispatch(fetchProductById(productId));
    }
  }, [isEditMode, productId, dispatch]);

  // Prefill state from currentProduct
  useEffect(() => {
    if (
      isEditMode &&
      currentProduct &&
      (currentProduct._id === productId || currentProduct.id === productId) &&
      !hasPrefilled
    ) {
      setProductName(currentProduct.name || "");
      setDescription(currentProduct.description || "");
      if (currentProduct.category) setCategory(currentProduct.category);
      if (currentProduct.subCategory)
        setSubCategory(currentProduct.subCategory);
      if (currentProduct.supplierName)
        setSupplierName(currentProduct.supplierName);
      if (currentProduct.brand) setBrand(currentProduct.brand);
      if (currentProduct.brandRef) {
        const refId =
          typeof currentProduct.brandRef === "object"
            ? (currentProduct.brandRef as any)._id
            : currentProduct.brandRef;
        setSelectedBrandId(refId);
        if (
          typeof currentProduct.brandRef === "object" &&
          (currentProduct.brandRef as any).name
        ) {
          setBrand((currentProduct.brandRef as any).name);
        }
      }
      if (currentProduct.attributes && Array.isArray(currentProduct.attributes)) {
        const attrMap: Record<string, string[]> = {};
        currentProduct.attributes.forEach((attr: any) => {
          if (attr.name) {
            attrMap[attr.name] = attr.values || (attr.value ? [attr.value] : []);
          }
        });
        setSelectedAttributes(attrMap);
      }
      if (currentProduct.expirationDate)
        setExpirationDate(currentProduct.expirationDate);
      if (currentProduct.price != null)
        setBasePrice(String(currentProduct.price));
      if (currentProduct.discountCategory)
        setDiscountCategory(currentProduct.discountCategory);
      if (currentProduct.discountValue != null)
        setDiscountValue(String(currentProduct.discountValue));
      if (currentProduct.sku) setSku(currentProduct.sku);
      if (currentProduct.stock != null)
        setStockQuantity(String(currentProduct.stock));
      if (currentProduct.reorderLevel != null)
        setReorderLevel(String(currentProduct.reorderLevel));

      if (currentProduct.status) {
        const s = currentProduct.status.toLowerCase();
        if (s.includes("active") && !s.includes("not")) setStatus("active");
        else if (s.includes("schedule")) setStatus("schedule");
        else setStatus("not_active");
      }

      if (currentProduct.visibility) {
        setVisibility({
          featured: !!currentProduct.visibility.isFeatured,
          bestSellers: !!currentProduct.visibility.isBestSeller,
          newArrivals: !!currentProduct.visibility.isNewArrival,
        });
      }

      if (currentProduct.tags && Array.isArray(currentProduct.tags)) {
        setTags(currentProduct.tags);
      }

      if (
        currentProduct.variants &&
        Array.isArray(currentProduct.variants) &&
        currentProduct.variants.length > 0
      ) {
        setVariants(
          currentProduct.variants.map((v, idx) => ({
            id: v.id || String(idx + 1),
            type: v.type || "Standard",
            weightUnit: v.weightUnit || "kg",
            weightValue: v.weightValue || "1",
            color: v.color || "Natural",
          })),
        );
      }

      if (
        currentProduct.images &&
        Array.isArray(currentProduct.images) &&
        currentProduct.images.length > 0
      ) {
        setSelectedPhotos(currentProduct.images.map((img) => img.url));
      }

      setHasPrefilled(true);
    }
  }, [isEditMode, currentProduct, productId, hasPrefilled]);

  // Selector Modal state
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    options: string[];
    onSelect: (val: string) => void;
  }>({
    visible: false,
    title: "",
    options: [],
    onSelect: () => {},
  });

  // Variant operations
  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "Standard",
        weightUnit: "kg",
        weightValue: "1",
        color: "",
      },
    ]);
  };

  const removeVariantRow = (id: string) => {
    if (variants.length <= 1) {
      Alert.alert(
        "Variant Notice",
        "At least one product variant is required.",
      );
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariant = (
    id: string,
    field: keyof ProductVariant,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  // Tag operations
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setNewTagInput("");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Image Picker
  const handlePickImages = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to upload product images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        setSelectedPhotos((prev) => [...prev, ...newUris]);
      }
    } catch {
      Alert.alert("Upload Error", "Failed to select images. Please try again.");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Auto Generate SKU
  const handleGenerateSku = () => {
    const prefix = category.slice(0, 4).toUpperCase();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setSku(`BM-${prefix}-${randomCode}`);
  };

  // Validation & Submit to Backend + Cloudinary
  const handlePublish = async (saveAsDraft = false) => {
    if (!productName.trim()) {
      Alert.alert("Missing Field", "Please enter a valid Product Name.");
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        "Missing Field",
        "Please provide a short Product Description.",
      );
      return;
    }
    if (!basePrice.trim() || isNaN(parseFloat(basePrice))) {
      Alert.alert("Missing Field", "Please enter a valid Base Price (in Rs.).");
      return;
    }
    if (!stockQuantity.trim() || isNaN(parseInt(stockQuantity, 10))) {
      Alert.alert(
        "Missing Field",
        "Please enter valid initial stock quantity.",
      );
      return;
    }

    const effectiveStatus = saveAsDraft
      ? "Draft"
      : status === "active"
        ? "Active"
        : status === "schedule"
          ? "Schedule"
          : "Not Active";

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", productName.trim());
      formData.append("description", description.trim());
      formData.append("shortDescription", description.trim().slice(0, 150));
      formData.append("category", category);
      formData.append("subCategory", subCategory || "");
      formData.append("supplierName", supplierName || "");
      formData.append("brand", brand || "Generic / Store Brand");
      if (selectedBrandId && !selectedBrandId.startsWith("cat_")) {
        formData.append("brandRef", selectedBrandId);
      }
      const formattedAttrs = Object.entries(selectedAttributes)
        .filter(([_, vals]) => vals && vals.length > 0)
        .map(([name, vals]) => {
          const matched = categoryAttributes.find((ca) => ca.name === name);
          return {
            attributeId: matched?._id,
            name,
            value: vals.join(", "),
            values: vals,
          };
        });
      if (formattedAttrs.length > 0) {
        formData.append("attributes", JSON.stringify(formattedAttrs));
      }
      formData.append("expirationDate", expirationDate || "");
      formData.append("price", String(parseFloat(basePrice)));
      formData.append("originalPrice", String(parseFloat(basePrice) * 1.15));
      formData.append("discountCategory", discountCategory);
      formData.append(
        "discountValue",
        discountValue ? String(parseFloat(discountValue)) : "0",
      );
      formData.append("sku", sku.trim());
      formData.append("stock", String(parseInt(stockQuantity, 10) || 0));
      formData.append("reorderLevel", String(parseInt(reorderLevel, 10) || 5));
      formData.append(
        "unit",
        variants[0]?.weightUnit
          ? `${variants[0].weightValue} ${variants[0].weightUnit}`
          : "1 kg",
      );
      formData.append("status", effectiveStatus);
      formData.append(
        "visibility",
        JSON.stringify({
          isFeatured: visibility.featured,
          isBestSeller: visibility.bestSellers,
          isNewArrival: visibility.newArrivals,
        }),
      );
      formData.append("variants", JSON.stringify(variants));
      formData.append("tags", JSON.stringify(tags));

      // Separate existing remote images from new local files
      const existingImages = selectedPhotos.filter(
        (p) => p.startsWith("http://") || p.startsWith("https://"),
      );
      const newPhotos = selectedPhotos.filter(
        (p) => !p.startsWith("http://") && !p.startsWith("https://"),
      );

      formData.append("existingImages", JSON.stringify(existingImages));

      // Append new image files for Cloudinary upload
      if (newPhotos && newPhotos.length > 0) {
        newPhotos.forEach((uri, index) => {
          const filename = uri.split("/").pop() || `product_photo_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const ext = match ? match[1].toLowerCase() : "jpg";
          const mimeType =
            ext === "png"
              ? "image/png"
              : ext === "webp"
                ? "image/webp"
                : "image/jpeg";

          formData.append("images", {
            uri,
            name: filename,
            type: mimeType,
          } as any);
        });
      }

      if (isEditMode && productId) {
        const result = await dispatch(
          updateProduct({ id: productId, data: formData }),
        ).unwrap();

        Alert.alert(
          "Product Updated!",
          result?.name
            ? `"${result.name}" has been updated successfully.`
            : "Product details have been saved successfully.",
          [
            {
              text: "Done",
              onPress: () => router.back(),
            },
          ],
        );
      } else {
        const result = await dispatch(createProduct(formData)).unwrap();

        Alert.alert(
          saveAsDraft ? "Draft Saved!" : "Product Published!",
          result.message ||
            `"${productName.trim()}" has been stored in MongoDB and images uploaded to Cloudinary successfully.`,
          [
            {
              text: "View Products",
              onPress: () => router.back(),
            },
          ],
        );
      }
    } catch (err: any) {
      console.log("Update Error:", err);

      Alert.alert(
        isEditMode ? "Update Failed" : "Product Creation Failed",
        err ||
          "Could not save product. Please check your network and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPicker = (
    title: string,
    options: string[],
    onSelect: (val: string) => void,
  ) => {
    setPickerModal({
      visible: true,
      title,
      options,
      onSelect: (val) => {
        onSelect(val);
        setPickerModal((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginHorizontal: scale(10) }}>
          <Text style={styles.topBarTitle}>
            {isEditMode ? "Edit Product" : "Add New Product"}
          </Text>
          <Text style={styles.topBarSubtitle}>
            {isEditMode ? "Update product details" : "Create catalog item"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handlePublish(false)}
          disabled={isSubmitting}
          style={[styles.publishTopBtn, isSubmitting && { opacity: 0.7 }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check-decagram"
                size={scale(15)}
                color="#86C4CB"
              />
              <Text style={styles.publishTopBtnText}>
                {isEditMode ? "Save" : "Publish"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= CARD 1: GENERAL INFORMATION ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="information-outline"
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.cardTitle}>General Information</Text>
            </View>

            <View style={styles.cardBody}>
              {/* Product Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Product Name <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  placeholder="Enter your Product Name"
                  placeholderTextColor="#94A3B8"
                  value={productName}
                  onChangeText={setProductName}
                  style={styles.textInput}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Description <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  placeholder="Enter detailed product description, ingredients, benefits..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              {/* Category & Sub-Category Row */}
              <View style={styles.twoColRow}>
                {/* Category */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Product Category <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      openPicker("Select Category", CATEGORY_OPTIONS, (val) => {
                        setCategory(val);
                        const subCats = SUB_CATEGORY_MAP[val] || [];
                        if (subCats.length > 0) setSubCategory(subCats[0]);
                        // Instantly refresh brands and attributes for the chosen category
                        setBrand("Generic / Store Brand");
                        setSelectedBrandId(null);
                        loadBrandsForCategory(val);
                        dispatch(fetchBrands({ category: val, limit: 100 }));
                        dispatch(fetchAttributes({ category: val }));
                      })
                    }
                    style={styles.dropdownBox}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {category}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={scale(15)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                {/* Sub-Category */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Product Sub-Category <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      openPicker(
                        "Select Sub-Category",
                        SUB_CATEGORY_MAP[category] || ["General"],
                        setSubCategory,
                      )
                    }
                    style={styles.dropdownBox}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {subCategory}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={scale(15)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Supplier Name, Expiration Date & Brand Row */}
              <View style={styles.threeColRow}>
                {/* Supplier */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Supplier Name <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      openPicker(
                        "Select Supplier",
                        SUPPLIER_OPTIONS,
                        setSupplierName,
                      )
                    }
                    style={styles.dropdownBox}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {supplierName}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={scale(14)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                {/* Expiration Date */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Expiration Date</Text>
                  <View style={styles.dateInputBox}>
                    <TextInput
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#94A3B8"
                      value={expirationDate}
                      onChangeText={setExpirationDate}
                      style={styles.dateTextInput}
                    />
                    <Feather name="calendar" size={scale(14)} color="#94A3B8" />
                  </View>
                </View>

                {/* Brand */}
                <View style={styles.col}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: scale(2),
                    }}
                  >
                    <Text style={styles.inputLabel}>Brand</Text>
                    <TouchableOpacity
                      onPress={() => setIsAddBrandModalVisible(true)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                    >
                      <Feather name="plus-circle" size={scale(11)} color="#016073" />
                      <Text
                        style={{
                          fontSize: moderateScale(10),
                          color: "#016073",
                          fontWeight: "700",
                        }}
                      >
                        + Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      loadBrandsForCategory(category);
                      setIsBrandPickerOpen(true);
                    }}
                    style={styles.dropdownBox}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {brand || "Select Brand"}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={scale(14)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ================= CARD 1.5: ATTRIBUTES & SPECIFICATIONS ================= */}
          {categoryAttributes && categoryAttributes.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="sliders" size={scale(18)} color="#016073" />
                <Text style={styles.cardTitle}>Attributes & Specifications</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.attributesHelpText}>
                  Select applicable attribute values for this product ({category}):
                </Text>

                {categoryAttributes.map((attr) => {
                  const currentVals = selectedAttributes[attr.name] || [];
                  return (
                    <View key={attr._id} style={styles.attrInputSection}>
                      <Text style={styles.attrSectionLabel}>{attr.name}</Text>
                      <View style={styles.attrPillWrap}>
                        {attr.values.map((v) => {
                          const isPicked = currentVals.includes(v);
                          return (
                            <TouchableOpacity
                              key={v}
                              onPress={() => {
                                setSelectedAttributes((prev) => {
                                  const existing = prev[attr.name] || [];
                                  const nextVals = existing.includes(v)
                                    ? existing.filter((item) => item !== v)
                                    : [...existing, v];
                                  return { ...prev, [attr.name]: nextVals };
                                });
                              }}
                              style={[
                                styles.attrPill,
                                isPicked && styles.attrPillSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.attrPillText,
                                  isPicked && styles.attrPillTextSelected,
                                ]}
                              >
                                {isPicked ? `✓ ${v}` : v}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ================= CARD 2: UPLOAD PHOTOS ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.cardTitle}>Upload Photos</Text>
            </View>

            <View style={styles.cardBody}>
              {/* Dropzone Box */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickImages}
                style={styles.dropzoneBox}
              >
                <View style={styles.cloudIconCircle}>
                  <Feather
                    name="upload-cloud"
                    size={scale(24)}
                    color="#016073"
                  />
                </View>
                <Text style={styles.dropzoneTitle}>Upload product photos</Text>
                <Text style={styles.dropzoneSubtitle}>
                  JPEG, PNG, PDG, and MP4 formats, up to 50MB
                </Text>

                <View style={styles.browseBtn}>
                  <Text style={styles.browseBtnText}>Browse File</Text>
                </View>
              </TouchableOpacity>

              {/* Photos Gallery Previews */}
              {selectedPhotos.length > 0 && (
                <View style={styles.photosPreviewGrid}>
                  {selectedPhotos.map((uri, idx) => (
                    <View key={idx} style={styles.photoThumbWrap}>
                      <Image
                        source={{ uri }}
                        style={styles.photoThumb}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemovePhoto(idx)}
                        style={styles.removePhotoBtn}
                      >
                        <Ionicons
                          name="close"
                          size={scale(13)}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                      {idx === 0 && (
                        <View style={styles.primaryPhotoTag}>
                          <Text style={styles.primaryPhotoTagText}>Cover</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ================= CARD 3: PRICING ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.cardTitle}>Pricing</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.twoColRow}>
                {/* Base Price */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Base Price <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <View style={styles.currencyInputBox}>
                    <View style={styles.currencyPrefix}>
                      <Text style={styles.currencyPrefixText}>Rs.</Text>
                    </View>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={basePrice}
                      onChangeText={setBasePrice}
                      style={styles.currencyTextInput}
                    />
                  </View>
                </View>

                {/* Discount Category */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Discount Category <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      openPicker(
                        "Select Discount Category",
                        DISCOUNT_CATEGORIES,
                        setDiscountCategory,
                      )
                    }
                    style={styles.dropdownBox}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {discountCategory}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={scale(15)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Discount Value input when discount selected */}
              {discountCategory !== "No Discount" && (
                <View style={{ marginTop: moderateScale(10) }}>
                  <Text style={styles.inputLabel}>Discount Value</Text>
                  <TextInput
                    placeholder="e.g. 10% or Rs. 50"
                    placeholderTextColor="#94A3B8"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    style={styles.textInput}
                  />
                </View>
              )}
            </View>
          </View>

          {/* ================= CARD 4: VARIATION ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="layers-outline"
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.cardTitle}>Variation</Text>
            </View>

            <View style={styles.cardBody}>
              {variants.map((v, idx) => (
                <View key={v.id} style={styles.variantRowCard}>
                  <View style={styles.variantRowInputs}>
                    {/* Variation Type */}
                    <View style={{ flex: 1.1 }}>
                      <Text style={styles.inputLabel}>
                        Variation Type <Text style={styles.reqStar}>*</Text>
                      </Text>
                      <TextInput
                        placeholder="e.g. Standard, Small"
                        placeholderTextColor="#94A3B8"
                        value={v.type}
                        onChangeText={(val) => updateVariant(v.id, "type", val)}
                        style={styles.textInputSmall}
                      />
                    </View>

                    {/* Weight & Unit */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.inputLabel}>
                        Weight / Vol <Text style={styles.reqStar}>*</Text>
                      </Text>
                      <View style={styles.weightInputGroup}>
                        <TouchableOpacity
                          onPress={() =>
                            openPicker("Select Unit", WEIGHT_UNITS, (val) =>
                              updateVariant(v.id, "weightUnit", val),
                            )
                          }
                          style={styles.unitBtn}
                        >
                          <Text style={styles.unitBtnText}>{v.weightUnit}</Text>
                          <Feather
                            name="chevron-down"
                            size={scale(12)}
                            color="#64748B"
                          />
                        </TouchableOpacity>

                        <TextInput
                          placeholder="1"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={v.weightValue}
                          onChangeText={(val) =>
                            updateVariant(v.id, "weightValue", val)
                          }
                          style={styles.weightTextInput}
                        />
                      </View>
                    </View>

                    {/* Color / Spec */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Color / Spec</Text>
                      <TextInput
                        placeholder="e.g. Natural"
                        placeholderTextColor="#94A3B8"
                        value={v.color}
                        onChangeText={(val) =>
                          updateVariant(v.id, "color", val)
                        }
                        style={styles.textInputSmall}
                      />
                    </View>

                    {/* Delete Variant Button */}
                    <TouchableOpacity
                      onPress={() => removeVariantRow(v.id)}
                      style={styles.trashBtn}
                    >
                      <Feather
                        name="trash-2"
                        size={scale(16)}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add Variant Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={addVariantRow}
                style={styles.addVariantBtn}
              >
                <Feather name="plus" size={scale(15)} color="#FFFFFF" />
                <Text style={styles.addVariantBtnText}>Add Variant</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= CARD 5: INVENTORY ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="cube-outline"
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.cardTitle}>Inventory</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.threeColRow}>
                {/* Product SKU */}
                <View style={styles.col}>
                  <View style={styles.skuHeaderRow}>
                    <Text style={styles.inputLabel}>
                      SKU <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <TouchableOpacity onPress={handleGenerateSku}>
                      <Text style={styles.skuGenLink}>Auto</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="e.g. BM-101"
                    placeholderTextColor="#94A3B8"
                    value={sku}
                    onChangeText={setSku}
                    style={styles.textInput}
                  />
                </View>

                {/* Stock Quantity */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Stock Quantity <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    placeholder="100"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    style={styles.textInput}
                  />
                </View>

                {/* Reorder Level */}
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>
                    Reorder Level <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={reorderLevel}
                    onChangeText={setReorderLevel}
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ================= CARD 6: STATUS & VISIBILITY ================= */}
          <View style={styles.twoCardRow}>
            {/* Status Card */}
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Status</Text>
              </View>

              <View style={styles.cardBody}>
                {[
                  { id: "active", label: "Active" },
                  { id: "not_active", label: "Not Active" },
                  { id: "schedule", label: "Schedule" },
                ].map((s) => {
                  const isChecked = status === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.7}
                      onPress={() => setStatus(s.id as any)}
                      style={styles.radioRow}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isChecked && styles.radioCircleActive,
                        ]}
                      >
                        {isChecked && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          isChecked && styles.radioLabelActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Visible As Card */}
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Visible as</Text>
              </View>

              <View style={styles.cardBody}>
                {[
                  { key: "featured", label: "Featured" },
                  { key: "bestSellers", label: "Best Sellers" },
                  { key: "newArrivals", label: "New Arrivals" },
                ].map((v) => {
                  const isChecked = (visibility as any)[v.key];
                  return (
                    <TouchableOpacity
                      key={v.key}
                      activeOpacity={0.7}
                      onPress={() =>
                        setVisibility((prev) => ({
                          ...prev,
                          [v.key]: !isChecked,
                        }))
                      }
                      style={styles.checkboxRow}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isChecked && styles.checkboxActive,
                        ]}
                      >
                        {isChecked && (
                          <Ionicons
                            name="checkmark"
                            size={scale(12)}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.checkboxLabel,
                          isChecked && styles.checkboxLabelActive,
                        ]}
                      >
                        {v.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ================= CARD 7: PRODUCT TAGS ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="tag-multiple-outline"
                size={scale(18)}
                color="#016073"
              />
              <Text style={styles.cardTitle}>Product Tags</Text>
            </View>

            <View style={styles.cardBody}>
              {/* Tag Add Input */}
              <View style={styles.tagInputRow}>
                <TextInput
                  placeholder="e.g. Sweet, Organic, Fresh..."
                  placeholderTextColor="#94A3B8"
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddTag}
                  style={styles.tagTextInput}
                />
                <TouchableOpacity
                  onPress={handleAddTag}
                  style={styles.addTagBtn}
                >
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Tag Chips Wrap */}
              <View style={styles.tagChipsWrap}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      style={styles.tagRemoveBtn}
                    >
                      <Ionicons name="close" size={scale(12)} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Bottom Actions Bar */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.draftBtn}
            >
              <Text style={styles.draftBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handlePublish(false)}
              disabled={isSubmitting}
              style={[styles.publishBtn, isSubmitting && { opacity: 0.7 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={scale(18)}
                    color="#86C4CB"
                  />
                  <Text style={styles.publishBtnText}>
                    {isEditMode ? "Save Changes" : "Publish Product"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* REUSABLE PICKER MODAL */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPickerModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <View style={styles.pickerModalBackdrop}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerModal.title}</Text>
              <TouchableOpacity
                onPress={() =>
                  setPickerModal((prev) => ({ ...prev, visible: false }))
                }
              >
                <Ionicons name="close" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: scale(300) }}>
              {pickerModal.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.7}
                  onPress={() => pickerModal.onSelect(opt)}
                  style={styles.pickerOptionItem}
                >
                  <Text style={styles.pickerOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DYNAMIC BRAND SELECTOR MODAL */}
      <Modal
        visible={isBrandPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBrandPickerOpen(false)}
      >
        <View style={styles.pickerModalBackdrop}>
          <View
            style={[
              styles.pickerModalCard,
              {
                height: scale(500),
                maxHeight: "85%",
                display: "flex",
                flexDirection: "column",
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                <Feather name="tag" size={scale(18)} color="#016073" />
                <Text style={styles.pickerTitle}>Select Brand ({category})</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBrandPickerOpen(false)}>
                <Ionicons name="close" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick search input */}
            <View style={styles.brandSearchBox}>
              <Feather name="search" size={scale(14)} color="#94A3B8" />
              <TextInput
                style={styles.brandSearchInput}
                placeholder="Search approved brands..."
                placeholderTextColor="#94A3B8"
                value={brandSearchQuery}
                onChangeText={setBrandSearchQuery}
              />
              {brandSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBrandSearchQuery("")}>
                  <Feather name="x-circle" size={scale(14)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Request / Add Brand banner button */}
            <TouchableOpacity
              onPress={() => {
                setIsBrandPickerOpen(false);
                setIsAddBrandModalVisible(true);
              }}
              style={styles.addBrandModalBanner}
            >
              <Feather name="plus-circle" size={scale(16)} color="#016073" />
              <View style={{ flex: 1 }}>
                <Text style={styles.addBrandBannerTitle}>+ Request / Add New Brand</Text>
                <Text style={styles.addBrandBannerSubtitle}>
                  Brand not listed? Submit request for "{category}"
                </Text>
              </View>
              <Feather name="chevron-right" size={scale(16)} color="#016073" />
            </TouchableOpacity>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: scale(24) }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {/* Default Generic / Store Brand */}
              <TouchableOpacity
                onPress={() => {
                  setBrand("Generic / Store Brand");
                  setSelectedBrandId(null);
                  setIsBrandPickerOpen(false);
                }}
                style={[
                  styles.brandOptionItem,
                  brand === "Generic / Store Brand" && styles.brandOptionItemActive,
                ]}
              >
                <View style={styles.brandAvatarPlaceholder}>
                  <Feather name="package" size={scale(16)} color="#64748B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.brandOptionName}>Generic / Store Brand</Text>
                  <Text style={styles.brandOptionDesc}>
                    Unbranded or everyday store packaged item
                  </Text>
                </View>
                {brand === "Generic / Store Brand" && (
                  <Feather name="check" size={scale(18)} color="#016073" />
                )}
              </TouchableOpacity>

              {/* Dynamic filtered brands */}
              {isCategoryBrandsLoading && activeCategoryBrands.length === 0 ? (
                <View style={{ padding: scale(20), alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#016073" />
                  <Text
                    style={{
                      fontSize: moderateScale(11),
                      color: "#64748B",
                      marginTop: scale(6),
                    }}
                  >
                    Loading brands for {category}...
                  </Text>
                </View>
              ) : activeCategoryBrands.length === 0 ? (
                <View style={{ padding: scale(20), alignItems: "center", gap: scale(6) }}>
                  <Feather name="tag" size={scale(24)} color="#94A3B8" />
                  <Text
                    style={{
                      fontSize: moderateScale(13),
                      fontWeight: "600",
                      color: "#1E293B",
                      textAlign: "center",
                    }}
                  >
                    No brands found for "{category}"
                  </Text>
                  <Text
                    style={{
                      fontSize: moderateScale(11),
                      color: "#64748B",
                      textAlign: "center",
                    }}
                  >
                    Select "Generic / Store Brand" above or tap "+ Request / Add New Brand" to submit one.
                  </Text>
                </View>
              ) : (
                activeCategoryBrands.map((b) => {
                  const isSelected = selectedBrandId === b._id || brand === b.name;
                  const logoUrl =
                    typeof b.logo === "string"
                      ? b.logo
                      : (b.logo as any)?.url || "";
                  return (
                    <TouchableOpacity
                      key={b._id}
                      onPress={() => {
                        setBrand(b.name);
                        setSelectedBrandId(b._id);
                        setIsBrandPickerOpen(false);
                      }}
                      style={[
                        styles.brandOptionItem,
                        isSelected && styles.brandOptionItemActive,
                      ]}
                    >
                      <View style={styles.brandAvatarBox}>
                        {logoUrl ? (
                          <Image
                            source={{ uri: logoUrl }}
                            style={styles.brandAvatarImage}
                            contentFit="contain"
                          />
                        ) : (
                          <Feather name="tag" size={scale(16)} color="#016073" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.brandOptionName}>{b.name}</Text>
                        {b.description ? (
                          <Text style={styles.brandOptionDesc} numberOfLines={1}>
                            {b.description}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <Feather name="check" size={scale(18)} color="#016073" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADD BRAND MODAL */}
      <AddBrandModal
        visible={isAddBrandModalVisible}
        onClose={() => setIsAddBrandModalVisible(false)}
        initialCategory={category}
        onSuccess={(createdBrand) => {
          if (createdBrand) {
            setBrand(createdBrand.name);
            if (createdBrand.status === "APPROVED") {
              setSelectedBrandId(createdBrand._id);
            }
          }
          loadBrandsForCategory(category);
          dispatch(fetchBrands({ category, limit: 100 }));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#016073",
  },
  topBarSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  publishTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#016073",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(7),
    borderRadius: scale(8),
  },
  publishTopBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(40),
    gap: moderateScale(14),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  halfCard: {
    flex: 1,
  },
  twoCardRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#FAFAFA",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#016073",
  },
  cardBody: {
    padding: scale(14),
    gap: moderateScale(12),
  },
  inputGroup: {
    gap: scale(5),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
  },
  reqStar: {
    color: "#EF4444",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  textInputSmall: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(8),
    height: moderateScale(38),
    fontSize: moderateScale(12),
    color: "#0F172A",
  },
  textArea: {
    height: moderateScale(80),
    textAlignVertical: "top",
    paddingTop: moderateScale(8),
  },
  twoColRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  threeColRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  col: {
    flex: 1,
    gap: scale(5),
  },
  dropdownBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: moderateScale(42),
  },
  dropdownText: {
    fontSize: moderateScale(12),
    color: "#0F172A",
    flex: 1,
    marginRight: scale(4),
  },
  dateInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(8),
    height: moderateScale(42),
  },
  dateTextInput: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#0F172A",
  },

  /* DROPZONE PHOTOS */
  dropzoneBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#94A3B8",
    borderRadius: scale(10),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(20),
    paddingHorizontal: scale(16),
  },
  cloudIconCircle: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(8),
  },
  dropzoneTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#016073",
  },
  dropzoneSubtitle: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    marginTop: scale(2),
    textAlign: "center",
    marginBottom: moderateScale(12),
  },
  browseBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
  },
  browseBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#016073",
  },
  photosPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: moderateScale(10),
  },
  photoThumbWrap: {
    position: "relative",
  },
  photoThumb: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  removePhotoBtn: {
    position: "absolute",
    top: -scale(4),
    right: -scale(4),
    backgroundColor: "#EF4444",
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  primaryPhotoTag: {
    position: "absolute",
    bottom: scale(3),
    left: scale(3),
    backgroundColor: "rgba(0, 56, 68, 0.8)",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    borderRadius: scale(4),
  },
  primaryPhotoTagText: {
    fontSize: moderateScale(8.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* PRICING */
  currencyInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    overflow: "hidden",
    height: moderateScale(42),
  },
  currencyPrefix: {
    backgroundColor: "#F1F5F9",
    height: "100%",
    paddingHorizontal: scale(10),
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#CBD5E1",
  },
  currencyPrefixText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#475569",
  },
  currencyTextInput: {
    flex: 1,
    fontSize: moderateScale(13),
    paddingHorizontal: scale(10),
    color: "#0F172A",
    fontWeight: "700",
  },

  /* VARIATION */
  variantRowCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(8),
    padding: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  variantRowInputs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: scale(6),
  },
  weightInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    overflow: "hidden",
    height: moderateScale(38),
    backgroundColor: "#FFFFFF",
  },
  unitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    height: "100%",
    paddingHorizontal: scale(6),
    gap: scale(2),
    borderRightWidth: 1,
    borderRightColor: "#CBD5E1",
  },
  unitBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#475569",
  },
  weightTextInput: {
    flex: 1,
    fontSize: moderateScale(12),
    paddingHorizontal: scale(6),
    color: "#0F172A",
  },
  trashBtn: {
    width: scale(36),
    height: moderateScale(38),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: scale(6),
  },
  addVariantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    paddingVertical: moderateScale(8),
    borderRadius: scale(6),
    marginTop: scale(2),
  },
  addVariantBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* SKU & INVENTORY */
  skuHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skuGenLink: {
    fontSize: moderateScale(11),
    color: "#008080",
    fontWeight: "700",
  },

  /* STATUS RADIO & VISIBILITY CHECKBOX */
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingVertical: moderateScale(4),
  },
  radioCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioCircleActive: {
    borderColor: "#016073",
  },
  radioDot: {
    width: scale(9),
    height: scale(9),
    borderRadius: scale(4.5),
    backgroundColor: "#016073",
  },
  radioLabel: {
    fontSize: moderateScale(12),
    color: "#475569",
    fontWeight: "500",
  },
  radioLabelActive: {
    color: "#016073",
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingVertical: moderateScale(4),
  },
  checkbox: {
    width: scale(17),
    height: scale(17),
    borderRadius: scale(4),
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  checkboxLabel: {
    fontSize: moderateScale(12),
    color: "#475569",
    fontWeight: "500",
  },
  checkboxLabelActive: {
    color: "#016073",
    fontWeight: "700",
  },

  /* TAGS */
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  tagTextInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(38),
    fontSize: moderateScale(12.5),
    color: "#0F172A",
  },
  addTagBtn: {
    backgroundColor: "#016073",
    paddingHorizontal: scale(14),
    height: moderateScale(38),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  addTagBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tagChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginTop: scale(4),
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    gap: scale(4),
  },
  tagChipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#016073",
  },
  tagRemoveBtn: {
    marginLeft: scale(2),
  },

  /* BOTTOM ACTIONS */
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginTop: moderateScale(10),
  },
  draftBtn: {
    height: moderateScale(46),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  draftBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#64748B",
  },
  publishBtn: {
    flex: 1,
    height: moderateScale(46),
    borderRadius: scale(8),
    backgroundColor: "#016073",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: scale(8),
    shadowColor: "#016073",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  publishBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* REUSABLE PICKER MODAL */
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
  },
  pickerModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    width: "100%",
    padding: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#016073",
  },
  pickerOptionItem: {
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  pickerOptionText: {
    fontSize: moderateScale(13),
    color: "#334155",
    fontWeight: "500",
  },
  // Attributes Card Styles
  attributesHelpText: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginBottom: scale(8),
  },
  attrInputSection: {
    marginTop: scale(10),
    gap: scale(6),
  },
  attrSectionLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
  },
  attrPillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  attrPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attrPillSelected: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  attrPillText: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: "#475569",
  },
  attrPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Brand Picker Modal Styles
  brandSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    marginVertical: scale(8),
  },
  brandSearchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  addBrandModalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    backgroundColor: "rgba(1, 96, 115, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(1, 96, 115, 0.2)",
    borderRadius: moderateScale(10),
    padding: scale(10),
    marginBottom: scale(10),
  },
  addBrandBannerTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#016073",
  },
  addBrandBannerSubtitle: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: scale(1),
  },
  brandOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    borderRadius: moderateScale(8),
  },
  brandOptionItemActive: {
    backgroundColor: "rgba(1, 96, 115, 0.06)",
  },
  brandAvatarBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  brandAvatarImage: {
    width: scale(26),
    height: scale(26),
  },
  brandAvatarPlaceholder: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  brandOptionName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#0F172A",
  },
  brandOptionDesc: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: scale(1),
  },
});
