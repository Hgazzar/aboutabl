import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Button from "../../components/shared/Button";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Searchbar from "../../components/shared/Searchbar";
import Pagination from "../../components/shared/Pagination";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DataTable from "../../components/shared/DataTable";
import InfoCard from "../../components/shared/InfoCard";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import SwitchBox from "../../components/shared/SwitchBox";
import SelectBox from "../../components/shared/SelectBox";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteSchool,
  getSchoolList,
  resetSteps,
  setSchoolStatus,
  uploadSchools,
} from "../../redux/reducers/schoolReducer";
import { buildTemplateUrl } from "../../utils/fetchMethods";
import { RootState } from "../../redux/store";
import ActionDropdown from "../../components/shared/ActionDropdown";
import ImportCSVModal from "../../components/modals/ImportCSVModal";
import LoadingWrapper from "@/components/shared/LoadingWrapper";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

const SchoolList = () => {
  const permissionState = useSelector((state: RootState) => state.permissions);
  const permissionsSchools = permissionState?.permissions?.schools;

  const editSchools = permissionsSchools?.find(
    (permission: any) => permission["edit-schools"] === "1"
  );
  const deleteSchools = permissionsSchools?.find(
    (permission: any) => permission["delete-schools"] === "1"
  );
  const addSchools = permissionsSchools?.find(
    (permission: any) => permission["add-schools"] === "1"
  );
  const viewSchools = permissionsSchools?.find(
    (permission: any) => permission["view-schools"] === "1"
  );
  const activationSchools = permissionsSchools?.find(
    (permission: any) => permission["activation-schools"] === "1"
  );

  const columns = [
    {
      name: "School Name",
      selector: (row: any) => row.name,
      width: "20%",
    },
    {
      name: "Address",
      selector: (row: any) => row.address,
      width: "20%",
    },
    {
      name: "Government",
      selector: (row: any) => row.government,
      width: "20%",
    },
    {
      name: "City",
      selector: (row: any) => row.city,
    },
    activationSchools
      ? {
          name: "Status",
          selector: (row: any) => row.status,
        }
      : "",
    {
      name: "Action",
      selector: (row: any) => row.action,
      width: "7%",
    },
  ];
  // ------------- hooks ---------------
  const [isFiltered, setIsFiltered] = useState(false);
  const [file, setFile] = useState<any>("");
  const [rows, setRows] = useState<any>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const schoolState = useSelector((state: RootState) => state.school);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<any>(null);
  // ------------ functions --------------
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleRowClick = (row: any) => {
    viewSchools && navigate(`/school/profile/${row.id}`);
  };

  const handleChangePage = async (page: number) => {
    setIsLoading(true);
    await dispatch(getSchoolList({ paginate: 10, page }));
    setCurrentPage(page);
    setIsLoading(false);
  };

  // ------------- side effects ---------------
  useEffect(() => {
    (async () => {
      await dispatch(getSchoolList({ paginate: 10, page: 1 }));
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const tableData = schoolState?.schoolList?.schools?.data?.map(
      (item: any) => {
        return {
          id: item.id,
          name: item.name,
          contactNumber: item.contanct_number,
          status: (
            <SwitchBox
              value={item.status === "1" ? true : false}
              onChange={async () => {
                await dispatch(setSchoolStatus(item.id));
                await dispatch(getSchoolList({ paginate: 10, page: 1 }));
              }}
            />
          ),
          government: item.govern,
          city: item.city,
          address: item.address,
          action: (
            <ActionDropdown
              id={item.id}
              actions={[
                editSchools
                  ? {
                      name: "Edit & View",
                      action: () => {
                        navigate(`/school/profile/${item.id}`);
                      },
                    }
                  : "",
                deleteSchools
                  ? {
                      name: "Delete",
                      action: () => {
                        setSchoolToDelete(item);
                        setDeleteModalOpen(true);
                      },
                    }
                  : "",
              ]}
            />
          ),
        };
      }
    );

    setRows({
      ...schoolState.schoolList,
      schools: tableData,
    });
  }, [schoolState.schoolList]);

  const downloadBlankFile = async () => {
    window.open(
      buildTemplateUrl(process.env.REACT_APP_BASE_URL, "/Schools Template.xlsx"),
      "_blank"
    );
  };
  const [fileSchools, setFileSchools] = useState<any>(null);
  const fileInput: any = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsUploading(true);
      if (fileSchools) {
        await dispatch(uploadSchools({ file: fileSchools }));
        await dispatch(getSchoolList({ paginate: 10 }));
      }
      setFileSchools(null);
      setIsUploading(false);
    })();
  }, [fileSchools]);

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

            border: "1px solid #091E4224",
          }}
        >
          <Typography variant="h5">Schools list</Typography>{" "}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {addSchools && (
              <>
                <Button
                  label="Download blank excel"
                  type="bordered"
                  className="w-30 m-3"
                  onClick={downloadBlankFile}
                />
                <Button
                  onClick={() => {
                    fileInput?.current?.click();
                  }}
                  label="Upload Schools"
                  type="bordered"
                  className="w-30 m-3"
                />
                {!isUploading && (
                  <input
                    style={{ display: "none" }}
                    ref={fileInput}
                    type="file"
                    id="file-upload-schools"
                    name="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event: any) => {
                      const fileList = event.target.files;
                      if (!fileList) return;
                      setFileSchools(fileList[0]);
                    }}
                  />
                )}
                {/* <Button
                  label="Upload from CSV"
                  type="bordered"
                  icon={NoteAddIcon}
                  className="w-30 m-3"
                  onClick={() => {
                    handleOpen();
                  }}
                /> */}
                <Button
                  onClick={() => {
                    dispatch(resetSteps());
                    navigate("add-school");
                  }}
                  label="Add School"
                  className="w-30 m-3"
                />
              </>
            )}
          </Box>
        </Box>
        <LoadingWrapper isLoading={isLoading}>
          <>
            <Box>
              <Grid container columnGap={3} sx={{ py: 4 }}>
                <InfoCard title={"No of schools"} value={rows.schools_count} />
                <InfoCard
                  title={"Active schools"}
                  value={rows.schools_active}
                />
                <InfoCard
                  title={"Inactive schools"}
                  value={rows.schools_inactive}
                />
                <InfoCard title={"New schools"} value={rows.schools_new} />
              </Grid>
            </Box>
            <Box
              sx={{
                mr: 2,
                mb: 2,
                boxShadow: "unset",
                border: "1px solid #091E4224",
                borderRadius: "5px",
                bgcolor: "#fff",
              }}
            >
              {schoolState?.schoolList?.schools?.total === 0 ||
              !schoolState?.schoolList?.schools?.data?.length ? (
                <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    You are not assigned to any school.
                  </Typography>
                </Box>
              ) : (
                <>
                  <DataTable
                    handleRowClick={handleRowClick}
                    data={rows?.schools}
                    columns={columns}
                  />
                  <Pagination
                    from={schoolState?.schoolList?.schools?.from}
                    to={schoolState?.schoolList?.schools?.to}
                    lastPage={schoolState?.schoolList?.schools?.last_page}
                    currentPage={schoolState?.schoolList?.schools?.current_page}
                    total={schoolState?.schoolList?.schools?.total}
                    perPage={schoolState?.schoolList?.schools?.per_page}
                    handleChangePage={handleChangePage}
                  />
                </>
              )}
            </Box>
          </>
        </LoadingWrapper>
      </Box>
      <ImportCSVModal
        open={open}
        onClose={handleClose}
        setFile={setFile}
        fileName={"Schools"}
        file={file}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSchoolToDelete(null);
        }}
        onConfirm={async () => {
          if (schoolToDelete) {
            await dispatch(deleteSchool(schoolToDelete.id));
            await dispatch(
              getSchoolList({ paginate: 10, page: currentPage || 1 })
            );
          }
        }}
        item="School"
      />
    </>
  );
};

export default SchoolList;
