import AdminHeader from "@/components/AdminHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAdminVendors,
  updateAdminVendorVerification,
} from "@/store/slices/adminSlice";
import { moderateScale, scale, useTheme } from "@/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminVendorsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.mode === "dark";
  const dispatch = useAppDispatch();

  const [search, setSearch] = useState("");
  const [filterVerification, setFilterVerification] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { vendors, vendorsTotal, loading } = useAppSelector(
    (state) => state.admin,
  );

  const loadVendors = async (pageNum = 1, fresh = false) => {
    if (pageNum === 1) {
      if (fresh) setIsRefreshing(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      await dispatch(
        fetchAdminVendors({
          search: search.trim() || undefined,
          verification: filterVerification || undefined,
          page: pageNum,
          limit: 10,
        }),
      ).unwrap();
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadVendors(1);
  }, [filterVerification, dispatch]);

  const handleSearchSubmit = () => {
    setPage(1);
    loadVendors(1);
  };

  const handleRefresh = () => {
    setPage(1);
    loadVendors(1, true);
  };

  const handleEndReached = () => {
    if (isLoadingMore || loading || isRefreshing) return;
    if (vendors.length >= vendorsTotal) return;
    loadVendors(page + 1);
  };

  const handleUpdateStatus = (vendorId: string, status: string) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this vendor as '${status.toUpperCase()}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await dispatch(
              updateAdminVendorVerification({
                id: vendorId,
                verificationStatus: status,
              }),
            );
            loadVendors(1);
          },
        },
      ],
    );
  };

  const handleOpenDetails = (vendor: any) => {
    router.push({
      pathname: "/Screens/adminScreens/vendorDetails" as any,
      params: { id: vendor._id },
    });
  };

  const bg = isDark ? "#080D0F" : "#F8FAFC";
  const cardBg = isDark ? "#151D24" : "#FFFFFF";
  const border = isDark ? "#263238" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#0284C7" />
          <Text style={[styles.footerLoaderText, { color: textSecondary }]}>
            Loading more stores...
          </Text>
        </View>
      );
    }
    if (vendors.length > 0 && vendors.length >= vendorsTotal) {
      return (
        <View style={styles.footerEnd}>
          <View style={[styles.footerLine, { backgroundColor: border }]} />
          <Text style={[styles.footerEndText, { color: textSecondary }]}>
            All {vendorsTotal} stores loaded
          </Text>
          <View style={[styles.footerLine, { backgroundColor: border }]} />
        </View>
      );
    }
    return <View style={{ height: scale(24) }} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <AdminHeader
        title="Vendors Directory"
        subtitle="KYC & Store Management"
      />
      {/* Header Search & Filter Bar */}
      <View
        style={[
          styles.filterBar,
          { backgroundColor: cardBg, borderColor: border },
        ]}
      >
        <View style={[styles.searchBox, { borderColor: border }]}>
          <Feather name="search" size={scale(16)} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search by store or seller name..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setPage(1);
                loadVendors(1);
              }}
            >
              <Feather name="x" size={scale(16)} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Verification Filters */}
        <View style={styles.chipRow}>
          {[
            { id: "", label: "All Stores" },
            { id: "approved", label: "Approved" },
            { id: "pending", label: "Pending KYC" },
            { id: "rejected", label: "Rejected" },
          ].map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chip,
                filterVerification === c.id && styles.chipActive,
                isDark &&
                  filterVerification !== c.id && { backgroundColor: "#1E252E" },
              ]}
              onPress={() => setFilterVerification(c.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  filterVerification === c.id && styles.chipTextActive,
                  isDark && filterVerification !== c.id && { color: "#94A3B8" },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Vendors List */}
      <FlatList
        data={vendors}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#0284C7"]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="storefront-remove"
                size={scale(48)}
                color="#94A3B8"
              />
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                No Vendors Found
              </Text>
              <Text style={[styles.emptySub, { color: textSecondary }]}>
                No vendors match the selected filter criteria.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const itemStatus = (
            item.status ||
            item.verificationStatus ||
            item.businessDetails?.verificationStatus ||
            "approved"
          ).toLowerCase();
          const isApproved =
            itemStatus === "approved" || itemStatus === "active";
          const isPending = itemStatus === "pending" || itemStatus === "draft";

          return (
            <View
              style={[
                styles.vendorCard,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {/* Top Row: Store Name & Badges */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.storeName, { color: textPrimary }]}>
                    {item.businessDetails?.businessName ||
                      item.brandDetails?.brandName ||
                      "Registered Store"}
                  </Text>
                  <Text style={[styles.sellerName, { color: textSecondary }]}>
                    {item.sellerDetails?.sellerName || "Store Owner"} &bull;{" "}
                    {item.sellerDetails?.sellerPhone ||
                      item.businessDetails?.businessPhone ||
                      item.userId?.phone ||
                      "No phone"}
                  </Text>
                </View>

                {/* Status Badges */}
                <View style={styles.badgesCol}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isApproved
                          ? isDark
                            ? "rgba(16, 185, 129, 0.2)"
                            : "#D1FAE5"
                          : isPending
                            ? isDark
                              ? "rgba(245, 158, 11, 0.2)"
                              : "#FEF3C7"
                            : isDark
                              ? "rgba(239, 68, 68, 0.2)"
                              : "#FEE2E2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: isApproved
                            ? "#10B981"
                            : isPending
                              ? "#F59E0B"
                              : "#EF4444",
                        },
                      ]}
                    >
                      {isApproved
                        ? "APPROVED"
                        : isPending
                          ? "PENDING KYC"
                          : "REJECTED"}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: moderateScale(10),
                      color: item.isStoreOpen ? "#10B981" : "#EF4444",
                      fontWeight: "700",
                      textAlign: "right",
                    }}
                  >
                    {item.isStoreOpen ? "● OPEN" : "○ CLOSED"}
                  </Text>
                </View>
              </View>

              {/* Middle Info Row */}
              <View style={[styles.cardDivider, { backgroundColor: border }]} />
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Assigned Admin</Text>
                  <Text style={[styles.infoValue, { color: textPrimary }]}>
                    {item.assignedAdmin
                      ? item.assignedAdmin.name
                      : "Direct Operations"}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Wallet Balance</Text>
                  <Text style={[styles.infoValue, { color: "#10B981" }]}>
                    NPR{" "}
                    {item.wallet?.currentBalance != null
                      ? item.wallet.currentBalance
                      : 0}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>City / Location</Text>
                  <Text style={[styles.infoValue, { color: textPrimary }]}>
                    {item.sellerDetails?.city ||
                      item.shippingLocations?.city ||
                      "Nepal"}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: border }]}
                  onPress={() => handleOpenDetails(item)}
                >
                  <Feather name="eye" size={scale(14)} color={textPrimary} />
                  <Text style={[styles.actionBtnText, { color: textPrimary }]}>
                    Profile
                  </Text>
                </TouchableOpacity>

                {!isApproved ? (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: "#10B981", borderColor: "#10B981" },
                    ]}
                    onPress={() => handleUpdateStatus(item._id, "approved")}
                  >
                    <Feather name="check" size={scale(14)} color="#FFFFFF" />
                    <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
                      Approve Store
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        borderColor: "#EF4444",
                      },
                    ]}
                    onPress={() => handleUpdateStatus(item._id, "rejected")}
                  >
                    <Feather name="x" size={scale(14)} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>
                      Revoke
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    padding: scale(12),
    borderBottomWidth: 1,
    gap: scale(10),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    height: scale(40),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
  },
  chipRow: {
    flexDirection: "row",
    gap: scale(6),
  },
  chip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(14),
    backgroundColor: "#F1F5F9",
  },
  chipActive: {
    backgroundColor: "#0284C7",
  },
  chipText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: scale(12),
    gap: scale(12),
    paddingBottom: scale(90),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(60),
    gap: scale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  emptySub: {
    fontSize: moderateScale(12),
  },
  vendorCard: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  storeName: {
    fontSize: moderateScale(15),
    fontWeight: "800",
  },
  sellerName: {
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  badgesCol: {
    alignItems: "flex-end",
    gap: scale(4),
  },
  statusBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scale(10),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(12),
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(10),
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: scale(2),
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(8),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    borderWidth: 1,
    padding: scale(20),
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(16),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
  },
  modalSub: {
    fontSize: moderateScale(11),
  },
  modalStatsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(16),
  },
  modalStatBox: {
    flex: 1,
    padding: scale(10),
    borderRadius: scale(10),
    alignItems: "center",
  },
  modalStatLabel: {
    fontSize: moderateScale(10),
    color: "#64748B",
  },
  modalStatValue: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    marginTop: scale(2),
  },
  detailList: {
    gap: scale(10),
    marginBottom: scale(20),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: moderateScale(13),
    color: "#64748B",
  },
  detailVal: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  closeModalBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
  },
  footerLoaderText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(10),
  },
  footerLine: {
    flex: 1,
    height: 1,
  },
  footerEndText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
});
