import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 520,
          width: "100%",
          bgcolor: "#fff",
          border: "1px solid #091E4224",
          borderRadius: 2,
          p: 4,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Unauthorized access
        </Typography>
        <Typography sx={{ color: "#8E9AA0", mb: 3 }}>
          You don&apos;t have permission to access this page. If you think this is
          a mistake, please contact your administrator.
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard")}
            sx={{
              textTransform: "none",
              bgcolor: "#1EBBA3",
              "&:hover": { bgcolor: "#004D34" },
            }}
          >
            Go to dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              textTransform: "none",
              borderColor: "#1EBBA3",
              color: "#1EBBA3",
              "&:hover": { borderColor: "#004D34", color: "#004D34", bgcolor: "#F3FFFA" },
            }}
          >
            Go back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Unauthorized;

