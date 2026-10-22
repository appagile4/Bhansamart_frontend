import React, { useEffect, useState } from "react";
import {
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
import { fetchAdminDeliveryBoys } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function AdminDeliveryBoysScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { deliveryBoys, loading } = useAppSelector((state) => state.admin);

  const loadRiders = () => {
    dispatch(fetchAdminDeliveryBoys({ search: search.trim() || undefined }));
  };

  useEffect(() => {
    loadRiders();
  }, [dispatch]);

  const onRefresh = () => {
    loadRiders();
  };

  const filteredRiders = (deliveryBoys || []).filter((r: any) => {
    if (onlineOnly && !r.isOnline) return false;
    return true;
  });

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderRiderItem = ({ item }: { item: any }) => {
    const isOnline = item.isOnline;
    const isBusy = item.currentOrder || !item.isAvailable;
    const cashBalance = item.cashInHand || item.cashCollected || 0;

    return (
      <View style={[styles.riderCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.riderHeader}>
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: isOnline ? "rgba(16, 185, 129, 0.15)" : (isDark ? "#1E293B" : "#F1F5F9") },
            ]}
          >
            <MaterialCommunityIcons
              name="moped"
              size={scale(24)}
              color={isOnline ? "#10B981" : "#94A3B8"}
            />
          </View>
          <View style={{ flex: 1, marginLeft: scale(12) }}>
            <View style={styles.titleRow}>
              <Text style={[styles.riderName, { color: textPrimary }]}>
                {item.user?.name || item.name || "Delivery Partner"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? "#10B981" : "#94A3B8" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: isOnline ? "#10B981" : "#94A3B8" },
                  ]}
                >
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
            </View>

            <Text style={[styles.contactText, { color: textSecondary }]}>
              {item.user?.phone || item.phone || "No phone registered"}
            </Text>
          </View>
        </View>

        {/* Vehicle & Duty details */}
        <View style={[styles.infoRow, { backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Vehicle</Text>
            <Text style={[styles.infoVal, { color: textPrimary }]}>
              {item.vehicleNumber || item.vehicleType || "Not assigned"}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Current Duty</Text>
            <Text
              style={[
                styles.infoVal,
                { color: isBusy ? "#F59E0B" : "#10B981" },
              ]}
            >
              {isBusy ? "On Delivery" : "Idle / Available"}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Cash on Hand</Text>
            <Text style={[styles.infoVal, { color: cashBalance > 0 ? "#10B981" : textPrimary }]}>
              ₹{cashBalance.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Coordinates / deliveries */}
        <View style={[styles.footerRow, { borderTopColor: border }]}>
          <View style={styles.footerItem}>
            <Feather name="map-pin" size={scale(12)} color="#94A3B8" />
            <Text style={[styles.footerText, { color: textSecondary }]}>
              {item.location?.coordinates
                ? `${item.location.coordinates[1]?.toFixed(4)}, ${item.location.coordinates[0]?.toFixed(4)}`
                : "No GPS reported"}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Feather name="check-circle" size={scale(12)} color="#10B981" />
            <Text style={[styles.footerText, { color: textSecondary }]}>
              {item.completedDeliveries || 0} completed
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Delivery Partners" subtitle="Fleet Availability & COD Balances" showBack />
      {/* Search Header */}
      <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: border }]}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Search riders by name, phone or vehicle..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadRiders}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              dispatch(fetchAdminDeliveryBoys({}));
            }}
          >
            <Feather name="x" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, !onlineOnly && styles.chipActive]}
          onPress={() => setOnlineOnly(false)}
        >
          <Text style={[styles.chipText, !onlineOnly && styles.chipTextActive]}>
            All ({deliveryBoys.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, onlineOnly && styles.chipActive]}
          onPress={() => setOnlineOnly(true)}
        >
          <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
          <Text style={[styles.chipText, onlineOnly && styles.chipTextActive]}>
            Active Online Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredRiders}
        keyExtractor={(item) => item._id}
        renderItem={renderRiderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="moped-electric" size={scale(48)} color="#64748B" />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No delivery riders found.</Text>
            </View>
          ) : null
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
  chipsRow: {
    flexDirection: "row",
    gap: scale(8),
    paddingHorizontal: scale(16),
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  chipActive: {
    backgroundColor: "#10B981",
  },
  chipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#94A3B8",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: scale(16),
    gap: scale(12),
  },
  riderCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riderName: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  contactText: {
    fontSize: moderateScale(12),
    marginTop: scale(2),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(12),
    padding: scale(10),
    borderRadius: scale(8),
  },
  infoCol: {
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoVal: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(2),
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  footerText: {
    fontSize: moderateScale(11),
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
});
