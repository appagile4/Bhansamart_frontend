import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale, scale } from "@/theme";

interface RequestStatusBadgeProps {
  status: string;
  type?: "order" | "refund" | "brand" | "withdrawal" | "ticket" | "generic";
  size?: "small" | "medium";
}

export default function RequestStatusBadge({
  status = "PENDING",
  type = "generic",
  size = "small",
}: RequestStatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  let bg = "#F1F5F9";
  let textColor = "#475569";
  let label = norm.replace(/_/g, " ");

  switch (norm) {
    case "DELIVERED":
    case "APPROVED":
    case "RESOLVED":
    case "COMPLETED":
    case "PAID":
      bg = "#ECFDF5";
      textColor = "#059669";
      break;

    case "PENDING":
    case "PLACED":
    case "OPEN":
    case "UNDER_REVIEW":
    case "STAFF_EXAMINATION_REQUIRED":
      bg = "#FFFBEB";
      textColor = "#D97706";
      break;

    case "IN_PROGRESS":
    case "ASSIGNED":
    case "PREPARING":
    case "READY_FOR_PICKUP":
    case "OUT_FOR_DELIVERY":
    case "FORWARD_TO_FINANCE":
    case "ACCEPTED":
      bg = "#EFF6FF";
      textColor = "#2563EB";
      break;

    case "CANCELLED":
    case "REJECTED":
    case "FAILED":
    case "CLOSED":
    case "DISPUTED":
      bg = "#FEF2F2";
      textColor = "#DC2626";
      break;

    case "REQUEST_INFO":
      bg = "#F5F3FF";
      textColor = "#7C3AED";
      break;

    default:
      bg = "#F1F5F9";
      textColor = "#64748B";
  }

  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? scale(7) : scale(10),
          paddingVertical: isSmall ? moderateScale(2.5) : moderateScale(4),
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? moderateScale(10) : moderateScale(11.5),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: scale(6),
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
