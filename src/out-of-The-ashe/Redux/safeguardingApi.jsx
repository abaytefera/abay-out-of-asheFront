import { APi } from "./CenteralAPI";

export const safeguardingApi = APi.injectEndpoints({
  endpoints: (builder) => ({
    getSafeguardingCases: builder.query({
      query: (childId) => `/api/v1/safeguarding?childId=${childId}`,
      providesTags: (result, error, childId) => [
        { type: "Safeguarding", id: childId },
        { type: "Safeguarding", id: "List" },
      ],
    }),
     getAllSafeguardingCases: builder.query({
      query: (params) => ({ url: "/safeguarding-cases", params }),
      providesTags: ["SafeguardingCase"],
    }),

    createSafeguardingCase: builder.mutation({
      query: (caseData) => ({ url: "/api/v1/safeguarding", method: "POST", body: caseData }),
      invalidatesTags: (result, error, arg) => [
        { type: "Safeguarding", id: arg?.childId },
        { type: "Safeguarding", id: "List" },
      ],
    }),

    updateSafeguardingCase: builder.mutation({
      query: ({ id, childId, ...body }) => ({
        url: `/api/v1/safeguarding/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Safeguarding", id: arg.childId },
        { type: "Safeguarding", id: "List" },
      ],
    }),

    closeSafeguardingCase: builder.mutation({
      query: (id) => ({ url: `/api/v1/safeguarding/${id}/close`, method: "PATCH" }),
      invalidatesTags: [{ type: "Safeguarding", id: "List" }],
    }),

    deleteSafeguardingCase: builder.mutation({
      query: (id) => ({ url: `/api/v1/safeguarding/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Safeguarding", id: "List" }],
    }),

    grantSafeguardingAccess: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/api/v1/safeguarding/${id}/grant-access`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: [{ type: "Safeguarding", id: "List" }],
    }),

    // Revoke a previously granted viewer from a case
    revokeSafeguardingAccess: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/api/v1/safeguarding/${id}/revoke-access`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: [{ type: "Safeguarding", id: "List" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllSafeguardingCasesQuery,
  useGetSafeguardingCasesQuery,
  useCreateSafeguardingCaseMutation,
  useUpdateSafeguardingCaseMutation,
  useCloseSafeguardingCaseMutation,
  useDeleteSafeguardingCaseMutation,
  useGrantSafeguardingAccessMutation,
  useRevokeSafeguardingAccessMutation,
} = safeguardingApi;