// =============================================================================
// Redux Toolkit — Audit Log API Slice
// Uses RTK Query for caching, auto-fetching, and invalidation
// =============================================================================

import { APi } from "./CenteralAPI";

// ─── Helper: build query string ───────────────────────────────────────────────
const toParams = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  });
  return params.toString();
};

// =============================================================================
// API SLICE
// =============================================================================
export const auditLogApi = APi.injectEndpoints({

  endpoints: (builder) => ({
    // GET /audit-logs — paginated list (scoped by role server-side)
    getAuditLogs: builder.query({
      query: (filters = {}) => `/api/v1/logaudit?${toParams({ page: 1, limit: 20, ...filters })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'AuditLog', id })),
              { type: 'AuditLog', id: 'LIST' },
            ]
          : [{ type: 'AuditLog', id: 'LIST' }],
    }),

    // GET /audit-logs/:id — single entry
    getAuditLog: builder.query({
      query: (id) => `/api/v1/logaudit/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'AuditLog', id }],
    }),

    // GET /audit-logs/resources — distinct resource values
    getAuditResources: builder.query({
      query: () => '/api/v1/logaudit/resources',
    }),

    // GET /audit-logs/actions — distinct action values
    getAuditActions: builder.query({
      query: () => '/api/v1/logaudit/actions',
    }),

    // GET /audit-logs/users/:userId/activity
    getUserActivity: builder.query({
      query: ({ userId, days = 30 }) =>
        `/api/v1/logaudit/users/${userId}/activity?days=${days}`,
      providesTags: (_result, _err, { userId }) => [{ type: 'AuditLog', id: `activity-${userId}` }],
    }),
  }),
});

// ─── Auto-generated hooks ─────────────────────────────────────────────────────
export const {
  useGetAuditLogsQuery,
  useGetAuditLogQuery,
  useGetAuditResourcesQuery,
  useGetAuditActionsQuery,
  useGetUserActivityQuery,
} = auditLogApi;

// ─── Selector helpers ─────────────────────────────────────────────────────────
export const selectRecentLogs = (state, limit = 6) => {
  const cached = auditLogApi.endpoints.getAuditLogs.select({ page: 1, limit })(state);
  return cached?.data?.data ?? [];
};