import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Image } from "expo-image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPlatformPaymentConfig,
  updatePlatformPaymentConfig,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import AdminHeader from "@/components/AdminHeader";

type ActiveTab = "wallets" | "bank" | "gateways" | "preview";

export default function PlatformBankConfigScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = user?.role === "superadmin" || user?.role === "admin";

  const { paymentConfig, loading, actionLoading } = useAppSelector(
    (state) => state.admin
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("wallets");
  const [refreshing, setRefreshing] = useState(false);

  // 1. Central Treasury Bank Account States
  const [bankName, setBankName] = useState("Nepal Investment Mega Bank");
  const [accountHolderName, setAccountHolderName] = useState("BhansaMart Pvt. Ltd.");
  const [accountNumber, setAccountNumber] = useState("01901020003456");
  const [branchName, setBranchName] = useState("Kathmandu Central");
  const [ifscOrRoutingCode, setIfscOrRoutingCode] = useState("NIMBNPKA");
  const [primaryUpiId, setPrimaryUpiId] = useState("bhansamart@nimbl");
  const [bankQrImageUrl, setBankQrImageUrl] = useState("");
  const [bankInstructions, setBankInstructions] = useState(
    "Transfer order amount and quote your Order Number in the payment reference/remarks."
  );
  const [bankTransferActive, setBankTransferActive] = useState(true);

  // 2. Digital Wallets States
  // eSewa
  const [esewaEnabled, setEsewaEnabled] = useState(true);
  const [esewaId, setEsewaId] = useState("9801234567");
  const [esewaMin, setEsewaMin] = useState("10");
  const [esewaMax, setEsewaMax] = useState("50000");
  const [esewaInstructions, setEsewaInstructions] = useState(
    "Pay instantly via your linked eSewa wallet balance or scan merchant QR code."
  );

  // Khalti
  const [khaltiEnabled, setKhaltiEnabled] = useState(true);
  const [khaltiId, setKhaltiId] = useState("9801234567");
  const [khaltiMin, setKhaltiMin] = useState("10");
  const [khaltiMax, setKhaltiMax] = useState("50000");
  const [khaltiInstructions, setKhaltiInstructions] = useState(
    "Pay securely with your linked Khalti wallet or Khalti MPIN."
  );

  // Fonepay / UPI Direct QR
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [upiMerchantId, setUpiMerchantId] = useState("bhansamart@nimbl");
  const [upiQrImageUrl, setUpiQrImageUrl] = useState("");
  const [upiMin, setUpiMin] = useState("10");
  const [upiMax, setUpiMax] = useState("100000");

  // BhansaMart Customer Wallet
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [walletMax, setWalletMax] = useState("50000");

  // 3. Checkout Gateways & COD
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxAmount, setCodMaxAmount] = useState("10000");
  const [codInstructions, setCodInstructions] = useState(
    "Pay cash or scan rider's dynamic UPI QR code on delivery."
  );

  // Online Cards
  const [cardEnabled, setCardEnabled] = useState(true);
  const [cardMaxAmount, setCardMaxAmount] = useState("100000");

  const loadConfig = () => {
    dispatch(fetchPlatformPaymentConfig());
  };

  useEffect(() => {
    loadConfig();
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPlatformPaymentConfig());
    setRefreshing(false);
  };

  // Synchronize state with loaded paymentConfig
  useEffect(() => {
    if (paymentConfig) {
      // 1. Bank Details
      const b = paymentConfig.bankDetails || {};
      if (b.bankName) setBankName(b.bankName);
      if (b.accountHolderName) setAccountHolderName(b.accountHolderName);
      if (b.accountNumber) setAccountNumber(b.accountNumber);
      if (b.branchName) setBranchName(b.branchName);
      if (b.ifscOrRoutingCode || b.ifscCode)
        setIfscOrRoutingCode(b.ifscOrRoutingCode || b.ifscCode);
      if (b.upiId) setPrimaryUpiId(b.upiId);
      if (b.qrCodeImageUrl) setBankQrImageUrl(b.qrCodeImageUrl);
      if (b.instructions) setBankInstructions(b.instructions);
      if (typeof b.isActive === "boolean") setBankTransferActive(b.isActive);

      // 2. Methods array or legacy object
      const methods: any[] = paymentConfig.enabledPaymentMethods || [];

      // Helper to find by key
      const getMethod = (key: string) => methods.find((m) => m.methodKey === key);

      // COD
      const codM = getMethod("cod");
      if (codM) {
        setCodEnabled(codM.isEnabled !== false);
        setCodMaxAmount(String(codM.maxAmount || 10000));
        if (codM.instructions) setCodInstructions(codM.instructions);
      } else if (paymentConfig.paymentMethods?.cod) {
        setCodEnabled(paymentConfig.paymentMethods.cod.isEnabled !== false);
        setCodMaxAmount(String(paymentConfig.paymentMethods.cod.maxOrderAmount || 10000));
      }

      // eSewa
      const esewaM = getMethod("esewa");
      if (esewaM) {
        setEsewaEnabled(esewaM.isEnabled !== false);
        if (esewaM.accountIdentifier) setEsewaId(esewaM.accountIdentifier);
        setEsewaMin(String(esewaM.minAmount || 10));
        setEsewaMax(String(esewaM.maxAmount || 50000));
        if (esewaM.instructions) setEsewaInstructions(esewaM.instructions);
      }

      // Khalti
      const khaltiM = getMethod("khalti");
      if (khaltiM) {
        setKhaltiEnabled(khaltiM.isEnabled !== false);
        if (khaltiM.accountIdentifier) setKhaltiId(khaltiM.accountIdentifier);
        setKhaltiMin(String(khaltiM.minAmount || 10));
        setKhaltiMax(String(khaltiM.maxAmount || 50000));
        if (khaltiM.instructions) setKhaltiInstructions(khaltiM.instructions);
      }

      // Fonepay / UPI
      const upiM = getMethod("upi");
      if (upiM) {
        setUpiEnabled(upiM.isEnabled !== false);
        if (upiM.accountIdentifier) setUpiMerchantId(upiM.accountIdentifier);
        if (upiM.qrCodeImageUrl) setUpiQrImageUrl(upiM.qrCodeImageUrl);
        setUpiMin(String(upiM.minAmount || 10));
        setUpiMax(String(upiM.maxAmount || 100000));
      }

      // Wallet
      const walletM = getMethod("wallet");
      if (walletM) {
        setWalletEnabled(walletM.isEnabled !== false);
        setWalletMax(String(walletM.maxAmount || 50000));
      } else if (paymentConfig.paymentMethods?.wallet) {
        setWalletEnabled(paymentConfig.paymentMethods.wallet.isEnabled !== false);
      }

      // Card
      const cardM = getMethod("card") || getMethod("razorpay");
      if (cardM) {
        setCardEnabled(cardM.isEnabled !== false);
        setCardMaxAmount(String(cardM.maxAmount || 100000));
      } else if (paymentConfig.paymentMethods?.razorpay) {
        setCardEnabled(paymentConfig.paymentMethods.razorpay.isEnabled !== false);
      }

      // Bank Transfer option
      const btM = getMethod("bank_transfer");
      if (btM) {
        setBankTransferActive(btM.isEnabled !== false);
      }
    }
  }, [paymentConfig]);

  const handleSaveConfig = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
      Alert.alert(
        "Validation Error",
        "Bank Name, Account Holder Name, and Account Number are mandatory for platform treasury operations."
      );
      return;
    }

    const enabledPaymentMethods = [
      {
        methodKey: "cod",
        displayName: "Cash on Delivery (COD)",
        isEnabled: codEnabled,
        minAmount: 0,
        maxAmount: Number(codMaxAmount) || 10000,
        instructions: codInstructions.trim(),
      },
      {
        methodKey: "esewa",
        displayName: "eSewa Mobile Wallet",
        isEnabled: esewaEnabled,
        accountIdentifier: esewaId.trim(),
        minAmount: Number(esewaMin) || 10,
        maxAmount: Number(esewaMax) || 50000,
        instructions: esewaInstructions.trim(),
      },
      {
        methodKey: "khalti",
        displayName: "Khalti Digital Wallet",
        isEnabled: khaltiEnabled,
        accountIdentifier: khaltiId.trim(),
        minAmount: Number(khaltiMin) || 10,
        maxAmount: Number(khaltiMax) || 50000,
        instructions: khaltiInstructions.trim(),
      },
      {
        methodKey: "upi",
        displayName: "Fonepay / UPI Direct QR",
        isEnabled: upiEnabled,
        accountIdentifier: upiMerchantId.trim(),
        qrCodeImageUrl: upiQrImageUrl.trim(),
        minAmount: Number(upiMin) || 10,
        maxAmount: Number(upiMax) || 100000,
        instructions: "Scan merchant QR code with any mobile banking app.",
      },
      {
        methodKey: "wallet",
        displayName: "BhansaMart Wallet Balance",
        isEnabled: walletEnabled,
        minAmount: 0,
        maxAmount: Number(walletMax) || 50000,
        instructions: "Use your platform wallet credits and referral cash rewards.",
      },
      {
        methodKey: "card",
        displayName: "Credit / Debit Card",
        isEnabled: cardEnabled,
        minAmount: 10,
        maxAmount: Number(cardMaxAmount) || 100000,
        instructions: "Pay online via Visa, MasterCard or SCT debit cards.",
      },
      {
        methodKey: "bank_transfer",
        displayName: "Direct Bank Transfer",
        isEnabled: bankTransferActive,
        accountIdentifier: accountNumber.trim(),
        minAmount: 100,
        maxAmount: 500000,
        instructions: bankInstructions.trim(),
      },
    ];

    const payload = {
      bankDetails: {
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        branchName: branchName.trim(),
        ifscOrRoutingCode: ifscOrRoutingCode.trim().toUpperCase(),
        upiId: primaryUpiId.trim(),
        qrCodeImageUrl: bankQrImageUrl.trim(),
        instructions: bankInstructions.trim(),
        isActive: bankTransferActive,
      },
      enabledPaymentMethods,
      // Legacy compat object for any old consumer
      paymentMethods: {
        cod: {
          isEnabled: codEnabled,
          maxOrderAmount: Number(codMaxAmount) || 10000,
        },
        razorpay: {
          isEnabled: cardEnabled,
        },
        wallet: {
          isEnabled: walletEnabled,
        },
      },
    };

    try {
      await dispatch(updatePlatformPaymentConfig(payload)).unwrap();
      Alert.alert(
        "Configuration Published",
        "Bank details, digital wallets, and checkout gateways are now live and synchronized with the Customer Checkout page!"
      );
    } catch (err: any) {
      Alert.alert(
        "Save Failed",
        err?.response?.data?.message || err?.message || "Failed to update configuration"
      );
    }
  };

  const activeMethodsCount = useMemo(() => {
    let count = 0;
    if (codEnabled) count++;
    if (esewaEnabled) count++;
    if (khaltiEnabled) count++;
    if (upiEnabled) count++;
    if (walletEnabled) count++;
    if (cardEnabled) count++;
    if (bankTransferActive) count++;
    return count;
  }, [
    codEnabled,
    esewaEnabled,
    khaltiEnabled,
    upiEnabled,
    walletEnabled,
    cardEnabled,
    bankTransferActive,
  ]);

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  if (!isSuperadmin) {
    return (
      <View style={[styles.deniedContainer, { backgroundColor: bg }]}>
        <AdminHeader title="Platform Treasury" subtitle="Access Restricted" showBack />
        <View style={styles.deniedBox}>
          <View style={styles.deniedIconWrap}>
            <MaterialCommunityIcons name="shield-lock-outline" size={scale(48)} color="#EF4444" />
          </View>
          <Text style={[styles.deniedTitle, { color: textPrimary }]}>Superadmin Restricted</Text>
          <Text style={[styles.deniedDesc, { color: textSecondary }]}>
            Only platform Superadmins can configure receiving bank credentials, checkout digital wallets, and payment gateways.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AdminHeader
        title="Platform Bank & Wallets"
        subtitle="Customer Checkout Payment Gateways"
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: bg }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loading}
              onRefresh={onRefresh}
              tintColor="#10B981"
              colors={["#10B981"]}
            />
          }
        >
          {/* Live Sync Banner */}
          <View
            style={[
              styles.syncBanner,
              { backgroundColor: isDark ? "#0F281E" : "#ECFDF5", borderColor: "#10B981" },
            ]}
          >
            <View style={styles.syncPulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.syncBannerTitle}>
                Directly Synchronized with Customer Checkout
              </Text>
              <Text style={styles.syncBannerDesc}>
                Any bank or wallet toggled ON below will instantly appear on the customer checkout page ({activeMethodsCount} methods active).
              </Text>
            </View>
          </View>

          {/* Top Segmented Navigation */}
          <View style={[styles.segmentBar, { backgroundColor: cardBg, borderColor: border }]}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "wallets" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("wallets")}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={scale(16)}
                color={activeTab === "wallets" ? "#10B981" : textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === "wallets" ? "#10B981" : textSecondary },
                ]}
              >
                Wallets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "bank" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("bank")}
            >
              <MaterialCommunityIcons
                name="bank-outline"
                size={scale(16)}
                color={activeTab === "bank" ? "#10B981" : textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === "bank" ? "#10B981" : textSecondary },
                ]}
              >
                Bank
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "gateways" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("gateways")}
            >
              <Feather
                name="credit-card"
                size={scale(15)}
                color={activeTab === "gateways" ? "#10B981" : textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === "gateways" ? "#10B981" : textSecondary },
                ]}
              >
                Gateways
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === "preview" && styles.segmentBtnActive]}
              onPress={() => setActiveTab("preview")}
            >
              <Feather
                name="eye"
                size={scale(15)}
                color={activeTab === "preview" ? "#10B981" : textSecondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === "preview" ? "#10B981" : textSecondary },
                ]}
              >
                Preview
              </Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════ TAB 1: DIGITAL WALLETS ══════════════ */}
          {activeTab === "wallets" && (
            <View style={styles.tabContent}>
              {/* eSewa Wallet Card */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(34, 197, 94, 0.12)" }]}>
                    <MaterialCommunityIcons name="wallet" size={scale(20)} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      eSewa Mobile Wallet
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Nepal's premier digital wallet integration
                    </Text>
                  </View>
                  <Switch
                    value={esewaEnabled}
                    onValueChange={setEsewaEnabled}
                    trackColor={{ false: "#64748B", true: "#22C55E" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {esewaEnabled ? (
                  <View style={styles.formBody}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      eSewa Merchant ID / Receiving Mobile *
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="e.g. 9801234567 or BHANSA_MART"
                      placeholderTextColor="#94A3B8"
                      value={esewaId}
                      onChangeText={setEsewaId}
                    />

                    <View style={styles.dualRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textSecondary }]}>
                          Min Order (Rs.)
                        </Text>
                        <TextInput
                          style={[styles.input, { color: textPrimary, borderColor: border }]}
                          placeholder="10"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={esewaMin}
                          onChangeText={setEsewaMin}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: scale(10) }}>
                        <Text style={[styles.inputLabel, { color: textSecondary }]}>
                          Max Order (Rs.)
                        </Text>
                        <TextInput
                          style={[styles.input, { color: textPrimary, borderColor: border }]}
                          placeholder="50000"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={esewaMax}
                          onChangeText={setEsewaMax}
                        />
                      </View>
                    </View>

                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Instructions for Customer
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="Instructions shown on checkout"
                      placeholderTextColor="#94A3B8"
                      value={esewaInstructions}
                      onChangeText={setEsewaInstructions}
                    />
                  </View>
                ) : (
                  <Text style={[styles.disabledHint, { color: textSecondary }]}>
                    eSewa is currently hidden from customer checkout options.
                  </Text>
                )}
              </View>

              {/* Khalti Wallet Card */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
                    <MaterialCommunityIcons name="wallet-membership" size={scale(20)} color="#A855F7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Khalti Digital Wallet
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Fast digital payments with instant SMS OTP
                    </Text>
                  </View>
                  <Switch
                    value={khaltiEnabled}
                    onValueChange={setKhaltiEnabled}
                    trackColor={{ false: "#64748B", true: "#A855F7" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {khaltiEnabled ? (
                  <View style={styles.formBody}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Khalti Merchant ID / Phone Number *
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="e.g. 9801234567 or KHALTI_MERCHANT_KEY"
                      placeholderTextColor="#94A3B8"
                      value={khaltiId}
                      onChangeText={setKhaltiId}
                    />

                    <View style={styles.dualRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textSecondary }]}>
                          Min Order (Rs.)
                        </Text>
                        <TextInput
                          style={[styles.input, { color: textPrimary, borderColor: border }]}
                          placeholder="10"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={khaltiMin}
                          onChangeText={setKhaltiMin}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: scale(10) }}>
                        <Text style={[styles.inputLabel, { color: textSecondary }]}>
                          Max Order (Rs.)
                        </Text>
                        <TextInput
                          style={[styles.input, { color: textPrimary, borderColor: border }]}
                          placeholder="50000"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={khaltiMax}
                          onChangeText={setKhaltiMax}
                        />
                      </View>
                    </View>

                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Instructions for Customer
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="Instructions shown on checkout"
                      placeholderTextColor="#94A3B8"
                      value={khaltiInstructions}
                      onChangeText={setKhaltiInstructions}
                    />
                  </View>
                ) : (
                  <Text style={[styles.disabledHint, { color: textSecondary }]}>
                    Khalti is currently hidden from customer checkout options.
                  </Text>
                )}
              </View>

              {/* Fonepay / UPI QR Direct */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                    <MaterialCommunityIcons name="qrcode-scan" size={scale(20)} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Fonepay / UPI Merchant QR
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Universal QR code for all mobile banking apps
                    </Text>
                  </View>
                  <Switch
                    value={upiEnabled}
                    onValueChange={setUpiEnabled}
                    trackColor={{ false: "#64748B", true: "#0284C7" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {upiEnabled ? (
                  <View style={styles.formBody}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Merchant VPA / UPI ID *
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="e.g. bhansamart@nimbl"
                      placeholderTextColor="#94A3B8"
                      value={upiMerchantId}
                      onChangeText={setUpiMerchantId}
                    />

                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Merchant QR Code Image URL
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="https://.../fonepay-qr.png"
                      placeholderTextColor="#94A3B8"
                      value={upiQrImageUrl}
                      onChangeText={setUpiQrImageUrl}
                    />

                    {upiQrImageUrl ? (
                      <View style={styles.qrPreviewBox}>
                        <Image
                          source={{ uri: upiQrImageUrl }}
                          style={styles.qrImage}
                          contentFit="contain"
                        />
                        <Text style={[styles.qrPreviewLabel, { color: textSecondary }]}>
                          Preview: Customer Scan & Pay QR
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <Text style={[styles.disabledHint, { color: textSecondary }]}>
                    Universal QR Pay is currently disabled.
                  </Text>
                )}
              </View>

              {/* BhansaMart Customer Wallet */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                    <MaterialCommunityIcons name="cash-fast" size={scale(20)} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      BhansaMart Store Wallet
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Allow customers to spend store credits and cashback
                    </Text>
                  </View>
                  <Switch
                    value={walletEnabled}
                    onValueChange={setWalletEnabled}
                    trackColor={{ false: "#64748B", true: "#F59E0B" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <Text style={[styles.disabledHint, { color: textSecondary }]}>
                  {walletEnabled
                    ? "Active on checkout: Customers with positive wallet balance will see a 1-tap checkout option."
                    : "Store wallet payment is disabled for customers."}
                </Text>
              </View>
            </View>
          )}

          {/* ══════════════ TAB 2: CENTRAL TREASURY BANK ACCOUNT ══════════════ */}
          {activeTab === "bank" && (
            <View style={styles.tabContent}>
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                    <MaterialCommunityIcons name="bank" size={scale(20)} color="#10B981" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Central Treasury Bank Account
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Direct customer bank deposits and vendor commissions
                    </Text>
                  </View>
                  <Switch
                    value={bankTransferActive}
                    onValueChange={setBankTransferActive}
                    trackColor={{ false: "#64748B", true: "#10B981" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.formBody}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>Bank Name *</Text>
                  <TextInput
                    style={[styles.input, { color: textPrimary, borderColor: border }]}
                    placeholder="e.g. Nepal Investment Mega Bank or Nabil Bank"
                    placeholderTextColor="#94A3B8"
                    value={bankName}
                    onChangeText={setBankName}
                  />

                  <Text style={[styles.inputLabel, { color: textSecondary }]}>
                    Account Holder Name *
                  </Text>
                  <TextInput
                    style={[styles.input, { color: textPrimary, borderColor: border }]}
                    placeholder="e.g. BhansaMart Logistics Pvt. Ltd."
                    placeholderTextColor="#94A3B8"
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                  />

                  <Text style={[styles.inputLabel, { color: textSecondary }]}>
                    Account Number *
                  </Text>
                  <TextInput
                    style={[styles.input, { color: textPrimary, borderColor: border }]}
                    placeholder="e.g. 01901020003456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />

                  <View style={styles.dualRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: textSecondary }]}>
                        Branch Name
                      </Text>
                      <TextInput
                        style={[styles.input, { color: textPrimary, borderColor: border }]}
                        placeholder="Kathmandu Central"
                        placeholderTextColor="#94A3B8"
                        value={branchName}
                        onChangeText={setBranchName}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.inputLabel, { color: textSecondary }]}>
                        SWIFT / IFSC Code
                      </Text>
                      <TextInput
                        style={[styles.input, { color: textPrimary, borderColor: border }]}
                        placeholder="NIMBNPKA"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        value={ifscOrRoutingCode}
                        onChangeText={setIfscOrRoutingCode}
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { color: textSecondary }]}>
                    Treasury UPI / VPA ID
                  </Text>
                  <TextInput
                    style={[styles.input, { color: textPrimary, borderColor: border }]}
                    placeholder="e.g. bhansamart@nimbl"
                    placeholderTextColor="#94A3B8"
                    value={primaryUpiId}
                    onChangeText={setPrimaryUpiId}
                  />

                  <Text style={[styles.inputLabel, { color: textSecondary }]}>
                    Official Bank QR Code URL
                  </Text>
                  <TextInput
                    style={[styles.input, { color: textPrimary, borderColor: border }]}
                    placeholder="https://.../bank-qr.png"
                    placeholderTextColor="#94A3B8"
                    value={bankQrImageUrl}
                    onChangeText={setBankQrImageUrl}
                  />

                  {bankQrImageUrl ? (
                    <View style={styles.qrPreviewBox}>
                      <Image
                        source={{ uri: bankQrImageUrl }}
                        style={styles.qrImage}
                        contentFit="contain"
                      />
                      <Text style={[styles.qrPreviewLabel, { color: textSecondary }]}>
                        Bank Deposit QR Code Preview
                      </Text>
                    </View>
                  ) : null}

                  <Text style={[styles.inputLabel, { color: textSecondary }]}>
                    Customer Transfer Instructions
                  </Text>
                  <TextInput
                    style={[styles.textArea, { color: textPrimary, borderColor: border }]}
                    placeholder="Include instructions on quoting Order ID during transfer..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={bankInstructions}
                    onChangeText={setBankInstructions}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ══════════════ TAB 3: GATEWAYS & COD ══════════════ */}
          {activeTab === "gateways" && (
            <View style={styles.tabContent}>
              {/* Cash On Delivery (COD) */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={scale(20)} color="#10B981" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Cash on Delivery (COD)
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Physical cash or rider dynamic QR at doorstep
                    </Text>
                  </View>
                  <Switch
                    value={codEnabled}
                    onValueChange={setCodEnabled}
                    trackColor={{ false: "#64748B", true: "#10B981" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {codEnabled ? (
                  <View style={styles.formBody}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Maximum COD Order Limit (Rs.) *
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="e.g. 10000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={codMaxAmount}
                      onChangeText={setCodMaxAmount}
                    />
                    <Text style={[styles.fieldNote, { color: textSecondary }]}>
                      Orders exceeding this amount will automatically have COD disabled on checkout.
                    </Text>

                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Rider & Customer Instructions
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="Instructions shown on order confirmation"
                      placeholderTextColor="#94A3B8"
                      value={codInstructions}
                      onChangeText={setCodInstructions}
                    />
                  </View>
                ) : (
                  <Text style={[styles.disabledHint, { color: textSecondary }]}>
                    COD is disabled. Customers must pay online before orders are placed.
                  </Text>
                )}
              </View>

              {/* Online Credit / Debit Cards */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconWrap, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                    <Feather name="credit-card" size={scale(20)} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: scale(10) }}>
                    <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                      Online Card Gateway
                    </Text>
                    <Text style={[styles.sectionSub, { color: textSecondary }]}>
                      Visa, MasterCard, SCT debit & credit card payments
                    </Text>
                  </View>
                  <Switch
                    value={cardEnabled}
                    onValueChange={setCardEnabled}
                    trackColor={{ false: "#64748B", true: "#0284C7" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {cardEnabled ? (
                  <View style={styles.formBody}>
                    <Text style={[styles.inputLabel, { color: textSecondary }]}>
                      Maximum Card Transaction Limit (Rs.)
                    </Text>
                    <TextInput
                      style={[styles.input, { color: textPrimary, borderColor: border }]}
                      placeholder="100000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={cardMaxAmount}
                      onChangeText={setCardMaxAmount}
                    />
                  </View>
                ) : (
                  <Text style={[styles.disabledHint, { color: textSecondary }]}>
                    Online card payments are currently disabled on checkout.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ══════════════ TAB 4: CHECKOUT LIVE PREVIEW ══════════════ */}
          {activeTab === "preview" && (
            <View style={styles.tabContent}>
              <View style={[styles.previewContainer, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.previewHeader}>
                  <Feather name="smartphone" size={scale(18)} color="#10B981" />
                  <Text style={[styles.previewTitle, { color: textPrimary }]}>
                    Customer Checkout Screen Preview
                  </Text>
                </View>
                <Text style={[styles.previewDesc, { color: textSecondary }]}>
                  This is exactly how payment options appear to customers on the checkout page:
                </Text>

                <View style={styles.previewMethodsList}>
                  {/* COD */}
                  <View
                    style={[
                      styles.previewItem,
                      { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                      !codEnabled && styles.previewItemDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="cash-multiple"
                      size={scale(20)}
                      color={codEnabled ? "#10B981" : "#94A3B8"}
                    />
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.previewItemTitle, { color: textPrimary }]}>
                        Cash on Delivery (COD)
                      </Text>
                      <Text style={[styles.previewItemSub, { color: textSecondary }]}>
                        {codEnabled
                          ? `Pay on delivery up to Rs. ${Number(codMaxAmount).toLocaleString("en-IN")}`
                          : "Disabled by platform admin"}
                      </Text>
                    </View>
                    <Ionicons
                      name={codEnabled ? "checkmark-circle" : "close-circle"}
                      size={scale(18)}
                      color={codEnabled ? "#10B981" : "#94A3B8"}
                    />
                  </View>

                  {/* eSewa */}
                  <View
                    style={[
                      styles.previewItem,
                      { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                      !esewaEnabled && styles.previewItemDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="wallet"
                      size={scale(20)}
                      color={esewaEnabled ? "#22C55E" : "#94A3B8"}
                    />
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.previewItemTitle, { color: textPrimary }]}>
                        eSewa Mobile Wallet
                      </Text>
                      <Text style={[styles.previewItemSub, { color: textSecondary }]}>
                        {esewaEnabled
                          ? `Merchant ID: ${esewaId || "Active"}`
                          : "Disabled by platform admin"}
                      </Text>
                    </View>
                    <Ionicons
                      name={esewaEnabled ? "checkmark-circle" : "close-circle"}
                      size={scale(18)}
                      color={esewaEnabled ? "#22C55E" : "#94A3B8"}
                    />
                  </View>

                  {/* Khalti */}
                  <View
                    style={[
                      styles.previewItem,
                      { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                      !khaltiEnabled && styles.previewItemDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="wallet-membership"
                      size={scale(20)}
                      color={khaltiEnabled ? "#A855F7" : "#94A3B8"}
                    />
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.previewItemTitle, { color: textPrimary }]}>
                        Khalti Digital Wallet
                      </Text>
                      <Text style={[styles.previewItemSub, { color: textSecondary }]}>
                        {khaltiEnabled
                          ? `Account: ${khaltiId || "Active"}`
                          : "Disabled by platform admin"}
                      </Text>
                    </View>
                    <Ionicons
                      name={khaltiEnabled ? "checkmark-circle" : "close-circle"}
                      size={scale(18)}
                      color={khaltiEnabled ? "#A855F7" : "#94A3B8"}
                    />
                  </View>

                  {/* UPI / Fonepay */}
                  <View
                    style={[
                      styles.previewItem,
                      { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                      !upiEnabled && styles.previewItemDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="qrcode-scan"
                      size={scale(20)}
                      color={upiEnabled ? "#0284C7" : "#94A3B8"}
                    />
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.previewItemTitle, { color: textPrimary }]}>
                        Fonepay / Universal QR
                      </Text>
                      <Text style={[styles.previewItemSub, { color: textSecondary }]}>
                        {upiEnabled
                          ? `Merchant VPA: ${upiMerchantId || "Active"}`
                          : "Disabled by platform admin"}
                      </Text>
                    </View>
                    <Ionicons
                      name={upiEnabled ? "checkmark-circle" : "close-circle"}
                      size={scale(18)}
                      color={upiEnabled ? "#0284C7" : "#94A3B8"}
                    />
                  </View>

                  {/* Store Wallet */}
                  <View
                    style={[
                      styles.previewItem,
                      { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                      !walletEnabled && styles.previewItemDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="cash-fast"
                      size={scale(20)}
                      color={walletEnabled ? "#F59E0B" : "#94A3B8"}
                    />
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.previewItemTitle, { color: textPrimary }]}>
                        BhansaMart Customer Wallet
                      </Text>
                      <Text style={[styles.previewItemSub, { color: textSecondary }]}>
                        {walletEnabled ? "1-tap wallet deduction" : "Disabled by platform admin"}
                      </Text>
                    </View>
                    <Ionicons
                      name={walletEnabled ? "checkmark-circle" : "close-circle"}
                      size={scale(18)}
                      color={walletEnabled ? "#F59E0B" : "#94A3B8"}
                    />
                  </View>

                  {/* Direct Bank Transfer */}
                  <View
                    style={[
                      styles.previewItem,
                      { backgroundColor: isDark ? "#10161C" : "#F8FAFC", borderColor: border },
                      !bankTransferActive && styles.previewItemDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="bank"
                      size={scale(20)}
                      color={bankTransferActive ? "#10B981" : "#94A3B8"}
                    />
                    <View style={{ flex: 1, marginLeft: scale(10) }}>
                      <Text style={[styles.previewItemTitle, { color: textPrimary }]}>
                        Direct Bank Deposit ({bankName || "Treasury"})
                      </Text>
                      <Text style={[styles.previewItemSub, { color: textSecondary }]}>
                        {bankTransferActive
                          ? `A/C: ${accountNumber} • ${accountHolderName}`
                          : "Disabled by platform admin"}
                      </Text>
                    </View>
                    <Ionicons
                      name={bankTransferActive ? "checkmark-circle" : "close-circle"}
                      size={scale(18)}
                      color={bankTransferActive ? "#10B981" : "#94A3B8"}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Sticky Bottom Save Action */}
          <View style={styles.actionWrap}>
            <TouchableOpacity
              style={[styles.saveButton, actionLoading && { opacity: 0.65 }]}
              onPress={handleSaveConfig}
              disabled={actionLoading}
              activeOpacity={0.88}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="check-circle" size={scale(18)} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    Save & Push to Customer Checkout
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: scale(14),
    paddingBottom: scale(40),
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    marginBottom: scale(14),
  },
  syncPulseDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#10B981",
    marginRight: scale(10),
  },
  syncBannerTitle: {
    color: "#10B981",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  syncBannerDesc: {
    color: "#64748B",
    fontSize: moderateScale(11),
    marginTop: scale(2),
    lineHeight: moderateScale(16),
  },
  segmentBar: {
    flexDirection: "row",
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(4),
    marginBottom: scale(14),
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(8),
    borderRadius: scale(8),
    gap: scale(5),
  },
  segmentBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  segmentText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },
  tabContent: {
    gap: scale(12),
  },
  sectionCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  sectionSub: {
    fontSize: moderateScale(11),
    marginTop: scale(1),
  },
  formBody: {
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.2)",
  },
  disabledHint: {
    fontSize: moderateScale(11),
    marginTop: scale(8),
    fontStyle: "italic",
  },
  inputLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginTop: scale(8),
    marginBottom: scale(3),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: scale(40),
    fontSize: moderateScale(13),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    height: scale(70),
    fontSize: moderateScale(12),
    textAlignVertical: "top",
  },
  dualRow: {
    flexDirection: "row",
  },
  fieldNote: {
    fontSize: moderateScale(10),
    marginTop: scale(3),
  },
  qrPreviewBox: {
    alignItems: "center",
    marginTop: scale(10),
    padding: scale(10),
    borderRadius: scale(8),
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  qrImage: {
    width: scale(120),
    height: scale(120),
  },
  qrPreviewLabel: {
    fontSize: moderateScale(10),
    marginTop: scale(4),
  },
  previewContainer: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  previewTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
  },
  previewDesc: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
    marginBottom: scale(12),
  },
  previewMethodsList: {
    gap: scale(8),
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  previewItemDisabled: {
    opacity: 0.5,
  },
  previewItemTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  previewItemSub: {
    fontSize: moderateScale(10),
    marginTop: scale(1),
  },
  actionWrap: {
    marginTop: scale(16),
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingVertical: scale(14),
    borderRadius: scale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "800",
  },
  deniedContainer: {
    flex: 1,
  },
  deniedBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scale(24),
  },
  deniedIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(14),
  },
  deniedTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
  },
  deniedDesc: {
    fontSize: moderateScale(12),
    textAlign: "center",
    marginTop: scale(6),
    lineHeight: moderateScale(18),
  },
});
