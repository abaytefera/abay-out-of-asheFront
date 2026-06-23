// Redux/Sponsors.js
import { APi } from "./CenteralAPI";

const SponsorsConfig = APi.injectEndpoints({
  endpoints: (builder) => ({

    // ── GET /api/v1/sponsors ──────────────────────────────────────────────
    getSponsors: builder.query({
      query: (params = {}) => ({
        url:    "/api/v1/sponsorship/sponsors",
        params,
      }),
      transformResponse: (res) => res?.data?.data ?? res?.data ?? res,
      providesTags: ["Sponsors"],
    }),

    // ── GET /api/v1/sponsors/:id ──────────────────────────────────────────
    getSponsorById: builder.query({
      query: (id) => `/api/v1/sponsorship/sponsors/${id}`,
      transformResponse: (res) => res?.data ?? res,
      providesTags: (result, error, id) => [{ type: "Sponsors", id }],
    }),

    // ── POST /api/v1/sponsors ─────────────────────────────────────────────
    createSponsor: builder.mutation({
      query: (body) => ({
        url:    "/api/v1/sponsorship/sponsors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sponsors"],
    }),

    // ── PATCH /api/v1/sponsors/:id ────────────────────────────────────────
    updateSponsor: builder.mutation({
      query: ({ id, ...body }) => ({
        url:    `/api/v1/sponsorship/sponsors/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sponsors", id },
        "Sponsors",
      ],
    }),

    // ── DELETE /api/v1/sponsors/:id ───────────────────────────────────────
    deleteSponsor: builder.mutation({
      query: (id) => ({
        url:    `/api/v1/sponsorship/sponsors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sponsors"],
    }),

    // ── POST /api/v1/sponsorships ─────────────────────────────────────────
    createSponsorship: builder.mutation({
      query: (body) => ({
        url:    "/api/v1/sponsorship/sponsorships",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { sponsorId }) => [
        { type: "Sponsors", id: sponsorId },
        "Sponsors",
        "Sponsorships",
      ],
    }),

    // ── PATCH /api/v1/sponsorships/:sponsorshipId/end ─────────────────────
    endSponsorship: builder.mutation({
      query: ({ sponsorshipId, endDate }) => ({
        url:    `/api/v1/sponsorship/sponsorships/${sponsorshipId}/end`,
        method: "PATCH",
        body:   { endDate },
      }),
      invalidatesTags: ["Sponsors", "Sponsorships"],
    }),

    // ── POST /api/v1/sponsorships/:sponsorshipId/reports ─────────────────
    addDonorReport: builder.mutation({
      query: ({ sponsorshipId, formData }) => ({
        url:    `/api/v1/sponsorship/sponsorships/${sponsorshipId}/reports`,
        method: "POST",
        body:   formData,
      }),
      invalidatesTags: ["Sponsors"],
    }),

    // ── DELETE /api/v1/reports/files/:fileId ──────────────────────────────
    deleteDonorReportFile: builder.mutation({
      query: (fileId) => ({
        url:    `/api/v1/sponsorship/reports/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sponsors"],
    }),

    // ── DELETE /api/v1/sponsors/:id/photos/:photoId ───────────────────────
    deleteSponsorPhoto: builder.mutation({
      query: ({ sponsorId, photoId }) => ({
        url:    `/api/v1/sponsorship/sponsors/${sponsorId}/photos/${photoId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { sponsorId }) => [
        { type: "Sponsors", id: sponsorId },
        "Sponsors",
      ],
    }),

    // ── POST /api/v1/sponsors/:id/photos ─────────────────────────────────
    uploadSponsorPhotos: builder.mutation({
      query: ({ sponsorId, formData }) => ({
        url:    `/api/v1/sponsorship/sponsors/${sponsorId}/photos`,
        method: "POST",
        body:   formData,
      }),
      invalidatesTags: (result, error, { sponsorId }) => [
        { type: "Sponsors", id: sponsorId },
        "Sponsors",
      ],
    }),

    // ── GET /api/v1/children/:childId/sponsorships ────────────────────────
    getSponsorshipsByChild: builder.query({
      query: (childId) => `/api/v1/sponsorship/children/${childId}/sponsorships`,
      transformResponse: (res) => res?.data ?? res,
      providesTags: (result, error, childId) => [
        { type: "Sponsorships", id: childId },
      ],
    }),

    // ── GET /api/v1/children ──────────────────────────────────────────────
    getChilds: builder.query({
      query: (params = {}) => ({
        url:    "/api/v1/sponsorship/children",
        params,
      }),
      transformResponse: (res) => res?.data?.data ?? res?.data ?? res,
      providesTags: ["Children"],
    }),

    // ── POST /api/v1/sponsorships (Link Alias) ────────────────────────────
    linkSponsorToChild: builder.mutation({
      query: (body) => ({
        url:    "/api/v1/sponsorship/sponsorships",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { sponsorId }) => [
        { type: "Sponsors", id: sponsorId },
        "Sponsors",
        "Children",
        "Sponsorships",
      ],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetSponsorsQuery,
  useGetSponsorByIdQuery,
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useDeleteSponsorMutation,
  useCreateSponsorshipMutation,
  useEndSponsorshipMutation,
  useAddDonorReportMutation,
  useDeleteDonorReportFileMutation,
  useDeleteSponsorPhotoMutation,
  useUploadSponsorPhotosMutation,
  useGetSponsorshipsByChildQuery,
  useGetChildsQuery,
  useLinkSponsorToChildMutation,
} = SponsorsConfig;