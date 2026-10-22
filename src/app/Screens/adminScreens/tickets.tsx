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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminTickets,
  fetchAdminTicketDetails,
  replyAdminTicket,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function AdminTicketsScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedTicketModal, setSelectedTicketModal] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [nextStatus, setNextStatus] = useState<string>("IN_PROGRESS");

  const { tickets, ticketsTotal, currentTicket, loading, actionLoading } = useAppSelector(
    (state) => state.admin
  );

  const loadTickets = () => {
    dispatch(fetchAdminTickets({ status: statusFilter || undefined }));
  };

  useEffect(() => {
    loadTickets();
  }, [dispatch, statusFilter]);

  const onRefresh = () => {
    loadTickets();
  };

  const handleOpenTicket = async (ticket: any) => {
    setSelectedTicketModal(ticket);
    setReplyMessage("");
    setNextStatus(ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status);
    dispatch(fetchAdminTicketDetails(ticket._id));
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert("Validation Error", "Please enter a reply message.");
      return;
    }

    try {
      await dispatch(
        replyAdminTicket({
          id: selectedTicketModal._id,
          message: replyMessage.trim(),
          status: nextStatus,
        })
      ).unwrap();

      Alert.alert("Success", "Reply sent to customer/vendor successfully!");
      setReplyMessage("");
      dispatch(fetchAdminTicketDetails(selectedTicketModal._id));
      loadTickets();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to send reply");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT":
        return "#EF4444";
      case "HIGH":
        return "#F97316";
      case "MEDIUM":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "OPEN":
        return "#3B82F6";
      case "IN_PROGRESS":
        return "#F59E0B";
      case "RESOLVED":
        return "#10B981";
      case "CLOSED":
        return "#94A3B8";
      default:
        return "#94A3B8";
    }
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderTicketItem = ({ item }: { item: any }) => {
    const priorityColor = getPriorityColor(item.priority);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.ticketCard, { backgroundColor: cardBg, borderColor: border }]}
        onPress={() => handleOpenTicket(item)}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.codeBadge, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
              <Text style={[styles.codeBadgeText, { color: textPrimary }]}>
                {item.ticketNumber || `#${item._id.slice(-6).toUpperCase()}`}
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: `${priorityColor}20` }]}>
              <Text style={[styles.pillBadgeText, { color: priorityColor }]}>{item.priority}</Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.pillBadgeText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.subjectText, { color: textPrimary }]} numberOfLines={2}>
          {item.subject}
        </Text>

        <View style={[styles.metaFooter, { borderTopColor: border }]}>
          <Text style={[styles.authorText, { color: textSecondary }]}>
            By: {item.raisedBy?.name || "User"} ({item.userRole || item.raisedBy?.role || "user"})
          </Text>
          <View style={styles.replyCountBadge}>
            <Feather name="message-square" size={scale(12)} color="#10B981" />
            <Text style={[styles.replyCountText, { color: textSecondary }]}>
              {item.messages?.length || 0} msgs
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader title="Support Tickets" subtitle="Inquiries & Complaints Queue" showBack />
      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor: border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { label: "All Tickets", value: "" },
            { label: "Open", value: "OPEN" },
            { label: "In Progress", value: "IN_PROGRESS" },
            { label: "Resolved", value: "RESOLVED" },
            { label: "Closed", value: "CLOSED" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.filterChip, statusFilter === tab.value && styles.filterChipActive]}
              onPress={() => setStatusFilter(tab.value)}
            >
              <Text style={[styles.filterChipText, statusFilter === tab.value && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item._id}
        renderItem={renderTicketItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#10B981" />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={scale(48)} color="#64748B" />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No support tickets found.</Text>
            </View>
          ) : null
        }
      />

      {/* Ticket Details & Reply Modal */}
      <Modal visible={!!selectedTicketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTicketNum, { color: "#10B981" }]}>
                  {selectedTicketModal?.ticketNumber}
                </Text>
                <Text style={[styles.modalSubject, { color: textPrimary }]} numberOfLines={2}>
                  {selectedTicketModal?.subject}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTicketModal(null)}>
                <Feather name="x" size={scale(20)} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Conversation Messages */}
            <ScrollView style={styles.messagesScroll} showsVerticalScrollIndicator={false}>
              {((currentTicket || selectedTicketModal)?.messages || []).map((msg: any, idx: number) => {
                const isAdmin = msg.senderRole === "superadmin" || msg.senderRole === "admin";
                return (
                  <View
                    key={idx}
                    style={[
                      styles.msgBubble,
                      isAdmin ? styles.msgAdmin : styles.msgUser,
                      {
                        backgroundColor: isAdmin
                          ? (isDark ? "#064E3B" : "#D1FAE5")
                          : (isDark ? "#1E293B" : "#F1F5F9"),
                      },
                    ]}
                  >
                    <View style={styles.msgHeader}>
                      <Text style={[styles.msgSender, { color: isAdmin ? "#10B981" : textPrimary }]}>
                        {msg.sender?.name || (isAdmin ? "BhansaMart Support" : "User")}
                      </Text>
                      <Text style={[styles.msgTime, { color: textSecondary }]}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </Text>
                    </View>
                    <Text style={[styles.msgText, { color: textPrimary }]}>{msg.message}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Reply Composer */}
            <View style={[styles.replyBox, { borderTopColor: border }]}>
              {/* Status Picker Pills */}
              <View style={styles.statusPillsRow}>
                <Text style={[styles.statusSelectLabel, { color: textSecondary }]}>Set Status:</Text>
                {["IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.smallStatusPill, nextStatus === s && styles.smallStatusPillActive]}
                    onPress={() => setNextStatus(s)}
                  >
                    <Text style={[styles.smallStatusPillText, nextStatus === s && styles.smallStatusPillTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.replyInput, { color: textPrimary, borderColor: border }]}
                placeholder="Type your official response..."
                placeholderTextColor="#94A3B8"
                multiline
                value={replyMessage}
                onChangeText={setReplyMessage}
              />

              <TouchableOpacity
                style={[styles.sendBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleSendReply}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="send" size={scale(14)} color="#FFFFFF" />
                    <Text style={styles.sendBtnText}>Send Reply & Update Status</Text>
                  </>
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
  container: {
    flex: 1,
  },
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: scale(10),
  },
  filterScroll: {
    paddingHorizontal: scale(16),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  filterChipActive: {
    backgroundColor: "#10B981",
  },
  filterChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#94A3B8",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: scale(16),
    gap: scale(12),
  },
  ticketCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  ticketHeader: {
    marginBottom: scale(8),
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flexWrap: "wrap",
  },
  codeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  codeBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  pillBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  pillBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  subjectText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    lineHeight: scale(20),
  },
  metaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 1,
  },
  authorText: {
    fontSize: moderateScale(11),
  },
  replyCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  replyCountText: {
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
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    height: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
    paddingBottom: scale(10),
    marginBottom: scale(10),
  },
  modalTicketNum: {
    fontSize: moderateScale(12),
    fontWeight: "800",
  },
  modalSubject: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: scale(2),
  },
  messagesScroll: {
    flex: 1,
  },
  msgBubble: {
    borderRadius: scale(10),
    padding: scale(10),
    marginBottom: scale(8),
    maxWidth: "85%",
  },
  msgUser: {
    alignSelf: "flex-start",
  },
  msgAdmin: {
    alignSelf: "flex-end",
  },
  msgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(4),
  },
  msgSender: {
    fontSize: moderateScale(11),
    fontWeight: "800",
  },
  msgTime: {
    fontSize: moderateScale(10),
    marginLeft: scale(8),
  },
  msgText: {
    fontSize: moderateScale(13),
    lineHeight: scale(18),
  },
  replyBox: {
    borderTopWidth: 1,
    paddingTop: scale(10),
  },
  statusPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: scale(8),
  },
  statusSelectLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  smallStatusPill: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  smallStatusPillActive: {
    backgroundColor: "#10B981",
  },
  smallStatusPillText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#94A3B8",
  },
  smallStatusPillTextActive: {
    color: "#FFFFFF",
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: moderateScale(13),
    height: scale(70),
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    marginTop: scale(8),
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
});
