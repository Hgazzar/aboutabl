import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const SkillTags = ({ formik, values, onChange }: InfoProps) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Skill Tags
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
        <Box sx={{ width: "100%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Enter Skill</label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="skill_id"
              onChange={onChange}
              value={values.skill_id}
              name="skill_id"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
      <Divider />
      <Box
        sx={{
          p: 3,
          gap: 3,
        }}
      >
        <Typography sx={{ fontSize: "16px", fontWeight: "600", m: 3 }}>
          {" "}
          Added Skills
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            p: 3,
            gap: 3,
          }}
        >
          <p className="text-m p-1 bg-lightGray w-20 "> Skill name </p>
          <p className="text-m p-1 bg-lightGray w-20 "> Skill name </p>
        </Box>
      </Box>
    </Box>
  );
};

export default SkillTags;
