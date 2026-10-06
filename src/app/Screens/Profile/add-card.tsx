import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddCardScreen() {
  const theme = useTheme();

  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [nicknameType, setNicknameType] = useState<"Personal" | "Business" | "Other">("Personal");

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
  };

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleAddSecureCard = () => {
    if (!nameOnCard || !cardNumber || !expiryDate) {
      Alert.alert("Required", "Please fill in all card details.");
      return;
    }
    Alert.alert("Success", "Card added and securely tokenized!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "#ffffff" }]}
    >
      <StatusBar style="dark" />

      {/* Top Navbar Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add a card</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top supported cards note */}
          <Text style={styles.supportedText}>
            We accept Credit and Debit Cards from Visa, Mastercard & American Express
          </Text>

          {/* Name on card */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name on card</Text>
            <TextInput
              value={nameOnCard}
              onChangeText={setNameOnCard}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
              style={styles.underlineInput}
            />
          </View>

          {/* Card number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card number</Text>
            <TextInput
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="XXXX XXXX XXXX XXXX"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={19}
              style={styles.underlineInput}
            />
          </View>

          {/* Expiry date (MM/YY) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expiry date(MM/YY)</Text>
            <TextInput
              value={expiryDate}
              onChangeText={handleExpiryChange}
              placeholder="MM/YY"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={5}
              style={styles.underlineInput}
            />
          </View>

          {/* Nickname for card section */}
          <Text style={styles.nicknameHeading}>Nickname for card</Text>
          <View style={styles.nicknamePillsRow}>
            {(["Personal", "Business", "Other"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                onPress={() => setNicknameType(type)}
                style={[
                  styles.nicknamePill,
                  nicknameType === type && styles.nicknamePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.nicknamePillText,
                    nicknameType === type && styles.nicknamePillTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.separator} />

          {/* Tokenize agreement note */}
          <Text style={styles.agreementText}>
            I agree to tokenize my card details with card network(e.g. Visa, Mastercard, etc.) for future payments.
          </Text>
        </ScrollView>

        {/* Bottom CTA Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleAddSecureCard}
            style={styles.addCardBtn}
          >
            <Text style={styles.addCardBtnText}>Add & Secure Card</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: scale(4),
    marginRight: scale(14),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1E293B",
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(30),
  },
  supportedText: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(22),
  },
  inputGroup: {
    marginBottom: moderateScale(22),
  },
  inputLabel: {
    fontSize: moderateScale(14.5),
    fontWeight: "600",
    color: "#475569",
    marginBottom: moderateScale(6),
  },
  underlineInput: {
    fontSize: moderateScale(15),
    color: "#1E293B",
    fontWeight: "500",
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1.2,
    borderBottomColor: "#E2E8F0",
  },
  nicknameHeading: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#64748B",
    marginTop: moderateScale(4),
    marginBottom: moderateScale(12),
  },
  nicknamePillsRow: {
    flexDirection: "row",
    gap: scale(12),
    marginBottom: moderateScale(20),
  },
  nicknamePill: {
    paddingHorizontal: scale(18),
    paddingVertical: scale(7),
    borderRadius: scale(8),
    borderWidth: 1.2,
    borderColor: "#2D6A4F",
    backgroundColor: "#ffffff",
  },
  nicknamePillActive: {
    backgroundColor: "#2D6A4F",
    borderColor: "#2D6A4F",
  },
  nicknamePillText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#2D6A4F",
  },
  nicknamePillTextActive: {
    color: "#ffffff",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
  agreementText: {
    fontSize: moderateScale(12),
    color: "#64748B",
    lineHeight: moderateScale(17),
    marginTop: moderateScale(4),
  },
  bottomBar: {
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(14),
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  addCardBtn: {
    backgroundColor: "#003844",
    paddingVertical: moderateScale(14),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  addCardBtnText: {
    color: "#ffffff",
    fontSize: moderateScale(15.5),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
