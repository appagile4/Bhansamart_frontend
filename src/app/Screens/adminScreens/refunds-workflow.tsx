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
import { Image } from "expo-image";
import AdminHeader from "@/components/AdminHeader";
import AdminStoreFilterDropdown from "@/components/AdminStoreFilterDropdown";
import { moderateScale, scale, useTheme } from "@/theme";
import { useAppSelector } from "@/store/hooks";
import {
  fetchDeliveryAssignmentsAdminApi,
  fetchRefundsQueueAdminApi,
  fetchStaffAssignedVendorsApi,
  finalizeRefundPayoutActionApi,
  recordRefundInspectionActionApi,
  staffExamineRefundActionApi,
  updateRefundPickupActionApi,
} from "@/store/services/adminService";

export default function AdminRefundsWorkflowScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperadmin = currentUser?.role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const [claims, setClaims] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delivery boys list for reverse pickup assignment
  const [riders, setRiders] = useState<any[]>([]);

  // Modals State
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"EXAMINE" | "PICKUP" | "INSPECTION" | "FINALIZE" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Examine Form State
  const [examineDecision, setExamineDecision] = useState<"FORWARD_TO_FINANCE" | "REQUIRE_RETURN_PICKUP" | "REJECTED">("REQUIRE_RETURN_PICKUP");
  const [examineNotes, setExamineNotes] = useState("");
  const [conditionScore, setConditionScore] = useState("Good");
  const [depreciationPercent, setDepreciationPercent] = useState("0");

  // Pickup Form State
  const [pickupDeliveryBoyId, setPickupDeliveryBoyId] = useState("");
  const [pickupStatus, setPickupStatus] = useState("RETURN_PICKUP_SCHEDULED");
  const [pickupTracking, setPickupTracking] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Inspection Form State
  const [inspectionPassed, setInspectionPassed] = useState(true);
  const [conditionGrade, setConditionGrade] = useState<"A" | "B" | "C" | "DAMAGED" | "WRONG_ITEM">("A");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [inspectionDepreciation, setInspectionDepreciation] = useState("0");
  const [recommendedAction, setRecommendedAction] = useState("Refund Full Amount");

  // Finalize Form State (Superadmin)
  const [finalizeAction, setFinalizeAction] = useState<"approve" | "reject">("approve");
  const [finalizeNotes, setFinalizeNotes] = useState("");

  const loadVendorsAndRiders = async () => {
    try {
      const vRes = await fetchStaffAssignedVendorsApi();
      if (vRes?.vendors) {
        setAssignedVendors(vRes.vendors);
      }
      const rRes = await fetchDeliveryAssignmentsAdminApi();
      if (rRes?.assignments) {
        // Collect unique riders
        const riderMap = new Map();
        rRes.assignments.forEach((a: any) => {
          if (a.deliveryBoy && (a.deliveryBoy._id || a.deliveryBoy.id)) {
            riderMap.set(a.deliveryBoy._id || a.deliveryBoy.id, a.deliveryBoy);
          }
        });
        setRiders(Array.from(riderMap.values()));
      }
    } catch (err) {
      console.error("Failed to load vendors/riders", err);
    }
  };

  const loadClaims = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        const params: any = { page: targetPage, limit: 10 };
        if (selectedVendorId !== "all") {
          params.vendorId = selectedVendorId;
        }
        if (activeTab !== "ALL") {
          params.status = activeTab;
        }
        const res = await fetchRefundsQueueAdminApi(params);
        if (res?.refunds) {
          setClaims(res.refunds);
          setPage(res.pagination?.page || 1);
          setTotalPages(res.pagination?.pages || 1);
          setTotalCount(res.pagination?.total || 0);
        }
      } catch (err) {
        console.error("Failed to load refund queue", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedVendorId, activeTab]
  );

  useEffect(() => {
    loadVendorsAndRiders();
  }, []);

  useEffect(() => {
    loadClaims(1);
  }, [loadClaims]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendorsAndRiders(), loadClaims(1)]);
    setRefreshing(false);
  };

  // Open Actions
  const openExamineModal = (claim: any) => {
    setSelectedClaim(claim);
    setExamineDecision(claim.pickup ? "REQUIRE_RETURN_PICKUP" : "FORWARD_TO_FINANCE");
    setExamineNotes(claim.staffReview?.notes || "");
    setConditionScore(claim.staffReview?.conditionScore || "Good");
    setDepreciationPercent(String(claim.staffReview?.estimatedDepreciation || 0));
    setActiveModal("EXAMINE");
  };

  const openPickupModal = (claim: any) => {
    setSelectedClaim(claim);
    setPickupDeliveryBoyId(claim.pickup?.deliveryBoy?._id || claim.pickup?.deliveryBoy || "");
    setPickupStatus(claim.pickup?.status || "RETURN_PICKUP_SCHEDULED");
    setPickupTracking(claim.pickup?.trackingNumber || "");
    setPickupNotes(claim.pickup?.notes || "");
    setActiveModal("PICKUP");
  };

  const openInspectionModal = (claim: any) => {
    setSelectedClaim(claim);
    setInspectionPassed(claim.inspection?.passed ?? true);
    setConditionGrade(claim.inspection?.conditionGrade || "A");
    setInspectionNotes(claim.inspection?.notes || "");
    setInspectionDepreciation(String(claim.inspection?.depreciationPercentage || 0));
    setRecommendedAction(claim.inspection?.recommendedAction || "Refund Full Amount");
    setActiveModal("INSPECTION");
  };

  const openFinalizeModal = (claim: any) => {
    setSelectedClaim(claim);
    setFinalizeAction("approve");
    setFinalizeNotes("");
    setActiveModal("FINALIZE");
  };

  // Submit Handlers
  const handleExecuteExamine = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      await staffExamineRefundActionApi(selectedClaim._id || selectedClaim.id, {
        decision: examineDecision,
        examinationNotes: examineNotes.trim(),
        conditionScore,
        estimatedDepreciation: Number(depreciationPercent) || 0,
      });

      Alert.alert("Success", "Staff examination recorded and workflow updated.");
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to examine refund claim");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecutePickup = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      await updateRefundPickupActionApi(selectedClaim._id || selectedClaim.id, {
        deliveryBoyId: pickupDeliveryBoyId || undefined,
        pickupStatus,
        pickupNotes: pickupNotes.trim(),
        trackingNumber: pickupTracking.trim() || undefined,
      });

      Alert.alert("Success", "Reverse pickup updated successfully.");
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to update pickup");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteInspection = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      await recordRefundInspectionActionApi(selectedClaim._id || selectedClaim.id, {
        passed: inspectionPassed,
        conditionGrade,
        inspectionNotes: inspectionNotes.trim(),
        depreciationPercentage: Number(inspectionDepreciation) || 0,
        recommendedAction,
      });

      Alert.alert("Success", "Physical inspection recorded successfully.");
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to record inspection");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteFinalize = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      await finalizeRefundPayoutActionApi(selectedClaim._id || selectedClaim.id, {
        action: finalizeAction,
        notes: finalizeNotes.trim(),
      });

      Alert.alert("Success", `Refund payout ${finalizeAction === "approve" ? "approved and executed" : "rejected"}.`);
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to finalize payout");
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

  const tabs = [
    { label: "All Claims", value: "ALL" },
    { label: "Vendor Review", value: "VENDOR_REVIEW" },
    { label: "Staff Examining", value: "STAFF_EXAMINING" },
    { label: "Reverse Pickup", value: "RETURN_PICKUP_SCHEDULED" },
    { label: "Inspection", value: "RETURN_RECEIVED" },
    { label: "Finance Queue", value: "FORWARDED_TO_FINANCE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return { label: "Completed", bg: "rgba(16, 185, 129, 0.15)", color: "#10B981" };
      case "FORWARDED_TO_FINANCE":
      case "APPROVED":
      case "PROCESSING":
        return { label: "Finance Settlement", bg: "rgba(168, 85, 247, 0.15)", color: "#A855F7" };
      case "STAFF_EXAMINING":
        return { label: "Staff Examining", bg: "rgba(14, 165, 233, 0.15)", color: "#0EA5E9" };
      case "VENDOR_REVIEW":
      case "REQUESTED":
        return { label: "Vendor Review", bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" };
      case "RETURN_PICKUP_SCHEDULED":
      case "RETURN_PICKED_UP":
        return { label: "Pickup in Transit", bg: "rgba(99, 102, 241, 0.15)", color: "#6366F1" };
      case "RETURN_RECEIVED":
        return { label: "Physical Inspection", bg: "rgba(234, 179, 8, 0.15)", color: "#EAB308" };
      case "REJECTED":
      case "FAILED":
      case "INSPECTED_FAILED":
        return { label: "Rejected / Failed", bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444" };
      default:
        return { label: status, bg: "rgba(100, 116, 139, 0.15)", color: textSecondary };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Refund & Return Ops"
        subtitle="Lifecycle Examination & Escalation"
        showBack
      />

      <FlatList
        data={claims}
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

            {/* Stage Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {tabs.map((t) => {
                const isSel = activeTab === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.statusPill,
                      { backgroundColor: cardBg, borderColor: border },
                      isSel && styles.statusPillActive,
                    ]}
                    onPress={() => setActiveTab(t.value)}
                  >
                    <Text style={[styles.pillText, { color: isSel ? "#10B981" : textSecondary }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.countRow}>
              <Text style={[styles.countText, { color: textSecondary }]}>
                {claims.length} of {totalCount} claim tickets
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          const customerName = item.user?.name || item.customerName || "Customer";
          const vendorName = item.vendor?.storeName || item.vendorName || "Store";
          const orderNumber = item.order?.orderNumber || item.order?._id?.slice(-8) || "N/A";

          return (
            <View style={[styles.claimCard, { backgroundColor: cardBg, borderColor: border }]}>
              {/* Header */}
              <View style={styles.claimHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderNumber, { color: textPrimary }]}>Order #{orderNumber}</Text>
                  <Text style={[styles.vendorSub, { color: textSecondary }]}>Vendor: {vendorName}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              {/* Claim Body */}
              <View style={styles.claimBody}>
                <View style={styles.bodyRow}>
                  <Text style={[styles.claimType, { color: "#10B981" }]}>
                    {item.type || "REFUND"} CLAIM • ₹{(item.amount || 0).toLocaleString("en-IN")}
                  </Text>
                  <Text style={[styles.claimCustomer, { color: textSecondary }]}>By: {customerName}</Text>
                </View>

                <Text style={[styles.claimReason, { color: textPrimary }]}>
                  Reason: <Text style={{ fontWeight: "400" }}>{item.reason || "Product return requested"}</Text>
                </Text>

                {/* Customer Proof Images if present */}
                {item.images && item.images.length > 0 && (
                  <View style={styles.imagesRow}>
                    <Text style={[styles.imagesLabel, { color: textSecondary }]}>Proof Images ({item.images.length}):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: scale(4) }}>
                      {item.images.map((imgUri: string, idx: number) => (
                        <Image
                          key={idx}
                          source={{ uri: imgUri }}
                          style={styles.proofThumb}
                          contentFit="cover"
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Vendor Initial Review Section */}
                {item.vendorReview && (
                  <View style={[styles.subReviewBox, { backgroundColor: bg, borderColor: border }]}>
                    <View style={styles.subReviewHeader}>
                      <MaterialCommunityIcons name="storefront-outline" size={scale(14)} color="#10B981" />
                      <Text style={[styles.subReviewTitle, { color: textPrimary }]}>Vendor Feedback</Text>
                      <Text style={[styles.subReviewStatus, { color: item.vendorReview.decision === "ACCEPT" ? "#10B981" : "#EF4444" }]}>
                        {item.vendorReview.decision}
                      </Text>
                    </View>
                    {item.vendorReview.vendorNotes ? (
                      <Text style={[styles.subReviewNotes, { color: textSecondary }]}>
                        "{item.vendorReview.vendorNotes}"
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Staff Review Section if done */}
                {item.staffReview && (
                  <View style={[styles.subReviewBox, { backgroundColor: bg, borderColor: border }]}>
                    <View style={styles.subReviewHeader}>
                      <MaterialCommunityIcons name="shield-check-outline" size={scale(14)} color="#0EA5E9" />
                      <Text style={[styles.subReviewTitle, { color: textPrimary }]}>Staff Examination</Text>
                      <Text style={[styles.subReviewStatus, { color: "#0EA5E9" }]}>
                        {item.staffReview.decision}
                      </Text>
                    </View>
                    {item.staffReview.notes ? (
                      <Text style={[styles.subReviewNotes, { color: textSecondary }]}>
                        "{item.staffReview.notes}"
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Inspection Info if recorded */}
                {item.inspection && (
                  <View style={[styles.subReviewBox, { backgroundColor: bg, borderColor: border }]}>
                    <View style={styles.subReviewHeader}>
                      <MaterialCommunityIcons name="magnify-scan" size={scale(14)} color="#EAB308" />
                      <Text style={[styles.subReviewTitle, { color: textPrimary }]}>Physical Inspection</Text>
                      <Text style={[styles.subReviewStatus, { color: item.inspection.passed ? "#10B981" : "#EF4444" }]}>
                        Grade {item.inspection.conditionGrade || "A"} • {item.inspection.passed ? "PASSED" : "FAILED"}
                      </Text>
                    </View>
                    {item.inspection.notes ? (
                      <Text style={[styles.subReviewNotes, { color: textSecondary }]}>
                        "{item.inspection.notes}"
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Action Buttons Row */}
              <View style={[styles.actionsRow, { borderTopColor: border }]}>
                {/* 1. Examine */}
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: "#0EA5E9" }]}
                  onPress={() => openExamineModal(item)}
                >
                  <Feather name="edit-3" size={scale(13)} color="#0EA5E9" />
                  <Text style={[styles.actionBtnText, { color: "#0EA5E9" }]}>Examine</Text>
                </TouchableOpacity>

                {/* 2. Pickup */}
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: "#6366F1" }]}
                  onPress={() => openPickupModal(item)}
                >
                  <MaterialCommunityIcons name="truck-delivery-outline" size={scale(14)} color="#6366F1" />
                  <Text style={[styles.actionBtnText, { color: "#6366F1" }]}>Pickup</Text>
                </TouchableOpacity>

                {/* 3. Inspect */}
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: "#EAB308" }]}
                  onPress={() => openInspectionModal(item)}
                >
                  <Feather name="check-square" size={scale(13)} color="#EAB308" />
                  <Text style={[styles.actionBtnText, { color: "#EAB308" }]}>Inspect</Text>
                </TouchableOpacity>

                {/* 4. Superadmin Finalize */}
                {isSuperadmin && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.1)" }]}
                    onPress={() => openFinalizeModal(item)}
                  >
                    <Feather name="dollar-sign" size={scale(13)} color="#10B981" />
                    <Text style={[styles.actionBtnText, { color: "#10B981" }]}>Disburse</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                Loading return & refund claims...
              </Text>
            </View>
          ) : (
            <View style={styles.centerWrap}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={scale(48)} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                No refund claims found for this filter.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationFooter}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => loadClaims(page - 1)}
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
                onPress={() => loadClaims(page + 1)}
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, { color: page >= totalPages ? textSecondary : textPrimary }]}>Next</Text>
                <Feather name="chevron-right" size={scale(16)} color={page >= totalPages ? textSecondary : textPrimary} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* Examine Modal */}
      <Modal visible={activeModal === "EXAMINE"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Staff Claim Examination</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: scale(450) }}>
              <Text style={[styles.inputLabel, { color: textPrimary }]}>Examination Verdict:</Text>
              <View style={styles.optionRow}>
                {[
                  { label: "Require Reverse Pickup", val: "REQUIRE_RETURN_PICKUP", color: "#6366F1" },
                  { label: "Forward Direct to Finance", val: "FORWARD_TO_FINANCE", color: "#A855F7" },
                  { label: "Reject Claim", val: "REJECTED", color: "#EF4444" },
                ].map((opt) => {
                  const isSel = examineDecision === opt.val;
                  return (
                    <TouchableOpacity
                      key={opt.val}
                      style={[
                        styles.optionBtn,
                        { borderColor: isSel ? opt.color : border },
                        isSel && { backgroundColor: `${opt.color}18` },
                      ]}
                      onPress={() => setExamineDecision(opt.val as any)}
                    >
                      <Text style={[styles.optionText, { color: isSel ? opt.color : textSecondary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                Condition Assessment:
              </Text>
              <View style={styles.optionRow}>
                {["Brand New", "Good", "Used / Opened", "Defective / Damaged"].map((cond) => {
                  const isSel = conditionScore === cond;
                  return (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.optionBtnSmall,
                        { borderColor: isSel ? "#10B981" : border },
                        isSel && { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                      ]}
                      onPress={() => setConditionScore(cond)}
                    >
                      <Text style={[styles.optionText, { color: isSel ? "#10B981" : textSecondary }]}>
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                Estimated Depreciation % (0 if full refund):
              </Text>
              <TextInput
                style={[styles.inputBox, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                keyboardType="numeric"
                value={depreciationPercent}
                onChangeText={setDepreciationPercent}
              />

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                Staff Auditor Examination Notes:
              </Text>
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                placeholder="Detail customer claims, unboxing videos, vendor comments, or reason for return..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={4}
                value={examineNotes}
                onChangeText={setExamineNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: border }]} onPress={() => setActiveModal(null)}>
                <Text style={[styles.modalCancelText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} disabled={submitting} onPress={handleExecuteExamine}>
                {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalSaveText}>Save Verdict</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pickup Modal */}
      <Modal visible={activeModal === "PICKUP"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Reverse Pickup Scheduling</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: scale(450) }}>
              <Text style={[styles.inputLabel, { color: textPrimary }]}>Assign Delivery Rider:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginBottom: scale(8) }}>
                {riders.map((r) => {
                  const isSel = pickupDeliveryBoyId === (r._id || r.id);
                  return (
                    <TouchableOpacity
                      key={r._id || r.id}
                      style={[
                        styles.optionBtnSmall,
                        { borderColor: isSel ? "#6366F1" : border },
                        isSel && { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                      ]}
                      onPress={() => setPickupDeliveryBoyId(r._id || r.id)}
                    >
                      <Text style={[styles.optionText, { color: isSel ? "#6366F1" : textSecondary }]}>
                        {r.name || "Rider"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>Pickup Status:</Text>
              <View style={styles.optionRow}>
                {[
                  { label: "Scheduled", val: "RETURN_PICKUP_SCHEDULED" },
                  { label: "Picked Up", val: "RETURN_PICKED_UP" },
                  { label: "Received at Warehouse", val: "RETURN_RECEIVED" },
                ].map((s) => {
                  const isSel = pickupStatus === s.val;
                  return (
                    <TouchableOpacity
                      key={s.val}
                      style={[
                        styles.optionBtn,
                        { borderColor: isSel ? "#10B981" : border },
                        isSel && { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                      ]}
                      onPress={() => setPickupStatus(s.val)}
                    >
                      <Text style={[styles.optionText, { color: isSel ? "#10B981" : textSecondary }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>Tracking / AWB Number:</Text>
              <TextInput
                style={[styles.inputBox, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                placeholder="e.g., BM-REV-987654"
                placeholderTextColor={textSecondary}
                value={pickupTracking}
                onChangeText={setPickupTracking}
              />

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>Pickup Notes:</Text>
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                placeholder="Rider instructions or warehouse intake remarks..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={pickupNotes}
                onChangeText={setPickupNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: border }]} onPress={() => setActiveModal(null)}>
                <Text style={[styles.modalCancelText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: "#6366F1" }]} disabled={submitting} onPress={handleExecutePickup}>
                {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalSaveText}>Update Pickup</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Inspection Modal */}
      <Modal visible={activeModal === "INSPECTION"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Warehouse Physical Inspection</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: scale(450) }}>
              <Text style={[styles.inputLabel, { color: textPrimary }]}>Inspection Result:</Text>
              <View style={{ flexDirection: "row", gap: scale(8), marginBottom: scale(10) }}>
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    { flex: 1, borderColor: inspectionPassed ? "#10B981" : border },
                    inspectionPassed && { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                  ]}
                  onPress={() => setInspectionPassed(true)}
                >
                  <Text style={[styles.optionText, { color: inspectionPassed ? "#10B981" : textSecondary }]}>
                    ✓ Passed Inspection
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    { flex: 1, borderColor: !inspectionPassed ? "#EF4444" : border },
                    !inspectionPassed && { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                  ]}
                  onPress={() => setInspectionPassed(false)}
                >
                  <Text style={[styles.optionText, { color: !inspectionPassed ? "#EF4444" : textSecondary }]}>
                    ✗ Inspection Failed
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary }]}>Physical Condition Grade:</Text>
              <View style={styles.optionRow}>
                {[
                  { label: "Grade A (Mint / Resellable)", val: "A" },
                  { label: "Grade B (Minor Box Wear)", val: "B" },
                  { label: "Grade C (Heavy Wear)", val: "C" },
                  { label: "Damaged / Broken", val: "DAMAGED" },
                  { label: "Wrong Item Returned", val: "WRONG_ITEM" },
                ].map((g) => {
                  const isSel = conditionGrade === g.val;
                  return (
                    <TouchableOpacity
                      key={g.val}
                      style={[
                        styles.optionBtn,
                        { borderColor: isSel ? "#EAB308" : border },
                        isSel && { backgroundColor: "rgba(234, 179, 8, 0.15)" },
                      ]}
                      onPress={() => setConditionGrade(g.val as any)}
                    >
                      <Text style={[styles.optionText, { color: isSel ? "#EAB308" : textSecondary }]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                Depreciation Deduction %:
              </Text>
              <TextInput
                style={[styles.inputBox, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                keyboardType="numeric"
                value={inspectionDepreciation}
                onChangeText={setInspectionDepreciation}
              />

              <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(10) }]}>
                Inspector Audit Notes:
              </Text>
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                placeholder="Serial number verification, seal status, missing accessories..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={inspectionNotes}
                onChangeText={setInspectionNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: border }]} onPress={() => setActiveModal(null)}>
                <Text style={[styles.modalCancelText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: "#EAB308" }]} disabled={submitting} onPress={handleExecuteInspection}>
                {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalSaveText}>Record Inspection</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Superadmin Finalize Payout Modal */}
      <Modal visible={activeModal === "FINALIZE"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Execute Payout Disbursal</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: scale(450) }}>
              <View style={[styles.payoutNotice, { backgroundColor: "rgba(16, 185, 129, 0.12)", marginBottom: scale(12) }]}>
                <Feather name="check-circle" size={scale(16)} color="#10B981" />
                <Text style={[styles.payoutNoticeText, { color: textPrimary }]}>
                  Superadmin Action: Approving triggers automated wallet / payment gateway refund transaction to the customer.
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary }]}>Disbursal Verdict:</Text>
              <View style={{ flexDirection: "row", gap: scale(8), marginBottom: scale(10) }}>
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    { flex: 1, borderColor: finalizeAction === "approve" ? "#10B981" : border },
                    finalizeAction === "approve" && { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                  ]}
                  onPress={() => setFinalizeAction("approve")}
                >
                  <Text style={[styles.optionText, { color: finalizeAction === "approve" ? "#10B981" : textSecondary }]}>
                    ✓ Disburse Refund
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    { flex: 1, borderColor: finalizeAction === "reject" ? "#EF4444" : border },
                    finalizeAction === "reject" && { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                  ]}
                  onPress={() => setFinalizeAction("reject")}
                >
                  <Text style={[styles.optionText, { color: finalizeAction === "reject" ? "#EF4444" : textSecondary }]}>
                    ✗ Reject Disbursal
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: textPrimary }]}>Disbursal Audit Notes:</Text>
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                placeholder="Finance payment voucher reference or rejection rationale..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={finalizeNotes}
                onChangeText={setFinalizeNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: border }]} onPress={() => setActiveModal(null)}>
                <Text style={[styles.modalCancelText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} disabled={submitting} onPress={handleExecuteFinalize}>
                {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalSaveText}>Confirm Payout</Text>}
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
  claimCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(12),
  },
  claimHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumber: {
    fontSize: moderateScale(13),
    fontWeight: "900",
  },
  vendorSub: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
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
  claimBody: {
    marginTop: scale(10),
  },
  bodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  claimType: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  claimCustomer: {
    fontSize: moderateScale(11),
  },
  claimReason: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginTop: scale(4),
  },
  imagesRow: {
    marginTop: scale(6),
  },
  imagesLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  proofThumb: {
    width: scale(55),
    height: scale(55),
    borderRadius: scale(6),
    marginRight: scale(8),
  },
  subReviewBox: {
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(8),
    marginTop: scale(8),
  },
  subReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  subReviewTitle: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    flex: 1,
  },
  subReviewStatus: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  subReviewNotes: {
    fontSize: moderateScale(10),
    marginTop: scale(4),
    fontStyle: "italic",
  },
  actionsRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: scale(10),
    paddingTop: scale(10),
    borderTopWidth: 0.8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
    gap: scale(4),
  },
  actionBtnText: {
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
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: scale(6),
  },
  optionRow: {
    gap: scale(6),
    marginBottom: scale(8),
  },
  optionBtn: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    alignItems: "center",
  },
  optionBtnSmall: {
    borderWidth: 1,
    borderRadius: scale(6),
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    marginRight: scale(6),
    marginBottom: scale(4),
  },
  optionText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(8),
    fontSize: moderateScale(11),
    marginBottom: scale(6),
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: moderateScale(11),
    textAlignVertical: "top",
    minHeight: scale(70),
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
    backgroundColor: "#10B981",
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
  payoutNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(6),
    padding: scale(8),
    gap: scale(6),
  },
  payoutNoticeText: {
    flex: 1,
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
});
