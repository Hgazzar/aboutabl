// import React, { forwardRef, useEffect, useState } from "react";
// import DatePicker, { CalendarContainer } from "react-datepicker";

// const CustomedDatePicker = ({ id, name, formik }: any) => {
//   const [startDate, setStartDate] = useState(new Date());
//   const ExampleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
//     <button
//       className="w-full border p-2 rounded-sm border-grayDarkHoverd flex flex-row justify-start"
//       onClick={onClick}
//       ref={ref}
//     >
//       {value}
//     </button>
//   ));

//   useEffect(() => {
//     const year = startDate.getFullYear();
//     const month = String(startDate.getMonth() + 1).padStart(2, "0");
//     const day = String(startDate.getDate()).padStart(2, "0");

//     formik?.setValues({ ...formik.values, [id]: `${year}-${month}-${day}` });
//   }, [startDate]);

//   return (
//     <DatePicker
//       selected={startDate}
//       onChange={(date: any) => setStartDate(date)}
//       id={id}
//       name={name}
//       customInput={<ExampleCustomInput />}
//     />
//   );
// };
// export default CustomedDatePicker;


import React, { forwardRef, useEffect, useState } from "react";
import DatePicker from "react-datepicker";

const CustomedDatePicker = ({ id, name, formik }: any) => {
  const [startDate, setStartDate] = useState(new Date(2000, 0, 1)); // تاريخ افتراضي أقدم

  const ExampleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
    <button
      className="w-full border p-2 rounded-sm border-grayDarkHoverd flex flex-row justify-start"
      onClick={onClick}
      ref={ref}
    >
      {value}
    </button>
  ));

  useEffect(() => {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");

    formik?.setValues({ ...formik.values, [id]: `${year}-${month}-${day}` });
  }, [startDate]);

  return (
    <DatePicker
      selected={startDate}
      onChange={(date: any) => setStartDate(date)}
      id={id}
      name={name}
      customInput={<ExampleCustomInput />}
      maxDate={new Date()} // يمنع اختيار تواريخ مستقبلية
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={100} // يعرض 100 سنة في القائمة المنسدلة
    />
  );
};

export default CustomedDatePicker;
