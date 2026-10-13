import { useConfigureText, configureText } from "../../../../i18n";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { calls } from "../../../../core/calls";

import {
  setMissions,
  setModal,
  setSnackBarText,
} from "../../../../core/ConfigureStore";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";

import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

import TextField from "@mui/material/TextField";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import { makeStyles, useTheme } from "@mui/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const useStyles = makeStyles((theme) => ({
  Modal: {
    margin: theme.headHeights[1],
    [theme.breakpoints.down("xs")]: {
      margin: "6px",
    },
    "& .MuiDialog-container": {
      height: "unset !important",
      transform: "translateX(-50%) translateY(-50%)",
      left: "50%",
      top: "50%",
      position: "absolute",
    },
  },
  contents: {
    background: theme.palette.primary.main,
    height: "100%",
    width: "700px",
    maxWidth: "700px !important",
    maxHeight: "90vh !important",
  },
  heading: {
    height: theme.headHeights[2],
    boxSizing: "border-box",
    background: theme.palette.swatches.p[0],
    borderBottom: `1px solid ${theme.palette.swatches.grey[800]}`,
    padding: `4px ${theme.spacing(2)} 4px ${theme.spacing(4)} !important`,
  },
  title: {
    padding: `8px 0px`,
    fontSize: theme.typography.pxToRem(16),
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  content: {
    padding: "8px 16px 16px 16px !important",
    height: `calc(100% - ${theme.headHeights[2]}px)`,
  },
  closeIcon: {
    padding: theme.spacing(1.5),
    height: "100%",
    margin: "4px 0px",
  },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: "14px !important",
    width: "100%",
    marginBottom: "8px !important",
    color: theme.palette.swatches.grey[300],
    letterSpacing: "0.2px",
  },
  subtitle2: {
    fontSize: "12px !important",
    fontStyle: "italic",
    width: "100%",
    marginBottom: "8px !important",
    color: theme.palette.swatches.grey[400],
  },
  missionNameInput: {
    width: "100%",
    margin: "8px 0px 4px 0px !important",
  },
  backgroundIcon: {
    margin: "7px 8px 0px 0px",
  },
  planetDropdown: {
    width: "100%",
    margin: "8px 0px 4px 0px !important",
  },
  divider: {
    margin: "24px 0px 16px 0px !important",
    borderTop: `1px solid ${theme.palette.swatches.grey[700]}`,
  },
  sectionTitle: {
    fontSize: "14px !important",
    fontWeight: "bold !important",
    marginTop: "8px !important",
    marginBottom: "8px !important",
    color: theme.palette.swatches.grey[200],
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  explanationBox: {
    backgroundColor: theme.palette.swatches.grey[900],
    border: `1px solid ${theme.palette.swatches.grey[700]}`,
    borderRadius: "4px",
    padding: "12px",
    marginBottom: "12px",
    "& ul": {
      margin: "8px 0px",
      paddingLeft: "20px",
    },
    "& li": {
      marginBottom: "6px",
      fontSize: "13px",
      color: theme.palette.swatches.grey[300],
    },
  },
  explanationTitle: {
    fontSize: "14px !important",
    fontWeight: "bold !important",
    marginBottom: "8px !important",
    color: `${theme.palette.swatches.r[3]} !important`,
  },
  explanationText: {
    fontSize: "13px !important",
    color: `${theme.palette.swatches.grey[100]} !important`,
    marginBottom: "12px !important",
  },
}));

const PLANET_RADII = {
  Earth: { major: 6371008, minor: 6371008 },
  Mars: { major: 3396190, minor: 3396190 },
  "The Moon": { major: 1737400, minor: 1737400 },
};

const REFERENCE_MISSION_VARIANTS = {
  default: {
    missionName: "Reference-Mission",
    get label() { return configureText("ui.earth_default_59f69b"); },
    get description() { return configureText("reference.earthDescription"); },
  },
  "Lunar-SouthPole": {
    missionName: "Reference-Mission-Lunar-SouthPole",
    get label() { return configureText("ui.lunar_south_pole_74be40"); },
    get description() { return configureText("reference.lunarDescription"); },
  },
  Mars: {
    missionName: "Reference-Mission-Mars",
    get label() { return configureText("ui.mars_177801"); },
    get description() { return configureText("reference.marsDescription"); },
  },
};

const MODAL_NAME = "newMission";
const NewMissionModal = (props) => {
  const ct = useConfigureText();
  const {} = props;
  const c = useStyles();

  const modal = useSelector((state) => state.core.modal[MODAL_NAME]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();

  const [missionName, setMissionName] = useState("");
  const [createDir, setCreateDir] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState("Earth");
  const [setupReferenceMission, setSetupReferenceMission] = useState(false);
  const [referenceMissionVariant, setReferenceMissionVariant] = useState("default");
  const [autoGeneratedName, setAutoGeneratedName] = useState("");

  // Auto-generate mission name when Reference Mission mode is enabled
  useEffect(() => {
    if (setupReferenceMission) {
      const variant = REFERENCE_MISSION_VARIANTS[referenceMissionVariant];
      const name = variant ? variant.missionName : "Reference-Mission";
      setAutoGeneratedName(name);
      setMissionName(name);
    } else {
      setAutoGeneratedName("");
    }
  }, [setupReferenceMission, referenceMissionVariant]);

  const handleClose = () => {
    // close modal
    dispatch(setModal({ name: MODAL_NAME, on: false }));
  };
  const handleSubmit = () => {
    if (missionName == null || missionName === "") {
      dispatch(
        setSnackBarText({
          text: ct("ui.please_enter_a_mission_name_1055b7"),
          severity: "error",
        }),
      );
      return;
    }

    const planetRadius = PLANET_RADII[selectedPlanet];

    // Build the config with just the radius values
    const config = {
      msv: {
        radius: {
          major: planetRadius.major,
          minor: planetRadius.minor,
        },
      },
    };

    // Prepare payload
    const payload = {
      mission: missionName,
      makedir: createDir || setupReferenceMission,
      setupReferenceMission: setupReferenceMission,
    };

    // Include variant key when in Reference Mission mode
    if (setupReferenceMission) {
      payload.referenceMissionVariant = referenceMissionVariant;
    }

    // Only send config if not in Reference Mission mode
    if (!setupReferenceMission) {
      payload.config = config;
    }

    calls.api(
      "add",
      payload,
      (res) => {
        calls.api(
          "missions",
          null,
          (res) => {
            dispatch(setMissions(res.missions));

            dispatch(
              setSnackBarText({
                text:
                  res.message ||
                  ct("ui.successfully_added_new_mission_p0_d13cd3", { p0: missionName }),
                severity: "success",
              }),
            );
            // reset fields
            setMissionName("");
            setCreateDir(true);
            setSelectedPlanet("Earth");
            setSetupReferenceMission(false);
            setReferenceMissionVariant("default");

            // and then close
            handleClose();
          },
          (res) => {
            dispatch(
              setSnackBarText({
                text: res?.message || ct("ui.failed_to_requery_missions_93c3d9"),
                severity: "error",
              }),
            );

            // reset fields
            setMissionName("");
            setCreateDir(true);
            setSelectedPlanet("Earth");
            setSetupReferenceMission(false);
            setReferenceMissionVariant("default");

            // and then close
            handleClose();
          },
        );
      },
      (res) => {
        dispatch(
          setSnackBarText({
            text: res?.message || ct("ui.failed_to_make_new_mission_b59697"),
            severity: "error",
          }),
        );
      },
    );
  };

  return (
    <Dialog
      className={c.Modal}
      fullScreen={isMobile}
      open={modal !== false}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
      PaperProps={{
        className: c.contents,
      }}
    >
      <DialogTitle className={c.heading}>
        <div className={c.flexBetween}>
          <div className={c.flexBetween}>
            <RocketLaunchIcon className={c.backgroundIcon} />
            <div className={c.title}>{ct("ui.make_a_new_mission_85eb82")}</div>
          </div>
          <IconButton
            className={c.closeIcon}
            title={ct("ui.close_bbfa77")}
            aria-label={ct("ui.close_da3886")}
            onClick={handleClose}
          >
            <CloseSharpIcon fontSize="inherit" />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent className={c.content}>
        <Typography className={c.subtitle}>{ct("ui.missions_are_separately_configurable_mmgis_map_220499")}</Typography>
        <TextField
          className={c.missionNameInput}
          label={ct("ui.mission_name_50c471")}
          variant="filled"
          value={missionName}
          onChange={(e) => {
            setMissionName(e.target.value);
          }}
          disabled={setupReferenceMission}
          placeholder={setupReferenceMission ? autoGeneratedName : ""}
        />
        <Typography className={c.subtitle2}>
          {ct("ui.a_new_and_unique_name_for_e86629")}
        </Typography>
        <FormControl className={c.planetDropdown} variant="filled">
          <InputLabel>{ct("ui.planet_e7abd9")}</InputLabel>
          <Select
            value={selectedPlanet}
            onChange={(e) => setSelectedPlanet(e.target.value)}
            label={ct("ui.planet_e7abd9")}
            disabled={setupReferenceMission}
          >
            <MenuItem value="Earth">{ct("ui.earth_a07443")}</MenuItem>
            <MenuItem value="Mars">{ct("ui.mars_177801")}</MenuItem>
            <MenuItem value="The Moon">{ct("ui.the_moon_c86168")}</MenuItem>
          </Select>
        </FormControl>
        <Typography className={c.subtitle2}>
          {ct("ui.select_the_planet_to_set_the_fa801a")}
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={createDir || setupReferenceMission}
                onChange={(e) => {
                  setCreateDir(!createDir);
                }}
                disabled={setupReferenceMission}
              />
            }
            label={ct("ui.create_a_missions_mission_name_directory_809622")}
          />
        </FormGroup>
        <Typography className={c.subtitle2}>
          {ct("ui.layer_tiles_and_data_for_this_4a0f14")}
        </Typography>

        <div className={c.divider}></div>

        <Typography className={c.sectionTitle}>{ct("ui.reference_mission_demo_125b9b")}</Typography>

        <div className={c.explanationBox}>
          <Typography className={c.explanationTitle}>{ct("ui.what_is_the_reference_mission_3ad41d")}</Typography>
          <Typography className={c.explanationText}>{ct("ui.the_reference_mission_is_a_comprehensive_7c0032")}</Typography>
          <ul>
            <li>
              <strong>{ct("ui.purpose_75ef63")}</strong>{ct("ui.reference_demonstration_development_and_testing_e37344")}</li>
            <li>
              <strong>{ct("ui.includes_63f287")}</strong>{ct("ui.20_sample_layers_14_interactive_tools_130af7")}</li>
            <li>
              <strong>{ct("ui.deployed_to_518a50")}oyed_to_518a50")}</strong>{" "}
              <code>{ct("ui.missions_reference_mission_11e6b6")}</code>{ct("ui.always_overwritten_df03db")}</li>
            <li>
              <strong>{ct("ui.source_922acd")}</strong>{ct("ui.blueprint_template_at_6be054")}{" "}
              <code>{ct("ui.blueprints_missions_reference_mission_13c19e")}</code>
            </li>
            <li>
              <strong>{ct("ui.updates_d22b44")}</strong>{ct("ui.checking_this_will_5f39ca")}{" "}
              <strong>{ct("ui.completely_replace_9572bf")}</strong>{ct("ui.any_existing_reference_mission_with_its_d99cec")}</li>
            <li>
              <strong>{ct("ui.stac_cogs_5c50ba")}</strong>{ct("ui.some_layers_require_1bb22c")}{" "}
              <code>{ct("ui.with_stac_true_a0ecd5")}</code>{ct("ui.and_a_running_stac_fastapi_service_6d426a")}</li>
          </ul>
        </div>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={setupReferenceMission}
                onChange={(e) => {
                  setSetupReferenceMission(!setupReferenceMission);
                }}
              />
            }
            label={ct("ui.setup_reference_mission_demo_55b295")}
          />
        </FormGroup>
        {setupReferenceMission && (
          <FormControl className={c.planetDropdown} variant="filled">
            <InputLabel>{ct("ui.reference_mission_variant_61f215")}</InputLabel>
            <Select
              value={referenceMissionVariant}
              onChange={(e) => setReferenceMissionVariant(e.target.value)}
              label={ct("ui.reference_mission_variant_61f215")}
            >
              {Object.entries(REFERENCE_MISSION_VARIANTS).map(([key, v]) => (
                <MenuItem key={key} value={key}>
                  {v.label} — {v.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Typography className={c.subtitle2}>
          {setupReferenceMission
            ? ct("reference.replaceWarning", { name: autoGeneratedName })
            : ct("ui.check_this_to_create_or_overwrite_989049")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          className={c.addSelected}
          variant="contained"
          onClick={handleSubmit}
        >{ct("ui.make_mission_402d01")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewMissionModal;
