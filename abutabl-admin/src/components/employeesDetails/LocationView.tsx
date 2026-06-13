import { Box, Typography, Divider, TextField } from "@mui/material";

const LocationView = ({ data }: any) => {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Location information
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
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Governments
            </label>
            <p className="text-dark font-semibold mt-1">{data?.govern}</p>
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">
              Address details
            </label>
            <p className="text-dark font-semibold mt-1">{data?.address_en}</p>
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1 text-gray">City</label>
            <p className="text-dark font-semibold mt-1">{data?.city}</p>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default LocationView;
