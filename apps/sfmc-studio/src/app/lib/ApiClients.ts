import axios from "axios";

export const ApiClient = (
  url: string = process.env.NEXT_PUBLIC_API_ENDPOINT as string
) => {
  return axios.create({
    baseURL: url,
  });
};
