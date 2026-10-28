import * as Clipboard from "expo-clipboard";
import AdminHeader from "@/components/AdminHeader";
import AdminStoreFilterDropdown from "@/components/AdminStoreFilterDropdown";
import { useAppSelector } from "@/store/hooks";
import {
  fetchDeliveryAssignmentsAdminApi,
  fetchRefundsQueueAdminApi,
  fetchStaffAssignedVendorsApi,
  finalizeRefundPayoutActionApi,
  recordRefundInspectionActionApi,
  adminAssignReturnPickupApi,
  superAdminProcessOnlineRefundApi,
  staffExamineRefundActionApi,
  updateRefundPickupActionApi,
} from "@/store/services/adminService";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export default function AdminRefundsWorkflowScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperadmin = currentUser?.role === "superadmin";

  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isSmallDevice = windowWidth < 380;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<any[]>([]);
  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied to Clipboard", `${label}: ${text}`);
    } catch (e) {
      console.log("Clipboard error", e);
    }
  };
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");

  // ─── Primary 2 Tabs: "Vendor Refund Requests" vs "My Refund Requests" ───
  const [refundTypeTab, setRefundTypeTab] = useState<"vendor" | "my">("vendor");

  // Secondary Stage Pills (All, Review, Checking, Pickup, Quality, Ready, Refunded, Rejected)
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">(isTablet ? "grid" : "list");

  const [claims, setClaims] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    vendorCount: 0,
    myCount: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delivery boys list for reverse pickup assignment
  const [riders, setRiders] = useState<any[]>([]);

  // Modals State
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<
    "EXAMINE" | "PICKUP" | "INSPECTION" | "FINALIZE" | "AUDIT" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  // Examine Form State
  const [examineDecision, setExamineDecision] = useState<
    "FORWARD_TO_FINANCE" | "REQUIRE_RETURN_PICKUP" | "REJECTED"
  >("REQUIRE_RETURN_PICKUP");
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
  const [conditionGrade, setConditionGrade] = useState<
    "A" | "B" | "C" | "DAMAGED" | "WRONG_ITEM"
  >("A");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [inspectionDepreciation, setInspectionDepreciation] = useState("0");
  const [recommendedAction, setRecommendedAction] =
    useState("Refund Full Amount");

  // Finalize Form State (Superadmin)
  const [finalizeAction, setFinalizeAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [finalizeNotes, setFinalizeNotes] = useState("");

  const loadVendorsAndRiders = async () => {
    try {
      const vRes = await fetchStaffAssignedVendorsApi();
      if (vRes?.vendors) {
        setAssignedVendors(vRes.vendors);
      }
      const rRes = await fetchDeliveryAssignmentsAdminApi();
      if (rRes?.assignments) {
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
        const params: any = {
          page: targetPage,
          limit: 12,
          refundType: refundTypeTab,
        };
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
          if (res?.summary) {
            setSummary(res.summary);
          }
        }
      } catch (err) {
        console.error("Failed to load refund queue", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedVendorId, activeTab, refundTypeTab],
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
    setExamineDecision(
      claim.pickup?.required ? "REQUIRE_RETURN_PICKUP" : "FORWARD_TO_FINANCE",
    );
    setExamineNotes(claim.staffReview?.notes || "");
    setConditionScore(claim.staffReview?.conditionScore || "Good");
    setDepreciationPercent(
      String(claim.staffReview?.estimatedDepreciation || 0),
    );
    setActiveModal("EXAMINE");
  };

  const openPickupModal = (claim: any) => {
    setSelectedClaim(claim);
    setPickupDeliveryBoyId(
      claim.pickup?.deliveryBoy?._id || claim.pickup?.deliveryBoy || "",
    );
    setPickupStatus(claim.pickup?.status || "RETURN_PICKUP_SCHEDULED");
    setPickupTracking(claim.pickup?.trackingNumber || "");
    setPickupNotes(claim.pickup?.notes || "");
    setActiveModal("PICKUP");
  };

  const openInspectionModal = (claim: any) => {
    setSelectedClaim(claim);
    const passedVal =
      claim.inspection?.result === "PASSED" ||
      claim.inspection?.passed === true;
    setInspectionPassed(passedVal);
    setConditionGrade(claim.inspection?.conditionGrade || "A");
    setInspectionNotes(claim.inspection?.notes || "");
    setInspectionDepreciation(
      String(claim.inspection?.depreciationPercentage || 0),
    );
    setRecommendedAction(
      claim.inspection?.recommendedAction || "Refund Full Amount",
    );
    setActiveModal("INSPECTION");
  };

  const openFinalizeModal = (claim: any) => {
    setSelectedClaim(claim);
    setFinalizeAction("approve");
    setFinalizeNotes("");
    setActiveModal("FINALIZE");
  };

  const openAuditModal = (claim: any) => {
    setSelectedClaim(claim);
    setActiveModal("AUDIT");
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

      Alert.alert("Success", "Staff review saved successfully.");
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save staff review",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecutePickup = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      if (pickupDeliveryBoyId) {
        const res = await adminAssignReturnPickupApi(selectedClaim._id || selectedClaim.id, {
          deliveryBoyId: pickupDeliveryBoyId,
          notes: pickupNotes.trim(),
        });
        if (res?.pickupOtp) {
          Alert.alert(
            "Pickup Assigned with OTP",
            `Return pickup assigned to partner! Customer Verification OTP: ${res.pickupOtp}`
          );
        } else {
          Alert.alert("Success", "Return pickup updated successfully.");
        }
      } else {
        await updateRefundPickupActionApi(selectedClaim._id || selectedClaim.id, {
          pickupStatus,
          pickupNotes: pickupNotes.trim(),
          trackingNumber: pickupTracking.trim() || undefined,
        });
        Alert.alert("Success", "Return pickup updated successfully.");
      }
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update pickup",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteInspection = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      await recordRefundInspectionActionApi(
        selectedClaim._id || selectedClaim.id,
        {
          passed: inspectionPassed,
          conditionGrade,
          inspectionNotes: inspectionNotes.trim(),
          depreciationPercentage: Number(inspectionDepreciation) || 0,
          recommendedAction,
        },
      );

      Alert.alert("Success", "Item inspection saved successfully.");
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to record inspection",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteFinalize = async () => {
    if (!selectedClaim) return;
    try {
      setSubmitting(true);
      const isOnline =
        !selectedClaim.isVendorFunded &&
        selectedClaim.originalPaymentMethod !== "Cash on delivery" &&
        selectedClaim.originalPaymentMethod !== "COD";

      if (isOnline && finalizeAction === "approve") {
        await superAdminProcessOnlineRefundApi(
          selectedClaim._id || selectedClaim.id,
          {
            payoutReference: finalizeNotes.trim() || `ONL-PAY-${Date.now()}`,
            status: "COMPLETED",
            notes: finalizeNotes.trim() || "Online refund processed by Super Admin.",
          }
        );
        Alert.alert("Success", "Online refund disbursed to customer. Platform commission preserved.");
      } else {
        await finalizeRefundPayoutActionApi(
          selectedClaim._id || selectedClaim.id,
          {
            action: finalizeAction,
            notes: finalizeNotes.trim(),
          },
        );
        Alert.alert(
          "Success",
          `Refund ${finalizeAction === "approve" ? "sent to customer successfully" : "rejected"}.`,
        );
      }
      setActiveModal(null);
      loadClaims(page);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to finalize payout",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Colors
  const bg = isDark ? "#0A0F12" : "#F4F6F9";
  const cardBg = isDark ? "#141D22" : "#FFFFFF";
  const border = isDark ? "#24323B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const tabs = [
    { label: "All Requests", value: "ALL", count: summary.total },
    { label: "Store Review", value: "VENDOR_REVIEW", count: summary.pending },
    { label: "Staff Checking", value: "STAFF_EXAMINING" },
    { label: "Return Pickup", value: "RETURN_PICKUP_SCHEDULED" },
    { label: "Quality Check", value: "RETURN_RECEIVED" },
    { label: "Ready to Refund", value: "FORWARDED_TO_FINANCE", count: summary.approved },
    { label: "Refunded", value: "COMPLETED", count: summary.completed },
    { label: "Rejected", value: "REJECTED", count: summary.rejected },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Refunded",
          bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5",
          border: isDark ? "#059669" : "#A7F3D0",
          color: "#10B981",
          icon: "checkmark-circle",
        };
      case "FORWARDED_TO_FINANCE":
      case "APPROVED":
      case "PROCESSING":
        return {
          label: "Ready to Refund",
          bg: isDark ? "rgba(168, 85, 247, 0.2)" : "#FAF5FF",
          border: isDark ? "#9333EA" : "#E9D5FF",
          color: "#A855F7",
          icon: "cash-outline",
        };
      case "STAFF_EXAMINING":
        return {
          label: "Staff Checking",
          bg: isDark ? "rgba(14, 165, 233, 0.2)" : "#F0F9FF",
          border: isDark ? "#0284C7" : "#BAE6FD",
          color: "#0EA5E9",
          icon: "search-outline",
        };
      case "VENDOR_REVIEW":
      case "REQUESTED":
        return {
          label: "Store Review",
          bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#FFFBEB",
          border: isDark ? "#D97706" : "#FDE68A",
          color: "#F59E0B",
          icon: "time-outline",
        };
      case "RETURN_PICKUP_SCHEDULED":
      case "RETURN_PICKED_UP":
        return {
          label: "Rider Picking Up",
          bg: isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF",
          border: isDark ? "#4F46E5" : "#C7D2FE",
          color: "#6366F1",
          icon: "bicycle-outline",
        };
      case "RETURN_RECEIVED":
        return {
          label: "Quality Check",
          bg: isDark ? "rgba(234, 179, 8, 0.2)" : "#FEFCE8",
          border: isDark ? "#CA8A04" : "#FEF08A",
          color: "#EAB308",
          icon: "shield-checkmark-outline",
        };
      case "REJECTED":
      case "FAILED":
      case "INSPECTED_FAILED":
        return {
          label: "Rejected",
          bg: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEF2F2",
          border: isDark ? "#DC2626" : "#FECACA",
          color: "#EF4444",
          icon: "close-circle",
        };
      default:
        return {
          label: status,
          bg: isDark ? "rgba(100, 116, 139, 0.2)" : "#F1F5F9",
          border: border,
          color: textSecondary,
          icon: "help-circle-outline",
        };
    }
  };

  // Filter claims based on client-side search query
  const filteredClaims = useMemo(() => {
    if (!searchQuery.trim()) return claims;
    const q = searchQuery.toLowerCase().trim();
    return claims.filter((c) => {
      const orderNum = (c.orderNumber || c.order?.orderNumber || "").toLowerCase();
      const customerName = (
        c.customer?.name ||
        c.order?.shippingAddress?.fullName ||
        c.user?.name ||
        c.customerName ||
        ""
      ).toLowerCase();
      const storeName = (
        c.vendor?.businessDetails?.businessName ||
        c.vendor?.brandDetails?.brandName ||
        c.vendor?.sellerDetails?.sellerName ||
        c.vendor?.storeName ||
        c.vendorName ||
        ""
      ).toLowerCase();
      const reason = (c.reason || c.description || "").toLowerCase();
      return (
        orderNum.includes(q) ||
        customerName.includes(q) ||
        storeName.includes(q) ||
        reason.includes(q)
      );
    });
  }, [claims, searchQuery]);


  // ─── CUSTOMER BANK & PAYOUT DETAILS COMPONENT ───
  const renderCustomerBankDetails = (item: any, isModal = false) => {
    if (!item) return null;
    const payout = item.customerPayoutDetails || {};
    const hasBankDetails = Boolean(payout.accountNumber || payout.bankName || payout.upiId);
    const paymentMethod = item.originalPaymentMethod || item.order?.paymentMethod || "COD";
    const isCOD =
      item.isVendorFunded === true ||
      paymentMethod.toLowerCase().includes("cod") ||
      paymentMethod.toLowerCase().includes("cash");
    const amountToPay = item.amount || item.order?.totalAmount || 0;
    const holderName = payout.accountHolderName || item.customer?.name || item.order?.shippingAddress?.fullName || "";
    const customerPhone = item.customer?.phone || item.order?.shippingAddress?.phone || "";

    return (
      <View
        style={[
          styles.bankDetailsCard,
          {
            backgroundColor: isDark ? "#121A21" : "#F8FAFC",
            borderColor: isDark ? "#2A3A47" : "#E2E8F0",
            marginVertical: isModal ? scale(8) : scale(10),
          },
        ]}
      >
        {/* Card Header */}
        <View style={styles.bankHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={[styles.bankIconCircle, { backgroundColor: isCOD ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)" }]}>
              <Ionicons
                name={isCOD ? "cash" : "card"}
                size={scale(14)}
                color={isCOD ? "#F59E0B" : "#6366F1"}
              />
            </View>
            <View style={{ marginLeft: scale(8), flex: 1 }}>
              <Text style={[styles.bankTitleText, { color: textPrimary }]}>
                {isCOD ? "Vendor COD Payout Info" : "Customer Bank Details (To Pay Back)"}
              </Text>
              <Text style={[styles.bankSubtitleText, { color: textSecondary }]}>
                {isCOD ? "Vendor disburses directly" : "Super Admin platform refund destination"}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.payoutMethodPill,
              {
                backgroundColor: isCOD
                  ? isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"
                  : isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF",
              },
            ]}
          >
            <Text
              style={[
                styles.payoutMethodPillText,
                { color: isCOD ? "#D97706" : "#6366F1" },
              ]}
            >
              {payout.method ? payout.method.replace(/_/g, " ") : isCOD ? "COD CASH" : "ONLINE GATEWAY"}
            </Text>
          </View>
        </View>

        {/* Amount To Pay Highlight */}
        <View style={[styles.payAmountBox, { backgroundColor: isDark ? "#17232D" : "#ECFDF5", borderColor: isDark ? "#065F46" : "#A7F3D0" }]}>
          <Text style={[styles.payAmountLabel, { color: textSecondary }]}>
            Amount to Disburse:
          </Text>
          <Text style={[styles.payAmountValue, { color: "#10B981" }]}>
            NPR {amountToPay.toLocaleString()}
          </Text>
        </View>

        {/* Banking Fields */}
        <View style={styles.bankFieldsList}>
          {/* Account Holder Name */}
          {Boolean(holderName) && (
            <View style={styles.bankFieldRow}>
              <Text style={[styles.bankFieldLabel, { color: textSecondary }]}>
                Account Holder:
              </Text>
              <Text style={[styles.bankFieldValue, { color: textPrimary }]}>
                {holderName}
              </Text>
            </View>
          )}

          {/* Customer Phone */}
          {Boolean(customerPhone) && (
            <View style={styles.bankFieldRow}>
              <Text style={[styles.bankFieldLabel, { color: textSecondary }]}>
                Customer Phone:
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(customerPhone, "Customer Phone")}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Text style={[styles.bankFieldValue, { color: textPrimary, marginRight: scale(4) }]}>
                  {customerPhone}
                </Text>
                <Feather name="copy" size={scale(11)} color={textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Bank Name */}
          {Boolean(payout.bankName) && (
            <View style={styles.bankFieldRow}>
              <Text style={[styles.bankFieldLabel, { color: textSecondary }]}>
                Bank Name:
              </Text>
              <Text style={[styles.bankFieldValue, { color: textPrimary, fontWeight: "700" }]}>
                {payout.bankName}
              </Text>
            </View>
          )}

          {/* Account Number with Quick Copy */}
          {Boolean(payout.accountNumber) && (
            <View style={[styles.bankFieldRowCopy, { backgroundColor: isDark ? "#1B2834" : "#F1F5F9" }]}>
              <View style={{ flex: 1, marginRight: scale(6) }}>
                <Text style={[styles.bankFieldLabel, { color: textSecondary }]}>
                  Account Number:
                </Text>
                <Text
                  style={[styles.bankMonoValue, { color: textPrimary }]}
                  selectable
                >
                  {payout.accountNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyActionBtn}
                onPress={() => copyToClipboard(payout.accountNumber, "Account Number")}
                activeOpacity={0.7}
              >
                <Feather name="copy" size={scale(12)} color="#6366F1" />
                <Text style={styles.copyActionBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* IFSC / Branch Code with Quick Copy */}
          {Boolean(payout.ifscCode) && (
            <View style={[styles.bankFieldRowCopy, { backgroundColor: isDark ? "#1B2834" : "#F1F5F9" }]}>
              <View style={{ flex: 1, marginRight: scale(6) }}>
                <Text style={[styles.bankFieldLabel, { color: textSecondary }]}>
                  IFSC / Branch Code:
                </Text>
                <Text
                  style={[styles.bankMonoValue, { color: textPrimary }]}
                  selectable
                >
                  {payout.ifscCode}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyActionBtn}
                onPress={() => copyToClipboard(payout.ifscCode, "IFSC Code")}
                activeOpacity={0.7}
              >
                <Feather name="copy" size={scale(12)} color="#6366F1" />
                <Text style={styles.copyActionBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* UPI ID with Quick Copy */}
          {Boolean(payout.upiId) && (
            <View style={[styles.bankFieldRowCopy, { backgroundColor: isDark ? "#1B2834" : "#F1F5F9" }]}>
              <View style={{ flex: 1, marginRight: scale(6) }}>
                <Text style={[styles.bankFieldLabel, { color: textSecondary }]}>
                  UPI / Wallet ID:
                </Text>
                <Text
                  style={[styles.bankMonoValue, { color: textPrimary }]}
                  selectable
                >
                  {payout.upiId}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyActionBtn}
                onPress={() => copyToClipboard(payout.upiId, "UPI ID")}
                activeOpacity={0.7}
              >
                <Feather name="copy" size={scale(12)} color="#6366F1" />
                <Text style={styles.copyActionBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fallback info when no explicit bank was provided */}
          {!hasBankDetails && !isCOD && (
            <View style={styles.noBankNotice}>
              <Ionicons name="information-circle-outline" size={scale(14)} color="#6366F1" />
              <Text style={[styles.noBankNoticeText, { color: textSecondary }]}>
                No secondary bank entered. Payout defaults to original payment gateway reversal ({paymentMethod}).
              </Text>
            </View>
          )}

          {/* Payout Reference when already paid */}
          {Boolean(payout.payoutReference) && (
            <View style={[styles.paidRefBanner, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5", borderColor: "#10B981" }]}>
              <Ionicons name="checkmark-done-circle" size={scale(16)} color="#10B981" />
              <View style={{ marginLeft: scale(6), flex: 1 }}>
                <Text style={[styles.paidRefTitle, { color: textPrimary }]}>
                  Disbursed Ref / UTR: <Text style={{ fontWeight: "800", color: "#10B981" }}>{payout.payoutReference}</Text>
                </Text>
                {payout.payoutCompletedAt && (
                  <Text style={[styles.paidRefDate, { color: textSecondary }]}>
                    Paid on {new Date(payout.payoutCompletedAt).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Returns & Refunds"
        subtitle="Manage Return Requests & Refund Status"
        showBack
      />

      <FlatList
        data={filteredClaims}
        keyExtractor={(item) => item._id || item.id}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === "grid" ? styles.gridColumnWrapper : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: isTablet ? scale(20) : scale(14) },
        ]}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* ─── PRIMARY TWO TABS: VENDOR REFUND REQUESTS vs MY REFUND REQUESTS ─── */}
            <View style={[styles.mainTabsContainer, { backgroundColor: cardBg, borderColor: border }]}>
              {/* Tab 1: Vendor Refund Requests */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mainTabBtn,
                  refundTypeTab === "vendor" && [
                    styles.mainTabBtnActive,
                    {
                      backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5",
                      borderColor: "#10B981",
                    },
                  ],
                ]}
                onPress={() => {
                  setRefundTypeTab("vendor");
                  setPage(1);
                }}
              >
                <View style={styles.mainTabLeft}>
                  <View
                    style={[
                      styles.mainTabIconWrap,
                      {
                        backgroundColor:
                          refundTypeTab === "vendor"
                            ? "#10B981"
                            : isDark
                            ? "#24323B"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Ionicons
                      name="storefront"
                      size={scale(15)}
                      color={refundTypeTab === "vendor" ? "#FFFFFF" : textSecondary}
                    />
                  </View>
                  <View style={styles.mainTabTitleGroup}>
                    <Text
                      style={[
                        styles.mainTabTitle,
                        {
                          color:
                            refundTypeTab === "vendor"
                              ? isDark
                                ? "#34D399"
                                : "#059669"
                              : textPrimary,
                          fontWeight: refundTypeTab === "vendor" ? "900" : "700",
                        },
                      ]}
                    >
                      Vendor Refund Requests
                    </Text>
                    <Text style={[styles.mainTabSub, { color: textSecondary }]}>
                      COD • Store Direct Payouts
                    </Text>
                  </View>
                </View>

                {summary.vendorCount != null && (
                  <View
                    style={[
                      styles.mainTabBadge,
                      {
                        backgroundColor:
                          refundTypeTab === "vendor"
                            ? "#10B981"
                            : isDark
                            ? "#24323B"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.mainTabBadgeText,
                        {
                          color:
                            refundTypeTab === "vendor" ? "#FFFFFF" : textSecondary,
                        },
                      ]}
                    >
                      {summary.vendorCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Tab 2: My Refund Requests */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mainTabBtn,
                  refundTypeTab === "my" && [
                    styles.mainTabBtnActive,
                    {
                      backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF",
                      borderColor: "#6366F1",
                    },
                  ],
                ]}
                onPress={() => {
                  setRefundTypeTab("my");
                  setPage(1);
                }}
              >
                <View style={styles.mainTabLeft}>
                  <View
                    style={[
                      styles.mainTabIconWrap,
                      {
                        backgroundColor:
                          refundTypeTab === "my"
                            ? "#6366F1"
                            : isDark
                            ? "#24323B"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Ionicons
                      name="card"
                      size={scale(15)}
                      color={refundTypeTab === "my" ? "#FFFFFF" : textSecondary}
                    />
                  </View>
                  <View style={styles.mainTabTitleGroup}>
                    <Text
                      style={[
                        styles.mainTabTitle,
                        {
                          color:
                            refundTypeTab === "my"
                              ? isDark
                                ? "#818CF8"
                                : "#4F46E5"
                              : textPrimary,
                          fontWeight: refundTypeTab === "my" ? "900" : "700",
                        },
                      ]}
                    >
                      My Refund Requests
                    </Text>
                    <Text style={[styles.mainTabSub, { color: textSecondary }]}>
                      Online • Super Admin Payouts
                    </Text>
                  </View>
                </View>

                {summary.myCount != null && (
                  <View
                    style={[
                      styles.mainTabBadge,
                      {
                        backgroundColor:
                          refundTypeTab === "my"
                            ? "#6366F1"
                            : isDark
                            ? "#24323B"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.mainTabBadgeText,
                        {
                          color:
                            refundTypeTab === "my" ? "#FFFFFF" : textSecondary,
                        },
                      ]}
                    >
                      {summary.myCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Contextual Responsibility Notice Banner */}
            <View
              style={[
                styles.tabContextBanner,
                {
                  backgroundColor:
                    refundTypeTab === "vendor"
                      ? isDark
                        ? "rgba(16, 185, 129, 0.12)"
                        : "#F0FDF4"
                      : isDark
                      ? "rgba(99, 102, 241, 0.12)"
                      : "#EEF2FF",
                  borderColor:
                    refundTypeTab === "vendor"
                      ? isDark
                        ? "#065F46"
                        : "#BBF7D0"
                      : isDark
                      ? "#3730A3"
                      : "#C7D2FE",
                },
              ]}
            >
              <Ionicons
                name={refundTypeTab === "vendor" ? "business-outline" : "shield-checkmark-outline"}
                size={scale(16)}
                color={refundTypeTab === "vendor" ? "#10B981" : "#6366F1"}
                style={{ marginTop: scale(1) }}
              />
              <Text style={[styles.tabContextText, { color: textPrimary }]}>
                {refundTypeTab === "vendor"
                  ? "COD Orders: Stores disburse direct customer refunds from business accounts. Super Admin audits and monitors store settlements."
                  : "Online Orders (Prepaid • No COD): Super Admin disburses customer refund back to their bank / UPI. 1.5% platform commission is strictly preserved."}
              </Text>
            </View>

            {/* Quick KPI Overview Bar */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.kpiValue, { color: textPrimary }]}>{summary.total || totalCount}</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Total</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.kpiValue, { color: "#F59E0B" }]}>{summary.pending || 0}</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Reviewing</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.kpiValue, { color: "#A855F7" }]}>{summary.approved || 0}</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Ready</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.kpiValue, { color: "#10B981" }]}>{summary.completed || 0}</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Refunded</Text>
              </View>
            </View>

            {/* Vendor Scope Selector */}
            <AdminStoreFilterDropdown
              vendors={assignedVendors}
              selectedVendorId={selectedVendorId}
              onSelectVendor={(vId) => setSelectedVendorId(vId)}
              title="Filter by Store"
              showQuickPills={false}
            />

            {/* Stage Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}
              style={styles.pillScroll}
            >
              {tabs.map((t) => {
                const isSel = activeTab === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    activeOpacity={0.7}
                    style={[
                      styles.stagePill,
                      {
                        backgroundColor: isSel
                          ? isDark
                            ? "rgba(16, 185, 129, 0.2)"
                            : "#ECFDF5"
                          : cardBg,
                        borderColor: isSel ? "#10B981" : border,
                      },
                    ]}
                    onPress={() => setActiveTab(t.value)}
                  >
                    <Text
                      style={[
                        styles.stagePillText,
                        {
                          color: isSel ? "#10B981" : textSecondary,
                          fontWeight: isSel ? "800" : "600",
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                    {t.count != null && t.count > 0 && (
                      <View
                        style={[
                          styles.tabCountBadge,
                          {
                            backgroundColor: isSel
                              ? "#10B981"
                              : isDark
                              ? "#24323B"
                              : "#E2E8F0",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabCountText,
                            { color: isSel ? "#FFFFFF" : textSecondary },
                          ]}
                        >
                          {t.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search and View Mode Control Bar */}
            <View style={styles.controlsRow}>
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <Feather name="search" size={scale(15)} color={textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: textPrimary }]}
                  placeholder="Search order #, store, customer..."
                  placeholderTextColor={textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Feather name="x" size={scale(15)} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* View Mode Toggle Button */}
              <View
                style={[
                  styles.viewToggleGroup,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.viewToggleBtn,
                    viewMode === "list" && styles.viewToggleBtnActive,
                  ]}
                  onPress={() => setViewMode("list")}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="list"
                    size={scale(15)}
                    color={viewMode === "list" ? "#FFFFFF" : textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.viewToggleBtn,
                    viewMode === "grid" && styles.viewToggleBtnActive,
                  ]}
                  onPress={() => setViewMode("grid")}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="grid"
                    size={scale(15)}
                    color={viewMode === "grid" ? "#FFFFFF" : textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Results Count */}
            <View style={styles.countRow}>
              <Text style={[styles.countText, { color: textSecondary }]}>
                Showing {filteredClaims.length} of {totalCount}{" "}
                {refundTypeTab === "vendor" ? "vendor direct refund" : "my online refund"} requests
              </Text>
            </View>
          </View>
        }

        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);

          // Correct real data bindings
          const customerName =
            item.customer?.name ||
            item.order?.shippingAddress?.fullName ||
            item.user?.name ||
            item.customerName ||
            "Customer";

          const vendorName =
            item.vendor?.businessDetails?.businessName ||
            item.vendor?.brandDetails?.brandName ||
            item.vendor?.sellerDetails?.sellerName ||
            item.vendor?.storeName ||
            item.vendorName ||
            "Store";

          const orderNumber =
            item.orderNumber ||
            item.order?.orderNumber ||
            (item.order?._id ? item.order._id.slice(-8) : "N/A");

          const refundNumber = item.refundNumber || "";
          const amount = item.amount || item.order?.totalAmount || 0;
          const paymentMethod =
            item.originalPaymentMethod || item.order?.paymentMethod || "COD";
          const isCOD =
            item.isVendorFunded === true ||
            paymentMethod.toLowerCase().includes("cod") ||
            paymentMethod.toLowerCase().includes("cash");

          const reasonText =
            item.reason || item.description || "Customer requested return";

          const photos =
            item.proofImages && item.proofImages.length > 0
              ? item.proofImages
              : item.images && item.images.length > 0
              ? item.images
              : [];

          const isCompleted = item.status === "COMPLETED";
          const isRejected =
            item.status === "REJECTED" ||
            item.status === "FAILED" ||
            item.status === "INSPECTED_FAILED";

          // Real status of steps
          const storeDecision = item.vendorReview?.decision || "PENDING";
          const hasStoreNotes = Boolean(item.vendorReview?.notes);

          const isStaffExamined =
            Boolean(item.staffReview?.isExamined) ||
            Boolean(item.staffReview?.notes);
          const staffDecisionText = isStaffExamined
            ? item.staffReview?.forwardedToFinance
              ? "Sent to Finance"
              : item.staffReview?.decision || "Reviewed"
            : "Pending";
          const hasStaffNotes = Boolean(item.staffReview?.notes);

          const hasInspection =
            item.inspection?.required ||
            item.inspection?.result === "PASSED" ||
            item.inspection?.result === "FAILED" ||
            Boolean(item.inspection?.notes);
          const inspectionPassedBool =
            item.inspection?.result === "PASSED" ||
            item.inspection?.passed === true;

          // ─── GRID VIEW CARD ───
          if (viewMode === "grid") {
            return (
              <View
                style={[
                  styles.gridCard,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                {/* Header: Order & Status */}
                <View style={styles.gridCardHeader}>
                  <View style={{ flex: 1, marginRight: scale(6) }}>
                    <Text
                      style={[styles.orderNumber, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      #{orderNumber}
                    </Text>
                    <Text
                      style={[styles.vendorSub, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      <Ionicons
                        name="storefront-outline"
                        size={scale(11)}
                        color="#10B981"
                      />{" "}
                      {vendorName}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadgeCompact,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeTextCompact,
                        { color: badge.color },
                      ]}
                    >
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Amount & Method */}
                <View style={styles.gridAmountRow}>
                  <Text style={[styles.gridAmountText, { color: "#10B981" }]}>
                    NPR {amount.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.methodBadge,
                      {
                        backgroundColor: isCOD
                          ? isDark
                            ? "#1F2937"
                            : "#F3F4F6"
                          : isDark
                          ? "#1E1B4B"
                          : "#EEF2FF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        { color: isCOD ? textSecondary : "#6366F1" },
                      ]}
                    >
                      {isCOD ? "COD" : "Online"}
                    </Text>
                  </View>
                </View>

                {/* Customer */}
                <Text
                  style={[styles.gridCustomerText, { color: textSecondary }]}
                  numberOfLines={1}
                >
                  <Feather name="user" size={scale(11)} color={textSecondary} />{" "}
                  {customerName}
                </Text>

                {/* Reason */}
                <Text
                  style={[styles.gridReasonText, { color: textPrimary }]}
                  numberOfLines={2}
                >
                  {reasonText}
                </Text>

                {/* Customer Bank Snippet (Grid) */}
                {item.customerPayoutDetails?.accountNumber ? (
                  <View style={[styles.gridBankRow, { backgroundColor: isDark ? "#17232D" : "#F1F5F9", borderColor: border }]}>
                    <Ionicons name="card-outline" size={scale(11)} color="#6366F1" />
                    <Text style={[styles.gridBankText, { color: textPrimary }]} numberOfLines={1}>
                      {item.customerPayoutDetails.bankName ? `${item.customerPayoutDetails.bankName}: ` : ""}
                      {item.customerPayoutDetails.accountNumber}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(item.customerPayoutDetails.accountNumber, "Account Number")}
                      style={styles.gridCopyBtn}
                    >
                      <Feather name="copy" size={scale(10)} color="#6366F1" />
                    </TouchableOpacity>
                  </View>
                ) : item.customerPayoutDetails?.upiId ? (
                  <View style={[styles.gridBankRow, { backgroundColor: isDark ? "#17232D" : "#F1F5F9", borderColor: border }]}>
                    <Ionicons name="phone-portrait-outline" size={scale(11)} color="#6366F1" />
                    <Text style={[styles.gridBankText, { color: textPrimary }]} numberOfLines={1}>
                      UPI: {item.customerPayoutDetails.upiId}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(item.customerPayoutDetails.upiId, "UPI ID")}
                      style={styles.gridCopyBtn}
                    >
                      <Feather name="copy" size={scale(10)} color="#6366F1" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Compact Actions */}
                <View style={[styles.gridActionsRow, { borderTopColor: border }]}>
                  {isCompleted ? (
                    <View style={styles.completedBadgeRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={scale(14)}
                        color="#10B981"
                      />
                      <Text style={styles.completedText}>Refund Sent</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.gridActionBtn, { borderColor: "#0EA5E9" }]}
                        onPress={() => openExamineModal(item)}
                      >
                        <Feather name="edit-3" size={scale(11)} color="#0EA5E9" />
                        <Text style={[styles.gridActionText, { color: "#0EA5E9" }]}>
                          Review
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.gridActionBtn, { borderColor: "#6366F1" }]}
                        onPress={() => openPickupModal(item)}
                      >
                        <MaterialCommunityIcons
                          name="truck-delivery-outline"
                          size={scale(12)}
                          color="#6366F1"
                        />
                        <Text style={[styles.gridActionText, { color: "#6366F1" }]}>
                          Pickup
                        </Text>
                      </TouchableOpacity>

                      {isSuperadmin && (
                        <TouchableOpacity
                          style={[
                            styles.gridActionBtn,
                            {
                              borderColor: "#10B981",
                              backgroundColor: isDark
                                ? "rgba(16, 185, 129, 0.2)"
                                : "#ECFDF5",
                            },
                          ]}
                          onPress={() => openFinalizeModal(item)}
                        >
                          <Feather
                            name="dollar-sign"
                            size={scale(11)}
                            color="#10B981"
                          />
                          <Text
                            style={[
                              styles.gridActionText,
                              { color: "#10B981", fontWeight: "800" },
                            ]}
                          >
                            Pay
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            );
          }

          // ─── FULL LIST VIEW CARD ───
          return (
            <View
              style={[
                styles.claimCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {/* Header: Order Number, Store, and Status Badge */}
              <View style={styles.claimHeaderRow}>
                <View style={{ flex: 1, marginRight: scale(10) }}>
                  <View style={styles.orderTitleRow}>
                    <Text style={[styles.orderNumber, { color: textPrimary }]}>
                      Order #{orderNumber}
                    </Text>
                    {refundNumber ? (
                      <View style={styles.refPill}>
                        <Text style={styles.refPillText}>{refundNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metaRow}>
                    <Text
                      style={[styles.vendorSub, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      <Ionicons
                        name="storefront"
                        size={scale(12)}
                        color="#10B981"
                      />{" "}
                      <Text style={{ fontWeight: "700" }}>{vendorName}</Text>
                    </Text>

                    <Text style={styles.metaDivider}>•</Text>

                    <Text
                      style={[styles.customerSub, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      <Feather name="user" size={scale(11)} color={textSecondary} />{" "}
                      {customerName}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: badge.bg,
                      borderColor: badge.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={badge.icon as any}
                    size={scale(13)}
                    color={badge.color}
                  />
                  <Text
                    style={[styles.statusBadgeText, { color: badge.color }]}
                  >
                    {badge.label}
                  </Text>
                </View>
              </View>

              {/* Amount, Method & Reason Callout */}
              <View style={styles.claimBody}>
                <View style={styles.bodyHighlightRow}>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountLabel}>
                      {isCOD ? "VENDOR REFUND AMOUNT" : "ONLINE REFUND AMOUNT"}
                    </Text>
                    <Text style={styles.amountValue}>
                      NPR {amount.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.tagsGroup}>
                    <View
                      style={[
                        styles.methodBadge,
                        {
                          backgroundColor: isCOD
                            ? isDark
                              ? "#1F2937"
                              : "#F3F4F6"
                            : isDark
                            ? "#1E1B4B"
                            : "#EEF2FF",
                        },
                      ]}
                    >
                      <Ionicons
                        name={isCOD ? "cash-outline" : "card-outline"}
                        size={scale(12)}
                        color={isCOD ? textSecondary : "#6366F1"}
                      />
                      <Text
                        style={[
                          styles.methodText,
                          { color: isCOD ? textSecondary : "#6366F1" },
                        ]}
                      >
                        {paymentMethod}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.claimTypeBadge,
                        {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.15)"
                            : "#ECFDF5",
                        },
                      ]}
                    >
                      <Text style={styles.claimTypeText}>
                        {item.claimType || item.type || "RETURN"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Return Reason Box */}
                <View
                  style={[
                    styles.reasonBox,
                    { backgroundColor: bg, borderColor: border },
                  ]}
                >
                  <Feather
                    name="help-circle"
                    size={scale(13)}
                    color="#F59E0B"
                    style={{ marginTop: scale(1) }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reasonLabel, { color: textSecondary }]}>
                      Return Reason
                    </Text>
                    <Text style={[styles.reasonContent, { color: textPrimary }]}>
                      {reasonText}
                    </Text>
                  </View>
                </View>

                {/* Customer Bank / Payout Details Card */}
                {renderCustomerBankDetails(item)}

                {/* Proof Photos Carousel */}
                {photos.length > 0 && (
                  <View style={styles.photosWrapper}>
                    <Text style={[styles.photosLabel, { color: textSecondary }]}>
                      Item Photos ({photos.length}):
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: scale(4) }}
                    >
                      {photos.map((imgUri: string, idx: number) => (
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

                {/* Clean Workflow Progress Stepper */}
                <View
                  style={[
                    styles.workflowCard,
                    { backgroundColor: bg, borderColor: border },
                  ]}
                >
                  <View style={styles.stepperRow}>
                    {/* Step 1: Store */}
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor:
                              storeDecision === "ACCEPTED"
                                ? "#10B981"
                                : storeDecision === "REJECTED"
                                ? "#EF4444"
                                : "#F59E0B",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            storeDecision === "ACCEPTED"
                              ? "checkmark"
                              : storeDecision === "REJECTED"
                              ? "close"
                              : "time-outline"
                          }
                          size={scale(10)}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={[styles.stepTitle, { color: textPrimary }]}>
                        Store
                      </Text>
                      <Text
                        style={[
                          styles.stepStatusText,
                          {
                            color:
                              storeDecision === "ACCEPTED"
                                ? "#10B981"
                                : storeDecision === "REJECTED"
                                ? "#EF4444"
                                : textSecondary,
                          },
                        ]}
                      >
                        {storeDecision}
                      </Text>
                    </View>

                    <View style={[styles.stepLine, { backgroundColor: border }]} />

                    {/* Step 2: Staff */}
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: isStaffExamined
                              ? "#0EA5E9"
                              : textSecondary,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isStaffExamined ? "checkmark" : "ellipse"}
                          size={scale(10)}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={[styles.stepTitle, { color: textPrimary }]}>
                        Staff
                      </Text>
                      <Text
                        style={[
                          styles.stepStatusText,
                          {
                            color: isStaffExamined ? "#0EA5E9" : textSecondary,
                          },
                        ]}
                      >
                        {staffDecisionText}
                      </Text>
                    </View>

                    <View style={[styles.stepLine, { backgroundColor: border }]} />

                    {/* Step 3: Item Check */}
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: hasInspection
                              ? inspectionPassedBool
                                ? "#10B981"
                                : "#EF4444"
                              : textSecondary,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            hasInspection
                              ? inspectionPassedBool
                                ? "shield-checkmark"
                                : "alert"
                              : "ellipse"
                          }
                          size={scale(10)}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={[styles.stepTitle, { color: textPrimary }]}>
                        Item Check
                      </Text>
                      <Text
                        style={[
                          styles.stepStatusText,
                          {
                            color: hasInspection
                              ? inspectionPassedBool
                                ? "#10B981"
                                : "#EF4444"
                              : textSecondary,
                          },
                        ]}
                      >
                        {hasInspection
                          ? inspectionPassedBool
                            ? "Passed"
                            : "Failed"
                          : "Pending"}
                      </Text>
                    </View>

                    <View style={[styles.stepLine, { backgroundColor: border }]} />

                    {/* Step 4: Refund */}
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: isCompleted
                              ? "#10B981"
                              : isRejected
                              ? "#EF4444"
                              : textSecondary,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isCompleted
                              ? "checkmark"
                              : isRejected
                              ? "close"
                              : "wallet-outline"
                          }
                          size={scale(10)}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={[styles.stepTitle, { color: textPrimary }]}>
                        Refund
                      </Text>
                      <Text
                        style={[
                          styles.stepStatusText,
                          {
                            color: isCompleted
                              ? "#10B981"
                              : isRejected
                              ? "#EF4444"
                              : textSecondary,
                          },
                        ]}
                      >
                        {isCompleted
                          ? "Sent"
                          : isRejected
                          ? "Rejected"
                          : "Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Notes / Details Preview if any exist */}
                  {(hasStoreNotes || hasStaffNotes || item.inspection?.notes) && (
                    <View
                      style={[
                        styles.notesPreviewWrap,
                        { borderTopColor: border },
                      ]}
                    >
                      {hasStoreNotes && (
                        <Text style={[styles.stepNoteLine, { color: textSecondary }]}>
                          <Text style={{ fontWeight: "700" }}>Store:</Text> "
                          {item.vendorReview.notes}"
                        </Text>
                      )}
                      {hasStaffNotes && (
                        <Text style={[styles.stepNoteLine, { color: textSecondary }]}>
                          <Text style={{ fontWeight: "700" }}>Staff:</Text> "
                          {item.staffReview.notes}"
                        </Text>
                      )}
                      {item.inspection?.notes && (
                        <Text style={[styles.stepNoteLine, { color: textSecondary }]}>
                          <Text style={{ fontWeight: "700" }}>Check:</Text> "
                          {item.inspection.notes}"
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Responsive Action Buttons Row */}
              <View style={[styles.actionsRow, { borderTopColor: border }]}>
                {isCompleted ? (
                  /* Completed State: Clean celebration banner with optional re-audit */
                  <View style={styles.completedActionsBanner}>
                    <View style={styles.completedBannerLeft}>
                      <Ionicons
                        name="checkmark-circle"
                        size={scale(18)}
                        color="#10B981"
                      />
                      <Text style={styles.completedBannerText}>
                        Refund of NPR {amount.toLocaleString()} Disbursed
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.smallAuditBtn, { borderColor: border }]}
                      onPress={() => openAuditModal(item)}
                    >
                      <Feather
                        name="file-text"
                        size={scale(12)}
                        color={textSecondary}
                      />
                      <Text
                        style={[
                          styles.smallAuditBtnText,
                          { color: textSecondary },
                        ]}
                      >
                        Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : isRejected ? (
                  /* Rejected State */
                  <View style={styles.rejectedActionsBanner}>
                    <Ionicons
                      name="close-circle"
                      size={scale(18)}
                      color="#EF4444"
                    />
                    <Text style={styles.rejectedBannerText}>
                      Return Request Closed / Rejected
                    </Text>
                  </View>
                ) : (
                  /* Active Workflow Buttons: 2x2 responsive grid on mobile, row on tablet */
                  <View style={styles.activeActionsGrid}>
                    {/* 1. Review */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        {
                          borderColor: "#0EA5E9",
                          backgroundColor: isDark
                            ? "rgba(14, 165, 233, 0.1)"
                            : "#F0F9FF",
                        },
                      ]}
                      onPress={() => openExamineModal(item)}
                    >
                      <Feather name="edit-3" size={scale(13)} color="#0EA5E9" />
                      <Text
                        style={[styles.actionBtnText, { color: "#0EA5E9" }]}
                      >
                        Review
                      </Text>
                    </TouchableOpacity>

                    {/* 2. Pickup */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        {
                          borderColor: "#6366F1",
                          backgroundColor: isDark
                            ? "rgba(99, 102, 241, 0.1)"
                            : "#EEF2FF",
                        },
                      ]}
                      onPress={() => openPickupModal(item)}
                    >
                      <MaterialCommunityIcons
                        name="truck-delivery-outline"
                        size={scale(14)}
                        color="#6366F1"
                      />
                      <Text
                        style={[styles.actionBtnText, { color: "#6366F1" }]}
                      >
                        Assign Pickup
                      </Text>
                    </TouchableOpacity>

                    {/* 3. Check Item */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        {
                          borderColor: "#EAB308",
                          backgroundColor: isDark
                            ? "rgba(234, 179, 8, 0.1)"
                            : "#FEFCE8",
                        },
                      ]}
                      onPress={() => openInspectionModal(item)}
                    >
                      <Feather
                        name="check-square"
                        size={scale(13)}
                        color="#CA8A04"
                      />
                      <Text
                        style={[styles.actionBtnText, { color: "#CA8A04" }]}
                      >
                        Check Item
                      </Text>
                    </TouchableOpacity>

                    {/* 4. Superadmin Pay Refund */}
                    {isSuperadmin && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          {
                            borderColor: "#10B981",
                            backgroundColor: "#10B981",
                          },
                        ]}
                        onPress={() => openFinalizeModal(item)}
                      >
                        <Feather
                          name="dollar-sign"
                          size={scale(13)}
                          color="#FFFFFF"
                        />
                        <Text
                          style={[styles.actionBtnText, { color: "#FFFFFF" }]}
                        >
                          {isCOD ? "Audit Store Pay" : "Pay Online Refund"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text
                style={[
                  styles.emptyText,
                  { color: textSecondary, marginTop: scale(10) },
                ]}
              >
                Loading return & refund requests...
              </Text>
            </View>
          ) : (
            <View style={styles.centerWrap}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={scale(52)}
                color={textSecondary}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: textPrimary, marginTop: scale(12) },
                ]}
              >
                No return requests found
              </Text>
              <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                {searchQuery
                  ? "Try adjusting your search query or store filter."
                  : refundTypeTab === "vendor"
                  ? "No vendor COD refund requests found in this queue."
                  : "No online payment refund requests awaiting Super Admin action."}
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
                style={[
                  styles.pageBtn,
                  { backgroundColor: cardBg, borderColor: border },
                  page <= 1 && styles.pageBtnDisabled,
                ]}
              >
                <Feather
                  name="chevron-left"
                  size={scale(16)}
                  color={page <= 1 ? textSecondary : textPrimary}
                />
                <Text
                  style={[
                    styles.pageBtnText,
                    { color: page <= 1 ? textSecondary : textPrimary },
                  ]}
                >
                  Prev
                </Text>
              </TouchableOpacity>

              <Text style={[styles.pageInfoText, { color: textSecondary }]}>
                Page <Text style={{ fontWeight: "800", color: textPrimary }}>{page}</Text> of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => loadClaims(page + 1)}
                style={[
                  styles.pageBtn,
                  { backgroundColor: cardBg, borderColor: border },
                  page >= totalPages && styles.pageBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    { color: page >= totalPages ? textSecondary : textPrimary },
                  ]}
                >
                  Next
                </Text>
                <Feather
                  name="chevron-right"
                  size={scale(16)}
                  color={page >= totalPages ? textSecondary : textPrimary}
                />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* ─── MODAL 1: STAFF REVIEW ─── */}
      <Modal
        visible={activeModal === "EXAMINE"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Staff Return Review
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Order #{selectedClaim?.orderNumber || selectedClaim?.order?.orderNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}
              >
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: scale(430) }}
            >
              <Text style={[styles.inputLabel, { color: textPrimary }]}>
                Staff Decision:
              </Text>
              <View style={styles.optionColumn}>
                {[
                  {
                    label: "Need Return Pickup",
                    val: "REQUIRE_RETURN_PICKUP",
                    desc: "Assign a delivery boy to collect item from customer",
                    color: "#6366F1",
                  },
                  {
                    label: "Send Directly for Refund",
                    val: "FORWARD_TO_FINANCE",
                    desc: "No pickup needed, approve immediately for payout",
                    color: "#A855F7",
                  },
                  {
                    label: "Reject Return",
                    val: "REJECTED",
                    desc: "Customer request does not meet return policy",
                    color: "#EF4444",
                  },
                ].map((opt) => {
                  const isSel = examineDecision === opt.val;
                  return (
                    <TouchableOpacity
                      key={opt.val}
                      style={[
                        styles.optionCard,
                        { borderColor: isSel ? opt.color : border },
                        isSel && { backgroundColor: `${opt.color}14` },
                      ]}
                      onPress={() => setExamineDecision(opt.val as any)}
                    >
                      <View style={styles.optionTextWrap}>
                        <Text
                          style={[
                            styles.optionTitle,
                            { color: isSel ? opt.color : textPrimary },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text
                          style={[styles.optionDesc, { color: textSecondary }]}
                        >
                          {opt.desc}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSel ? "radio-button-on" : "radio-button-off"}
                        size={scale(18)}
                        color={isSel ? opt.color : textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(14) },
                ]}
              >
                Item Condition:
              </Text>
              <View style={styles.chipsRow}>
                {[
                  "Brand New",
                  "Good",
                  "Used / Opened",
                  "Defective / Damaged",
                ].map((cond) => {
                  const isSel = conditionScore === cond;
                  return (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.chipBtn,
                        { borderColor: isSel ? "#10B981" : border },
                        isSel && {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.2)"
                            : "#ECFDF5",
                        },
                      ]}
                      onPress={() => setConditionScore(cond)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSel ? "#10B981" : textSecondary,
                            fontWeight: isSel ? "800" : "600",
                          },
                        ]}
                      >
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(12) },
                ]}
              >
                Deduction % (0 for full refund):
              </Text>
              <TextInput
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                keyboardType="numeric"
                value={depreciationPercent}
                onChangeText={setDepreciationPercent}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(12) },
                ]}
              >
                Staff Review Notes:
              </Text>
              <TextInput
                style={[
                  styles.modalTextArea,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="Explain reason for decision, package condition, or customer details..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={examineNotes}
                onChangeText={setExamineNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: border }]}
                onPress={() => setActiveModal(null)}
              >
                <Text
                  style={[styles.modalCancelText, { color: textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                disabled={submitting}
                onPress={handleExecuteExamine}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Decision</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: RETURN PICKUP ─── */}
      <Modal
        visible={activeModal === "PICKUP"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Schedule Return Pickup
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Assign a rider to collect returned package
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}
              >
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: scale(430) }}
            >
              <Text style={[styles.inputLabel, { color: textPrimary }]}>
                Select Delivery Boy:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: "row", marginBottom: scale(10) }}
              >
                {riders.map((r) => {
                  const isSel = pickupDeliveryBoyId === (r._id || r.id);
                  return (
                    <TouchableOpacity
                      key={r._id || r.id}
                      style={[
                        styles.chipBtn,
                        { borderColor: isSel ? "#6366F1" : border },
                        isSel && {
                          backgroundColor: isDark
                            ? "rgba(99, 102, 241, 0.2)"
                            : "#EEF2FF",
                        },
                      ]}
                      onPress={() => setPickupDeliveryBoyId(r._id || r.id)}
                    >
                      <MaterialCommunityIcons
                        name="moped"
                        size={scale(13)}
                        color={isSel ? "#6366F1" : textSecondary}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSel ? "#6366F1" : textSecondary,
                            fontWeight: isSel ? "800" : "600",
                          },
                        ]}
                      >
                        {r.name || r.fullName || "Delivery Boy"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: textPrimary }]}>
                Pickup Status:
              </Text>
              <View style={styles.optionColumn}>
                {[
                  {
                    label: "Pickup Scheduled",
                    val: "RETURN_PICKUP_SCHEDULED",
                  },
                  {
                    label: "Picked Up from Customer",
                    val: "RETURN_PICKED_UP",
                  },
                  {
                    label: "Delivered to Store / Warehouse",
                    val: "RETURN_RECEIVED",
                  },
                ].map((s) => {
                  const isSel = pickupStatus === s.val;
                  return (
                    <TouchableOpacity
                      key={s.val}
                      style={[
                        styles.optionCardSmall,
                        { borderColor: isSel ? "#10B981" : border },
                        isSel && {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.15)"
                            : "#ECFDF5",
                        },
                      ]}
                      onPress={() => setPickupStatus(s.val)}
                    >
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: isSel ? "#10B981" : textSecondary },
                        ]}
                      >
                        {s.label}
                      </Text>
                      <Ionicons
                        name={isSel ? "radio-button-on" : "radio-button-off"}
                        size={scale(16)}
                        color={isSel ? "#10B981" : textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(10) },
                ]}
              >
                Tracking Number (Optional):
              </Text>
              <TextInput
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="e.g., BM-REV-987654"
                placeholderTextColor={textSecondary}
                value={pickupTracking}
                onChangeText={setPickupTracking}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(10) },
                ]}
              >
                Pickup Notes:
              </Text>
              <TextInput
                style={[
                  styles.modalTextArea,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="Notes for delivery boy or package details..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={pickupNotes}
                onChangeText={setPickupNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: border }]}
                onPress={() => setActiveModal(null)}
              >
                <Text
                  style={[styles.modalCancelText, { color: textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: "#6366F1" }]}
                disabled={submitting}
                onPress={handleExecutePickup}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Pickup</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: QUALITY CHECK ─── */}
      <Modal
        visible={activeModal === "INSPECTION"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Check Returned Item
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Inspect physical condition & verify contents
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}
              >
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: scale(430) }}
            >
              <Text style={[styles.inputLabel, { color: textPrimary }]}>
                Item Check Result:
              </Text>
              <View style={styles.resultToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.resultToggleBtn,
                    {
                      borderColor: inspectionPassed ? "#10B981" : border,
                    },
                    inspectionPassed && {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.2)"
                        : "#ECFDF5",
                    },
                  ]}
                  onPress={() => setInspectionPassed(true)}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={scale(16)}
                    color={inspectionPassed ? "#10B981" : textSecondary}
                  />
                  <Text
                    style={[
                      styles.resultToggleText,
                      {
                        color: inspectionPassed ? "#10B981" : textSecondary,
                        fontWeight: inspectionPassed ? "800" : "600",
                      },
                    ]}
                  >
                    Item Accepted (Good)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resultToggleBtn,
                    {
                      borderColor: !inspectionPassed ? "#EF4444" : border,
                    },
                    !inspectionPassed && {
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.2)"
                        : "#FEF2F2",
                    },
                  ]}
                  onPress={() => setInspectionPassed(false)}
                >
                  <Ionicons
                    name="close-circle"
                    size={scale(16)}
                    color={!inspectionPassed ? "#EF4444" : textSecondary}
                  />
                  <Text
                    style={[
                      styles.resultToggleText,
                      {
                        color: !inspectionPassed ? "#EF4444" : textSecondary,
                        fontWeight: !inspectionPassed ? "800" : "600",
                      },
                    ]}
                  >
                    Item Rejected (Damaged)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(12) },
                ]}
              >
                Item Condition:
              </Text>
              <View style={styles.optionColumn}>
                {[
                  { label: "New / Resellable (Grade A)", val: "A" },
                  { label: "Minor Wear (Grade B)", val: "B" },
                  { label: "Used / Heavy Wear (Grade C)", val: "C" },
                  { label: "Damaged or Broken", val: "DAMAGED" },
                  { label: "Wrong Item Received", val: "WRONG_ITEM" },
                ].map((g) => {
                  const isSel = conditionGrade === g.val;
                  return (
                    <TouchableOpacity
                      key={g.val}
                      style={[
                        styles.optionCardSmall,
                        { borderColor: isSel ? "#EAB308" : border },
                        isSel && {
                          backgroundColor: isDark
                            ? "rgba(234, 179, 8, 0.15)"
                            : "#FEFCE8",
                        },
                      ]}
                      onPress={() => setConditionGrade(g.val as any)}
                    >
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: isSel ? "#CA8A04" : textSecondary },
                        ]}
                      >
                        {g.label}
                      </Text>
                      <Ionicons
                        name={isSel ? "radio-button-on" : "radio-button-off"}
                        size={scale(16)}
                        color={isSel ? "#CA8A04" : textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(10) },
                ]}
              >
                Deduction % (if any):
              </Text>
              <TextInput
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                keyboardType="numeric"
                value={inspectionDepreciation}
                onChangeText={setInspectionDepreciation}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(10) },
                ]}
              >
                Inspection Remarks:
              </Text>
              <TextInput
                style={[
                  styles.modalTextArea,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="Details about packaging, seals, or missing parts..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={inspectionNotes}
                onChangeText={setInspectionNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: border }]}
                onPress={() => setActiveModal(null)}
              >
                <Text
                  style={[styles.modalCancelText, { color: textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: "#CA8A04" }]}
                disabled={submitting}
                onPress={handleExecuteInspection}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Inspection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: SUPERADMIN FINALIZE REFUND ─── */}
      <Modal
        visible={activeModal === "FINALIZE"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  {refundTypeTab === "my" ? "Execute Online Payment Refund" : "Audit & Finalize Refund"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Super Admin Disbursal Action
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}
              >
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: scale(430) }}
            >
              <View
                style={[
                  styles.payoutNotice,
                  {
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.15)"
                      : "#ECFDF5",
                    borderColor: isDark ? "#059669" : "#A7F3D0",
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={scale(18)}
                  color="#10B981"
                />
                <Text style={[styles.payoutNoticeText, { color: textPrimary }]}>
                  Approving will immediately credit NPR{" "}
                  <Text style={{ fontWeight: "800" }}>
                    {(
                      selectedClaim?.amount ||
                      selectedClaim?.order?.totalAmount ||
                      0
                    ).toLocaleString()}
                  </Text>{" "}
                  back to the customer's account ({selectedClaim?.originalPaymentMethod || "Online Gateway"}). Platform commission (1.5%) is strictly preserved.
                </Text>
              </View>

              {/* Customer Bank Details To Pay Back */}
              {renderCustomerBankDetails(selectedClaim, true)}

              <Text style={[styles.inputLabel, { color: textPrimary }]}>
                Refund Decision:
              </Text>
              <View style={styles.resultToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.resultToggleBtn,
                    {
                      borderColor:
                        finalizeAction === "approve" ? "#10B981" : border,
                    },
                    finalizeAction === "approve" && {
                      backgroundColor: isDark
                        ? "rgba(16, 185, 129, 0.2)"
                        : "#ECFDF5",
                    },
                  ]}
                  onPress={() => setFinalizeAction("approve")}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={scale(16)}
                    color={
                      finalizeAction === "approve" ? "#10B981" : textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.resultToggleText,
                      {
                        color:
                          finalizeAction === "approve"
                            ? "#10B981"
                            : textSecondary,
                        fontWeight:
                          finalizeAction === "approve" ? "800" : "600",
                      },
                    ]}
                  >
                    Send Refund Money
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resultToggleBtn,
                    {
                      borderColor:
                        finalizeAction === "reject" ? "#EF4444" : border,
                    },
                    finalizeAction === "reject" && {
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.2)"
                        : "#FEF2F2",
                    },
                  ]}
                  onPress={() => setFinalizeAction("reject")}
                >
                  <Ionicons
                    name="close-circle"
                    size={scale(16)}
                    color={
                      finalizeAction === "reject" ? "#EF4444" : textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.resultToggleText,
                      {
                        color:
                          finalizeAction === "reject"
                            ? "#EF4444"
                            : textSecondary,
                        fontWeight: finalizeAction === "reject" ? "800" : "600",
                      },
                    ]}
                  >
                    Reject Refund
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: textPrimary, marginTop: scale(12) },
                ]}
              >
                Payment UTR / Gateway Reference:
              </Text>
              <TextInput
                style={[
                  styles.modalTextArea,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="e.g. ESEWA-TXN-987654 or Bank UTR Reference..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={finalizeNotes}
                onChangeText={setFinalizeNotes}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: border }]}
                onPress={() => setActiveModal(null)}
              >
                <Text
                  style={[styles.modalCancelText, { color: textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  {
                    backgroundColor:
                      finalizeAction === "approve" ? "#10B981" : "#EF4444",
                  },
                ]}
                disabled={submitting}
                onPress={handleExecuteFinalize}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {finalizeAction === "approve"
                      ? "Confirm Refund"
                      : "Confirm Rejection"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: AUDIT TIMELINE & DETAILS ─── */}
      <Modal visible={activeModal === "AUDIT"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Request Details & Audit
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Order #{selectedClaim?.orderNumber || selectedClaim?.order?.orderNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}
              >
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: scale(430) }}
            >
              <View
                style={[
                  styles.auditBox,
                  { backgroundColor: bg, borderColor: border },
                ]}
              >
                <Text style={[styles.auditFieldTitle, { color: textSecondary }]}>
                  Customer
                </Text>
                <Text style={[styles.auditFieldValue, { color: textPrimary }]}>
                  {selectedClaim?.customer?.name ||
                    selectedClaim?.order?.shippingAddress?.fullName ||
                    "Customer"}
                </Text>

                <Text
                  style={[
                    styles.auditFieldTitle,
                    { color: textSecondary, marginTop: scale(8) },
                  ]}
                >
                  Store
                </Text>
                <Text style={[styles.auditFieldValue, { color: textPrimary }]}>
                  {selectedClaim?.vendor?.businessDetails?.businessName ||
                    selectedClaim?.vendor?.brandDetails?.brandName ||
                    "Store"}
                </Text>

                <Text
                  style={[
                    styles.auditFieldTitle,
                    { color: textSecondary, marginTop: scale(8) },
                  ]}
                >
                  Amount & Method
                </Text>
                <Text style={[styles.auditFieldValue, { color: "#10B981" }]}>
                  NPR{" "}
                  {(
                    selectedClaim?.amount ||
                    selectedClaim?.order?.totalAmount ||
                    0
                  ).toLocaleString()}{" "}
                  ({selectedClaim?.originalPaymentMethod || "COD"})
                </Text>

                <Text
                  style={[
                    styles.auditFieldTitle,
                    { color: textSecondary, marginTop: scale(8) },
                  ]}
                >
                  Payout Responsibility
                </Text>
                <Text style={[styles.auditFieldValue, { color: selectedClaim?.isVendorFunded ? "#F59E0B" : "#6366F1" }]}>
                  {selectedClaim?.isVendorFunded ? "Vendor Direct Settlement (COD)" : "Super Admin Online Gateway Payout"}
                </Text>

                <Text
                  style={[
                    styles.auditFieldTitle,
                    { color: textSecondary, marginTop: scale(8) },
                  ]}
                >
                  Return Reason
                </Text>
                <Text style={[styles.auditFieldValue, { color: textPrimary }]}>
                  {selectedClaim?.reason || "Product return requested"}
                </Text>
              </View>

              {/* Timeline list */}
              {selectedClaim?.timeline && selectedClaim.timeline.length > 0 && (
                <View style={{ marginTop: scale(14) }}>
                  <Text style={[styles.inputLabel, { color: textPrimary }]}>
                    Lifecycle Audit History:
                  </Text>
                  {selectedClaim.timeline.map((entry: any, i: number) => (
                    <View key={i} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.timelineStatus,
                            { color: textPrimary },
                          ]}
                        >
                          {entry.status}
                        </Text>
                        <Text
                          style={[
                            styles.timelineMeta,
                            { color: textSecondary },
                          ]}
                        >
                          {entry.actorRole || "system"} •{" "}
                          {entry.timestamp
                            ? new Date(entry.timestamp).toLocaleString()
                            : ""}
                        </Text>
                        {entry.notes ? (
                          <Text
                            style={[
                              styles.timelineNotes,
                              { color: textSecondary },
                            ]}
                          >
                            "{entry.notes}"
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { flex: 1, backgroundColor: "#10B981" }]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={styles.modalSaveText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── CUSTOMER BANK DETAILS STYLES ───
  bankDetailsCard: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(12),
  },
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  bankIconCircle: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  bankTitleText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  bankSubtitleText: {
    fontSize: moderateScale(10),
  },
  payoutMethodPill: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  payoutMethodPillText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  payAmountBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(10),
    paddingVertical: scale(7),
    borderRadius: scale(8),
    borderWidth: 1,
    marginBottom: scale(8),
  },
  payAmountLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  payAmountValue: {
    fontSize: moderateScale(14),
    fontWeight: "900",
  },
  bankFieldsList: {
    gap: scale(6),
  },
  bankFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(2),
  },
  bankFieldLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  bankFieldValue: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  bankFieldRowCopy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(6),
  },
  bankMonoValue: {
    fontSize: moderateScale(12),
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "700",
    marginTop: scale(2),
  },
  copyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    gap: scale(4),
  },
  copyActionBtnText: {
    color: "#6366F1",
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  noBankNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(6),
    gap: scale(6),
  },
  noBankNoticeText: {
    fontSize: moderateScale(11),
    flex: 1,
  },
  paidRefBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(8),
    borderRadius: scale(6),
    borderWidth: 1,
    marginTop: scale(4),
  },
  paidRefTitle: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  paidRefDate: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  gridBankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(6),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    borderWidth: 1,
    marginTop: scale(6),
    gap: scale(4),
  },
  gridBankText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    flex: 1,
  },
  gridCopyBtn: {
    padding: scale(2),
  },

  root: {
    flex: 1,
  },
  listContent: {
    paddingBottom: scale(40),
  },
  headerContainer: {
    marginBottom: scale(10),
  },

  // ─── Primary 2 Tabs Segmented Bar ───
  mainTabsContainer: {
    flexDirection: "row",
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(4),
    gap: scale(6),
    marginTop: scale(10),
    marginBottom: scale(8),
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
    borderRadius: scale(11),
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  mainTabBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  mainTabLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  mainTabIconWrap: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  mainTabTitleGroup: {
    flex: 1,
  },
  mainTabTitle: {
    fontSize: moderateScale(12),
    letterSpacing: -0.2,
  },
  mainTabSub: {
    fontSize: moderateScale(9),
    marginTop: scale(1),
  },
  mainTabBadge: {
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(12),
    minWidth: scale(22),
    alignItems: "center",
  },
  mainTabBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "900",
  },

  // Contextual Banner
  tabContextBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(10),
    borderWidth: 1,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    gap: scale(8),
    marginBottom: scale(8),
  },
  tabContextText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    lineHeight: scale(15),
  },

  // KPI Overview Bar
  kpiRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(8),
  },
  kpiCard: {
    flex: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    borderRadius: scale(12),
    borderWidth: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  kpiLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    marginTop: scale(2),
  },

  // Stage Filter Tabs
  pillScroll: {
    marginVertical: scale(6),
  },
  tabScrollContent: {
    flexDirection: "row",
    gap: scale(6),
    paddingRight: scale(10),
  },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(7),
    borderRadius: scale(20),
    borderWidth: 1,
    gap: scale(6),
  },
  stagePillText: {
    fontSize: moderateScale(11),
  },
  tabCountBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  tabCountText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },

  // Search & Controls Row
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: scale(4),
    marginBottom: scale(8),
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    height: scale(38),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12),
    paddingVertical: 0,
  },
  viewToggleGroup: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(2),
  },
  viewToggleBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  viewToggleBtnActive: {
    backgroundColor: "#10B981",
  },

  // Count Row
  countRow: {
    marginBottom: scale(6),
  },
  countText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },

  // ─── FULL LIST CARD STYLES ───
  claimCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(14),
    marginBottom: scale(12),
  },
  claimHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  orderNumber: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  refPill: {
    backgroundColor: "rgba(100, 116, 139, 0.12)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  refPillText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#64748B",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(4),
    flexWrap: "wrap",
    gap: scale(4),
  },
  vendorSub: {
    fontSize: moderateScale(11),
  },
  customerSub: {
    fontSize: moderateScale(11),
  },
  metaDivider: {
    color: "#94A3B8",
    fontSize: moderateScale(10),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(9),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: scale(4),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },

  // Claim Body
  claimBody: {
    marginTop: scale(12),
  },
  bodyHighlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: scale(10),
  },
  amountPill: {
    gap: scale(1),
  },
  amountLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    color: "#10B981",
  },
  tagsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    gap: scale(4),
  },
  methodText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  claimTypeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  claimTypeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#10B981",
  },

  // Reason Box
  reasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(8),
    marginBottom: scale(10),
  },
  reasonLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    marginBottom: scale(2),
  },
  reasonContent: {
    fontSize: moderateScale(11),
    lineHeight: scale(16),
  },

  // Photos
  photosWrapper: {
    marginBottom: scale(10),
  },
  photosLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  proofThumb: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    marginRight: scale(8),
  },

  // Stepper Progress
  workflowCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(10),
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(3),
  },
  stepTitle: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  stepStatusText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    marginTop: scale(1),
  },
  stepLine: {
    height: 1.5,
    flex: 0.8,
    marginHorizontal: scale(2),
    marginBottom: scale(12),
  },
  notesPreviewWrap: {
    borderTopWidth: 1,
    marginTop: scale(8),
    paddingTop: scale(6),
    gap: scale(2),
  },
  stepNoteLine: {
    fontSize: moderateScale(10),
    fontStyle: "italic",
  },

  // Active Actions Grid (Responsive 2x2 on mobile, row on tablet)
  actionsRow: {
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
  },
  activeActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  actionBtn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: scale(5),
  },
  actionBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },

  // Completed / Rejected State Banners
  completedActionsBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  completedBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flex: 1,
  },
  completedBannerText: {
    color: "#10B981",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  smallAuditBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    gap: scale(4),
  },
  smallAuditBtnText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  rejectedActionsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  rejectedBannerText: {
    color: "#EF4444",
    fontSize: moderateScale(11),
    fontWeight: "800",
  },

  // ─── GRID CARD STYLES ───
  gridColumnWrapper: {
    gap: scale(10),
  },
  gridCard: {
    flex: 1,
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(10),
    justifyContent: "space-between",
  },
  gridCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadgeCompact: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  statusBadgeTextCompact: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  gridAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: scale(8),
  },
  gridAmountText: {
    fontSize: moderateScale(14),
    fontWeight: "900",
  },
  gridCustomerText: {
    fontSize: moderateScale(10),
    marginBottom: scale(4),
  },
  gridReasonText: {
    fontSize: moderateScale(10),
    lineHeight: scale(14),
    marginBottom: scale(8),
  },
  gridActionsRow: {
    flexDirection: "row",
    gap: scale(6),
    paddingTop: scale(8),
    borderTopWidth: 1,
  },
  gridActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: scale(6),
    paddingVertical: scale(5),
    gap: scale(3),
  },
  gridActionText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  completedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(4),
    flex: 1,
  },
  completedText: {
    color: "#10B981",
    fontSize: moderateScale(10),
    fontWeight: "800",
  },

  // Empty State
  centerWrap: {
    paddingVertical: scale(50),
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    marginTop: scale(4),
    textAlign: "center",
    paddingHorizontal: scale(20),
  },
  emptyText: {
    fontSize: moderateScale(12),
  },

  // Pagination
  paginationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scale(14),
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
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

  // ─── MODAL STYLES ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalContent: {
    width: "100%",
    maxWidth: scale(480),
    borderRadius: scale(18),
    borderWidth: 1,
    padding: scale(18),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(14),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  modalCloseBtn: {
    padding: scale(4),
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    marginBottom: scale(6),
  },
  optionColumn: {
    gap: scale(8),
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(10),
    gap: scale(10),
  },
  optionCardSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  optionDesc: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    gap: scale(4),
  },
  chipText: {
    fontSize: moderateScale(10),
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(9),
    fontSize: moderateScale(11),
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
    marginTop: scale(16),
  },
  modalCancelBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(9),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  modalSaveBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: scale(18),
    paddingVertical: scale(9),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "800",
  },

  // Quality check result toggle
  resultToggleRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(8),
  },
  resultToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: scale(10),
    paddingVertical: scale(9),
    gap: scale(6),
  },
  resultToggleText: {
    fontSize: moderateScale(10),
  },

  // Notice
  payoutNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(8),
    borderWidth: 1,
    padding: scale(10),
    gap: scale(8),
    marginBottom: scale(14),
  },
  payoutNoticeText: {
    flex: 1,
    fontSize: moderateScale(11),
    lineHeight: scale(16),
  },

  // Audit Box
  auditBox: {
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(12),
  },
  auditFieldTitle: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  auditFieldValue: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(2),
  },
  timelineItem: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: scale(10),
  },
  timelineDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
    marginTop: scale(5),
  },
  timelineStatus: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  timelineMeta: {
    fontSize: moderateScale(9),
    marginTop: scale(1),
  },
  timelineNotes: {
    fontSize: moderateScale(10),
    fontStyle: "italic",
    marginTop: scale(2),
  },
});
