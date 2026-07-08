import { isTeacherUser } from "@/utils/authSession";
import { useLoginUser } from "@/hooks/useLoginUser";
import AdminDashboard from "./AdminDashboard";
import TeacherOverview from "./TeacherOverview";

const Dashboard = () => {
  const loginUser = useLoginUser();
  const isTeacher = isTeacherUser(loginUser);

  if (isTeacher) {
    return <TeacherOverview />;
  }

  return <AdminDashboard />;
};

export default Dashboard;
