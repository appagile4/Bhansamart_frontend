import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminAdmins,
  createAdminAccount,
  updateAdminAccount,
  fetchAdminVendors,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

interface AdminPermissions {
  canManageVendors: boolean;
  canEditProducts: boolean;
  canManageTickets: boolean;
  canViewOrders: boolean;
  canSendNotifications: boolean;
  canViewAnalytics: boolean;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canManageVendors: true,
  canEditProducts: true,
  canManageTickets: true,
  canViewOrders: true,
  canSendNotifications: true,
  canViewAnalytics: true,
};

export default function AdminAdminsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  // Modal & Selection States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [storeSearch, setStoreSearch] = useState("");

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
  const [submitting, setSubmitting] = useState(false);

  const { admins, vendors, loading } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "superadmin";

  const loadData = () => {
    dispatch(fetchAdminAdmins());
    dispatch(fetchAdminVendors({ limit: 100 }));
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setSelectedVendorIds([]);
    setPermissions(DEFAULT_PERMISSIONS);
    setStoreSearch("");
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (admin: any) => {
    setEditingAdmin(admin);
    setName(admin.name || "");
    setEmail(admin.email || "");
    setPassword("");
    setPhone(admin.phone || "");
    const vendorIds = (admin.assignedVendors || []).map((v: any) => (v?._id ? v._id : v));
    setSelectedVendorIds(vendorIds);
    setPermissions({
      canManageVendors: admin.adminPermissions?.canManageVendors ?? true,
      canEditProducts: admin.adminPermissions?.canEditProducts ?? true,
      canManageTickets: admin.adminPermissions?.canManageTickets ?? true,
      canViewOrders: admin.adminPermissions?.canViewOrders ?? true,
      canSendNotifications: admin.adminPermissions?.canSendNotifications ?? true,
      canViewAnalytics: admin.adminPermissions?.canViewAnalytics ?? true,
    });
    setStoreSearch("");
    setModalVisible(true);
  };

  const toggleVendorSelection = (vId: string) => {
    if (selectedVendorIds.includes(vId)) {
      setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vId));
    } else {
      setSelectedVendorIds([...selectedVendorIds, vId]);
    }
  };

  const handleSelectAllStores = () => {
    setSelectedVendorIds(vendors.map((v) => v._id));
  };

  const handleClearAllStores = () => {
    setSelectedVendorIds([]);
  };

  const handleSaveAdmin = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Staff member name is required.");
      return;
    }

    if (!editingAdmin) {
      if (!email.trim() || !password) {
        Alert.alert("Validation Error", "Email address and initial password are required.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingAdmin) {
        // Update existing admin
        const payload: any = {
          name: name.trim(),
          phone: phone.trim(),
          assignedVendors: selectedVendorIds,
          adminPermissions: permissions,
        };
        if (password.trim()) {
          payload.newPassword = password.trim();
        }

        await dispatch(
          updateAdminAccount({
            id: editingAdmin._id,
            payload,
          })
        ).unwrap();

        Alert.alert("Account Updated", `Staff permissions updated for ${name.trim()}`);
      } else {
        // Create new admin
        await dispatch(
          createAdminAccount({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            phone: phone.trim(),
            assignedVendors: selectedVendorIds,
            adminPermissions: permissions,
          })
        ).unwrap();

        Alert.alert("Account Provisioned", `Staff admin account created for ${name.trim()}`);
      }

      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert(
        "Operation Failed",
        err?.response?.data?.message || err?.message || "Could not save staff admin account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAdminStatus = async (admin: any) => {
    const targetStatus = !admin.isActive;
    Alert.alert(
      "Confirm Status Change",
      `Are you sure you want to ${targetStatus ? "activate" : "deactivate"} ${admin.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: targetStatus ? "Activate" : "Deactivate",
          style: targetStatus ? "default" : "destructive",
          onPress: async () => {
            try {
              await dispatch(
                updateAdminAccount({
                  id: admin._id,
                  payload: { isActive: targetStatus },
                })
              ).unwrap();
              loadData();
            } catch (err: any) {
              Alert.alert(
                "Status Update Failed",
                err?.response?.data?.message || err?.message || "Could not update status."
              );
            }
          },
        },
      ]
    );
  };

  const handleCallPhone = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = admins?.length || 0;
    const active = (admins || []).filter((a) => a.isActive).length;
    const inactive = total - active;
    const totalStores = (admins || []).reduce(
      (sum, a) => sum + (a.assignedVendors?.length || a.assignedVendorsCount || 0),
      0
    );
    const totalTickets = (admins || []).reduce((sum, a) => sum + (a.openTickets || 0), 0);
    return { total, active, inactive, totalStores, totalTickets };
  }, [admins]);

  // Filtered Admins List
  const filteredAdmins = useMemo(() => {
    return (admins || []).filter((admin) => {
      // Status filter
      if (statusFilter === "active" && !admin.isActive) return false;
      if (statusFilter === "inactive" && admin.isActive) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = admin.name?.toLowerCase().includes(query);
        const matchesEmail = admin.email?.toLowerCase().includes(query);
        const matchesPhone = admin.phone?.toLowerCase().includes(query);
        const matchesStores = (admin.assignedVendors || []).some((v: any) =>
          (v.businessDetails?.businessName || "").toLowerCase().includes(query)
        );
        return matchesName || matchesEmail || matchesPhone || matchesStores;
      }

      return true;
    });
  }, [admins, statusFilter, searchQuery]);

  // Filtered Vendors for Modal Checklist
  const modalFilteredVendors = useMemo(() => {
    if (!storeSearch.trim()) return vendors;
    const q = storeSearch.trim().toLowerCase();
    return vendors.filter(
      (v) =>
        (v.businessDetails?.businessName || "").toLowerCase().includes(q) ||
        (v.sellerDetails?.sellerName || "").toLowerCase().includes(q)
    );
  }, [vendors, storeSearch]);

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (!isSuperAdmin) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: bg }]}>
        <AdminHeader title="Staff Admins" subtitle="Access & Permissions" showBack />
        <View style={styles.deniedBox}>
          <View style={[styles.deniedIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
            <Feather name="shield-off" size={scale(40)} color="#EF4444" />
          </View>
          <Text style={[styles.deniedTitle, { color: textPrimary }]}>Superadmin Restricted</Text>
          <Text style={[styles.deniedSub, { color: textSecondary }]}>
            Only authorized Superadmins can provision staff accounts, configure operational scope, and assign vendor access.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader
        title="Staff Admins"
        subtitle="Access Scoping & Store Permissions"
        showBack
      />

      {/* Top Action & KPI Bar */}
      <View style={[styles.topBar, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={{ flex: 1, marginRight: scale(10) }}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Staff Management
          </Text>
          <Text style={[styles.headerSub, { color: textSecondary }]}>
            {stats.active} of {stats.total} staff active • {stats.totalStores} stores managed
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
        >
          <Feather name="user-plus" size={scale(15)} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Quick KPI Stat Chips */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
            <Feather name="users" size={scale(15)} color="#0284C7" />
          </View>
          <Text style={[styles.kpiValue, { color: textPrimary }]}>{stats.total}</Text>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>Total Staff</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
            <Feather name="check-circle" size={scale(15)} color="#10B981" />
          </View>
          <Text style={[styles.kpiValue, { color: "#10B981" }]}>{stats.active}</Text>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>Active</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
            <MaterialCommunityIcons name="store-outline" size={scale(16)} color="#F59E0B" />
          </View>
          <Text style={[styles.kpiValue, { color: textPrimary }]}>{stats.totalStores}</Text>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>Stores Scoped</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
            <Feather name="headphones" size={scale(15)} color="#A855F7" />
          </View>
          <Text style={[styles.kpiValue, { color: stats.totalTickets > 0 ? "#F59E0B" : "#10B981" }]}>
            {stats.totalTickets}
          </Text>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>Open Tickets</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: border }]}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Search by name, email, phone or assigned store..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filter Chips */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === "all" && styles.filterChipActive]}
          onPress={() => setStatusFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              statusFilter === "all" && styles.filterChipTextActive,
              { color: statusFilter === "all" ? "#0284C7" : textSecondary },
            ]}
          >
            All Staff ({stats.total})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, statusFilter === "active" && styles.filterChipActive]}
          onPress={() => setStatusFilter("active")}
        >
          <View style={[styles.dotIndicator, { backgroundColor: "#10B981" }]} />
          <Text
            style={[
              styles.filterChipText,
              statusFilter === "active" && styles.filterChipTextActive,
              { color: statusFilter === "active" ? "#10B981" : textSecondary },
            ]}
          >
            Active ({stats.active})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, statusFilter === "inactive" && styles.filterChipActive]}
          onPress={() => setStatusFilter("inactive")}
        >
          <View style={[styles.dotIndicator, { backgroundColor: "#EF4444" }]} />
          <Text
            style={[
              styles.filterChipText,
              statusFilter === "inactive" && styles.filterChipTextActive,
              { color: statusFilter === "inactive" ? "#EF4444" : textSecondary },
            ]}
          >
            Inactive ({stats.inactive})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Staff Admin List */}
      <FlatList
        data={filteredAdmins}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} colors={["#0284C7"]} tintColor="#0284C7" />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "#1E252E" : "#F1F5F9" }]}>
                <Feather name="user-x" size={scale(36)} color="#94A3B8" />
              </View>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Staff Admins Found</Text>
              <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                {searchQuery
                  ? "Try adjusting your search criteria or clear your filters."
                  : "Click 'New Admin' above to create and provision your first staff account."}
              </Text>
              {searchQuery ? (
                <TouchableOpacity
                  style={[styles.emptyActionBtn, { borderColor: border }]}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={{ color: "#0284C7", fontWeight: "700", fontSize: moderateScale(13) }}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const storeCount = item.assignedVendors?.length || item.assignedVendorsCount || 0;
          const openTickets = item.openTickets || 0;
          const perms = item.adminPermissions || {};

          return (
            <View style={[styles.adminCard, { backgroundColor: cardBg, borderColor: border }]}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.avatarBox,
                    {
                      backgroundColor: item.isActive
                        ? isDark
                          ? "#0F3D5E"
                          : "#E0F2FE"
                        : isDark
                        ? "#2A1820"
                        : "#FEE2E2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: item.isActive ? "#0284C7" : "#EF4444" },
                    ]}
                  >
                    {item.name?.[0]?.toUpperCase() || "A"}
                  </Text>
                  <View
                    style={[
                      styles.avatarDot,
                      { backgroundColor: item.isActive ? "#10B981" : "#EF4444" },
                    ]}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: scale(12) }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.adminName, { color: textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>Staff Admin</Text>
                    </View>
                  </View>

                  <Text style={[styles.adminEmail, { color: textSecondary }]} numberOfLines={1}>
                    {item.email}
                  </Text>

                  {item.phone ? (
                    <TouchableOpacity
                      style={styles.phoneRow}
                      onPress={() => handleCallPhone(item.phone)}
                      activeOpacity={0.7}
                    >
                      <Feather name="phone" size={scale(11)} color="#0284C7" />
                      <Text style={[styles.adminPhone, { color: textSecondary }]}>
                        {item.phone}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Status Switch */}
                <View style={styles.statusSwitchWrap}>
                  <Text
                    style={[
                      styles.switchLabel,
                      { color: item.isActive ? "#10B981" : "#94A3B8" },
                    ]}
                  >
                    {item.isActive ? "ACTIVE" : "INACTIVE"}
                  </Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleAdminStatus(item)}
                    trackColor={{ false: "#64748B", true: "#10B981" }}
                    thumbColor="#FFFFFF"
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
              </View>

              {/* Middle Metrics Row */}
              <View style={[styles.statsRow, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                <View style={styles.statCol}>
                  <View style={styles.statHeaderRow}>
                    <MaterialCommunityIcons name="store" size={scale(14)} color="#0284C7" />
                    <Text style={styles.statLabel}>Assigned Scope</Text>
                  </View>
                  <Text style={[styles.statVal, { color: textPrimary }]}>
                    {storeCount} {storeCount === 1 ? "Store" : "Stores"}
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: border }]} />

                <View style={styles.statCol}>
                  <View style={styles.statHeaderRow}>
                    <Feather name="headphones" size={scale(13)} color={openTickets > 0 ? "#F59E0B" : "#10B981"} />
                    <Text style={styles.statLabel}>Support Queue</Text>
                  </View>
                  <Text
                    style={[
                      styles.statVal,
                      { color: openTickets > 0 ? "#F59E0B" : "#10B981" },
                    ]}
                  >
                    {openTickets} Open
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: border }]} />

                <View style={styles.statCol}>
                  <View style={styles.statHeaderRow}>
                    <Feather name="calendar" size={scale(13)} color="#94A3B8" />
                    <Text style={styles.statLabel}>Registered</Text>
                  </View>
                  <Text style={[styles.statVal, { color: textSecondary }]}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Active"}
                  </Text>
                </View>
              </View>

              {/* Assigned Stores Tags */}
              {item.assignedVendors && item.assignedVendors.length > 0 ? (
                <View style={styles.tagsContainer}>
                  <View style={styles.tagsHeader}>
                    <Text style={[styles.tagsLabel, { color: textSecondary }]}>
                      Assigned Stores ({item.assignedVendors.length}):
                    </Text>
                  </View>
                  <View style={styles.tagsRow}>
                    {item.assignedVendors.slice(0, 4).map((v: any, index: number) => {
                      const storeName = v?.businessDetails?.businessName || v?.name || "Store";
                      return (
                        <View
                          key={v?._id || index}
                          style={[
                            styles.storeTag,
                            { backgroundColor: isDark ? "#1E2732" : "#EFF6FF", borderColor: isDark ? "#283545" : "#DBEAFE" },
                          ]}
                        >
                          <MaterialCommunityIcons name="store-outline" size={scale(12)} color="#0284C7" />
                          <Text style={[styles.storeTagText, { color: textPrimary }]} numberOfLines={1}>
                            {storeName}
                          </Text>
                        </View>
                      );
                    })}

                    {item.assignedVendors.length > 4 ? (
                      <View style={[styles.storeTagMore, { backgroundColor: isDark ? "#263238" : "#E2E8F0" }]}>
                        <Text style={[styles.storeTagMoreText, { color: textSecondary }]}>
                          +{item.assignedVendors.length - 4} more
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={styles.noStoresBanner}>
                  <Feather name="alert-circle" size={scale(12)} color="#F59E0B" />
                  <Text style={[styles.noStoresText, { color: textSecondary }]}>
                    No stores assigned. Staff has zero operational data visibility.
                  </Text>
                </View>
              )}

              {/* Permissions Pills */}
              <View style={styles.permsRow}>
                <View
                  style={[
                    styles.permPill,
                    { backgroundColor: perms.canManageVendors !== false ? "rgba(2, 132, 199, 0.1)" : "rgba(148, 163, 184, 0.1)" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={scale(11)}
                    color={perms.canManageVendors !== false ? "#0284C7" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.permPillText,
                      { color: perms.canManageVendors !== false ? "#0284C7" : "#94A3B8" },
                    ]}
                  >
                    Vendors
                  </Text>
                </View>

                <View
                  style={[
                    styles.permPill,
                    { backgroundColor: perms.canEditProducts !== false ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.1)" },
                  ]}
                >
                  <Feather
                    name="package"
                    size={scale(11)}
                    color={perms.canEditProducts !== false ? "#10B981" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.permPillText,
                      { color: perms.canEditProducts !== false ? "#10B981" : "#94A3B8" },
                    ]}
                  >
                    Products
                  </Text>
                </View>

                <View
                  style={[
                    styles.permPill,
                    { backgroundColor: perms.canViewOrders !== false ? "rgba(245, 158, 11, 0.1)" : "rgba(148, 163, 184, 0.1)" },
                  ]}
                >
                  <Feather
                    name="shopping-bag"
                    size={scale(11)}
                    color={perms.canViewOrders !== false ? "#F59E0B" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.permPillText,
                      { color: perms.canViewOrders !== false ? "#F59E0B" : "#94A3B8" },
                    ]}
                  >
                    Orders
                  </Text>
                </View>

                <View
                  style={[
                    styles.permPill,
                    { backgroundColor: perms.canManageTickets !== false ? "rgba(168, 85, 247, 0.1)" : "rgba(148, 163, 184, 0.1)" },
                  ]}
                >
                  <Feather
                    name="headphones"
                    size={scale(11)}
                    color={perms.canManageTickets !== false ? "#A855F7" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.permPillText,
                      { color: perms.canManageTickets !== false ? "#A855F7" : "#94A3B8" },
                    ]}
                  >
                    Tickets
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <View style={[styles.cardFooter, { borderTopColor: border }]}>
                <TouchableOpacity
                  style={[styles.editScopeBtn, { borderColor: "#0284C7" }]}
                  onPress={() => handleOpenEdit(item)}
                  activeOpacity={0.8}
                >
                  <Feather name="sliders" size={scale(13)} color="#0284C7" />
                  <Text style={styles.editScopeBtnText}>Manage Scope & Permissions</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* ── Create / Edit Admin Modal ─────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  {editingAdmin ? "Edit Staff Account" : "Provision Staff Admin"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                  {editingAdmin
                    ? `Updating permissions & store scope for ${editingAdmin.name}`
                    : "Create scoped staff credentials and configure operational roles"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeIconBtn, { backgroundColor: isDark ? "#1E252E" : "#F1F5F9" }]}
              >
                <Ionicons name="close" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: scale(30) }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Details Section */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                  1. Staff Information
                </Text>

                <Text style={[styles.inputLabel, { color: textPrimary }]}>Full Name *</Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border, backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}
                  placeholder="e.g., Rajesh Sharma"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.inputLabel, { color: textPrimary }]}>Email Address *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { color: textPrimary, borderColor: border, backgroundColor: isDark ? "#10161C" : "#F8FAFC" },
                    Boolean(editingAdmin) && { opacity: 0.65 },
                  ]}
                  placeholder="admin.ops@bhansamart.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingAdmin}
                />
                {editingAdmin ? (
                  <Text style={[styles.fieldNote, { color: textSecondary }]}>
                    Email address is tied to authentication and cannot be changed.
                  </Text>
                ) : null}

                <Text style={[styles.inputLabel, { color: textPrimary }]}>
                  {editingAdmin ? "Change Password (leave blank to keep current)" : "Initial Password *"}
                </Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border, backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}
                  placeholder={editingAdmin ? "••••••••" : "Minimum 6 characters"}
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Text style={[styles.inputLabel, { color: textPrimary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.modalInput, { color: textPrimary, borderColor: border, backgroundColor: isDark ? "#10161C" : "#F8FAFC" }]}
                  placeholder="e.g., 9801234567"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Vendor Store Scoping Section */}
              <View style={styles.formSection}>
                <View style={styles.scopeHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                      2. Vendor Store Scoping ({selectedVendorIds.length} Selected)
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Staff can only access orders, tickets, and products from these stores.
                    </Text>
                  </View>
                </View>

                {/* Bulk Actions & Search */}
                <View style={styles.storeFilterRow}>
                  <View style={[styles.storeSearchBar, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                    <Feather name="search" size={scale(13)} color="#94A3B8" />
                    <TextInput
                      style={[styles.storeSearchInput, { color: textPrimary }]}
                      placeholder="Filter stores..."
                      placeholderTextColor="#94A3B8"
                      value={storeSearch}
                      onChangeText={setStoreSearch}
                    />
                    {storeSearch ? (
                      <TouchableOpacity onPress={() => setStoreSearch("")}>
                        <Feather name="x" size={scale(13)} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.bulkBtnGroup}>
                    <TouchableOpacity
                      style={[styles.bulkBtn, { borderColor: "#0284C7" }]}
                      onPress={handleSelectAllStores}
                    >
                      <Text style={[styles.bulkBtnText, { color: "#0284C7" }]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bulkBtn, { borderColor: border }]}
                      onPress={handleClearAllStores}
                    >
                      <Text style={[styles.bulkBtnText, { color: textSecondary }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Store Checklist */}
                <View style={[styles.vendorChecklist, { maxHeight: scale(200) }]}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {modalFilteredVendors.length === 0 ? (
                      <View style={{ padding: scale(14), alignItems: "center" }}>
                        <Text style={{ color: textSecondary, fontSize: moderateScale(12) }}>
                          No stores matched "{storeSearch}"
                        </Text>
                      </View>
                    ) : (
                      modalFilteredVendors.map((v) => {
                        const isSelected = selectedVendorIds.includes(v._id);
                        const storeName = v.businessDetails?.businessName || v.sellerDetails?.sellerName || "Store";
                        const city = v.businessDetails?.city || v.shippingLocations?.city || "";

                        return (
                          <TouchableOpacity
                            key={v._id}
                            style={[
                              styles.checkItem,
                              { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                              isSelected && {
                                backgroundColor: isDark ? "#0A2540" : "#E0F2FE",
                                borderColor: "#0284C7",
                              },
                            ]}
                            onPress={() => toggleVendorSelection(v._id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isSelected ? "checkbox" : "square-outline"}
                              size={scale(18)}
                              color={isSelected ? "#0284C7" : "#94A3B8"}
                            />
                            <View style={{ flex: 1, marginLeft: scale(8) }}>
                              <Text
                                style={[
                                  styles.checkLabel,
                                  { color: textPrimary },
                                  isSelected && { fontWeight: "700", color: "#0284C7" },
                                ]}
                                numberOfLines={1}
                              >
                                {storeName}
                              </Text>
                              {city ? (
                                <Text style={[styles.checkSub, { color: textSecondary }]}>
                                  {city}
                                </Text>
                              ) : null}
                            </View>

                            {v.isStoreOpen ? (
                              <View style={[styles.storeStatusDot, { backgroundColor: "#10B981" }]} />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </View>

              {/* Operational Permissions Section */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                  3. Operational Permissions
                </Text>
                <Text style={[styles.sectionSub, { color: textSecondary }]}>
                  Fine-tune functional access within the staff member's scoped vendors.
                </Text>

                <View style={[styles.permsCard, { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border }]}>
                  {/* Can Manage Vendors */}
                  <View style={styles.permToggleRow}>
                    <View style={styles.permInfo}>
                      <MaterialCommunityIcons name="storefront" size={scale(18)} color="#0284C7" />
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <Text style={[styles.permTitle, { color: textPrimary }]}>
                          Manage Vendor Profiles
                        </Text>
                        <Text style={[styles.permDesc, { color: textSecondary }]}>
                          View business details, contacts & store open hours
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={permissions.canManageVendors}
                      onValueChange={(val) =>
                        setPermissions((prev) => ({ ...prev, canManageVendors: val }))
                      }
                      trackColor={{ false: "#64748B", true: "#0284C7" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.permDivider, { backgroundColor: border }]} />

                  {/* Can Edit Products */}
                  <View style={styles.permToggleRow}>
                    <View style={styles.permInfo}>
                      <Feather name="package" size={scale(18)} color="#10B981" />
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <Text style={[styles.permTitle, { color: textPrimary }]}>
                          Product & Stock Moderation
                        </Text>
                        <Text style={[styles.permDesc, { color: textSecondary }]}>
                          Approve, reject, or edit products for assigned stores
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={permissions.canEditProducts}
                      onValueChange={(val) =>
                        setPermissions((prev) => ({ ...prev, canEditProducts: val }))
                      }
                      trackColor={{ false: "#64748B", true: "#10B981" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.permDivider, { backgroundColor: border }]} />

                  {/* Can View Orders */}
                  <View style={styles.permToggleRow}>
                    <View style={styles.permInfo}>
                      <Feather name="shopping-bag" size={scale(18)} color="#F59E0B" />
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <Text style={[styles.permTitle, { color: textPrimary }]}>
                          Order Fulfillment & Refunds
                        </Text>
                        <Text style={[styles.permDesc, { color: textSecondary }]}>
                          Track deliveries, process vendor returns and refunds
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={permissions.canViewOrders}
                      onValueChange={(val) =>
                        setPermissions((prev) => ({ ...prev, canViewOrders: val }))
                      }
                      trackColor={{ false: "#64748B", true: "#F59E0B" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.permDivider, { backgroundColor: border }]} />

                  {/* Can Manage Tickets */}
                  <View style={styles.permToggleRow}>
                    <View style={styles.permInfo}>
                      <Feather name="headphones" size={scale(18)} color="#A855F7" />
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <Text style={[styles.permTitle, { color: textPrimary }]}>
                          Support & Ticket Resolution
                        </Text>
                        <Text style={[styles.permDesc, { color: textSecondary }]}>
                          Respond to customer complaints & vendor support tickets
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={permissions.canManageTickets}
                      onValueChange={(val) =>
                        setPermissions((prev) => ({ ...prev, canManageTickets: val }))
                      }
                      trackColor={{ false: "#64748B", true: "#A855F7" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.permDivider, { backgroundColor: border }]} />

                  {/* Can View Analytics */}
                  <View style={styles.permToggleRow}>
                    <View style={styles.permInfo}>
                      <Feather name="bar-chart-2" size={scale(18)} color="#06B6D4" />
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <Text style={[styles.permTitle, { color: textPrimary }]}>
                          Scoped Sales & Analytics
                        </Text>
                        <Text style={[styles.permDesc, { color: textSecondary }]}>
                          View sales charts, order volume, and revenue metrics
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={permissions.canViewAnalytics}
                      onValueChange={(val) =>
                        setPermissions((prev) => ({ ...prev, canViewAnalytics: val }))
                      }
                      trackColor={{ false: "#64748B", true: "#06B6D4" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSaveAdmin}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather
                      name={editingAdmin ? "check-circle" : "user-check"}
                      size={scale(16)}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitBtnText}>
                      {editingAdmin ? "Save Changes & Update Scope" : "Create & Provision Account"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  deniedBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: scale(28),
  },
  deniedIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(16),
  },
  deniedTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
  },
  deniedSub: {
    fontSize: moderateScale(13),
    marginTop: scale(8),
    textAlign: "center",
    lineHeight: moderateScale(20),
    maxWidth: scale(320),
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  headerSub: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#0284C7",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  kpiContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(14),
    paddingTop: scale(12),
    gap: scale(8),
  },
  kpiCard: {
    flex: 1,
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(8),
    alignItems: "center",
  },
  kpiIconBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(4),
  },
  kpiValue: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  kpiLabel: {
    fontSize: moderateScale(9),
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: scale(1),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(14),
    marginTop: scale(12),
    paddingHorizontal: scale(12),
    height: scale(40),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontSize: moderateScale(13),
  },
  chipsRow: {
    flexDirection: "row",
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    gap: scale(8),
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "transparent",
    gap: scale(6),
  },
  filterChipActive: {
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  dotIndicator: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  filterChipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  filterChipTextActive: {
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: scale(14),
    gap: scale(12),
    paddingBottom: scale(40),
  },
  adminCard: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(14),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: moderateScale(18),
    fontWeight: "800",
  },
  avatarDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  adminName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    maxWidth: scale(140),
  },
  roleBadge: {
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  roleBadgeText: {
    color: "#0284C7",
    fontSize: moderateScale(9),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  adminEmail: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: scale(2),
  },
  adminPhone: {
    fontSize: moderateScale(11),
  },
  statusSwitchWrap: {
    alignItems: "center",
  },
  switchLabel: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    marginBottom: scale(2),
  },
  statsRow: {
    flexDirection: "row",
    marginTop: scale(12),
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  statLabel: {
    fontSize: moderateScale(9),
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    marginTop: scale(3),
  },
  tagsContainer: {
    marginTop: scale(10),
  },
  tagsHeader: {
    marginBottom: scale(4),
  },
  tagsLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  storeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    borderWidth: 1,
    maxWidth: scale(150),
  },
  storeTagText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  storeTagMore: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  storeTagMoreText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  noStoresBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(10),
    padding: scale(8),
    borderRadius: scale(6),
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  noStoresText: {
    fontSize: moderateScale(11),
    flex: 1,
  },
  permsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginTop: scale(10),
  },
  permPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
  },
  permPillText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  cardFooter: {
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: 1,
  },
  editScopeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  editScopeBtnText: {
    color: "#0284C7",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(40),
    paddingHorizontal: scale(20),
  },
  emptyIconWrap: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(12),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    marginTop: scale(4),
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  emptyActionBtn: {
    marginTop: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    borderWidth: 1,
    padding: scale(18),
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  closeIconBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: scale(8),
  },
  formSection: {
    marginBottom: scale(16),
  },
  sectionHeading: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sectionSub: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
    marginBottom: scale(8),
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginTop: scale(8),
    marginBottom: scale(4),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: scale(40),
    fontSize: moderateScale(13),
  },
  fieldNote: {
    fontSize: moderateScale(10),
    marginTop: scale(2),
  },
  scopeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: scale(8),
  },
  storeSearchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    height: scale(36),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  storeSearchInput: {
    flex: 1,
    marginLeft: scale(6),
    fontSize: moderateScale(12),
  },
  bulkBtnGroup: {
    flexDirection: "row",
    gap: scale(4),
  },
  bulkBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  bulkBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  vendorChecklist: {
    gap: scale(4),
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    marginBottom: scale(4),
  },
  checkLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  checkSub: {
    fontSize: moderateScale(10),
  },
  storeStatusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  permsCard: {
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(10),
  },
  permToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(6),
  },
  permInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: scale(10),
  },
  permTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  permDesc: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  permDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scale(4),
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    marginTop: scale(10),
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
