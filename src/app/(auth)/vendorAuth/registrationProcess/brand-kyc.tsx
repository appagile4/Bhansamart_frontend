import { moderateScale, scale } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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

export interface BrandKycData {
  brandName: string;
  trademarkNumber: string;
  brandWebsite: string;
  brandLogo: string;
  kycDocType: "aadhaar" | "citizenship" | "drivingLicense";
  kycDocUri: string;
}

interface BrandKycProps {
  data: BrandKycData;
  onChange: (field: keyof BrandKycData, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function BrandKycStep({
  data,
  onChange,
  onNext,
  onBack,
}: BrandKycProps) {
  const [isPicking, setIsPicking] = useState(false);

  const pickLogoImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        onChange("brandLogo", res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Image Picker", "Failed to select image: " + err.message);
    }
  };

  const pickKycDocument = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        onChange("kycDocUri", res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Document Picker", "Failed to select document: " + err.message);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Brand Branding & KYC Verification</Text>
        <Text style={styles.subtitle}>
          Upload your official store logo and government identity for verification.
        </Text>
      </View>

      {/* 1. Brand Logo Upload Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Store / Brand Logo</Text>
        <Text style={styles.cardSubtitle}>
          Square image (PNG/JPG), recommended 500x500 px.
        </Text>

        <View style={styles.logoUploadRow}>
          <View style={styles.logoPreviewBox}>
            {data.brandLogo ? (
              <Image
                source={{ uri: data.brandLogo }}
                style={styles.logoImage}
                contentFit="cover"
              />
            ) : (
              <MaterialCommunityIcons
                name="storefront-outline"
                size={scale(32)}
                color="#94A3B8"
              />
            )}
          </View>

          <View style={{ flex: 1, gap: scale(8) }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={pickLogoImage}
              style={styles.uploadBtn}
            >
              <Feather name="upload" size={scale(15)} color="#003844" />
              <Text style={styles.uploadBtnText}>
                {data.brandLogo ? "Change Logo" : "Upload Store Logo"}
              </Text>
            </TouchableOpacity>

            {data.brandLogo ? (
              <TouchableOpacity
                onPress={() => onChange("brandLogo", "")}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* 2. Brand Name & Trademark */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Brand / Display Name (If different from store)</Text>
        <View style={styles.inputBox}>
          <Feather name="tag" size={scale(16)} color="#94A3B8" style={styles.icon} />
          <TextInput
            value={data.brandName}
            onChangeText={(t) => onChange("brandName", t)}
            placeholder="e.g. Pure Himalayan Organics"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>
      </View>

      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Trademark / Reg No.</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.trademarkNumber}
              onChangeText={(t) => onChange("trademarkNumber", t)}
              placeholder="Reg. Number"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Website (Optional)</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={data.brandWebsite}
              onChangeText={(t) => onChange("brandWebsite", t)}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* 3. KYC Document Type & Upload */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Owner KYC Identification</Text>
        <Text style={styles.cardSubtitle}>
          Select ID type and upload a clear photo of your identity document.
        </Text>

        <View style={styles.chipsRow}>
          {[
            { key: "citizenship", label: "Citizenship / Govt ID" },
            { key: "aadhaar", label: "Aadhaar Card" },
            { key: "drivingLicense", label: "Driving License" },
          ].map((doc) => {
            const isSelected = data.kycDocType === doc.key;
            return (
              <TouchableOpacity
                key={doc.key}
                activeOpacity={0.8}
                onPress={() => onChange("kycDocType", doc.key as any)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {doc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Document Upload Box */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={pickKycDocument}
          style={styles.docUploadBox}
        >
          {data.kycDocUri ? (
            <View style={styles.docPreviewContainer}>
              <Image
                source={{ uri: data.kycDocUri }}
                style={styles.docPreviewImage}
                contentFit="contain"
              />
              <Text style={styles.docSuccessText}>Document Selected (Tap to change)</Text>
            </View>
          ) : (
            <View style={styles.docPlaceholder}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={scale(36)}
                color="#003844"
              />
              <Text style={styles.docPlaceholderTitle}>
                Tap to upload KYC Document Photo
              </Text>
              <Text style={styles.docPlaceholderSub}>
                Supported formats: JPG, PNG (Max 5MB)
              </Text>
            </View>
          )}
        </TouchableOpacity>
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
            <Text style={styles.nextBtnText}>Review & Final Submit</Text>
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
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    color: "#003844",
    marginBottom: scale(2),
  },
  cardSubtitle: {
    fontSize: moderateScale(11.5),
    color: "#64748B",
    marginBottom: moderateScale(12),
  },
  logoUploadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
  },
  logoPreviewBox: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(10),
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F4F6",
    borderWidth: 1,
    borderColor: "#86C4CB",
    borderRadius: scale(8),
    paddingVertical: moderateScale(9),
    paddingHorizontal: scale(12),
    gap: scale(6),
  },
  uploadBtnText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#003844",
  },
  removeBtn: {
    alignSelf: "flex-start",
    paddingVertical: scale(2),
  },
  removeBtnText: {
    fontSize: moderateScale(11),
    color: "#EF4444",
    fontWeight: "600",
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
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: moderateScale(12),
  },
  chip: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#003844",
    borderColor: "#003844",
  },
  chipText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#475569",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  docUploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#003844",
    borderRadius: scale(10),
    backgroundColor: "#F8FAFC",
    padding: scale(16),
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(120),
  },
  docPlaceholder: {
    alignItems: "center",
  },
  docPlaceholderTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#003844",
    marginTop: moderateScale(6),
  },
  docPlaceholderSub: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    marginTop: moderateScale(2),
  },
  docPreviewContainer: {
    alignItems: "center",
  },
  docPreviewImage: {
    width: scale(180),
    height: scale(90),
    borderRadius: scale(6),
  },
  docSuccessText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#059669",
    marginTop: moderateScale(6),
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
