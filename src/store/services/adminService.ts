import api from "./api";

// 1. Dashboard
export const fetchAdminDashboardStatsApi = async (params?: {
  timeframe?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get("/admin/dashboard/stats", { params });
  return response.data;
};

export const fetchAdminDashboardChartsApi = async (days = 7) => {
  const response = await api.get("/admin/dashboard/charts", { params: { days } });
  return response.data;
};

// 2. Vendors
export const fetchAdminVendorsApi = async (params?: {
  search?: string;
  status?: string;
  verification?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/vendors", { params });
  return response.data;
};

export const fetchAdminVendorDetailsApi = async (id: string) => {
  const response = await api.get(`/admin/vendors/${id}`);
  return response.data;
};

export const updateAdminVendorVerificationApi = async (
  id: string,
  payload: { verificationStatus: string; reason?: string }
) => {
  const response = await api.patch(`/admin/vendors/${id}/verification`, payload);
  return response.data;
};

// 3. Admins (Superadmin Only)
export const fetchAdminAdminsApi = async () => {
  const response = await api.get("/admin/admins");
  return response.data;
};

export const createAdminAccountApi = async (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  assignedVendors?: string[];
  adminPermissions?: Record<string, boolean>;
}) => {
  const response = await api.post("/admin/admins", payload);
  return response.data;
};

export const updateAdminAccountApi = async (
  id: string,
  payload: {
    name?: string;
    phone?: string;
    assignedVendors?: string[];
    adminPermissions?: Record<string, boolean>;
    isActive?: boolean;
    newPassword?: string;
  }
) => {
  const response = await api.put(`/admin/admins/${id}`, payload);
  return response.data;
};

// 4. Customers
export const fetchAdminCustomersApi = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/customers", { params });
  return response.data;
};

// 5. Delivery Partners
export const fetchAdminDeliveryBoysApi = async (params?: {
  availability?: string;
  status?: string;
  search?: string;
}) => {
  const response = await api.get("/admin/delivery-boys", { params });
  return response.data;
};

// 6. Catalog (Categories & Products)
export const fetchAdminCategoriesApi = async () => {
  const response = await api.get("/admin/categories");
  return response.data;
};

export const createAdminCategoryApi = async (payload: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentCategory?: string;
  displayOrder?: number;
}) => {
  const response = await api.post("/admin/categories", payload);
  return response.data;
};

export const updateAdminCategoryApi = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    image?: string;
    isActive?: boolean;
    displayOrder?: number;
  }
) => {
  const response = await api.put(`/admin/categories/${id}`, payload);
  return response.data;
};

export const fetchAdminProductsApi = async (params?: {
  search?: string;
  category?: string;
  vendorId?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/products", { params });
  return response.data;
};

export const moderateAdminProductApi = async (
  id: string,
  payload: {
    name?: string;
    price?: number;
    stock?: number;
    category?: string;
    subCategory?: string;
    isActive?: boolean;
  }
) => {
  const response = await api.patch(`/admin/products/${id}/moderate`, payload);
  return response.data;
};

// 7. Finance (Superadmin Only)
export const fetchAdminTransactionsApi = async (params?: {
  vendorId?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/finance/transactions", { params });
  return response.data;
};

export const fetchAdminWithdrawalsApi = async (params?: { status?: string }) => {
  const response = await api.get("/admin/finance/withdrawals", { params });
  return response.data;
};

export const reviewAdminWithdrawalApi = async (
  id: string,
  payload: { action: "APPROVE" | "REJECT"; payoutReference?: string; reason?: string }
) => {
  const response = await api.post(`/admin/finance/withdrawals/${id}/review`, payload);
  return response.data;
};

// 8. Platform Payment Accounts
export const fetchPlatformPaymentConfigApi = async () => {
  const response = await api.get("/admin/platform-payment/config");
  return response.data;
};

export const updatePlatformPaymentConfigApi = async (payload: {
  bankDetails?: any;
  enabledPaymentMethods?: any[];
}) => {
  const response = await api.put("/admin/platform-payment/config", payload);
  return response.data;
};

// 9. Support Tickets
export const fetchAdminTicketsApi = async (params?: {
  status?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/tickets", { params });
  return response.data;
};

export const fetchAdminTicketDetailsApi = async (id: string) => {
  const response = await api.get(`/admin/tickets/${id}`);
  return response.data;
};

export const replyAdminTicketApi = async (
  id: string,
  payload: { message: string; status?: string }
) => {
  const response = await api.post(`/admin/tickets/${id}/reply`, payload);
  return response.data;
};

// 10. Targeted Notifications
export const sendAdminTargetedNotificationApi = async (payload: {
  title: string;
  body: string;
  targetAudience: string;
  targetRole?: string;
  targetId?: string;
  deepLink?: string;
  data?: any;
}) => {
  const response = await api.post("/admin/notifications/send", payload);
  return response.data;
};

export const searchNotificationRecipientsApi = async (params: {
  role: string;
  q?: string;
}) => {
  const response = await api.get("/admin/notifications/search-recipients", { params });
  return response.data;
};

// 11. Live Operational Map Data
export const fetchAdminLiveMapDataApi = async () => {
  const response = await api.get("/admin/map/live-data");
  return response.data;
};

// 12. Audit Logs (Superadmin Only)
export const fetchAdminAuditLogsApi = async (params?: {
  action?: string;
  targetResource?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/audit-logs", { params });
  return response.data;
};

// 13. StaffAdmin Scoped Operations
export const fetchStaffDashboardOverviewApi = async (params?: {
  vendorId?: string;
  timeframe?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get("/admin/staff-operations/dashboard-overview", { params });
  return response.data;
};

export const fetchStaffAssignedVendorsApi = async () => {
  const response = await api.get("/admin/staff-operations/assigned-vendors");
  return response.data;
};

export const fetchVendorSalesAnalyticsApi = async (params?: {
  vendorId?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await api.get("/admin/staff-operations/sales-analytics", { params });
  return response.data;
};

export const fetchVendorProductsAnalyticsApi = async (params?: {
  vendorId?: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}) => {
  const response = await api.get("/admin/staff-operations/products-analytics", { params });
  return response.data;
};

export const fetchDeliveryAssignmentsAdminApi = async (params?: {
  vendorId?: string;
  status?: string;
  deliveryBoyId?: string;
}) => {
  const response = await api.get("/admin/staff-operations/delivery-assignments", { params });
  return response.data;
};

export const fetchDeliveryBoyProfileAdminApi = async (id: string) => {
  const response = await api.get(`/admin/staff-operations/delivery-boy-profile/${id}`);
  return response.data;
};

export const fetchDeliveryCodReconciliationAdminApi = async (params?: {
  deliveryBoyId?: string;
  vendorId?: string;
  status?: string;
}) => {
  const response = await api.get("/admin/staff-operations/delivery-cod-reconciliation", { params });
  return response.data;
};

export const raiseCodDisputeAdminApi = async (payload: {
  deliveryBoyId: string;
  disputedAmount: number;
  reason: string;
  notes?: string;
}) => {
  const response = await api.post("/admin/staff-operations/delivery-cod-dispute", payload);
  return response.data;
};

export const fetchVendorWithdrawalsAdminApi = async (params?: {
  vendorId?: string;
  status?: string;
  escalationStatus?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/staff-operations/withdrawals", { params });
  return response.data;
};

export const examineVendorWithdrawalAdminApi = async (
  id: string,
  payload: {
    internalNotes?: string;
    escalationStatus?: string;
    rejectionReason?: string;
  }
) => {
  const response = await api.patch(`/admin/staff-operations/withdrawals/${id}/examine`, payload);
  return response.data;
};

export const fetchBrandsReviewQueueAdminApi = async (params?: {
  status?: string;
  vendorId?: string;
  search?: string;
}) => {
  const response = await api.get("/admin/staff-operations/brands-queue", { params });
  return response.data;
};

export const reviewBrandAdminApi = async (
  id: string,
  payload: {
    action: "approve" | "reject" | "request_info";
    reviewerNotes?: string;
  }
) => {
  const response = await api.patch(`/admin/staff-operations/brands-queue/${id}/review`, payload);
  return response.data;
};

export const fetchRefundsQueueAdminApi = async (params?: {
  status?: string;
  vendorId?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/staff-operations/refunds-queue", { params });
  return response.data;
};

export const staffExamineRefundActionApi = async (
  id: string,
  payload: {
    decision: "FORWARD_TO_FINANCE" | "REQUIRE_RETURN_PICKUP" | "REJECTED";
    examinationNotes?: string;
    conditionScore?: string;
    estimatedDepreciation?: number;
  }
) => {
  const response = await api.patch(`/admin/staff-operations/refunds/${id}/examine`, payload);
  return response.data;
};

export const updateRefundPickupActionApi = async (
  id: string,
  payload: {
    deliveryBoyId?: string;
    pickupStatus?: string;
    pickupNotes?: string;
    trackingNumber?: string;
  }
) => {
  const response = await api.patch(`/admin/staff-operations/refunds/${id}/pickup`, payload);
  return response.data;
};

export const recordRefundInspectionActionApi = async (
  id: string,
  payload: {
    passed: boolean;
    conditionGrade?: "A" | "B" | "C" | "DAMAGED" | "WRONG_ITEM";
    inspectionNotes?: string;
    depreciationPercentage?: number;
    recommendedAction?: string;
  }
) => {
  const response = await api.patch(`/admin/staff-operations/refunds/${id}/inspection`, payload);
  return response.data;
};

export const finalizeRefundPayoutActionApi = async (
  id: string,
  payload: {
    action: "approve" | "reject";
    notes?: string;
  }
) => {
  const response = await api.patch(`/admin/staff-operations/refunds/${id}/finalize-payout`, payload);
  return response.data;
};

export const fetchStaffNotificationsAdminApi = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  unreadOnly?: boolean;
}) => {
  const response = await api.get("/admin/staff-operations/notifications", { params });
  return response.data;
};

export const markStaffNotificationReadApi = async (id: string) => {
  const response = await api.patch(`/admin/staff-operations/notifications/${id}/read`);
  return response.data;
};

// 14. Vendor Broadcast Notifications (Granular Super Admin Permissions & Scoping)
export interface BroadcastPermissionsData {
  canBroadcastToAssignedVendors: boolean;
  canBroadcastToSpecificVendors: boolean;
  canBroadcastToAllVendors: boolean;
  isSuperAdmin: boolean;
  hasAnyBroadcastPermission: boolean;
  assignedVendors?: any[];
}

export const fetchBroadcastPermissionsApi = async (): Promise<{
  success: boolean;
  data: BroadcastPermissionsData;
}> => {
  const response = await api.get("/admin/broadcasts/permissions");
  return response.data;
};

export const fetchBroadcastEligibleVendorsApi = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/admin/broadcasts/eligible-vendors", { params });
  return response.data;
};

export const fetchBroadcastRecipientPreviewApi = async (params: {
  targetType: "ASSIGNED_VENDORS" | "SPECIFIC_VENDORS" | "ALL_VENDORS";
  vendorIds?: string[];
}) => {
  const response = await api.get("/admin/broadcasts/recipient-preview", {
    params: {
      targetType: params.targetType,
      vendorIds: params.vendorIds ? params.vendorIds.join(",") : undefined,
    },
  });
  return response.data;
};

export interface SendBroadcastPayload {
  title: string;
  message: string;
  targetType: "ASSIGNED_VENDORS" | "SPECIFIC_VENDORS" | "ALL_VENDORS";
  vendorIds?: string[];
  notificationType?: "GENERAL" | "ANNOUNCEMENT" | "ORDER_UPDATE" | "PROMOTION" | "IMPORTANT_NOTICE";
  imageUrl?: string;
  scheduledAt?: string | null;
  idempotencyKey?: string;
}

export const sendVendorBroadcastApi = async (payload: SendBroadcastPayload) => {
  const response = await api.post("/admin/broadcasts/send", payload);
  return response.data;
};

export const fetchBroadcastHistoryApi = async (params?: {
  page?: number;
  limit?: number;
  targetType?: string;
  search?: string;
}) => {
  const response = await api.get("/admin/broadcasts/history", { params });
  return response.data;
};

