import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Button from "../../components/shared/Button";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import {
  deleteFile,
  getFilesList,
} from "../../redux/reducers/fileManagementReducer";
import AddFileModal from "../../components/modals/AddFileModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

const columns = [
  {
    name: "File name",
    selector: (row: any) => row.name,
    width: "30%",
  },
  {
    name: "Size",
    selector: (row: any) => row.size,
  },
  {
    name: "Type",
    selector: (row: any) => row.type,
    center: true,
  },
  {
    name: "Action",
    selector: (row: any) => row.action,
    center: true,
  },
];

const FileManagement = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [rows, setRows] = useState<any>({});
  const dispatch = useDispatch();
  const filesState = useSelector((state: RootState) => state.files);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // ------------- functions ---------------

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChangePage = async (page: number) => {
    setIsLoading(true);
    setSelectedRows([]); // Clear selection when changing pages
    await dispatch(getFilesList({ paginate: 10, page }));
    setCurrentPage(page);
    setIsLoading(false);
  };

  const handleRowClick = (row: any) => {
    window.open(row.path, '_blank');
    // window.location.href = row.path;
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length > 0) {
      const ids = selectedRows.map((row: any) => row.id);
      for (const id of ids) {
        await dispatch(deleteFile(id));
      }
      setSelectedRows([]);
      setBulkDeleteModalOpen(false);
      await dispatch(getFilesList({ paginate: 10, page: currentPage || 1 }));
    }
  };
  // ------------- side effects ---------------
  const permissionState = useSelector((state: RootState) => state.permissions)
  const permissionsFile = permissionState?.permissions?.file_managers;
  

  useEffect(() => {
    dispatch(getFilesList({ paginate: 10, page: 1 }));
  }, []);

  // console.log(permissionsFile?.find((permission:any) => permission['view-file_managers'] === "1"))
  useEffect(() => {
    const tableData = filesState?.filesList?.files?.data?.map((item: any) => {
      return {
        id: item.id,
        name: item.name,
        size: Math.ceil(item.size / 1024 / 1024) + "MB",
        type: item.type,
        school: item.school_id,
        path: item.path,
        action: (
          <ActionDropdown
            id={item.id}
            actions=
            {
              (permissionsFile?.find((permission:any) => permission['view-file_managers'] === "1") && permissionsFile?.find((permission:any) => permission['delete-file_managers'] === "1")) ? 
                [
                {
                  name: "View",
                  action: () => {
                    window.open(item.path, '_blank');
                    // window.location.href = item.path;
                  },
                },
                {
                  name: "Delete",
                  action: () => {
                    setFileToDelete(item);
                    setDeleteModalOpen(true);
                  },
                },
              ]
            
            :
            (permissionsFile?.find((permission:any) => permission['view-file_managers'] === "1") && permissionsFile?.find((permission:any) => permission['delete-file_managers'] === "0")) ? 
    
              [
              {
                name: "View",
                action: () => {
                  window.open(item.path, '_blank'); 
                  // window.location.href = item.path;
                },
              },
              ]
            :
            (permissionsFile?.find((permission:any) => permission['view-file_managers'] === "0") && permissionsFile?.find((permission:any) => permission['delete-file_managers'] === "1")) ? 
    
              [
                {
                  name: "Delete",
                  action: () => {
                    setFileToDelete(item);
                    setDeleteModalOpen(true);
                  },
                },
              ]
              :
              [
                ""
              ]
            }
           
          />
        ),
      };
    });

    setRows({
      ...filesState?.filesList?.files,
      roles: tableData,
    });
  }, [filesState?.filesList]);

  return (
    <>
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            bgcolor: "#fff",

            borderBottom: "1px solid #091E4224",
          }}
        >
          <Typography variant="h5">File Management</Typography>{" "}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {
              (permissionsFile?.find((permission:any) => permission['add-file_managers'] === "1")) &&
                <Button
                  onClick={handleOpen}
                  label="Add File"
                  className="w-30 m-3"
                />
            }
          </Box>
        </Box>

        <Box
          sx={{
            mx: 2,
            m: 4,
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
            <Searchbar
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              onSearch={() => {
                setIsFiltered(true);
                setSelectedRows([]); // Clear selection when searching
                dispatch(getFilesList({ paginate: 10, search }));
              }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {" "}
              {/* {
              (permissionsFile?.find((permission:any) => permission['export-file_managers'] === "1")) &&
              <Button label="Export" type="bordered" className="w-30 m-3" />
              } */}
              {isFiltered && (
                <Button
                  label=""
                  type="bordered"
                  icon={CloseIcon}
                  onClick={() => {
                    setIsFiltered(false);
                    setSearch("");
                    setSelectedRows([]); // Clear selection when clearing filter
                    dispatch(getFilesList({ paginate: 10, page: 1 }));
                  }}
                  className="w-30 m-3"
                />
              )}
            </Box>
          </Box>
          <Divider />
          {selectedRows.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "#F3FFFA",
                borderBottom: "1px solid #091E4224",
              }}
            >
              <Typography variant="body1">
                {selectedRows.length} file{selectedRows.length > 1 ? "s" : ""} selected
              </Typography>
              {permissionsFile?.find((permission:any) => permission['delete-file_managers'] === "1") && (
                <Button
                  onClick={() => setBulkDeleteModalOpen(true)}
                  label={`Delete ${selectedRows.length} file${selectedRows.length > 1 ? "s" : ""}`}
                  type="danger"
                  className="w-auto"
                />
              )}
            </Box>
          )}
          <DataTable
            data={rows.roles}
            columns={columns}
            handleRowClick={handleRowClick}
            setSelectedRows={permissionsFile?.find((permission:any) => permission['delete-file_managers'] === "1") ? setSelectedRows : undefined}
            selectedRows={selectedRows}
          />
          <Pagination
            from={rows?.from}
            to={rows?.to}
            handleChangePage={handleChangePage}
            lastPage={rows?.last_page}
            currentPage={rows?.current_page}
            total={rows?.total}
            perPage={rows?.per_page}
          />
        </Box>
      </Box>
      <AddFileModal open={open} onClose={handleClose} />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        item="file"
        onConfirm={async () => {
          if (fileToDelete) {
            await dispatch(deleteFile(fileToDelete.id));
            await dispatch(getFilesList({ paginate: 10, page: currentPage || 1 }));
          }
        }}
      />
      <DeleteConfirmationModal
        open={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
        }}
        onConfirm={handleBulkDelete}
        item="file"
        count={selectedRows.length}
      />
    </>
  );
};

export default FileManagement;
