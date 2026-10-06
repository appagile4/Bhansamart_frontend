import VendorHeader from "@/components/VendorComponent/header";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DeliveryItem {
  id: string;
  orderId: string;
  riderName: string;
  riderPhone: string;
  customerAddress: string;
  status: "Assigned" | "Picked Up" | "On The Way" | "Delivered";
  eta: string;
  handoverOtp: string;
}

const SAMPLE_DELIVERIES: DeliveryItem[] = [
  {
    id: "1",
    orderId: "#BM-9480",
    riderName: "Bikash Gurung",
    riderPhone: "+977-9841122334",
    customerAddress: "Koteshwor, Kathmandu",
    status: "On The Way",
    eta: "12 mins",
    handoverOtp: "4829",
  },
  {
    id: "2",
    orderId: "#BM-9479",
    riderName: "Niraj Shrestha",
    riderPhone: "+977-9851234567",
    customerAddress: "Patan Dhoka, Lalitpur",
    status: "Picked Up",
    eta: "25 mins",
    handoverOtp: "9102",
  },
  {
    id: "3",
    orderId: "#BM-9481",
    riderName: "Searching Rider...",
    riderPhone: "--",
    customerAddress: "Baneshwor, Kathmandu",
    status: "Assigned",
    eta: "--",
    handoverOtp: "3310",
  },
];

export default function VendorDeliveryScreen() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(SAMPLE_DELIVERIES);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const getStatusBadge = (status: DeliveryItem["status"]) => {
    switch (status) {
      case "Assigned":
        return { bg: "#EFF6FF", text: "#1D4ED8", label: "Rider Assigned" };
      case "Picked Up":
        return { bg: "#FFFBEB", text: "#B45309", label: "Order Picked" };
      case "On The Way":
        return { bg: "#F0FDF4", text: "#15803D", label: "Out For Delivery" };
      case "Delivered":
        return { bg: "#F8FAFC", text: "#475569", label: "Delivered" };
    }
  };

  const renderDeliveryCard = ({ item }: { item: DeliveryItem }) => {
    const badge = getStatusBadge(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderId}</Text>
            <Text style={styles.etaText}>
              ETA: <Text style={styles.etaHighlight}>{item.eta}</Text>
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="motorbike"
              size={scale(16)}
              color="#016073"
            />
            <Text style={styles.riderName}>{item.riderName}</Text>
            <Text style={styles.riderPhone}>({item.riderPhone})</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={scale(16)} color="#64748B" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.customerAddress}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>Handover OTP</Text>
            <Text style={styles.otpCode}>{item.handoverOtp}</Text>
          </View>

          <TouchableOpacity style={styles.callBtn}>
            <Feather name="phone-call" size={scale(14)} color="#016073" />
            <Text style={styles.callBtnText}>Call Rider</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Unified Vendor Header */}
      <VendorHeader activeRoute="/VendorMain/delivery" />

      {/* Sub Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery & Fleet</Text>
        <Text style={styles.headerSubtitle}>
          Live dispatch, handover verification, and rider tracking
        </Text>
      </View>

      {/* Metric Highlights */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNum}>3</Text>
          <Text style={styles.metricLabel}>Active Dispatches</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: "#008080" }]}>18m</Text>
          <Text style={styles.metricLabel}>Avg. Delivery Time</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: "#16A34A" }]}>98%</Text>
          <Text style={styles.metricLabel}>On-Time Rate</Text>
        </View>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={deliveries}
        keyExtractor={(d) => d.id}
        renderItem={renderDeliveryCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#016073",
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: scale(2),
  },
  metricsRow: {
    flexDirection: "row",
    padding: scale(16),
    gap: scale(10),
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  metricNum: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#016073",
  },
  metricLabel: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    marginTop: scale(2),
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(30),
    gap: moderateScale(12),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  orderNumber: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#016073",
  },
  etaText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1),
  },
  etaHighlight: {
    fontWeight: "700",
    color: "#008080",
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  cardBody: {
    padding: scale(14),
    gap: scale(6),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  riderName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  riderPhone: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  addressText: {
    fontSize: moderateScale(12),
    color: "#64748B",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  otpBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  otpLabel: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "600",
  },
  otpCode: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#016073",
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
  },
  callBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
});

