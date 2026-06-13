import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, ButtonBase, Collapse } from "@mui/material";
import React from "react";
import { useLocation } from "react-router-dom";
import { setPage } from "../redux/reducers/pagesToggleReducer";
import { useDispatch } from "react-redux";

export const SideNavItem = (props: {
  active?: boolean;
  disabled?: boolean;
  external?: any;
  icon: any;
  path?: any;
  title: any;
  items: any[] | undefined;
  onClick?: any;
}) => {
  const {
    active = false,
    disabled,
    external,
    icon,
    path,
    title,
    items,
    onClick,
  } = props;
  const [open, setOpen] = React.useState(true);
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  // ------------- functions --------------
  const handleClick = () => {
    // Only toggle open state if there are items to expand/collapse
    if (items && items.length > 0) {
      setOpen(!open);
    }
    // Only dispatch setPage if there's a path
    if (path) {
      dispatch(setPage(title));
    }
  };

  const linkProps = !path
    ? {}
    : path
    ? external
      ? {
          component: "a",
          to: path,
          target: "_blank",
        }
      : {
          component: Link,
          to: path,
        }
    : {};

  return (
    <li title={title}>
      <ButtonBase
        onClick={(e) => {
          // Prevent default navigation behavior when there's no path but there's an onClick
          if (onClick && !path) {
            e.preventDefault();
            e.stopPropagation();
          }
          handleClick();
          onClick && onClick();
        }}
        sx={{
          alignItems: "center",
          borderRadius: "5px",
          display: "flex",
          justifyContent: "center",
          py: 2,

          height: "45px",
          width: "45px",
          textAlign: "left",
          ...(active && {
            backgroundColor: "#046244",
          }),
        }}
        {...linkProps}
      >
        {icon && (
          <Box
            component="span"
            sx={{
              alignItems: "center",
              color: "#ffffff",
              display: "inline-flex",
              justifyContent: "center",
              ...(active && {
                color: "white",
              }),
            }}
          >
            {icon}
          </Box>
        )}
      </ButtonBase>
      {items != undefined && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {items.map((child, key) => {
            const active = child.path ? pathname === child.path : false;
            const secondary_linkProps = child.path
              ? external
                ? {
                    component: "a",
                    href: child.path,
                    target: "_blank",
                  }
                : {
                    component: Link,
                    href: child.path,
                  }
              : {};
            return (
              <ButtonBase
                key={key}
                sx={{
                  alignItems: "center",
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "flex-start",

                  py: "6px",
                  textAlign: "left",
                  width: "100%",
                  ...(child.active && {
                    backgroundColor: "primary.main",
                  }),
                  "&:hover": {},
                  ...(active && {
                    backgroundColor: "primary.main",
                  }),
                }}
                href="/clients"
                {...secondary_linkProps}
              >
                {icon && (
                  <Box
                    component="span"
                    sx={{
                      alignItems: "center",
                      color: "black",
                      display: "inline-flex",
                      justifyContent: "center",

                      ...(active && {
                        color: "white",
                      }),
                    }}
                  >
                    {child.icon}
                  </Box>
                )}
                <Box
                  component="span"
                  sx={{
                    color: "black",
                    flexGrow: 1,
                    fontFamily: (theme) => theme.typography.fontFamily,
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: "24px",
                    whiteSpace: "nowrap",
                    ...(active && {
                      color: "white",
                    }),
                    ...(disabled && {
                      color: "grey.500",
                    }),
                  }}
                >
                  {child.title}
                </Box>
              </ButtonBase>
            );
          })}
        </Collapse>
      )}
    </li>
  );
};

SideNavItem.propTypes = {
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  external: PropTypes.bool,
  icon: PropTypes.node,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};
