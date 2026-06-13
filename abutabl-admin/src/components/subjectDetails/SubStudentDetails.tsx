import { useNavigate, useParams } from "react-router-dom";
import AvatarHeader from "../shared/AvatarHeader";
import SubPageNav from "../subjects/SubPageNav";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import OverviewStudent from "./OverviewStudent";
import StudentQuizzes from "./StudentQuizzes";
import Assignment from "./Assignment";

const StudentData = () => {
  // --------------- hooks -----------------
  const [tap, setTap] = useState<string>("Overview");
  const navigate = useNavigate();
  //   const param = useParams();
  //   const dispatch = useDispatch();
  //   const studentState = useSelector((state: RootState) => state.student);

  //   // ------------- side effects ---------------
  //   useEffect(() => {
  //     dispatch(getStudentDetails(param.id));
  //   }, []);

  return (
    <>
      <AvatarHeader
        img={require("../../assets/avatar.png")}
        title={"dyaaaa"}
        info={"Student ID: 1234 "}
        buttonLabel="Edit"
        icon={BorderColorOutlinedIcon}
        handleClick={() => navigate(`/user/student/edit/`)}
      />
      <SubPageNav
        allTaps={["Overview", "Quizzes", "Assignment"]}
        tap={tap}
        setTap={setTap}
      />
      {tap === "Overview" && <OverviewStudent />}
      {tap === "Quizzes" && <StudentQuizzes />}
      {tap === "Assignment" && <Assignment />}
    </>
  );
};

export default StudentData;
