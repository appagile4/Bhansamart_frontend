import React, { useEffect, useState } from "react";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminCustomers } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";
import { useRouter } from "expo-router";

export default function AdminCustomersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const PAGE_SIZE = 15;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { customers, customersTotal, loading } = useAppSelector((state) => state.admin);

  const loadCustomers = async (pageNum = 1, fresh = false) => {
    if (pageNum === 1) {
      if (fresh) setIsRefreshing(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      await dispatch(
        fetchAdminCustomers({
          search: search.trim() || undefined,
          page: pageNum,
          limit: PAGE_SIZE,
        })
      ).unwrap();
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadCustomers(1);
  }, [dispatch]);

  const onRefresh = () => {
    setPage(1);
    loadCustomers(1, true);
  };

  const handleEndReached = () => {
    if (isLoadingMore || loading || isRefreshing) return;
    if (customers.length >= customersTotal) return;
    loadCustomers(page + 1);
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderCustomerItem = ({ item }: { item: any }) => {
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/Screens/staffadminScreens/customerdetails",
            params: { customerId: item._id },
          })
        }
        style={[styles.customerCard, { backgroundColor: cardBg, borderColor: border }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatarWrap, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
            <Feather name="user" size={scale(20)} color="#10B981" />
          </View>
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <View style={styles.titleRow}>
              <Text style={[styles.customerName, { color: textPrimary }]}>{item.name}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: item.isActive !== false ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.isActive !== false ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {item.isActive !== false ? "Active" : "Blocked"}
                </Text>
              </View>
            </View>
            <Text style={[styles.contactInfo, { color: textSecondary }]}>
              {item.email} {item.phone ? `• ${item.phone}` : ""}
            </Text>
          </View>
        </View>

        <View style={[styles.metaRow, { borderTopColor: border }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: textSecondary }]}>Joined</Text>
            <Text style={[styles.metaVal, { color: textPrimary }]}>{formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: textSecondary }]}>Role</Text>
            <Text style={[styles.metaVal, { color: textPrimary }]}>{item.role || "customer"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: textSecondary }]}>Customer ID</Text>
            <Text style={[styles.metaVal, { color: textPrimary }]}>
              #{item._id ? item._id.slice(-6).toUpperCase() : ""}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Customers Directory" subtitle="Accounts & Shopping Activity" showBack />
      {/* Search Header */}
      <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: border }]}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Search customers by name, email or phone..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={(txt) => {
            setSearch(txt);
            if (txt === "") {
              setPage(1);
              loadCustomers(1, true);
            }
          }}
          onSubmitEditing={() => {
            setPage(1);
            loadCustomers(1, true);
          }}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setPage(1);
              loadCustomers(1, true);
            }}
          >
            <Feather name="x" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* KPI mini counter */}
      <View style={styles.kpiWrap}>
        <Text style={[styles.kpiText, { color: textSecondary }]}>
          Total Customers Found: <Text style={{ color: "#10B981", fontWeight: "800" }}>{customersTotal}</Text>
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={customers}
        keyExtractor={(item) => item._id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={() => {
          if (isLoadingMore) {
            return (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={[styles.footerLoaderText, { color: textSecondary }]}>
                  Loading more customers...
                </Text>
              </View>
            );
          }
          if (customers.length > 0 && customers.length >= customersTotal) {
            return (
              <View style={styles.footerEnd}>
                <View style={[styles.footerLine, { backgroundColor: border }]} />
                <Text style={[styles.footerEndText, { color: textSecondary }]}>
                  All {customersTotal} customers loaded
                </Text>
                <View style={[styles.footerLine, { backgroundColor: border }]} />
              </View>
            );
          }
          return <View style={{ height: scale(24) }} />;
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={scale(48)} color="#64748B" />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No customers registered yet.</Text>
            </View>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  kpiWrap: {
    paddingHorizontal: scale(18),
    paddingTop: scale(10),
    paddingBottom: scale(2),
  },
  kpiText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  listContent: {
    padding: scale(16),
    gap: scale(10),
  },
  customerCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerName: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  contactInfo: {
    fontSize: moderateScale(12),
    marginTop: scale(3),
  },
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: 1,
  },
  metaItem: {
    alignItems: "flex-start",
  },
  metaLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(2),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(10),
  },
  emptyText: {
    fontSize: moderateScale(13),
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
  },
  footerLoaderText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(10),
  },
  footerLine: {
    flex: 1,
    height: 1,
  },
  footerEndText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
});
