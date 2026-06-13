import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Drawer, Stack } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import DashboardList from "./DashboardList";

import { SideNavItem } from "./SideNavItem";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export const SideNav = (props: { open: any; onClose: any }) => {
  const { items, settingItems } = DashboardList();
  // ----------- hooks -------------
  const { open, onClose } = props;
  const { pathname } = useLocation();
  const theme = useTheme();
  const lgUp: any = useMediaQuery(theme.breakpoints.up("lg"));
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<"en" | "ar">("en");

  // ------------ functions ---------------
  const changeLanguage = (lng: any) => {
    document.body.dir = lng === "ar" ? "rtl" : "ltr";

    i18n.changeLanguage(lng);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    changeLanguage(language);
  }, [language]);

  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        component="nav"
        sx={{
          flexGrow: 1,
          px: "5px",
          py: 3,
          pt: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Stack
          component="ul"
          spacing={0.5}
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {items.map((item: any, key) => {
            const active =
              window.location.pathname.split("/")[1] === item.module
                ? true
                : false;
            return (
              item &&
              <SideNavItem
                active={active}
                disabled={item.disabled}
                external={item.external}
                icon={item.icon}
                key={item.title}
                path={item.path}
                title={item.title}
                items={item.children}
              />
            );
          })}
        </Stack>
        <Stack
          component="ul"
          spacing={0.5}
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <SideNavItem
            icon={settingItems[0].icon as any}
            key={settingItems[0].title}
            title={settingItems[0].title}
            items={[]}
            onClick={() => {
              setLanguage((prev: any) => {
                return prev === "en" ? "ar" : "en";
              });
            }}
          />
          <SideNavItem
            active={settingItems[1].path ? pathname === settingItems[1].path : false}
            icon={settingItems[1].icon as any}
            key={settingItems[1].title}
            title={settingItems[1].title}
            path={settingItems[1].path}
            items={[]}
          />
        </Stack>
      </Box>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        PaperProps={{
          sx: {
            backgroundColor: "#004D34",
            color: "black",
            width: 60,
            border: "none",

            zIndex: 2,
          },
        }}
        variant="permanent"
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          backgroundColor: "#004D34",
          color: "black",
          width: 60,
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
      variant="temporary"
    >
      {content}
    </Drawer>
  );
};

SideNav.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
