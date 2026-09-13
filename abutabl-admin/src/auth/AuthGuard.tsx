import { useEffect } from "react";
import Cookies from "js-cookie";
import { Outlet } from "react-router-dom";
import { redirectToStudentLogin } from "../utils/studentAppUrl";

const AuthGuard = () => {
  const auth = Cookies.get("token_");

  useEffect(() => {
    if (!auth) {
      redirectToStudentLogin();
    }
  }, [auth]);

  if (!auth) {
    return null;
  }

  return <Outlet />;
};

export default AuthGuard;
