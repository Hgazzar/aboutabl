import { Box, Typography, Divider, TextField } from "@mui/material";

const LevelView = ({ data }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Level information
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
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              School
            </label>
            <p className="text-dark font-semibold mt-1">{data?.school}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              Grade
            </label>
            <p className="text-dark font-semibold mt-1">{data?.grade}</p>
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4 h-16"></div>
          <div className="flex flex-col gap-0 mb-4 h-16">
            <label className="text-sm font-semibold mb-1 text-gray">
              Class
            </label>
            <p className="text-dark font-semibold mt-1">{data?.class}</p>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default LevelView;
