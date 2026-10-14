import { useConfigureText } from "../../../i18n";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setVersions } from "./HomeSlice";
import { makeStyles } from "@mui/styles";

import { calls } from "../../../core/calls";
import { downloadObject } from "../../../core/utils";
import Maker from "../../../core/Maker";
import { setSnackBarText, setModal } from "../../../core/ConfigureStore";

import Versions from "./Versions";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import BrowserUpdatedIcon from "@mui/icons-material/BrowserUpdated";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";

import config from "../../../metaconfigs/tab-home-config.json";
import UploadConfigModal from "./Modals/UploadConfigModal/UploadConfigModal";
import CloneConfigModal from "./Modals/CloneConfigModal/CloneConfigModal";
import DeleteConfigModal from "./Modals/DeleteConfigModal/DeleteConfigModal";

const REFERENCE_MISSION_NAMES = new Set([
  "Reference-Mission",
  "Reference-Mission-Lunar-SouthPole",
  "Reference-Mission-Mars",
]);

const useStyles = makeStyles((theme) => ({
  Home: {
    width: "100%",
    display: "flex",
    flexFlow: "column",
    background: theme.palette.swatches.grey[1000],
    padding: "0px 32px 64px 32px",
    boxSizing: "border-box",
    backgroundImage: "url(configure/build/gridlines.png)",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    margin: "20px 0px 8px 0px",
  },
  title: {
    letterSpacing: "2px",
    color: theme.palette.swatches.p[0],
    textShadow: `0px 2px 1px ${theme.palette.swatches.grey[300]}`,
    fontSize: "48px",
    margin: 0,
  },
  right: {
    display: "flex",
  },
  exportIcon: {
    color: `${theme.palette.swatches.p[11]} !important`,
    width: "40px",
    height: "40px",
    margin: "9px !important",
  },
  uploadIcon: {
    width: "40px",
    height: "40px",
    margin: "9px !important",
  },
  cloneIcon: {
    color: `${theme.palette.accent.main} !important`,
    width: "40px",
    height: "40px",
    margin: "9px !important",
  },
  deleteIcon: {
    color: `${theme.palette.swatches.red[500]} !important`,
    width: "40px",
    height: "40px",
    margin: "9px !important",
  },
  saveToBaseButton: {
    color: "white !important",
    background: "#24806d !important",
    borderRadius: "3px !important",
    margin: "9px !important",
    fontWeight: "600 !important",
    textTransform: "none !important",
    padding: "8px 16px !important",
    fontSize: "0.875rem !important",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2) !important",
    "&:hover": {
      boxShadow: "0 4px 8px rgba(0,0,0,0.3) !important",
    },
  },
}));

export default function Home() {
  const ct = useConfigureText();
  const c = useStyles();

  const dispatch = useDispatch();
  const mission = useSelector((state) => state.core.mission);
  const configuration = useSelector((state) => state.core.configuration);

  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Detect development mode via window.mmgisglobal
    setIsDevelopment(window.mmgisglobal?.NODE_ENV === "development");
  }, []);

  const queryVersions = () => {
    if (mission != null)
      calls.api(
        "versions",
        { mission: mission },
        (res) => {
          const v = res?.versions || [];
          if (v.length > 0) v[v.length - 1].current = true;
          dispatch(setVersions(res?.versions || []));
        },
        (res) => {
          dispatch(
            setSnackBarText({
              text:
                res?.message || ct("ui.failed_to_get_the_history_for_447680"),
              severity: "error",
            }),
          );
        },
      );
  };

  const handleExport = () => {
    downloadObject(configuration, `${mission}_WORKING_config`, ".json");
    dispatch(
      setSnackBarText({
        text: ct("ui.successfully_exported_working_configuration_json_51a4a0"),
        severity: "success",
      }),
    );
  };
  const handleUpload = () => {
    dispatch(
      setModal({
        name: "uploadConfig",
      }),
    );
  };
  const handleClone = () => {
    dispatch(
      setModal({
        name: "cloneConfig",
      }),
    );
  };
  const handleDelete = () => {
    dispatch(
      setModal({
        name: "deleteConfig",
      }),
    );
  };

  const handleSaveToBase = () => {
    calls.api(
      "reference_mission_save_to_base",
      { mission: mission },
      (res) => {
        dispatch(
          setSnackBarText({
            text: res?.message || ct("ui.successfully_saved_config_to_base_template_b8cd9e"),
            severity: "success",
          }),
        );
      },
      (res) => {
        dispatch(
          setSnackBarText({
            text: res?.message || ct("ui.failed_to_save_config_to_base_11c483"),
            severity: "error",
          }),
        );
      },
    );
  };

  return (
    <>
      <div className={c.Home}>
        <div className={c.top}>
          <h2 className={c.title}>{mission}</h2>
          <div className={c.right}>
            <Tooltip
              title={ct("ui.export_unsaved_config_json_bd0740")}
              placement="bottom"
              arrow
            >
              <IconButton
                className={c.exportIcon}
                title={ct("ui.export_unsaved_1c5829")}
                aria-label={ct("ui.export_unsaved_9febaf")}
                onClick={handleExport}
              >
                <BrowserUpdatedIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <Tooltip title={ct("ui.upload_config_json_814da8")} placement="bottom" arrow>
              <IconButton
                className={c.uploadIcon}
                title={ct("ui.upload_8bdf05")}
                aria-label={ct("ui.upload_bb73aa")}
                onClick={handleUpload}
              >
                <UploadIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <Tooltip title={ct("ui.clone_mission_40dd12")} placement="bottom" arrow>
              <IconButton
                className={c.cloneIcon}
                title={ct("ui.clone_d8cdb5")}
                aria-label={ct("ui.clone_5e0072")}
                onClick={handleClone}
              >
                <ContentCopyIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <Tooltip title={ct("ui.delete_mission_2445c2")} placement="bottom" arrow>
              <IconButton
                className={c.deleteIcon}
                title={ct("ui.delete_f6fdbe")}
                aria-label={ct("ui.delete_948598")}
                onClick={handleDelete}
              >
                <DeleteForeverIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            {REFERENCE_MISSION_NAMES.has(mission) && isDevelopment && (
              <Button
                variant="contained"
                color="success"
                className={c.saveToBaseButton}
                onClick={handleSaveToBase}
                startIcon={<SaveIcon />}
              >{ct("ui.save_to_base_blueprint_fc99e6")}{" "}
                <span
                  style={{
                    marginLeft: "4px",
                    fontSize: "0.75rem",
                    opacity: 0.9,
                  }}
                >{ct("ui.dev_only_21ac9d")}</span>
              </Button>
            )}
          </div>
        </div>
        <Versions queryVersions={queryVersions} />
        <Maker config={config} />
      </div>
      <UploadConfigModal queryVersions={queryVersions} />
      <CloneConfigModal />
      <DeleteConfigModal />
    </>
  );
}
