import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { postRequest, buildUrl } from "../../utils/fetchMethods";
import { notify } from "../../utils/notify";
import {
  clearPersistedLoginUser,
  persistLoginUser,
} from "../../utils/authSession";
import { getPermissions } from "./permissionReducer";
import Cookies from "js-cookie";
import axios from "axios";

// ----------- redux thunk ----------
export const login: any = createAsyncThunk("login", async (body: any) => {
  function decodeToken(token: any) {
    // Assuming the token is a JWT (JSON Web Token)
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = atob(payloadBase64);
    return JSON.parse(decodedPayload);
  }

  try {
    const response: any = await axios.post(
      buildUrl(process.env.REACT_APP_BASE_URL, "/api/login"),
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          apiSecret: `${process.env.REACT_APP_API_SECRET}`,
          Authorizations: "Bearer " + (Cookies.get("token_") ?? ""),
        },
      }
    );

    if (!response.data?.status) {
      throw new Error(response?.data?.msg);
    }

    const payload = response.data;
    if (payload.portal === "student" && payload.user?.api_token) {
      const studentBase = (
        process.env.REACT_APP_STUDENT_APP_URL || "https://student.aboutabl.com"
      ).replace(/\/+$/, "");
      const tokenEnc = encodeURIComponent(payload.user.api_token);
      const remember = body.remember ? "1" : "0";
      window.location.replace(
        `${studentBase}/login/handoff#access_token=${tokenEnc}&remember=${remember}`
      );
      return { ...payload, redirected: true };
    }

    // Cookies.set("token_", response.data.user.api_token);
    // Cookies.set("username", response.data.user.username);
    // Cookies.set("abotable_id", response.data.user.id);
    // Cookies.set(
    //   "expiration",
    //   `${decodeToken(response.data.user.api_token).exp * 1000}`
    // );
    if (body.remember) {
      // إذا كانت "Remember me" مفعلة، اجعل الكوكيز صالحة مثلاً لمدة 7 أيام
      Cookies.set("token_", response.data.user.api_token, { expires: 7 });
      Cookies.set("username", response.data.user.username, { expires: 7 });
      Cookies.set("abotable_id", response.data.user.id, { expires: 7 });
      Cookies.set(
        "expiration",
        `${decodeToken(response.data.user.api_token).exp * 1000}`,
        { expires: 7 }
      );
    } else {
      // إذا لم تكن "Remember me" مفعلة، يتم حفظها ككوكيز جلسة (تنتهي عند إغلاق المتصفح)
      Cookies.set("token_", response.data.user.api_token);
      Cookies.set("username", response.data.user.username);
      Cookies.set("abotable_id", response.data.user.id);
      Cookies.set(
        "expiration",
        `${decodeToken(response.data.user.api_token).exp * 1000}`
      );
    }

    notify("Logged in successfully", "success");
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.msg ||
      error?.message ||
      "Login failed. Check your connection and try again.";
    notify(message, "error");
    throw new Error(message);
  }
});

export const resetPassword: any = createAsyncThunk(
  "resetPassword",
  async (body: any) => {
    try {
      const result = await postRequest(body, "/api/setPassword");

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export const sendEmailVerification: any = createAsyncThunk(
  "sendEmailVerification",
  async (body: any) => {
    try {
      const result = await postRequest(body, "/api/forgetPassword");

      if (!result.status) {
        throw new Error(result?.msg);
      }

      // console.log(result);

      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

// ------------ initial state -----------
export interface LoginState {
  user: any;
  loginProcess: "signIn" | "forgetPassword" | "resetPassword";
  verification_code: number | string;
}

const initialState: LoginState = {
  user: {},
  loginProcess: "signIn",
  verification_code: "",
};

// ------------ reducers ---------------
export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setLoginProcess: (state, action) => {
      state.loginProcess = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload?.id) {
        persistLoginUser(action.payload);
      } else {
        clearPersistedLoginUser();
      }
    },
    setVerificationCode: (state, action) => {
      state.verification_code = action.payload;
    },
  },
  extraReducers: {
    [login.fulfilled]: (state: any, { payload }) => {
      state.user = payload.user;
      persistLoginUser(payload.user);
    },
    [getPermissions.fulfilled]: (state: any, { payload }) => {
      if (!payload?.user?.id || state.user?.id) {
        return;
      }

      state.user = {
        ...payload.user,
        api_token: Cookies.get("token_"),
      };
      persistLoginUser(state.user);
    },
  },
});

// Action creators are generated for each case reducer function
export const { setLoginProcess, setUser, setVerificationCode } =
  loginSlice.actions;

export default loginSlice.reducer;
