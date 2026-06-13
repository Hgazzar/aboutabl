// import * as React from "react";
// import dayjs, { Dayjs } from "dayjs";
// import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { dateFormat } from "@/utils/functions";

// export default function DatePickerValue({ id, formik }: any) {
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       <DemoContainer components={["DatePicker", "DatePicker"]}>
//         <DatePicker
//           sx={{ width: "100%" }}
//           value={formik.values[id] && dayjs(formik.values[id])}
//           onChange={(newValue: any) => {
//             console.log(dateFormat(new Date(newValue.$d)));

//             formik.setValues({
//               ...formik.values,
//               [id]: dateFormat(new Date(newValue.$d)),
//             });
//           }}
//         />
//       </DemoContainer>
//     </LocalizationProvider>
//   );
// }

import * as React from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { dateFormat } from "@/utils/functions";

export default function DatePickerValue({ id, formik }: any) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        sx={{ width: "100%" }}
        value={
          formik.values[id] ? dayjs(formik.values[id]) : dayjs("2000-01-01")
        }
        onChange={(newValue: any) => {
          formik.setValues({
            ...formik.values,
            [id]: dateFormat(new Date(newValue.$d)),
          });
        }}
        maxDate={dayjs()} // يمنع اختيار تواريخ مستقبلية
      />
    </LocalizationProvider>
  );
}
