import { APi } from "./CenteralAPI";

export const psychosocialApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    getPsychosocialSessions: builder.query({
      query: (childId) => `/api/v1/psychosocial/sessions/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "PsychosocialSession", id: childId },
        { type: "PsychosocialSession", id: "List" },
      ],
    }),
     getAllPsychosocialSessions: builder.query({
      query: (params) => ({ url: "/psychosocial-sessions", params }),
      providesTags: ["PsychosocialSession"],
    }),
    getAllTBRIActivities: builder.query({
      query: () => "/psychosocial/tbri-activities",
      providesTags: ["TBRIActivity"],
    }),
   
    createPsychosocialSession: builder.mutation({
      query: (formData) => ({ url: "/api/v1/psychosocial/sessions", method: "POST", body: formData }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [{ type: "PsychosocialSession", id: childId }, { type: "ChildSearchById", id: childId }];
      },
    }),
    updatePsychosocialSession: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/api/v1/psychosocial/sessions/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, arg) => [
        { type: "PsychosocialSession", id: arg?.childId },
        { type: "ChildSearchById", id: arg?.childId },
      ],
    }),
    deletePsychosocialSession: builder.mutation({
      query: (id) => ({ url: `/api/v1/psychosocial/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, arg, meta) => [
        { type: "PsychosocialSession", id: "List" },
      ],
    }),

    getTBRIActivities: builder.query({
      query: (childId) => `/api/v1/psychosocial/tbri/${childId}`,
      providesTags: (result, error, childId) => [
        { type: "TBRIActivity", id: childId },
        { type: "TBRIActivity", id: "List" },
      ],
    }),
    createTBRIActivity: builder.mutation({
      query: (formData) => ({ url: "/api/v1/psychosocial/tbri", method: "POST", body: formData }),
      invalidatesTags: (result, error, arg) => {
        const childId = arg instanceof FormData ? arg.get("childId") : arg?.childId;
        return [{ type: "TBRIActivity", id: childId }, { type: "ChildSearchById", id: childId }];
      },
    }),
    updateTBRIActivity: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/api/v1/psychosocial/tbri/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, arg) => [
        { type: "TBRIActivity", id: arg?.childId },
        { type: "ChildSearchById", id: arg?.childId },
      ],
    }),
    deleteTBRIActivity: builder.mutation({
      query: (id) => ({ url: `/api/v1/psychosocial/tbri/${id}`, method: "DELETE" }),
      invalidatesTags: () => [{ type: "TBRIActivity", id: "List" }],
    }),
  }),
  overrideExisting: true,
});

export const {
   useGetAllPsychosocialSessionsQuery,
   useGetAllTBRIActivitiesQuery,
  useGetPsychosocialSessionsQuery,
  useCreatePsychosocialSessionMutation,
  useUpdatePsychosocialSessionMutation,
  useDeletePsychosocialSessionMutation,
  useGetTBRIActivitiesQuery,
  useCreateTBRIActivityMutation,
  useUpdateTBRIActivityMutation,
  useDeleteTBRIActivityMutation,
} = psychosocialApi;