import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme, scale, moderateScale } from "@/theme";
import { CATEGORY_NAMES } from "@/constants/categories";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitBrandRequest,
  searchBrandLogos,
  clearLogoSearchResults,
} from "@/store/slices/brandSlice";

interface AddBrandModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSuccess?: (createdBrand: any) => void;
}

export default function AddBrandModal({
  visible,
  onClose,
  initialCategory,
  onSuccess,
}: AddBrandModalProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { submitting, searchingLogos, logoSearchResults } = useAppSelector(
    (state) => state.brand
  );

  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Logo search tab/mode: 'custom' or 'search'
  const [logoMode, setLogoMode] = useState<"custom" | "search">("custom");
  const [logoQuery, setLogoQuery] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialCategory && !selectedCategories.includes(initialCategory)) {
        setSelectedCategories([initialCategory]);
      } else if (selectedCategories.length === 0) {
        setSelectedCategories([CATEGORY_NAMES[0]]);
      }
    } else {
      resetForm();
    }
  }, [visible, initialCategory]);

  const resetForm = () => {
    setBrandName("");
    setDescription("");
    setSelectedCategories(initialCategory ? [initialCategory] : [CATEGORY_NAMES[0]]);
    setLogoUri(null);
    setLogoFile(null);
    setLogoQuery("");
    setLogoMode("custom");
    dispatch(clearLogoSearchResults());
  };

  const handlePickDeviceImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload a brand logo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.uri.split("/").pop() || `brand_${Date.now()}.png`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : "png";
        const mimeType =
          ext === "png"
            ? "image/png"
            : ext === "webp"
            ? "image/webp"
            : "image/jpeg";

        setLogoUri(asset.uri);
        setLogoFile({
          uri: asset.uri,
          name: filename,
          type: mimeType,
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to select image.");
    }
  };

  const handleSearchLogos = () => {
    if (!logoQuery || logoQuery.trim().length < 2) {
      Alert.alert("Search Error", "Please enter at least 2 characters to search for logos.");
      return;
    }
    dispatch(searchBrandLogos(logoQuery.trim()));
  };

  const handleSelectSearchedLogo = (logoUrl: string) => {
    setLogoUri(logoUrl);
    setLogoFile(null); // Direct URL, no local file upload required
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        Alert.alert("Warning", "A brand must belong to at least one category.");
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = async () => {
    if (!brandName.trim()) {
      Alert.alert("Required Field", "Please enter the Brand Name.");
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert("Required Field", "Please select at least one category.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", brandName.trim());
      formData.append("categories", JSON.stringify(selectedCategories));
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      if (logoFile) {
        formData.append("logo", {
          uri: logoFile.uri,
          name: logoFile.name,
          type: logoFile.type,
        } as any);
      } else if (logoUri && (logoUri.startsWith("http://") || logoUri.startsWith("https://"))) {
        formData.append("logoUrl", logoUri);
      }

      const result = await dispatch(submitBrandRequest(formData)).unwrap();

      Alert.alert(
        "Brand Request Submitted",
        result.message ||
          `"${brandName.trim()}" request has been submitted. Status: ${
            result.brand?.status || "PENDING"
          }. Admin will review it shortly.`,
        [
          {
            text: "OK",
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess(result.brand);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Submission Failed", err || "Failed to submit brand request.");
    }
  };

  const dynamicStyles = {
    modalOverlay: {
      backgroundColor: "rgba(15, 23, 42, 0.7)",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
      borderColor: isDark ? "#334155" : "#E2E8F0",
    },
    textPrimary: {
      color: isDark ? "#F8FAFC" : "#0F172A",
    },
    textSecondary: {
      color: isDark ? "#94A3B8" : "#64748B",
    },
    inputBox: {
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
      borderColor: isDark ? "#334155" : "#CBD5E1",
      color: isDark ? "#F8FAFC" : "#0F172A",
    },
    tagSelected: {
      backgroundColor: "#016073",
      borderColor: "#016073",
    },
    tagUnselected: {
      backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
      borderColor: isDark ? "#334155" : "#CBD5E1",
    },
    pillTextSelected: {
      color: "#FFFFFF",
    },
    pillTextUnselected: {
      color: isDark ? "#94A3B8" : "#475569",
    },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalBackdrop, dynamicStyles.modalOverlay]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalCard, dynamicStyles.modalContainer]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBox}>
                <Feather name="tag" size={scale(18)} color="#016073" />
              </View>
              <Text style={[styles.modalTitle, dynamicStyles.textPrimary]}>
                Add Brand
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Feather
                name="x"
                size={scale(20)}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Brand Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                Brand Name <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, dynamicStyles.inputBox]}
                placeholder="e.g. Amul, Nestlé, Everest"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={brandName}
                onChangeText={(val) => {
                  setBrandName(val);
                  if (!logoQuery) setLogoQuery(val);
                }}
              />
            </View>

            {/* Categories Selection */}
            <View style={styles.formGroup}>
              <View style={styles.rowBetween}>
                <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                  Categories <Text style={styles.star}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  style={styles.addMoreBtn}
                >
                  <Feather name="plus-circle" size={scale(14)} color="#016073" />
                  <Text style={styles.addMoreText}>
                    {showCategoryPicker ? "Done" : "+ Add More"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Selected Categories Chips */}
              <View style={styles.tagsContainer}>
                {selectedCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[styles.categoryPill, dynamicStyles.tagSelected]}
                  >
                    <Text style={[styles.pillText, dynamicStyles.pillTextSelected]}>
                      {cat}
                    </Text>
                    <Feather name="x" size={scale(12)} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Expanded Category Selector if "+ Add More" clicked */}
              {showCategoryPicker && (
                <View style={styles.availableCategoriesBox}>
                  <Text style={[styles.subHint, dynamicStyles.textSecondary]}>
                    Tap a category to add/remove:
                  </Text>
                  <View style={styles.tagsContainer}>
                    {CATEGORY_NAMES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => toggleCategory(cat)}
                          style={[
                            styles.categoryPill,
                            isSelected
                              ? dynamicStyles.tagSelected
                              : dynamicStyles.tagUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              isSelected
                                ? dynamicStyles.pillTextSelected
                                : dynamicStyles.pillTextUnselected,
                            ]}
                          >
                            {isSelected ? `✓ ${cat}` : `+ ${cat}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Brand Logo Section */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                Brand Logo
              </Text>

              {/* Mode switch: Upload vs Search */}
              <View style={styles.modeTabsRow}>
                <TouchableOpacity
                  onPress={() => setLogoMode("custom")}
                  style={[
                    styles.modeTab,
                    logoMode === "custom" && styles.modeTabActive,
                  ]}
                >
                  <Feather
                    name="upload-cloud"
                    size={scale(14)}
                    color={logoMode === "custom" ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.modeTabText,
                      logoMode === "custom"
                        ? styles.modeTabTextActive
                        : dynamicStyles.textSecondary,
                    ]}
                  >
                    Upload File
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLogoMode("search")}
                  style={[
                    styles.modeTab,
                    logoMode === "search" && styles.modeTabActive,
                  ]}
                >
                  <Feather
                    name="search"
                    size={scale(14)}
                    color={logoMode === "search" ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.modeTabText,
                      logoMode === "search"
                        ? styles.modeTabTextActive
                        : dynamicStyles.textSecondary,
                    ]}
                  >
                    Search Logo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Logo Preview if picked */}
              {logoUri ? (
                <View style={styles.logoPreviewContainer}>
                  <Image
                    source={{ uri: logoUri }}
                    style={styles.logoPreviewImage}
                    contentFit="contain"
                  />
                  <View style={styles.logoPreviewDetails}>
                    <Text
                      style={[styles.logoNameText, dynamicStyles.textPrimary]}
                      numberOfLines={1}
                    >
                      {logoFile ? logoFile.name : "Selected Web Logo"}
                    </Text>
                    <Text style={[styles.logoSubText, dynamicStyles.textSecondary]}>
                      {logoFile ? `${logoFile.type}` : logoUri}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setLogoUri(null);
                        setLogoFile(null);
                      }}
                      style={styles.removeLogoBtn}
                    >
                      <Feather name="trash-2" size={scale(13)} color="#EF4444" />
                      <Text style={styles.removeLogoText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : logoMode === "custom" ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickDeviceImage}
                  style={[styles.uploadBox, dynamicStyles.inputBox]}
                >
                  <MaterialCommunityIcons
                    name="image-plus"
                    size={scale(32)}
                    color="#016073"
                  />
                  <Text style={[styles.uploadBoxTitle, dynamicStyles.textPrimary]}>
                    Upload Brand Logo
                  </Text>
                  <Text style={[styles.uploadBoxSub, dynamicStyles.textSecondary]}>
                    PNG, JPG, or WEBP (Square recommended)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.searchLogoBox}>
                  <View style={styles.searchLogoInputRow}>
                    <TextInput
                      style={[styles.searchLogoInput, dynamicStyles.inputBox]}
                      placeholder="Brand domain or name (e.g. nestle.com)"
                      placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                      value={logoQuery}
                      onChangeText={setLogoQuery}
                      onSubmitEditing={handleSearchLogos}
                    />
                    <TouchableOpacity
                      onPress={handleSearchLogos}
                      style={styles.searchLogoBtn}
                      disabled={searchingLogos}
                    >
                      {searchingLogos ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Feather name="search" size={scale(16)} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Logo results */}
                  {logoSearchResults && logoSearchResults.length > 0 && (
                    <View style={styles.resultsGrid}>
                      <Text style={[styles.resultsLabel, dynamicStyles.textSecondary]}>
                        Select a logo:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.resultsScroll}
                      >
                        {logoSearchResults.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => handleSelectSearchedLogo(item.logo)}
                            style={[
                              styles.logoThumbCard,
                              logoUri === item.logo && styles.logoThumbCardActive,
                            ]}
                          >
                            <Image
                              source={{ uri: item.logo }}
                              style={styles.logoThumbImage}
                              contentFit="contain"
                            />
                            <Text
                              style={styles.logoThumbText}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Description (Optional) */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                Description (Optional)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, dynamicStyles.inputBox]}
                placeholder="Brief information about this brand..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Info note */}
            <View style={styles.noteBox}>
              <Feather name="info" size={scale(14)} color="#0284C7" />
              <Text style={styles.noteText}>
                Submitted brands are reviewed by the platform administration. You can view submission status under Brands & Attributes.
              </Text>
            </View>
          </ScrollView>

          {/* Action Footer matching Figma */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: isDark ? "#475569" : "#CBD5E1" }]}
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, dynamicStyles.textPrimary]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit</Text>
                  <Feather name="chevron-right" size={scale(16)} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalCard: {
    width: "100%",
    maxWidth: scale(480),
    maxHeight: "90%",
    borderRadius: moderateScale(16),
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  headerIconBox: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(8),
    backgroundColor: "rgba(1, 96, 115, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  closeBtn: {
    padding: scale(4),
  },
  scrollBody: {
    padding: scale(18),
    gap: scale(14),
  },
  formGroup: {
    gap: scale(6),
  },
  formLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  star: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(14),
  },
  textArea: {
    minHeight: scale(70),
    textAlignVertical: "top",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  addMoreText: {
    fontSize: moderateScale(12),
    color: "#016073",
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: scale(4),
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  pillText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  availableCategoriesBox: {
    marginTop: scale(8),
    padding: scale(10),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    gap: scale(6),
  },
  subHint: {
    fontSize: moderateScale(11),
    fontStyle: "italic",
  },
  modeTabsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(8),
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    backgroundColor: "rgba(148, 163, 184, 0.08)",
  },
  modeTabActive: {
    backgroundColor: "#016073",
    borderColor: "#016073",
  },
  modeTabText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  modeTabTextActive: {
    color: "#FFFFFF",
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: moderateScale(12),
    paddingVertical: scale(20),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(4),
  },
  uploadBoxTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    marginTop: scale(4),
  },
  uploadBoxSub: {
    fontSize: moderateScale(11),
  },
  searchLogoBox: {
    gap: scale(10),
  },
  searchLogoInputRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  searchLogoInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    fontSize: moderateScale(13),
  },
  searchLogoBtn: {
    backgroundColor: "#016073",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(14),
    justifyContent: "center",
    alignItems: "center",
  },
  resultsGrid: {
    gap: scale(6),
  },
  resultsLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  resultsScroll: {
    gap: scale(10),
    paddingVertical: scale(4),
  },
  logoThumbCard: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(8),
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.3)",
    padding: scale(6),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  logoThumbCardActive: {
    borderColor: "#016073",
    backgroundColor: "rgba(1, 96, 115, 0.08)",
  },
  logoThumbImage: {
    width: scale(40),
    height: scale(40),
  },
  logoThumbText: {
    fontSize: moderateScale(9),
    color: "#475569",
    marginTop: scale(2),
  },
  logoPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    padding: scale(10),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(1, 96, 115, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(1, 96, 115, 0.2)",
  },
  logoPreviewImage: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logoPreviewDetails: {
    flex: 1,
    gap: scale(2),
  },
  logoNameText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  logoSubText: {
    fontSize: moderateScale(10),
  },
  removeLogoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: scale(4),
  },
  removeLogoText: {
    fontSize: moderateScale(11),
    color: "#EF4444",
    fontWeight: "600",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    padding: scale(10),
    borderRadius: moderateScale(8),
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  noteText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: "#0284C7",
    lineHeight: scale(16),
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    paddingHorizontal: scale(18),
    paddingVertical: scale(14),
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.2)",
  },
  cancelBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#016073",
    paddingHorizontal: scale(18),
    paddingVertical: scale(10),
    borderRadius: moderateScale(8),
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
