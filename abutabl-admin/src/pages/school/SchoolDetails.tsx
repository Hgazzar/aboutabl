import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import AvatarHeader from "../../components/shared/AvatarHeader";
import SubPageNav from "../../components/subjects/SubPageNav";
import { useEffect, useState } from "react";
import OverviewList from "../../components/schools/OverviewList";
import SubjectList from "../../components/schools/SubjectList";
import GradeList from "../../components/schools/GradeList";
import EmployeeList from "../../components/schools/EmployeeList";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  getSchoolDetails,
  setSchoolTap,
  clearSchoolDetails,
} from "../../redux/reducers/schoolReducer";
import StudentList from "../../components/schools/StudentList";
import LoadingWrapper from "@/components/shared/LoadingWrapper";

const SchoolDetails = () => {

  const permissionState = useSelector((state: RootState) => state.permissions)
  const viewstudents = permissionState?.permissions?.students?.find((permission: any) => permission["view-students"] === "1")
  const viewgrades = permissionState?.permissions?.grades?.find((permission: any) => permission["view-grades"] === "1")
  const viewsubjects = permissionState?.permissions?.subjects?.find((permission: any) => permission["view-subjects"] === "1")
  const viewteachers = permissionState?.permissions?.teachers?.find((permission: any) => permission["view-teachers"] === "1")
  const editSchools = permissionState?.permissions?.schools?.find((permission: any) => permission["edit-schools"] === "1")
 
  const schoolState = useSelector((state: RootState) => state.school);
  const [tap, setTap] = useState<string>("Overview");
  const navigate = useNavigate();
  const param = useParams();
  const dispatch = useDispatch();
  const [rows, setRows] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ------------- side effects ---------------
  useEffect(() => {
    // Clear previous school data when school ID changes
    dispatch(clearSchoolDetails());
    setRows(null);
    
    (async () => {
      setIsLoading(true);
      await dispatch(getSchoolDetails(param.id));
      setIsLoading(false);
    })();
  }, [param.id]);

  useEffect(() => {
    setRows(schoolState?.schoolDetails?.overview);
  }, [schoolState?.schoolDetails]);

  // useEffect(() => {
  //   dispatch(setSchoolTap(tap));
  // }, [tap]);

  return (
    <>
      <LoadingWrapper isLoading={isLoading}>
        <AvatarHeader
          img={rows?.school_details?.logo}
          title={rows?.school_details?.name}
          info={rows?.school_details?.email}
          {...(editSchools && {
            buttonLabel: "Edit school info",
            icon: BorderColorOutlinedIcon,
            handleClick: () => navigate("/school/profile/edit/" + param.id),
          })}
        />
        <SubPageNav
          allTaps={[
            "Overview",
            viewsubjects ? "Subjects" : '',
            viewgrades ? "Grades & Classes" : '',
            viewteachers ? "School Employees" : '',
            viewstudents ? "Students" : '',
          ]}
          tap={tap}
          setTap={setTap}
        />
        {tap === "Overview" && <OverviewList data={rows} />}
        {tap === "Subjects" && viewsubjects && <SubjectList />}
        {tap === "Grades & Classes" && viewgrades && <GradeList />}
        {tap === "School Employees" && viewteachers && <EmployeeList />}
        {tap === "Students" && viewstudents && <StudentList />}
      </LoadingWrapper>
    </>
  );
};

export default SchoolDetails;
