import { useConfigureText, i18n, switchLocale } from "../../i18n";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {} from "./PanelSlice";
import { makeStyles } from "@mui/styles";
import mmgisLogo from "../../images/mmgis.png";
import packageJson from "../../../package.json";

import clsx from "clsx";

import {
  setMission,
  setModal,
  setPage,
  setSnackBarText,
} from "../../core/ConfigureStore";
import { calls } from "../../core/calls";

import NewMissionModal from "./Modals/NewMissionModal/NewMissionModal";

import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import ShapeLineIcon from "@mui/icons-material/ShapeLine";
import KeyIcon from "@mui/icons-material/Key";
import SettingsIcon from "@mui/icons-material/Settings";
import PhishingIcon from "@mui/icons-material/Phishing";
import ApiIcon from "@mui/icons-material/Api";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HorizontalSplitIcon from "@mui/icons-material/HorizontalSplit";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import WarningIcon from "@mui/icons-material/Warning";

const useStyles = makeStyles((theme) => ({
  Panel: {
    width: "220px",
    height: "100%",
    background: theme.palette.secondary.main,
    backgroundImage: "url(configure/build/contours.png)",
    backgroundSize: "200%",
    display: "flex",
    flexFlow: "column",
  },
  title: {
    padding: "30px 0px 10px 0px",
    textAlign: "center",
  },
  titleImage: {
    height: "30px",
  },
  configurationName: {
    color: theme.palette.swatches.grey[700],
    fontSize: "13px",
    marginTop: "-5px",
    textTransform: "uppercase",
    "& > span": {
      color: theme.palette.accent.main,
    },
  },
  version: {
    color: theme.palette.swatches.grey[600],
    fontSize: "10px",
    fontFamily: "monospace",
    marginTop: "2px",
    textAlign: "center",
  },
  versionMismatch: {
    color: "#ff9800",
    fontSize: "10px",
    fontFamily: "monospace",
    marginTop: "2px",
    textAlign: "center",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    "& svg": {
      fontSize: "12px",
    },
  },
  versionMismatchTooltip: {
    background: theme.palette.secondary.main,
    padding: "8px",
    "& > div:first-child": {
      marginBottom: "4px",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      color: "#ff9800",
    },
  },
  newMission: {
    width: "100%",
  },
  newMissionButton: {
    width: "100%",
    color: `${theme.palette.swatches.grey[900]} !important`,
    background: `${theme.palette.swatches.grey[300]} !important`,
    "&:hover": {
      background: `${theme.palette.swatches.p[0]} !important`,
      color: `${theme.palette.swatches.grey[0]} !important`,
    },
  },
  missions: {
    flex: 1,
    overflowY: "auto",
  },
  missionsUl: {
    listStyleType: "none",
    padding: 0,
    margin: "10px 0px",
    borderTop: `1px solid ${theme.palette.swatches.grey[300]} !important`,
  },
  missionsLi: {
    borderBottom: `1px solid ${theme.palette.swatches.grey[300]} !important`,
  },
  missionButton: {
    width: "100%",
    background: "rgba(255,255,255,0.06) !important",
    color: `${theme.palette.swatches.grey[900]} !important`,
    textTransform: "capitalize !important",
    justifyContent: "end !important",
    textAlign: "right !important",
    fontSize: "16px !important",
    padding: "3px 16px !important",
    transition:
      "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 250ms ease-out 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
  },
  missionActive: {
    background: `${theme.palette.swatches.grey[1000]} !important`,
    color: `${theme.palette.swatches.grey[100]} !important`,
    fontWeight: "bold !important",
  },
  missionNotActive: {
    "&:hover": {
      background: `${theme.palette.swatches.grey[200]} !important`,
    },
  },
  missionDisabled: {
    opacity: "0.3 !important",
    cursor: "not-allowed !important",
    pointerEvents: "all !important",
    "&:hover": {
      background: "unset !important",
    },
  },
  pages: {
    bottom: "0px",
    display: "flex",
    flexFlow: "column",
    width: "100%",
    borderTop: `2px solid ${theme.palette.swatches.grey[300]}`,
  },
  pageButton: {
    width: "100%",
    borderTop: `1px solid ${theme.palette.swatches.grey[300]} !important`,
    color: `${theme.palette.swatches.grey[700]} !important`,
    textTransform: "capitalize !important",
    justifyContent: "start !important",
    fontSize: "14px !important",
    padding: "3px 16px !important",
    background: "rgba(255,255,255,0.06) !important",
    transition:
      "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 250ms ease-out 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    "&:hover": {
      color: `${theme.palette.swatches.grey[900]} !important`,
      background: `${theme.palette.swatches.grey[200]} !important`,
    },
    "& svg": {
      fontSize: "16px !important",
    },
  },
}));

export default function Panel() {
  const ct = useConfigureText();
  const c = useStyles();
  const dispatch = useDispatch();

  const missions = useSelector((state) => state.core.missions);
  const activeMission = useSelector((state) => state.core.mission);
  const [userPermissions, setUserPermissions] = useState(null);

  // Fetch user permissions to determine which missions can be edited
  useEffect(() => {
    calls.api(
      "user_permissions",
      {},
      (res) => {
        setUserPermissions(res);
      },
      (res) => {
        dispatch(
          setSnackBarText({
            text: res?.message || ct("ui.failed_to_get_user_permissions_814cb5"),
            severity: "error",
          })
        );
      }
    );
  }, [dispatch]);

  const canEditMission = (mission) => {
    if (!userPermissions) return true; // Default to allowing until we know
    if (userPermissions.permission === "111") return true; // SuperAdmin can edit all
    if (userPermissions.permission !== "110") return false; // Non-admins, who can't even access this page, can't edit any

    const managingMissions = userPermissions.missions_managing || [];
    return managingMissions.includes(mission);
  };

  // Version mismatch detection
  const buildVersion = packageJson.version;
  const serverVersion = window.mmgisglobal?.VERSION;
  const isVersionMismatch =
    buildVersion && serverVersion && buildVersion !== serverVersion;

  // Log version mismatch for debugging
  useEffect(() => {
    if (isVersionMismatch) {
      console.warn(
        `⚠️ Version Mismatch Detected!\nConfigure UI (build): v${buildVersion}\nServer: v${serverVersion}\n\nPlease refresh the page or contact your administrator.`
      );
    }
  }, [isVersionMismatch, buildVersion, serverVersion]);

  return (
    <>
      <div className={c.Panel}>
        <div className={c.title}>
          <img className={c.titleImage} src={mmgisLogo} alt="MMGIS"></img>
          <div className={c.configurationName}>
            <span>{ct("ui.config_885114")}</span></div>
          {buildVersion && (
            <>
              {isVersionMismatch ? (
                <Tooltip
                  title={
                    <div className={c.versionMismatchTooltip}>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{ct("ui.version_mismatch_63a72f")}</div>
                      <div>{ct("ui.configure_ui_v_4fd42b")}{buildVersion}</div>
                      <div>{ct("ui.server_v_86577e")}{serverVersion}</div>
                      <div style={{ marginTop: "4px", fontSize: "11px" }}>{ct("ui.please_refresh_or_contact_admin_1eef22")}</div>
                    </div>
                  }
                  placement="right"
                  arrow
                >
                  <div className={c.versionMismatch}>
                    <WarningIcon />
                    <span>v{buildVersion}</span>
                  </div>
                </Tooltip>
              ) : (
                <div className={c.version}>v{buildVersion}</div>
              )}
            </>
          )}
        </div>
        <Button
          className={c.pageButton}
          aria-label={ct("language.switch")}
          onClick={() => {
            switchLocale(i18n.language === "zh-CN" ? "en" : "zh-CN").catch(() => {
              dispatch(setSnackBarText({ text: ct("language.failed"), severity: "error" }));
            });
          }}
        >
          {i18n.language === "zh-CN" ? "English" : "简体中文"}
        </Button>
        {window.mmgisglobal?.permission === "111" && (
          <div className={c.newMission}>
            <Button
              className={c.newMissionButton}
              variant="contained"
              disableElevation
              onClick={() => {
                dispatch(setModal({ name: "newMission" }));
              }}
            >{ct("ui.new_mission_41379e")}</Button>
          </div>
        )}
        <div className={c.missions}>
          <ul className={c.missionsUl}>
            {missions.map((mission, idx) => {
              const canEdit = canEditMission(mission);
              return (
                <li className={c.missionsLi} key={idx}>
                  <Button
                    className={clsx(
                      {
                        [c.missionActive]: mission === activeMission,
                        [c.missionNotActive]: mission !== activeMission,
                        [c.missionDisabled]: !canEdit,
                      },
                      c.missionButton
                    )}
                    disableElevation
                    onClick={() => {
                      if (canEdit) {
                        dispatch(setMission(mission));
                      } else {
                        dispatch(
                          setSnackBarText({
                            text: ct("ui.you_don_t_have_permission_to_e3c254", { p0: mission }),
                            severity: "warning",
                          })
                        );
                      }
                    }}
                    title={
                      canEdit ? mission : `No permission to edit "${mission}"`
                    }
                  >
                    {mission}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={c.pages}>
          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<ShapeLineIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "geodatasets" }));
            }}
          >{ct("ui.geodatasets_44f55d")}</Button>
          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<TextSnippetIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "datasets" }));
            }}
          >{ct("ui.datasets_93a7f2")}</Button>

          {window.mmgisglobal.WITH_STAC === "true" ? (
            <Button
              className={c.pageButton}
              variant="contained"
              disableElevation
              startIcon={<HorizontalSplitIcon size="small" />}
              onClick={() => {
                dispatch(setMission(null));
                dispatch(setPage({ page: "stac" }));
              }}
            >
              STAC
            </Button>
          ) : null}

          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<KeyIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "api_tokens" }));
            }}
          >{ct("ui.api_tokens_ee50ac")}</Button>

          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<ApiIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "apis" }));
            }}
          >{ct("ui.apis_4ca0a1")}</Button>

          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<PhishingIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "webhooks" }));
            }}
          >{ct("ui.webhooks_fdfe2d")}</Button>

          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<SettingsIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "general_options" }));
            }}
          >{ct("ui.general_options_ba5b22")}</Button>

          <Button
            className={c.pageButton}
            variant="contained"
            disableElevation
            startIcon={<AccountBoxIcon size="small" />}
            onClick={() => {
              dispatch(setMission(null));
              dispatch(setPage({ page: "users" }));
            }}
          >{ct("ui.users_57f2b1")}</Button>
        </div>
      </div>
      <NewMissionModal />
    </>
  );
}
