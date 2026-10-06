import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutVendorAction, registerVendorAction } from "@/store/slices/vendorAuthSlice";
import { moderateScale, scale } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BankDetailsStep, { BankDetailsData } from "./bank-details";
import BrandKycStep, { BrandKycData } from "./brand-kyc";
import BusinessDetailsStep, { BusinessDetailsData } from "./business-details";
import ProgressBar from "./components/ProgressBar";
import ReviewSubmitStep, { CompleteRegistrationData } from "./review-submit";
import SellerDetailsStep, { SellerDetailsData } from "./seller-details";
import ShippingDetailsStep, { ShippingDetailsData } from "./shipping-details";

export default function VendorRegistrationProcessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const dispatch = useAppDispatch();
  const { vendorUser, vendorDetails } = useAppSelector(
    (state) => state.vendorAuth,
  );

  const initialStep = params.step ? parseInt(params.step, 10) || 1 : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified State for all registration stages
  const [businessData, setBusinessData] = useState<BusinessDetailsData>({
    businessName:
      vendorDetails?.businessDetails?.businessName ||
      (vendorUser?.name ? `${vendorUser.name}'s Store` : ""),
    businessType:
      vendorDetails?.businessDetails?.businessType || "Proprietorship",
    gstNumber: vendorDetails?.businessDetails?.gstNumber || "",
    panNumber: vendorDetails?.businessDetails?.panNumber || "",
    yearEstablished: vendorDetails?.businessDetails?.yearEstablished
      ? String(vendorDetails.businessDetails.yearEstablished)
      : "",
    numberOfEmployees: vendorDetails?.businessDetails?.numberOfEmployees
      ? String(vendorDetails.businessDetails.numberOfEmployees)
      : "",
    categories:
      vendorDetails?.businessDetails?.categories &&
      vendorDetails.businessDetails.categories.length > 0
        ? vendorDetails.businessDetails.categories
        : ["Grocery & Staples"],
    retailChannel:
      vendorDetails?.businessDetails?.retailChannel || "Both Online & Retail",
  });

  const [sellerData, setSellerData] = useState<SellerDetailsData>({
    sellerName:
      vendorDetails?.sellerDetails?.sellerName || vendorUser?.name || "",
    sellerEmail:
      vendorDetails?.sellerDetails?.sellerEmail || vendorUser?.email || "",
    sellerPhone:
      vendorDetails?.sellerDetails?.sellerPhone || vendorUser?.phone || "",
    alternatePhone: "",
    address: vendorDetails?.sellerDetails?.address || "",
    city: vendorDetails?.sellerDetails?.city || "",
    state: vendorDetails?.sellerDetails?.state || "",
    pincode: vendorDetails?.sellerDetails?.pincode || "",
  });

  const [bankData, setBankData] = useState<BankDetailsData>({
    accountHolderName:
      vendorDetails?.bankDetails?.accountHolderName ||
      vendorDetails?.sellerDetails?.sellerName ||
      vendorUser?.name ||
      "",
    bankName: vendorDetails?.bankDetails?.bankName || "",
    accountNumber: vendorDetails?.bankDetails?.accountNumber || "",
    confirmAccountNumber: vendorDetails?.bankDetails?.accountNumber || "",
    ifscCode: vendorDetails?.bankDetails?.ifscCode || "",
    branch: vendorDetails?.bankDetails?.branch || "",
    upiId: "",
  });

  const [shippingData, setShippingData] = useState<ShippingDetailsData>({
    warehouseAddress:
      vendorDetails?.shippingLocations?.warehouseAddress ||
      vendorDetails?.sellerDetails?.address ||
      "",
    city:
      vendorDetails?.shippingLocations?.city ||
      vendorDetails?.sellerDetails?.city ||
      "",
    state:
      vendorDetails?.shippingLocations?.state ||
      vendorDetails?.sellerDetails?.state ||
      "",
    pincode:
      vendorDetails?.shippingLocations?.pincode ||
      vendorDetails?.sellerDetails?.pincode ||
      "",
    deliveryRadius: "10 km",
    processingTime: "15 - 30 Mins",
    operatingHours: "Mon - Sat: 08:00 AM - 08:00 PM",
    latitude: vendorDetails?.shippingLocations?.latitude
      ? String(vendorDetails.shippingLocations.latitude)
      : "",
    longitude: vendorDetails?.shippingLocations?.longitude
      ? String(vendorDetails.shippingLocations.longitude)
      : "",
  });

  const [brandKycData, setBrandKycData] = useState<BrandKycData>({
    brandName:
      vendorDetails?.brandDetails?.brandName ||
      vendorDetails?.businessDetails?.businessName ||
      "",
    trademarkNumber: vendorDetails?.brandDetails?.trademarkNumber || "",
    brandWebsite: "",
    brandLogo: vendorDetails?.brandDetails?.brandLogo || "",
    kycDocType: "citizenship",
    kycDocUri: "",
  });

  // Effect to sync existing vendor data when available
  useEffect(() => {
    if (vendorDetails || vendorUser) {
      if (vendorDetails?.businessDetails?.businessName) {
        setBusinessData((prev) => ({
          ...prev,
          businessName:
            vendorDetails.businessDetails?.businessName || prev.businessName,
          categories:
            vendorDetails.businessDetails?.categories || prev.categories,
        }));
      }
      if (vendorUser || vendorDetails?.sellerDetails) {
        setSellerData((prev) => ({
          ...prev,
          sellerName:
            vendorDetails?.sellerDetails?.sellerName ||
            vendorUser?.name ||
            prev.sellerName,
          sellerEmail:
            vendorDetails?.sellerDetails?.sellerEmail ||
            vendorUser?.email ||
            prev.sellerEmail,
          sellerPhone:
            vendorDetails?.sellerDetails?.sellerPhone ||
            vendorUser?.phone ||
            prev.sellerPhone,
        }));
      }
      if (vendorDetails?.bankDetails?.bankName) {
        setBankData((prev) => ({
          ...prev,
          bankName: vendorDetails.bankDetails?.bankName || prev.bankName,
          accountHolderName:
            vendorDetails.bankDetails?.accountHolderName ||
            prev.accountHolderName,
          accountNumber:
            vendorDetails.bankDetails?.accountNumber || prev.accountNumber,
          ifscCode: vendorDetails.bankDetails?.ifscCode || prev.ifscCode,
        }));
      }
    }
  }, [vendorDetails, vendorUser]);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  const vendorStatus =
    vendorDetails?.status ||
    vendorUser?.status ||
    (hasSubmitted ? "pending" : "draft");

  const isAlreadySubmitted =
    hasSubmitted ||
    vendorStatus === "pending" ||
    vendorStatus === "under_review" ||
    vendorStatus === "active" ||
    vendorStatus === "approved";

  // Step Navigators
  const goNext = () => setCurrentStep((prev) => Math.min(6, prev + 1));
  const goBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));
  const jumpTo = (step: number) => setCurrentStep(step);

  // Final Submission Handler
  const handleFinalSubmit = async () => {
    if (isAlreadySubmitted) {
      Alert.alert(
        "Application Already Submitted",
        "Your vendor registration has already been submitted for verification. Re-submission is disabled."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: sellerData.sellerName || businessData.businessName || "Vendor",
        email: sellerData.sellerEmail.trim(),
        password: "Vendor@Password123", // default or can be customized
        phone: sellerData.sellerPhone.trim(),
        storeName: businessData.businessName.trim(),
        category: businessData.categories[0] || "Grocery",
        address: shippingData.warehouseAddress || sellerData.address,
        city: shippingData.city || sellerData.city,
        state: shippingData.state || sellerData.state,
        pincode: shippingData.pincode || sellerData.pincode,
      };

      await dispatch(registerVendorAction(payload)).unwrap();
      setHasSubmitted(true);

      Alert.alert(
        "Application Submitted!",
        "Your vendor application and details have been submitted for review. Submission is now locked while our onboarding team verifies your account.",
        [
          {
            text: "Done",
            onPress: () => {},
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Submission Notice",
        err ||
          "Application details saved. Our onboarding team will verify your details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your vendor account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await dispatch(logoutVendorAction());
            router.replace("/(auth)/vendorAuth/login/vendorlogin" as any);
          },
        },
      ]
    );
  };

  const fullData: CompleteRegistrationData = {
    business: businessData,
    seller: sellerData,
    bank: bankData,
    shipping: shippingData,
    brandKyc: brandKycData,
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <Text style={styles.navTitle}>Seller Registration Process</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleLogout}
          style={styles.navLogoutBtn}
        >
          <Feather name="log-out" size={scale(13)} color="#DC2626" />
          <Text style={styles.navLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} totalSteps={6} />

      {/* Dynamic Step Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          {currentStep === 1 && (
            <BusinessDetailsStep
              data={businessData}
              onChange={(f, v) => setBusinessData((p) => ({ ...p, [f]: v }))}
              onNext={goNext}
            />
          )}

          {currentStep === 2 && (
            <SellerDetailsStep
              data={sellerData}
              onChange={(f, v) => setSellerData((p) => ({ ...p, [f]: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 3 && (
            <BankDetailsStep
              data={bankData}
              onChange={(f, v) => setBankData((p) => ({ ...p, [f]: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 4 && (
            <ShippingDetailsStep
              data={shippingData}
              onChange={(f, v) => setShippingData((p) => ({ ...p, [f]: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 5 && (
            <BrandKycStep
              data={brandKycData}
              onChange={(f, v) => setBrandKycData((p) => ({ ...p, [f]: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 6 && (
            <ReviewSubmitStep
              formData={fullData}
              onJumpToStep={jumpTo}
              onSubmit={handleFinalSubmit}
              isLoading={isSubmitting}
              onBack={goBack}
              status={vendorStatus}
              isAlreadySubmitted={isAlreadySubmitted}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "700",
    color: "#003844",
  },
  navLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(4),
    borderRadius: scale(6),
  },
  navLogoutText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#DC2626",
  },
  exitText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#94A3B8",
  },
});
