import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";

const StandardCode = ({ formik }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Standard Code
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
        <Box sx={{ width: "100%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Enter code</label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="code"
              onChange={formik.handleChange}
              value={formik.values.code}
              name="code"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default StandardCode;
