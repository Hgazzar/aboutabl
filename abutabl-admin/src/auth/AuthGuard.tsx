import Cookies from "js-cookie";
import { Navigate, Outlet } from "react-router-dom";

const AuthGuard = () => {
  var auth = Cookies.get("token_");

  return auth ? <Outlet /> : <Navigate to="/" />;
};
export default AuthGuard;
