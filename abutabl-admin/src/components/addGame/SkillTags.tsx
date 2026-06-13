import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
  skill: any;
};

const SkillTags = ({ formik, values, onChange, skill }: any) => {
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
            <label className="text-sm font-semibold mb-1">
              Enter Skill
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="skills_tags"
              onChange={onChange}
              value={values.skills_tags}
              name="skills_tags"
              sx={{ margin: 0, padding: 0 }}
            />
            <Divider sx={{ marginTop: "10px" }} />
            <Typography component={"p"} sx={{ fontSize: "16px", mt: 2 }}>
              Added skills
            </Typography>
            {skill?.skillsTags?.map((item: any) => {
              return (
                <p className="mt-2 w-fit flex justify-center  bg-grayDarkHoverd">
                  {item.name}
                </p>
              );
            })}
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default SkillTags;
