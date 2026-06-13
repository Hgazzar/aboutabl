import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import SelectBox from "../shared/SelectBox";
import { selectBoxOptions } from "../../utils/functions";
import { RootState } from "../../redux/store";
import { getSchoolList } from "../../redux/reducers/schoolReducer";
import {
  changeUnitType,
  getUnitsformSubject,
} from "../../redux/reducers/subjectsReducer";
import { toBeDisabled } from "@testing-library/jest-dom/matchers";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  unitID?: any;
  updateLessons: (data: any) => any;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const ContentStatusModal = ({
  open,
  onClose,
  unitID,
  updateLessons,
  lessonData,
}: any) => {
  // ----------- hooks ------------
  const [content, setContent] = useState<any>({
    type: "",
    school_id: [],
    for_teacher: "0",
  });
  const dispatch = useDispatch();
  const param = useParams();
  const schoolState = useSelector(
    (state: RootState) => state?.school?.schoolList?.schools?.data
  );

  
  // ------------- side effects --------------
  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsSchools = permissionState?.permissions?.schools;
  const viewSchools = permissionsSchools?.find((permission: any) => permission["view-schools"] === "1")

  useEffect(() => {
    viewSchools &&
    dispatch(getSchoolList({ paginate: 50 }));
  }, []);

  useEffect(() => {
    if (lessonData) {
      const schools = lessonData?.schools?.map((item: any) => {
        return `${item.id}`;
      });
      setContent({
        type: lessonData?.unit?.[0]?.type,
        for_teacher: lessonData?.unit?.[0]?.for_teacher,
        school_id: schools,
      });
    }
  }, [lessonData]);


  const [statusPrivacy,setStatusPrivacy] = useState<any>();
  const [school,setSchool] = useState<any>();
  const [isteacher,setIsTeacher] = useState<any>();

  useEffect(()=>{
    setStatusPrivacy(content.type);
    setSchool(content.school_id);
    setIsTeacher(content.for_teacher);
  },[content])
  
  console.log(content);
  
  
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1F1E1E",
              mb: 2,
            }}
          >
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Change unit status
            </Typography>

            <span className="cursor-pointer" onClick={()=>{
              setStatusPrivacy(content.type);
              setIsTeacher(content.for_teacher)
              setSchool(content.school_id)
              onClose()
            }
            }>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "column" }}>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                Status <span className="text-red">*</span>
              </label>
              <SelectBox
                styles={{ width: "450px" }}
                values={[
                  {
                    label: "Public",
                    value: "public",
                  },
                  {
                    label: "Private",
                    value: "private",
                  },
                ]}
                value={ statusPrivacy ? statusPrivacy : content.type}
                onChange={(e: any) => {

                  setStatusPrivacy(e.target.value)

                  if(content.type === 'public' && e.target.value === 'private'){
                    setSchool([])
                  }

                  // setContent((prev: any) => {
                  //   return {
                  //     ...prev,
                  //     type: e.target.value,
                  //   };
                  // });
                }}
              />
            </div>
            { statusPrivacy === "private" ?(
              <div className="flex flex-col gap-0 my-4">
                <label className="text-sm font-semibold mb-1">
                  Shown to <span className="text-red">*</span>
                </label>
                <SelectBox
                  values={

                    schoolState?.length > 0
                      ? selectBoxOptions(schoolState, "name")
                      : []
                  }
                  multiple={true}
                  onChange={(e: any) => {                                        
                    setSchool(e.target.value)
                    // setContent((prev: any) => {
                    //   return {
                    //     ...prev,
                    //     school_id: e.target.value,
                    //   };
                    // });
                  }}
                  id="school_id"
                  name="school_id"
                  value={school ? school : []}
                />
              </div>
            )
                  :  ''
          }
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                For teacher <span className="text-red">*</span>
              </label>
              <SelectBox
                styles={{ width: "450px" }}
                values={[
                  {
                    label: "Yes",
                    value: "1",
                  },
                  {
                    label: "No",
                    value: "0",
                  },
                ]}
                value={isteacher ? isteacher : content.for_teacher}
                onChange={(e: any) => {
                  setIsTeacher(e.target.value)
                  // setContent((prev: any) => {
                  //   return {
                  //     ...prev,
                  //     for_teacher: e.target.value,
                  //   };
                  // });
                }}
              />
            </div>
          </Box>

          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              color: "#1F1E1E",
              gap: 3,
              mb: 2,
              mt: 4,
            }}
          >
            <Button
              onClick={() => {
                setStatusPrivacy(content.type);
              setIsTeacher(content.for_teacher)
              setSchool(content.school_id)
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={async () => {
                await dispatch(changeUnitType({ id: unitID, data: {
                  type: statusPrivacy ? statusPrivacy : content.type,
                  school_id: school ? school : content.school_id,
                  for_teacher: isteacher ? isteacher : content.for_teacher,
                } }));
                updateLessons(unitID);
                // setContent({
                //   type: statusPrivacy,
                //   school_id: school,
                //   for_teacher: isteacher,
                // });
                onClose();
              }}
              className="w-24"
              label="Save"
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ContentStatusModal;
