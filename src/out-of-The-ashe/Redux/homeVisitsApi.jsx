import { APi } from "./CenteralAPI";

export const homeVisitsApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    getHomeVisitsByChild: builder.query({
      query: (childId) => `/api/v1/home-visits/child/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "HomeVisits", id: childId },
        { type: "HomeVisits", id: "List" },
      ],
    }),
    getAllHomeVisits: builder.query({
      query: (params) => ({ url: "/home-visits", params }),
      providesTags: ["HomeVisit"],
    }),

    createHomeVisit: builder.mutation({
      query: (visitFormData) => ({
        url: "/api/v1/home-visits",
        method: "POST",
        body: visitFormData,
      }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [
          { type: "HomeVisits", id: childId },
          { type: "HomeVisits", id: "List" },
        ];
      },
    }),

    // ── NEW: Edit/update an existing visit (also accepts new photo files) ──
    updateHomeVisit: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/home-visits/${id}`,
        method: "PATCH",
        body: formData,          // FormData — multer picks up any new photos
      }),
      invalidatesTags: [{ type: "HomeVisits" }],
    }),

    deleteHomeVisit: builder.mutation({
      query: (id) => ({
        url: `/api/v1/home-visits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "HomeVisits" }],
    }),

    // ── NEW: Delete a single photo without touching the rest of the visit ──
    deleteHomeVisitPhoto: builder.mutation({
      query: ({ visitId, photoId }) => ({
        url: `/api/v1/home-visits/${visitId}/photos/${photoId}`,
        method: "DELETE",
      }),
      invalidatesTags: [ { type: "HomeVisits", id: "List" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllHomeVisitsQuery,
  useGetHomeVisitsByChildQuery,
  useCreateHomeVisitMutation,
  useUpdateHomeVisitMutation,        // ← NEW
  useDeleteHomeVisitMutation,
  useDeleteHomeVisitPhotoMutation,   // ← NEW
} = homeVisitsApi;