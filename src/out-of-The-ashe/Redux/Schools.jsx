import { APi } from "./CenteralAPI";

export const schoolApi = APi.injectEndpoints({

  endpoints: (builder) => ({
    // ── All schools (with optional filters) ──
    getSchools: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.type && params.type !== "ALL") searchParams.set("type", params.type);
        return `/api/v1/school/?${searchParams.toString()}`;
      },
      transformResponse: (res) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "School", id })),
              { type: "School", id: "LIST" },
            ]
          : [{ type: "School", id: "LIST" }],
    }),

    // ── Dropdown (lightweight) ──
    getSchoolsDropdown: builder.query({
      query: () => "/api/v1/school/dropdown",
      transformResponse: (res) => res.data,
      providesTags: [{ type: "School", id: "LIST" }],
    }),

    // ── Single ──
    getSchoolById: builder.query({
      query: (id) => `/api/v1/school/${id}`,
      transformResponse: (res) => res.data,
      providesTags: (_r, _e, id) => [{ type: "School", id }],
    }),

    // ── Create ──
    createSchool: builder.mutation({
      query: (body) => ({ url: "/api/v1/school/", method: "POST", body }),
      transformResponse: (res) => res.data,
      invalidatesTags: [{ type: "School", id: "LIST" }],
    }),

    // ── Update ──
    updateSchool: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/api/v1/school/${id}`, method: "PATCH", body }),
      transformResponse: (res) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "School", id }, { type: "School", id: "LIST" }],
    }),

    // ── Delete ──
    deleteSchool: builder.mutation({
      query: (id) => ({ url: `/api/v1/school/${id}`, method: "DELETE" }),
      transformResponse: (res) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: "School", id }, { type: "School", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSchoolsQuery,
  useGetSchoolsDropdownQuery,
  useGetSchoolByIdQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
} = schoolApi;