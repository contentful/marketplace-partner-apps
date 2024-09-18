import { createRoot } from "react-dom/client";
import { GlobalStyles } from "@contentful/f36-components";
import { SDKProvider } from "@contentful/react-apps-toolkit";

import App from "./App";
import { OpenDialogProvider } from "./providers";

const root = createRoot(document.getElementById("root")!);

root.render(
    <SDKProvider>
        <OpenDialogProvider>
            <GlobalStyles />
            <App />
        </OpenDialogProvider>
    </SDKProvider>,
);
