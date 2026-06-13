import React from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "../shared/Button";
import Box from "@mui/material/Box";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  resetPassword,
  setLoginProcess,
} from "../../redux/reducers/loginReducer";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PasswordInput from "../shared/PasswordInput";
import { notify } from "@/utils/notify";

interface SigninProps {}

const ResetPassword = ({}: SigninProps) => {
  // ----------- hooks -------------
  const loginState = useSelector((state: RootState) => state.login);
  const formik = useFormik({
    initialValues: {
      new_password: "",
      confirm_new_password: "",
    },
    validationSchema: Yup.object({
      new_password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters long"),
      confirm_new_password: Yup.string()
        .required("Confirm Password is required")
        .oneOf([Yup.ref("new_password")], "Passwords must match"),
    }),
    onSubmit: async (values) => {
      // console.log(values);
    },
  });
  // const navigate = useNavigate();
  const dispatch = useDispatch();
  // const [showPassword, setShowPassword] = React.useState(false);
  // ------------- functions -------------
  // const resetPassword = async () => {
  //   try {
  //     const response = await fetch(
  //       `${process.env.REACT_APP_BASE_URL}/api/setPassword`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           apiSecret: `${process.env.REACT_APP_API_SECRET}`,
  //         },
  //         body: JSON.stringify({
  //           ...formik.values,
  //           verification_code: loginState.verification_code,
  //         }),
  //       }
  //     );
  //     const data = await response.json();
  //     if (data.status) {
  //       navigate("/");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

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
        Reset password
      </Typography>
      <Typography component="p" sx={{ mb: 2, color: "#8E9AA0" }}>
        Enter strong passoword to use in the futuer
      </Typography>
      <Box component="form" noValidate sx={{ mt: 1 }}>
        <form>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              New Password <span className="text-red">*</span>
            </label>
            <PasswordInput
              onChange={formik.handleChange}
              value={formik.values.new_password}
              id="new_password"
              name="new_password"
            />

            {formik.touched.new_password && formik.errors.new_password ? (
              <div className="error text-red font-semibold text-sm">
                {formik.errors.new_password}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Confirm Password <span className="text-red">*</span>
            </label>

            <PasswordInput
              onChange={formik.handleChange}
              value={formik.values.confirm_new_password}
              id="confirm_new_password"
              name="confirm_new_password"
            />

            {formik.touched.confirm_new_password &&
            formik.errors.confirm_new_password ? (
              <div className="error text-red font-semibold text-sm">
                {formik.errors.confirm_new_password}
              </div>
            ) : null}
          </div>
          <Button
            onClick={async () => {
              
              if (
                formik.values.new_password !==
                formik.values.confirm_new_password
              ) {
                notify("Password and confirm password doesn't match!");
                return;
              }
              try {
                await dispatch(
                  resetPassword({
                    ...formik.values,
                    verification_code: loginState.verification_code,
                  })
                ).unwrap();

                dispatch(setLoginProcess("signIn"));
              } catch (error) {
                console.log(error);
              }
            }}
            className="w-full"
            label="Submit"
          />
        </form>
      </Box>
    </Box>
  );
};

export default ResetPassword;
