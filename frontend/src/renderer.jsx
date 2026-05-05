// renderer.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // optional: for global styles
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { presistor, store } from "./app/store.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistGate } from "redux-persist/integration/react";
import { MyContextProvider } from "./context/MyContext.jsx";
import { AppPermissionContextProvider } from "./context/Permission.context.jsx";
// Get the root element from HTML
const container = document.getElementById("root");

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
        },
    },
});

// Create React root and render App
const root = createRoot(container);
root.render(
    <HashRouter>
        <Provider store={store}>
            <PersistGate loading={null} persistor={presistor}>
                <QueryClientProvider client={queryClient}>
                  <MyContextProvider>
                    <AppPermissionContextProvider>
                          <App />
                    </AppPermissionContextProvider>
                  </MyContextProvider>
                </QueryClientProvider>
            </PersistGate>
        </Provider>
    </HashRouter>,
);
