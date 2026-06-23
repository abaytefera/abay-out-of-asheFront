import { APi } from "./CenteralAPI";

const Employee = APi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get All Employees (Paginated list)
    getEmployees: builder.query({
      query: () => '/api/v1/staff/',
      providesTags: (result) =>
        result && result.staff
          ? [
              { type: 'Employees', id: 'List' },
              ...result.staff.map((employee) => ({ type: 'Employees', id: employee.id })),
            ]
          : [{ type: 'Employees', id: 'List' }]
    }),
     getAllAcademicRecords: builder.query({
      query: (params) => ({ url: "/academic-records", params }),
      providesTags: ["AcademicRecord"],
    }),

    // 2. Get Single Employee Profile (Crucial: Added providesTags for cache management)
    getEmployeeById: builder.query({
      query: (id) => `/api/v1/staff/getById?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Employees', id }]
    }),

    // 3. Create New Employee Record
    createEmployee: builder.mutation({
      query: (Emp) => ({
        url: "/api/v1/auth/register",
        method: 'POST',
        body: Emp
      }),
      invalidatesTags: [{ type: 'Employees', id: 'List' }]
    }),

    // 4. Hard Delete Employee Account
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/api/v1/staff/employees?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Employees', id: 'List' },
        { type: 'Employees', id }
      ],
    }),

    // 5. Reset Password (Query param style to match backend router)
    resetEmployeePassword: builder.mutation({
      query: ({ id, password }) => ({
        url: `/api/v1/staff/resetPassword?id=${id}`,
        method: 'PUT',
        body: { password }
      }),
      // Invalidates this specific employee instance to trigger fresh data fetch if needed
      invalidatesTags: (result, error, { id }) => [{ type: 'Employees', id }]
    }),

    // 6. Soft Deactivate Employee (Added to support Backend Service logic)
    deactivateEmployee: builder.mutation({
  query: (id) => ({
    // Changed to path parameter format
    url: `/api/v1/staff/deactivate/${id}`,
    method: 'PATCH',
  }),
  invalidatesTags: (result, error, id) => [
    { type: 'Employees', id: 'List' },
    { type: 'Employees', id }
  ]
}),

    // 7. Update Background Check Status Record (Added to support Backend Service logic)
    updateBackgroundCheck: builder.mutation({
      query: ({ id, status, remarks }) => ({
        url: `/api/v1/staff/bg-check?id=${id}`,
        method: 'PATCH',
        body: { status, remarks }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Employees', id }]
    }),

    // 8. Add Performance Review Entry (Added to support Backend Service logic)
    addEmployeeReview: builder.mutation({
      query: ({ id, ...reviewData }) => ({
        url: `/api/v1/staff/review?id=${id}`,
        method: 'POST',
        body: reviewData
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Employees', id }]
    }),

    // 9. Fetch Target Employee Custom Permissions (Path param style)
    getPermissions: builder.query({
      query: (id) => `/api/v1/staff/Permissions/${id}`,
      providesTags: (result, error, id) => [{ type: "Permissions", id }],
    }),

    // 10. Fetch Authenticated User's Own Permissions
    getPermissionsOwn: builder.query({
      query: () => `/api/v1/staff/Permissions/own`,
      // Fix: Uses static key 'OWN' since no explicit arg ID parameter is passed to this hook
      providesTags: () => [{ type: "Permissions", id: 'OWN' }],
    }),

    // 11. Modify Permission Matrix (Path param style)
    updatePermissions: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/staff/Permissions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Permissions", id },
        { type: "Permissions", id: 'OWN' } // Invalidates fallback context as well
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllAcademicRecordsQuery,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useResetEmployeePasswordMutation,
  useDeactivateEmployeeMutation,      // New Hook
  useUpdateBackgroundCheckMutation,   // New Hook
  useAddEmployeeReviewMutation,       // New Hook
  useGetPermissionsQuery,
  useGetPermissionsOwnQuery,
  useUpdatePermissionsMutation,
} = Employee;