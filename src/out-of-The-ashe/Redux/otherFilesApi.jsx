import { APi } from "./CenteralAPI";

// NOTE: All routes mount under /api/v1/otherFile — matching the backend router.
// The appendFiles route uses /api/v1/children/:id/other-records/:recordId/files
// because the backend router exposes it at /:id/other-records/:recordId/files.
// Adjust the base path prefix if your router is mounted differently.

export const otherFilesApi = APi.injectEndpoints({
  endpoints: (builder) => ({

    // ── GET OTHER RECORDS ─────────────────────────────────────────────────────
    // GET /api/v1/otherFile/:id/other-records
    getOtherRecords: builder.query({
      query: (childId) => `/api/v1/otherFile/${childId}/other-records`,
      providesTags: (result, error, childId) => [
        { type: "OtherRecords", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
    }),
     getAllOtherRecords: builder.query({
      query: (params) => ({ url: "/other-records", params }),
      providesTags: ["OtherRecord"],
    }),

    // ── CREATE RECORD ─────────────────────────────────────────────────────────
    // POST /api/v1/otherFile/:id/other-records   (multipart, field: "otherFile")
    createChildOtherFile: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/otherFile/${id}/other-records`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "OtherRecords", id },
        { type: "ChildSearchById", id },
      ],
    }),

    // ── EDIT RECORD ───────────────────────────────────────────────────────────
    // PATCH /api/v1/otherFile/other-records/:recordId   (JSON body)
    editOtherRecord: builder.mutation({
      query: ({ childId, recordId, title, description }) => ({
        url: `/api/v1/otherFile/other-records/${recordId}`,
        method: "PATCH",
        body: { title, description },
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "OtherRecords", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
    }),

    // ── DELETE ENTIRE RECORD ──────────────────────────────────────────────────
    // DELETE /api/v1/otherFile/other-records/:recordId   (JSON body: { childId })
    deleteOtherRecord: builder.mutation({
      query: ({ childId, recordId }) => ({
        url: `/api/v1/otherFile/other-records/${recordId}`,
        method: "DELETE",
        body: { childId },
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "OtherRecords", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
    }),

    // ── DELETE SINGLE FILE FROM RECORD ────────────────────────────────────────
    // DELETE /api/v1/otherFile/other-records/:recordId/files   (JSON body: { publicId, childId })
    deleteOtherRecordFile: builder.mutation({
      query: ({ childId, recordId, public_id }) => ({
        url: `/api/v1/otherFile/other-records/${recordId}/files`,
        method: "DELETE",
        body: { publicId: public_id, childId },
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "OtherRecords", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
    }),

    // ── APPEND FILES TO RECORD ────────────────────────────────────────────────
    // POST /api/v1/otherFile/:childId/other-records/:recordId/files   (multipart, field: "files")
    // FIXED: was pointing to /api/v1/children/ — now matches the actual router mount
    uploadOtherRecordFiles: builder.mutation({
      query: ({ childId, recordId, formData }) => ({
        url: `/api/v1/otherFile/${childId}/other-records/${recordId}/files`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "OtherRecords", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllOtherRecordsQuery,
  useGetOtherRecordsQuery,
  useCreateChildOtherFileMutation,
  useEditOtherRecordMutation,
  useDeleteOtherRecordMutation,
  useDeleteOtherRecordFileMutation,
  useUploadOtherRecordFilesMutation,
} = otherFilesApi;