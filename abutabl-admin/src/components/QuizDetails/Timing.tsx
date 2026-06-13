import { Box, Typography, Divider, Input, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import MuiDatePicker from "../shared/MuiDatePicker";
import { useEffect } from "react";

const Timing = ({ formik }: any) => {
  // ----------- hooks ------------
  // useEffect(() => {
  //   formik.setValues({
  //     ...formik.values,
  //     type_time: quizInfo?.type_time,
  //   });
  // }, [quizInfo]);
  // ----------- functions --------------

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Timing
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1"> Start date</label>
            <MuiDatePicker id={"start_date"} formik={formik} />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Time type</label>

            <SelectBox
              values={[
                {
                  label: "Minutes",
                  value: "minutes",
                },
                {
                  label: "Hours ",
                  value: "hours",
                },
              ]}
              onChange={formik.handleChange}
              id="type_time"
              name="type_time"
              value={formik.values.type_time}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Time limit</label>

            {/* <Input
              type="number"
              id="time_limit"
              name="time_limit"
              value={formik.values.time_limit}
              onChange={formik.handleChange}
              sx={{
                border: "1px solid #091E4224",
                p: 0.5,
                borderRadius: 1,
                outline: "0px",
                "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                  appearance: "none",
                  margin: 0,
                },
                "-moz-appearance": "textfield", // For Firefox
              }}
              size="medium"
            /> */}
            <TextField
              fullWidth
              type="number"
              id="time_limit"
              name="time_limit"
              placeholder={"[1-100]"}
              value={formik.values.time_limit}
              onChange={formik.handleChange}
              InputProps={{ inputProps: { min: 0 } }}
              sx={{
                border: "1px solid #091E4224",
                p: 0,
                borderRadius: 1,
                outline: "0px",
                "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                  appearance: "none",
                  margin: 0,
                },
                "-moz-appearance": "textfield", // For Firefox
              }}
              size="medium"
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1"> Due date</label>
            <MuiDatePicker id={"due_date"} formik={formik} />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">When time end</label>
            <SelectBox
              values={[
                {
                  label: "open attempts are submitted automatically",
                  value: "open attempts are submitted automatically",
                },
                {
                  label:
                    "there is a grace period when open attempts can be submitted. but no more question answared",
                  value:
                    "there is a grace period when open attempts can be submitted. but no more question answared",
                },
                {
                  label:
                    "attempts must be submitted before time expires. or they are not counted",
                  value:
                    "attempts must be submitted before time expires. or they are not counted",
                },
              ]}
              onChange={formik.handleChange}
              id="do_when_time_end"
              name="do_when_time_end"
              value={formik.values.do_when_time_end}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default Timing;
