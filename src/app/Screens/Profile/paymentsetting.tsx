import { Image } from "expo-image";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSettingScreen() {
  const theme = useTheme();

  const handleAddCard = () => {
    router.push("/Screens/Profile/add-card" as any);
  };

  const handleLinkEsewa = () => {
    Alert.alert("Link Esewa", "Connect your eSewa account");
  };

  const handleLinkKhalti = () => {
    Alert.alert("Link Khalti", "Connect your Khalti account");
  };

  const handleAddNetbanking = () => {
    router.push("/Screens/Profile/select-bank" as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
        <Text style={styles.navTitle}>Payment setting</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CARDS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cards</Text>

          <View style={styles.itemRow}>
            {/* Card Icon */}
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={scale(22)}
                color="#334155"
              />
            </View>

            {/* Label */}
            <Text style={styles.itemTitle}>Add Debit or Credit cards</Text>

            {/* Action Button */}
            <TouchableOpacity activeOpacity={0.7} onPress={handleAddCard}>
              <Text style={styles.actionGreenText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WALLETS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Wallets</Text>

          {/* Esewa */}
          <View style={styles.itemRow}>
            <View style={styles.iconBox}>
              <Image
                source={require("@/assets/images/Home/logo-esewa.png")}
                style={styles.walletLogo}
                contentFit="contain"
              />
            </View>

            <View style={styles.labelColumn}>
              <Text style={styles.itemTitle}>Esewa</Text>
              <Text style={styles.itemSubtitle}>Link Your esewa ID</Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={handleLinkEsewa}>
              <Text style={styles.actionGreenText}>Link</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Khalti */}
          <View style={styles.itemRow}>
            <View style={styles.iconBox}>
              <Image
                source={require("@/assets/images/Home/logo-khalti.png")}
                style={styles.walletLogo}
                contentFit="contain"
              />
            </View>

            <View style={styles.labelColumn}>
              <Text style={styles.itemTitle}>Khalti</Text>
              <Text style={styles.itemSubtitle}>Link Your Khalti ID</Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={handleLinkKhalti}>
              <Text style={styles.actionGreenText}>Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NETBANKING SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Netbanking</Text>

          <View style={styles.itemRow}>
            {/* Bank Icon */}
            <View style={styles.iconBox}>
              <MaterialIcons
                name="account-balance"
                size={scale(22)}
                color="#334155"
              />
            </View>

            {/* Label */}
            <Text style={styles.itemTitle}>Netbanking</Text>

            {/* Action Button */}
            <TouchableOpacity activeOpacity={0.7} onPress={handleAddNetbanking}>
              <Text style={styles.actionGreenText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(40),
    gap: moderateScale(18),
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(14),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(6),
  },
  iconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "#F4FBEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  walletLogo: {
    width: scale(32),
    height: scale(32),
  },
  labelColumn: {
    flex: 1,
  },
  itemTitle: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1E293B",
  },
  itemSubtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  actionGreenText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#2D6A4F",
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
});
