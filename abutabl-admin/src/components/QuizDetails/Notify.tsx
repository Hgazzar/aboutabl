import { Box, Typography, Divider } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import SwitchBox from "../shared/SwitchBox";

const Notify = ({ formik }: any) => {
  // ----------- hooks ------------

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Notification
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Notify Students
        </Typography>{" "}
        <SwitchBox id={"notify_student"} formik={formik} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Notify about submission
        </Typography>{" "}
        <SwitchBox id={"notify_about_submission"} formik={formik} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Notify about late submission
        </Typography>{" "}
        <SwitchBox id={"notify_about_late_submission"} formik={formik} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          p: 1,
          px: 3,
        }}
      >
        <Typography component={"p"} sx={{ color: "#8E9AA0" }}>
          Reminder before due date
        </Typography>{" "}
        <SwitchBox id={"reminder_before_due_date"} formik={formik} />
      </Box>
    </Box>
  );
};

export default Notify;
