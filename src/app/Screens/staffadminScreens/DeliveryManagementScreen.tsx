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
import { fetchAdminDeliveryBoysApi } from "@/store/services/adminService";

export default function StaffAdminDeliveryManagementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const loadRiders = async () => {
    try {
      const res = await fetchAdminDeliveryBoysApi({
        search: search.trim() || undefined,
      });
      if (res?.data || Array.isArray(res)) {
        setDeliveryBoys(res.data || res);
      }
    } catch (e) {
      console.warn("[Delivery] Failed to load delivery boys", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRiders();
  };

  const filteredRiders = useMemo(() => {
    return deliveryBoys.filter((r) => {
      const name = (r.name || r.user?.name || "").toLowerCase();
      const phone = (r.phone || r.user?.phone || "").toLowerCase();
      const q = search.trim().toLowerCase();

      const matchesSearch = !q || name.includes(q) || phone.includes(q);
      const isOnline = (r.availability || "").toUpperCase() === "ONLINE";

      if (!matchesSearch) return false;
      if (onlineOnly && !isOnline) return false;
      return true;
    });
  }, [deliveryBoys, search, onlineOnly]);

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Delivery Fleet"
        subtitle={`${deliveryBoys.length} Active Riders`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
          <Feather name="search" size={scale(16)} color={textSecondary} />
          <TextInput
            placeholder="Search rider by name or phone..."
            placeholderTextColor={textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadRiders}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={scale(16)} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Online Toggle Pill */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setOnlineOnly(!onlineOnly)}
            style={[
              styles.togglePill,
              {
                backgroundColor: onlineOnly ? "#0284C7" : cardBg,
                borderColor: onlineOnly ? "#0284C7" : border,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: onlineOnly ? "#FFFFFF" : "#10B981" },
              ]}
            />
            <Text
              style={[
                styles.togglePillText,
                { color: onlineOnly ? "#FFFFFF" : textPrimary },
              ]}
            >
              Online Fleet Only
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading rider fleet...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRiders}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              const name = item.name || item.user?.name || "Rider Partner";
              const phone = item.phone || item.user?.phone || "No phone";
              const isOnline = (item.availability || "").toUpperCase() === "ONLINE";
              const activeOrders = item.activeOrdersCount || 0;
              const pendingCash = Number(item.pendingCash || item.outstandingCash || 0);

              return (
                <View style={[styles.riderCard, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.riderHeader}>
                    <View style={styles.riderLeft}>
                      <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="moped" size={scale(22)} color="#0284C7" />
                      </View>
                      <View style={{ gap: moderateScale(1) }}>
                        <Text style={[styles.riderName, { color: textPrimary }]}>{name}</Text>
                        <Text style={[styles.riderPhone, { color: textSecondary }]}>{phone}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isOnline ? "#ECFDF5" : "#F1F5F9" },
                      ]}
                    >
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: isOnline ? "#10B981" : "#94A3B8" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isOnline ? "#059669" : "#64748B" },
                        ]}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                  </View>

                  {/* Rider Performance Footnote */}
                  <View style={[styles.statsRow, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: textSecondary }]}>Active Tasks</Text>
                      <Text style={[styles.statVal, { color: textPrimary }]}>
                        {activeOrders} In Delivery
                      </Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: textSecondary }]}>Cash In Hand</Text>
                      <Text style={[styles.statVal, { color: pendingCash > 0 ? "#DC2626" : "#059669" }]}>
                        Rs. {pendingCash.toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push("/Screens/staffadminScreens/CODReconciliationScreen" as any)}
                      style={styles.reconcileBtn}
                    >
                      <Text style={styles.reconcileBtnText}>Audit</Text>
                      <Feather name="chevron-right" size={scale(13)} color="#0284C7" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="moped" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Riders Found</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No delivery boys matched the current search query.
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
    marginVertical: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: moderateScale(10),
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  togglePillText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  listContent: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  riderCard: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(10),
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  iconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  riderPhone: {
    fontSize: moderateScale(11.5),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  statusText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
  },
  statCol: {
    gap: moderateScale(1),
  },
  statLabel: {
    fontSize: moderateScale(10),
  },
  statVal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  reconcileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  reconcileBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0284C7",
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
  },
});
