import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface ActiveCartItem {
  id: string;
  name: string;
  packInfo?: string;
  weight?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
}

interface ActiveCartSectionProps {
  items: ActiveCartItem[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove?: (id: string) => void;
  onSaveForLater: (item: ActiveCartItem) => void;
}

export default function ActiveCartSection({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onSaveForLater,
}: ActiveCartSectionProps) {
  const theme = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Shipment Header Banner */}
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryIconBox}>
          <MaterialCommunityIcons
            name="truck-fast-outline"
            size={scale(18)}
            color="#008080"
          />
        </View>
        <View style={styles.deliveryTextCol}>
          <View style={styles.deliveryTitleRow}>
            <Text style={styles.deliveryTitle}>Instant Delivery</Text>
            <View style={styles.freePill}>
              <Text style={styles.freePillText}>FREE</Text>
            </View>
          </View>
          <Text style={styles.deliverySubtitle}>
            Shipment of {items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 ? "item" : "items"} in 10-15 mins
          </Text>
        </View>
      </View>

      {/* Cart Items List */}
      <View style={styles.itemsList}>
        {items.map((item, index) => {
          const discountPct =
            item.originalPrice && item.originalPrice > item.price
              ? Math.round(
                  ((item.originalPrice - item.price) / item.originalPrice) * 100
                )
              : null;

          return (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index < items.length - 1 && styles.itemDivider,
              ]}
            >
              {/* Product Image Box */}
              <View style={styles.imageBox}>
                <Image
                  source={{
                    uri:
                      item.imageUrl ||
                      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80",
                  }}
                  style={styles.image}
                  resizeMode="contain"
                />
                {discountPct ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{discountPct}% OFF</Text>
                  </View>
                ) : null}
              </View>

              {/* Middle Info Column */}
              <View style={styles.infoCol}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.packInfo}>
                  {item.packInfo || item.weight || "Standard Pack"}
                </Text>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    Rs.{item.price * item.quantity}
                  </Text>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <Text style={styles.origPrice}>
                      Rs.{item.originalPrice * item.quantity}
                    </Text>
                  )}
                </View>

                {/* Action Buttons: Save for later & Delete */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onSaveForLater(item)}
                    style={styles.actionBtn}
                  >
                    <Ionicons
                      name="bookmark-outline"
                      size={scale(12)}
                      color="#64748B"
                    />
                    <Text style={styles.saveForLaterText}>Save for later</Text>
                  </TouchableOpacity>

                  {onRemove && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onRemove(item.id)}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={scale(12)} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Right Stepper Column */}
              <View style={styles.rightCol}>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => onDecrement(item.id)}
                    style={styles.stepBtn}
                  >
                    {item.quantity === 1 ? (
                      <Feather name="trash-2" size={scale(13)} color="#FFFFFF" />
                    ) : (
                      <Feather name="minus" size={scale(14)} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => onIncrement(item.id)}
                    style={styles.stepBtn}
                  >
                    <Feather name="plus" size={scale(14)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.unitPriceText}>
                  Rs.{item.price}/each
                </Text>
              </View>
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
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: moderateScale(6),
  },
  deliveryIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  deliveryTextCol: {
    flex: 1,
  },
  deliveryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  deliveryTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  freePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: scale(6),
    paddingVertical: scale(1.5),
    borderRadius: scale(4),
  },
  freePillText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#16A34A",
  },
  deliverySubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginTop: scale(1.5),
  },
  itemsList: {
    gap: moderateScale(2),
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
    width: scale(64),
    height: scale(64),
    borderRadius: scale(10),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
    padding: scale(4),
    position: "relative",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: scale(6),
  },
  discountBadge: {
    position: "absolute",
    top: scale(-3),
    left: scale(-3),
    backgroundColor: "#EF4444",
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    fontSize: moderateScale(8.5),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoCol: {
    flex: 1,
    marginRight: scale(8),
  },
  itemName: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: moderateScale(17),
  },
  packInfo: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: scale(3),
  },
  price: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  origPrice: {
    fontSize: moderateScale(11.5),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    marginTop: scale(6),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  saveForLaterText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "600",
  },
  deleteBtn: {
    padding: scale(2),
  },
  rightCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003844",
    borderRadius: scale(8),
    paddingHorizontal: scale(2),
    paddingVertical: scale(2),
  },
  stepBtn: {
    width: scale(26),
    height: scale(26),
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
    minWidth: scale(22),
    textAlign: "center",
  },
  unitPriceText: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    marginTop: scale(4),
  },
});
