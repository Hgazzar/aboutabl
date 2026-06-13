import { Box, Typography, Divider } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { selectBoxOptions } from "../../utils/functions";
import { getClassList } from "../../redux/reducers/classesReducer";
import { getGradeList } from "../../redux/reducers/gradeReducer";
import { getSchoolList } from "../../redux/reducers/schoolReducer";

type BasicInfoProps = {
  values: any;
  onChange: any;
};

const LevelInfo = ({ values, onChange }: BasicInfoProps) => {
  // -------------- hooks -------------
  const classState = useSelector(
    (state: RootState) => state?.classes?.classList?.classes
  );
  const gradeState = useSelector(
    (state: RootState) => state.grade?.gradeList?.grades
  );

  const dispatch = useDispatch();

  const schoolState = useSelector(
    (state: RootState) => state?.school?.schoolList?.schools?.data
  );

  // ------------- side effects --------------
  useEffect(() => {
    dispatch(getGradeList());
    dispatch(getSchoolList());
  }, []);

  useEffect(() => {
    dispatch(getClassList({ id: values.grade_id }));
  }, [values.grade_id]);

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Level information
      </Typography>{" "}
      <Divider />
      <Box sx={{ margin: "auto", px: 3 }}>
        <div className="flex flex-col gap-0 mb-4 mt-6 ">
          <label className="text-sm font-semibold mb-1 ">School </label>
          <SelectBox
            values={
              schoolState?.length > 0
                ? selectBoxOptions(schoolState, "name")
                : []
            }
            onChange={onChange}
            id="school_id"
            name="school_id"
            value={values.school_id}
          />
        </div>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          px: 3,
          pb: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Grade <span className="text-red">*</span>
            </label>
            <SelectBox
              values={
                gradeState?.length > 0
                  ? selectBoxOptions(gradeState, "name")
                  : []
              }
              onChange={onChange}
              id="grade_id"
              name="grade_id"
              value={values.grade_id}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Class <span className="text-red">*</span>
            </label>
            <SelectBox
              values={
                schoolState?.length > 0
                  ? selectBoxOptions(classState, "name")
                  : []
              }
              onChange={onChange}
              id="class_id"
              name="class_id"
              value={values.class_id}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default LevelInfo;
