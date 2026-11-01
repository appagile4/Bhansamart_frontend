import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as Location from "expo-location";
import socketService from "../services/socketService";
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
const SELECTED_LOCATION_TYPE_KEY = "bhansa_selected_location_type";
const USER_COORDS_STORAGE_KEY = "bhansa_user_coords";
const LAST_LOCATION_TIMESTAMP_KEY = "bhansa_last_location_timestamp";

export interface AddressState {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  selectedAddressId: string | null;
  selectedLocationType: "current_location" | "saved_address";
  currentGpsLocation: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  activeDisplayLocation: string;
  latitude: number | null;
  longitude: number | null;
  permissionStatus: "granted" | "denied" | "undetermined" | null;
  isLocationLoading: boolean;
  lastLocationUpdate: number | null;
  locationError: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const DEFAULT_FALLBACK_LOCATION = "Meerut, Uttar Pradesh";

const initialState: AddressState = {
  addresses: [],
  selectedAddress: null,
  selectedAddressId: null,
  selectedLocationType: "current_location",
  currentGpsLocation: null,
  gpsLatitude: null,
  gpsLongitude: null,
  activeDisplayLocation: DEFAULT_FALLBACK_LOCATION,
  latitude: 28.9845,
  longitude: 77.7064,
  permissionStatus: null,
  isLocationLoading: false,
  lastLocationUpdate: null,
  locationError: null,
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

const saveCoordsToStorage = (lat: number | null, lng: number | null) => {
  if (lat != null && lng != null) {
    storage.setItem(USER_COORDS_STORAGE_KEY, JSON.stringify({ lat, lng })).catch(() => {});
  }
};

/**
 * Converts Expo reverse geocode output into clean, standard quick-commerce format
 * Examples:
 * - "Ganga Nagar, Meerut, Uttar Pradesh"
 * - "Meerut, Uttar Pradesh"
 */
export const formatGeocodedAddress = (
  item?: Location.LocationGeocodedAddress | null
): string => {
  if (!item) return "Current Location";

  // City / District name (e.g. "Meerut")
  const city = item.city || item.subregion || item.district || "";
  // State / Province name (e.g. "Uttar Pradesh")
  const region = item.region || "";

  // Locality / Neighborhood / Landmark / Street (e.g. "Ganga Nagar")
  const neighborhood =
    item.name && item.name !== item.streetNumber && item.name !== city
      ? item.name
      : item.street || "";

  if (neighborhood && city) {
    if (region && region !== city) {
      return `${neighborhood}, ${city}, ${region}`;
    }
    return `${neighborhood}, ${city}`;
  }

  if (city && region && city !== region) {
    return `${city}, ${region}`;
  }

  if (city) return city;
  if (region) return region;
  if (item.formattedAddress) return item.formattedAddress;
  return "Current Location";
};

/**
 * Automatically detects current GPS location on app start or refresh,
 * converts coordinates via reverse geocoding into readable address,
 * and updates global location state.
 */
export const detectCurrentLocation = createAsyncThunk(
  "address/detectCurrentLocation",
  async (
    options: { forceGpsAsActive?: boolean; promptIfUndetermined?: boolean } | undefined,
    { rejectWithValue }
  ) => {
    try {
      // 1. Check current permission
      let perm = await Location.getForegroundPermissionsAsync();

      // If undetermined and allowed to prompt (or user explicitly tapped Use Current Location)
      if (
        perm.status !== "granted" &&
        (options?.forceGpsAsActive || options?.promptIfUndetermined !== false)
      ) {
        if (perm.canAskAgain) {
          perm = await Location.requestForegroundPermissionsAsync();
        }
      }

      if (perm.status !== "granted") {
        return rejectWithValue({
          permissionStatus: perm.status as "denied" | "undetermined",
          message:
            "Location permission is needed to show nearby stores and deliver to your address. Please allow location access or select an address manually.",
        });
      }

      // 2. Check if device location services (GPS) are turned on
      const hasServices = await Location.hasServicesEnabledAsync();
      if (!hasServices) {
        return rejectWithValue({
          permissionStatus: "granted" as const,
          message:
            "Device location services are turned off. Please turn on GPS in your quick settings.",
        });
      }

      // 3. Obtain position (quick urban GPS fix without battery drain)
      let position: Location.LocationObject | null = null;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (posErr) {
        // Fallback to last known position if balanced times out
        position = await Location.getLastKnownPositionAsync();
      }

      if (!position) {
        return rejectWithValue({
          permissionStatus: "granted" as const,
          message: "Unable to retrieve device GPS coordinates. Please try again.",
        });
      }

      const { latitude, longitude } = position.coords;

      // 4. Reverse Geocode into readable address
      let readableAddress = "Current Location";
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (results && results.length > 0) {
          readableAddress = formatGeocodedAddress(results[0]);
        }
      } catch (geoErr) {
        console.warn("[detectCurrentLocation] Reverse geocode fallback:", geoErr);
      }

      // Persist coords to storage for API headers & offline resilience
      saveCoordsToStorage(latitude, longitude);
      storage.setItem(LAST_LOCATION_TIMESTAMP_KEY, String(Date.now())).catch(() => {});

      // Synchronize socket location with backend
      socketService.emitCustomerLocation(latitude, longitude).catch(() => {});

      return {
        latitude,
        longitude,
        readableAddress,
        permissionStatus: "granted" as const,
        forceGpsAsActive: options?.forceGpsAsActive,
      };
    } catch (err: any) {
      return rejectWithValue({
        permissionStatus: "denied" as const,
        message: err.message || "Failed to detect current location.",
      });
    }
  }
);

/**
 * Hydrates addresses and last selected location state from storage on app boot
 */
export const loadAddressFromStorage = createAsyncThunk(
  "address/loadAddressFromStorage",
  async () => {
    try {
      const [
        savedAddressesStr,
        selectedAddressStr,
        activeLocStr,
        selectedLocTypeStr,
        coordsStr,
        lastTimeStr,
      ] = await Promise.all([
        storage.getItem(ADDRESS_STORAGE_KEY),
        storage.getItem(SELECTED_ADDRESS_STORAGE_KEY),
        storage.getItem(ACTIVE_LOCATION_STORAGE_KEY),
        storage.getItem(SELECTED_LOCATION_TYPE_KEY),
        storage.getItem(USER_COORDS_STORAGE_KEY),
        storage.getItem(LAST_LOCATION_TIMESTAMP_KEY),
      ]);

      let addresses: SavedAddress[] = [];
      let selectedAddress: SavedAddress | null = null;
      let activeDisplayLocation = activeLocStr || DEFAULT_FALLBACK_LOCATION;
      let selectedLocationType: "current_location" | "saved_address" =
        selectedLocTypeStr === "saved_address" ? "saved_address" : "current_location";
      let latitude: number = 28.9845;
      let longitude: number = 77.7064;
      let lastLocationUpdate: number | null = lastTimeStr ? Number(lastTimeStr) : null;

      if (savedAddressesStr) {
        try {
          addresses = JSON.parse(savedAddressesStr);
        } catch {}
      }

      if (selectedAddressStr) {
        try {
          selectedAddress = JSON.parse(selectedAddressStr);
          if (selectedAddress && selectedAddress.id !== "current-location") {
            selectedLocationType = "saved_address";
          }
        } catch {}
      }

      if (coordsStr) {
        try {
          const parsed = JSON.parse(coordsStr);
          if (parsed?.lat != null && parsed?.lng != null) {
            latitude = Number(parsed.lat);
            longitude = Number(parsed.lng);
          }
        } catch {}
      }

      return {
        addresses,
        selectedAddress,
        activeDisplayLocation,
        selectedLocationType,
        latitude,
        longitude,
        lastLocationUpdate,
      };
    } catch {
      return null;
    }
  }
);

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
        latitude: payload.latitude,
        longitude: payload.longitude,
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
      const addr = action.payload;
      state.selectedAddress = addr;
      if (!addr || addr.id === "current-location") {
        state.selectedLocationType = "current_location";
        state.selectedAddressId = "current-location";
        if (addr?.addressLine) {
          state.activeDisplayLocation = addr.addressLine;
        }
      } else {
        state.selectedLocationType = "saved_address";
        state.selectedAddressId = addr.id || addr._id || null;
        if (addr.addressLine) {
          state.activeDisplayLocation = addr.addressLine;
        }
        if (addr.latitude != null && addr.longitude != null) {
          state.latitude = Number(addr.latitude);
          state.longitude = Number(addr.longitude);
          saveCoordsToStorage(state.latitude, state.longitude);
          socketService.emitCustomerLocation(state.latitude, state.longitude).catch(() => {});
        }
      }
      storage.setItem(SELECTED_LOCATION_TYPE_KEY, state.selectedLocationType).catch(() => {});
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
    useCurrentGpsLocation: (state) => {
      state.selectedLocationType = "current_location";
      state.selectedAddressId = "current-location";
      if (state.gpsLatitude != null && state.gpsLongitude != null) {
        state.latitude = state.gpsLatitude;
        state.longitude = state.gpsLongitude;
      }
      if (state.currentGpsLocation) {
        state.activeDisplayLocation = state.currentGpsLocation;
      }
      state.selectedAddress = {
        id: "current-location",
        type: "Other",
        addressLine: state.activeDisplayLocation,
        phone: "",
        latitude: state.latitude || 28.9845,
        longitude: state.longitude || 77.7064,
      };
      storage.setItem(SELECTED_LOCATION_TYPE_KEY, "current_location").catch(() => {});
      saveCoordsToStorage(state.latitude, state.longitude);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
      socketService.emitCustomerLocation(state.latitude || 28.9845, state.longitude || 77.7064).catch(() => {});
    },
    setUserCoordinates: (
      state,
      action: PayloadAction<{ latitude: number; longitude: number; addressLine?: string }>
    ) => {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.gpsLatitude = action.payload.latitude;
      state.gpsLongitude = action.payload.longitude;
      if (action.payload.addressLine) {
        state.activeDisplayLocation = action.payload.addressLine;
        state.currentGpsLocation = action.payload.addressLine;
      }
      state.selectedLocationType = "current_location";
      state.selectedAddressId = "current-location";
      state.selectedAddress = {
        id: "current-location",
        type: "Other",
        addressLine: action.payload.addressLine || state.activeDisplayLocation,
        phone: "",
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
      };
      saveCoordsToStorage(state.latitude, state.longitude);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
      storage.setItem(SELECTED_LOCATION_TYPE_KEY, "current_location").catch(() => {});
      socketService.emitCustomerLocation(action.payload.latitude, action.payload.longitude).catch(() => {});
    },
    setCurrentGpsLocation: (
      state,
      action: PayloadAction<
        string | { addressLine: string; latitude: number; longitude: number }
      >
    ) => {
      if (typeof action.payload === "string") {
        state.currentGpsLocation = action.payload;
        state.activeDisplayLocation = action.payload;
        state.selectedAddress = {
          id: "current-location",
          type: "Other",
          addressLine: action.payload,
          phone: "",
          latitude: state.latitude || 28.9845,
          longitude: state.longitude || 77.7064,
        };
      } else {
        state.currentGpsLocation = action.payload.addressLine;
        state.activeDisplayLocation = action.payload.addressLine;
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.gpsLatitude = action.payload.latitude;
        state.gpsLongitude = action.payload.longitude;
        state.selectedAddress = {
          id: "current-location",
          type: "Other",
          addressLine: action.payload.addressLine,
          phone: "",
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
        };
      }
      state.selectedLocationType = "current_location";
      state.selectedAddressId = "current-location";
      saveCoordsToStorage(state.latitude, state.longitude);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
      storage.setItem(SELECTED_LOCATION_TYPE_KEY, "current_location").catch(() => {});
      socketService.emitCustomerLocation(state.latitude || 28.9845, state.longitude || 77.7064).catch(() => {});
    },
    setActiveDisplayLocation: (state, action: PayloadAction<string>) => {
      state.activeDisplayLocation = action.payload;
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    },
    setPermissionStatus: (
      state,
      action: PayloadAction<"granted" | "denied" | "undetermined">
    ) => {
      state.permissionStatus = action.payload;
    },
    clearLocationError: (state) => {
      state.locationError = null;
    },
    setAddressesLocal: (state, action: PayloadAction<SavedAddress[]>) => {
      state.addresses = action.payload;
      saveAddressesToStorage(state.addresses);
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
    // Detect Current Location
    builder.addCase(detectCurrentLocation.pending, (state) => {
      state.isLocationLoading = true;
      state.locationError = null;
    });
    builder.addCase(detectCurrentLocation.fulfilled, (state, action) => {
      state.isLocationLoading = false;
      state.permissionStatus = action.payload.permissionStatus;
      state.gpsLatitude = action.payload.latitude;
      state.gpsLongitude = action.payload.longitude;
      state.currentGpsLocation = action.payload.readableAddress;
      state.lastLocationUpdate = Date.now();
      state.locationError = null;

      // Condition: User explicitly forced GPS active (e.g. tapped "Use Current Location"),
      // OR no saved address was manually selected:
      const shouldActivateGps =
        action.payload.forceGpsAsActive ||
        state.selectedLocationType === "current_location" ||
        !state.selectedAddress ||
        state.selectedAddress.id === "current-location";

      if (shouldActivateGps) {
        state.selectedLocationType = "current_location";
        state.selectedAddressId = "current-location";
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.activeDisplayLocation = action.payload.readableAddress;
        state.selectedAddress = {
          id: "current-location",
          type: "Other",
          addressLine: action.payload.readableAddress,
          phone: "",
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
        };
        saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
        storage.setItem(SELECTED_LOCATION_TYPE_KEY, "current_location").catch(() => {});
      }
    });
    builder.addCase(detectCurrentLocation.rejected, (state, action) => {
      state.isLocationLoading = false;
      const payload = action.payload as any;
      if (payload) {
        state.permissionStatus = payload.permissionStatus || "denied";
        state.locationError = payload.message || "Location detection failed";
      } else {
        state.locationError = "Location detection failed";
      }
    });

    // Load Address From Storage
    builder.addCase(loadAddressFromStorage.fulfilled, (state, action) => {
      if (action.payload) {
        state.addresses = action.payload.addresses;
        state.selectedAddress = action.payload.selectedAddress;
        state.activeDisplayLocation = action.payload.activeDisplayLocation;
        state.selectedLocationType = action.payload.selectedLocationType;
        state.latitude = action.payload.latitude;
        state.longitude = action.payload.longitude;
        state.selectedAddressId =
          action.payload.selectedAddress?.id || action.payload.selectedAddress?._id || null;
        if (action.payload.lastLocationUpdate) {
          state.lastLocationUpdate = action.payload.lastLocationUpdate;
        }
        state.initialized = true;
      }
    });

    // Fetch Addresses
    builder.addCase(fetchAddresses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAddresses.fulfilled, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.addresses = action.payload;

      // If user had manually selected a saved address, keep it synced with updated records
      if (state.selectedLocationType === "saved_address" && state.selectedAddress) {
        const matching = action.payload.find(
          (a) => a.id === state.selectedAddress?.id || a._id === state.selectedAddress?._id
        );
        if (matching) {
          state.selectedAddress = matching;
          state.activeDisplayLocation = matching.addressLine;
          if (matching.latitude != null && matching.longitude != null) {
            state.latitude = matching.latitude;
            state.longitude = matching.longitude;
          }
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
        state.selectedAddressId = newAddr.id || newAddr._id || null;
        state.selectedLocationType = "saved_address";
        state.activeDisplayLocation = newAddr.addressLine;
        if (newAddr.latitude != null && newAddr.longitude != null) {
          state.latitude = newAddr.latitude;
          state.longitude = newAddr.longitude;
        }
      }
      state.addresses.unshift(newAddr);
      if (!state.selectedAddress) {
        state.selectedAddress = newAddr;
        state.selectedAddressId = newAddr.id || newAddr._id || null;
        state.selectedLocationType = "saved_address";
        state.activeDisplayLocation = newAddr.addressLine;
        if (newAddr.latitude != null && newAddr.longitude != null) {
          state.latitude = newAddr.latitude;
          state.longitude = newAddr.longitude;
        }
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
        if (updated.latitude != null && updated.longitude != null) {
          state.latitude = updated.latitude;
          state.longitude = updated.longitude;
        }
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });

    // Remove Address
    builder.addCase(removeAddress.fulfilled, (state, action) => {
      const removedId = action.payload;
      state.addresses = state.addresses.filter(
        (a) => a.id !== action.payload && a._id !== action.payload
      );
      if (
        state.selectedAddress &&
        (state.selectedAddress.id === removedId ||
          state.selectedAddress._id === removedId)
      ) {
        // If the removed address was selected, fall back to current GPS location or first available address
        if (state.gpsLatitude != null && state.currentGpsLocation) {
          state.selectedLocationType = "current_location";
          state.selectedAddressId = "current-location";
          state.activeDisplayLocation = state.currentGpsLocation;
          state.latitude = state.gpsLatitude;
          state.longitude = state.gpsLongitude;
          state.selectedAddress = {
            id: "current-location",
            type: "Other",
            addressLine: state.currentGpsLocation,
            phone: "",
            latitude: state.latitude ?? undefined,
            longitude: state.longitude ?? undefined,
          };
        } else {
          const next = state.addresses[0] || null;
          state.selectedAddress = next;
          state.selectedAddressId = next ? next.id || next._id || null : null;
          state.selectedLocationType = next ? "saved_address" : "current_location";
          state.activeDisplayLocation = next?.addressLine || DEFAULT_FALLBACK_LOCATION;
          if (next?.latitude != null && next?.longitude != null) {
            state.latitude = next.latitude;
            state.longitude = next.longitude;
          }
        }
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });

    // Make Default Address
    builder.addCase(makeDefaultAddress.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        state.addresses = action.payload;
        const def = action.payload.find((a) => a.isDefault) || action.payload[0] || null;
        if (state.selectedLocationType === "saved_address") {
          state.selectedAddress = def;
          state.selectedAddressId = def ? def.id || def._id || null : null;
          if (def) {
            state.activeDisplayLocation = def.addressLine;
            if (def.latitude != null && def.longitude != null) {
              state.latitude = def.latitude;
              state.longitude = def.longitude;
            }
          }
        }
      } else {
        const targetId = action.payload;
        state.addresses = state.addresses.map((a) => ({
          ...a,
          isDefault: a.id === targetId || a._id === targetId,
        }));
        const matched = state.addresses.find(
          (a) => a.id === targetId || a._id === targetId
        );
        if (matched && state.selectedLocationType === "saved_address") {
          state.selectedAddress = matched;
          state.selectedAddressId = matched.id || matched._id || null;
          state.activeDisplayLocation = matched.addressLine;
          if (matched.latitude != null && matched.longitude != null) {
            state.latitude = matched.latitude;
            state.longitude = matched.longitude;
          }
        }
      }
      saveAddressesToStorage(state.addresses);
      saveSelectedAddressToStorage(state.selectedAddress, state.activeDisplayLocation);
    });
  },
});

export const {
  setSelectedAddress,
  useCurrentGpsLocation,
  setUserCoordinates,
  setCurrentGpsLocation,
  setActiveDisplayLocation,
  setPermissionStatus,
  clearLocationError,
  setAddressesLocal,
  removeAddressLocal,
} = addressSlice.actions;

export default addressSlice.reducer;
