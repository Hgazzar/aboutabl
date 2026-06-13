import React, { useState } from "react";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import "../../styles/login.css";
import Signin from "../../components/login/Signin";
import ForgetPassword from "@/components/login/ForgetPassword";
import ResetPassword from "../../components/login/ResetPassword";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const Login = () => {
  const loginState = useSelector((state: RootState) => state.login);

  return (
    <Grid
      container
      sx={{
        height: "100vh",
        backgroundColor: "#fff",
      }}
    >
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loginState.loginProcess === "signIn" && <Signin />}
        {loginState.loginProcess === "forgetPassword" && <ForgetPassword />}
        {loginState.loginProcess === "resetPassword" && <ResetPassword />}
      </Grid>
      <Grid item md={6} className="hidden md:block">
        <Box
          sx={{
            margin: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            className="login-img object-contain"
            src={require("../../assets/login.png")}
            alt="login interface"
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;
