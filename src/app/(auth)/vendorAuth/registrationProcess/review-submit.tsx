import { useAppDispatch } from "@/store/hooks";
import {
  initializeVendorAuth,
  logoutVendorAction,
} from "@/store/slices/vendorAuthSlice";
import { moderateScale, scale } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BankDetailsData } from "./bank-details";
import { BrandKycData } from "./brand-kyc";
import { BusinessDetailsData } from "./business-details";
import { SellerDetailsData } from "./seller-details";
import { ShippingDetailsData } from "./shipping-details";

export interface CompleteRegistrationData {
  business: BusinessDetailsData;
  seller: SellerDetailsData;
  bank: BankDetailsData;
  shipping: ShippingDetailsData;
  brandKyc: BrandKycData;
}

interface ReviewSubmitProps {
  formData: CompleteRegistrationData;
  onJumpToStep: (stepNumber: number) => void;
  onSubmit: () => Promise<void>;
  isLoading?: boolean;
  onBack?: () => void;
  status?: string;
  isAlreadySubmitted?: boolean;
}

export default function ReviewSubmitStep({
  formData,
  onJumpToStep,
  onSubmit,
  isLoading,
  onBack,
  status = "draft",
  isAlreadySubmitted = false,
}: ReviewSubmitProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const normalizedStatus = (status || "draft").toLowerCase();
  const isLocked =
    isAlreadySubmitted ||
    normalizedStatus === "pending" ||
    normalizedStatus === "under_review" ||
    normalizedStatus === "active" ||
    normalizedStatus === "approved";

  const [agreeDeclaration, setAgreeDeclaration] = useState(isLocked);
  const [hasLocallySubmitted, setHasLocallySubmitted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSubmitDisabled = isLocked || hasLocallySubmitted || isLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await dispatch(initializeVendorAuth()).unwrap();
      const updatedStatus = (
        res?.vendor?.status ||
        res?.user?.status ||
        ""
      ).toLowerCase();

      if (updatedStatus === "active" || updatedStatus === "approved") {
        Alert.alert(
          "Account Approved!",
          "Congratulations! Your vendor store has been approved. Redirecting to your Dashboard.",
          [
            {
              text: "Open Dashboard",
              onPress: () => {
                router.replace("/VendorMain/dashboard" as any);
              },
            },
          ]
        );
      }
    } catch {
      // Ignore network failure on pull-to-refresh
    } finally {
      setIsRefreshing(false);
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
      ],
    );
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      Alert.alert(
        "Application Already Submitted",
        "Your vendor registration has already been submitted and is currently being verified. You cannot submit again.",
      );
      return;
    }

    if (!agreeDeclaration) {
      Alert.alert(
        "Declaration Required",
        "Please confirm the declaration checkbox to confirm that all submitted details are genuine.",
      );
      return;
    }

    setHasLocallySubmitted(true);
    try {
      await onSubmit();
    } catch {
      // Allow retry only if actual submission failed
      setHasLocallySubmitted(false);
    }
  };

  // Status-specific banner configuration
  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case "active":
      case "approved":
        return {
          title: "Store Approved & Active",
          badge: "ACTIVE SELLER",
          message:
            "Your vendor account and KYC have been verified by BhansaMart. Your store is live and ready for orders.",
          bgColor: "#F0FDF4",
          borderColor: "#86EFAC",
          badgeBg: "#DCFCE7",
          textColor: "#15803D",
          iconName: "check-decagram" as const,
          iconColor: "#16A34A",
        };
      case "rejected":
        return {
          title: "Action Required / Rejected",
          badge: "REVISION REQUIRED",
          message:
            "Some documents or details were rejected during review. Please edit the required sections and resubmit.",
          bgColor: "#FEF2F2",
          borderColor: "#FECACA",
          badgeBg: "#FEE2E2",
          textColor: "#991B1B",
          iconName: "alert-circle" as const,
          iconColor: "#DC2626",
        };
      case "pending":
      case "under_review":
        return {
          title: "Application Under Review",
          badge: "PENDING APPROVAL",
          message:
            "Your store registration and KYC are undergoing manual verification by our onboarding team. Submission is locked during verification.",
          bgColor: "#FFFBEB",
          borderColor: "#FCD34D",
          badgeBg: "#FEF3C7",
          textColor: "#B45309",
          iconName: "clock-outline" as const,
          iconColor: "#D97706",
        };
      default:
        return {
          title: "Draft Application",
          badge: isAlreadySubmitted ? "SUBMITTED" : "READY TO SUBMIT",
          message: isAlreadySubmitted
            ? "Your registration has been submitted successfully."
            : "Review all the entered business, banking, and shipping details below before final submission.",
          bgColor: "#F0F9FF",
          borderColor: "#BAE6FD",
          badgeBg: "#E0F2FE",
          textColor: "#0369A1",
          iconName: "file-document-edit-outline" as const,
          iconColor: "#0284C7",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={["#003844", "#008080"]}
          tintColor="#003844"
          title="Updating review status..."
          titleColor="#64748B"
        />
      }
    >
      {/* Top Header Row with Title & Logout */}
      <View style={styles.topHeaderRow}>
        <View style={{ flex: 1, marginRight: scale(10) }}>
          <Text style={styles.title}>Review & Final Verification</Text>
          <Text style={styles.subtitle}>
            Verify your store information and onboarding status.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Feather name="log-out" size={scale(14)} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* HIGHLIGHTED STATUS BANNER AT TOP */}
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: statusConfig.bgColor,
            borderColor: statusConfig.borderColor,
          },
        ]}
      >
        <View style={styles.statusBannerTopRow}>
          <View style={styles.statusIconWrap}>
            <MaterialCommunityIcons
              name={statusConfig.iconName}
              size={scale(22)}
              color={statusConfig.iconColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusBannerTitle}>{statusConfig.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusConfig.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: statusConfig.textColor },
                  ]}
                >
                  {statusConfig.badge}
                </Text>
              </View>
            </View>
            <Text style={styles.statusBannerMessage}>
              {statusConfig.message}
            </Text>
          </View>
        </View>

        {isLocked && (
          <View style={styles.lockedNoticeRow}>
            <Ionicons name="lock-closed" size={scale(13)} color="#B45309" />
            <Text style={styles.lockedNoticeText}>
              Submissions are restricted to 1 time. Details are currently locked
              for evaluation.
            </Text>
          </View>
        )}
      </View>

      {/* 1. Business Info Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={scale(17)}
              color="#003844"
            />
            <Text style={styles.cardTitle}>1. Business Information</Text>
          </View>
          {!isLocked && (
            <TouchableOpacity onPress={() => onJumpToStep(1)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.primaryText}>
            {formData.business.businessName || "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            Type: {formData.business.businessType || "N/A"} &middot;
            Established: {formData.business.yearEstablished || "N/A"}
          </Text>
          {formData.business.gstNumber ? (
            <Text style={styles.secondaryText}>
              GSTIN: {formData.business.gstNumber}
            </Text>
          ) : null}
          {formData.business.panNumber ? (
            <Text style={styles.secondaryText}>
              PAN: {formData.business.panNumber}
            </Text>
          ) : null}
          <View style={styles.chipsRow}>
            {(formData.business.categories || []).map((c) => (
              <View key={c} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 2. Seller Details Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <MaterialCommunityIcons
              name="account-outline"
              size={scale(17)}
              color="#003844"
            />
            <Text style={styles.cardTitle}>2. Seller Contact</Text>
          </View>
          {!isLocked && (
            <TouchableOpacity onPress={() => onJumpToStep(2)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.primaryText}>
            {formData.seller.sellerName || "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            Email: {formData.seller.sellerEmail || "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            Phone: {formData.seller.sellerPhone || "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            Address: {formData.seller.address || ""},{" "}
            {formData.seller.city || ""} {formData.seller.pincode || ""}
          </Text>
        </View>
      </View>

      {/* 3. Bank & Payout Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <MaterialCommunityIcons
              name="bank-outline"
              size={scale(17)}
              color="#003844"
            />
            <Text style={styles.cardTitle}>3. Bank & Settlements</Text>
          </View>
          {!isLocked && (
            <TouchableOpacity onPress={() => onJumpToStep(3)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.primaryText}>
            {formData.bank.bankName || "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            Account Holder: {formData.bank.accountHolderName || "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            Account: ••••••••
            {formData.bank.accountNumber
              ? formData.bank.accountNumber.slice(-4)
              : "N/A"}
          </Text>
          <Text style={styles.secondaryText}>
            IFSC: {formData.bank.ifscCode || "N/A"} &middot; Branch:{" "}
            {formData.bank.branch || "N/A"}
          </Text>
        </View>
      </View>

      {/* 4. Shipping Details Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={scale(17)}
              color="#003844"
            />
            <Text style={styles.cardTitle}>4. Shipping & Warehouse</Text>
          </View>
          {!isLocked && (
            <TouchableOpacity onPress={() => onJumpToStep(4)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.primaryText}>
            {formData.shipping.warehouseAddress || "N/A"},{" "}
            {formData.shipping.city || ""} {formData.shipping.pincode || ""}
          </Text>
          <Text style={styles.secondaryText}>
            Radius: {formData.shipping.deliveryRadius || "10 km"} &middot; Prep
            Time: {formData.shipping.processingTime || "15 - 30 Mins"}
          </Text>
          {formData.shipping.operatingHours ? (
            <Text style={styles.secondaryText}>
              Hours: {formData.shipping.operatingHours}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 5. Brand & KYC Card */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={scale(17)}
              color="#003844"
            />
            <Text style={styles.cardTitle}>5. Brand & KYC Verification</Text>
          </View>
          {!isLocked && (
            <TouchableOpacity onPress={() => onJumpToStep(5)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.brandRow}>
            {formData.brandKyc.brandLogo ? (
              <Image
                source={{ uri: formData.brandKyc.brandLogo }}
                style={styles.logoThumb}
                contentFit="cover"
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryText}>
                {formData.brandKyc.brandName ||
                  formData.business.businessName ||
                  "Store"}
              </Text>
              <Text style={styles.secondaryText}>
                ID Document:{" "}
                {formData.brandKyc.kycDocUri ? "Uploaded ✓" : "Pending Upload"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Declaration Checkbox */}
      <TouchableOpacity
        activeOpacity={isLocked ? 1 : 0.8}
        onPress={() => !isLocked && setAgreeDeclaration((prev) => !prev)}
        style={styles.declarationRow}
      >
        <View
          style={[
            styles.checkbox,
            (agreeDeclaration || isLocked) && styles.checkboxActive,
            isLocked && styles.checkboxDisabled,
          ]}
        >
          {(agreeDeclaration || isLocked) && (
            <Ionicons name="checkmark" size={scale(12)} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.declarationText}>
          I hereby declare that the information and documents provided above are
          true and accurate to the best of my knowledge.
        </Text>
      </TouchableOpacity>

      {/* Submission status notice if locked */}
      {isLocked && (
        <View style={styles.lockedFooterCard}>
          <Ionicons
            name="information-circle"
            size={scale(18)}
            color="#008080"
          />
          <Text style={styles.lockedFooterText}>
            Your registration is already submitted for evaluation. Repeated
            submissions are disabled. Our team will notify you once verified.
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.btnRow}>
        {onBack && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.prevBtn}
          >
            <Feather name="arrow-left" size={scale(16)} color="#003844" />
            <Text style={styles.prevBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={isSubmitDisabled ? 1 : 0.85}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          style={[
            styles.submitBtn,
            isSubmitDisabled && styles.submitBtnDisabled,
            isLoading && { opacity: 0.8 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : isLocked || hasLocallySubmitted ? (
            <>
              <MaterialCommunityIcons
                name="lock-check"
                size={scale(18)}
                color="#E2E8F0"
              />
              <Text style={styles.submitBtnTextDisabled}>
                Registration Submitted
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="check-decagram"
                size={scale(18)}
                color="#86C4CB"
              />
              <Text style={styles.submitBtnText}>Submit Registration</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  statusBanner: {
    borderRadius: scale(12),
    borderWidth: 1.5,
    padding: scale(14),
    marginBottom: moderateScale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBannerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(10),
  },
  statusIconWrap: {
    marginTop: scale(2),
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(4),
    flexWrap: "wrap",
    gap: scale(6),
  },
  statusBannerTitle: {
    fontSize: moderateScale(14.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2.5),
    borderRadius: scale(20),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusBannerMessage: {
    fontSize: moderateScale(12),
    color: "#475569",
    lineHeight: moderateScale(17),
  },
  lockedNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: moderateScale(10),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  lockedNoticeText: {
    fontSize: moderateScale(11),
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(6.5),
    borderRadius: scale(8),
  },
  logoutBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#DC2626",
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#003844",
    marginBottom: moderateScale(3),
  },
  subtitle: {
    fontSize: moderateScale(12),
    color: "#64748B",
    lineHeight: moderateScale(17),
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: moderateScale(14),
    overflow: "hidden",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  cardHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  cardTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#003844",
  },
  editBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#008080",
  },
  cardBody: {
    padding: scale(14),
  },
  primaryText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: scale(3),
  },
  secondaryText: {
    fontSize: moderateScale(12),
    color: "#475569",
    marginBottom: scale(3),
    lineHeight: moderateScale(16),
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    marginTop: moderateScale(6),
  },
  categoryBadge: {
    backgroundColor: "#E6F4F6",
    paddingVertical: scale(3),
    paddingHorizontal: scale(8),
    borderRadius: scale(12),
  },
  categoryBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#003844",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  logoThumb: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
  },
  declarationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: moderateScale(14),
    gap: scale(10),
  },
  checkbox: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(4),
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginTop: scale(2),
  },
  checkboxActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  checkboxDisabled: {
    backgroundColor: "#64748B",
    borderColor: "#64748B",
  },
  declarationText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: "#475569",
    lineHeight: moderateScale(16),
  },
  lockedFooterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#E6F4F6",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: moderateScale(14),
  },
  lockedFooterText: {
    fontSize: moderateScale(11.5),
    color: "#004D5A",
    flex: 1,
    lineHeight: moderateScale(16),
    fontWeight: "500",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginTop: moderateScale(4),
  },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    height: moderateScale(46),
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    gap: scale(6),
  },
  prevBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#003844",
  },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003844",
    height: moderateScale(46),
    borderRadius: scale(8),
    gap: scale(8),
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  submitBtnTextDisabled: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#F8FAFC",
  },
});
