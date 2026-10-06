import { moderateScale, scale } from "@/theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface SellerDetailsData {
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface SellerDetailsProps {
  data: SellerDetailsData;
  onChange: (field: keyof SellerDetailsData, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function SellerDetailsStep({
  data,
  onChange,
  onNext,
  onBack,
}: SellerDetailsProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Seller Contact Details</Text>
        <Text style={styles.subtitle}>
          Information about the primary store owner and communication address.
        </Text>
      </View>

      {/* 1. Seller Full Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Owner / Representative Full Name <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="user" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.sellerName}
            onChangeText={(t) => onChange("sellerName", t)}
            placeholder="e.g. Ramesh Thapa"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 2. Email & Primary Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Seller Official Email <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="mail" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.sellerEmail}
            onChangeText={(t) => onChange("sellerEmail", t)}
            placeholder="seller@bhansamart.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textInput}
          />
        </View>
      </View>

      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>
            Primary Phone <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <Feather name="phone" size={scale(15)} color="#94A3B8" style={styles.icon} />
            <TextInput
              value={data.sellerPhone}
              onChangeText={(t) => onChange("sellerPhone", t)}
              placeholder="Mobile Number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Alternate Phone</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.alternatePhone}
              onChangeText={(t) => onChange("alternatePhone", t)}
              placeholder="WhatsApp / Landline"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 3. Registered Street Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Official Registered Address <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="map-pin" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.address}
            onChangeText={(t) => onChange("address", t)}
            placeholder="Shop No., Market / Building, Street"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 4. City, State, Pincode */}
      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1.2 }]}>
          <Text style={styles.label}>
            City <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.city}
              onChangeText={(t) => onChange("city", t)}
              placeholder="City"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>
            State <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.state}
              onChangeText={(t) => onChange("state", t)}
              placeholder="State / Province"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>
            Pincode <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.pincode}
              onChangeText={(t) => onChange("pincode", t)}
              placeholder="Postal Code"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.prevBtn}>
            <Feather name="arrow-left" size={scale(16)} color="#003844" />
            <Text style={styles.prevBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {onNext && (
          <TouchableOpacity activeOpacity={0.85} onPress={onNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Save & Proceed to Bank Details</Text>
            <Feather name="arrow-right" size={scale(16)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
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
  twoColRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(16),
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
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003844",
    height: moderateScale(46),
    borderRadius: scale(8),
    gap: scale(8),
  },
  nextBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
