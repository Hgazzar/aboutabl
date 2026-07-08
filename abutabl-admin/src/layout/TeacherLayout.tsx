import { useEffect, useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import { TeacherSideNav, TEACHER_SIDE_NAV_WIDTH } from "./TeacherSideNav";
import { TeacherLayoutContext } from "./TeacherLayoutContext";

const LayoutRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flex: "1 1 auto",
  maxWidth: "100%",
  [theme.breakpoints.up("lg")]: {
    paddingLeft: TEACHER_SIDE_NAV_WIDTH,
  },
}));

const LayoutContainer = styled("div")({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  width: "100%",
  minHeight: "100vh",
  backgroundColor: "#F8F9FA",
});

export const TeacherLayout = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const { pathname } = useLocation();
  const [openNav, setOpenNav] = useState(false);

  useEffect(() => {
    if (openNav) {
      setOpenNav(false);
    }
  }, [pathname]);

  const contextValue = useMemo(
    () => ({
      openNav: () => setOpenNav(true),
    }),
    []
  );

  return (
    <TeacherLayoutContext.Provider value={contextValue}>
      <TeacherSideNav onClose={() => setOpenNav(false)} open={openNav} />
      <LayoutRoot>
        <LayoutContainer>{children}</LayoutContainer>
      </LayoutRoot>
    </TeacherLayoutContext.Provider>
  );
};
