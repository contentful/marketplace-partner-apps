import React, { useEffect } from "react";
import type { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";

const Page = () => {
    const sdk = useSDK<PageAppSDK>();

    useEffect(() => {
        sdk.navigator.openAppConfig();
    }, [sdk]);

    return <></>;
};

export default Page;
