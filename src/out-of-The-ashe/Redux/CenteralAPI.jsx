import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from './auth'; // Assuming your auth slice is named auth.js

const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

// 1. Unified base query instance using correct storage key "accessToken"
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken'); // ✅ Fixed key mismatch
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

// 2. Interceptor wrapper with Auto-Reauthentication Logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Catch 401 (Unauthorized) or 403 (Forbidden due to expired session token)
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        // Attempt to hit your token refresh endpoint cleanly
        const refreshResponse = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.data?.accessToken) {
          const newAccessToken = refreshData.data.accessToken;

          // Save the new token back to storage
          localStorage.setItem('accessToken', newAccessToken);

          // Retry the original request that failed with the new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh token expired or rejected by server -> clean exit
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          api.dispatch(logout());
        }
      } catch (error) {
        // Network error during refresh -> clean exit
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        api.dispatch(logout());
      }
    } else {
      // No refresh token available -> execute absolute logout
      localStorage.removeItem('accessToken');
      api.dispatch(logout());
    }
  }

  return result;
};

// 3. Definition of core API Slice
export const APi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth, 
tagTypes: ['Child', 'ChildSearch', 'ChildSearchById', 'ALLChild', 'HomeVisits', 'FinancialSupport'], // Added 'Children' tag for caching
  endpoints: () => ({})
});