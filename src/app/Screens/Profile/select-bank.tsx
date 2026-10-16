import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addNetbanking } from "@/store/slices/paymentSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  { id: "b1", name: "Nepal Rastra Bank", shortCode: "NRB" },
  { id: "b2", name: "Nepal Bank Limited", shortCode: "NBL" },
  { id: "b3", name: "NIC Asia Bank", shortCode: "NIC Asia" },
  { id: "b4", name: "Rastriya Banijya Bank", shortCode: "RBB" },
  { id: "b5", name: "Kumari Bank Limited", shortCode: "Kumari" },
  { id: "b6", name: "Nabil Bank Limited", shortCode: "Nabil" },
  { id: "b7", name: "Global IME Bank Limited", shortCode: "Global IME" },
  { id: "b8", name: "Everest Bank Limited", shortCode: "Everest" },
  { id: "b9", name: "Siddhartha Bank Limited", shortCode: "Siddhartha" },
  { id: "b10", name: "Himalayan Bank Limited", shortCode: "HBL" },
  { id: "b11", name: "Prabhu Bank Limited", shortCode: "Prabhu" },
  { id: "b12", name: "Sanima Bank Limited", shortCode: "Sanima" },
];

export default function SelectBankScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.payment);

  const [searchQuery, setSearchQuery] = useState("");
  const [connectingBankId, setConnectingBankId] = useState<string | null>(null);

  const filteredBanks = ALL_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bank: BankItem) => {
    Alert.alert(
      "Connect Netbanking",
      `Would you like to connect ${bank.name} for Netbanking?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: async () => {
            try {
              setConnectingBankId(bank.id);
              await dispatch(
                addNetbanking({
                  bankId: bank.id,
                  bankName: bank.name,
                  shortCode: bank.shortCode || bank.name,
                })
              ).unwrap();

              Alert.alert(
                "Bank Connected",
                `${bank.name} has been connected for Netbanking payments.`,
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                typeof err === "string" ? err : "Failed to connect bank."
              );
            } finally {
              setConnectingBankId(null);
            }
          },
        },
      ]
    );
  };

  const bgColor = isDark ? "#080D0F" : "#ffffff";
  const cardBg = isDark ? "#151D24" : "#ffffff";
  const squareBg = isDark ? "#1B252E" : "#F8FAFC";
  const textColor = isDark ? "#F8FAFC" : "#1E293B";
  const subTextColor = isDark ? "#A8B2BE" : "#64748B";
  const borderColor = isDark ? "#303B45" : "#E2E8F0";
  const navBorderColor = isDark ? "#1E293B" : "#F1F5F9";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Navbar Header */}
      <View
        style={[
          styles.navBar,
          { borderBottomColor: navBorderColor, backgroundColor: bgColor },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: textColor }]}>Select Bank</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search By Bank Name */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: cardBg, borderColor: borderColor },
          ]}
        >
          <Feather name="search" size={scale(18)} color={subTextColor} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search By Bank Name"
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            style={[styles.searchInput, { color: textColor }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={scale(18)} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Popular Banks Section */}
        {searchQuery.length === 0 && (
          <>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              Popular Banks
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularRow}
            >
              {POPULAR_BANKS.map((bank) => {
                const isCurrentConnecting = connectingBankId === bank.id;
                return (
                  <TouchableOpacity
                    key={bank.id}
                    activeOpacity={0.8}
                    disabled={actionLoading}
                    onPress={() => handleBankSelect(bank)}
                    style={styles.popularCard}
                  >
                    <View
                      style={[
                        styles.bankSquare,
                        { backgroundColor: squareBg, borderColor },
                      ]}
                    >
                      {isCurrentConnecting ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#39D353" : "#2D6A4F"}
                        />
                      ) : (
                        <MaterialIcons
                          name="account-balance"
                          size={scale(24)}
                          color={isDark ? "#39D353" : "#2D6A4F"}
                        />
                      )}
                    </View>
                    <Text
                      style={[styles.popularCode, { color: isDark ? "#CBD5E1" : "#475569" }]}
                      numberOfLines={1}
                    >
                      {bank.shortCode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View
              style={[styles.separator, { backgroundColor: navBorderColor }]}
            />
          </>
        )}

        {/* All Banks Section */}
        <Text style={[styles.sectionHeading, { color: textColor }]}>
          {searchQuery ? "Search Results" : "All Banks"}
        </Text>
        <View style={styles.allBanksList}>
          {filteredBanks.map((bank) => {
            const isCurrentConnecting = connectingBankId === bank.id;
            return (
              <TouchableOpacity
                key={bank.id}
                activeOpacity={0.75}
                disabled={actionLoading}
                onPress={() => handleBankSelect(bank)}
                style={[
                  styles.bankListItem,
                  { borderBottomColor: navBorderColor },
                ]}
              >
                <View
                  style={[
                    styles.bankListSquare,
                    { backgroundColor: squareBg, borderColor },
                  ]}
                >
                  {isCurrentConnecting ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? "#39D353" : "#2D6A4F"}
                    />
                  ) : (
                    <MaterialIcons
                      name="account-balance"
                      size={scale(18)}
                      color={isDark ? "#A8B2BE" : "#64748B"}
                    />
                  )}
                </View>
                <Text style={[styles.bankNameText, { color: textColor }]}>
                  {bank.name}
                </Text>
                <Feather
                  name="chevron-right"
                  size={scale(18)}
                  color={subTextColor}
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            );
          })}
          {filteredBanks.length === 0 && (
            <Text style={[styles.emptyText, { color: subTextColor }]}>
              No bank found matching "{searchQuery}"
            </Text>
          )}
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
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === "ios" ? scale(10) : scale(6),
    gap: scale(10),
    marginBottom: moderateScale(20),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
  },
  sectionHeading: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(6),
  },
  popularCode: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    textAlign: "center",
  },
  separator: {
    height: 1,
    marginVertical: moderateScale(16),
  },
  allBanksList: {
    gap: moderateScale(6),
  },
  bankListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    gap: scale(14),
    borderBottomWidth: 0.8,
  },
  bankListSquare: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bankNameText: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: moderateScale(20),
    fontSize: moderateScale(14),
  },
});
