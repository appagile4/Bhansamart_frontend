import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AddressPayload,
  createAddressApi,
  deleteAddressApi,
  fetchAddressesApi,
  SavedAddress,
  setDefaultAddressApi,
  updateAddressApi,
} from "../services/addressService";

const ADDRESS_STORAGE_KEY = "bhansa_saved_addresses";
const SELECTED_ADDRESS_STORAGE_KEY = "bhansa_selected_address";
const ACTIVE_LOCATION_STORAGE_KEY = "bhansa_active_location";

export interface AddressState {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  currentGpsLocation: string | null;
  activeDisplayLocation: string;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const DEFAULT_FALLBACK_LOCATION = "Baneshwor, Kathmandu, Bagmati, Nepal";

const initialState: AddressState = {
  addresses: [],
  selectedAddress: null,
  currentGpsLocation: null,
  activeDisplayLocation: DEFAULT_FALLBACK_LOCATION,
  loading: false,
  error: null,
  initialized: false,
};

// Helper to save to local storage
const saveAddressesToStorage = async (addresses: SavedAddress[]) => {
  try {
    await storage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
  } catch (err) {
    console.warn("Failed to persist addresses to storage:", err);
  }
};

const saveSelectedAddressToStorage = async (
  address: SavedAddress | null,
  displayLocation: string
) => {
  try {
    if (address) {
      await storage.setItem(
        SELECTED_ADDRESS_STORAGE_KEY,
        JSON.stringify(address)
      );
    }
    await storage.setItem(ACTIVE_LOCATION_STORAGE_KEY, displayLocation);
  } catch (err) {
    console.warn("Failed to persist selected address to storage:", err);
  }
};

/**
 * Fetch all addresses for the user
 */
export const fetchAddresses = createAsyncThunk(
  "address/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchAddressesApi();
      if (response.success && Array.isArray(response.data)) {
        await saveAddressesToStorage(response.data);
        return response.data;
      }
      return [];
    } catch (err: any) {
      // Offline fallback: try loading from local storage
      const cached = await storage.getItem(ADDRESS_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as SavedAddress[];
        } catch {
          // parse failed
        }
      }
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch addresses"
      );
    }
  }
);

/**
 * Add a new address
 */
export const addAddress = createAsyncThunk(
  "address/addAddress",
  async (payload: AddressPayload, { rejectWithValue }) => {
    try {
      const response = await createAddressApi(payload);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to add address");
    } catch (err: any) {
      // Fallback offline mock entry
      const fallbackAddr: SavedAddress = {
        id: `addr-local-${Date.now()}`,
        type: payload.type || "Home",
        addressLine:
          payload.addressLine ||
          [payload.houseNo, payload.landmark, payload.street, payload.city]
            .filter(Boolean)
            .join(", "),
        houseNo: payload.houseNo,
        street: payload.street,
        city: payload.city,
        landmark: payload.landmark,
        phone: payload.phone,
        isDefault: payload.isDefault || false,
      };
      return fallbackAddr;
    }
  }
);

/**
 * Update an existing address
 */
export const editAddress = createAsyncThunk(
  "address/editAddress",
  async (
    { id, payload }: { id: string; payload: Partial<AddressPayload> },
    { rejectWithValue }
  ) => {
    try {
      const response = await updateAddressApi(id, payload);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to update address");
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update address"
      );
    }
  }
);

/**
 * Delete an address
 */
export const removeAddress = createAsyncThunk(
  "address/removeAddress",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteAddressApi(id);
      return id;
    } catch (err: any) {
      // Even if backend fails, return id so local state removes it smoothly
      return id;
    }
  }
);

/**
 * Set an address as default
 */
export const makeDefaultAddress = createAsyncThunk(
  "address/makeDefaultAddress",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await setDefaultAddressApi(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return id;
    } catch (err: any) {
      return id;
    }
  }
);

export const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    setSelectedAddress: (state, action: PayloadAction<SavedAddress | null>) => {
      state.selectedAddress = action.payload;
      if (action.payload?.addressLine) {
        state.activeDisplayLocation = action.payload.addressLine;
      }
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
    setCurrentGpsLocation: (state, action: PayloadAction<string>) => {
      state.currentGpsLocation = action.payload;
      state.activeDisplayLocation = action.payload;
      state.selectedAddress = {
        id: "current-location",
        type: "Other",
        addressLine: action.payload,
        phone: "",
      };
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
    setActiveDisplayLocation: (state, action: PayloadAction<string>) => {
      state.activeDisplayLocation = action.payload;
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
    setAddressesLocal: (state, action: PayloadAction<SavedAddress[]>) => {
      state.addresses = action.payload;
      if (!state.selectedAddress && action.payload.length > 0) {
        const def = action.payload.find((a) => a.isDefault) || action.payload[0];
        state.selectedAddress = def;
        state.activeDisplayLocation = def.addressLine;
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
    removeAddressLocal: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(
        (a) => a.id !== action.payload && a._id !== action.payload
      );
      if (
        state.selectedAddress &&
        (state.selectedAddress.id === action.payload ||
          state.selectedAddress._id === action.payload)
      ) {
        const next = state.addresses[0] || null;
        state.selectedAddress = next;
        state.activeDisplayLocation = next?.addressLine || DEFAULT_FALLBACK_LOCATION;
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
  },
  extraReducers: (builder) => {
    // Fetch Addresses
    builder.addCase(fetchAddresses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAddresses.fulfilled, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.addresses = action.payload;

      // Keep current selection if already valid or GPS location, else default
      if (!state.selectedAddress || state.selectedAddress.id === "current-location") {
        if (state.selectedAddress?.id !== "current-location" && action.payload.length > 0) {
          const defaultAddr =
            action.payload.find((a) => a.isDefault) || action.payload[0];
          state.selectedAddress = defaultAddr;
          state.activeDisplayLocation = defaultAddr.addressLine;
        }
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });
    builder.addCase(fetchAddresses.rejected, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.error = action.payload as string;
    });

    // Add Address
    builder.addCase(addAddress.fulfilled, (state, action) => {
      const newAddr = action.payload;
      if (newAddr.isDefault) {
        state.addresses = state.addresses.map((a) => ({
          ...a,
          isDefault: false,
        }));
        state.selectedAddress = newAddr;
        state.activeDisplayLocation = newAddr.addressLine;
      }
      state.addresses.unshift(newAddr);
      if (!state.selectedAddress) {
        state.selectedAddress = newAddr;
        state.activeDisplayLocation = newAddr.addressLine;
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });

    // Edit Address
    builder.addCase(editAddress.fulfilled, (state, action) => {
      const updated = action.payload;
      state.addresses = state.addresses.map((a) => {
        if (a.id === updated.id || a._id === updated.id) {
          return updated;
        }
        if (updated.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      if (
        state.selectedAddress &&
        (state.selectedAddress.id === updated.id ||
          state.selectedAddress._id === updated.id)
      ) {
        state.selectedAddress = updated;
        state.activeDisplayLocation = updated.addressLine;
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });

    // Remove Address
    builder.addCase(removeAddress.fulfilled, (state, action) => {
      const removedId = action.payload;
      state.addresses = state.addresses.filter(
        (a) => a.id !== removedId && a._id !== removedId
      );
      if (
        state.selectedAddress &&
        (state.selectedAddress.id === removedId ||
          state.selectedAddress._id === removedId)
      ) {
        const next = state.addresses[0] || null;
        state.selectedAddress = next;
        state.activeDisplayLocation = next?.addressLine || DEFAULT_FALLBACK_LOCATION;
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });

    // Make Default Address
    builder.addCase(makeDefaultAddress.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        state.addresses = action.payload;
        const def = action.payload.find((a) => a.isDefault) || action.payload[0] || null;
        state.selectedAddress = def;
        if (def) state.activeDisplayLocation = def.addressLine;
      } else {
        const targetId = action.payload;
        state.addresses = state.addresses.map((a) => ({
          ...a,
          isDefault: a.id === targetId || a._id === targetId,
        }));
        const matched = state.addresses.find(
          (a) => a.id === targetId || a._id === targetId
        );
        if (matched) {
          state.selectedAddress = matched;
          state.activeDisplayLocation = matched.addressLine;
        }
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });
  },
});

export const {
  setSelectedAddress,
  setCurrentGpsLocation,
  setActiveDisplayLocation,
  setAddressesLocal,
  removeAddressLocal,
} = addressSlice.actions;

export default addressSlice.reducer;
