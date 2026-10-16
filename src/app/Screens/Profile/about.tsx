import { moderateScale, scale, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [expandedSection, setExpandedSection] = useState<
    "none" | "privacy" | "terms"
  >("none");

  const toggleSection = (section: "privacy" | "terms") => {
    setExpandedSection((prev) => (prev === section ? "none" : section));
  };

  return (
    <View
      style={[
        styles.root,
        isDark && { backgroundColor: "#080D0F" },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* 1. Header with SafeAreaView for Status Bar Coverage */}
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.safeAreaHeader,
          isDark && { backgroundColor: "#080D0F" },
        ]}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather
              name="arrow-left"
              size={scale(22)}
              color={isDark ? "#F8FAFC" : "#1E293B"}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.navTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            About Us
          </Text>
        </View>
        <View
          style={[
            styles.headerDivider,
            isDark && { backgroundColor: "#1E252E" },
          ]}
        />
      </SafeAreaView>

      {/* 2. Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* About Us Mission Card */}
        <View
          style={[
            styles.card,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          <Text
            style={[
              styles.cardHeading,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            About Us
          </Text>

          <Text
            style={[
              styles.paragraph,
              isDark && { color: "#A8B2BE" },
            ]}
          >
            Welcome to Bhansa Mart, your one-stop solution for all your grocery
            needs. We are committed to making grocery shopping easier, faster,
            and more convenient for everyone. With a vast selection of fresh
            produce, pantry staples, household essentials, and more, we aim to
            bring the market to your doorstep with just a few taps on your
            mobile device.
          </Text>

          <Text
            style={[
              styles.paragraph,
              isDark && { color: "#A8B2BE" },
            ]}
          >
            At Bhansa Mart, we believe that grocery shopping should never be a
            hassle. Our mission is to save you time, effort, and stress by
            providing a seamless shopping experience. We're dedicated to
            offering high-quality products, unbeatable convenience, and
            exceptional service that you can rely on every day.
          </Text>

          <Text
            style={[
              styles.paragraph,
              isDark && { color: "#A8B2BE" },
            ]}
          >
            We bring together a curated selection of products, ranging from
            locally sourced fruits and vegetables to international brands, all
            in one place. Whether you're planning a family dinner, restocking
            your pantry, or looking for a last-minute snack, we've got you
            covered. Our easy-to-use app is designed to simplify your shopping
            journey with features like personalized recommendations, quick
            reordering, and secure payment options.
          </Text>
        </View>

        {/* Expandable Policy Links Container on Same Page */}
        <View
          style={[
            styles.linksCard,
            isDark && {
              backgroundColor: "#151D24",
              borderColor: "#303B45",
            },
          ]}
        >
          {/* Privacy Policy Header */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleSection("privacy")}
            style={styles.linkRow}
          >
            <Text
              style={[
                styles.linkRowText,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Privacy Policy
            </Text>
            <Feather
              name={
                expandedSection === "privacy" ? "chevron-up" : "chevron-down"
              }
              size={scale(20)}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </TouchableOpacity>

          {/* Privacy Policy Content on Same Page */}
          {expandedSection === "privacy" && (
            <View
              style={[
                styles.expandedContent,
                isDark && {
                  backgroundColor: "#1B252E",
                  borderTopColor: "#303B45",
                },
              ]}
            >
              <Text
                style={[
                  styles.policySubheading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                1. Information We Collect
              </Text>
              <Text
                style={[
                  styles.policyText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                We collect personal information such as your name, phone number,
                email, and delivery address to fulfill your orders and enhance
                your shopping experience.
              </Text>

              <Text
                style={[
                  styles.policySubheading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                2. How We Use Your Data
              </Text>
              <Text
                style={[
                  styles.policyText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                Your data is used solely for order processing, customer support,
                personalized promotions, and service improvements. We never sell
                your personal data to third parties.
              </Text>

              <Text
                style={[
                  styles.policySubheading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                3. Payment & Data Security
              </Text>
              <Text
                style={[
                  styles.policyText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                All financial transactions are encrypted with bank-grade
                protocols. We do not store full credit card details on our
                servers.
              </Text>
            </View>
          )}

          <View
            style={[
              styles.linkDivider,
              isDark && { backgroundColor: "#1E252E" },
            ]}
          />

          {/* Terms & Condition Header */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleSection("terms")}
            style={styles.linkRow}
          >
            <Text
              style={[
                styles.linkRowText,
                isDark && { color: "#F8FAFC" },
              ]}
            >
              Terms & Condition
            </Text>
            <Feather
              name={expandedSection === "terms" ? "chevron-up" : "chevron-down"}
              size={scale(20)}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </TouchableOpacity>

          {/* Terms & Condition Content on Same Page */}
          {expandedSection === "terms" && (
            <View
              style={[
                styles.expandedContent,
                isDark && {
                  backgroundColor: "#1B252E",
                  borderTopColor: "#303B45",
                },
              ]}
            >
              <Text
                style={[
                  styles.policySubheading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                1. Account Registration
              </Text>
              <Text
                style={[
                  styles.policyText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                You must provide accurate and complete information when
                registering your account. You are responsible for maintaining
                the confidentiality of your login credentials.
              </Text>

              <Text
                style={[
                  styles.policySubheading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                2. Pricing & Availability
              </Text>
              <Text
                style={[
                  styles.policyText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                Prices and product availability are subject to change without
                prior notice. In case of discrepancies, we will contact you
                prior to dispatch.
              </Text>

              <Text
                style={[
                  styles.policySubheading,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                3. Cancellation & Returns
              </Text>
              <Text
                style={[
                  styles.policyText,
                  isDark && { color: "#A8B2BE" },
                ]}
              >
                Orders can be cancelled before dispatch. Defective or incorrect
                items are eligible for replacement or instant refund upon
                delivery inspection.
              </Text>
            </View>
          )}
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
    gap: moderateScale(16),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    padding: scale(18),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeading: {
    fontSize: moderateScale(16.5),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(14),
  },
  paragraph: {
    fontSize: moderateScale(12.5),
    color: "#475569",
    lineHeight: moderateScale(18.5),
    marginBottom: moderateScale(12),
  },
  linksCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingVertical: moderateScale(16),
  },
  linkRowText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  linkDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: scale(16),
  },
  expandedContent: {
    paddingHorizontal: scale(18),
    paddingBottom: moderateScale(16),
    paddingTop: moderateScale(4),
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  policySubheading: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1E293B",
    marginTop: moderateScale(8),
    marginBottom: moderateScale(2),
  },
  policyText: {
    fontSize: moderateScale(11.5),
    color: "#475569",
    lineHeight: moderateScale(16.5),
  },
});
