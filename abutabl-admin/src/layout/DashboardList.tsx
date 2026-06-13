import { SvgIcon } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GroupIcon from "@mui/icons-material/Group";
import PieChartIcon from "@mui/icons-material/PieChart";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import GTranslateIcon from "@mui/icons-material/GTranslate";
import AccountCircleSharpIcon from "@mui/icons-material/AccountCircleSharp";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import SettingsIcon from "@mui/icons-material/Settings";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";




const DashboardList = () => {
  const a:any = "a"
  const permissionState = useSelector((state: RootState) => state.permissions)

  const viewQuistions = permissionState?.permissions?.questions?.find((permission:any) => permission['view-questions'] === "1")
  const viewSchools = permissionState?.permissions?.schools?.find((permission:any) => permission['view-schools'] === "1")
  const viewSubjects = permissionState?.permissions?.subjects?.find((permission:any) => permission['view-subjects'] === "1")
  const viewUsers = permissionState?.permissions?.users?.find((permission:any) => permission['view-users'] === "1")
  const viewtickets = permissionState?.permissions?.tickets?.find((permission:any) => permission['view-tickets'] === "1")
  const viewreports = permissionState?.permissions?.reports?.find((permission:any) => permission['view-reports'] === "1")
  
  

 const items = [
  {
    external: false,
    disabled: false,
    menu: false,
    title: "Dashboard",
    path: "/dashboard",
    module: "dashboard",
    icon: (
      <SvgIcon fontSize="small">
        <HomeIcon />
      </SvgIcon>
    ),
    supPages: [
      { title: "sup page 1", path: "/any" },
      { title: "sup page 1", path: "/any" },
    ],
  },
  viewSchools ?
  {
    external: false,
    disabled: false,
    menu: false,
    title: "School control panal",
    path: "/school/profile",
    module: "school",
    icon: (
      <SvgIcon fontSize="small">
        <SchoolIcon />
      </SvgIcon>
    ),
    supPages: [
      { title: "School profile", path: "/school/profile", page: "profile" },
      { title: "Grades & classes", path: "/school/grade", page: "grade" },
      { title: "Manage roles", path: "/school/roles", page: "roles" },
    ],
  }
  :
  ""
  ,
  viewSubjects ?
  {
    external: false,
    disabled: false,
    menu: false,
    title: "Subjects",
    path: "/subjects/list",
    module: "subjects",
    icon: (
      <SvgIcon fontSize="small">
        <MenuBookIcon />
      </SvgIcon>
    ),

    supPages: [
      { title: "Subjects", path: "/subjects/list", page: "list" },
      {
        title: "Question Bank",
        path: "/subjects/question-bank",
        page: "question-bank",
      },
    ],
  }
  :
  ''
  ,

  (viewQuistions) ?

  {
    external: false,
    disabled: false,
    menu: false,
    title: "Question bank",
    path: "/question-bank",
    module: "question-bank",
    icon: (
      <SvgIcon fontSize="small">
        <LiveHelpIcon />
      </SvgIcon>
    ),

    supPages: [
      { title: "question bank", path: "/question-bank", page: "list" },
      {
        title: "Question Bank",
        path: "/subjects/question-bank",
        page: "question-bank",
      },
    ],
  }
  :
  ''
  ,
  viewUsers ?
  {
    external: false,
    disabled: false,
    menu: false,
    title: "User",
    path: "/user/employee",
    module: "user",
    icon: (
      <SvgIcon fontSize="small">
        <GroupIcon />
      </SvgIcon>
    ),

    supPages: [
      { title: "Employee", path: "/user/employee", page: "employee" },
      { title: "Student", path: "/user/student", page: "student" },
    ],
  }
  :
  ''
  ,
  viewreports ?
  {
    external: false,
    disabled: false,
    menu: false,
    title: "Reports",
    path: "/report/list",
    module: "report",
    supPages: [{ title: "Report", path: "/report/list", page: "list" }],
    icon: (
      <SvgIcon fontSize="small">
        <PieChartIcon />
      </SvgIcon>
    ),
  }: '',
  viewtickets ?
  {
    external: false,
    disabled: false,
    menu: false,
    title: "Tickets",
    module: "tickets",
    path: "/tickets/list",
    supPages: [{ title: "Tickets", path: "/tickets/list", page: "list" }],
    icon: (
      <SvgIcon fontSize="small">
        <QuestionAnswerIcon />
      </SvgIcon>
    ),
  } : '',
  (permissionState?.permissions?.roles?.find((permission:any) => permission['view-roles'] === "1")) ?

  {
    external: false,
    disabled: false,
    menu: false,
    title: "Roles",
    path: "/roles",
    module: "roles",
    supPages: [{ title: "roles", path: "/roles", page: "list" }],
    icon: (
      <SvgIcon fontSize="small">
        <SettingsIcon />
      </SvgIcon>
    ),
  }
  : ''
  , 

  (permissionState?.permissions?.file_managers?.find((permission:any) => permission['view-file_managers'] === "1")) ?
    {
      external: false,
      disabled: false,
      menu: false,
      title: "File Management",
      path: "/file-management",
      module: "file-management",
      supPages: [{ title: "roles", path: "/roles", page: "list" }],
      icon: (
        <SvgIcon fontSize="small">
          <FileUploadIcon />
        </SvgIcon>
      ),
    }
    :""
    ,
  {
    external: false,
    disabled: false,
    menu: false,
    title: "Live games",
    path: "/games",
    module: "games",
    icon: (
      <SvgIcon fontSize="small">
        <SportsEsportsIcon />
      </SvgIcon>
    ),
    supPages: [],
  },
];

 const settingItems = [
  {
    external: false,
    disabled: false,
    menu: false,
    title: "language",
    icon: (
      <SvgIcon fontSize="small">
        <GTranslateIcon />
      </SvgIcon>
    ),
  },
  {
    external: false,
    disabled: false,
    menu: false,
    title: "Settings",
    path: "/profile",
    module: "settings",
    icon: (
      <SvgIcon fontSize="small">
        <AccountCircleSharpIcon />
      </SvgIcon>
    ),
  },
];

  return {items,settingItems}
}

export default DashboardList
