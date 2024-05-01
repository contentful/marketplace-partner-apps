import { useMemo } from "react";
import { APIController } from "../api";

export const useApi = (backendUrl: string) => useMemo(() => new APIController(backendUrl), [backendUrl]);
