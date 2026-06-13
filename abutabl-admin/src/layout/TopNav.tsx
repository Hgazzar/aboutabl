import PropTypes from "prop-types";
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import { usePopover } from "../hooks/usePopover";
import { AccountPopover } from "./AccountPopover";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Searchbar from "../components/shared/Searchbar";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import Cookies from "js-cookie";
import AppsIcon from "@mui/icons-material/Apps";
import { useEffect } from "react";
import NotificationDropdown from "./NotificationDropdown";

// ---------- constants -----------
const SIDE_NAV_WIDTH = "100%";
const TOP_NAV_HEIGHT = 64;

export const TopNav = (props: { onNavOpen: any }) => {
  // ------------ hooks --------------

  const accountPopover = usePopover();

  return (
    <>
      <Box
        component="header"
        sx={{
          backgroundColor: "#FFFFFF",
          position: "sticky",
          border: "1px solid #091E4224",
          left: {
            lg: `${SIDE_NAV_WIDTH}px`,
          },
          top: 0,
          width: {
            lg: `calc(100% - ${SIDE_NAV_WIDTH}px)`,
          },
          zIndex: 3,
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={2}
          sx={{
            minHeight: TOP_NAV_HEIGHT,
            px: 2,
          }}
        >
          <Stack
            sx={{
              display: { xs: "block", lg: "none" },
              cursor: "pointer",
            }}
            alignItems="center"
            direction="row"
            spacing={2}
          >
            <Box onClick={props.onNavOpen} title="Logo">
              <AppsIcon />
            </Box>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={2}>
            <Tooltip title="Logo">
              <Link to="/dashboard">
                <img src={require("../assets/Logo.png")} alt="page logo" />
              </Link>
            </Tooltip>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={2}>
            {/* <Box sx={{ display: { xs: "none", lg: "block" } }} title="Search">
              <Searchbar />
            </Box> */}
            {/* <Tooltip
              sx={{ display: "block" }}
              title="Notifications"
            >
              <IconButton>
                <Badge badgeContent={4} color="success" variant="dot">
                  <SvgIcon fontSize="small">
                    <NotificationsNoneIcon />
                  </SvgIcon>
                </Badge>
              </IconButton>
            </Tooltip> */}
            <NotificationDropdown/>
            <Tooltip title="User">
              <>
                <Avatar
                  onClick={accountPopover.handleOpen}
                  ref={accountPopover.anchorRef}
                  sx={{
                    cursor: "pointer",
                    height: 40,
                    width: 40,
                  }}
                  src="/assets/avatars/avatar-anika-visser.png"
                />
                <Typography
                  sx={{ display: { xs: "none", lg: "block" } }}
                  variant="body1"
                >
                  {Cookies.get("username")}
                </Typography>
              </>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
      <AccountPopover
        anchorEl={accountPopover.anchorRef.current}
        open={accountPopover.open}
        onClose={accountPopover.handleClose}
      />
    </>
  );
};

TopNav.propTypes = {
  onNavOpen: PropTypes.func,
};
