import api from "./api";

export interface NearbyStore {
  _id: string;
  storeName: string;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    categories?: string[];
    businessPhone?: string;
    businessEmail?: string;
  };
  sellerDetails?: {
    sellerName?: string;
    sellerPhone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };
  brandDetails?: {
    brandName?: string;
    brandLogo?: string;
  };
  shippingLocations?: {
    warehouseAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryRadiusKm: number;
  isStoreOpen: boolean;
  distanceKm: number;
  distanceMeters?: number;
  isWithinRadius: boolean;
  isEligible?: boolean;
}

export interface NearbyStoresResponse {
  success: boolean;
  count: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  data: NearbyStore[];
}

export const getNearbyStoresApi = async (
  lat: number,
  lng: number,
  all: boolean = true
): Promise<NearbyStoresResponse> => {
  const response = await api.get<NearbyStoresResponse>(
    `/vendor/nearby?lat=${lat}&lng=${lng}&all=${all}`
  );
  return response.data;
};

export interface VendorCustomer {
  _id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  orderCount: number;
  productCount: number;
  cancelledCount: number;
  deliveredCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastAddress?: string;
}

export interface VendorCustomersResponse {
  success: boolean;
  count: number;
  data: VendorCustomer[];
}

export const getVendorCustomersApi = async (): Promise<VendorCustomersResponse> => {
  const response = await api.get<VendorCustomersResponse>("/vendor/customers");
  return response.data;
};

