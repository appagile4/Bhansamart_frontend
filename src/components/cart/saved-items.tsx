import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface SavedCartItem {
  id: string;
  name: string;
  packInfo: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
}

interface SavedItemsSectionProps {
  items: SavedCartItem[];
  onRemoveAll?: () => void;
  onAddToCart?: (item: SavedCartItem) => void;
  onRemoveItem?: (item: SavedCartItem) => void;
}

export default function SavedItemsSection({
  items,
  onRemoveAll,
  onAddToCart,
  onRemoveItem,
}: SavedItemsSectionProps) {
  const theme = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="bookmark" size={scale(16)} color="#008080" />
          <Text style={styles.headerTitle}>Saved for later ({items.length})</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onRemoveAll}>
          <Text style={styles.removeAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              index < items.length - 1 && styles.itemDivider,
            ]}
          >
            {/* Thumbnail */}
            <View style={styles.imageBox}>
              <Image
                source={
                  typeof item.imageUrl === "string"
                    ? { uri: item.imageUrl }
                    : item.imageUrl
                }
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Info Column */}
            <View style={styles.infoCol}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.packInfo}>{item.packInfo}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onRemoveItem?.(item)}
                style={styles.removeBtn}
              >
                <Feather name="trash-2" size={scale(11)} color="#94A3B8" />
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Right Action Column (Move to cart + Price) */}
            <View style={styles.actionCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onAddToCart?.(item)}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>Move to Cart</Text>
              </TouchableOpacity>
              <View style={styles.priceRow}>
                {item.originalPrice > item.price && (
                  <Text style={styles.origPrice}>Rs.{item.originalPrice}</Text>
                )}
                <Text style={styles.price}>Rs.{item.price}</Text>
              </View>
            </View>
          </View>
        ))}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  headerTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#0F172A",
  },
  removeAllText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#EF4444",
  },
  itemsList: {
    gap: moderateScale(2),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  imageBox: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(8),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
    padding: scale(3),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: scale(6),
  },
  infoCol: {
    flex: 1,
    marginRight: scale(8),
  },
  itemName: {
    fontSize: moderateScale(12.5),
    fontWeight: "600",
    color: "#1E293B",
  },
  packInfo: {
    fontSize: moderateScale(11),
    color: "#64748B",
    marginTop: scale(2),
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: scale(4),
  },
  removeText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    fontWeight: "500",
  },
  actionCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  addBtn: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#008080",
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(6),
    marginBottom: scale(4),
  },
  addBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#008080",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  price: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#0F172A",
  },
  origPrice: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
});
