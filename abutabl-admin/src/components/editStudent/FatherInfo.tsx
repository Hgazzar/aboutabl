import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect } from "react";
import { getRoleList } from "../../redux/reducers/roleReducer";
import { selectBoxOptions } from "../../utils/functions";

type InfoProps = {
  values: any;
  onChange: any;
};

const FatherInfo = ({ values, onChange }: InfoProps) => {
  // -------------- hooks -------------
  const commonState = useSelector((state: RootState) => state.common);
  const dispatch = useDispatch();

  // ------------- side effects --------------
  useEffect(() => {
    dispatch(getRoleList());
  }, []);
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Father information
      </Typography>{" "}
      <Divider />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          p: 3,
          gap: 3,
        }}
      >
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Father name [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="f_name"
              onChange={onChange}
              value={values.f_name}
              name="f_name"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">ID</label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="f_NID"
              onChange={onChange}
              value={values.f_NID}
              name="f_NID"
              placeholder="ex (45158)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Email <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="f_email"
              onChange={onChange}
              value={values.f_email}
              name="f_email"
              placeholder="example@example.com"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Father name [Arabic] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="f_name_ar"
              onChange={onChange}
              value={values.f_name_ar}
              name="f_name_ar"
              placeholder="ex (Deyaa Eldeen)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">Job title</label>

            <SelectBox
              values={
                commonState?.jobList?.length > 0
                  ? selectBoxOptions(commonState?.jobList, "name")
                  : []
              }
              onChange={onChange}
              id="f_job_id"
              name="f_job_id"
              value={values.f_job_id}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Phone <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="f_phone"
              onChange={onChange}
              value={values.f_phone}
              name="f_phone"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default FatherInfo;
