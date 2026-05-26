import React from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { DialogAppSDK } from "@contentful/app-sdk";
import FieldCheckDialog from "./FieldCheckDialog";
import SignInDialog from "./SignInDialog";

const DialogRouter: React.FC = () => {
  const sdk = useSDK<DialogAppSDK>();
  const params = sdk.parameters.invocation;

  if (
    params &&
    typeof params === "object" &&
    !Array.isArray(params) &&
    "signIn" in params &&
    Boolean((params as Record<string, unknown>).signIn)
  ) {
    return <SignInDialog />;
  }
  if (
    params &&
    typeof params === "object" &&
    !Array.isArray(params) &&
    "fieldCheck" in params &&
    Boolean((params as Record<string, unknown>).fieldCheck)
  ) {
    return <FieldCheckDialog />;
  }
  return <div>Unknown dialog type</div>;
};

export default DialogRouter;
