import { Box } from "@mui/material";
import React from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const Steps = ({ steps, stepNumber }: any) => {
  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        px: 5,
        borderBottom: "1px solid #091E4224",
        "&::before": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          width: `${(stepNumber / steps.length) * 100 + 2}%`,
          height: "3px",
          background: "#1EBBA3",
        },
      }}
    >
      {steps.map((item: any, index: number) => {
        return (
          <div key={index}>
            <div
              className={`font-semibold flex flex-row gap-2 items-center px-2 py-3 ${
                stepNumber > index ? "text-primary" : "text-gray"
              }`}
            >
              {stepNumber > index ? (
                <CheckCircleRoundedIcon />
              ) : (
                <span className="border rounded-full w-5 h-5 flex justify-center items-center">
                  {index + 1}
                </span>
              )}
              <p>{item}</p>
            </div>
            {index !== steps.length - 1 && (
              <span
                className={`border h-0 w-20 my-auto ${
                  stepNumber > index ? "text-primary" : "text-gray"
                }`}
              ></span>
            )}
          </div>
        );
      })}
    </Box>
  );
};

export default Steps;
