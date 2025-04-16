// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// // const API_URL = import.meta.env.VITE_APP_BASE_URL + "/api";
// const API_URL = "http://localhost:8800/api";

// const baseQuery = fetchBaseQuery({ baseUrl: API_URL });

// export const apiSlice = createApi({
//   baseQuery,
//   tagTypes: [],
//   endpoints: (builder) => ({}),
// });


import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = "http://localhost:8800/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include", 
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.user?.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: [],
  endpoints: (builder) => ({}),
});
