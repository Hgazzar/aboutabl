import axios from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const baseURL = import.meta.env.VITE_BASE_URL ?? 'https://aboutabl.com/api/student/';

const axiosInstance = axios.create({
	baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
});

// Session expiration check (same pattern as admin)
const checkSessionExpiration = (): void => {
	const expiration = Cookies.get('expiration');
	if (!expiration || +expiration < Date.now()) {
		Cookies.remove('token_');
		Cookies.remove('username');
		Cookies.remove('abotable_id');
		Cookies.remove('expiration');
		localStorage.removeItem('user_info');
		window.location.href = '/login';
	}
};

axiosInstance.interceptors.request.use(
	async (config) => {
		checkSessionExpiration();
		const token = Cookies.get('token_');
		const apiSecret = import.meta.env.VITE_API_SECRET ?? 'OASzRok654E0AJ20KH';
		if (token) {
			config.headers.Authorizations = `Bearer ${token}`;
		}
		if (apiSecret) {
			config.headers.apiSecret = apiSecret;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
	function (response) {
		if (response.data.message && response.config.method !== 'get') {
			toast.success(response.data.message);
		}
		return response;
	},
	function (error) {
		if (error.response?.status === 400 || error.response?.status === 500) {
			toast.error(error.response?.data?.msg);
		}

		if (error.response?.status === 401) {
			toast.error('Your token has expired, please login again');
			Cookies.remove('token_');
			Cookies.remove('username');
			Cookies.remove('abotable_id');
			Cookies.remove('expiration');
			localStorage.removeItem('user_info');
			window.location.href = '/login';
		} else {
			toast.error(error?.response?.data?.message);
		}
		return Promise.reject(error.response);
	}
);

export default axiosInstance;
