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
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";
import {
  fetchRefundsQueueAdminApi,
  recordRefundInspectionActionApi,
  staffExamineRefundActionApi,
  updateRefundPickupActionApi,
} from "@/store/services/adminService";

export default function StaffAdminReturnsRefundsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"examine" | "pickup" | "inspect">("examine");

  // Examination Form
  const [decision, setDecision] = useState<"FORWARD_TO_FINANCE" | "REQUIRE_RETURN_PICKUP" | "REJECTED">("FORWARD_TO_FINANCE");
  const [notes, setNotes] = useState("");
  const [conditionScore, setConditionScore] = useState<"GOOD" | "FAIR" | "DAMAGED">("GOOD");
  const [submitting, setSubmitting] = useState(false);

  // Pickup Form
  const [trackingNumber, setTrackingNumber] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  const loadRefunds = async () => {
    try {
      const res = await fetchRefundsQueueAdminApi({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res?.refunds || res?.data || Array.isArray(res)) {
        setRefunds(res.refunds || res.data || res);
      }
    } catch (e) {
      console.warn("[Refunds] Failed to load refunds queue", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadRefunds();
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRefunds();
  };

  const handleExamineSubmit = async () => {
    if (!selectedRefund) return;
    setSubmitting(true);
    try {
      await staffExamineRefundActionApi(selectedRefund._id || selectedRefund.id, {
        decision,
        examinationNotes: notes.trim() || undefined,
        conditionScore,
      });

      Alert.alert(
        "Examination Saved",
        `Refund claim #${selectedRefund.refundNumber || "N/A"} decision recorded as ${decision.replace(/_/g, " ")}.`
      );
      setSelectedRefund(null);
      setNotes("");
      loadRefunds();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit examination decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickupSubmit = async () => {
    if (!selectedRefund) return;
    setSubmitting(true);
    try {
      await updateRefundPickupActionApi(selectedRefund._id || selectedRefund.id, {
        trackingNumber: trackingNumber.trim() || undefined,
        pickupNotes: pickupNotes.trim() || undefined,
        pickupStatus: "PICKUP_SCHEDULED",
      });

      Alert.alert("Pickup Scheduled", "Return pickup instruction sent to fleet manager.");
      setSelectedRefund(null);
      setTrackingNumber("");
      setPickupNotes("");
      loadRefunds();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to schedule pickup.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const STATUS_PILLS = [
    "ALL",
    "PENDING",
    "STAFF_EXAMINATION_REQUIRED",
    "FORWARD_TO_FINANCE",
    "APPROVED",
    "REJECTED",
  ];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Returns & Refunds"
        subtitle={`${refunds.length} Scoped Claims`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Flow Notice */}
        <View style={[styles.flowNoticeCard, { backgroundColor: cardBg, borderColor: border }]}>
          <MaterialCommunityIcons name="timeline-clock-outline" size={scale(20)} color="#DC2626" />
          <Text style={[styles.flowNoticeText, { color: textSecondary }]}>
            Vendor-accepted claims enter StaffAdmin review queue for policy examination and condition check.
          </Text>
        </View>

        {/* Status Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={{ gap: scale(6), paddingBottom: moderateScale(4) }}
        >
          {STATUS_PILLS.map((st) => {
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
                  {st.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading return & refund claims...
            </Text>
          </View>
        ) : (
          <FlatList
            data={refunds}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              const storeName =
                item.vendor?.businessDetails?.businessName ||
                item.vendorName ||
                "Assigned Store";

              return (
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ gap: moderateScale(2), flex: 1, marginRight: scale(8) }}>
                      <Text style={[styles.refundNum, { color: textPrimary }]}>
                        #{item.refundNumber || "RF" + (item._id || "").slice(-6)}
                      </Text>
                      <Text style={[styles.vendorSubtitle, { color: textSecondary }]}>
                        Store: {storeName} • Order #{item.order?.orderNumber || item.orderNumber || "N/A"}
                      </Text>
                    </View>
                    <RequestStatusBadge status={item.status} type="refund" />
                  </View>

                  <Text style={[styles.reasonText, { color: textSecondary }]} numberOfLines={2}>
                    Reason: {item.reason || "Customer requested return / refund."}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                    <View style={{ gap: moderateScale(1) }}>
                      <Text style={[styles.amountLabel, { color: textSecondary }]}>Refund Amount</Text>
                      <Text style={[styles.amountVal, { color: "#0284C7" }]}>
                        Rs. {Number(item.amount || item.refundAmount || 0).toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedRefund(item);
                        setNotes(item.examinationNotes || "");
                      }}
                      style={styles.examineBtn}
                    >
                      <Feather name="check-circle" size={scale(14)} color="#FFFFFF" />
                      <Text style={styles.examineBtnText}>Staff Examine</Text>
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
                <MaterialCommunityIcons name="keyboard-return" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Refund Claims</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No return or refund cases are pending examination in this filter.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Examination Modal */}
      {selectedRefund && (
        <Modal
          visible={!!selectedRefund}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedRefund(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Examine Refund Case
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    Claim #{selectedRefund.refundNumber || "N/A"} • Order #{selectedRefund.order?.orderNumber || "N/A"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRefund(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Sub-tabs for modal */}
              <View style={[styles.modalSubTabs, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
                <TouchableOpacity
                  onPress={() => setActiveModalTab("examine")}
                  style={[styles.subTabBtn, activeModalTab === "examine" && styles.subTabBtnActive]}
                >
                  <Text style={[styles.subTabText, { color: activeModalTab === "examine" ? "#0284C7" : textSecondary }]}>
                    1. Examination
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveModalTab("pickup")}
                  style={[styles.subTabBtn, activeModalTab === "pickup" && styles.subTabBtnActive]}
                >
                  <Text style={[styles.subTabText, { color: activeModalTab === "pickup" ? "#0284C7" : textSecondary }]}>
                    2. Pickup Fleet
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: moderateScale(12) }}>
                {activeModalTab === "examine" ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: textSecondary }]}>Requested Amount</Text>
                      <Text style={[styles.infoVal, { color: "#0284C7" }]}>
                        Rs. {Number(selectedRefund.amount || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: textSecondary }]}>Customer Reason</Text>
                      <Text style={[styles.infoVal, { color: textPrimary }]}>
                        {selectedRefund.reason || "Defective / return item"}
                      </Text>
                    </View>

                    <View>
                      <Text style={[styles.fieldLabel, { color: textPrimary }]}>Staff Decision</Text>
                      <View style={styles.decisionRow}>
                        {[
                          { id: "FORWARD_TO_FINANCE", label: "Forward to Finance" },
                          { id: "REQUIRE_RETURN_PICKUP", label: "Require Pickup" },
                          { id: "REJECTED", label: "Reject Claim" },
                        ].map((d) => (
                          <TouchableOpacity
                            key={d.id}
                            onPress={() => setDecision(d.id as any)}
                            style={[
                              styles.decisionBtn,
                              {
                                backgroundColor: decision === d.id ? "#0284C7" : cardBg,
                                borderColor: decision === d.id ? "#0284C7" : border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.decisionBtnText,
                                { color: decision === d.id ? "#FFFFFF" : textSecondary },
                              ]}
                            >
                              {d.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View>
                      <Text style={[styles.fieldLabel, { color: textPrimary }]}>Condition Score</Text>
                      <View style={{ flexDirection: "row", gap: scale(6) }}>
                        {(["GOOD", "FAIR", "DAMAGED"] as const).map((cs) => (
                          <TouchableOpacity
                            key={cs}
                            onPress={() => setConditionScore(cs)}
                            style={[
                              styles.decisionBtn,
                              {
                                backgroundColor: conditionScore === cs ? "#059669" : cardBg,
                                borderColor: conditionScore === cs ? "#059669" : border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.decisionBtnText,
                                { color: conditionScore === cs ? "#FFFFFF" : textSecondary },
                              ]}
                            >
                              {cs}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View>
                      <Text style={[styles.fieldLabel, { color: textPrimary }]}>Examination Notes</Text>
                      <TextInput
                        placeholder="Enter policy examination and condition findings..."
                        placeholderTextColor={textSecondary}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        style={[styles.modalInputArea, { color: textPrimary, borderColor: border }]}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={submitting}
                      onPress={handleExamineSubmit}
                      style={styles.submitBtn}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Record Decision & Notify</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View>
                      <Text style={[styles.fieldLabel, { color: textPrimary }]}>Rider Tracking Number</Text>
                      <TextInput
                        placeholder="TRK-XXXX..."
                        placeholderTextColor={textSecondary}
                        value={trackingNumber}
                        onChangeText={setTrackingNumber}
                        style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                      />
                    </View>

                    <View>
                      <Text style={[styles.fieldLabel, { color: textPrimary }]}>Pickup Instructions</Text>
                      <TextInput
                        placeholder="Enter pickup address verification and return box details..."
                        placeholderTextColor={textSecondary}
                        value={pickupNotes}
                        onChangeText={setPickupNotes}
                        multiline
                        numberOfLines={3}
                        style={[styles.modalInputArea, { color: textPrimary, borderColor: border }]}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={submitting}
                      onPress={handlePickupSubmit}
                      style={styles.submitBtn}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Dispatch Return Pickup</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
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
  flowNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(10),
    marginBottom: moderateScale(8),
  },
  flowNoticeText: {
    fontSize: moderateScale(11.5),
    flex: 1,
    lineHeight: moderateScale(16),
  },
  pillsScroll: {
    maxHeight: moderateScale(38),
    marginBottom: moderateScale(10),
  },
  filterPill: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11),
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  refundNum: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  vendorSubtitle: {
    fontSize: moderateScale(11),
  },
  reasonText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
  },
  amountLabel: {
    fontSize: moderateScale(10),
  },
  amountVal: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  examineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#0284C7",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
  },
  examineBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11.5),
    fontWeight: "700",
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
    marginBottom: moderateScale(10),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    marginTop: moderateScale(1),
  },
  modalSubTabs: {
    flexDirection: "row",
    borderRadius: scale(8),
    padding: scale(2),
    marginBottom: moderateScale(12),
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: moderateScale(6),
    alignItems: "center",
    borderRadius: scale(6),
  },
  subTabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  subTabText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  infoLabel: {
    fontSize: moderateScale(12),
  },
  infoVal: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: moderateScale(4),
  },
  decisionRow: {
    gap: moderateScale(6),
  },
  decisionBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(6),
    borderWidth: 1,
    alignItems: "center",
  },
  decisionBtnText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
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
    height: moderateScale(65),
    textAlignVertical: "top",
    fontSize: moderateScale(13),
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
});
