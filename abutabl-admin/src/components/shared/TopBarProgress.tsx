import React, { useEffect } from "react";
import TopBarProgress from "react-topbar-progress-indicator";

const TopBarProgressInd = () => {
  useEffect(() => {
    TopBarProgress.config({
      barColors: {
        "0": "#004D34",
        "1.0": "#004D34",
      },
      shadowBlur: 5,
    });
  }, []);

  return (
    <>
      <TopBarProgress />
    </>
  );
};

export default TopBarProgressInd;
