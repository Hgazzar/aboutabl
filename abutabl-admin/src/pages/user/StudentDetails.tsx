import { useNavigate, useParams } from "react-router-dom";
import AvatarHeader from "../../components/shared/AvatarHeader";
import SubPageNav from "../../components/subjects/SubPageNav";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getStudentDetails } from "../../redux/reducers/studentReducer";
import OverviewStudent from "../../components/subjectDetails/OverviewStudent";
import ToDos from "../../components/employeesDetails/ToDos";

const StudentDetails = () => {
  // --------------- hooks -----------------
  const [tap, setTap] = useState<string>("Overview");
  const param = useParams();
  const dispatch = useDispatch();
  const studentState = useSelector((state: RootState) => state.student);
  const navigate = useNavigate();

  // ------------- side effects ---------------
  useEffect(() => {
    dispatch(getStudentDetails(param.id));
  }, []);

  // console.log(studentState);
  

  return (
    <>
      <AvatarHeader
        img={studentState?.studentDetails?.photo}
        title={
          studentState.studentDetails?.name_en +
          " " +
          studentState.studentDetails?.fatherNameEn
        }
        info={"Student ID: " + studentState.studentDetails?.memberShip}
        buttonLabel="Edit"
        icon={BorderColorOutlinedIcon}
        handleClick={() => navigate(`/user/student/edit/${param.id}`)}
      />
      <SubPageNav allTaps={["Overview", "To Do"]} tap={tap} setTap={setTap} />
      {tap === "Overview" && (
        <OverviewStudent data={studentState?.studentDetails} />
      )}
      {tap === "To Do" && <ToDos />}
    </>
  );
};

export default StudentDetails;
