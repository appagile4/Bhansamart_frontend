import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface FilterState {
  sortBy: string;
  priceRange: string;
  selectedBrands: string[];
  minDiscount: number;
  inStockOnly: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  availableBrands?: string[];
}

const SORT_OPTIONS = [
  { id: "popularity", label: "Popularity" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "rating", label: "Customer Rating (4★ & above)" },
  { id: "discount", label: "Discount: High to Low" },
];

const PRICE_RANGES = [
  { id: "all", label: "All Prices" },
  { id: "under_200", label: "Under Rs. 200" },
  { id: "200_500", label: "Rs. 200 - Rs. 500" },
  { id: "500_1000", label: "Rs. 500 - Rs. 1000" },
  { id: "above_1000", label: "Above Rs. 1000" },
];

const DISCOUNT_OPTIONS = [
  { value: 0, label: "All Discounts" },
  { value: 10, label: "10% or more" },
  { value: 20, label: "20% or more" },
  { value: 30, label: "30% or more" },
  { value: 50, label: "50% or more" },
];

const DEFAULT_BRANDS = [
  "Nestlé",
  "Maggi",
  "Wai Wai",
  "Cadbury",
  "Mars",
  "Lays",
  "Kurkure",
  "Dabur",
  "Amul",
  "Haldiram's",
];

export default function FilterModal({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  availableBrands = DEFAULT_BRANDS,
}: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<
    "sort" | "price" | "brands" | "discount"
  >("sort");
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync when visible changes
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const toggleBrand = (brand: string) => {
    setLocalFilters((prev) => {
      const exists = prev.selectedBrands.includes(brand);
      return {
        ...prev,
        selectedBrands: exists
          ? prev.selectedBrands.filter((b) => b !== brand)
          : [...prev.selectedBrands, brand],
      };
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultState: FilterState = {
      sortBy: "popularity",
      priceRange: "all",
      selectedBrands: [],
      minDiscount: 0,
      inStockOnly: false,
    };
    setLocalFilters(defaultState);
    onResetFilters();
  };

  const countActiveFilters = () => {
    let count = 0;
    if (localFilters.sortBy !== "popularity") count++;
    if (localFilters.priceRange !== "all") count++;
    if (localFilters.selectedBrands.length > 0)
      count += localFilters.selectedBrands.length;
    if (localFilters.minDiscount > 0) count++;
    if (localFilters.inStockOnly) count++;
    return count;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            { paddingBottom: Math.max(insets.bottom, scale(16)) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Filters & Sort</Text>
              {countActiveFilters() > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {countActiveFilters()}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Feather name="x" size={scale(22)} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Body: Split View (Left Tabs + Right Options) */}
          <View style={styles.bodySplit}>
            {/* Left Filter Categories Rail */}
            <View style={styles.tabsRail}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab("sort")}
                style={[
                  styles.tabItem,
                  activeTab === "sort" && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "sort" && styles.tabItemTextActive,
                  ]}
                >
                  Sort By
                </Text>
                {localFilters.sortBy !== "popularity" && (
                  <View style={styles.tabDot} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab("price")}
                style={[
                  styles.tabItem,
                  activeTab === "price" && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "price" && styles.tabItemTextActive,
                  ]}
                >
                  Price Range
                </Text>
                {localFilters.priceRange !== "all" && (
                  <View style={styles.tabDot} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab("brands")}
                style={[
                  styles.tabItem,
                  activeTab === "brands" && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "brands" && styles.tabItemTextActive,
                  ]}
                >
                  Brands
                </Text>
                {localFilters.selectedBrands.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {localFilters.selectedBrands.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab("discount")}
                style={[
                  styles.tabItem,
                  activeTab === "discount" && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "discount" && styles.tabItemTextActive,
                  ]}
                >
                  Discount
                </Text>
                {localFilters.minDiscount > 0 && <View style={styles.tabDot} />}
              </TouchableOpacity>
            </View>

            {/* Right Options Content */}
            <ScrollView
              style={styles.optionsContent}
              contentContainerStyle={styles.optionsContentInner}
              showsVerticalScrollIndicator={false}
            >
              {/* SORT BY */}
              {activeTab === "sort" && (
                <View style={styles.optionsList}>
                  {SORT_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          sortBy: item.id,
                        }))
                      }
                      style={styles.optionRow}
                    >
                      <View style={styles.radioOuter}>
                        {localFilters.sortBy === item.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          localFilters.sortBy === item.id &&
                            styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* PRICE RANGE */}
              {activeTab === "price" && (
                <View style={styles.optionsList}>
                  {PRICE_RANGES.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          priceRange: item.id,
                        }))
                      }
                      style={styles.optionRow}
                    >
                      <View style={styles.radioOuter}>
                        {localFilters.priceRange === item.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          localFilters.priceRange === item.id &&
                            styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* BRANDS */}
              {activeTab === "brands" && (
                <View style={styles.optionsList}>
                  {availableBrands.map((brand) => {
                    const isChecked =
                      localFilters.selectedBrands.includes(brand);
                    return (
                      <TouchableOpacity
                        key={brand}
                        activeOpacity={0.7}
                        onPress={() => toggleBrand(brand)}
                        style={styles.optionRow}
                      >
                        <View
                          style={[
                            styles.checkboxOuter,
                            isChecked && styles.checkboxOuterActive,
                          ]}
                        >
                          {isChecked && (
                            <Ionicons
                              name="checkmark"
                              size={scale(14)}
                              color="#ffffff"
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            isChecked && styles.optionLabelSelected,
                          ]}
                        >
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* DISCOUNT */}
              {activeTab === "discount" && (
                <View style={styles.optionsList}>
                  {DISCOUNT_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.7}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          minDiscount: item.value,
                        }))
                      }
                      style={styles.optionRow}
                    >
                      <View style={styles.radioOuter}>
                        {localFilters.minDiscount === item.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          localFilters.minDiscount === item.value &&
                            styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleReset}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleApply}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    height: "75%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#1E293B",
  },
  activeBadge: {
    backgroundColor: "#2563EB",
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#ffffff",
  },
  closeBtn: {
    padding: scale(4),
  },
  bodySplit: {
    flex: 1,
    flexDirection: "row",
  },
  tabsRail: {
    width: "35%",
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(14),
    paddingHorizontal: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabItemActive: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 3,
    borderLeftColor: "#0B4D58",
  },
  tabItemText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#64748B",
  },
  tabItemTextActive: {
    color: "#0B4D58",
    fontWeight: "800",
  },
  tabDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#0B4D58",
  },
  tabBadge: {
    backgroundColor: "#0B4D58",
    paddingHorizontal: scale(5),
    paddingVertical: scale(1),
    borderRadius: scale(4),
  },
  tabBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#ffffff",
  },
  optionsContent: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  optionsContentInner: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(14),
  },
  optionsList: {
    gap: moderateScale(16),
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  radioOuter: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#0B4D58",
  },
  checkboxOuter: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(5),
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxOuterActive: {
    backgroundColor: "#0B4D58",
    borderColor: "#0B4D58",
  },
  optionLabel: {
    fontSize: moderateScale(13.5),
    color: "#334155",
    fontWeight: "500",
  },
  optionLabelSelected: {
    color: "#0B4D58",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: scale(12),
  },
  resetBtn: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  resetBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#475569",
  },
  applyBtn: {
    flex: 2,
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B4D58",
  },
  applyBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#ffffff",
  },
});
