import { APi } from "./CenteralAPI";
// ── helper ───────────────────────────────────────────────────────────────
function toQueryString(params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

// ── inside injectEndpoints ────────────────────────────────────────────────

// List (with query params) — replaces the old getAllChild

export const childrenApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Dashboard Stats ──────────────────────────────────────────────────────
    getChildDashboard: builder.query({
      query: () => "/api/v1/children/dashboard",
      providesTags: ["ChildDashboard"],
    }),
    getTrendStats: builder.query({
  query: () => "/api/v1/children/trend",
  providesTags: ["ChildTrend"],
}),

// add to exports:


    // ── List (simple, no filters) ────────────────────────────────────────────
    getChilds: builder.query({
      query: () => "/api/v1/children/",
      providesTags: [{ type: "Child", id: "List" }],
    }),

    // ── List (with query params) ─────────
  getAllChild: builder.query({
      query: (params = {}) => `/api/v1/children${toQueryString(params)}`,
      providesTags: [{ type: "ALLChild", id: "List" }],
    }),

    // ── Search by name / code ────────────────────────────────────────────────
    getChildbyName: builder.query({
      query: (searchValue) =>
        `/api/v1/children?search=${encodeURIComponent(searchValue.trim())}`,
      providesTags: [{ type: "ChildSearch", id: "searchresult" }],
    }),

    // ── Single child by ID ───────────────────────────────────────────────────
    getChildByID: builder.query({
      query: (id) => `/api/v1/children/${id}`,
      providesTags: (result, error, id) => [{ type: "ChildSearchById", id }],
    }),

    // ── Create child (multipart/form-data) ───────────────────────────────────
    createChild: builder.mutation({
      query: (childData) => ({
        url: "/api/v1/children",
        method: "POST",
        body: childData,
      }),
      invalidatesTags: [
        { type: "Child",    id: "List" },
        { type: "ALLChild", id: "List" },
        "ChildDashboard",
      ],
    }),

    // ── Update child scalar fields ───────────────────────────────────────────
    updateChild: builder.mutation({
      query: ({ data, id }) => ({
        url: `/api/v1/children/${id}`,
        method: "PATCH",
        body: { child: data },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ChildSearchById", id },
        { type: "Child",    id: "List" },
        { type: "ALLChild", id: "List" },
      ],
    }),

    // ── Update household ─────────────────────────────────────────────────────
    updateHousehold: builder.mutation({
      query: ({ childId, data }) => ({
        url: `/api/v1/children/${childId}`,
        method: "PATCH",
        body: { household: data },
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "ChildSearchById", id: childId },
      ],
    }),

    // ── Update guardian ──────────────────────────────────────────────────────
    updateGuardian: builder.mutation({
      query: ({ childId, data }) => ({
        url: `/api/v1/children/${childId}`,
        method: "PATCH",
        body: { guardian: data },
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "ChildSearchById", id: childId },
      ],
    }),

    // ── Delete child ─────────────────────────────────────────────────────────
    deleteChild: builder.mutation({
      query: ({ id }) => ({
        url: `/api/v1/children/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Child",    id: "List" },
        { type: "ALLChild", id: "List" },
        "ChildDashboard",
      ],
    }),

    // ── Upload profile photo ─────────────────────────────────────────────────
    uploadProfile: builder.mutation({
      query: ({ id, formData, isPrimary = false }) => ({
        url: `/api/v1/children/${id}/profile-photo${isPrimary ? "?primary=true" : ""}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ChildSearchById", id }],
    }),

    // ── Delete profile photo ─────────────────────────────────────────────────
    deleteFile: builder.mutation({
      query: ({ id, public_id, selectionType }) => ({
        url: `/api/v1/children/${id}/profile-photo`,
        method: "DELETE",
        body: { publicId: public_id, type: selectionType },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ChildSearchById", id }],
    }),

    // ── Create other record ──────────────────────────────────────────────────
    createOtherRecord: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/children/${id}/other-records`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ChildSearchById", id }],
    }),

    // ── Update other record ──────────────────────────────────────────────────
    updateOtherRecord: builder.mutation({
      query: ({ recordId, title, description }) => ({
        url: `/api/v1/children/other-records/${recordId}`,
        method: "PATCH",
        body: { title, description },
      }),
      invalidatesTags: (result, error, { recordId }) => [
        { type: "ChildSearch", id: "searchresult" },
      ],
    }),

    // ── Delete entire other record ───────────────────────────────────────────
    deleteOtherRecord: builder.mutation({
      query: ({ recordId }) => ({
        url: `/api/v1/children/other-records/${recordId}`,
        method: "DELETE",
      }),
    }),

    // ── Delete a single file ─────────────────────────────────────────────────
    deleteOtherRecordFile: builder.mutation({
      query: ({ recordId, publicId }) => ({
        url: `/api/v1/children/other-records/${recordId}/files`,
        method: "DELETE",
        body: { publicId },
      }),
    }),

    // ── Append files ─────────────────────────────────────────────────────────
    uploadOtherRecordFiles: builder.mutation({
      query: ({ id, recordId, formData }) => ({
        url: `/api/v1/children/${id}/other-records/${recordId}/files`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ChildSearchById", id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetChildDashboardQuery,
  useGetChildsQuery,
  useGetAllChildQuery,
  useGetChildbyNameQuery,
  useGetChildByIDQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useUpdateHouseholdMutation,
  useUpdateGuardianMutation,
  useDeleteChildMutation,
  useUploadProfileMutation,
  useDeleteFileMutation,
  useCreateOtherRecordMutation,
  useUpdateOtherRecordMutation,
  useDeleteOtherRecordMutation,
  useDeleteOtherRecordFileMutation,
  useUploadOtherRecordFilesMutation,
  useGetTrendStatsQuery
} = childrenApi;