import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import Button from "../../components/shared/Button";

type AvatarHeaderProps = {
  img?: string;
  title: string;
  info: string;
  buttonLabel?: string;
  icon?: any;
  handleClick?: any;
};

const AvatarHeader = ({
  img,
  title,
  info,
  buttonLabel,
  icon,
  handleClick,
}: AvatarHeaderProps) => {
  const [imageError, setImageError] = useState(false);
  const defaultLogo = require("../../assets/Logo.png");
  
  // Check if image URL is valid (not empty, not just a directory path)
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // Check if URL ends with just /storage/ or similar directory paths
    if (url.endsWith('/storage/') || url.endsWith('/storage') || url.trim() === '') {
      return false;
    }
    // Check if URL has a file extension or contains a filename
    const hasFilename = url.split('/').pop()?.includes('.') || false;
    return hasFilename;
  };

  const shouldUseDefault = !isValidImageUrl(img) || imageError;
  const displayImage = shouldUseDefault ? defaultLogo : img;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <Box sx={{ height: "100px", bgcolor: "#F3FFFA", width: "100%" }}></Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          paddingLeft: "170px",
          bgcolor: "#fff",
          position: "relative",
          borderBottom: "1px solid #091E4224",
        }}
      >
        <Box>
          <img
            src={displayImage}
            alt={title || "Logo"}
            onError={handleImageError}
            style={{
              boxShadow: "0 4px 8px 0 rgba(0,0,0,0.08)",
              width: "120px",
              height: "120px",
              position: "absolute",
              top: "-30px",
              background: "#fff",
              left: "30px",
              objectFit: "contain",
              padding: "10px",
            }}
          />

          <Box>
            <Typography sx={{ fontWeight: 600 }} variant={"h5"}>
              {title}
            </Typography>
            <Typography
              sx={{ paddingTop: "5px", color: "#9C9B9B" }}
              component={"p"}
            >
              {info}
            </Typography>
          </Box>
        </Box>

        {buttonLabel && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Button
              onClick={handleClick}
              icon={icon}
              label={buttonLabel}
              className="w-30 m-3"
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default AvatarHeader;
