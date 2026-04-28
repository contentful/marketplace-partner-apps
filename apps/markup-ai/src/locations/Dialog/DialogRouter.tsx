import React from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { DialogAppSDK } from "@contentful/app-sdk";
import Dialog from "./Dialog";
import FieldCheckDialog from "./FieldCheckDialog";
import SignInDialog from "./SignInDialog";
import { MoreDetailsDialog } from "../../components/FieldCheckCard/MoreDetailsDialog";
import type { RewriteDialogParams } from "./dialogTypes";

const DialogRouter: React.FC = () => {
  const sdk = useSDK<DialogAppSDK>();
  const params = sdk.parameters.invocation;

  // Use a property to distinguish dialogs
  if (
    params &&
    typeof params === "object" &&
    !Array.isArray(params) &&
    "startRewrite" in params &&
    (params as unknown as RewriteDialogParams).startRewrite
  ) {
    return <Dialog />;
  }
  // Compact sign-in dialog
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
  if (params && typeof params === "object" && !Array.isArray(params) && "checkResponse" in params) {
    return <MoreDetailsDialog />;
  }
  return <div>Unknown dialog type</div>;
};

export default DialogRouter;
