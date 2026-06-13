import { Box, Grid, Typography } from "@mui/material";
import React from "react";

type InfoCardProps = {
  title: string;
  value: any;
  md?: any;
  color?: any;
  icon?: any;
};

const IconInfoCard = ({
  title,
  value,
  md = 2.8,
  color,
  icon,
}: InfoCardProps) => {
  return (
    <Grid
      sx={{
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        p: 1,
        gap: 1,
        m: 0.5,
        border: "1px solid #091E4224",
      }}
      item
      xs={12}
      sm={6}
      md={md}
    >
      <Box sx={{ px: 1 }}>
        <img src={icon} alt="pie" />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "flex-start",
        }}
      >
        <Typography
          sx={{
            fontSize: "25px",
            fontWeight: 600,
            color: color ? color : "#004D34",
          }}
          variant="body1"
        >
          {value}
        </Typography>{" "}
        <Typography sx={{ color: "#000" }} variant="body1">
          {title}
        </Typography>{" "}
      </Box>
    </Grid>
  );
};

export default IconInfoCard;
