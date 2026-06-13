import { Grid } from "@mui/material";
import AddedQuestion from "./AddedQuestion";

const ReviewComplete = ({ formik, score, questions }: any) => {
  // ----------- hooks ------------

  // ----------- functions --------------

  return (
    <>
      <Grid container sx={{ my: 2, mr: 2 }} spacing={2}>
        <Grid
          item
          xs={11.7}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <AddedQuestion formik={formik} score={score} questions={questions} />
        </Grid>
      </Grid>
    </>
  );
};

export default ReviewComplete;
