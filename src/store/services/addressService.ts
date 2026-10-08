import api from "./api";

export interface AddressPayload {
  type: "Home" | "Work" | "Other";
  addressLine?: string;
  houseNo?: string;
  street?: string;
  city?: string;
  landmark?: string;
  phone: string;
  isDefault?: boolean;
}

export interface SavedAddress {
  id: string;
  _id?: string;
  type: "Home" | "Work" | "Other";
  addressLine: string;
  houseNo?: string;
  street?: string;
  city?: string;
  landmark?: string;
  phone: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface AddressListResponse {
  success: boolean;
  count: number;
  data: SavedAddress[];
  message?: string;
}

export interface SingleAddressResponse {
  success: boolean;
  data: SavedAddress;
  message?: string;
}

export interface DeleteAddressResponse {
  success: boolean;
  message?: string;
  deletedId?: string;
}

/**
 * Fetch all addresses for logged in user
 */
export const fetchAddressesApi = async (): Promise<AddressListResponse> => {
  const response = await api.get<AddressListResponse>("/address");
  return response.data;
};

/**
 * Create new address
 */
export const createAddressApi = async (
  payload: AddressPayload
): Promise<SingleAddressResponse> => {
  const response = await api.post<SingleAddressResponse>("/address", payload);
  return response.data;
};

/**
 * Update existing address
 */
export const updateAddressApi = async (
  id: string,
  payload: Partial<AddressPayload>
): Promise<SingleAddressResponse> => {
  const response = await api.put<SingleAddressResponse>(`/address/${id}`, payload);
  return response.data;
};

/**
 * Delete address
 */
export const deleteAddressApi = async (
  id: string
): Promise<DeleteAddressResponse> => {
  const response = await api.delete<DeleteAddressResponse>(`/address/${id}`);
  return response.data;
};

/**
 * Set default address
 */
export const setDefaultAddressApi = async (
  id: string
): Promise<AddressListResponse> => {
  const response = await api.patch<AddressListResponse>(`/address/${id}/default`);
  return response.data;
};
