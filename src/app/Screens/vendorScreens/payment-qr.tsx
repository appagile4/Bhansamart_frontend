import VendorHeader from "@/components/VendorComponent/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPaymentQr,
  updatePaymentQr,
} from "@/store/slices/vendorFinanceSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorPaymentQrScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { paymentQr, qrLoading, unreadCount } = useAppSelector(
    (state) => state.vendorFinance
  );
  const { vendorDetails } = useAppSelector((state) => state.vendorAuth);

  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [acceptQr, setAcceptQr] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentQr());
  }, [dispatch]);

  useEffect(() => {
    if (paymentQr) {
      setUpiId(paymentQr.upiId || "");
      setAccountName(paymentQr.accountName || vendorDetails?.businessDetails?.businessName || "");
      setAcceptQr(Boolean(paymentQr.acceptQrPayments));
    }
  }, [paymentQr, vendorDetails]);

  const handleSaveSettings = async () => {
    if (acceptQr && !upiId.trim() && !paymentQr.qrCodeUrl) {
      Alert.alert(
        "UPI ID Required",
        "Please enter your Store UPI ID or upload a QR Code to enable QR payments."
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
        })
      ).unwrap();

      Alert.alert(
        "Settings Saved",
        "Payment QR Code and UPI configuration updated successfully."
      );
    } catch (err: any) {
      Alert.alert("Save Failed", err || "Failed to update QR settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Unified Vendor Header */}
      <VendorHeader
        title="Payment QR Code"
        subtitle="Customer Digital Checkout"
        unreadCount={unreadCount}
      />

      {/* Back Button & Screen Title Row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: scale(16), paddingTop: scale(10), gap: scale(8) }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{ paddingRight: scale(4) }}
          accessibilityLabel="Go Back"
        >
          <Feather name="arrow-left" size={scale(20)} color="#016073" />
        </TouchableOpacity>
        <Text style={{ fontSize: moderateScale(15), fontWeight: "800", color: "#0F172A" }}>
          Store Payment QR & UPI
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Info */}
        <View style={styles.banner}>
          <MaterialCommunityIcons name="qrcode-scan" size={scale(24)} color="#016073" />
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <Text style={styles.bannerTitle}>Store Payment QR & UPI</Text>
            <Text style={styles.bannerSub}>
              Customers can scan your payment QR or pay directly to your verified UPI ID during checkout or delivery.
            </Text>
          </View>
        </View>

        {/* Enable QR Switch */}
        <View style={styles.switchCard}>
          <View style={{ flex: 1, marginRight: scale(10) }}>
            <Text style={styles.switchLabel}>Accept QR & UPI Payments</Text>
            <Text style={styles.switchSub}>
              When enabled, your QR code will be presented to customers choosing digital payment.
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
          <Text style={styles.cardHeading}>QR Code Preview</Text>

          <View style={styles.qrBox}>
            {paymentQr?.qrCodeUrl ? (
              <Image
                source={{ uri: paymentQr.qrCodeUrl }}
                style={styles.qrImage}
                contentFit="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <MaterialCommunityIcons name="qrcode" size={scale(80)} color="#CBD5E1" />
                <Text style={styles.qrPlaceholderText}>No QR Code Uploaded</Text>
              </View>
            )}
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
            disabled={saving}
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
  cardHeading: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
    alignSelf: "flex-start",
    marginBottom: scale(10),
  },
  qrBox: {
    width: scale(180),
    height: scale(180),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: scale(6),
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrPlaceholder: {
    alignItems: "center",
    gap: scale(6),
  },
  qrPlaceholderText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
  },
  activeUpiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(10),
    backgroundColor: "#F0FDF4",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
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
