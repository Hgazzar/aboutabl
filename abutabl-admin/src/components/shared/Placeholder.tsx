import { Box } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next"; // 👈 هنا بنستدعي الهوك بتاع الترجمة

type PlaceholderProps = {
  name?: string;
  text?: string;
};

const Placeholder = ({ text, name }: PlaceholderProps) => {
  const { t } = useTranslation(); // 👈 بنجيب الدالة t

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
        height: 400,
        mx: "auto",
      }}
    >
      <div className="w-40 h-40 m-10 rounded-full bg-veryLightprimary" />
      {name ? (
        <p className="font-bold">
          {t("placeholder.noNameAdded", { name })}{" "}
          {/* 👈 استخدمنا المفتاح مع متغير */}
        </p>
      ) : (
        <p className="font-bold">
          {t("placeholder.noData")} {/* 👈 نص ثابت */}
        </p>
      )}
      {text && <p className="text-gray text-center px-5">{text}</p>}
    </Box>
  );
};

export default Placeholder;
