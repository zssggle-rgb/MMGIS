import { useConfigureText } from "../../../../../i18n";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  flexBetween: { display: "flex", justifyContent: "space-between" },
}));

export default function BulkDeleteModal({ classes, open, collectionId, selectedCount, confirmation, setConfirmation, onClose, onConfirm, disabled }) {
  const ct = useConfigureText();
  const local = useStyles();
  return (
    <Dialog className={classes.deleteDialog} open={open} onClose={onClose} aria-labelledby="bulk-delete-items-dialog-title">
      <DialogTitle className={classes.deleteDialogTitle}>
        <div className={classes.flexBetween}>
          <div className={classes.flexBetween}>
            <DeleteForeverIcon className={classes.backgroundIcon} />
            <div className={classes.title}>{ct("ui.delete_stac_items_7e6d9d")}</div>
          </div>
          <IconButton className={classes.closeIcon} title={ct("ui.close_bbfa77")} aria-label={ct("ui.close_da3886")} onClick={onClose} disabled={disabled}>
            <CloseSharpIcon fontSize="inherit" />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent className={classes.deleteDialogContent}>
        <Typography className={classes.collectionTitle}>{ct("ui.collection_8fdd82")}{collectionId}</Typography>
        <Typography className={classes.deleteConfirmMessage}>{ct("ui.you_are_about_to_permanently_delete_e0303f", { p0: selectedCount })}</Typography>
        <TextField
          className={classes.deleteConfirmInput}
          label={ct("ui.confirm_collection_id_2797db")}
          variant="filled"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={ct("ui.type_p0_to_confirm_afc006", { p0: collectionId || "" })}
          disabled={disabled}
        />
        <Typography className={classes.deleteConfirmMessage}>
          {ct("ui.enter_p0_above_and_click_delete_f33e4c", { p0: collectionId || "" })}
        </Typography>
      </DialogContent>
      <DialogActions className={classes.deleteDialogActions}>
        <Button className={classes.deleteButton} variant="contained" startIcon={<DeleteForeverIcon size="small" />} onClick={onConfirm} disabled={disabled}>
          {disabled ? ct("ui.deleting_c7ac55") : ct("ui.delete_f6fdbe")}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={disabled}>{ct("ui.cancel_77dfd2")}</Button>
      </DialogActions>
    </Dialog>
  );
}

