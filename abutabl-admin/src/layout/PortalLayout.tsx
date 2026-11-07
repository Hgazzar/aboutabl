import { isTeacherUser } from "@/utils/authSession";
import { useLoginUser } from "@/hooks/useLoginUser";
import { DashboardLayout } from "./DashboardLayout";
import { TeacherLayout } from "./TeacherLayout";

/**
 * Teachers always use TeacherLayout (Overview / Classes / Settings).
 * Admin SideNav is admin-only — never show it for teacher sessions,
 * including deep links like /teacher/classes/... or bare "/" redirects.
 */
export const PortalLayout = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const loginUser = useLoginUser();

  if (isTeacherUser(loginUser)) {
    return <TeacherLayout>{children}</TeacherLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};
