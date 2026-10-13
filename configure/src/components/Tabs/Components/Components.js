import { useConfigureText } from "../../../i18n";
import React from "react";
import { useMetadataText } from "../../../i18n";
import { metadataText } from "../../../i18n/metadata";
import { useSelector, useDispatch } from "react-redux";
import {} from "./ComponentsSlice";
import { makeStyles } from "@mui/styles";

import clsx from "clsx";

import { setModal } from "../../../core/ConfigureStore";

import ComponentModal from "./Modals/ComponentModal/ComponentModal";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

const useStyles = makeStyles((theme) => ({
  Components: {
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

export default function Components() {
  const ct = useConfigureText();
  const tMeta = useMetadataText();
  const c = useStyles();

  const dispatch = useDispatch();
  const configuration = useSelector((state) => state.core.configuration);
  const componentConfiguration = useSelector(
    (state) => state.core.componentConfiguration
  );

  // Component configuration is fetched in Main.js on mount
  // No need to fetch again here

  const handleClick = (componentName, componentConfig) => {
    dispatch(
      setModal({
        name: "component",
        on: true,
        componentName,
        componentConfig,
        onClose: () => {},
      })
    );
  };

  const getComponentCards = () => {
    const cards = [];

    if (componentConfiguration) {
      Object.keys(componentConfiguration)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key, idx) => {
          const cConfig = componentConfiguration[key];
          let comp = configuration.components?.filter((f) => f.name === key)[0];
          let componentActive = true;
          if (comp == null) {
            comp = {};
            componentActive = false;
          }
          if (comp?.on != null) componentActive = comp.on;
          cards.push(
            <Grid
              item
              xs={12}
              sm={6}
              md={6}
              lg={4}
              xl={3}
              onClick={() => {
                handleClick(key, cConfig);
              }}
              key={key}
            >
              <div className={c.card}>
                <div className={c.cardHeader}>
                  <div className={c.cardIcon}>
                    <i
                      className={`mdi mdi-${
                        comp.icon || cConfig.defaultIcon || "puzzle-outline"
                      } mdi-36px`}
                    ></i>
                  </div>
                  <div
                    className={clsx({
                      [c.cardOn]: componentActive,
                      [c.cardOff]: !componentActive,
                    })}
                  ></div>
                </div>
                <div className={c.cardName}>{metadataText(key, tMeta)}</div>
                <div className={c.cardContent}>
                  <div className={c.cardContentTitle}>
                    {metadataText(cConfig.description, tMeta)}
                  </div>
                  <div className={c.cardContentBody}>
                    {metadataText(cConfig.descriptionFull?.title, tMeta)}
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
            <div className={c.cardContentTitle}>{ct("ui.manage_components_via_the_plugin_cli_6cc88d")}</div>
            <div className={c.cardContentBody}>{ct("ui.run_b1b392")}<code>npm run plugins -- list</code>{ct("ui.to_see_installed_plugins_or_1559a2")}<code>npm run plugins -- create component &lt;Name&gt;
              --container &lt;container&gt;</code>{ct("ui.to_scaffold_a_new_one_see_90e6ed")}</div>
          </div>
        </div>
      </Grid>
    );

    return cards;
  };

  // Show the tab as long as there are components available to configure
  // (componentConfiguration has entries), even if none are enabled yet
  if (!componentConfiguration || Object.keys(componentConfiguration).length === 0) {
    return <div className={c.Components}>{ct("ui.no_components_available_4eb100")}</div>;
  }

  return (
    <>
      <div className={c.Components}>
        <Box sx={{ width: "100%", padding: "60px 120px" }}>
          <Grid
            container
            rowSpacing={4}
            columnSpacing={4}
            columns={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          >
            {getComponentCards()}
          </Grid>
        </Box>
      </div>

      <ComponentModal />
    </>
  );
}
