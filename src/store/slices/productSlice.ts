import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createProductApi,
  deleteProductApi,
  getAllProductsApi,
  getProductByIdApi,
  getVendorProductsApi,
  GetProductsParams,
  GetPublicProductsParams,
  toggleProductStockApi,
  updateProductApi,
} from "../services/productService";

export interface ProductImage {
  url: string;
  publicId?: string;
  altText?: string;
}

export interface ProductVariant {
  id?: string;
  type: string;
  weightUnit: string;
  weightValue: string;
  color: string;
  price?: number;
  sku?: string;
  stock?: number;
}

export interface ProductItem {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  category: string;
  subCategory?: string;
  supplierName?: string;
  brand?: string;
  expirationDate?: string;
  price: number;
  originalPrice?: number;
  discountCategory?: string;
  discountValue?: number;
  discount?: number;
  sku?: string;
  stock: number;
  reorderLevel?: number;
  unit: string;
  inStock: boolean;
  ratingsAverage?: number;
  ratingsCount?: number;
  views?: number;
  ordersCount?: number;
  refundsCount?: number;
  conversionRate?: number;
  returnRefundRate?: number;
  metrics?: {
    views?: number;
    orders?: number;
    refunds?: number;
    conversionRate?: number;
    returnRefundRate?: number;
  };
  returnPolicy?: string;
  warranty?: string;
  images: ProductImage[];
  variants?: ProductVariant[];
  tags?: string[];
  status: string;

  visibility?: {
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
  };
  vendor?: {
    _id?: string;
    businessDetails?: {
      businessName?: string;
      registeredAddress?: string;
      city?: string;
      country?: string;
    };
    sellerDetails?: {
      sellerName?: string;
      phone?: string;
      city?: string;
    };
    brandDetails?: {
      brandLogo?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ProductState {
  products: ProductItem[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  currentProduct: ProductItem | null;
  loading: boolean;
  createLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // Global Public Catalog State for Customer Home Screen
  publicProducts: ProductItem[];
  publicTotal: number;
  publicTotalPages: number;
  publicLoading: boolean;
  publicError: string | null;

  // Isolated Category Catalog State for Category Expand Screen
  categoryProducts: ProductItem[];
  categoryTotal: number;
  categoryTotalPages: number;
  categoryLoading: boolean;
  categoryError: string | null;

  // Related Products State for Product Detail Screen
  relatedProducts: ProductItem[];
  relatedLoading: boolean;
  relatedError: string | null;
}

const initialState: ProductState = {
  products: [],
  totalProducts: 0,
  totalPages: 1,
  currentPage: 1,
  currentProduct: null,
  loading: false,
  createLoading: false,
  error: null,
  successMessage: null,

  publicProducts: [],
  publicTotal: 0,
  publicTotalPages: 1,
  publicLoading: false,
  publicError: null,

  categoryProducts: [],
  categoryTotal: 0,
  categoryTotalPages: 1,
  categoryLoading: false,
  categoryError: null,

  relatedProducts: [],
  relatedLoading: false,
  relatedError: null,
};

// 1. Create Product Thunk
export const createProduct = createAsyncThunk(
  "product/createProduct",
  async (productData: any, { rejectWithValue }) => {
    try {
      const response = await createProductApi(productData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to create product. Please try again."
      );
    }
  }
);

// 2. Fetch Vendor Products Thunk
export const fetchVendorProducts = createAsyncThunk(
  "product/fetchVendorProducts",
  async (params: GetProductsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await getVendorProductsApi(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch products."
      );
    }
  }
);

// 3. Fetch Global Public Products Thunk (For Customer Home Screens)
export const fetchPublicProducts = createAsyncThunk(
  "product/fetchPublicProducts",
  async (params: GetPublicProductsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await getAllProductsApi(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch public products."
      );
    }
  }
);

// 4. Fetch Category Products Thunk (Isolated for Category Expand Screen)
export const fetchCategoryProducts = createAsyncThunk(
  "product/fetchCategoryProducts",
  async (params: GetPublicProductsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await getAllProductsApi(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch category products."
      );
    }
  }
);

// 5. Fetch Related Products Thunk (Isolated for Product Detail Screen)
export const fetchRelatedProducts = createAsyncThunk(
  "product/fetchRelatedProducts",
  async (params: GetPublicProductsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await getAllProductsApi(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch related products."
      );
    }
  }
);

// 6. Fetch Single Product
export const fetchProductById = createAsyncThunk(
  "product/fetchProductById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await getProductByIdApi(id);
      return response.product;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch product details."
      );
    }
  }
);

// 7. Toggle Product Stock Thunk
export const toggleProductStock = createAsyncThunk(
  "product/toggleProductStock",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await toggleProductStockApi(id);
      return { id, inStock: response.inStock, status: response.status };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to toggle stock status."
      );
    }
  }
);

// 8. Update Product Thunk
export const updateProduct = createAsyncThunk(
  "product/updateProduct",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await updateProductApi(id, data);
      return response.product;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to update product."
      );
    }
  }
);

// 9. Delete Product Thunk
export const deleteProduct = createAsyncThunk(
  "product/deleteProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteProductApi(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to delete product."
      );
    }
  }
);

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
      state.publicError = null;
      state.categoryError = null;
      state.relatedError = null;
    },
    clearProductSuccess: (state) => {
      state.successMessage = null;
    },
    setCurrentProduct: (state, action: PayloadAction<ProductItem | null>) => {
      state.currentProduct = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── CREATE PRODUCT ───────────────────────────────────────
    builder.addCase(createProduct.pending, (state) => {
      state.createLoading = true;
      state.error = null;
      state.successMessage = null;
    });
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.createLoading = false;
      state.successMessage = action.payload?.message || "Product created successfully!";
      if (action.payload?.product) {
        const prod = action.payload.product;
        state.products.unshift({
          ...prod,
          id: prod._id || prod.id,
        });
        state.totalProducts += 1;
      }
    });
    builder.addCase(createProduct.rejected, (state, action) => {
      state.createLoading = false;
      state.error = action.payload as string;
    });

    // ── FETCH VENDOR PRODUCTS ────────────────────────────────
    builder.addCase(fetchVendorProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchVendorProducts.fulfilled, (state, action) => {
      state.loading = false;
      const fetched = action.payload?.products || [];
      state.products = fetched.map((p: any) => ({
        ...p,
        id: p._id || p.id,
      }));
      state.totalProducts = action.payload?.total || fetched.length;
      state.totalPages = action.payload?.totalPages || 1;
      state.currentPage = action.payload?.currentPage || 1;
    });
    builder.addCase(fetchVendorProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ── FETCH PUBLIC PRODUCTS (GLOBAL CUSTOMER CATALOG) ──────
    builder.addCase(fetchPublicProducts.pending, (state) => {
      state.publicLoading = true;
      state.publicError = null;
    });
    builder.addCase(fetchPublicProducts.fulfilled, (state, action) => {
      state.publicLoading = false;
      const fetched = action.payload?.products || [];
      state.publicProducts = fetched.map((p: any) => ({
        ...p,
        id: p._id || p.id,
      }));
      state.publicTotal = action.payload?.total || fetched.length;
      state.publicTotalPages = action.payload?.totalPages || 1;
    });
    builder.addCase(fetchPublicProducts.rejected, (state, action) => {
      state.publicLoading = false;
      state.publicError = action.payload as string;
    });

    // ── FETCH CATEGORY PRODUCTS (ISOLATED) ───────────────────
    builder.addCase(fetchCategoryProducts.pending, (state) => {
      state.categoryLoading = true;
      state.categoryError = null;
    });
    builder.addCase(fetchCategoryProducts.fulfilled, (state, action) => {
      state.categoryLoading = false;
      const fetched = action.payload?.products || [];
      state.categoryProducts = fetched.map((p: any) => ({
        ...p,
        id: p._id || p.id,
      }));
      state.categoryTotal = action.payload?.total || fetched.length;
      state.categoryTotalPages = action.payload?.totalPages || 1;
    });
    builder.addCase(fetchCategoryProducts.rejected, (state, action) => {
      state.categoryLoading = false;
      state.categoryError = action.payload as string;
    });

    // ── FETCH RELATED PRODUCTS (ISOLATED) ────────────────────
    builder.addCase(fetchRelatedProducts.pending, (state) => {
      state.relatedLoading = true;
      state.relatedError = null;
    });
    builder.addCase(fetchRelatedProducts.fulfilled, (state, action) => {
      state.relatedLoading = false;
      const fetched = action.payload?.products || [];
      state.relatedProducts = fetched.map((p: any) => ({
        ...p,
        id: p._id || p.id,
      }));
    });
    builder.addCase(fetchRelatedProducts.rejected, (state, action) => {
      state.relatedLoading = false;
      state.relatedError = action.payload as string;
    });

    // ── FETCH SINGLE PRODUCT ─────────────────────────────────
    builder.addCase(fetchProductById.fulfilled, (state, action) => {
      state.currentProduct = action.payload;
    });

    // ── TOGGLE STOCK ─────────────────────────────────────────
    builder.addCase(toggleProductStock.fulfilled, (state, action) => {
      const { id, inStock, status } = action.payload;
      state.products = state.products.map((p) =>
        (p._id === id || p.id === id) ? { ...p, inStock, status: status || p.status } : p
      );
      if (state.currentProduct && (state.currentProduct._id === id || state.currentProduct.id === id)) {
        state.currentProduct.inStock = inStock;
      }
    });

    // ── UPDATE PRODUCT ───────────────────────────────────────
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const updated = action.payload;
      if (updated) {
        state.products = state.products.map((p) =>
          (p._id === updated._id || p.id === updated._id) ? { ...updated, id: updated._id } : p
        );
      }
    });

    // ── DELETE PRODUCT ───────────────────────────────────────
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      const id = action.payload;
      state.products = state.products.filter(
        (p) => p._id !== id && p.id !== id
      );
      state.totalProducts = Math.max(0, state.totalProducts - 1);
    });
  },
});

export const { clearProductError, clearProductSuccess, setCurrentProduct } =
  productSlice.actions;

export default productSlice.reducer;
