import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

export default function AdminAdminsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);

  // New admin form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    canManageVendors: true,
    canEditProducts: true,
    canManageTickets: true,
    canViewOrders: true,
    canSendNotifications: true,
    canViewAnalytics: true,
  });
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

  const toggleVendorSelection = (vId: string) => {
    if (selectedVendorIds.includes(vId)) {
      setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vId));
    } else {
      setSelectedVendorIds([...selectedVendorIds, vId]);
    }
  };

  const handleCreateAdmin = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Name, email, and password are required.");
      return;
    }

    setSubmitting(true);
    try {
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

      Alert.alert("Success", `Admin account created for ${name}`);
      setCreateModalVisible(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSelectedVendorIds([]);
      loadData();
    } catch (err: any) {
      Alert.alert("Failed", err?.message || "Could not create admin account");
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
          text: "Confirm",
          onPress: async () => {
            await dispatch(
              updateAdminAccount({
                id: admin._id,
                payload: { isActive: targetStatus },
              })
            );
            loadData();
          },
        },
      ]
    );
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (!isSuperAdmin) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: bg }]}>
        <Feather name="lock" size={scale(48)} color="#EF4444" />
        <Text style={[styles.deniedTitle, { color: textPrimary }]}>Restricted Access</Text>
        <Text style={[styles.deniedSub, { color: textSecondary }]}>
          Only Superadmin can manage staff accounts and vendor assignments.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Staff Admins" subtitle="Access & Vendor Scoping" showBack />
      {/* Top Action Bar */}
      <View style={[styles.topBar, { backgroundColor: cardBg, borderColor: border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Staff Admin Accounts</Text>
          <Text style={[styles.headerSub, { color: textSecondary }]}>
            Assign vendors and control scoped staff operational permissions
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={scale(16)} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Create Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Admin List */}
      <FlatList
        data={admins}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} colors={["#0284C7"]} />
        }
        renderItem={({ item }) => (
          <View style={[styles.adminCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || "A"}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={[styles.adminName, { color: textPrimary }]}>{item.name}</Text>
                <Text style={[styles.adminEmail, { color: textSecondary }]}>{item.email}</Text>
              </View>
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: item.isActive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)" },
                ]}
              >
                <Text style={{ fontSize: moderateScale(10), fontWeight: "800", color: item.isActive ? "#10B981" : "#EF4444" }}>
                  {item.isActive ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: border }]} />

            {/* Middle Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Assigned Stores</Text>
                <Text style={[styles.statVal, { color: textPrimary }]}>
                  {item.assignedVendorsCount || 0} Stores
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Open Tickets</Text>
                <Text style={[styles.statVal, { color: item.openTickets > 0 ? "#F59E0B" : "#10B981" }]}>
                  {item.openTickets || 0} Open
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Account Status</Text>
                <TouchableOpacity onPress={() => handleToggleAdminStatus(item)}>
                  <Text style={{ fontSize: moderateScale(11), fontWeight: "700", color: item.isActive ? "#EF4444" : "#10B981" }}>
                    {item.isActive ? "Deactivate" : "Activate"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Assigned Stores Tags */}
            {item.assignedVendors?.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={[styles.tagsLabel, { color: textSecondary }]}>Assigned Stores:</Text>
                <View style={styles.tagsRow}>
                  {item.assignedVendors.map((v: any) => (
                    <View key={v._id || v} style={[styles.storeTag, { backgroundColor: isDark ? "#1E252E" : "#F1F5F9" }]}>
                      <Text style={[styles.storeTagText, { color: textPrimary }]}>
                        {v.businessDetails?.businessName || "Store"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      />

      {/* ── Create Admin Modal ─────────────────────────────────────────── */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Create Staff Admin</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={scale(24)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(20) }}>
              <Text style={[styles.inputLabel, { color: textPrimary }]}>Full Name *</Text>
              <TextInput
                style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                placeholder="Staff Member Name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.inputLabel, { color: textPrimary }]}>Email Address *</Text>
              <TextInput
                style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                placeholder="admin@bhansamart.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: textPrimary }]}>Password *</Text>
              <TextInput
                style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                placeholder="Initial secure password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: textPrimary }]}>Phone Number</Text>
              <TextInput
                style={[styles.modalInput, { color: textPrimary, borderColor: border }]}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              {/* Vendor Assignment Picker */}
              <Text style={[styles.sectionHeading, { color: textPrimary }]}>
                Assign Vendor Stores ({selectedVendorIds.length} Selected)
              </Text>
              <Text style={[styles.sectionSub, { color: textSecondary }]}>
                Admin will only have access to manage the stores selected below:
              </Text>
              <View style={styles.vendorChecklist}>
                {vendors.map((v) => {
                  const isSelected = selectedVendorIds.includes(v._id);
                  return (
                    <TouchableOpacity
                      key={v._id}
                      style={[
                        styles.checkItem,
                        isSelected && styles.checkItemActive,
                        isDark && !isSelected && { backgroundColor: "#1E252E" },
                      ]}
                      onPress={() => toggleVendorSelection(v._id)}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={scale(18)}
                        color={isSelected ? "#0284C7" : "#94A3B8"}
                      />
                      <Text style={[styles.checkLabel, { color: textPrimary }]}>
                        {v.businessDetails?.businessName || "Unnamed Store"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateAdmin}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create & Provision Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: scale(20),
  },
  deniedTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginTop: scale(12),
  },
  deniedSub: {
    fontSize: moderateScale(13),
    marginTop: scale(4),
    textAlign: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(14),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: moderateScale(15),
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
  listContent: {
    padding: scale(14),
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
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  adminName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  adminEmail: {
    fontSize: moderateScale(11),
  },
  activeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scale(12),
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginTop: scale(2),
  },
  tagsContainer: {
    marginTop: scale(10),
  },
  tagsLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginBottom: scale(4),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
  },
  storeTag: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  storeTagText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    borderWidth: 1,
    padding: scale(20),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(16),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: scale(42),
    fontSize: moderateScale(13),
  },
  sectionHeading: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginTop: scale(16),
  },
  sectionSub: {
    fontSize: moderateScale(11),
    marginBottom: scale(8),
  },
  vendorChecklist: {
    gap: scale(6),
    marginBottom: scale(16),
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    padding: scale(10),
    borderRadius: scale(8),
    backgroundColor: "#F8FAFC",
  },
  checkItemActive: {
    backgroundColor: "#E0F2FE",
  },
  checkLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: scale(10),
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
