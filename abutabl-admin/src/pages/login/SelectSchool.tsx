import React, { useState } from "react";
import { Container } from "@mui/material";
import Typography from "@mui/material/Typography";
import Button from "../../components/shared/Button";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";

const SelectSchool = () => {
  const [active, setActive] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Container
        sx={{
          p: "30px 20px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.04)",
          width: "40%",
          minWidth: "500px",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
          Hey Ahmed <span>👋</span>
        </Typography>
        <Typography component="p" sx={{ mb: 2, color: "#8E9AA0" }}>
          Nice to meet You! What school would you like to manage ?
        </Typography>
        <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
          Select School
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            m: "20px",
          }}
        >
          {[
            { id: 1, school: "school 1" },
            { id: 2, school: "school 2" },
          ].map((item, index) => {
            return (
              <div
                onClick={() => setActive(item.id)}
                key={item.id}
                className={`flex justify-center items-center border-2 cursor-pointer rounded-xl w-60 h-40 p-12 ${
                  active === item.id
                    ? "border-primary bg-veryLightprimary "
                    : "border-veryLightprimary hover:bg-veryLightGray"
                }`}
              >
                <div
                  className={`w-26 h-26  p-5 border-transparent rounded-full ${
                    active === item.id ? "bg-veryLightGray" : ""
                  }`}
                >
                  <img
                    src={require("../../assets/Schoollogo30.png")}
                    alt="login interface"
                  />
                </div>
              </div>
            );
          })}
        </Box>

        <Button
          className="w-24 self-end m-3"
          onClick={() => {
            navigate("/dashboard");
          }}
          label="Continue"
        />
      </Container>
    </Container>
  );
};

export default SelectSchool;
