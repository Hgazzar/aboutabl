import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";
import { useLocation } from "react-router-dom";
import { DetailedSideNav } from "./DetailedSideNav";

const SIDE_NAV_WIDTH = 80;

const LayoutRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flex: "1 1 auto",
  maxWidth: "100%",
  [theme?.breakpoints.up("lg")]: {
    paddingLeft: SIDE_NAV_WIDTH,
  },
}));

const LayoutContainer = styled("div")({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  width: "100%",
});

export const DashboardLayout = (props: { children: any }) => {
  const { children } = props;
  const { pathname } = useLocation();
  const [openNav, setOpenNav] = useState(true);

  useEffect(() => {
    if (openNav) {
      setOpenNav(false);
    }
  }, [pathname]);

  return (
    <>
      <SideNav onClose={() => setOpenNav(false)} open={openNav} />
      {/* <DetailedSideNav onClose={() => setOpenNav(false)} open={openNav} /> */}
      <TopNav onNavOpen={() => setOpenNav(true)} />
      <LayoutRoot>
        <LayoutContainer>{children}</LayoutContainer>
      </LayoutRoot>
    </>
  );
};
