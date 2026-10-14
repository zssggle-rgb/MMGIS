import { useConfigureText } from "../../../i18n";
import React, { useEffect } from "react";
import { useMetadataText } from "../../../i18n";
import { metadataText } from "../../../i18n/metadata";
import { useSelector, useDispatch } from "react-redux";
import {} from "./ToolsSlice";
import { makeStyles } from "@mui/styles";

import clsx from "clsx";

import { calls } from "../../../core/calls";
import {
  setToolConfiguration,
  setSnackBarText,
  setModal,
} from "../../../core/ConfigureStore";

import ToolModal from "./Modals/ToolModal/ToolModal";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

const useStyles = makeStyles((theme) => ({
  Tools: {
    width: "100%",
    display: "flex",
    background: theme.palette.swatches.grey[1000],
    paddingBottom: "64px",
    backgroundImage: "url(configure/build/gridlines.png)",
  },
  card: {
    height: "300px",
    background: theme.palette.swatches.grey[900],
    border: `1px solid ${theme.palette.swatches.grey[800]}`,
    borderRadius: "3px",
    overflow: "auto",
    boxShadow:
      "rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px",
    transition: "background 0.2s ease-in-out",
    "&:hover": {
      background: theme.palette.swatches.grey[850],
      cursor: "pointer",
    },
  },
  cardHeader: {
    height: "58px",
    lineHeight: "58px",
    display: "flex",
    justifyContent: "space-between",
  },
  cardIcon: {
    width: "58px",
    height: "58px",
    paddingLeft: "13px",
  },
  cardName: {
    fontWeight: "bold",
    letterSpacing: "2px",
    fontSize: "18px",
    paddingLeft: "16px",
    color: theme.palette.swatches.grey[200],
    textTransform: "uppercase",
  },
  cardOn: {
    width: "20px",
    height: "20px",
    margin: "19px",
    borderRadius: "3px",
    background: theme.palette.accent.main,
  },
  cardOff: {
    width: "20px",
    height: "20px",
    margin: "19px",
    borderRadius: "3px",
    background: theme.palette.swatches.grey[800],
  },
  cardContent: {
    padding: "8px 16px 16px 16px",
  },
  cardContentTitle: {
    color: theme.palette.swatches.grey[500],
    marginBottom: "8px",
    fontStyle: "italic",
  },
  cardContentBody: {
    color: theme.palette.swatches.grey[200],
  },
}));

export default function Tools() {
  const ct = useConfigureText();
  const tMeta = useMetadataText();
  const c = useStyles();

  const dispatch = useDispatch();
  const mission = useSelector((state) => state.core.mission);
  const configuration = useSelector((state) => state.core.configuration);
  const toolConfiguration = useSelector(
    (state) => state.core.toolConfiguration
  );

  useEffect(() => {
    if (mission != null)
      calls.api(
        "getToolConfig",
        null,
        (res) => {
          dispatch(setToolConfiguration(res));
        },
        (res) => {
          dispatch(
            setSnackBarText({
              text:
                res?.message || ct("ui.failed_to_get_tool_configuration_template_77dadd"),
              severity: "error",
            })
          );
        }
      );
  }, []);

  const handleClick = (toolName, toolConfig) => {
    dispatch(
      setModal({
        name: "tool",
        on: true,
        toolName,
        toolConfig,
        onClose: () => {},
      })
    );
  };

  const getToolCards = () => {
    const cards = [];

    if (toolConfiguration) {
      Object.keys(toolConfiguration)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key, idx) => {
          const tConfig = toolConfiguration[key];
          let t = configuration.tools.filter((f) => f.name === key)[0];
          let toolActive = true;
          if (t == null) {
            t = {};
            toolActive = false;
          }
          if (t?.on != null) toolActive = t.on;
          cards.push(
            <Grid
              item
              xs={12}
              sm={6}
              md={6}
              lg={4}
              xl={3}
              onClick={() => {
                handleClick(key, tConfig);
              }}
              key={key}
            >
              <div className={c.card}>
                <div className={c.cardHeader}>
                  <div className={c.cardIcon}>
                    <i
                      className={`mdi mdi-${
                        t.icon || tConfig.defaultIcon || "puzzle-outline"
                      } mdi-36px`}
                    ></i>
                  </div>
                  <div
                    className={clsx({
                      [c.cardOn]: toolActive,
                      [c.cardOff]: !toolActive,
                    })}
                  ></div>
                </div>
                <div className={c.cardName}>{metadataText(key, tMeta)}</div>
                <div className={c.cardContent}>
                  <div className={c.cardContentTitle}>
                    {metadataText(tConfig.description, tMeta)}
                  </div>
                  <div className={c.cardContentBody}>
                    {metadataText(tConfig.descriptionFull?.title, tMeta)}
                  </div>
                </div>
              </div>
            </Grid>
          );
        });
    }

    // Add the plugin info card
    cards.push(
      <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key="plugin-info">
        <div className={c.card}>
          <div className={c.cardHeader}>
            <div className={c.cardIcon}>
              <i className="mdi mdi-puzzle-outline mdi-36px"></i>
            </div>
            <div className={c.cardOff}></div>
          </div>
          <div className={c.cardName}>{ct("ui.external_plugins_b177a7")}</div>
          <div className={c.cardContent}>
            <div className={c.cardContentTitle}>{ct("ui.manage_tools_via_the_plugin_cli_435be3")}</div>
            <div className={c.cardContentBody}>{ct("ui.run_b1b392")}<code>npm run plugins -- list</code>{ct("ui.to_see_installed_plugins_or_1559a2")}<code>npm run plugins -- create tool &lt;Name&gt; --container
              &lt;container&gt;</code>{ct("ui.to_scaffold_a_new_one_see_90e6ed")}</div>
          </div>
        </div>
      </Grid>
    );

    return cards;
  };

  if (configuration?.tools?.length == null) {
    return <div className={c.Tools}>{ct("ui.not_found_475c84")}</div>;
  }

  return (
    <>
      <div className={c.Tools}>
        <Box sx={{ width: "100%", padding: "60px 120px" }}>
          <Grid
            container
            rowSpacing={4}
            columnSpacing={4}
            columns={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          >
            {getToolCards()}
          </Grid>
        </Box>
      </div>

      <ToolModal />
    </>
  );
}
