import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import SelectBox from "../shared/SelectBox";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  lessonId?: string | number;
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

const AddContentModal = ({ open, onClose, lessonId }: ModalProps) => {
  // ----------- hooks ------------
  const [newContent, setNewContent] = useState<any>({
    content_type: "",
  });
  const param = useParams();
  const navigate = useNavigate();

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
              Add Content
            </Typography>

            <span className="cursor-pointer" onClick={onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Box sx={{ my: 2, display: "flex", flexDirection: "row", gap: 2 }}>
            <div className="flex flex-col gap-0 my-4">
              <label className="text-sm font-semibold mb-1">
                Select content type <span className="text-red">*</span>
              </label>
              <SelectBox
                styles={{ width: "450px" }}
                values={[
                  {
                    label: "Scorm",
                    value: "scorm",
                  },
                  {
                    label: "Audio",
                    value: "audio",
                  },
                  {
                    label: "Video",
                    value: "video",
                  },
                  {
                    label: "Image",
                    value: "image",
                  },
                  {
                    label: "Word",
                    value: "word",
                  },
                  {
                    label: "Powerpoints",
                    value: "powerpoints",
                  },
                  {
                    label: "Excel",
                    value: "excel",
                  },
                  {
                    label: "PDF",
                    value: "pdf",
                  },
                ]}
                value={newContent.content_type}
                onChange={(e: any) => {
                  setNewContent((prev: any) => {
                    return {
                      ...prev,
                      content_type: e.target.value,
                    };
                  });
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
                onClose();
              }}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={() => {
                navigate(`/subjects/add-content/${param.id}`, {
                  state: {
                    subject_id: param.id,
                    type: newContent.content_type,
                    lesson_id: lessonId,
                  },
                });
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

export default AddContentModal;
