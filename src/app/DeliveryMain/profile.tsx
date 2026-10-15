import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchDeliveryProfile,
  fetchDocumentStatus,
  logoutDeliveryPartner,
  submitDocument,
  updateDeliveryBankDetails,
  uploadDeliveryProfilePhoto,
} from "@/store/slices/deliverySlice";
import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const DOCS_LIST = [
  {
    key: "panCard" as const,
    title: "PAN Card",
    icon: "credit-card",
    desc: "Tax Identification Card (front photo)",
  },
  {
    key: "aadhaarCard" as const,
    title: "Aadhaar Card",
    icon: "user-check",
    desc: "National ID (photo of document)",
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
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { partner, actionLoading } = useAppSelector((state) => state.delivery);

  // Profile photo picker modal
  const [photoPickerModal, setPhotoPickerModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Document upload modal state
  const [activeDocKey, setActiveDocKey] = useState<
    "panCard" | "aadhaarCard" | "drivingLicense" | "vehicleRc" | null
  >(null);
  const [docNumberInput, setDocNumberInput] = useState("");
  const [selectedDocImageUri, setSelectedDocImageUri] = useState<string | null>(
    null,
  );
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Bank & Wallet Modal State
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    dispatch(fetchDeliveryProfile());
    dispatch(fetchDocumentStatus());
  }, [dispatch]);

  // Load bank details into state when modal opens
  const handleOpenBankModal = () => {
    const b = partner?.bankDetails || {};
    setAccountHolderName(b.accountHolderName || partner?.fullName || "");
    setAccountNumber(
      b.accountNumber && !b.accountNumber.includes("*") ? b.accountNumber : "",
    );
    setIfscCode(b.ifscCode || "");
    setBankName(b.bankName || "");
    setUpiId(b.upiId || "");
    setBankModalVisible(true);
  };

  const handleSaveBankDetails = async () => {
    if (!upiId.trim() && (!accountNumber.trim() || !ifscCode.trim())) {
      Alert.alert(
        "Required Fields",
        "Please provide either your Bank Account Number & IFSC Code, or your UPI / eSewa ID for payouts.",
      );
      return;
    }

    try {
      setSavingBank(true);
      await dispatch(
        updateDeliveryBankDetails({
          accountHolderName: accountHolderName.trim() || partner?.fullName,
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: bankName.trim(),
          upiId: upiId.trim(),
        }),
      ).unwrap();

      Alert.alert(
        "Bank Details Saved",
        "Your bank and UPI wallet payout details have been updated and stored securely.",
      );
      setBankModalVisible(false);
      dispatch(fetchDeliveryProfile());
    } catch (err: any) {
      Alert.alert("Update Failed", err || "Failed to update bank details.");
    } finally {
      setSavingBank(false);
    }
  };

  // Profile Photo Pickers
  const handlePickPhotoFromLibrary = async () => {
    setPhotoPickerModal(false);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant media gallery access to upload your profile photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadPhotoToCloudinary(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Photo Error", "Could not pick image. Please try again.");
    }
  };

  const handleTakePhotoWithCamera = async () => {
    setPhotoPickerModal(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to capture your profile photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadPhotoToCloudinary(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Camera Error", "Could not capture image. Please try again.");
    }
  };

  const uploadPhotoToCloudinary = async (uri: string) => {
    try {
      setUploadingPhoto(true);
      await dispatch(uploadDeliveryProfilePhoto(uri)).unwrap();
      Alert.alert(
        "Success",
        "Profile photo uploaded to Cloudinary successfully!",
      );
      dispatch(fetchDeliveryProfile());
    } catch (err: any) {
      Alert.alert(
        "Upload Failed",
        err || "Failed to upload photo to Cloudinary.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Document Photo Picker
  const handlePickDocPhoto = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Camera permission is needed to take a photo of the document.",
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
        });
        if (!result.canceled && result.assets?.[0]) {
          setSelectedDocImageUri(result.assets[0].uri);
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Gallery permission is needed to select a document photo.",
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });
        if (!result.canceled && result.assets?.[0]) {
          setSelectedDocImageUri(result.assets[0].uri);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not select document image.");
    }
  };

  const handleOpenUpload = (key: any, currentNum?: string) => {
    setActiveDocKey(key);
    setDocNumberInput(
      currentNum && !currentNum.includes("*") ? currentNum : "",
    );
    setSelectedDocImageUri(null);
  };

  const handleSaveDocument = async () => {
    if (!activeDocKey) return;
    if (!docNumberInput.trim() && !selectedDocImageUri) {
      Alert.alert(
        "Required",
        "Please provide either your document number or select a photo of the document to upload to Cloudinary.",
      );
      return;
    }

    try {
      setSubmittingDoc(true);
      await dispatch(
        submitDocument({
          documentType: activeDocKey,
          documentNumber: docNumberInput.trim() || undefined,
          fileUri: selectedDocImageUri || undefined,
        }),
      ).unwrap();

      Alert.alert(
        "Document Uploaded to Cloudinary",
        "Your document photo has been uploaded and stored in MongoDB. Admin will review it shortly.",
      );
      setActiveDocKey(null);
      setSelectedDocImageUri(null);
      dispatch(fetchDocumentStatus());
      dispatch(fetchDeliveryProfile());
    } catch (err: any) {
      Alert.alert("Upload Error", err || "Failed to submit document.");
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out from delivery partner mode?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await dispatch(logoutDeliveryPartner());
            router.replace("/(auth)/deliveryAuth/login" as any);
          },
        },
      ],
    );
  };

  const partnerDocs = partner?.documents || {};
  const profilePhotoUrl =
    partner?.profilePhoto?.url || partner?.user?.avatar || null;

  return (
    <SafeAreaView style={styles.safeArea} edges={[""] as any}>
      <StatusBar style="light" />

      {/* Header Banner with Profile Photo */}
      <LinearGradient
        colors={["#0F766E", "#0D9488", "#115E59"]}
        style={[
          styles.headerGradient,
          {
            paddingTop:
              Math.max(insets.top, moderateScale(16)) + moderateScale(8),
          },
        ]}
      >
        <View style={styles.profileHeaderRow}>
          {/* Avatar with Camera Icon Overlay */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setPhotoPickerModal(true)}
            activeOpacity={0.85}
          >
            {profilePhotoUrl ? (
              <Image
                source={{ uri: profilePhotoUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarBox}>
                <Text style={styles.avatarLetter}>
                  {partner?.fullName?.charAt(0) || "P"}
                </Text>
              </View>
            )}

            {uploadingPhoto ? (
              <View style={styles.avatarUploadingOverlay}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            ) : (
              <View style={styles.cameraIconBadge}>
                <Feather name="camera" size={scale(12)} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: scale(14) }}>
            <Text style={styles.profileName}>
              {partner?.fullName || "Delivery Partner"}
            </Text>
            <Text style={styles.profilePhone}>{partner?.phone || ""}</Text>
            <TouchableOpacity
              onPress={() => setPhotoPickerModal(true)}
              style={styles.changePhotoTextBtn}
            >
              <Text style={styles.changePhotoText}>Tap to change photo</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.approvalBadge,
                partner?.approvalStatus === "APPROVED" &&
                  styles.approvalBadgeApproved,
              ]}
            >
              <Text
                style={[
                  styles.approvalBadgeText,
                  partner?.approvalStatus === "APPROVED" &&
                    styles.approvalBadgeTextApproved,
                ]}
              >
                {partner?.approvalStatus || "PENDING_APPROVAL"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Keyboard Avoidance Wrapping the Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              <Text style={styles.infoVal}>
                {partner?.serviceCity || "Kathmandu"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Area</Text>
              <Text style={styles.infoVal}>
                {partner?.serviceArea || "Thamel / Central"}
              </Text>
            </View>
          </View>

          {/* ── BANK & WALLET PAYOUT CARD (NEW & EDITABLE) ────────── */}
          <View style={styles.bankCard}>
            <View style={styles.bankHeaderRow}>
              <View style={styles.bankIconBox}>
                <MaterialCommunityIcons
                  name="bank"
                  size={scale(22)}
                  color="#0F766E"
                />
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.cardHeaderTitle}>
                  Bank & UPI Payout Wallet
                </Text>
                <Text style={styles.cardHeaderSubtitle}>
                  For weekly payouts & security deposit refunds
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBankBtn}
                onPress={handleOpenBankModal}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={scale(14)} color="#0F766E" />
                <Text style={styles.editBankBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bankDetailsContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Holder</Text>
                <Text style={styles.infoVal}>
                  {partner?.bankDetails?.accountHolderName ||
                    partner?.fullName ||
                    "Not set"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoVal}>
                  {partner?.bankDetails?.bankName || "Not configured"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Number</Text>
                <Text style={styles.infoVal}>
                  {partner?.bankDetails?.accountNumber || "Not configured"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>IFSC / Swift</Text>
                <Text style={styles.infoVal}>
                  {partner?.bankDetails?.ifscCode || "Not configured"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UPI / eSewa Wallet</Text>
                <Text
                  style={[
                    styles.infoVal,
                    { color: "#0F766E", fontWeight: "700" },
                  ]}
                >
                  {partner?.bankDetails?.upiId || "Not configured"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── MANDATORY KYC DOCUMENTS SECTION ──────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Verification & Cloudinary Documents
              </Text>
              <Text style={styles.sectionSubtitle}>
                Upload clear photos to Cloudinary for verification
              </Text>
            </View>
          </View>

          {DOCS_LIST.map((d) => {
            const docData = partnerDocs[d.key] || {};
            const status = docData.status || "NOT_SUBMITTED";
            const isVerified = status === "VERIFIED";
            const isRejected =
              status === "REJECTED" || status === "RESUBMISSION_REQUIRED";
            const hasUploadedPhoto = Boolean(docData.frontUrl);

            return (
              <View key={d.key} style={styles.docCard}>
                <View style={styles.docHeaderRow}>
                  <View style={styles.docIconBox}>
                    <Feather
                      name={d.icon as any}
                      size={scale(18)}
                      color="#0F766E"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={styles.docTitle}>{d.title}</Text>
                    <Text style={styles.docNumber}>
                      {docData.documentNumber
                        ? `No: ${docData.documentNumber}`
                        : d.desc}
                    </Text>
                    {hasUploadedPhoto && (
                      <View style={styles.cloudinaryBadge}>
                        <Feather
                          name="cloud"
                          size={scale(10)}
                          color="#059669"
                        />
                        <Text style={styles.cloudinaryBadgeText}>
                          Stored on Cloud
                        </Text>
                      </View>
                    )}
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
                  onPress={() =>
                    handleOpenUpload(d.key, docData.documentNumber)
                  }
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isVerified ? "check-circle" : "upload-cloud"}
                    size={scale(15)}
                    color={isVerified ? "#059669" : "#0F766E"}
                  />
                  <Text
                    style={[
                      styles.uploadBtnText,
                      isVerified && styles.uploadBtnVerifiedText,
                    ]}
                  >
                    {isVerified
                      ? "Update Document Photo"
                      : "Upload / Capture Document Photo"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Feather name="log-out" size={scale(16)} color="#DC2626" />
            <Text style={styles.logoutBtnText}>
              Sign Out from Partner Portal
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── PROFILE PHOTO PICKER MODAL ─────────────────────────────────── */}
      <Modal
        visible={photoPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPhotoPickerModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Update Profile Photo</Text>
                  <TouchableOpacity onPress={() => setPhotoPickerModal(false)}>
                    <Feather name="x" size={scale(20)} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.photoPickerSub}>
                  Take a photo or choose an image from your gallery to upload
                  directly to Cloudinary.
                </Text>

                <View style={styles.photoOptionsContainer}>
                  <TouchableOpacity
                    style={styles.photoOptionBtn}
                    onPress={handleTakePhotoWithCamera}
                    activeOpacity={0.8}
                  >
                    <View style={styles.photoOptionIconBox}>
                      <Feather name="camera" size={scale(22)} color="#0F766E" />
                    </View>
                    <Text style={styles.photoOptionLabel}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoOptionBtn}
                    onPress={handlePickPhotoFromLibrary}
                    activeOpacity={0.8}
                  >
                    <View style={styles.photoOptionIconBox}>
                      <Feather name="image" size={scale(22)} color="#0F766E" />
                    </View>
                    <Text style={styles.photoOptionLabel}>
                      Choose from Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── DOCUMENT UPLOAD MODAL (WITH CLOUDINARY FILE PICKER) ─────────── */}
      <Modal
        visible={!!activeDocKey}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDocKey(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Upload {DOCS_LIST.find((d) => d.key === activeDocKey)?.title}
              </Text>
              <TouchableOpacity onPress={() => setActiveDocKey(null)}>
                <Feather name="x" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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

              {/* Photo Picker Options for Document */}
              <Text style={styles.modalInputLabel}>
                Document Photo (Cloudinary Upload)
              </Text>
              <View style={styles.docPickerButtonsRow}>
                <TouchableOpacity
                  style={styles.docPickerSmallBtn}
                  onPress={() => handlePickDocPhoto(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={scale(16)} color="#0F766E" />
                  <Text style={styles.docPickerSmallBtnText}>
                    Capture Camera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docPickerSmallBtn}
                  onPress={() => handlePickDocPhoto(false)}
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={scale(16)} color="#0F766E" />
                  <Text style={styles.docPickerSmallBtnText}>
                    Choose Gallery
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Document Image Preview */}
              {selectedDocImageUri ? (
                <View style={styles.docPreviewContainer}>
                  <Image
                    source={{ uri: selectedDocImageUri }}
                    style={styles.docPreviewImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeDocPhotoBtn}
                    onPress={() => setSelectedDocImageUri(null)}
                  >
                    <Feather name="trash-2" size={scale(14)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : activeDocKey && partnerDocs[activeDocKey]?.frontUrl ? (
                <View style={styles.docPreviewContainer}>
                  <Image
                    source={{ uri: partnerDocs[activeDocKey].frontUrl }}
                    style={styles.docPreviewImage}
                    contentFit="cover"
                  />
                  <Text style={styles.currentPhotoText}>
                    Current Document on Cloudinary
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveDocument}
                disabled={submittingDoc}
                activeOpacity={0.85}
              >
                {submittingDoc ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnRowCenter}>
                    <Feather
                      name="upload-cloud"
                      size={scale(18)}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalSubmitBtnText}>
                      Upload to Cloudinary
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── BANK & WALLET DETAILS MODAL ─────────────────────────────────── */}
      <Modal
        visible={bankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Bank & Wallet Payout Setup</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Feather name="x" size={scale(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.photoPickerSub}>
                Configure your bank account or UPI / eSewa wallet to receive
                weekly delivery earnings.
              </Text>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Ram Bahadur"
                  placeholderTextColor="#94A3B8"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Bank Name</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Nabil Bank / Nepal Bank / SBI"
                  placeholderTextColor="#94A3B8"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Account Number</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Enter Bank Account Number"
                  placeholderTextColor="#94A3B8"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>
                  IFSC / Swift / Branch Code
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. NBLNPKTM"
                  placeholderTextColor="#94A3B8"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>
                  UPI / eSewa / Khalti ID
                </Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. 98XXXXXXXX@esewa or partner@upi"
                  placeholderTextColor="#94A3B8"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveBankDetails}
                disabled={savingBank}
                activeOpacity={0.85}
              >
                {savingBank ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnRowCenter}>
                    <Feather
                      name="check-circle"
                      size={scale(18)}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalSubmitBtnText}>
                      Save Bank & Wallet
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  avatarWrapper: {
    position: "relative",
  },
  avatarImage: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(31),
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarBox: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(31),
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarLetter: {
    fontSize: moderateScale(24),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  avatarUploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scale(31),
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profilePhone: {
    fontSize: moderateScale(12),
    color: "#CCFBF1",
    marginTop: moderateScale(1),
  },
  changePhotoTextBtn: {
    marginTop: moderateScale(2),
  },
  changePhotoText: {
    fontSize: moderateScale(10),
    color: "#99F6E4",
    textDecorationLine: "underline",
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
    backgroundColor: "#10B981",
  },
  approvalBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  approvalBadgeTextApproved: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(140),
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(16),
    marginBottom: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bankCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(16),
    marginBottom: moderateScale(14),
    borderWidth: 1.5,
    borderColor: "#CCFBF1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  bankIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  editBankBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    gap: scale(4),
  },
  editBankBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F766E",
  },
  bankDetailsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: moderateScale(8),
  },
  cardHeaderTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  cardHeaderSubtitle: {
    fontSize: moderateScale(10),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(7),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "500",
  },
  infoVal: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionHeaderRow: {
    marginBottom: moderateScale(12),
    marginTop: moderateScale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  docHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  docIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#0F172A",
  },
  docNumber: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(1),
  },
  cloudinaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: moderateScale(3),
  },
  cloudinaryBadgeText: {
    fontSize: moderateScale(9),
    color: "#059669",
    fontWeight: "700",
  },
  docStatusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  docStatusVerified: {
    backgroundColor: "#D1FAE5",
  },
  docStatusRejected: {
    backgroundColor: "#FEE2E2",
  },
  docStatusText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    color: "#B45309",
  },
  docStatusVerifiedText: {
    color: "#065F46",
  },
  docStatusRejectedText: {
    color: "#DC2626",
  },
  rejectionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: scale(8),
    padding: scale(8),
    marginTop: moderateScale(8),
    gap: scale(6),
  },
  rejectionText: {
    fontSize: moderateScale(10),
    color: "#DC2626",
    flex: 1,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
    borderRadius: scale(8),
    paddingVertical: moderateScale(9),
    marginTop: moderateScale(10),
    gap: scale(6),
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  uploadBtnVerified: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  uploadBtnText: {
    fontSize: moderateScale(12),
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
    backgroundColor: "#FEE2E2",
    borderRadius: scale(12),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(10),
    gap: scale(8),
  },
  logoutBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#DC2626",
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
    padding: scale(20),
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  photoPickerSub: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginBottom: moderateScale(16),
  },
  photoOptionsContainer: {
    flexDirection: "row",
    gap: scale(14),
    marginBottom: moderateScale(16),
  },
  photoOptionBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  photoOptionIconBox: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(8),
  },
  photoOptionLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  modalInputGroup: {
    marginBottom: moderateScale(14),
  },
  modalInputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#475569",
    marginBottom: moderateScale(6),
  },
  modalTextInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(13),
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  docPickerButtonsRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: moderateScale(12),
  },
  docPickerSmallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
    borderRadius: scale(10),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: "#99F6E4",
    gap: scale(6),
  },
  docPickerSmallBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0F766E",
  },
  docPreviewContainer: {
    position: "relative",
    height: moderateScale(130),
    borderRadius: scale(10),
    overflow: "hidden",
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  docPreviewImage: {
    width: "100%",
    height: "100%",
  },
  removeDocPhotoBtn: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    backgroundColor: "rgba(220, 38, 38, 0.85)",
    padding: scale(6),
    borderRadius: scale(14),
  },
  currentPhotoText: {
    position: "absolute",
    bottom: scale(6),
    left: scale(8),
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(4),
  },
  modalSubmitBtn: {
    backgroundColor: "#0F766E",
    paddingVertical: moderateScale(13),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(8),
    marginBottom: moderateScale(16),
  },
  btnRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  modalSubmitBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
