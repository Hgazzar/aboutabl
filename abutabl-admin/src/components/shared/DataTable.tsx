import React, { useEffect, useState } from "react";
import ReactDataTable from "react-data-table-component";
import Placeholder from "./Placeholder";
import Loading from "./Loading";

const conditionalRowStyles = [
  {
    when: (row: any) => row.index % 2 !== 0,
    style: {
      backgroundColor: "#fff", // Background color for odd rows
    },
  },
  {
    when: (row: any) => row.index % 2 === 0,
    style: {
      backgroundColor: "#F3FFFA", // Background color for even rows
    },
  },
];

const customStyles = {
  rows: {
    highlightOnHoverStyle: {
      backgroundColor: "#1EBBA3",
    },
    style: {
      minHeight: "72px", // override the row height
    },
  },
  headCells: {
    style: {
      backgroundColor: "#F3FFFA",
    },
  },
  cells: {
    style: {
      paddingRight: "10px",
    },
  },
};

const DataTable = ({
  data,
  columns,
  handleRowClick,
  isLoading = false,
  setSelectedRows,
  selectedRows,
}: any) => {
  const [dataIndexed, setDataIndexed] = useState<any>([]);

  const handleRowSelection = (state: any) => {
    if (setSelectedRows) {
      setSelectedRows(state.selectedRows);
    }
  };

  useEffect(() => {
    const IndexedData = data?.map((item: any, index: number) => {
      return {
        ...item,
        index: index + 1,
      };
    });
    setDataIndexed(IndexedData);
  }, [data]);

  return (
    <ReactDataTable
      columns={columns}
      data={dataIndexed}
      selectableRows={!!setSelectedRows}
      pointerOnHover
      conditionalRowStyles={conditionalRowStyles}
      customStyles={customStyles}
      noDataComponent={
        isLoading ? (
          <div className="my-20">
            <Loading />
          </div>
        ) : (
          <Placeholder />
        )
      }
      onSelectedRowsChange={handleRowSelection}
      highlightOnHover
      onRowClicked={handleRowClick}
    />
  );
};

export default DataTable;
