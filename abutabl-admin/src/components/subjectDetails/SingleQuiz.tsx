import { Box, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import AddedQuestion from "../addAssignment/AddedQuestion";
import { useDispatch } from "react-redux";
import { QuizDetailsformSubject } from "@/redux/reducers/subjectsReducer";
import { useParams } from "react-router-dom";
import QuizView from "../QuizDetails/QuizView";

const SingleQuiz = () => {
  // ------------- hooks ------------
  const dispatch = useDispatch();
  const param = useParams();
  const [data, setData] = useState<any>({});

  // ------------ side effect ------------
  useEffect(() => {
    dispatch(QuizDetailsformSubject(param.id)).then((res: any) => {
      setData(res.payload);
    });
  }, []);

  // console.log(data.questions);
  
  return (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">{data?.quize?.[0]?.title_en}</Typography>{" "}
      </Box>
      <Grid container sx={{ my: 2, mr: 2 }} spacing={2}>
        <Grid
          item
          xs={11.7}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <QuizView formik={data.questions} />
        </Grid>
      </Grid>
    </div>
  );
};

export default SingleQuiz;
