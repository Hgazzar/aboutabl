import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

/**
 * Redirects to the current user's edit-employee (account details) page.
 */
const AccountRedirect = () => {
  const userId = Cookies.get("abotable_id");
  if (!userId) return <Navigate to="/dashboard" replace />;
  return <Navigate to={`/user/employee/edit/${userId}`} replace />;
};

export default AccountRedirect;
