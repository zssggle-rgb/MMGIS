import { useConfigureText } from "../../../../i18n";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { calls } from "../../../../core/calls";

import { setModal, setSnackBarText } from "../../../../core/ConfigureStore";

import { LineNavigator } from "../../../../external/line-navigator.js";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";

import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import ControlPointDuplicateIcon from "@mui/icons-material/ControlPointDuplicate";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useDropzone } from "react-dropzone";

import TextField from "@mui/material/TextField";

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
    width: "1200px",
    maxWidth: "1200px !important",
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

  fileName: {
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "10px",
    paddingBottom: "10px",
    borderBottom: `1px solid ${theme.palette.swatches.grey[500]}`,
  },
  dropzone: {
    width: "100%",
    minHeight: "100px",
    margin: "16px 0px",
    "& > div": {
      flex: "1 1 0%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      borderWidth: "2px",
      borderRadius: "2px",
      borderColor: theme.palette.swatches.grey[300],
      borderStyle: "dashed",
      backgroundColor: theme.palette.swatches.grey[900],
      color: theme.palette.swatches.grey[200],
      outline: "none",
      transition: "border 0.24s ease-in-out 0s",
      "&:hover": {
        borderColor: theme.palette.swatches.p[11],
      },
    },
  },
  dropzoneMessage: {
    textAlign: "center",
    color: theme.palette.swatches.p[11],
    "& > p:first-child": { fontWeight: "bold", letterSpacing: "1px" },
    "& > p:last-child": { fontSize: "14px", fontStyle: "italic" },
  },
  fields: {
    display: "flex",
    "& > div:first-child": {
      marginRight: "5px",
    },
    "& > div:last-child": {
      marginLeft: "5px",
    },
  },
  fileprogress: {
    width: "100%",
    height: "4px",
  },
  progressbar: {
    flex: 1,
  },
  progressPercent: {},
  largeFileNotice: {
    display: "flex",
    justifyContent: "space-between",
    border: `1px solid ${theme.palette.swatches.p[11]}`,
    background: "#effbf8",
    color: theme.palette.swatches.grey[300],
    borderRadius: "3px",
    padding: "10px",
    fontSize: "14px",
    "& > div:first-child": {
      padding: "0px 16px 0px 8px",
      margin: "auto",
    },
    "& > div:last-child": {},
  },
  largeFileIcon: {
    color: theme.palette.swatches.p[11],
    fontSize: "32px !important",
  },
}));

const MODAL_NAME = "appendGeoDataset";
const AppendGeoDatasetModal = (props) => {
  const ct = useConfigureText();
  const { queryGeoDatasets } = props;
  const c = useStyles();

  const modal = useSelector((state) => state.core.modal[MODAL_NAME]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();

  const [geojson, setGeojson] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [startTimeField, setStartTimeField] = useState(null);
  const [endTimeField, setEndTimeField] = useState(null);
  const [groupIdField, setGroupIdField] = useState(null);
  const [featureIdField, setFeatureIdField] = useState(null);
  const [fileProgress, setFileProgress] = useState(false);
  const [progress, setProgress] = useState(false);
  const [progressPercent, setProgressPercent] = useState(false);

  useEffect(() => {
    setStartTimeField(modal?.geoDataset?.start_time_field);
    setEndTimeField(modal?.geoDataset?.end_time_field);
    setGroupIdField(modal?.geoDataset?.group_id_field);
    setFeatureIdField(modal?.geoDataset?.feature_id_field);
  }, [JSON.stringify(modal)]);

  const handleClose = () => {
    // close modal
    dispatch(setModal({ name: MODAL_NAME, on: false }));
  };
  const handleSubmit = () => {
    const geoDatasetName = modal?.geoDataset?.name;

    if (geojson == null || fileName === null) {
      dispatch(
        setSnackBarText({
          text: ct("ui.please_upload_a_file_4b2e92"),
          severity: "error",
        })
      );
      return;
    }

    if (geoDatasetName === null) {
      dispatch(
        setSnackBarText({
          text: ct("ui.no_geodataset_found_to_append_to_6acdfd"),
          severity: "error",
        })
      );
      return;
    }
    const forceParams = {
      filename: fileName,
    };
    if (startTimeField) forceParams.start_prop = startTimeField;
    if (endTimeField) forceParams.end_prop = endTimeField;

    setProgress(true);
    if (geojson instanceof File) {
      const navigator = new LineNavigator(geojson);

      let firstPass = true;
      // === Reading exact amount of lines ===
      let indexToStartWith = 0;
      const numberOfLines = 5000;
      navigator.readLines(
        indexToStartWith,
        numberOfLines,
        function linesReadHandler(err, index, lines, isEof, progress) {
          // Error happened
          if (err) throw err;

          const features = [];
          // Reading lines
          for (let i = 0; i < lines.length; i++) {
            try {
              features.push(JSON.parse(lines[i]));
            } catch (err) {}
          }

          // progress is a position of the last read line as % from whole file length
          setProgressPercent(progress);

          calls.api(
            "geodatasets_recreate",
            {
              name: geoDatasetName,
              startProp: startTimeField,
              endProp: endTimeField,
              geojson: {
                type: "FeatureCollection",
                features: features,
              },
              filename: fileName,
              action: "append",
            },
            (res) => {
              firstPass = false;
              if (isEof) {
                setProgress(false);
                setProgressPercent(false);
                if (res.status === "success") {
                  dispatch(
                    setSnackBarText({
                      text: ct("ui.successfully_appended_to_geodataset_d65794"),
                      severity: "success",
                    })
                  );
                  queryGeoDatasets();
                  handleClose();
                } else {
                  dispatch(
                    setSnackBarText({
                      text: res?.message || ct("ui.failed_to_append_to_geodataset_32e21e"),
                      severity: "error",
                    })
                  );
                }
              } else {
                // Reading next chunk, adding number of lines read to first line in current chunk
                navigator.readLines(
                  index + lines.length,
                  numberOfLines,
                  linesReadHandler
                );
              }
            },
            (res) => {
              setProgress(false);
              setProgressPercent(false);
              dispatch(
                setSnackBarText({
                  text: res?.message || ct("ui.failed_to_append_to_geodataset_32e21e"),
                  severity: "error",
                })
              );
            }
          );
        }
      );
    } else {
      calls.api(
        "geodatasets_append",
        {
          urlReplacements: {
            name: geoDatasetName,
          },
          forceParams,
          type: geojson.type,
          features: geojson.features,
        },
        (res) => {
          setProgress(false);
          if (res.status === "success") {
            dispatch(
              setSnackBarText({
                text: ct("ui.successfully_appended_to_geodataset_d65794"),
                severity: "success",
              })
            );
            queryGeoDatasets();
            handleClose();
          } else {
            dispatch(
              setSnackBarText({
                text: res?.message || ct("ui.failed_to_append_to_geodataset_32e21e"),
                severity: "error",
              })
            );
          }
        },
        (res) => {
          setProgress(false);
          dispatch(
            setSnackBarText({
              text: res?.message || ct("ui.failed_to_append_to_geodataset_32e21e"),
              severity: "error",
            })
          );
        }
      );
    }
  };

  // Dropzone initialization
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    maxFiles: 1,
    accept: {
      "application/json": [".json", ".geojson", ".ndjson", ".ndgeojson"],
    },
    onDropAccepted: (files) => {
      const file = files[0];
      setFileName(file.name);
      const nameSplit = file.name.split(".");
      setFileProgress(true);

      if (
        nameSplit[nameSplit.length - 1].toLowerCase() === "ndjson" ||
        nameSplit[nameSplit.length - 1].toLowerCase() === "ndgeojson"
      ) {
        setGeojson(file);
        setFileProgress(false);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setGeojson(JSON.parse(e.target.result));
          setFileProgress(false);
        };
        reader.readAsText(file);
      }
    },
    onDropRejected: () => {
      setFileProgress(false);
      setFileName(null);
      setGeojson(null);
    },
  });

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
            <ControlPointDuplicateIcon className={c.backgroundIcon} />
            <div
              className={c.title}
            >{ct("ui.append_features_to_this_geodataset_p0_34e865", { p0: modal?.geoDataset?.name })}</div>
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
        <Typography className={c.subtitle}>
          {ct("ui.appends_the_features_of_the_uploaded_8b06e1")}
        </Typography>
        <div className={c.dropzone}>
          <div {...getRootProps({ className: "dropzone" })}>
            <input {...getInputProps()} />
            {isDragAccept && <p>{ct("ui.all_files_will_be_accepted_c4d789")}</p>}
            {isDragReject && <p>{ct("ui.some_files_will_be_rejected_658078")}</p>}
            {!isDragActive && (
              <div className={c.dropzoneMessage}>
                <p>{ct("ui.drag_n_drop_or_click_to_21279e")}</p>
                <p>{ct("ui.only_json_and_geojson_ndjson_and_08cdf6")}</p>
              </div>
            )}
          </div>
        </div>
        <div className={c.fileprogress}>
          {fileProgress == true && (
            <LinearProgress className={c.progressbar} variant="indeterminate" />
          )}
        </div>

        <div className={c.fileName}>
          <InsertDriveFileIcon />
          <div>{fileName || ct("ui.no_file_selected_7dbe85")}</div>
        </div>

        <div className={c.fields}>
          <div>
            <TextField
              className={c.missionNameInput}
              label={ct("ui.start_time_field_7b78d3")}
              variant="filled"
              value={startTimeField}
              disabled
              onChange={(e) => {
                setStartTimeField(e.target.value);
              }}
            />
            <Typography className={c.subtitle2}>
              {ct("ui.the_name_of_a_start_time_d07f68")}
            </Typography>
          </div>
          <div>
            <TextField
              className={c.missionNameInput}
              label={ct("ui.end_time_field_221c90")}
              variant="filled"
              value={endTimeField}
              disabled
              onChange={(e) => {
                setEndTimeField(e.target.value);
              }}
            />
            <Typography className={c.subtitle2}>
              {ct("ui.the_name_of_an_end_time_bce6a5")}
            </Typography>
          </div>
        </div>
        <div className={c.fields}>
          <div>
            <TextField
              className={c.missionNameInput}
              label={ct("ui.group_id_field_1a3c1e")}
              variant="filled"
              value={groupIdField}
              disabled
              onChange={(e) => {
                setGroupIdField(e.target.value);
              }}
            />
            <Typography className={c.subtitle2}>
              {ct("ui.the_name_of_a_field_inside_bda3fc")}
            </Typography>
          </div>
          <div>
            <TextField
              className={c.missionNameInput}
              label={ct("ui.feature_id_field_32d428")}
              variant="filled"
              value={featureIdField}
              disabled
              onChange={(e) => {
                setFeatureIdField(e.target.value);
              }}
            />
            <Typography className={c.subtitle2}>
              {ct("ui.the_name_of_a_field_inside_5b2e47")}
            </Typography>
          </div>
        </div>

        <div className={c.largeFileNotice}>
          <div>
            <InfoOutlinedIcon className={c.largeFileIcon} />
          </div>
          <div>{ct("ui.note_appending_geojson_files_greater_than_13a029")}</div>
        </div>
      </DialogContent>
      <DialogActions>
        {progress == true && (
          <LinearProgress className={c.progressbar} variant="indeterminate" />
        )}
        {progress == true && progressPercent != false && (
          <div className={c.progressPercent}>{progressPercent + "%"}</div>
        )}
        <Button
          className={c.addSelected}
          variant="contained"
          onClick={handleSubmit}
          disabled={fileProgress === true || progress === true}
        >{ct("ui.append_to_geodataset_eb3cce")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppendGeoDatasetModal;
