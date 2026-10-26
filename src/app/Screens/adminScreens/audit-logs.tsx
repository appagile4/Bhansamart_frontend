import React, { useEffect, useState } from "react";
import {
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminAuditLogs } from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function AdminAuditLogsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [search, setSearch] = useState("");
  const [selectedLogModal, setSelectedLogModal] = useState<any | null>(null);

  const { auditLogs, auditLogsTotal, loading } = useAppSelector((state) => state.admin);

  const loadLogs = () => {
    dispatch(fetchAdminAuditLogs({ search: search.trim() || undefined, limit: 50 }));
  };

  useEffect(() => {
    loadLogs();
  }, [dispatch]);

  const onRefresh = () => {
    loadLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("APPROVE")) return "#10B981";
    if (action.includes("REJECT") || action.includes("DELETE") || action.includes("BLOCK")) return "#EF4444";
    if (action.includes("UPDATE") || action.includes("CONFIG")) return "#3B82F6";
    return "#8B5CF6";
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderLogItem = ({ item }: { item: any }) => {
    const actionColor = getActionColor(item.action || "");
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "N/A";

    return (
      <TouchableOpacity
        style={[styles.logCard, { backgroundColor: cardBg, borderColor: border }]}
        onPress={() => setSelectedLogModal(item)}
      >
        <View style={styles.logHeader}>
          <View style={[styles.actionBadge, { backgroundColor: `${actionColor}18` }]}>
            <Text style={[styles.actionBadgeText, { color: actionColor }]}>
              {item.action || "LOGGED_ACTION"}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: textSecondary }]}>{formattedDate}</Text>
        </View>

        <View style={styles.actorRow}>
          <Feather name="shield" size={scale(13)} color="#10B981" />
          <Text style={[styles.actorText, { color: textPrimary }]}>
            {item.actor?.name || item.actorName || "Admin"} ({item.actorRole || item.actor?.role || "staff"})
          </Text>
        </View>

        <View style={[styles.metaRow, { borderTopColor: border }]}>
          <Text style={[styles.targetText, { color: textSecondary }]}>
            Resource: <Text style={{ color: textPrimary, fontWeight: "700" }}>{item.targetResource}</Text>
          </Text>
          {item.targetId ? (
            <Text style={[styles.targetIdText, { color: textSecondary }]}>
              ID: #{item.targetId.slice(-6).toUpperCase()}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Audit Trail" subtitle="Immutable Security Records" showBack />
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: border }]}>
        <Feather name="search" size={scale(16)} color="#94A3B8" />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder="Filter audit records by actor or action..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadLogs}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              dispatch(fetchAdminAuditLogs({ limit: 50 }));
            }}
          >
            <Feather name="x" size={scale(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Log count strip */}
      <View style={styles.countStrip}>
        <Text style={[styles.countText, { color: textSecondary }]}>
          Security Log Entries: <Text style={{ color: "#10B981", fontWeight: "800" }}>{auditLogsTotal}</Text>
        </Text>
      </View>

      {/* Audit List */}
      <FlatList
        data={auditLogs}
        keyExtractor={(item) => item._id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={scale(48)} color="#64748B" />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No audit log records recorded yet.</Text>
            </View>
          ) : undefined
        }
      />

      {/* Log Details Modal */}
      <Modal visible={!!selectedLogModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Audit Log Record</Text>
              <TouchableOpacity onPress={() => setSelectedLogModal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>Action:</Text>
                <Text style={[styles.detailVal, { color: "#10B981" }]}>
                  {selectedLogModal?.action}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>Actor:</Text>
                <Text style={[styles.detailVal, { color: textPrimary }]}>
                  {selectedLogModal?.actor?.name || selectedLogModal?.actorName} (
                  {selectedLogModal?.actorRole || selectedLogModal?.actor?.role})
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>Email:</Text>
                <Text style={[styles.detailVal, { color: textPrimary }]}>
                  {selectedLogModal?.actor?.email || "N/A"}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>Resource:</Text>
                <Text style={[styles.detailVal, { color: textPrimary }]}>
                  {selectedLogModal?.targetResource}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>Target ID:</Text>
                <Text style={[styles.detailVal, { color: textPrimary }]}>
                  {selectedLogModal?.targetId || "N/A"}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>IP Address:</Text>
                <Text style={[styles.detailVal, { color: textPrimary }]}>
                  {selectedLogModal?.ipAddress || "::1 (Local)"}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: border }]}>
                <Text style={[styles.detailKey, { color: textSecondary }]}>Timestamp:</Text>
                <Text style={[styles.detailVal, { color: textPrimary }]}>
                  {selectedLogModal?.createdAt ? new Date(selectedLogModal.createdAt).toString() : "N/A"}
                </Text>
              </View>

              {/* Changes JSON */}
              <Text style={[styles.jsonTitle, { color: textSecondary }]}>Changes / Payload Diffs:</Text>
              <View style={[styles.jsonBox, { backgroundColor: isDark ? "#0A0E12" : "#F1F5F9" }]}>
                <Text style={[styles.jsonText, { color: textPrimary }]}>
                  {JSON.stringify(selectedLogModal?.changes || selectedLogModal?.payload || {}, null, 2)}
                </Text>
              </View>
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginTop: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  countStrip: {
    paddingHorizontal: scale(18),
    paddingTop: scale(10),
    paddingBottom: scale(2),
  },
  countText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  listContent: {
    padding: scale(16),
    gap: scale(10),
  },
  logCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  actionBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  actionBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: moderateScale(11),
  },
  actorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(8),
  },
  actorText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scale(8),
    borderTopWidth: 1,
  },
  targetText: {
    fontSize: moderateScale(11),
  },
  targetIdText: {
    fontSize: moderateScale(11),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(10),
  },
  emptyText: {
    fontSize: moderateScale(13),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: scale(18),
  },
  modalContent: {
    borderRadius: scale(14),
    borderWidth: 1,
    padding: scale(18),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(14),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "900",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scale(8),
    borderBottomWidth: 1,
  },
  detailKey: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  detailVal: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  jsonTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(12),
    marginBottom: scale(6),
  },
  jsonBox: {
    padding: scale(10),
    borderRadius: scale(8),
    maxHeight: scale(180),
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: moderateScale(11),
  },
});
