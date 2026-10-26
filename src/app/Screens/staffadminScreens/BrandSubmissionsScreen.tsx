import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale, scale, useTheme } from "@/theme";
import StaffAdminHeader from "@/components/staffAdminComponent/StaffAdminHeader";
import RequestStatusBadge from "@/components/staffAdminComponent/RequestStatusBadge";
import {
  fetchBrandsReviewQueueAdminApi,
  reviewBrandAdminApi,
} from "@/store/services/adminService";

export default function StaffAdminBrandSubmissionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";

  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBrands = async () => {
    try {
      const res = await fetchBrandsReviewQueueAdminApi({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res?.brands || res?.data || Array.isArray(res)) {
        setBrands(res.brands || res.data || res);
      }
    } catch (e) {
      console.warn("[Brands] Failed to load brand queue", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadBrands();
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBrands();
  };

  const handleAction = async (action: "approve" | "reject" | "request_info") => {
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      await reviewBrandAdminApi(selectedBrand._id || selectedBrand.id, {
        action,
        reviewerNotes: notes.trim() || undefined,
      });

      Alert.alert(
        "Brand Decision Recorded",
        `Brand "${selectedBrand.name || selectedBrand.brandName}" status updated to ${action.toUpperCase()}.`
      );
      setSelectedBrand(null);
      setNotes("");
      loadBrands();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update brand submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#222D35" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const STATUS_PILLS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A0F12" : "#F8FAFC" }]}>
      <StaffAdminHeader
        title="Brand Submissions"
        subtitle={`${brands.length} Scoped Brands`}
        showBack
        onRefresh={onRefresh}
      />

      <View style={styles.content}>
        {/* Status Pills */}
        <View style={styles.pillsRow}>
          {STATUS_PILLS.map((st) => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? "#0284C7" : cardBg,
                    borderColor: isSelected ? "#0284C7" : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? "#FFFFFF" : textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>
              Loading brand queue...
            </Text>
          </View>
        ) : (
          <FlatList
            data={brands}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => {
              const brandName = item.name || item.brandName || "Brand Name";
              const storeName =
                item.vendor?.businessDetails?.businessName ||
                item.vendorName ||
                "Assigned Store";

              return (
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.brandLeft}>
                      <Image
                        source={{
                          uri:
                            item.logo ||
                            item.imageUrl ||
                            "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&q=80",
                        }}
                        style={styles.logoImg}
                        contentFit="cover"
                      />
                      <View style={{ gap: moderateScale(2) }}>
                        <Text style={[styles.brandTitle, { color: textPrimary }]}>
                          {brandName}
                        </Text>
                        <Text style={[styles.vendorSubtitle, { color: textSecondary }]}>
                          Store: {storeName}
                        </Text>
                      </View>
                    </View>
                    <RequestStatusBadge status={item.status} type="brand" />
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: isDark ? "#222D35" : "#F1F5F9" }]}>
                    <Text style={[styles.dateText, { color: textSecondary }]}>
                      Submitted {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </Text>

                    {item.status === "PENDING" && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedBrand(item);
                          setNotes(item.reviewerNotes || "");
                        }}
                        style={styles.reviewBtn}
                      >
                        <Text style={styles.reviewBtnText}>Review Submission</Text>
                        <Feather name="chevron-right" size={scale(13)} color="#0284C7" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
                <MaterialCommunityIcons name="certificate-outline" size={scale(36)} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Brands</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                  No brand submissions awaiting review in this category.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Brand Review Modal */}
      {selectedBrand && (
        <Modal
          visible={!!selectedBrand}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedBrand(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Review Brand
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                    {selectedBrand.name || selectedBrand.brandName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBrand(null)}>
                  <Ionicons name="close" size={scale(22)} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: moderateScale(12) }}>
                <Image
                  source={{
                    uri:
                      selectedBrand.logo ||
                      selectedBrand.imageUrl ||
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80",
                  }}
                  style={styles.modalLogo}
                  contentFit="contain"
                />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: textSecondary }]}>Store</Text>
                  <Text style={[styles.infoVal, { color: textPrimary }]}>
                    {selectedBrand.vendor?.businessDetails?.businessName ||
                      selectedBrand.vendorName ||
                      "Assigned Store"}
                  </Text>
                </View>

                {selectedBrand.description ? (
                  <View style={{ gap: moderateScale(3) }}>
                    <Text style={[styles.infoLabel, { color: textSecondary }]}>Brand Description</Text>
                    <Text style={[styles.infoVal, { color: textPrimary }]}>
                      {selectedBrand.description}
                    </Text>
                  </View>
                ) : null}

                <View>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>Staff Reviewer Notes</Text>
                  <TextInput
                    placeholder="Enter examination comments or document check..."
                    placeholderTextColor={textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={[styles.modalInputArea, { color: textPrimary, borderColor: border }]}
                  />
                </View>

                {/* Actions */}
                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={submitting}
                    onPress={() => handleAction("approve")}
                    style={[styles.actionBtnApprove, submitting && { opacity: 0.6 }]}
                  >
                    <Feather name="check" size={scale(16)} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Approve Brand</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={submitting}
                    onPress={() => handleAction("request_info")}
                    style={[styles.actionBtnInfo, submitting && { opacity: 0.6 }]}
                  >
                    <Feather name="help-circle" size={scale(16)} color="#7C3AED" />
                    <Text style={[styles.actionBtnText, { color: "#7C3AED" }]}>Request Documents</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={submitting}
                    onPress={() => handleAction("reject")}
                    style={[styles.actionBtnReject, submitting && { opacity: 0.6 }]}
                  >
                    <Feather name="x" size={scale(16)} color="#DC2626" />
                    <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Reject Submission</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingTop: moderateScale(10),
  },
  pillsRow: {
    flexDirection: "row",
    gap: scale(6),
    marginBottom: moderateScale(10),
  },
  filterPill: {
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(5),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: moderateScale(11),
  },
  listContent: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(10),
  },
  card: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: moderateScale(8),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  logoImg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    backgroundColor: "#F1F5F9",
  },
  brandTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  vendorSubtitle: {
    fontSize: moderateScale(11),
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: moderateScale(11),
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  reviewBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#0284C7",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
  },
  emptyBox: {
    padding: scale(24),
    borderRadius: scale(14),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: moderateScale(12),
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(16),
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    marginTop: moderateScale(1),
  },
  modalLogo: {
    width: "100%",
    height: scale(100),
    borderRadius: scale(8),
    backgroundColor: "#F8FAFC",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(4),
  },
  infoLabel: {
    fontSize: moderateScale(12),
  },
  infoVal: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginBottom: moderateScale(4),
  },
  modalInputArea: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    height: moderateScale(65),
    textAlignVertical: "top",
    fontSize: moderateScale(13),
  },
  actionButtonsCol: {
    gap: moderateScale(8),
    marginTop: moderateScale(6),
    marginBottom: moderateScale(20),
  },
  actionBtnApprove: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#059669",
    paddingVertical: moderateScale(11),
    borderRadius: scale(8),
  },
  actionBtnInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
  },
  actionBtnReject: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: moderateScale(10),
    borderRadius: scale(8),
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
});
