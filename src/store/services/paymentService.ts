import api from "./api";

export interface CardItem {
  _id: string;
  type: "card";
  cardHolderName: string;
  cardNumber: string;
  last4: string;
  expiryDate: string;
  cardType: "Visa" | "Mastercard" | "American Express" | "Discover" | "Other";
  nickname: "Personal" | "Business" | "Other";
  isDefault: boolean;
  createdAt?: string;
}

export interface WalletItem {
  _id: string;
  type: "wallet";
  walletType: "esewa" | "khalti";
  accountIdentifier: string;
  isLinked: boolean;
  createdAt?: string;
}

export interface NetbankingItem {
  _id: string;
  type: "netbanking";
  bankId: string;
  bankName: string;
  shortCode?: string;
  isLinked: boolean;
  createdAt?: string;
}

export interface PaymentMethodsData {
  cards: CardItem[];
  wallets: WalletItem[];
  netbanking: NetbankingItem[];
  all: (CardItem | WalletItem | NetbankingItem)[];
}

export interface PaymentApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Fetch all saved payment methods for authenticated user
 */
export const fetchPaymentMethodsApi = async (): Promise<
  PaymentApiResponse<PaymentMethodsData>
> => {
  const response = await api.get<PaymentApiResponse<PaymentMethodsData>>(
    "/payment-methods"
  );
  return response.data;
};

/**
 * Add a new card
 */
export const addCardApi = async (payload: {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  nicknameType?: "Personal" | "Business" | "Other";
}): Promise<PaymentApiResponse<CardItem>> => {
  const response = await api.post<PaymentApiResponse<CardItem>>(
    "/payment-methods/cards",
    payload
  );
  return response.data;
};

/**
 * Link digital wallet (eSewa / Khalti)
 */
export const linkWalletApi = async (payload: {
  walletType: "esewa" | "khalti";
  accountIdentifier: string;
}): Promise<PaymentApiResponse<WalletItem>> => {
  const response = await api.post<PaymentApiResponse<WalletItem>>(
    "/payment-methods/wallets/link",
    payload
  );
  return response.data;
};

/**
 * Unlink digital wallet
 */
export const unlinkWalletApi = async (
  walletType: "esewa" | "khalti"
): Promise<PaymentApiResponse<{ message: string }>> => {
  const response = await api.delete<PaymentApiResponse<{ message: string }>>(
    `/payment-methods/wallets/${walletType}`
  );
  return response.data;
};

/**
 * Add Netbanking bank
 */
export const addNetbankingApi = async (payload: {
  bankId: string;
  bankName: string;
  shortCode?: string;
}): Promise<PaymentApiResponse<NetbankingItem>> => {
  const response = await api.post<PaymentApiResponse<NetbankingItem>>(
    "/payment-methods/netbanking",
    payload
  );
  return response.data;
};

/**
 * Delete a payment method (card or bank)
 */
export const deletePaymentMethodApi = async (
  id: string
): Promise<PaymentApiResponse<{ message: string }>> => {
  const response = await api.delete<PaymentApiResponse<{ message: string }>>(
    `/payment-methods/${id}`
  );
  return response.data;
};
