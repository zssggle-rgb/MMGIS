import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import store from "./core/store";
import { Provider } from "react-redux";

import "@fontsource/roboto";

import { ThemeProvider } from "@mui/material/styles";
import muiTheme from "./themes/light.js";

import { Routings } from "./core/routes/routes";
import { I18nextProvider } from "react-i18next";
import { i18n, localeReady } from "./i18n";

localeReady.then(() => ReactDOM.render(
  <I18nextProvider i18n={i18n}>
  <Provider store={store}>
    <ThemeProvider theme={muiTheme}>
      <Routings />
    </ThemeProvider>
  </Provider>
  </I18nextProvider>,
  document.getElementById("root")
)).catch(() => {
  document.getElementById("root").textContent = "界面加载失败，请刷新页面重试。";
});
