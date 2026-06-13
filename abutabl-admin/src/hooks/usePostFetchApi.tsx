import { useQuery } from "react-query";
import axios from "axios";
import { buildUrl } from "../utils/fetchMethods";

export function usePostFetchApi(endPoint: string, dataKey: string, data: any) {
  return useQuery(dataKey, () => fetchData(endPoint, data));
}

function fetchData(endPoint: string, data: any) {
  const headers = {
    apiSecret: process.env.API_SECRET,
  };

  return axios
    .post(buildUrl(process.env.BASE_URL, endPoint), data, { headers })
    .then((response) => response.data);
}
