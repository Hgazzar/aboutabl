import { useLocation } from "react-router-dom";
import { isTeacherUser } from "@/utils/authSession";
import { useLoginUser } from "@/hooks/useLoginUser";
import { DashboardLayout } from "./DashboardLayout";
import { TeacherLayout } from "./TeacherLayout";

const TEACHER_PORTAL_ROUTES = ["/dashboard", "/teacher/classes", "/teacher/settings"];

function isTeacherPortalRoute(pathname: string): boolean {
  return TEACHER_PORTAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export const PortalLayout = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const loginUser = useLoginUser();
  const { pathname } = useLocation();

  const isTeacher = isTeacherUser(loginUser);
  const useTeacherLayout = isTeacher && isTeacherPortalRoute(pathname);

  if (useTeacherLayout) {
    return <TeacherLayout>{children}</TeacherLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};
