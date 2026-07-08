import React, { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// @ts-expect-error CRA svgr
import { ReactComponent as ClassesIcon } from "../assets/classes-icon.svg";
// @ts-expect-error CRA svgr
import { ReactComponent as AboutablLogo } from "../assets/aboutabl-logo.svg";
import { clearPermissions } from "../redux/reducers/permissionReducer";
import { setLoginProcess, setUser } from "../redux/reducers/loginReducer";

export const TEACHER_SIDE_NAV_WIDTH = 240;

type NavItem = {
  titleKey: string;
  path: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    titleKey: "TEACHER_NAV.OVERVIEW",
    path: "/dashboard",
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },
  {
    titleKey: "TEACHER_NAV.CLASSES",
    path: "/teacher/classes",
    icon: <ClassesIcon width={18} height={18} aria-hidden />,
  },
  {
    titleKey: "TEACHER_NAV.SETTINGS",
    path: "/teacher/settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
  },
];

export const TeacherSideNav = (props: { open: boolean; onClose: () => void }) => {
  const { open, onClose } = props;
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignOut = useCallback(() => {
    Cookies.remove("token_");
    Cookies.remove("abotable_id");
    Cookies.remove("username");
    Cookies.remove("expiration");
    dispatch(clearPermissions());
    dispatch(setUser({}));
    dispatch(setLoginProcess("signIn"));
    navigate("/");
  }, [dispatch, navigate]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: "1px solid #091E4224" }}>
        <Box
          component={Link}
          to="/dashboard"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
            lineHeight: 0,
          }}
        >
          <AboutablLogo
            width={172}
            height={43}
            style={{ maxWidth: "100%", height: "auto" }}
            aria-label="Aboutabl"
          />
        </Box>
      </Box>

      <List component="nav" sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              onClick={onClose}
              sx={{
                mb: 0.5,
                borderRadius: 1.5,
                color: active ? "#2EB5A7" : "text.primary",
                bgcolor: active ? "#2EB5A714" : "transparent",
                "&:hover": {
                  bgcolor: active ? "#2EB5A71F" : "#091E420A",
                },
              }}
            >
              <Box
                sx={{
                  mr: 1.5,
                  display: "flex",
                  alignItems: "center",
                  color: active ? "#2EB5A7" : "text.secondary",
                }}
              >
                {item.icon}
              </Box>
              <ListItemText
                primary={t(item.titleKey)}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? 700 : 600,
                  textTransform: "uppercase",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Stack sx={{ px: 2, pb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<LogoutOutlinedIcon />}
          onClick={handleSignOut}
          sx={{
            justifyContent: "flex-start",
            color: "text.primary",
            borderColor: "#091E4224",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {t("TEACHER_NAV.SIGN_OUT")}
        </Button>
      </Stack>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        variant="permanent"
        PaperProps={{
          sx: {
            width: TEACHER_SIDE_NAV_WIDTH,
            borderRight: "1px solid #091E4224",
            boxShadow: "none",
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: TEACHER_SIDE_NAV_WIDTH,
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
    >
      {content}
    </Drawer>
  );
};
