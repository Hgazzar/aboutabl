import { Box, Typography, Divider, TextField, Input } from "@mui/material";
import React, { useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import SwitchBox from "../shared/SwitchBox";

const Score = ({ formik }: any) => {
  // ----------- hooks ------------

  // ----------- functions ------------
  const handleScoreChange = (e: any) => {
    if (e.target.value >= 0) {
      formik.setFieldValue("score_to_pass", e.target.value);
    }
  };

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Score
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
            <label className="text-sm font-semibold mb-1">Score method</label>

            <SelectBox
              values={[
                {
                  label: "Points",
                  value: "points",
                },
                {
                  label: "Percentage",
                  value: "percentage",
                },
              ]}
              onChange={formik.handleChange}
              id="score_method"
              name="score_method"
              value={formik.values.score_method}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Score to pass <span className="text-red">*</span>
            </label>
            <Input
              type="number"
              id="score_to_pass"
              onChange={handleScoreChange}
              value={formik.values.score_to_pass}
              name="score_to_pass"
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
            />
          </div>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Unlimited attempts
        </Typography>{" "}
        <SwitchBox id={"unlimited_attempts"} formik={formik} />
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          px: 3,
        }}
      >
        {!formik.values.unlimited_attempts && (
          <div className="flex flex-col gap-0 mb-4 w-full ">
            <label className="text-sm font-semibold mb-1">
              Attempts allowed
            </label>
            <Input
              type="number"
              id="num_attempts"
              onChange={formik.handleChange}
              value={formik.values.num_attempts}
              name="num_attempts"
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
            />
          </div>
        )}
      </Box>
    </Box>
  );
};

export default Score;
