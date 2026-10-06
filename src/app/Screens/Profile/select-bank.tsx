import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BankItem {
  id: string;
  name: string;
  shortCode?: string;
  isPopular?: boolean;
}

const POPULAR_BANKS: BankItem[] = [
  { id: "nrb", name: "Nepal Rastra Bank", shortCode: "NRB", isPopular: true },
  { id: "nbl", name: "Nepal Bank Limited", shortCode: "NBL", isPopular: true },
  { id: "nic", name: "NIC Asia Bank", shortCode: "NIC Asia", isPopular: true },
  { id: "rbb", name: "Rastriya Banijya Bank", shortCode: "RBB", isPopular: true },
  { id: "kumari", name: "Kumari Bank", shortCode: "Kumari Bank", isPopular: true },
];

const ALL_BANKS: BankItem[] = [
  { id: "b1", name: "Nepal Rastra Bank" },
  { id: "b2", name: "Nepal Bank Limited" },
  { id: "b3", name: "NIC Asia Bank" },
  { id: "b4", name: "Rastriya Banijya Bank" },
  { id: "b5", name: "Kumari Bank Limited" },
  { id: "b6", name: "Nabil Bank Limited" },
  { id: "b7", name: "Global IME Bank Limited" },
  { id: "b8", name: "Everest Bank Limited" },
];

export default function SelectBankScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const filteredBanks = ALL_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bank: BankItem) => {
    setSelectedBankId(bank.id);
    Alert.alert("Bank Selected", `Proceed to Netbanking login for ${bank.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Connect", onPress: () => router.back() },
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
        <Text style={styles.navTitle}>Select Bank</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search By Bank Name */}
        <View style={styles.searchBox}>
          <Feather name="search" size={scale(18)} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search By Bank Name"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>

        {/* Popular Banks Section */}
        <Text style={styles.sectionHeading}>Popular Banks</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularRow}
        >
          {POPULAR_BANKS.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              activeOpacity={0.8}
              onPress={() => handleBankSelect(bank)}
              style={styles.popularCard}
            >
              <View style={styles.bankSquare}>
                <MaterialIcons
                  name="account-balance"
                  size={scale(24)}
                  color="#2D6A4F"
                />
              </View>
              <Text style={styles.popularCode} numberOfLines={1}>
                {bank.shortCode}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.separator} />

        {/* All Banks Section */}
        <Text style={styles.sectionHeading}>All Banks</Text>
        <View style={styles.allBanksList}>
          {filteredBanks.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              activeOpacity={0.75}
              onPress={() => handleBankSelect(bank)}
              style={styles.bankListItem}
            >
              <View style={styles.bankListSquare}>
                <MaterialIcons
                  name="account-balance"
                  size={scale(18)}
                  color="#64748B"
                />
              </View>
              <Text style={styles.bankNameText}>{bank.name}</Text>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(10) : scale(6),
    gap: scale(10),
    marginBottom: moderateScale(20),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#1E293B",
  },
  sectionHeading: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(14),
  },
  popularRow: {
    flexDirection: "row",
    gap: scale(14),
    paddingBottom: moderateScale(10),
  },
  popularCard: {
    alignItems: "center",
    width: scale(62),
  },
  bankSquare: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(6),
  },
  popularCode: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(16),
  },
  allBanksList: {
    gap: moderateScale(12),
  },
  bankListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    gap: scale(14),
  },
  bankListSquare: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  bankNameText: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    color: "#1E293B",
  },
});
