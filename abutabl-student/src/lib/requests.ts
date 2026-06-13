import axios from 'axios';
import axiosInstance from '../guards/axiosInstane';

const baseURL = import.meta.env.VITE_BASE_URL ?? 'https://aboutabl.com/api/student';
const apiSecret = import.meta.env.VITE_API_SECRET ?? 'OASzRok654E0AJ20KH';

const buildUrl = (endpoint: string): string => {
	const base = baseURL.replace(/\/+$/, '');
	const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	return `${base}${path}`;
};

export const getRequest = async (
	url: string,
	params?: { [key: string]: any },
	contentType?: string
) => {
	const response = await axiosInstance({
		method: 'get',
		url,
		headers: { 'Content-Type': contentType || 'application/json' },
		params,
	});
	return response.data;
};

export const loginRequest = async (url: string, body?: any) => {
	const response = await axios.post(buildUrl(url), body, {
		headers: {
			'Content-Type': 'application/json',
			apiSecret,
		},
	});
	return response.data;
};

export const postRequest = async (
	url: string,
	body?: { [key: string]: any },
	contentType?: string
) => {
	const response = await axiosInstance({
		method: 'post',
		url,
		data: body,
		headers: { 'Content-Type': contentType || 'application/json' },
	});
	return response.data;
};

/** POST as multipart/form-data (e.g. for file upload). Do not set Content-Type so axios sets boundary. */
export const postFormDataRequest = async (url: string, formData: FormData) => {
	const response = await axiosInstance({
		method: 'post',
		url,
		data: formData,
		headers: { Accept: 'application/json' },
	});
	return response.data;
};

export const putRequest = async (
	url: string,
	body?: { [key: string]: any },
	contentType?: string
) => {
	const response = await axiosInstance({
		method: 'put',
		url,
		data: body,
		headers: { 'Content-Type': contentType || 'application/json' },
	});
	return response.data;
};

export const deleteRequest = async (
	url: string,
	body?: { [key: string]: any },
	contentType?: string
) => {
	const response = await axiosInstance({
		method: 'delete',
		url,
		data: body,
		headers: { 'Content-Type': contentType || 'application/json' },
	});
	return response.data;
};
