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
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPlatformPaymentConfig,
  updatePlatformPaymentConfig,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

export default function PlatformBankConfigScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = user?.role === "superadmin";

  const { paymentConfig, loading, actionLoading } = useAppSelector(
    (state) => state.admin
  );

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [upiId, setUpiId] = useState("");

  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxAmount, setCodMaxAmount] = useState("5000");
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [walletEnabled, setWalletEnabled] = useState(true);

  useEffect(() => {
    if (isSuperadmin) {
      dispatch(fetchPlatformPaymentConfig());
    }
  }, [dispatch, isSuperadmin]);

  useEffect(() => {
    if (paymentConfig) {
      const b = paymentConfig.bankDetails || {};
      setBankName(b.bankName || "");
      setAccountNumber(b.accountNumber || "");
      setAccountHolderName(b.accountHolderName || "");
      setIfscCode(b.ifscCode || "");
      setBranchName(b.branchName || "");
      setUpiId(b.upiId || "");

      const pm = paymentConfig.paymentMethods || {};
      setCodEnabled(pm.cod?.isEnabled !== false);
      setCodMaxAmount(pm.cod?.maxOrderAmount ? String(pm.cod.maxOrderAmount) : "5000");
      setRazorpayEnabled(pm.razorpay?.isEnabled !== false);
      setWalletEnabled(pm.wallet?.isEnabled !== false);
    }
  }, [paymentConfig]);

  const handleSaveConfig = async () => {
    if (!bankName || !accountNumber || !ifscCode) {
      Alert.alert("Validation Error", "Bank name, account number, and IFSC code are required.");
      return;
    }

    const payload = {
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branchName: branchName.trim(),
        upiId: upiId.trim(),
      },
      paymentMethods: {
        cod: {
          isEnabled: codEnabled,
          maxOrderAmount: Number(codMaxAmount) || 5000,
        },
        razorpay: {
          isEnabled: razorpayEnabled,
        },
        wallet: {
          isEnabled: walletEnabled,
        },
      },
    };

    try {
      await dispatch(updatePlatformPaymentConfig(payload)).unwrap();
      Alert.alert("Success", "Platform bank & payment gateway configuration saved successfully!");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update configuration");
    }
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (!isSuperadmin) {
    return (
      <View style={[styles.deniedContainer, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name="shield-lock-outline" size={scale(64)} color="#EF4444" />
        <Text style={[styles.deniedTitle, { color: textPrimary }]}>Access Restricted</Text>
        <Text style={[styles.deniedDesc, { color: textSecondary }]}>
          Only Superadmin has authorization to configure platform bank credentials and checkout gateway switches.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader title="Platform Bank" subtitle="Central Treasury & Gateways" showBack />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Banner */}
      <View style={[styles.bannerCard, { backgroundColor: "rgba(16, 185, 129, 0.1)", borderColor: "#10B981" }]}>
        <View style={styles.bannerRow}>
          <MaterialCommunityIcons name="bank" size={scale(24)} color="#10B981" />
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <Text style={styles.bannerTitle}>Superadmin Central Treasury Account</Text>
            <Text style={styles.bannerDesc}>
              These bank credentials receive platform commission revenues and vendor settlement returns.
            </Text>
          </View>
        </View>
      </View>

      {/* Bank Details Card */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="credit-card" size={scale(18)} color="#10B981" />
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Central Bank Account</Text>
        </View>

        <Text style={[styles.inputLabel, { color: textSecondary }]}>Bank Name *</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: border }]}
          placeholder="e.g. HDFC Bank, State Bank of India"
          placeholderTextColor="#94A3B8"
          value={bankName}
          onChangeText={setBankName}
        />

        <Text style={[styles.inputLabel, { color: textSecondary }]}>Account Holder Name *</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: border }]}
          placeholder="e.g. BhansaMart Private Limited"
          placeholderTextColor="#94A3B8"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
        />

        <Text style={[styles.inputLabel, { color: textSecondary }]}>Account Number *</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: border }]}
          placeholder="e.g. 50200012345678"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: scale(8) }}>
            <Text style={[styles.inputLabel, { color: textSecondary }]}>IFSC Code *</Text>
            <TextInput
              style={[styles.input, { color: textPrimary, borderColor: border }]}
              placeholder="e.g. HDFC0001234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={ifscCode}
              onChangeText={setIfscCode}
            />
          </View>
          <View style={{ flex: 1, marginLeft: scale(8) }}>
            <Text style={[styles.inputLabel, { color: textSecondary }]}>Branch Name</Text>
            <TextInput
              style={[styles.input, { color: textPrimary, borderColor: border }]}
              placeholder="e.g. Siliguri Main"
              placeholderTextColor="#94A3B8"
              value={branchName}
              onChangeText={setBranchName}
            />
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: textSecondary }]}>Primary Treasury UPI ID</Text>
        <TextInput
          style={[styles.input, { color: textPrimary, borderColor: border }]}
          placeholder="e.g. bhansamart@hdfcbank"
          placeholderTextColor="#94A3B8"
          value={upiId}
          onChangeText={setUpiId}
        />
      </View>

      {/* Checkout Payment Method Switches */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="options-outline" size={scale(18)} color="#10B981" />
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Checkout Payment Gateways</Text>
        </View>

        {/* Razorpay Online */}
        <View style={[styles.switchCard, { borderColor: border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchTitle, { color: textPrimary }]}>Razorpay Online Gateway</Text>
            <Text style={[styles.switchDesc, { color: textSecondary }]}>
              Accept UPI, Cards, Net Banking & Wallets online.
            </Text>
          </View>
          <Switch
            value={razorpayEnabled}
            onValueChange={setRazorpayEnabled}
            trackColor={{ false: "#767577", true: "#10B981" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Cash On Delivery */}
        <View style={[styles.switchCard, { borderColor: border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchTitle, { color: textPrimary }]}>Cash on Delivery (COD)</Text>
            <Text style={[styles.switchDesc, { color: textSecondary }]}>
              Allow customers to pay physical cash or dynamic UPI on delivery.
            </Text>
          </View>
          <Switch
            value={codEnabled}
            onValueChange={setCodEnabled}
            trackColor={{ false: "#767577", true: "#10B981" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {codEnabled && (
          <View style={{ marginTop: scale(8), marginBottom: scale(4) }}>
            <Text style={[styles.inputLabel, { color: textSecondary }]}>Max COD Order Limit (₹)</Text>
            <TextInput
              style={[styles.input, { color: textPrimary, borderColor: border }]}
              placeholder="e.g. 5000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={codMaxAmount}
              onChangeText={setCodMaxAmount}
            />
          </View>
        )}

        {/* Wallet Pay */}
        <View style={[styles.switchCard, { borderColor: border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchTitle, { color: textPrimary }]}>BhansaMart Customer Wallet</Text>
            <Text style={[styles.switchDesc, { color: textSecondary }]}>
              Allow customers to pay from stored wallet / refund credits.
            </Text>
          </View>
          <Switch
            value={walletEnabled}
            onValueChange={setWalletEnabled}
            trackColor={{ false: "#767577", true: "#10B981" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, actionLoading && { opacity: 0.6 }]}
        onPress={handleSaveConfig}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="check-circle" size={scale(18)} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Platform Configuration</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
    gap: scale(14),
    paddingBottom: scale(40),
  },
  bannerCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#10B981",
  },
  bannerDesc: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    marginTop: scale(2),
  },
  sectionCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(16),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: scale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: scale(4),
    marginTop: scale(8),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(13),
  },
  row: {
    flexDirection: "row",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: scale(10),
    padding: scale(12),
    marginTop: scale(10),
  },
  switchTitle: {
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  switchDesc: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  saveButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: scale(10),
    marginTop: scale(10),
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  deniedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(24),
    gap: scale(12),
  },
  deniedTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
  },
  deniedDesc: {
    fontSize: moderateScale(13),
    textAlign: "center",
    lineHeight: scale(18),
  },
});
