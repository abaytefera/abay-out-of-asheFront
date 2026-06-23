import { APi } from "./CenteralAPI";

const User = APi.injectEndpoints({
  // 💡 Declaring tags allows automatic UI re-fetching across profile changes and 2FA flags
  tagTypes: ["CurrentUser", "UserList"],

  endpoints: (builder) => ({
    // ════════════════════════════════════════════════════════════
    // 🔑 AUTHENTICATION & SECURITY ENDPOINTS (Merged)
    // ════════════════════════════════════════════════════════════
    
    getMe: builder.query({
      query: () => "/api/v1/auth/me",
      providesTags: ["CurrentUser"],
    }),

    setup2FA: builder.mutation({
      query: () => ({
        url: "/api/v1/auth/2fa/setup",
        method: "POST",
      }),
    }),

    verify2FA: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/2fa/verify",
        method: "POST",
        body: payload, // Receives: { userId, token } or { token }
      }),
      invalidatesTags: ["CurrentUser"],
    }),

    disable2FA: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/2fa/disable",
        method: "POST",
        body: payload, // Verification token confirmation payload
      }),
      invalidatesTags: ["CurrentUser"],
    }),

    changePassword: builder.mutation({
      query: (passwordCredentials) => ({
        url: "/api/v1/staff/me/change-password",
        method: "POST",
        body: passwordCredentials, // Receives: { currentPassword, newPassword }
      }),
    }),

    // ════════════════════════════════════════════════════════════
    // 📋 STAFF MANAGEMENT & PROFILE ENDPOINTS
    // ════════════════════════════════════════════════════════════

    getUser: builder.query({
      query: (id) => `/api/v1/staff/getById?id=${id}`,
      providesTags: (result, error, id) => [{ type: "UserList", id }],
    }),

   updateUser: builder.mutation({
  query: (userData) => ({
    url: `/api/v1/staff/profiles/${userData.id}`,
    method: "PUT",
    body: userData,
  }),
  // Use a function here to access the 'arg'
  invalidatesTags: (result, error, arg) => [
    { type: "UserList", id: arg.id },
    { type: "UserList", id: "LIST" } // Good practice: also invalidate the main list
  ],
}),

    UpdateProfile: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/staff/User/updateUserProfile",
        method: "PATCH",
        body: payload,
      }),
      // Invalidates both list cache arrays and active profile card indicators simultaneously
      invalidatesTags: ["CurrentUser", "UserList"],
    }),
  }),
});

// 💡 Exporting automated hooks aligned directly with your system's components
export const {
  // Authentication Custom Hooks
  useGetMeQuery,
  useSetup2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useChangePasswordMutation,
  
  // Profile Management Custom Hooks
  useGetUserQuery,
  useUpdateUserMutation,
  useUpdateProfileMutation,
} = User;