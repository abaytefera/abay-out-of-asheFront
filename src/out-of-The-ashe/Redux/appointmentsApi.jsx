import { APi } from "./CenteralAPI";

export const appointmentsApi = APi.injectEndpoints({
  endpoints: (builder) => ({
 
    // POST /api/v1/appointments
    assignAppointment: builder.mutation({
      query: (body) => ({
        url:    "/api/v1/appointments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments", "Notifications"],
    }),
 
    // GET /api/v1/appointments/home-visit/:homeVisitId
    getAppointmentsByVisit: builder.query({
      query: (homeVisitId) => `/api/v1/appointments/child/${homeVisitId}`,
      providesTags: (result, error, homeVisitId) => [
        { type: "Appointments", id: homeVisitId },
      ],
    }),
 
    // GET /api/v1/appointments/my
    getMyAppointments: builder.query({
      query: () => "/api/v1/appointments/my",
      providesTags: ["Appointments"],
    }),
 
    // GET /api/v1/appointments/social-workers
    getActiveSocialWorkers: builder.query({
      query: () => "/api/v1/appointments/social-workers",
      providesTags: ["SocialWorkers"],
    }),
 
    // PATCH /api/v1/appointments/:id/status
    updateAppointmentStatus: builder.mutation({
      query: ({ id, status }) => ({
        url:    `/api/v1/appointments/${id}/status`,
        method: "PATCH",
        body:   { status },
      }),
      invalidatesTags: ["Appointments"],
    }),
 
    // DELETE /api/v1/appointments/:id
    deleteAppointment: builder.mutation({
      query: (id) => ({
        url:    `/api/v1/appointments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
  overrideExisting: true,
});
 
export const {
  useAssignAppointmentMutation,
  useGetAppointmentsByVisitQuery,
  useGetMyAppointmentsQuery,
  useGetActiveSocialWorkersQuery,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
} = appointmentsApi;
 