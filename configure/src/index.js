import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import store from "./core/store";
import { Provider } from "react-redux";

import "@fontsource/roboto";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { zhCN, enUS } from "@mui/material/locale";
import muiTheme from "./themes/light.js";

import { Routings } from "./core/routes/routes";
import { I18nextProvider } from "react-i18next";
import { i18n, localeReady, useConfigureText } from "./i18n";

function LocalizedTheme({ children }) {
  useConfigureText();
  const theme = React.useMemo(
    () => createTheme(muiTheme, i18n.language === "zh-CN" ? zhCN : enUS),
    [i18n.language]
  );
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

localeReady.then(() => ReactDOM.render(
  <I18nextProvider i18n={i18n}>
  <Provider store={store}>
    <LocalizedTheme>
      <Routings />
    </LocalizedTheme>
  </Provider>
  </I18nextProvider>,
  document.getElementById("root")
)).catch(() => {
  document.getElementById("root").textContent = "界面加载失败，请刷新页面重试。";
});
