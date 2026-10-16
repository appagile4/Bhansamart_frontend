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
import { Feather } from "@expo/vector-icons";
import { useTheme, scale, moderateScale } from "@/theme";
import { CATEGORY_NAMES } from "@/constants/categories";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitAttribute } from "@/store/slices/brandSlice";

interface AddAttributeModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSuccess?: (createdAttribute: any) => void;
}

export default function AddAttributeModal({
  visible,
  onClose,
  initialCategory,
  onSuccess,
}: AddAttributeModalProps) {
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();
  const { submitting } = useAppSelector((state) => state.brand);

  const [attributeName, setAttributeName] = useState("");
  const [currentValueInput, setCurrentValueInput] = useState("");
  const [valuesList, setValuesList] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialCategory) {
        setSelectedCategories([initialCategory]);
      } else {
        setSelectedCategories([CATEGORY_NAMES[0]]);
      }
    } else {
      resetForm();
    }
  }, [visible, initialCategory]);

  const resetForm = () => {
    setAttributeName("");
    setCurrentValueInput("");
    setValuesList([]);
    setSelectedCategories(initialCategory ? [initialCategory] : [CATEGORY_NAMES[0]]);
    setShowCategoryPicker(false);
  };

  const handleAddValue = () => {
    const val = currentValueInput.trim();
    if (!val) return;
    if (valuesList.includes(val)) {
      Alert.alert("Duplicate Value", `"${val}" has already been added.`);
      return;
    }
    setValuesList([...valuesList, val]);
    setCurrentValueInput("");
  };

  const handleRemoveValue = (valToRemove: string) => {
    setValuesList(valuesList.filter((v) => v !== valToRemove));
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        Alert.alert("Warning", "Attribute must belong to at least one category.");
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = async () => {
    if (!attributeName.trim()) {
      Alert.alert("Required Field", "Please enter Attribute Category Name (e.g. Color, Size, Flavor).");
      return;
    }

    let finalValues = [...valuesList];
    if (currentValueInput.trim() && !finalValues.includes(currentValueInput.trim())) {
      finalValues.push(currentValueInput.trim());
    }

    if (finalValues.length === 0) {
      Alert.alert("Required Field", "Please add at least one attribute value.");
      return;
    }

    try {
      const payload = {
        name: attributeName.trim(),
        categories: selectedCategories,
        values: finalValues,
        type: "single" as const,
      };

      const result = await dispatch(submitAttribute(payload)).unwrap();

      Alert.alert(
        "Attribute Created",
        result.message || `Attribute "${attributeName.trim()}" created successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess(result.attribute);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err || "Failed to create attribute.");
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
                <Feather name="sliders" size={scale(18)} color="#016073" />
              </View>
              <Text style={[styles.modalTitle, dynamicStyles.textPrimary]}>
                Add Attribute
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
            {/* Attribute Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                Attribute Category Name <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, dynamicStyles.inputBox]}
                placeholder="e.g. Color, Size, Flavor, Pack Size"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={attributeName}
                onChangeText={setAttributeName}
              />
            </View>

            {/* Values Section with + Add More */}
            <View style={styles.formGroup}>
              <View style={styles.rowBetween}>
                <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                  Value <Text style={styles.star}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handleAddValue}
                  style={styles.addMoreBtn}
                >
                  <Feather name="plus-circle" size={scale(14)} color="#016073" />
                  <Text style={styles.addMoreText}>+ Add More</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.valueInputRow}>
                <TextInput
                  style={[styles.valueInput, dynamicStyles.inputBox]}
                  placeholder="e.g. Red, Blue, 1kg, Large"
                  placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                  value={currentValueInput}
                  onChangeText={setCurrentValueInput}
                  onSubmitEditing={handleAddValue}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={handleAddValue}
                  style={styles.valueAddButton}
                >
                  <Text style={styles.valueAddButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Chips for entered values */}
              {valuesList.length > 0 && (
                <View style={styles.tagsContainer}>
                  {valuesList.map((val) => (
                    <View
                      key={val}
                      style={[styles.valueChip, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]}
                    >
                      <Text style={[styles.valueChipText, dynamicStyles.textPrimary]}>
                        {val}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveValue(val)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Feather
                          name="x"
                          size={scale(12)}
                          color={isDark ? "#94A3B8" : "#64748B"}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Applicable Categories */}
            <View style={styles.formGroup}>
              <View style={styles.rowBetween}>
                <Text style={[styles.formLabel, dynamicStyles.textPrimary]}>
                  Applicable Categories
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  style={styles.addMoreBtn}
                >
                  <Feather name="filter" size={scale(14)} color="#016073" />
                  <Text style={styles.addMoreText}>
                    {showCategoryPicker ? "Done" : "Customize"}
                  </Text>
                </TouchableOpacity>
              </View>

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

              {showCategoryPicker && (
                <View style={styles.availableCategoriesBox}>
                  <Text style={[styles.subHint, dynamicStyles.textSecondary]}>
                    Select categories this attribute applies to:
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
          </ScrollView>

          {/* Action Footer */}
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
    maxHeight: "85%",
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
  valueInputRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(14),
  },
  valueAddButton: {
    backgroundColor: "#016073",
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  valueAddButtonText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: scale(4),
  },
  valueChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    gap: scale(6),
  },
  valueChipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
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
