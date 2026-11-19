
import axios from "axios";
import Cookies from "js-cookie";
import { clearPersistedLoginUser } from "./authSession";
import { redirectToStudentLogin } from "./studentAppUrl";

// Helper to build URLs without double slashes
export const buildUrl = (baseUrl: string | undefined, endpoint: string): string => {
  if (!baseUrl) return endpoint;
  
  // Remove trailing slashes from base URL
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  
  // Ensure endpoint starts with a single slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${normalizedBase}${normalizedEndpoint}`;
};

// Helper to build template file URLs.
// Prefer the admin SPA origin (files live in abutabl-admin/public and are copied into the build root).
// Fall back to the API host public root (not /api/...) for legacy deploys.
export const buildTemplateUrl = (baseUrl: string | undefined, fileName: string): string => {
  const normalizedFileName = (fileName.startsWith("/") ? fileName : `/${fileName}`)
    .split("/")
    .map((part, idx) => (idx === 0 ? part : encodeURIComponent(part)))
    .join("/");

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${normalizedFileName}`;
  }

  if (!baseUrl) return normalizedFileName;

  let normalizedBase = baseUrl.replace(/\/+$/, "");
  if (normalizedBase.endsWith("/api")) {
    normalizedBase = normalizedBase.replace(/\/api$/, "");
  }

  return `${normalizedBase}${normalizedFileName}`;
};

/** Authenticated binary download (File Management, exports). */
export const downloadAuthenticatedFile = async (
  endPoint: string,
  fileName: string
): Promise<void> => {
  checkSessionExpiration();

  try {
    const response = await axios.get(
      buildUrl(process.env.REACT_APP_BASE_URL, endPoint),
      {
        headers: getHeaders(undefined, false),
        responseType: "blob",
      }
    );

    const contentType = String(response.headers["content-type"] || "");
    if (contentType.includes("application/json")) {
      const text = await (response.data as Blob).text();
      let msg = "Download failed";
      try {
        msg = JSON.parse(text)?.msg || msg;
      } catch {
        /* keep default */
      }
      throw new Error(msg);
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const msg = JSON.parse(text)?.msg;
        if (msg) throw new Error(msg);
      } catch (inner: any) {
        if (inner?.message) throw inner;
      }
    }
    throw new Error(err?.response?.data?.msg || err.message || "Download failed");
  }
};

// Helper to check if the session has expired.
const checkSessionExpiration = (): void => {
  const expiration = Cookies.get("expiration");
  if (!expiration || +expiration < Date.now()) {
    Cookies.remove("token_");
    Cookies.remove("username");
    Cookies.remove("abotable_id");
    Cookies.remove("expiration");
    clearPersistedLoginUser();
    redirectToStudentLogin();
  }
};

// Helper to check if error is a rate limit error
const isRateLimitError = (error: any): boolean => {
  if (!error || !error.response) return false;
  
  const status = error.response.status;
  const message = error.response?.data?.msg || error.message || '';
  
  return status === 429 || 
         message.toLowerCase().includes('too many attempts') ||
         message.toLowerCase().includes('rate limit');
};

// Helper to calculate retry delay with exponential backoff
const calculateRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
  // Exponential backoff: baseDelay * 2^attempt, with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

// Helper to sleep/delay execution
const sleep = (ms: number): Promise<void> => {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
};

// Generic retry wrapper for API requests
const retryRequest = async (
  requestFn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on rate limit errors
      if (!isRateLimitError(error) || attempt >= maxRetries) {
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateRetryDelay(attempt, baseDelay);
      
      // Log retry attempt (optional, can be removed in production)
      console.warn(
        `Rate limit error detected. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries + 1})`
      );
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Helper to build request headers.
const getHeaders = (lang?: string, includeContentType = false, isFormData = false) => {
  const headers: { [key: string]: string } = {
    apiSecret: `${process.env.REACT_APP_API_SECRET}`,
    Authorizations: "Bearer " + Cookies.get("token_")!,
  };

  if (includeContentType && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  // For FormData, do not set Content-Type so axios sets multipart/form-data with boundary

  if (lang) {
    headers["lang"] = lang;
  }

  return headers;
};

export const postRequest = async (body: any, endPoint: string) => {
  checkSessionExpiration();

  // Check if body is FormData
  const isFormData = body instanceof FormData;

  return retryRequest(async () => {
    try {
      const response = await axios.post(
        buildUrl(process.env.REACT_APP_BASE_URL, endPoint),
        body,
        { headers: getHeaders(undefined, true, isFormData) }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || err.message || 'An error occurred';
      throw new Error(errorMessage);
    }
  });
};

export class ApiResponseError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.body = body;
  }
}

/** Multipart POST that keeps the API body on 422. Does not change postRequest. */
export const postFormRequest = async (body: FormData, endPoint: string) => {
  checkSessionExpiration();

  try {
    const response = await axios.post(
      buildUrl(process.env.REACT_APP_BASE_URL, endPoint),
      body,
      { headers: getHeaders(undefined, true, true) }
    );
    return response.data;
  } catch (err: any) {
    const data = err.response?.data;
    const status = err.response?.status ?? 0;
    throw new ApiResponseError(
      data?.msg || err.message || "An error occurred",
      status,
      data
    );
  }
};

export const putRequest = async (body: any, endPoint: string) => {
  checkSessionExpiration();

  // Check if body is FormData
  const isFormData = body instanceof FormData;

  return retryRequest(async () => {
    try {
      const response = await axios.put(
        buildUrl(process.env.REACT_APP_BASE_URL, endPoint),
        body,
        { headers: getHeaders(undefined, true, isFormData) }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || err.message || 'An error occurred';
      throw new Error(errorMessage);
    }
  });
};

export const getRequest = async (
  params: any,
  endPoint: string,
  lang?: string
) => {
  checkSessionExpiration();

  return retryRequest(async () => {
    try {
      const response = await axios.get(
        buildUrl(process.env.REACT_APP_BASE_URL, endPoint),
        { headers: getHeaders(lang, false), params }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || err.message || 'An error occurred';
      throw new Error(errorMessage);
    }
  });
};

export const deleteRequest = async (params: any, endPoint: string) => {
  checkSessionExpiration();

  return retryRequest(async () => {
    try {    
      const response = await axios.delete(
        buildUrl(process.env.REACT_APP_BASE_URL, endPoint),
        { headers: getHeaders() }
      );
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || err.message || 'An error occurred';
      throw new Error(errorMessage);
    }
  });
};

// import axios from "axios";
// import Cookies from "js-cookie";

// export const postRequest = async (body: any, endPoint: any) => {
//   const expiration: any = Cookies.get("expiration");
//   if (expiration && +expiration < Date.now()) {
//     Cookies.remove("token_");
//     Cookies.remove("username");
//     Cookies.remove("abotable_id");
//     Cookies.remove("expiration");
//     window.location.href = "/";
//   }

//   try {
//     const response = await axios.post(
//       `${process.env.REACT_APP_BASE_URL}${endPoint}`,
//       body,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           apiSecret: `${process.env.REACT_APP_API_SECRET}`,
//           Authorizations: "Bearer " + Cookies.get("token_")!,
//         },
//       }
//     );
//     return response.data;
//   } catch (err: any) {
//     throw new Error(err.response.data.msg);
//   }
// };

// export const putRequest = async (body: any, endPoint: any) => {
//   const expiration: any = Cookies.get("expiration");
//   if (+expiration < Date.now()) {
//     Cookies.remove("token_");
//     Cookies.remove("username");
//     Cookies.remove("expiration");
//     Cookies.remove("abotable_id");

//     window.location.href = "/";
//   }

//   try {
//     const response = await axios.put(
//       `${process.env.REACT_APP_BASE_URL}${endPoint}`,
//       body,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           apiSecret: `${process.env.REACT_APP_API_SECRET}`,
//           Authorizations: "Bearer " + Cookies.get("token_")!,
//         },
//       }
//     );

//     return response.data;
//   } catch (err: any) {
//     throw new Error(err.response.data.msg);
//   }
// };

// export const getRequest = async (params: any, endPoint: any,lang?:any) => {
  
  

//   const expiration: any = Cookies.get("expiration");
//   if (+expiration < Date.now()) {
//     Cookies.remove("token_");
//     Cookies.remove("username");
//     Cookies.remove("expiration");
//     Cookies.remove("abotable_id");

//     window.location.href = "/";
//   }

//   const headers = {
//     Authorizations: "Bearer " + Cookies.get("token_")!,
//     apiSecret: `${process.env.REACT_APP_API_SECRET}`,
//     lang
//   };

//   try {
//     const response = axios
//       .get(`${process.env.REACT_APP_BASE_URL}${endPoint}`, { headers, params })
//       .then((response) => response.data);

//     return response;
//   } catch (err: any) {
//     throw new Error(err.response.data.msg);
//   }
// };

// export const deleteRequest = async (params: any, endPoint: any) => {
//   const expiration: any = Cookies.get("expiration");
//   if (+expiration < Date.now()) {
//     Cookies.remove("token_");
//     Cookies.remove("username");
//     Cookies.remove("expiration");
//     Cookies.remove("abotable_id");

//     window.location.href = "/";
//   }

//   const headers = {
//     Authorizations: "Bearer " + Cookies.get("token_")!,
//     apiSecret: `${process.env.REACT_APP_API_SECRET}`,
//   };

//   const response = axios
//     .delete(`${process.env.REACT_APP_BASE_URL}${endPoint}`, {
//       headers,
//     })
//     .then((response) => {
//       return response.data;
//     })
//     .catch((err) => {
//       throw new Error(err);
//     });

//   return response;
// };
