import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MsalProvider } from "@azure/msal-react";
import {
    Configuration,
    EventType,
    PublicClientApplication,
} from "@azure/msal-browser";

import App from "./App.tsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import Private from "./Private.tsx";

// Configuracion Authentication Microsoft

const msalConfiguration: Configuration = {
    auth: {
        clientId: "29f88bff-ab05-4fe0-bbc8-808272f11348", // the only mandatory field in this object, uniquely identifies your app
        // here you'll add the other fields that you might need based on the Azure portal settings
        redirectUri: "/", // Points to window.location.origin. You must register this URI on Azure Portal/App Registration.
        postLogoutRedirectUri: "/", // Indicates the page to navigate after logout.
    },
};

const msalInstance = new PublicClientApplication(msalConfiguration);

/**
 * MSAL should be instantiated outside of the component tree to prevent it from being re-instantiated on re-renders.
 * For more, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
 */

// Default to using the first account if no account is active on page load
if (
    !msalInstance.getActiveAccount() &&
    msalInstance.getAllAccounts().length > 0
) {
    // Account selection logic is app dependent. Adjust as needed for different use cases.
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

// Listen for sign-in event and set active account
msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
    }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId="440433504160-vk9l7n4c54lu736147buobtvucujm8t3.apps.googleusercontent.com">
        <MsalProvider instance={msalInstance}>
            <React.StrictMode>
                <Router>
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/private" element={<Private />} />
                    </Routes>
                </Router>
            </React.StrictMode>
        </MsalProvider>
    </GoogleOAuthProvider>
);
