/**
 * Redux/DashboardConfig.js
 * Injected RTK Query endpoints for dashboard modules.
 */

import { APi } from "./CenteralAPI"; 

const DashboardConfig = APi.injectEndpoints({
  endpoints: (build) => ({
    // ── Safeguarding cases ──────────────────────────────────────────
    getSafeguardingCases: build.query({
      query: (params = {}) => ({ url: '/api/v1/safeguarding', params }),
      providesTags: ['Safeguarding'],
    }),

    // ── Education alerts ────────────────────────────────────────────
    getEducationAlerts: build.query({
      query: (params = {}) => ({ url: '/api/v1/education/alerts', params }),
      providesTags: ['EduAlert'],
    }),

    // ── Audit logs ──────────────────────────────────────────────────
    

    // ── Workflow items ──────────────────────────────────────────────
    getWorkflowItems: build.query({
      query: (params = {}) => ({ url: '/workflow', params }),
      providesTags: ['Workflow'],
    }),

    // ── Financial report ────────────────────────────────────────────
    getFinancialReport: build.query({
      query: (params = {}) => ({ url: '/api/v1/financial/report', params }),
      providesTags: ['Financial'],
    }),

    // ── Nutrition alerts ────────────────────────────────────────────
    getNutritionAlerts: build.query({
      query: () => '/api/v1/health',
      providesTags: ['Nutrition'],
    }),

    // ── Child Dashboard Stats ───────────────────────────────────────
    getChildDashboard: build.query({
      query: () => '/api/v1/children/dashboard',
      providesTags: ['ChildStats'],
    }),
  }),
  // CRITICAL: Must be true for injectEndpoints to work in development
  overrideExisting: true, 
});

// Destructure the generated hooks from the injected endpoints
export const {
  useGetSafeguardingCasesQuery,
  useGetEducationAlertsQuery,
  useGetAuditLogsQuery,
  useGetWorkflowItemsQuery,
  useGetFinancialReportQuery,
  useGetNutritionAlertsQuery,
  useGetChildDashboardQuery,
} = DashboardConfig;