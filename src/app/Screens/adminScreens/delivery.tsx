import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
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
import {
  fetchDeliveryCodReconciliationAdminApi,
  raiseCodDisputeAdminApi,
} from "@/store/services/adminService";
import socketService from "@/store/services/socketService";

export default function AdminDeliveryBoysScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<"fleet" | "cod">("fleet");

  // Fleet state
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const { deliveryBoys, loading: fleetLoading } = useAppSelector((state) => state.admin);
  const [localRiders, setLocalRiders] = useState<any[]>(deliveryBoys || []);

  useEffect(() => {
    setLocalRiders(deliveryBoys || []);
  }, [deliveryBoys]);

  // Real-time Socket.IO Rider status & location listener
  useEffect(() => {
    socketService.connect("admin");

    const unsubscribe = socketService.onDeliveryRiderStatus((data: any) => {
      if (!data) return;
      const targetId = String(data.deliveryBoyId || data.riderId || data._id || "");
      if (!targetId) return;

      setLocalRiders((prev) =>
        prev.map((r: any) => {
          const rId = String(r._id || r.id || "");
          const rUserId = String(r.user?._id || r.userId || "");
          if (rId !== targetId && rUserId !== targetId) return r;

          const newAvailability = data.availability !== undefined ? data.availability : r.availability;
          const newIsOnline =
            data.isOnline !== undefined
              ? Boolean(data.isOnline)
              : newAvailability === "ONLINE" || newAvailability === "BUSY";
          const newIsBusy =
            data.isBusy !== undefined
              ? Boolean(data.isBusy)
              : newAvailability === "BUSY" || Boolean(data.activeOrderId);

          return {
            ...r,
            ...data,
            availability: newAvailability,
            isOnline: newIsOnline,
            isBusy: newIsBusy,
            location: data.currentLocation || data.location || r.location,
          };
        })
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper functions for online and busy status
  const checkIsOnline = (r: any): boolean => {
    if (typeof r?.isOnline === "boolean") return r.isOnline;
    const avail = String(r?.availability || "").toUpperCase();
    return avail === "ONLINE" || avail === "BUSY";
  };

  const checkIsBusy = (r: any): boolean => {
    if (typeof r?.isBusy === "boolean") return r.isBusy;
    const avail = String(r?.availability || "").toUpperCase();
    return avail === "BUSY" || Boolean(r?.activeOrderId || r?.currentOrder);
  };

  const onlineCount = useMemo(() => {
    return (localRiders || []).filter((r: any) => checkIsOnline(r)).length;
  }, [localRiders]);

  // COD Reconciliation state
  const [codReconciliation, setCodReconciliation] = useState<any[]>([]);
  const [codLoading, setCodLoading] = useState(false);
  const [codRefreshing, setCodRefreshing] = useState(false);

  // Dispute modal state
  const [disputeRider, setDisputeRider] = useState<any | null>(null);
  const [disputeAmount, setDisputeAmount] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadRiders = () => {
    dispatch(fetchAdminDeliveryBoys({ search: search.trim() || undefined }));
  };

  const loadCodData = async () => {
    try {
      setCodLoading(true);
      const res = await fetchDeliveryCodReconciliationAdminApi();
      if (res?.reconciliations) {
        setCodReconciliation(res.reconciliations);
      }
    } catch (err) {
      console.error("Failed to load COD reconciliation data", err);
    } finally {
      setCodLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "cod") {
      loadCodData();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    if (activeTab === "fleet") {
      loadRiders();
    } else {
      setCodRefreshing(true);
      await loadCodData();
      setCodRefreshing(false);
    }
  };

  const handleOpenDispute = (item: any) => {
    setDisputeRider(item);
    setDisputeAmount(String(item.outstandingBalance || 0));
    setDisputeReason("");
    setDisputeNotes("");
  };

  const handleSubmitDispute = async () => {
    if (!disputeRider) return;
    if (!disputeAmount.trim() || Number(disputeAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid disputed amount.");
      return;
    }
    if (!disputeReason.trim()) {
      Alert.alert("Reason Required", "Please specify the reason for raising this COD mismatch dispute.");
      return;
    }

    try {
      setSubmittingDispute(true);
      await raiseCodDisputeAdminApi({
        deliveryBoyId: disputeRider.deliveryBoy?._id || disputeRider.deliveryBoy?.id || disputeRider.deliveryBoyId,
        disputedAmount: Number(disputeAmount),
        reason: disputeReason.trim(),
        notes: disputeNotes.trim(),
      });

      Alert.alert("Dispute Logged", "Audit dispute raised and forwarded to Finance & Delivery operations.");
      setDisputeRider(null);
      loadCodData();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to raise COD dispute");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const filteredRiders = useMemo(() => {
    return (localRiders || []).filter((r: any) => {
      if (onlineOnly && !checkIsOnline(r)) return false;
      return true;
    });
  }, [localRiders, onlineOnly]);

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderRiderItem = ({ item }: { item: any }) => {
    const isOnline = checkIsOnline(item);
    const isBusy = checkIsBusy(item);
    const cashBalance = item.cashInHand ?? item.codCashInCustody ?? item.cashCollected ?? 0;
    const riderName = item.fullName || item.name || item.user?.name || "Delivery Partner";
    const riderPhone = item.phone || item.user?.phone || "No phone registered";
    const vehicle = item.vehicleNumber || item.vehicleDetails?.registrationNumber || item.vehicleType || "Not assigned";
    const totalDeliveries = item.completedDeliveries ?? item.metrics?.totalDeliveries ?? 0;
    const coordinates = item.location?.coordinates || item.currentLocation?.coordinates;

    return (
      <View style={[styles.riderCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.riderHeader}>
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: isOnline ? "rgba(16, 185, 129, 0.15)" : isDark ? "#1E293B" : "#F1F5F9" },
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
                {riderName}
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
              {riderPhone}
            </Text>
          </View>
        </View>

        {/* Vehicle & Duty details */}
        <View style={[styles.infoRow, { backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Vehicle</Text>
            <Text style={[styles.infoVal, { color: textPrimary }]}>
              {vehicle}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Current Duty</Text>
            <Text
              style={[
                styles.infoVal,
                { color: isBusy ? "#F59E0B" : isOnline ? "#10B981" : textSecondary },
              ]}
            >
              {isBusy ? "On Delivery" : isOnline ? "Idle / Available" : "Offline"}
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
              {coordinates && coordinates[0] !== 0 && coordinates[1] !== 0
                ? `${coordinates[1]?.toFixed(4)}, ${coordinates[0]?.toFixed(4)}`
                : "No GPS reported"}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Feather name="check-circle" size={scale(12)} color="#10B981" />
            <Text style={[styles.footerText, { color: textSecondary }]}>
              {totalDeliveries} completed
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCodItem = ({ item }: { item: any }) => {
    const riderName = item.deliveryBoy?.user?.name || item.deliveryBoy?.name || "Rider";
    const riderPhone = item.deliveryBoy?.user?.phone || item.deliveryBoy?.phone || "N/A";
    const expected = item.totalExpectedCod || 0;
    const handedOver = item.totalHandedOver || 0;
    const outstanding = item.outstandingBalance || 0;
    const status = item.reconciliationStatus || (outstanding <= 0 ? "SETTLED" : "PENDING_HANDOVER");

    return (
      <View style={[styles.codCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.codCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.riderName, { color: textPrimary }]}>{riderName}</Text>
            <Text style={[styles.contactText, { color: textSecondary }]}>{riderPhone}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status === "SETTLED"
                    ? "rgba(16, 185, 129, 0.15)"
                    : status === "MISMATCH_DISPUTE"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    status === "SETTLED"
                      ? "#10B981"
                      : status === "MISMATCH_DISPUTE"
                      ? "#EF4444"
                      : "#F59E0B",
                },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* Ledger Breakdown */}
        <View style={[styles.ledgerRow, { backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}>
          <View style={styles.ledgerCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Expected COD</Text>
            <Text style={[styles.ledgerVal, { color: textPrimary }]}>
              ₹{expected.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.ledgerCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Handed Over</Text>
            <Text style={[styles.ledgerVal, { color: "#10B981" }]}>
              ₹{handedOver.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.ledgerCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>Outstanding</Text>
            <Text style={[styles.ledgerVal, { color: outstanding > 0 ? "#EF4444" : "#10B981" }]}>
              ₹{outstanding.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* COD Dispute Action */}
        <View style={[styles.codFooter, { borderTopColor: border }]}>
          <Text style={[styles.formulaText, { color: textSecondary }]}>
            Expected − Handed Over = ₹{outstanding.toLocaleString("en-IN")}
          </Text>

          <TouchableOpacity
            style={[styles.disputeBtn, { borderColor: "#EF4444" }]}
            onPress={() => handleOpenDispute(item)}
          >
            <Feather name="alert-circle" size={scale(12)} color="#EF4444" />
            <Text style={styles.disputeBtnText}>Raise Dispute</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Delivery Operations" subtitle="Fleet Tracking & Cash Reconciliation" showBack />

      {/* Top Segmented Navigation */}
      <View style={[styles.segmentBar, { backgroundColor: cardBg, borderColor: border }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "fleet" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("fleet")}
        >
          <MaterialCommunityIcons
            name="moped-outline"
            size={scale(16)}
            color={activeTab === "fleet" ? "#10B981" : textSecondary}
          />
          <Text style={[styles.segmentText, { color: activeTab === "fleet" ? "#10B981" : textSecondary }]}>
            Fleet Availability ({localRiders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "cod" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("cod")}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={scale(16)}
            color={activeTab === "cod" ? "#10B981" : textSecondary}
          />
          <Text style={[styles.segmentText, { color: activeTab === "cod" ? "#10B981" : textSecondary }]}>
            COD Reconciliation
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "fleet" ? (
        <>
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
                All ({localRiders.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, onlineOnly && styles.chipActive]}
              onPress={() => setOnlineOnly(true)}
            >
              <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
              <Text style={[styles.chipText, onlineOnly && styles.chipTextActive]}>
                Active Online Only ({onlineCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <FlatList
            data={filteredRiders}
            keyExtractor={(item) => item._id || item.id || String(Math.random())}
            renderItem={renderRiderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={fleetLoading} onRefresh={onRefresh} tintColor="#10B981" />}
            ListEmptyComponent={
              !fleetLoading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="moped-electric" size={scale(48)} color="#64748B" />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>No delivery riders found.</Text>
                </View>
              ) : null
            }
          />
        </>
      ) : (
        <>
          {/* Notice Banner */}
          <View style={[styles.codBanner, { backgroundColor: isDark ? "#1C242B" : "#FEF3C7", borderColor: "#F59E0B" }]}>
            <Feather name="shield" size={scale(14)} color="#F59E0B" />
            <Text style={[styles.codBannerText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
              COD Formula: Expected COD − Verified Submitted Collections − Authorized Adjustments = Outstanding.
              StaffAdmin can audit and flag disputes; ledger modifications are strictly audit-logged.
            </Text>
          </View>

          <FlatList
            data={codReconciliation}
            keyExtractor={(item, idx) => item._id || item.deliveryBoyId || String(idx)}
            renderItem={renderCodItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={codRefreshing} onRefresh={onRefresh} tintColor="#10B981" />}
            ListEmptyComponent={
              codLoading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                    Calculating COD balances...
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="cash-check" size={scale(48)} color="#64748B" />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    No outstanding COD balances found for assigned vendors.
                  </Text>
                </View>
              )
            }
          />
        </>
      )}

      {/* COD Dispute Modal */}
      <Modal visible={!!disputeRider} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Raise COD Discrepancy Dispute</Text>
              <TouchableOpacity onPress={() => setDisputeRider(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {disputeRider && (
              <>
                <Text style={[styles.inputLabel, { color: textPrimary }]}>
                  Delivery Partner: {disputeRider.deliveryBoy?.user?.name || disputeRider.deliveryBoy?.name}
                </Text>

                <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                  Disputed Amount (₹):
                </Text>
                <TextInput
                  style={[styles.inputBox, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                  keyboardType="numeric"
                  value={disputeAmount}
                  onChangeText={setDisputeAmount}
                />

                <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                  Dispute Reason:
                </Text>
                <TextInput
                  style={[styles.inputBox, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                  placeholder="e.g., Short collection handed over at hub..."
                  placeholderTextColor={textSecondary}
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                />

                <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                  Audit Notes:
                </Text>
                <TextInput
                  style={[styles.modalTextArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                  placeholder="Order numbers, hub manager remarks, or cash slip reference..."
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={3}
                  value={disputeNotes}
                  onChangeText={setDisputeNotes}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalCancelBtn, { borderColor: border }]}
                    onPress={() => setDisputeRider(null)}
                  >
                    <Text style={[styles.modalCancelText, { color: textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSaveBtn, { backgroundColor: "#EF4444" }]}
                    disabled={submittingDispute}
                    onPress={handleSubmitDispute}
                  >
                    {submittingDispute ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSaveText}>File COD Dispute</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentBar: {
    flexDirection: "row",
    marginHorizontal: scale(16),
    marginTop: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(3),
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  segmentBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  segmentText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(10),
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
  codBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(10),
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: scale(8),
  },
  codBannerText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    lineHeight: scale(15),
  },
  codCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  codCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(10),
    padding: scale(10),
    borderRadius: scale(8),
  },
  ledgerCol: {
    alignItems: "flex-start",
  },
  ledgerVal: {
    fontSize: moderateScale(13),
    fontWeight: "900",
    marginTop: scale(2),
  },
  codFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 0.8,
  },
  formulaText: {
    fontSize: moderateScale(10),
    flex: 1,
  },
  disputeBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(6),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    gap: scale(4),
  },
  disputeBtnText: {
    color: "#EF4444",
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: scale(16),
  },
  modalContent: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(16),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(12),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "900",
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: scale(4),
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(8),
    fontSize: moderateScale(12),
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: moderateScale(11),
    textAlignVertical: "top",
    minHeight: scale(60),
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(14),
  },
  modalCancelBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  modalSaveBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
});
