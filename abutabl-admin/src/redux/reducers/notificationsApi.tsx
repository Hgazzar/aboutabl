import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import { buildUrl } from "../../utils/fetchMethods";

interface NotificationsParams {
  limit: number;
  is_read?: number;
}
export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: buildUrl(process.env.REACT_APP_BASE_URL, "/api/"),
    prepareHeaders: (headers) => {
      const token = Cookies.get("token_");
      const apiSecret = process.env.REACT_APP_API_SECRET;
      if (token) {
        headers.set("Authorizations", `Bearer ${token}`);
      }
      if (apiSecret) {
        headers.set("apiSecret", apiSecret);
      }
      return headers;
    },
  }),

  endpoints: (builder: any) => ({
    getNotifications: builder.query({
      query: ({ limit, is_read }: NotificationsParams) =>
        `notifications/list?limit=${limit}${
          is_read ? "&is_read=" + is_read : ""
        }`,
      //   pollingInterval: 60000,
    }),
  }),
});

export const { useGetNotificationsQuery } = notificationsApi;
