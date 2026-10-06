import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FAQItem {
  id: string;
  question: string;
  subtitle?: string;
  points: string[];
}

const FAQ_LIST: FAQItem[] = [
  {
    id: "faq-1",
    question: "1. How can I track my order?",
    subtitle: "Tracking your order is easy!",
    points: [
      'Go to "My Orders".',
      'Select your order, and tap "Track Order" to see live updates.',
    ],
  },
  {
    id: "faq-2",
    question: "2. What happens if an item I ordered is out of stock?",
    subtitle: "Don't worry!",
    points: [
      "If an item is unavailable, we'll notify you and offer a refund or replacement.",
      "Refunds are processed instantly to your payment method.",
    ],
  },
  {
    id: "faq-3",
    question: "3. Can I schedule a delivery?",
    subtitle: "No, you cannot!",
    points: [
      "Once the order is placed, the delivery time cannot be changed.",
      "Delivery timing also depends on the distance from the nearest branch.",
    ],
  },
  {
    id: "faq-4",
    question: "4. How do I apply a discount or promo code?",
    subtitle: "Using a promo code is simple:",
    points: [
      "Add items to your cart.",
      'Tap "Apply Promo Code" at checkout.',
      "Enter the code and enjoy your discount instantly!",
    ],
  },
  {
    id: "faq-5",
    question: "5. What payment options do you accept?",
    subtitle: "We accept:",
    points: ["Fone pay", "Cash on Delivery."],
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Contact", `Call: ${phoneNumber}`);
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("Contact", `Email: ${email}`);
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* 1. Header with SafeAreaView for Status Bar Coverage */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Help and Support</Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* 2. Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Help & FAQs Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Help & FAQs</Text>

          <View style={styles.faqList}>
            {FAQ_LIST.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {faq.subtitle && (
                  <Text style={styles.faqSubtitle}>{faq.subtitle}</Text>
                )}
                <View style={styles.pointsList}>
                  {faq.points.map((pt, i) => (
                    <View key={i} style={styles.pointRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.pointText}>{pt}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Grievance & Support Info Card */}
        <View style={styles.card}>
          <Text style={styles.grievanceIntro}>
            If your issue remains unresolved or you are unsatisfied with the
            resolution process, please feel free to contact our grievance officer
            for further assistance.
          </Text>

          <View style={styles.contactDetailsGroup}>
            <Text style={styles.officerRole}>Grievance Officer</Text>
            <Text style={styles.officerName}>Ram Bahadur</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact: </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCall("9860454545")}
              >
                <Text style={styles.linkGreen}>9860454545</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email: </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleEmail("Damion_Davis93@hotmail.com")}
              >
                <Text style={styles.linkGreen}>Damion_Davis93@hotmail.com</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer support: </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCall("9899668888")}
              >
                <Text style={styles.linkGreen}>9899668888</Text>
              </TouchableOpacity>
              <Text style={styles.separatorBar}> | </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCall("9899668898")}
              >
                <Text style={styles.linkGreen}>9899668898</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeAreaHeader: {
    backgroundColor: "#ffffff",
  },
  navBar: {
    height: moderateScale(48),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    marginRight: scale(6),
  },
  navTitle: {
    fontSize: moderateScale(17.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(40),
    gap: moderateScale(14),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeading: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(14),
  },
  faqList: {
    gap: moderateScale(16),
  },
  faqItem: {
    gap: moderateScale(3),
  },
  faqQuestion: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: moderateScale(18),
  },
  faqSubtitle: {
    fontSize: moderateScale(12),
    color: "#475569",
    fontWeight: "500",
    marginTop: moderateScale(2),
  },
  pointsList: {
    gap: moderateScale(2),
    marginTop: moderateScale(2),
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: scale(4),
  },
  bulletDot: {
    fontSize: moderateScale(13),
    color: "#475569",
    marginRight: scale(6),
    lineHeight: moderateScale(17),
  },
  pointText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: "#475569",
    lineHeight: moderateScale(17),
  },
  grievanceIntro: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    lineHeight: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  contactDetailsGroup: {
    gap: moderateScale(4),
  },
  officerRole: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  officerName: {
    fontSize: moderateScale(12),
    color: "#334155",
    fontWeight: "600",
    marginBottom: moderateScale(6),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: moderateScale(11.5),
    color: "#1E293B",
    fontWeight: "700",
  },
  linkGreen: {
    fontSize: moderateScale(11.5),
    color: "#16A34A",
    fontWeight: "700",
  },
  separatorBar: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
  },
});
