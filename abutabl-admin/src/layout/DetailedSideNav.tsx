import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Drawer, Stack } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import DashboardList from "./DashboardList";

import { SideNavItem } from "./SideNavItem";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { setSubPage } from "../redux/reducers/pagesToggleReducer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import "../styles/detailedSideNav.css";

export const DetailedSideNav = (props: { open: any; onClose: any }) => {
  const { items, settingItems } = DashboardList();
  const { open, onClose } = props;
  const { pathname } = useLocation();
  const theme = useTheme();
  const lgUp: any = useMediaQuery(theme.breakpoints.up("lg"));
  const [isSupMenuOpen, setIsSupMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const pagesState = useSelector((state: RootState) => state.pagesToggle);
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
          position: "relative",
          zIndex: 3,
        }}
      >
        <Stack
          component="ul"
          spacing={0.5}
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            overflow: "hidden",
          }}
        >
          {items.map((item: any, index) => {
            const active =
              window.location.pathname.split("/")[1] === item.module
                ? true
                : false;

            return (
              <div key={index}>
                {active && (
                  <div className="pl-16 pr-3 w-72">
                    <h1 className="text-left mb-2 text-gray text-sm">
                      {item.title}
                    </h1>

                    <ul>
                      {item.supPages.map((item: any, index: number) => {
                        return (
                          <li
                            key={index}
                            onClick={() => {
                              dispatch(setSubPage(item.title));
                              navigate(item.path);
                            }}
                            className={`hover:bg-lightGray cursor-pointer p-2 my-3 rounded-sm font-semibold ${
                              item.page ===
                              window.location.pathname.split("/")[2]
                                ? "bg-lightGray text-primaryDark"
                                : ""
                            }`}
                          >
                            {item.title}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
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
          }}
        >
          {settingItems.map((item: any, key) => {
            const active = item.path ? pathname === item.path : false;

            return (
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
      </Box>
      <button
        onClick={() => {
          setIsSupMenuOpen((prev: boolean) => {
            return !prev;
          });
        }}
        className="detailed-nav_btn bg-white border border-grayDarkHoverd absolute top-20 z-10 rounded-full"
      >
        {isSupMenuOpen ? <KeyboardArrowLeftIcon /> : <ChevronRightIcon />}
      </button>
    </Box>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        PaperProps={{
          sx: {
            backgroundColor: "#FFFFFF",
            color: "black",
            width: `${isSupMenuOpen ? "280px" : "70px"}`,
            border: "1px solid #091E4224",
            zIndex: 1,
            overflow: "visible",
            transition: "width .5s",
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
          backgroundColor: "white",
          color: "black",
          width: 280,
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
      variant="temporary"
    >
      {content}
    </Drawer>
  );
};

DetailedSideNav.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
