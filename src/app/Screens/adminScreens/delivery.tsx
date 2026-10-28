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
  useWindowDimensions,
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

  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isSmallDevice = windowWidth < 380;

  const [activeTab, setActiveTab] = useState<"fleet" | "cod">("fleet");
  const [viewMode, setViewMode] = useState<"list" | "grid">(isTablet ? "grid" : "list");

  // Fleet state
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const { deliveryBoys, loading: fleetLoading } = useAppSelector(
    (state) => state.admin,
  );
  const [localRiders, setLocalRiders] = useState<any[]>([]);

  useEffect(() => {
    if (Array.isArray(deliveryBoys)) {
      setLocalRiders(deliveryBoys);
    } else if ((deliveryBoys as any)?.data && Array.isArray((deliveryBoys as any).data)) {
      setLocalRiders((deliveryBoys as any).data);
    } else {
      setLocalRiders([]);
    }
  }, [deliveryBoys]);

  // Real-time Socket.IO Rider status & location listener
  useEffect(() => {
    socketService.connect("admin");

    const unsubscribe = socketService.onDeliveryRiderStatus((data: any) => {
      if (!data) return;
      const targetId = String(
        data.deliveryBoyId || data.riderId || data._id || "",
      );
      if (!targetId) return;

      setLocalRiders((prev) =>
        prev.map((r: any) => {
          const rId = String(r._id || r.id || "");
          const rUserId = String(r.user?._id || r.userId || "");
          if (rId !== targetId && rUserId !== targetId) return r;

          const newAvailability =
            data.availability !== undefined ? data.availability : r.availability;
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
        }),
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

  // Fleet KPIs
  const onlineCount = useMemo(() => {
    return (localRiders || []).filter((r: any) => checkIsOnline(r)).length;
  }, [localRiders]);

  const busyCount = useMemo(() => {
    return (localRiders || []).filter((r: any) => checkIsBusy(r)).length;
  }, [localRiders]);

  const totalFleetCash = useMemo(() => {
    return (localRiders || []).reduce((sum, r) => {
      const c = r.codCashInCustody ?? r.cashInHand ?? r.cashCollected ?? 0;
      return sum + c;
    }, 0);
  }, [localRiders]);

  // COD Reconciliation state
  const [codReconciliation, setCodReconciliation] = useState<any[]>([]);
  const [codSummary, setCodSummary] = useState<any>(null);
  const [codLoading, setCodLoading] = useState(false);
  const [codRefreshing, setCodRefreshing] = useState(false);
  const [codSearch, setCodSearch] = useState("");

  // Dispute modal state
  const [disputeRider, setDisputeRider] = useState<any | null>(null);
  const [disputeAmount, setDisputeAmount] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadRiders = async () => {
    try {
      const res = await dispatch(
        fetchAdminDeliveryBoys({ search: search.trim() || undefined }),
      ).unwrap();
      if (Array.isArray(res)) {
        setLocalRiders(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setLocalRiders(res.data);
      }
    } catch (err) {
      console.error("Failed to load riders", err);
    }
  };

  const loadCodData = async () => {
    try {
      setCodLoading(true);
      const res = await fetchDeliveryCodReconciliationAdminApi();
      const list = res?.reconciliation || res?.reconciliations || [];
      setCodReconciliation(list);
      if (res?.summary) {
        setCodSummary(res.summary);
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
    const outstandingVal = item.outstanding ?? item.outstandingBalance ?? 0;
    setDisputeAmount(String(outstandingVal));
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
      Alert.alert(
        "Reason Required",
        "Please specify the reason for raising this COD mismatch dispute.",
      );
      return;
    }

    try {
      setSubmittingDispute(true);
      await raiseCodDisputeAdminApi({
        deliveryBoyId:
          disputeRider.deliveryBoyId ||
          disputeRider.deliveryBoy?._id ||
          disputeRider.deliveryBoy?.id,
        vendorId: disputeRider.vendorId || disputeRider.vendor?._id,
        disputedAmount: Number(disputeAmount),
        reason: disputeReason.trim(),
        notes: disputeNotes.trim(),
      });

      Alert.alert(
        "Dispute Logged",
        "Cash mismatch dispute raised and forwarded to financial audit.",
      );
      setDisputeRider(null);
      loadCodData();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to raise COD dispute",
      );
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

  const filteredCodList = useMemo(() => {
    if (!codSearch.trim()) return codReconciliation;
    const q = codSearch.toLowerCase().trim();
    return codReconciliation.filter((item: any) => {
      const riderName = (
        item.deliveryBoyName ||
        item.deliveryBoy?.fullName ||
        item.deliveryBoy?.name ||
        ""
      ).toLowerCase();
      const storeName = (item.vendorName || "").toLowerCase();
      const phone = (item.phone || item.deliveryBoy?.phone || "").toLowerCase();
      return (
        riderName.includes(q) ||
        storeName.includes(q) ||
        phone.includes(q)
      );
    });
  }, [codReconciliation, codSearch]);

  const bg = isDark ? "#0A0F12" : "#F4F6F9";
  const cardBg = isDark ? "#141D22" : "#FFFFFF";
  const border = isDark ? "#24323B" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  // Status badge helper for COD
  const getCodStatusBadge = (status: string) => {
    switch (status) {
      case "RECONCILED":
      case "SETTLED":
        return {
          label: "Settled",
          bg: isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5",
          border: isDark ? "#059669" : "#A7F3D0",
          color: "#10B981",
        };
      case "DISCREPANCY_REPORTED":
      case "MISMATCH_DISPUTE":
        return {
          label: "Discrepancy Reported",
          bg: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEF2F2",
          border: isDark ? "#DC2626" : "#FECACA",
          color: "#EF4444",
        };
      case "AWAITING_HANDOVER":
      case "PENDING_HANDOVER":
      default:
        return {
          label: "Awaiting Handover",
          bg: isDark ? "rgba(245, 158, 11, 0.2)" : "#FFFBEB",
          border: isDark ? "#D97706" : "#FDE68A",
          color: "#F59E0B",
        };
    }
  };

  // ─── RENDER RIDER (FLEET) ITEM ───
  const renderRiderItem = ({ item }: { item: any }) => {
    const isOnline = checkIsOnline(item);
    const isBusy = checkIsBusy(item);

    const riderName =
      item.fullName || item.name || item.user?.name || "Delivery Partner";
    const riderPhone =
      item.phone || item.user?.phone || "No phone registered";

    // Real vehicle details
    const vehicleReg =
      item.vehicleDetails?.registrationNumber || item.vehicleNumber;
    const vehicleType =
      item.vehicleDetails?.vehicleType || item.vehicleType || "Motorcycle";
    const vehicleDisplay =
      vehicleReg && vehicleReg !== "Not assigned"
        ? `${vehicleType} • ${vehicleReg}`
        : vehicleType;

    // Real cash balance in custody
    const cashBalance =
      item.codCashInCustody ?? item.cashInHand ?? item.cashCollected ?? 0;

    // Real deliveries & wallet
    const totalDeliveries =
      item.completedDeliveries ?? item.metrics?.totalDeliveries ?? 0;
    const rating = item.metrics?.rating
      ? Number(item.metrics.rating).toFixed(1)
      : "5.0";

    // Service Area / City
    const serviceLoc = item.serviceArea
      ? `${item.serviceArea}, ${item.serviceCity || "Kathmandu"}`
      : item.serviceCity || item.currentAddress?.city || "Kathmandu";

    // Active order info if currently delivering
    const activeOrderNumber =
      item.activeOrderId?.orderNumber ||
      (typeof item.activeOrderId === "string"
        ? item.activeOrderId.slice(-6)
        : null);

    // Coordinates
    const coords =
      item.location?.coordinates || item.currentLocation?.coordinates;
    const hasGps = coords && (coords[0] !== 0 || coords[1] !== 0);

    // ─── GRID CARD ───
    if (viewMode === "grid") {
      return (
        <View
          style={[
            styles.riderGridCard,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.gridHeaderRow}>
            <View
              style={[
                styles.avatarWrapSmall,
                {
                  backgroundColor: isOnline
                    ? isDark
                      ? "rgba(16, 185, 129, 0.2)"
                      : "#ECFDF5"
                    : isDark
                    ? "#1E293B"
                    : "#F1F5F9",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="moped"
                size={scale(18)}
                color={isOnline ? "#10B981" : "#94A3B8"}
              />
            </View>
            <View
              style={[
                styles.statusBadgeCompact,
                {
                  backgroundColor: isOnline
                    ? isDark
                      ? "rgba(16, 185, 129, 0.2)"
                      : "#ECFDF5"
                    : isDark
                    ? "rgba(148, 163, 184, 0.15)"
                    : "#F1F5F9",
                  borderColor: isOnline ? "#10B981" : border,
                },
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
                  styles.statusBadgeTextCompact,
                  { color: isOnline ? "#10B981" : textSecondary },
                ]}
              >
                {isBusy ? "Busy" : isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.riderName, { color: textPrimary, marginTop: scale(6) }]}
            numberOfLines={1}
          >
            {riderName}
          </Text>
          <Text
            style={[styles.contactText, { color: textSecondary }]}
            numberOfLines={1}
          >
            {riderPhone}
          </Text>

          <View style={styles.gridMetricRow}>
            <View>
              <Text style={[styles.gridMetricLabel, { color: textSecondary }]}>
                COD Cash
              </Text>
              <Text
                style={[
                  styles.gridMetricVal,
                  { color: cashBalance > 0 ? "#10B981" : textPrimary },
                ]}
              >
                NPR {cashBalance.toLocaleString()}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.gridMetricLabel, { color: textSecondary }]}>
                Deliveries
              </Text>
              <Text style={[styles.gridMetricVal, { color: textPrimary }]}>
                {totalDeliveries} ({rating} ★)
              </Text>
            </View>
          </View>

          <View style={[styles.gridFooterRow, { borderTopColor: border }]}>
            <Text
              style={[styles.gridVehicleText, { color: textSecondary }]}
              numberOfLines={1}
            >
              <MaterialCommunityIcons
                name="motorbike"
                size={scale(11)}
                color={textSecondary}
              />{" "}
              {vehicleDisplay}
            </Text>
          </View>
        </View>
      );
    }

    // ─── FULL LIST CARD ───
    return (
      <View
        style={[
          styles.riderCard,
          { backgroundColor: cardBg, borderColor: border },
        ]}
      >
        <View style={styles.riderHeader}>
          <View
            style={[
              styles.avatarWrap,
              {
                backgroundColor: isOnline
                  ? isDark
                    ? "rgba(16, 185, 129, 0.2)"
                    : "#ECFDF5"
                  : isDark
                  ? "#1E293B"
                  : "#F1F5F9",
              },
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
              <View style={{ flex: 1, marginRight: scale(8) }}>
                <Text style={[styles.riderName, { color: textPrimary }]}>
                  {riderName}
                </Text>
                <Text style={[styles.contactText, { color: textSecondary }]}>
                  {riderPhone} • {serviceLoc}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isOnline
                      ? isDark
                        ? "rgba(16, 185, 129, 0.2)"
                        : "#ECFDF5"
                      : isDark
                      ? "rgba(148, 163, 184, 0.15)"
                      : "#F1F5F9",
                    borderColor: isOnline ? "#10B981" : border,
                  },
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
                    { color: isOnline ? "#10B981" : textSecondary },
                  ]}
                >
                  {isBusy ? "On Delivery" : isOnline ? "Online & Ready" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Order Banner if busy */}
        {activeOrderNumber && (
          <View
            style={[
              styles.activeOrderBanner,
              {
                backgroundColor: isDark
                  ? "rgba(245, 158, 11, 0.15)"
                  : "#FFFBEB",
                borderColor: isDark ? "#D97706" : "#FDE68A",
              },
            ]}
          >
            <Feather name="navigation" size={scale(12)} color="#F59E0B" />
            <Text style={[styles.activeOrderText, { color: "#F59E0B" }]}>
              Currently Delivering Order #{activeOrderNumber}
            </Text>
          </View>
        )}

        {/* Real Vehicle & Financial Details */}
        <View
          style={[
            styles.infoRow,
            { backgroundColor: bg, borderColor: border },
          ]}
        >
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>
              Vehicle
            </Text>
            <Text
              style={[styles.infoVal, { color: textPrimary }]}
              numberOfLines={1}
            >
              {vehicleDisplay}
            </Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>
              Deliveries
            </Text>
            <Text style={[styles.infoVal, { color: textPrimary }]}>
              {totalDeliveries} ({rating} ★)
            </Text>
          </View>

          <View style={[styles.infoCol, { alignItems: "flex-end" }]}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>
              Cash in Custody
            </Text>
            <Text
              style={[
                styles.infoVal,
                {
                  color: cashBalance > 0 ? "#10B981" : textPrimary,
                  fontWeight: "900",
                },
              ]}
            >
              NPR {cashBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Real Coordinates & Location Status */}
        <View style={[styles.footerRow, { borderTopColor: border }]}>
          <View style={styles.footerItem}>
            <Feather
              name="map-pin"
              size={scale(12)}
              color={hasGps ? "#10B981" : "#94A3B8"}
            />
            <Text style={[styles.footerText, { color: textSecondary }]}>
              {hasGps
                ? `${coords[1]?.toFixed(4)}°N, ${coords[0]?.toFixed(4)}°E`
                : "GPS updating"}
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Feather name="shield" size={scale(12)} color="#10B981" />
            <Text style={[styles.footerText, { color: textSecondary }]}>
              Status: {item.approvalStatus || "Approved"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── RENDER COD RECONCILIATION ITEM ───
  const renderCodItem = ({ item }: { item: any }) => {
    // Correct real data bindings
    const riderName =
      item.deliveryBoyName ||
      item.deliveryBoy?.fullName ||
      item.deliveryBoy?.user?.name ||
      item.deliveryBoy?.name ||
      "Delivery Partner";

    const riderPhone =
      item.phone ||
      item.deliveryBoy?.phone ||
      item.deliveryBoy?.user?.phone ||
      "No phone registered";

    const storeName =
      item.vendorName ||
      item.vendor?.businessDetails?.businessName ||
      "Store";

    const ordersCount =
      item.ordersCount || (item.orders ? item.orders.length : 0);

    const expected = item.expectedCod ?? item.totalExpectedCod ?? 0;
    const handedOver = item.totalHandedOver ?? item.totalSubmitted ?? 0;
    const outstanding =
      item.outstanding ??
      item.outstandingBalance ??
      Math.max(0, expected - handedOver);

    const totalCollected = item.totalCollected ?? expected;
    const discrepancies =
      item.discrepanciesCount ||
      (item.discrepancies ? item.discrepancies.length : 0);

    const status =
      item.reconciliationStatus ||
      (discrepancies > 0
        ? "DISCREPANCY_REPORTED"
        : outstanding <= 0
        ? "RECONCILED"
        : "AWAITING_HANDOVER");

    const statusBadge = getCodStatusBadge(status);

    return (
      <View
        style={[
          styles.codCard,
          { backgroundColor: cardBg, borderColor: border },
        ]}
      >
        <View style={styles.codCardHeader}>
          <View style={{ flex: 1, marginRight: scale(10) }}>
            <Text style={[styles.riderName, { color: textPrimary }]}>
              {riderName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.contactText, { color: textSecondary }]}>
                {riderPhone}
              </Text>
              <Text style={styles.metaDivider}>•</Text>
              <Text
                style={[styles.vendorText, { color: textPrimary }]}
                numberOfLines={1}
              >
                <Ionicons
                  name="storefront-outline"
                  size={scale(11)}
                  color="#10B981"
                />{" "}
                <Text style={{ fontWeight: "700" }}>{storeName}</Text>
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusBadge.bg,
                borderColor: statusBadge.border,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: statusBadge.color },
              ]}
            >
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {/* Real Financial Ledger Breakdown */}
        <View
          style={[
            styles.ledgerRow,
            { backgroundColor: bg, borderColor: border },
          ]}
        >
          <View style={styles.ledgerCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>
              Expected COD
            </Text>
            <Text style={[styles.ledgerVal, { color: textPrimary }]}>
              NPR {expected.toLocaleString()}
            </Text>
            <Text style={[styles.subCountText, { color: textSecondary }]}>
              {ordersCount} {ordersCount === 1 ? "order" : "orders"}
            </Text>
          </View>

          <View style={styles.ledgerCol}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>
              Handed Over
            </Text>
            <Text style={[styles.ledgerVal, { color: "#10B981" }]}>
              NPR {handedOver.toLocaleString()}
            </Text>
            <Text style={[styles.subCountText, { color: textSecondary }]}>
              Submitted to store
            </Text>
          </View>

          <View style={[styles.ledgerCol, { alignItems: "flex-end" }]}>
            <Text style={[styles.infoLabel, { color: textSecondary }]}>
              Outstanding
            </Text>
            <Text
              style={[
                styles.ledgerVal,
                { color: outstanding > 0 ? "#EF4444" : "#10B981" },
              ]}
            >
              NPR {outstanding.toLocaleString()}
            </Text>
            <Text style={[styles.subCountText, { color: textSecondary }]}>
              {outstanding > 0 ? "In rider custody" : "Fully settled"}
            </Text>
          </View>
        </View>

        {/* Discrepancies notification if reported */}
        {discrepancies > 0 && (
          <View
            style={[
              styles.discrepancyBanner,
              {
                backgroundColor: isDark
                  ? "rgba(239, 68, 68, 0.15)"
                  : "#FEF2F2",
                borderColor: isDark ? "#DC2626" : "#FECACA",
              },
            ]}
          >
            <Ionicons name="alert-circle" size={scale(14)} color="#EF4444" />
            <Text style={[styles.discrepancyText, { color: "#EF4444" }]}>
              {discrepancies} {discrepancies === 1 ? "shortfall" : "shortfalls"}{" "}
              reported by store manager
            </Text>
          </View>
        )}

        {/* COD Dispute Action */}
        <View style={[styles.codFooter, { borderTopColor: border }]}>
          <Text style={[styles.formulaText, { color: textSecondary }]}>
            NPR {expected.toLocaleString()} − NPR {handedOver.toLocaleString()} ={" "}
            <Text style={{ fontWeight: "800", color: textPrimary }}>
              NPR {outstanding.toLocaleString()}
            </Text>
          </Text>

          {outstanding > 0 && (
            <TouchableOpacity
              style={[styles.disputeBtn, { borderColor: "#EF4444" }]}
              onPress={() => handleOpenDispute(item)}
            >
              <Feather name="alert-circle" size={scale(12)} color="#EF4444" />
              <Text style={styles.disputeBtnText}>Report Mismatch</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader
        title="Delivery Operations"
        subtitle="Rider Fleet & COD Cash Collection"
        showBack
      />

      {/* Top Segmented Navigation */}
      <View
        style={[
          styles.segmentBar,
          { backgroundColor: cardBg, borderColor: border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "fleet" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("fleet")}
        >
          <MaterialCommunityIcons
            name="moped-outline"
            size={scale(16)}
            color={activeTab === "fleet" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "fleet" ? "#10B981" : textSecondary },
            ]}
          >
            Rider Fleet ({localRiders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "cod" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("cod")}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={scale(16)}
            color={activeTab === "cod" ? "#10B981" : textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === "cod" ? "#10B981" : textSecondary },
            ]}
          >
            COD Reconciliation ({codReconciliation.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "fleet" ? (
        <>
          {/* Top Fleet KPI Overview Bar */}
          <View style={styles.kpiRow}>
            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.kpiValue, { color: textPrimary }]}>
                {localRiders.length}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Total Fleet
              </Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.kpiValue, { color: "#10B981" }]}>
                {onlineCount}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Online Ready
              </Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.kpiValue, { color: "#F59E0B" }]}>
                {busyCount}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                On Delivery
              </Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text
                style={[
                  styles.kpiValue,
                  { color: totalFleetCash > 0 ? "#10B981" : textPrimary },
                ]}
              >
                NPR {totalFleetCash.toLocaleString()}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Custody Cash
              </Text>
            </View>
          </View>

          {/* Search & View Mode Header */}
          <View style={styles.controlsRow}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Feather name="search" size={scale(15)} color={textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: textPrimary }]}
                placeholder="Search riders by name, phone or vehicle..."
                placeholderTextColor={textSecondary}
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
                  <Feather name="x" size={scale(15)} color={textSecondary} />
                </TouchableOpacity>
              ) : null}
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

          {/* Filter Chips */}
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, !onlineOnly && styles.chipActive]}
              onPress={() => setOnlineOnly(false)}
            >
              <Text
                style={[
                  styles.chipText,
                  !onlineOnly && styles.chipTextActive,
                ]}
              >
                All Riders ({localRiders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, onlineOnly && styles.chipActive]}
              onPress={() => setOnlineOnly(true)}
            >
              <View
                style={[styles.statusDot, { backgroundColor: "#10B981" }]}
              />
              <Text
                style={[
                  styles.chipText,
                  onlineOnly && styles.chipTextActive,
                ]}
              >
                Active Online ({onlineCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <FlatList
            data={filteredRiders}
            keyExtractor={(item) => item._id || item.id || String(Math.random())}
            renderItem={renderRiderItem}
            numColumns={viewMode === "grid" ? 2 : 1}
            key={viewMode}
            columnWrapperStyle={
              viewMode === "grid" ? styles.gridColumnWrapper : undefined
            }
            contentContainerStyle={[
              styles.listContent,
              { paddingHorizontal: isTablet ? scale(20) : scale(16) },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={fleetLoading}
                onRefresh={onRefresh}
                tintColor="#10B981"
              />
            }
            ListEmptyComponent={
              !fleetLoading ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="moped-electric"
                    size={scale(48)}
                    color="#64748B"
                  />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    No delivery riders found matching filter.
                  </Text>
                </View>
              ) : undefined
            }
          />
        </>
      ) : (
        <>
          {/* Top COD KPI Overview Bar */}
          <View style={styles.kpiRow}>
            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.kpiValue, { color: textPrimary }]}>
                NPR{" "}
                {(
                  codSummary?.totalExpectedCod ??
                  codReconciliation.reduce(
                    (s, i) => s + (i.expectedCod || 0),
                    0,
                  )
                ).toLocaleString()}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Expected COD
              </Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.kpiValue, { color: "#10B981" }]}>
                NPR{" "}
                {(
                  codSummary?.totalHandedOver ??
                  codReconciliation.reduce(
                    (s, i) => s + (i.totalHandedOver || 0),
                    0,
                  )
                ).toLocaleString()}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Handed Over
              </Text>
            </View>

            <View
              style={[
                styles.kpiCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Text style={[styles.kpiValue, { color: "#EF4444" }]}>
                NPR{" "}
                {(
                  codSummary?.totalOutstanding ??
                  codReconciliation.reduce(
                    (s, i) => s + (i.outstanding || 0),
                    0,
                  )
                ).toLocaleString()}
              </Text>
              <Text style={[styles.kpiLabel, { color: textSecondary }]}>
                Outstanding
              </Text>
            </View>
          </View>

          {/* Notice Banner */}
          <View
            style={[
              styles.codBanner,
              {
                backgroundColor: isDark ? "#1C242B" : "#FEF3C7",
                borderColor: "#F59E0B",
              },
            ]}
          >
            <Feather name="shield" size={scale(14)} color="#F59E0B" />
            <Text
              style={[
                styles.codBannerText,
                { color: isDark ? "#FCD34D" : "#92400E" },
              ]}
            >
              COD Formula: Expected COD − Verified Submitted Collections =
              Outstanding Cash. Mismatches are audit-logged.
            </Text>
          </View>

          {/* COD Search Box */}
          <View
            style={[
              styles.codSearchBar,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <Feather name="search" size={scale(15)} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Filter by rider name, store, or phone..."
              placeholderTextColor={textSecondary}
              value={codSearch}
              onChangeText={setCodSearch}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredCodList}
            keyExtractor={(item, idx) =>
              item._id || item.deliveryBoyId || String(idx)
            }
            renderItem={renderCodItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingHorizontal: isTablet ? scale(20) : scale(16) },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={codRefreshing}
                onRefresh={onRefresh}
                tintColor="#10B981"
              />
            }
            ListEmptyComponent={
              codLoading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: textSecondary, marginTop: scale(10) },
                    ]}
                  >
                    Calculating COD balances...
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={scale(48)}
                    color="#64748B"
                  />
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
      <Modal visible={!!disputeRider} transparent animationType="fade">
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
                  Report Cash Mismatch
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  Flag COD collection discrepancy for review
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDisputeRider(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {disputeRider && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: scale(430) }}
              >
                <View
                  style={[
                    styles.disputeDetailsBox,
                    { backgroundColor: bg, borderColor: border },
                  ]}
                >
                  <Text style={[styles.disputeFieldLabel, { color: textSecondary }]}>
                    Delivery Partner
                  </Text>
                  <Text
                    style={[styles.disputeFieldValue, { color: textPrimary }]}
                  >
                    {disputeRider.deliveryBoyName ||
                      disputeRider.deliveryBoy?.fullName ||
                      disputeRider.deliveryBoy?.name ||
                      "Delivery Partner"}
                  </Text>

                  <Text
                    style={[
                      styles.disputeFieldLabel,
                      { color: textSecondary, marginTop: scale(6) },
                    ]}
                  >
                    Store
                  </Text>
                  <Text
                    style={[styles.disputeFieldValue, { color: textPrimary }]}
                  >
                    {disputeRider.vendorName || "Store"}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    { color: textPrimary, marginTop: scale(12) },
                  ]}
                >
                  Disputed Amount (NPR):
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
                  value={disputeAmount}
                  onChangeText={setDisputeAmount}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    { color: textPrimary, marginTop: scale(10) },
                  ]}
                >
                  Reason:
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
                  placeholder="e.g., Short cash handed over at store hub..."
                  placeholderTextColor={textSecondary}
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    { color: textPrimary, marginTop: scale(10) },
                  ]}
                >
                  Audit Notes:
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
                  placeholder="Order numbers, store manager remarks, or cash slip reference..."
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
                    <Text
                      style={[
                        styles.modalCancelText,
                        { color: textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalSaveBtn,
                      { backgroundColor: "#EF4444" },
                    ]}
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
              </ScrollView>
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
    marginTop: scale(10),
    borderRadius: scale(12),
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
    borderRadius: scale(9),
  },
  segmentBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  segmentText: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
  },

  // KPI Overview Bar
  kpiRow: {
    flexDirection: "row",
    gap: scale(8),
    marginHorizontal: scale(16),
    marginTop: scale(10),
  },
  kpiCard: {
    flex: 1,
    paddingVertical: scale(8),
    paddingHorizontal: scale(6),
    borderRadius: scale(10),
    borderWidth: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: moderateScale(13),
    fontWeight: "900",
  },
  kpiLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "600",
    marginTop: scale(2),
  },

  // Controls & Search
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(10),
    gap: scale(8),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    height: scale(38),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(8),
  },
  codSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(8),
    paddingHorizontal: scale(10),
    height: scale(38),
    borderRadius: scale(10),
    borderWidth: 1,
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

  chipsRow: {
    flexDirection: "row",
    gap: scale(8),
    paddingHorizontal: scale(16),
    marginTop: scale(8),
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
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#94A3B8",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingVertical: scale(10),
    gap: scale(10),
  },

  // ─── FLEET LIST CARD ───
  riderCard: {
    borderRadius: scale(14),
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
  avatarWrapSmall: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  riderName: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
  },
  contactText: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(3),
    flexWrap: "wrap",
    gap: scale(4),
  },
  metaDivider: {
    color: "#94A3B8",
    fontSize: moderateScale(10),
  },
  vendorText: {
    fontSize: moderateScale(11),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  statusBadgeCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  statusBadgeTextCompact: {
    fontSize: moderateScale(9),
    fontWeight: "800",
  },
  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
    marginTop: scale(10),
  },
  activeOrderText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(10),
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  infoCol: {
    alignItems: "flex-start",
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(9.5),
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
    fontSize: moderateScale(10.5),
  },

  // ─── FLEET GRID CARD ───
  gridColumnWrapper: {
    gap: scale(10),
  },
  riderGridCard: {
    flex: 1,
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(12),
    marginBottom: scale(8),
    justifyContent: "space-between",
  },
  gridHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: scale(8),
  },
  gridMetricLabel: {
    fontSize: moderateScale(9),
    fontWeight: "700",
  },
  gridMetricVal: {
    fontSize: moderateScale(12),
    fontWeight: "900",
    marginTop: scale(1),
  },
  gridFooterRow: {
    borderTopWidth: 1,
    paddingTop: scale(6),
  },
  gridVehicleText: {
    fontSize: moderateScale(10),
  },

  // ─── COD CARD ───
  codBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(8),
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
    borderRadius: scale(14),
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
    borderRadius: scale(10),
    borderWidth: 1,
  },
  ledgerCol: {
    alignItems: "flex-start",
    flex: 1,
  },
  ledgerVal: {
    fontSize: moderateScale(13),
    fontWeight: "900",
    marginTop: scale(2),
  },
  subCountText: {
    fontSize: moderateScale(9.5),
    marginTop: scale(1),
  },
  discrepancyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
    marginTop: scale(8),
  },
  discrepancyText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
  },
  codFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 0.8,
    gap: scale(8),
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
    paddingHorizontal: scale(9),
    paddingVertical: scale(5),
    gap: scale(4),
  },
  disputeBtnText: {
    color: "#EF4444",
    fontSize: moderateScale(10),
    fontWeight: "800",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(10),
  },
  emptyText: {
    fontSize: moderateScale(12.5),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalContent: {
    width: "100%",
    maxWidth: scale(460),
    borderRadius: scale(18),
    borderWidth: 1,
    padding: scale(18),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(12),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "900",
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  disputeDetailsBox: {
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(10),
    marginBottom: scale(6),
  },
  disputeFieldLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  disputeFieldValue: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(1),
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    marginBottom: scale(4),
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(9),
    fontSize: moderateScale(11.5),
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: moderateScale(11.5),
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
