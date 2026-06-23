import { APi } from "./CenteralAPI";

// ── Notifications API (/api/v1/notifications) ─────────────────────────────────
// NOTE: no changes needed here. `getMyNotifications` already forwards
// whatever params it's given (page, isRead, type, ...) straight onto the
// querystring — it was the controller on the backend that wasn't reading
// `type` back out. Now that NotificationsPage.tsx passes `type` in its
// params object and the controller forwards it to the service/repo, the
// whole chain is connected end to end.
export const notificationsApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/notifications?page=1&limit=20&isRead=false&type=...
    getMyNotifications: builder.query({
      query: (params = {}) => ({
        url: "/api/v1/notifications",
        params,
      }),
      providesTags: ["Notifications"],
    }),

    // GET /api/v1/notifications/unread-count
    getUnreadCount: builder.query({
      query: () => "/api/v1/notifications/unread-count",
      providesTags: ["NotificationCount"],
    }),

    // PATCH /api/v1/notifications/:id/read
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/api/v1/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications", "NotificationCount"],
    }),

    // PATCH /api/v1/notifications/read-all
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/api/v1/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications", "NotificationCount"],
    }),

    // DELETE /api/v1/notifications/:id
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/api/v1/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications", "NotificationCount"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;