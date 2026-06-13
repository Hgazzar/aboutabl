import { Box, Typography, Divider } from "@mui/material";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import SubPageNav from "../subjects/SubPageNav";
import ExLink from "./ExternalLink";
import Button from "../shared/Button";
import DeleteIcon from "@mui/icons-material/Delete";

const Resources = ({ links, setLinks }: any) => {
  // ----------- hooks ------------
  const [tap, setTap] = useState<string>("External link");

  // ----------- functions --------------

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Resources
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          mx: 2,
          mt: 2,
          pt: 3,
          gap: 3,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
          borderBottom: "unset",
        }}
      >
        <SubPageNav allTaps={["External link"]} tap={tap} setTap={setTap} />
      </Box>
      <Box
        sx={{
          p: 3,
          gap: 3,
          mx: 2,
          mb: 2,
          bgcolor: "#fff",
          border: "1px solid #091E4224",
          borderTop: "unset",
        }}
      >
        <ExLink setLinks={setLinks} />
      </Box>
      <Box>
        <Typography
          component={"p"}
          sx={{ fontSize: "18px", fontWeight: "600", mx: 3, mb: 2 }}
        >
          Upload resources
        </Typography>
        {links.map((link: any) => {
          return (
            <Box
              key={link?.id}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
                mx: 3,
                mb: 3,
                bgcolor: "#fff",
                border: "1px solid #091E4224",
              }}
            >
              <Typography>
                {" "}
                <div className="flex flex-row">
                  {" "}
                  <img
                    className="w-10 h-10"
                    src={require("../../assets/book-gray.png")}
                    alt="bookmark"
                  />
                  <div className="flex flex-col pl-2">
                    <p className="font-semibold text-md"> {link?.name}</p>
                    <p className="text-gray text-sm">{link?.size} Mb</p>
                  </div>
                </div>
              </Typography>{" "}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Button
                  icon={DeleteIcon}
                  label="Delete"
                  type="danger"
                  onClick={() => {
                    setLinks(links.filter((item: any) => item.id !== link.id));
                  }}
                  className="w-30 m-3 red"
                />
                {/*
            <Button
              icon={VisibilityIcon}
              label="View"
              type="bordered"
              className="w-30 m-3"
            /> */}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Resources;
