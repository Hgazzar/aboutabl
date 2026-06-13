import { Box, Typography, Divider, TextField } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import SelectBox from "../shared/SelectBox";
import { useEffect } from "react";
import {
  getCityList,
  getGovernmentList,
} from "../../redux/reducers/commonReducer";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { selectBoxOptions } from "../../utils/functions";

const BasicInfo = ({ formik }: any) => {
  // -------------- hooks -------------
  const commonState = useSelector((state: RootState) => state.common);
  const dispatch = useDispatch();

  // ------------- side effects --------------
  useEffect(() => {
    dispatch(getGovernmentList());
  }, []);

  useEffect(() => {
    dispatch(
      getCityList({
        govern_id: formik?.values?.govern_id ? formik?.values?.govern_id : 120,
      })
    );
  }, [formik?.values?.govern_id]);

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #091E4224" }}>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        Basic information
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
              School name [English] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_en"
              name="name_en"
              value={formik?.values?.name_en}
              onChange={formik?.handleChange}
              placeholder="Enter school name"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              School email <span className="text-red">*</span>
            </label>

            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="email"
              name="email"
              value={formik?.values?.email}
              onChange={formik?.handleChange}
              placeholder="Enter school email"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              School name [Arabic] <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="name_ar"
              name="name_ar"
              value={formik?.values?.name_ar}
              onChange={formik?.handleChange}
              placeholder="Enter school name"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>

          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Contact number <span className="text-red">*</span>
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="small"
              id="contanct_number"
              name="contanct_number"
              value={formik?.values?.contanct_number}
              onChange={formik?.handleChange}
              placeholder="Enter contact number"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
      <Typography
        component={"p"}
        sx={{ fontSize: "18px", fontWeight: "600", m: 3 }}
      >
        School Location
      </Typography>{" "}
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
              Governments
               {/* <span className="text-red">*</span> */}
            </label>

            <SelectBox
              values={
                commonState?.governmentList?.length > 0
                  ? selectBoxOptions(commonState?.governmentList, "name_en")
                  : []
              }
              id="govern_id"
              name="govern_id"
              value={formik?.values?.govern_id}
              onChange={formik?.handleChange}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Address details ( English )
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="medium"
              id="address_en"
              name="address_en"
              value={formik?.values?.address_en}
              onChange={formik?.handleChange}
              placeholder="Type Address"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
        <Box sx={{ width: "50%" }}>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              City 
              {/* <span className="text-red">*</span> */}
            </label>
            <SelectBox
              values={
                commonState?.cityList?.length > 0
                  ? selectBoxOptions(commonState?.cityList, "city")
                  : []
              }
              id="city_id"
              name="city_id"
              value={formik?.values?.city_id}
              onChange={formik?.handleChange}
            />
          </div>
          <div className="flex flex-col gap-0 mb-4">
            <label className="text-sm font-semibold mb-1">
              Address details ( Arabic )
            </label>
            <TextField
              margin="normal"
              required
              fullWidth
              size="medium"
              id="address_ar"
              name="address_ar"
              value={formik?.values?.address_ar}
              onChange={formik?.handleChange}
              placeholder="Type Address"
              sx={{ margin: 0, padding: 0 }}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfo;
