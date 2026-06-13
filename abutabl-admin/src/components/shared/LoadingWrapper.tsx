import React from "react";
import Loading from "./Loading";

const LoadingWrapper = ({ children, isLoading }: any) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-white h-96 p-20">
        <Loading />
      </div>
    );
  }
  return children;
};

export default LoadingWrapper;
