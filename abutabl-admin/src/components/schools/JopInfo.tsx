import { Box, Typography, Divider, TextField } from "@mui/material";
import React, { useEffect, useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import CustomedDatePicker from "../shared/DatePicker";
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getRoleList } from "../../redux/reducers/roleReducer";
import { selectBoxOptions } from "../../utils/functions";
import { canOnlyAddTeachers } from "../../utils/permissionHelpers";

type InfoProps = {
  values: any;
  onChange: any;
  formik: any;
};

const JopInfo = ({ formik, values, onChange }: InfoProps) => {
  // -------------- hooks -------------
  const commonState = useSelector((state: RootState) => state.common);
  const permissionState = useSelector((state: RootState) => state.permissions);
  const hideRoleDdl = canOnlyAddTeachers(permissionState);
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
        Job information
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
            <label className="text-sm font-semibold mb-1">joining Date</label>
            <CustomedDatePicker
              formik={formik}
              id="joining_date"
              name="joining_date"
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            {hideRoleDdl ? (
              <>
                <label className="text-sm font-semibold mb-1">Role</label>
                <Typography component="p" sx={{ fontSize: "14px", color: "text.secondary" }}>
                  Teacher
                </Typography>
              </>
            ) : (
              <>
                <label className="text-sm font-semibold mb-1">
                  Role <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={
                    commonState?.roleList?.roles?.length > 0
                      ? selectBoxOptions(commonState?.roleList?.roles, "name")
                      : []
                  }
                  onChange={onChange}
                  id="role_id"
                  name="role_id"
                  value={values.role_id}
                />
              </>
            )}
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default JopInfo;
