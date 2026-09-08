import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type { StudentNotificationItem } from 'lib/notificationUtils';

interface NotificationsParams {
	limit: number;
	is_read?: number;
}

export type NotificationsListResponse = {
	status?: boolean;
	notifications?: StudentNotificationItem[];
};

const baseUrl = import.meta.env.VITE_BASE_URL ?? 'https://aboutabl.com/api/student';
const apiSecret = import.meta.env.VITE_API_SECRET ?? 'OASzRok654E0AJ20KH';

export const notificationsApi = createApi({
	reducerPath: 'notificationsApi',
	baseQuery: fetchBaseQuery({
		baseUrl: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
		prepareHeaders: (headers) => {
			const token = Cookies.get('token_');
			if (token) {
				headers.set('Authorizations', `Bearer ${token}`);
			}
			if (apiSecret) {
				headers.set('apiSecret', apiSecret);
			}
			return headers;
		},
	}),
	tagTypes: ['Notifications'],
	endpoints: (builder) => ({
		getNotifications: builder.query<NotificationsListResponse, NotificationsParams>({
			query: ({ limit, is_read }) =>
				`notifications/list?limit=${limit}${is_read != null ? `&is_read=${is_read}` : ''}`,
			providesTags: ['Notifications'],
		}),
		markNotificationRead: builder.mutation<{ status?: boolean }, number>({
			query: (id) => ({
				url: `notifications/update_read/${id}`,
				method: 'POST',
			}),
			invalidatesTags: ['Notifications'],
		}),
		markAllNotificationsRead: builder.mutation<{ status?: boolean }, void>({
			query: () => ({
				url: 'notifications/mark_all_read',
				method: 'POST',
			}),
			invalidatesTags: ['Notifications'],
		}),
		deleteAllNotifications: builder.mutation<{ status?: boolean }, void>({
			query: () => ({
				url: 'notifications/delete_all',
				method: 'DELETE',
			}),
			invalidatesTags: ['Notifications'],
		}),
	}),
});

export const {
	useGetNotificationsQuery,
	useMarkNotificationReadMutation,
	useMarkAllNotificationsReadMutation,
	useDeleteAllNotificationsMutation,
} = notificationsApi;
