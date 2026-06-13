import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "../shared/Button";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  item: string;
  onConfirm: () => void;
  count?: number;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 500,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

const DeleteConfirmationModal = ({
  open,
  onClose,
  item,
  onConfirm,
  count = 1,
}: ModalProps) => {
  // ----------- hooks ------------
  const dispatch = useDispatch();
  const param = useParams();
  const [isDeleting, setIsDeleting] = useState(false);

  // ------------ side effects -------------

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in the onConfirm function
      // Don't close modal on error so user can see the error message
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={isDeleting ? undefined : onClose}
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
              Delete {item}{count > 1 ? "s" : ""}
            </Typography>

            <span className="cursor-pointer" onClick={isDeleting ? undefined : onClose}>
              <HighlightOffRoundedIcon />
            </span>
          </Box>
          <Divider />
          <Typography sx={{ py: 2 }}>
            Are you sure you want to delete {count > 1 ? `these ${count} ${item}s` : `this ${item}`}?
          </Typography>
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
              onClick={onClose}
              disabled={isDeleting}
              className="w-24"
              type="bordered"
              label="Discard"
            />
            <Button
              onClick={handleConfirm}
              disabled={isDeleting}
              type="danger"
              className="w-24"
              label={isDeleting ? "Deleting..." : "Delete"}
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DeleteConfirmationModal;
