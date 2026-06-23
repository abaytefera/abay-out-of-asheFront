import { APi } from "./CenteralAPI";

export const healthApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    // ── GET ─────────────────────────────────────────────────────
    getHealthRecords: builder.query({
      query: (childId) => `/api/v1/health/records/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "HealthRecord", id: childId },
        { type: "HealthRecord", id: "List" },
      ],
    }),
    getVaccinations: builder.query({
      query: (childId) => `/api/v1/health/vaccinations/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "Vaccination", id: childId },
        { type: "Vaccination", id: "List" },
      ],
    }),
    getNutritionRecords: builder.query({
      query: (childId) => `/api/v1/health/nutrition/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "NutritionRecord", id: childId },
        { type: "NutritionRecord", id: "List" },
      ],
    }),
     getAllHealthRecords: builder.query({
    query: (params) => ({ url: "/health-records", params }),
    providesTags: ["HealthRecord"],
  }),
 
  getAllVaccinations: builder.query({
    query: (params) => ({ url: "/vaccinations", params }),
    providesTags: ["Vaccination"],
  }),
 
  getAllNutritionRecords: builder.query({
    query: (params) => ({ url: "/nutrition-records", params }),
    providesTags: ["NutritionRecord"],
  }),

    // ── CREATE ───────────────────────────────────────────────────
    createHealthRecord: builder.mutation({
      query: (formData) => ({ url: "/api/v1/health/records", method: "POST", body: formData }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [{ type: "HealthRecord", id: childId }];
      },
    }),
    addVaccination: builder.mutation({
      query: (formData) => ({ url: "/api/v1/health/vaccinations", method: "POST", body: formData }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [{ type: "Vaccination", id: childId }];
      },
    }),
    addNutritionRecord: builder.mutation({
      query: (formData) => ({ url: "/api/v1/health/nutrition", method: "POST", body: formData }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [{ type: "NutritionRecord", id: childId }];
      },
    }),

    // ── UPDATE ───────────────────────────────────────────────────
    updateHealthRecord: builder.mutation({
      query: ({ id, formData }) => ({ url: `/api/v1/health/records/${id}`, method: "PUT", body: formData }),
      invalidatesTags: (result, error, { formData }) => {
        const childId = formData instanceof FormData ? formData.get("childId") : formData?.childId;
        return [{ type: "HealthRecord", id: childId }];
      },
    }),
    updateVaccination: builder.mutation({
      query: ({ id, formData }) => ({ url: `/api/v1/health/vaccinations/${id}`, method: "PUT", body: formData }),
      invalidatesTags: (result, error, { formData }) => {
        const childId = formData instanceof FormData ? formData.get("childId") : formData?.childId;
        return [{ type: "Vaccination", id: childId }];
      },
    }),
    updateNutritionRecord: builder.mutation({
      query: ({ id, formData }) => ({ url: `/api/v1/health/nutrition/${id}`, method: "PUT", body: formData }),
      invalidatesTags: (result, error, { formData }) => {
        const childId = formData instanceof FormData ? formData.get("childId") : formData?.childId;
        return [{ type: "NutritionRecord", id: childId }];
      },
    }),

    // ── DELETE RECORD ─────────────────────────────────────────────
    deleteHealthRecord: builder.mutation({
      query: ({ id }) => ({ url: `/api/v1/health/records/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, { childId }) => [{ type: "HealthRecord", id: childId }],
    }),
    deleteVaccination: builder.mutation({
      query: ({ id }) => ({ url: `/api/v1/health/vaccinations/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, { childId }) => [{ type: "Vaccination", id: childId }],
    }),
    deleteNutritionRecord: builder.mutation({
      query: ({ id }) => ({ url: `/api/v1/health/nutrition/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, { childId }) => [{ type: "NutritionRecord", id: childId }],
    }),

    // ── DELETE FILE ───────────────────────────────────────────────
    deleteHealthFile: builder.mutation({
      query: ({ fileId, context = "health" }) => ({
        url: `/api/v1/health/files/${fileId}?context=${context}`,
        method: "DELETE",
      }),
      // Invalidate both since we don't know which parent record is affected
      invalidatesTags: [
        { type: "HealthRecord", id: "List" },
        { type: "Vaccination",  id: "List" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllHealthRecordsQuery,
  useGetAllVaccinationsQuery,
  useGetAllNutritionRecordsQuery,
  useGetHealthRecordsQuery,
  useGetVaccinationsQuery,
  useGetNutritionRecordsQuery,
  useCreateHealthRecordMutation,
  useAddVaccinationMutation,
  useAddNutritionRecordMutation,
  useUpdateHealthRecordMutation,
  useUpdateVaccinationMutation,
  useUpdateNutritionRecordMutation,
  useDeleteHealthRecordMutation,
  useDeleteVaccinationMutation,
  useDeleteNutritionRecordMutation,
  useDeleteHealthFileMutation,
} = healthApi;