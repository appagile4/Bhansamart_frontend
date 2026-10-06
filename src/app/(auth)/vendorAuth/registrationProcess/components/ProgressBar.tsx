import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface StepItem {
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
}

export const ONBOARDING_STEPS: StepItem[] = [
  { id: 1, title: "Business Info", shortTitle: "Business", icon: "briefcase" },
  { id: 2, title: "Seller Contact", shortTitle: "Seller", icon: "user" },
  { id: 3, title: "Bank Details", shortTitle: "Bank", icon: "credit-card" },
  { id: 4, title: "Shipping & Warehouse", shortTitle: "Shipping", icon: "truck" },
  { id: 5, title: "Brand & KYC", shortTitle: "Brand", icon: "shield" },
  { id: 6, title: "Review & Submit", shortTitle: "Review", icon: "check-circle" },
];

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export default function ProgressBar({
  currentStep,
  totalSteps = 6,
}: ProgressBarProps) {
  const activeStep = ONBOARDING_STEPS[currentStep - 1] || ONBOARDING_STEPS[0];
  const progressPercent = Math.min(
    100,
    Math.round((currentStep / totalSteps) * 100)
  );

  return (
    <View style={styles.container}>
      {/* Top Step Counter Row */}
      <View style={styles.headerRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            STEP {currentStep} OF {totalSteps}
          </Text>
        </View>
        <Text style={styles.percentText}>{progressPercent}% COMPLETED</Text>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Step Icon Pills Row */}
      <View style={styles.stepsRow}>
        {ONBOARDING_STEPS.map((step) => {
          const isPassed = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <View key={step.id} style={styles.stepIndicatorItem}>
              <View
                style={[
                  styles.circle,
                  isPassed && styles.circlePassed,
                  isActive && styles.circleActive,
                ]}
              >
                {isPassed ? (
                  <Feather name="check" size={scale(12)} color="#FFFFFF" />
                ) : (
                  <Feather
                    name={step.icon as any}
                    size={scale(11)}
                    color={isActive ? "#FFFFFF" : "#94A3B8"}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isPassed && styles.stepLabelPassed,
                ]}
                numberOfLines={1}
              >
                {step.shortTitle}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(18),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  stepBadge: {
    backgroundColor: "#E6F4F6",
    paddingHorizontal: scale(8),
    paddingVertical: moderateScale(3),
    borderRadius: scale(6),
  },
  stepBadgeText: {
    fontSize: moderateScale(10.5),
    fontWeight: "800",
    color: "#003844",
    letterSpacing: 0.5,
  },
  percentText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#008080",
  },
  track: {
    height: moderateScale(6),
    backgroundColor: "#E2E8F0",
    borderRadius: scale(3),
    overflow: "hidden",
    marginBottom: moderateScale(12),
  },
  fill: {
    height: "100%",
    backgroundColor: "#003844",
    borderRadius: scale(3),
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepIndicatorItem: {
    alignItems: "center",
    width: scale(50),
  },
  circle: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  circlePassed: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  circleActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
    shadowColor: "#003844",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLabel: {
    fontSize: moderateScale(9.5),
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
  },
  stepLabelActive: {
    color: "#003844",
    fontWeight: "800",
  },
  stepLabelPassed: {
    color: "#059669",
  },
});
