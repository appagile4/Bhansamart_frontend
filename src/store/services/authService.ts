import api from "./api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  address?: string;
  dateOfBirth: string;
  gender: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface VerifyResetOTPPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfilePayload {
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

export const authService = {
  // Screen 2: Sign Up / Register
  register: async (data: RegisterPayload) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  // Screen 4: Email Verification
  verifyEmail: async (data: VerifyEmailPayload) => {
    const response = await api.post("/auth/verify-email", data);
    return response.data;
  },

  resendVerificationOTP: async (email: string) => {
    const response = await api.post("/auth/resend-verification-otp", { email });
    return response.data;
  },

  // Screen 1: Login
  login: async (data: LoginPayload) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  // Screen 3: Forgot Password Flow
  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  verifyResetOTP: async (data: VerifyResetOTPPayload) => {
    const response = await api.post("/auth/verify-reset-otp", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordPayload) => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },

  // Screen 5: Change Password (Logged-in User)
  changePassword: async (data: ChangePasswordPayload) => {
    const response = await api.post("/auth/change-password", data);
    return response.data;
  },

  // Profile Management
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfilePayload) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },

  uploadAvatar: async (imageUri: string) => {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("avatar", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await api.post("/auth/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete("/auth/profile/avatar");
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};
