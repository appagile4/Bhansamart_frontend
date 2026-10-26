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
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import {
  fetchBroadcastPermissionsApi,
  fetchBroadcastEligibleVendorsApi,
  fetchBroadcastRecipientPreviewApi,
  sendVendorBroadcastApi,
  fetchBroadcastHistoryApi,
  BroadcastPermissionsData,
} from "@/store/services/adminService";

type TargetType = "ASSIGNED_VENDORS" | "SPECIFIC_VENDORS" | "ALL_VENDORS";
type NotifType = "ANNOUNCEMENT" | "GENERAL" | "IMPORTANT_NOTICE" | "ORDER_UPDATE" | "PROMOTION";

export default function StaffAdminBroadcastNotificationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  // Tab State: "compose" | "history"
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Permissions State
  const [permissions, setPermissions] = useState<BroadcastPermissionsData | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Form States
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("ASSIGNED_VENDORS");
  const [notificationType, setNotificationType] = useState<NotifType>("ANNOUNCEMENT");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Recipient Preview
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Specific Vendors Modal
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");

  // Load Permissions on Mount
  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const res = await fetchBroadcastPermissionsApi();
      if (res?.data) {
        setPermissions(res.data);
        // Default targetType to first authorized option
        if (res.data.isSuperAdmin || res.data.canBroadcastToAssignedVendors) {
          setTargetType("ASSIGNED_VENDORS");
        } else if (res.data.canBroadcastToSpecificVendors) {
          setTargetType("SPECIFIC_VENDORS");
        } else if (res.data.canBroadcastToAllVendors) {
          setTargetType("ALL_VENDORS");
        }
      }
    } catch (err: any) {
      console.error("[Broadcast] Failed to load permissions:", err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // Recipient Count Preview
  const updateRecipientPreview = async () => {
    if (!permissions) return;
    try {
      setPreviewLoading(true);
      const res = await fetchBroadcastRecipientPreviewApi({
        targetType,
        vendorIds: targetType === "SPECIFIC_VENDORS" ? selectedVendorIds : undefined,
      });
      if (res?.data?.recipientCount !== undefined) {
        setPreviewCount(res.data.recipientCount);
      }
    } catch (err) {
      // Non-blocking preview error
      setPreviewCount(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "compose" && permissions) {
      updateRecipientPreview();
    }
  }, [targetType, selectedVendorIds, activeTab, permissions]);

  // Load Available Vendors for Specific Selection
  const loadVendorsForSelection = async () => {
    try {
      setVendorsLoading(true);
      const res = await fetchBroadcastEligibleVendorsApi({
        search: vendorSearch.trim() || undefined,
        limit: 100,
      });
      if (res?.data?.vendors) {
        setAvailableVendors(res.data.vendors);
      }
    } catch (err) {
      console.warn("[Broadcast] Failed to load eligible vendors", err);
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    if (vendorModalVisible) {
      loadVendorsForSelection();
    }
  }, [vendorModalVisible, vendorSearch]);

  // Load History
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetchBroadcastHistoryApi({
        targetType: historyFilter !== "ALL" ? historyFilter : undefined,
        search: historySearch.trim() || undefined,
        limit: 50,
      });
      if (res?.data?.broadcasts) {
        setHistoryList(res.data.broadcasts);
      }
    } catch (err) {
      console.warn("[Broadcast] Failed to load history", err);
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, historyFilter, historySearch]);

  // Handle Send Confirmation
  const handlePreSendCheck = () => {
    if (!title.trim()) {
      Alert.alert("Required Field", "Please enter a notification title.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Required Field", "Please enter the notification message body.");
      return;
    }
    if (targetType === "SPECIFIC_VENDORS" && selectedVendorIds.length === 0) {
      Alert.alert("Recipient Required", "Please select at least one vendor to target.");
      return;
    }
    setConfirmModalVisible(true);
  };

  const handleExecuteSend = async () => {
    try {
      setSubmitting(true);
      const res = await sendVendorBroadcastApi({
        title: title.trim(),
        message: message.trim(),
        targetType,
        notificationType,
        imageUrl: imageUrl.trim() || undefined,
        vendorIds: targetType === "SPECIFIC_VENDORS" ? selectedVendorIds : undefined,
        idempotencyKey: `broadcast_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      });

      setConfirmModalVisible(false);
      Alert.alert(
        "Broadcast Dispatched!",
        res?.message || "Notification was successfully sent to the selected vendor audience."
      );

      // Reset form
      setTitle("");
      setMessage("");
      setImageUrl("");
      setSelectedVendorIds([]);
      setActiveTab("history");
    } catch (err: any) {
      Alert.alert(
        "Broadcast Failed",
        err?.message || "An error occurred while sending the broadcast."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const hasAnyPermission =
    permissions?.isSuperAdmin || permissions?.hasAnyBroadcastPermission;

  const NOTIF_TYPES: { id: NotifType; label: string; icon: string; color: string }[] = [
    { id: "ANNOUNCEMENT", label: "Announcement", icon: "bullhorn", color: "#0284C7" },
    { id: "GENERAL", label: "General", icon: "information", color: "#64748B" },
    { id: "IMPORTANT_NOTICE", label: "Important Notice", icon: "alert-circle", color: "#DC2626" },
    { id: "ORDER_UPDATE", label: "Order Update", icon: "cart", color: "#10B981" },
    { id: "PROMOTION", label: "Promotion", icon: "tag", color: "#7C3AED" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Vendor Broadcast"
        subtitle="Push Store Notifications"
        showBack
        onRefresh={() => {
          loadPermissions();
          if (activeTab === "history") loadHistory();
        }}
      />

      {/* Top Nav Switcher: Compose vs History */}
      <View style={[styles.topTabsBar, { backgroundColor: cardBg, borderColor: border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("compose")}
          style={[
            styles.topTabBtn,
            activeTab === "compose" && {
              borderBottomColor: "#0284C7",
              borderBottomWidth: 2,
            },
          ]}
        >
          <Feather
            name="send"
            size={scale(15)}
            color={activeTab === "compose" ? "#0284C7" : textSecondary}
          />
          <Text
            style={[
              styles.topTabText,
              { color: activeTab === "compose" ? "#0284C7" : textSecondary },
            ]}
          >
            New Broadcast
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          style={[
            styles.topTabBtn,
            activeTab === "history" && {
              borderBottomColor: "#0284C7",
              borderBottomWidth: 2,
            },
          ]}
        >
          <Feather
            name="clock"
            size={scale(15)}
            color={activeTab === "history" ? "#0284C7" : textSecondary}
          />
          <Text
            style={[
              styles.topTabText,
              { color: activeTab === "history" ? "#0284C7" : textSecondary },
            ]}
          >
            Broadcast History
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── COMPOSE TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "compose" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {/* Permission Gate Warning */}
          {permissionsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0284C7" size="small" />
              <Text style={[styles.loadingText, { color: textSecondary }]}>
                Verifying broadcast permissions...
              </Text>
            </View>
          ) : !hasAnyPermission ? (
            <View style={[styles.unauthorizedBox, { backgroundColor: cardBg, borderColor: "#EF4444" }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={scale(32)} color="#EF4444" />
              <Text style={[styles.unauthorizedTitle, { color: textPrimary }]}>
                No Broadcast Permission
              </Text>
              <Text style={[styles.unauthorizedDesc, { color: textSecondary }]}>
                You do not have authorization to send vendor broadcast notifications. Please contact your Super Administrator to configure your notification targeting scope.
              </Text>
            </View>
          ) : (
            <>
              {/* 1. Target Audience Options */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  1. Target Audience Scope
                </Text>
                <Text style={[styles.fieldHint, { color: textSecondary }]}>
                  Options configured and authorized by Super Admin:
                </Text>

                <View style={styles.targetOptionsRow}>
                  {/* Assigned Vendors */}
                  {(permissions?.isSuperAdmin || permissions?.canBroadcastToAssignedVendors) && (
                    <TouchableOpacity
                      onPress={() => setTargetType("ASSIGNED_VENDORS")}
                      style={[
                        styles.targetPill,
                        targetType === "ASSIGNED_VENDORS" && {
                          backgroundColor: "#0284C7",
                          borderColor: "#0284C7",
                        },
                        { borderColor: border },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="storefront-check-outline"
                        size={scale(16)}
                        color={targetType === "ASSIGNED_VENDORS" ? "#FFFFFF" : textSecondary}
                      />
                      <Text
                        style={[
                          styles.targetPillText,
                          {
                            color: targetType === "ASSIGNED_VENDORS" ? "#FFFFFF" : textPrimary,
                            fontWeight: targetType === "ASSIGNED_VENDORS" ? "700" : "500",
                          },
                        ]}
                      >
                        Assigned Stores
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Specific Vendors */}
                  {(permissions?.isSuperAdmin || permissions?.canBroadcastToSpecificVendors) && (
                    <TouchableOpacity
                      onPress={() => {
                        setTargetType("SPECIFIC_VENDORS");
                        if (selectedVendorIds.length === 0) {
                          setVendorModalVisible(true);
                        }
                      }}
                      style={[
                        styles.targetPill,
                        targetType === "SPECIFIC_VENDORS" && {
                          backgroundColor: "#10B981",
                          borderColor: "#10B981",
                        },
                        { borderColor: border },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-multiple-check-outline"
                        size={scale(16)}
                        color={targetType === "SPECIFIC_VENDORS" ? "#FFFFFF" : textSecondary}
                      />
                      <Text
                        style={[
                          styles.targetPillText,
                          {
                            color: targetType === "SPECIFIC_VENDORS" ? "#FFFFFF" : textPrimary,
                            fontWeight: targetType === "SPECIFIC_VENDORS" ? "700" : "500",
                          },
                        ]}
                      >
                        Specific Stores ({selectedVendorIds.length})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* All Vendors */}
                  {(permissions?.isSuperAdmin || permissions?.canBroadcastToAllVendors) && (
                    <TouchableOpacity
                      onPress={() => setTargetType("ALL_VENDORS")}
                      style={[
                        styles.targetPill,
                        targetType === "ALL_VENDORS" && {
                          backgroundColor: "#EC4899",
                          borderColor: "#EC4899",
                        },
                        { borderColor: border },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="bullhorn-outline"
                        size={scale(16)}
                        color={targetType === "ALL_VENDORS" ? "#FFFFFF" : textSecondary}
                      />
                      <Text
                        style={[
                          styles.targetPillText,
                          {
                            color: targetType === "ALL_VENDORS" ? "#FFFFFF" : textPrimary,
                            fontWeight: targetType === "ALL_VENDORS" ? "700" : "500",
                          },
                        ]}
                      >
                        All Vendors
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Specific Vendors Selector Button & Chips */}
                {targetType === "SPECIFIC_VENDORS" && (
                  <View style={styles.specificPickerBox}>
                    <TouchableOpacity
                      onPress={() => setVendorModalVisible(true)}
                      style={[styles.chooseStoresBtn, { borderColor: "#10B981" }]}
                    >
                      <Feather name="plus-circle" size={scale(14)} color="#10B981" />
                      <Text style={styles.chooseStoresBtnText}>
                        {selectedVendorIds.length === 0
                          ? "Select Specific Stores"
                          : `Change Selected Stores (${selectedVendorIds.length})`}
                      </Text>
                    </TouchableOpacity>

                    {selectedVendorIds.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSelectedVendorIds([])}
                        style={styles.clearStoresBtn}
                      >
                        <Text style={styles.clearStoresBtnText}>Clear Selection</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Live Estimated Recipient Counter Banner */}
                <View
                  style={[
                    styles.recipientBanner,
                    {
                      backgroundColor: isDark ? "rgba(2, 132, 199, 0.1)" : "#F0F9FF",
                      borderColor: "#BAE6FD",
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="account-group-outline" size={scale(20)} color="#0284C7" />
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.recipientTitle, { color: textPrimary }]}>
                      Estimated Audience:{" "}
                      <Text style={{ color: "#0284C7", fontWeight: "700" }}>
                        {previewLoading
                          ? "Calculating..."
                          : previewCount !== null
                          ? `${previewCount} active vendor store(s)`
                          : "Resolving..."}
                      </Text>
                    </Text>
                    <Text style={[styles.recipientDesc, { color: textSecondary }]}>
                      {targetType === "ASSIGNED_VENDORS"
                        ? "Delivers strictly to verified stores assigned to your staff account."
                        : targetType === "SPECIFIC_VENDORS"
                        ? `Delivers only to the ${selectedVendorIds.length} individually selected stores.`
                        : "Broadcasts to all approved and active stores across the platform."}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 2. Notification Type */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  2. Notification Type
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                  {NOTIF_TYPES.map((t) => {
                    const isSelected = notificationType === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setNotificationType(t.id)}
                        style={[
                          styles.typePill,
                          isSelected && { backgroundColor: t.color, borderColor: t.color },
                          { borderColor: border },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={t.icon as any}
                          size={scale(14)}
                          color={isSelected ? "#FFFFFF" : t.color}
                        />
                        <Text
                          style={[
                            styles.typePillText,
                            {
                              color: isSelected ? "#FFFFFF" : textPrimary,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 3. Title & Content Form */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.labelWithCounter}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    3. Notification Title *
                  </Text>
                  <Text style={[styles.counterText, { color: textSecondary }]}>
                    {title.length}/150
                  </Text>
                </View>

                <TextInput
                  placeholder="e.g., Important Store Operation Update"
                  placeholderTextColor={textSecondary}
                  value={title}
                  onChangeText={(val) => setTitle(val.slice(0, 150))}
                  style={[styles.input, { color: textPrimary, borderColor: border }]}
                />

                <View style={[styles.labelWithCounter, { marginTop: moderateScale(14) }]}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    4. Message Body *
                  </Text>
                  <Text style={[styles.counterText, { color: textSecondary }]}>
                    {message.length}/2000
                  </Text>
                </View>

                <TextInput
                  placeholder="Type the announcement or notice message for vendors..."
                  placeholderTextColor={textSecondary}
                  value={message}
                  onChangeText={(val) => setMessage(val.slice(0, 2000))}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={[styles.textArea, { color: textPrimary, borderColor: border }]}
                />

                {/* Optional Image */}
                <Text style={[styles.fieldLabel, { color: textPrimary, marginTop: moderateScale(14) }]}>
                  5. Optional Banner Image URL
                </Text>
                <TextInput
                  placeholder="https://... (Optional banner image for notice)"
                  placeholderTextColor={textSecondary}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  style={[styles.input, { color: textPrimary, borderColor: border }]}
                />
              </View>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handlePreSendCheck}
                style={[styles.sendBtn, (!title.trim() || !message.trim()) && { opacity: 0.6 }]}
                disabled={!title.trim() || !message.trim()}
                activeOpacity={0.8}
              >
                <Feather name="send" size={scale(18)} color="#FFFFFF" />
                <Text style={styles.sendBtnText}>Preview & Dispatch Broadcast</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <View style={styles.historyContainer}>
          {/* Search & Audience Filters */}
          <View style={[styles.searchFilterBox, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.historySearchRow}>
              <Feather name="search" size={scale(16)} color={textSecondary} />
              <TextInput
                placeholder="Search history by title or sender..."
                placeholderTextColor={textSecondary}
                value={historySearch}
                onChangeText={setHistorySearch}
                style={[styles.historySearchInput, { color: textPrimary }]}
              />
              {historySearch.length > 0 && (
                <TouchableOpacity onPress={() => setHistorySearch("")}>
                  <Ionicons name="close-circle" size={scale(16)} color={textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Audience Filter Pills */}
            <View style={styles.audiencePillsRow}>
              {[
                { id: "ALL", label: "All Audiences" },
                { id: "ASSIGNED_VENDORS", label: "Assigned" },
                { id: "SPECIFIC_VENDORS", label: "Specific" },
                { id: "ALL_VENDORS", label: "Platform-Wide" },
              ].map((f) => {
                const isSelected = historyFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setHistoryFilter(f.id)}
                    style={[
                      styles.historyFilterPill,
                      isSelected && { backgroundColor: "#0284C7", borderColor: "#0284C7" },
                      { borderColor: border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyFilterPillText,
                        { color: isSelected ? "#FFFFFF" : textSecondary },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {historyLoading && !historyRefreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0284C7" size="small" />
              <Text style={[styles.loadingText, { color: textSecondary }]}>
                Loading broadcast logs...
              </Text>
            </View>
          ) : (
            <FlatList
              data={historyList}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.historyListContent}
              refreshControl={
                <RefreshControl
                  refreshing={historyRefreshing}
                  onRefresh={() => {
                    setHistoryRefreshing(true);
                    loadHistory();
                  }}
                  tintColor="#0284C7"
                />
              }
              renderItem={({ item }) => {
                const targetColor =
                  item.targetType === "ALL_VENDORS"
                    ? "#EC4899"
                    : item.targetType === "SPECIFIC_VENDORS"
                    ? "#10B981"
                    : "#0284C7";

                const dateStr = item.sentAt
                  ? new Date(item.sentAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Recently";

                return (
                  <View style={[styles.historyCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.historyCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyTitle, { color: textPrimary }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.historyDate, { color: textSecondary }]}>
                          Sent by {item.senderName || "Admin"} • {dateStr}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                        <Feather name="check-circle" size={scale(11)} color="#10B981" />
                        <Text style={[styles.statusBadgeText, { color: "#10B981" }]}>
                          {item.status || "SENT"}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.historyMessage, { color: textSecondary }]} numberOfLines={2}>
                      {item.message}
                    </Text>

                    <View style={styles.historyFooter}>
                      <View style={[styles.badgePill, { backgroundColor: `${targetColor}15`, borderColor: targetColor }]}>
                        <Text style={[styles.badgeText, { color: targetColor }]}>
                          {item.targetType === "ASSIGNED_VENDORS"
                            ? "Assigned Stores"
                            : item.targetType === "SPECIFIC_VENDORS"
                            ? "Specific Stores"
                            : "All Platform Vendors"}
                        </Text>
                      </View>

                      <View style={styles.recipientCountPill}>
                        <Feather name="users" size={scale(12)} color="#0284C7" />
                        <Text style={[styles.recipientCountText, { color: textPrimary }]}>
                          {item.recipientCount || 0} Stores Received
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                  <MaterialCommunityIcons name="bullhorn-outline" size={scale(36)} color={textSecondary} />
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Broadcasts Dispatched</Text>
                  <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                    Past broadcasts sent by you or your team will be recorded here for audit inspection.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* ── SPECIFIC VENDORS SELECTION MODAL ────────────────────────────────────── */}
      <Modal visible={vendorModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalHeaderTitle, { color: textPrimary }]}>
                  Select Specific Vendors
                </Text>
                <Text style={[styles.modalHeaderSub, { color: textSecondary }]}>
                  Choose stores permitted by your scope
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVendorModalVisible(false)}>
                <Ionicons name="close-circle" size={scale(24)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.modalSearchBox, { backgroundColor: isDark ? "#0A0F12" : "#F1F5F9" }]}>
              <Feather name="search" size={scale(16)} color={textSecondary} />
              <TextInput
                placeholder="Search by store or owner name..."
                placeholderTextColor={textSecondary}
                value={vendorSearch}
                onChangeText={setVendorSearch}
                style={[styles.modalSearchInput, { color: textPrimary }]}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickSelectRow}>
              <TouchableOpacity
                onPress={() => setSelectedVendorIds(availableVendors.map((v) => v._id))}
                style={styles.quickSelectBtn}
              >
                <Text style={styles.quickSelectText}>Select All ({availableVendors.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedVendorIds([])}
                style={styles.quickSelectBtn}
              >
                <Text style={styles.quickSelectText}>Deselect All</Text>
              </TouchableOpacity>
            </View>

            {vendorsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#10B981" size="small" />
              </View>
            ) : (
              <FlatList
                data={availableVendors}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 340 }}
                renderItem={({ item }) => {
                  const isChecked = selectedVendorIds.includes(item._id);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (isChecked) {
                          setSelectedVendorIds(selectedVendorIds.filter((id) => id !== item._id));
                        } else {
                          setSelectedVendorIds([...selectedVendorIds, item._id]);
                        }
                      }}
                      style={[
                        styles.vendorSelectRow,
                        { borderBottomColor: border },
                        isChecked && { backgroundColor: isDark ? "#1E293B" : "#F0FDF4" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={scale(20)}
                        color={isChecked ? "#10B981" : textSecondary}
                      />
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <Text style={[styles.vendorSelectName, { color: textPrimary }]}>
                          {item.businessName}
                        </Text>
                        <Text style={[styles.vendorSelectSub, { color: textSecondary }]}>
                          {item.sellerName || "Store Owner"} • {item.sellerPhone || "No Phone"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              onPress={() => setVendorModalVisible(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>
                Done ({selectedVendorIds.length} Selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PRE-SEND CONFIRMATION MODAL ────────────────────────────────────────── */}
      <Modal visible={confirmModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmModalBox, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.confirmHeader}>
              <MaterialCommunityIcons name="send-check" size={scale(28)} color="#0284C7" />
              <Text style={[styles.confirmModalTitle, { color: textPrimary }]}>
                Confirm Vendor Broadcast
              </Text>
              <Text style={[styles.confirmModalSub, { color: textSecondary }]}>
                Please review before dispatching live notifications
              </Text>
            </View>

            <View style={[styles.confirmDetails, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC", borderColor: border }]}>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: textSecondary }]}>Audience:</Text>
                <Text style={[styles.confirmVal, { color: textPrimary }]}>
                  {targetType === "ASSIGNED_VENDORS"
                    ? "Assigned Stores"
                    : targetType === "SPECIFIC_VENDORS"
                    ? `Specific Stores (${selectedVendorIds.length})`
                    : "All Platform Stores"}
                </Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: textSecondary }]}>Estimated Recipients:</Text>
                <Text style={[styles.confirmVal, { color: "#0284C7", fontWeight: "700" }]}>
                  {previewCount !== null ? `${previewCount} Stores` : "Resolving..."}
                </Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: textSecondary }]}>Notification Type:</Text>
                <Text style={[styles.confirmVal, { color: textPrimary }]}>{notificationType}</Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: textSecondary }]}>Title:</Text>
                <Text style={[styles.confirmVal, { color: textPrimary, fontWeight: "600" }]} numberOfLines={1}>
                  {title}
                </Text>
              </View>

              <View style={{ marginTop: moderateScale(6) }}>
                <Text style={[styles.confirmLabel, { color: textSecondary, marginBottom: 2 }]}>
                  Message Preview:
                </Text>
                <Text style={[styles.confirmMessageText, { color: textPrimary }]} numberOfLines={3}>
                  {message}
                </Text>
              </View>
            </View>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                onPress={() => setConfirmModalVisible(false)}
                style={[styles.cancelBtn, { borderColor: border }]}
                disabled={submitting}
              >
                <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExecuteSend}
                style={[styles.confirmSendBtn, submitting && { opacity: 0.7 }]}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmSendBtnText}>Confirm & Send</Text>
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
  topTabsBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  topTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    gap: moderateScale(6),
  },
  topTabText: {
    fontSize: scale(13),
    fontWeight: "600",
  },
  scrollBody: {
    padding: moderateScale(16),
    gap: moderateScale(14),
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: moderateScale(24),
    gap: moderateScale(8),
  },
  loadingText: {
    fontSize: scale(13),
  },
  unauthorizedBox: {
    padding: moderateScale(20),
    borderRadius: scale(12),
    borderWidth: 1,
    alignItems: "center",
    gap: moderateScale(10),
    marginVertical: moderateScale(20),
  },
  unauthorizedTitle: {
    fontSize: scale(16),
    fontWeight: "700",
  },
  unauthorizedDesc: {
    fontSize: scale(13),
    textAlign: "center",
    lineHeight: scale(18),
  },
  card: {
    padding: moderateScale(14),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: scale(13),
    fontWeight: "700",
  },
  fieldHint: {
    fontSize: scale(11),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(10),
  },
  targetOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  targetPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: moderateScale(6),
  },
  targetPillText: {
    fontSize: scale(12),
  },
  specificPickerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(12),
  },
  chooseStoresBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    gap: moderateScale(6),
  },
  chooseStoresBtnText: {
    color: "#10B981",
    fontSize: scale(12),
    fontWeight: "600",
  },
  clearStoresBtn: {
    paddingHorizontal: moderateScale(8),
  },
  clearStoresBtnText: {
    color: "#EF4444",
    fontSize: scale(11),
    fontWeight: "500",
  },
  recipientBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    marginTop: moderateScale(12),
  },
  recipientTitle: {
    fontSize: scale(13),
  },
  recipientDesc: {
    fontSize: scale(11),
    marginTop: moderateScale(2),
  },
  typeRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: moderateScale(4),
  },
  typePillText: {
    fontSize: scale(12),
  },
  labelWithCounter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterText: {
    fontSize: scale(11),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: scale(13),
    marginTop: moderateScale(6),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: scale(13),
    minHeight: scale(100),
    marginTop: moderateScale(6),
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(14),
    borderRadius: scale(10),
    gap: moderateScale(8),
    marginTop: moderateScale(6),
    marginBottom: moderateScale(30),
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "700",
  },
  historyContainer: {
    flex: 1,
  },
  searchFilterBox: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    gap: moderateScale(10),
  },
  historySearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  historySearchInput: {
    flex: 1,
    fontSize: scale(13),
  },
  audiencePillsRow: {
    flexDirection: "row",
    gap: moderateScale(6),
  },
  historyFilterPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  historyFilterPillText: {
    fontSize: scale(11),
    fontWeight: "600",
  },
  historyListContent: {
    padding: moderateScale(16),
    gap: moderateScale(12),
  },
  historyCard: {
    padding: moderateScale(14),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: moderateScale(8),
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  historyTitle: {
    fontSize: scale(14),
    fontWeight: "700",
  },
  historyDate: {
    fontSize: scale(11),
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
    gap: moderateScale(3),
  },
  statusBadgeText: {
    fontSize: scale(10),
    fontWeight: "700",
  },
  historyMessage: {
    fontSize: scale(12),
    lineHeight: scale(16),
  },
  historyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(4),
  },
  badgePill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  badgeText: {
    fontSize: scale(10),
    fontWeight: "700",
  },
  recipientCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  recipientCountText: {
    fontSize: scale(11),
    fontWeight: "600",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: moderateScale(30),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(8),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: scale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: scale(12),
    textAlign: "center",
    lineHeight: scale(17),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    padding: moderateScale(16),
  },
  modalContent: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: moderateScale(16),
    gap: moderateScale(10),
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: scale(16),
    fontWeight: "700",
  },
  modalHeaderSub: {
    fontSize: scale(11),
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    gap: moderateScale(8),
  },
  modalSearchInput: {
    flex: 1,
    fontSize: scale(13),
  },
  quickSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  quickSelectBtn: {
    paddingHorizontal: moderateScale(6),
  },
  quickSelectText: {
    color: "#0284C7",
    fontSize: scale(11),
    fontWeight: "600",
  },
  vendorSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    paddingHorizontal: moderateScale(4),
  },
  vendorSelectName: {
    fontSize: scale(13),
    fontWeight: "600",
  },
  vendorSelectSub: {
    fontSize: scale(11),
    marginTop: 2,
  },
  modalDoneBtn: {
    backgroundColor: "#10B981",
    paddingVertical: moderateScale(12),
    borderRadius: scale(8),
    alignItems: "center",
    marginTop: moderateScale(6),
  },
  modalDoneBtnText: {
    color: "#FFFFFF",
    fontSize: scale(13),
    fontWeight: "700",
  },
  confirmModalBox: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: moderateScale(18),
    gap: moderateScale(14),
  },
  confirmHeader: {
    alignItems: "center",
    gap: moderateScale(4),
  },
  confirmModalTitle: {
    fontSize: scale(17),
    fontWeight: "700",
  },
  confirmModalSub: {
    fontSize: scale(11),
  },
  confirmDetails: {
    padding: moderateScale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: moderateScale(6),
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmLabel: {
    fontSize: scale(12),
  },
  confirmVal: {
    fontSize: scale(12),
    maxWidth: "60%",
    textAlign: "right",
  },
  confirmMessageText: {
    fontSize: scale(12),
    lineHeight: scale(16),
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: moderateScale(10),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: scale(13),
    fontWeight: "600",
  },
  confirmSendBtn: {
    flex: 2,
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(12),
    borderRadius: scale(8),
    alignItems: "center",
  },
  confirmSendBtnText: {
    color: "#FFFFFF",
    fontSize: scale(13),
    fontWeight: "700",
  },
});
