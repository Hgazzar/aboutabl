import React, { Suspense, lazy, useEffect, useState } from "react";
import TopBarProgress from "./components/shared/TopBarProgress";
import { Navigate, Route, Routes } from "react-router-dom";
import { PortalLayout } from "./layout/PortalLayout";
import AuthGuard from "./auth/AuthGuard";
import PermissionGuard from "./auth/PermissionGuard";
import { ToastContainer } from "react-toastify";
import "./config/i18next";
import "react-toastify/dist/ReactToastify.css";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { getPermissions } from "./redux/reducers/permissionReducer";
import { setUser } from "./redux/reducers/loginReducer";
import { readPersistedLoginUser } from "./utils/authSession";
import Cookies from "js-cookie";
import NotFound from "./pages/NotFound/NotFound";
import { useTranslation } from "react-i18next";
import EditQuiz from "./components/QuizDetails/EditQuiz";
import { setupScormAPIHandler } from "./utils/scormProxy";

const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const ClassDetailsView = lazy(() => import("./pages/teacher/ClassDetailsView"));
const AssignmentDetailsView = lazy(
  () => import("./pages/teacher/AssignmentDetailsView")
);
const TeacherSettingsPlaceholder = lazy(
  () => import("./pages/teacher/TeacherSettingsPlaceholder")
);

const Login = lazy(() => import("./pages/login/Login"));
const SelectSchool = lazy(() => import("./pages/login/SelectSchool"));

const Students = lazy(() => import("./pages/user/Students"));
const StudentDetails = lazy(() => import("./pages/user/StudentDetails"));
const AddStudents = lazy(() => import("./pages/user/AddStudents"));
const EditStudent = lazy(() => import("./pages/user/EditStudent"));

const Grade = lazy(() => import("./pages/school/Grade"));
const AddGrade = lazy(() => import("./pages/school/AddGrade"));
const EditGrade = lazy(() => import("./pages/school/EditGrade"));
const Classes = lazy(() => import("./pages/school/Classes"));

const Employee = lazy(() => import("./pages/user/Employee"));
const AddEmployee = lazy(() => import("./pages/user/AddEmployee"));
const EditEmployee = lazy(() => import("./pages/user/EditEmployee"));
const EmployeeDetails = lazy(() => import("./pages/user/EmployeeDetails"));

const Roles = lazy(() => import("./pages/school/Roles"));
const AddRole = lazy(() => import("./pages/school/AddRole"));
const EditRole = lazy(() => import("./pages/school/EditRole"));

const Subjects = lazy(() => import("./pages/subjects/Subjects"));
const SingleSubject = lazy(() => import("./pages/subjects/SingleSubject"));
const AddSubject: any = lazy(() => import("./pages/subjects/AddSubject"));
const EditSubject = lazy(() => import("./pages/subjects/EditSubject"));
const QuizDetalis = lazy(() => import("./components/QuizDetails/QuizDetails"));
const QuizDetails = lazy(
  () => import("./components/subjectDetails/SingleQuiz")
);
const AddWorksheet = lazy(
  () => import("./components/AddWorksheet/AddWorksheet")
);
const EditWorksheet = lazy(
  () => import("./components/AddWorksheet/EditWorksheet")
);
const AddGame = lazy(() => import("././components/addGame/AddGame"));
const EditGame = lazy(() => import("././components/addGame/EditGame"));
const AddContent = lazy(
  () => import("././components/subjectDetails/AddContent")
);
const EditContent = lazy(
  () => import("././components/subjectDetails/EditContent")
);
const SubStudentDetails = lazy(
  () => import("././components/subjectDetails/SubStudentDetails")
);
const QuestionBank = lazy(() => import("./pages/subjects/QuestionBank"));
const AddQuestion = lazy(() => import("./pages/subjects/AddQuestion"));
const EditQuestion = lazy(() => import("./pages/subjects/EditQuestion"));

const Report = lazy(() => import("./pages/report/Reports"));

const Schools = lazy(() => import("./pages/school/Schools"));
const SchoolDetails = lazy(() => import("./pages/school/SchoolDetails"));
const AddSchool = lazy(() => import("./pages/school/AddSchool"));
const AddSchoolGrade = lazy(() => import("./pages/school/AddSchoolGrade"));
const AddSchoolEmployee = lazy(
  () => import("./pages/school/AddSchoolEmployee")
);
const AddSchoolStudent = lazy(() => import("./pages/school/AddSchoolStudent"));
const EditSchool = lazy(() => import("./pages/school/EditSchool"));
const SingleClasses = lazy(() => import("./pages/school/SingleClasses"));
const SchoolSubject = lazy(() => import("./pages/school/SchoolSubject"));
const Scorm = lazy(() => import("./components/subjectDetails/Scorm"));
const GameView = lazy(() => import("./components/addGame/GameView"));
const SheetView = lazy(() => import("./components/AddWorksheet/WorksheetView"));

const Tickets = lazy(() => import("./pages/ticketing/Tickets"));

const FileManagement = lazy(() => import("./pages/user/FileManagment"));
const Profile = lazy(() => import("./pages/profile/Profile"));

const GamesList = lazy(() => import("./pages/games/GamesList"));
const GamesWaiting = lazy(() => import("./pages/games/Waiting"));
const GamesStatistics = lazy(() => import("./pages/games/StatisticsList"));
const GamesFacts = lazy(() => import("./pages/games/Facts"));
const GamesStudentAnswers = lazy(
  () => import("./pages/games/StudentAnswerDetails")
);

function App() {
  const dispatch = useDispatch();
  const userId = Cookies.get("abotable_id");
  const loginState = useSelector((state: any) => state.login.user);
  
  // Set up SCORM API handler once when app loads
  useEffect(() => {
    setupScormAPIHandler();
  }, []);

  useEffect(() => {
    if (loginState?.id || !Cookies.get("token_")) {
      return;
    }

    const persisted = readPersistedLoginUser();
    if (persisted?.id) {
      dispatch(setUser(persisted));
    }
  }, [dispatch, loginState?.id]);
  
  useEffect(() => {
    if (userId) {
      dispatch(getPermissions({ id: userId }));
    }
  }, [userId, loginState.id]);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const permissionLoading = useSelector(
    (state: RootState) => state.permissions.loading
  );

  // console.log(permissionLoading,"loading");

  // quistions prermissions
  const viewQuistions = permissionState?.permissions?.questions?.find(
    (permission: any) => permission["view-questions"] === "1"
  );
  const addQuistions = permissionState?.permissions?.questions?.find(
    (permission: any) => permission["add-questions"] === "1"
  );
  const editQuistions = permissionState?.permissions?.questions?.find(
    (permission: any) => permission["edit-questions"] === "1"
  );

  // schools permissions

  const permissionsSchools = permissionState?.permissions?.schools;

  const editSchools = permissionsSchools?.find(
    (permission: any) => permission["edit-schools"] === "1"
  );
  const deleteSchools = permissionsSchools?.find(
    (permission: any) => permission["delete-schools"] === "1"
  );
  const addSchools = permissionsSchools?.find(
    (permission: any) => permission["add-schools"] === "1"
  );
  const viewSchools = permissionsSchools?.find(
    (permission: any) => permission["view-schools"] === "1"
  );
  const activationSchools = permissionsSchools?.find(
    (permission: any) => permission["activation-schools"] === "1"
  );

  // subjects permissions

  const permissionsSubjects = permissionState?.permissions?.subjects;

  const editSubjects = permissionsSubjects?.find(
    (permission: any) => permission["edit-subjects"] === "1"
  );
  const deleteSubjects = permissionsSubjects?.find(
    (permission: any) => permission["delete-subjects"] === "1"
  );
  const addSubjects = permissionsSubjects?.find(
    (permission: any) => permission["add-subjects"] === "1"
  );
  const viewSubjects = permissionsSubjects?.find(
    (permission: any) => permission["view-subjects"] === "1"
  );
  const activationSubjects = permissionsSubjects?.find(
    (permission: any) => permission["activation-subjects"] === "1"
  );

  // users permissions

  const permissionsUsers = permissionState?.permissions?.users;

  const editUsers = permissionsUsers?.find(
    (permission: any) => permission["edit-users"] === "1"
  );
  const deleteUsers = permissionsUsers?.find(
    (permission: any) => permission["delete-users"] === "1"
  );
  const addUsers = permissionsUsers?.find(
    (permission: any) => permission["add-users"] === "1"
  );
  const viewUsers = permissionsUsers?.find(
    (permission: any) => permission["view-users"] === "1"
  );
  const activationUsers = permissionsUsers?.find(
    (permission: any) => permission["activation-users"] === "1"
  );
  const exportUsers = permissionsUsers?.find(
    (permission: any) => permission["export-users"] === "1"
  );

  // grades permissions

  const permissionsGrades = permissionState?.permissions?.grades;

  const editGrades = permissionsGrades?.find(
    (permission: any) => permission["edit-grades"] === "1"
  );
  const deleteGrades = permissionsGrades?.find(
    (permission: any) => permission["delete-grades"] === "1"
  );
  const addGrades = permissionsGrades?.find(
    (permission: any) => permission["add-grades"] === "1"
  );
  const viewGrades = permissionsGrades?.find(
    (permission: any) => permission["view-grades"] === "1"
  );
  const activationGrades = permissionsGrades?.find(
    (permission: any) => permission["activation-grades"] === "1"
  );
  // students permissions

  const permissionsstudents = permissionState?.permissions?.students;

  const editstudents = permissionsstudents?.find(
    (permission: any) => permission["edit-students"] === "1"
  );
  const deletestudents = permissionsstudents?.find(
    (permission: any) => permission["delete-students"] === "1"
  );
  const addstudents = permissionsstudents?.find(
    (permission: any) => permission["add-students"] === "1"
  );
  const viewstudents = permissionsstudents?.find(
    (permission: any) => permission["view-students"] === "1"
  );
  const activationstudents = permissionsstudents?.find(
    (permission: any) => permission["activation-students"] === "1"
  );

  return (
    <div className="App bg-veryLightGray">
      <ToastContainer />
      <Suspense fallback={<TopBarProgress />}>
        <Routes>
          {/* auth routes  */}
          <Route index element={<Login />} />
          <Route path="select-school" element={<SelectSchool />} />
          <Route path="subjects/scorm/:scormId/:content" element={<Scorm />} />
          <Route path="subjects/GameView/:game_id" element={<GameView />} />
          <Route path="subjects/SheetView/:sheet_id" element={<SheetView />} />
          <Route
            path="/*"
            element={
              <PortalLayout>
                <AuthGuard />
              </PortalLayout>
            }
          >
            {/* dashboard routes  */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="teacher/classes" element={<ClassDetailsView />} />
            <Route
              path="teacher/classes/:classId/assignments/:assignmentId"
              element={<AssignmentDetailsView />}
            />
            <Route path="teacher/classes/:classId/:tab?" element={<ClassDetailsView />} />
            <Route path="teacher/settings" element={<TeacherSettingsPlaceholder />} />
            <Route path="profile" element={<Profile />} />

            <Route path="games" element={<GamesList />} />
            <Route path="games/:id/waiting" element={<GamesWaiting />} />
            <Route path="games/:id/statistics" element={<GamesStatistics />} />
            <Route path="games/:id/facts" element={<GamesFacts />} />
            <Route
              path="games/:id/students/:studentId"
              element={<GamesStudentAnswers />}
            />

            {/* school routes  */}
            <Route
              path="school/profile"
              element={
                <PermissionGuard module="schools" required="view-schools">
                  <Schools />
                </PermissionGuard>
              }
            />
            <Route
              path="school/profile/add-school"
              element={
                <PermissionGuard module="schools" required="add-schools">
                  <AddSchool />
                </PermissionGuard>
              }
            />
            <Route
              path="school/profile/edit/:id"
              element={
                <PermissionGuard module="schools" required="edit-schools">
                  <EditSchool />
                </PermissionGuard>
              }
            />
            <Route
              path="school/profile/:id"
              element={
                <PermissionGuard module="schools" required="view-schools">
                  <SchoolDetails />
                </PermissionGuard>
              }
            />
            <Route
              path="school/add-grade/:id"
              element={
                <PermissionGuard module="grades" required="add-grades">
                  <AddSchoolGrade />
                </PermissionGuard>
              }
            />
            <Route
              path="school/edit/:id"
              element={
                <PermissionGuard module="grades" required="edit-grades">
                  <EditGrade />
                </PermissionGuard>
              }
            />

            <Route
              path="school/add-employee/:id"
              element={
                <PermissionGuard module="teachers" required="add-teachers">
                  <AddSchoolEmployee />
                </PermissionGuard>
              }
            />
            <Route
              path="school/add-student/:id"
              element={
                <PermissionGuard module="students" required="add-students">
                  <AddSchoolStudent />
                </PermissionGuard>
              }
            />

            <Route
              path="school/grade"
              element={
                <PermissionGuard module="grades" required="view-grades">
                  <Grade />
                </PermissionGuard>
              }
            />
            <Route
              path="school/grade/add-grade"
              element={
                <PermissionGuard module="grades" required="add-grades">
                  <AddGrade />
                </PermissionGuard>
              }
            />
            <Route
              path="school/grade/edit/:id"
              element={
                <PermissionGuard module="grades" required="edit-grades">
                  <EditGrade />
                </PermissionGuard>
              }
            />
            <Route
              path="school/grade/:id"
              element={
                <PermissionGuard module="grades" required="view-grades">
                  <Classes />
                </PermissionGuard>
              }
            />
            <Route
              path="school/grade/classes/:id"
              element={
                <PermissionGuard module="grades" required="view-grades">
                  <SingleClasses />
                </PermissionGuard>
              }
            />
            <Route
              path="school/subject/:id"
              element={
                <PermissionGuard module="subjects" required="view-subjects">
                  <SchoolSubject />
                </PermissionGuard>
              }
            />

            <Route
              path="roles"
              element={
                <PermissionGuard module="roles" required="view-roles">
                  <Roles />
                </PermissionGuard>
              }
            />
            <Route
              path="roles/add-role"
              element={
                <PermissionGuard module="roles" required="add-roles">
                  <AddRole />
                </PermissionGuard>
              }
            />
            <Route
              path="roles/edit/:id"
              element={
                <PermissionGuard module="roles" required="edit-roles">
                  <EditRole />
                </PermissionGuard>
              }
            />

            {/* subjects routes  */}

            <Route
              path="subjects/list"
              element={
                <PermissionGuard module="subjects" required="view-subjects">
                  <Subjects />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/add-subject"
              element={
                <PermissionGuard module="subjects" required="add-subjects">
                  <AddSubject />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/edit/:id"
              element={
                <PermissionGuard module="subjects" required="edit-subjects">
                  <EditSubject />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/:id"
              element={
                <PermissionGuard module="subjects" required="view-subjects">
                  <SingleSubject />
                </PermissionGuard>
              }
            />

            <Route
              path="question-bank"
              element={
                <PermissionGuard module="questions" required="view-questions">
                  <QuestionBank />
                </PermissionGuard>
              }
            />
            <Route
              path="question-bank/add-question"
              element={
                <PermissionGuard module="questions" required="add-questions">
                  <AddQuestion />
                </PermissionGuard>
              }
            />
            <Route
              path="question-bank/edit/:id"
              element={
                <PermissionGuard module="questions" required="edit-questions">
                  <EditQuestion />
                </PermissionGuard>
              }
            />

            <Route
              path="subjects/add-worksheet/:subject_id"
              element={
                <PermissionGuard module="worksheets" required="add-worksheets">
                  <AddWorksheet />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/edit-worksheet/:subject_id/:sheet_id"
              element={
                <PermissionGuard module="worksheets" required="edit-worksheets">
                  <EditWorksheet />
                </PermissionGuard>
              }
            />
            <Route
              path="subject/add-game/:subject_id"
              element={
                <PermissionGuard module="games" required="add-games">
                  <AddGame />
                </PermissionGuard>
              }
            />
            <Route
              path="subject/edit-game/:subject_id/:game_id"
              element={
                <PermissionGuard module="games" required="edit-games">
                  <EditGame />
                </PermissionGuard>
              }
            />
            <Route
              path={`subjects/add-content/:id`}
              element={
                <PermissionGuard module="contents" required="add-contents">
                  <AddContent />
                </PermissionGuard>
              }
            />
            <Route
              path={`subjects/Edit-content/:id/:id`}
              element={
                <PermissionGuard module="contents" required="edit-contents">
                  <EditContent />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/student-details"
              element={
                <PermissionGuard module="students" required="view-students">
                  <SubStudentDetails />
                </PermissionGuard>
              }
            />

            <Route
              path="subjects/quiz/:id"
              element={
                <PermissionGuard module="quizes" required="view-quizes">
                  <QuizDetails />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/:subjectId/add-quiz"
              element={
                <PermissionGuard module="quizes" required="add-quizes">
                  <QuizDetalis />
                </PermissionGuard>
              }
            />
            <Route
              path="subjects/:subjectId/edit-quiz/:quizId"
              element={
                <PermissionGuard module="quizes" required="edit-quizes">
                  <EditQuiz />
                </PermissionGuard>
              }
            />

            {/* report routes  */}
            <Route
              path="report/list"
              element={
                <PermissionGuard module="reports" required="view-reports">
                  <Report />
                </PermissionGuard>
              }
            />

            {/* file management routes  */}
            <Route
              path="file-management"
              element={
                <PermissionGuard
                  module="file_managers"
                  required="view-file_managers"
                >
                  <FileManagement />
                </PermissionGuard>
              }
            />

            {/* user routes  */}

            <Route
              path="user/employee"
              element={
                <PermissionGuard module="users" required="view-users">
                  <Employee />
                </PermissionGuard>
              }
            />
            <Route
              path="user/employee/add-employee"
              element={
                <PermissionGuard module="users" required="add-users">
                  <AddEmployee />
                </PermissionGuard>
              }
            />
            <Route
              path="user/employee/view/:id"
              element={
                <PermissionGuard module="users" required="view-users">
                  <EmployeeDetails />
                </PermissionGuard>
              }
            />
            <Route
              path="user/employee/edit/:id"
              element={
                <PermissionGuard module="users" required="edit-users">
                  <EditEmployee />
                </PermissionGuard>
              }
            />
            <Route
              path="user/student"
              element={
                <PermissionGuard module="students" required="view-students">
                  <Students />
                </PermissionGuard>
              }
            />
            <Route
              path="user/student/add-student"
              element={
                <PermissionGuard module="students" required="add-students">
                  <AddStudents />
                </PermissionGuard>
              }
            />
            <Route
              path="user/student/view/:id"
              element={
                <PermissionGuard module="students" required="view-students">
                  <StudentDetails />
                </PermissionGuard>
              }
            />
            <Route
              path="user/student/edit/:id"
              element={
                <PermissionGuard module="students" required="edit-students">
                  <EditStudent />
                </PermissionGuard>
              }
            />

            {/* tickets routes  */}
            <Route
              path="tickets/list"
              element={
                <PermissionGuard module="tickets" required="view-tickets">
                  <Tickets />
                </PermissionGuard>
              }
            />
            {permissionState && !permissionLoading && (
              <Route path="*" element={<NotFound />} />
            )}
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
