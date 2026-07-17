import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/scss/app.scss";
import { BrowserRouter } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store";
import "./i18n";

// ✅ thêm react-query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// tạo client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ❌ tắt mặc định
      refetchOnMount: false, // (tuỳ chọn) tránh mount lại là gọi API
      refetchOnReconnect: false, // (tuỳ chọn) khi mất mạng → có lại
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode> làm cho call api 2 lần
  <BrowserRouter>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </BrowserRouter>,
  // </React.StrictMode>,
);
