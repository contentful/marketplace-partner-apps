import axios from "axios";

export const ApiClient = (url?: string) => {
  return axios.create({
    baseURL: url,
  });
};
