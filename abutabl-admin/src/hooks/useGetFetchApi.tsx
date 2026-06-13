import { useQuery } from "react-query";
import axios from "axios";

export function useGetFetchApi(endPoint: string, dataKey: string) {
  return useQuery(dataKey, () => fetchData(endPoint));
}

function fetchData(endPoint: string) {
  const headers = {
    // Add your headers here
    apiSecret: process.env.API_SECRET,
  };

  return axios.get(endPoint, { headers }).then((response) => response.data);
}
