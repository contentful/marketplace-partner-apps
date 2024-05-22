import { getErrorMsg } from "@/utils/common";
import { useState } from "react";

export default function useError() {
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    if (typeof error === "string") {
      setError(error);
    } else {
      const errMsg = getErrorMsg(error);
      setError(errMsg);
    }
  };

  const clearError = () => {
    setError(null);
  }

  return { error, handleError, clearError };
}
