import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { moderateScale, scale, useTheme } from "@/theme";

export interface AdminStoreFilterDropdownProps {
  vendors: any[];
  selectedVendorId: string;
  onSelectVendor: (vendorId: string) => void;
  title?: string;
  showQuickPills?: boolean;
}

export const getStoreDisplayName = (v: any): string => {
  if (!v) return "Vendor Store";
  return (
    v.businessDetails?.businessName ||
    v.storeName ||
    v.sellerDetails?.sellerName ||
    v.brandDetails?.brandName ||
    v.name ||
    "Vendor Store"
  );
};

export const getStoreState = (v: any): string => {
  if (!v) return "";
  return (
    v.state ||
    v.sellerDetails?.state ||
    v.shippingLocations?.state ||
    v.businessDetails?.state ||
    ""
  );
};

export const getStoreCity = (v: any): string => {
  if (!v) return "";
  return (
    v.city ||
    v.sellerDetails?.city ||
    v.shippingLocations?.city ||
    v.businessDetails?.city ||
    ""
  );
};

export default function AdminStoreFilterDropdown({
  vendors = [],
  selectedVendorId = "all",
  onSelectVendor,
  title = "Store Scope",
  showQuickPills = true,
}: AdminStoreFilterDropdownProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  // Active Store object
  const activeStore = useMemo(() => {
    if (selectedVendorId === "all") return null;
    return vendors.find((v) => (v._id || v.id) === selectedVendorId) || null;
  }, [vendors, selectedVendorId]);

  const activeStoreName = useMemo(() => {
    if (!activeStore) return `All Assigned Stores (${vendors.length})`;
    return getStoreDisplayName(activeStore);
  }, [activeStore, vendors.length]);

  // Extract unique states for filter pills
  const availableStates = useMemo(() => {
    const stateMap = new Map<string, number>();
    vendors.forEach((v) => {
      const s = getStoreState(v).trim();
      if (s) {
        stateMap.set(s, (stateMap.get(s) || 0) + 1);
      }
    });

    const statesList: { name: string; count: number }[] = [];
    stateMap.forEach((count, name) => {
      statesList.push({ name, count });
    });

    return statesList.sort((a, b) => b.count - a.count);
  }, [vendors]);

  // Filtered stores in modal by search name and state
  const filteredStores = useMemo(() => {
    return vendors.filter((v) => {
      const name = getStoreDisplayName(v).toLowerCase();
      const state = getStoreState(v).toLowerCase();
      const city = getStoreCity(v).toLowerCase();

      // State Filter
      if (selectedState !== "ALL") {
        const vState = getStoreState(v).toLowerCase();
        if (vState !== selectedState.toLowerCase()) {
          return false;
        }
      }

      // Name & City Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = name.includes(q);
        const matchesCity = city.includes(q);
        const matchesState = state.includes(q);
        return matchesName || matchesCity || matchesState;
      }

      return true;
    });
  }, [vendors, selectedState, searchQuery]);

  const handleSelect = (vId: string) => {
    onSelectVendor(vId);
    setModalVisible(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedState("ALL");
  };

  return (
    <View style={styles.container}>
      {/* Top Selector & Filter Bar */}
      <View style={styles.topSelectorRow}>
        {/* Main Dropdown Button */}
        <TouchableOpacity
          style={[
            styles.dropdownBtn,
            { backgroundColor: cardBg, borderColor: border },
            selectedVendorId !== "all" && styles.dropdownBtnActive,
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="storefront-outline"
            size={scale(16)}
            color={selectedVendorId !== "all" ? "#0284C7" : textSecondary}
          />
          <View style={{ flex: 1, marginLeft: scale(8) }}>
            <Text style={[styles.dropdownLabel, { color: textSecondary }]}>
              {title}
            </Text>
            <Text
              style={[
                styles.dropdownValue,
                { color: selectedVendorId !== "all" ? "#0284C7" : textPrimary },
              ]}
              numberOfLines={1}
            >
              {activeStoreName}
            </Text>
          </View>
          <Feather name="chevron-down" size={scale(16)} color={textSecondary} />
        </TouchableOpacity>

        {/* Filter Trigger Button */}
        <TouchableOpacity
          style={[
            styles.filterTriggerBtn,
            { backgroundColor: cardBg, borderColor: border },
            (selectedState !== "ALL" || searchQuery.trim().length > 0) &&
              styles.filterTriggerActive,
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather
            name="filter"
            size={scale(15)}
            color={
              selectedState !== "ALL" || searchQuery.trim().length > 0
                ? "#0284C7"
                : textSecondary
            }
          />
          {selectedState !== "ALL" && (
            <View style={styles.filterActiveBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Pills Row */}
      {showQuickPills && vendors.length > 0 && (
        <View style={styles.quickPillsWrap}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { _id: "all", isAll: true },
              ...vendors.slice(0, 6),
            ]}
            keyExtractor={(item) => item._id || item.id || "all"}
            contentContainerStyle={styles.quickPillsContent}
            renderItem={({ item }) => {
              const isAll = item.isAll || item._id === "all";
              const isSelected = selectedVendorId === item._id;
              const storeName = isAll
                ? `All Stores (${vendors.length})`
                : getStoreDisplayName(item);

              return (
                <TouchableOpacity
                  style={[
                    styles.quickPill,
                    { backgroundColor: cardBg, borderColor: border },
                    isSelected && styles.quickPillActive,
                  ]}
                  onPress={() => onSelectVendor(item._id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isAll ? "shape-outline" : "store-outline"}
                    size={scale(13)}
                    color={isSelected ? "#0284C7" : textSecondary}
                  />
                  <Text
                    style={[
                      styles.quickPillText,
                      { color: isSelected ? "#0284C7" : textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {storeName}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              vendors.length > 6 ? (
                <TouchableOpacity
                  style={[
                    styles.quickPillMore,
                    { backgroundColor: cardBg, borderColor: border },
                  ]}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPillMoreText, { color: textSecondary }]}>
                    +{vendors.length - 6} more ▾
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      )}

      {/* ── Dropdown / Filter Bottom Sheet Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Select Store Scope
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Filter operational records by store name or location
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? "#1E252E" : "#F1F5F9" },
                ]}
              >
                <Ionicons name="close" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input by Name */}
            <View
              style={[
                styles.modalSearchBar,
                {
                  backgroundColor: isDark ? "#10161C" : "#F8FAFC",
                  borderColor: border,
                },
              ]}
            >
              <Feather name="search" size={scale(15)} color="#94A3B8" />
              <TextInput
                style={[styles.modalSearchInput, { color: textPrimary }]}
                placeholder="Search store by name, city or state..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={scale(15)} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* State Filter Pills */}
            {availableStates.length > 0 && (
              <View style={styles.stateFilterWrap}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={[{ name: "ALL", count: vendors.length }, ...availableStates]}
                  keyExtractor={(item) => item.name}
                  contentContainerStyle={styles.stateFilterList}
                  renderItem={({ item }) => {
                    const isSelected = selectedState === item.name;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.statePill,
                          {
                            backgroundColor: isDark ? "#10161C" : "#F8FAFC",
                            borderColor: border,
                          },
                          isSelected && styles.statePillActive,
                        ]}
                        onPress={() => setSelectedState(item.name)}
                      >
                        <Text
                          style={[
                            styles.statePillText,
                            isSelected && styles.statePillTextActive,
                            {
                              color: isSelected ? "#0284C7" : textSecondary,
                            },
                          ]}
                        >
                          {item.name === "ALL" ? "All States" : item.name} (
                          {item.count})
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* Store Options List */}
            <FlatList
              data={[
                ...(selectedState === "ALL" && !searchQuery.trim()
                  ? [{ _id: "all", isAll: true }]
                  : []),
                ...filteredStores,
              ]}
              keyExtractor={(item) => item._id || item.id || "all"}
              contentContainerStyle={styles.storeListContent}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.modalEmptyBox}>
                  <MaterialCommunityIcons
                    name="store-search-outline"
                    size={scale(40)}
                    color="#94A3B8"
                  />
                  <Text style={[styles.modalEmptyTitle, { color: textPrimary }]}>
                    No Stores Found
                  </Text>
                  <Text
                    style={[styles.modalEmptySub, { color: textSecondary }]}
                  >
                    No assigned stores matched your name or state filters.
                  </Text>
                  <TouchableOpacity
                    style={[styles.resetBtn, { borderColor: "#0284C7" }]}
                    onPress={handleResetFilters}
                  >
                    <Text style={styles.resetBtnText}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => {
                const isAll = item.isAll || item._id === "all";
                const isSelected = selectedVendorId === item._id;
                const storeName = isAll
                  ? `All Assigned Stores (Full Scope)`
                  : getStoreDisplayName(item);
                const state = isAll ? "" : getStoreState(item);
                const city = isAll ? "" : getStoreCity(item);

                return (
                  <TouchableOpacity
                    style={[
                      styles.storeItemCard,
                      {
                        backgroundColor: isDark ? "#10161C" : "#F8FAFC",
                        borderColor: border,
                      },
                      isSelected && {
                        backgroundColor: isDark ? "#0A2540" : "#E0F2FE",
                        borderColor: "#0284C7",
                      },
                    ]}
                    onPress={() => handleSelect(item._id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.storeIconWrap,
                        {
                          backgroundColor: isSelected
                            ? "rgba(2, 132, 199, 0.2)"
                            : isDark
                            ? "#1E2732"
                            : "#E2E8F0",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isAll ? "shape-outline" : "storefront-outline"}
                        size={scale(18)}
                        color={isSelected ? "#0284C7" : textSecondary}
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text
                        style={[
                          styles.storeCardName,
                          { color: textPrimary },
                          isSelected && { color: "#0284C7", fontWeight: "800" },
                        ]}
                        numberOfLines={1}
                      >
                        {storeName}
                      </Text>

                      {!isAll && (city || state) ? (
                        <View style={styles.locationRow}>
                          <Feather
                            name="map-pin"
                            size={scale(10)}
                            color="#94A3B8"
                          />
                          <Text
                            style={[
                              styles.storeCardLoc,
                              { color: textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {[city, state].filter(Boolean).join(", ")}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={scale(20)}
                        color="#0284C7"
                      />
                    ) : item.isStoreOpen ? (
                      <View style={styles.openPill}>
                        <View
                          style={[
                            styles.openDot,
                            { backgroundColor: "#10B981" },
                          ]}
                        />
                        <Text style={styles.openPillText}>Open</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(8),
  },
  topSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  dropdownBtnActive: {
    borderColor: "#0284C7",
  },
  dropdownLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dropdownValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginTop: scale(1),
  },
  filterTriggerBtn: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(10),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterTriggerActive: {
    borderColor: "#0284C7",
    backgroundColor: "rgba(2, 132, 199, 0.08)",
  },
  filterActiveBadge: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: "#0284C7",
    position: "absolute",
    top: scale(7),
    right: scale(7),
  },
  quickPillsWrap: {
    marginTop: scale(8),
  },
  quickPillsContent: {
    gap: scale(6),
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(20),
    borderWidth: 1,
    maxWidth: scale(160),
  },
  quickPillActive: {
    borderColor: "#0284C7",
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  quickPillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  quickPillMore: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(20),
    borderWidth: 1,
    justifyContent: "center",
  },
  quickPillMoreText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    borderWidth: 1,
    padding: scale(16),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  closeBtn: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    height: scale(38),
    borderRadius: scale(8),
    borderWidth: 1,
    marginBottom: scale(10),
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontSize: moderateScale(13),
  },
  stateFilterWrap: {
    marginBottom: scale(10),
  },
  stateFilterList: {
    gap: scale(6),
  },
  statePill: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(14),
    borderWidth: 1,
  },
  statePillActive: {
    borderColor: "#0284C7",
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  statePillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  statePillTextActive: {
    fontWeight: "800",
  },
  storeListContent: {
    gap: scale(6),
    paddingBottom: scale(20),
  },
  storeItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  storeIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  storeCardName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: scale(2),
  },
  storeCardLoc: {
    fontSize: moderateScale(10),
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  openDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
  },
  openPillText: {
    color: "#10B981",
    fontSize: moderateScale(9),
    fontWeight: "700",
  },
  modalEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(30),
  },
  modalEmptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: scale(8),
  },
  modalEmptySub: {
    fontSize: moderateScale(11),
    marginTop: scale(4),
    textAlign: "center",
  },
  resetBtn: {
    marginTop: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  resetBtnText: {
    color: "#0284C7",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
});
