import { useNavigate, useParams } from "react-router-dom";
import ClassesEmployee from "../../components/employeesDetails/ClassesEmployee";
import OverviewEmployee from "../../components/employeesDetails/OverviewEmployee";
import AvatarHeader from "../../components/shared/AvatarHeader";
import SubPageNav from "../../components/subjects/SubPageNav";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getEmployeeDetails,
  setEmployeeTap,
} from "../../redux/reducers/employeeReducer";
import { RootState } from "../../redux/store";
import Assignings from "../../components/employeesDetails/Assignings";

const EmployeeDetails = () => {
  // --------------- hooks -----------------
  const employeeState = useSelector((state: RootState) => state.employee);
  const [tap, setTap] = useState<string>(
    employeeState?.employeeTap || "Overview"
  );
  const param = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getEmployeeDetails(param.id));
    setTap("Overview")
  }, []);

  useEffect(() => {
    dispatch(setEmployeeTap(tap));
  }, [tap]);

  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsclasses = permissionState?.permissions?.classes;
  const viewclasses = permissionsclasses?.find((permission: any) => permission["view-classes"] === "1")

  return (
    <>
      <AvatarHeader
        img={employeeState?.employeeDetails?.photo}
        title={employeeState?.employeeDetails?.name}
        info={
          "Teacher ID: " + (employeeState?.employeeDetails?.memberShipID || "-")
        }    
        buttonLabel="Edit"
        icon={BorderColorOutlinedIcon}
        handleClick={() => navigate(`/user/employee/edit/${param.id}`)}
      />
      <SubPageNav
        allTaps={["Overview", viewclasses ? "Classes" : '', "Assignings"]}
        tap={tap}
        setTap={setTap}
      />
      {employeeState.employeeTap === "Overview" && (
        <OverviewEmployee data={employeeState?.employeeDetails} />
      )}
      {employeeState.employeeTap === "Classes" && (
        <ClassesEmployee schoolId={employeeState?.employeeDetails?.school_id} />
      )}
      {employeeState.employeeTap === "Assignings" && <Assignings />}
    </>
  );
};

export default EmployeeDetails;
