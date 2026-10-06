import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface SavedAddress {
  id: string;
  type: "Home" | "Work" | "Other";
  addressLine: string;
  phone: string;
}

const INITIAL_ADDRESSES: SavedAddress[] = [
  {
    id: "addr-1",
    type: "Home",
    addressLine: "Floor 5, Building name, land mark, Baneshwor, kathmandu",
    phone: "9868686868",
  },
  {
    id: "addr-2",
    type: "Home",
    addressLine: "Floor 5, Building name, land mark, Baneshwor, kathmandu",
    phone: "9868686868",
  },
];

export default function AddressScreen() {
  const theme = useTheme();
  const [addresses, setAddresses] = useState<SavedAddress[]>(INITIAL_ADDRESSES);

  const handleAddNew = () => {
    router.push("/Screens/Profile/add-address" as any);
  };

  const handleMoreOptions = (addr: SavedAddress) => {
    Alert.alert("Address Options", addr.addressLine, [
      { text: "Edit", onPress: () => console.log("Edit address:", addr.id) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setAddresses((prev) => prev.filter((item) => item.id !== addr.id)),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleShare = (addr: SavedAddress) => {
    console.log("Share address:", addr.addressLine);
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
        <Text style={styles.navTitle}>Address book</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "+ Add new address" Capsule Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddNew}
          style={styles.addNewCard}
        >
          <View style={styles.addNewLeft}>
            <Feather name="plus" size={scale(20)} color="#2D6A4F" />
            <Text style={styles.addNewText}>Add new address</Text>
          </View>
          <Feather name="chevron-right" size={scale(20)} color="#2D6A4F" />
        </TouchableOpacity>

        {/* Section Heading */}
        <Text style={styles.sectionHeader}>Your saved addresses</Text>

        {/* Saved Addresses List */}
        <View style={styles.addressList}>
          {addresses.map((item) => (
            <View key={item.id} style={styles.addressCard}>
              {/* Left Green Home Badge Icon */}
              <View style={styles.iconBox}>
                <Feather name="home" size={scale(20)} color="#2D6A4F" />
              </View>

              {/* Middle Address Details */}
              <View style={styles.cardDetails}>
                <Text style={styles.addressType}>{item.type}</Text>
                <Text style={styles.addressLine}>{item.addressLine}</Text>
                <Text style={styles.phoneText}>
                  Phone number:{" "}
                  <Text style={styles.phoneBold}>{item.phone}</Text>
                </Text>

                {/* Bottom Action Icon Buttons (More & Share) */}
                <View style={styles.actionsRow}>
                  {/* More (...) Button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleMoreOptions(item)}
                    style={styles.circleActionBtn}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={scale(16)}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {/* Share Button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleShare(item)}
                    style={styles.circleActionBtn}
                  >
                    <Feather
                      name="share-2"
                      size={scale(15)}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  addNewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingVertical: moderateScale(16),
    paddingHorizontal: scale(16),
    marginBottom: moderateScale(22),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  addNewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  addNewText: {
    fontSize: moderateScale(14.5),
    fontWeight: "600",
    color: "#2D6A4F",
  },
  sectionHeader: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#64748B",
    marginBottom: moderateScale(14),
  },
  addressList: {
    gap: moderateScale(14),
  },
  addressCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "flex-start",
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: "#F4FBEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(14),
    marginTop: scale(2),
  },
  cardDetails: {
    flex: 1,
  },
  addressType: {
    fontSize: moderateScale(15.5),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(4),
  },
  addressLine: {
    fontSize: moderateScale(13),
    color: "#475569",
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(8),
  },
  phoneText: {
    fontSize: moderateScale(13),
    color: "#475569",
    marginBottom: moderateScale(10),
  },
  phoneBold: {
    fontWeight: "600",
    color: "#1E293B",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  circleActionBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});
