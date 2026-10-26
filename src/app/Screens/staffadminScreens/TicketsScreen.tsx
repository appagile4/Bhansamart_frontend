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
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";
import {
  fetchAdminTicketDetailsApi,
  fetchAdminTicketsApi,
  replyAdminTicketApi,
} from "@/store/services/adminService";

export default function StaffAdminTicketsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("IN_PROGRESS");

  const loadTickets = async () => {
    try {
      const res = await fetchAdminTicketsApi({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res?.tickets || res?.data) {
        setTickets(res.tickets || res.data);
      }
    } catch (e) {
      console.warn("[Tickets] Failed to load tickets", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTickets();
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const openTicketDetails = async (t: any) => {
    setSelectedTicket(t);
    setDetailsLoading(true);
    try {
      const res = await fetchAdminTicketDetailsApi(t._id || t.id);
      if (res?.ticket || res?.data) {
        setTicketDetails(res.ticket || res.data);
        setNewStatus(res.ticket?.status || res.data?.status || "IN_PROGRESS");
      }
    } catch (e) {
      console.warn("[Tickets] Details fetch error", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert("Reply Required", "Please type a message before sending.");
      return;
    }

    setSendingReply(true);
    try {
      await replyAdminTicketApi(selectedTicket._id || selectedTicket.id, {
        message: replyText.trim(),
        status: newStatus,
      });
      Alert.alert("Reply Sent", "Your response has been sent to the vendor.");
      setReplyText("");
      // Reload ticket details
      openTicketDetails(selectedTicket);
      loadTickets();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const STATUS_PILLS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Vendor Tickets"
        subtitle={`${tickets.length} Inquiries`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Status Pills */}
        <View style={styles.pillsRow}>
          {STATUS_PILLS.map((st) => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? "#0284C7" : cardBg,
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {st.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading support tickets...
            </Text>
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              const storeName =
                item.vendor?.businessDetails?.businessName ||
                item.vendorName ||
                "Assigned Store";

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openTicketDetails(item)}
                  style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ gap: moderateScale(2), flex: 1, marginRight: scale(8) }}>
                      <Text style={[styles.ticketSubject, { color: textPrimary }]} numberOfLines={1}>
                        {item.subject || "Support Inquiry"}
                      </Text>
                      <Text style={[styles.vendorSubtitle, { color: textSecondary }]}>
                        Store: {storeName}
                      </Text>
                    </View>
                    <RequestStatusBadge status={item.status} type="ticket" />
                  </View>

                  <Text style={[styles.descText, { color: textSecondary }]} numberOfLines={2}>
                    {item.description || item.message || "No description provided."}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                    <Text style={[styles.catBadge, { color: "#0284C7" }]}>
                      {item.category || "General"}
                    </Text>
                    <Text style={[styles.priorityText, { color: item.priority === "HIGH" ? "#DC2626" : textSecondary }]}>
                      Priority: {item.priority || "NORMAL"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="ticket-outline" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Tickets</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No support tickets found for this status.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: textPrimary }]} numberOfLines={1}>
                    {ticketDetails?.subject || selectedTicket.subject}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    Store: {ticketDetails?.vendor?.businessDetails?.businessName || selectedTicket.vendorName || "Assigned Store"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              {detailsLoading ? (
                <View style={{ paddingVertical: moderateScale(40), alignItems: "center" }}>
                  <ActivityIndicator color="#0284C7" />
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: moderateScale(10) }}>
                  <View style={styles.detailBlock}>
                    <Text style={[styles.detailLabel, { color: textSecondary }]}>Description</Text>
                    <Text style={[styles.detailDesc, { color: textPrimary }]}>
                      {ticketDetails?.description || selectedTicket.description}
                    </Text>
                  </View>

                  {/* Conversation History */}
                  {ticketDetails?.messages?.length > 0 && (
                    <View style={styles.detailBlock}>
                      <Text style={[styles.detailLabel, { color: textSecondary, marginBottom: moderateScale(6) }]}>
                        Conversation History
                      </Text>
                      {ticketDetails.messages.map((m: any, idx: number) => {
                        const isStaff = m.senderRole === "admin" || m.senderRole === "superadmin";
                        return (
                          <View
                            key={m._id || idx}
                            style={[
                              styles.messageBubble,
                              {
                                backgroundColor: isStaff
                                  ? "rgba(2, 132, 199, 0.1)"
                                  : isDark
                                  ? "#1E293B"
                                  : "#F1F5F9",
                                alignSelf: isStaff ? "flex-end" : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.msgSender, { color: isStaff ? "#0284C7" : textSecondary }]}>
                              {isStaff ? "Staff Admin" : "Vendor"}
                            </Text>
                            <Text style={[styles.msgText, { color: textPrimary }]}>{m.message}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Status Change Selector */}
                  <View>
                    <Text style={[styles.detailLabel, { color: textSecondary, marginBottom: moderateScale(4) }]}>
                      Update Status
                    </Text>
                    <View style={styles.statusSelectRow}>
                      {(["IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((st) => (
                        <TouchableOpacity
                          key={st}
                          onPress={() => setNewStatus(st)}
                          style={[
                            styles.statusSelectBtn,
                            {
                              backgroundColor: newStatus === st ? "#0284C7" : cardBg,
                              borderColor: newStatus === st ? "#0284C7" : border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusSelectText,
                              { color: newStatus === st ? "#FFFFFF" : textSecondary },
                            ]}
                          >
                            {st.replace(/_/g, " ")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Reply Input */}
                  <View>
                    <Text style={[styles.detailLabel, { color: textSecondary, marginBottom: moderateScale(4) }]}>
                      Type Staff Reply
                    </Text>
                    <TextInput
                      placeholder="Write message to vendor..."
                      placeholderTextColor={textSecondary}
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      numberOfLines={3}
                      style={[styles.replyInput, { color: textPrimary, borderColor: border }]}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={sendingReply}
                    onPress={handleSendReply}
                    style={styles.sendReplyBtn}
                  >
                    {sendingReply ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.sendReplyText}>Send Reply & Update Status</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(10),
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginBottom: moderateScale(10),
  },
  filterPill: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11),
  },
  listContent: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  card: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(8),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  ticketSubject: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  vendorSubtitle: {
    fontSize: moderateScale(11),
  },
  descText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(6),
    borderTopWidth: 1,
  },
  catBadge: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  priorityText: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  emptyBox: {
    padding: scale(24),
    borderRadius: scale(14),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(16),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    marginTop: moderateScale(1),
  },
  detailBlock: {
    gap: moderateScale(4),
  },
  detailLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
  },
  detailDesc: {
    fontSize: moderateScale(12.5),
    lineHeight: moderateScale(17),
  },
  messageBubble: {
    padding: scale(8),
    borderRadius: scale(8),
    maxWidth: "85%",
    marginBottom: moderateScale(4),
  },
  msgSender: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
    marginBottom: moderateScale(2),
  },
  msgText: {
    fontSize: moderateScale(12),
  },
  statusSelectRow: {
    flexDirection: "row",
    gap: scale(6),
    marginTop: moderateScale(4),
  },
  statusSelectBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(6),
    borderWidth: 1,
  },
  statusSelectText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    height: moderateScale(65),
    textAlignVertical: "top",
    fontSize: moderateScale(13),
  },
  sendReplyBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  sendReplyText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
});
