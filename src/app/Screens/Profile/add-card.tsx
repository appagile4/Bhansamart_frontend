import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addCard } from "@/store/slices/paymentSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.payment);

  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [nicknameType, setNicknameType] = useState<"Personal" | "Business" | "Other">("Personal");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddSecureCard = async () => {
    const trimmedName = nameOnCard.trim();
    const cleanNumber = cardNumber.replace(/\D/g, "");

    if (!trimmedName) {
      Alert.alert("Required", "Please enter the name on the card.");
      return;
    }

    if (cleanNumber.length < 12 || cleanNumber.length > 19) {
      Alert.alert("Invalid Card", "Please enter a valid 16-digit card number.");
      return;
    }

    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert("Invalid Expiry", "Please enter card expiry in MM/YY format.");
      return;
    }

    const [monthStr, yearStr] = expiryDate.split("/");
    const month = parseInt(monthStr, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      Alert.alert("Invalid Month", "Expiry month must be between 01 and 12.");
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(
        addCard({
          cardHolderName: trimmedName,
          cardNumber: cleanNumber,
          expiryDate: expiryDate.trim(),
          nicknameType,
        })
      ).unwrap();

      Alert.alert(
        "Card Added",
        "Your card has been saved and securely tokenized.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", typeof err === "string" ? err : "Failed to add card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgColor = isDark ? "#080D0F" : "#ffffff";
  const textColor = isDark ? "#F8FAFC" : "#1E293B";
  const subTextColor = isDark ? "#A8B2BE" : "#64748B";
  const borderColor = isDark ? "#303B45" : "#E2E8F0";
  const navBorderColor = isDark ? "#1E293B" : "#F1F5F9";
  const bottomBarBg = isDark ? "#151D24" : "#ffffff";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Navbar Header */}
      <View style={[styles.navBar, { borderBottomColor: navBorderColor, backgroundColor: bgColor }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: textColor }]}>Add a card</Text>
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
          <Text style={[styles.supportedText, { color: subTextColor }]}>
            We accept Credit and Debit Cards from Visa, Mastercard & American Express
          </Text>

          {/* Name on card */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#475569" }]}>
              Name on card
            </Text>
            <TextInput
              value={nameOnCard}
              onChangeText={setNameOnCard}
              placeholder="e.g. John Doe"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              style={[
                styles.underlineInput,
                { color: textColor, borderBottomColor: borderColor },
              ]}
            />
          </View>

          {/* Card number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#475569" }]}>
              Card number
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="XXXX XXXX XXXX XXXX"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              keyboardType="number-pad"
              maxLength={19}
              style={[
                styles.underlineInput,
                { color: textColor, borderBottomColor: borderColor },
              ]}
            />
          </View>

          {/* Expiry date (MM/YY) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#475569" }]}>
              Expiry date(MM/YY)
            </Text>
            <TextInput
              value={expiryDate}
              onChangeText={handleExpiryChange}
              placeholder="MM/YY"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              keyboardType="number-pad"
              maxLength={5}
              style={[
                styles.underlineInput,
                { color: textColor, borderBottomColor: borderColor },
              ]}
            />
          </View>

          {/* Nickname for card section */}
          <Text style={[styles.nicknameHeading, { color: subTextColor }]}>
            Nickname for card
          </Text>
          <View style={styles.nicknamePillsRow}>
            {(["Personal", "Business", "Other"] as const).map((type) => {
              const isActive = nicknameType === type;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  onPress={() => setNicknameType(type)}
                  style={[
                    styles.nicknamePill,
                    {
                      borderColor: isActive ? "#2D6A4F" : isDark ? "#303B45" : "#2D6A4F",
                      backgroundColor: isActive ? "#2D6A4F" : isDark ? "#151D24" : "#ffffff",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.nicknamePillText,
                      {
                        color: isActive
                          ? "#ffffff"
                          : isDark
                          ? "#CBD5E1"
                          : "#2D6A4F",
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.separator, { backgroundColor: navBorderColor }]} />

          {/* Tokenize agreement note */}
          <Text style={[styles.agreementText, { color: subTextColor }]}>
            I agree to tokenize my card details with card network (e.g. Visa, Mastercard, etc.) for future payments.
          </Text>
        </ScrollView>

        {/* Bottom CTA Button */}
        <View style={[styles.bottomBar, { backgroundColor: bottomBarBg, borderTopColor: navBorderColor }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isSubmitting || actionLoading}
            onPress={handleAddSecureCard}
            style={[
              styles.addCardBtn,
              isDark && { backgroundColor: "#39D353" },
              (isSubmitting || actionLoading) && { opacity: 0.7 },
            ]}
          >
            {isSubmitting || actionLoading ? (
              <ActivityIndicator color={isDark ? "#080D0F" : "#ffffff"} />
            ) : (
              <Text
                style={[
                  styles.addCardBtnText,
                  isDark && { color: "#080D0F", fontWeight: "800" },
                ]}
              >
                Add & Secure Card
              </Text>
            )}
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
  },
  backButton: {
    padding: scale(4),
    marginRight: scale(14),
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(30),
  },
  supportedText: {
    fontSize: moderateScale(12.5),
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(22),
  },
  inputGroup: {
    marginBottom: moderateScale(22),
  },
  inputLabel: {
    fontSize: moderateScale(14.5),
    fontWeight: "600",
    marginBottom: moderateScale(6),
  },
  underlineInput: {
    fontSize: moderateScale(15),
    fontWeight: "500",
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1.2,
  },
  nicknameHeading: {
    fontSize: moderateScale(13),
    fontWeight: "600",
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
  },
  nicknamePillText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginVertical: moderateScale(10),
  },
  agreementText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    marginTop: moderateScale(4),
  },
  bottomBar: {
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(14),
    borderTopWidth: 1,
  },
  addCardBtn: {
    backgroundColor: "#003844",
    paddingVertical: moderateScale(14),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
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
