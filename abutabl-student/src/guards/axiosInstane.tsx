import axios from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { resolveStudentApiBaseUrl } from 'lib/studentApiBaseUrl';

const baseURL = resolveStudentApiBaseUrl();

const axiosInstance = axios.create({
	baseURL: `${baseURL}/`,
});

const clearStudentSession = (): void => {
	Cookies.remove('token_');
	Cookies.remove('username');
	Cookies.remove('abotable_id');
	Cookies.remove('expiration');
	localStorage.removeItem('user_info');
};

// Only expire sessions when an expiration timestamp exists and is in the past.
const checkSessionExpiration = (): void => {
	const token = Cookies.get('token_');
	if (!token) {
		return;
	}

	const expiration = Cookies.get('expiration');
	if (expiration && +expiration < Date.now()) {
		clearStudentSession();
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
		const status = error.response?.status;
		const data = error.response?.data;
		const errorsBag =
			data?.errors && typeof data.errors === 'object'
				? Object.values(data.errors as Record<string, string[]>)
						.flat()
						.find((v) => typeof v === 'string' && v.trim())
				: undefined;
		const apiMsg =
			(typeof data?.msg === 'string' && data.msg) ||
			(typeof errorsBag === 'string' && errorsBag) ||
			(typeof data?.message === 'string' && data.message && !/^Server Error$/i.test(data.message)
				? data.message
				: undefined);
		const method = (error.config?.method ?? 'get').toLowerCase();
		const isGet = method === 'get';
		const isNetworkFailure =
			!error.response &&
			(error.code === 'ERR_NETWORK' || error.message === 'Network Error');
		const isBackendUnavailable = isNetworkFailure || status === 502 || status === 503 || status === 504;

		const message =
			(typeof apiMsg === 'string' && apiMsg) ||
			(isBackendUnavailable
				? import.meta.env.DEV
					? 'API server unavailable — start Laravel on http://127.0.0.1:8000'
					: 'Unable to connect to the server. Please try again later.'
				: undefined) ||
			error.message ||
			(status ? `Request failed (${status})` : 'Network error — check that the API server is running');

		if (status === 401) {
			toast.error('Your token has expired, please login again');
			clearStudentSession();
			window.location.href = '/login';
		} else if (!isGet) {
			if (status === 400 || status === 422 || status === 500) {
				toast.error(typeof apiMsg === 'string' ? apiMsg : message);
			} else if (typeof apiMsg === 'string' && apiMsg) {
				toast.error(apiMsg);
			} else if (isBackendUnavailable) {
				toast.error(message);
			} else if (error.message) {
				toast.error(error.message);
			}
		}

		return Promise.reject(new Error(message));
	}
);

export default axiosInstance;
