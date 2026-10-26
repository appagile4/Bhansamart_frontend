import React, { useCallback, useEffect, useState } from "react";
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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AdminHeader from "@/components/AdminHeader";
import AdminStoreFilterDropdown from "@/components/AdminStoreFilterDropdown";
import { moderateScale, scale, useTheme } from "@/theme";
import { useAppSelector } from "@/store/hooks";
import {
  examineVendorWithdrawalAdminApi,
  fetchStaffAssignedVendorsApi,
  fetchVendorWithdrawalsAdminApi,
} from "@/store/services/adminService";

export default function AdminWithdrawalsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperadmin = currentUser?.role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Examination Modal State
  const [examiningItem, setExaminingItem] = useState<any | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [escalationStatus, setEscalationStatus] = useState("FORWARDED_TO_FINANCE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load Assigned Vendors
  const loadVendors = async () => {
    try {
      const res = await fetchStaffAssignedVendorsApi();
      if (res?.vendors) {
        setAssignedVendors(res.vendors);
      }
    } catch (err) {
      console.error("Failed to load assigned vendors", err);
    }
  };

  // Load Withdrawals
  const loadWithdrawals = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        const params: any = { page: targetPage, limit: 10 };
        if (selectedVendorId !== "all") {
          params.vendorId = selectedVendorId;
        }
        if (selectedStatus !== "all") {
          params.status = selectedStatus;
        }
        const res = await fetchVendorWithdrawalsAdminApi(params);
        if (res?.withdrawals) {
          setWithdrawals(res.withdrawals);
          setPage(res.pagination?.page || 1);
          setTotalPages(res.pagination?.pages || 1);
          setTotalCount(res.pagination?.total || 0);
        }
      } catch (err) {
        console.error("Failed to load withdrawals", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedVendorId, selectedStatus]
  );

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    loadWithdrawals(1);
  }, [loadWithdrawals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendors(), loadWithdrawals(1)]);
    setRefreshing(false);
  };

  const openExamineModal = (item: any) => {
    setExaminingItem(item);
    setInternalNotes(item.internalNotes || "");
    setEscalationStatus(item.escalationStatus || "FORWARDED_TO_FINANCE");
    setRejectionReason(item.rejectionReason || "");
  };

  const handleSaveExamination = async () => {
    if (!examiningItem) return;
    try {
      setSubmitting(true);
      await examineVendorWithdrawalAdminApi(examiningItem._id || examiningItem.id, {
        internalNotes: internalNotes.trim(),
        escalationStatus,
        rejectionReason: rejectionReason.trim() || undefined,
      });

      Alert.alert("Success", "Withdrawal examination and escalation saved successfully.");
      setExaminingItem(null);
      loadWithdrawals(page);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to update withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  // Colors
  const bg = isDark ? "#0A0F12" : "#F8FAFC";
  const cardBg = isDark ? "#141D22" : "#FFFFFF";
  const border = isDark ? "#24323B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const statusFilters = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "PENDING" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "APPROVED":
        return "#10B981";
      case "PENDING":
        return "#F59E0B";
      case "PROCESSING":
        return "#0EA5E9";
      case "REJECTED":
        return "#EF4444";
      default:
        return textSecondary;
    }
  };

  const getEscalationBadge = (esc: string) => {
    switch (esc) {
      case "FORWARDED_TO_FINANCE":
        return { label: "Forwarded to Finance", bg: "rgba(168, 85, 247, 0.15)", color: "#A855F7" };
      case "NEEDS_CLARIFICATION":
        return { label: "Needs Clarification", bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" };
      case "EXAMINED_BY_STAFF":
        return { label: "Examined by Staff", bg: "rgba(14, 165, 233, 0.15)", color: "#0EA5E9" };
      case "RESOLVED":
        return { label: "Resolved", bg: "rgba(16, 185, 129, 0.15)", color: "#10B981" };
      default:
        return { label: "Not Examined", bg: "rgba(100, 116, 139, 0.15)", color: textSecondary };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Vendor Withdrawals"
        subtitle="Payout Operations & Financial Escalation"
        showBack
      />

      {/* Role Notice Banner */}
      <View style={[styles.noticeBanner, { backgroundColor: isDark ? "#1C242B" : "#FEF3C7", borderColor: "#F59E0B" }]}>
        <Feather name="shield" size={scale(16)} color="#F59E0B" />
        <Text style={[styles.noticeText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
          {isSuperadmin
            ? "Superadmin Mode: You can review, examine, and settle vendor withdrawal payouts."
            : "StaffAdmin Review Mode: StaffAdmins examine banking details, verify store sales, and escalate requests to Finance. Direct wallet debits require Finance/Superadmin signoff."}
        </Text>
      </View>

      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item._id || item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Vendor Scope Selector */}
            <AdminStoreFilterDropdown
              vendors={assignedVendors}
              selectedVendorId={selectedVendorId}
              onSelectVendor={(vId) => setSelectedVendorId(vId)}
              title="Assigned Store Scope"
            />

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {statusFilters.map((sf) => {
                const isSel = selectedStatus === sf.value;
                return (
                  <TouchableOpacity
                    key={sf.value}
                    style={[
                      styles.statusPill,
                      { backgroundColor: cardBg, borderColor: border },
                      isSel && styles.statusPillActive,
                    ]}
                    onPress={() => setSelectedStatus(sf.value)}
                  >
                    <Text style={[styles.pillText, { color: isSel ? "#10B981" : textSecondary }]}>
                      {sf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.countRow}>
              <Text style={[styles.countText, { color: textSecondary }]}>
                Showing {withdrawals.length} of {totalCount} withdrawal requests
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const esc = getEscalationBadge(item.escalationStatus || "NONE");
          const statusCol = getStatusColor(item.status);

          return (
            <View style={[styles.withdrawalCard, { backgroundColor: cardBg, borderColor: border }]}>
              {/* Card Header */}
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vendorTitle, { color: textPrimary }]}>
                    {item.vendor?.storeName || item.vendorName || "Vendor"}
                  </Text>
                  <Text style={[styles.reqDate, { color: textSecondary }]}>
                    Requested: {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: `${statusCol}20` }]}>
                  <Text style={[styles.statusBadgeText, { color: statusCol }]}>{item.status}</Text>
                </View>
              </View>

              {/* Amount & Escalation Banner */}
              <View style={styles.amountRow}>
                <View>
                  <Text style={[styles.amountLabel, { color: textSecondary }]}>Requested Payout</Text>
                  <Text style={[styles.amountValue, { color: textPrimary }]}>
                    ₹{(item.amount || 0).toLocaleString("en-IN")}
                  </Text>
                </View>

                <View style={[styles.escBadge, { backgroundColor: esc.bg }]}>
                  <Text style={[styles.escBadgeText, { color: esc.color }]}>{esc.label}</Text>
                </View>
              </View>

              {/* Bank / UPI Details */}
              <View style={[styles.bankInfoBox, { backgroundColor: bg, borderColor: border }]}>
                <MaterialCommunityIcons name="bank-outline" size={scale(16)} color="#0EA5E9" />
                <View style={{ marginLeft: scale(8), flex: 1 }}>
                  <Text style={[styles.bankText, { color: textPrimary }]}>
                    {item.bankDetails?.bankName || item.payoutMethod || "Bank Transfer"} • {item.bankDetails?.accountNumber ? `A/C ...${item.bankDetails.accountNumber.slice(-4)}` : item.bankDetails?.upiId || "UPI"}
                  </Text>
                  <Text style={[styles.ifscText, { color: textSecondary }]}>
                    IFSC: {item.bankDetails?.ifscCode || "N/A"} • Holder: {item.bankDetails?.accountHolderName || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Notes Preview if available */}
              {item.internalNotes ? (
                <View style={styles.notesPreview}>
                  <Text style={[styles.notesPreviewLabel, { color: textSecondary }]}>Staff Notes:</Text>
                  <Text style={[styles.notesPreviewText, { color: textPrimary }]} numberOfLines={2}>
                    {item.internalNotes}
                  </Text>
                </View>
              ) : null}

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.examineBtn, { borderColor: "#10B981" }]}
                onPress={() => openExamineModal(item)}
              >
                <Feather name="file-text" size={scale(14)} color="#10B981" />
                <Text style={styles.examineBtnText}>Examine & Escalate to Finance</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                Loading withdrawal requests...
              </Text>
            </View>
          ) : (
            <View style={styles.centerWrap}>
              <MaterialCommunityIcons name="cash-check" size={scale(48)} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                No withdrawal requests found for selected scope.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationFooter}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => loadWithdrawals(page - 1)}
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              >
                <Feather name="chevron-left" size={scale(16)} color={page <= 1 ? textSecondary : textPrimary} />
                <Text style={[styles.pageBtnText, { color: page <= 1 ? textSecondary : textPrimary }]}>Prev</Text>
              </TouchableOpacity>
              <Text style={[styles.pageInfoText, { color: textSecondary }]}>
                Page {page} of {totalPages}
              </Text>
              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => loadWithdrawals(page + 1)}
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, { color: page >= totalPages ? textSecondary : textPrimary }]}>Next</Text>
                <Feather name="chevron-right" size={scale(16)} color={page >= totalPages ? textSecondary : textPrimary} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* Examination Modal */}
      <Modal visible={!!examiningItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Examine Withdrawal Request</Text>
              <TouchableOpacity onPress={() => setExaminingItem(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: scale(450) }}>
              {examiningItem && (
                <>
                  <View style={[styles.modalSummaryBox, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[styles.modalVendorName, { color: textPrimary }]}>
                      {examiningItem.vendor?.storeName || examiningItem.vendorName}
                    </Text>
                    <Text style={[styles.modalAmount, { color: "#10B981" }]}>
                      ₹{(examiningItem.amount || 0).toLocaleString("en-IN")}
                    </Text>
                    <Text style={[styles.modalAccountInfo, { color: textSecondary }]}>
                      Method: {examiningItem.payoutMethod || "Bank"} • Status: {examiningItem.status}
                    </Text>
                  </View>

                  {/* Escalation Status Select */}
                  <Text style={[styles.inputLabel, { color: textPrimary }]}>Escalation Action:</Text>
                  <View style={styles.escalationBtnRow}>
                    {[
                      { label: "Forward to Finance", val: "FORWARDED_TO_FINANCE", color: "#A855F7" },
                      { label: "Needs Clarification", val: "NEEDS_CLARIFICATION", color: "#F59E0B" },
                      { label: "Examined / Verified", val: "EXAMINED_BY_STAFF", color: "#0EA5E9" },
                    ].map((opt) => {
                      const isSel = escalationStatus === opt.val;
                      return (
                        <TouchableOpacity
                          key={opt.val}
                          style={[
                            styles.escalationOptionBtn,
                            { borderColor: isSel ? opt.color : border },
                            isSel && { backgroundColor: `${opt.color}18` },
                          ]}
                          onPress={() => setEscalationStatus(opt.val)}
                        >
                          <Text style={[styles.escalationOptionText, { color: isSel ? opt.color : textSecondary }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Internal Operational Notes */}
                  <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(12) }]}>
                    Internal Operational Notes:
                  </Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                    placeholder="Enter audit notes on order fulfillments, bank verification, or refund reserves..."
                    placeholderTextColor={textSecondary}
                    multiline
                    numberOfLines={4}
                    value={internalNotes}
                    onChangeText={setInternalNotes}
                  />

                  {/* Rejection Reason (Optional) */}
                  <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                    Rejection / Discrepancy Reason (if any):
                  </Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                    placeholder="e.g., Bank IFSC mismatch, unresolved customer disputes..."
                    placeholderTextColor={textSecondary}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                  />

                  <View style={[styles.payoutNotice, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
                    <Feather name="info" size={scale(13)} color="#F59E0B" />
                    <Text style={[styles.payoutNoticeText, { color: textSecondary }]}>
                      Saving this examination updates the internal ledger log and alerts the Finance department for disbursement.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: border }]}
                onPress={() => setExaminingItem(null)}
              >
                <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
                disabled={submitting}
                onPress={handleSaveExamination}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save & Escalate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    gap: scale(8),
  },
  noticeText: {
    flex: 1,
    fontSize: moderateScale(11),
    lineHeight: scale(16),
  },
  listContent: {
    padding: scale(14),
    paddingBottom: scale(40),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    marginLeft: scale(6),
  },
  pillScroll: {
    flexDirection: "row",
    marginBottom: scale(10),
  },
  filterPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(18),
    borderWidth: 1,
    marginRight: scale(8),
  },
  filterPillActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  statusPill: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(14),
    borderWidth: 1,
    marginRight: scale(6),
  },
  statusPillActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  pillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  countRow: {
    marginBottom: scale(10),
  },
  countText: {
    fontSize: moderateScale(11),
  },
  withdrawalCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(12),
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  vendorTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  reqDate: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: scale(10),
  },
  amountLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
  },
  amountValue: {
    fontSize: moderateScale(18),
    fontWeight: "900",
  },
  escBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  escBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  bankInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(8),
    marginBottom: scale(8),
  },
  bankText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  ifscText: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  notesPreview: {
    marginBottom: scale(8),
  },
  notesPreviewLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  notesPreviewText: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  examineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingVertical: scale(7),
    gap: scale(6),
    marginTop: scale(4),
  },
  examineBtnText: {
    color: "#10B981",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  centerWrap: {
    paddingVertical: scale(40),
    alignItems: "center",
  },
  emptyText: {
    fontSize: moderateScale(12),
  },
  paginationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scale(12),
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    padding: scale(6),
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  pageInfoText: {
    fontSize: moderateScale(11),
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
  modalSummaryBox: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(10),
    marginBottom: scale(12),
  },
  modalVendorName: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  modalAmount: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    marginVertical: scale(2),
  },
  modalAccountInfo: {
    fontSize: moderateScale(11),
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: scale(6),
  },
  escalationBtnRow: {
    gap: scale(6),
  },
  escalationOptionBtn: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingVertical: scale(7),
    paddingHorizontal: scale(10),
  },
  escalationOptionText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: moderateScale(11),
    textAlignVertical: "top",
    minHeight: scale(70),
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(8),
    fontSize: moderateScale(11),
  },
  payoutNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(6),
    padding: scale(8),
    gap: scale(6),
    marginTop: scale(12),
  },
  payoutNoticeText: {
    flex: 1,
    fontSize: moderateScale(10),
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(14),
  },
  cancelBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
});
