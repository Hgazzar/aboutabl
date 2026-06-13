import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import TextEditor from "../shared/TextEditor";
import "react-quill/dist/quill.snow.css"; // Import the styles
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import {
  getQuizDetails,
  getUnitsformSubject,
  lessonToUnitList,
} from "@/redux/reducers/subjectsReducer";
import { RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BasicInfo = ({ formik, quizInfo }: any) => {
  const param = useParams();
  const dispatch = useDispatch();
  const subjectUnitState = useSelector(
    (state: RootState) => state.subjects.units
  );
  const [lessonList, setLessonList] = useState([]);

  // ----------- hooks ------------
  // const [quizInfo, setQuizInfo] = useState<any>([]);
  // useEffect(() => {
  //   if (param.quizId) {
  //     dispatch(getQuizDetails(param.quizId))
  //       .unwrap()
  //       .then((result: any) => {
  //         // console.log(result);
  //         setQuizInfo(result.quize[0]);
  //       });
  //   }
  // }, [param.quizId]);
  useEffect(() => {
    // formik.setValues({
    //   ...formik.values,
    //   title_en: quizInfo.title_en,
    //   type_time: quizInfo?.type_time,
    //   time_limit: +quizInfo?.time_limit,

    //   subject_id: param.subjectId,
    // });
    dispatch(
      getUnitsformSubject({ data: { paginate: 10 }, id: param.subjectId })
    );
  }, []);

  useEffect(() => {
    if (formik.values.unit_id.toString().length) {
      dispatch(lessonToUnitList(formik.values.unit_id)).then((res: any) => {
        setLessonList(
          res.payload.lessons.map((item: any) => {
            return {
              label: item.name,
              value: item.id,
            };
          })
        );
      });
    }
  }, [formik.values.unit_id]);

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Basic information
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
          height: "300px",
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Quiz title <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="title_en"
              onChange={formik.handleChange}
              value={formik.values.title_en}
              name="title_en"
              placeholder="ex (Subtraction exersice)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 ">
            <label className="text-sm font-semibold mb-1">
              Quiz instructions
            </label>
            <TextEditor
              formik={formik}
              id={"instructions_en"}
              placeholder="Add your description ..."
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Unit</label>
            <SelectBox
              values={subjectUnitState?.units?.map((item: any) => {
                return {
                  label: item.name,
                  value: item.id,
                };
              })}
              onChange={formik.handleChange}
              id={`unit_id`}
              name={`unit_id`}
              value={formik.values.unit_id}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Lesson</label>
            <SelectBox
              values={lessonList}
              onChange={formik.handleChange}
              id={`lesson_id`}
              name={`lesson_id`}
              value={formik.values.lesson_id}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfo;
