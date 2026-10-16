import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAddresses,
  makeDefaultAddress,
  removeAddress,
  setSelectedAddress,
} from "@/store/slices/addressSlice";
import { SavedAddress } from "@/store/services/addressService";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddressScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const { addresses, loading, selectedAddress } = useAppSelector(
    (state) => state.address
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAddresses());
    setRefreshing(false);
  };

  const handleAddNew = () => {
    router.push("/Screens/Profile/add-address" as any);
  };

  const handleEdit = (addr: SavedAddress) => {
    router.push({
      pathname: "/Screens/Profile/add-address" as any,
      params: {
        id: addr.id || addr._id,
        type: addr.type,
        houseNo: addr.houseNo || addr.addressLine,
        landmark: addr.landmark || "",
        phone: addr.phone,
        city: addr.city || "",
        addressLine: addr.addressLine,
      },
    });
  };

  const handleSelectAddress = (addr: SavedAddress) => {
    dispatch(setSelectedAddress(addr));
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    const targetId = addr.id || addr._id;
    if (targetId) {
      await dispatch(makeDefaultAddress(targetId));
      Alert.alert("Default Address", "Default delivery address updated.");
    }
  };

  const handleDelete = (addr: SavedAddress) => {
    const targetId = addr.id || addr._id;
    if (!targetId) return;

    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete this ${addr.type} address?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await dispatch(removeAddress(targetId));
          },
        },
      ]
    );
  };

  const handleMoreOptions = (addr: SavedAddress) => {
    const isAlreadyDefault = addr.isDefault;
    const options: any[] = [
      { text: "Edit Address", onPress: () => handleEdit(addr) },
    ];

    if (!isAlreadyDefault) {
      options.push({
        text: "Set as Default",
        onPress: () => handleSetDefault(addr),
      });
    }

    options.push(
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(addr),
      },
      { text: "Cancel", style: "cancel" }
    );

    Alert.alert("Address Options", addr.addressLine, options);
  };

  const handleShare = async (addr: SavedAddress) => {
    try {
      await Share.share({
        message: `Delivery Address (${addr.type}):\n${addr.addressLine}\nPhone: ${addr.phone}`,
      });
    } catch (error) {
      console.log("Share error", error);
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "Work":
        return (
          <Feather
            name="briefcase"
            size={scale(20)}
            color={isDark ? "#38BDF8" : "#0284C7"}
          />
        );
      case "Other":
        return (
          <Feather
            name="map-pin"
            size={scale(20)}
            color={isDark ? "#A78BFA" : "#7C3AED"}
          />
        );
      default:
        return (
          <Feather
            name="home"
            size={scale(20)}
            color={isDark ? "#39D353" : "#2D6A4F"}
          />
        );
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "Work":
        return isDark ? "rgba(2, 132, 199, 0.16)" : "#E0F2FE";
      case "Other":
        return isDark ? "rgba(124, 58, 237, 0.16)" : "#EDE9FE";
      default:
        return isDark ? "rgba(57, 211, 83, 0.16)" : "#F4FBEA";
    }
  };

  const rootBg = isDark ? "#080D0F" : "#F8FAF9";
  const headerBg = isDark ? "#080D0F" : "#FFFFFF";
  const navTitleColor = isDark ? "#F8FAFC" : "#1E293B";
  const backIconColor = isDark ? "#F8FAFC" : "#1E293B";
  const dividerColor = isDark ? "#1E252E" : "#F1F5F9";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const cardBorder = isDark ? "#303B45" : "#F1F5F9";
  const cardSelectedBorder = isDark ? "#39D353" : "#008080";
  const cardSelectedBg = isDark ? "rgba(57, 211, 83, 0.08)" : "#FAFFFD";
  const textPrimary = isDark ? "#F8FAFC" : "#1E293B";
  const textSecondary = isDark ? "#A8B2BE" : "#475569";
  const circleBtnBg = isDark ? "#1B252E" : "#FFFFFF";
  const circleBtnBorder = isDark ? "#303B45" : "#E2E8F0";
  const circleBtnIcon = isDark ? "#94A3B8" : "#64748B";
  const greenBrand = isDark ? "#39D353" : "#2D6A4F";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: rootBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Navbar Header */}
      <View
        style={[
          styles.navBar,
          { backgroundColor: headerBg, borderBottomColor: dividerColor },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color={backIconColor} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: navTitleColor }]}>
          Address book
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[greenBrand]}
            tintColor={greenBrand}
          />
        }
      >
        {/* "+ Add new address" Capsule Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddNew}
          style={[
            styles.addNewCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.addNewLeft}>
            <Feather name="plus" size={scale(20)} color={greenBrand} />
            <Text style={[styles.addNewText, { color: greenBrand }]}>
              Add new address
            </Text>
          </View>
          <Feather name="chevron-right" size={scale(20)} color={greenBrand} />
        </TouchableOpacity>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionHeader,
              { color: isDark ? "#94A3B8" : "#64748B" },
            ]}
          >
            Your saved addresses
          </Text>
          {addresses.length > 0 && (
            <Text style={styles.addressCountBadge}>
              {addresses.length} {addresses.length === 1 ? "address" : "addresses"}
            </Text>
          )}
        </View>

        {/* Loading State */}
        {loading && addresses.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={greenBrand} />
            <Text
              style={[
                styles.loadingText,
                { color: isDark ? "#A8B2BE" : "#64748B" },
              ]}
            >
              Loading saved addresses...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && addresses.length === 0 && (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(57, 211, 83, 0.16)"
                    : "#F0FDFA",
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={scale(48)}
                color={greenBrand}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              No Saved Addresses
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? "#A8B2BE" : "#64748B" },
              ]}
            >
              You haven't saved any delivery addresses yet. Add one now for instant checkout.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddNew}
              style={[
                styles.emptyAddBtn,
                { backgroundColor: greenBrand },
              ]}
            >
              <Feather
                name="plus"
                size={scale(18)}
                color={isDark ? "#080D0F" : "#FFFFFF"}
              />
              <Text
                style={[
                  styles.emptyAddBtnText,
                  isDark && { color: "#080D0F", fontWeight: "800" },
                ]}
              >
                Add Address
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Addresses List */}
        <View style={styles.addressList}>
          {addresses.map((item) => {
            const isItemDefault = item.isDefault;
            const isCurrentSelected =
              selectedAddress?.id === item.id ||
              selectedAddress?._id === item.id ||
              (selectedAddress?.id && selectedAddress?.id === item._id);

            return (
              <TouchableOpacity
                key={item.id || item._id}
                activeOpacity={0.9}
                onPress={() => handleSelectAddress(item)}
                style={[
                  styles.addressCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                  isCurrentSelected && {
                    borderColor: cardSelectedBorder,
                    backgroundColor: cardSelectedBg,
                  },
                ]}
              >
                {/* Left Badge Icon */}
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: getIconBg(item.type) },
                  ]}
                >
                  {getAddressIcon(item.type)}
                </View>

                {/* Middle Address Details */}
                <View style={styles.cardDetails}>
                  <View style={styles.typeHeaderRow}>
                    <Text
                      style={[
                        styles.addressType,
                        { color: textPrimary },
                      ]}
                    >
                      {item.type}
                    </Text>
                    {isItemDefault && (
                      <View
                        style={[
                          styles.defaultPill,
                          isDark && {
                            backgroundColor: "rgba(34, 197, 94, 0.2)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.defaultPillText,
                            isDark && { color: "#34D399" },
                          ]}
                        >
                          DEFAULT
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[styles.addressLine, { color: textSecondary }]}
                  >
                    {item.addressLine}
                  </Text>

                  <Text style={[styles.phoneText, { color: textSecondary }]}>
                    Phone number:{" "}
                    <Text
                      style={[
                        styles.phoneBold,
                        { color: textPrimary },
                      ]}
                    >
                      {item.phone}
                    </Text>
                  </Text>

                  {/* Bottom Action Icon Buttons (More & Share) */}
                  <View style={styles.actionsRow}>
                    {/* More (...) Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleMoreOptions(item)}
                      style={[
                        styles.circleActionBtn,
                        {
                          backgroundColor: circleBtnBg,
                          borderColor: circleBtnBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={scale(16)}
                        color={circleBtnIcon}
                      />
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleShare(item)}
                      style={[
                        styles.circleActionBtn,
                        {
                          backgroundColor: circleBtnBg,
                          borderColor: circleBtnBorder,
                        },
                      ]}
                    >
                      <Feather
                        name="share-2"
                        size={scale(15)}
                        color={circleBtnIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  addNewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  addNewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  addNewText: {
    fontSize: moderateScale(14.5),
    fontWeight: "600",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  sectionHeader: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
  },
  addressCountBadge: {
    fontSize: moderateScale(12),
    color: "#94A3B8",
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(40),
    paddingHorizontal: scale(20),
  },
  emptyIconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(16),
  },
  emptyTitle: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    marginBottom: scale(6),
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    textAlign: "center",
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(20),
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(11),
    borderRadius: scale(10),
  },
  emptyAddBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addressList: {
    gap: moderateScale(14),
  },
  addressCard: {
    flexDirection: "row",
    borderRadius: scale(16),
    padding: scale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1.5,
    alignItems: "flex-start",
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(14),
    marginTop: scale(2),
  },
  cardDetails: {
    flex: 1,
  },
  typeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: moderateScale(4),
  },
  addressType: {
    fontSize: moderateScale(15.5),
    fontWeight: "700",
  },
  defaultPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  defaultPillText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.3,
  },
  addressLine: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(8),
  },
  phoneText: {
    fontSize: moderateScale(13),
    marginBottom: moderateScale(10),
  },
  phoneBold: {
    fontWeight: "600",
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
    alignItems: "center",
    justifyContent: "center",
  },
});
