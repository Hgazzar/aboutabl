import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const TeacherSettingsPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <>
      <Box
        sx={{
          p: 3,
          bgcolor: "#fff",
          borderBottom: "1px solid #091E4224",
        }}
      >
        <Typography variant="h5">{t("TEACHER_NAV.SETTINGS")}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("TEACHER_SETTINGS.PLACEHOLDER")}
        </Typography>
      </Box>

      <Box
        sx={{
          m: 3,
          p: 4,
          bgcolor: "#fff",
          borderRadius: 2,
          border: "1px dashed #091E4224",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          {t("TEACHER_SETTINGS.COMING_SOON")}
        </Typography>
      </Box>
    </>
  );
};

export default TeacherSettingsPlaceholder;
