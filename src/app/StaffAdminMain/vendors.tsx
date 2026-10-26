import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import VendorListItem from "@/components/staffAdminComponent/VendorListItem";
import { fetchStaffAssignedVendorsApi } from "@/store/services/adminService";
import { getStoreCity, getStoreDisplayName, getStoreState } from "@/components/AdminStoreFilterDropdown";

export default function StaffAdminVendorsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors) {
        setVendors(res.vendors);
      }
    } catch (err) {
      console.warn("[StaffVendors] Failed to load vendors", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadVendors();
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const name = getStoreDisplayName(v).toLowerCase();
      const state = getStoreState(v).toLowerCase();
      const city = getStoreCity(v).toLowerCase();
      const q = search.trim().toLowerCase();

      const matchesSearch = !q || name.includes(q) || state.includes(q) || city.includes(q);
      const isOpen = v.isStoreOpen ?? true;

      if (!matchesSearch) return false;
      if (statusFilter === "OPEN") return isOpen;
      if (statusFilter === "CLOSED") return !isOpen;
      return true;
    });
  }, [vendors, search, statusFilter]);

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Assigned Stores"
        subtitle={`${vendors.length} Managed Vendors`}
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
          <Feather name="search" size={scale(16)} color={textSecondary} />
          <TextInput
            placeholder="Search stores by name, city or state..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={scale(16)} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(["ALL", "OPEN", "CLOSED"] as const).map((st) => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? "#0284C7" : cardBg,
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {st === "ALL" ? `All (${vendors.length})` : st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading assigned stores...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredVendors}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => (
              <VendorListItem
                vendor={item}
                onPress={() =>
                  router.push({
                    pathname: "/Screens/adminScreens/vendorDetails" as any,
                    params: { id: item._id || item.id },
                  })
                }
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="storefront-remove" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Stores Found</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  {search
                    ? "Try adjusting your search query."
                    : "No vendors are currently assigned to your StaffAdmin account."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(10),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    gap: scale(8),
    marginBottom: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: moderateScale(12),
  },
  filterPill: {
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11.5),
  },
  listContent: {
    paddingBottom: moderateScale(30),
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  emptyBox: {
    padding: scale(24),
    borderRadius: scale(14),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    textAlign: "center",
    lineHeight: moderateScale(17),
  },
});
