// renderer.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // optional: for global styles
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { presistor, store } from "./app/store.js";
import { PersistGate } from "redux-persist/integration/react";
import { MyContextProvider } from "./shared/context/MyContext.jsx";
import { AppPermissionContextProvider } from "./shared/context/Permission.context.jsx";
// Get the root element from HTML
const container = document.getElementById("root");

// Create React root and render App
const root = createRoot(container);
root.render(
    <HashRouter>
        <Provider store={store}>
            <PersistGate loading={null} persistor={presistor}>
                <MyContextProvider>
                    <AppPermissionContextProvider>
                        <App />
                    </AppPermissionContextProvider>
                </MyContextProvider>
            </PersistGate>
        </Provider>
    </HashRouter>,
);

