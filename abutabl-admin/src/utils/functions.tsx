export const selectBoxOptions = (values: any, label: any) => {
  if (values) {
    const options = values?.map((item: any) => {
      return item?.status && item?.status === "0"
        ? {}
        : {
            label: item[label],
            value: item?.id,
          };
    });

    return options?.length ? options : [];
  }
};

export const dateFormat = (date: any) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function splitArray(arr: any[], chunkSize: number) {
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}
