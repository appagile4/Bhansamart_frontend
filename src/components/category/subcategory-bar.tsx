import { moderateScale, scale, useTheme } from "@/theme";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SubcategoryBarProps {
  subcategories: string[];
  selectedSubcategory: string;
  onSelectSubcategory: (subcategory: string) => void;
}

export default function SubcategoryBar({
  subcategories,
  selectedSubcategory,
  onSelectSubcategory,
}: SubcategoryBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "All" chip */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectSubcategory("All")}
          style={[
            styles.chip,
            selectedSubcategory === "All" && styles.chipActive,
          ]}
        >
          <Text
            style={[
              styles.chipText,
              selectedSubcategory === "All" && styles.chipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Dynamic subcategory chips */}
        {subcategories.map((subcat) => {
          const isSelected = selectedSubcategory === subcat;
          return (
            <TouchableOpacity
              key={subcat}
              activeOpacity={0.8}
              onPress={() => onSelectSubcategory(subcat)}
              style={[styles.chip, isSelected && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {subcat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: moderateScale(8),
  },
  scrollContent: {
    paddingHorizontal: scale(12),
    gap: scale(8),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#E6F4EA",
    borderColor: "#2D6A4F",
  },
  chipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#2D6A4F",
    fontWeight: "800",
  },
});
