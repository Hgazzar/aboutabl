import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getEffectiveLoginUser } from "@/utils/authSession";

export function useLoginUser() {
  const reduxUser = useSelector((state: RootState) => state.login.user);
  return getEffectiveLoginUser(reduxUser);
}
