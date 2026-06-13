import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect } from "react";
import { getRoleList } from "../../redux/reducers/roleReducer";
import { selectBoxOptions } from "../../utils/functions";

type BasicInfoProps = {
  values: any;
  onChange: any;
};

const MotherInfo = ({ values, onChange }: BasicInfoProps) => {
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
        Mother information
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
              Mother name [English]
              {/* <span className="text-red">*</span> */}
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="m_name"
              onChange={onChange}
              value={values.m_name}
              name="m_name"
              placeholder="ex (asala mohamed)"
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
              id="m_NID"
              onChange={onChange}
              value={values.m_NID}
              name="m_NID"
              placeholder="ex (15185)"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Email 
              {/* <span className="text-red">*</span> */}
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="m_email"
              onChange={onChange}
              value={values.m_email}
              name="m_email"
              placeholder="example@example.com"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Mother name [Arabic] 
              {/* <span className="text-red">*</span> */}
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="m_name_ar"
              onChange={onChange}
              value={values.m_name_ar}
              name="m_name_ar"
              placeholder="ex (اصالة محمد)"
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
              id="m_job_id"
              name="m_job_id"
              value={values.m_job_id}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Phone 
              {/* <span className="text-red">*</span> */}
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="m_phone"
              onChange={onChange}
              value={values.m_phone}
              name="m_phone"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default MotherInfo;
