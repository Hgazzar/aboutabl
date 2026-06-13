import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import Button from "../shared/Button";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  login,
  setLoginProcess,
  setUser,
} from "../../redux/reducers/loginReducer";
import axios from "axios";
import { RootState } from "../../redux/store";
import PasswordInput from "../shared/PasswordInput";
import { getPermissions } from "@/redux/reducers/permissionReducer";
import Cookies from "js-cookie";

const Signin = () => {
  // ----------- hooks -------------
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loginState = useSelector((state: RootState) => state.login);
  // console.log(loginState.user.id);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      remember: false,
    },
    validationSchema: Yup.object({
      username: Yup.string().required("Email is required"),
      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters long"),
    }),
    onSubmit: async (values) => {},
  });

  const userId = Cookies.get("abotable_id");

  // console.log(userId);

  // useEffect(()=>{
  //   if(userId){
  //     dispatch(getPermissions({id:userId}))
  //   }
  // },[userId])
  return (
    <Box
      sx={{
        width: "50%",
      }}
    >
      <img
        className="mb-20 self-start"
        src={require("../../assets/Logo.png")}
        alt="logo"
      />
      <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
        Welcome Back
      </Typography>
      <Typography component="p" sx={{ mb: 2, color: "#8E9AA0" }}>
        Login to manage your schools
      </Typography>
      <Box component="form" noValidate sx={{ mt: 1 }}>
        <div className="flex flex-col gap-0 mb-4">
          <label className="text-sm font-semibold mb-1">
            Username <span className="text-red">*</span>
          </label>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            id="username"
            onChange={formik.handleChange}
            value={formik.values.username}
            name="username"
            placeholder="Enter your username"
            sx={{ margin: 0, padding: 0 }}
          />
        </div>
        <div className="flex flex-col gap-0 mb-4">
          <label className="text-sm font-semibold mb-1">
            Password <span className="text-red">*</span>
          </label>
          <PasswordInput
            onChange={formik.handleChange}
            value={formik.values.password}
          />
        </div>
        <div className="flex flex-row justify-between items-center my-4">
          <FormControlLabel
            control={
              <Checkbox
                name="remember"
                color="primary"
                checked={formik.values.remember}
                onChange={formik.handleChange}
              />
            }
            label="Remember me"
            className="text-sm font-semibold"
          />

          <p
            onClick={() => {
              dispatch(setLoginProcess("forgetPassword"));
            }}
            className="text-sm font-semibold text-primary cursor-pointer"
          >
            Forget Password ?
          </p>
        </div>
        <Button
          label="Login"
          className="w-full"
          onClick={async () => {
            // إذا كنت تستخدم localStorage للتذكير، يمكنك تخزين قيمة هنا أيضًا
            if (formik.values.remember) {
              localStorage.setItem("remember", "true");
            } else {
              localStorage.removeItem("remember");
            }
            formik.handleSubmit();
            try {
              const result = await dispatch(login(formik.values)).unwrap();
              if (result?.redirected) {
                return;
              }
              navigate("/dashboard");
            } catch (error: any) {
              console.log(error);
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default Signin;
