import React, { useEffect, useState } from "react";
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
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import {
  fetchDeliveryCodReconciliationAdminApi,
  raiseCodDisputeAdminApi,
} from "@/store/services/adminService";

export default function StaffAdminCODReconciliationScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [codReconciliation, setCodReconciliation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dispute modal state
  const [disputeRider, setDisputeRider] = useState<any | null>(null);
  const [disputeAmount, setDisputeAmount] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadCodData = async () => {
    try {
      const res = await fetchDeliveryCodReconciliationAdminApi();
      if (res?.data || Array.isArray(res)) {
        setCodReconciliation(res.data || res);
      }
    } catch (err: any) {
      console.warn("[COD] Failed to load reconciliation data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCodData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCodData();
  };

  const handleRaiseDispute = async () => {
    if (!disputeRider) return;
    const amt = parseFloat(disputeAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a positive numeric discrepancy amount.");
      return;
    }
    if (!disputeReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for raising this dispute.");
      return;
    }

    setSubmittingDispute(true);
    try {
      await raiseCodDisputeAdminApi({
        deliveryBoyId: disputeRider._id || disputeRider.deliveryBoyId,
        disputedAmount: amt,
        reason: disputeReason.trim(),
        notes: disputeNotes.trim() || undefined,
      });

      Alert.alert(
        "Dispute Logged",
        `COD discrepancy dispute of Rs.${amt} has been recorded for ${disputeRider.deliveryBoyName || "Rider"}.`
      );
      setDisputeRider(null);
      setDisputeAmount("");
      setDisputeReason("");
      setDisputeNotes("");
      loadCodData();
    } catch (err: any) {
      Alert.alert("Dispute Error", err?.message || "Failed to log COD dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const totalOutstanding = codReconciliation.reduce(
    (acc, curr) => acc + Number(curr.pendingCash || curr.outstandingCash || 0),
    0
  );

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="COD Reconciliation"
        subtitle={`Rs. ${totalOutstanding.toLocaleString()} Total Held Cash`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Banner */}
        <View style={[styles.infoBanner, { backgroundColor: cardBg, borderColor: border }]}>
          <MaterialCommunityIcons name="shield-alert-outline" size={scale(20)} color="#D97706" />
          <Text style={[styles.infoBannerText, { color: textSecondary }]}>
            Verify collected cash before deposit confirmation. Discrepancies should be logged immediately.
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Auditing rider cash collections...
            </Text>
          </View>
        ) : (
          <FlatList
            data={codReconciliation}
            keyExtractor={(item) => item._id || item.deliveryBoyId || Math.random().toString()}
            renderItem={({ item }) => {
              const riderName = item.deliveryBoyName || item.name || "Rider Partner";
              const phone = item.phone || item.deliveryBoyPhone || "N/A";
              const pending = Number(item.pendingCash || item.outstandingCash || 0);
              const collected = Number(item.totalCollected || 0);
              const deposited = Number(item.totalDeposited || 0);
              const count = item.ordersCount || item.totalDeliveries || 0;

              return (
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.riderLeft}>
                      <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="account-cash" size={scale(22)} color="#D97706" />
                      </View>
                      <View style={{ gap: moderateScale(1) }}>
                        <Text style={[styles.riderName, { color: textPrimary }]}>{riderName}</Text>
                        <Text style={[styles.riderPhone, { color: textSecondary }]}>{phone}</Text>
                      </View>
                    </View>

                    <View style={[styles.outstandingBadge, { backgroundColor: pending > 0 ? "#FEF2F2" : "#ECFDF5" }]}>
                      <Text style={[styles.outstandingText, { color: pending > 0 ? "#DC2626" : "#059669" }]}>
                        Rs. {pending.toLocaleString()} Held
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.ledgerRow, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                    <View style={styles.ledgerCol}>
                      <Text style={[styles.ledgerLabel, { color: textSecondary }]}>Collected</Text>
                      <Text style={[styles.ledgerVal, { color: textPrimary }]}>
                        Rs. {collected.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.ledgerCol}>
                      <Text style={[styles.ledgerLabel, { color: textSecondary }]}>Deposited</Text>
                      <Text style={[styles.ledgerVal, { color: "#059669" }]}>
                        Rs. {deposited.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.ledgerCol}>
                      <Text style={[styles.ledgerLabel, { color: textSecondary }]}>Orders</Text>
                      <Text style={[styles.ledgerVal, { color: textPrimary }]}>{count}</Text>
                    </View>
                  </View>

                  {/* Raise Dispute CTA */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setDisputeRider(item);
                        setDisputeAmount(pending > 0 ? pending.toString() : "");
                      }}
                      style={styles.disputeBtn}
                    >
                      <Feather name="alert-octagon" size={scale(14)} color="#DC2626" />
                      <Text style={styles.disputeBtnText}>Log Discrepancy</Text>
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
                <MaterialCommunityIcons name="cash-check" size={scale(36)} color="#059669" />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>All Clear</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No outstanding cash collections or pending handovers found.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Dispute Modal */}
      {disputeRider && (
        <Modal
          visible={!!disputeRider}
          transparent
          animationType="slide"
          onRequestClose={() => setDisputeRider(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Log COD Discrepancy
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    Rider: {disputeRider.deliveryBoyName || disputeRider.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDisputeRider(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: moderateScale(12) }}>
                <View>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>Disputed Amount (Rs.)</Text>
                  <TextInput
                    placeholder="Enter shortage amount..."
                    placeholderTextColor={textSecondary}
                    value={disputeAmount}
                    onChangeText={setDisputeAmount}
                    keyboardType="numeric"
                    style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                  />
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>Reason / Category</Text>
                  <TextInput
                    placeholder="e.g. Cash shortage upon handover, delayed deposit..."
                    placeholderTextColor={textSecondary}
                    value={disputeReason}
                    onChangeText={setDisputeReason}
                    style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                  />
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>Internal Notes</Text>
                  <TextInput
                    placeholder="Detailed audit notes..."
                    placeholderTextColor={textSecondary}
                    value={disputeNotes}
                    onChangeText={setDisputeNotes}
                    multiline
                    numberOfLines={3}
                    style={[styles.modalInputArea, { color: textPrimary, borderColor: border }]}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={submittingDispute}
                  onPress={handleRaiseDispute}
                  style={styles.submitDisputeBtn}
                >
                  {submittingDispute ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitDisputeBtnText}>Record Discrepancy</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(10),
    marginBottom: moderateScale(10),
  },
  infoBannerText: {
    fontSize: moderateScale(11.5),
    flex: 1,
    lineHeight: moderateScale(16),
  },
  listContent: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  card: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(8),
  },
  cardHeader: {
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
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  riderPhone: {
    fontSize: moderateScale(11),
  },
  outstandingBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  outstandingText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
  },
  ledgerCol: {
    gap: moderateScale(2),
  },
  ledgerLabel: {
    fontSize: moderateScale(10),
  },
  ledgerVal: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  actionRow: {
    alignItems: "flex-end",
    marginTop: moderateScale(4),
  },
  disputeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#FEF2F2",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
  },
  disputeBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#DC2626",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(16),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    marginTop: moderateScale(1),
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: moderateScale(4),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: moderateScale(40),
    fontSize: moderateScale(13),
  },
  modalInputArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    height: moderateScale(70),
    textAlignVertical: "top",
    fontSize: moderateScale(13),
  },
  submitDisputeBtn: {
    backgroundColor: "#DC2626",
    borderRadius: scale(10),
    paddingVertical: moderateScale(12),
    alignItems: "center",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  submitDisputeBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
});
