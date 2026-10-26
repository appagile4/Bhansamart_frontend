import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  CodDueRider,
  CodHandoverReceipt,
  confirmCodHandover,
  fetchCodDueRiders,
} from "@/store/slices/vendorFinanceSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorCodHandoverScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    codDueRiders,
    recentHandovers,
    metrics,
    codLoading,
    actionLoading,
    unreadCount,
  } = useAppSelector((state) => state.vendorFinance);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRider, setSelectedRider] = useState<CodDueRider | null>(null);
  const [submittedAmount, setSubmittedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("CASH");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [successReceipt, setSuccessReceipt] =
    useState<CodHandoverReceipt | null>(null);

  useEffect(() => {
    dispatch(fetchCodDueRiders());
  }, [dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchCodDueRiders()).finally(() => {
      setRefreshing(false);
    });
  };

  const handleOpenHandoverModal = (rider: CodDueRider) => {
    setSelectedRider(rider);
    setSubmittedAmount(String(rider.totalDue));
    setPaymentMode("CASH");
    setHandoverNotes("");
  };

  const handleConfirmHandover = async () => {
    if (!selectedRider) return;

    const amt = parseFloat(submittedAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid cash amount submitted by the delivery boy.",
      );
      return;
    }

    if (amt > selectedRider.totalDue) {
      Alert.alert(
        "Excess Amount",
        `Submitted amount cannot exceed the pending due amount (NPR ${selectedRider.totalDue.toLocaleString()}).`,
      );
      return;
    }

    try {
      const result = await dispatch(
        confirmCodHandover({
          deliveryBoyId: selectedRider.deliveryBoy._id,
          amountSubmitted: amt,
          paymentMode,
          notes: handoverNotes.trim() || undefined,
        }),
      ).unwrap();

      const receipt = result?.handover;
      setSelectedRider(null);
      dispatch(fetchCodDueRiders());

      if (receipt) {
        setSuccessReceipt(receipt);
      } else {
        Alert.alert(
          "Handover Confirmed",
          `Successfully confirmed cash receipt of NPR ${amt.toLocaleString()} from ${selectedRider.deliveryBoy.fullName}.`,
        );
      }
    } catch (err: any) {
      Alert.alert("Handover Failed", err || "Failed to confirm cash handover.");
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Back Button & Screen Title Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: scale(16),
          paddingTop: scale(10),
          gap: scale(8),
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{ paddingRight: scale(4) }}
          accessibilityLabel="Go Back"
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: moderateScale(15),
            fontWeight: "800",
            color: "#0F172A",
          }}
        >
          Cash On Delivery Handover
        </Text>
      </View>

      {/* Top COD Custody Highlight Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerSubtitle}>PENDING STORE SUBMISSION</Text>
            <Text style={styles.bannerAmount}>
              NPR {(metrics.codCashWithDeliveryBoys || 0).toLocaleString()}
            </Text>
            <Text style={styles.bannerNotes}>
              Cash collected from customers & pending physical handover at your
              store counter
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={codDueRiders}
        keyExtractor={(item) => item.deliveryBoy._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#016073"]}
            tintColor="#016073"
          />
        }
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Delivery Partners with Pending Cash ({codDueRiders.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.riderCard}>
            <View style={styles.riderHeader}>
              <View style={styles.riderAvatar}>
                <MaterialCommunityIcons
                  name="moped"
                  size={scale(20)}
                  color="#016073"
                />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.riderName}>
                  {item.deliveryBoy.fullName}
                </Text>
                <Text style={styles.riderPhone}>{item.deliveryBoy.phone}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.dueAmount}>
                  NPR {item.totalDue.toLocaleString()}
                </Text>
                <Text style={styles.ordersBadge}>
                  {item.ordersCount} COD orders
                </Text>
              </View>
            </View>

            {/* Orders preview */}
            <View style={styles.ordersBox}>
              <Text style={styles.ordersBoxTitle}>Associated Orders:</Text>
              {item.orders.slice(0, 3).map((ord) => (
                <View key={ord._id} style={styles.orderRow}>
                  <Text style={styles.orderNumber}>#{ord.orderNumber}</Text>
                  <Text style={styles.orderCustomer}>{ord.customerName}</Text>
                  <Text style={styles.orderAmt}>NPR {ord.totalAmount}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.receiveBtn}
              activeOpacity={0.8}
              onPress={() => handleOpenHandoverModal(item)}
            >
              <MaterialCommunityIcons
                name="hand-coin"
                size={scale(16)}
                color="#FFFFFF"
              />
              <Text style={styles.receiveBtnText}>Confirm Cash Received</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          codLoading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="small" color="#016073" />
              <Text style={styles.emptyText}>
                Checking rider cash balances...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={scale(44)}
                color="#10B981"
              />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>
                No pending Cash on Delivery orders. All cash collected by
                delivery partners has been handed over.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          recentHandovers.length > 0 ? (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Handover Receipts</Text>
              {recentHandovers.map((rec) => (
                <View key={rec._id} style={styles.receiptCard}>
                  <View style={styles.receiptTop}>
                    <Text style={styles.receiptNumber}>
                      Receipt #{rec.receiptNumber}
                    </Text>
                    <Text style={styles.receiptAmount}>
                      NPR {rec.amountSubmitted.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.receiptSub}>
                    Rider: {rec.deliveryBoy?.fullName || "Delivery Partner"}{" "}
                    &bull; Mode: {rec.paymentMode} &bull;{" "}
                    {new Date(rec.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ) : undefined
        }
      />

      {/* ── HANDOVER CONFIRMATION MODAL ──────────────────────────────── */}
      <Modal
        visible={Boolean(selectedRider)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRider(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Store Cash Handover</Text>
              <TouchableOpacity onPress={() => setSelectedRider(null)}>
                <Feather name="x" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalRiderInfo}>
              <Text style={styles.modalRiderLabel}>Delivery Partner:</Text>
              <Text style={styles.modalRiderVal}>
                {selectedRider?.deliveryBoy.fullName}
              </Text>
              <Text style={styles.modalRiderPhone}>
                {selectedRider?.deliveryBoy.phone}
              </Text>
            </View>

            <View style={styles.modalDueBox}>
              <Text style={styles.modalDueLabel}>
                Total Cash Due from Rider:
              </Text>
              <Text style={styles.modalDueVal}>
                NPR {(selectedRider?.totalDue || 0).toLocaleString()}
              </Text>
            </View>

            <Text style={styles.inputLabel}>
              Cash Amount Handed Over (NPR):
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={submittedAmount}
              onChangeText={setSubmittedAmount}
            />

            <Text style={styles.inputLabel}>Payment Mode:</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  paymentMode === "CASH" && styles.modeBtnActive,
                ]}
                onPress={() => setPaymentMode("CASH")}
              >
                <MaterialCommunityIcons
                  name="cash"
                  size={scale(16)}
                  color={paymentMode === "CASH" ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    paymentMode === "CASH" && styles.modeBtnTextActive,
                  ]}
                >
                  Cash in Hand
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  paymentMode === "UPI" && styles.modeBtnActive,
                ]}
                onPress={() => setPaymentMode("UPI")}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={scale(16)}
                  color={paymentMode === "UPI" ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    paymentMode === "UPI" && styles.modeBtnTextActive,
                  ]}
                >
                  Store QR / UPI
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              Store Counter Notes (Optional):
            </Text>
            <TextInput
              style={[styles.textInput, { height: scale(50) }]}
              placeholder="e.g. Received at cashier desk"
              value={handoverNotes}
              onChangeText={setHandoverNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedRider(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmHandover}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    Confirm & Generate Receipt
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SUCCESS RECEIPT MODAL ─────────────────────────────────────── */}
      <Modal
        visible={Boolean(successReceipt)}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { alignItems: "center" }]}>
            <View style={styles.successCircle}>
              <Feather name="check" size={scale(28)} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Handover Verified!</Text>
            <Text style={styles.successSub}>
              Cash submission confirmed and recorded in financial audit trail.
            </Text>

            <View style={styles.receiptDetailsBox}>
              <View style={styles.receiptLine}>
                <Text style={styles.rLabel}>Receipt Number:</Text>
                <Text style={styles.rVal}>{successReceipt?.receiptNumber}</Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={styles.rLabel}>Amount Received:</Text>
                <Text
                  style={[styles.rVal, { color: "#15803D", fontWeight: "800" }]}
                >
                  NPR {successReceipt?.amountSubmitted?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={styles.rLabel}>Remaining Balance:</Text>
                <Text style={styles.rVal}>
                  NPR {successReceipt?.remainingBalance?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={styles.rLabel}>Mode:</Text>
                <Text style={styles.rVal}>{successReceipt?.paymentMode}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setSuccessReceipt(null)}
            >
              <Text style={styles.doneBtnText}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  bannerContainer: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(10),
  },
  banner: {
    backgroundColor: "#FEF9C3",
    borderWidth: 1,
    borderColor: "#FDE047",
    borderRadius: scale(14),
    padding: scale(16),
  },
  bannerSubtitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#854D0E",
    letterSpacing: 0.5,
  },
  bannerAmount: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#854D0E",
    marginTop: scale(2),
  },
  bannerNotes: {
    fontSize: moderateScale(11),
    color: "#A16207",
    marginTop: scale(4),
    lineHeight: scale(15),
  },
  listContainer: {
    padding: scale(16),
    gap: scale(12),
  },
  sectionHeaderRow: {
    marginBottom: scale(4),
  },
  sectionTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  riderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: scale(10),
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#E6F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  riderPhone: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  dueAmount: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#854D0E",
  },
  ordersBadge: {
    fontSize: moderateScale(10),
    color: "#64748B",
  },
  ordersBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(8),
    padding: scale(10),
    gap: scale(4),
  },
  ordersBoxTitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#64748B",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#0F172A",
  },
  orderCustomer: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  orderAmt: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
  receiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#016073",
    paddingVertical: scale(10),
    borderRadius: scale(8),
    gap: scale(6),
  },
  receiveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  emptyWrap: {
    paddingVertical: scale(50),
    alignItems: "center",
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#10B981",
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: scale(260),
  },
  recentSection: {
    marginTop: scale(16),
    gap: scale(8),
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  receiptTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptNumber: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  receiptAmount: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#15803D",
  },
  receiptSub: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
    marginTop: scale(3),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(18),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(18),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: scale(10),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#016073",
  },
  modalRiderInfo: {
    backgroundColor: "#F8FAFC",
    padding: scale(10),
    borderRadius: scale(8),
    marginTop: scale(10),
  },
  modalRiderLabel: {
    fontSize: moderateScale(10.5),
    color: "#64748B",
  },
  modalRiderVal: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: scale(2),
  },
  modalRiderPhone: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  modalDueBox: {
    backgroundColor: "#FEF9C3",
    padding: scale(10),
    borderRadius: scale(8),
    marginTop: scale(8),
  },
  modalDueLabel: {
    fontSize: moderateScale(10.5),
    color: "#854D0E",
  },
  modalDueVal: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#854D0E",
    marginTop: scale(2),
  },
  inputLabel: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#334155",
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  modeRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: scale(8),
    borderRadius: scale(8),
    gap: scale(6),
  },
  modeBtnActive: {
    backgroundColor: "#016073",
  },
  modeBtnText: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: scale(16),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: scale(10),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: moderateScale(12.5),
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: scale(10),
    borderRadius: scale(8),
    backgroundColor: "#016073",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(12.5),
  },
  successCircle: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(27),
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: scale(10),
  },
  successTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  successSub: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    textAlign: "center",
    marginTop: scale(4),
  },
  receiptDetailsBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    padding: scale(12),
    marginVertical: scale(14),
    gap: scale(6),
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rLabel: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
  },
  rVal: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  doneBtn: {
    width: "100%",
    backgroundColor: "#016073",
    paddingVertical: scale(11),
    borderRadius: scale(8),
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
