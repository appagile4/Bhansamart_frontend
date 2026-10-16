import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  BrandItem,
  AttributeItem,
  BrandLogoResult,
  fetchBrandsApi,
  fetchMyBrandRequestsApi,
  fetchAttributesApi,
  searchBrandLogosApi,
  createBrandRequestApi,
  createAttributeApi,
} from "../services/brandService";

interface BrandState {
  brands: BrandItem[];
  brandRequests: BrandItem[];
  attributes: AttributeItem[];
  logoSearchResults: BrandLogoResult[];
  totalBrands: number;
  totalPages: number;
  currentPage: number;
  totalRequests: number;
  requestsTotalPages: number;
  requestsCurrentPage: number;
  loading: boolean;
  submitting: boolean;
  searchingLogos: boolean;
  error: string | null;
  submitSuccessMessage: string | null;
}

const initialState: BrandState = {
  brands: [],
  brandRequests: [],
  attributes: [],
  logoSearchResults: [],
  totalBrands: 0,
  totalPages: 1,
  currentPage: 1,
  totalRequests: 0,
  requestsTotalPages: 1,
  requestsCurrentPage: 1,
  loading: false,
  submitting: false,
  searchingLogos: false,
  error: null,
  submitSuccessMessage: null,
};

export const fetchBrands = createAsyncThunk(
  "brand/fetchBrands",
  async (
    params: { category?: string; search?: string; page?: number; limit?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchBrandsApi(params);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch brands"
      );
    }
  }
);

export const fetchMyBrandRequests = createAsyncThunk(
  "brand/fetchMyBrandRequests",
  async (
    params: { status?: string; page?: number; limit?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchMyBrandRequestsApi(params);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch brand requests"
      );
    }
  }
);

export const fetchAttributes = createAsyncThunk(
  "brand/fetchAttributes",
  async (
    params: { category?: string; search?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchAttributesApi(params);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch attributes"
      );
    }
  }
);

export const searchBrandLogos = createAsyncThunk(
  "brand/searchBrandLogos",
  async (query: string, { rejectWithValue }) => {
    try {
      if (!query || query.trim().length < 2) return { results: [] };
      const data = await searchBrandLogosApi(query);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to search logos"
      );
    }
  }
);

export const submitBrandRequest = createAsyncThunk(
  "brand/submitBrandRequest",
  async (
    payload: FormData | { name: string; categories: string[]; description?: string; logoUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await createBrandRequestApi(payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to submit brand request"
      );
    }
  }
);

export const submitAttribute = createAsyncThunk(
  "brand/submitAttribute",
  async (
    payload: { name: string; categories?: string[]; values: string[]; type?: "single" | "multiple" | "text" },
    { rejectWithValue }
  ) => {
    try {
      const data = await createAttributeApi(payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to create attribute"
      );
    }
  }
);

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    clearBrandErrors: (state) => {
      state.error = null;
      state.submitSuccessMessage = null;
    },
    clearLogoSearchResults: (state) => {
      state.logoSearchResults = [];
    },
  },
  extraReducers: (builder) => {
    // fetchBrands
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload.brands || action.payload.data || [];
        state.totalBrands = action.payload.total || (action.payload.data ? action.payload.data.length : 0);
        state.totalPages = action.payload.totalPages || action.payload.pages || 1;
        state.currentPage = action.payload.currentPage || action.payload.page || 1;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchMyBrandRequests
    builder
      .addCase(fetchMyBrandRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBrandRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.brandRequests = action.payload.brandRequests || action.payload.data || [];
        state.totalRequests = action.payload.total || (action.payload.data ? action.payload.data.length : 0);
        state.requestsTotalPages = action.payload.totalPages || 1;
        state.requestsCurrentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchMyBrandRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchAttributes
    builder
      .addCase(fetchAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.attributes = action.payload.attributes || action.payload.data || [];
      })
      .addCase(fetchAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // searchBrandLogos
    builder
      .addCase(searchBrandLogos.pending, (state) => {
        state.searchingLogos = true;
      })
      .addCase(searchBrandLogos.fulfilled, (state, action) => {
        state.searchingLogos = false;
        state.logoSearchResults = action.payload.results || [];
      })
      .addCase(searchBrandLogos.rejected, (state) => {
        state.searchingLogos = false;
        state.logoSearchResults = [];
      });

    // submitBrandRequest
    builder
      .addCase(submitBrandRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.submitSuccessMessage = null;
      })
      .addCase(submitBrandRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccessMessage = action.payload.message || "Brand request submitted successfully!";
        if (action.payload.brand) {
          state.brandRequests.unshift(action.payload.brand);
        }
      })
      .addCase(submitBrandRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // submitAttribute
    builder
      .addCase(submitAttribute.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitAttribute.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload.attribute) {
          state.attributes.unshift(action.payload.attribute);
        }
      })
      .addCase(submitAttribute.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBrandErrors, clearLogoSearchResults } = brandSlice.actions;
export default brandSlice.reducer;
