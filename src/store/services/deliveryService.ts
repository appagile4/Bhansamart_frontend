import api from "./api";

export interface DeliveryRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
  serviceCity?: string;
  serviceArea?: string;
  vehicleDetails?: {
    vehicleType: string;
    registrationNumber?: string;
    licenseNumber?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  };
}

export interface DeliveryLoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export interface DocumentUploadPayload {
  documentType: "panCard" | "aadhaarCard" | "drivingLicense" | "vehicleRc";
  documentNumber?: string;
  frontUrl?: string;
  backUrl?: string;
  fileUri?: string;
  expiryDate?: string;
}

export const deliveryService = {
  // Auth
  register: async (data: DeliveryRegisterPayload) => {
    const response = await api.post("/delivery/auth/register", data);
    return response.data;
  },

  login: async (data: DeliveryLoginPayload) => {
    const response = await api.post("/delivery/auth/login", data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/delivery/auth/me");
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put("/delivery/auth/me", data);
    return response.data;
  },

  uploadProfilePhoto: async (imageUri: string) => {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("profilePhoto", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await api.post("/delivery/auth/profile-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateBankDetails: async (bankDetails: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  }) => {
    const response = await api.put("/delivery/auth/bank-details", { bankDetails });
    return response.data;
  },

  // Documents (Supports direct Cloudinary upload via fileUri)
  uploadDocument: async (data: DocumentUploadPayload) => {
    if (data.fileUri) {
      const formData = new FormData();
      formData.append("documentType", data.documentType);
      if (data.documentNumber) {
        formData.append("documentNumber", data.documentNumber);
      }
      if (data.expiryDate) {
        formData.append("expiryDate", data.expiryDate);
      }

      const filename = data.fileUri.split("/").pop() || `${data.documentType}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("frontImage", {
        uri: data.fileUri,
        name: filename,
        type,
      } as any);

      const response = await api.post("/delivery/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const response = await api.post("/delivery/documents/upload", data);
    return response.data;
  },

  getDocumentStatus: async () => {
    const response = await api.get("/delivery/documents/status");
    return response.data;
  },

  // Security Deposit
  initiateDeposit: async (gateway: string = "MockGateway") => {
    const response = await api.post("/delivery/deposit/initiate", { gateway });
    return response.data;
  },

  simulateDepositWebhook: async (transactionId: string) => {
    const response = await api.post("/delivery/deposit/webhook", {
      transactionId,
      status: "PAID",
    });
    return response.data;
  },

  getDepositStatus: async () => {
    const response = await api.get("/delivery/deposit/status");
    return response.data;
  },

  requestDepositRefund: async (refundReason: string) => {
    const response = await api.post("/delivery/deposit/refund-request", {
      refundReason,
    });
    return response.data;
  },

  // Availability & GPS
  toggleAvailability: async (status?: "ONLINE" | "OFFLINE") => {
    const response = await api.patch("/delivery/availability/toggle", { status });
    return response.data;
  },

  getAvailabilityStatus: async () => {
    const response = await api.get("/delivery/availability/status");
    return response.data;
  },

  updateLocation: async (data: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }) => {
    const response = await api.post("/delivery/location/update", data);
    return response.data;
  },

  // Assignments & Orders
  getActiveAssignment: async () => {
    const response = await api.get("/delivery/assignments/active");
    return response.data;
  },

  acceptAssignment: async (assignmentId: string) => {
    const response = await api.post(`/delivery/assignments/${assignmentId}/accept`);
    return response.data;
  },

  rejectAssignment: async (assignmentId: string, reason?: string) => {
    const response = await api.post(`/delivery/assignments/${assignmentId}/reject`, {
      reason,
    });
    return response.data;
  },

  markArrivedStore: async (orderId: string) => {
    const response = await api.post(`/delivery/assignments/${orderId}/arrived-store`);
    return response.data;
  },

  verifyPickupOtp: async (orderId: string, otp: string) => {
    const response = await api.post(`/delivery/assignments/${orderId}/verify-pickup-otp`, {
      otp,
    });
    return response.data;
  },

  markArrivedCustomer: async (orderId: string) => {
    const response = await api.post(`/delivery/assignments/${orderId}/arrived-customer`);
    return response.data;
  },

  verifyDeliveryOtp: async (orderId: string, otp: string, paymentMode?: string) => {
    const response = await api.post(`/delivery/assignments/${orderId}/verify-delivery-otp`, {
      otp,
      paymentMode,
    });
    return response.data;
  },

  cancelDelivery: async (orderId: string, reason: string, notes?: string) => {
    const response = await api.post(`/delivery/assignments/${orderId}/cancel-delivery`, {
      reason,
      notes,
    });
    return response.data;
  },

  // Earnings
  getEarningsSummary: async () => {
    const response = await api.get("/delivery/earnings/summary");
    return response.data;
  },

  getCodCustodySummary: async () => {
    const response = await api.get("/delivery/earnings/cod-custody");
    return response.data;
  },

  // Return Pickups
  getReturnPickups: async () => {
    const response = await api.get("/delivery/assignments/return-pickups");
    return response.data;
  },

  submitReturnInspection: async (
    refundId: string,
    payload: {
      otp?: string;
      condition: string;
      missingAccessories?: string;
      visibleDamage?: string;
      quantityCollected?: number;
      location?: string;
      proofImages?: string[];
      notes?: string;
      result: "PASSED" | "FAILED";
    }
  ) => {
    const response = await api.patch(`/refunds/${refundId}/delivery-inspection`, payload);
    return response.data;
  },
};

export default deliveryService;
