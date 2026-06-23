import { APi } from "./CenteralAPI";

export const financialApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    getFinancialSupports: builder.query({
      query: (childId) => `/api/v1/financial/child/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "FinancialSupport", id: childId },
        { type: "FinancialSupport", id: "List" },
      ],
    }),
     getAllFinancialSupports: builder.query({
      query: (params) => ({ url: "/financial-support", params }),
      providesTags: ["FinancialSupport"],
    }),
 

    createFinancialSupport: builder.mutation({
      query: (formData) => ({
        url: "/api/v1/financial",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, arg) => {
        const childId =
          arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [
          { type: "FinancialSupport", id: childId },
          { type: "FinancialSupport", id: "List" },
        ];
      },
    }),

    // Sends FormData so files + fields are handled by multer on the backend
    updateFinancialSupport: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/financial/${id}`,
        method: "PATCH",
        body: formData, // FormData — RTK Query will NOT set Content-Type, letting the browser set multipart boundary
      }),
      invalidatesTags: (result, error, { id, formData }) => {
        const childId =
          formData instanceof FormData ? formData.get("childId") : null;
        return [
          ...(childId
            ? [{ type: "FinancialSupport", id: childId }]
            : []),
          { type: "FinancialSupport", id: "List" },
        ];
      },
    }),

    deleteFinancialSupport: builder.mutation({
      query: (id) => ({ url: `/api/v1/financial/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "FinancialSupport", id: "List" }],
    }),

    // childId is passed so we can invalidate the right cache slice
    deleteFinancialFile: builder.mutation({
      query: ({ recordId, fileId }) => ({
        url: `/api/v1/financial/${recordId}/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "FinancialSupport", id: childId },
        { type: "FinancialSupport", id: "List" },
      ],
    }),

    uploadFinancialFiles: builder.mutation({
      query: ({ recordId, formData }) => ({
        url: `/api/v1/financial/${recordId}/files`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { childId }) => [
        { type: "FinancialSupport", id: childId },
        { type: "FinancialSupport", id: "List" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllFinancialSupportsQuery,
  useGetFinancialSupportsQuery,
  useCreateFinancialSupportMutation,
  useUpdateFinancialSupportMutation,
  useDeleteFinancialSupportMutation,
  useDeleteFinancialFileMutation,
  useUploadFinancialFilesMutation,
} = financialApi;