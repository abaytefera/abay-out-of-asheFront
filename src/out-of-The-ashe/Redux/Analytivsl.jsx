import { APi } from "./CenteralAPI";

export const analyticsApi = APi.injectEndpoints({

  endpoints: (builder) => ({
    // useGetDashboardAnalyticsQuery({ year, month })
    // - omit both for all-time totals
    // - year only for a full-year breakdown
    // - year + month for a single month
    getDashboardAnalytics: builder.query({
      query: ({ year, month } = {}) => ({
        url: "/api/v1/analytics/dashboard",
        params: {
          ...(year ? { year } : {}),
          ...(year && month ? { month } : {}),
        },
      }),
      providesTags: ["DashboardAnalytics"],
    }),
  }),
});

export const { useGetDashboardAnalyticsQuery } = analyticsApi;