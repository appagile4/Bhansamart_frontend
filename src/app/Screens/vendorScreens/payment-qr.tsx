import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPaymentQr,
  removePaymentQrImageAction,
  updatePaymentQr,
  uploadPaymentQrImageAction,
} from "@/store/slices/vendorFinanceSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorPaymentQrScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paymentQr, qrLoading } = useAppSelector(
    (state) => state.vendorFinance,
  );
  const { vendorDetails } = useAppSelector((state) => state.vendorAuth);

  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [acceptQr, setAcceptQr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentQr());
  }, [dispatch]);

  useEffect(() => {
    if (paymentQr) {
      setUpiId(paymentQr.upiId || "");
      setAccountName(
        paymentQr.accountName ||
          vendorDetails?.businessDetails?.businessName ||
          "",
      );
      setAcceptQr(Boolean(paymentQr.acceptQrPayments));
    }
  }, [paymentQr, vendorDetails]);

  // Handle Photo Picker (Gallery or Camera)
  const handlePickQrImage = async (fromCamera: boolean = false) => {
    try {
      if (fromCamera) {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Camera Access Needed",
            "Please allow camera access in your settings to photograph your payment QR code.",
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          await performQrUpload(result.assets[0].uri);
        }
      } else {
        const { granted } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Gallery Access Needed",
            "Please allow photo gallery access in your settings to select your payment QR code.",
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          await performQrUpload(result.assets[0].uri);
        }
      }
    } catch (err: any) {
      Alert.alert("Picker Error", err?.message || "Failed to select QR image.");
    }
  };

  // Upload to Cloudinary via backend endpoint
  const performQrUpload = async (imageUri: string) => {
    try {
      setUploading(true);
      await dispatch(uploadPaymentQrImageAction(imageUri)).unwrap();
      Alert.alert(
        "Upload Successful",
        "Your payment QR code has been uploaded to Cloudinary and saved to MongoDB!",
      );
      // Automatically enable QR acceptance if uploaded
      setAcceptQr(true);
    } catch (err: any) {
      Alert.alert(
        "Upload Failed",
        typeof err === "string" ? err : "Failed to upload QR code to Cloudinary.",
      );
    } finally {
      setUploading(false);
    }
  };

  // Remove QR Code
  const handleRemoveQr = () => {
    Alert.alert(
      "Remove QR Code",
      "Are you sure you want to remove your uploaded store QR code?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setUploading(true);
              await dispatch(removePaymentQrImageAction()).unwrap();
              Alert.alert("Removed", "Payment QR Code removed successfully.");
            } catch (err: any) {
              Alert.alert("Failed", err || "Could not remove QR Code.");
            } finally {
              setUploading(false);
            }
          },
        },
      ],
    );
  };

  // Open Options Sheet
  const handleOpenPhotoOptions = () => {
    Alert.alert(
      "Upload Store Payment QR",
      "Select an option to upload your UPI / Store payment QR code:",
      [
        {
          text: "Choose from Gallery",
          onPress: () => handlePickQrImage(false),
        },
        {
          text: "Take Photo with Camera",
          onPress: () => handlePickQrImage(true),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  const handleSaveSettings = async () => {
    if (acceptQr && !upiId.trim() && !paymentQr?.qrCodeUrl) {
      Alert.alert(
        "Payment Details Required",
        "Please enter your Store UPI ID or upload a QR Code to enable QR payments.",
      );
      return;
    }

    try {
      setSaving(true);
      await dispatch(
        updatePaymentQr({
          upiId: upiId.trim(),
          accountName: accountName.trim(),
          acceptQrPayments: acceptQr,
        }),
      ).unwrap();

      Alert.alert(
        "Settings Saved",
        "Payment QR Code and UPI configuration updated successfully.",
      );
    } catch (err: any) {
      Alert.alert("Save Failed", err || "Failed to update QR settings.");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = uploading || qrLoading;

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
          Store Payment QR & UPI
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Info */}
        <View style={styles.banner}>
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={scale(24)}
            color="#016073"
          />
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <Text style={styles.bannerTitle}>Store Payment QR & UPI</Text>
            <Text style={styles.bannerSub}>
              Customers can scan your payment QR or pay directly to your
              verified UPI ID during checkout or delivery.
            </Text>
          </View>
        </View>

        {/* Enable QR Switch */}
        <View style={styles.switchCard}>
          <View style={{ flex: 1, marginRight: scale(10) }}>
            <Text style={styles.switchLabel}>Accept QR & UPI Payments</Text>
            <Text style={styles.switchSub}>
              When enabled, your QR code will be presented to customers choosing
              digital payment.
            </Text>
          </View>
          <Switch
            value={acceptQr}
            onValueChange={setAcceptQr}
            trackColor={{ false: "#CBD5E1", true: "#86C4CB" }}
            thumbColor={acceptQr ? "#016073" : "#FFFFFF"}
          />
        </View>

        {/* QR Code Display Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrCardHeaderRow}>
            <View>
              <Text style={styles.cardHeading}>Store QR Code</Text>
              <Text style={styles.cardSubHeading}>
                Stored in MongoDB & hosted on Cloudinary
              </Text>
            </View>

            {paymentQr?.qrCodeUrl ? (
              <View style={styles.cloudBadge}>
                <Ionicons name="cloud-done" size={scale(13)} color="#059669" />
                <Text style={styles.cloudBadgeText}>Cloudinary Verified</Text>
              </View>
            ) : null}
          </View>

          {/* QR Box with Loading Overlay */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenPhotoOptions}
            disabled={isBusy}
            style={styles.qrBox}
          >
            {paymentQr?.qrCodeUrl ? (
              <Image
                source={{ uri: paymentQr.qrCodeUrl }}
                style={styles.qrImage}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <MaterialCommunityIcons
                  name="qrcode-plus"
                  size={scale(70)}
                  color="#CBD5E1"
                />
                <Text style={styles.qrPlaceholderText}>
                  No QR Code Uploaded
                </Text>
                <Text style={styles.qrPlaceholderSub}>
                  Tap to upload from gallery or camera
                </Text>
              </View>
            )}

            {/* Uploading Overlay */}
            {isBusy && (
              <View style={styles.qrLoadingOverlay}>
                <ActivityIndicator size="large" color="#016073" />
                <Text style={styles.qrLoadingText}>
                  Uploading to Cloudinary...
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Action Buttons for QR Image */}
          <View style={styles.qrActionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenPhotoOptions}
              disabled={isBusy}
              style={[
                styles.qrActionBtn,
                styles.uploadQrBtn,
                paymentQr?.qrCodeUrl && styles.changeQrBtn,
              ]}
            >
              <Feather
                name={paymentQr?.qrCodeUrl ? "refresh-cw" : "upload-cloud"}
                size={scale(15)}
                color="#FFFFFF"
              />
              <Text style={styles.uploadQrBtnText}>
                {paymentQr?.qrCodeUrl ? "Change QR Code" : "Upload QR Code"}
              </Text>
            </TouchableOpacity>

            {paymentQr?.qrCodeUrl ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRemoveQr}
                disabled={isBusy}
                style={styles.removeQrBtn}
              >
                <Feather name="trash-2" size={scale(14)} color="#DC2626" />
                <Text style={styles.removeQrBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {paymentQr?.upiId ? (
            <View style={styles.activeUpiRow}>
              <Text style={styles.activeUpiLabel}>Active UPI ID:</Text>
              <Text style={styles.activeUpiVal}>{paymentQr.upiId}</Text>
            </View>
          ) : null}
        </View>

        {/* Configuration Form */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>UPI & Account Details</Text>

          <Text style={styles.inputLabel}>Store UPI ID / VPA</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. yourstore@okhdfcbank or 9800000000@paytm"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Payee / Account Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Bhansa Grocery Store"
            value={accountName}
            onChangeText={setAccountName}
          />

          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.8}
            onPress={handleSaveSettings}
            disabled={saving || isBusy}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check" size={scale(16)} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Payment QR Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: scale(16),
    gap: scale(14),
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F6",
    padding: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#BCE1E6",
  },
  bannerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#016073",
  },
  bannerSub: {
    fontSize: moderateScale(11),
    color: "#475569",
    marginTop: scale(2),
    lineHeight: scale(15),
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  switchLabel: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
  },
  switchSub: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    padding: scale(16),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  qrCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: scale(8),
  },
  cardHeading: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  cardSubHeading: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(1),
  },
  cloudBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#ECFDF5",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  cloudBadgeText: {
    fontSize: moderateScale(10.5),
    color: "#059669",
    fontWeight: "700",
  },
  qrBox: {
    width: scale(200),
    height: scale(200),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(14),
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: scale(10),
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrPlaceholder: {
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
  },
  qrPlaceholderText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#475569",
  },
  qrPlaceholderSub: {
    fontSize: moderateScale(10.5),
    color: "#94A3B8",
    textAlign: "center",
  },
  qrLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  qrLoadingText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#016073",
  },
  qrActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    marginTop: scale(6),
    width: "100%",
  },
  qrActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8.5),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    gap: scale(6),
  },
  uploadQrBtn: {
    backgroundColor: "#016073",
    flex: 1,
  },
  changeQrBtn: {
    backgroundColor: "#0284C7",
  },
  uploadQrBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  removeQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8.5),
    paddingHorizontal: scale(14),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    gap: scale(4),
  },
  removeQrBtnText: {
    color: "#DC2626",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  activeUpiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(12),
    backgroundColor: "#F0FDF4",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  activeUpiLabel: {
    fontSize: moderateScale(11),
    color: "#16A34A",
    fontWeight: "600",
  },
  activeUpiVal: {
    fontSize: moderateScale(11.5),
    color: "#15803D",
    fontWeight: "800",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    padding: scale(16),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#334155",
    marginTop: scale(8),
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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#016073",
    paddingVertical: scale(11),
    borderRadius: scale(8),
    marginTop: scale(16),
    gap: scale(6),
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
