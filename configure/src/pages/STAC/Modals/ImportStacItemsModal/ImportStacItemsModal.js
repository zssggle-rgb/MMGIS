import { useConfigureText } from "../../../../i18n";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { calls } from "../../../../core/calls";

import { setModal, setSnackBarText } from "../../../../core/ConfigureStore";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import UploadIcon from "@mui/icons-material/Upload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { useDropzone } from "react-dropzone";

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
    maxWidth: "unset !important",
    maxHeight: "calc(100vh - 64px) !important",
    width: "600px",
    [theme.breakpoints.down("sm")]: {
      width: "calc(100vw - 64px)",
    },
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
    padding: "16px !important",
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
    marginBottom: "16px !important",
    color: theme.palette.swatches.grey[300],
    letterSpacing: "0.2px",
  },
  fileName: {
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "10px",
    borderBottom: `1px solid ${theme.palette.swatches.grey[500]}`,
    paddingBottom: "10px",
  },
  dropzone: {
    width: "100%",
    minHeight: "120px",
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
  backgroundIcon: {
    margin: "7px 8px 0px 0px",
  },
}));

const MODAL_NAME = "importStacItems";

const ImportStacItemsModal = (props) => {
  const ct = useConfigureText();
  const { querySTAC } = props;
  const c = useStyles();

  const modal = useSelector((state) => state.core.modal[MODAL_NAME]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();

  const [importFile, setImportFile] = useState(null);
  const [itemsData, setItemsData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    accept: { "application/json": [".json"] },
    onDropAccepted: (files) => {
      const file = files[0];
      setImportFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);

          // Parse multiple formats
          let itemsArray = [];
          if (Array.isArray(json)) {
            // Direct array format
            itemsArray = json;
          } else if (json.items && Array.isArray(json.items)) {
            // {items: [...]} format
            itemsArray = json.items;
          } else if (json.features && Array.isArray(json.features)) {
            // GeoJSON {features: [...]} format
            itemsArray = json.features;
          } else if (json.collection && json.items && Array.isArray(json.items)) {
            // {collection, items} export format
            itemsArray = json.items;
          } else {
            dispatch(
              setSnackBarText({
                text: ct("ui.invalid_format_expected_array_of_items_a73d1b"),
                severity: "error",
              })
            );
            setImportFile(null);
            return;
          }

          // Validate items have IDs
          const invalidItems = itemsArray.filter((item) => !item.id);
          if (invalidItems.length > 0) {
            dispatch(
              setSnackBarText({
                text: ct("ui.p0_items_are_missing_id_field_942924", { p0: invalidItems.length }),
                severity: "error",
              })
            );
            setImportFile(null);
            return;
          }

          setItemsData(itemsArray);
        } catch (error) {
          dispatch(
            setSnackBarText({
              text: ct("ui.invalid_json_file_ce32e7"),
              severity: "error",
            })
          );
          setImportFile(null);
        }
      };
      reader.readAsText(file);
    },
    onDropRejected: () => {
      dispatch(
        setSnackBarText({
          text: ct("ui.please_upload_a_valid_json_file_18de2b"),
          severity: "warning",
        })
      );
    },
  });

  const handleClose = () => {
    setImportFile(null);
    setItemsData(null);
    setIsUploading(false);
    dispatch(setModal({ name: MODAL_NAME, on: false }));
  };

  const handleUpload = () => {
    if (!itemsData || itemsData.length === 0) {
      dispatch(
        setSnackBarText({
          text: ct("ui.no_items_to_upload_5e053f"),
          severity: "warning",
        })
      );
      return;
    }

    if (!modal?.collection) {
      dispatch(
        setSnackBarText({
          text: ct("ui.no_collection_selected_629ba4"),
          severity: "error",
        })
      );
      return;
    }

    setIsUploading(true);

    // Transform items array to object format and remove collection field
    const itemsObject = {};
    itemsData.forEach((item) => {
      // Clone item and remove collection field to avoid ID mismatch errors
      const itemCopy = { ...item };
      delete itemCopy.collection;
      itemsObject[item.id] = itemCopy;
    });

    calls.api(
      "stac_bulk_items",
      {
        items: itemsObject,
        method: "upsert",
        urlReplacements: {
          collection: modal?.collection?.id,
        },
      },
      (res) => {
        querySTAC();
        dispatch(
          setSnackBarText({
            text: ct("ui.successfully_upserted_p0_items_6e765a", { p0: itemsData.length }),
            severity: "success",
          })
        );
        setIsUploading(false);
        handleClose();
      },
      (err) => {
        dispatch(
          setSnackBarText({
            text: err?.message || ct("ui.failed_to_upload_items_718173"),
            severity: "error",
          })
        );
        setIsUploading(false);
      }
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
            <UploadIcon className={c.backgroundIcon} />
            <div className={c.title}>{ct("ui.import_stac_items_0afa3b")}</div>
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
          {ct("ui.import_stac_items_into_collection_p0_fcab53", { p0: modal?.collection?.id || "Unknown" })}
        </Typography>

        <div className={c.dropzone}>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            {importFile ? (
              <div>
                <InsertDriveFileIcon style={{ fontSize: 48 }} />
                <div className={c.fileName}>{importFile.name}</div>
                {itemsData && (
                  <Typography variant="body2" style={{ marginTop: 8 }}>
                    {itemsData.length}{ct("ui.items_ready_to_import_ed8810")}</Typography>
                )}
              </div>
            ) : (
              <div className={c.dropzoneMessage}>
                <p>
                  {isDragActive
                    ? ct("ui.drop_the_file_here_d01e3c")
                    : ct("ui.drag_drop_stac_items_json_file_e54ce0")}
                </p>
                <p>{ct("ui.or_click_to_select_a_file_dad295")}</p>
              </div>
            )}
          </div>
        </div>

        <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>{ct("ui.items_will_be_upserted_existing_items_b36724")}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{ct("ui.cancel_77dfd2")}</Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!itemsData || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {isUploading ? ct("ui.uploading_070e32") : ct("ui.upload_items_1579e2")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportStacItemsModal;
