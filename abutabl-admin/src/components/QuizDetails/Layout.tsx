import { Box, Typography, Divider, TextField, Input } from "@mui/material";
import React, { useRef, useState } from "react";
import SelectBox from "../shared/SelectBox";
import SwitchBox from "../shared/SwitchBox";

const Layout = ({ formik }: any) => {
  // ----------- hooks ------------

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Layout
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
            <label className="text-sm font-semibold mb-1">
              Questions per page
            </label>
            <Input
              type="number"
              id="questions_per_page"
              onChange={formik.handleChange}
              value={formik.values.questions_per_page}
              name="questions_per_page"
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
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Navigation method
            </label>

            <SelectBox
              values={[
                {
                  label: "Free ",
                  value: "free",
                },
                {
                  label: "Submit First",
                  value: "submit_first",
                },
              ]}
              onChange={formik.handleChange}
              id="navigation_method"
              name="navigation_method"
              value={formik.values.navigation_method}
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
          Shuffle questions
        </Typography>
        <SwitchBox id={"shuffle_questions"} formik={formik} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
          pb: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Shuffle answers
        </Typography>
        <SwitchBox id={"shuffle_answers"} formik={formik} />
      </Box>
    </Box>
  );
};

export default Layout;
