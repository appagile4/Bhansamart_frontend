import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface BankDetailsData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber?: string;
  ifscCode: string;
  branch: string;
  upiId?: string;
}

interface BankDetailsProps {
  data: BankDetailsData;
  onChange: (field: keyof BankDetailsData, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function BankDetailsStep({
  data,
  onChange,
  onNext,
  onBack,
}: BankDetailsProps) {
  const [showAccountNum, setShowAccountNum] = useState(false);

  const handleValidateAndNext = () => {
    if (!data.accountHolderName.trim()) {
      Alert.alert("Required", "Please enter the Account Holder Name.");
      return;
    }
    if (!data.bankName.trim()) {
      Alert.alert("Required", "Please enter your Bank Name.");
      return;
    }
    if (!data.accountNumber.trim()) {
      Alert.alert("Required", "Please enter your Bank Account Number.");
      return;
    }
    if (
      data.confirmAccountNumber &&
      data.accountNumber.trim() !== data.confirmAccountNumber.trim()
    ) {
      Alert.alert("Mismatch", "Account Number and Confirm Account Number do not match.");
      return;
    }
    if (!data.ifscCode.trim()) {
      Alert.alert("Required", "Please enter your Bank IFSC Code.");
      return;
    }

    if (onNext) onNext();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bank & Settlement Details</Text>
        <Text style={styles.subtitle}>
          Enter your bank account details for daily/weekly earnings settlements.
        </Text>
      </View>

      {/* Security Encrypted Banner */}
      <View style={styles.securityBanner}>
        <MaterialCommunityIcons name="shield-check" size={scale(20)} color="#059669" />
        <View style={{ flex: 1 }}>
          <Text style={styles.securityTitle}>Bank-Grade 256-bit Encryption</Text>
          <Text style={styles.securitySubtitle}>
            Your banking data is encrypted and used exclusively for vendor payout settlements.
          </Text>
        </View>
      </View>

      {/* 1. Account Holder Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Account Holder Name <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="user-check" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.accountHolderName}
            onChangeText={(t) => onChange("accountHolderName", t)}
            placeholder="Full name as printed on bank passbook / cheque"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 2. Bank Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Bank Name <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <MaterialCommunityIcons
            name="bank-outline"
            size={scale(18)}
            color="#94A3B8"
            style={styles.icon}
          />
          <TextInput
            value={data.bankName}
            onChangeText={(t) => onChange("bankName", t)}
            placeholder="e.g. HDFC Bank / Nepal SBI Bank / Nabil Bank"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 3. Account Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Bank Account Number <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="credit-card" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.accountNumber}
            onChangeText={(t) => onChange("accountNumber", t)}
            placeholder="Account Number"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            secureTextEntry={!showAccountNum}
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={() => setShowAccountNum((prev) => !prev)}
            style={styles.eyeBtn}
          >
            <Feather
              name={showAccountNum ? "eye" : "eye-off"}
              size={scale(15)}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Confirm Account Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Confirm Account Number <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="check-circle" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.confirmAccountNumber}
            onChangeText={(t) => onChange("confirmAccountNumber", t)}
            placeholder="Re-enter Account Number"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 5. IFSC Code & Branch */}
      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1.1 }]}>
          <Text style={styles.label}>
            IFSC / Swift Code <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.ifscCode}
              onChangeText={(t) => onChange("ifscCode", t.toUpperCase())}
              placeholder="e.g. HDFC0001234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Branch Name</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.branch}
              onChangeText={(t) => onChange("branch", t)}
              placeholder="e.g. Main Branch"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 6. UPI ID (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>UPI ID / eSewa / Khalti (Optional)</Text>
        <View style={styles.inputBox}>
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={scale(16)}
            color="#94A3B8"
            style={styles.icon}
          />
          <TextInput
            value={data.upiId}
            onChangeText={(t) => onChange("upiId", t)}
            placeholder="seller@upi or 98XXXXXXXX"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.prevBtn}>
            <Feather name="arrow-left" size={scale(16)} color="#003844" />
            <Text style={styles.prevBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {onNext && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleValidateAndNext}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>Save & Proceed to Shipping</Text>
            <Feather name="arrow-right" size={scale(16)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  header: {
    marginBottom: moderateScale(14),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#003844",
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    lineHeight: moderateScale(18),
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: moderateScale(18),
    gap: scale(10),
  },
  securityTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#065F46",
    marginBottom: scale(2),
  },
  securitySubtitle: {
    fontSize: moderateScale(11),
    color: "#047857",
    lineHeight: moderateScale(15),
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(6),
  },
  req: {
    color: "#EF4444",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(44),
  },
  icon: {
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    height: "100%",
  },
  eyeBtn: {
    padding: scale(4),
  },
  twoColRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(16),
  },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    height: moderateScale(46),
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    gap: scale(6),
  },
  prevBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#003844",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003844",
    height: moderateScale(46),
    borderRadius: scale(8),
    gap: scale(8),
  },
  nextBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
