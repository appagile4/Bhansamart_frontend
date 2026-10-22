import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminLiveMapData } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    // Graceful fallback
  }
}

export default function AdminLiveRadarScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [activeFilter, setActiveFilter] = useState<"ALL" | "VENDORS" | "RIDERS">("ALL");
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  const { mapData, loading } = useAppSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminLiveMapData());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchAdminLiveMapData());
  };

  const vendors = mapData?.vendors || [];
  const riders = mapData?.riders || [];

  const onlineRiders = riders.filter((r: any) => r.isOnline);
  const busyRiders = riders.filter((r: any) => r.isOnline && (r.currentOrder || !r.isAvailable));

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderEntityCard = ({ item }: { item: any }) => {
    const isVendor = !!item.storeName;
    const coords = item.location?.coordinates || [0, 0];
    const isSelected = selectedEntity?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.entityCard,
          { backgroundColor: cardBg, borderColor: isSelected ? "#10B981" : border },
          isSelected && { borderWidth: 2 },
        ]}
        onPress={() => setSelectedEntity(item)}
      >
        <View style={styles.entityRow}>
          <View
            style={[
              styles.entityIconWrap,
              { backgroundColor: isVendor ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)" },
            ]}
          >
            <MaterialCommunityIcons
              name={isVendor ? "storefront-outline" : "moped"}
              size={scale(20)}
              color={isVendor ? "#10B981" : "#3B82F6"}
            />
          </View>
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <View style={styles.entityTitleRow}>
              <Text style={[styles.entityName, { color: textPrimary }]} numberOfLines={1}>
                {isVendor ? item.storeName : (item.name || item.user?.name || "Rider")}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isVendor
                      ? "rgba(16, 185, 129, 0.15)"
                      : item.isOnline
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(148, 163, 184, 0.15)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isVendor
                        ? "#10B981"
                        : item.isOnline
                        ? "#10B981"
                        : "#94A3B8",
                    },
                  ]}
                >
                  {isVendor ? "Store" : item.isOnline ? "Online Rider" : "Offline"}
                </Text>
              </View>
            </View>

            <View style={styles.entitySubRow}>
              <Feather name="map-pin" size={scale(11)} color={textSecondary} />
              <Text style={[styles.coordText, { color: textSecondary }]}>
                {coords[1] ? `${coords[1]?.toFixed(4)}, ${coords[0]?.toFixed(4)}` : "No coordinates set"}
              </Text>
              {isVendor && item.location?.city ? (
                <Text style={[styles.cityText, { color: textSecondary }]}>• {item.location.city}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listData =
    activeFilter === "VENDORS"
      ? vendors
      : activeFilter === "RIDERS"
      ? riders
      : [...vendors, ...riders];

  // Siliguri / central fallback coordinates
  const defaultRegion = {
    latitude: 26.7271,
    longitude: 88.3953,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Live Fleet Radar" subtitle="Real-time Store & Rider Map" showBack />
      {/* Metrics Strip */}
      <View style={[styles.metricsStrip, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: "#10B981" }]}>{vendors.length}</Text>
          <Text style={[styles.metricLabel, { color: textSecondary }]}>Stores</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: border }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: "#3B82F6" }]}>{onlineRiders.length}</Text>
          <Text style={[styles.metricLabel, { color: textSecondary }]}>Online Riders</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: border }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: "#F59E0B" }]}>{busyRiders.length}</Text>
          <Text style={[styles.metricLabel, { color: textSecondary }]}>On Delivery</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === "ALL" && styles.filterPillActive]}
          onPress={() => setActiveFilter("ALL")}
        >
          <Text style={[styles.filterText, activeFilter === "ALL" && styles.filterTextActive]}>
            All Entities ({vendors.length + riders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === "VENDORS" && styles.filterPillActive]}
          onPress={() => setActiveFilter("VENDORS")}
        >
          <Text style={[styles.filterText, activeFilter === "VENDORS" && styles.filterTextActive]}>
            Stores ({vendors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === "RIDERS" && styles.filterPillActive]}
          onPress={() => setActiveFilter("RIDERS")}
        >
          <Text style={[styles.filterText, activeFilter === "RIDERS" && styles.filterTextActive]}>
            Riders ({riders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map or Radar Viewport */}
      {MapView ? (
        <View style={styles.mapContainer}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={defaultRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {/* Vendor Pins */}
            {(activeFilter === "ALL" || activeFilter === "VENDORS") &&
              vendors.map((v: any) => {
                const [lng, lat] = v.location?.coordinates || [0, 0];
                if (!lat || !lng) return null;
                return (
                  <Marker
                    key={v._id}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={v.storeName}
                    description={`Status: ${v.verificationStatus}`}
                    pinColor="#10B981"
                  />
                );
              })}

            {/* Rider Pins */}
            {(activeFilter === "ALL" || activeFilter === "RIDERS") &&
              riders.map((r: any) => {
                const [lng, lat] = r.location?.coordinates || [0, 0];
                if (!lat || !lng) return null;
                return (
                  <Marker
                    key={r._id}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={r.name || r.user?.name || "Rider"}
                    description={r.isOnline ? "Online & Ready" : "Offline"}
                    pinColor="#3B82F6"
                  />
                );
              })}
          </MapView>
        </View>
      ) : (
        /* Radar / GPS Grid Fallback for Web / simulator */
        <View style={[styles.radarPlaceholder, { backgroundColor: cardBg, borderColor: border }]}>
          <MaterialCommunityIcons name="radar" size={scale(40)} color="#10B981" />
          <Text style={[styles.radarTitle, { color: textPrimary }]}>Live Fleet Radar Engine Active</Text>
          <Text style={[styles.radarDesc, { color: textSecondary }]}>
            Monitoring {vendors.length} store locations and {onlineRiders.length} real-time active delivery partners.
          </Text>
        </View>
      )}

      {/* Entity Directory List */}
      <View style={styles.listWrapper}>
        <Text style={[styles.listHeader, { color: textSecondary }]}>
          Real-time Geo-tagged Entities ({listData.length})
        </Text>
        <FlatList
          data={listData}
          keyExtractor={(item) => item._id}
          renderItem={renderEntityCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: textSecondary }]}>No entities in this sector.</Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  metricsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    paddingVertical: scale(10),
  },
  metricItem: {
    alignItems: "center",
  },
  metricVal: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  metricLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginTop: scale(2),
  },
  metricDivider: {
    width: 1,
    height: scale(24),
  },
  filterRow: {
    flexDirection: "row",
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
  },
  filterPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  filterPillActive: {
    backgroundColor: "#10B981",
  },
  filterText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#94A3B8",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  mapContainer: {
    height: scale(220),
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    overflow: "hidden",
  },
  radarPlaceholder: {
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(18),
    gap: scale(6),
  },
  radarTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  radarDesc: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  listWrapper: {
    flex: 1,
    marginTop: scale(10),
  },
  listHeader: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    textTransform: "uppercase",
    paddingHorizontal: scale(16),
    marginBottom: scale(6),
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(20),
    gap: scale(8),
  },
  entityCard: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
  },
  entityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  entityIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  entityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entityName: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    flex: 1,
    marginRight: scale(6),
  },
  statusBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  entitySubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: scale(3),
  },
  coordText: {
    fontSize: moderateScale(11),
  },
  cityText: {
    fontSize: moderateScale(11),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(40),
  },
  emptyText: {
    fontSize: moderateScale(12),
  },
});
