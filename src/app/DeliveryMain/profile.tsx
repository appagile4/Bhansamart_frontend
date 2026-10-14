import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchDeliveryProfile,
  fetchDocumentStatus,
  logoutDeliveryPartner,
  submitDocument,
} from "@/store/slices/deliverySlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DOCS_LIST = [
  {
    key: "panCard" as const,
    title: "PAN Card",
    icon: "credit-card",
    desc: "Tax Identification Card (front image)",
  },
  {
    key: "aadhaarCard" as const,
    title: "Aadhaar Card",
    icon: "user-check",
    desc: "National ID (front and back image)",
  },
  {
    key: "drivingLicense" as const,
    title: "Driving License",
    icon: "award",
    desc: "Motorcycle / Commercial driving license",
  },
  {
    key: "vehicleRc" as const,
    title: "Vehicle RC",
    icon: "file-text",
    desc: "Vehicle Registration Certificate",
  },
];

export default function DeliveryProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { partner, documents, loading } = useAppSelector(
    (state) => state.delivery
  );

  // Upload modal state
  const [activeDocKey, setActiveDocKey] = useState<
    "panCard" | "aadhaarCard" | "drivingLicense" | "vehicleRc" | null
  >(null);
  const [docNumberInput, setDocNumberInput] = useState("");
  const [docUrlInput, setDocUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchDeliveryProfile());
    dispatch(fetchDocumentStatus());
  }, [dispatch]);

  const handleOpenUpload = (key: any, currentNum?: string) => {
    setActiveDocKey(key);
    setDocNumberInput(currentNum && !currentNum.includes("*") ? currentNum : "");
    setDocUrlInput("");
  };

  const handleSaveDocument = async () => {
    if (!activeDocKey) return;
    if (!docNumberInput.trim() && !docUrlInput.trim()) {
      Alert.alert("Required", "Please provide document number or photo URL.");
      return;
    }

    try {
      setSubmitting(true);
      await dispatch(
        submitDocument({
          documentType: activeDocKey,
          documentNumber: docNumberInput.trim() || "DOC-" + Date.now(),
          frontUrl: docUrlInput.trim() || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        })
      ).unwrap();

      Alert.alert(
        "Document Submitted",
        "Your document was submitted for verification. Admin will review it shortly."
      );
      setActiveDocKey(null);
      dispatch(fetchDocumentStatus());
    } catch (err: any) {
      Alert.alert("Upload Error", err || "Failed to submit document.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out from delivery partner mode?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await dispatch(logoutDeliveryPartner());
          router.replace("/(auth)/deliveryAuth/login" as any);
        },
      },
    ]);
  };

  const partnerDocs = partner?.documents || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header Banner */}
      <LinearGradient
        colors={["#0F766E", "#0D9488", "#115E59"]}
        style={styles.headerGradient}
      >
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarLetter}>
              {partner?.fullName?.charAt(0) || "P"}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: scale(12) }}>
            <Text style={styles.profileName}>{partner?.fullName || "Delivery Partner"}</Text>
            <Text style={styles.profilePhone}>{partner?.phone || ""}</Text>
            <View
              style={[
                styles.approvalBadge,
                partner?.approvalStatus === "APPROVED" && styles.approvalBadgeApproved,
              ]}
            >
              <Text
                style={[
                  styles.approvalBadgeText,
                  partner?.approvalStatus === "APPROVED" && styles.approvalBadgeTextApproved,
                ]}
              >
                {partner?.approvalStatus || "PENDING_APPROVAL"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle & Zone Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Vehicle & Zone</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoVal}>
              {partner?.vehicleDetails?.vehicleType || "Motorcycle"} (
              {partner?.vehicleDetails?.registrationNumber || "BA 2 PA 1234"})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service City</Text>
            <Text style={styles.infoVal}>{partner?.serviceCity || "Kathmandu"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Area</Text>
            <Text style={styles.infoVal}>{partner?.serviceArea || "Thamel / Central"}</Text>
          </View>
        </View>

        {/* ── MANDATORY KYC DOCUMENTS SECTION ──────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Verification & Documents</Text>
            <Text style={styles.sectionSubtitle}>
              All 4 documents must be verified to accept orders
            </Text>
          </View>
        </View>

        {DOCS_LIST.map((d) => {
          const docData = partnerDocs[d.key] || {};
          const status = docData.status || "NOT_SUBMITTED";
          const isVerified = status === "VERIFIED";
          const isRejected = status === "REJECTED" || status === "RESUBMISSION_REQUIRED";

          return (
            <View key={d.key} style={styles.docCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docIconBox}>
                  <Feather name={d.icon as any} size={scale(18)} color="#0F766E" />
                </View>
                <View style={{ flex: 1, marginLeft: scale(10) }}>
                  <Text style={styles.docTitle}>{d.title}</Text>
                  <Text style={styles.docNumber}>
                    {docData.documentNumber
                      ? `No: ${docData.documentNumber}`
                      : d.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.docStatusBadge,
                    isVerified && styles.docStatusVerified,
                    isRejected && styles.docStatusRejected,
                  ]}
                >
                  <Text
                    style={[
                      styles.docStatusText,
                      isVerified && styles.docStatusVerifiedText,
                      isRejected && styles.docStatusRejectedText,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              {docData.rejectionReason ? (
                <View style={styles.rejectionBox}>
                  <Feather name="info" size={scale(12)} color="#DC2626" />
                  <Text style={styles.rejectionText}>
                    Reason: {docData.rejectionReason}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  isVerified && styles.uploadBtnVerified,
                ]}
                onPress={() => handleOpenUpload(d.key, docData.documentNumber)}
                activeOpacity={0.8}
              >
                <Feather
                  name={isVerified ? "check-circle" : "upload"}
                  size={scale(14)}
                  color={isVerified ? "#059669" : "#0F766E"}
                />
                <Text
                  style={[
                    styles.uploadBtnText,
                    isVerified && styles.uploadBtnVerifiedText,
                  ]}
                >
                  {isVerified ? "Update Document" : "Upload / Resubmit Document"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Bank & Payout Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>Bank & UPI Payout Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Holder</Text>
            <Text style={styles.infoVal}>
              {partner?.bankDetails?.accountHolderName || partner?.fullName || "Not set"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoVal}>
              {partner?.bankDetails?.accountNumber || "******1234"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>UPI ID</Text>
            <Text style={styles.infoVal}>
              {partner?.bankDetails?.upiId || "partner@upi"}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={scale(16)} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out from Partner Portal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── DOCUMENT UPLOAD MODAL ────────────────────────────────────── */}
      <Modal
        visible={!!activeDocKey}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDocKey(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Upload {DOCS_LIST.find((d) => d.key === activeDocKey)?.title}
              </Text>
              <TouchableOpacity onPress={() => setActiveDocKey(null)}>
                <Feather name="x" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Document Number / ID</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Enter exact document number"
                placeholderTextColor="#94A3B8"
                value={docNumberInput}
                onChangeText={setDocNumberInput}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Document Image URL / Mock</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="https://... or leave empty for sample"
                placeholderTextColor="#94A3B8"
                value={docUrlInput}
                onChangeText={setDocUrlInput}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveDocument}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Submit for Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(24),
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(27),
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profilePhone: {
    fontSize: moderateScale(12),
    color: "#CCFBF1",
    marginTop: moderateScale(2),
  },
  approvalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
    marginTop: moderateScale(4),
  },
  approvalBadgeApproved: {
    backgroundColor: "#ECFDF5",
  },
  approvalBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  approvalBadgeTextApproved: {
    color: "#059669",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(10),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
  },
  infoVal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionHeaderRow: {
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  docHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  docIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  docNumber: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  docStatusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  docStatusVerified: {
    backgroundColor: "#ECFDF5",
  },
  docStatusRejected: {
    backgroundColor: "#FEE2E2",
  },
  docStatusText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#B45309",
  },
  docStatusVerifiedText: {
    color: "#059669",
  },
  docStatusRejectedText: {
    color: "#DC2626",
  },
  rejectionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: scale(8),
    borderRadius: scale(6),
    marginTop: moderateScale(8),
    gap: scale(4),
  },
  rejectionText: {
    fontSize: moderateScale(10),
    color: "#DC2626",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    paddingVertical: moderateScale(8),
    borderRadius: scale(8),
    marginTop: moderateScale(10),
    gap: scale(6),
  },
  uploadBtnVerified: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  uploadBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F766E",
  },
  uploadBtnVerifiedText: {
    color: "#059669",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    marginTop: moderateScale(10),
    gap: scale(6),
  },
  logoutBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#DC2626",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingBottom: moderateScale(34),
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  modalInputGroup: {
    marginBottom: moderateScale(12),
  },
  modalInputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#334155",
    marginBottom: moderateScale(6),
  },
  modalTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(42),
    fontSize: moderateScale(13),
    color: "#0F172A",
  },
  modalSubmitBtn: {
    backgroundColor: "#0F766E",
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    marginTop: moderateScale(10),
  },
  modalSubmitBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
