import { Grid, Typography } from "@mui/material";
import React from "react";

type InfoCardProps = {
  title: string;
  value: string;
  md?: any;
};

const InfoCard = ({ title, value, md = 2.8 }: InfoCardProps) => {
  return (
    <Grid
      sx={{
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        alignItems: "flex-start",
        p: 2,
        border: "1px solid #091E4224",
      }}
      item
      xs={12}
      sm={6}
      md={md}
    >
      <Typography sx={{ color: "#8E9AA0" }} variant="body1">
        {title}
      </Typography>{" "}
      <Typography sx={{ fontWeight: 600 }} variant="body1">
        {value}
      </Typography>{" "}
    </Grid>
  );
};

export default InfoCard;
