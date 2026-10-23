import { Image } from "expo-image";
import { useCart } from "@/context/cart-context";
import { moderateScale, scale, useTheme } from "@/theme";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createOrder } from "@/store/slices/orderSlice";
import socketService from "@/store/services/socketService";
import { fetchCheckoutPaymentMethodsApi } from "@/store/services/paymentService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    paymentMethod?: string;
    deliveryAddress?: string;
  }>();

  const { activeDisplayLocation, selectedAddress } = useAppSelector(
    (state) => state.address
  );

  const {
    cartItems,
    totalCount,
    totalPrice: itemsTotal,
    totalOriginalPrice: originalTotal,
    totalSavings,
    clearCart,
  } = useCart();

  const [orderId] = useState(`BM${Date.now().toString().slice(-8)}`);
  const [copied, setCopied] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(
    params.deliveryAddress ||
      activeDisplayLocation ||
      selectedAddress?.addressLine ||
      "Floor 5, Building name, land mark, Baneshwor, Kathmandu"
  );
  const [paymentMethod, setPaymentMethod] = useState(
    params.paymentMethod || "Cash on delivery"
  );

  const [checkoutConfig, setCheckoutConfig] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    const loadPaymentConfig = async () => {
      try {
        const res = await fetchCheckoutPaymentMethodsApi();
        const payload = res?.data || res;
        if (payload?.paymentMethods) {
          setCheckoutConfig(payload);
          const activeMethods = payload.paymentMethods || [];
          if (activeMethods.length > 0 && !params.paymentMethod) {
            const hasCod = activeMethods.some(
              (m: any) => m.methodKey === "cod" && m.isEnabled !== false
            );
            if (!hasCod && activeMethods[0]?.displayName) {
              setPaymentMethod(activeMethods[0].displayName);
            }
          }
        }
      } catch (err) {
        console.warn("[Checkout] Failed to load checkout payment config", err);
      }
    };
    loadPaymentConfig();
  }, [params.paymentMethod]);

  const handlingCharge = cartItems.length > 0 ? 30 : 0;
  const grandTotal = itemsTotal + handlingCharge;

  const availableMethods = useMemo(() => {
    if (checkoutConfig?.paymentMethods && checkoutConfig.paymentMethods.length > 0) {
      return checkoutConfig.paymentMethods.filter((m: any) => m.isEnabled !== false);
    }
    return [
      {
        methodKey: "cod",
        displayName: "Cash on delivery",
        isEnabled: true,
        instructions: "Pay with cash at your doorstep upon delivery",
        maxAmount: 10000,
      },
      {
        methodKey: "esewa",
        displayName: "eSewa Mobile Wallet",
        isEnabled: true,
        instructions: "Instant transfer via eSewa",
      },
      {
        methodKey: "khalti",
        displayName: "Khalti Digital Wallet",
        isEnabled: true,
        instructions: "Fast checkout using Khalti",
      },
      {
        methodKey: "bank_transfer",
        displayName: "Direct Bank Transfer",
        isEnabled: true,
        instructions: "Direct NEFT / IPS bank transfer to platform treasury",
      },
    ];
  }, [checkoutConfig]);

  const dispatch = useAppDispatch();
  const { customerLoading } = useAppSelector((state) => state.order);

  const handleCopyOrderId = () => {
    setCopied(true);
    Alert.alert("Copied", `Order ID ${orderId} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Cart Empty", "Please add items to your cart before checking out.");
      return;
    }

    if (!deliveryAddress) {
      Alert.alert("Missing Address", "Please select or enter a valid delivery address.");
      return;
    }

    // Validate COD limit or disabled payment methods
    const currentMethodObj = availableMethods.find(
      (m: any) =>
        m.displayName?.toLowerCase() === paymentMethod.toLowerCase() ||
        (m.methodKey === "cod" && paymentMethod.toLowerCase().includes("delivery")) ||
        (m.methodKey === "bank_transfer" && paymentMethod.toLowerCase().includes("bank"))
    );

    if (
      currentMethodObj?.methodKey === "cod" &&
      currentMethodObj.maxAmount &&
      currentMethodObj.maxAmount > 0 &&
      grandTotal > currentMethodObj.maxAmount
    ) {
      Alert.alert(
        "COD Limit Exceeded",
        `Cash on Delivery is limited to Rs. ${currentMethodObj.maxAmount}. Please choose a digital wallet or bank transfer to proceed.`
      );
      setPaymentModalVisible(true);
      return;
    }

    try {
      const itemsPayload = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        imageUrl: item.imageUrl,
        weight: item.weight,
      }));

      const actionResult = await dispatch(
        createOrder({
          items: itemsPayload,
          deliveryAddress: {
            addressLine: deliveryAddress,
            city: selectedAddress?.city || "Kathmandu",
            phone: selectedAddress?.phone || "9800000000",
            street: selectedAddress?.street || "",
            houseNo: selectedAddress?.houseNo || "",
            landmark: selectedAddress?.landmark || "",
          },
          paymentMethod,
          idempotencyKey: orderId,
        })
      );

      if (createOrder.fulfilled.match(actionResult)) {
        const created = actionResult.payload;
        clearCart();
        // Subscribe to real-time updates for this order
        socketService.subscribeToOrder(created._id);

        router.replace({
          pathname: "/Screens/Profile/order-summary" as any,
          params: {
            orderId: created._id,
            orderNumber: created.orderNumber,
          },
        });
      } else {
        const errorMsg =
          (actionResult.payload as string) ||
          "Failed to place order. Please try again.";
        Alert.alert("Order Failed", errorMsg);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred.");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header with SafeAreaView for full status-bar coverage */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={scale(22)} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Title and Subtitle Block */}
        <View style={styles.titleSection}>
          <Text style={styles.checkoutTitle}>Checkout</Text>
          <Text style={styles.arrivingSubtext}>Arriving in 10-15 mins</Text>
        </View>

        {/* items in this order header */}
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsHeaderText}>
            {totalCount} {totalCount === 1 ? "item" : "items"} in this order
          </Text>
        </View>
        <View style={styles.headerDivider} />
      </SafeAreaView>

      {/* Main Scrollable Content */}
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ordered Items List */}
          <View style={styles.itemsList}>
            {cartItems.map((item, index) => (
              <View
                key={item.id + index}
                style={[
                  styles.itemRow,
                  index < cartItems.length - 1 && styles.itemDivider,
                ]}
              >
                {/* Thumbnail */}
                <View style={styles.imageBox}>
                  <Image
                    source={{
                      uri:
                        item.imageUrl ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80",
                    }}
                    style={styles.productImage}
                    contentFit="contain"
                  />
                </View>

                {/* Details */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.packInfo}>
                    {item.weight || "1 unit"} • Qty: {item.quantity}
                  </Text>
                </View>

                {/* Pricing on Right */}
                <View style={styles.itemPriceCol}>
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <Text style={styles.strikethroughPrice}>
                      Rs.{item.originalPrice * item.quantity}
                    </Text>
                  ) : null}
                  <Text style={styles.finalPrice}>
                    Rs.{item.price * item.quantity}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Bill details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bill details</Text>
            <View style={styles.cardDivider} />

            <View style={styles.billRows}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>MRP</Text>
                <Text style={styles.billValue}>Rs.{originalTotal || itemsTotal}</Text>
              </View>

              {totalSavings > 0 ? (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Product discount</Text>
                  <Text style={styles.discountValue}>-Rs.{totalSavings}</Text>
                </View>
              ) : null}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item total</Text>
                <Text style={styles.billValue}>Rs.{itemsTotal}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Handling charge</Text>
                <Text style={styles.billValue}>Rs.{handlingCharge}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery charge</Text>
                <Text style={styles.freeValue}>FREE</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Bill Total Row */}
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>Bill total</Text>
              <Text style={styles.billTotalValue}>Rs.{grandTotal}</Text>
            </View>
          </View>

          {/* Order details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order details</Text>
            <View style={styles.cardDivider} />

            <View style={styles.orderDetailsList}>
              {/* Order ID */}
              <View style={styles.orderDetailItem}>
                <Text style={styles.detailLabel}>Order id</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCopyOrderId}
                  style={styles.orderIdRow}
                >
                  <Text style={styles.detailValueBold}>{orderId}</Text>
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={scale(16)}
                    color={copied ? "#059669" : "#475569"}
                  />
                </TouchableOpacity>
              </View>

              {/* Payment */}
              <View style={styles.orderDetailItem}>
                <Text style={styles.detailLabel}>Payment</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setPaymentModalVisible(true)}
                  style={{ flexDirection: "row", alignItems: "center", gap: scale(4) }}
                >
                  <Text style={[styles.detailValue, { fontWeight: "700", color: "#0B4D58" }]}>
                    {paymentMethod}
                  </Text>
                  <Feather name="chevron-right" size={scale(14)} color="#0B4D58" />
                </TouchableOpacity>
              </View>

              {/* Direct Bank Account Card if Bank selected */}
              {paymentMethod.toLowerCase().includes("bank") && checkoutConfig?.bankDetails && (
                <View style={styles.bankReferenceBox}>
                  <View style={styles.bankHeaderRow}>
                    <MaterialCommunityIcons name="bank" size={scale(15)} color="#059669" />
                    <Text style={styles.bankNameText}>
                      {checkoutConfig.bankDetails.bankName || "Platform Bank"}
                    </Text>
                  </View>
                  <Text style={styles.bankDetailRowText}>
                    A/C: {checkoutConfig.bankDetails.accountNumber}
                  </Text>
                  <Text style={styles.bankDetailRowText}>
                    Holder: {checkoutConfig.bankDetails.accountHolderName}
                  </Text>
                  {checkoutConfig.bankDetails.ifscOrRoutingCode ? (
                    <Text style={styles.bankDetailRowText}>
                      Code: {checkoutConfig.bankDetails.ifscOrRoutingCode}
                    </Text>
                  ) : null}
                  {checkoutConfig.bankDetails.instructions ? (
                    <Text style={styles.bankInstructionsText}>
                      Note: {checkoutConfig.bankDetails.instructions}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Deliver To */}
              <View style={styles.orderDetailItem}>
                <View style={styles.deliverToHeader}>
                  <Text style={styles.detailLabel}>Deliver to</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push("/Screens/Profile/address" as any)
                    }
                  >
                    <Feather name="edit-3" size={scale(15)} color="#475569" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailValue}>{deliveryAddress}</Text>
              </View>

              {/* Order Placed */}
              <View style={styles.orderDetailItem}>
                <Text style={styles.detailLabel}>Order placed</Text>
                <Text style={styles.detailValue}>Placed today, 10:00 AM</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Confirmation Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, scale(12)),
            },
          ]}
        >
          {/* Left Payment info */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPaymentModalVisible(true)}
            style={styles.paymentLeft}
          >
            <MaterialCommunityIcons
              name="cash-multiple"
              size={scale(20)}
              color="#64748B"
            />
            <View>
              <Text style={styles.payUsingLabel}>Pay using</Text>
              <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
            </View>
          </TouchableOpacity>

          {/* Right Confirm Order CTA Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConfirmOrder}
            disabled={customerLoading}
            style={[
              styles.confirmOrderBtn,
              customerLoading && { opacity: 0.75 },
            ]}
          >
            <View style={styles.btnPriceCol}>
              <Text style={styles.btnPriceText}>Rs.{grandTotal}</Text>
              <Text style={styles.btnTotalLabel}>Total</Text>
            </View>

            <View style={styles.btnActionCol}>
              {customerLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.confirmOrderText}>Confirm Order</Text>
                  <Ionicons
                    name="caret-forward"
                    size={scale(14)}
                    color="#ffffff"
                    style={{ marginLeft: scale(2) }}
                  />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Method Selector Bottom Sheet Modal */}
        <Modal
          visible={paymentModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setPaymentModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalIndicator} />

              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Choose Payment Method</Text>
                  <Text style={styles.modalSubtitle}>
                    Active payment gateways & wallets
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPaymentModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={scale(18)} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.methodsList}
              >
                {availableMethods.map((method: any) => {
                  const isSelected =
                    paymentMethod.toLowerCase() === method.displayName?.toLowerCase() ||
                    (method.methodKey === "cod" && paymentMethod.toLowerCase().includes("delivery")) ||
                    (method.methodKey === "bank_transfer" && paymentMethod.toLowerCase().includes("bank"));

                  const isCodOverLimit =
                    method.methodKey === "cod" &&
                    method.maxAmount &&
                    method.maxAmount > 0 &&
                    grandTotal > method.maxAmount;

                  let iconElement = (
                    <MaterialCommunityIcons
                      name="credit-card-outline"
                      size={scale(20)}
                      color="#475569"
                    />
                  );
                  let badgeBg = "#F1F5F9";
                  let badgeTextColor = "#475569";
                  let badgeText = "";

                  if (method.methodKey === "cod") {
                    iconElement = (
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={scale(20)}
                        color="#059669"
                      />
                    );
                    badgeBg = "#ECFDF5";
                    badgeTextColor = "#059669";
                    badgeText = method.maxAmount ? `Up to Rs.${method.maxAmount}` : "Cash";
                  } else if (method.methodKey === "esewa") {
                    iconElement = (
                      <Ionicons
                        name="wallet-outline"
                        size={scale(20)}
                        color="#16A34A"
                      />
                    );
                    badgeBg = "#DCFCE7";
                    badgeTextColor = "#16A34A";
                    badgeText = "eSewa Direct";
                  } else if (method.methodKey === "khalti") {
                    iconElement = (
                      <MaterialCommunityIcons
                        name="wallet"
                        size={scale(20)}
                        color="#7C3AED"
                      />
                    );
                    badgeBg = "#F3E8FF";
                    badgeTextColor = "#7C3AED";
                    badgeText = "Khalti Wallet";
                  } else if (method.methodKey === "upi") {
                    iconElement = (
                      <MaterialCommunityIcons
                        name="qrcode-scan"
                        size={scale(20)}
                        color="#0284C7"
                      />
                    );
                    badgeBg = "#E0F2FE";
                    badgeTextColor = "#0284C7";
                    badgeText = "Fonepay / UPI";
                  } else if (method.methodKey === "bank_transfer") {
                    iconElement = (
                      <MaterialCommunityIcons
                        name="bank"
                        size={scale(20)}
                        color="#D97706"
                      />
                    );
                    badgeBg = "#FEF3C7";
                    badgeTextColor = "#D97706";
                    badgeText = "Direct Treasury";
                  } else if (method.methodKey === "wallet") {
                    iconElement = (
                      <MaterialCommunityIcons
                        name="wallet-giftcard"
                        size={scale(20)}
                        color="#0D9488"
                      />
                    );
                    badgeBg = "#CCFBF1";
                    badgeTextColor = "#0D9488";
                    badgeText = "Store Wallet";
                  } else if (method.methodKey === "card") {
                    iconElement = (
                      <Feather
                        name="credit-card"
                        size={scale(20)}
                        color="#4F46E5"
                      />
                    );
                    badgeBg = "#EEF2FF";
                    badgeTextColor = "#4F46E5";
                    badgeText = "Cards";
                  }

                  return (
                    <TouchableOpacity
                      key={method.methodKey || method.displayName}
                      activeOpacity={isCodOverLimit ? 1 : 0.7}
                      onPress={() => {
                        if (isCodOverLimit) {
                          Alert.alert(
                            "COD Exceeded",
                            `Cash on Delivery is limited to Rs.${method.maxAmount}. Your cart total is Rs.${grandTotal}.`
                          );
                          return;
                        }
                        setPaymentMethod(method.displayName);
                        setPaymentModalVisible(false);
                      }}
                      style={[
                        styles.methodCard,
                        isSelected && styles.methodCardSelected,
                        isCodOverLimit && { opacity: 0.5 },
                      ]}
                    >
                      <View style={styles.methodCardLeft}>
                        <View style={styles.methodIconBox}>{iconElement}</View>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: scale(6),
                              flexWrap: "wrap",
                            }}
                          >
                            <Text style={styles.methodTitle}>
                              {method.displayName}
                            </Text>
                            {badgeText ? (
                              <View
                                style={[
                                  styles.badgePill,
                                  { backgroundColor: badgeBg },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.badgeText,
                                    { color: badgeTextColor },
                                  ]}
                                >
                                  {badgeText}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {method.accountIdentifier ? (
                            <Text style={styles.methodAccountText}>
                              ID: {method.accountIdentifier}
                            </Text>
                          ) : null}
                          {method.instructions ? (
                            <Text
                              style={styles.methodInstructionsText}
                              numberOfLines={1}
                            >
                              {method.instructions}
                            </Text>
                          ) : null}
                          {isCodOverLimit ? (
                            <Text style={styles.codLimitWarning}>
                              Cart exceeds max limit of Rs.{method.maxAmount}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <Ionicons
                        name={
                          isSelected ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={scale(22)}
                        color={isSelected ? "#0B4D58" : "#CBD5E1"}
                      />
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setPaymentModalVisible(false);
                    router.push("/Screens/Profile/paymentsetting" as any);
                  }}
                  style={styles.managePaymentBtn}
                >
                  <Ionicons
                    name="settings-outline"
                    size={scale(16)}
                    color="#64748B"
                  />
                  <Text style={styles.managePaymentText}>
                    Manage Saved Cards & Wallets
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={scale(15)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeAreaHeader: {
    backgroundColor: "#ffffff",
  },
  navBar: {
    height: moderateScale(40),
    paddingHorizontal: scale(16),
    justifyContent: "center",
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
  },
  titleSection: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(4),
  },
  checkoutTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  arrivingSubtext: {
    fontSize: moderateScale(13),
    color: "#0284C7",
    fontWeight: "600",
    marginTop: moderateScale(2),
  },
  itemsHeader: {
    paddingHorizontal: scale(16),
    marginTop: moderateScale(16),
    paddingBottom: moderateScale(10),
  },
  itemsHeaderText: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: scale(16),
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: moderateScale(24),
    gap: moderateScale(16),
  },
  itemsList: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  imageBox: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
    padding: scale(3),
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    flex: 1,
    paddingRight: scale(8),
  },
  itemName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
    marginBottom: moderateScale(2),
  },
  packInfo: {
    fontSize: moderateScale(11),
    color: "#64748B",
  },
  itemPriceCol: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: scale(6),
  },
  strikethroughPrice: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  finalPrice: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(14),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(8),
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: moderateScale(10),
  },
  billRows: {
    gap: moderateScale(8),
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  billLabel: {
    fontSize: moderateScale(13),
    color: "#475569",
    fontWeight: "500",
  },
  billValue: {
    fontSize: moderateScale(13),
    color: "#1E293B",
    fontWeight: "600",
  },
  discountValue: {
    fontSize: moderateScale(13),
    color: "#2563EB",
    fontWeight: "600",
  },
  freeValue: {
    fontSize: moderateScale(13),
    color: "#059669",
    fontWeight: "600",
  },
  billTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(2),
  },
  billTotalLabel: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1E293B",
  },
  billTotalValue: {
    fontSize: moderateScale(15.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  orderDetailsList: {
    gap: moderateScale(12),
  },
  orderDetailItem: {
    gap: moderateScale(2),
  },
  detailLabel: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    fontWeight: "500",
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  detailValueBold: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  detailValue: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
  },
  deliverToHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(2),
  },
  bottomBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  payUsingLabel: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    fontWeight: "500",
  },
  paymentMethodText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  confirmOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B4D58",
    borderRadius: scale(10),
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(8),
    gap: scale(12),
  },
  btnPriceCol: {
    alignItems: "flex-start",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.25)",
    paddingRight: scale(10),
  },
  btnPriceText: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#ffffff",
  },
  btnTotalLabel: {
    fontSize: moderateScale(9.5),
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
  },
  btnActionCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  confirmOrderText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#ffffff",
  },
  bankReferenceBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: scale(10),
    padding: scale(12),
    gap: moderateScale(4),
    marginTop: moderateScale(4),
  },
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: moderateScale(2),
  },
  bankNameText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#065F46",
  },
  bankDetailRowText: {
    fontSize: moderateScale(12),
    color: "#047857",
    fontWeight: "500",
  },
  bankInstructionsText: {
    fontSize: moderateScale(11),
    color: "#059669",
    fontStyle: "italic",
    marginTop: moderateScale(2),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingHorizontal: scale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(28),
    maxHeight: "80%",
  },
  modalIndicator: {
    width: scale(36),
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: moderateScale(12),
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  modalTitle: {
    fontSize: moderateScale(16.5),
    fontWeight: "800",
    color: "#1E293B",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  modalCloseBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  methodsList: {
    gap: moderateScale(10),
    paddingBottom: moderateScale(16),
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: scale(12),
    padding: scale(12),
  },
  methodCardSelected: {
    borderColor: "#0B4D58",
    backgroundColor: "#F0FDF4",
  },
  methodCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  methodIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  methodTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#1E293B",
  },
  badgePill: {
    paddingHorizontal: scale(6),
    paddingVertical: moderateScale(2),
    borderRadius: scale(6),
  },
  badgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "700",
  },
  methodAccountText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#059669",
    marginTop: moderateScale(2),
  },
  methodInstructionsText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  codLimitWarning: {
    fontSize: moderateScale(10.5),
    color: "#DC2626",
    fontWeight: "600",
    marginTop: moderateScale(2),
  },
  managePaymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: scale(10),
    padding: scale(12),
    marginTop: moderateScale(4),
  },
  managePaymentText: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#475569",
    flex: 1,
    marginLeft: scale(8),
  },
});
