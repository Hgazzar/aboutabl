import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import { buildUrl } from "../../utils/fetchMethods";
import type { StaffNotificationItem } from "@/utils/notificationNav";

interface NotificationsParams {
  limit: number;
  is_read?: number;
}

export type NotificationsListResponse = {
  status?: boolean;
  notifications?: StaffNotificationItem[];
};

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
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsListResponse, NotificationsParams>({
      query: ({ limit, is_read }) =>
        `notifications/list?limit=${limit}${
          is_read != null ? `&is_read=${is_read}` : ""
        }`,
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<{ status?: boolean }, number>({
      query: (id) => ({
        url: `notifications/update_read/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<{ status?: boolean }, void>({
      query: () => ({
        url: "notifications/mark_all_read",
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
    deleteAllNotifications: builder.mutation<{ status?: boolean }, void>({
      query: () => ({
        url: "notifications/delete_all",
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteAllNotificationsMutation,
} = notificationsApi;
