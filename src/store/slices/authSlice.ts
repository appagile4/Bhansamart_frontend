import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  authService,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  VerifyEmailPayload,
  VerifyResetOTPPayload,
} from "../services/authService";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  address?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: string;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  successMessage: string | null;
  unverifiedEmail: string | null;
  resetEmail: string | null;
  resetToken: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  successMessage: null,
  unverifiedEmail: null,
  resetEmail: null,
  resetToken: null,
};

// Initialize authentication from storage on app startup
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = await storage.getItem("bhansa_token");
      if (!storedToken) {
        return rejectWithValue("No stored session");
      }

      let storedUser: UserProfile | null = null;
      try {
        const rawUser = await storage.getItem("bhansa_user");
        if (rawUser) {
          storedUser = JSON.parse(rawUser);
        }
      } catch (err) {
        console.warn("[Auth] Failed to parse stored user", err);
      }

      // Validate with backend in background, but preserve session if offline or connecting
      try {
        const profileRes = await authService.getMe();
        const liveUser = profileRes.data.user;
        await storage.setItem("bhansa_user", JSON.stringify(liveUser));
        return { token: storedToken, user: liveUser };
      } catch (apiErr: any) {
        // Only clear storage if explicitly 401/403 (invalid or expired token)
        if (apiErr?.statusCode === 401 || apiErr?.statusCode === 403) {
          await storage.removeItem("bhansa_token");
          await storage.removeItem("bhansa_user");
          return rejectWithValue("Session expired");
        }
        // If server is unreachable or timeout, keep existing logged-in session!
        if (storedUser) {
          return { token: storedToken, user: storedUser };
        }
        return { token: storedToken, user: { _id: "", name: "Customer", email: "", isEmailVerified: true } };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to initialize auth");
    }
  }
);

// Register user with instant auto-login
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      const { user, token } = response.data;

      // Save token and user in universal storage for auto-login
      if (token && user) {
        await storage.setItem("bhansa_token", token);
        await storage.setItem("bhansa_user", JSON.stringify(user));
      }

      return { user, token, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

// Verify email OTP
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (data: VerifyEmailPayload, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Email verification failed");
    }
  }
);

// Resend verification OTP
export const resendVerificationOTP = createAsyncThunk(
  "auth/resendOTP",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerificationOTP(email);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to resend OTP");
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);
      const { user, token } = response.data;

      // Save token and user info in universal storage
      await storage.setItem("bhansa_token", token);
      await storage.setItem("bhansa_user", JSON.stringify(user));

      return { user, token, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

// Forgot password request
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return { response, email };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to send reset code");
    }
  }
);

// Verify reset password OTP
export const verifyResetOTP = createAsyncThunk(
  "auth/verifyResetOTP",
  async (data: VerifyResetOTPPayload, { rejectWithValue }) => {
    try {
      const response = await authService.verifyResetOTP(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Invalid or expired reset OTP");
    }
  }
);

// Reset password with token
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data: ResetPasswordPayload, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to reset password");
    }
  }
);

// Change password (logged-in user)
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (data: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to change password");
    }
  }
);

// Update user profile (Name, Gender, Date of Birth, Address)
export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      const updatedUser = response.data.user;
      await storage.setItem("bhansa_user", JSON.stringify(updatedUser));
      return { user: updatedUser, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update profile");
    }
  }
);

// Upload profile avatar to Cloudinary
export const uploadAvatarImage = createAsyncThunk(
  "auth/uploadAvatar",
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const response = await authService.uploadAvatar(imageUri);
      const updatedUser = response.data.user;
      await storage.setItem("bhansa_user", JSON.stringify(updatedUser));
      return { user: updatedUser, avatar: response.data.avatar, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload avatar");
    }
  }
);

// Remove profile avatar
export const removeAvatarImage = createAsyncThunk(
  "auth/removeAvatar",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.removeAvatar();
      const updatedUser = response.data.user;
      await storage.setItem("bhansa_user", JSON.stringify(updatedUser));
      return { user: updatedUser, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove avatar");
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout();
  } catch (error) {
    console.warn("[Auth] Logout request warning:", error);
  } finally {
    await storage.removeItem("bhansa_token");
    await storage.removeItem("bhansa_user");
  }
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setUnverifiedEmail: (state, action: PayloadAction<string>) => {
      state.unverifiedEmail = action.payload;
    },
    setResetEmail: (state, action: PayloadAction<string>) => {
      state.resetEmail = action.payload;
    },
    setResetToken: (state, action: PayloadAction<string>) => {
      state.resetToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 1. Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });

    // 2. Register User
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.successMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Registration failed";
      });

    // 3. Verify Email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.unverifiedEmail = null;
        state.successMessage = action.payload.message;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Verification failed";
      });

    // 4. Resend OTP
    builder
      .addCase(resendVerificationOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerificationOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(resendVerificationOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to resend OTP";
      });

    // 5. Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.successMessage = action.payload.message;
      })
      .addCase(loginUser.rejected, (state, action: any) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Login failed";
        if (action.payload?.raw?.data?.isEmailVerified === false) {
          state.unverifiedEmail = action.payload.raw.data.email;
        }
      });

    // 6. Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetEmail = action.payload.email;
        state.successMessage = action.payload.response.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to request password reset";
      });

    // 7. Verify Reset OTP
    builder
      .addCase(verifyResetOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyResetOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetToken = action.payload.resetToken;
        state.successMessage = action.payload.message;
      })
      .addCase(verifyResetOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Invalid OTP";
      });

    // 8. Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetToken = null;
        state.resetEmail = null;
        state.successMessage = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to reset password";
      });

    // 9. Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to change password";
      });

    // 10. Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.successMessage = action.payload.message;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to update profile";
      });

    // 11. Upload Avatar
    builder
      .addCase(uploadAvatarImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatarImage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.successMessage = action.payload.message;
      })
      .addCase(uploadAvatarImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to upload avatar";
      });

    // 12. Remove Avatar
    builder
      .addCase(removeAvatarImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeAvatarImage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.successMessage = action.payload.message;
      })
      .addCase(removeAvatarImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to remove avatar";
      });

    // 13. Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.successMessage = null;
      state.unverifiedEmail = null;
      state.resetEmail = null;
      state.resetToken = null;
    });
  },
});

export const {
  clearAuthError,
  clearSuccessMessage,
  setUnverifiedEmail,
  setResetEmail,
  setResetToken,
} = authSlice.actions;

export default authSlice.reducer;
