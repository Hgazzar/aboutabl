import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import BrowserRouter from "./config/BrowserRouter";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./config/queryClient"; // Import the queryClient
import { AudioProvider } from "./context/AudioContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* @ts-ignore */}
      <AudioProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter> 
        </QueryClientProvider>
      </AudioProvider>
    </Provider>
  </React.StrictMode>
);
