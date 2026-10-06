import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface ShippingDetailsData {
  warehouseAddress: string;
  city: string;
  state: string;
  pincode: string;
  deliveryRadius: string;
  processingTime: string;
  operatingHours: string;
  latitude?: string;
  longitude?: string;
}

interface ShippingDetailsProps {
  data: ShippingDetailsData;
  onChange: (field: keyof ShippingDetailsData, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}

const RADIUS_OPTIONS = ["5 km", "10 km", "15 km", "25 km", "Citywide"];
const PROCESSING_TIMES = ["15 - 30 Mins", "1 - 2 Hours", "Same Day Delivery", "1 - 2 Days"];

export default function ShippingDetailsStep({
  data,
  onChange,
  onNext,
  onBack,
}: ShippingDetailsProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleFetchGPS = () => {
    setIsLocating(true);
    // Simulating or reading geolocation
    setTimeout(() => {
      onChange("latitude", "27.7172");
      onChange("longitude", "85.3240");
      setIsLocating(false);
      Alert.alert(
        "Location Detected",
        "GPS coordinates for Kathmandu (27.7172, 85.3240) added successfully."
      );
    }, 800);
  };

  const handleValidateAndNext = () => {
    if (!data.warehouseAddress.trim()) {
      Alert.alert("Required", "Please enter your Warehouse / Store Pickup Address.");
      return;
    }
    if (!data.city.trim()) {
      Alert.alert("Required", "Please enter the City.");
      return;
    }
    if (!data.pincode.trim()) {
      Alert.alert("Required", "Please enter the Pincode.");
      return;
    }

    if (onNext) onNext();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shipping & Warehouse Logistics</Text>
        <Text style={styles.subtitle}>
          Configure where delivery riders will pick up orders and your delivery coverage.
        </Text>
      </View>

      {/* 1. Warehouse / Pickup Street Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Pickup / Warehouse Address <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputBox}>
          <Feather name="map-pin" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.warehouseAddress}
            onChangeText={(t) => onChange("warehouseAddress", t)}
            placeholder="Warehouse unit, Street, Landmark"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      {/* 2. City, State, Pincode */}
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
          <Text style={styles.label}>State</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.state}
              onChangeText={(t) => onChange("state", t)}
              placeholder="State"
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
              placeholder="Pincode"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 3. GPS Pin Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Warehouse GPS Coordinates</Text>
        <View style={styles.gpsRow}>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <TextInput
              value={data.latitude ? `${data.latitude}, ${data.longitude}` : ""}
              placeholder="Lat, Lng (Optional for exact routing)"
              placeholderTextColor="#94A3B8"
              editable={false}
              style={styles.textInput}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleFetchGPS}
            disabled={isLocating}
            style={styles.gpsBtn}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={scale(16)} color="#003844" />
            <Text style={styles.gpsBtnText}>
              {isLocating ? "Locating..." : "Auto-Detect"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Delivery Radius */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Maximum Delivery Radius Coverage</Text>
        <View style={styles.chipsRow}>
          {RADIUS_OPTIONS.map((rad) => {
            const isSelected = data.deliveryRadius === rad;
            return (
              <TouchableOpacity
                key={rad}
                activeOpacity={0.8}
                onPress={() => onChange("deliveryRadius", rad)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {rad}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. Order Processing / Dispatch Time */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Standard Order Preparation Time</Text>
        <View style={styles.chipsRow}>
          {PROCESSING_TIMES.map((time) => {
            const isSelected = data.processingTime === time;
            return (
              <TouchableOpacity
                key={time}
                activeOpacity={0.8}
                onPress={() => onChange("processingTime", time)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <MaterialCommunityIcons
                  name="clock-fast"
                  size={scale(14)}
                  color={isSelected ? "#FFFFFF" : "#003844"}
                  style={{ marginRight: scale(4) }}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. Operating Hours */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Store / Warehouse Daily Operating Hours</Text>
        <View style={styles.inputBox}>
          <Feather name="clock" size={scale(15)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.operatingHours}
            onChangeText={(t) => onChange("operatingHours", t)}
            placeholder="e.g. Mon - Sat: 07:00 AM - 09:00 PM"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleValidateAndNext}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>Save & Proceed to Brand / KYC</Text>
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
  gpsRow: {
    flexDirection: "row",
    gap: scale(10),
    alignItems: "center",
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4F6",
    borderWidth: 1,
    borderColor: "#86C4CB",
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: moderateScale(44),
    gap: scale(6),
  },
  gpsBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#003844",
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
