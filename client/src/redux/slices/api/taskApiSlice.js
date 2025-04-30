import { TASKS_URL } from "../../../utils/contants";
import { apiSlice } from "../apiSlice";

export const postApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTask: builder.mutation({
      query: (data) => ({
        url: `${TASKS_URL}/create`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    updateTask: builder.mutation({
      query: ({ id, ...rest }) => ({
        url: `${TASKS_URL}/update/${id}`,
        method: "PUT",
        body: rest,
        credentials: "include",
      }),
    }),
    

    getAllTask: builder.query({
      query: ({ strQuery, isTrashed, search }) => ({
        url: `${TASKS_URL}?stage=${strQuery}&isTrashed=${isTrashed}&search=${search}`,
        method: "GET",
        credentials: "include",
      }),
    }),

    getSingleTask: builder.query({
      query: ({ id }) => ({
        url: `${TASKS_URL}/${id}`,
        method: "GET",
        credentials: "include",
      }),
    }),    

    postTaskActivity: builder.mutation({
      query: ({ data, id }) => ({
        url: `${TASKS_URL}/activity/${id}`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),


    getTaskActivities: builder.query({
      query: ({ id }) => `${TASKS_URL}/activities/${id}`,
      // you can transformResponse if your API nests under `activities`
      transformResponse: (response) => response.activities || [],
      providesTags: (result, error, { id }) =>
        result
          ? [
              ...result.map(({ id: actId }) => ({ type: 'Activities', id: actId })),
              { type: 'Activities', id }
            ]
          : [{ type: 'Activities', id }],
    }),



    trashTast: builder.mutation({
      query: ({ id }) => ({
        url: `${TASKS_URL}/${id}`,
        method: "PUT",
        credentials: "include",
      }),
    }),

    deleteRestoreTast: builder.mutation({
      query: ({ id, actionType }) => ({
        url: `${TASKS_URL}/delete-restore/${id}?actionType=${actionType}`,
        method: "DELETE",
        credentials: "include",
      }),
    }),

    getDasboardStats: builder.query({
      query: () => ({
        url: `${TASKS_URL}/dashboard`,
        method: "GET",
        credentials: "include",
      }),
    }),

    changeTaskStage: builder.mutation({
      query: ({ id, stage }) => ({
        url: `${TASKS_URL}/change-stage/${id}`,
        method: "PUT",
        body: { stage }, // ✅ only sending what's needed
        credentials: "include",
      }),
    }),
    
  }),
});

export const {
  usePostTaskActivityMutation,
  useGetTaskActivitiesQuery,
  useCreateTaskMutation,
  useGetAllTaskQuery,
  useTrashTastMutation,
  useDeleteRestoreTastMutation,
  useUpdateTaskMutation,
  useGetSingleTaskQuery,
  useGetDasboardStatsQuery,
  useChangeTaskStageMutation,
} = postApiSlice;