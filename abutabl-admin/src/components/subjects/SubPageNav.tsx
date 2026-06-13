import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

interface SingleSubjectNavProps {
  allTaps: string[];
  tap: string;
  setTap: (tap: string) => void;
}

const SubPageNav = ({ allTaps, tap, setTap }: SingleSubjectNavProps) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "start",
          alignItems: "center",
          bgcolor: "#fff",
          pt: 2,
          borderBottom: "1px solid #091E4224",
        }}
      >
        {allTaps.map((item, index) => {
          return (
            <div
              key={index}
              onClick={() => setTap(item)}
              className={`cursor-pointer text-decoration-none mx-3 text-lg pb-1 ${
                tap === item
                  ? "font-semibold border-b-2 border-primary"
                  : "text-gray"
              }`}
            >
              {item}
            </div>
          );
        })}
      </Box>
    </Box>
  );
};

export default SubPageNav;
