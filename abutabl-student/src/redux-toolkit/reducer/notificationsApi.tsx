import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

interface NotificationsParams {
	limit: number;
	is_read?: number;
}

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

	endpoints: (builder: any) => ({
		getNotifications: builder.query({
			query: ({ limit, is_read }: NotificationsParams) =>
				`notifications/list?limit=${limit}${is_read ? '&is_read=' + is_read : ''}`,
			//   pollingInterval: 60000,
		}),
	}),
});

export const { useGetNotificationsQuery } = notificationsApi;
