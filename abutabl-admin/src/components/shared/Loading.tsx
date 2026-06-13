import React from "react";

type Props = {};

const Loading = (props: Props) => {
  return (
    <div className="spinner-container relative">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default Loading;
