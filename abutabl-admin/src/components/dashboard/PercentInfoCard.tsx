import { Box, Grid, Typography } from "@mui/material";
import React from "react";
import { PieChart, Pie } from "recharts";

type InfoCardProps = {
  title: string;
  value: any;
  md?: any;
  color?: any;
};

const data01 = [
  {
    name: "Group A",
    value: 30,
  },
  {
    name: "Group B",
    value: 70,
  },
];

const PercentInfoCard = ({ title, value, md = 2.8, color }: InfoCardProps) => {
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
      <Box>
        <PieChart width={70} height={70}>
          <Pie
            data={data01}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={30}
            fill={color ? color : "#82ca9d"}
          />
        </PieChart>
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

export default PercentInfoCard;
