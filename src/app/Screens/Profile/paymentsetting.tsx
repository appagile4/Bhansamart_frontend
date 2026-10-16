import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { CardItem, NetbankingItem } from "@/store/services/paymentService";
import {
  deletePaymentMethod,
  fetchPaymentMethods,
  linkWallet,
  unlinkWallet,
} from "@/store/slices/paymentSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSettingScreen() {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const { cards, wallets, netbanking, loading, initialized } = useAppSelector(
    (state) => state.payment,
  );

  const [refreshing, setRefreshing] = useState(false);

  // Link Wallet Modal State
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<
    "esewa" | "khalti"
  >("esewa");
  const [walletIdentifier, setWalletIdentifier] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Load payment methods on focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPaymentMethods());
    }, [dispatch]),
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPaymentMethods());
    setRefreshing(false);
  };

  const handleAddCard = () => {
    router.push("/Screens/Profile/add-card" as any);
  };

  const handleAddNetbanking = () => {
    router.push("/Screens/Profile/select-bank" as any);
  };

  // Open modal to link wallet
  const handleOpenLinkWallet = (type: "esewa" | "khalti") => {
    setSelectedWalletType(type);
    setWalletIdentifier("");
    setWalletModalVisible(true);
  };

  // Submit wallet link
  const handleSubmitLinkWallet = async () => {
    const trimmedId = walletIdentifier.trim();
    if (!trimmedId) {
      Alert.alert(
        "Required",
        `Please enter your ${selectedWalletType === "esewa" ? "eSewa" : "Khalti"} ID or mobile number.`,
      );
      return;
    }

    try {
      setIsLinking(true);
      await dispatch(
        linkWallet({
          walletType: selectedWalletType,
          accountIdentifier: trimmedId,
        }),
      ).unwrap();

      setWalletModalVisible(false);
      setWalletIdentifier("");
      Alert.alert(
        "Wallet Linked",
        `${selectedWalletType === "esewa" ? "eSewa" : "Khalti"} linked successfully.`,
      );
    } catch (err: any) {
      Alert.alert(
        "Failed to Link",
        typeof err === "string"
          ? err
          : "Could not link wallet. Please try again.",
      );
    } finally {
      setIsLinking(false);
    }
  };

  // Unlink wallet confirmation
  const handleUnlinkWallet = (type: "esewa" | "khalti") => {
    const walletLabel = type === "esewa" ? "eSewa" : "Khalti";
    Alert.alert(
      `Unlink ${walletLabel}`,
      `Are you sure you want to unlink your ${walletLabel} account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(unlinkWallet(type)).unwrap();
              Alert.alert("Success", `${walletLabel} unlinked successfully.`);
            } catch (err: any) {
              Alert.alert(
                "Error",
                typeof err === "string"
                  ? err
                  : `Failed to unlink ${walletLabel}.`,
              );
            }
          },
        },
      ],
    );
  };

  // Delete Card Confirmation
  const handleDeleteCard = (card: CardItem) => {
    Alert.alert(
      "Remove Card",
      `Are you sure you want to remove card ending in ${card.last4}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deletePaymentMethod(card._id)).unwrap();
            } catch (err: any) {
              Alert.alert(
                "Error",
                typeof err === "string" ? err : "Failed to remove card.",
              );
            }
          },
        },
      ],
    );
  };

  // Delete Bank Confirmation
  const handleDeleteBank = (bank: NetbankingItem) => {
    Alert.alert(
      "Disconnect Bank",
      `Are you sure you want to disconnect ${bank.bankName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deletePaymentMethod(bank._id)).unwrap();
            } catch (err: any) {
              Alert.alert(
                "Error",
                typeof err === "string" ? err : "Failed to disconnect bank.",
              );
            }
          },
        },
      ],
    );
  };

  // Colors
  const bgColor = isDark ? "#080D0F" : "#F8FAF9";
  const surfaceColor = isDark ? "#151D24" : "#ffffff";
  const textColor = isDark ? "#F8FAFC" : "#1E293B";
  const subTextColor = isDark ? "#A8B2BE" : "#64748B";
  const borderColor = isDark ? "#303B45" : "#F1F5F9";
  const greenColor = isDark ? "#39D353" : "#2D6A4F";
  const iconBoxBg = isDark ? "#1B252E" : "#F4FBEA";

  // Check wallets status
  const esewa = wallets.find((w) => w.walletType === "esewa");
  const khalti = wallets.find((w) => w.walletType === "khalti");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#ffffff" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Navbar Header */}
      <View
        style={[
          styles.navBar,
          { borderBottomColor: borderColor, backgroundColor: surfaceColor },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={scale(24)} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: textColor }]}>
          Payment setting
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={greenColor}
            colors={[greenColor]}
          />
        }
      >
        {loading && !initialized && (
          <View style={styles.initialLoading}>
            <ActivityIndicator size="small" color={greenColor} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading payment methods...
            </Text>
          </View>
        )}

        {/* CARDS SECTION */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Cards
            </Text>
            {cards.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleAddCard}>
                <Text style={[styles.actionGreenText, { color: greenColor }]}>
                  + Add New
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {cards.length > 0 ? (
            <View style={styles.cardList}>
              {cards.map((card, idx) => (
                <View key={card._id || idx}>
                  <View style={styles.savedCardRow}>
                    <View
                      style={[styles.iconBox, { backgroundColor: iconBoxBg }]}
                    >
                      <MaterialCommunityIcons
                        name={
                          card.cardType === "Mastercard"
                            ? "credit-card"
                            : card.cardType === "American Express"
                              ? "credit-card-chip"
                              : "credit-card-outline"
                        }
                        size={scale(22)}
                        color={greenColor}
                      />
                    </View>

                    <View style={styles.labelColumn}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.itemTitle, { color: textColor }]}>
                          {card.cardType} •••• {card.last4}
                        </Text>
                        {card.nickname && (
                          <View
                            style={[
                              styles.nicknameBadge,
                              {
                                backgroundColor: isDark ? "#1B252E" : "#E8F5E9",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.nicknameBadgeText,
                                { color: greenColor },
                              ]}
                            >
                              {card.nickname}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.itemSubtitle, { color: subTextColor }]}
                      >
                        {card.cardHolderName} • Exp: {card.expiryDate}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeleteCard(card)}
                      style={styles.deleteButton}
                    >
                      <Feather
                        name="trash-2"
                        size={scale(18)}
                        color={isDark ? "#EF4444" : "#DC2626"}
                      />
                    </TouchableOpacity>
                  </View>
                  {idx < cards.length - 1 && (
                    <View
                      style={[styles.divider, { backgroundColor: borderColor }]}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.itemRow}>
              <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={scale(22)}
                  color={greenColor}
                />
              </View>

              <Text style={[styles.itemTitle, { color: textColor }]}>
                Add Debit or Credit cards
              </Text>

              <TouchableOpacity activeOpacity={0.7} onPress={handleAddCard}>
                <Text style={[styles.actionGreenText, { color: greenColor }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* WALLETS SECTION */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Wallets
          </Text>

          {/* Esewa */}
          <View style={styles.itemRow}>
            <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
              <Image
                source={require("@/assets/images/Home/logo-esewa.png")}
                style={styles.walletLogo}
                contentFit="contain"
              />
            </View>

            <View style={styles.labelColumn}>
              <View style={styles.walletTitleRow}>
                <Text style={[styles.itemTitle, { color: textColor }]}>
                  Esewa
                </Text>
                {esewa?.isLinked && (
                  <View style={styles.connectedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={scale(14)}
                      color="#22C55E"
                    />
                    <Text style={styles.connectedText}>Linked</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemSubtitle, { color: subTextColor }]}>
                {esewa?.isLinked
                  ? `ID: ${esewa.accountIdentifier}`
                  : "Link Your esewa ID"}
              </Text>
            </View>

            {esewa?.isLinked ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleUnlinkWallet("esewa")}
              >
                <Text style={styles.actionRedText}>Unlink</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenLinkWallet("esewa")}
              >
                <Text style={[styles.actionGreenText, { color: greenColor }]}>
                  Link
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Khalti */}
          <View style={styles.itemRow}>
            <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
              <Image
                source={require("@/assets/images/Home/logo-khalti.png")}
                style={styles.walletLogo}
                contentFit="contain"
              />
            </View>

            <View style={styles.labelColumn}>
              <View style={styles.walletTitleRow}>
                <Text style={[styles.itemTitle, { color: textColor }]}>
                  Khalti
                </Text>
                {khalti?.isLinked && (
                  <View style={styles.connectedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={scale(14)}
                      color="#22C55E"
                    />
                    <Text style={styles.connectedText}>Linked</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemSubtitle, { color: subTextColor }]}>
                {khalti?.isLinked
                  ? `ID: ${khalti.accountIdentifier}`
                  : "Link Your Khalti ID"}
              </Text>
            </View>

            {khalti?.isLinked ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleUnlinkWallet("khalti")}
              >
                <Text style={styles.actionRedText}>Unlink</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenLinkWallet("khalti")}
              >
                <Text style={[styles.actionGreenText, { color: greenColor }]}>
                  Link
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* NETBANKING SECTION */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Netbanking
            </Text>
            {netbanking.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddNetbanking}
              >
                <Text style={[styles.actionGreenText, { color: greenColor }]}>
                  + Add Bank
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {netbanking.length > 0 ? (
            <View style={styles.cardList}>
              {netbanking.map((bank, idx) => (
                <View key={bank._id || idx}>
                  <View style={styles.savedCardRow}>
                    <View
                      style={[styles.iconBox, { backgroundColor: iconBoxBg }]}
                    >
                      <MaterialIcons
                        name="account-balance"
                        size={scale(22)}
                        color={greenColor}
                      />
                    </View>

                    <View style={styles.labelColumn}>
                      <Text style={[styles.itemTitle, { color: textColor }]}>
                        {bank.bankName}
                      </Text>
                      <Text
                        style={[styles.itemSubtitle, { color: subTextColor }]}
                      >
                        {bank.shortCode ? `Code: ${bank.shortCode} • ` : ""}
                        Connected
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeleteBank(bank)}
                      style={styles.deleteButton}
                    >
                      <Feather
                        name="trash-2"
                        size={scale(18)}
                        color={isDark ? "#EF4444" : "#DC2626"}
                      />
                    </TouchableOpacity>
                  </View>
                  {idx < netbanking.length - 1 && (
                    <View
                      style={[styles.divider, { backgroundColor: borderColor }]}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.itemRow}>
              <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                <MaterialIcons
                  name="account-balance"
                  size={scale(22)}
                  color={greenColor}
                />
              </View>

              <Text style={[styles.itemTitle, { color: textColor }]}>
                Netbanking
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddNetbanking}
              >
                <Text style={[styles.actionGreenText, { color: greenColor }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cross-Platform Modal for Linking Wallet */}
      <Modal
        visible={walletModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: surfaceColor, borderColor },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[styles.modalIconBox, { backgroundColor: iconBoxBg }]}
              >
                <Image
                  source={
                    selectedWalletType === "esewa"
                      ? require("@/assets/images/Home/logo-esewa.png")
                      : require("@/assets/images/Home/logo-khalti.png")
                  }
                  style={styles.modalWalletLogo}
                  contentFit="contain"
                />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Link {selectedWalletType === "esewa" ? "eSewa" : "Khalti"}
              </Text>
            </View>

            <Text style={[styles.modalDescription, { color: subTextColor }]}>
              Enter your registered{" "}
              {selectedWalletType === "esewa" ? "eSewa" : "Khalti"} mobile
              number or account ID to connect.
            </Text>

            <TextInput
              value={walletIdentifier}
              onChangeText={setWalletIdentifier}
              placeholder={
                selectedWalletType === "esewa"
                  ? "e.g. 9841000000 or email"
                  : "e.g. 9841000000"
              }
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.modalInput,
                {
                  color: textColor,
                  backgroundColor: isDark ? "#1B252E" : "#F8FAFC",
                  borderColor: isDark ? "#303B45" : "#E2E8F0",
                },
              ]}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isLinking}
                onPress={() => setWalletModalVisible(false)}
                style={[
                  styles.modalCancelBtn,
                  { borderColor: isDark ? "#303B45" : "#CBD5E1" },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelBtnText,
                    { color: isDark ? "#CBD5E1" : "#64748B" },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isLinking}
                onPress={handleSubmitLinkWallet}
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: greenColor },
                  isLinking && { opacity: 0.7 },
                ]}
              >
                {isLinking ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Link Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(40),
    gap: moderateScale(18),
  },
  initialLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: moderateScale(8),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  sectionCard: {
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(16),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: moderateScale(10),
  },
  cardList: {
    gap: moderateScale(6),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(6),
  },
  savedCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  nicknameBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  nicknameBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  walletTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(12),
  },
  connectedText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#22C55E",
  },
  deleteButton: {
    padding: scale(8),
    marginLeft: scale(8),
  },
  iconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
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
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
  },
  actionGreenText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
  },
  actionRedText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#EF4444",
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
  },
  divider: {
    height: 1,
    marginVertical: moderateScale(8),
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(24),
  },
  modalContainer: {
    width: "100%",
    borderRadius: scale(18),
    padding: scale(22),
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginBottom: moderateScale(12),
  },
  modalIconBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  modalWalletLogo: {
    width: scale(34),
    height: scale(34),
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  modalDescription: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(16),
  },
  modalInput: {
    borderWidth: 1.2,
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: Platform.OS === "ios" ? scale(12) : scale(8),
    fontSize: moderateScale(14.5),
    marginBottom: moderateScale(20),
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  modalSubmitBtn: {
    flex: 1.4,
    paddingVertical: moderateScale(12),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitBtnText: {
    color: "#ffffff",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
