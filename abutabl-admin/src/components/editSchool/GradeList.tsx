import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import DataTable from "../../components/shared/DataTable";
import InfoCard from "../../components/shared/InfoCard";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SwitchBox from "../../components/shared/SwitchBox";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  deleteGrade,
  getGradeList,
  setGradeStatus,
} from "../../redux/reducers/gradeReducer";
import ActionDropdown from "../shared/ActionDropdown";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const columns = [
  {
    name: "Grade Name",
    selector: (row: any) => row.name,
    width: "80%",
  },
  {
    name: "Status",
    selector: (row: any) => row.status,
    width: "7%",
    center: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    width: "7%",
    center: true,
  },
];

const Grade = ({ schoolID }: any) => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<any>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gradeState = useSelector((state: RootState) => state.grade);
  const param = useParams();

  // ------------- functions ---------------
  const handleRowClick = (row: any) => {
    navigate(`/school/grade/${row.id}`);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    if (schoolID) {
      dispatch(getGradeList({ paginate: 10, school_id: schoolID }));
    }
  }, [schoolID]);

  useEffect(() => {
    const tableData = gradeState?.gradeList?.grades?.data?.map((item: any) => {
      return {
        id: item.id,
        name: item.name,
        classes: item.num_classes,
        students: item.num_students,
        status: (
          <SwitchBox
            value={item.status === "1" ? true : false}
            onChange={() => {
              dispatch(setGradeStatus(item.id));
            }}
          />
        ),
        action: (
          <ActionDropdown
            id={item.id}
            actions={[
              {
                name: "Delete",
                action: () => {
                  setGradeToDelete(item);
                  setDeleteModalOpen(true);
                },
              },
            ]}
          />
        ),
      };
    });

    setRows({
      ...gradeState?.gradeList,
      grades: tableData,
    });
  }, [gradeState?.gradeList]);

  return (
    <Box>
      <Box
        sx={{
          mx: 2,
          m: 2,
          boxShadow: "unset",
          border: "1px solid #091E4224",
          borderRadius: "5px",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
          }}
        >
          <Typography variant="h6">Grade & classes</Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {/* <Button
              label="Upload CSV file"
              type="bordered"
              icon={NoteAddIcon}
              className="w-30 m-3"
            /> */}
            <Button
              onClick={() => {
                navigate(`/school/add-grade/${schoolID}`);
              }}
              label="Add Grade & classes"
              className="w-30 m-3"
              type="bordered"
            />
          </Box>
        </Box>
        <Divider />

        <DataTable
          data={rows.grades}
          columns={columns}
          handleRowClick={handleRowClick}
        />
        <Pagination
          from={gradeState?.gradeList?.grades?.from}
          to={gradeState?.gradeList?.grades?.to}
          lastPage={gradeState?.gradeList?.grades?.last_page}
          currentPage={gradeState?.gradeList?.grades?.current_page}
          total={gradeState?.gradeList?.grades?.total}
          perPage={gradeState?.gradeList?.grades?.per_page}
        />
      </Box>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGradeToDelete(null);
        }}
        onConfirm={async () => {
          if (gradeToDelete) {
            await dispatch(deleteGrade(gradeToDelete.id));
            await dispatch(
              getGradeList({ paginate: 10, school_id: schoolID })
            );
            setDeleteModalOpen(false);
            setGradeToDelete(null);
          }
        }}
        item="Grade"
      />
    </Box>
  );
};

export default Grade;
