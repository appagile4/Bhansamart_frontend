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
import {
  fetchBrandsReviewQueueAdminApi,
  fetchStaffAssignedVendorsApi,
  reviewBrandAdminApi,
} from "@/store/services/adminService";

export default function AdminBrandsReviewScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState<string>("");

  const [brands, setBrands] = useState<any[]>([]);

  // Review Modal State
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_info">("approve");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (selectedVendorId !== "all") {
        params.vendorId = selectedVendorId;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await fetchBrandsReviewQueueAdminApi(params);
      if (res?.brands) {
        setBrands(res.brands);
      }
    } catch (err) {
      console.error("Failed to load brands review queue", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVendorId, statusFilter, search]);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendors(), loadBrands()]);
    setRefreshing(false);
  };

  const openReviewModal = (brand: any, defaultAction: "approve" | "reject" | "request_info" = "approve") => {
    setSelectedBrand(brand);
    setReviewAction(defaultAction);
    setReviewerNotes(brand.reviewerNotes || "");
  };

  const handleExecuteReview = async () => {
    if (!selectedBrand) return;
    if ((reviewAction === "reject" || reviewAction === "request_info") && !reviewerNotes.trim()) {
      Alert.alert("Notes Required", `Please provide review notes explaining why you are ${reviewAction === "reject" ? "rejecting" : "requesting more information for"} this brand.`);
      return;
    }

    try {
      setSubmitting(true);
      await reviewBrandAdminApi(selectedBrand._id || selectedBrand.id, {
        action: reviewAction,
        reviewerNotes: reviewerNotes.trim(),
      });

      Alert.alert(
        "Brand Updated",
        `Brand "${selectedBrand.name}" has been ${reviewAction === "approve" ? "approved" : reviewAction === "reject" ? "rejected" : "marked for more info"}.`
      );
      setSelectedBrand(null);
      loadBrands();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to update brand");
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

  const statuses = [
    { label: "Pending Review", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "All Brands", value: "all" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Brand Review Queue"
        subtitle="Catalog Integrity & Verification"
        showBack
      />

      <FlatList
        data={brands}
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

            {/* Status Tabs */}
            <View style={[styles.tabsRow, { backgroundColor: cardBg, borderColor: border }]}>
              {statuses.map((s) => {
                const isSel = statusFilter === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.tabBtn, isSel && styles.tabBtnActive]}
                    onPress={() => setStatusFilter(s.value)}
                  >
                    <Text style={[styles.tabBtnText, { color: isSel ? "#10B981" : textSecondary }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBox, { borderColor: border, backgroundColor: cardBg }]}>
              <Feather name="search" size={scale(15)} color={textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: textPrimary }]}
                placeholder="Search brand name, vendor, or category..."
                placeholderTextColor={textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x" size={scale(15)} color={textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.countRow}>
              <Text style={[styles.countText, { color: textSecondary }]}>
                {brands.length} brand submissions found
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isPending = item.status === "PENDING";
          const hasDuplicates = item.potentialDuplicates && item.potentialDuplicates.length > 0;

          return (
            <View style={[styles.brandCard, { backgroundColor: cardBg, borderColor: border }]}>
              {/* Duplicate Warning Banner */}
              {hasDuplicates && (
                <View style={[styles.duplicateBanner, { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "#EF4444" }]}>
                  <Feather name="alert-triangle" size={scale(14)} color="#EF4444" />
                  <View style={{ flex: 1, marginLeft: scale(6) }}>
                    <Text style={styles.duplicateTitle}>Potential Duplicate Brand Detected</Text>
                    <Text style={[styles.duplicateSub, { color: textSecondary }]}>
                      Matches: {item.potentialDuplicates.map((d: any) => d.name).join(", ")}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.brandRow}>
                {/* Brand Logo Preview */}
                <View style={[styles.logoWrap, { backgroundColor: bg, borderColor: border }]}>
                  {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.logoImage} contentFit="contain" />
                  ) : (
                    <MaterialCommunityIcons name="tag-outline" size={scale(24)} color="#10B981" />
                  )}
                </View>

                {/* Brand Info */}
                <View style={{ flex: 1, marginLeft: scale(12) }}>
                  <View style={styles.brandTitleRow}>
                    <Text style={[styles.brandName, { color: textPrimary }]}>{item.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === "APPROVED"
                              ? "rgba(16, 185, 129, 0.15)"
                              : item.status === "REJECTED"
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              item.status === "APPROVED"
                                ? "#10B981"
                                : item.status === "REJECTED"
                                ? "#EF4444"
                                : "#F59E0B",
                          },
                        ]}
                      >
                        {item.status || "PENDING"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.vendorLabel, { color: textSecondary }]}>
                    Submitted by: {item.vendor?.storeName || item.vendorName || "Vendor"}
                  </Text>

                  {item.description ? (
                    <Text style={[styles.brandDesc, { color: textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {item.website ? (
                    <Text style={[styles.brandWeb, { color: "#0EA5E9" }]} numberOfLines={1}>
                      🌐 {item.website}
                    </Text>
                  ) : null}

                  {item.reviewerNotes ? (
                    <View style={styles.reviewNotesBox}>
                      <Text style={[styles.reviewNotesLabel, { color: textSecondary }]}>Notes:</Text>
                      <Text style={[styles.reviewNotesText, { color: textPrimary }]}>
                        {item.reviewerNotes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={[styles.actionsRow, { borderTopColor: border }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => openReviewModal(item, "approve")}
                >
                  <Feather name="check" size={scale(14)} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.infoBtn]}
                  onPress={() => openReviewModal(item, "request_info")}
                >
                  <Feather name="help-circle" size={scale(14)} color="#F59E0B" />
                  <Text style={styles.infoBtnText}>Request Info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => openReviewModal(item, "reject")}
                >
                  <Feather name="x" size={scale(14)} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                Scanning brand queue...
              </Text>
            </View>
          ) : (
            <View style={styles.centerWrap}>
              <MaterialCommunityIcons name="tag-check" size={scale(48)} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary, marginTop: scale(10) }]}>
                No brand submissions found in this category.
              </Text>
            </View>
          )
        }
      />

      {/* Review Modal */}
      <Modal visible={!!selectedBrand} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Brand Verification Decision</Text>
              <TouchableOpacity onPress={() => setSelectedBrand(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedBrand && (
              <>
                <View style={[styles.brandPreviewBox, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.modalBrandName, { color: textPrimary }]}>{selectedBrand.name}</Text>
                  <Text style={[styles.modalBrandVendor, { color: textSecondary }]}>
                    Store: {selectedBrand.vendor?.storeName || selectedBrand.vendorName}
                  </Text>
                </View>

                {/* Decision Selector */}
                <Text style={[styles.inputLabel, { color: textPrimary }]}>Action to Apply:</Text>
                <View style={styles.decisionRow}>
                  {[
                    { label: "Approve Brand", value: "approve", color: "#10B981", icon: "check-circle" },
                    { label: "Request Documentation", value: "request_info", color: "#F59E0B", icon: "help-circle" },
                    { label: "Reject Submission", value: "reject", color: "#EF4444", icon: "x-circle" },
                  ].map((d) => {
                    const isSel = reviewAction === d.value;
                    return (
                      <TouchableOpacity
                        key={d.value}
                        style={[
                          styles.decisionBtn,
                          { borderColor: isSel ? d.color : border },
                          isSel && { backgroundColor: `${d.color}18` },
                        ]}
                        onPress={() => setReviewAction(d.value as any)}
                      >
                        <Feather name={d.icon as any} size={scale(14)} color={isSel ? d.color : textSecondary} />
                        <Text style={[styles.decisionBtnText, { color: isSel ? d.color : textSecondary }]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Reviewer Audit Notes */}
                <Text style={[styles.inputLabel, { color: textPrimary, marginTop: scale(12) }]}>
                  Audit Notes / Reason:
                </Text>
                <TextInput
                  style={[styles.modalTextArea, { backgroundColor: bg, borderColor: border, color: textPrimary }]}
                  placeholder={
                    reviewAction === "approve"
                      ? "Optional remarks regarding brand registration / trademark verification..."
                      : "Provide clear reason why brand is rejected or what documentation is missing..."
                  }
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={4}
                  value={reviewerNotes}
                  onChangeText={setReviewerNotes}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalCancelBtn, { borderColor: border }]}
                    onPress={() => setSelectedBrand(null)}
                  >
                    <Text style={[styles.modalCancelText, { color: textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSaveBtn, submitting && { opacity: 0.6 }]}
                    disabled={submitting}
                    onPress={handleExecuteReview}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSaveText}>Confirm Decision</Text>
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
  pillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(3),
    marginBottom: scale(10),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: scale(7),
    alignItems: "center",
    borderRadius: scale(7),
  },
  tabBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  tabBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    marginBottom: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12),
    marginLeft: scale(6),
    padding: 0,
  },
  countRow: {
    marginBottom: scale(10),
  },
  countText: {
    fontSize: moderateScale(11),
  },
  brandCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(12),
  },
  duplicateBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(6),
    padding: scale(8),
    marginBottom: scale(10),
  },
  duplicateTitle: {
    color: "#EF4444",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  duplicateSub: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  brandRow: {
    flexDirection: "row",
  },
  logoWrap: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandName: {
    fontSize: moderateScale(14),
    fontWeight: "900",
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  vendorLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginTop: scale(2),
  },
  brandDesc: {
    fontSize: moderateScale(11),
    marginTop: scale(4),
    lineHeight: scale(16),
  },
  brandWeb: {
    fontSize: moderateScale(11),
    marginTop: scale(4),
  },
  reviewNotesBox: {
    backgroundColor: "rgba(100, 116, 139, 0.08)",
    padding: scale(6),
    borderRadius: scale(6),
    marginTop: scale(6),
  },
  reviewNotesLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  reviewNotesText: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  actionsRow: {
    flexDirection: "row",
    gap: scale(8),
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
    gap: scale(4),
  },
  approveBtn: {
    backgroundColor: "#10B981",
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  infoBtn: {
    borderWidth: 1,
    borderColor: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  infoBtnText: {
    color: "#F59E0B",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  rejectBtnText: {
    color: "#EF4444",
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
  brandPreviewBox: {
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    marginBottom: scale(12),
  },
  modalBrandName: {
    fontSize: moderateScale(14),
    fontWeight: "900",
  },
  modalBrandVendor: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: scale(6),
  },
  decisionRow: {
    gap: scale(6),
  },
  decisionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    gap: scale(6),
  },
  decisionBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
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
});
