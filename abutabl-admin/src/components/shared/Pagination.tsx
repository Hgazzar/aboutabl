import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const Pagination = ({
  from,
  to,
  currentPage,
  lastPage,
  total,
  handleChangePage,
}: any) => {
  // console.log("from:", from , "to:" , to, "current:" , currentPage, "last : ", lastPage)
  const [paginationCounter, setPaginationCounter] = useState(0);
  const [current, setCurrent] = useState(1);

  // useEffect(() => {
  //   setPaginationCounter(
  //     paginationCounter
  //   );
  //   console.log(paginationCounter);

  // }, [paginationCounter])

  useEffect(() => {
    setCurrent(currentPage);
  }, [currentPage]);

  if (total === 0) {
    return <div></div>;
  }
// console.log(paginationCounter)
  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
      }}
    >
      <Typography variant="body1" sx={{ color: "#8E9AA0" }}>
        Showing {from} to {to} of {total} records
      </Typography>
      <Box>
        <button
          disabled={paginationCounter === 0 ? true : false}
          onClick={() => setPaginationCounter(paginationCounter - 1)}
          className={`w-8 h-8 rounded-md ${
            paginationCounter == 0 ? "text-easyGray" : "text-gray"
          }`}
        >
          <KeyboardArrowLeftIcon />
        </button>
        {[1, 2, 3, 4, 5].map((page, index) => {
          const pageNumber = page + paginationCounter;
          if (pageNumber > lastPage) {
            return (
              <button
                key={index}
                disabled
                className={`w-8 h-8 rounded-md`}
              ></button>
            );
          }
          return (
            <button
              key={index}
              className={`w-8 h-8 rounded-md ${
                pageNumber == current
                  ? "text-white bg-primary"
                  : "text-gray"
              } `}
              onClick={() => {
                handleChangePage(pageNumber);
                setCurrent(pageNumber);
              }}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          disabled={paginationCounter + 5 >= lastPage ? true : false}
          onClick={() => setPaginationCounter(paginationCounter + 1)}
          className={`w-8 h-8 rounded-md ${
            current == lastPage ? "text-easyGray" : "text-gray"
          }`}
        >
          <ChevronRightIcon />
        </button>
      </Box>
    </Box>
  );
};

export default Pagination;
