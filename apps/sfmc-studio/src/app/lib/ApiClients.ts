import axios from 'axios';
import { environment } from './Constants';

export const ApiClient = (url: string = environment.NEXT_PUBLIC_API_ENDPOINT as string) => {
  return axios.create({
    baseURL: url,
  });
};
