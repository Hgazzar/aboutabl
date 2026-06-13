import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getSheetShow } from "@/redux/reducers/subjectsReducer";

const SheetView = () => {
  // ----------- hooks ------------
  const [data, setData] = useState<any>({});
  const param = useParams();
  const dispatch = useDispatch();

  //   ------------ side effects ------------

  useEffect(() => {
    dispatch(getSheetShow({ id: param.sheet_id })).then((res: any) => {
      setData(res.payload.sheet);
    });
  }, []);
  // console.log("Document Path:", data?.path);
  return (
    <>
      <Box sx={{ position: "relative", zIndex: 100 }}>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100vh",
              border: "1px solid #091E4224",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <>
              <div className="p-4 px-10 bg-white flex justify-between items-center flex-row">
                <div className="flex flex-row gap-10">
                  <Link to={`/subjects/${param.scormId}`}>
                    <img src={require("../../assets/Logo.png")} alt="" />
                  </Link>
                  <p className="font-bold text-2xl text-primary">
                    {data?.name_en}
                  </p>
                </div>
              </div>
              <div className="w-full h-full flex justify-center items-center">
                {data.ext === "docx" || data.ext === "xlsx" ? (
                  <iframe
                    title="Word and excel Viewer"
                    className="w-full h-full"
                    height={"100%"}
                    width={"100%"}
                    src={
                      "https://view.officeapps.live.com/op/embed.aspx?src=" +
                      data?.path
                    }
                  ></iframe>
                ) : data.ext === "jpg" ? (
                  <img
                    className="w-82 h-full "
                    title="Image Viewer"
                    src={data?.path}
                    alt="i"
                  />
                ) : data.ext === "pdf" ? (
                  <iframe
                    title="SCORM Viewer"
                    className="w-full h-full"
                    height={"100%"}
                    width={"100%"}
                    src={data?.path}
                  ></iframe>
                ) : (
                  <iframe
                    title="SCORM Viewer"
                    className="w-full h-full"
                    height={"100%"}
                    width={"100%"}
                    src={data?.path}
                  ></iframe>
                )}
              </div>
            </>
            {/* )} */}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default SheetView;
