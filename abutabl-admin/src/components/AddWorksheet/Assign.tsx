import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

type InfoProps = {
  values: any;
  onChange: any;
};

const Assign = ({ values, onChange }: InfoProps) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Assign For
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
            <label className="text-sm font-semibold mb-1">Grade</label>

            <SelectBox
              values={[
                {
                  label: "KG1",
                  value: "1",
                },
                {
                  label: "KG2",
                  value: "2",
                },
              ]}
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
              values={[
                {
                  label: "Class A ",
                  value: "1",
                },
                {
                  label: "Class B ",
                  value: "2",
                },
              ]}
              onChange={onChange}
              id="class_id"
              name="class_id"
              value={values.class_id}
            />
          </div>
        </Box>
      </Box>
      <Box>
        <div className="flex flex-col gap-0 mb-4 px-5">
          <label className="text-sm font-semibold mb-1 px-2">
            Class <span className="text-red">*</span>
          </label>
          <SelectBox
            values={[
              {
                label: "Class A ",
                value: "1",
              },
              {
                label: "Class B ",
                value: "2",
              },
            ]}
            onChange={onChange}
            id="class_id"
            name="class_id"
            value={values.class_id}
          />
        </div>
      </Box>
    </Box>
  );
};

export default Assign;
