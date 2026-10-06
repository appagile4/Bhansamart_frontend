import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface BusinessDetailsData {
  businessName: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
  yearEstablished: string;
  numberOfEmployees: string;
  categories: string[];
  retailChannel: string;
}

interface BusinessDetailsProps {
  data: BusinessDetailsData;
  onChange: (field: keyof BusinessDetailsData, value: any) => void;
  onNext?: () => void;
}

import { CATEGORY_NAMES } from "@/constants/categories";

const BUSINESS_TYPES = ["Proprietorship", "Partnership", "Pvt. Ltd.", "LLP", "Individual"];
const AVAILABLE_CATEGORIES = CATEGORY_NAMES;
const RETAIL_CHANNELS = ["Online Only", "Physical Retail Store", "Both Online & Retail"];

export default function BusinessDetailsStep({
  data,
  onChange,
  onNext,
}: BusinessDetailsProps) {
  const toggleCategory = (cat: string) => {
    const current = data.categories || [];
    if (current.includes(cat)) {
      onChange(
        "categories",
        current.filter((c) => c !== cat)
      );
    } else {
      onChange("categories", [...current, cat]);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Title & Description */}
      <View style={styles.header}>
        <Text style={styles.title}>Business Information</Text>
        <Text style={styles.subtitle}>
          Provide official registration details of your firm or store.
        </Text>
      </View>

      {/* 1. Business Legal Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Registered Business / Store Name <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="briefcase" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.businessName}
            onChangeText={(t) => onChange("businessName", t)}
            placeholder="e.g. Kathmandu Fresh Supermarket"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 2. Business Legal Entity Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Entity Type</Text>
        <View style={styles.chipsRow}>
          {BUSINESS_TYPES.map((type) => {
            const isSelected = data.businessType === type;
            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                onPress={() => onChange("businessType", type)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. GSTIN & PAN Numbers */}
      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>GSTIN (Optional)</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.gstNumber}
              onChangeText={(t) => onChange("gstNumber", t.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>PAN Number</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.panNumber}
              onChangeText={(t) => onChange("panNumber", t.toUpperCase())}
              placeholder="ABCDE1234F"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 4. Year & Employee Count */}
      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Year Established</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.yearEstablished}
              onChangeText={(t) => onChange("yearEstablished", t)}
              placeholder="e.g. 2020"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={4}
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>No. of Staff</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.numberOfEmployees}
              onChangeText={(t) => onChange("numberOfEmployees", t)}
              placeholder="e.g. 10"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 5. Product Categories */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Select Product Categories You Sell <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.chipsRow}>
          {AVAILABLE_CATEGORIES.map((cat) => {
            const isSelected = (data.categories || []).includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => toggleCategory(cat)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <MaterialCommunityIcons
                  name={isSelected ? "checkbox-marked-circle" : "plus-circle-outline"}
                  size={scale(14)}
                  color={isSelected ? "#FFFFFF" : "#003844"}
                  style={{ marginRight: scale(4) }}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. Retail Channel */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Retail Channel</Text>
        <View style={styles.chipsRow}>
          {RETAIL_CHANNELS.map((ch) => {
            const isSelected = data.retailChannel === ch;
            return (
              <TouchableOpacity
                key={ch}
                activeOpacity={0.8}
                onPress={() => onChange("retailChannel", ch)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {ch}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Next Step Action Button */}
      {onNext && (
        <TouchableOpacity activeOpacity={0.85} onPress={onNext} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>Save & Proceed to Seller Contact</Text>
          <Feather name="arrow-right" size={scale(16)} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  header: {
    marginBottom: moderateScale(18),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#003844",
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    lineHeight: moderateScale(18),
  },
  inputGroup: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(6),
  },
  req: {
    color: "#EF4444",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(44),
  },
  icon: {
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#0F172A",
    height: "100%",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(7),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  chipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#475569",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  twoColRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003844",
    height: moderateScale(46),
    borderRadius: scale(8),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(16),
    gap: scale(8),
  },
  nextBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
