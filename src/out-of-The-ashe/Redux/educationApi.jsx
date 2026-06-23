import { APi } from "./CenteralAPI";

export const educationApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicRecords: builder.query({
      query: (childId) => `/api/v1/education/records/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "AcademicRecords", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
      transformResponse: (response) => response?.data || response || [],
    }),
    getMaterialSupports: builder.query({
      query: (childId) => `/api/v1/education/materials/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "MaterialSupport", id: childId },
        { type: "ChildSearchById", id: childId },
      ],
      transformResponse: (response) => response?.data || response || [],
    }),
    createAcademicRecord: builder.mutation({
      query: (formData) => ({ url: "/api/v1/education/records", method: "POST", body: formData }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [{ type: "AcademicRecords", id: childId }, { type: "ChildSearchById", id: childId }];
      },
    }),
    updateAcademicRecord: builder.mutation({
      // arg: { recordId, formData, childId }
      query: ({ recordId, formData }) => ({
        url: `/api/v1/education/records/${recordId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "AcademicRecords", id: arg?.childId },
        { type: "ChildSearchById", id: arg?.childId },
      ],
    }),
    deleteAcademicRecord: builder.mutation({
      // arg: { recordId, childId }
      query: ({ recordId }) => ({
        url: `/api/v1/education/records/${recordId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "AcademicRecords", id: arg?.childId },
        { type: "ChildSearchById", id: arg?.childId },
      ],
    }),
    deleteAcademicRecordFile: builder.mutation({
      // arg: { recordId, fileId, childId }
      query: ({ recordId, fileId }) => ({
        url: `/api/v1/education/records/${recordId}/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "AcademicRecords", id: arg?.childId },
        { type: "ChildSearchById", id: arg?.childId },
      ],
    }),
    createMaterialSupport: builder.mutation({
      query: (data) => ({ url: "/api/v1/education/materials", method: "POST", body: data }),
      invalidatesTags: (result, error, arg) => [{ type: "MaterialSupport", id: arg?.childId }],
    }),
    updateMaterialSupport: builder.mutation({
      // arg: { materialId, data, childId }
      query: ({ materialId, data }) => ({
        url: `/api/v1/education/materials/${materialId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [{ type: "MaterialSupport", id: arg?.childId }],
    }),
    deleteMaterialSupport: builder.mutation({
      // arg: { materialId, childId }
      query: ({ materialId }) => ({
        url: `/api/v1/education/materials/${materialId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [{ type: "MaterialSupport", id: arg?.childId }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAcademicRecordsQuery,
  useGetMaterialSupportsQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useDeleteAcademicRecordFileMutation,
  useCreateMaterialSupportMutation,
  useUpdateMaterialSupportMutation,
  useDeleteMaterialSupportMutation,
} = educationApi;