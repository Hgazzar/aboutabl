import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  clearStaffHandoffStorage,
  consumeStaffHandoff,
} from "../../utils/staffHandoff";
import { setUser } from "../../redux/reducers/loginReducer";
import { redirectToStudentLogin } from "../../utils/studentAppUrl";

/**
 * Admin `/` login UI is deprecated. Staff auth is the student SPA Welcome Back form.
 * Consumes hash handoff (Strict Mode–safe via admin sessionStorage), else redirects.
 */
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = consumeStaffHandoff();
    if (session) {
      dispatch(setUser(session.user));
      // Keep stash briefly so React Strict Mode remount can re-read it.
      navigate("/dashboard", { replace: true });
      window.setTimeout(() => clearStaffHandoffStorage(), 500);
      return;
    }
    setChecking(false);
    redirectToStudentLogin();
  }, [dispatch, navigate]);

  if (checking) {
    return null;
  }

  return null;
};

export default Login;
