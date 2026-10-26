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
  examineVendorWithdrawalAdminApi,
  fetchVendorWithdrawalsAdminApi,
} from "@/store/services/adminService";

export default function StaffAdminWithdrawalsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [escalationStatus, setEscalationStatus] = useState<"ESCALATED" | "RECOMMENDED" | "REJECTED">("RECOMMENDED");
  const [submitting, setSubmitting] = useState(false);

  const loadWithdrawals = async () => {
    try {
      const res = await fetchVendorWithdrawalsAdminApi({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res?.data || Array.isArray(res)) {
        setWithdrawals(res.data || res);
      }
    } catch (e) {
      console.warn("[Withdrawals] Failed to load withdrawals", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadWithdrawals();
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWithdrawals();
  };

  const handleExamine = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await examineVendorWithdrawalAdminApi(selectedReq._id || selectedReq.id, {
        internalNotes: notes.trim() || undefined,
        escalationStatus,
      });

      Alert.alert(
        "Escalated to Superadmin",
        `Withdrawal request for Rs.${selectedReq.amount} marked as ${escalationStatus} and escalated to central treasury.`
      );
      setSelectedReq(null);
      setNotes("");
      loadWithdrawals();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to examine withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const STATUS_PILLS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Withdrawal Review"
        subtitle={`${withdrawals.length} Scoped Requests`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Security Alert Notice */}
        <View style={[styles.noticeCard, { backgroundColor: cardBg, borderColor: border }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={scale(20)} color="#D97706" />
          <Text style={[styles.noticeText, { color: textSecondary }]}>
            StaffAdmin examines requested amounts and adds review notes. Final payouts are authorized strictly by Superadmin.
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.pillsRow}>
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
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading withdrawal requests...
            </Text>
          </View>
        ) : (
          <FlatList
            data={withdrawals}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              const vendorName =
                item.vendor?.businessDetails?.businessName ||
                item.vendorName ||
                "Assigned Store";

              return (
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ gap: moderateScale(2) }}>
                      <Text style={[styles.vendorTitle, { color: textPrimary }]}>
                        {vendorName}
                      </Text>
                      <Text style={[styles.reqDate, { color: textSecondary }]}>
                        Requested on {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                      </Text>
                    </View>
                    <RequestStatusBadge status={item.status} type="withdrawal" />
                  </View>

                  <View style={[styles.amountRow, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                    <View style={{ gap: moderateScale(1) }}>
                      <Text style={[styles.amountLabel, { color: textSecondary }]}>Amount</Text>
                      <Text style={[styles.amountVal, { color: "#0284C7" }]}>
                        Rs. {Number(item.amount || item.grossAmount || 0).toLocaleString()}
                      </Text>
                    </View>

                    {item.status === "PENDING" && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedReq(item);
                          setNotes(item.internalNotes || "");
                        }}
                        style={styles.examineBtn}
                      >
                        <Feather name="check-square" size={scale(14)} color="#FFFFFF" />
                        <Text style={styles.examineBtnText}>Examine & Escalate</Text>
                      </TouchableOpacity>
                    )}
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
                <MaterialCommunityIcons name="cash-remove" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Requests</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No withdrawal requests in this category.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Examination Modal */}
      {selectedReq && (
        <Modal
          visible={!!selectedReq}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReq(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Examine Withdrawal
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    Store: {selectedReq.vendor?.businessDetails?.businessName || selectedReq.vendorName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReq(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: moderateScale(12) }}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: textSecondary }]}>Requested Payout</Text>
                  <Text style={[styles.infoVal, { color: "#0284C7" }]}>
                    Rs. {Number(selectedReq.amount || selectedReq.grossAmount || 0).toLocaleString()}
                  </Text>
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>Recommendation to Superadmin</Text>
                  <View style={styles.recRow}>
                    {(["RECOMMENDED", "ESCALATED", "REJECTED"] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setEscalationStatus(r)}
                        style={[
                          styles.recBtn,
                          {
                            backgroundColor: escalationStatus === r ? "#0284C7" : cardBg,
                            borderColor: escalationStatus === r ? "#0284C7" : border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.recBtnText,
                            { color: escalationStatus === r ? "#FFFFFF" : textSecondary },
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>Staff Audit Notes</Text>
                  <TextInput
                    placeholder="Enter ledger review notes for Superadmin..."
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
                  onPress={handleExamine}
                  style={styles.submitBtn}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Forward to Superadmin</Text>
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
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(10),
    marginBottom: moderateScale(10),
  },
  noticeText: {
    fontSize: moderateScale(11.5),
    flex: 1,
    lineHeight: moderateScale(16),
  },
  pillsRow: {
    flexDirection: "row",
    gap: scale(6),
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
  vendorTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  reqDate: {
    fontSize: moderateScale(11),
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
  },
  amountLabel: {
    fontSize: moderateScale(10.5),
  },
  amountVal: {
    fontSize: moderateScale(14),
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(6),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: {
    fontSize: moderateScale(12),
  },
  infoVal: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: moderateScale(4),
  },
  recRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: moderateScale(4),
  },
  recBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  recBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  modalInputArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    height: moderateScale(70),
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
