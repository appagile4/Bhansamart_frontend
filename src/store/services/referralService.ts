import api from "./api";

export interface ReferralSummary {
  referralCode: string;
  rewardPointsBalance: number;
  totalInvited: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  campaign: {
    name: string;
    referrerRewardPoints: number;
    newCustomerRewardPoints: number;
  };
}

export interface ReferredHistoryItem {
  _id: string;
  referredName: string;
  registrationDate: string;
  rewardedAt?: string;
  status: "PENDING" | "REWARDED" | "REJECTED" | "EXPIRED";
  pointsEarned: number;
  expectedPoints: number;
}

export interface ValidateCodeResponse {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    referrerId: string;
    referrerName: string;
    campaign: {
      name: string;
      referrerRewardPoints: number;
      newCustomerWelcomePoints: number;
    };
  };
}

export interface WalletSummary {
  availablePoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lifetimeReversed: number;
  totalTransactions: number;
}

export interface RewardTransactionItem {
  _id: string;
  type: "CREDIT" | "DEBIT" | "REVERSAL";
  reason: string;
  points: number;
  balanceAfter: number;
  idempotencyKey: string;
  status: "COMPLETED" | "REVERSED" | "PENDING";
  createdAt: string;
}

export interface CustomerNotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const referralService = {
  // Screen A: Refer & Earn
  getMyReferral: async () => {
    const response = await api.get<{ success: boolean; data: ReferralSummary }>(
      "/referrals/me"
    );
    return response.data.data;
  },

  // Screen B: My Referrals History
  getMyReferralsHistory: async (page = 1, limit = 20) => {
    const response = await api.get<{
      success: boolean;
      data: ReferredHistoryItem[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>("/referrals/me/history", { params: { page, limit } });
    return response.data;
  },

  // Screen E: Validate Code
  validateReferralCode: async (code: string) => {
    const response = await api.post<ValidateCodeResponse>(
      "/referrals/validate",
      { code }
    );
    return response.data;
  },

  // Screen C: Rewards Wallet
  getRewardsWallet: async () => {
    const response = await api.get<{ success: boolean; data: WalletSummary }>(
      "/rewards/wallet"
    );
    return response.data.data;
  },

  // Screen C: Transactions Ledger
  getRewardTransactions: async (page = 1, limit = 20, type?: string) => {
    const response = await api.get<{
      success: boolean;
      data: RewardTransactionItem[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>("/rewards/transactions", { params: { page, limit, type } });
    return response.data;
  },

  // Screen D: Customer In-App Notifications
  getCustomerNotifications: async (page = 1, limit = 20, isRead?: boolean) => {
    const response = await api.get<{
      success: boolean;
      data: CustomerNotificationItem[];
      total: number;
      totalPages: number;
      currentPage: number;
      unreadCount: number;
    }>("/notifications/my", { params: { page, limit, isRead, role: "customer" } });
    return response.data;
  },

  markNotificationRead: async (id: string) => {
    const response = await api.patch<{
      success: boolean;
      data: CustomerNotificationItem;
    }>(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.patch<{
      success: boolean;
      data: { modifiedCount: number };
    }>("/notifications/read-all", {}, { params: { role: "customer" } });
    return response.data;
  },
};
